import { getStore } from "@netlify/blobs";
import { getLocationsList } from "./locations-store.mjs";
import { getDrinksMenu } from "./menu-store.mjs";
import { getStaffList } from "./staff-store.mjs";

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

// ร้านอยู่เมืองไทย (UTC+7 ตลอด) fix offset ตรงๆ ให้ตรงกับฝั่ง client (app.js) เป๊ะ
const THAILAND_OFFSET_MS = 7 * 60 * 60 * 1000;
function dayKeyOf(iso) {
  return new Date(new Date(iso).getTime() + THAILAND_OFFSET_MS).toISOString().slice(0, 10);
}

export default async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const LOCATIONS = await getLocationsList();
    let body;
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "รูปแบบข้อมูลไม่ถูกต้อง" }), { status: 400 });
    }

    const { fromDate, toDate, locationId, billId } = body || {};

    const lStore = locationsStore();
    let deletedCount = 0;

    if (billId) {
      // โหมดลบทีละบิล: ต้องระบุ locationId + billId ของบิลนั้นเจาะจง
      if (!locationId || !LOCATIONS.some((l) => l.id === locationId)) {
        return new Response(JSON.stringify({ error: "ไม่พบห้อง/โต๊ะนี้" }), { status: 400 });
      }
      const locState = (await lStore.get(locationId, { type: "json" })) || { openBill: null, history: [] };
      const before = (locState.history || []).length;
      locState.history = (locState.history || []).filter((b) => b.id !== billId);
      deletedCount = before - locState.history.length;
      await lStore.setJSON(locationId, locState);
    } else {
      // โหมดลบตามช่วงวันที่ (ทุกห้อง หรือห้องเดียวถ้าระบุ locationId)
      if (!fromDate && !toDate) {
        return new Response(JSON.stringify({ error: "กรุณาเลือกช่วงวันที่ที่จะลบ" }), { status: 400 });
      }

      const targetLocations = locationId ? LOCATIONS.filter((l) => l.id === locationId) : LOCATIONS;
      if (locationId && !targetLocations.length) {
        return new Response(JSON.stringify({ error: "ไม่พบห้อง/โต๊ะนี้" }), { status: 400 });
      }

      for (const loc of targetLocations) {
        const locState = (await lStore.get(loc.id, { type: "json" })) || { openBill: null, history: [] };
        const before = (locState.history || []).length;
        locState.history = (locState.history || []).filter((b) => {
          const closedAt =
            b.closedAt || (b.rounds && b.rounds.length ? b.rounds[b.rounds.length - 1].timestamp : null);
          if (!closedAt) return true; // ไม่มีวันที่ปิด ไม่แตะ
          const key = dayKeyOf(closedAt);
          const inRange = (!fromDate || key >= fromDate) && (!toDate || key <= toDate);
          return !inRange; // เก็บอันที่ "ไม่อยู่ในช่วง" ไว้ ตัดอันที่อยู่ในช่วงทิ้ง
        });
        deletedCount += before - locState.history.length;
        await lStore.setJSON(loc.id, locState);
      }
    }

    const DRINKS = await getDrinksMenu();

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
        deletedCount,
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

export const config = { path: "/api/delete-bill-history" };
