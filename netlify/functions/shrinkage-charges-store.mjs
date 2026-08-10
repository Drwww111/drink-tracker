import { getStore } from "@netlify/blobs";

const shrinkageStore = () => getStore({ name: "drink-tracker-shrinkage-charges", consistency: "strong" });

export async function getShrinkageCharges() {
  const log = await shrinkageStore().get("log", { type: "json" });
  return log || [];
}

export async function addShrinkageCharge(entry) {
  const store = shrinkageStore();
  const existing = (await store.get("log", { type: "json" })) || [];
  existing.push(entry);
  const trimmed = existing.slice(-2000); // เก็บยาวขึ้น เพราะใช้ทำสรุปยอดเก็บเงินสต็อกหายย้อนหลังได้หลายเดือน
  await store.setJSON("log", trimmed);
  return trimmed;
}

// ลบรายการเก็บเงินสต็อกหายทิ้ง (เช่น บันทึกซ้ำเพราะกดบันทึกหลายครั้งตอนระบบมีปัญหา)
export async function deleteShrinkageCharge(id) {
  const store = shrinkageStore();
  const existing = (await store.get("log", { type: "json" })) || [];
  const filtered = existing.filter((c) => c.id !== id);
  await store.setJSON("log", filtered);
  return filtered;
}
