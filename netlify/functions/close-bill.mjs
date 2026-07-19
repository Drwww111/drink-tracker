import { getStore } from "@netlify/blobs";
import { DRINKS, LOCATIONS } from "./shared-data.mjs";

const locationsStore = () => getStore("drink-tracker-locations");
const stockStore = () => getStore("drink-tracker-stock");

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

    const { locationId } = body || {};
    if (!locationId || !LOCATIONS.some((l) => l.id === locationId)) {
      return new Response(JSON.stringify({ error: "ไม่พบห้อง/โต๊ะนี้" }), { status: 400 });
    }

    const lStore = locationsStore();
    const locState = (await lStore.get(locationId, { type: "json" })) || { openBill: null, history: [] };

    if (locState.openBill && locState.openBill.rounds && locState.openBill.rounds.length) {
      locState.history = locState.history || [];
      locState.history.push({ ...locState.openBill, closedAt: new Date().toISOString() });
    }
    locState.openBill = null;

    await lStore.setJSON(locationId, locState);

    const locations = {};
    for (const loc of LOCATIONS) {
      locations[loc.id] =
        loc.id === locationId ? locState : (await lStore.get(loc.id, { type: "json" })) || { openBill: null, history: [] };
    }
    const sStore = stockStore();
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
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err && err.message ? err.message : err) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const config = { path: "/api/close-bill" };
