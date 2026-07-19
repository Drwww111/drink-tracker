// จัดการเมนูเครื่องดื่มแบบไดนามิก (แก้ไข/เพิ่ม/ซ่อน/กู้คืน ได้จากในแอปเอง)
// เก็บใน Netlify Blobs โดย seed ค่าเริ่มต้นจาก shared-data.mjs ครั้งแรกที่เรียกใช้
import { getStore } from "@netlify/blobs";
import { DRINKS as DEFAULT_DRINKS } from "./shared-data.mjs";

const menuStore = () => getStore({ name: "drink-tracker-menu", consistency: "strong" });

export async function getDrinksMenu() {
  const store = menuStore();
  let drinks = await store.get("drinks", { type: "json" });
  if (!drinks || !Array.isArray(drinks) || !drinks.length) {
    drinks = DEFAULT_DRINKS.map((d) => ({ ...d, image: d.image || null, active: true }));
    await store.setJSON("drinks", drinks);
  }
  return drinks;
}

export async function saveDrinksMenu(drinks) {
  await menuStore().setJSON("drinks", drinks);
}
