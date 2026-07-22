import { getStore } from "@netlify/blobs";
import { getLocationsList } from "./locations-store.mjs";
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
    const rates = await getRates();
    const settings = await getSettings();
    let body;
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "รูปแบบข้อมูลไม่ถูกต้อง" }), { status: 400 });
    }

    const { fromDate, toDate, locationId, billId } = body || {};

    const lStore = locationsStore();
    let deletedCount = 0;

    // เก็บสต็อกที่ต้องคืน (เผื่อ CEO เผลอลบบิล/ปิดบิลผิด) ให้ของยังอยู่ครบเหมือนไม่ได้ขายไป แทนที่จะหายไปเฉยๆ
    const centralStockToRestore = {}; // { drinkId: qty }
    const roomStockToRestore = {}; // { locationId: { drinkId: qty } }

    function collectRestoreFromBill(loc, bill) {
      // เหมือน delete-round.mjs: คืนสต็อกกลางเต็มจำนวนเสมอ (ถ้า track อยู่) และถ้ารอบนั้นเคยหักของที่วางไว้ในห้องด้วย ก็คืนเข้าห้องเพิ่มอีกทาง (คนละบัญชีกัน)
      for (const r of bill.rounds || []) {
        const roomDeduct = r.roomStockDeduct && typeof r.roomStockDeduct === "object" ? r.roomStockDeduct : {};
        for (const i of r.items || []) {
          if (!i || !i.id) continue;
          const qty = Number(i.qty || 0);
          if (!qty) continue;
          centralStockToRestore[i.id] = (centralStockToRestore[i.id] || 0) + qty;
          const fromRoom = Math.min(qty, Number(roomDeduct[i.id] || 0));
          if (fromRoom > 0) {
            roomStockToRestore[loc.id] = roomStockToRestore[loc.id] || {};
            roomStockToRestore[loc.id][i.id] = (roomStockToRestore[loc.id][i.id] || 0) + fromRoom;
          }
        }
      }
    }

    if (billId) {
      // โหมดลบทีละบิล: ต้องระบุ locationId + billId ของบิลนั้นเจาะจง
      if (!locationId || !LOCATIONS.some((l) => l.id === locationId)) {
        return new Response(JSON.stringify({ error: "ไม่พบห้อง/โต๊ะนี้" }), { status: 400 });
      }
      const loc = LOCATIONS.find((l) => l.id === locationId);
      const locState = (await lStore.get(locationId, { type: "json" })) || { openBill: null, history: [] };
      const before = (locState.history || []).length;
      const toDelete = (locState.history || []).filter((b) => b.id === billId);
      for (const b of toDelete) collectRestoreFromBill(loc, b);
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
          if (inRange) collectRestoreFromBill(loc, b);
          return !inRange; // เก็บอันที่ "ไม่อยู่ในช่วง" ไว้ ตัดอันที่อยู่ในช่วงทิ้ง
        });
        deletedCount += before - locState.history.length;
        await lStore.setJSON(loc.id, locState);
      }
    }

    const DRINKS = await getDrinksMenu();

    // คืนสต็อกกลางตามที่สะสมไว้ (เฉพาะสินค้าที่ยัง trackStock อยู่จริง)
    if (Object.keys(centralStockToRestore).length) {
      const sStoreForRestore = stockStore();
      for (const [drinkId, qty] of Object.entries(centralStockToRestore)) {
        const drink = DRINKS.find((d) => d.id === drinkId);
        if (!drink || !drink.trackStock) continue;
        const current = await sStoreForRestore.get(drinkId, { type: "json" });
        const currentVal = typeof current === "number" ? current : 0;
        await sStoreForRestore.setJSON(drinkId, currentVal + qty);
      }
    }

    // คืนของที่วางไว้ในห้อง (roomStock) ตามที่สะสมไว้
    if (Object.keys(roomStockToRestore).length) {
      const rStoreForRestore = roomStockStore();
      for (const [locId, itemsToRestore] of Object.entries(roomStockToRestore)) {
        const roomRecord = unwrapRoom(await rStoreForRestore.get(locId, { type: "json" }));
        const restoredItems = { ...roomRecord.items };
        for (const [drinkId, qty] of Object.entries(itemsToRestore)) {
          restoredItems[drinkId] = (restoredItems[drinkId] || 0) + qty;
        }
        await rStoreForRestore.setJSON(locId, { items: restoredItems, history: roomRecord.history });
      }
    }

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
