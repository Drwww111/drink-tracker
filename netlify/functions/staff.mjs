import { getStore } from "@netlify/blobs";
import { LOCATIONS } from "./shared-data.mjs";
import { getDrinksMenu } from "./menu-store.mjs";
import { getStaffList, saveStaffList } from "./staff-store.mjs";

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
    let staff = await getStaffList();

    if (action === "add") {
      const { name } = body;
      if (!name || !String(name).trim()) {
        return new Response(JSON.stringify({ error: "กรุณาใส่ชื่อพนักงาน" }), { status: 400 });
      }
      const trimmed = String(name).trim();
      if (staff.some((s) => s.name === trimmed && s.active !== false)) {
        return new Response(JSON.stringify({ error: "มีชื่อนี้อยู่แล้ว" }), { status: 400 });
      }
      const newStaff = { id: `staff_${staff.length}_${Date.now()}`, name: trimmed, active: true };
      staff = [...staff, newStaff];
      await saveStaffList(staff);
    } else if (action === "edit") {
      const { id, name } = body;
      const idx = staff.findIndex((s) => s.id === id);
      if (idx === -1) {
        return new Response(JSON.stringify({ error: "ไม่พบพนักงานนี้" }), { status: 400 });
      }
      if (!name || !String(name).trim()) {
        return new Response(JSON.stringify({ error: "กรุณาใส่ชื่อพนักงาน" }), { status: 400 });
      }
      staff[idx] = { ...staff[idx], name: String(name).trim() };
      await saveStaffList(staff);
    } else if (action === "hide" || action === "restore") {
      const { id } = body;
      const idx = staff.findIndex((s) => s.id === id);
      if (idx === -1) {
        return new Response(JSON.stringify({ error: "ไม่พบพนักงานนี้" }), { status: 400 });
      }
      staff[idx] = { ...staff[idx], active: action === "restore" };
      await saveStaffList(staff);
    } else {
      return new Response(JSON.stringify({ error: "ไม่รู้จักคำสั่งนี้" }), { status: 400 });
    }

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

    return new Response(
      JSON.stringify({ locations, stock, roomStock, stockHistory, roomStockHistory, drinksMenu: DRINKS, staffList: staff }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err && err.message ? err.message : err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const config = { path: "/api/staff" };
