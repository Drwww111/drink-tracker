// จัดการเมนูเครื่องดื่มแบบไดนามิก (แก้ไข/เพิ่ม/ซ่อน/กู้คืน ได้จากในแอปเอง)
// เก็บใน Netlify Blobs โดย seed ค่าเริ่มต้นจาก shared-data.mjs ครั้งแรกที่เรียกใช้
import { getStore } from "@netlify/blobs";
import { DRINKS as DEFAULT_DRINKS } from "./shared-data.mjs";

const menuStore = () => getStore({ name: "drink-tracker-menu", consistency: "strong" });

// รายการคำที่ใช้เดา default ของ "แสดงในการ์ดนับสต็อกใหม่ในห้อง" ให้ครั้งแรกที่เพิ่ม field นี้เข้าระบบ
// (ใช้แค่ครั้งเดียวตอนยังไม่เคยตั้งค่า roomCard มาก่อน หลังจากนั้นค่าที่ CEO/พนักงานตั้งเองจะถูกเก็บไว้ถาวรและไม่เดาซ้ำอีก)
const ROOM_CARD_DEFAULT_KEYWORDS = ["น้ำดื่ม", "โค้ก ซีโร่", "โค้กซีโร่", "coke zero", "สแปลช", "ชเวปส์", "สิงห์ เลม่อน", "สิงห์เลม่อน"];
function guessRoomCardDefault(d) {
  const name = (d.name || "").toLowerCase();
  return ROOM_CARD_DEFAULT_KEYWORDS.some((kw) => name.includes(kw.toLowerCase()));
}

export function normalizeDrink(d) {
  // กันข้อมูลเก่า/ที่บันทึกไว้ตอนโค้ดยังไม่สมบูรณ์ ไม่ให้ unit/category ว่างเป็น undefined ไปแสดงผลฝั่งหน้าเว็บ
  return {
    ...d,
    unit: d.unit || "ขวด",
    category: d.category || "อื่นๆ",
    icon: d.icon || null,
    image: d.image || null,
    active: d.active !== false,
    cost: typeof d.cost === "number" ? d.cost : Number(d.cost) || 0,
    roomCard: typeof d.roomCard === "boolean" ? d.roomCard : guessRoomCardDefault(d),
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
