// ===== แอปบันทึกเครื่องดื่ม (SPA vanilla JS) =====

// ไอคอน SVG ที่วาดเอง (ไม่ใช่รูปสินค้า/โลโก้แบรนด์จริง เพื่อเลี่ยงปัญหาลิขสิทธิ์)
const ICONS = {
  beer: `<svg viewBox="0 0 40 40" width="32" height="32"><rect x="7" y="12" width="20" height="22" rx="3" fill="#E8B93C" stroke="#6B4A2F" stroke-width="2"/><rect x="7" y="12" width="20" height="6" fill="#FFF3D0"/><path d="M27 17h4a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3h-4" fill="none" stroke="#6B4A2F" stroke-width="2.2"/></svg>`,
  liquorRound: `<svg viewBox="0 0 40 40" width="32" height="32"><rect x="16" y="4" width="8" height="6" rx="1" fill="#4A3320"/><path d="M15 10h10v5l4 5v14a3 3 0 0 1-3 3H14a3 3 0 0 1-3-3V20l4-5z" fill="#8B5E34" stroke="#4A3320" stroke-width="1.8"/><rect x="12" y="24" width="16" height="6" fill="#C99A2A" opacity="0.5"/></svg>`,
  liquorFlat: `<svg viewBox="0 0 40 40" width="32" height="32"><rect x="15" y="4" width="8" height="5" rx="1" fill="#4A3320"/><path d="M14 9h12v4c3 3 3 4 3 7v13a3 3 0 0 1-3 3H14a3 3 0 0 1-3-3V20c0-3 0-4 3-7z" fill="#6B4A2F" stroke="#4A3320" stroke-width="1.8"/></svg>`,
  importBottle: `<svg viewBox="0 0 40 40" width="32" height="32"><rect x="16" y="4" width="8" height="6" rx="1" fill="none" stroke="#7A6552" stroke-width="2"/><path d="M15 10h10v5l4 5v14a3 3 0 0 1-3 3H14a3 3 0 0 1-3-3V20l4-5z" fill="none" stroke="#7A6552" stroke-width="2"/></svg>`,
  importCase: `<svg viewBox="0 0 40 40" width="32" height="32"><path d="M6 14l14-6 14 6-14 6-14-6z" fill="#D9A441" stroke="#6B4A2F" stroke-width="1.8"/><path d="M6 14v14l14 6V20L6 14z" fill="#C99A2A" stroke="#6B4A2F" stroke-width="1.8"/><path d="M34 14v14l-14 6V20l14-6z" fill="#E8B93C" stroke="#6B4A2F" stroke-width="1.8"/></svg>`,
  softDrink: `<svg viewBox="0 0 40 40" width="32" height="32"><path d="M11 14h18l-2 20a3 3 0 0 1-3 3H16a3 3 0 0 1-3-3l-2-20z" fill="#F3E9D2" stroke="#6B4A2F" stroke-width="2"/><rect x="9" y="11" width="22" height="4" rx="2" fill="#B4432E"/><line x1="23" y1="6" x2="20" y2="15" stroke="#6B4A2F" stroke-width="2"/></svg>`,
  soda: `<svg viewBox="0 0 40 40" width="32" height="32"><rect x="16" y="5" width="8" height="6" rx="1" fill="#4A3320"/><path d="M15 11h10v5l3 4v14a3 3 0 0 1-3 3H15a3 3 0 0 1-3-3V20l3-4z" fill="#BFE3E0" stroke="#4A3320" stroke-width="1.8"/><circle cx="18" cy="24" r="1.3" fill="#fff"/><circle cx="22" cy="28" r="1" fill="#fff"/><circle cx="19" cy="30" r="0.8" fill="#fff"/></svg>`,
  ice: `<svg viewBox="0 0 40 40" width="32" height="32"><rect x="6" y="14" width="16" height="16" rx="2" fill="#E9F6F5" stroke="#7A6552" stroke-width="1.8"/><rect x="18" y="10" width="16" height="16" rx="2" fill="#FFFFFF" stroke="#7A6552" stroke-width="1.8"/></svg>`,
  water: `<svg viewBox="0 0 40 40" width="32" height="32"><rect x="16" y="4" width="8" height="5" rx="1" fill="#4A3320"/><path d="M15 9h10v4l3 4v18a3 3 0 0 1-3 3H15a3 3 0 0 1-3-3V17l3-4z" fill="#DCEFFA" stroke="#5B85A0" stroke-width="1.8"/></svg>`,
};

const APP = document.getElementById("app");

let STATE = null; // { locations: {id: {openBill, history}}, stock: {drinkId: qty} }
let VIEW = { name: "home" };

// ---------- CEO PIN (ป้องกันพนักงานเห็นยอดเงิน/ประวัติรายรับ) ----------
const CEO_PIN = "254325"; // เปลี่ยนรหัสผ่าน CEO ได้ตรงนี้
let CEO_UNLOCKED = (function () {
  try {
    return localStorage.getItem("ceoUnlocked") === "1";
  } catch (e) {
    return false;
  }
})();

function requireCeoPin(onSuccess) {
  if (CEO_UNLOCKED) {
    onSuccess();
    return;
  }
  const pin = window.prompt("กรุณาใส่รหัสผ่าน CEO เพื่อดูข้อมูลยอดเงิน/ประวัติรายรับ");
  if (pin === null) return; // กดยกเลิก
  if (String(pin).trim() === CEO_PIN) {
    CEO_UNLOCKED = true;
    try {
      localStorage.setItem("ceoUnlocked", "1");
    } catch (e) {}
    onSuccess();
  } else {
    toast("รหัสผ่านไม่ถูกต้อง", true);
  }
}

function lockCeo() {
  CEO_UNLOCKED = false;
  try {
    localStorage.removeItem("ceoUnlocked");
  } catch (e) {}
  toast("ล็อกโหมด CEO แล้ว");
  render();
}
let DRAFT = null; // { locationId, employee, items: {drinkId:{qty,free}}, emptyCounts: {drinkId:qty}, showEmpty:false }
let ROOM_DRAFT = {}; // { drinkId: qty } กำลังแก้ไขสต็อกในห้องปัจจุบัน
let ROOM_EMPLOYEE = null;
let ROOM_USE_DRAFT = {}; // { drinkId: qty } จำนวนที่กำลัง "ใช้ไป" จากของที่วางไว้ในห้อง (ยังไม่บันทึก)
let ROOM_USE_EMPLOYEE = null;
let STOCK_DRAFT = {}; // { drinkId: qty } กำลังแก้ไขสต็อกกลางของร้าน
let STOCK_EMPLOYEE = null;
let STOCK_SEARCH = ""; // คำค้นหาในหน้าจัดการสต็อกกลาง
let BILL_HISTORY_MODE = "daily"; // "daily" | "monthly"
let BILL_HISTORY_EXPANDED = new Set(); // keys (dayKey/monthKey) ที่กางดูรายละเอียดอยู่
let BILL_HISTORY_FROM = ""; // yyyy-mm-dd ตัวกรองวันที่เริ่ม
let BILL_HISTORY_TO = ""; // yyyy-mm-dd ตัวกรองวันที่สิ้นสุด
let KARAOKE_SHOW = false;
let KARAOKE_START = "";
let KARAOKE_END = "";
let KARAOKE_EMPLOYEE = null;
let KARAOKE_LOG_SHOW = false;
let KARAOKE_LOG_START = "";
let KARAOKE_LOG_EMPLOYEE = null;
let KARAOKE_HISTORY_EXPANDED = new Set(); // locationId ที่กางดูรายละเอียดค่าคาราโอเกะอยู่
let KARAOKE_HISTORY_FROM = ""; // yyyy-mm-dd ตัวกรองวันที่เริ่ม
let KARAOKE_HISTORY_TO = ""; // yyyy-mm-dd ตัวกรองวันที่สิ้นสุด
let MEETING_SHOW = false; // กางฟอร์มคิดเงินค่าห้องประชุมอยู่หรือไม่
let MEETING_START = "";
let MEETING_END = "";
let MEETING_EMPLOYEE = null;
let BEST_SELLERS_MODE = "daily"; // "daily" | "monthly" | "yearly"
let BEST_SELLERS_EXPANDED = new Set(); // keys ที่กางดูรายละเอียดอยู่
let BEST_SELLERS_SORT = "qty"; // "qty" | "profit" — เรียงตามจำนวนขาย หรือกำไร
let INSIGHTS_MODE = "daily"; // "daily" | "monthly" | "yearly"
let INSIGHTS_EXPANDED = new Set(); // keys ที่กางดูรายละเอียดอยู่
let CLOSE_BILL_EMPLOYEE = null; // พนักงานผู้ปิดบิล (เลือกก่อนกดปิดบิล)
let BILL_DISCOUNTS = {}; // { drinkId: ส่วนลด(บาท) } — กรอกตอนปิดบิล ล้างค่าทุกครั้งที่เข้า/ออกห้อง
let RETURN_ITEM_SHOW = null; // roundId ที่กำลังกางแผงคืนสินค้าอยู่ (null = ไม่ได้กาง)
let RETURN_ITEM_DRAFT = {}; // { itemId: จำนวนที่จะคืน } เฉพาะรอบที่กำลังกางอยู่
let RETURN_ITEM_EMPLOYEE = null; // พนักงานผู้กดคืนสินค้า (ต้องเลือกก่อนยืนยัน เพื่อบันทึกไว้ว่าใครเป็นคนทำ)
let DELETE_ROUND_SHOW = null; // roundId ที่กำลังกางแผงยืนยันลบอยู่ (null = ไม่ได้กาง)
let DELETE_ROUND_EMPLOYEE = null; // พนักงานผู้กดลบรายการ (ต้องเลือกก่อนยืนยัน เพื่อบันทึกไว้ว่าใครเป็นคนทำ)
let EDIT_CLOSED_BILL = null; // { locationId, billId, rounds } — สำเนาบิลที่ปิดแล้วกำลังแก้ไขอยู่ (CEO เท่านั้น)
let EDIT_CLOSED_BILL_ADD_DRINK_ID = ""; // เครื่องดื่มที่กำลังเลือกจะเพิ่มเข้าไปในบิล (ที่ลืมลง)
let CLEAR_DAY_SHOW = false; // กางฟอร์มเคลียร์ข้อมูลวันนี้ที่หน้าแรกอยู่หรือไม่
let CLEAR_DAY_EMPLOYEE = null; // พนักงานผู้กดเคลียร์ข้อมูลวันนี้
let CLEAR_DAY_SELECTED = {}; // { [locationId]: true/false } ห้อง/โต๊ะไหนถูกเลือกให้ปิดบิลบ้าง (ไม่บังคับเคลียร์ทั้งหมด)
let HOME_SEARCH = ""; // คำค้นหาห้อง/โต๊ะที่หน้าแรก
let DRINK_SEARCH = ""; // คำค้นหาเครื่องดื่มในหน้าเพิ่ม/แก้ไขรายการ
let ROOM_STOCK_SEARCH = ""; // คำค้นหาเครื่องดื่มในหน้าเติมสต็อกห้อง
let ROOM_OVERVIEW_SEARCH = ""; // คำค้นหาห้อง/เครื่องดื่มในหน้าสรุปของที่วางไว้แต่ละห้อง
let ROOM_USAGE_SEARCH = ""; // คำค้นหาเครื่องดื่มในการ์ด "ของที่วางไว้ในห้องนี้อยู่แล้ว"
let MENU_EDIT_ID = null; // id ของเครื่องดื่มที่กำลังแก้ไขอยู่ในหน้าจัดการเมนู
let MENU_EDIT_DRAFT = {};
let MENU_SHOW_ADD = false;
let STAFF_EDIT_ID = null; // id ของพนักงานที่กำลังแก้ไขอยู่ในหน้าจัดการพนักงาน
let LOC_EDIT_ID = null; // id ของห้อง/โต๊ะที่กำลังแก้ไขอยู่ในหน้าจัดการห้อง/โต๊ะ
let LOADING = false;
let SAVING = false;
let LOAD_ERROR = null; // ข้อความ error ถ้าโหลดข้อมูลครั้งแรกไม่สำเร็จ (null = ไม่มี/โหลดสำเร็จแล้ว)
let AUTO_REFRESH_TIMER = null; // ตัวจับเวลา auto-refresh (ตั้งครั้งเดียวหลังโหลดสำเร็จครั้งแรก)
let AUTO_REFRESH_FAILS = 0; // นับจำนวนครั้งที่ auto-refresh ล้มเหลวติดต่อกัน (ไว้โชว์ตัวบอกสถานะขาดการเชื่อมต่อ)
let VOICE_ORDER_LISTENING = false; // กำลังฟังเสียงสั่งเครื่องดื่มอยู่หรือไม่
let VOICE_ORDER_LAST = null; // ผลลัพธ์การพาร์สคำสั่งเสียงล่าสุด (ไว้แสดงให้พนักงานเห็นว่าจับคำพูดได้ว่าอะไรบ้าง)
let VOICE_ORDER_RECOGNITION = null; // instance ของ SpeechRecognition ที่กำลังทำงานอยู่ (ถ้ามี)
let FONT_ZOOM = 1; // ระดับขยาย/ลดฟอนต์ทั้งแอป ผู้ใช้ปรับเองได้ จำไว้ต่ออุปกรณ์ (localStorage)
try {
  const savedZoom = Number(localStorage.getItem("fontZoom"));
  if (savedZoom && savedZoom >= 0.8 && savedZoom <= 1.4) FONT_ZOOM = savedZoom;
} catch (e) {
  // localStorage อาจใช้ไม่ได้ในบางเบราว์เซอร์/โหมด ก็แค่ใช้ค่าเริ่มต้น
}

function applyFontZoom() {
  try {
    const appEl = document.getElementById("app");
    if (appEl) appEl.style.zoom = String(FONT_ZOOM);
  } catch (e) {
    // เบราว์เซอร์บางตัวไม่รองรับ zoom ก็แค่ไม่ขยาย ไม่กระทบการทำงานหลัก
  }
}

function changeFontZoom(delta) {
  const next = Math.round((FONT_ZOOM + delta) * 10) / 10;
  FONT_ZOOM = Math.max(0.8, Math.min(1.4, next));
  try {
    localStorage.setItem("fontZoom", String(FONT_ZOOM));
  } catch (e) {
    // ignore
  }
  render();
}

// ---------- API helpers ----------
// เรียก fetch แบบมี timeout กันจอค้าง "กำลังโหลด..." ตลอดไปถ้าเน็ตช้า/หลุด หรือ Netlify Function ตื่นช้า (cold start)
async function fetchWithTimeout(url, opts, timeoutMs = 12000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...(opts || {}), signal: controller.signal });
  } catch (e) {
    if (e && e.name === "AbortError") {
      throw new Error("การเชื่อมต่อช้าเกินไป (เกิน " + Math.round(timeoutMs / 1000) + " วินาที) กรุณาลองใหม่");
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

async function readErrorMessage(res, fallback) {
  try {
    const data = await res.json();
    if (data && data.error) return data.error;
  } catch {
    // ignore parse errors, fall back to default message
  }
  return fallback;
}

async function apiGet() {
  const res = await fetchWithTimeout("/api/state");
  if (!res.ok) throw new Error(await readErrorMessage(res, "โหลดข้อมูลไม่สำเร็จ"));
  return res.json();
}

async function apiOrder(payload) {
  const res = await fetchWithTimeout("/api/order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await readErrorMessage(res, "บันทึกไม่สำเร็จ"));
  return res.json();
}

async function apiCloseBill(locationId, employee, discounts) {
  const res = await fetchWithTimeout("/api/close-bill", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ locationId, employee, discounts: discounts || {} }),
  });
  if (!res.ok) throw new Error(await readErrorMessage(res, "ปิดบิลไม่สำเร็จ"));
  return res.json();
}

async function apiDeleteBillHistory(fromDate, toDate) {
  const res = await fetchWithTimeout("/api/delete-bill-history", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fromDate, toDate }),
  });
  if (!res.ok) throw new Error(await readErrorMessage(res, "ลบประวัติไม่สำเร็จ"));
  return res.json();
}

async function apiDeleteSingleBill(locationId, billId) {
  const res = await fetchWithTimeout("/api/delete-bill-history", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ locationId, billId }),
  });
  if (!res.ok) throw new Error(await readErrorMessage(res, "ลบบิลไม่สำเร็จ"));
  return res.json();
}

async function apiSaveStock(employee, items) {
  const res = await fetchWithTimeout("/api/stock", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ employee, items }),
  });
  if (!res.ok) throw new Error(await readErrorMessage(res, "บันทึกสต็อกไม่สำเร็จ"));
  return res.json();
}

async function apiDeleteRound(locationId, roundId, employee) {
  const res = await fetchWithTimeout("/api/delete-round", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ locationId, roundId, employee }),
  });
  if (!res.ok) throw new Error(await readErrorMessage(res, "ลบรายการไม่สำเร็จ"));
  return res.json();
}

async function apiReturnItem(locationId, roundId, itemId, qty, employee) {
  const res = await fetchWithTimeout("/api/return-item", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ locationId, roundId, itemId, qty, employee }),
  });
  if (!res.ok) throw new Error(await readErrorMessage(res, "คืนสินค้าไม่สำเร็จ"));
  return res.json();
}

async function apiEditClosedBill(locationId, billId, rounds, editedBy) {
  const res = await fetchWithTimeout("/api/edit-closed-bill", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ locationId, billId, rounds, editedBy }),
  });
  if (!res.ok) throw new Error(await readErrorMessage(res, "แก้ไขบิลไม่สำเร็จ"));
  return res.json();
}

async function apiSetRoomStock(locationId, employee, items) {
  const res = await fetchWithTimeout("/api/room-stock", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ locationId, employee, items }),
  });
  if (!res.ok) throw new Error(await readErrorMessage(res, "บันทึกสต็อกในห้องไม่สำเร็จ"));
  return res.json();
}

async function apiClearRoomStockHistory(locationId) {
  const res = await fetchWithTimeout("/api/room-stock", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ locationId, action: "clearHistory" }),
  });
  if (!res.ok) throw new Error(await readErrorMessage(res, "ลบประวัติไม่สำเร็จ"));
  return res.json();
}

async function apiKaraokeSession(locationId, action, extra) {
  const res = await fetchWithTimeout("/api/karaoke-session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ locationId, action, ...(extra || {}) }),
  });
  if (!res.ok) throw new Error(await readErrorMessage(res, "บันทึกเวลาคาราโอเกะไม่สำเร็จ"));
  return res.json();
}

async function apiMenuAction(payload) {
  const res = await fetchWithTimeout("/api/menu", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await readErrorMessage(res, "บันทึกเมนูไม่สำเร็จ"));
  return res.json();
}

async function apiStaffAction(payload) {
  const res = await fetchWithTimeout("/api/staff", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await readErrorMessage(res, "บันทึกพนักงานไม่สำเร็จ"));
  return res.json();
}

async function apiLocationsAction(payload) {
  const res = await fetchWithTimeout("/api/locations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await readErrorMessage(res, "บันทึกห้อง/โต๊ะไม่สำเร็จ"));
  return res.json();
}

async function apiSetRate(payload) {
  const res = await fetchWithTimeout("/api/rates", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await readErrorMessage(res, "บันทึกอัตราค่าบริการไม่สำเร็จ"));
  return res.json();
}

async function apiSaveSettings(payload) {
  const res = await fetchWithTimeout("/api/settings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await readErrorMessage(res, "บันทึกการตั้งค่าไม่สำเร็จ"));
  return res.json();
}

// resize รูปที่ผู้ใช้เลือกให้เล็กลงก่อนอัปโหลด (กันไฟล์ใหญ่เกินไป)
function resizeImageFile(file, maxSize = 200, quality = 0.65) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > height) {
          if (width > maxSize) { height = Math.round((height * maxSize) / width); width = maxSize; }
        } else {
          if (height > maxSize) { width = Math.round((width * maxSize) / height); height = maxSize; }
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d").drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = () => reject(new Error("ไม่สามารถอ่านรูปภาพนี้ได้"));
      img.src = reader.result;
    };
    reader.onerror = () => reject(new Error("ไม่สามารถอ่านไฟล์นี้ได้"));
    reader.readAsDataURL(file);
  });
}

// ---------- Utilities ----------
function money(n) {
  return Number(n || 0).toLocaleString("th-TH");
}

function fmtDateTime(iso) {
  const d = new Date(iso);
  if (!iso || isNaN(d.getTime())) return "-";
  const day = d.toLocaleDateString("th-TH", { day: "2-digit", month: "2-digit", year: "2-digit" });
  const time = d.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
  return `${day} • ${time} น.`;
}

// ยืนยัน 2 ชั้นสำหรับการลบถาวร (กันเผลอกดลบข้อมูลสำคัญ) — ต้องกดยืนยันทั้งสองรอบถึงจะลบจริง
function confirmPermanentDelete(message) {
  if (!window.confirm(message)) return false;
  return window.confirm("ยืนยันอีกครั้ง: การลบนี้ถาวรและกู้คืนไม่ได้ ต้องการดำเนินการต่อหรือไม่?");
}

// สร้างไฟล์ CSV แล้วดาวน์โหลด (เปิดได้ปกติใน Excel/Google Sheets) — ใส่ BOM กันตัวหนังสือไทยเพี้ยนตอนเปิดใน Excel
function csvEscape(val) {
  const s = val === null || val === undefined ? "" : String(val);
  if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}

