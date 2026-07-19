// จัดการรายชื่อพนักงานแบบไดนามิก (เพิ่ม/แก้ไข/ซ่อน/กู้คืนได้จากในแอปเอง)
import { getStore } from "@netlify/blobs";
import { STAFF as DEFAULT_STAFF } from "./shared-data.mjs";

const staffStore = () => getStore({ name: "drink-tracker-staff", consistency: "strong" });

function slugifyName(name, idx) {
  return "staff_" + idx + "_" + Date.now();
}

export async function getStaffList() {
  const store = staffStore();
  let staff = await store.get("staff", { type: "json" });
  if (!staff || !Array.isArray(staff) || !staff.length) {
    staff = DEFAULT_STAFF.map((name, idx) => ({ id: slugifyName(name, idx), name, active: true }));
    await store.setJSON("staff", staff);
  }
  return staff;
}

export async function saveStaffList(staff) {
  await staffStore().setJSON("staff", staff);
}
