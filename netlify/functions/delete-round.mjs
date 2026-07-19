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

    const { locationId, roundId } = body || {};
    if (!locationId || !roundId || !LOCATIONS.some((l) => l.id === locationId)) {
      return new Response(JSON.stringify({ error: "ข้อมูลไม่ถูกต้อง" }), { status: 400 });
    }

    const lStore = locationsStore();
    const locState = (await lStore.get(locationId, { type: "json" })) || { openBill: null, history: [] };

    if (!locState.openBill) {
      return new Response(JSON.stringify({ error: "ไม่พบบิลที่เปิดอยู่ของห้อง/โต๊ะนี้" }), { status: 400 });
    }
    const idx = locState.openBill.rounds.findIndex((r) => r.id === roundId);
    if (idx === -1) {
      return new Response(JSON.stringify({ error: "ไม่พบรายการนี้ (อาจถูกลบไปแล้ว)" }), { status: 400 });
    }

    const [removedRound] = locState.openBill.rounds.splice(idx, 1);
    await lStore.setJSON(locationId, locState);

    // คืนสต็อกของทุกเครื่องดื่มในรายการที่ลบ (ลูกค้าเอาคืน ของยังอยู่ครบเหมือนไม่ได้นำไป)
    const sStore = stockStore();
    for (const i of removedRound.items) {
      const drink = DRINKS.find((d) => d.id === i.id);
      if (drink && drink.trackStock) {
        const current = await getStockValue(i.id);
        await sStore.setJSON(i.id, current + Number(i.qty || 0));
      }
    }

    const locEntries = await Promise.all(
      LOCATIONS.map(async (loc) => [
        loc.id,
        loc.id === locationId ? locState : (await lStore.get(loc.id, { type: "json" })) || { openBill: null, history: [] },
      ])
    );
    const locations = Object.fromEntries(locEntries);

    const stockEntries = await Promise.all(
      DRINKS.filter((d) => d.trackStock).map(async (d) => [d.id, await getStockValue(d.id)])
    );
    const stock = Object.fromEntries(stockEntries);

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

export const config = { path: "/api/delete-round" };
