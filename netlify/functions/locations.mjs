import { getStore } from "@netlify/blobs";
import { getLocationsList, saveLocationsList } from "./locations-store.mjs";
import { getDrinksMenu } from "./menu-store.mjs";
import { getStaffList } from "./staff-store.mjs";
import { getRates } from "./rates-store.mjs";
import { getSettings } from "./settings-store.mjs";

const locationsStore = () => getStore({ name: "drink-tracker-locations", consistency: "strong" });
const stockStore = () => getStore({ name: "drink-tracker-stock", consistency: "strong" });
const roomStockStore = () => getStore({ name: "drink-tracker-room-stock", consistency: "strong" });
const stockHistoryStore = () => getStore({ name: "drink-tracker-stock-history", consistency: "strong" });

function unwrapRoom(raw) {
  if (!raw) return { items: {}, history: [] };
  if (typeof raw === "object" && ("items" in raw || "history" in raw)) {
    return { items: raw.items || {}, history: raw.history || [] };
  }
  return { items: raw, history: [] };
}

function slugify(label) {
  const base = String(label || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9฀-๿]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return "loc_" + (base || "room") + "_" + Date.now();
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
    let locs = await getLocationsList();

    if (action === "add") {
      const { group, label } = body;
      if (!label || !String(label).trim()) {
        return new Response(JSON.stringify({ error: "กรุณาใส่ชื่อห้อง/โต๊ะ" }), { status: 400 });
      }
      const newLoc = {
        id: slugify(label),
        group: group && String(group).trim() ? String(group).trim() : String(label).trim(),
        label: String(label).trim(),
      };
      locs = [...locs, newLoc];
      await saveLocationsList(locs);
    } else if (action === "edit") {
      const { id, group, label } = body;
      const idx = locs.findIndex((l) => l.id === id);
      if (idx === -1) {
        return new Response(JSON.stringify({ error: "ไม่พบห้อง/โต๊ะนี้" }), { status: 400 });
      }
      const updated = { ...locs[idx] };
      if (label !== undefined && String(label).trim()) updated.label = String(label).trim();
      if (group !== undefined && String(group).trim()) updated.group = String(group).trim();
      locs[idx] = updated;
      await saveLocationsList(locs);
    } else if (action === "delete") {
      const { id } = body;
      const idx = locs.findIndex((l) => l.id === id);
      if (idx === -1) {
        return new Response(JSON.stringify({ error: "ไม่พบห้อง/โต๊ะนี้" }), { status: 400 });
      }
      if (locs.length <= 1) {
        return new Response(JSON.stringify({ error: "ต้องมีห้อง/โต๊ะเหลืออย่างน้อย 1 รายการ" }), { status: 400 });
      }
      // ลบออกจากรายการห้อง/โต๊ะ (ประวัติบิล/สต็อกเก่าของห้องนี้จะยังอยู่ใน Blobs แต่จะไม่แสดงในแอปอีก)
      locs = locs.filter((l) => l.id !== id);
      await saveLocationsList(locs);
    } else if (action === "reorder") {
      const { id, direction } = body;
      const idx = locs.findIndex((l) => l.id === id);
      if (idx === -1) {
        return new Response(JSON.stringify({ error: "ไม่พบห้อง/โต๊ะนี้" }), { status: 400 });
      }
      const swapWith = direction === "up" ? idx - 1 : idx + 1;
      if (swapWith >= 0 && swapWith < locs.length) {
        const copy = [...locs];
        [copy[idx], copy[swapWith]] = [copy[swapWith], copy[idx]];
        locs = copy;
        await saveLocationsList(locs);
      }
    } else {
      return new Response(JSON.stringify({ error: "ไม่รู้จักคำสั่งนี้" }), { status: 400 });
    }

    const LOCATIONS = locs;
    const rates = await getRates();
    const settings = await getSettings();
    const DRINKS = await getDrinksMenu();

    const lStore = locationsStore();
    const locEntries = await Promise.all(
      LOCATIONS.map(async (loc) => [loc.id, (await lStore.get(loc.id, { type: "json" })) || { openBill: null, history: [] }])
    );
    const locations = Object.fromEntries(locEntries);

    const sStore = stockStore();
    const stockEntries = await Promise.all(
      DRINKS.filter((d) => d.trackStock).map(async (d) => {
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

    const stockHistory = (await stockHistoryStore().get("log", { type: "json" })) || [];
    const staffList = await getStaffList();

    return new Response(
      JSON.stringify({
        locations,
        stock,
        roomStock,
        stockHistory,
        roomStockHistory,
        drinksMenu: DRINKS,
        staffList,
        locationsList: LOCATIONS,
        rates,
        settings,
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err && err.message ? err.message : err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const config = { path: "/api/locations" };
