import { getStore } from "@netlify/blobs";
import { DRINKS, LOCATIONS } from "./shared-data.mjs";

const locationsStore = () => getStore("drink-tracker-locations");
const stockStore = () => getStore("drink-tracker-stock");

async function getStockValue(drinkId) {
  const store = stockStore();
  const data = await store.get(drinkId, { type: "json" });
  return typeof data === "number" ? data : 0;
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

    const { locationId, employee, items, emptyCounts, timestamp } = body || {};
    if (!locationId || !employee || !Array.isArray(items) || !items.length) {
      return new Response(JSON.stringify({ error: "ข้อมูลไม่ครบ กรุณาเลือกพนักงานและจำนวนเครื่องดื่ม" }), {
        status: 400,
      });
    }
    if (!LOCATIONS.some((l) => l.id === locationId)) {
      return new Response(JSON.stringify({ error: "ไม่พบห้อง/โต๊ะนี้" }), { status: 400 });
    }

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
