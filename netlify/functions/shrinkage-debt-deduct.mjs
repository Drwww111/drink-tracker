import { getStore } from "@netlify/blobs";
import { getLocationsList } from "./locations-store.mjs";
import { getDrinksMenu } from "./menu-store.mjs";
import { getStaffList } from "./staff-store.mjs";
import { getRates } from "./rates-store.mjs";
import { getSettings } from "./settings-store.mjs";
import { getShrinkageCharges } from "./shrinkage-charges-store.mjs";
import { addShrinkageDebtDeductions, getShrinkageDebtPlans } from "./shrinkage-debt-plans-store.mjs";

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

    const { planId, date, employees, settleFullEmployees, recordedBy } = body || {};
    if (!planId) {
      return new Response(JSON.stringify({ error: "ไม่พบแผนหักเงินนี้" }), { status: 400 });
    }
    const employeesToDeduct = Array.isArray(employees) ? employees.map((e) => String(e).trim()).filter(Boolean) : [];
    const employeesToSettleFull = Array.isArray(settleFullEmployees)
      ? settleFullEmployees.map((e) => String(e).trim()).filter(Boolean)
      : [];
    if (!employeesToDeduct.length && !employeesToSettleFull.length) {
      return new Response(JSON.stringify({ error: "กรุณาเลือกคนที่จะหักเงินวันนี้อย่างน้อย 1 คน (ถ้าลาทั้งหมด ให้ข้ามวันนี้ไปเลย)" }), { status: 400 });
    }
    if (!recordedBy || !String(recordedBy).trim()) {
      return new Response(JSON.stringify({ error: "กรุณาระบุผู้บันทึกรายการนี้" }), { status: 400 });
    }
    const validDate = typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : null;
    const nowIso = new Date().toISOString();
    const deductDate = validDate || nowIso.slice(0, 10);

    const plans = await getShrinkageDebtPlans();
    const plan = plans.find((p) => p.id === planId);
    if (!plan) {
      return new Response(JSON.stringify({ error: "ไม่พบแผนหักเงินนี้ (อาจถูกลบไปแล้ว)" }), { status: 400 });
    }
    const owedPerPerson = plan.employees.length ? plan.totalAmount / plan.employees.length : 0;
    const paidSoFar = (name) =>
      (plan.deductions || []).filter((d) => d.employee === name).reduce((s, d) => s + Number(d.amount || 0), 0);

    const entries = [];
    for (const name of employeesToDeduct) {
      if (!plan.employees.includes(name)) continue; // เผื่อรายชื่อไม่ตรงกับพนักงานที่รับผิดชอบแผนนี้
      const remaining = Math.max(0, owedPerPerson - paidSoFar(name));
      if (remaining <= 0) continue; // จ่ายครบแล้ว ไม่ต้องหักซ้ำ
      const amount = Math.min(plan.dailyAmountPerPerson, remaining);
      entries.push({ date: deductDate, employee: name, amount, recordedBy: String(recordedBy).trim(), timestamp: nowIso });
    }
    // ปิดยอดเต็มจำนวน: หักส่วนที่เหลือทั้งหมดทีเดียว ไม่จำกัดแค่ยอดหักต่อวันปกติ (สำหรับคนที่อยากจ่ายให้จบเลย
    // ในขณะที่คนอื่นในแผนเดียวกันยังผ่อนจ่ายทีละวันตามปกติต่อไปได้)
    for (const name of employeesToSettleFull) {
      if (!plan.employees.includes(name)) continue;
      if (employeesToDeduct.includes(name)) continue; // กันหักซ้ำถ้าเผลอส่งชื่อเดียวกันมาทั้งสองลิสต์
      const remaining = Math.max(0, owedPerPerson - paidSoFar(name));
      if (remaining <= 0) continue; // จ่ายครบแล้ว
      entries.push({ date: deductDate, employee: name, amount: remaining, recordedBy: String(recordedBy).trim(), timestamp: nowIso, full: true });
    }
    if (!entries.length) {
      return new Response(JSON.stringify({ error: "ทุกคนที่เลือกจ่ายครบตามยอดที่รับผิดชอบแล้ว ไม่ต้องหักเพิ่ม" }), { status: 400 });
    }

    await addShrinkageDebtDeductions(planId, entries);

    const shrinkageDebtPlans = await getShrinkageDebtPlans();
    const shrinkageCharges = await getShrinkageCharges();

    const lStore = locationsStore();
    const locEntries = await Promise.all(
      LOCATIONS.map(async (loc) => [loc.id, (await lStore.get(loc.id, { type: "json" })) || { openBill: null, history: [] }])
    );
    const locations = Object.fromEntries(locEntries);

    const DRINKS = await getDrinksMenu();
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
        shrinkageCharges,
        shrinkageDebtPlans,
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

export const config = { path: "/api/shrinkage-debt-deduct" };
