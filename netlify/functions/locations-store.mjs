// จัดการรายการห้อง/โต๊ะแบบไดนามิก (เพิ่ม/แก้ไข/ลบได้จากในแอปเอง)
// เก็บใน Netlify Blobs โดย seed ค่าเริ่มต้นจาก shared-data.mjs ครั้งแรกที่เรียกใช้
import { getStore } from "@netlify/blobs";
import { LOCATIONS as DEFAULT_LOCATIONS } from "./shared-data.mjs";

const locationsListStore = () => getStore({ name: "drink-tracker-locations-list", consistency: "strong" });

export async function getLocationsList() {
  const store = locationsListStore();
  let locs = await store.get("locations", { type: "json" });
  if (!locs || !Array.isArray(locs) || !locs.length) {
    locs = DEFAULT_LOCATIONS.map((l) => ({ ...l }));
    await store.setJSON("locations", locs);
  }
  return locs;
}

export async function saveLocationsList(locs) {
  await locationsListStore().setJSON("locations", locs);
}
