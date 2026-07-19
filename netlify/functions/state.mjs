import { getStore } from "@netlify/blobs";
import { DRINKS, LOCATIONS } from "./shared-data.mjs";

const locationsStore = () => getStore("drink-tracker-locations");
const stockStore = () => getStore("drink-tracker-stock");
const roomStockStore = () => getStore("drink-tracker-room-stock");

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

async function getRoomStockValue(locationId) {
  const store = roomStockStore();
  const data = await store.get(locationId, { type: "json" });
  return data || {};
}

export default async () => {
  try {
    const locEntries = await Promise.all(
      LOCATIONS.map(async (loc) => [loc.id, await getLocationState(loc.id)])
    );
    const locations = Object.fromEntries(locEntries);

    const stockEntries = await Promise.all(
      DRINKS.filter((d) => d.trackStock).map(async (d) => [d.id, await getStockValue(d.id)])
    );
    const stock = Object.fromEntries(stockEntries);

    const roomEntries = await Promise.all(
      LOCATIONS.map(async (loc) => [loc.id, await getRoomStockValue(loc.id)])
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

export const config = { path: "/api/state" };
