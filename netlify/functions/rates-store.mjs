// จัดการอัตราค่าบริการตามเวลา (คาราโอเกะ + ห้องประชุม) แบบไดนามิก แก้ไขราคาได้จากในแอปเอง
// เก็บใน Netlify Blobs โดย seed ค่าเริ่มต้นครั้งแรกที่เรียกใช้
import { getStore } from "@netlify/blobs";

const ratesStore = () => getStore({ name: "drink-tracker-rates", consistency: "strong" });

// ค่าเริ่มต้น (บาท/ชั่วโมง) ตามกลุ่มห้อง — key ต้องตรงกับ loc.group ของแต่ละห้อง/โต๊ะ
const DEFAULT_RATES = {
  karaoke: {
    "ห้องแอร์ 1": 180,
    "ห้องแอร์ 2": 160,
    "ห้องแอร์ 3": 150,
    "ด้านบน": 180,
  },
  meeting: {
    "ห้องแอร์ 1": 180,
    "ห้องแอร์ 2": 160,
    "ห้องแอร์ 3": 150,
    "ด้านบน": 180,
  },
};

export async function getRates() {
  const store = ratesStore();
  let rates = await store.get("rates", { type: "json" });
  if (!rates || typeof rates !== "object") {
    rates = JSON.parse(JSON.stringify(DEFAULT_RATES));
    await store.setJSON("rates", rates);
  }
  if (!rates.karaoke) rates.karaoke = {};
  if (!rates.meeting) rates.meeting = {};
  return rates;
}

export async function saveRates(rates) {
  await ratesStore().setJSON("rates", rates);
}
