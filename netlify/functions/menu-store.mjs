// จัดการเมนูเครื่องดื่มแบบไดนามิก (แก้ไข/เพิ่ม/ซ่อน/กู้คืน ได้จากในแอปเอง)
// เก็บใน Netlify Blobs โดย seed ค่าเริ่มต้นจาก shared-data.mjs ครั้งแรกที่เรียกใช้
import { getStore } from "@netlify/blobs";
import { DRINKS as DEFAULT_DRINKS } from "./shared-data.mjs";

const menuStore = () => getStore({ name: "drink-tracker-menu", consistency: "strong" });

function normalizeDrink(d) {
  // กันข้อมูลเก่า/ที่บันทึกไว้ตอนโค้ดยังไม่สมบูรณ์ ไม่ให้ unit/category ว่างเป็น undefined ไปแสดงผลฝั่งหน้าเว็บ
  return {
    ...d,
    unit: d.unit || "ขวด",
    category: d.category || "อื่นๆ",
    icon: d.icon || null,
    image: d.image || null,
    active: d.active !== false,
    cost: typeof d.cost === "number" ? d.cost : Number(d.cost) || 0,
  };
}

export async function getDrinksMenu() {
  const store = menuStore();
  let drinks = await store.get("drinks", { type: "json" });
  if (!drinks || !Array.isArray(drinks) || !drinks.length) {
    drinks = DEFAULT_DRINKS.map((d) => ({ ...d, image: d.image || null, active: true }));
    await store.setJSON("drinks", drinks);
  }
  return drinks.map(normalizeDrink);
}

export async function saveDrinksMenu(drinks) {
  await menuStore().setJSON("drinks", drinks);
}
