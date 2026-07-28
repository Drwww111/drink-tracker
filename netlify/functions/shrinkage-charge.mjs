import { getStore } from "@netlify/blobs";
import { getLocationsList } from "./locations-store.mjs";
import { getDrinksMenu } from "./menu-store.mjs";
import { getStaffList } from "./staff-store.mjs";
import { getRates } from "./rates-store.mjs";
import { getSettings } from "./settings-store.mjs";
import { addShrinkageCharge, getShrinkageCharges } from "./shrinkage-charges-store.mjs";

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

    const { drinkId, drinkName, periodLabel, chargeAmount, employees, employeeCharge, recordedBy, note } = body || {};
    const DRINKS = await getDrinksMenu();
    const drink = DRINKS.find((d) => d.id === drinkId);
    if (!drinkId || !drink) {
      return new Response(JSON.stringify({ error: "ไม่พบเครื่องดื่มนี้" }), { status: 400 });
    }
    const employeesList = Array.isArray(employees) ? employees.map((e) => String(e).trim()).filter(Boolean) : [];
    if (!employeesList.length) {
      return new Response(JSON.stringify({ error: "กรุณาเลือกพนักงานที่รับผิดชอบอย่างน้อย 1 คน" }), { status: 400 });
    }
    if (!recordedBy || !String(recordedBy).trim()) {
      return new Response(JSON.stringify({ error: "กรุณาระบุผู้บันทึกรายการนี้" }), { status: 400 });
    }
    const numCharge = Number(chargeAmount);
    if (!Number.isFinite(numCharge) || numCharge < 0) {
      return new Response(JSON.stringify({ error: "จำนวนเงินที่เก็บไม่ถูกต้อง" }), { status: 400 });
    }
    const numEmployeeCharge = Number(employeeCharge);
    const finalEmployeeCharge = Number.isFinite(numEmployeeCharge) && numEmployeeCharge >= 0 ? numEmployeeCharge : numCharge;

    await addShrinkageCharge({
      id: `shrink_${Date.now()}`,
      timestamp: new Date().toISOString(),
      drinkId,
      drinkName: drinkName || drink.name,
      periodLabel: periodLabel || null,
      chargeAmount: numCharge,
      employees: employeesList,
      employeeCharge: finalEmployeeCharge,
      recordedBy: String(recordedBy).trim(),
      note: note ? String(note).trim() : "",
    });

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

export const config = { path: "/api/shrinkage-charge" };
