// ให้ CEO แก้ไขรายการ/จำนวนในบิลที่ปิดไปแล้ว (เผื่อพนักงานลืมลงบางอย่าง ยอดไม่ตรง)
// หมายเหตุ: แก้ไขแค่ตัวเลขที่บันทึกในประวัติบิลเพื่อความถูกต้องของรายงาน ไม่ย้อนไปหักคืนสต็อกกลาง/สต็อกห้อง
// (เพราะบิลปิดไปนานแล้ว สต็อกอาจถูกนับใหม่ไปหลายรอบแล้ว การไปแก้ย้อนหลังจะยิ่งทำให้สต็อกคลาดเคลื่อน)
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

    const { locationId, billId, rounds, editedBy } = body || {};
    if (!locationId || !billId || !LOCATIONS.some((l) => l.id === locationId)) {
      return new Response(JSON.stringify({ error: "ข้อมูลไม่ถูกต้อง" }), { status: 400 });
    }
    if (!Array.isArray(rounds)) {
      return new Response(JSON.stringify({ error: "รูปแบบรายการไม่ถูกต้อง" }), { status: 400 });
    }

    const lStore = locationsStore();
    const locState = (await lStore.get(locationId, { type: "json" })) || { openBill: null, history: [] };
    const billIdx = (locState.history || []).findIndex((b) => b.id === billId);
    if (billIdx === -1) {
      return new Response(JSON.stringify({ error: "ไม่พบบิลนี้ (อาจถูกลบไปแล้ว)" }), { status: 400 });
    }

    // คำนวณ lineTotal/roundTotal ใหม่จากจำนวน/ราคาที่ส่งมา กันข้อมูลไม่ตรงกัน
    const cleanedRounds = rounds.map((r) => {
      const items = (Array.isArray(r.items) ? r.items : []).map((i) => {
        const qty = Math.max(0, Number(i.qty) || 0);
        const unitPrice = Number(i.unitPrice) || 0;
        const free = !!i.free;
        const lineTotal = free ? 0 : Math.round(unitPrice * qty);
        const cleaned = { ...i, qty, unitPrice, free, lineTotal };
        if (typeof i.minutes === "number") cleaned.minutes = i.minutes;
        return cleaned;
      }).filter((i) => i.qty > 0);
      const roundTotal = items.reduce((s, i) => s + Number(i.lineTotal || 0), 0);
      return { ...r, items, roundTotal };
    }).filter((r) => r.items.length > 0);

    const bill = { ...locState.history[billIdx], rounds: cleanedRounds, editedAt: new Date().toISOString() };
    if (editedBy) bill.editedBy = String(editedBy).trim();
    locState.history[billIdx] = bill;
    await lStore.setJSON(locationId, locState);

    const DRINKS = await getDrinksMenu();

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

export const config = { path: "/api/edit-closed-bill" };
