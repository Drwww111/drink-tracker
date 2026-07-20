import { getStore } from "@netlify/blobs";
import { getLocationsList } from "./locations-store.mjs";
import { getDrinksMenu } from "./menu-store.mjs";
import { getStaffList } from "./staff-store.mjs";

const locationsStore = () => getStore({ name: "drink-tracker-locations", consistency: "strong" });
const stockStore = () => getStore({ name: "drink-tracker-stock", consistency: "strong" });
const roomStockStore = () => getStore({ name: "drink-tracker-room-stock", consistency: "strong" });
const stockHistoryStore = () => getStore({ name: "drink-tracker-stock-history", consistency: "strong" });

async function getStockValue(drinkId) {
  const store = stockStore();
  const data = await store.get(drinkId, { type: "json" });
  return typeof data === "number" ? data : 0;
}

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
    const LOCATIONS = await getLocationsList();
    let body;
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "รูปแบบข้อมูลไม่ถูกต้อง" }), { status: 400 });
    }

    const { locationId, roundId } = body || {};
    if (!locationId || !roundId || !LOCATIONS.some((l) => l.id === locationId)) {
      return new Response(JSON.stringify({ error: "ข้อมูลไม่ถูกต้อง" }), { status: 400 });
    }

    const DRINKS = await getDrinksMenu();

    const lStore = locationsStore();
    const locState = (await lStore.get(locationId, { type: "json" })) || { openBill: null, history: [] };

    if (!locState.openBill) {
      return new Response(JSON.stringify({ error: "ไม่พบบิลที่เปิดอยู่ของห้อง/โต๊ะนี้" }), { status: 400 });
    }
    const idx = locState.openBill.rounds.findIndex((r) => r.id === roundId);
    if (idx === -1) {
      return new Response(JSON.stringify({ error: "ไม่พบรายการนี้ (อาจถูกลบไปแล้ว)" }), { status: 400 });
    }

    const [removedRound] = locState.openBill.rounds.splice(idx, 1);
    await lStore.setJSON(locationId, locState);

    // คืนสต็อกของทุกเครื่องดื่มในรายการที่ลบ (ลูกค้าเอาคืน ของยังอยู่ครบเหมือนไม่ได้นำไป)
    const sStore = stockStore();
    for (const i of removedRound.items) {
      const drink = DRINKS.find((d) => d.id === i.id);
      if (drink && drink.trackStock) {
        const current = await getStockValue(i.id);
        await sStore.setJSON(i.id, current + Number(i.qty || 0));
      }
    }

    // ถ้ารอบนี้เคยหักสต็อกที่วางไว้ในห้อง (roomStockDeduct) ให้คืนจำนวนนั้นกลับเข้าไปในของที่วางไว้
    if (removedRound.roomStockDeduct && typeof removedRound.roomStockDeduct === "object") {
      const rStoreForRestore = roomStockStore();
      const roomRecord = unwrapRoom(await rStoreForRestore.get(locationId, { type: "json" }));
      const restoredItems = { ...roomRecord.items };
      Object.entries(removedRound.roomStockDeduct).forEach(([drinkId, qty]) => {
        const n = Math.max(0, Math.round(Number(qty) || 0));
        if (n <= 0) return;
        restoredItems[drinkId] = (restoredItems[drinkId] || 0) + n;
      });
      await rStoreForRestore.setJSON(locationId, { items: restoredItems, history: roomRecord.history });
    }

    const locEntries = await Promise.all(
      LOCATIONS.map(async (loc) => [
        loc.id,
        loc.id === locationId ? locState : (await lStore.get(loc.id, { type: "json" })) || { openBill: null, history: [] },
      ])
    );
    const locations = Object.fromEntries(locEntries);

    const stockEntries = await Promise.all(
      DRINKS.filter((d) => d.trackStock).map(async (d) => [d.id, await getStockValue(d.id)])
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
      JSON.stringify({ locations, stock, roomStock, stockHistory, roomStockHistory, drinksMenu: DRINKS, staffList, locationsList: LOCATIONS }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err && err.message ? err.message : err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const config = { path: "/api/delete-round" };
