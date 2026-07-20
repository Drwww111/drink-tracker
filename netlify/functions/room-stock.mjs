import { getStore } from "@netlify/blobs";
import { LOCATIONS } from "./shared-data.mjs";
import { getDrinksMenu } from "./menu-store.mjs";
import { getStaffList } from "./staff-store.mjs";

const locationsStore = () => getStore({ name: "drink-tracker-locations", consistency: "strong" });
const stockStore = () => getStore({ name: "drink-tracker-stock", consistency: "strong" });
const roomStockStore = () => getStore({ name: "drink-tracker-room-stock", consistency: "strong" });
const stockHistoryStore = () => getStore({ name: "drink-tracker-stock-history", consistency: "strong" });

async function getStockValue(drinkId) {
  const data = await stockStore().get(drinkId, { type: "json" });
  return typeof data === "number" ? data : 0;
}

function unwrapRoom(raw) {
  if (!raw) return { items: {}, used: {}, history: [] };
  if (typeof raw === "object" && ("items" in raw || "history" in raw || "used" in raw)) {
    return { items: raw.items || {}, used: raw.used || {}, history: raw.history || [] };
  }
  return { items: raw, used: {}, history: [] };
}

// เอายอด "ใช้ไป" ที่ค้างสะสมไว้ (ยังไม่ได้ปิดบิล) มาหักออกจากสต็อกกลางของร้าน ก่อนจะถูกทับด้วยค่านับใหม่
async function flushUsedToCentralStock(existing, DRINKS, sStore) {
  for (const id in existing.used) {
    const usedQty = existing.used[id] || 0;
    if (usedQty > 0) {
      const drink = DRINKS.find((d) => d.id === id);
      if (drink && drink.trackStock) {
        const current = await sStore.get(id, { type: "json" });
        const currentNum = typeof current === "number" ? current : 0;
        await sStore.setJSON(id, currentNum - usedQty);
      }
    }
  }
}

async function buildFullState(currentLocationId, currentRoomRecord) {
  const DRINKS = await getDrinksMenu();

  const lStore = locationsStore();
  const locEntries = await Promise.all(
    LOCATIONS.map(async (loc) => [loc.id, (await lStore.get(loc.id, { type: "json" })) || { openBill: null, history: [] }])
  );
  const locations = Object.fromEntries(locEntries);

  const stockEntries = await Promise.all(
    DRINKS.filter((d) => d.trackStock).map(async (d) => [d.id, await getStockValue(d.id)])
  );
  const stock = Object.fromEntries(stockEntries);

  const rStore = roomStockStore();
  const roomRecords = await Promise.all(
    LOCATIONS.map(async (loc) => [
      loc.id,
      loc.id === currentLocationId && currentRoomRecord ? currentRoomRecord : unwrapRoom(await rStore.get(loc.id, { type: "json" })),
    ])
  );
  const roomStock = Object.fromEntries(roomRecords.map(([id, r]) => [id, r.items]));
  const roomStockUsed = Object.fromEntries(roomRecords.map(([id, r]) => [id, r.used]));
  const roomStockHistory = Object.fromEntries(roomRecords.map(([id, r]) => [id, r.history]));

  const stockHistory = (await stockHistoryStore().get("log", { type: "json" })) || [];
  const staffList = await getStaffList();

  return { locations, stock, roomStock, stockHistory, roomStockHistory, roomStockUsed, drinksMenu: DRINKS, staffList };
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
      return new Response(JSON.stringify({ error: "ข้อมูลไม่ถูกต้อง" }), { status: 400 });
    }

    const rStore = roomStockStore();

    // ---- action: ปรับตัวนับ "ใช้ไป" ทีละรายการ (จากการ์ดอ้างอิงในหน้าห้อง) ----
    // หมายเหตุ: การกดปุ่มนี้ "ยังไม่หัก" สต็อกกลางทันที จะไปหักรวมทีเดียวตอนปิดบิล/นับสต็อกใหม่
    if (body.action === "use") {
      const { drinkId, delta } = body;
      const deltaNum = Number(delta);
      if (!drinkId || !Number.isFinite(deltaNum) || !deltaNum) {
        return new Response(JSON.stringify({ error: "ข้อมูลไม่ถูกต้อง" }), { status: 400 });
      }

      const existing = unwrapRoom(await rStore.get(locationId, { type: "json" }));
      const placed = existing.items[drinkId] || 0;
      const currentUsed = existing.used[drinkId] || 0;
      const newUsed = Math.max(0, Math.min(placed, currentUsed + deltaNum));

      const newRecord = {
        items: existing.items,
        used: { ...existing.used, [drinkId]: newUsed },
        history: existing.history,
      };
      await rStore.setJSON(locationId, newRecord);

      const fullState = await buildFullState(locationId, newRecord);
      return new Response(JSON.stringify(fullState), { headers: { "Content-Type": "application/json" } });
    }

    // ---- การนับสต็อกในห้องแบบเต็ม (เลือกเครื่องดื่ม+ใส่จำนวน แล้วบันทึกทั้งหมด) ----
    const { employee, items } = body;
    if (typeof items !== "object" || items === null) {
      return new Response(JSON.stringify({ error: "ข้อมูลไม่ถูกต้อง" }), { status: 400 });
    }
    if (!employee) {
      return new Response(JSON.stringify({ error: "กรุณาเลือกพนักงานที่นับสต็อก" }), { status: 400 });
    }

    const DRINKS = await getDrinksMenu();

    const cleaned = {};
    for (const id in items) {
      const qty = Number(items[id]) || 0;
      if (qty > 0 && DRINKS.some((d) => d.id === id)) cleaned[id] = qty;
    }

    const existing = unwrapRoom(await rStore.get(locationId, { type: "json" }));

    // ถ้ายังไม่เคยปิดบิลแต่มียอด "ใช้ไป" ค้างอยู่ ให้หักเข้าสต็อกกลางก่อนจะถูกทับด้วยค่านับใหม่
    await flushUsedToCentralStock(existing, DRINKS, stockStore());

    const changes = [];
    const allIds = new Set([...Object.keys(existing.items), ...Object.keys(cleaned)]);
    for (const id of allIds) {
      const from = existing.items[id] || 0;
      const to = cleaned[id] || 0;
      if (from !== to) {
        const drink = DRINKS.find((d) => d.id === id);
        changes.push({ id, name: drink ? drink.name : id, from, to });
      }
    }

    let history = existing.history || [];
    if (changes.length) {
      history = [
        ...history,
        { id: `hist_${Date.now()}`, timestamp: new Date().toISOString(), employee, changes },
      ].slice(-50);
    }

    // นับใหม่แล้ว = เริ่มนับ "ใช้ไป" ใหม่ตั้งแต่ต้น (used รีเซ็ตเป็น 0 ทุกตัว)
    const newRecord = { items: cleaned, used: {}, history };
    await rStore.setJSON(locationId, newRecord);

    const fullState = await buildFullState(locationId, newRecord);
    return new Response(JSON.stringify(fullState), { headers: { "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err && err.message ? err.message : err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const config = { path: "/api/room-stock" };
