import { getStore } from "@netlify/blobs";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { DRINKS, LOCATIONS } = require("../../data.js");

const locationsStore = () => getStore("drink-tracker-locations");
const stockStore = () => getStore("drink-tracker-stock");

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
  try {
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
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err && err.message ? err.message : err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const config = { path: "/api/state" };
