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

    const { locationId, employee, discounts } = body || {};
    if (!locationId || !LOCATIONS.some((l) => l.id === locationId)) {
      return new Response(JSON.stringify({ error: "ไม่พบห้อง/โต๊ะนี้" }), { status: 400 });
    }
    if (!employee || !String(employee).trim()) {
      return new Response(JSON.stringify({ error: "กรุณาเลือกพนักงานผู้ปิดบิล" }), { status: 400 });
    }

    const DRINKS = await getDrinksMenu();

    const lStore = locationsStore();
    const locState = (await lStore.get(locationId, { type: "json" })) || { openBill: null, history: [] };

    if (locState.openBill && locState.openBill.rounds && locState.openBill.rounds.length) {
      // ใส่ส่วนลดรายสินค้า (ถ้ามี) โดยหักออกจาก lineTotal ของรายการที่ตรง id ในแต่ละรอบ
      // เรียงลบทีละรอบจนกว่าส่วนลดของสินค้านั้นจะหมด (กันหักเกินยอดของรายการนั้นๆ)
      let discountTotal = 0;
      const remaining = {};
      if (discounts && typeof discounts === "object") {
        for (const [id, amt] of Object.entries(discounts)) {
          const n = Number(amt) || 0;
          if (n > 0) remaining[id] = n;
        }
      }
      const rounds = (locState.openBill.rounds || []).map((r) => {
        const items = (r.items || []).map((i) => {
          if (remaining[i.id] && remaining[i.id] > 0 && !i.free) {
            const lineTotal = typeof i.lineTotal === "number" ? i.lineTotal : Number(i.qty || 0) * Number(i.unitPrice || 0);
            const applied = Math.min(remaining[i.id], lineTotal);
            remaining[i.id] -= applied;
            discountTotal += applied;
            return { ...i, lineTotal: Math.max(0, lineTotal - applied) };
          }
          return i;
        });
        const roundTotal = items.reduce((s, i) => s + Number(i.lineTotal || 0), 0);
        return { ...r, items, roundTotal };
      });

      locState.history = locState.history || [];
      locState.history.push({
        ...locState.openBill,
        rounds,
        closedAt: new Date().toISOString(),
        closedBy: String(employee).trim(),
        discountTotal,
      });
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

export const config = { path: "/api/close-bill" };
