import { getStore } from "@netlify/blobs";
import { LOCATIONS } from "./shared-data.mjs";
import { getDrinksMenu } from "./menu-store.mjs";
import { getStaffList } from "./staff-store.mjs";

const roomStockStore = () => getStore({ name: "drink-tracker-room-stock", consistency: "strong" });
const stockStore = () => getStore({ name: "drink-tracker-stock", consistency: "strong" });

function unwrapRoom(raw) {
  if (!raw) return { items: {}, history: [] };
  if (typeof raw === "object" && ("items" in raw || "history" in raw)) {
    return { items: raw.items || {}, history: raw.history || [] };
  }
  return { items: raw, history: [] };
}

async function buildFullState(DRINKS) {
  const rStore = roomStockStore();
  const roomRecords = await Promise.all(
    LOCATIONS.map(async (loc) => [loc.id, unwrapRoom(await rStore.get(loc.id, { type: "json" }))])
  );
  const roomStock = Object.fromEntries(roomRecords.map(([id, r]) => [id, r.items]));
  const roomStockHistory = Object.fromEntries(roomRecords.map(([id, r]) => [id, r.history]));

  const sStore = stockStore();
  const stockEntries = await Promise.all(
    DRINKS.filter((d) => d.trackStock).map(async (d) => {
      const v = await sStore.get(d.id, { type: "json" });
      return [d.id, typeof v === "number" ? v : 0];
    })
  );
  const stock = Object.fromEntries(stockEntries);

  const staffList = await getStaffList();

  return { roomStock, roomStockHistory, stock, drinksMenu: DRINKS, staffList };
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

    const { locationId, employee, items } = body || {};
    if (!locationId || !LOCATIONS.some((l) => l.id === locationId)) {
      return new Response(JSON.stringify({ error: "ไม่พบห้อง/โต๊ะนี้" }), { status: 400 });
    }
    if (!employee || !String(employee).trim()) {
      return new Response(JSON.stringify({ error: "กรุณาเลือกพนักงานผู้บันทึก" }), { status: 400 });
    }
    if (!items || typeof items !== "object") {
      return new Response(JSON.stringify({ error: "ไม่มีรายการสต็อก" }), { status: 400 });
    }

    const DRINKS = await getDrinksMenu();
    const rStore = roomStockStore();
    const existing = unwrapRoom(await rStore.get(locationId, { type: "json" }));

    const cleaned = {};
    Object.entries(items).forEach(([drinkId, qty]) => {
      const n = Math.max(0, Math.round(Number(qty) || 0));
      if (n > 0) cleaned[drinkId] = n;
    });

    const changes = [];
    const drinkNameMap = Object.fromEntries(DRINKS.map((d) => [d.id, d.name]));
    const allIds = new Set([...Object.keys(existing.items || {}), ...Object.keys(cleaned)]);
    allIds.forEach((drinkId) => {
      const before = (existing.items || {})[drinkId] || 0;
      const after = cleaned[drinkId] || 0;
      if (before !== after) {
        changes.push({ drinkId, name: drinkNameMap[drinkId] || drinkId, before, after });
      }
    });

    const history = existing.history || [];
    if (changes.length > 0) {
      history.unshift({
        employee: String(employee).trim(),
        at: new Date().toISOString(),
        changes,
      });
      if (history.length > 100) history.length = 100;
    }

    const newRecord = { items: cleaned, history };
    await rStore.setJSON(locationId, newRecord);

    const fullState = await buildFullState(DRINKS);
    return new Response(JSON.stringify(fullState), { headers: { "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err && err.message ? err.message : err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const config = { path: "/api/room-stock" };
