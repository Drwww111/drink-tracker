// จัดการค่าตั้งค่าทั่วไปของระบบ (เช่น เปิด/ปิดการสั่งเครื่องดื่มด้วยเสียง) ตั้งโดย CEO เท่านั้น
// เก็บใน Netlify Blobs โดย seed ค่าเริ่มต้นครั้งแรกที่เรียกใช้
import { getStore } from "@netlify/blobs";

const settingsStore = () => getStore({ name: "drink-tracker-settings", consistency: "strong" });

const DEFAULT_SETTINGS = {
  voiceOrderEnabled: false, // ปิดไว้เป็นค่าเริ่มต้น จนกว่า CEO จะเปิดใช้งานเอง
  ceoPin: "254325", // รหัสผ่าน CEO (ดูยอดเงิน/ประวัติรายรับ) - เปลี่ยนได้จากหน้า "อัตราค่าบริการ"
  staffPin: "5656", // รหัสผ่านพนักงานเข้าแอป (กันคนนอกองค์กร) - เปลี่ยนได้จากหน้า "อัตราค่าบริการ"
};

export async function getSettings() {
  const store = settingsStore();
  let settings = await store.get("settings", { type: "json" });
  if (!settings || typeof settings !== "object") {
    settings = { ...DEFAULT_SETTINGS };
    await store.setJSON("settings", settings);
  }
  return { ...DEFAULT_SETTINGS, ...settings };
}

export async function saveSettings(partial) {
  const current = await getSettings();
  const merged = { ...current, ...partial };
  await settingsStore().setJSON("settings", merged);
  return merged;
}
