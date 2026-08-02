import { getStore } from "@netlify/blobs";

const debtPlanStore = () => getStore({ name: "drink-tracker-shrinkage-debt-plans", consistency: "strong" });

// แผนหักเงินรายวัน (ผ่อนจ่ายค่าของหายเป็นรายวัน แทนที่จะเก็บทีเดียว)
// { id, createdAt, createdBy, drinkId, drinkName, note, totalAmount, employees: [name,...],
//   dailyAmountPerPerson, deductions: [{ date, employee, amount, recordedBy, timestamp }] }
export async function getShrinkageDebtPlans() {
  const log = await debtPlanStore().get("log", { type: "json" });
  return log || [];
}

export async function addShrinkageDebtPlan(plan) {
  const store = debtPlanStore();
  const existing = (await store.get("log", { type: "json" })) || [];
  existing.push(plan);
  const trimmed = existing.slice(-500);
  await store.setJSON("log", trimmed);
  return trimmed;
}

// บันทึกการหักเงินของวันหนึ่ง (หลายคนพร้อมกันได้) เข้าไปในแผนที่มีอยู่แล้ว ตามชื่อ planId
export async function addShrinkageDebtDeductions(planId, entries) {
  const store = debtPlanStore();
  const existing = (await store.get("log", { type: "json" })) || [];
  const plan = existing.find((p) => p.id === planId);
  if (!plan) {
    throw new Error("ไม่พบแผนหักเงินนี้ (อาจถูกลบไปแล้ว)");
  }
  if (!Array.isArray(plan.deductions)) plan.deductions = [];
  for (const entry of entries) {
    plan.deductions.push(entry);
  }
  await store.setJSON("log", existing);
  return existing;
}
