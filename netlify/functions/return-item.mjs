// คืนสินค้าบางส่วน/ทั้งหมดจากรายการหนึ่งในบิลที่ยังไม่ปิด (ลูกค้าไม่รับแล้ว เอากลับคืน)
// คืนสต็อกให้ตรงกับที่หักไปตอนสั่ง (สต็อกกลาง หรือของที่วางไว้ในห้อง roomStockDeduct) โดยไม่ต้องลบทั้งรายการทิ้ง
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

async function getStockValue(drinkId) {
  const data = await stockStore().get(drinkId, { type: "json" });
  return typeof data === "number" ? data : 0;
}

function unwrapRoom(raw) {
  if (!raw) return { items: {}, history: [] };
  if (typeof raw === "object" && ("items" in raw || "history" in raw)) {
    return { items: raw.items || {}, history: raw.history || [] };
  }
  return { items: raw, history: [] };
}

function isSyntheticId(id) {
  return typeof id === "string" && (id.startsWith("karaoke_") || id.startsWith("meeting_"));
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

    const { locationId, roundId, itemId, qty, employee } = body || {};
    if (!locationId || !roundId || !itemId || !LOCATIONS.some((l) => l.id === locationId)) {
      return new Response(JSON.stringify({ error: "ข้อมูลไม่ถูกต้อง" }), { status: 400 });
    }
    if (!employee || !String(employee).trim()) {
      return new Response(JSON.stringify({ error: "กรุณาระบุพนักงานผู้ทำรายการคืนสินค้า" }), { status: 400 });
    }
    const returnQty = Math.round(Number(qty) || 0);
    if (returnQty <= 0) {
      return new Response(JSON.stringify({ error: "กรุณาระบุจำนวนที่จะคืน" }), { status: 400 });
    }
    if (isSyntheticId(itemId)) {
      return new Response(JSON.stringify({ error: "รายการนี้คืนสินค้าไม่ได้ (ไม่ใช่เครื่องดื่ม)" }), { status: 400 });
    }

    const DRINKS = await getDrinksMenu();

    const lStore = locationsStore();
    const locState = (await lStore.get(locationId, { type: "json" })) || { openBill: null, history: [] };
    if (!locState.openBill) {
      return new Response(JSON.stringify({ error: "ไม่พบบิลที่เปิดอยู่ของห้อง/โต๊ะนี้" }), { status: 400 });
    }
    const roundIdx = locState.openBill.rounds.findIndex((r) => r.id === roundId);
    if (roundIdx === -1) {
      return new Response(JSON.stringify({ error: "ไม่พบรายการนี้ (อาจถูกลบไปแล้ว)" }), { status: 400 });
    }
    const round = { ...locState.openBill.rounds[roundIdx], items: [...locState.openBill.rounds[roundIdx].items] };
    const itemIdx = round.items.findIndex((i) => i.id === itemId);
    if (itemIdx === -1) {
      return new Response(JSON.stringify({ error: "ไม่พบสินค้านี้ในรายการ (อาจถูกคืนไปแล้ว)" }), { status: 400 });
    }
    const item = round.items[itemIdx];
    const currentQty = Number(item.qty || 0);
    if (returnQty > currentQty) {
      return new Response(JSON.stringify({ error: `คืนได้ไม่เกิน ${currentQty} ${item.free ? "(ของแจกฟรี)" : ""}` }), { status: 400 });
    }

    const newQty = currentQty - returnQty;
    const unitPrice = Number(item.unitPrice || 0);
    if (newQty <= 0) {
      round.items.splice(itemIdx, 1);
    } else {
      round.items[itemIdx] = {
        ...item,
        qty: newQty,
        lineTotal: item.free ? 0 : Math.round(unitPrice * newQty),
      };
    }
    round.roundTotal = round.items.reduce((s, i) => s + Number(i.lineTotal || 0), 0);

    // คืนสต็อก: เหมือนกับตอนลบทั้งรายการ (delete-round.mjs) คือคืน "สต็อกกลาง" เต็มจำนวนที่คืนเสมอถ้าเป็นสินค้าที่ track อยู่
    // และถ้ารอบนี้เคยหักจาก "ของที่วางไว้ในห้อง" (roomStockDeduct) ด้วย ก็คืนกลับเข้าห้องนั้นเพิ่มอีกทาง (คนละบัญชีกัน ไม่ใช่หักกันคนละครึ่ง)
    const drink = DRINKS.find((d) => d.id === itemId);
    if (drink && drink.trackStock) {
      const sStore = stockStore();
      const current = await getStockValue(itemId);
      await sStore.setJSON(itemId, current + returnQty);
    }

    const roomDeductForItem = round.roomStockDeduct && typeof round.roomStockDeduct === "object" ? Number(round.roomStockDeduct[itemId] || 0) : 0;
    const returnToRoom = Math.min(returnQty, roomDeductForItem);
    if (returnToRoom > 0) {
      const rStoreForRestore = roomStockStore();
      const roomRecord = unwrapRoom(await rStoreForRestore.get(locationId, { type: "json" }));
      const restoredItems = { ...roomRecord.items };
      restoredItems[itemId] = (restoredItems[itemId] || 0) + returnToRoom;
      await rStoreForRestore.setJSON(locationId, { items: restoredItems, history: roomRecord.history });
      round.roomStockDeduct = { ...round.roomStockDeduct, [itemId]: roomDeductForItem - returnToRoom };
    }

    if (round.items.length === 0) {
      locState.openBill.rounds.splice(roundIdx, 1);
    } else {
      locState.openBill.rounds[roundIdx] = round;
    }

    // เก็บ log การคืนสินค้าไว้ในบิล (ติดไปกับบิลตอนปิดบิลด้วย) เพื่อให้ประวัติบิลย้อนหลังสรุปได้ว่าคืนอะไรไปเท่าไร
    locState.openBill.returnsLog = [
      ...(locState.openBill.returnsLog || []),
      { itemId, itemName: item.name, qty: returnQty, employee: String(employee).trim(), timestamp: new Date().toISOString() },
    ];

    await lStore.setJSON(locationId, locState);

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
      JSON.stringify({ locations, stock, roomStock, stockHistory, roomStockHistory, drinksMenu: DRINKS, staffList, locationsList: LOCATIONS, rates, settings }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err && err.message ? err.message : err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const config = { path: "/api/return-item" };
