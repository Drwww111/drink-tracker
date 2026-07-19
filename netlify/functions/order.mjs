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

    const { locationId, employee, items, emptyCounts, timestamp, editRoundId } = body || {};
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
      };
    });

    const roundTotal = normalizedItems.reduce((s, i) => s + i.lineTotal, 0);

    const lStore = locationsStore();
    const locState = (await lStore.get(locationId, { type: "json" })) || { openBill: null, history: [] };

    // เก็บ qty เดิมของแต่ละเครื่องดื่มไว้เผื่อเป็นการแก้ไข (ต้องคืนสต็อกเก่าก่อนหักใหม่)
    let oldQtyByDrink = {};

    if (editRoundId) {
      if (!locState.openBill) {
        return new Response(JSON.stringify({ error: "ไม่พบบิลที่เปิดอยู่ของห้อง/โต๊ะนี้" }), { status: 400 });
      }
      const idx = locState.openBill.rounds.findIndex((r) => r.id === editRoundId);
      if (idx === -1) {
        return new Response(JSON.stringify({ error: "ไม่พบรายการที่จะแก้ไข (อาจถูกปิดบิลไปแล้ว)" }), { status: 400 });
      }
      const oldRound = locState.openBill.rounds[idx];
      for (const i of oldRound.items) {
        oldQtyByDrink[i.id] = (oldQtyByDrink[i.id] || 0) + Number(i.qty || 0);
      }
      const updatedRound = {
        ...oldRound,
        employee,
        items: normalizedItems,
        emptyCounts: emptyCounts || {},
        roundTotal,
        editedAt: new Date().toISOString(),
      };
      locState.openBill.rounds[idx] = updatedRound;
    } else {
      const round = {
        id: `round_${Date.now()}`,
        timestamp: timestamp || new Date().toISOString(),
        employee,
        items: normalizedItems,
        emptyCounts: emptyCounts || {},
        roundTotal,
      };
      if (!locState.openBill) {
        locState.openBill = {
          id: `bill_${Date.now()}`,
          openedAt: round.timestamp,
          rounds: [],
        };
      }
      locState.openBill.rounds.push(round);
    }

    await lStore.setJSON(locationId, locState);

    // ปรับสต็อก: ถ้าเป็นการแก้ไข ให้คืนจำนวนเดิมก่อนแล้วค่อยหักจำนวนใหม่ (สุทธิ = เก่า - ใหม่)
    const sStore = stockStore();
    const newQtyByDrink = {};
    for (const i of normalizedItems) newQtyByDrink[i.id] = (newQtyByDrink[i.id] || 0) + i.qty;
    const affectedIds = new Set([...Object.keys(oldQtyByDrink), ...Object.keys(newQtyByDrink)]);
    for (const id of affectedIds) {
      const drink = DRINKS.find((d) => d.id === id);
      if (drink && drink.trackStock) {
        const delta = (oldQtyByDrink[id] || 0) - (newQtyByDrink[id] || 0);
        if (delta !== 0) {
          const current = await getStockValue(id);
          await sStore.setJSON(id, current + delta);
        }
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

export const config = { path: "/api/order" };
