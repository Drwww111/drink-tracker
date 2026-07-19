import { getStore } from "@netlify/blobs";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { DRINKS, LOCATIONS } = require("../../data.js");

// เก็บข้อมูลแยกคีย์ต่อห้อง/โต๊ะ และแยกคีย์ต่อเครื่องดื่ม 1 ชนิด
// เพื่อลดโอกาสข้อมูลชนกันเวลามีหลายเครื่องบันทึกพร้อมกันคนละห้อง/คนละเครื่องดื่ม
const locationsStore = () => getStore({ name: "drink-tracker-locations", consistency: "strong" });
const stockStore = () => getStore({ name: "drink-tracker-stock", consistency: "strong" });

async function getLocationState(locationId) {
  const store = locationsStore();
  const data = await store.get(locationId, { type: "json" });
  return data || { openBill: null, history: [] };
}

async function getStockValue(drinkId) {
  const store = stockStore();
  const data = await store.get(drinkId, { type: "json" });
  return typeof data === "number" ? data : 0;
}

export default async () => {
  const locations = {};
  for (const loc of LOCATIONS) {
    locations[loc.id] = await getLocationState(loc.id);
  }
  const stock = {};
  for (const d of DRINKS) {
    if (d.trackStock) stock[d.id] = await getStockValue(d.id);
  }
  return new Response(JSON.stringify({ locations, stock }), {
    headers: { "Content-Type": "application/json" },
  });
};

export const config = { path: "/api/state" };
