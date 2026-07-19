import { getStore } from "@netlify/blobs";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { DRINKS, LOCATIONS } = require("../../data.js");

const locationsStore = () => getStore({ name: "drink-tracker-locations", consistency: "strong" });
const stockStore = () => getStore({ name: "drink-tracker-stock", consistency: "strong" });

export default async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "รูปแบบข้อมูลไม่ถูกต้อง" }), { status: 400 });
  }

  const { drinkId, mode, value } = body || {};
  if (!drinkId || !["set", "add"].includes(mode)) {
    return new Response(JSON.stringify({ error: "ข้อมูลไม่ถูกต้อง" }), { status: 400 });
  }

  const sStore = stockStore();
  const current = await sStore.get(drinkId, { type: "json" });
  const currentNum = typeof current === "number" ? current : 0;
  const num = Number(value) || 0;
  const next = mode === "set" ? num : currentNum + num;
  await sStore.setJSON(drinkId, next);

  const locations = {};
  const lStore = locationsStore();
  for (const loc of LOCATIONS) {
    locations[loc.id] = (await lStore.get(loc.id, { type: "json" })) || { openBill: null, history: [] };
  }
  const stock = {};
  for (const d of DRINKS) {
    if (d.trackStock) {
      const v = await sStore.get(d.id, { type: "json" });
      stock[d.id] = typeof v === "number" ? v : 0;
    }
  }

  return new Response(JSON.stringify({ locations, stock }), {
    headers: { "Content-Type": "application/json" },
  });
};

export const config = { path: "/api/stock" };
