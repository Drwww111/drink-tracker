import { getStore } from "@netlify/blobs";
import { LOCATIONS } from "./shared-data.mjs";
import { getDrinksMenu, saveDrinksMenu } from "./menu-store.mjs";
import { getStaffList } from "./staff-store.mjs";

const locationsStore = () => getStore({ name: "drink-tracker-locations", consistency: "strong" });
const stockStore = () => getStore({ name: "drink-tracker-stock", consistency: "strong" });
const roomStockStore = () => getStore({ name: "drink-tracker-room-stock", consistency: "strong" });
const stockHistoryStore = () => getStore({ name: "drink-tracker-stock-history", consistency: "strong" });

const MAX_IMAGE_LENGTH = 700000; // ~500KB หลัง base64 กันรูปใหญ่เกินไป

function unwrapRoom(raw) {
  if (!raw) return { items: {}, used: {}, history: [] };
  if (typeof raw === "object" && ("items" in raw || "history" in raw || "used" in raw)) {
    return { items: raw.items || {}, used: raw.used || {}, history: raw.history || [] };
  }
  return { items: raw, used: {}, history: [] };
}

function slugify(name) {
  const base = String(name || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9฀-๿]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return (base || "drink") + "_" + Date.now();
}

export default async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    let body;
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "รูปแบบข้อมูลไม่ถูกต้อง" }), { status: 400 });
    }

    const { action } = body || {};
    let drinks = await getDrinksMenu();

    if (body.image && String(body.image).length > MAX_IMAGE_LENGTH) {
      return new Response(JSON.stringify({ error: "รูปภาพใหญ่เกินไป กรุณาใช้รูปที่เล็กลง" }), { status: 400 });
    }

    if (action === "add") {
      const { name, price, unit, category, icon, trackStock, allowFree, image } = body;
      if (!name || !String(name).trim()) {
        return new Response(JSON.stringify({ error: "กรุณาใส่ชื่อเครื่องดื่ม" }), { status: 400 });
      }
      const newDrink = {
        id: slugify(name),
        name: String(name).trim(),
        price: Number(price) || 0,
        unit: unit ? String(unit).trim() : "ขวด",
        category: category ? String(category).trim() : "อื่นๆ",
        icon: icon || "softDrink",
        trackStock: !!trackStock,
        allowFree: !!allowFree,
        image: image || null,
        active: true,
      };
      drinks = [...drinks, newDrink];
      await saveDrinksMenu(drinks);
    } else if (action === "edit") {
      const { id, name, price, unit, icon, image, removeImage } = body;
      const idx = drinks.findIndex((d) => d.id === id);
      if (idx === -1) {
        return new Response(JSON.stringify({ error: "ไม่พบเครื่องดื่มนี้" }), { status: 400 });
      }
      const d = { ...drinks[idx] };
      if (name !== undefined && String(name).trim()) d.name = String(name).trim();
      if (price !== undefined) d.price = Number(price) || 0;
      if (unit !== undefined && String(unit).trim()) d.unit = String(unit).trim();
      if (icon !== undefined && icon) d.icon = icon;
      if (removeImage) d.image = null;
      else if (image) d.image = image;
      drinks[idx] = d;
      await saveDrinksMenu(drinks);
    } else if (action === "hide" || action === "restore") {
      const { id } = body;
      const idx = drinks.findIndex((d) => d.id === id);
      if (idx === -1) {
        return new Response(JSON.stringify({ error: "ไม่พบเครื่องดื่มนี้" }), { status: 400 });
      }
      drinks[idx] = { ...drinks[idx], active: action === "restore" };
      await saveDrinksMenu(drinks);
    } else {
      return new Response(JSON.stringify({ error: "ไม่รู้จักคำสั่งนี้" }), { status: 400 });
    }

    const lStore = locationsStore();
    const locEntries = await Promise.all(
      LOCATIONS.map(async (loc) => [loc.id, (await lStore.get(loc.id, { type: "json" })) || { openBill: null, history: [] }])
    );
    const locations = Object.fromEntries(locEntries);

    const sStore = stockStore();
    const stockEntries = await Promise.all(
      drinks.filter((d) => d.trackStock).map(async (d) => {
        const v = await sStore.get(d.id, { type: "json" });
        return [d.id, typeof v === "number" ? v : 0];
      })
    );
    const stock = Object.fromEntries(stockEntries);

    const rStore = roomStockStore();
    const roomRecords = await Promise.all(
      LOCATIONS.map(async (loc) => [loc.id, unwrapRoom(await rStore.get(loc.id, { type: "json" }))])
    );
    const roomStock = Object.fromEntries(roomRecords.map(([id, r]) => [id, r.items]));
    const roomStockHistory = Object.fromEntries(roomRecords.map(([id, r]) => [id, r.history]));
    const roomStockUsed = Object.fromEntries(roomRecords.map(([id, r]) => [id, r.used]));

    const stockHistory = (await stockHistoryStore().get("log", { type: "json" })) || [];
    const staffList = await getStaffList();

    return new Response(
      JSON.stringify({ locations, stock, roomStock, stockHistory, roomStockHistory, roomStockUsed, drinksMenu: drinks, staffList }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err && err.message ? err.message : err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const config = { path: "/api/menu" };
