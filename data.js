// ===== ข้อมูลตั้งต้นของแอป: ห้อง/โต๊ะ =====
// ไฟล์นี้ใช้ฝั่งหน้าเว็บ (app.js)
// หมายเหตุ: เมนูเครื่องดื่ม (DRINKS) และรายชื่อพนักงาน (STAFF) ย้ายไปเก็บแบบไดนามิกใน
// Netlify Blobs แล้ว (แก้ไข/เพิ่ม/ซ่อนได้จากในแอปเอง ผ่านหน้า "จัดการเมนู" และ "จัดการพนักงาน")
// ค่าเริ่มต้น (seed) ของทั้งสองอย่างอยู่ที่ netlify/functions/shared-data.mjs

// รายการห้อง/โต๊ะเริ่มต้น (ใช้ตอนหน้าเว็บยังโหลดข้อมูลจริงจากเซิร์ฟเวอร์ไม่เสร็จ)
// หลังจากโหลด STATE ได้แล้ว app.js จะอัปเดตตัวแปรนี้ให้ตรงกับ STATE.locationsList เสมอ
// (แก้ไข/เพิ่ม/ลบห้อง-โต๊ะได้จากหน้า "จัดการห้อง/โต๊ะ" ในแอป — ค่าเริ่มต้นด้านล่างนี้ใช้ seed ครั้งแรกเท่านั้น)
let LOCATIONS = [
  { id: "air1_group", group: "ห้องแอร์ 1", label: "ห้องแอร์ 1 (จัดเลี้ยงกลุ่มเดียว)" },
  { id: "air1_t1", group: "ห้องแอร์ 1", label: "ห้องแอร์ 1 โต๊ะ 1" },
  { id: "air1_t2", group: "ห้องแอร์ 1", label: "ห้องแอร์ 1 โต๊ะ 2" },
  { id: "air1_t3", group: "ห้องแอร์ 1", label: "ห้องแอร์ 1 โต๊ะ 3" },
  { id: "air1_t4", group: "ห้องแอร์ 1", label: "ห้องแอร์ 1 โต๊ะ 4" },
  { id: "air1_t5", group: "ห้องแอร์ 1", label: "ห้องแอร์ 1 โต๊ะ 5" },
  { id: "air2", group: "ห้องแอร์ 2", label: "ห้องแอร์ 2" },
  { id: "air3", group: "ห้องแอร์ 3", label: "ห้องแอร์ 3" },
  { id: "up_group", group: "ด้านบน", label: "ด้านบน (จัดเลี้ยงกลุ่มเดียว)" },
  { id: "up_t1", group: "โต๊ะนอก", label: "โต๊ะ 1 นอก" },
  { id: "up_t2", group: "โต๊ะนอก", label: "โต๊ะ 2 นอก" },
  { id: "up_t3", group: "โต๊ะนอก", label: "โต๊ะ 3 นอก" },
  { id: "up_t4", group: "โต๊ะนอก", label: "โต๊ะ 4 นอก" },
  { id: "up_t5", group: "โต๊ะนอก", label: "โต๊ะ 5 นอก" },
  { id: "up_t6", group: "โต๊ะนอก", label: "โต๊ะ 6 นอก" },
  { id: "up_t7", group: "โต๊ะนอก", label: "โต๊ะ 7 นอก" },
  { id: "up_t8", group: "โต๊ะนอก", label: "โต๊ะ 8 นอก" },
];

// คำนวณราคารวมของ 1 รายการในรอบสั่ง
function calcLineTotal(drink, qty, free) {
  const q = Number(qty) || 0;
  if (free) return 0;
  return q * drink.price;
}

if (typeof module !== "undefined") {
  module.exports = { LOCATIONS, calcLineTotal };
}
