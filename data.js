// ===== ข้อมูลตั้งต้นของแอป: ห้อง/โต๊ะ, พนักงาน, เมนูเครื่องดื่ม =====
// ไฟล์นี้ใช้ร่วมกันทั้งฝั่งหน้าเว็บ (app.js) และฝั่งฟังก์ชัน (netlify/functions)

const LOCATIONS = [
  { id: "air1_group", group: "ห้องแอร์ 1", label: "ห้องแอร์ 1 (จัดเลี้ยงกลุ่มเดียว)" },
  { id: "air1_t1", group: "ห้องแอร์ 1", label: "ห้องแอร์ 1 โต๊ะ 1" },
  { id: "air1_t2", group: "ห้องแอร์ 1", label: "ห้องแอร์ 1 โต๊ะ 2" },
  { id: "air1_t3", group: "ห้องแอร์ 1", label: "ห้องแอร์ 1 โต๊ะ 3" },
  { id: "air1_t4", group: "ห้องแอร์ 1", label: "ห้องแอร์ 1 โต๊ะ 4" },
  { id: "air1_t5", group: "ห้องแอร์ 1", label: "ห้องแอร์ 1 โต๊ะ 5" },
  { id: "air2", group: "ห้องแอร์ 2", label: "ห้องแอร์ 2" },
  { id: "air3", group: "ห้องแอร์ 3", label: "ห้องแอร์ 3" },
  { id: "up_group", group: "ด้านบน", label: "ด้านบน (จัดเลี้ยงกลุ่มเดียว)" },
  { id: "up_t1", group: "ด้านบน", label: "โต๊ะ 1 นอก" },
  { id: "up_t2", group: "ด้านบน", label: "โต๊ะ 2 นอก" },
  { id: "up_t3", group: "ด้านบน", label: "โต๊ะ 3 นอก" },
  { id: "up_t4", group: "ด้านบน", label: "โต๊ะ 4 นอก" },
  { id: "up_t5", group: "ด้านบน", label: "โต๊ะ 5 นอก" },
  { id: "up_t6", group: "ด้านบน", label: "โต๊ะ 6 นอก" },
  { id: "up_t7", group: "ด้านบน", label: "โต๊ะ 7 นอก" },
  { id: "up_t8", group: "ด้านบน", label: "โต๊ะ 8 นอก" },
];

const STAFF = [
  "นุ้ย", "แบงค์", "ยูริ", "โอปอล์", "สั้น", "พร",
  "มีน", "เซนต์", "แม่แดง", "หยอย", "แมว", "อารุณ",
];

// category ใช้จัดกลุ่มแสดงผลในฟอร์ม, icon เป็น emoji ธรรมดา (ไม่ใช้โลโก้แบรนด์จริง)
// allowFree = true หมายถึงพนักงานสามารถกดปุ่ม "ฟรี" ให้รายการนั้นเป็น 0 บาทได้เอง
// trackStock = true หมายถึงเป็นเครื่องดื่มของร้านเอง ต้องนับสต็อกคงเหลือ
// (ยกเว้นหมวด "นำเข้าเอง" ที่ลูกค้านำเข้ามาเอง ร้านไม่ได้ซื้อสต็อกไว้ จึงไม่นับสต็อก)
const DRINKS = [
  { id: "singha", name: "เบียร์สิงห์", price: 100, unit: "ขวด/กระป๋อง", icon: "🍺", category: "เบียร์", trackStock: true },
  { id: "chang", name: "เบียร์ช้าง", price: 80, unit: "ขวด/กระป๋อง", icon: "🍺", category: "เบียร์", trackStock: true },
  { id: "heineken", name: "เบียร์ไฮเนเก้น", price: 110, unit: "ขวด/กระป๋อง", icon: "🍺", category: "เบียร์", trackStock: true },
  { id: "leo", name: "เบียร์ลีโอ", price: 100, unit: "ขวด/กระป๋อง", icon: "🍺", category: "เบียร์", trackStock: true },

  { id: "regency_flat", name: "รีเจนซี แบน", price: 500, unit: "ขวด", icon: "🥃", category: "เหล้า/สุรา", trackStock: true },
  { id: "hong_round", name: "หงส์ กลม", price: 360, unit: "ขวด", icon: "🥃", category: "เหล้า/สุรา", trackStock: true },
  { id: "sangsom_round", name: "แสงโสม กลม", price: 380, unit: "ขวด", icon: "🥃", category: "เหล้า/สุรา", trackStock: true },

  { id: "import_beer_bottle", name: "นำเข้าเบียร์ (ขวด)", price: 20, unit: "ขวด", icon: "🍾", category: "นำเข้าเอง", allowFree: true },
  { id: "import_beer_case", name: "นำเข้าเบียร์ (ลัง)", price: 200, unit: "ลัง", icon: "📦", category: "นำเข้าเอง", allowFree: true },
  { id: "import_liquor_round", name: "เหล้านำเข้า กลม", price: 100, unit: "ขวด", icon: "🥃", category: "นำเข้าเอง", allowFree: true },
  { id: "import_liquor_flat", name: "เหล้านำเข้า แบน", price: 50, unit: "ขวด", icon: "🥃", category: "นำเข้าเอง", allowFree: true },

  { id: "schweppes", name: "ชเวปส์", price: 35, unit: "ขวด", icon: "🥤", category: "น้ำอัดลม/เครื่องดื่ม", trackStock: true },
  { id: "splash", name: "สแปลช", price: 35, unit: "ขวด", icon: "🥤", category: "น้ำอัดลม/เครื่องดื่ม", trackStock: true },
  { id: "singha_lemon_soda", name: "สิงห์ เลม่อน โซดา", price: 35, unit: "ขวด", icon: "🥤", category: "น้ำอัดลม/เครื่องดื่ม", trackStock: true },
  { id: "soft_small", name: "อัดลม เล็ก", price: 25, unit: "ขวด", icon: "🥤", category: "น้ำอัดลม/เครื่องดื่ม", trackStock: true },
  { id: "soft_large", name: "อัดลม ใหญ่", price: 49, unit: "ขวด", icon: "🥤", category: "น้ำอัดลม/เครื่องดื่ม", trackStock: true },
  { id: "spy", name: "สปาย", price: 15, unit: "ขวด", icon: "🥤", category: "น้ำอัดลม/เครื่องดื่ม", trackStock: true },

  { id: "soda", name: "โซดา", price: 20, unit: "ขวด", icon: "🫧", category: "โซดา/น้ำแข็ง", trackStock: true },
  { id: "ice_small", name: "น้ำแข็ง เล็ก", price: 20, unit: "ถุง", icon: "🧊", category: "โซดา/น้ำแข็ง", trackStock: true },
  { id: "ice_large", name: "น้ำแข็ง ใหญ่", price: 25, unit: "ถุง", icon: "🧊", category: "โซดา/น้ำแข็ง", trackStock: true },

  { id: "water_small", name: "น้ำดื่ม เล็ก", price: 15, unit: "ขวด", icon: "💧", category: "น้ำดื่ม", trackStock: true },
  { id: "water_large", name: "น้ำดื่ม ใหญ่", price: 30, unit: "ขวด", icon: "💧", category: "น้ำดื่ม", trackStock: true },
];

// คำนวณราคารวมของ 1 รายการในรอบสั่ง
function calcLineTotal(drink, qty, free) {
  const q = Number(qty) || 0;
  if (free) return 0;
  return q * drink.price;
}

if (typeof module !== "undefined") {
  module.exports = { LOCATIONS, STAFF, DRINKS, calcLineTotal };
}
