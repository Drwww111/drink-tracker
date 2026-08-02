import { getStore } from "@netlify/blobs";
import { getLocationsList } from "./locations-store.mjs";
import { getDrinksMenu } from "./menu-store.mjs";
import { getStaffList } from "./staff-store.mjs";
import { getRates } from "./rates-store.mjs";
import { getSettings } from "./settings-store.mjs";
import { getShrinkageCharges } from "./shrinkage-charges-store.mjs";
import { updateShrinkageDebtPlan, getShrinkageDebtPlans } from "./shrinkage-debt-plans-store.mjs";

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

    const { planId, drinkIds, totalAmount, employees, dailyAmountPerPerson, note } = body || {};
    if (!planId) {
      return new Response(JSON.stringify({ error: "ไม่พบแผนหักเงินนี้" }), { status: 400 });
    }
    const DRINKS = await getDrinksMenu();
    const drinkIdsList = Array.isArray(drinkIds) ? drinkIds.filter(Boolean) : [];
    if (!drinkIdsList.length) {
      return new Response(JSON.stringify({ error: "กรุณาเลือกสินค้าอย่างน้อย 1 รายการ" }), { status: 400 });
    }
    const selectedDrinks = drinkIdsList.map((id) => DRINKS.find((d) => d.id === id)).filter(Boolean);
    if (selectedDrinks.length !== drinkIdsList.length) {
      return new Response(JSON.stringify({ error: "ไม่พบสินค้าบางรายการที่เลือก" }), { status: 400 });
    }
    const employeesList = Array.isArray(employees) ? employees.map((e) => String(e).trim()).filter(Boolean) : [];
    if (!employeesList.length) {
      return new Response(JSON.stringify({ error: "กรุณาเลือกพนักงานที่รับผิดชอบอย่างน้อย 1 คน" }), { status: 400 });
    }
    const numTotal = Number(totalAmount);
    if (!Number.isFinite(numTotal) || numTotal <= 0) {
      return new Response(JSON.stringify({ error: "ยอดรวมที่ต้องเก็บไม่ถูกต้อง" }), { status: 400 });
    }
    const numDaily = Number(dailyAmountPerPerson);
    if (!Number.isFinite(numDaily) || numDaily <= 0) {
      return new Response(JSON.stringify({ error: "จำนวนที่หักต่อคนต่อวันไม่ถูกต้อง" }), { status: 400 });
    }

    await updateShrinkageDebtPlan(planId, {
      drinkIds: drinkIdsList,
      drinkNames: selectedDrinks.map((d) => d.name),
      note: note ? String(note).trim() : "",
      totalAmount: numTotal,
      employees: employeesList,
      dailyAmountPerPerson: numDaily,
    });

    const shrinkageDebtPlans = await getShrinkageDebtPlans();
    const shrinkageCharges = await getShrinkageCharges();

    const lStore = locationsStore();
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

export const config = { path: "/api/shrinkage-debt-plan-edit" };
