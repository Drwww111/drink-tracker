import { getStore } from "@netlify/blobs";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { DRINKS, LOCATIONS } = require("../../data.js");

const locationsStore = () => getStore({ name: "drink-tracker-locations", consistency: "strong" });
const stockStore = () => getStore({ name: "drink-tracker-stock", consistency: "strong" });

async function getStockValue(drinkId) {
  const store = stockStore();
  const data = await store.get(drinkId, { type: "json" });
  return typeof data === "number" ? data : 0;
}

export default async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "รูปแบบข้อมูลไม่ถูกต้อง" }), { status: 400 });
  }

  const { locationId, employee, items, emptyCounts, timestamp } = body || {};
  if (!locationId || !employee || !Array.isArray(items) || !items.length) {
    return new Response(JSON.stringify({ error: "ข้อมูลไม่ครบ กรุณาเลือกพนักงานและจำนวนเครื่องดื่ม" }), {
      status: 400,
    });
  }
  if (!LOCATIONS.some((l) => l.id === locationId)) {
    return new Response(JSON.stringify({ error: "ไม่พบห้อง/โต๊ะนี้" }), { status: 400 });
  }

  // คำนวณราคาใหม่ฝั่งเซิร์ฟเวอร์เสมอ (อ้างอิงราคาจริงจาก DRINKS ไม่พึ่งค่าที่ส่งมาจากเครื่องลูกข่าย)
  const normalizedItems = items.map((i) => {
    const drink = DRINKS.find((d) => d.id === i.id);
    const price = drink ? drink.price : Number(i.unitPrice || 0);
    const qty = Number(i.qty || 0);
    const free = !!i.free;
    return {
      id: i.id,
      name: drink ? drink.name : i.name,
      qty,
      unitPrice: price,
      free,
      lineTotal: free ? 0 : qty * price,
    };
  });

  const roundTotal = normalizedItems.reduce((s, i) => s + i.lineTotal, 0);

  const round = {
    id: `round_${Date.now()}`,
    timestamp: timestamp || new Date().toISOString(),
    employee,
    items: normalizedItems,
    emptyCounts: emptyCounts || {},
    roundTotal,
  };

  // อัปเดตบิลของห้อง/โต๊ะนี้ (คีย์แยกเฉพาะห้องนี้ ไม่ชนกับห้องอื่น)
  const lStore = locationsStore();
  const locState = (await lStore.get(locationId, { type: "json" })) || { openBill: null, history: [] };
  if (!locState.openBill) {
    locState.openBill = {
      id: `bill_${Date.now()}`,
      openedAt: round.timestamp,
      rounds: [],
    };
  }
  locState.openBill.rounds.push(round);
  await lStore.setJSON(locationId, locState);

  // หักสต็อกตามจำนวนที่นำไปจริง (รายการฟรีก็ยังเป็นของจริงที่ถูกใช้ไป จึงหักสต็อกเหมือนกัน)
  // อัปเดตทีละชนิด คีย์แยกต่อเครื่องดื่ม ลดโอกาสชนกับสต็อกเครื่องดื่มชนิดอื่น
  const sStore = stockStore();
  for (const i of normalizedItems) {
    const drink = DRINKS.find((d) => d.id === i.id);
    if (drink && drink.trackStock) {
      const current = await getStockValue(i.id);
      await sStore.setJSON(i.id, current - i.qty);
    }
  }

  // ส่งสถานะล่าสุดทั้งหมดกลับไปให้หน้าเว็บอัปเดต
  const locations = {};
  for (const loc of LOCATIONS) {
    locations[loc.id] = loc.id === locationId ? locState : (await lStore.get(loc.id, { type: "json" })) || { openBill: null, history: [] };
  }
  const stock = {};
  for (const d of DRINKS) {
    if (d.trackStock) stock[d.id] = await getStockValue(d.id);
  }

  return new Response(JSON.stringify({ locations, stock }), {
    headers: { "Content-Type": "application/json" },
  });
};

export const config = { path: "/api/order" };
