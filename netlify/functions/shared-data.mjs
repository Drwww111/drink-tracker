// สำเนาข้อมูลห้อง/โต๊ะ และเมนูเครื่องดื่ม สำหรับใช้ฝั่งเซิร์ฟเวอร์ (Netlify Functions) เท่านั้น
// (เก็บแยกจาก data.js ที่ root เพราะฟังก์ชันต้อง import แบบ static ให้ bundler รวมไฟล์ได้ถูกต้อง)

export const LOCATIONS = [
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

export const STAFF = [
  "นุ้ย", "แบงค์", "ยูริ", "โอปอล์", "สั้น", "พร",
  "มีน", "เซนต์", "แม่แดง", "หยอย", "แมว", "อารุณ",
];

export const DRINKS = [
  { id: "singha", name: "เบียร์สิงห์", price: 100, trackStock: true },
  { id: "chang", name: "เบียร์ช้าง", price: 80, trackStock: true },
  { id: "heineken", name: "เบียร์ไฮเนเก้น", price: 110, trackStock: true },
  { id: "leo", name: "เบียร์ลีโอ", price: 100, trackStock: true },

  { id: "regency_flat", name: "รีเจนซี แบน", price: 500, trackStock: true },
  { id: "hong_round", name: "หงส์ กลม", price: 360, trackStock: true },
  { id: "sangsom_round", name: "แสงโสม กลม", price: 380, trackStock: true },

  { id: "import_beer_bottle", name: "นำเข้าเบียร์ (ขวด)", price: 20 },
  { id: "import_beer_case", name: "นำเข้าเบียร์ (ลัง)", price: 200 },
  { id: "import_liquor_round", name: "เหล้านำเข้า กลม", price: 100 },
  { id: "import_liquor_flat", name: "เหล้านำเข้า แบน", price: 50 },

  { id: "schweppes", name: "ชเวปส์", price: 35, trackStock: true },
  { id: "splash", name: "สแปลช", price: 35, trackStock: true },
  { id: "singha_lemon_soda", name: "สิงห์ เลม่อน โซดา", price: 35, trackStock: true },
  { id: "soft_small", name: "อัดลม เล็ก", price: 25, trackStock: true },
  { id: "soft_large", name: "อัดลม ใหญ่", price: 49, trackStock: true },
  { id: "spy", name: "สปาย", price: 15, trackStock: true },

  { id: "soda", name: "โซดา", price: 20, trackStock: true },
  { id: "ice_small", name: "น้ำแข็ง เล็ก", price: 20, trackStock: true },
  { id: "ice_large", name: "น้ำแข็ง ใหญ่", price: 25, trackStock: true },

  { id: "water_small", name: "น้ำดื่ม เล็ก", price: 15, trackStock: true },
  { id: "water_large", name: "น้ำดื่ม ใหญ่", price: 30, trackStock: true },
];
