import { getStore } from "@netlify/blobs";
import { LOCATIONS } from "./shared-data.mjs";
import { getDrinksMenu } from "./menu-store.mjs";
import { getStaffList } from "./staff-store.mjs";

const locationsStore = () => getStore({ name: "drink-tracker-locations", consistency: "strong" });
const stockStore = () => getStore({ name: "drink-tracker-stock", consistency: "strong" });
const roomStockStore = () => getStore({ name: "drink-tracker-room-stock", consistency: "strong" });
const stockHistoryStore = () => getStore({ name: "drink-tracker-stock-history", consistency: "strong" });

function unwrapRoom(raw) {
  if (!raw) return { items: {}, used: {}, history: [] };
  if (typeof raw === "object" && ("items" in raw || "history" in raw || "used" in raw)) {
    return { items: raw.items || {}, used: raw.used || {}, history: raw.history || [] };
  }
  return { items: raw, used: {}, history: [] };
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

    const { locationId } = body || {};
    if (!locationId || !LOCATIONS.some((l) => l.id === locationId)) {
      return new Response(JSON.stringify({ error: "ไม่พบห้อง/โต๊ะนี้" }), { status: 400 });
    }

    const DRINKS = await getDrinksMenu();

    const lStore = locationsStore();
    const locState = (await lStore.get(locationId, { type: "json" })) || { openBill: null, history: [] };

    if (locState.openBill && locState.openBill.rounds && locState.openBill.rounds.length) {
      locState.history = locState.history || [];
      locState.history.push({ ...locState.openBill, closedAt: new Date().toISOString() });
    }
    locState.openBill = null;

    await lStore.setJSON(locationId, locState);

    const locEntries = await Promise.all(
      LOCATIONS.map(async (loc) => [
        loc.id,
        loc.id === locationId ? locState : (await lStore.get(loc.id, { type: "json" })) || { openBill: null, history: [] },
      ])
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
    const roomStockUsed = Object.fromEntries(roomRecords.map(([id, r]) => [id, r.used]));

    const stockHistory = (await stockHistoryStore().get("log", { type: "json" })) || [];
    const staffList = await getStaffList();

    return new Response(
      JSON.stringify({ locations, stock, roomStock, stockHistory, roomStockHistory, roomStockUsed, drinksMenu: DRINKS, staffList }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err && err.message ? err.message : err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const config = { path: "/api/close-bill" };
