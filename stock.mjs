import { getStore } from "@netlify/blobs";
import { DRINKS, LOCATIONS } from "./shared-data.mjs";

const locationsStore = () => getStore({ name: "drink-tracker-locations", consistency: "strong" });
const stockStore = () => getStore({ name: "drink-tracker-stock", consistency: "strong" });
const roomStockStore = () => getStore({ name: "drink-tracker-room-stock", consistency: "strong" });
const stockHistoryStore = () => getStore({ name: "drink-tracker-stock-history", consistency: "strong" });

// รองรับข้อมูลรูปแบบเก่า (แค่ map ธรรมดา) กับรูปแบบใหม่ { items, history }
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

    const sStore = stockStore();

    if (body && typeof body.items === "object" && body.items !== null) {
      // บันทึกทีเดียวหลายรายการ (จากหน้าจัดการสต็อกที่กรอกหลายช่องแล้วกดบันทึกครั้งเดียว)
      const { employee, items } = body;
      if (!employee) {
        return new Response(JSON.stringify({ error: "กรุณาเลือกพนักงานที่นับสต็อก" }), { status: 400 });
      }

      const changes = [];
      for (const id in items) {
        const drink = DRINKS.find((d) => d.id === id && d.trackStock);
        if (!drink) continue;
        const current = await sStore.get(id, { type: "json" });
        const currentNum = typeof current === "number" ? current : 0;
        const num = Number(items[id]) || 0;
        if (num !== currentNum) {
          changes.push({ id, name: drink.name, from: currentNum, to: num });
        }
        await sStore.setJSON(id, num);
      }

      if (changes.length) {
        const hStore = stockHistoryStore();
        const existing = (await hStore.get("log", { type: "json" })) || [];
        existing.push({
          id: `hist_${Date.now()}`,
          timestamp: new Date().toISOString(),
          employee,
          changes,
        });
        await hStore.setJSON("log", existing.slice(-100));
      }
    } else {
      const { drinkId, mode, value } = body || {};
      if (!drinkId || !["set", "add"].includes(mode)) {
        return new Response(JSON.stringify({ error: "ข้อมูลไม่ถูกต้อง" }), { status: 400 });
      }
      const current = await sStore.get(drinkId, { type: "json" });
      const currentNum = typeof current === "number" ? current : 0;
      const num = Number(value) || 0;
      const next = mode === "set" ? num : currentNum + num;
      await sStore.setJSON(drinkId, next);
    }

    const lStore = locationsStore();
    const locEntries = await Promise.all(
      LOCATIONS.map(async (loc) => [loc.id, (await lStore.get(loc.id, { type: "json" })) || { openBill: null, history: [] }])
    );
    const locations = Object.fromEntries(locEntries);

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

    return new Response(JSON.stringify({ locations, stock, roomStock, stockHistory, roomStockHistory }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err && err.message ? err.message : err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const config = { path: "/api/stock" };
