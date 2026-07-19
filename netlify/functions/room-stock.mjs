import { getStore } from "@netlify/blobs";
import { DRINKS, LOCATIONS } from "./shared-data.mjs";

const locationsStore = () => getStore("drink-tracker-locations");
const stockStore = () => getStore("drink-tracker-stock");
const roomStockStore = () => getStore("drink-tracker-room-stock");

async function getStockValue(drinkId) {
  const data = await stockStore().get(drinkId, { type: "json" });
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

    const { locationId, items } = body || {};
    if (!locationId || !LOCATIONS.some((l) => l.id === locationId) || typeof items !== "object" || items === null) {
      return new Response(JSON.stringify({ error: "ข้อมูลไม่ถูกต้อง" }), { status: 400 });
    }

    // เก็บเฉพาะรายการที่จำนวน > 0 และเป็นเครื่องดื่มที่มีอยู่จริง
    const cleaned = {};
    for (const id in items) {
      const qty = Number(items[id]) || 0;
      if (qty > 0 && DRINKS.some((d) => d.id === id)) cleaned[id] = qty;
    }

    const rStore = roomStockStore();
    await rStore.setJSON(locationId, cleaned);

    const lStore = locationsStore();
    const locEntries = await Promise.all(
      LOCATIONS.map(async (loc) => [loc.id, (await lStore.get(loc.id, { type: "json" })) || { openBill: null, history: [] }])
    );
    const locations = Object.fromEntries(locEntries);

    const stockEntries = await Promise.all(
      DRINKS.filter((d) => d.trackStock).map(async (d) => [d.id, await getStockValue(d.id)])
    );
    const stock = Object.fromEntries(stockEntries);

    const roomEntries = await Promise.all(
      LOCATIONS.map(async (loc) => [
        loc.id,
        loc.id === locationId ? cleaned : (await rStore.get(loc.id, { type: "json" })) || {},
      ])
    );
    const roomStock = Object.fromEntries(roomEntries);

    return new Response(JSON.stringify({ locations, stock, roomStock }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err && err.message ? err.message : err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const config = { path: "/api/room-stock" };