function downloadCsv(filename, headerRow, rows) {
  const lines = [headerRow, ...rows].map((row) => row.map(csvEscape).join(","));
  const csvContent = "\uFEFF" + lines.join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function toast(msg, isError) {
  const root = document.getElementById("toast-root");
  root.innerHTML = "";
  const el = document.createElement("div");
  el.className = "toast";
  if (isError) el.style.background = "#B4432E";
  el.textContent = msg;
  root.appendChild(el);
  setTimeout(() => { if (root.contains(el)) root.removeChild(el); }, 4200);
}

function drinkById(id) {
  return (STATE.drinksMenu || []).find((d) => d.id === id);
}

function activeDrinks() {
  return (STATE.drinksMenu || []).filter((d) => d.active !== false);
}

// น้ำแข็ง: วัดปริมาณจริงไม่ได้ (1 กระสอบ ได้กี่ถังเล็ก/ใหญ่ไม่แน่นอน) เลยไม่นับสต็อกให้อีกต่อไป แค่ซ่อนจากหน้าจัดการสต็อกต่างๆ
function isIceDrink(d) {
  const name = (d.name || "").toLowerCase();
  const cat = (d.category || "").toLowerCase();
  return name.includes("น้ำแข็ง") || cat.includes("น้ำแข็ง") || /^ice/i.test(d.id || "");
}

// "นำเข้า" (เหล้า/เบียร์ที่ลูกค้าเอามาเอง จ่ายเป็นค่าคอร์กเกจ) ไม่ใช่สต็อกของร้านจริงๆ เลยไม่ควรมาปนในหน้าจัดการสต็อก
// แต่ยังนับเป็นยอดขาย/สถิติของที่ลูกค้านำเข้ามาได้ตามปกติ
function isImportDrink(d) {
  const name = (d.name || "").toLowerCase();
  const cat = (d.category || "").toLowerCase();
  return name.includes("นำเข้า") || cat.includes("นำเข้า") || /^import_/i.test(d.id || "");
}

function activeStaffNames() {
  return (STATE.staffList || []).filter((s) => s.active !== false).map((s) => s.name);
}

function locById(id) {
  return LOCATIONS.find((l) => l.id === id);
}

function calcRoundTotal(items) {
  let total = 0;
  for (const id in items) {
    const it = items[id];
    if (!it.qty) continue;
    const d = drinkById(id);
    total += calcLineTotal(d, it.qty, it.free);
  }
  return total;
}

function billTotal(openBill) {
  if (!openBill) return 0;
  return openBill.rounds.reduce((s, r) => s + r.roundTotal, 0);
}

// ร้านอยู่เมืองไทย (UTC+7 ตลอด ไม่มี DST) เลย fix offset ตรงๆ แทนที่จะพึ่ง timezone ของเครื่อง/เบราว์เซอร์
// กันบั๊ก: บิลที่ปิดช่วงเที่ยงคืน-ตี 7 ถูกนับเป็นคนละวันระหว่างตอนแสดงผล (local time) กับตอนกรอง/จัดกลุ่ม (เคยใช้ UTC ตรงๆ)
const THAILAND_OFFSET_MS = 7 * 60 * 60 * 1000;
function dayKeyOf(iso) {
  return new Date(new Date(iso).getTime() + THAILAND_OFFSET_MS).toISOString().slice(0, 10);
}

function monthKeyOf(iso) {
  return new Date(new Date(iso).getTime() + THAILAND_OFFSET_MS).toISOString().slice(0, 7);
}

function fmtDateOnly(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("th-TH", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function fmtMonthLabel(monthKey) {
  const d = new Date(monthKey + "-01T00:00:00Z");
  return d.toLocaleDateString("th-TH", { month: "long", year: "numeric", timeZone: "UTC" });
}

function collectAllClosedBills() {
  const bills = [];
  for (const loc of LOCATIONS) {
    const locState = STATE.locations[loc.id] || { history: [] };
    for (const b of locState.history || []) {
      const closedAt =
        b.closedAt || (b.rounds && b.rounds.length ? b.rounds[b.rounds.length - 1].timestamp : new Date().toISOString());
      bills.push({
        id: b.id || null,
        locationId: loc.id,
        locationLabel: loc.label,
        closedAt,
        closedBy: b.closedBy || null,
        dayKey: dayKeyOf(closedAt),
        monthKey: monthKeyOf(closedAt),
        total: billTotal(b),
        discountTotal: b.discountTotal || 0,
        rounds: b.rounds || [],
        returnsLog: b.returnsLog || [],
        deletesLog: b.deletesLog || [],
      });
    }
  }
  bills.sort((a, b2) => new Date(b2.closedAt) - new Date(a.closedAt));
  return bills;
}

// สรุปจำนวนเครื่องดื่มที่ขายได้ (สุทธิหลังหักคืนแล้ว) + จำนวนที่คืนไปทั้งหมด ของบิลหนึ่งใบ
function billDrinkQtySummary(bill) {
  let soldQty = 0;
  for (const r of bill.rounds || []) {
    for (const i of r.items || []) {
      if (isSyntheticChargeItem(i.id)) continue;
      if (i.free) continue;
      soldQty += Number(i.qty || 0);
    }
  }
  const returnedQty = (bill.returnsLog || []).reduce((s, r) => s + Number(r.qty || 0), 0);
  return { soldQty, returnedQty };
}

// ---------- ค่าคาราโอเกะ/ห้องประชุม (คิดตามเวลาเริ่ม-เลิก) ----------
// RATES ถูก sync จาก STATE.rates ทุกครั้งที่ render() (ดูใน render()) แก้ไขราคาได้จากหน้า "อัตราค่าบริการ"
let RATES = { karaoke: {}, meeting: {} };
// SETTINGS ถูก sync จาก STATE.settings ทุกครั้งที่ render() เช่นกัน แก้ไขได้จากหน้า "อัตราค่าบริการ" (CEO เท่านั้น)
let SETTINGS = { voiceOrderEnabled: false };

function karaokeRateFor(loc) {
  return RATES.karaoke[loc.group] || null;
}

function meetingRateFor(loc) {
  return RATES.meeting[loc.group] || null;
}

function karaokeMinutes(startStr, endStr) {
  if (!startStr || !endStr) return null;
  const sParts = startStr.split(":").map(Number);
  const eParts = endStr.split(":").map(Number);
  if (sParts.length < 2 || eParts.length < 2) return null;
  const [sh, sm] = sParts;
  const [eh, em] = eParts;
  if ([sh, sm, eh, em].some((n) => Number.isNaN(n))) return null;
  let startMin = sh * 60 + sm;
  let endMin = eh * 60 + em;
  if (endMin <= startMin) endMin += 24 * 60; // ข้ามเที่ยงคืน
  return endMin - startMin;
}

function karaokeLabel(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const parts = [];
  if (h > 0) parts.push(`${h} ชม`);
  if (m > 0 || !h) parts.push(`${m} นาที`);
  return parts.join(" ");
}

function karaokePrice(mins, hourlyRate) {
  return Math.round((mins / 60) * hourlyRate);
}

function isKaraokeChargeItem(id) {
  return typeof id === "string" && id.startsWith("karaoke_");
}

function isMeetingChargeItem(id) {
  return typeof id === "string" && id.startsWith("meeting_");
}

function isSyntheticChargeItem(id) {
  return isKaraokeChargeItem(id) || isMeetingChargeItem(id);
}

function summarizeBillItems(rounds) {
  const map = new Map();
  for (const r of rounds) {
    for (const i of r.items || []) {
      const isKaraoke = isKaraokeChargeItem(i.id);
      const isMeeting = isMeetingChargeItem(i.id);
      const synthetic = isKaraoke || isMeeting;
      const key = isKaraoke ? "__karaoke__" : isMeeting ? "__meeting__" : i.id;
      if (!map.has(key)) {
        map.set(key, {
          id: key,
          name: isKaraoke ? "ค่าคาราโอเกะ" : isMeeting ? "ค่าห้องประชุม" : i.name,
          qty: 0,
          freeQty: 0,
          total: 0,
          count: 0,
          isKaraoke: synthetic,
        });
      }
      const entry = map.get(key);
      entry.count += 1;
      if (!synthetic) {
        if (i.free) entry.freeQty += Number(i.qty || 0);
        else entry.qty += Number(i.qty || 0);
      }
      entry.total += Number(i.lineTotal || 0);
    }
  }
  return [...map.values()];
}

function collectAllKaraokeCharges() {
  const charges = [];
  for (const loc of LOCATIONS) {
    const locState = STATE.locations[loc.id] || { openBill: null, history: [] };
    for (const b of locState.history || []) {
      for (const r of b.rounds || []) {
        for (const i of r.items || []) {
          if (isKaraokeChargeItem(i.id)) {
            charges.push({
              locationId: loc.id,
              locationLabel: loc.label,
              locationGroup: loc.group,
              employee: r.employee,
              timestamp: r.timestamp,
              name: i.name,
              amount: i.lineTotal != null ? i.lineTotal : i.qty * i.unitPrice,
              minutes: typeof i.minutes === "number" ? i.minutes : null,
              billId: b.id || null, // ใช้ลบทั้งบิลนี้ได้ (บิลปิดแล้วเท่านั้น)
            });
          }
        }
      }
    }
    // บิลที่ยังเปิดอยู่ ก็เก็บมาแสดงด้วยเพื่อความครบถ้วน แต่ลบไม่ได้ (billId: null) เพราะยังไม่ปิดบิล
    if (locState.openBill && locState.openBill.rounds) {
      for (const r of locState.openBill.rounds) {
        for (const i of r.items || []) {
          if (isKaraokeChargeItem(i.id)) {
            charges.push({
              locationId: loc.id,
              locationLabel: loc.label,
              locationGroup: loc.group,
              employee: r.employee,
              timestamp: r.timestamp,
              name: i.name,
              amount: i.lineTotal != null ? i.lineTotal : i.qty * i.unitPrice,
              minutes: typeof i.minutes === "number" ? i.minutes : null,
              billId: null,
            });
          }
        }
      }
    }
  }
  charges.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  return charges;
}

// แถบลิงก์ข้ามไปมาระหว่าง 3 หน้ารายงานของ CEO (ประวัติบิล/ประวัติคาราโอเกะ/สินค้าขายดี)
function renderCeoReportNav(current) {
  const nav = el("div", null);
  nav.style.cssText = "display:flex;gap:10px;margin-bottom:14px;flex-wrap:wrap;";
  const items = [
    ["bill-history", "🧾 ประวัติบิล", goBillHistory],
    ["karaoke-history", "🎤 ประวัติคาราโอเกะ", goKaraokeHistory],
    ["best-sellers", "🏆 สินค้าขายดี", goBestSellers],
    ["insights", "📊 สถิติเพิ่มเติม", goInsights],
  ];
  for (const [key, label, fn] of items) {
    const b = el("button", "staff-btn" + (current === key ? " selected" : ""), label);
    if (current !== key) b.onclick = fn;
    else b.disabled = true;
    nav.appendChild(b);
  }
  return nav;
}

function renderKaraokeHistory() {
  const top = el("div", "topbar");
  const back = el("button", "back-btn", "←");
  back.onclick = goHome;
  top.appendChild(back);
  top.appendChild(el("h1", null, "🎤 ประวัติคาราโอเกะ"));
  APP.appendChild(top);
  APP.appendChild(renderCeoReportNav("karaoke-history"));

  const allCharges = collectAllKaraokeCharges();
  const totalAmount = allCharges.reduce((s, c) => s + c.amount, 0);

  const summaryCard = el("div", "card total-card");
  summaryCard.appendChild(el("div", "label", "ยอดค่าคาราโอเกะรวมทั้งหมด"));
  summaryCard.appendChild(el("div", "amount", `${allCharges.length} ครั้ง • ฿${money(totalAmount)}`));
  APP.appendChild(summaryCard);

  if (!allCharges.length) {
    APP.appendChild(el("div", "empty-note", "ยังไม่มีรายการค่าคาราโอเกะ"));
    return;
  }

  APP.appendChild(el("div", "section-label", "กรองตามช่วงวันที่"));
  const filterRow = el("div", null);
  filterRow.style.cssText = "display:flex;gap:10px;align-items:center;margin-bottom:14px;flex-wrap:wrap;";
  const fromField = el("div", null);
  fromField.style.cssText = "display:flex;flex-direction:column;gap:4px;";
  fromField.appendChild(el("div", "round-meta", "จากวันที่"));
  const fromInput = document.createElement("input");
  fromInput.type = "date";
  fromInput.className = "stock-input";
  fromInput.style.width = "150px";
  fromInput.value = KARAOKE_HISTORY_FROM;
  fromInput.onchange = () => {
    KARAOKE_HISTORY_FROM = fromInput.value;
    render();
  };
  fromField.appendChild(fromInput);
  filterRow.appendChild(fromField);

  const toField = el("div", null);
  toField.style.cssText = "display:flex;flex-direction:column;gap:4px;";
  toField.appendChild(el("div", "round-meta", "ถึงวันที่"));
  const toInput = document.createElement("input");
  toInput.type = "date";
  toInput.className = "stock-input";
  toInput.style.width = "150px";
  toInput.value = KARAOKE_HISTORY_TO;
  toInput.onchange = () => {
    KARAOKE_HISTORY_TO = toInput.value;
    render();
  };
  toField.appendChild(toInput);
  filterRow.appendChild(toField);

  if (KARAOKE_HISTORY_FROM || KARAOKE_HISTORY_TO) {
    const clearBtn = el("button", "collapse-toggle", "✕ ล้างตัวกรอง");
    clearBtn.style.alignSelf = "flex-end";
    clearBtn.onclick = () => {
      KARAOKE_HISTORY_FROM = "";
      KARAOKE_HISTORY_TO = "";
      render();
    };
    filterRow.appendChild(clearBtn);
  }

  const deleteBtn = el("button", "collapse-toggle", "🗑 ลบประวัติช่วงนี้ถาวร");
  deleteBtn.style.cssText = "align-self:flex-end;color:#B4432E;";
  deleteBtn.onclick = async () => {
    if (!KARAOKE_HISTORY_FROM && !KARAOKE_HISTORY_TO) {
      toast("กรุณาเลือก \"จากวันที่\" หรือ \"ถึงวันที่\" ก่อนถึงจะลบได้", true);
      return;
    }
    const rangeLabel =
      KARAOKE_HISTORY_FROM && KARAOKE_HISTORY_TO
        ? `${KARAOKE_HISTORY_FROM} ถึง ${KARAOKE_HISTORY_TO}`
        : KARAOKE_HISTORY_FROM
        ? `ตั้งแต่ ${KARAOKE_HISTORY_FROM}`
        : `ถึง ${KARAOKE_HISTORY_TO}`;
    if (
      !confirmPermanentDelete(
        `ลบประวัติบิลช่วง ${rangeLabel} ถาวร? (จะลบทั้งรายการเครื่องดื่มและค่าคาราโอเกะที่อยู่ในบิลเดียวกันของช่วงนี้ สต็อกที่หักไปจะถูกคืนกลับให้อัตโนมัติ) ข้อมูลจะกู้คืนไม่ได้`
      )
    )
      return;
    try {
      const result = await apiDeleteBillHistory(KARAOKE_HISTORY_FROM, KARAOKE_HISTORY_TO);
      STATE = result;
      KARAOKE_HISTORY_FROM = "";
      KARAOKE_HISTORY_TO = "";
      toast(`ลบประวัติแล้ว ${result.deletedCount || 0} บิล`);
      render();
    } catch (e) {
      toast(e.message, true);
    }
  };
  filterRow.appendChild(deleteBtn);
  APP.appendChild(filterRow);

  const charges = allCharges.filter((c) => {
    const key = dayKeyOf(c.timestamp);
    if (KARAOKE_HISTORY_FROM && key < KARAOKE_HISTORY_FROM) return false;
    if (KARAOKE_HISTORY_TO && key > KARAOKE_HISTORY_TO) return false;
    return true;
  });

  if (charges.length) {
    const exportBtn = el("button", "collapse-toggle", "📊 Export CSV (รายการที่แสดงอยู่)");
    exportBtn.style.marginBottom = "10px";
    exportBtn.onclick = () => {
      const rows = charges.map((c) => [
        c.locationLabel,
        c.employee || "",
        fmtDateTime(c.timestamp),
        c.minutes != null ? c.minutes : "",
        c.amount,
      ]);
      downloadCsv(
        `karaoke-history-${Date.now()}.csv`,
        ["ห้อง/โต๊ะ", "พนักงาน", "เวลา", "นาที", "จำนวนเงิน"],
        rows
      );
    };
    APP.appendChild(exportBtn);
  }

  if (!charges.length) {
    APP.appendChild(el("div", "empty-note", "ไม่พบรายการค่าคาราโอเกะในช่วงวันที่ที่เลือก"));
    return;
  }

  const byLocation = new Map();
  for (const c of charges) {
    if (!byLocation.has(c.locationId)) byLocation.set(c.locationId, []);
    byLocation.get(c.locationId).push(c);
  }

  APP.appendChild(el("div", "section-label", "สรุปตามห้อง/โต๊ะ"));
  const sumCard = el("div", "card");
  const locIdsWithCharges = [...byLocation.keys()];
  locIdsWithCharges.sort((a, b) => {
    const totalA = byLocation.get(a).reduce((s, c) => s + c.amount, 0);
    const totalB = byLocation.get(b).reduce((s, c) => s + c.amount, 0);
    return totalB - totalA;
  });

  for (const locId of locIdsWithCharges) {
    const locCharges = byLocation.get(locId);
    const locTotal = locCharges.reduce((s, c) => s + c.amount, 0);
    const expanded = KARAOKE_HISTORY_EXPANDED.has(locId);
    const row = el(
      "button",
      "collapse-toggle",
      `${expanded ? "▾" : "▸"} ${locCharges[0].locationLabel} — ${locCharges.length} ครั้ง • ฿${money(locTotal)}`
    );
    row.style.cssText = "width:100%;text-align:left;font-size:16px;font-weight:700;margin-bottom:6px;";
    row.onclick = () => {
      if (expanded) KARAOKE_HISTORY_EXPANDED.delete(locId);
      else KARAOKE_HISTORY_EXPANDED.add(locId);
      render();
    };
    sumCard.appendChild(row);
    if (expanded) {
      for (const c of locCharges) {
        const item = el("div", "round-item");
        const topRow = el("div", "round-top");
        topRow.appendChild(el("span", null, c.employee));
        topRow.appendChild(el("span", null, `฿${money(c.amount)}`));
        item.appendChild(topRow);
        item.appendChild(el("div", "round-meta", `${fmtDateTime(c.timestamp)} • ${c.name}`));
        if (c.billId) {
          const delBtn = el("button", "collapse-toggle", "🗑 ลบบิลนี้");
          delBtn.style.cssText = "color:#B4432E;margin-top:4px;";
          delBtn.onclick = async () => {
            if (
              !confirmPermanentDelete(
                `ลบบิลของ "${c.locationLabel}" ที่มีค่าคาราโอเกะนี้ถาวร? (ถ้าบิลนี้มีรายการเครื่องดื่มอื่นด้วย จะถูกลบไปพร้อมกัน สต็อกที่หักไปจะถูกคืนกลับให้อัตโนมัติ) ข้อมูลจะกู้คืนไม่ได้`
              )
            )
              return;
            try {
              STATE = await apiDeleteSingleBill(c.locationId, c.billId);
              toast("ลบบิลแล้ว");
              render();
            } catch (e) {
              toast(e.message, true);
            }
          };
          item.appendChild(delBtn);
        } else {
          item.appendChild(el("div", "round-meta", "(บิลนี้ยังเปิดอยู่ ปิดบิลก่อนถึงจะลบได้)"));
        }
        sumCard.appendChild(item);
      }
    }
  }
  APP.appendChild(sumCard);

  const byGroup = new Map();
  for (const c of charges) {
    if (!byGroup.has(c.locationGroup)) byGroup.set(c.locationGroup, { count: 0, total: 0 });
    const g = byGroup.get(c.locationGroup);
    g.count += 1;
    g.total += c.amount;
  }
  if (byGroup.size > 1 || byLocation.size > byGroup.size) {
    APP.appendChild(el("div", "section-label", "สรุปรวมตามกลุ่มห้องแอร์"));
    const groupCard = el("div", "card");
    for (const [groupName, g] of byGroup.entries()) {
      const gRow = el("div", "round-item");
      const gTop = el("div", "round-top");
      gTop.appendChild(el("span", null, groupName));
      gTop.appendChild(el("span", null, `฿${money(g.total)}`));
      gRow.appendChild(gTop);
      gRow.appendChild(el("div", "round-meta", `${g.count} ครั้ง`));
      groupCard.appendChild(gRow);
    }
    APP.appendChild(groupCard);
  }
}

// ---------- สินค้าขายดี (สรุปยอดขายเครื่องดื่มรายวัน/เดือน/ปี — CEO เท่านั้น) ----------
function collectDrinkSalesStats() {
  const byDay = new Map();
  const byMonth = new Map();
  const byYear = new Map();

  const costMap = Object.fromEntries((STATE.drinksMenu || []).map((d) => [d.id, Number(d.cost) || 0]));

  function addTo(map, key, id, name, qty, revenue, cost) {
    if (!map.has(key)) map.set(key, new Map());
    const inner = map.get(key);
    if (!inner.has(id)) inner.set(id, { name, qty: 0, revenue: 0, profit: 0 });
    const e = inner.get(id);
    e.qty += qty;
    e.revenue += revenue;
    e.profit += revenue - cost * qty;
  }

  for (const loc of LOCATIONS) {
    const locState = STATE.locations[loc.id] || { openBill: null, history: [] };
    const allBills = [...(locState.history || [])];
    if (locState.openBill) allBills.push(locState.openBill);
    for (const b of allBills) {
      for (const r of b.rounds || []) {
        if (!r.timestamp) continue;
        const dayKey = dayKeyOf(r.timestamp);
        const monthKey = monthKeyOf(r.timestamp);
        const yearKey = dayKey.slice(0, 4);
        for (const i of r.items || []) {
          if (isSyntheticChargeItem(i.id)) continue; // ค่าคาราโอเกะ ไม่ใช่สินค้า ไม่นับ
          if (i.free) continue; // ของแจกฟรี ไม่นับเป็นยอดขาย
          const qty = Number(i.qty || 0);
          const revenue = Number(i.lineTotal || 0);
          const cost = costMap[i.id] || 0;
          if (!qty) continue;
          addTo(byDay, dayKey, i.id, i.name, qty, revenue, cost);
          addTo(byMonth, monthKey, i.id, i.name, qty, revenue, cost);
          addTo(byYear, yearKey, i.id, i.name, qty, revenue, cost);
        }
      }
    }
  }
  return { byDay, byMonth, byYear };
}

// ---------- สถิติเพิ่มเติม (ห้องคาราโอเกะ/ช่วงเวลาที่มาใช้บริการ/ของที่ลูกค้านำมาเอง) CEO เท่านั้น ----------
function yearKeyOfDay(dayKey) {
  return dayKey.slice(0, 4);
}

function periodKeysOf(iso) {
  const d = dayKeyOf(iso);
  return { day: d, month: monthKeyOf(iso), year: yearKeyOfDay(d) };
}

// ห้องที่มีชั่วโมงคาราโอเกะมากที่สุด + เป็นจำนวนเงินเท่าไร (รายวัน/เดือน/ปี)
function collectKaraokeRoomStats() {
  const byDay = new Map();
  const byMonth = new Map();
  const byYear = new Map();

  function addTo(map, periodKey, roomLabel, minutes, amount) {
    if (!map.has(periodKey)) map.set(periodKey, new Map());
    const inner = map.get(periodKey);
    if (!inner.has(roomLabel)) inner.set(roomLabel, { minutes: 0, amount: 0 });
    const e = inner.get(roomLabel);
    e.minutes += minutes;
    e.amount += amount;
  }

  for (const charge of collectAllKaraokeCharges()) {
    if (!charge.timestamp) continue;
    const { day, month, year } = periodKeysOf(charge.timestamp);
    const minutes = typeof charge.minutes === "number" ? charge.minutes : 0;
    const amount = Number(charge.amount || 0);
    addTo(byDay, day, charge.locationLabel, minutes, amount);
    addTo(byMonth, month, charge.locationLabel, minutes, amount);
    addTo(byYear, year, charge.locationLabel, minutes, amount);
  }
  return { byDay, byMonth, byYear };
}

// ช่วงเวลา (ชั่วโมงของวัน) ที่ลูกค้ามาใช้บริการมากที่สุด นับจากรอบแรกของแต่ละบิล (รายวัน/เดือน/ปี)
function collectBusiestHourStats() {
  const byDay = new Map();
  const byMonth = new Map();
  const byYear = new Map();

  function addTo(map, periodKey, hour) {
    if (!map.has(periodKey)) map.set(periodKey, new Map());
    const inner = map.get(periodKey);
    inner.set(hour, (inner.get(hour) || 0) + 1);
  }

  for (const loc of LOCATIONS) {
    const locState = STATE.locations[loc.id] || { openBill: null, history: [] };
    const allBills = [...(locState.history || [])];
    if (locState.openBill) allBills.push(locState.openBill);
    for (const b of allBills) {
      if (!b.rounds || !b.rounds.length) continue;
      const arrivalIso = b.rounds[0].timestamp;
      if (!arrivalIso) continue;
      const localMs = new Date(arrivalIso).getTime() + THAILAND_OFFSET_MS;
      const hour = new Date(localMs).getUTCHours();
      const { day, month, year } = periodKeysOf(arrivalIso);
      addTo(byDay, day, hour);
      addTo(byMonth, month, hour);
      addTo(byYear, year, hour);
    }
  }
  return { byDay, byMonth, byYear };
}

// ของที่ลูกค้านำเข้ามาเอง (นับจากขวด/กระป๋องเปล่าที่พนักงานเก็บบันทึกไว้) มากที่สุด (รายวัน/เดือน/ปี)
function collectSelfBroughtItemsStats() {
  const byDay = new Map();
  const byMonth = new Map();
  const byYear = new Map();
  const drinksById = Object.fromEntries((STATE.drinksMenu || []).map((d) => [d.id, d]));

  function addTo(map, periodKey, name, qty) {
    if (!map.has(periodKey)) map.set(periodKey, new Map());
    const inner = map.get(periodKey);
    inner.set(name, (inner.get(name) || 0) + qty);
  }

  // นับจากรายการ "นำเข้า" ที่ลูกค้าจ่ายจริงในบิล (เหล้า/เบียร์ที่ลูกค้าเอามาเอง จ่ายเป็นค่าคอร์กเกจ)
  // แทนการเดาจากขวด/กระป๋องเปล่าที่เก็บได้แบบเดิม เพราะแอปมีรายการ "นำเข้า" อยู่แล้วซึ่งตรงกับความหมายนี้โดยตรง
  for (const loc of LOCATIONS) {
    const locState = STATE.locations[loc.id] || { openBill: null, history: [] };
    const allBills = [...(locState.history || [])];
    if (locState.openBill) allBills.push(locState.openBill);
    for (const b of allBills) {
      for (const r of b.rounds || []) {
        if (!r.timestamp) continue;
        const { day, month, year } = periodKeysOf(r.timestamp);
        for (const i of r.items || []) {
          if (isSyntheticChargeItem(i.id)) continue;
          if (i.free) continue;
          const d = drinksById[i.id];
          const looksLikeImport = (d && isImportDrink(d)) || (i.name || "").includes("นำเข้า");
          if (!looksLikeImport) continue;
          const qty = Number(i.qty || 0);
          if (!qty) continue;
          const name = (d && d.name) || i.name || i.id;
          addTo(byDay, day, name, qty);
          addTo(byMonth, month, name, qty);
          addTo(byYear, year, name, qty);
        }
      }
    }
  }
  return { byDay, byMonth, byYear };
}

function renderBestSellers() {
  const top = el("div", "topbar");
  const back = el("button", "back-btn", "←");
  back.onclick = goHome;
  top.appendChild(back);
  top.appendChild(el("h1", null, "🏆 สินค้าขายดี"));
  APP.appendChild(top);
  APP.appendChild(renderCeoReportNav("best-sellers"));

  const modeRow = el("div", null);
  modeRow.style.cssText = "display:flex;gap:10px;margin-bottom:14px;flex-wrap:wrap;";
  const modes = [
    ["daily", "รายวัน"],
    ["monthly", "รายเดือน"],
    ["yearly", "รายปี"],
  ];
  for (const [key, label] of modes) {
    const b = el("button", "staff-btn" + (BEST_SELLERS_MODE === key ? " selected" : ""), label);
    b.onclick = () => {
      BEST_SELLERS_MODE = key;
      render();
    };
    modeRow.appendChild(b);
  }
  APP.appendChild(modeRow);

  const sortRow = el("div", null);
  sortRow.style.cssText = "display:flex;gap:10px;margin-bottom:14px;flex-wrap:wrap;align-items:center;";
  sortRow.appendChild(el("div", "round-meta", "เรียงตาม:"));
  const sortModes = [
    ["qty", "จำนวนขาย"],
    ["profit", "กำไร (CEO)"],
  ];
  for (const [key, label] of sortModes) {
    const b = el("button", "staff-btn" + (BEST_SELLERS_SORT === key ? " selected" : ""), label);
    b.onclick = () => {
      BEST_SELLERS_SORT = key;
      render();
    };
    sortRow.appendChild(b);
  }
  APP.appendChild(sortRow);

  const stats = collectDrinkSalesStats();
  const map = BEST_SELLERS_MODE === "daily" ? stats.byDay : BEST_SELLERS_MODE === "monthly" ? stats.byMonth : stats.byYear;
  const keys = [...map.keys()].sort().reverse();

  if (!keys.length) {
    APP.appendChild(el("div", "empty-note", "ยังไม่มีข้อมูลการขาย"));
    return;
  }

  const exportBtn = el("button", "collapse-toggle", "📊 Export CSV (ตามโหมดที่เลือกอยู่)");
  exportBtn.style.marginBottom = "10px";
  exportBtn.onclick = () => {
    const periodLabelFor = (key) =>
      BEST_SELLERS_MODE === "daily" ? fmtDateOnly(key) : BEST_SELLERS_MODE === "monthly" ? fmtMonthLabel(key) : `ปี ${key}`;
    const rows = [];
    for (const key of keys) {
      const inner = map.get(key);
      const drinksArr = [...inner.entries()]
        .map(([id, v]) => ({ id, ...v }))
        .sort((a, b) => (BEST_SELLERS_SORT === "profit" ? b.profit - a.profit : b.qty - a.qty));
      drinksArr.forEach((d) => {
        rows.push([periodLabelFor(key), d.name, d.qty, d.revenue, d.profit]);
      });
    }
    downloadCsv(
      `best-sellers-${BEST_SELLERS_MODE}-${Date.now()}.csv`,
      ["ช่วงเวลา", "สินค้า", "จำนวนขาย", "รายได้", "กำไร"],
      rows
    );
  };
  APP.appendChild(exportBtn);

  for (const key of keys) {
    const inner = map.get(key);
    const drinksArr = [...inner.entries()]
      .map(([id, v]) => ({ id, ...v }))
      .sort((a, b) => (BEST_SELLERS_SORT === "profit" ? b.profit - a.profit : b.qty - a.qty));
    const totalQty = drinksArr.reduce((s, d) => s + d.qty, 0);
    const totalRevenue = drinksArr.reduce((s, d) => s + d.revenue, 0);
    const totalProfit = drinksArr.reduce((s, d) => s + d.profit, 0);
    const label =
      BEST_SELLERS_MODE === "daily" ? fmtDateOnly(key) : BEST_SELLERS_MODE === "monthly" ? fmtMonthLabel(key) : `ปี ${key}`;
    const expanded = BEST_SELLERS_EXPANDED.has(key);

    const groupBtn = el(
      "button",
      "collapse-toggle",
      `${expanded ? "▾" : "▸"} ${label} — ${totalQty} ชิ้น • ฿${money(totalRevenue)} • กำไร ฿${money(totalProfit)}`
    );
    groupBtn.style.cssText = "width:100%;text-align:left;font-size:17px;font-weight:700;margin-bottom:6px;";
    groupBtn.onclick = () => {
      if (expanded) BEST_SELLERS_EXPANDED.delete(key);
      else BEST_SELLERS_EXPANDED.add(key);
      render();
    };
    APP.appendChild(groupBtn);

    if (expanded) {
      const top10 = drinksArr.slice(0, 10);
      const rest = drinksArr.slice(10);

      function renderDrinkRankRow(container, d, idx) {
        const row = el("div", "round-item");
        const topRow = el("div", "round-top");
        topRow.appendChild(el("span", null, `${idx + 1}. ${d.name}`));
        topRow.appendChild(el("span", null, `${d.qty} ชิ้น`));
        row.appendChild(topRow);
        row.appendChild(el("div", "round-meta", `รายได้ ฿${money(d.revenue)} • กำไร ฿${money(d.profit)}`));
        container.appendChild(row);
      }

      if (top10.length) {
        APP.appendChild(el("div", "section-label", "🏆 Top 10 อันดับแรก"));
        const topCard = el("div", "card");
        top10.forEach((d, idx) => renderDrinkRankRow(topCard, d, idx));
        APP.appendChild(topCard);
      }

      if (rest.length) {
        APP.appendChild(el("div", "section-label", "อันดับถัดไป"));
        const restCard = el("div", "card");
        rest.forEach((d, idx) => renderDrinkRankRow(restCard, d, idx + 10));
        APP.appendChild(restCard);
      }
    }
  }
}

function renderInsights() {
  const top = el("div", "topbar");
  const back = el("button", "back-btn", "←");
  back.onclick = goHome;
  top.appendChild(back);
  top.appendChild(el("h1", null, "📊 สถิติเพิ่มเติม"));
  APP.appendChild(top);
  APP.appendChild(renderCeoReportNav("insights"));

  const modeRow = el("div", null);
  modeRow.style.cssText = "display:flex;gap:10px;margin-bottom:14px;flex-wrap:wrap;";
  const modes = [
    ["daily", "รายวัน"],
    ["monthly", "รายเดือน"],
    ["yearly", "รายปี"],
  ];
  for (const [key, label] of modes) {
    const b = el("button", "staff-btn" + (INSIGHTS_MODE === key ? " selected" : ""), label);
    b.onclick = () => {
      INSIGHTS_MODE = key;
      render();
    };
    modeRow.appendChild(b);
  }
  APP.appendChild(modeRow);

  const karaokeStats = collectKaraokeRoomStats();
  const hourStats = collectBusiestHourStats();
  const selfBroughtStats = collectSelfBroughtItemsStats();

  const kMap =
    INSIGHTS_MODE === "daily" ? karaokeStats.byDay : INSIGHTS_MODE === "monthly" ? karaokeStats.byMonth : karaokeStats.byYear;
  const hMap = INSIGHTS_MODE === "daily" ? hourStats.byDay : INSIGHTS_MODE === "monthly" ? hourStats.byMonth : hourStats.byYear;
  const sMap =
    INSIGHTS_MODE === "daily"
      ? selfBroughtStats.byDay
      : INSIGHTS_MODE === "monthly"
      ? selfBroughtStats.byMonth
      : selfBroughtStats.byYear;

  const allKeys = new Set([...kMap.keys(), ...hMap.keys(), ...sMap.keys()]);
  const keys = [...allKeys].sort().reverse();

  if (!keys.length) {
    APP.appendChild(el("div", "empty-note", "ยังไม่มีข้อมูลเพียงพอสำหรับสถิตินี้"));
    return;
  }

  function periodLabel(key) {
    return INSIGHTS_MODE === "daily" ? fmtDateOnly(key) : INSIGHTS_MODE === "monthly" ? fmtMonthLabel(key) : `ปี ${key}`;
  }

  function hourLabel(h) {
    return `${String(h).padStart(2, "0")}:00–${String((h + 1) % 24).padStart(2, "0")}:00`;
  }

  const exportBtn = el("button", "collapse-toggle", "📊 Export CSV (ตามโหมดที่เลือกอยู่)");
  exportBtn.style.marginBottom = "10px";
  exportBtn.onclick = () => {
    const rows = [];
    for (const key of keys) {
      const label = periodLabel(key);
      const kInner = kMap.get(key);
      if (kInner) {
        for (const [room, v] of kInner.entries()) {
          rows.push([label, "ชั่วโมงคาราโอเกะตามห้อง", room, karaokeLabel(v.minutes), v.amount]);
        }
      }
      const hInner = hMap.get(key);
      if (hInner) {
        for (const [hour, count] of hInner.entries()) {
          rows.push([label, "ช่วงเวลาที่ลูกค้ามาใช้บริการ", hourLabel(hour), count, ""]);
        }
      }
      const sInner = sMap.get(key);
      if (sInner) {
        for (const [name, qty] of sInner.entries()) {
          rows.push([label, "ของที่ลูกค้านำเข้ามาเอง", name, qty, ""]);
        }
      }
    }
    downloadCsv(
      `insights-${INSIGHTS_MODE}-${Date.now()}.csv`,
      ["ช่วงเวลา", "ประเภทสถิติ", "รายการ", "จำนวน/ชั่วโมง", "จำนวนเงิน"],
      rows
    );
  };
  APP.appendChild(exportBtn);

  for (const key of keys) {
    const expanded = INSIGHTS_EXPANDED.has(key);
    const groupBtn = el("button", "collapse-toggle", `${expanded ? "▾" : "▸"} ${periodLabel(key)}`);
    groupBtn.style.cssText = "width:100%;text-align:left;font-size:17px;font-weight:700;margin-bottom:6px;";
    groupBtn.onclick = () => {
      if (expanded) INSIGHTS_EXPANDED.delete(key);
      else INSIGHTS_EXPANDED.add(key);
      render();
    };
    APP.appendChild(groupBtn);

    if (!expanded) continue;

    // ห้องที่มีชั่วโมงคาราโอเกะมากที่สุด
    APP.appendChild(el("div", "section-label", "🎤 ห้องที่มีชั่วโมงคาราโอเกะมากที่สุด"));
    const kInner = kMap.get(key);
    const kCard = el("div", "card");
    if (kInner && kInner.size) {
      const rows = [...kInner.entries()].map(([room, v]) => ({ room, ...v })).sort((a, b) => b.minutes - a.minutes);
      rows.forEach((r, idx) => {
        const row = el("div", "round-item");
        const rTop = el("div", "round-top");
        rTop.appendChild(el("span", null, `${idx + 1}. ${r.room}`));
        rTop.appendChild(el("span", null, karaokeLabel(r.minutes)));
        row.appendChild(rTop);
        row.appendChild(el("div", "round-meta", `รายได้ค่าคาราโอเกะ ฿${money(r.amount)}`));
        kCard.appendChild(row);
      });
    } else {
      kCard.appendChild(el("div", "empty-note", "ไม่มีการคิดเงินค่าคาราโอเกะในช่วงนี้"));
    }
    APP.appendChild(kCard);

    // ช่วงเวลาที่ลูกค้ามาใช้บริการมากที่สุด
    APP.appendChild(el("div", "section-label", "⏰ ช่วงเวลาที่ลูกค้ามาใช้บริการมากที่สุด"));
    const hInner = hMap.get(key);
    const hCard = el("div", "card");
    if (hInner && hInner.size) {
      const rows = [...hInner.entries()].map(([hour, count]) => ({ hour, count })).sort((a, b) => b.count - a.count);
      rows.forEach((r, idx) => {
        const row = el("div", "round-item");
        const rTop = el("div", "round-top");
        rTop.appendChild(el("span", null, `${idx + 1}. ${hourLabel(r.hour)}`));
        rTop.appendChild(el("span", null, `${r.count} บิล`));
        row.appendChild(rTop);
        hCard.appendChild(row);
      });
    } else {
      hCard.appendChild(el("div", "empty-note", "ไม่มีข้อมูลบิลในช่วงนี้"));
    }
    APP.appendChild(hCard);

    // ของที่ลูกค้านำเข้ามาเองมากที่สุด (นับจากรายการ "นำเข้า" ที่คิดเงินจริงในบิล)
    APP.appendChild(el("div", "section-label", "🍾 ของที่ลูกค้านำเข้ามาเองมากที่สุด (นับจากรายการนำเข้าที่คิดเงินในบิล)"));
    const sInner = sMap.get(key);
    const sCard = el("div", "card");
    if (sInner && sInner.size) {
      const rows = [...sInner.entries()].map(([name, qty]) => ({ name, qty })).sort((a, b) => b.qty - a.qty);
      rows.forEach((r, idx) => {
        const row = el("div", "round-item");
        const rTop = el("div", "round-top");
        rTop.appendChild(el("span", null, `${idx + 1}. ${r.name}`));
        rTop.appendChild(el("span", null, `${r.qty} ชิ้น`));
        row.appendChild(rTop);
        sCard.appendChild(row);
      });
    } else {
      sCard.appendChild(el("div", "empty-note", "ไม่มีรายการนำเข้าที่คิดเงินในช่วงนี้"));
    }
    APP.appendChild(sCard);
  }
}

// ---------- แก้ไขบิลที่ปิดไปแล้ว (CEO เท่านั้น) ----------
function editClosedBillRoundTotal(round) {
  return (round.items || []).reduce((s, i) => s + (i.free ? 0 : Math.round(Number(i.unitPrice || 0) * Number(i.qty || 0))), 0);
}

function renderEditClosedBill() {
  const top = el("div", "topbar");
  const back = el("button", "back-btn", "←");
  back.onclick = goBillHistory;
  top.appendChild(back);
  top.appendChild(el("h1", null, "✎ แก้ไขบิลที่ปิดแล้ว"));
  APP.appendChild(top);

  if (!EDIT_CLOSED_BILL) {
    APP.appendChild(el("div", "empty-note", "ไม่พบบิลที่จะแก้ไข"));
    return;
  }

  APP.appendChild(
    el(
      "div",
      "round-meta",
      "แก้ไขจำนวน/ลบรายการ หรือเพิ่มรายการที่ลืมลงได้ที่นี่ (ปรับแค่ตัวเลขในรายงาน ไม่กระทบสต็อกกลาง/สต็อกห้องย้อนหลัง)"
    )
  );

  const { rounds } = EDIT_CLOSED_BILL;
  let grandTotal = 0;

  rounds.forEach((round, roundIdx) => {
    grandTotal += editClosedBillRoundTotal(round);
    const card = el("div", "card");
    card.style.marginBottom = "10px";
    const roundTop = el("div", "round-top");
    roundTop.appendChild(el("span", null, round.employee || "-"));
    roundTop.appendChild(el("span", null, `฿${money(editClosedBillRoundTotal(round))}`));
    card.appendChild(roundTop);
    card.appendChild(el("div", "round-meta", fmtDateTime(round.timestamp)));

    (round.items || []).forEach((item, itemIdx) => {
      const row = el("div", "round-item");
      const rTop = el("div", "round-top");
      rTop.appendChild(el("span", null, item.name));
      rTop.appendChild(el("span", null, `฿${item.free ? 0 : money(Math.round(Number(item.unitPrice || 0) * Number(item.qty || 0)))}`));
      row.appendChild(rTop);

      const controlsRow = el("div", null);
      controlsRow.style.cssText = "display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-top:6px;";

      const qtyWrap = el("div", null);
      qtyWrap.appendChild(el("div", "drink-price", "จำนวน"));
      const qtyInput = document.createElement("input");
      qtyInput.type = "number";
      qtyInput.min = "0";
      qtyInput.className = "stock-input";
      qtyInput.style.width = "80px";
      qtyInput.value = item.qty;
      qtyInput.oninput = () => {
        item.qty = Math.max(0, Number(qtyInput.value) || 0);
        render();
      };
      qtyWrap.appendChild(qtyInput);
      controlsRow.appendChild(qtyWrap);

      const priceWrap = el("div", null);
      priceWrap.appendChild(el("div", "drink-price", "ราคา/หน่วย"));
      const priceInput = document.createElement("input");
      priceInput.type = "number";
      priceInput.min = "0";
      priceInput.className = "stock-input";
      priceInput.style.width = "90px";
      priceInput.value = item.unitPrice;
      priceInput.oninput = () => {
        item.unitPrice = Number(priceInput.value) || 0;
        render();
      };
      priceWrap.appendChild(priceInput);
      controlsRow.appendChild(priceWrap);

      const removeBtn = el("button", "collapse-toggle", "🗑 ลบรายการนี้");
      removeBtn.style.color = "var(--red)";
      removeBtn.onclick = () => {
        round.items.splice(itemIdx, 1);
        render();
      };
      controlsRow.appendChild(removeBtn);

      row.appendChild(controlsRow);
      card.appendChild(row);
    });

    if (!round.items.length) {
      card.appendChild(el("div", "empty-note", "ไม่มีรายการเหลือในรอบนี้แล้ว (จะถูกลบไปเมื่อบันทึก)"));
    }

    APP.appendChild(card);
  });

  APP.appendChild(el("div", "total-card card"));
  const totalCard = APP.children[APP.children.length - 1];
  totalCard.appendChild(el("div", "label", "ยอดรวมหลังแก้ไข"));
  totalCard.appendChild(el("div", "amount", `฿${money(grandTotal)}`));

  APP.appendChild(el("div", "section-label", "+ เพิ่มรายการที่ลืมลง"));
  const addCard = el("div", "card");
  const drinkSelect = document.createElement("select");
  drinkSelect.className = "stock-input";
  drinkSelect.style.width = "100%";
  drinkSelect.style.marginBottom = "8px";
  const blankOpt = document.createElement("option");
  blankOpt.value = "";
  blankOpt.textContent = "เลือกเครื่องดื่ม...";
  drinkSelect.appendChild(blankOpt);
  for (const d of activeDrinks()) {
    const opt = document.createElement("option");
    opt.value = d.id;
    opt.textContent = `${d.name} (฿${d.price})`;
    if (EDIT_CLOSED_BILL_ADD_DRINK_ID === d.id) opt.selected = true;
    drinkSelect.appendChild(opt);
  }
  drinkSelect.onchange = () => {
    EDIT_CLOSED_BILL_ADD_DRINK_ID = drinkSelect.value;
  };
  addCard.appendChild(drinkSelect);

  const addBtn = el("button", "btn-primary", "+ เพิ่มเข้าบิล (จำนวน 1)");
  addBtn.onclick = () => {
    const d = drinkById(EDIT_CLOSED_BILL_ADD_DRINK_ID || drinkSelect.value);
    if (!d) {
      toast("กรุณาเลือกเครื่องดื่มก่อน", true);
      return;
    }
    const targetRound = rounds[rounds.length - 1];
    const newItem = { id: d.id, name: d.name, qty: 1, unitPrice: d.price, free: false, lineTotal: d.price };
    if (targetRound) {
      targetRound.items.push(newItem);
    } else {
      rounds.push({
        id: `manualadd_${Date.now()}`,
        employee: "CEO",
        timestamp: new Date().toISOString(),
        items: [newItem],
        roundTotal: d.price,
      });
    }
    EDIT_CLOSED_BILL_ADD_DRINK_ID = "";
    toast(`เพิ่ม "${d.name}" เข้าบิลแล้ว (แก้จำนวนได้ด้านบน)`);
    render();
  };
  addCard.appendChild(addBtn);
  APP.appendChild(addCard);

  const btnRow = el("div", null);
  btnRow.style.cssText = "display:flex;gap:10px;margin-top:14px;";
  const saveBtn = el("button", "btn-primary", SAVING ? "กำลังบันทึก..." : "💾 บันทึกการแก้ไข");
  saveBtn.onclick = async () => {
    SAVING = true;
    render();
    try {
      STATE = await apiEditClosedBill(EDIT_CLOSED_BILL.locationId, EDIT_CLOSED_BILL.billId, rounds, "CEO");
      EDIT_CLOSED_BILL = null;
      toast("บันทึกการแก้ไขบิลเรียบร้อย");
      goBillHistory();
    } catch (e) {
      toast(e.message, true);
    }
    SAVING = false;
    render();
  };
  btnRow.appendChild(saveBtn);

  const cancelBtn = el("button", "btn-secondary", "ยกเลิก");
  cancelBtn.onclick = () => {
    EDIT_CLOSED_BILL = null;
    goBillHistory();
  };
  btnRow.appendChild(cancelBtn);
  APP.appendChild(btnRow);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------- Load & boot ----------
async function boot() {
  LOADING = true;
  LOAD_ERROR = null;
  render();
  // ลองโหลดข้อมูล 3 ครั้ง (ทันที, รอ 2 วิ, รอ 4 วิ) ก่อนจะยอมแพ้แล้วโชว์ปุ่มลองใหม่
  // กันกรณี Netlify Function เพิ่งตื่น (cold start) หรือเน็ตสะดุดชั่วคราว ไม่ให้ต้องกดลองใหม่เองทันที
  const retryDelays = [0, 2000, 4000];
  let lastError = null;
  for (const delay of retryDelays) {
    if (delay > 0) await sleep(delay);
    try {
      STATE = await apiGet();
      lastError = null;
      break;
    } catch (e) {
      lastError = e;
    }
  }
  if (lastError) {
    STATE = null;
    LOAD_ERROR = lastError.message || "โหลดข้อมูลไม่สำเร็จ";
  } else {
    startAutoRefresh();
  }
  LOADING = false;
  render();
}

// ---------- Auto-refresh: ดึงข้อมูลใหม่เป็นระยะๆ อัตโนมัติ ไม่ต้องกดรีเฟรชเอง ----------
function startAutoRefresh() {
  if (AUTO_REFRESH_TIMER) return; // กันตั้งซ้ำหลายตัว
  AUTO_REFRESH_TIMER = setInterval(silentAutoRefresh, 8000);
}

async function silentAutoRefresh() {
  // ข้ามรอบนี้ถ้ากำลังบันทึกอยู่ หรือกำลังฟังเสียงสั่งอยู่ กันชนกับงานที่ค้างอยู่
  if (SAVING || VOICE_ORDER_LISTENING) return;
  try {
    const fresh = await apiGet();
    AUTO_REFRESH_FAILS = 0;
    STATE = fresh;
    // ถ้าผู้ใช้กำลังโฟกัสอยู่ในช่องพิมพ์ (กำลังพิมพ์ค้นหา/กรอกจำนวน ฯลฯ) ให้เก็บข้อมูลใหม่ไว้ก่อน
    // ไม่ re-render รอบนี้ กันจอรีเซ็ต/เสียโฟกัสระหว่างพิมพ์ จะ render ให้ในรอบถัดไปแทน
    const activeTag = document.activeElement && document.activeElement.tagName;
    const isTyping = activeTag === "INPUT" || activeTag === "TEXTAREA";
    if (!isTyping) {
      render();
    }
  } catch (e) {
    AUTO_REFRESH_FAILS += 1;
  }
}

function goHome() {
  VIEW = { name: "home" };
  DRAFT = null;
  HOME_SEARCH = "";
  CLEAR_DAY_SHOW = false;
  CLEAR_DAY_EMPLOYEE = null;
  CLEAR_DAY_SELECTED = {};
  render();
}

function goLocation(locationId) {
  VIEW = { name: "location", locationId };
  ROOM_USE_DRAFT = {};
  ROOM_USE_EMPLOYEE = null;
  KARAOKE_SHOW = false;
  KARAOKE_START = "";
  KARAOKE_END = "";
  KARAOKE_EMPLOYEE = null;
  KARAOKE_LOG_SHOW = false;
  KARAOKE_LOG_START = "";
  KARAOKE_LOG_EMPLOYEE = null;
  CLOSE_BILL_EMPLOYEE = null;
  BILL_DISCOUNTS = {};
  RETURN_ITEM_SHOW = null;
  RETURN_ITEM_DRAFT = {};
  RETURN_ITEM_EMPLOYEE = null;
  DELETE_ROUND_SHOW = null;
  DELETE_ROUND_EMPLOYEE = null;
  ROOM_USAGE_SEARCH = "";
  render();
}

function goStock() {
  STOCK_DRAFT = { ...(STATE.stock || {}) };
  STOCK_EMPLOYEE = null;
  STOCK_SEARCH = "";
  VIEW = { name: "stock" };
  render();
}

function goRoomOverview() {
  ROOM_OVERVIEW_SEARCH = "";
  VIEW = { name: "room-overview" };
  render();
}

function goRoomStock(locationId) {
  ROOM_DRAFT = {}; // จำนวนที่จะ "เติมเพิ่ม" รอบนี้ (ไม่ใช่ยอดรวม) เริ่มจาก 0 เสมอ
  ROOM_EMPLOYEE = null;
  ROOM_STOCK_SEARCH = "";
  VIEW = { name: "room-stock", locationId };
  render();
}

function goRoomCardAdmin(locationId) {
  VIEW = { name: "room-card-admin", locationId };
  render();
}

// ---------- จัดการรายการที่แสดงในการ์ด "นับสต็อกใหม่ในห้อง" (เพิ่ม/ลบ/ย้ายลำดับ) ----------
function renderRoomCardAdmin(locationId) {
  const top = el("div", "topbar");
  const back = el("button", "back-btn", "←");
  back.onclick = () => goRoomStock(locationId);
  top.appendChild(back);
  top.appendChild(el("h1", null, "⚙ จัดการรายการนับสต็อกในห้อง"));
  APP.appendChild(top);

  APP.appendChild(
    el(
      "div",
      "round-meta",
      'เลือกว่าเครื่องดื่มตัวไหนจะโชว์ในหน้า "นับสต็อกใหม่ที่วางไว้ในห้อง" ของทุกห้อง/โต๊ะ (ตั้งค่าครั้งเดียวใช้ร่วมกันทุกห้อง) ลากที่ ⠿ เพื่อย้ายลำดับรายการที่เลือกไว้'
    )
  );

  const trackable = activeDrinks().filter((d) => d.trackStock);
  const selected = trackable.filter((d) => d.roomCard === true);
  const unselected = trackable.filter((d) => d.roomCard !== true);

  APP.appendChild(el("div", "section-label", `รายการที่แสดงอยู่ (${selected.length})`));
  const selCard = el("div", "card");
  const selContainer = el("div", null);
  for (const d of selected) {
    const row = el("div", "round-item room-card-drag-row");
    row.style.display = "flex";
    row.style.alignItems = "center";
    row.style.gap = "8px";

    const dragHandle = attachDragHandle(row, "room-card-drag-row", async (newIndex) => {
      try {
        STATE = await apiMenuAction({ action: "reorderRoomCardTo", id: d.id, toIndex: newIndex });
        render();
      } catch (e) {
        toast(e.message, true);
        render();
      }
    });
    row.appendChild(dragHandle);

    const info = el("div", null);
    info.style.flex = "1";
    info.appendChild(el("div", null, d.name));
    row.appendChild(info);

    const upBtn = el("button", "collapse-toggle", "▲");
    upBtn.onclick = async () => {
      try {
        STATE = await apiMenuAction({ action: "reorderRoomCard", id: d.id, direction: "up" });
        render();
      } catch (e) {
        toast(e.message, true);
      }
    };
    row.appendChild(upBtn);
    const downBtn = el("button", "collapse-toggle", "▼");
    downBtn.onclick = async () => {
      try {
        STATE = await apiMenuAction({ action: "reorderRoomCard", id: d.id, direction: "down" });
        render();
      } catch (e) {
        toast(e.message, true);
      }
    };
    row.appendChild(downBtn);

    const removeBtn = el("button", "collapse-toggle", "🗑 เอาออก");
    removeBtn.style.color = "var(--red)";
    removeBtn.onclick = async () => {
      try {
        STATE = await apiMenuAction({ action: "edit", id: d.id, roomCard: false });
        render();
      } catch (e) {
        toast(e.message, true);
      }
    };
    row.appendChild(removeBtn);

    selContainer.appendChild(row);
  }
  selCard.appendChild(selContainer);
  if (!selected.length) selCard.appendChild(el("div", "empty-note", "ยังไม่มีรายการที่เลือกไว้"));
  APP.appendChild(selCard);

  APP.appendChild(el("div", "section-label", "เครื่องดื่มอื่นๆ (กดเพื่อเพิ่มเข้าไปในหน้านับสต็อกห้อง)"));
  const unselCard = el("div", "card");
  if (!unselected.length) {
    unselCard.appendChild(el("div", "empty-note", "ไม่มีรายการอื่นแล้ว"));
  }
  for (const d of unselected) {
    const row = el("div", "round-item");
    row.style.display = "flex";
    row.style.alignItems = "center";
    row.style.gap = "8px";
    const info = el("div", null);
    info.style.flex = "1";
    info.appendChild(el("div", null, d.name));
    row.appendChild(info);
    const addBtn = el("button", "collapse-toggle", "+ เพิ่ม");
    addBtn.onclick = async () => {
      try {
        STATE = await apiMenuAction({ action: "edit", id: d.id, roomCard: true });
        toast(`เพิ่ม "${d.name}" เข้าหน้านับสต็อกห้องแล้ว`);
        render();
      } catch (e) {
        toast(e.message, true);
      }
    };
    row.appendChild(addBtn);
    unselCard.appendChild(row);
  }
  APP.appendChild(unselCard);
}

function goMenu() {
  MENU_EDIT_ID = null;
  MENU_SHOW_ADD = false;
  VIEW = { name: "menu" };
  render();
}

function goStaffPage() {
  STAFF_EDIT_ID = null;
  VIEW = { name: "staff-admin" };
  render();
}

function goLocationsAdmin() {
  LOC_EDIT_ID = null;
  VIEW = { name: "locations-admin" };
  render();
}

function goRatesAdmin() {
  requireCeoPin(() => {
    VIEW = { name: "rates-admin" };
    render();
  });
}

function goBillHistory() {
  requireCeoPin(() => {
    VIEW = { name: "bill-history" };
    BILL_HISTORY_EXPANDED = new Set();
    BILL_HISTORY_FROM = "";
    BILL_HISTORY_TO = "";
    render();
  });
}

function goKaraokeHistory() {
  requireCeoPin(() => {
    VIEW = { name: "karaoke-history" };
    KARAOKE_HISTORY_EXPANDED = new Set();
    KARAOKE_HISTORY_FROM = "";
    KARAOKE_HISTORY_TO = "";
    render();
  });
}

function goBestSellers() {
  requireCeoPin(() => {
    VIEW = { name: "best-sellers" };
    BEST_SELLERS_EXPANDED = new Set();
    render();
  });
}

function goInsights() {
  requireCeoPin(() => {
    VIEW = { name: "insights" };
    INSIGHTS_EXPANDED = new Set();
    render();
  });
}

function goEditClosedBill(locationId, billId) {
  requireCeoPin(() => {
    const locState = STATE.locations[locationId] || { history: [] };
    const bill = (locState.history || []).find((b) => b.id === billId);
    if (!bill) {
      toast("ไม่พบบิลนี้ (อาจถูกลบไปแล้ว)", true);
      return;
    }
    EDIT_CLOSED_BILL = {
      locationId,
      billId,
      rounds: JSON.parse(JSON.stringify(bill.rounds || [])),
    };
    EDIT_CLOSED_BILL_ADD_DRINK_ID = "";
    VIEW = { name: "edit-closed-bill" };
    render();
  });
}

function goAddRound(locationId) {
  DRAFT = { locationId, employee: null, items: {}, emptyCounts: {}, showEmpty: false, editRoundId: null };
  VIEW = { name: "add-round", locationId };
  DRINK_SEARCH = "";
  render();
}

function goEditRound(locationId, round) {
  const items = {};
  for (const i of round.items) {
    items[i.id] = { qty: i.qty, free: !!i.free };
  }
  DRAFT = {
    locationId,
    employee: round.employee,
    items,
    emptyCounts: { ...(round.emptyCounts || {}) },
    showEmpty: !!(round.emptyCounts && Object.keys(round.emptyCounts).length),
    editRoundId: round.id,
  };
  VIEW = { name: "add-round", locationId };
  DRINK_SEARCH = "";
  render();
}

// ---------- Render root ----------
function render() {
  if (STATE && Array.isArray(STATE.locationsList) && STATE.locationsList.length) {
    LOCATIONS = STATE.locationsList;
  }
  if (STATE && STATE.rates && typeof STATE.rates === "object") {
    RATES = STATE.rates;
  }
  if (STATE && STATE.settings && typeof STATE.settings === "object") {
    SETTINGS = STATE.settings;
  }
  applyFontZoom();

  APP.innerHTML = "";
  const toastRoot = document.createElement("div");
  toastRoot.id = "toast-root";
  APP.appendChild(toastRoot);

  if (LOADING) {
    const p = document.createElement("div");
    p.className = "empty-note";
    p.textContent = "กำลังโหลด...";
    APP.appendChild(p);
    return;
  }

  if (!STATE) {
    const errWrap = el("div", "empty-note");
    errWrap.style.cssText = "display:flex;flex-direction:column;align-items:center;gap:12px;padding:24px 16px;text-align:center;";
    errWrap.appendChild(el("div", null, "⚠️ " + (LOAD_ERROR || "โหลดข้อมูลไม่สำเร็จ")));
    errWrap.appendChild(el("div", "round-meta", "ตรวจสอบสัญญาณอินเทอร์เน็ตแล้วลองใหม่อีกครั้ง"));
    const retryBtn = el("button", "btn-primary", "🔄 ลองใหม่");
    retryBtn.onclick = () => {
      boot();
    };
    errWrap.appendChild(retryBtn);
    APP.appendChild(errWrap);
    return;
  }

  if (AUTO_REFRESH_FAILS >= 3) {
    const offlineNote = el("div", "round-meta", "⚠️ ขาดการเชื่อมต่อชั่วคราว กำลังลองเชื่อมต่อใหม่อัตโนมัติ...");
    offlineNote.style.cssText = "background:#FFF3E0;padding:6px 10px;border-radius:8px;margin-bottom:8px;";
    APP.appendChild(offlineNote);
  }

  if (VIEW.name === "home") renderHome();
  else if (VIEW.name === "location") renderLocation(VIEW.locationId);
  else if (VIEW.name === "add-round") renderAddRound(VIEW.locationId);
  else if (VIEW.name === "stock") renderStock();
  else if (VIEW.name === "room-stock") renderRoomStock(VIEW.locationId);
  else if (VIEW.name === "room-overview") renderRoomOverview();
  else if (VIEW.name === "room-card-admin") renderRoomCardAdmin(VIEW.locationId);
  else if (VIEW.name === "menu") renderMenu();
  else if (VIEW.name === "staff-admin") renderStaffPage();
  else if (VIEW.name === "locations-admin") renderLocationsAdmin();
  else if (VIEW.name === "bill-history") renderBillHistory();
  else if (VIEW.name === "karaoke-history") renderKaraokeHistory();
  else if (VIEW.name === "best-sellers") renderBestSellers();
  else if (VIEW.name === "rates-admin") renderRatesAdmin();
  else if (VIEW.name === "insights") renderInsights();
  else if (VIEW.name === "edit-closed-bill") renderEditClosedBill();
}

// ---------- Home ----------
// วันหยุดราชการไทยปี 2569 (ค.ศ. 2026) ตามประกาศทางการ — ปีอื่นที่ยังไม่มีในตารางนี้จะไม่ขึ้นแจ้งเตือนวันหยุด (แค่โชว์วันที่ปกติ)
const THAI_PUBLIC_HOLIDAYS = {
  "2026-01-01": "วันขึ้นปีใหม่",
  "2026-01-02": "วันหยุดเพิ่มเติมตามมติ ครม.",
  "2026-03-03": "วันมาฆบูชา",
  "2026-04-06": "วันจักรี",
  "2026-04-13": "วันสงกรานต์",
  "2026-04-14": "วันสงกรานต์",
  "2026-04-15": "วันสงกรานต์",
  "2026-05-04": "วันฉัตรมงคล",
  "2026-05-13": "วันพืชมงคล",
  "2026-05-31": "วันวิสาขบูชา",
  "2026-06-01": "หยุดชดเชยวันวิสาขบูชา",
  "2026-06-03": "วันเฉลิมพระชนมพรรษา สมเด็จพระนางเจ้าสุทิดาฯ พระบรมราชินี",
  "2026-07-28": "วันเฉลิมพระชนมพรรษา ร.10",
  "2026-07-29": "วันอาสาฬหบูชา",
  "2026-07-30": "วันเข้าพรรษา",
  "2026-08-12": "วันแม่แห่งชาติ",
  "2026-10-13": "วันนวมินทรมหาราช",
  "2026-10-23": "วันปิยมหาราช",
  "2026-12-05": "วันพ่อแห่งชาติ",
  "2026-12-07": "หยุดชดเชยวันพ่อแห่งชาติ",
  "2026-12-10": "วันรัฐธรรมนูญ",
  "2026-12-31": "วันสิ้นปี",
};

function thaiDateInfo() {
  const now = new Date();
  const dayKey = dayKeyOf(now.toISOString());
  const localMs = now.getTime() + THAILAND_OFFSET_MS;
  const local = new Date(localMs);
  const dayNames = ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์"];
  const monthNames = [
    "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
    "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
  ];
  const dayName = dayNames[local.getUTCDay()];
  const day = local.getUTCDate();
  const month = monthNames[local.getUTCMonth()];
  const buddhistYear = local.getUTCFullYear() + 543;
  const dateStr = `วัน${dayName}ที่ ${day} ${month} พ.ศ. ${buddhistYear}`;
  const holidayName = THAI_PUBLIC_HOLIDAYS[dayKey] || null;
  return { dateStr, holidayName };
}

// พูดข้อความเป็นเสียงไทย (ถ้าเบราว์เซอร์รองรับ Web Speech API) ใช้แจ้งเวลาเพิ่มรายการ/ปิดบิลสำเร็จ
function speakThai(text) {
  try {
    if (typeof window === "undefined" || !window.speechSynthesis || typeof SpeechSynthesisUtterance === "undefined") return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "th-TH";
    utter.rate = 1;
    window.speechSynthesis.speak(utter);
  } catch (e) {
    // อุปกรณ์/เบราว์เซอร์บางตัวไม่รองรับเสียงพูด ก็แค่ไม่พูด ไม่กระทบการทำงานหลัก
  }
}

// ---------- สั่งเครื่องดื่มด้วยเสียง (Thai voice ordering) ----------
// ตัวเลขที่พูดเป็นคำไทย เผื่อระบบรู้จำเสียงส่งกลับมาเป็นคำแทนที่จะเป็นตัวเลข
const THAI_QTY_WORDS = {
  "หนึ่ง": 1, "เอ็ด": 1, "สอง": 2, "สาม": 3, "สี่": 4, "ห้า": 5,
  "หก": 6, "เจ็ด": 7, "แปด": 8, "เก้า": 9, "สิบ": 10,
};

// ตัดคำว่า "ห้อง" กับช่องว่างออก แล้วแปลงเป็นตัวพิมพ์เล็ก เพื่อให้จับคู่ข้อความที่พูดได้ยืดหยุ่นขึ้น
// เช่น "ห้องแอร์ 2" กับ "แอร์2" กับ "แอร์ 2" จะกลายเป็นสตริงเดียวกันหมด
function normalizeVoiceText(s) {
  return (s || "").replace(/ห้อง/g, "").replace(/\s+/g, "").toLowerCase();
}

// พาร์สประโยคคำสั่งเสียงภาษาไทย เช่น
//   "แอร์ 2 เพิ่มน้ำดื่มเล็ก 2 ขวด โดยยูริ"
//   "ยูริ เติมน้ำดื่มเล็ก เข้าห้องแอร์ 2 โดย พร"
// คืนค่า { location, drink, qty, employeeName, missing, raw }
// missing เป็น array ของสิ่งที่จับไม่ได้ (ใช้บอกพนักงานว่าต้องพูดใหม่ตรงไหน)
function parseVoiceOrderCommand(rawText) {
  const text = (rawText || "").trim();
  const result = { location: null, drink: null, qty: 1, employeeName: null, missing: [], raw: text };
  if (!text) {
    result.missing.push("ไม่ได้ยินเสียงพูด กรุณาพูดใหม่อีกครั้ง");
    return result;
  }

  const normFull = normalizeVoiceText(text);
  const locs = (typeof LOCATIONS !== "undefined" && Array.isArray(LOCATIONS)) ? LOCATIONS : [];

  // 1. หาห้อง/โต๊ะ: ลองจับคู่ label ที่เจาะจงที่สุดก่อน (ยาวไปสั้น กันจับคำสั้นผิด)
  let matchedLoc = null;
  const byLabelLenDesc = [...locs].sort(
    (a, b) => normalizeVoiceText(b.label).length - normalizeVoiceText(a.label).length
  );
  for (const loc of byLabelLenDesc) {
    const nl = normalizeVoiceText(loc.label);
    if (nl && normFull.includes(nl)) {
      matchedLoc = loc;
      break;
    }
  }
  if (!matchedLoc) {
    // ไม่เจอชื่อเต็มเป๊ะๆ ลองจับแค่ชื่อกลุ่มห้อง (เผื่อพูดกว้างๆ ไม่ระบุโต๊ะ)
    const groups = [...new Set(locs.map((l) => l.group))].sort(
      (a, b) => normalizeVoiceText(b).length - normalizeVoiceText(a).length
    );
    for (const g of groups) {
      const ng = normalizeVoiceText(g);
      if (!ng || !normFull.includes(ng)) continue;
      const inGroup = locs.filter((l) => l.group === g);
      const tableNumMatch = text.match(/โต๊ะ\s*(\d+)/);
      if (tableNumMatch) {
        const num = tableNumMatch[1];
        matchedLoc =
          inGroup.find((l) => l.label.includes(`โต๊ะ ${num}`) || l.label.includes(`โต๊ะ${num}`)) || null;
      }
      if (!matchedLoc) {
        // ไม่ได้ระบุโต๊ะ ใช้ห้องรวม (id ลงท้าย _group คือ "จัดเลี้ยงกลุ่มเดียว") ถ้ามี ไม่งั้นใช้ตัวแรกในกลุ่ม
        matchedLoc = inGroup.find((l) => /_group$/.test(l.id)) || inGroup[0] || null;
      }
      break;
    }
  }
  result.location = matchedLoc;
  if (!matchedLoc) result.missing.push("ห้อง/โต๊ะ (พูดชื่อห้องหรือโต๊ะให้ชัดเจน)");

  // 2. หาเครื่องดื่ม: จับชื่อที่ยาวที่สุดที่ตรงกันก่อน กันจับคำสั้นๆ ผิด (เช่น "น้ำ" ไปตรงกับ "น้ำดื่ม" ทั้งที่พูดถึง "น้ำแข็ง")
  const drinks = (typeof activeDrinks === "function" ? activeDrinks() : []).filter(Boolean);
  const byNameLenDesc = [...drinks].sort(
    (a, b) => normalizeVoiceText(b.name).length - normalizeVoiceText(a.name).length
  );
  let matchedDrink = null;
  for (const d of byNameLenDesc) {
    const nd = normalizeVoiceText(d.name);
    if (nd && normFull.includes(nd)) {
      matchedDrink = d;
      break;
    }
  }
  result.drink = matchedDrink;
  if (!matchedDrink) result.missing.push("ชื่อเครื่องดื่ม (พูดชื่อสินค้าให้ตรงกับเมนู)");

  // 3. หาจำนวน: เชื่อถือได้ที่สุดคือเลขที่มีหน่วยต่อท้าย (ขวด/กระป๋อง/ฯลฯ) เพราะเลขห้อง/โต๊ะจะไม่มีหน่วยพวกนี้ตาม
  let qty = 1;
  const unitNumMatch = text.match(/(\d+)\s*(?:ขวด|กระป๋อง|แก้ว|จาน|ชิ้น|อัน|ที่|ลัง)/);
  if (unitNumMatch) {
    qty = parseInt(unitNumMatch[1], 10) || 1;
  } else {
    let foundThaiWord = false;
    for (const word in THAI_QTY_WORDS) {
      if (text.includes(word)) {
        qty = THAI_QTY_WORDS[word];
        foundThaiWord = true;
        break;
      }
    }
    if (!foundThaiWord) {
      // ลองหาเลขอารบิกล้วนๆ ที่ไม่ได้เป็นส่วนของชื่อห้อง/โต๊ะที่จับได้แล้ว
      const locText = matchedLoc ? matchedLoc.label : "";
      const bareNumMatch = text.match(/\d+/g) || [];
      const locNums = (locText.match(/\d+/g) || []);
      const leftover = bareNumMatch.filter((n) => !locNums.includes(n));
      if (leftover.length) qty = parseInt(leftover[0], 10) || 1;
    }
  }
  result.qty = qty;

  // 4. หาพนักงาน: จับคำว่า "โดย {ชื่อ}" ก่อน (ชัดเจนที่สุดว่าใครเป็นคนทำรายการ) ถ้าไม่เจอค่อยดูว่ามีชื่อพนักงานคนไหนอยู่ในประโยคบ้าง
  const staffNames = (typeof activeStaffNames === "function" ? activeStaffNames() : []) || [];
  let matchedName = null;
  const byMatch = /โดย\s*([ก-๙a-zA-Z]+)/.exec(text);
  if (byMatch) {
    const spoken = byMatch[1];
    matchedName = staffNames.find((n) => spoken.includes(n) || n.includes(spoken)) || null;
  }
  if (!matchedName) {
    for (const n of staffNames) {
      if (text.includes(n)) {
        matchedName = n;
        break;
      }
    }
  }
  result.employeeName = matchedName;
  if (!matchedName) result.missing.push("ชื่อพนักงาน (พูด 'โดย ชื่อพนักงาน' ต่อท้าย)");

  return result;
}

// เริ่มฟังเสียงสั่งเครื่องดื่ม (ใช้ Web Speech API ของเบราว์เซอร์ - รองรับเฉพาะ Chrome/เบราว์เซอร์ที่อิง Chromium และต้องมีอินเทอร์เน็ต)
function startVoiceOrder() {
  if (!SETTINGS.voiceOrderEnabled) {
    toast("ฟีเจอร์สั่งเครื่องดื่มด้วยเสียงยังไม่ได้เปิดใช้งาน (ให้ CEO เปิดจากหน้าอัตราค่าบริการ)", true);
    return;
  }
  const SpeechRecognitionCtor =
    (typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition)) || null;
  if (!SpeechRecognitionCtor) {
    toast("อุปกรณ์/เบราว์เซอร์นี้ไม่รองรับการสั่งด้วยเสียง (ต้องใช้ Chrome และมีอินเทอร์เน็ต)", true);
    return;
  }
  if (VOICE_ORDER_LISTENING) return;

  const recognition = new SpeechRecognitionCtor();
  recognition.lang = "th-TH";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
  VOICE_ORDER_RECOGNITION = recognition;
  VOICE_ORDER_LISTENING = true;
  VOICE_ORDER_LAST = null;
  render();

  recognition.onresult = async (ev) => {
    const transcript = ev.results && ev.results[0] && ev.results[0][0] ? ev.results[0][0].transcript : "";
    const parsed = parseVoiceOrderCommand(transcript);
    VOICE_ORDER_LAST = parsed;
    if (parsed.missing.length) {
      toast(`ฟังไม่ครบ: ${parsed.missing.join(", ")} (ที่พูด: "${transcript}")`, true);
      VOICE_ORDER_LISTENING = false;
      render();
      return;
    }
    const loc = parsed.location;
    const d = parsed.drink;
    try {
      STATE = await apiOrder({
        locationId: loc.id,
        employee: parsed.employeeName,
        items: [
          {
            id: d.id,
            name: d.name,
            qty: parsed.qty,
            unitPrice: d.price,
            free: false,
            lineTotal: calcLineTotal(d, parsed.qty, false),
          },
        ],
        timestamp: new Date().toISOString(),
      });
      toast(`✔ เสียง: เพิ่ม ${d.name} ${parsed.qty} ลง${loc.label} โดย ${parsed.employeeName} เรียบร้อย`);
      speakThai(`${parsed.employeeName} เพิ่ม ${d.name} ${parsed.qty} ลง${loc.label} เรียบร้อยแล้ว`);
    } catch (e) {
      toast(e.message, true);
    }
    VOICE_ORDER_LISTENING = false;
    render();
  };
  recognition.onerror = () => {
    toast("ฟังเสียงไม่สำเร็จ กรุณาลองใหม่ (ตรวจสอบสิทธิ์ไมโครโฟน/อินเทอร์เน็ต)", true);
    VOICE_ORDER_LISTENING = false;
    render();
  };
  recognition.onend = () => {
    if (VOICE_ORDER_LISTENING) {
      VOICE_ORDER_LISTENING = false;
      render();
    }
  };
  try {
    recognition.start();
  } catch (e) {
    VOICE_ORDER_LISTENING = false;
    toast("เริ่มฟังเสียงไม่สำเร็จ", true);
    render();
  }
}

function renderHome() {
  const titleBar = el("div", null);
  titleBar.style.cssText = "padding:14px 4px 6px;text-align:center;";
  const titleH1 = el("h1", null, "สวนอาหารบ้านหลงหล่ม");
  titleH1.style.cssText =
    "margin:0;font-size:26px;line-height:1.35;color:var(--brown-dark);white-space:normal;word-break:break-word;";
  titleBar.appendChild(titleH1);
  const subtitle = el("div", null, "🍹 บันทึกเครื่องดื่ม");
  subtitle.style.cssText = "font-size:14px;color:var(--brown);margin-top:2px;";
  titleBar.appendChild(subtitle);

  const { dateStr, holidayName } = thaiDateInfo();
  const dateLine = el("div", null, dateStr);
  dateLine.style.cssText = "font-size:13px;color:var(--brown);margin-top:4px;";
  titleBar.appendChild(dateLine);
  if (holidayName) {
    const holidayLine = el("div", null, `🎉 วันนี้เป็นวันหยุด: ${holidayName}`);
    holidayLine.style.cssText =
      "font-size:13px;font-weight:700;color:var(--yellow-dark);margin-top:4px;background:#FFF9EA;border-radius:8px;padding:4px 8px;display:inline-block;";
    titleBar.appendChild(holidayLine);
  }
  APP.appendChild(titleBar);

  const top = el("div", "topbar");
  const menuBtn = el("button", "icon-btn", "🍺 เมนู");
  menuBtn.onclick = goMenu;
  top.appendChild(menuBtn);
  const staffBtn = el("button", "icon-btn", "🧑\u200d🍳 พนักงาน");
  staffBtn.onclick = goStaffPage;
  top.appendChild(staffBtn);
  const locAdminBtn = el("button", "icon-btn", "🚪 จัดการห้อง/โต๊ะ");
  locAdminBtn.onclick = goLocationsAdmin;
  top.appendChild(locAdminBtn);
  const stockBtn = el("button", "icon-btn", "📦 สต็อก");
  stockBtn.onclick = goStock;
  top.appendChild(stockBtn);
  const roomOverviewBtn = el("button", "icon-btn", "📦 ของที่วางไว้แต่ละห้อง");
  roomOverviewBtn.onclick = goRoomOverview;
  top.appendChild(roomOverviewBtn);
  const billHistBtn = el("button", "icon-btn", "🧾 ประวัติบิล");
  billHistBtn.onclick = goBillHistory;
  top.appendChild(billHistBtn);
  const karaokeHistBtn = el("button", "icon-btn", "🎤 ประวัติคาราโอเกะ");
  karaokeHistBtn.onclick = goKaraokeHistory;
  top.appendChild(karaokeHistBtn);
  const bestSellersBtn = el("button", "icon-btn", "🏆 สินค้าขายดี");
  bestSellersBtn.onclick = goBestSellers;
  top.appendChild(bestSellersBtn);
  const insightsBtn = el("button", "icon-btn", "📊 สถิติเพิ่มเติม");
  insightsBtn.onclick = goInsights;
  top.appendChild(insightsBtn);
  const zoomOutBtn = el("button", "icon-btn", "ก- เล็กลง");
  zoomOutBtn.onclick = () => changeFontZoom(-0.1);
  top.appendChild(zoomOutBtn);
  const zoomInBtn = el("button", "icon-btn", "ก+ ใหญ่ขึ้น");
  zoomInBtn.onclick = () => changeFontZoom(0.1);
  top.appendChild(zoomInBtn);
  if (SETTINGS.voiceOrderEnabled) {
    // ปุ่มสั่งเสียงถูกซ่อนไว้เป็นไอคอนเล็กๆ ในแถบเมนูบน (ไม่โชว์เด่นเหมือนเดิม) เปิด/ปิดการแสดงผลนี้ได้จากหน้า "อัตราค่าบริการ" (CEO)
    const voiceIconBtn = el(
      "button",
      "icon-btn",
      VOICE_ORDER_LISTENING ? "🎤 กำลังฟัง..." : "🎤 สั่งด้วยเสียง"
    );
    if (VOICE_ORDER_LISTENING) voiceIconBtn.style.background = "var(--yellow-dark)";
    voiceIconBtn.disabled = VOICE_ORDER_LISTENING;
    voiceIconBtn.onclick = startVoiceOrder;
    top.appendChild(voiceIconBtn);
  }
  if (CEO_UNLOCKED) {
    const ratesAdminBtn = el("button", "icon-btn", "💰 อัตราค่าบริการ");
    ratesAdminBtn.onclick = goRatesAdmin;
    top.appendChild(ratesAdminBtn);
    const lockBtn = el("button", "icon-btn", "🔓 ล็อก CEO");
    lockBtn.onclick = lockCeo;
    top.appendChild(lockBtn);
  }
  APP.appendChild(top);

  const searchInput = document.createElement("input");
  searchInput.type = "text";
  searchInput.id = "home-search-input";
  searchInput.placeholder = "🔍 ค้นหาห้อง/โต๊ะ...";
  searchInput.className = "step-qty-input";
  searchInput.style.cssText =
    "width:100%;height:48px;font-size:18px;text-align:left;padding:0 14px;margin-bottom:14px;box-sizing:border-box;";
  searchInput.value = HOME_SEARCH;
  APP.appendChild(searchInput);

  if (SETTINGS.voiceOrderEnabled && VOICE_ORDER_LAST && VOICE_ORDER_LAST.raw) {
    const lastNote = el(
      "div",
      "round-meta",
      `🎤 ที่พูดล่าสุด: "${VOICE_ORDER_LAST.raw}"`
    );
    lastNote.style.marginBottom = "10px";
    APP.appendChild(lastNote);
  }

  const openLocs = LOCATIONS.filter((loc) => STATE.locations[loc.id] && STATE.locations[loc.id].openBill);
  if (openLocs.length) {
    const clearBtn = el(
      "button",
      "btn-secondary",
      CLEAR_DAY_SHOW ? "ยกเลิกเคลียร์ข้อมูลวันนี้" : `🧹 เคลียร์ข้อมูลวันนี้ (${openLocs.length} บิลค้าง)`
    );
    clearBtn.style.marginBottom = "14px";
    clearBtn.onclick = () => {
      CLEAR_DAY_SHOW = !CLEAR_DAY_SHOW;
      if (CLEAR_DAY_SHOW) {
        // เปิดฟอร์มใหม่ทุกครั้ง: เลือกไว้ให้ทั้งหมดเป็นค่าเริ่มต้น (เอาออกทีละอันได้ ไม่บังคับเคลียร์ทั้งหมด)
        CLEAR_DAY_SELECTED = Object.fromEntries(openLocs.map((l) => [l.id, true]));
      }
      render();
    };
    APP.appendChild(clearBtn);

    if (CLEAR_DAY_SHOW) {
      const card = el("div", "card");
      card.appendChild(
        el(
          "div",
          "round-meta",
          "เลือกห้อง/โต๊ะที่จะปิดบิลค้างแล้วเริ่มวันใหม่ (ติ๊กออกได้ถ้าไม่อยากปิดบางห้อง) ข้อมูลทั้งหมดยังถูกเก็บไว้ในประวัติสำหรับ CEO ตามปกติ"
        )
      );

      const selectAllRow = el("div", null);
      selectAllRow.style.cssText = "display:flex;gap:10px;margin:8px 0;";
      const selectAllBtn = el("button", "collapse-toggle", "เลือกทั้งหมด");
      selectAllBtn.onclick = () => {
        CLEAR_DAY_SELECTED = Object.fromEntries(openLocs.map((l) => [l.id, true]));
        render();
      };
      const selectNoneBtn = el("button", "collapse-toggle", "ไม่เลือกเลย");
      selectNoneBtn.onclick = () => {
        CLEAR_DAY_SELECTED = Object.fromEntries(openLocs.map((l) => [l.id, false]));
        render();
      };
      selectAllRow.appendChild(selectAllBtn);
      selectAllRow.appendChild(selectNoneBtn);
      card.appendChild(selectAllRow);

      for (const loc of openLocs) {
        const row = el("label", "round-item");
        row.style.cssText = "display:flex;align-items:center;gap:10px;cursor:pointer;";
        const cb = document.createElement("input");
        cb.type = "checkbox";
        cb.checked = !!CLEAR_DAY_SELECTED[loc.id];
        cb.onchange = () => {
          CLEAR_DAY_SELECTED[loc.id] = !!cb.checked;
          render();
        };
        row.appendChild(cb);
        row.appendChild(el("span", null, loc.label));
        card.appendChild(row);
      }

      const selectedLocs = openLocs.filter((loc) => CLEAR_DAY_SELECTED[loc.id]);

      card.appendChild(el("div", "section-label", "เลือกพนักงานผู้ทำรายการ"));
      const staffGrid = el("div", "staff-grid");
      for (const name of activeStaffNames()) {
        const b = el("button", "staff-btn" + (CLEAR_DAY_EMPLOYEE === name ? " selected" : ""), name);
        b.onclick = () => {
          CLEAR_DAY_EMPLOYEE = name;
          render();
        };
        staffGrid.appendChild(b);
      }
      card.appendChild(staffGrid);

      const confirmBtn = el(
        "button",
        "btn-primary",
        SAVING ? "กำลังเคลียร์..." : `✔ ยืนยันเคลียร์ที่เลือก (${selectedLocs.length} ห้อง/โต๊ะ)`
      );
      confirmBtn.disabled = SAVING;
      confirmBtn.onclick = async () => {
        if (!selectedLocs.length) {
          toast("ยังไม่ได้เลือกห้อง/โต๊ะที่จะเคลียร์เลย", true);
          return;
        }
        if (!CLEAR_DAY_EMPLOYEE) {
          toast("กรุณาเลือกพนักงานก่อน", true);
          return;
        }
        if (!window.confirm(`ยืนยันปิดบิลค้าง ${selectedLocs.length} ห้อง/โต๊ะที่เลือกไว้?`)) return;
        SAVING = true;
        render();
        try {
          for (const loc of selectedLocs) {
            STATE = await apiCloseBill(loc.id, CLEAR_DAY_EMPLOYEE);
          }
          CLEAR_DAY_SHOW = false;
          CLEAR_DAY_EMPLOYEE = null;
          CLEAR_DAY_SELECTED = {};
          toast("เคลียร์ข้อมูลที่เลือกเรียบร้อย");
        } catch (e) {
          toast(e.message, true);
        }
        SAVING = false;
        render();
      };
      card.appendChild(confirmBtn);
      APP.appendChild(card);
    }
  }

  const homeListWrap = el("div", null);
  APP.appendChild(homeListWrap);

  function renderHomeListInto(container) {
    container.innerHTML = "";
    const query = HOME_SEARCH.trim().toLowerCase();
    const filteredLocations = query ? LOCATIONS.filter((l) => l.label.toLowerCase().includes(query)) : LOCATIONS;

    if (query && !filteredLocations.length) {
      container.appendChild(el("div", "empty-note", `ไม่พบห้อง/โต๊ะที่ตรงกับ "${HOME_SEARCH}"`));
      return;
    }

    const groups = [];
    for (const loc of filteredLocations) {
      if (!groups.includes(loc.group)) groups.push(loc.group);
    }

    for (const g of groups) {
      container.appendChild(el("div", "group-title", g));
      const grid = el("div", "loc-grid");
      for (const loc of filteredLocations.filter((l) => l.group === g)) {
        const locState = STATE.locations[loc.id];
        const open = locState && locState.openBill;
        const total = open ? billTotal(open) : 0;
        const btn = el("button", "loc-btn" + (open ? " has-open" : ""));
        btn.appendChild(el("div", "loc-name", loc.label));
        if (open) btn.appendChild(el("div", "loc-badge", `เปิดบิล ฿${money(total)}`));
        else btn.appendChild(el("div", "loc-badge", " "));
        btn.onclick = () => goLocation(loc.id);
        grid.appendChild(btn);
      }
      container.appendChild(grid);
    }
  }

  searchInput.oninput = () => {
    HOME_SEARCH = searchInput.value;
    renderHomeListInto(homeListWrap);
  };

  renderHomeListInto(homeListWrap);
}

// ---------- Location detail ----------
// แสดงชื่อ+จำนวนของแต่ละรายการในรอบบิล พร้อมวงเล็บบอกว่ารายการนั้นดึงมาจากของที่วางไว้ในห้องอยู่แล้ว (กด "ใช้ไป" ในหน้าเติมสต็อกห้อง)
// ต่างจากรายการที่เพิ่มปกติซึ่งเป็นของใหม่ที่พนักงานเอาเข้าไปเพิ่มในห้อง (ไม่มี roomStockDeduct)
function formatRoundItemsText(r) {
  return r.items
    .map((i) => {
      const fromRoomStock = r.roomStockDeduct && Number(r.roomStockDeduct[i.id]) > 0;
      return `${i.name} x${i.qty}${i.free ? " (ฟรี)" : ""}${fromRoomStock ? " (จากของที่วางไว้ในห้อง)" : ""}`;
    })
    .join(", ");
}

// แสดงประวัติการคืนสินค้า/ลบรายการของบิลหนึ่งใบ พร้อมชื่อพนักงานผู้กด เพื่อตรวจสอบย้อนหลังได้ว่าใครทำอะไรไปบ้าง
function renderActivityLogSection(container, bill) {
  const returnsLog = (bill && bill.returnsLog) || [];
  const deletesLog = (bill && bill.deletesLog) || [];
  if (!returnsLog.length && !deletesLog.length) return;

  const wrap = el("div", null);
  wrap.style.cssText = "margin-top:8px;padding-top:8px;border-top:1px dashed var(--border);";
  wrap.appendChild(el("div", "section-label", "ประวัติการคืนสินค้า/ลบรายการ"));

  const combined = [
    ...returnsLog.map((r) => ({
      timestamp: r.timestamp,
      text: `↩ ${r.employee || "ไม่ทราบชื่อ"} คืน ${r.itemName} x${r.qty}`,
    })),
    ...deletesLog.map((d) => ({
      timestamp: d.timestamp,
      text: `🗑 ${d.employee || "ไม่ทราบชื่อ"} ลบรายการของ ${d.originalEmployee || "ไม่ทราบชื่อ"} (${d.itemsSummary || "-"}) มูลค่า ฿${money(d.roundTotal || 0)}`,
    })),
  ].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  for (const entry of combined) {
    wrap.appendChild(el("div", "round-meta", `${entry.text} • ${fmtDateTime(entry.timestamp)}`));
  }
  container.appendChild(wrap);
}

function renderLocation(locationId) {
  const loc = locById(locationId);
  const locState = STATE.locations[locationId] || { openBill: null, history: [] };
  const open = locState.openBill;

  const top = el("div", "topbar");
  const back = el("button", "back-btn", "←");
  back.onclick = goHome;
  top.appendChild(back);
  top.appendChild(el("h1", null, loc.label));
  APP.appendChild(top);

  const totalCard = el("div", "card total-card");
  totalCard.appendChild(el("div", "label", "ยอดรวมที่ยังไม่เก็บเงิน"));
  totalCard.appendChild(el("div", "amount", `฿${money(billTotal(open))}`));
  APP.appendChild(totalCard);

  if (open && open.rounds.length) {
    const billSummary = summarizeBillItems(open.rounds);
    if (billSummary.length) {
      APP.appendChild(el("div", "section-label", "รวมรายการเครื่องดื่มในบิลนี้ (เช็กไว)"));
      const summaryCard = el("div", "card");
      for (const s of billSummary) {
        const row = el("div", "round-item");
        const topRow = el("div", "round-top");
        const qtyLabel = s.isKaraoke
          ? `${s.count} ครั้ง`
          : `x${s.qty}` + (s.freeQty ? ` (+ฟรี ${s.freeQty})` : "");
        topRow.appendChild(el("span", null, `${s.name} ${qtyLabel}`));
        topRow.appendChild(el("span", null, `฿${money(s.total)}`));
        row.appendChild(topRow);
        summaryCard.appendChild(row);
      }
      APP.appendChild(summaryCard);
    }
  }

  const addBtn = el("button", "btn-primary", "+ เพิ่มรายการเครื่องดื่ม");
  addBtn.style.marginBottom = "14px";
  addBtn.onclick = () => goAddRound(locationId);
  APP.appendChild(addBtn);

const karaokeRate = karaokeRateFor(loc);
  if (karaokeRate) {
    const karaokeSession = locState.karaokeSession || null;

    // ---------- (A) บันทึกเวลาเริ่ม เฉยๆ ไม่คิดเงิน ----------
    const logToggleBtn = el(
      "button",
      "btn-secondary",
      (KARAOKE_LOG_SHOW ? "▾ " : "▸ ") +
        "🎤 บันทึกเวลาเริ่มร้องคาราโอเกะ" +
        (karaokeSession ? ` • เริ่มไว้ ${karaokeSession.startTime} โดย ${karaokeSession.employee}` : "")
    );
    logToggleBtn.style.marginBottom = "10px";
    logToggleBtn.onclick = () => {
      KARAOKE_LOG_SHOW = !KARAOKE_LOG_SHOW;
      render();
    };
    APP.appendChild(logToggleBtn);

    if (KARAOKE_LOG_SHOW) {
      const logCard = el("div", "card");
      logCard.appendChild(
        el("div", "round-meta", "แค่จดเวลาเริ่มไว้กันลืม ยังไม่คิดเงิน (ไปคิดเงินตอนจบที่ปุ่ม 💰 ด้านล่าง)")
      );

      if (karaokeSession) {
        const badge = el(
          "div",
          "round-meta",
          `🎤 กำลังจับเวลาอยู่ ตั้งแต่ ${karaokeSession.startTime} น. โดย ${karaokeSession.employee}`
        );
        badge.style.cssText = "color:var(--brown);font-weight:700;margin-bottom:8px;";
        logCard.appendChild(badge);
      }

      logCard.appendChild(el("div", "section-label", "พนักงานผู้บันทึก"));
      const logStaffGrid = el("div", "staff-grid");
      for (const name of activeStaffNames()) {
        const b = el("button", "staff-btn" + (KARAOKE_LOG_EMPLOYEE === name ? " selected" : ""), name);
        b.onclick = () => {
          KARAOKE_LOG_EMPLOYEE = name;
          render();
        };
        logStaffGrid.appendChild(b);
      }
      logCard.appendChild(logStaffGrid);

      const logTimeRow = el("div", null);
      logTimeRow.style.cssText = "display:flex;gap:16px;flex-wrap:wrap;margin:10px 0;align-items:flex-end;";

      const logStartWrap = el("div", null);
      logStartWrap.appendChild(el("div", "drink-price", "เวลาเริ่ม"));
      const logStartInput = document.createElement("input");
      logStartInput.type = "time";
      logStartInput.className = "step-qty-input";
      logStartInput.style.width = "120px";
      logStartInput.value = KARAOKE_LOG_START;
      logStartInput.oninput = () => {
        KARAOKE_LOG_START = logStartInput.value;
      };
      logStartWrap.appendChild(logStartInput);
      logTimeRow.appendChild(logStartWrap);

      const logNowBtn = el("button", "collapse-toggle", "ใช้เวลาปัจจุบัน");
      logNowBtn.onclick = () => {
        const d = new Date();
        KARAOKE_LOG_START = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
        render();
      };
      logTimeRow.appendChild(logNowBtn);
      logCard.appendChild(logTimeRow);

      const saveStartBtn = el("button", "btn-primary", SAVING ? "กำลังบันทึก..." : "▶ บันทึกเวลาเริ่ม");
      saveStartBtn.onclick = async () => {
        if (!KARAOKE_LOG_START) {
          toast("กรุณาใส่เวลาเริ่มก่อน", true);
          return;
        }
        if (!KARAOKE_LOG_EMPLOYEE) {
          toast("กรุณาเลือกพนักงานก่อนบันทึกเวลาเริ่ม", true);
          return;
        }
        SAVING = true;
        render();
        try {
          STATE = await apiKaraokeSession(locationId, "start", {
            startTime: KARAOKE_LOG_START,
            employee: KARAOKE_LOG_EMPLOYEE,
          });
          toast(`บันทึกเวลาเริ่ม ${KARAOKE_LOG_START} น. เรียบร้อย`);
        } catch (e) {
          toast(e.message, true);
        }
        SAVING = false;
        render();
      };
      logCard.appendChild(saveStartBtn);

      if (karaokeSession) {
        const cancelBtn = el("button", "btn-secondary", "✖ ยกเลิกการจับเวลานี้");
        cancelBtn.style.marginTop = "8px";
        cancelBtn.onclick = async () => {
          if (!confirm("ยกเลิกเวลาเริ่มที่บันทึกไว้ใช่ไหม?")) return;
          SAVING = true;
          render();
          try {
            STATE = await apiKaraokeSession(locationId, "cancel");
            KARAOKE_LOG_START = "";
            KARAOKE_LOG_EMPLOYEE = null;
            toast("ยกเลิกเรียบร้อย");
          } catch (e) {
            toast(e.message, true);
          }
          SAVING = false;
          render();
        };
        logCard.appendChild(cancelBtn);
      }

      APP.appendChild(logCard);
    }

    // ---------- (B) คิดเงินค่าคาราโอเกะ ----------
    if (karaokeSession && !KARAOKE_START) KARAOKE_START = karaokeSession.startTime;
    if (karaokeSession && !KARAOKE_EMPLOYEE) KARAOKE_EMPLOYEE = karaokeSession.employee;

    const karaokeToggleBtn = el(
      "button",
      "btn-secondary",
      (KARAOKE_SHOW ? "▾ " : "▸ ") + `💰 คิดเงินค่าคาราโอเกะ (฿${karaokeRate}/ชม)`
    );
    karaokeToggleBtn.style.marginBottom = "14px";
    karaokeToggleBtn.onclick = () => {
      KARAOKE_SHOW = !KARAOKE_SHOW;
      render();
    };
    APP.appendChild(karaokeToggleBtn);

    if (KARAOKE_SHOW) {
      const kCard = el("div", "card");
      kCard.appendChild(
        el("div", "round-meta", `อัตรา ${loc.group}: ฿${karaokeRate}/ชม (30 นาที ฿${Math.round(karaokeRate / 2)})`)
      );

      if (karaokeSession) {
        kCard.appendChild(
          el(
            "div",
            "round-meta",
            `(ดึงเวลาเริ่มที่บันทึกไว้ ${karaokeSession.startTime} น. โดย ${karaokeSession.employee} มาให้อัตโนมัติ แก้ไขได้ถ้าไม่ตรง)`
          )
        );
      }

      kCard.appendChild(el("div", "section-label", "พนักงานผู้บันทึก"));
      const kStaffGrid = el("div", "staff-grid");
      for (const name of activeStaffNames()) {
        const b = el("button", "staff-btn" + (KARAOKE_EMPLOYEE === name ? " selected" : ""), name);
        b.onclick = () => {
          KARAOKE_EMPLOYEE = name;
          render();
        };
        kStaffGrid.appendChild(b);
      }
      kCard.appendChild(kStaffGrid);

      const timeRow = el("div", null);
      timeRow.style.cssText = "display:flex;gap:16px;flex-wrap:wrap;margin:10px 0;align-items:flex-end;";

      const startWrap = el("div", null);
      startWrap.appendChild(el("div", "drink-price", "เวลาเริ่ม"));
      const startInput = document.createElement("input");
      startInput.type = "time";
      startInput.className = "step-qty-input";
      startInput.style.width = "120px";
      startInput.value = KARAOKE_START;
      startInput.oninput = () => {
        KARAOKE_START = startInput.value;
      };
      startWrap.appendChild(startInput);
      timeRow.appendChild(startWrap);

      const nowStartBtn = el("button", "collapse-toggle", "ใช้เวลาปัจจุบัน");
      nowStartBtn.onclick = () => {
        const d = new Date();
        KARAOKE_START = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
        render();
      };
      timeRow.appendChild(nowStartBtn);

      const endWrap = el("div", null);
      endWrap.appendChild(el("div", "drink-price", "เวลาเลิก"));
      const endInput = document.createElement("input");
      endInput.type = "time";
      endInput.className = "step-qty-input";
      endInput.style.width = "120px";
      endInput.value = KARAOKE_END;
      endInput.oninput = () => {
        KARAOKE_END = endInput.value;
      };
      endWrap.appendChild(endInput);
      timeRow.appendChild(endWrap);

      const nowBtn = el("button", "collapse-toggle", "ใช้เวลาปัจจุบันเป็นเวลาเลิก");
      nowBtn.onclick = () => {
        const d = new Date();
        KARAOKE_END = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
        render();
      };
      timeRow.appendChild(nowBtn);
      kCard.appendChild(timeRow);

      const karaokeMins = karaokeMinutes(KARAOKE_START, KARAOKE_END);
      if (karaokeMins !== null && karaokeMins > 0) {
        const previewPrice = karaokePrice(karaokeMins, karaokeRate);
        kCard.appendChild(
          el("div", "round-meta", `รวมเวลา ${karaokeLabel(karaokeMins)} = ฿${money(previewPrice)}`)
        );
      }

      const saveKaraokeBtn = el(
        "button",
        "btn-primary",
        SAVING ? "กำลังบันทึก..." : "✔ บันทึกค่าคาราโอเกะเข้าบิล"
      );
      saveKaraokeBtn.style.marginTop = "10px";
      saveKaraokeBtn.onclick = async () => {
        const m = karaokeMinutes(KARAOKE_START, KARAOKE_END);
        if (!KARAOKE_START || !KARAOKE_END || m === null || m <= 0) {
          toast("กรุณาใส่เวลาเริ่มและเวลาเลิกให้ถูกต้อง", true);
          return;
        }
        if (!KARAOKE_EMPLOYEE) {
          toast("กรุณาเลือกพนักงานผู้บันทึก", true);
          return;
        }
        const price = karaokePrice(m, karaokeRate);
        SAVING = true;
        render();
        try {
          STATE = await apiOrder({
            locationId,
            employee: KARAOKE_EMPLOYEE,
            items: [
              {
                id: `karaoke_${Date.now()}`,
                name: `ค่าคาราโอเกะ ${KARAOKE_START}–${KARAOKE_END} (${karaokeLabel(m)})`,
                qty: 1,
                unitPrice: price,
                free: false,
                minutes: m,
              },
            ],
            timestamp: new Date().toISOString(),
            clearKaraokeSession: true,
          });
          KARAOKE_SHOW = false;
          KARAOKE_START = "";
          KARAOKE_END = "";
          KARAOKE_EMPLOYEE = null;
          KARAOKE_LOG_START = "";
          KARAOKE_LOG_EMPLOYEE = null;
          toast("บันทึกค่าคาราโอเกะเรียบร้อย");
        } catch (e) {
          toast(e.message, true);
        }
        SAVING = false;
        render();
      };
      kCard.appendChild(saveKaraokeBtn);

      APP.appendChild(kCard);
    }
  }

  const meetingRate = meetingRateFor(loc);
  if (meetingRate) {
    const meetingToggleBtn = el(
      "button",
      "btn-secondary",
      (MEETING_SHOW ? "▾ " : "▸ ") + `📋 คิดเงินค่าห้องประชุม (฿${meetingRate}/ชม)`
    );
    meetingToggleBtn.style.marginBottom = "14px";
    meetingToggleBtn.onclick = () => {
      MEETING_SHOW = !MEETING_SHOW;
      render();
    };
    APP.appendChild(meetingToggleBtn);

    if (MEETING_SHOW) {
      const mCard = el("div", "card");
      mCard.appendChild(
        el("div", "round-meta", `อัตรา ${loc.group}: ฿${meetingRate}/ชม (30 นาที ฿${Math.round(meetingRate / 2)})`)
      );

      mCard.appendChild(el("div", "section-label", "พนักงานผู้บันทึก"));
      const mStaffGrid = el("div", "staff-grid");
      for (const name of activeStaffNames()) {
        const b = el("button", "staff-btn" + (MEETING_EMPLOYEE === name ? " selected" : ""), name);
        b.onclick = () => {
          MEETING_EMPLOYEE = name;
          render();
        };
        mStaffGrid.appendChild(b);
      }
      mCard.appendChild(mStaffGrid);

      const mTimeRow = el("div", null);
      mTimeRow.style.cssText = "display:flex;gap:16px;flex-wrap:wrap;margin:10px 0;align-items:flex-end;";

      const mStartWrap = el("div", null);
      mStartWrap.appendChild(el("div", "drink-price", "เวลาเริ่ม"));
      const mStartInput = document.createElement("input");
      mStartInput.type = "time";
      mStartInput.className = "step-qty-input";
      mStartInput.style.width = "120px";
      mStartInput.value = MEETING_START;
      mStartInput.oninput = () => {
        MEETING_START = mStartInput.value;
      };
      mStartWrap.appendChild(mStartInput);
      mTimeRow.appendChild(mStartWrap);

      const mNowStartBtn = el("button", "collapse-toggle", "ใช้เวลาปัจจุบัน");
      mNowStartBtn.onclick = () => {
        const d = new Date();
        MEETING_START = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
        render();
      };
      mTimeRow.appendChild(mNowStartBtn);

      const mEndWrap = el("div", null);
      mEndWrap.appendChild(el("div", "drink-price", "เวลาเลิก"));
      const mEndInput = document.createElement("input");
      mEndInput.type = "time";
      mEndInput.className = "step-qty-input";
      mEndInput.style.width = "120px";
      mEndInput.value = MEETING_END;
      mEndInput.oninput = () => {
        MEETING_END = mEndInput.value;
      };
      mEndWrap.appendChild(mEndInput);
      mTimeRow.appendChild(mEndWrap);

      const mNowEndBtn = el("button", "collapse-toggle", "ใช้เวลาปัจจุบันเป็นเวลาเลิก");
      mNowEndBtn.onclick = () => {
        const d = new Date();
        MEETING_END = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
        render();
      };
      mTimeRow.appendChild(mNowEndBtn);
      mCard.appendChild(mTimeRow);

      const meetingMins = karaokeMinutes(MEETING_START, MEETING_END);
      if (meetingMins !== null && meetingMins > 0) {
        const previewPrice = karaokePrice(meetingMins, meetingRate);
        mCard.appendChild(el("div", "round-meta", `รวมเวลา ${karaokeLabel(meetingMins)} = ฿${money(previewPrice)}`));
      }

      const saveMeetingBtn = el(
        "button",
        "btn-primary",
        SAVING ? "กำลังบันทึก..." : "✔ บันทึกค่าห้องประชุมเข้าบิล"
      );
      saveMeetingBtn.style.marginTop = "10px";
      saveMeetingBtn.onclick = async () => {
        const m = karaokeMinutes(MEETING_START, MEETING_END);
        if (!MEETING_START || !MEETING_END || m === null || m <= 0) {
          toast("กรุณาใส่เวลาเริ่มและเวลาเลิกให้ถูกต้อง", true);
          return;
        }
        if (!MEETING_EMPLOYEE) {
          toast("กรุณาเลือกพนักงานผู้บันทึก", true);
          return;
        }
        const price = karaokePrice(m, meetingRate);
        SAVING = true;
        render();
        try {
          STATE = await apiOrder({
            locationId,
            employee: MEETING_EMPLOYEE,
            items: [
              {
                id: `meeting_${Date.now()}`,
                name: `ค่าห้องประชุม ${MEETING_START}–${MEETING_END} (${karaokeLabel(m)})`,
                qty: 1,
                unitPrice: price,
                free: false,
                minutes: m,
              },
            ],
            timestamp: new Date().toISOString(),
          });
          MEETING_SHOW = false;
          MEETING_START = "";
          MEETING_END = "";
          MEETING_EMPLOYEE = null;
          toast("บันทึกค่าห้องประชุมเรียบร้อย");
        } catch (e) {
          toast(e.message, true);
        }
        SAVING = false;
        render();
      };
      mCard.appendChild(saveMeetingBtn);

      APP.appendChild(mCard);
    }
  }

  if (open && open.rounds.length) {
    APP.appendChild(el("div", "section-label", "รายการที่บันทึกไว้ (บิลปัจจุบัน)"));
    const card = el("div", "card");
    const rounds = [...open.rounds].reverse();
    for (const r of rounds) {
      const item = el("div", "round-item");
      const topRow = el("div", "round-top");
      topRow.appendChild(el("span", null, r.employee));
      topRow.appendChild(el("span", null, `฿${money(r.roundTotal)}`));
      item.appendChild(topRow);
      item.appendChild(
        el("div", "round-meta", fmtDateTime(r.timestamp) + (r.editedAt ? " (แก้ไขล่าสุด)" : ""))
      );
      const itemsText = formatRoundItemsText(r);
      item.appendChild(el("div", "round-items", itemsText));
      const actionRow = el("div", null);
      actionRow.style.display = "flex";
      actionRow.style.gap = "14px";
      const isKaraokeRound = r.items.some((i) => isSyntheticChargeItem(i.id));
      if (!isKaraokeRound) {
        const editBtn = el("button", "collapse-toggle", "✎ แก้ไขรายการนี้");
        editBtn.style.padding = "6px 4px";
        editBtn.onclick = () => goEditRound(locationId, r);
        actionRow.appendChild(editBtn);
      }
      const returnableItems = r.items.filter((i) => !isSyntheticChargeItem(i.id) && Number(i.qty || 0) > 0);
      if (!isKaraokeRound && returnableItems.length) {
        const returnBtn = el("button", "collapse-toggle", RETURN_ITEM_SHOW === r.id ? "✕ ปิดแผงคืนสินค้า" : "↩ คืนสินค้า");
        returnBtn.style.padding = "6px 4px";
        returnBtn.onclick = () => {
          if (RETURN_ITEM_SHOW === r.id) {
            RETURN_ITEM_SHOW = null;
            RETURN_ITEM_DRAFT = {};
          } else {
            RETURN_ITEM_SHOW = r.id;
            RETURN_ITEM_DRAFT = {};
          }
          render();
        };
        actionRow.appendChild(returnBtn);
      }
      const delBtn = el("button", "collapse-toggle", DELETE_ROUND_SHOW === r.id ? "✕ ปิดแผงลบรายการ" : "🗑 ลบรายการนี้");
      delBtn.style.padding = "6px 4px";
      delBtn.style.color = "var(--red)";
      delBtn.onclick = () => {
        if (DELETE_ROUND_SHOW === r.id) {
          DELETE_ROUND_SHOW = null;
        } else {
          DELETE_ROUND_SHOW = r.id;
          DELETE_ROUND_EMPLOYEE = null;
        }
        render();
      };
      actionRow.appendChild(delBtn);
      item.appendChild(actionRow);

      if (DELETE_ROUND_SHOW === r.id) {
        const delPanel = el("div", "card");
        delPanel.style.marginTop = "8px";
        delPanel.appendChild(
          el("div", "round-meta", `จะลบรายการของ ${r.employee} ยอด ฿${money(r.roundTotal)} (สต็อกที่หักไปจะคืนกลับให้อัตโนมัติ) กรุณาเลือกพนักงานผู้กดลบเพื่อบันทึกไว้`)
        );
        const delStaffGrid = el("div", "staff-grid");
        for (const name of activeStaffNames()) {
          const b = el("button", "staff-btn" + (DELETE_ROUND_EMPLOYEE === name ? " selected" : ""), name);
          b.onclick = () => {
            DELETE_ROUND_EMPLOYEE = name;
            render();
          };
          delStaffGrid.appendChild(b);
        }
        delPanel.appendChild(delStaffGrid);
        const confirmDelBtn = el("button", "btn-primary", SAVING ? "กำลังลบ..." : "🗑 ยืนยันลบรายการนี้");
        confirmDelBtn.style.marginTop = "8px";
        confirmDelBtn.disabled = SAVING;
        confirmDelBtn.onclick = async () => {
          if (!DELETE_ROUND_EMPLOYEE) {
            toast("กรุณาเลือกพนักงานผู้กดลบก่อน", true);
            return;
          }
          if (!window.confirm(`ยืนยันลบรายการนี้ของ ${r.employee} ยอด ฿${money(r.roundTotal)} โดย ${DELETE_ROUND_EMPLOYEE} ใช่ไหม?`)) return;
          SAVING = true;
          render();
          try {
            STATE = await apiDeleteRound(locationId, r.id, DELETE_ROUND_EMPLOYEE);
            DELETE_ROUND_SHOW = null;
            DELETE_ROUND_EMPLOYEE = null;
            toast("ลบรายการเรียบร้อย");
          } catch (e) {
            toast(e.message, true);
          }
          SAVING = false;
          render();
        };
        delPanel.appendChild(confirmDelBtn);
        item.appendChild(delPanel);
      }

      if (RETURN_ITEM_SHOW === r.id && returnableItems.length) {
        const returnPanel = el("div", "card");
        returnPanel.style.marginTop = "8px";
        returnPanel.appendChild(
          el("div", "round-meta", "ระบุจำนวนที่ลูกค้าคืน (ไม่รับแล้ว) ต่อรายการ กดปุ่ม + ทีละ 1 หรือกด \"คืนทั้งหมด\" ถ้าคืนทุกชิ้น สต็อกจะถูกคืนกลับให้อัตโนมัติเฉพาะจำนวนที่ระบุ")
        );
        for (const i of returnableItems) {
          const row = el("div", "round-item");
          const rTop = el("div", "round-top");
          rTop.appendChild(el("span", null, `${i.name} — มีอยู่ ${i.qty} ชิ้น${i.free ? " (ฟรี)" : ""}`));
          row.appendChild(rTop);
          const draftQty = RETURN_ITEM_DRAFT[i.id] || 0;
          const stepperRow = el("div", null);
          stepperRow.style.cssText = "display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:4px;";
          const stepper = renderMiniStepper(draftQty, (v) => {
            RETURN_ITEM_DRAFT[i.id] = Math.max(0, Math.min(v, i.qty));
          });
          stepperRow.appendChild(stepper);
          const allBtn = el("button", "collapse-toggle", `คืนทั้งหมด (${i.qty})`);
          allBtn.onclick = () => {
            RETURN_ITEM_DRAFT[i.id] = i.qty;
            render();
          };
          stepperRow.appendChild(allBtn);
          if (draftQty > 0) {
            const clearOneBtn = el("button", "collapse-toggle", "ไม่คืนรายการนี้");
            clearOneBtn.onclick = () => {
              RETURN_ITEM_DRAFT[i.id] = 0;
              render();
            };
            stepperRow.appendChild(clearOneBtn);
          }
          row.appendChild(stepperRow);
          returnPanel.appendChild(row);
        }
        const toReturnPreview = returnableItems
          .map((i) => ({ i, qty: Math.max(0, Math.min(Number(RETURN_ITEM_DRAFT[i.id]) || 0, i.qty)) }))
          .filter((x) => x.qty > 0);
        if (toReturnPreview.length) {
          const previewText = toReturnPreview.map((x) => `${x.i.name} x${x.qty}`).join(", ");
          returnPanel.appendChild(el("div", "round-meta", `จะคืน: ${previewText}`));
        }
        returnPanel.appendChild(el("div", "section-label", "เลือกพนักงานผู้กดคืนสินค้า"));
        const returnStaffGrid = el("div", "staff-grid");
        for (const name of activeStaffNames()) {
          const b = el("button", "staff-btn" + (RETURN_ITEM_EMPLOYEE === name ? " selected" : ""), name);
          b.onclick = () => {
            RETURN_ITEM_EMPLOYEE = name;
            render();
          };
          returnStaffGrid.appendChild(b);
        }
        returnPanel.appendChild(returnStaffGrid);
        const confirmReturnBtn = el("button", "btn-primary", SAVING ? "กำลังบันทึก..." : "✔ ยืนยันคืนสินค้า");
        confirmReturnBtn.style.marginTop = "8px";
        confirmReturnBtn.disabled = SAVING;
        confirmReturnBtn.onclick = async () => {
          if (!toReturnPreview.length) {
            toast("ยังไม่ได้ระบุจำนวนที่จะคืนเลย กด + หรือ \"คืนทั้งหมด\" ที่รายการที่ต้องการก่อน", true);
            return;
          }
          if (!RETURN_ITEM_EMPLOYEE) {
            toast("กรุณาเลือกพนักงานผู้กดคืนสินค้าก่อน", true);
            return;
          }
          const previewText = toReturnPreview.map((x) => `${x.i.name} x${x.qty}`).join(", ");
          if (!window.confirm(`ยืนยันคืน: ${previewText} โดย ${RETURN_ITEM_EMPLOYEE} ใช่ไหม?`)) return;
          SAVING = true;
          render();
          try {
            for (const { i, qty } of toReturnPreview) {
              STATE = await apiReturnItem(locationId, r.id, i.id, Number(qty), RETURN_ITEM_EMPLOYEE);
            }
            RETURN_ITEM_SHOW = null;
            RETURN_ITEM_DRAFT = {};
            RETURN_ITEM_EMPLOYEE = null;
            toast("คืนสินค้าเรียบร้อย สต็อกถูกคืนกลับแล้ว");
          } catch (e) {
            toast(e.message, true);
          }
          SAVING = false;
          render();
        };
        returnPanel.appendChild(confirmReturnBtn);
        item.appendChild(returnPanel);
      }

      card.appendChild(item);
    }
    APP.appendChild(card);

    const billItems = summarizeBillItems(open.rounds).filter((it) => !it.isKaraoke);
    const grossTotal = billTotal(open);
    let discountTotal = 0;
    for (const it of billItems) {
      const key = it.name; // ใช้ชื่อจับคู่กับแถวด้านล่าง (ปลอดภัยกว่าเพราะ summarizeBillItems รวมตาม id เดิมอยู่แล้ว)
      const raw = Number(BILL_DISCOUNTS[key] || 0) || 0;
      discountTotal += Math.max(0, Math.min(raw, it.total));
    }
    const netTotal = Math.max(0, grossTotal - discountTotal);

    if (billItems.length) {
      APP.appendChild(el("div", "section-label", "ส่วนลดให้ลูกค้า (ถ้ามี) — กรอกตอนปิดบิล"));
      const discountCard = el("div", "card");
      for (const it of billItems) {
        const row = el("div", "round-item");
        const rowTop = el("div", "round-top");
        rowTop.appendChild(el("span", null, `${it.name} (รวม ฿${money(it.total)})`));
        row.appendChild(rowTop);
        const discInput = document.createElement("input");
        discInput.type = "number";
        discInput.min = "0";
        discInput.placeholder = "ส่วนลด (บาท)";
        discInput.className = "stock-input";
        discInput.style.width = "140px";
        discInput.value = BILL_DISCOUNTS[it.name] || "";
        discInput.oninput = () => {
          BILL_DISCOUNTS[it.name] = discInput.value;
          renderLocation(locationId);
        };
        row.appendChild(discInput);
        discountCard.appendChild(row);
      }
      APP.appendChild(discountCard);
      APP.appendChild(
        el(
          "div",
          "round-meta",
          `ยอดก่อนหักส่วนลด ฿${money(grossTotal)} • ส่วนลดรวม ฿${money(discountTotal)} • ยอดสุทธิ ฿${money(netTotal)}`
        )
      );
    }

    APP.appendChild(el("div", "section-label", "พนักงานผู้ปิดบิล"));
    const closeStaffGrid = el("div", "staff-grid");
    for (const name of activeStaffNames()) {
      const b = el("button", "staff-btn" + (CLOSE_BILL_EMPLOYEE === name ? " selected" : ""), name);
      b.onclick = () => {
        CLOSE_BILL_EMPLOYEE = name;
        render();
      };
      closeStaffGrid.appendChild(b);
    }
    APP.appendChild(closeStaffGrid);

    const closeBtn = el("button", "btn-danger", "✔ ปิดบิล / เก็บเงินแล้ว");
    closeBtn.style.marginTop = "6px";
    closeBtn.onclick = async () => {
      if (!CLOSE_BILL_EMPLOYEE) {
        toast("กรุณาเลือกพนักงานผู้ปิดบิลก่อน", true);
        return;
      }
      if (!confirm(`ยืนยันปิดบิล ${loc.label} ยอดสุทธิ ฿${money(netTotal)}${discountTotal ? ` (ส่วนลด ฿${money(discountTotal)})` : ""} โดย ${CLOSE_BILL_EMPLOYEE} ?`))
        return;
      try {
        const discountsById = {};
        for (const it of billItems) {
          const raw = Number(BILL_DISCOUNTS[it.name] || 0) || 0;
          const applied = Math.max(0, Math.min(raw, it.total));
          if (applied > 0) discountsById[it.id] = applied;
        }
        const closerName = CLOSE_BILL_EMPLOYEE;
        STATE = await apiCloseBill(locationId, CLOSE_BILL_EMPLOYEE, discountsById);
        CLOSE_BILL_EMPLOYEE = null;
        BILL_DISCOUNTS = {};
        toast("ปิดบิลเรียบร้อย");
        speakThai(`${closerName} ทำการปิดบิล${loc.label} เรียบร้อยแล้ว`);
        render();
      } catch (e) {
        toast(e.message, true);
      }
    };
    APP.appendChild(closeBtn);
  } else {
    APP.appendChild(el("div", "empty-note", "ยังไม่มีรายการในบิลนี้"));
  }
  if (open) {
    renderActivityLogSection(APP, open);
  }

  const roomStock = (STATE.roomStock && STATE.roomStock[locationId]) || {};
  const roomStockEntries = Object.entries(roomStock).filter(([, qty]) => qty > 0);

  const roomBtn = el(
    "button",
    "btn-secondary",
    "📦 นับสต็อกใหม่ที่วางไว้ในห้องนี้" + (roomStockEntries.length ? ` (${roomStockEntries.length} รายการ)` : "")
  );
  roomBtn.style.marginBottom = "14px";
  roomBtn.onclick = () => goRoomStock(locationId);
  APP.appendChild(roomBtn);

  if (roomStockEntries.length) {
    APP.appendChild(el("div", "section-label", "ของที่วางไว้ในห้องนี้อยู่แล้ว"));
    APP.appendChild(
      el(
        "div",
        "round-meta",
        "กดใช้ไปทีละขวด หรือพิมพ์จำนวนได้เลย แล้วเลือกพนักงาน กดบันทึก ยอดเงินจะถูกรวมเข้าบิลทันที"
      )
    );

    const refCard = el("div", "card");
    function renderRoomUsageListInto(container) {
      container.innerHTML = "";
      const usageQuery = ROOM_USAGE_SEARCH.trim().toLowerCase();
      const visibleRoomStockEntries = usageQuery
        ? roomStockEntries.filter(([id]) => {
            const d = drinkById(id);
            return d && d.name.toLowerCase().includes(usageQuery);
          })
        : roomStockEntries;

      if (usageQuery && !visibleRoomStockEntries.length) {
        container.appendChild(el("div", "empty-note", `ไม่พบเครื่องดื่มที่ตรงกับ "${ROOM_USAGE_SEARCH}"`));
      }
      for (const [id, placedQty] of visibleRoomStockEntries) {
        const d = drinkById(id);
        if (!d) continue;
        container.appendChild(renderRoomUsageRow(d, placedQty, locationId));
      }
    }

    if (roomStockEntries.length > 4) {
      const usageSearchInput = document.createElement("input");
      usageSearchInput.type = "text";
      usageSearchInput.id = "room-usage-search-input";
      usageSearchInput.placeholder = "🔍 ค้นหาเครื่องดื่ม...";
      usageSearchInput.className = "step-qty-input";
      usageSearchInput.style.cssText =
        "width:100%;height:48px;font-size:18px;text-align:left;padding:0 14px;margin-bottom:10px;box-sizing:border-box;";
      usageSearchInput.value = ROOM_USAGE_SEARCH;
      usageSearchInput.oninput = () => {
        ROOM_USAGE_SEARCH = usageSearchInput.value;
        renderRoomUsageListInto(refCard);
      };
      APP.appendChild(usageSearchInput);
    }

    renderRoomUsageListInto(refCard);
    APP.appendChild(refCard);

    const totalUsedCount = Object.values(ROOM_USE_DRAFT).reduce((s, v) => s + (Number(v) || 0), 0);
    if (totalUsedCount > 0) {
      APP.appendChild(el("div", "section-label", "พนักงานที่บันทึกการใช้ไป"));
      const useStaffGrid = el("div", "staff-grid");
      for (const name of activeStaffNames()) {
        const b = el("button", "staff-btn" + (ROOM_USE_EMPLOYEE === name ? " selected" : ""), name);
        b.onclick = () => {
          ROOM_USE_EMPLOYEE = name;
          render();
        };
        useStaffGrid.appendChild(b);
      }
      APP.appendChild(useStaffGrid);

      const saveUseBtn = el("button", "btn-primary", SAVING ? "กำลังบันทึก..." : "✔ บันทึกรายการที่ใช้ไป");
      saveUseBtn.style.marginTop = "10px";
      saveUseBtn.onclick = async () => {
        if (!ROOM_USE_EMPLOYEE) {
          toast("กรุณาเลือกพนักงานผู้บันทึก", true);
          return;
        }
        const usedItems = Object.entries(ROOM_USE_DRAFT)
          .filter(([, qty]) => Number(qty) > 0)
          .map(([id, qty]) => ({ id, qty: Number(qty), free: false }));
        if (!usedItems.length) {
          toast("ยังไม่ได้กดใช้ไปเลย", true);
          return;
        }
        SAVING = true;
        render();
        const usingEmployee = ROOM_USE_EMPLOYEE;
        try {
          STATE = await apiOrder({
            locationId,
            employee: ROOM_USE_EMPLOYEE,
            items: usedItems,
            timestamp: new Date().toISOString(),
            roomStockDeduct: Object.fromEntries(usedItems.map((i) => [i.id, i.qty])),
          });
          ROOM_USE_DRAFT = {};
          ROOM_USE_EMPLOYEE = null;
          toast("บันทึกรายการที่ใช้ไปเรียบร้อย ยอดเงินถูกรวมเข้าบิลแล้ว");
          const itemsSpeech = usedItems.map((i) => `${(drinkById(i.id) || {}).name || ""} ${i.qty}`).join(" ");
          speakThai(`${usingEmployee} เพิ่ม ${itemsSpeech} ลง${loc.label} เรียบร้อยแล้ว`);
        } catch (e) {
          toast(e.message, true);
        }
        SAVING = false;
        render();
      };
      APP.appendChild(saveUseBtn);
    }
  }

  if (locState.history && locState.history.length) {
    const btn = el("button", "collapse-toggle", `🔒 ดูบิลที่ปิดแล้ว (${locState.history.length})`);
    btn.onclick = () => {
      requireCeoPin(() => {
        VIEW = { name: "location", locationId, showHistory: !VIEW.showHistory };
        render();
      });
    };
    APP.appendChild(btn);
    if (VIEW.showHistory) {
      const card = el("div", "card");
      const hist = [...locState.history].reverse();
      for (const b of hist) {
        const item = el("div", "round-item");
        const topRow = el("div", "round-top");
        topRow.appendChild(el("span", null, "บิลปิดแล้ว"));
        topRow.appendChild(el("span", null, `฿${money(billTotal(b))}`));
        item.appendChild(topRow);
        item.appendChild(el("div", "round-meta", `ปิดเมื่อ ${fmtDateTime(b.closedAt)}` + (b.closedBy ? ` • ปิดบิลโดย ${b.closedBy}` : "")));
        {
          const qs = billDrinkQtySummary(b);
          item.appendChild(
            el(
              "div",
              "round-meta",
              `ขายได้ ${qs.soldQty} ชิ้น` + (qs.returnedQty ? ` • คืน ${qs.returnedQty} ชิ้น` : "")
            )
          );
        }

        if (b.rounds && b.rounds.length) {
          const roundsWrap = el("div", null);
          roundsWrap.style.cssText = "margin-top:8px;padding-top:8px;border-top:1px dashed var(--border);";
          for (const r of [...b.rounds].reverse()) {
            const rRow = el("div", null);
            rRow.style.marginBottom = "6px";
            const rTop = el("div", "round-meta");
            rTop.style.fontWeight = "700";
            rTop.style.color = "var(--brown)";
            rTop.textContent = `${r.employee} • ${fmtDateTime(r.timestamp)}${r.editedAt ? " (แก้ไขล่าสุด)" : ""} • ฿${money(r.roundTotal)}`;
            rRow.appendChild(rTop);
            const itemsText = formatRoundItemsText(r);
            rRow.appendChild(el("div", "round-items", itemsText));
            roundsWrap.appendChild(rRow);
          }
          item.appendChild(roundsWrap);
        }
        renderActivityLogSection(item, b);

        card.appendChild(item);
      }
      APP.appendChild(card);
    }
  }

  renderStockHistorySection((STATE.roomStockHistory && STATE.roomStockHistory[locationId]) || [], "room", locationId);
}

function renderRoomUsageRow(d, placedQty, locationId) {
  const usedQty = ROOM_USE_DRAFT[d.id] || 0;
  const remaining = Math.max(0, placedQty - usedQty);

  const wrap = el("div", "drink-row");
  wrap.style.flexWrap = "wrap";
  wrap.appendChild(drinkVisualEl(d));

  const info = el("div", "drink-info");
  info.appendChild(el("div", "drink-name", d.name));
  info.appendChild(el("div", "drink-price", `วางไว้ ${placedQty} ${d.unit || "หน่วย"}`));
  wrap.appendChild(info);

  const statsRow = el("div", null);
  statsRow.style.cssText =
    "display:flex;align-items:center;gap:22px;width:100%;margin-top:10px;padding-top:10px;border-top:1px dashed var(--border);";

  const useBlock = el("div", null);
  useBlock.style.cssText = "display:flex;flex-direction:column;align-items:center;gap:4px;";
  useBlock.appendChild(el("div", "drink-price", "ใช้ไป"));
  const stepper = renderMiniStepper(usedQty, (v) => {
    const clamped = Math.max(0, Math.min(placedQty, v));
    ROOM_USE_DRAFT[d.id] = clamped;
  });
  useBlock.appendChild(stepper);
  statsRow.appendChild(useBlock);

  const remainBlock = el("div", null);
  remainBlock.style.cssText = "display:flex;flex-direction:column;align-items:center;gap:4px;";
  remainBlock.appendChild(el("div", "drink-price", "คงเหลือ"));
  const remainVal = el("div", "step-qty", String(remaining));
  remainVal.style.color = remaining <= 0 ? "var(--red)" : "var(--green)";
  remainBlock.appendChild(remainVal);
  statsRow.appendChild(remainBlock);

  wrap.appendChild(statsRow);

  const delBtn = el("button", "collapse-toggle", "🗑 ลบเครื่องดื่มนี้ออกจากห้อง");
  delBtn.style.cssText = "color:var(--red);margin-top:8px;width:100%;text-align:left;padding:6px 4px;";
  delBtn.onclick = async () => {
    if (!confirm(`ลบ "${d.name}" ออกจากของที่วางไว้ในห้องนี้ทั้งหมด (${placedQty} ${d.unit || "หน่วย"}) ใช่ไหม?`)) return;
    const employeeForDelete = ROOM_USE_EMPLOYEE || activeStaffNames()[0];
    if (!employeeForDelete) {
      toast("ไม่มีรายชื่อพนักงานในระบบ กรุณาเพิ่มพนักงานก่อน", true);
      return;
    }
    const existing = (STATE.roomStock && STATE.roomStock[locationId]) || {};
    const updated = { ...existing };
    delete updated[d.id];
    delete ROOM_USE_DRAFT[d.id];
    SAVING = true;
    render();
    try {
      STATE = await apiSetRoomStock(locationId, employeeForDelete, updated);
      toast(`ลบ "${d.name}" ออกจากห้องเรียบร้อย`);
    } catch (e) {
      toast(e.message, true);
    }
    SAVING = false;
    render();
  };
  wrap.appendChild(delBtn);

  return wrap;
}

// ---------- Bill history (ประวัติบิล รายวัน/รายเดือน) ----------
function renderBillHistory() {
  const top = el("div", "topbar");
  const back = el("button", "back-btn", "←");
  back.onclick = goHome;
  top.appendChild(back);
  top.appendChild(el("h1", null, "🧾 ประวัติบิล"));
  APP.appendChild(top);
  APP.appendChild(renderCeoReportNav("bill-history"));

  const bills = collectAllClosedBills();

  const summaryCard = el("div", "card total-card");
  summaryCard.appendChild(el("div", "label", "บิลที่ปิดแล้วทั้งหมด"));
  summaryCard.appendChild(
    el("div", "amount", `${bills.length} บิล • ฿${money(bills.reduce((s, b) => s + b.total, 0))}`)
  );
  APP.appendChild(summaryCard);

  if (!bills.length) {
    APP.appendChild(el("div", "empty-note", "ยังไม่มีบิลที่ปิดแล้ว"));
    return;
  }

  const modeRow = el("div", null);
  modeRow.style.cssText = "display:flex;gap:10px;margin-bottom:14px;";
  const dailyBtn = el("button", "staff-btn" + (BILL_HISTORY_MODE === "daily" ? " selected" : ""), "รายวัน");
  dailyBtn.onclick = () => {
    BILL_HISTORY_MODE = "daily";
    render();
  };
  const monthlyBtn = el("button", "staff-btn" + (BILL_HISTORY_MODE === "monthly" ? " selected" : ""), "รายเดือน");
  monthlyBtn.onclick = () => {
    BILL_HISTORY_MODE = "monthly";
    render();
  };
  modeRow.appendChild(dailyBtn);
  modeRow.appendChild(monthlyBtn);
  APP.appendChild(modeRow);

  APP.appendChild(el("div", "section-label", "กรองตามช่วงวันที่"));
  const filterRow = el("div", null);
  filterRow.style.cssText = "display:flex;gap:10px;align-items:center;margin-bottom:14px;flex-wrap:wrap;";
  const fromField = el("div", null);
  fromField.style.cssText = "display:flex;flex-direction:column;gap:4px;";
  fromField.appendChild(el("div", "round-meta", "จากวันที่"));
  const fromInput = document.createElement("input");
  fromInput.type = "date";
  fromInput.className = "stock-input";
  fromInput.style.width = "150px";
  fromInput.value = BILL_HISTORY_FROM;
  fromInput.onchange = () => {
    BILL_HISTORY_FROM = fromInput.value;
    render();
  };
  fromField.appendChild(fromInput);
  filterRow.appendChild(fromField);

  const toField = el("div", null);
  toField.style.cssText = "display:flex;flex-direction:column;gap:4px;";
  toField.appendChild(el("div", "round-meta", "ถึงวันที่"));
  const toInput = document.createElement("input");
  toInput.type = "date";
  toInput.className = "stock-input";
  toInput.style.width = "150px";
  toInput.value = BILL_HISTORY_TO;
  toInput.onchange = () => {
    BILL_HISTORY_TO = toInput.value;
    render();
  };
  toField.appendChild(toInput);
  filterRow.appendChild(toField);

  if (BILL_HISTORY_FROM || BILL_HISTORY_TO) {
    const clearBtn = el("button", "collapse-toggle", "✕ ล้างตัวกรอง");
    clearBtn.style.alignSelf = "flex-end";
    clearBtn.onclick = () => {
      BILL_HISTORY_FROM = "";
      BILL_HISTORY_TO = "";
      render();
    };
    filterRow.appendChild(clearBtn);
  }

  const deleteBtn = el("button", "collapse-toggle", "🗑 ลบประวัติช่วงนี้ถาวร");
  deleteBtn.style.cssText = "align-self:flex-end;color:#B4432E;";
  deleteBtn.onclick = async () => {
    if (!BILL_HISTORY_FROM && !BILL_HISTORY_TO) {
      toast("กรุณาเลือก \"จากวันที่\" หรือ \"ถึงวันที่\" ก่อนถึงจะลบได้", true);
      return;
    }
    const rangeLabel =
      BILL_HISTORY_FROM && BILL_HISTORY_TO
        ? `${BILL_HISTORY_FROM} ถึง ${BILL_HISTORY_TO}`
        : BILL_HISTORY_FROM
        ? `ตั้งแต่ ${BILL_HISTORY_FROM}`
        : `ถึง ${BILL_HISTORY_TO}`;
    if (!confirmPermanentDelete(`ลบประวัติบิลช่วง ${rangeLabel} ถาวร? สต็อกที่หักไปจะถูกคืนกลับให้อัตโนมัติ ข้อมูลจะกู้คืนไม่ได้`)) return;
    try {
      const result = await apiDeleteBillHistory(BILL_HISTORY_FROM, BILL_HISTORY_TO);
      STATE = result;
      BILL_HISTORY_FROM = "";
      BILL_HISTORY_TO = "";
      toast(`ลบประวัติบิลแล้ว ${result.deletedCount || 0} รายการ`);
      render();
    } catch (e) {
      toast(e.message, true);
    }
  };
  filterRow.appendChild(deleteBtn);
  APP.appendChild(filterRow);

  const filteredBills = bills.filter((b) => {
    if (BILL_HISTORY_FROM && b.dayKey < BILL_HISTORY_FROM) return false;
    if (BILL_HISTORY_TO && b.dayKey > BILL_HISTORY_TO) return false;
    return true;
  });

  if (filteredBills.length) {
    const exportBtn = el("button", "collapse-toggle", "📊 Export CSV (บิลที่แสดงอยู่)");
    exportBtn.style.marginBottom = "10px";
    exportBtn.onclick = () => {
      const rows = filteredBills.map((b) => {
        const qs = billDrinkQtySummary(b);
        return [
          b.locationLabel,
          fmtDateTime(b.closedAt),
          b.closedBy || "",
          b.total,
          b.discountTotal || 0,
          qs.soldQty,
          qs.returnedQty,
        ];
      });
      downloadCsv(
        `bill-history-${Date.now()}.csv`,
        ["ห้อง/โต๊ะ", "ปิดเมื่อ", "ปิดโดย", "ยอดสุทธิ", "ส่วนลด", "ขายได้(ชิ้น)", "คืน(ชิ้น)"],
        rows
      );
    };
    APP.appendChild(exportBtn);
  }

  if (!filteredBills.length) {
    APP.appendChild(el("div", "empty-note", "ไม่พบบิลในช่วงวันที่ที่เลือก"));
    return;
  }

  const isDaily = BILL_HISTORY_MODE === "daily";
  const groupsMap = new Map();
  for (const b of filteredBills) {
    const key = isDaily ? b.dayKey : b.monthKey;
    if (!groupsMap.has(key)) groupsMap.set(key, []);
    groupsMap.get(key).push(b);
  }
  const groupKeys = [...groupsMap.keys()].sort().reverse();

  for (const key of groupKeys) {
    const groupBills = groupsMap.get(key);
    const groupTotal = groupBills.reduce((s, b) => s + b.total, 0);
    const label = isDaily ? fmtDateOnly(groupBills[0].closedAt) : fmtMonthLabel(key);
    const expanded = BILL_HISTORY_EXPANDED.has(key);

    const groupBtn = el(
      "button",
      "collapse-toggle",
      `${expanded ? "▾" : "▸"} ${label} — ${groupBills.length} บิล • ฿${money(groupTotal)}`
    );
    groupBtn.style.cssText = "width:100%;text-align:left;font-size:17px;font-weight:700;margin-bottom:6px;";
    groupBtn.onclick = () => {
      if (expanded) BILL_HISTORY_EXPANDED.delete(key);
      else BILL_HISTORY_EXPANDED.add(key);
      render();
    };
    APP.appendChild(groupBtn);

    if (expanded) {
      const card = el("div", "card");
      for (const b of groupBills) {
        const item = el("div", "round-item");
        const topRow = el("div", "round-top");
        topRow.appendChild(el("span", null, b.locationLabel));
        topRow.appendChild(el("span", null, `฿${money(b.total)}`));
        item.appendChild(topRow);
        item.appendChild(el("div", "round-meta", `ปิดเมื่อ ${fmtDateTime(b.closedAt)}` + (b.closedBy ? ` • ปิดบิลโดย ${b.closedBy}` : "")));
        if (b.discountTotal) {
          item.appendChild(el("div", "round-meta", `ส่วนลดที่ให้ลูกค้า ฿${money(b.discountTotal)}`));
        }
        {
          const qs = billDrinkQtySummary(b);
          item.appendChild(
            el(
              "div",
              "round-meta",
              `ขายได้ ${qs.soldQty} ชิ้น` + (qs.returnedQty ? ` • คืน ${qs.returnedQty} ชิ้น` : "")
            )
          );
        }
        {
          const editBillBtn = el("button", "collapse-toggle", "✎ แก้ไขบิลนี้");
          editBillBtn.style.cssText = "margin-top:4px;";
          editBillBtn.onclick = (ev) => {
            ev.stopPropagation && ev.stopPropagation();
            goEditClosedBill(b.locationId, b.id);
          };
          item.appendChild(editBillBtn);
        }

        if (b.id) {
          const delBillBtn = el("button", "collapse-toggle", "🗑 ลบบิลนี้");
          delBillBtn.style.cssText = "color:#B4432E;margin-top:4px;";
          delBillBtn.onclick = async (ev) => {
            ev.stopPropagation && ev.stopPropagation();
            if (!confirmPermanentDelete(`ลบบิล "${b.locationLabel}" ยอด ฿${money(b.total)} ถาวร? สต็อกที่หักไปจะถูกคืนกลับให้อัตโนมัติ ข้อมูลจะกู้คืนไม่ได้`)) return;
            try {
              STATE = await apiDeleteSingleBill(b.locationId, b.id);
              toast("ลบบิลแล้ว");
              render();
            } catch (e) {
              toast(e.message, true);
            }
          };
          item.appendChild(delBillBtn);
        }

        if (b.rounds.length) {
          const roundsWrap = el("div", null);
          roundsWrap.style.cssText = "margin-top:8px;padding-top:8px;border-top:1px dashed var(--border);";
          for (const r of [...b.rounds].reverse()) {
            const rRow = el("div", null);
            rRow.style.marginBottom = "6px";
            const rTop = el("div", "round-meta");
            rTop.style.fontWeight = "700";
            rTop.style.color = "var(--brown)";
            rTop.textContent = `${r.employee} • ${fmtDateTime(r.timestamp)} • ฿${money(r.roundTotal)}`;
            rRow.appendChild(rTop);
            const itemsText = formatRoundItemsText(r);
            rRow.appendChild(el("div", "round-items", itemsText));
            roundsWrap.appendChild(rRow);
          }
          item.appendChild(roundsWrap);
        }
        renderActivityLogSection(item, b);
        card.appendChild(item);
      }
      APP.appendChild(card);
    }
  }
}

// ---------- Add round ----------
function renderAddRound(locationId) {
  const loc = locById(locationId);
  const isEdit = !!DRAFT.editRoundId;

  const top = el("div", "topbar");
  const back = el("button", "back-btn", "←");
  back.onclick = () => goLocation(locationId);
  top.appendChild(back);
  top.appendChild(el("h1", null, (isEdit ? "✎ แก้ไขรายการ — " : "") + loc.label));
  APP.appendChild(top);

  APP.appendChild(el("div", "section-label", "1. พนักงานที่นำเข้าไป"));
  const staffGrid = el("div", "staff-grid");
  for (const name of activeStaffNames()) {
    const b = el("button", "staff-btn" + (DRAFT.employee === name ? " selected" : ""), name);
    b.onclick = () => {
      DRAFT.employee = name;
      render();
    };
    staffGrid.appendChild(b);
  }
  APP.appendChild(staffGrid);

  APP.appendChild(el("div", "section-label", "2. จำนวนเครื่องดื่มที่นำไป"));

  const drinkSearchInput = document.createElement("input");
  drinkSearchInput.type = "text";
  drinkSearchInput.id = "drink-search-input";
  drinkSearchInput.placeholder = "🔍 ค้นหาเครื่องดื่ม...";
  drinkSearchInput.className = "step-qty-input";
  drinkSearchInput.style.cssText =
    "width:100%;height:48px;font-size:18px;text-align:left;padding:0 14px;margin-bottom:10px;box-sizing:border-box;";
  drinkSearchInput.value = DRINK_SEARCH;
  APP.appendChild(drinkSearchInput);

  const drinkCard = el("div", "card drink-grid");
  function renderDrinkListInto(container) {
    container.innerHTML = "";
    const drinkQuery = DRINK_SEARCH.trim().toLowerCase();
    const visibleDrinks = drinkQuery
      ? activeDrinks().filter((d) => d.name.toLowerCase().includes(drinkQuery))
      : activeDrinks();

    const categories = [];
    for (const d of visibleDrinks) if (!categories.includes(d.category)) categories.push(d.category);

    if (drinkQuery && !visibleDrinks.length) {
      container.appendChild(el("div", "empty-note", `ไม่พบเครื่องดื่มที่ตรงกับ "${DRINK_SEARCH}"`));
    }

    for (const cat of categories) {
      container.appendChild(el("div", "category-title", cat));
      for (const d of visibleDrinks.filter((x) => x.category === cat)) {
        container.appendChild(renderDrinkRow(d));
      }
    }
  }
  drinkSearchInput.oninput = () => {
    DRINK_SEARCH = drinkSearchInput.value;
    renderDrinkListInto(drinkCard);
  };
  renderDrinkListInto(drinkCard);
  APP.appendChild(drinkCard);

  const toggleBtn = el(
    "button",
    "collapse-toggle",
    DRAFT.showEmpty ? "ซ่อนการนับขวด/กระป๋องเปล่าก่อนหน้า" : "+ นับขวด/กระป๋องเปล่าที่เก็บได้ก่อนหน้า (ถ้ามี)"
  );
  toggleBtn.onclick = () => {
    DRAFT.showEmpty = !DRAFT.showEmpty;
    render();
  };
  APP.appendChild(toggleBtn);

  if (DRAFT.showEmpty) {
    const emptyCard = el("div", "card");
    emptyCard.appendChild(
      el("div", "round-meta", "บันทึกจำนวนขวด/กระป๋องเปล่าที่เก็บได้ในห้องก่อนนำของใหม่เข้าไป (ไม่คิดราคา ไว้เทียบยอด)")
    );
    for (const d of activeDrinks()) {
      const row = el("div", "drink-row");
      row.appendChild(drinkVisualEl(d));
      const info = el("div", "drink-info");
      info.appendChild(el("div", "drink-name", d.name));
      row.appendChild(info);
      const stepper = renderMiniStepper(
        DRAFT.emptyCounts[d.id] || 0,
        (v) => {
          DRAFT.emptyCounts[d.id] = v;
        }
      );
      row.appendChild(stepper);
      emptyCard.appendChild(row);
    }
    APP.appendChild(emptyCard);
  }

  const total = calcRoundTotal(DRAFT.items);
  const stickyFooter = el("div", "sticky-footer");
  const totalCard = el("div", "card total-card");
  totalCard.style.marginBottom = "8px";
  totalCard.appendChild(el("div", "label", "ยอดรวมรอบนี้"));
  totalCard.appendChild(el("div", "amount", `฿${money(total)}`));
  stickyFooter.appendChild(totalCard);

  const saveBtn = el(
    "button",
    "btn-primary",
    SAVING ? "กำลังบันทึก..." : isEdit ? "✔ บันทึกการแก้ไข" : "✔ บันทึกรายการนี้"
  );
  saveBtn.disabled = SAVING;
  saveBtn.onclick = async () => {
    if (!DRAFT.employee) {
      toast("กรุณาเลือกพนักงานก่อน", true);
      return;
    }
    const itemsList = [];
    for (const id in DRAFT.items) {
      const it = DRAFT.items[id];
      if (!it.qty) continue;
      const d = drinkById(id);
      itemsList.push({
        id: d.id,
        name: d.name,
        qty: it.qty,
        unitPrice: d.price,
        free: !!it.free,
        lineTotal: calcLineTotal(d, it.qty, it.free),
      });
    }
    if (!itemsList.length) {
      toast("กรุณาใส่จำนวนเครื่องดื่มอย่างน้อย 1 อย่าง", true);
      return;
    }
    SAVING = true;
    render();
    try {
      STATE = await apiOrder({
        locationId,
        employee: DRAFT.employee,
        items: itemsList,
        emptyCounts: DRAFT.emptyCounts,
        timestamp: new Date().toISOString(),
        editRoundId: DRAFT.editRoundId || undefined,
      });
      SAVING = false;
      toast(isEdit ? "แก้ไขเรียบร้อย" : "บันทึกเรียบร้อย");
      if (!isEdit) {
        const itemsSpeech = itemsList.map((i) => `${i.name} ${i.qty} ${i.free ? "ฟรี" : ""}`).join(" ");
        speakThai(`${DRAFT.employee} เพิ่ม ${itemsSpeech} ลง${loc.label} เรียบร้อยแล้ว`);
      }
      goLocation(locationId);
    } catch (e) {
      SAVING = false;
      toast(e.message, true);
      render();
    }
  };
  stickyFooter.appendChild(saveBtn);

  if (isEdit) {
    const cancelBtn = el("button", "btn-secondary", "ยกเลิกการแก้ไข");
    cancelBtn.style.marginTop = "10px";
    cancelBtn.onclick = () => goLocation(locationId);
    stickyFooter.appendChild(cancelBtn);
  }
  APP.appendChild(stickyFooter);
}

function renderDrinkRow(d) {
  const row = el("div", "drink-row");
  row.appendChild(drinkVisualEl(d));

  const info = el("div", "drink-info");
  info.appendChild(el("div", "drink-name", d.name));
  info.appendChild(el("div", "drink-price", `฿${money(d.price)} / ${d.unit || "หน่วย"}`));
  if (d.trackStock) {
    const stock = STATE.stock[d.id] || 0;
    const stockEl = el("div", "drink-stock" + (stock <= 5 ? " low" : ""), `คงเหลือ ${stock} ${d.unit}`);
    info.appendChild(stockEl);
  }
  row.appendChild(info);

  const current = DRAFT.items[d.id] || { qty: 0, free: false };

  const stepper = el("div", "stepper");
  const minus = el("button", "step-btn", "−");
  const qtyEl = el("div", "step-qty", String(current.qty));
  const plus = el("button", "step-btn", "+");
  minus.onclick = () => {
    const cur = DRAFT.items[d.id] || { qty: 0, free: false };
    cur.qty = Math.max(0, cur.qty - 1);
    DRAFT.items[d.id] = cur;
    render();
  };
  plus.onclick = () => {
    const cur = DRAFT.items[d.id] || { qty: 0, free: false };
    cur.qty = cur.qty + 1;
    DRAFT.items[d.id] = cur;
    render();
  };
  stepper.appendChild(minus);
  stepper.appendChild(qtyEl);
  stepper.appendChild(plus);
  row.appendChild(stepper);

  if (d.allowFree) {
    const wrap = el("div", "free-toggle");
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.checked = !!current.free;
    cb.onchange = () => {
      const cur = DRAFT.items[d.id] || { qty: 0, free: false };
      cur.free = cb.checked;
      DRAFT.items[d.id] = cur;
      render();
    };
    wrap.appendChild(cb);
    wrap.appendChild(el("label", null, "ฟรี"));
    row.appendChild(wrap);
  }

  return row;
}

function renderMiniStepper(value, onChange) {
  const stepper = el("div", "stepper");
  const minus = el("button", "step-btn", "−");
  const input = document.createElement("input");
  input.type = "number";
  input.className = "step-qty-input";
  input.value = value;
  input.oninput = () => {
    const v = Math.max(0, Number(input.value) || 0);
    onChange(v);
  };
  const plus = el("button", "step-btn", "+");
  minus.onclick = () => {
    const v = Math.max(0, value - 1);
    onChange(v);
    render();
  };
  plus.onclick = () => {
    const v = value + 1;
    onChange(v);
    render();
  };
  stepper.appendChild(minus);
  stepper.appendChild(input);
  stepper.appendChild(plus);
  return stepper;
}

// ---------- Stock management (สต็อกกลางของร้าน) ----------
// สินค้าที่นับสต็อกกลางจริงๆ (ตัดน้ำแข็งกับของนำเข้าออก เพราะไม่ใช่สต็อกที่ร้านซื้อมาเก็บ)
function stockTrackedDrinks() {
  return activeDrinks().filter((d) => d.trackStock && !isIceDrink(d) && !isImportDrink(d));
}

function renderStock() {
  const top = el("div", "topbar");
  const back = el("button", "back-btn", "←");
  back.onclick = goHome;
  top.appendChild(back);
  top.appendChild(el("h1", null, "📦 จัดการสต็อกเครื่องดื่ม"));
  APP.appendChild(top);

  APP.appendChild(
    el(
      "div",
      "round-meta",
      "กรอก/ปรับจำนวนได้หลายรายการพร้อมกัน แล้วกดบันทึกครั้งเดียวด้านล่าง (ช่องอื่นจะไม่รีเซ็ตระหว่างกรอก)"
    )
  );

  const allTracked = stockTrackedDrinks();

  // แจ้งเตือน Top 5 สินค้าสต็อกเหลือน้อยที่สุด
  const lowStockRanked = [...allTracked]
    .map((d) => ({ d, qty: STATE.stock[d.id] || 0 }))
    .sort((a, b) => a.qty - b.qty)
    .slice(0, 5);
  if (lowStockRanked.length) {
    APP.appendChild(el("div", "section-label", "⚠️ สินค้าสต็อกเหลือน้อยที่สุด (Top 5)"));
    const lowCard = el("div", "card");
    lowStockRanked.forEach((entry, idx) => {
      const row = el("div", "round-item");
      const rTop = el("div", "round-top");
      rTop.appendChild(el("span", null, `${idx + 1}. ${entry.d.name}`));
      rTop.appendChild(el("span", null, `เหลือ ${entry.qty} ${entry.d.unit || "หน่วย"}`));
      row.appendChild(rTop);
      lowCard.appendChild(row);
    });
    APP.appendChild(lowCard);
  }

  APP.appendChild(el("div", "section-label", "พนักงานที่นับสต็อก"));
  const staffGrid = el("div", "staff-grid");
  for (const name of activeStaffNames()) {
    const b = el("button", "staff-btn" + (STOCK_EMPLOYEE === name ? " selected" : ""), name);
    b.onclick = () => {
      STOCK_EMPLOYEE = name;
      render();
    };
    staffGrid.appendChild(b);
  }
  APP.appendChild(staffGrid);

  const stockSearchInput = document.createElement("input");
  stockSearchInput.type = "text";
  stockSearchInput.id = "stock-search-input";
  stockSearchInput.placeholder = "🔍 ค้นหาสินค้า...";
  stockSearchInput.className = "step-qty-input";
  stockSearchInput.style.cssText =
    "width:100%;height:48px;font-size:18px;text-align:left;padding:0 14px;margin-bottom:10px;box-sizing:border-box;";
  stockSearchInput.value = STOCK_SEARCH;
  APP.appendChild(stockSearchInput);

  const listWrap = el("div", null);
  function renderStockListInto(container) {
    container.innerHTML = "";
    const query = STOCK_SEARCH.trim().toLowerCase();
    const visible = query ? allTracked.filter((d) => d.name.toLowerCase().includes(query)) : allTracked;

    if (query && !visible.length) {
      container.appendChild(el("div", "empty-note", `ไม่พบสินค้าที่ตรงกับ "${STOCK_SEARCH}"`));
      return;
    }

    const categories = [];
    for (const d of visible) if (!categories.includes(d.category)) categories.push(d.category);

    for (const cat of categories) {
      container.appendChild(el("div", "category-title", cat));
      const catContainer = el("div", "card stock-grid");
      for (const d of visible.filter((x) => x.category === cat)) {
        catContainer.appendChild(renderStockDraftRow(d));
      }
      container.appendChild(catContainer);
    }
  }
  stockSearchInput.oninput = () => {
    STOCK_SEARCH = stockSearchInput.value;
    renderStockListInto(listWrap);
  };
  renderStockListInto(listWrap);
  APP.appendChild(listWrap);

  const saveBtn = el("button", "btn-primary", SAVING ? "กำลังบันทึก..." : "✔ บันทึกสต็อกทั้งหมด");
  saveBtn.disabled = SAVING;
  saveBtn.style.marginTop = "6px";
  saveBtn.onclick = async () => {
    if (!STOCK_EMPLOYEE) {
      toast("กรุณาเลือกพนักงานที่นับสต็อกก่อน", true);
      return;
    }
    SAVING = true;
    render();
    try {
      STATE = await apiSaveStock(STOCK_EMPLOYEE, STOCK_DRAFT);
      SAVING = false;
      toast("บันทึกสต็อกเรียบร้อย");
      goStock();
    } catch (e) {
      SAVING = false;
      toast(e.message, true);
      render();
    }
  };
  APP.appendChild(saveBtn);

  renderStockHistorySection(STATE.stockHistory || [], "stock");
}

function renderStockDraftRow(d) {
  const row = el("div", "stock-row stock-drag-row");

  const dragHandle = attachDragHandle(row, "stock-drag-row", async (newIndex) => {
    try {
      STATE = await apiMenuAction({ action: "reorderTo", id: d.id, toCategoryIndex: newIndex });
      render();
    } catch (e) {
      toast(e.message, true);
      render();
    }
  });
  row.appendChild(dragHandle);

  row.appendChild(drinkVisualEl(d));

  const info = el("div", "drink-info");
  info.appendChild(el("div", "drink-name", d.name));
  info.appendChild(el("div", "drink-stock", `ล่าสุด ${STATE.stock[d.id] || 0} ${d.unit || "หน่วย"}`));
  row.appendChild(info);

  const input = document.createElement("input");
  input.className = "stock-input";
  input.type = "number";
  input.value = STOCK_DRAFT[d.id] || 0;
  input.oninput = () => {
    STOCK_DRAFT[d.id] = Number(input.value) || 0;
  };
  row.appendChild(input);

  const quick = el("div", "quick-add");
  for (const q of [1, 12, 24]) {
    const b = document.createElement("button");
    b.textContent = "+" + q;
    b.onclick = () => {
      STOCK_DRAFT[d.id] = (STOCK_DRAFT[d.id] || 0) + q;
      render();
    };
    quick.appendChild(b);
  }
  row.appendChild(quick);

  return row;
}

function renderChangesText(changes) {
  return changes
    .map((c) => {
      const from = c.from !== undefined ? c.from : c.before;
      const to = c.to !== undefined ? c.to : c.after;
      return `${c.name} ${from}→${to}`;
    })
    .join(", ");
}

function renderStockHistorySection(history, kind, locationId) {
  if (!history || !history.length) return;
  const flagKey = kind === "stock" ? "showStockHistory" : "showRoomHistory";
  const btnRow = el("div", null);
  btnRow.style.cssText = "display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-bottom:6px;";
  const btn = el(
    "button",
    "collapse-toggle",
    VIEW[flagKey] ? "ซ่อนประวัติการนับสต็อก" : `ดูประวัติการนับสต็อก (${history.length})`
  );
  btn.style.marginBottom = "0";
  btn.onclick = () => {
    VIEW = { ...VIEW, [flagKey]: !VIEW[flagKey] };
    render();
  };
  btnRow.appendChild(btn);

  if (kind === "room" && locationId) {
    const clearBtn = el("button", "collapse-toggle", "🗑 ลบประวัติทั้งหมด");
    clearBtn.style.cssText = "margin-bottom:0;color:#B4432E;";
    clearBtn.onclick = async () => {
      if (!confirmPermanentDelete("ลบประวัติการนับสต็อกของห้องนี้ทั้งหมด? (จำนวนสต็อกปัจจุบันจะไม่หาย ลบแค่ประวัติ)")) return;
      try {
        STATE = await apiClearRoomStockHistory(locationId);
        toast("ลบประวัติเรียบร้อย");
        render();
      } catch (e) {
        toast(e.message, true);
      }
    };
    btnRow.appendChild(clearBtn);
  }
  APP.appendChild(btnRow);

  if (VIEW[flagKey]) {
    const card = el("div", "card");
    const rev = [...history].reverse();
    for (const h of rev) {
      const item = el("div", "round-item");
      const topRow = el("div", "round-top");
      topRow.appendChild(el("span", null, h.employee));
      topRow.appendChild(el("span", null, fmtDateTime(h.timestamp || h.at)));
      item.appendChild(topRow);
      item.appendChild(el("div", "round-items", renderChangesText(h.changes)));
      card.appendChild(item);
    }
    APP.appendChild(card);
  }
}

// ---------- Room stock (สต็อกย่อยประจำห้อง/โต๊ะ) ----------
// สรุปของที่วางไว้ในทุกห้อง/โต๊ะให้ดูทีเดียว ไม่ต้องกดเข้าไปเช็กทีละห้อง
function renderRoomOverview() {
  const top = el("div", "topbar");
  const back = el("button", "back-btn", "←");
  back.onclick = goHome;
  top.appendChild(back);
  top.appendChild(el("h1", null, "📦 สรุปของที่วางไว้แต่ละห้อง"));
  APP.appendChild(top);

  APP.appendChild(
    el(
      "div",
      "round-meta",
      "ดูภาพรวมว่าแต่ละห้อง/โต๊ะมีเครื่องดื่มอะไรวางไว้อยู่บ้างตอนนี้ (ข้อมูลจากการนับ/เติมสต็อกในห้องล่าสุด)"
    )
  );

  const searchInput = document.createElement("input");
  searchInput.type = "text";
  searchInput.id = "room-overview-search-input";
  searchInput.placeholder = "🔍 ค้นหาห้อง/โต๊ะ หรือชื่อเครื่องดื่ม...";
  searchInput.className = "step-qty-input";
  searchInput.style.cssText =
    "width:100%;height:48px;font-size:18px;text-align:left;padding:0 14px;margin:10px 0;box-sizing:border-box;";
  searchInput.value = ROOM_OVERVIEW_SEARCH;
  searchInput.oninput = () => {
    ROOM_OVERVIEW_SEARCH = searchInput.value;
    renderRoomOverviewListInto(listWrap);
  };
  APP.appendChild(searchInput);

  const listWrap = el("div", null);
  APP.appendChild(listWrap);
  renderRoomOverviewListInto(listWrap);
}

function renderRoomOverviewListInto(container) {
  container.innerHTML = "";
  const query = ROOM_OVERVIEW_SEARCH.trim().toLowerCase();

  let anyShown = false;
  for (const loc of LOCATIONS) {
    const roomStock = (STATE.roomStock && STATE.roomStock[loc.id]) || {};
    const entries = Object.entries(roomStock)
      .filter(([, qty]) => Number(qty) > 0)
      .map(([id, qty]) => ({ d: drinkById(id), qty }))
      .filter((x) => x.d);

    const roomMatches = !query || loc.label.toLowerCase().includes(query) || loc.group.toLowerCase().includes(query);
    const filteredEntries = query && !roomMatches ? entries.filter((x) => x.d.name.toLowerCase().includes(query)) : entries;

    if (query && !roomMatches && !filteredEntries.length) continue; // ห้องนี้ไม่ตรงคำค้นเลย ข้ามไป
    anyShown = true;

    const card = el("div", "card");
    const headerRow = el("div", "round-top");
    headerRow.appendChild(el("span", null, loc.label));
    headerRow.appendChild(el("span", null, filteredEntries.length ? `${filteredEntries.length} รายการ` : ""));
    card.appendChild(headerRow);

    if (!filteredEntries.length) {
      card.appendChild(el("div", "empty-note", "ยังไม่มีของวางไว้ในห้องนี้"));
    } else {
      const sorted = [...filteredEntries].sort((a, b) => a.d.name.localeCompare(b.d.name, "th"));
      const grid = el("div", "stock-grid");
      for (const x of sorted) {
        const row = el("div", "stock-row");
        row.appendChild(drinkVisualEl(x.d));
        const info = el("div", "drink-info");
        info.appendChild(el("div", "drink-name", x.d.name));
        if (x.d.unit) info.appendChild(el("div", "drink-price", x.d.unit));
        row.appendChild(info);
        row.appendChild(el("div", "room-overview-qty", String(x.qty)));
        grid.appendChild(row);
      }
      card.appendChild(grid);
    }

    const gotoBtn = el("button", "collapse-toggle", "ไปหน้าห้องนี้");
    gotoBtn.style.marginTop = "8px";
    gotoBtn.onclick = () => goLocation(loc.id);
    card.appendChild(gotoBtn);

    container.appendChild(card);
  }

  if (!anyShown) {
    container.appendChild(el("div", "empty-note", `ไม่พบห้อง/โต๊ะหรือเครื่องดื่มที่ตรงกับ "${ROOM_OVERVIEW_SEARCH}"`));
  }
}

function renderRoomStock(locationId) {
  const loc = locById(locationId);

  const top = el("div", "topbar");
  const back = el("button", "back-btn", "←");
  back.onclick = () => goLocation(locationId);
  top.appendChild(back);
  top.appendChild(el("h1", null, "📦 สต็อกในห้อง — " + loc.label));
  APP.appendChild(top);

  APP.appendChild(
    el(
      "div",
      "round-meta",
      "กดปุ่ม + หรือพิมพ์จำนวนที่ \"เติมเพิ่ม\" เข้าห้อง/โต๊ะนี้ ตัวเลขจะถูกบวกเข้ากับของที่มีอยู่แล้วให้อัตโนมัติ (แยกจากสต็อกกลางของร้าน ไม่หักสต็อกกลางตอนบันทึก)"
    )
  );

  APP.appendChild(el("div", "section-label", "พนักงานที่นับสต็อก"));
  const staffGrid = el("div", "staff-grid");
  for (const name of activeStaffNames()) {
    const b = el("button", "staff-btn" + (ROOM_EMPLOYEE === name ? " selected" : ""), name);
    b.onclick = () => {
      ROOM_EMPLOYEE = name;
      render();
    };
    staffGrid.appendChild(b);
  }
  APP.appendChild(staffGrid);

  const roomCardMgmtBtn = el("button", "collapse-toggle", "⚙ จัดการรายการที่แสดงในหน้านี้ (เพิ่ม/ลบ/ย้ายลำดับ)");
  roomCardMgmtBtn.style.marginBottom = "10px";
  roomCardMgmtBtn.onclick = () => goRoomCardAdmin(locationId);
  APP.appendChild(roomCardMgmtBtn);

  const roomSearchInput = document.createElement("input");
  roomSearchInput.type = "text";
  roomSearchInput.id = "room-stock-search-input";
  roomSearchInput.placeholder = "🔍 ค้นหาเครื่องดื่ม...";
  roomSearchInput.className = "step-qty-input";
  roomSearchInput.style.cssText =
    "width:100%;height:48px;font-size:18px;text-align:left;padding:0 14px;margin-bottom:10px;box-sizing:border-box;";
  roomSearchInput.value = ROOM_STOCK_SEARCH;
  APP.appendChild(roomSearchInput);

  const card = el("div", "card");
  function renderRoomStockListInto(container) {
    container.innerHTML = "";
    const roomQuery = ROOM_STOCK_SEARCH.trim().toLowerCase();
    // เฉพาะรายการที่ตั้งค่าไว้ว่า "แสดงในการ์ดนับสต็อกใหม่ในห้อง" (roomCard) เท่านั้น จัดการได้ที่ปุ่ม ⚙ ด้านบน
    const roomVisibleDrinks = (roomQuery
      ? activeDrinks().filter((d) => d.roomCard === true && d.name.toLowerCase().includes(roomQuery))
      : activeDrinks().filter((d) => d.roomCard === true));

    const categories = [];
    for (const d of roomVisibleDrinks) {
      if (!categories.includes(d.category)) categories.push(d.category);
    }

    if (roomQuery && !roomVisibleDrinks.length) {
      container.appendChild(el("div", "empty-note", `ไม่พบเครื่องดื่มที่ตรงกับ "${ROOM_STOCK_SEARCH}"`));
    } else if (!roomQuery && !roomVisibleDrinks.length) {
      container.appendChild(
        el("div", "empty-note", 'ยังไม่ได้เลือกรายการที่จะแสดงในหน้านี้ กดปุ่ม "⚙ จัดการรายการที่แสดงในหน้านี้" ด้านบนเพื่อเพิ่ม')
      );
    }
    for (const cat of categories) {
      container.appendChild(el("div", "category-title", cat));
      for (const d of roomVisibleDrinks.filter((x) => x.category === cat)) {
        container.appendChild(renderRoomStockRow(d, locationId));
      }
    }
  }
  roomSearchInput.oninput = () => {
    ROOM_STOCK_SEARCH = roomSearchInput.value;
    renderRoomStockListInto(card);
  };
  renderRoomStockListInto(card);
  APP.appendChild(card);

  const saveBtn = el("button", "btn-primary", SAVING ? "กำลังบันทึก..." : "✔ เติมสต็อกเข้าห้องนี้");
  saveBtn.disabled = SAVING;
  saveBtn.onclick = async () => {
    if (!ROOM_EMPLOYEE) {
      toast("กรุณาเลือกพนักงานที่นับสต็อกก่อน", true);
      return;
    }
    const hasAdd = Object.values(ROOM_DRAFT).some((v) => Number(v) > 0);
    if (!hasAdd) {
      toast("ยังไม่ได้เติมสต็อกเลย", true);
      return;
    }
    const existing = (STATE.roomStock && STATE.roomStock[locationId]) || {};
    const combined = { ...existing };
    Object.entries(ROOM_DRAFT).forEach(([id, qty]) => {
      const n = Math.max(0, Math.round(Number(qty) || 0));
      if (n > 0) combined[id] = (combined[id] || 0) + n;
    });
    SAVING = true;
    render();
    try {
      STATE = await apiSetRoomStock(locationId, ROOM_EMPLOYEE, combined);
      SAVING = false;
      toast("เติมสต็อกในห้องเรียบร้อย");
      goLocation(locationId);
    } catch (e) {
      SAVING = false;
      toast(e.message, true);
      render();
    }
  };
  APP.appendChild(saveBtn);

  const cancelBtn = el("button", "btn-secondary", "ยกเลิก");
  cancelBtn.style.marginTop = "10px";
  cancelBtn.onclick = () => goLocation(locationId);
  APP.appendChild(cancelBtn);

  renderStockHistorySection((STATE.roomStockHistory && STATE.roomStockHistory[locationId]) || [], "room", locationId);
}

function renderRoomStockRow(d, locationId) {
  const row = el("div", "drink-row");
  row.style.flexWrap = "wrap";
  row.appendChild(drinkVisualEl(d));

  const existingQty = ((STATE.roomStock && STATE.roomStock[locationId]) || {})[d.id] || 0;
  const addQty = ROOM_DRAFT[d.id] || 0;
  const newTotal = existingQty + addQty;

  const info = el("div", "drink-info");
  info.appendChild(el("div", "drink-name", d.name));
  info.appendChild(el("div", "drink-price", `มีอยู่แล้ว ${existingQty} ${d.unit || "หน่วย"}`));
  row.appendChild(info);

  const statsRow = el("div", null);
  statsRow.style.cssText =
    "display:flex;align-items:center;gap:22px;width:100%;margin-top:10px;padding-top:10px;border-top:1px dashed var(--border);";

  const addBlock = el("div", null);
  addBlock.style.cssText = "display:flex;flex-direction:column;align-items:center;gap:4px;";
  addBlock.appendChild(el("div", "drink-price", "เติมเพิ่ม"));
  const stepper = renderMiniStepper(addQty, (v) => {
    ROOM_DRAFT[d.id] = Math.max(0, v);
  });
  addBlock.appendChild(stepper);
  statsRow.appendChild(addBlock);

  const totalBlock = el("div", null);
  totalBlock.style.cssText = "display:flex;flex-direction:column;align-items:center;gap:4px;";
  totalBlock.appendChild(el("div", "drink-price", "คงเหลือ (รวมใหม่)"));
  const totalVal = el("div", "step-qty", String(newTotal));
  totalVal.style.color = "var(--green)";
  totalBlock.appendChild(totalVal);
  statsRow.appendChild(totalBlock);

  row.appendChild(statsRow);

  if (existingQty > 0) {
    const delBtn = el("button", "collapse-toggle", "🗑 ลบรายการนี้ออกจากห้อง");
    delBtn.style.cssText = "color:var(--red);margin-top:8px;width:100%;text-align:left;padding:6px 4px;";
    delBtn.onclick = async () => {
      if (!ROOM_EMPLOYEE) {
        toast("กรุณาเลือกพนักงานก่อนลบรายการ", true);
        return;
      }
      if (!confirm(`ลบ "${d.name}" ออกจากของที่วางไว้ในห้องนี้ทั้งหมด (${existingQty} ${d.unit || "หน่วย"}) ใช่ไหม?`)) return;
      const existing = (STATE.roomStock && STATE.roomStock[locationId]) || {};
      const updated = { ...existing };
      delete updated[d.id];
      delete ROOM_DRAFT[d.id];
      SAVING = true;
      render();
      try {
        STATE = await apiSetRoomStock(locationId, ROOM_EMPLOYEE, updated);
        toast(`ลบ "${d.name}" ออกจากห้องเรียบร้อย`);
      } catch (e) {
        toast(e.message, true);
      }
      SAVING = false;
      render();
    };
    row.appendChild(delBtn);
  }

  return row;
}

// ---------- Menu management (จัดการเมนูเครื่องดื่ม) ----------
function labeledField(label, inputEl) {
  const wrap = el("div", null);
  wrap.style.marginBottom = "8px";
  wrap.appendChild(el("div", "drink-price", label));
  inputEl.style.width = "100%";
  wrap.appendChild(inputEl);
  return wrap;
}

function renderMenu() {
  const top = el("div", "topbar");
  const back = el("button", "back-btn", "←");
  back.onclick = goHome;
  top.appendChild(back);
  top.appendChild(el("h1", null, "🍺 จัดการเมนูเครื่องดื่ม"));
  APP.appendChild(top);

  APP.appendChild(
    el("div", "round-meta", "แก้ไขชื่อ/ราคา/หน่วยนับ/รูปภาพได้ หรือซ่อนรายการที่เลิกขายแล้ว (ยังกู้คืนได้ภายหลัง)")
  );

  const all = STATE.drinksMenu || [];
  const categories = [];
  for (const d of all) if (!categories.includes(d.category)) categories.push(d.category);

  for (const cat of categories) {
    APP.appendChild(el("div", "category-title", cat));
    // ครอบแต่ละหมวดด้วย container ของตัวเอง เพื่อให้การลากจัดลำดับ (drag) จำกัดอยู่แค่ภายในหมวดเดียวกัน
    const catContainer = el("div", null);
    for (const d of all.filter((x) => x.category === cat)) {
      catContainer.appendChild(renderMenuRow(d));
    }
    APP.appendChild(catContainer);
  }

  const addToggle = el(
    "button",
    "collapse-toggle",
    MENU_SHOW_ADD ? "ซ่อนฟอร์มเพิ่มเครื่องดื่ม" : "+ เพิ่มเครื่องดื่มใหม่"
  );
  addToggle.onclick = () => {
    MENU_SHOW_ADD = !MENU_SHOW_ADD;
    render();
  };
  APP.appendChild(addToggle);

  if (MENU_SHOW_ADD) {
    APP.appendChild(renderAddDrinkForm());
  }
}

function renderMenuRow(d) {
  const isEditing = MENU_EDIT_ID === d.id;
  const row = el("div", "card menu-drag-row");
  row.style.marginBottom = "10px";
  row.style.display = "flex";
  row.style.alignItems = "stretch";
  row.style.gap = "0";
  if (d.active === false) row.style.opacity = "0.55";

  const dragHandle = attachDragHandle(row, "menu-drag-row", async (newIndex) => {
    try {
      STATE = await apiMenuAction({ action: "reorderTo", id: d.id, toCategoryIndex: newIndex });
      render();
    } catch (e) {
      toast(e.message, true);
      render();
    }
  });
  row.appendChild(dragHandle);

  const bodyWrap = el("div", null);
  bodyWrap.style.flex = "1";
  bodyWrap.style.minWidth = "0";
  row.appendChild(bodyWrap);

  if (!isEditing) {
    const topRow = el("div", "drink-row");
    topRow.appendChild(drinkVisualEl(d));
    const info = el("div", "drink-info");
    info.appendChild(el("div", "drink-name", d.name + (d.active === false ? " (ซ่อนอยู่)" : "")));
    info.appendChild(el("div", "drink-price", `฿${money(d.price)} / ${d.unit || "หน่วย"}`));
    topRow.appendChild(info);
    bodyWrap.appendChild(topRow);

    const actionRow = el("div", null);
    actionRow.style.display = "flex";
    actionRow.style.gap = "14px";
    actionRow.style.marginTop = "6px";
    actionRow.style.flexWrap = "wrap";

    const upBtn = el("button", "collapse-toggle", "▲");
    upBtn.onclick = async () => {
      try {
        STATE = await apiMenuAction({ action: "reorder", id: d.id, direction: "up" });
        render();
      } catch (e) {
        toast(e.message, true);
      }
    };
    actionRow.appendChild(upBtn);
    const downBtn = el("button", "collapse-toggle", "▼");
    downBtn.onclick = async () => {
      try {
        STATE = await apiMenuAction({ action: "reorder", id: d.id, direction: "down" });
        render();
      } catch (e) {
        toast(e.message, true);
      }
    };
    actionRow.appendChild(downBtn);

    const editBtn = el("button", "collapse-toggle", "✎ แก้ไข");
    editBtn.onclick = () => {
      MENU_EDIT_ID = d.id;
      MENU_EDIT_DRAFT = { name: d.name, price: d.price, cost: d.cost || 0, unit: d.unit || "ขวด", image: null, removeImage: false };
      render();
    };
    actionRow.appendChild(editBtn);

    const toggleBtn = el("button", "collapse-toggle", d.active === false ? "↩ กู้คืน" : "🗑 ซ่อนจากเมนู");
    toggleBtn.style.color = d.active === false ? "var(--green)" : "var(--red)";
    toggleBtn.onclick = async () => {
      try {
        STATE = await apiMenuAction({ action: d.active === false ? "restore" : "hide", id: d.id });
        toast(d.active === false ? "กู้คืนเรียบร้อย" : "ซ่อนจากเมนูแล้ว");
        render();
      } catch (e) {
        toast(e.message, true);
      }
    };
    actionRow.appendChild(toggleBtn);

    const deleteBtn = el("button", "collapse-toggle", "🗑 ลบถาวร");
    deleteBtn.style.color = "var(--red)";
    deleteBtn.onclick = async () => {
      if (
        !confirmPermanentDelete(
          `ลบ "${d.name}" ออกจากเมนูถาวรใช่ไหม? ลบแล้วกู้คืนไม่ได้ (รายการที่บันทึกไปแล้วในบิลเก่าจะไม่หายไป เพราะเก็บชื่อ/ราคาไว้แยกต่างหาก)`
        )
      )
        return;
      try {
        STATE = await apiMenuAction({ action: "delete", id: d.id });
        toast("ลบเครื่องดื่มออกจากเมนูแล้ว");
        render();
      } catch (e) {
        toast(e.message, true);
      }
    };
    actionRow.appendChild(deleteBtn);

    bodyWrap.appendChild(actionRow);
    return row;
  }

  bodyWrap.appendChild(el("div", "section-label", "แก้ไข: " + d.name));

  const nameInput = document.createElement("input");
  nameInput.className = "stock-input";
  nameInput.value = MENU_EDIT_DRAFT.name;
  nameInput.oninput = () => { MENU_EDIT_DRAFT.name = nameInput.value; };
  bodyWrap.appendChild(labeledField("ชื่อ", nameInput));

  const priceInput = document.createElement("input");
  priceInput.className = "stock-input";
  priceInput.type = "number";
  priceInput.value = MENU_EDIT_DRAFT.price;
  priceInput.oninput = () => { MENU_EDIT_DRAFT.price = Number(priceInput.value) || 0; };
  bodyWrap.appendChild(labeledField("ราคา", priceInput));

  if (CEO_UNLOCKED) {
    const costInput = document.createElement("input");
    costInput.className = "stock-input";
    costInput.type = "number";
    costInput.value = MENU_EDIT_DRAFT.cost || 0;
    costInput.oninput = () => { MENU_EDIT_DRAFT.cost = Number(costInput.value) || 0; };
    bodyWrap.appendChild(labeledField("ต้นทุน (CEO เท่านั้น)", costInput));
  }

  const unitInput = document.createElement("input");
  unitInput.className = "stock-input";
  unitInput.value = MENU_EDIT_DRAFT.unit;
  unitInput.oninput = () => { MENU_EDIT_DRAFT.unit = unitInput.value; };
  bodyWrap.appendChild(labeledField("หน่วยนับ", unitInput));

  const photoRow = el("div", null);
  photoRow.style.marginTop = "8px";
  photoRow.appendChild(el("div", "round-meta", "รูปภาพ (ถ่ายเอง ไม่บังคับ — ถ้าไม่ใส่จะใช้ไอคอนแทน)"));
  if ((d.image && !MENU_EDIT_DRAFT.removeImage) || MENU_EDIT_DRAFT.image) {
    const preview = document.createElement("img");
    preview.src = MENU_EDIT_DRAFT.image || d.image;
    preview.style.cssText = "width:60px;height:60px;object-fit:cover;border-radius:10px;display:block;margin-bottom:6px;";
    photoRow.appendChild(preview);
  }
  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = "image/*";
  fileInput.onchange = async () => {
    const file = fileInput.files && fileInput.files[0];
    if (!file) return;
    try {
      MENU_EDIT_DRAFT.image = await resizeImageFile(file);
      MENU_EDIT_DRAFT.removeImage = false;
      render();
    } catch (e) {
      toast(e.message, true);
    }
  };
  photoRow.appendChild(fileInput);
  if (d.image || MENU_EDIT_DRAFT.image) {
    const removeBtn = el("button", "collapse-toggle", "ลบรูป ใช้ไอคอนแทน");
    removeBtn.onclick = () => {
      MENU_EDIT_DRAFT.removeImage = true;
      MENU_EDIT_DRAFT.image = null;
      render();
    };
    photoRow.appendChild(removeBtn);
  }
  bodyWrap.appendChild(photoRow);

  const btnRow = el("div", null);
  btnRow.style.marginTop = "10px";
  const saveBtn = el("button", "btn-primary", "✔ บันทึก");
  saveBtn.onclick = async () => {
    try {
      STATE = await apiMenuAction({
        action: "edit",
        id: d.id,
        name: MENU_EDIT_DRAFT.name,
        price: MENU_EDIT_DRAFT.price,
        cost: CEO_UNLOCKED ? MENU_EDIT_DRAFT.cost : undefined,
        unit: MENU_EDIT_DRAFT.unit,
        image: MENU_EDIT_DRAFT.image || undefined,
        removeImage: MENU_EDIT_DRAFT.removeImage || undefined,
      });
      MENU_EDIT_ID = null;
      toast("บันทึกเรียบร้อย");
      render();
    } catch (e) {
      toast(e.message, true);
    }
  };
  btnRow.appendChild(saveBtn);
  const cancelBtn = el("button", "btn-secondary", "ยกเลิก");
  cancelBtn.style.marginTop = "8px";
  cancelBtn.onclick = () => {
    MENU_EDIT_ID = null;
    render();
  };
  btnRow.appendChild(cancelBtn);
  bodyWrap.appendChild(btnRow);

  return row;
}

function renderAddDrinkForm() {
  const card = el("div", "card");
  card.appendChild(el("div", "section-label", "เพิ่มเครื่องดื่มใหม่"));

  const nameInput = document.createElement("input");
  nameInput.className = "stock-input";
  nameInput.placeholder = "ชื่อเครื่องดื่ม";
  card.appendChild(labeledField("ชื่อ", nameInput));

  const priceInput = document.createElement("input");
  priceInput.type = "number";
  priceInput.className = "stock-input";
  card.appendChild(labeledField("ราคา", priceInput));

  let costInput = null;
  if (CEO_UNLOCKED) {
    costInput = document.createElement("input");
    costInput.type = "number";
    costInput.className = "stock-input";
    card.appendChild(labeledField("ต้นทุน (CEO เท่านั้น)", costInput));
  }

  const unitInput = document.createElement("input");
  unitInput.className = "stock-input";
  unitInput.value = "ขวด";
  card.appendChild(labeledField("หน่วยนับ", unitInput));

  const catInput = document.createElement("input");
  catInput.className = "stock-input";
  catInput.placeholder = "เช่น เบียร์, เหล้า/สุรา, น้ำอัดลม/เครื่องดื่ม";
  card.appendChild(labeledField("หมวดหมู่", catInput));

  card.appendChild(el("div", "drink-price", "ไอคอน (ใช้ถ้ายังไม่มีรูปถ่าย)"));
  const iconGrid = el("div", null);
  iconGrid.style.cssText = "display:flex;flex-wrap:wrap;gap:8px;margin-bottom:10px;";
  let selectedIcon = "softDrink";
  const iconButtons = [];
  for (const key of Object.keys(ICONS)) {
    const b = document.createElement("button");
    b.type = "button";
    b.style.cssText =
      "border:2px solid " +
      (key === selectedIcon ? "var(--yellow)" : "var(--border)") +
      ";border-radius:10px;padding:4px;background:#fff;cursor:pointer;";
    b.innerHTML = ICONS[key];
    b.onclick = () => {
      selectedIcon = key;
      for (const btn of iconButtons) btn.style.borderColor = "var(--border)";
      b.style.borderColor = "var(--yellow)";
    };
    iconButtons.push(b);
    iconGrid.appendChild(b);
  }
  card.appendChild(iconGrid);

  const trackWrap = el("div", "free-toggle");
  const trackCb = document.createElement("input");
  trackCb.type = "checkbox";
  trackCb.checked = true;
  trackWrap.appendChild(trackCb);
  trackWrap.appendChild(el("label", null, "นับสต็อก (ของร้านเอง)"));
  card.appendChild(trackWrap);

  const freeWrap = el("div", "free-toggle");
  const freeCb = document.createElement("input");
  freeCb.type = "checkbox";
  freeWrap.appendChild(freeCb);
  freeWrap.appendChild(el("label", null, "ให้กดฟรีได้ (สำหรับของนำเข้าเอง)"));
  card.appendChild(freeWrap);

  let uploadedImage = null;
  card.appendChild(el("div", "drink-price", "หรืออัปโหลดรูปถ่ายจริงแทนไอคอน (ไม่บังคับ)"));
  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = "image/*";
  fileInput.onchange = async () => {
    const file = fileInput.files && fileInput.files[0];
    if (!file) return;
    try {
      uploadedImage = await resizeImageFile(file);
      toast("อัปโหลดรูปแล้ว (จะบันทึกตอนกดเพิ่มเครื่องดื่ม)");
    } catch (e) {
      toast(e.message, true);
    }
  };
  card.appendChild(fileInput);

  const addBtn = el("button", "btn-primary", "เพิ่มเครื่องดื่ม");
  addBtn.style.marginTop = "12px";
  addBtn.onclick = async () => {
    if (!nameInput.value.trim()) {
      toast("กรุณาใส่ชื่อเครื่องดื่ม", true);
      return;
    }
    try {
      STATE = await apiMenuAction({
        action: "add",
        name: nameInput.value,
        price: Number(priceInput.value) || 0,
        cost: costInput ? Number(costInput.value) || 0 : undefined,
        unit: unitInput.value || "ขวด",
        category: catInput.value || "อื่นๆ",
        icon: selectedIcon,
        trackStock: trackCb.checked,
        allowFree: freeCb.checked,
        image: uploadedImage || undefined,
      });
      MENU_SHOW_ADD = false;
      toast("เพิ่มเครื่องดื่มเรียบร้อย");
      render();
    } catch (e) {
      toast(e.message, true);
    }
  };
  card.appendChild(addBtn);

  return card;
}

// ---------- Staff management (จัดการพนักงาน) ----------
function renderStaffPage() {
  const top = el("div", "topbar");
  const back = el("button", "back-btn", "←");
  back.onclick = goHome;
  top.appendChild(back);
  top.appendChild(el("h1", null, "🧑‍🍳 จัดการพนักงาน"));
  APP.appendChild(top);

  APP.appendChild(
    el("div", "round-meta", "เพิ่ม/แก้ไข/ซ่อนรายชื่อพนักงานที่ใช้เลือกตอนบันทึกรายการและนับสต็อก")
  );

  const card = el("div", "card");
  for (const s of STATE.staffList || []) {
    card.appendChild(renderStaffRow(s));
  }
  APP.appendChild(card);

  const addCard = el("div", "card");
  addCard.appendChild(el("div", "section-label", "เพิ่มพนักงานใหม่"));
  const nameInput = document.createElement("input");
  nameInput.className = "stock-input";
  nameInput.style.width = "100%";
  nameInput.placeholder = "ชื่อพนักงาน";
  addCard.appendChild(nameInput);
  const addBtn = el("button", "btn-primary", "+ เพิ่มพนักงาน");
  addBtn.style.marginTop = "10px";
  addBtn.onclick = async () => {
    if (!nameInput.value.trim()) {
      toast("กรุณาใส่ชื่อพนักงาน", true);
      return;
    }
    try {
      STATE = await apiStaffAction({ action: "add", name: nameInput.value });
      toast("เพิ่มพนักงานเรียบร้อย");
      render();
    } catch (e) {
      toast(e.message, true);
    }
  };
  addCard.appendChild(addBtn);
  APP.appendChild(addCard);
}

function renderStaffRow(s) {
  const isEditing = STAFF_EDIT_ID === s.id;
  const row = el("div", "round-item");
  if (s.active === false) row.style.opacity = "0.55";

  if (!isEditing) {
    const topRow = el("div", "round-top");
    topRow.appendChild(el("span", null, s.name + (s.active === false ? " (ซ่อนอยู่)" : "")));
    row.appendChild(topRow);

    const actionRow = el("div", null);
    actionRow.style.display = "flex";
    actionRow.style.gap = "14px";
    actionRow.style.marginTop = "6px";
    const editBtn = el("button", "collapse-toggle", "✎ แก้ไข");
    editBtn.onclick = () => {
      STAFF_EDIT_ID = s.id;
      render();
    };
    actionRow.appendChild(editBtn);

    const toggleBtn = el("button", "collapse-toggle", s.active === false ? "↩ กู้คืน" : "🗑 ซ่อน");
    toggleBtn.style.color = s.active === false ? "var(--green)" : "var(--red)";
    toggleBtn.onclick = async () => {
      try {
        STATE = await apiStaffAction({ action: s.active === false ? "restore" : "hide", id: s.id });
        toast(s.active === false ? "กู้คืนเรียบร้อย" : "ซ่อนแล้ว");
        render();
      } catch (e) {
        toast(e.message, true);
      }
    };
    actionRow.appendChild(toggleBtn);
    row.appendChild(actionRow);
    return row;
  }

  const nameInput = document.createElement("input");
  nameInput.className = "stock-input";
  nameInput.style.width = "100%";
  nameInput.value = s.name;
  row.appendChild(nameInput);

  const btnRow = el("div", null);
  btnRow.style.marginTop = "8px";
  btnRow.style.display = "flex";
  btnRow.style.gap = "10px";
  const saveBtn = el("button", "btn-primary", "บันทึก");
  saveBtn.style.width = "auto";
  saveBtn.style.padding = "10px 16px";
  saveBtn.onclick = async () => {
    if (!nameInput.value.trim()) {
      toast("กรุณาใส่ชื่อพนักงาน", true);
      return;
    }
    try {
      STATE = await apiStaffAction({ action: "edit", id: s.id, name: nameInput.value });
      STAFF_EDIT_ID = null;
      toast("บันทึกเรียบร้อย");
      render();
    } catch (e) {
      toast(e.message, true);
    }
  };
  btnRow.appendChild(saveBtn);
  const cancelBtn = el("button", "btn-secondary", "ยกเลิก");
  cancelBtn.style.width = "auto";
  cancelBtn.style.padding = "10px 16px";
  cancelBtn.onclick = () => {
    STAFF_EDIT_ID = null;
    render();
  };
  btnRow.appendChild(cancelBtn);
  row.appendChild(btnRow);

  return row;
}

// ---------- จัดการห้อง/โต๊ะ (เพิ่ม/แก้ไข/ลบ) ----------
function renderLocationsAdmin() {
  const top = el("div", "topbar");
  const back = el("button", "back-btn", "←");
  back.onclick = goHome;
  top.appendChild(back);
  top.appendChild(el("h1", null, "🚪 จัดการห้อง/โต๊ะ"));
  APP.appendChild(top);

  APP.appendChild(
    el("div", "round-meta", "เพิ่ม/แก้ไข/ลบห้องหรือโต๊ะที่ใช้เลือกในหน้าแรก ตั้งชื่อกลุ่มให้ตรงกันเพื่อจัดกลุ่มแสดงผลรวมกัน")
  );

  const card = el("div", "card");
  for (const loc of LOCATIONS) {
    card.appendChild(renderLocationAdminRow(loc));
  }
  APP.appendChild(card);

  const addCard = el("div", "card");
  addCard.appendChild(el("div", "section-label", "เพิ่มห้อง/โต๊ะใหม่"));
  const groupInput = document.createElement("input");
  groupInput.className = "stock-input";
  groupInput.style.width = "100%";
  groupInput.style.marginBottom = "8px";
  groupInput.placeholder = "ชื่อกลุ่ม เช่น ห้องแอร์ 1, โต๊ะนอก";
  addCard.appendChild(groupInput);
  const labelInput = document.createElement("input");
  labelInput.className = "stock-input";
  labelInput.style.width = "100%";
  labelInput.placeholder = "ชื่อห้อง/โต๊ะที่แสดง เช่น ห้องแอร์ 1 โต๊ะ 6";
  addCard.appendChild(labelInput);
  const addBtn = el("button", "btn-primary", "+ เพิ่มห้อง/โต๊ะ");
  addBtn.style.marginTop = "10px";
  addBtn.onclick = async () => {
    if (!labelInput.value.trim()) {
      toast("กรุณาใส่ชื่อห้อง/โต๊ะ", true);
      return;
    }
    try {
      STATE = await apiLocationsAction({ action: "add", group: groupInput.value, label: labelInput.value });
      toast("เพิ่มห้อง/โต๊ะเรียบร้อย");
      render();
    } catch (e) {
      toast(e.message, true);
    }
  };
  addCard.appendChild(addBtn);
  APP.appendChild(addCard);
}

function renderLocationAdminRow(loc) {
  const isEditing = LOC_EDIT_ID === loc.id;
  const row = el("div", "round-item");

  if (!isEditing) {
    const topRow = el("div", "round-top");
    topRow.appendChild(el("span", null, loc.label));
    row.appendChild(topRow);
    row.appendChild(el("div", "round-meta", `กลุ่ม: ${loc.group}`));

    const actionRow = el("div", null);
    actionRow.style.display = "flex";
    actionRow.style.gap = "14px";
    actionRow.style.marginTop = "6px";
    actionRow.style.flexWrap = "wrap";

    const upBtn = el("button", "collapse-toggle", "▲");
    upBtn.onclick = async () => {
      try {
        STATE = await apiLocationsAction({ action: "reorder", id: loc.id, direction: "up" });
        render();
      } catch (e) {
        toast(e.message, true);
      }
    };
    actionRow.appendChild(upBtn);
    const downBtn = el("button", "collapse-toggle", "▼");
    downBtn.onclick = async () => {
      try {
        STATE = await apiLocationsAction({ action: "reorder", id: loc.id, direction: "down" });
        render();
      } catch (e) {
        toast(e.message, true);
      }
    };
    actionRow.appendChild(downBtn);

    const editBtn = el("button", "collapse-toggle", "✎ แก้ไข");
    editBtn.onclick = () => {
      LOC_EDIT_ID = loc.id;
      render();
    };
    actionRow.appendChild(editBtn);

    const deleteBtn = el("button", "collapse-toggle", "🗑 ลบ");
    deleteBtn.style.color = "var(--red)";
    deleteBtn.onclick = async () => {
      if (!window.confirm(`ลบ "${loc.label}" ออกจากรายการห้อง/โต๊ะ? (ประวัติเก่าของห้องนี้จะยังอยู่ในระบบ แต่จะไม่แสดงในแอปอีก)`))
        return;
      try {
        STATE = await apiLocationsAction({ action: "delete", id: loc.id });
        toast("ลบเรียบร้อย");
        render();
      } catch (e) {
        toast(e.message, true);
      }
    };
    actionRow.appendChild(deleteBtn);
    row.appendChild(actionRow);
    return row;
  }

  const groupInput = document.createElement("input");
  groupInput.className = "stock-input";
  groupInput.style.width = "100%";
  groupInput.style.marginBottom = "8px";
  groupInput.value = loc.group;
  row.appendChild(groupInput);
  const labelInput = document.createElement("input");
  labelInput.className = "stock-input";
  labelInput.style.width = "100%";
  labelInput.value = loc.label;
  row.appendChild(labelInput);

  const btnRow = el("div", null);
  btnRow.style.marginTop = "8px";
  btnRow.style.display = "flex";
  btnRow.style.gap = "10px";
  const saveBtn = el("button", "btn-primary", "บันทึก");
  saveBtn.style.width = "auto";
  saveBtn.style.padding = "10px 16px";
  saveBtn.onclick = async () => {
    if (!labelInput.value.trim()) {
      toast("กรุณาใส่ชื่อห้อง/โต๊ะ", true);
      return;
    }
    try {
      STATE = await apiLocationsAction({ action: "edit", id: loc.id, group: groupInput.value, label: labelInput.value });
      LOC_EDIT_ID = null;
      toast("บันทึกเรียบร้อย");
      render();
    } catch (e) {
      toast(e.message, true);
    }
  };
  btnRow.appendChild(saveBtn);
  const cancelBtn = el("button", "btn-secondary", "ยกเลิก");
  cancelBtn.style.width = "auto";
  cancelBtn.style.padding = "10px 16px";
  cancelBtn.onclick = () => {
    LOC_EDIT_ID = null;
    render();
  };
  btnRow.appendChild(cancelBtn);
  row.appendChild(btnRow);

  return row;
}

// ---------- อัตราค่าบริการ (คาราโอเกะ/ห้องประชุม) CEO เท่านั้น ----------
function renderRatesAdmin() {
  const top = el("div", "topbar");
  const back = el("button", "back-btn", "←");
  back.onclick = goHome;
  top.appendChild(back);
  top.appendChild(el("h1", null, "💰 อัตราค่าบริการ"));
  APP.appendChild(top);

  APP.appendChild(
    el("div", "round-meta", "ตั้งอัตราค่าคาราโอเกะและค่าห้องประชุมต่อชั่วโมง แยกตามกลุ่มห้อง (มีผลกับบิลที่บันทึกใหม่เท่านั้น)")
  );

  const groups = [];
  for (const loc of LOCATIONS) {
    if (loc.group && !groups.includes(loc.group)) groups.push(loc.group);
  }

  const card = el("div", "card");
  for (const group of groups) {
    const row = el("div", "round-item");
    row.appendChild(el("div", "round-top", group));

    const rowWrap = el("div", null);
    rowWrap.style.cssText = "display:flex;gap:16px;flex-wrap:wrap;margin-top:8px;align-items:flex-end;";

    const kWrap = el("div", null);
    kWrap.appendChild(el("div", "drink-price", "ค่าคาราโอเกะ (บาท/ชม)"));
    const kInput = document.createElement("input");
    kInput.type = "number";
    kInput.min = "0";
    kInput.className = "stock-input";
    kInput.style.width = "110px";
    kInput.value = RATES.karaoke && RATES.karaoke[group] != null ? RATES.karaoke[group] : "";
    kWrap.appendChild(kInput);
    rowWrap.appendChild(kWrap);

    const kSaveBtn = el("button", "collapse-toggle", "บันทึก");
    kSaveBtn.onclick = async () => {
      try {
        STATE = await apiSetRate({ type: "karaoke", group, rate: Number(kInput.value) || 0 });
        toast("บันทึกอัตราค่าคาราโอเกะเรียบร้อย");
        render();
      } catch (e) {
        toast(e.message, true);
      }
    };
    rowWrap.appendChild(kSaveBtn);

    const mWrap = el("div", null);
    mWrap.appendChild(el("div", "drink-price", "ค่าห้องประชุม (บาท/ชม)"));
    const mInput = document.createElement("input");
    mInput.type = "number";
    mInput.min = "0";
    mInput.className = "stock-input";
    mInput.style.width = "110px";
    mInput.value = RATES.meeting && RATES.meeting[group] != null ? RATES.meeting[group] : "";
    mWrap.appendChild(mInput);
    rowWrap.appendChild(mWrap);

    const mSaveBtn = el("button", "collapse-toggle", "บันทึก");
    mSaveBtn.onclick = async () => {
      try {
        STATE = await apiSetRate({ type: "meeting", group, rate: Number(mInput.value) || 0 });
        toast("บันทึกอัตราค่าห้องประชุมเรียบร้อย");
        render();
      } catch (e) {
        toast(e.message, true);
      }
    };
    rowWrap.appendChild(mSaveBtn);

    row.appendChild(rowWrap);
    card.appendChild(row);
  }
  APP.appendChild(card);

  const voiceCard = el("div", "card");
  voiceCard.style.marginTop = "14px";
  voiceCard.appendChild(el("div", "round-top", "🎤 สั่งเครื่องดื่มด้วยเสียง"));
  voiceCard.appendChild(
    el(
      "div",
      "round-meta",
      "เปิดใช้งานปุ่มสั่งเครื่องดื่มด้วยเสียง (ซ่อนไว้เป็นไอคอนเล็กในแถบเมนูบน ไม่โชว์เด่นที่หน้าแรก) พนักงานพูดเช่น \"แอร์ 2 เพิ่มน้ำดื่มเล็ก 2 ขวด โดยยูริ\" แล้วระบบจะลงบิลให้อัตโนมัติ"
    )
  );
  const voiceToggleBtn = el(
    "button",
    "btn-" + (SETTINGS.voiceOrderEnabled ? "primary" : "secondary"),
    SETTINGS.voiceOrderEnabled ? "✔ เปิดใช้งานอยู่ (กดเพื่อปิด)" : "ปิดใช้งานอยู่ (กดเพื่อเปิด)"
  );
  voiceToggleBtn.style.marginTop = "10px";
  voiceToggleBtn.onclick = async () => {
    try {
      STATE = await apiSaveSettings({ voiceOrderEnabled: !SETTINGS.voiceOrderEnabled });
      const nowEnabled = STATE.settings && STATE.settings.voiceOrderEnabled;
      toast(nowEnabled ? "เปิดใช้งานสั่งเสียงเรียบร้อย" : "ปิดใช้งานสั่งเสียงเรียบร้อย");
      render();
    } catch (e) {
      toast(e.message, true);
    }
  };
  voiceCard.appendChild(voiceToggleBtn);
  APP.appendChild(voiceCard);
}

// ---------- tiny element helper ----------
function el(tag, className, text) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (text !== undefined) e.textContent = text;
  return e;
}

// ---------- ลากจัดลำดับด้วยนิ้ว/เมาส์ (กดแช่ที่ ⠿ แล้วลาก) ----------
// คำนวณตำแหน่งที่ควรวางลง จากตำแหน่งของนิ้ว/เมาส์ เทียบกับกึ่งกลางของแถวข้างเคียงแต่ละแถว (แยกฟังก์ชันไว้เพื่อเทสได้โดยไม่ต้องพึ่ง DOM จริง)
function computeDropIndex(siblingMidpoints, pointerY) {
  // siblingMidpoints: [{index, mid}] เรียงตามตำแหน่งเดิมบนจอ (บนลงล่าง)
  let dropIndex = siblingMidpoints.length;
  for (let i = 0; i < siblingMidpoints.length; i++) {
    if (pointerY < siblingMidpoints[i].mid) {
      dropIndex = i;
      break;
    }
  }
  return dropIndex;
}

// เพิ่มปุ่มลากไอคอน ⠿ ให้แถว rowEl ลากสลับตำแหน่งกับแถวอื่นที่มี class เดียวกัน (dragGroupClass) ภายใน container เดียวกัน
// onDrop(newIndexWithinGroup) จะถูกเรียกตอนปล่อยนิ้ว/เมาส์ โดยส่งตำแหน่งใหม่ (0-based) ภายในกลุ่มเดียวกันมาให้
function attachDragHandle(rowEl, dragGroupClass, onDrop) {
  const handle = el("span", "drag-handle", "⠿");
  handle.style.cssText =
    "cursor:grab;padding:4px 12px;font-size:20px;color:var(--brown);touch-action:none;user-select:none;line-height:1;";
  let dragging = false;
  let containerEl = null;
  let pointerId = null;

  function getGroupSiblings() {
    return Array.from(containerEl.children).filter((c) => c.classList && c.classList.contains(dragGroupClass));
  }

  handle.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    dragging = true;
    pointerId = e.pointerId;
    try {
      handle.setPointerCapture(pointerId);
    } catch (_) {}
    containerEl = rowEl.parentElement;
    rowEl.style.opacity = "0.5";
    rowEl.style.background = "var(--cream, #fdf6ec)";
  });

  handle.addEventListener("pointermove", (e) => {
    if (!dragging || !containerEl) return;
    const siblings = getGroupSiblings().filter((s) => s !== rowEl);
    const midpoints = siblings.map((s, i) => {
      const r = s.getBoundingClientRect();
      return { index: i, mid: r.top + r.height / 2, el: s };
    });
    const dropIndex = computeDropIndex(midpoints, e.clientY);
    const refEl = dropIndex < midpoints.length ? midpoints[dropIndex].el : null;
    if (refEl) containerEl.insertBefore(rowEl, refEl);
    else containerEl.appendChild(rowEl);
  });

  function finishDrag() {
    if (!dragging) return;
    dragging = false;
    rowEl.style.opacity = "";
    rowEl.style.background = "";
    const finalSiblings = getGroupSiblings();
    const newIndex = finalSiblings.indexOf(rowEl);
    if (newIndex >= 0) onDrop(newIndex);
  }

  handle.addEventListener("pointerup", finishDrag);
  handle.addEventListener("pointercancel", finishDrag);
  return handle;
}

function elHTML(tag, className, html) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  e.innerHTML = html || "";
  return e;
}

function iconEl(iconKey) {
  return elHTML("div", "drink-icon", ICONS[iconKey] || "");
}

function drinkVisualEl(d) {
  if (d.image) {
    const img = document.createElement("img");
    img.src = d.image;
    img.className = "drink-icon";
    img.style.cssText = "width:48px;height:40px;object-fit:cover;border-radius:8px;flex-shrink:0;";
    return img;
  }
  return iconEl(d.icon);
}

boot();
