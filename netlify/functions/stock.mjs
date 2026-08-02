import { getStore } from "@netlify/blobs";
import { getLocationsList } from "./locations-store.mjs";
import { getDrinksMenu } from "./menu-store.mjs";
import { getStaffList } from "./staff-store.mjs";
import { getRates } from "./rates-store.mjs";
import { getSettings } from "./settings-store.mjs";
import { getShrinkageCharges } from "./shrinkage-charges-store.mjs";
import { getShrinkageDebtPlans } from "./shrinkage-debt-plans-store.mjs";

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
    const shrinkageCharges = await getShrinkageCharges();
    const shrinkageDebtPlans = await getShrinkageDebtPlans();
    let body;
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "รูปแบบข้อมูลไม่ถูกต้อง" }), { status: 400 });
    }

    const DRINKS = await getDrinksMenu();
    const sStore = stockStore();

    if (body && body.action === "editHistoryEntry") {
      const { historyId, drinkId, newTo, employee } = body;
      if (!historyId || !drinkId || !employee || !String(employee).trim()) {
        return new Response(JSON.stringify({ error: "ข้อมูลไม่ครบ กรุณาเลือกพนักงานและระบุรายการที่จะแก้ไข" }), { status: 400 });
      }
      const numNewTo = Number(newTo);
      if (!Number.isFinite(numNewTo)) {
        return new Response(JSON.stringify({ error: "จำนวนที่แก้ไขไม่ถูกต้อง" }), { status: 400 });
      }
      const hStore = stockHistoryStore();
      const log = (await hStore.get("log", { type: "json" })) || [];
      const entry = log.find((h) => h.id === historyId);
      if (!entry) {
        return new Response(JSON.stringify({ error: "ไม่พบประวัติการนับสต็อกนี้ (อาจถูกลบไปแล้ว)" }), { status: 400 });
      }
      const change = (entry.changes || []).find((c) => c.id === drinkId);
      if (!change) {
        return new Response(JSON.stringify({ error: "ไม่พบรายการเครื่องดื่มนี้ในประวัตินั้น" }), { status: 400 });
      }
      const prevTo = Number(change.to || 0);
      const diff = numNewTo - prevTo;
      if (!change.corrected) {
        change.originalTo = prevTo;
        change.originalFrom = change.from;
      }
      change.to = numNewTo;
      change.corrected = true;
      change.correctedBy = String(employee).trim();
      change.correctedAt = new Date().toISOString();
      await hStore.setJSON("log", log);

      if (diff !== 0) {
        const current = await sStore.get(drinkId, { type: "json" });
        const currentNum = typeof current === "number" ? current : 0;
        await sStore.setJSON(drinkId, currentNum + diff);
      }
    } else if (body && body.action === "deleteHistoryChange") {
      // ลบ (void) รายการนับสต็อกที่กดผิด SKU: ย้อนผลของรายการนั้นออกจากสต็อกปัจจุบัน แต่ยังเก็บร่องรอยไว้ตรวจสอบย้อนหลังได้
      const { historyId, drinkId, employee } = body;
      if (!historyId || !drinkId || !employee || !String(employee).trim()) {
        return new Response(JSON.stringify({ error: "ข้อมูลไม่ครบ กรุณาเลือกพนักงานและระบุรายการที่จะลบ" }), { status: 400 });
      }
      const hStore = stockHistoryStore();
      const log = (await hStore.get("log", { type: "json" })) || [];
      const entry = log.find((h) => h.id === historyId);
      if (!entry) {
        return new Response(JSON.stringify({ error: "ไม่พบประวัติการนับสต็อกนี้ (อาจถูกลบไปแล้ว)" }), { status: 400 });
      }
      const change = (entry.changes || []).find((c) => c.id === drinkId);
      if (!change) {
        return new Response(JSON.stringify({ error: "ไม่พบรายการเครื่องดื่มนี้ในประวัตินั้น" }), { status: 400 });
      }
      if (change.deleted) {
        return new Response(JSON.stringify({ error: "รายการนี้ถูกลบไปแล้ว" }), { status: 400 });
      }
      const reverseDiff = Number(change.from || 0) - Number(change.to || 0);
      change.deleted = true;
      change.deletedBy = String(employee).trim();
      change.deletedAt = new Date().toISOString();
      await hStore.setJSON("log", log);

      if (reverseDiff !== 0) {
        const current = await sStore.get(drinkId, { type: "json" });
        const currentNum = typeof current === "number" ? current : 0;
        await sStore.setJSON(drinkId, currentNum + reverseDiff);
      }
    } else if (body && typeof body.items === "object" && body.items !== null) {
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
    const staffList = await getStaffList();

    return new Response(
      JSON.stringify({ locations, stock, roomStock, stockHistory, roomStockHistory, drinksMenu: DRINKS, staffList, locationsList: LOCATIONS, rates, settings, shrinkageCharges, shrinkageDebtPlans }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err && err.message ? err.message : err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const config = { path: "/api/stock" };
