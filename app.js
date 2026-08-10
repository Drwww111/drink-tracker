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
let TOAST_ROOT_EL = null; // เก็บ node ของ toast-root ไว้ใช้ซ้ำข้าม render() จะได้ไม่ลบ toast ที่กำลังโชว์อยู่
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
  const effectiveCeoPin = (SETTINGS && SETTINGS.ceoPin) || CEO_PIN;
  if (String(pin).trim() === effectiveCeoPin) {
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

// ---------- Staff PIN (ล็อกทั้งแอป กันคนนอกองค์กรเข้ามาใช้/ดูข้อมูล) ----------
const STAFF_PIN = "5656"; // เปลี่ยนรหัสผ่านพนักงานได้ตรงนี้
let STAFF_UNLOCKED = (function () {
  try {
    return localStorage.getItem("staffUnlocked") === "1";
  } catch (e) {
    return false;
  }
})();
let PENDING_STAFF_UNLOCK_PIN = null;
let STAFF_UNLOCK_AUTO_ERROR = "";

function renderStaffLock() {
  const wrap = el("div", "empty-note");
  wrap.style.cssText =
    "display:flex;flex-direction:column;align-items:center;gap:14px;padding:60px 16px;text-align:center;";
  wrap.appendChild(el("div", null, "🔒 กรุณาใส่รหัสผ่านพนักงานเพื่อเข้าใช้งานแอป"));
  wrap.appendChild(el("div", "round-meta", "สำหรับพนักงานร้านเท่านั้น ป้องกันคนนอกองค์กรเข้ามา"));
  const input = document.createElement("input");
  input.type = "password";
  input.inputMode = "numeric";
  input.placeholder = "รหัสผ่าน";
  input.style.cssText =
    "font-size:22px;padding:10px 14px;border-radius:10px;border:1px solid #ccc;text-align:center;width:180px;letter-spacing:4px;";
  wrap.appendChild(input);
  const errNote = el("div", "round-meta", "");
  errNote.style.cssText = "color:#B4432E;min-height:20px;";
  wrap.appendChild(errNote);
  // แยกให้ชัดว่า "กำลังโหลดอยู่จริง" (LOADING=true, ยังมีสิทธิ์รอ) กับ "โหลดล้มเหลวไปแล้ว" (ลองครบ 3 ครั้งแล้ว
  // LOADING=false แต่ STATE ยังไม่มา) เพราะแบบหลังรอต่อไปอีกก็ไม่มีวันสำเร็จเอง ต้องกดลองใหม่ ไม่ใช่แค่บอกให้ "รอสักครู่"
  const loadFailedPermanently = !STATE && !LOADING;
  if (PENDING_STAFF_UNLOCK_PIN !== null) {
    errNote.style.color = "var(--text-secondary, #6b6b6b)";
    errNote.textContent = "กำลังโหลดข้อมูล... จะลองรหัสที่พิมพ์ไว้ให้อัตโนมัติทันทีที่โหลดเสร็จ";
  } else if (STAFF_UNLOCK_AUTO_ERROR) {
    errNote.textContent = STAFF_UNLOCK_AUTO_ERROR;
    STAFF_UNLOCK_AUTO_ERROR = "";
  } else if (loadFailedPermanently) {
    errNote.textContent = "⚠️ " + (LOAD_ERROR || "โหลดข้อมูลไม่สำเร็จ") + " — กดปุ่มด้านล่างเพื่อลองใหม่ หรือพิมพ์รหัสแล้วกดเข้าใช้งานเพื่อลองใหม่พร้อมกันเลย";
  } else if (!STATE) {
    errNote.textContent = "กำลังโหลดข้อมูล กรุณารอสักครู่แล้วลองใหม่...";
  }
  if (loadFailedPermanently) {
    const retryBtn = el("button", "collapse-toggle", "🔄 ลองโหลดข้อมูลใหม่");
    retryBtn.style.marginBottom = "6px";
    retryBtn.onclick = () => {
      boot();
    };
    wrap.appendChild(retryBtn);
  }
  const btn = el("button", "btn-primary", "เข้าใช้งาน");
  const tryUnlock = () => {
    if (!STATE) {
      // เก็บรหัสที่พิมพ์ไว้เสมอ เผื่อ STATE โหลดมาสำเร็จเองในภายหลัง (ดู renderImpl ที่จะลองเทียบให้อัตโนมัติ)
      PENDING_STAFF_UNLOCK_PIN = String(input.value);
      if (!LOADING) {
        // การโหลดรอบก่อนล้มเหลวไปแล้ว (ลองครบ 3 ครั้ง) ไม่ได้กำลังโหลดอยู่ ต้องสั่งลองใหม่เอง ไม่งั้น STATE จะไม่มีวันมาเองอีก
        boot();
      } else {
        render();
      }
      return;
    }
    const effectiveStaffPin = (SETTINGS && SETTINGS.staffPin) || STAFF_PIN;
    if (String(input.value).trim() === effectiveStaffPin) {
      STAFF_UNLOCKED = true;
      try {
        localStorage.setItem("staffUnlocked", "1");
      } catch (e) {}
      render();
    } else {
      errNote.textContent = "รหัสผ่านไม่ถูกต้อง";
      input.value = "";
      input.focus();
    }
  };
  btn.onclick = tryUnlock;
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") tryUnlock();
  });
  wrap.appendChild(btn);
  APP.appendChild(wrap);
  setTimeout(() => input.focus(), 60);
}

function lockStaff() {
  STAFF_UNLOCKED = false;
  try {
    localStorage.removeItem("staffUnlocked");
  } catch (e) {}
  render();
}

let PIN_CHANGE_DRAFT = { ceoPinNew: "", ceoPinConfirm: "", staffPinNew: "", staffPinConfirm: "" }; // ฟอร์มเปลี่ยนรหัส CEO/พนักงาน ในหน้าอัตราค่าบริการ
let DRAFT = null; // { locationId, employee, items: {drinkId:{qty,free}}, emptyCounts: {drinkId:qty}, showEmpty:false }
let ROOM_DRAFT = {}; // { drinkId: qty } กำลังแก้ไขสต็อกในห้องปัจจุบัน
let ROOM_EMPLOYEE = null;
let ROOM_USE_DRAFT = {}; // { drinkId: qty } จำนวนที่กำลัง "ใช้ไป" จากของที่วางไว้ในห้อง (ยังไม่บันทึก)
let ROOM_USE_FREE_DRAFT = {}; // { drinkId: true/false } ติ๊กว่ารายการนี้ "ใช้ฟรี" ไม่คิดเงิน (เช่นญาติมา/คนในครอบครัวใช้) ไม่นับเป็นสต็อกหาย
let ROOM_USE_EMPLOYEE = null;
let STOCK_DRAFT = {}; // { drinkId: qty } กำลังแก้ไขสต็อกกลางของร้าน
let STOCK_EMPLOYEE = null;
let STOCK_SEARCH = ""; // คำค้นหาในหน้าจัดการสต็อกกลาง
let STOCK_HISTORY_EDIT = null; // { historyId, drinkId } รายการที่กำลังแก้ไข (นับผิด/เติมผิด)
let STOCK_HISTORY_EDIT_VALUE = "";
let STOCK_HISTORY_EDIT_EMPLOYEE = null;
let STOCK_HISTORY_DELETE = null; // { historyId, drinkId } รายการที่กำลังจะลบ (กดผิด SKU)
let STOCK_HISTORY_DELETE_EMPLOYEE = null;
let STOCK_HISTORY_FROM = ""; // yyyy-mm-dd ตัวกรองวันที่เริ่ม (เฉพาะหน้าประวัติการนับสต็อกกลาง)
let STOCK_HISTORY_TO = ""; // yyyy-mm-dd ตัวกรองวันที่สิ้นสุด
let STOCK_HISTORY_DAY_EXPANDED = new Set(); // dayKey ที่กางดูรายละเอียดอยู่ (ย่อเป็นรายวันให้ดูง่ายขึ้น)
let BILL_HISTORY_MODE = "daily"; // "daily" | "monthly"
let BILL_HISTORY_EXPANDED = new Set(); // keys (dayKey/monthKey) ที่กางดูรายละเอียดอยู่
let BILL_HISTORY_PRODUCT_SHOW = true; // เปิด/ปิดการ์ดสรุปยอดสินค้าแต่ละชนิดในหน้าประวัติบิล
let BILL_HISTORY_FROM = ""; // yyyy-mm-dd ตัวกรองวันที่เริ่ม
let BILL_HISTORY_TO = ""; // yyyy-mm-dd ตัวกรองวันที่สิ้นสุด
let KARAOKE_SHOW = false;
let KARAOKE_START = "";
let KARAOKE_END = "";
let KARAOKE_EMPLOYEE = null;
let KARAOKE_DISCOUNT = 0; // ส่วนลดค่าคาราโอเกะ (บาท)
let KARAOKE_FREE_HOURS = 0; // ชั่วโมงที่แถมให้ลูกค้า (ไม่คิดเงิน)
let KARAOKE_FREE_MINUTES = 0; // นาทีที่แถมเพิ่มเติมนอกจากชั่วโมง (ไม่คิดเงิน) เผื่อกรณีอยากแถมเป็นนาทีตรงๆ ไม่ใช่แค่ครึ่งชั่วโมง
let KARAOKE_LOG_SHOW = false;
let KARAOKE_LOG_START = "";
let KARAOKE_LOG_EMPLOYEE = null;
let KARAOKE_HISTORY_EXPANDED = new Set(); // locationId ที่กางดูรายละเอียดค่าคาราโอเกะอยู่
let KARAOKE_HISTORY_FROM = ""; // yyyy-mm-dd ตัวกรองวันที่เริ่ม
let KARAOKE_HISTORY_TO = ""; // yyyy-mm-dd ตัวกรองวันที่สิ้นสุด
let KARAOKE_HIST_STATS_MODE = "daily"; // "daily" | "monthly" | "yearly" - สรุปยอดคาราโอเกะแยกช่วง เทียบว่าช่วงไหนยอดเยอะกว่ากัน
let KARAOKE_HIST_STATS_EXPANDED = new Set(); // period key ที่กางดูแยกตามห้องแอร์อยู่ ในสรุปยอดคาราโอเกะรายวัน/เดือน/ปี
let MEETING_SHOW = false; // กางฟอร์มคิดเงินค่าห้องประชุมอยู่หรือไม่
let MEETING_START = "";
let MEETING_END = "";
let MEETING_EMPLOYEE = null;
let BEST_SELLERS_MODE = "daily"; // "daily" | "monthly" | "yearly"
let BEST_SELLERS_EXPANDED = new Set(); // keys ที่กางดูรายละเอียดอยู่
let BEST_SELLERS_SORT = "qty"; // "qty" | "profit" — เรียงตามจำนวนขาย หรือกำไร
let INSIGHTS_MODE = "daily"; // "daily" | "monthly" | "yearly"
let INSIGHTS_EXPANDED = new Set(); // keys ที่กางดูรายละเอียดอยู่
let PRODUCT_STATS_MODE = "week"; // "week" | "month" - สรุปยอดขาย/ฟรี/รวมต่อสินค้า แยกตามสัปดาห์หรือเดือน
let PRODUCT_STATS_REF = new Date().toISOString(); // วันที่อ้างอิงช่วงที่กำลังดูอยู่ (เลื่อนก่อนหน้า/ถัดไปได้)
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
let STOCK_RECON_MODE = "week"; // "week" หรือ "month" - โหมดดูสรุปเติม/ใช้สต็อก
let STOCK_RECON_REF = new Date().toISOString(); // วันที่อ้างอิงช่วงที่กำลังดูอยู่ (เลื่อนก่อนหน้า/ถัดไปได้)
let STOCK_RECON_SEARCH = ""; // คำค้นหาสินค้าในหน้าสรุปเติม/ใช้สต็อก
let STOCK_RECON_TRACE_SHOW = null; // drinkId ที่กำลังกางดูรายการนับสต็อกที่เกี่ยวข้อง (เพื่อตรวจสอบที่มาของยอดต้นงวด)
// --- เก็บเงินสต็อกหาย (CEO เท่านั้น) ---
let SHRINKAGE_CHARGE_SHOW = null; // drinkId ที่กำลังเปิดฟอร์มบันทึกอยู่
let SHRINKAGE_CHARGE_AMOUNT = "";
let SHRINKAGE_CHARGE_EMPLOYEE_AMOUNT = "";
let SHRINKAGE_CHARGE_RESPONSIBLE_LIST = []; // พนักงานที่ร่วมกันรับผิดชอบของหาย (เลือกได้หลายคน)
let SHRINKAGE_CHARGE_RECORDER = null; // พนักงาน/CEO ผู้บันทึกรายการนี้
let SHRINKAGE_CHARGE_DATE = ""; // วันที่เก็บเงินจริง (เลือกย้อนหลังได้ ถ้าเพิ่งมาบันทึกทีหลัง)
let SHRINKAGE_SUMMARY_MODE = "week"; // "week" | "month" - หน้าสรุปเก็บเงินสต็อกหาย (CEO)
let SHRINKAGE_SUMMARY_REF = new Date().toISOString();
// ฟอร์มบันทึกเก็บเงินสต็อกหายใหม่ โดยตรงจากหน้าสรุป (เลือกเครื่องดื่ม + ย้อนหลังไปช่วงที่กำลังดูอยู่ได้)
let SS_ADD_SHOW = false;
let SS_ADD_DRINK_ID = null;
let SS_ADD_AMOUNT = "";
let SS_ADD_EMPLOYEE_AMOUNT = "";
let SS_ADD_RESPONSIBLE_LIST = [];
let SS_ADD_RECORDER = null;
let SS_ADD_DATE = "";
// แผนหักเงินรายวัน (ผ่อนจ่ายค่าของหายเป็นรายวันแทนที่จะเก็บทีเดียว) - ฟอร์มสร้างแผนใหม่
let SDP_ADD_SHOW = false;
let SDP_ADD_DRINK_IDS = []; // เลือกได้หลายสินค้า รวมของหายจากทุกตัวที่เลือกเป็นยอดเดียว
let SDP_ADD_TOTAL_AMOUNT = ""; // คำนวณอัตโนมัติจากสินค้าที่เลือก (แก้เองทีหลังได้)
let SDP_ADD_DAILY_AMOUNT = "";
let SDP_ADD_EMPLOYEES = [];
let SDP_ADD_NOTE = "";
let SDP_ADD_RECORDER = null;
// แก้ไขแผนที่มีอยู่แล้ว (planId ที่กำลังแก้ไข, null = ไม่ได้แก้ไขอยู่)
let SDP_EDIT_ID = null;
let SDP_EDIT_DRINK_IDS = [];
let SDP_EDIT_TOTAL_AMOUNT = "";
let SDP_EDIT_DAILY_AMOUNT = "";
let SDP_EDIT_EMPLOYEES = [];
let SDP_EDIT_NOTE = "";
// การบันทึกหักเงินวันนี้ต่อแผน: เก็บเป็น map { [planId]: { date, selected: Set ของชื่อที่จะหักวันนี้ } }
let SDP_DEDUCT_DATE_BY_PLAN = {};
let SDP_DEDUCT_SELECTED_BY_PLAN = {};
let SDP_DEDUCT_RECORDER_BY_PLAN = {};
let ROOM_USAGE_SEARCH = ""; // คำค้นหาเครื่องดื่มในการ์ด "ของที่วางไว้ในห้องนี้อยู่แล้ว"
let MENU_EDIT_ID = null; // id ของเครื่องดื่มที่กำลังแก้ไขอยู่ในหน้าจัดการเมนู
let MENU_EDIT_DRAFT = {};
let MENU_SHOW_ADD = false;
let MENU_ADD_DRAFT = null; // เก็บค่าที่พิมพ์ในฟอร์ม "เพิ่มเครื่องดื่มใหม่" กันหายตอน auto-refresh สั่ง render ทับ
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

async function apiEditStockHistory(historyId, drinkId, newTo, employee) {
  const res = await fetchWithTimeout("/api/stock", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "editHistoryEntry", historyId, drinkId, newTo, employee }),
  });
  if (!res.ok) throw new Error(await readErrorMessage(res, "แก้ไขประวัติสต็อกไม่สำเร็จ"));
  return res.json();
}

async function apiDeleteStockHistoryChange(historyId, drinkId, employee) {
  const res = await fetchWithTimeout("/api/stock", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "deleteHistoryChange", historyId, drinkId, employee }),
  });
  if (!res.ok) throw new Error(await readErrorMessage(res, "ลบรายการนี้ไม่สำเร็จ"));
  return res.json();
}

async function apiSaveShrinkageCharge(payload) {
  const res = await fetchWithTimeout("/api/shrinkage-charge", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await readErrorMessage(res, "บันทึกการเก็บเงินสต็อกหายไม่สำเร็จ"));
  return res.json();
}

// ลบรายการเก็บเงินสต็อกหายทิ้ง (เช่น บันทึกซ้ำเพราะกดบันทึกหลายครั้งตอนระบบมีปัญหา)
async function apiDeleteShrinkageCharge(id) {
  const res = await fetchWithTimeout("/api/shrinkage-charge-delete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  });
  if (!res.ok) throw new Error(await readErrorMessage(res, "ลบรายการเก็บเงินไม่สำเร็จ"));
  return res.json();
}

// สร้างแผนหักเงินรายวัน (ผ่อนจ่ายค่าของหายเป็นรายวันแทนที่จะเก็บทีเดียว)
async function apiCreateShrinkageDebtPlan(payload) {
  const res = await fetchWithTimeout("/api/shrinkage-debt-plan", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await readErrorMessage(res, "สร้างแผนหักเงินรายวันไม่สำเร็จ"));
  return res.json();
}

// บันทึกการหักเงินของวันหนึ่งสำหรับแผนหักเงินรายวัน (เลือกได้ว่าจะหักใครบ้าง เผื่อบางคนลางาน)
async function apiRecordShrinkageDebtDeduction(payload) {
  const res = await fetchWithTimeout("/api/shrinkage-debt-deduct", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await readErrorMessage(res, "บันทึกการหักเงินวันนี้ไม่สำเร็จ"));
  return res.json();
}

// แก้ไขแผนหักเงินรายวันที่มีอยู่แล้ว (สินค้า/ยอดรวม/คนรับผิดชอบ/ยอดหักต่อวัน) ไม่กระทบประวัติการหักเงินที่บันทึกไปแล้ว
async function apiEditShrinkageDebtPlan(payload) {
  const res = await fetchWithTimeout("/api/shrinkage-debt-plan-edit", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await readErrorMessage(res, "แก้ไขแผนหักเงินรายวันไม่สำเร็จ"));
  return res.json();
}

// ลบแผนหักเงินรายวันทั้งแผน (รวมประวัติการหักเงินของแผนนี้ไปด้วย)
async function apiDeleteShrinkageDebtPlan(planId) {
  const res = await fetchWithTimeout("/api/shrinkage-debt-plan-delete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ planId }),
  });
  if (!res.ok) throw new Error(await readErrorMessage(res, "ลบแผนหักเงินรายวันไม่สำเร็จ"));
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

// ถ้ารายการนี้ถูก "ลงย้อนหลัง" (วันที่บันทึกจริง ต่างจากวันที่ที่เลือกไว้ในรายการ) ให้คืนข้อความกำกับไว้ กันสับสน/ป้องกันความผิดพลาดจากการลงผิดวัน
function backdateAnnotation(r) {
  if (!r || !r.loggedAt || !r.timestamp) return "";
  if (dayKeyOf(r.loggedAt) === dayKeyOf(r.timestamp)) return "";
  return ` (ลงย้อนหลัง บันทึกจริงเมื่อ ${fmtDateOnly(r.loggedAt)})`;
}

function fmtDateOnly(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("th-TH", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function fmtMonthLabel(monthKey) {
  const d = new Date(monthKey + "-01T00:00:00Z");
  return d.toLocaleDateString("th-TH", { month: "long", year: "numeric", timeZone: "UTC" });
}

// คืนค่า timestamp (ms, UTC) ของเที่ยงคืนวันจันทร์ (เวลาไทย) ของสัปดาห์ที่มี iso/ms ที่ให้มาอยู่
function mondayStartMsOf(isoOrMs) {
  const localMs = new Date(isoOrMs).getTime() + THAILAND_OFFSET_MS;
  const dow = new Date(localMs).getUTCDay(); // 0=อาทิตย์, 1=จันทร์, ... 6=เสาร์ (คำนวณจากเวลาไทยที่ shift มาแล้ว)
  const diffToMonday = (dow + 6) % 7; // จันทร์=0 วัน, อังคาร=1 วัน, ..., อาทิตย์=6 วัน
  const mondayLocalMs = localMs - diffToMonday * 86400000;
  const mondayLocalMidnightMs = Math.floor(mondayLocalMs / 86400000) * 86400000;
  return mondayLocalMidnightMs - THAILAND_OFFSET_MS;
}

// คำนวณช่วงเวลา (เริ่ม-สิ้นสุด แบบ UTC ms, สิ้นสุดแบบ exclusive) ของสัปดาห์/เดือนที่มี refIso อยู่ พร้อมข้อความป้ายกำกับภาษาไทย
function getPeriodBounds(periodType, refIso) {
  if (periodType === "month") {
    const mKey = monthKeyOf(refIso);
    const [y, m] = mKey.split("-").map(Number);
    const startLocalMs = Date.UTC(y, m - 1, 1, 0, 0, 0);
    const endLocalMs = Date.UTC(m === 12 ? y + 1 : y, m === 12 ? 0 : m, 1, 0, 0, 0);
    return {
      startMs: startLocalMs - THAILAND_OFFSET_MS,
      endMs: endLocalMs - THAILAND_OFFSET_MS,
      label: fmtMonthLabel(mKey),
    };
  }
  const startMs = mondayStartMsOf(refIso);
  const endMs = startMs + 7 * 86400000;
  const startLabel = fmtDateOnly(new Date(startMs).toISOString());
  const endLabel = fmtDateOnly(new Date(endMs - 86400000).toISOString());
  return { startMs, endMs, label: `${startLabel} — ${endLabel}` };
}

// รวมทุกครั้งที่มีการขาย/ใช้เครื่องดื่ม (ไม่รวมค่าคาราโอเกะ/ห้องประชุมซึ่งไม่ใช่สต็อกจริง) จากทุกห้อง ทั้งบิลที่เปิดอยู่และปิดไปแล้ว
// ใช้คำนวณ "ขาย/ใช้ไปเท่าไร" ย้อนหลังได้ตามช่วงเวลาที่ต้องการ
function collectAllDrinkSaleEvents() {
  const events = [];
  for (const loc of LOCATIONS) {
    const locState = STATE.locations[loc.id] || { openBill: null, history: [] };
    const allRounds = [
      ...((locState.openBill && locState.openBill.rounds) || []),
      ...((locState.history || []).flatMap((b) => b.rounds || [])),
    ];
    for (const r of allRounds) {
      for (const i of r.items || []) {
        if (isSyntheticChargeItem(i.id)) continue;
        events.push({ drinkId: i.id, qty: Number(i.qty || 0), timestamp: r.timestamp, free: !!i.free, unitPrice: Number(i.unitPrice || 0) });
      }
    }
  }
  return events;
}

// รวมทุกครั้งที่มีการนับสต็อก (ปรับยอดขึ้น-ลง) จาก stockHistory ทั้งหมด แยกเป็นรายการต่อสินค้า
function collectAllStockCountEvents() {
  const events = [];
  for (const entry of STATE.stockHistory || []) {
    for (const c of entry.changes || []) {
      if (c.deleted) continue; // รายการที่ลบไปแล้ว (กดผิด SKU) ไม่นับเข้าการคำนวณเติม/ขาย/ของหาย
      events.push({ drinkId: c.id, from: Number(c.from || 0), to: Number(c.to || 0), timestamp: entry.timestamp });
    }
  }
  return events;
}

// คำนวณสรุปเติม/ขาย/ควรเหลือของสินค้าหนึ่งตัว ในช่วงเวลาหนึ่ง (สัปดาห์/เดือน) โดยจำลอง ledger ไล่ตามลำดับเวลา
// นับสต็อก (recount) จะ "รีเซ็ต" ยอดคงเหลือให้ตรงกับที่นับได้จริงเสมอ (เป็นหลักฐานตามจริง) ส่วนการขายจะหักออกไปเรื่อยๆ
function computeDrinkReconciliation(drinkId, periodType, refIso) {
  const { startMs, endMs, label } = getPeriodBounds(periodType, refIso);

  const saleEvents = collectAllDrinkSaleEvents()
    .filter((e) => e.drinkId === drinkId)
    .map((e) => ({ type: "sale", ms: new Date(e.timestamp).getTime(), qty: e.qty, free: !!e.free, unitPrice: e.unitPrice }));
  const countEvents = collectAllStockCountEvents()
    .filter((e) => e.drinkId === drinkId)
    .map((e) => ({ type: "count", ms: new Date(e.timestamp).getTime(), from: e.from, to: e.to }));

  const allEvents = [...saleEvents, ...countEvents].sort((a, b) => a.ms - b.ms);

  // คำนวณโดยไล่ตามลำดับเวลาเสมอ และใช้ "to" (ค่าที่นับได้จริง ณ ตอนนั้น) เป็นค่าตั้งต้นใหม่ทุกครั้งที่เจอการนับสต็อก (เขียนทับค่าที่คำนวณไว้ก่อนหน้า)
  // แบบนี้ผลลัพธ์จะแก้ไขตัวเองได้เสมอ ต่อให้มีรายการก่อนหน้าถูกแก้ไข/ลบไปทีหลัง (ไม่ต้องพึ่งฟิลด์ "from" ซึ่งอาจไม่ทันอัปเดตตามหลังการแก้ไข/ลบรายการอื่นในสายเดียวกัน)
  function valueBefore(targetMs) {
    let running = 0;
    for (const ev of allEvents) {
      if (ev.ms >= targetMs) break;
      if (ev.type === "sale") running -= ev.qty;
      else running = ev.to;
    }
    return running;
  }

  const firstRecount = allEvents.find((ev) => ev.type === "count") || null;

  // รายการนับที่ "เชื่อถือได้ว่ามาก่อน firstRecount จริง" ต้องไม่เคยมีรายการนับอื่น (ต่อให้ถูกลบไปแล้ว) แทรกอยู่ก่อนหน้ามันเลย
  // เพราะถ้าเคยมีรายการนับที่ถูกลบไปก่อน firstRecount แปลว่า from ของ firstRecount อาจถูกบันทึกไว้ตอนที่อ้างอิงรายการที่ถูกลบนั้น (ซึ่งเพี้ยนไปแล้วหลังลบ)
  // กรณีนี้ให้ถือว่า "ไม่มีรายการนับที่เชื่อถือได้เลยก่อนเวลานั้น" เหมือนไม่เคยนับมาก่อน จะได้ไม่หยิบ from ที่เพี้ยนมาใช้
  let firstRecountFromTrustworthy = false;
  if (firstRecount) {
    const anyDeletedCountBeforeFirstRecount = (STATE.stockHistory || []).some((entry) => {
      const ms = new Date(entry.timestamp).getTime();
      if (ms >= firstRecount.ms) return false;
      return (entry.changes || []).some((c) => c.id === drinkId && c.deleted);
    });
    firstRecountFromTrustworthy = !anyDeletedCountBeforeFirstRecount;
  }

  // คำนวณค่าสต็อก ณ เวลาใดๆ ให้ถูกต้องโดยไม่พึ่งการสมมติว่าเริ่มจาก 0 ตั้งแต่ก่อนมีข้อมูลใดๆ (จะทำให้ติดลบมั่วๆ จากการหักยอดขายสะสมยาวนาน
  // ออกจาก 0 ทั้งที่ของจริงไม่ได้หาย) มี 3 กรณี: (1) ไม่เคยมีการนับสต็อกเลยทั้งระบบ หรือรายการนับแรกสุดที่เหลืออยู่มี from ที่ไม่น่าเชื่อถือ (เพราะเคยมีรายการก่อนหน้าถูกลบไปแล้ว)
  // -> ยึดยอดสต็อกปัจจุบันแล้วไล่ย้อนกลับ (2) มีการนับสต็อกที่เชื่อถือได้ก่อนเวลานั้นแล้ว -> คำนวณไปข้างหน้าตรงๆ ได้เลย (3) เวลานั้นอยู่ก่อนการนับสต็อกครั้งแรกที่เคยมี
  // และ from ของมันยังเชื่อถือได้ (ไม่เคยมีรายการถูกลบมาก่อนมันเลย) -> ไล่ย้อนจากค่าที่นับได้จริงครั้งแรก โดยบวกยอดขายระหว่างทางกลับคืน
  function valueAtCalibrated(targetMs) {
    if (!firstRecount || !firstRecountFromTrustworthy) {
      const nowMs = Date.now();
      const naiveNow = valueBefore(nowMs + 1);
      const offset = Number((STATE.stock && STATE.stock[drinkId]) || 0) - naiveNow;
      return valueBefore(targetMs) + offset;
    }
    if (targetMs > firstRecount.ms) {
      return valueBefore(targetMs);
    }
    // targetMs อยู่ก่อนการนับสต็อกครั้งแรกสุดที่เคยมี และ from ของมันเชื่อถือได้ (ไม่เคยมีรายการก่อนหน้าถูกลบมาก่อนมันเลย)
    // เริ่มจากค่า "from" ของการนับครั้งแรกนั้น แล้วไล่ย้อนกลับ บวกยอดขายที่เกิดขึ้นระหว่าง targetMs ถึงตอนนั้นกลับคืน
    let running = firstRecount.from;
    for (const ev of allEvents) {
      if (ev.ms <= targetMs || ev.ms >= firstRecount.ms) continue;
      if (ev.type === "sale") running += ev.qty; // ย้อนกลับการขาย = บวกจำนวนที่ขายไปกลับคืน
    }
    return running;
  }

  const startQty = valueAtCalibrated(startMs);
  const hasBaseline = allEvents.some((ev) => ev.type === "count" && ev.ms < startMs);

  let restockedQty = 0;
  let soldQty = 0;
  let shrinkageQty = 0;
  let freeQty = 0;
  let freeValue = 0;
  let running = startQty;
  for (const ev of allEvents) {
    if (ev.ms < startMs || ev.ms >= endMs) continue;
    if (ev.type === "sale") {
      running -= ev.qty;
      soldQty += ev.qty;
      // ของที่ใช้ฟรี (เช่นญาติ/คนในครอบครัว) ยังหักสต็อกจริงและนับเป็น "ใช้ไป" ตามปกติ (ไม่ใช่สต็อกหาย) แต่แยกนับไว้ต่างหากว่าฟรีไปเท่าไร มูลค่าเท่าไร
      if (ev.free) {
        freeQty += ev.qty;
        freeValue += ev.qty * (ev.unitPrice || 0);
      }
    } else {
      const delta = ev.to - running; // เทียบกับค่าที่ไล่คำนวณเองต่อเนื่อง ไม่พึ่งฟิลด์ "from" ที่อาจไม่อัปเดตตามหลังแก้ไข/ลบรายการอื่นในสายเดียวกัน
      if (delta > 0) restockedQty += delta;
      else if (delta < 0) shrinkageQty += -delta;
      running = ev.to;
    }
  }

  return {
    label,
    startQty,
    hasBaseline,
    restockedQty,
    soldQty,
    shrinkageQty,
    freeQty,
    freeValue,
    endQty: running,
  };
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

// สรุปยอดขาย/ฟรี/รวม แยกตามชนิดเครื่องดื่ม จากบิลที่ส่งเข้ามาทั้งหมด (ใช้ในหน้าประวัติบิล CEO
// เพื่อดูรวมว่าช่วงที่กรองอยู่ ขายอะไรไปกี่ชิ้นบ้าง โดยไม่ต้องไล่นับทีละบิล)
function collectBillsProductSummary(bills) {
  const drinksById = Object.fromEntries((STATE.drinksMenu || []).map((d) => [d.id, d]));
  const map = new Map(); // drinkId -> { name, unit, soldQty, soldValue, freeQty, freeValue, freeCostValue }

  for (const b of bills) {
    for (const r of b.rounds || []) {
      for (const i of r.items || []) {
        if (isSyntheticChargeItem(i.id)) continue;
        const qty = Number(i.qty || 0);
        if (!qty) continue;
        const d = drinksById[i.id];
        const name = (d && d.name) || i.name || i.id;
        if (!map.has(i.id)) {
          map.set(i.id, {
            name,
            unit: (d && d.unit) || "หน่วย",
            soldQty: 0,
            soldValue: 0,
            freeQty: 0,
            freeValue: 0,
            freeCostValue: 0,
          });
        }
        const entry = map.get(i.id);
        if (i.free) {
          entry.freeQty += qty;
          entry.freeValue += qty * Number(i.unitPrice || 0);
          entry.freeCostValue += qty * Number((d && d.cost) || 0);
        } else {
          entry.soldQty += qty;
          entry.soldValue += Number(i.lineTotal || 0);
        }
      }
    }
  }

  const rows = [...map.entries()]
    .map(([drinkId, v]) => ({ drinkId, ...v, totalQty: v.soldQty + v.freeQty }))
    .sort((a, b2) => b2.totalQty - a.totalQty);

  const totals = rows.reduce(
    (acc, r) => {
      acc.soldQty += r.soldQty;
      acc.soldValue += r.soldValue;
      acc.freeQty += r.freeQty;
      acc.freeValue += r.freeValue;
      acc.freeCostValue += r.freeCostValue;
      acc.totalQty += r.totalQty;
      return acc;
    },
    { soldQty: 0, soldValue: 0, freeQty: 0, freeValue: 0, freeCostValue: 0, totalQty: 0 }
  );

  return { rows, totals };
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

// คำนวณราคาค่าคาราโอเกะสุดท้าย หลังหักชั่วโมงที่แถม (ไม่คิดเงิน) แล้วหักส่วนลดเป็นบาท (ไม่ติดลบ)
function karaokeFinalPrice(mins, hourlyRate, freeHours, discount, freeMinutesExtra) {
  const freeMinutes = Math.max(0, Math.round((Number(freeHours) || 0) * 60) + Math.max(0, Number(freeMinutesExtra) || 0));
  const billableMins = Math.max(0, mins - freeMinutes);
  const priceAfterFree = karaokePrice(billableMins, hourlyRate);
  const finalPrice = Math.max(0, priceAfterFree - Math.max(0, Number(discount) || 0));
  return { freeMinutes, billableMins, priceAfterFree, finalPrice };
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

// สรุปยอดค่าคาราโอเกะรวมแยกตามช่วงวัน/เดือน/ปี (เทียบว่าช่วงไหนยอดเยอะกว่ากัน)
function collectKaraokeTotalsByPeriod() {
  const byDay = new Map();
  const byMonth = new Map();
  const byYear = new Map();

  function addTo(map, periodKey, amount) {
    if (!map.has(periodKey)) map.set(periodKey, { amount: 0, count: 0 });
    const e = map.get(periodKey);
    e.amount += amount;
    e.count += 1;
  }

  for (const charge of collectAllKaraokeCharges()) {
    if (!charge.timestamp) continue;
    const { day, month, year } = periodKeysOf(charge.timestamp);
    const amount = Number(charge.amount || 0);
    addTo(byDay, day, amount);
    addTo(byMonth, month, amount);
    addTo(byYear, year, amount);
  }
  return { byDay, byMonth, byYear };
}

// แถบลิงก์ข้ามไปมาระหว่าง 3 หน้ารายงานของ CEO (ประวัติบิล/ประวัติคาราโอเกะ/สินค้าขายดี)
function renderCeoReportNav(current) {
  const nav = el("div", null);
  nav.style.cssText = "display:flex;gap:10px;margin-bottom:14px;flex-wrap:wrap;";
  const items = [
    ["bill-history", "🧾 ประวัติบิล", goBillHistory],
    ["karaoke-history", "🎤 ประวัติคาราโอเกะ", goKaraokeHistory],
    ["best-sellers", "🏆 สินค้าขายดี", goBestSellers],
    ["product-stats", "📦 สรุปยอดสินค้า (ขาย/ฟรี/รวม)", goProductStats],
    ["shrinkage-summary", "💰 สรุปเก็บเงินสต็อกหาย", goShrinkageSummary],
    ["insights", "📊 สถิติเพิ่มเติม", goInsights],
    ["stock-reconciliation", "📊 สรุปเติม/ใช้สต็อก", goStockReconciliation],
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
  back.onclick = goCeoMenu;
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

  APP.appendChild(el("div", "section-label", "เปรียบเทียบยอดแยกช่วงวัน/เดือน/ปี"));
  const histModeRow = el("div", null);
  histModeRow.style.cssText = "display:flex;gap:10px;margin-bottom:10px;flex-wrap:wrap;";
  const histModes = [
    ["daily", "รายวัน"],
    ["monthly", "รายเดือน"],
    ["yearly", "รายปี"],
  ];
  for (const [key, label] of histModes) {
    const b = el("button", "staff-btn" + (KARAOKE_HIST_STATS_MODE === key ? " selected" : ""), label);
    b.onclick = () => {
      KARAOKE_HIST_STATS_MODE = key;
      render();
    };
    histModeRow.appendChild(b);
  }
  APP.appendChild(histModeRow);

  const periodTotals = collectKaraokeTotalsByPeriod();
  const roomStats = collectKaraokeRoomStats();
  const periodMap =
    KARAOKE_HIST_STATS_MODE === "daily"
      ? periodTotals.byDay
      : KARAOKE_HIST_STATS_MODE === "monthly"
      ? periodTotals.byMonth
      : periodTotals.byYear;
  const roomMap =
    KARAOKE_HIST_STATS_MODE === "daily"
      ? roomStats.byDay
      : KARAOKE_HIST_STATS_MODE === "monthly"
      ? roomStats.byMonth
      : roomStats.byYear;
  function histPeriodLabel(key) {
    return KARAOKE_HIST_STATS_MODE === "daily"
      ? fmtDateOnly(key)
      : KARAOKE_HIST_STATS_MODE === "monthly"
      ? fmtMonthLabel(key)
      : `ปี ${key}`;
  }
  const periodKeysSorted = [...periodMap.keys()].sort((a, b) => {
    const ta = periodMap.get(a).amount;
    const tb = periodMap.get(b).amount;
    return tb - ta;
  });
  const periodCard = el("div", "card");
  for (const key of periodKeysSorted) {
    const v = periodMap.get(key);
    const expanded = KARAOKE_HIST_STATS_EXPANDED.has(key);
    const pRow = el("button", "collapse-toggle", "");
    pRow.style.cssText = "width:100%;text-align:left;display:block;margin-bottom:4px;";
    const pTop = el("div", "round-top");
    pTop.appendChild(el("span", null, `${expanded ? "▾" : "▸"} ${histPeriodLabel(key)}`));
    pTop.appendChild(el("span", null, `฿${money(v.amount)}`));
    pRow.appendChild(pTop);
    pRow.appendChild(el("div", "round-meta", `${v.count} ครั้ง`));
    pRow.onclick = () => {
      if (expanded) KARAOKE_HIST_STATS_EXPANDED.delete(key);
      else KARAOKE_HIST_STATS_EXPANDED.add(key);
      render();
    };
    periodCard.appendChild(pRow);

    if (expanded) {
      const roomInner = roomMap.get(key);
      const roomWrap = el("div", null);
      roomWrap.style.cssText = "padding:4px 0 8px 14px;border-left:2px solid var(--border);margin:0 0 8px 4px;";
      if (!roomInner || !roomInner.size) {
        roomWrap.appendChild(el("div", "empty-note", "ไม่มีข้อมูลห้องแอร์ในช่วงนี้"));
      } else {
        const roomEntries = [...roomInner.entries()].sort((a, b) => b[1].amount - a[1].amount);
        for (const [roomLabel, r] of roomEntries) {
          const rRow = el("div", "round-item");
          const rTop = el("div", "round-top");
          rTop.appendChild(el("span", null, `🎤 ${roomLabel}`));
          rTop.appendChild(el("span", null, `฿${money(r.amount)}`));
          rRow.appendChild(rTop);
          rRow.appendChild(el("div", "round-meta", karaokeLabel(r.minutes)));
          roomWrap.appendChild(rRow);
        }
      }
      periodCard.appendChild(roomWrap);
    }
  }
  APP.appendChild(periodCard);

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

// สรุปยอดขาย/ใช้ฟรี/รวมทั้งหมดต่อสินค้า ในช่วงสัปดาห์หรือเดือนที่เลือก (รวมของที่ใช้ฟรี เช่นญาติ/คนในครอบครัว เข้าไปด้วยในยอดรวม
// เพื่อให้เห็นภาพรวมว่าใช้ไปจริงเท่าไรทั้งหมด ไม่ใช่แค่ยอดขายที่เก็บเงินได้)
function collectProductUsageForPeriod(periodType, refIso) {
  const { startMs, endMs, label } = getPeriodBounds(periodType, refIso);
  const drinksById = Object.fromEntries((STATE.drinksMenu || []).map((d) => [d.id, d]));
  const map = new Map(); // drinkId -> { name, unit, soldQty, soldValue, freeQty, freeValue, freeCostValue }

  for (const loc of LOCATIONS) {
    const locState = STATE.locations[loc.id] || { openBill: null, history: [] };
    const allRounds = [
      ...((locState.openBill && locState.openBill.rounds) || []),
      ...((locState.history || []).flatMap((b) => b.rounds || [])),
    ];
    for (const r of allRounds) {
      if (!r.timestamp) continue;
      const ms = new Date(r.timestamp).getTime();
      if (ms < startMs || ms >= endMs) continue;
      for (const i of r.items || []) {
        if (isSyntheticChargeItem(i.id)) continue;
        const qty = Number(i.qty || 0);
        if (!qty) continue;
        const d = drinksById[i.id];
        const name = (d && d.name) || i.name || i.id;
        if (!map.has(i.id)) {
          map.set(i.id, {
            name,
            unit: (d && d.unit) || "หน่วย",
            soldQty: 0,
            soldValue: 0,
            freeQty: 0,
            freeValue: 0,
            freeCostValue: 0, // มูลค่าต้นทุนของที่แจกฟรีไป (ของหายจริงทางบัญชี แม้จะไม่ใช่รายได้ที่เสียไป)
          });
        }
        const entry = map.get(i.id);
        if (i.free) {
          entry.freeQty += qty;
          entry.freeValue += qty * Number(i.unitPrice || 0);
          entry.freeCostValue += qty * Number((d && d.cost) || 0);
        } else {
          entry.soldQty += qty;
          entry.soldValue += Number(i.lineTotal || 0);
        }
      }
    }
  }

  const rows = [...map.entries()]
    .map(([drinkId, v]) => ({ drinkId, ...v, totalQty: v.soldQty + v.freeQty }))
    .sort((a, b) => b.totalQty - a.totalQty);

  const totals = rows.reduce(
    (acc, r) => {
      acc.soldQty += r.soldQty;
      acc.soldValue += r.soldValue;
      acc.freeQty += r.freeQty;
      acc.freeValue += r.freeValue;
      acc.freeCostValue += r.freeCostValue;
      acc.totalQty += r.totalQty;
      return acc;
    },
    { soldQty: 0, soldValue: 0, freeQty: 0, freeValue: 0, freeCostValue: 0, totalQty: 0 }
  );

  return { label, rows, totals };
}

function renderBestSellers() {
  const top = el("div", "topbar");
  const back = el("button", "back-btn", "←");
  back.onclick = goCeoMenu;
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

function renderShrinkageSummary() {
  const top = el("div", "topbar");
  const back = el("button", "back-btn", "←");
  back.onclick = goCeoMenu;
  top.appendChild(back);
  top.appendChild(el("h1", null, "💰 สรุปเก็บเงินสต็อกหาย"));
  APP.appendChild(top);
  APP.appendChild(renderCeoReportNav("shrinkage-summary"));

  APP.appendChild(
    el(
      "div",
      "round-meta",
      "ดูภาพรวมว่าของหายไปมูลค่าเท่าไร เก็บเงินได้เท่าไรแล้ว และเก็บจากพนักงานคนไหนไปเท่าไรบ้าง แยกรายสัปดาห์หรือรายเดือน"
    )
  );

  const modeRow = el("div", null);
  modeRow.style.cssText = "display:flex;gap:8px;margin:10px 0;";
  const weekBtn = el("button", "btn-" + (SHRINKAGE_SUMMARY_MODE === "week" ? "primary" : "secondary"), "รายสัปดาห์");
  weekBtn.style.flex = "1";
  weekBtn.onclick = () => {
    SHRINKAGE_SUMMARY_MODE = "week";
    render();
  };
  const monthBtn = el("button", "btn-" + (SHRINKAGE_SUMMARY_MODE === "month" ? "primary" : "secondary"), "รายเดือน");
  monthBtn.style.flex = "1";
  monthBtn.onclick = () => {
    SHRINKAGE_SUMMARY_MODE = "month";
    render();
  };
  modeRow.appendChild(weekBtn);
  modeRow.appendChild(monthBtn);
  APP.appendChild(modeRow);

  const navRow = el("div", null);
  navRow.style.cssText = "display:flex;align-items:center;gap:8px;margin-bottom:6px;flex-wrap:wrap;";
  const prevBtn = el("button", "collapse-toggle", "◀ ก่อนหน้า");
  prevBtn.onclick = () => {
    SHRINKAGE_SUMMARY_REF = shiftPeriodRef(SHRINKAGE_SUMMARY_MODE, SHRINKAGE_SUMMARY_REF, -1);
    render();
  };
  const nextBtn = el("button", "collapse-toggle", "ถัดไป ▶");
  nextBtn.onclick = () => {
    SHRINKAGE_SUMMARY_REF = shiftPeriodRef(SHRINKAGE_SUMMARY_MODE, SHRINKAGE_SUMMARY_REF, 1);
    render();
  };
  const todayBtn = el("button", "collapse-toggle", "วันนี้");
  todayBtn.onclick = () => {
    SHRINKAGE_SUMMARY_REF = new Date().toISOString();
    render();
  };
  navRow.appendChild(prevBtn);
  navRow.appendChild(nextBtn);
  navRow.appendChild(todayBtn);
  APP.appendChild(navRow);

  const summary = collectShrinkageChargeSummaryForPeriod(SHRINKAGE_SUMMARY_MODE, SHRINKAGE_SUMMARY_REF);
  APP.appendChild(el("div", "section-label", `ช่วง: ${summary.label}`));

  // บันทึกเก็บเงินสต็อกหายใหม่ได้ตรงนี้เลย สำหรับช่วงที่กำลังดูอยู่ (เลื่อนไปเดือน/สัปดาห์ก่อนหน้าได้ตามต้องการ
  // ไม่ต้องย้อนไปหน้าสรุปเติม/ใช้สต็อกเพื่อหา ทำให้เก็บเงินย้อนหลังของเดือนก่อนๆ ได้สะดวกขึ้น)
  const ssAddToggle = el(
    "button",
    "btn-secondary",
    SS_ADD_SHOW ? "▾ ยกเลิกบันทึกเก็บเงิน" : "💰 บันทึกเก็บเงินสต็อกหายสำหรับช่วงนี้"
  );
  ssAddToggle.style.marginBottom = "10px";
  ssAddToggle.onclick = () => {
    SS_ADD_SHOW = !SS_ADD_SHOW;
    if (SS_ADD_SHOW) {
      SS_ADD_AMOUNT = "";
      SS_ADD_EMPLOYEE_AMOUNT = "";
      SS_ADD_RESPONSIBLE_LIST = [];
      SS_ADD_RECORDER = null;
      SS_ADD_DRINK_ID = summary.shrinkageRows.length ? summary.shrinkageRows[0].drinkId : null;
      const bounds = getPeriodBounds(SHRINKAGE_SUMMARY_MODE, SHRINKAGE_SUMMARY_REF);
      const nowMs = Date.now();
      const defaultMs = nowMs >= bounds.startMs && nowMs < bounds.endMs ? nowMs : bounds.endMs - 1;
      SS_ADD_DATE = new Date(defaultMs + THAILAND_OFFSET_MS).toISOString().slice(0, 10);
    }
    render();
  };
  APP.appendChild(ssAddToggle);

  if (SS_ADD_SHOW) {
    const ssPanel = el("div", "card");
    ssPanel.style.cssText = "margin-bottom:14px;padding:10px;background:var(--cream-2);";

    ssPanel.appendChild(el("div", "section-label", "เครื่องดื่ม"));
    const ssDrinkGrid = el("div", "staff-grid");
    const shrinkDrinkIds = new Set(summary.shrinkageRows.map((r) => r.drinkId));
    for (const d of stockTrackedDrinks().slice().sort((a, b) => a.name.localeCompare(b.name, "th"))) {
      const label = shrinkDrinkIds.has(d.id) ? `${d.name} ⚠️` : d.name;
      const b = el("button", "staff-btn" + (SS_ADD_DRINK_ID === d.id ? " selected" : ""), label);
      b.onclick = () => {
        SS_ADD_DRINK_ID = d.id;
        render();
      };
      ssDrinkGrid.appendChild(b);
    }
    ssPanel.appendChild(ssDrinkGrid);

    ssPanel.appendChild(el("div", "drink-price", "วันที่เก็บเงิน (เลือกย้อนหลังได้ ค่าเริ่มต้นอยู่ในช่วงที่กำลังดูอยู่)"));
    const ssDateInput = document.createElement("input");
    ssDateInput.type = "date";
    ssDateInput.className = "step-qty-input";
    ssDateInput.style.width = "160px";
    ssDateInput.value = SS_ADD_DATE;
    ssDateInput.oninput = () => {
      SS_ADD_DATE = ssDateInput.value;
    };
    ssPanel.appendChild(ssDateInput);

    ssPanel.appendChild(el("div", "drink-price", "จำนวนเงินที่จะเก็บ (บาท)"));
    const ssAmountRow = el("div", null);
    ssAmountRow.style.cssText = "display:flex;align-items:center;gap:8px;flex-wrap:wrap;";
    const ssAmountInput = document.createElement("input");
    ssAmountInput.type = "number";
    ssAmountInput.min = "0";
    ssAmountInput.className = "step-qty-input";
    ssAmountInput.style.width = "140px";
    ssAmountInput.value = SS_ADD_AMOUNT;
    ssAmountInput.oninput = () => {
      SS_ADD_AMOUNT = ssAmountInput.value;
    };
    ssAmountRow.appendChild(ssAmountInput);
    const ssNoChargeBtn = el("button", "collapse-toggle", "🚫 ไม่คิดเงิน (0 บาท)");
    ssNoChargeBtn.onclick = () => {
      SS_ADD_AMOUNT = "0";
      SS_ADD_EMPLOYEE_AMOUNT = "0";
      render();
    };
    ssAmountRow.appendChild(ssNoChargeBtn);
    ssPanel.appendChild(ssAmountRow);

    ssPanel.appendChild(el("div", "drink-price", "จำนวนที่จะเก็บจากพนักงาน (บาท)"));
    const ssEmpAmountInput = document.createElement("input");
    ssEmpAmountInput.type = "number";
    ssEmpAmountInput.min = "0";
    ssEmpAmountInput.className = "step-qty-input";
    ssEmpAmountInput.style.width = "140px";
    ssEmpAmountInput.value = SS_ADD_EMPLOYEE_AMOUNT;
    ssEmpAmountInput.placeholder = "ค่าเริ่มต้น = จำนวนเดียวกับด้านบน";
    ssEmpAmountInput.oninput = () => {
      SS_ADD_EMPLOYEE_AMOUNT = ssEmpAmountInput.value;
    };
    ssPanel.appendChild(ssEmpAmountInput);

    ssPanel.appendChild(el("div", "section-label", "พนักงานที่รับผิดชอบ (เลือกได้หลายคน)"));
    const ssRespGrid = el("div", "staff-grid");
    for (const name of activeStaffNames()) {
      const isSelected = SS_ADD_RESPONSIBLE_LIST.includes(name);
      const b = el("button", "staff-btn" + (isSelected ? " selected" : ""), name);
      b.onclick = () => {
        SS_ADD_RESPONSIBLE_LIST = isSelected
          ? SS_ADD_RESPONSIBLE_LIST.filter((n) => n !== name)
          : [...SS_ADD_RESPONSIBLE_LIST, name];
        render();
      };
      ssRespGrid.appendChild(b);
    }
    ssPanel.appendChild(ssRespGrid);

    ssPanel.appendChild(el("div", "section-label", "พนักงาน/CEO ผู้บันทึกรายการนี้"));
    const ssRecGrid = el("div", "staff-grid");
    for (const name of activeStaffNames()) {
      const b = el("button", "staff-btn" + (SS_ADD_RECORDER === name ? " selected" : ""), name);
      b.onclick = () => {
        SS_ADD_RECORDER = name;
        render();
      };
      ssRecGrid.appendChild(b);
    }
    ssPanel.appendChild(ssRecGrid);

    const ssSaveBtn = el("button", "btn-primary", SAVING ? "กำลังบันทึก..." : "✔ บันทึกการเก็บเงิน");
    ssSaveBtn.style.marginTop = "10px";
    ssSaveBtn.onclick = async () => {
      if (!SS_ADD_DRINK_ID) {
        toast("กรุณาเลือกเครื่องดื่ม", true);
        return;
      }
      const amount = Number(SS_ADD_AMOUNT);
      if (!Number.isFinite(amount) || SS_ADD_AMOUNT === "" || amount < 0) {
        toast("กรุณาใส่จำนวนเงินที่จะเก็บให้ถูกต้อง", true);
        return;
      }
      if (!SS_ADD_RESPONSIBLE_LIST.length) {
        toast("กรุณาเลือกพนักงานที่รับผิดชอบอย่างน้อย 1 คน", true);
        return;
      }
      if (!SS_ADD_RECORDER) {
        toast("กรุณาเลือกพนักงาน/CEO ผู้บันทึกรายการนี้", true);
        return;
      }
      const employeeChargeRaw = SS_ADD_EMPLOYEE_AMOUNT === "" ? amount : Number(SS_ADD_EMPLOYEE_AMOUNT);
      if (!Number.isFinite(employeeChargeRaw) || employeeChargeRaw < 0) {
        toast("จำนวนที่จะเก็บจากพนักงานไม่ถูกต้อง", true);
        return;
      }
      const d = drinkById(SS_ADD_DRINK_ID);
      // ถ้าเป็นรายการ 0 บาท (ยกเว้นไม่คิดเงิน) ต้องส่ง qty ไปด้วย ไม่งั้นยอด "ยังไม่มีคนรับผิดชอบ" จะไม่ลดเลย
      // เพราะระบบไม่รู้ว่า 0 บาทนี้ "เคลียร์" ของหายไปกี่หน่วย ใช้ยอดค้างปัจจุบันของเครื่องดื่มนี้เป็นค่าเริ่มต้น (เคลียร์ทั้งหมดที่เหลือ)
      const ssRowForQty = summary.shrinkageRows.find((row) => row.drinkId === SS_ADD_DRINK_ID);
      const ssWaivedQty = amount === 0 && ssRowForQty ? ssRowForQty.outstandingQty : undefined;
      SAVING = true;
      render();
      try {
        STATE = await apiSaveShrinkageCharge({
          drinkId: SS_ADD_DRINK_ID,
          drinkName: d ? d.name : SS_ADD_DRINK_ID,
          periodLabel: summary.label,
          chargeAmount: amount,
          employees: SS_ADD_RESPONSIBLE_LIST,
          employeeCharge: employeeChargeRaw,
          recordedBy: SS_ADD_RECORDER,
          chargeDate: SS_ADD_DATE || new Date(Date.now() + THAILAND_OFFSET_MS).toISOString().slice(0, 10),
          qty: ssWaivedQty,
        });
        SS_ADD_SHOW = false;
        toast("บันทึกการเก็บเงินสต็อกหายเรียบร้อย");
      } catch (e) {
        toast(e.message, true);
      }
      SAVING = false;
      render();
    };
    ssPanel.appendChild(ssSaveBtn);
    APP.appendChild(ssPanel);
  }

  const overviewCard = el("div", "card total-card");
  overviewCard.appendChild(el("div", "label", "ของหายรวม (มูลค่าตามราคาขาย)"));
  overviewCard.appendChild(
    el("div", "amount", `${summary.totalShrinkageQty} ขวด/หน่วย • ฿${money(summary.totalShrinkageValue)}`)
  );
  APP.appendChild(overviewCard);

  const collectedCard = el("div", "card total-card");
  collectedCard.appendChild(el("div", "label", "เก็บเงินได้แล้วช่วงนี้ (รวมเก็บทันที + หักเงินรายวัน)"));
  collectedCard.appendChild(el("div", "amount", `฿${money(summary.totalCollectedCombined)}`));
  collectedCard.appendChild(
    el(
      "div",
      "round-meta",
      `เก็บทันทีครั้งเดียว ฿${money(summary.totalCollected)} • หักเงินรายวันช่วงนี้ ฿${money(summary.totalCollectedFromDebtPlans)}`
    )
  );
  collectedCard.appendChild(
    el("div", "round-meta", `เก็บจากพนักงานจริงรวม (เฉพาะแบบเก็บทันที) ฿${money(summary.totalEmployeeCharge)}`)
  );
  const outstanding = summary.totalShrinkageValue - summary.totalCollectedCombined;
  if (outstanding > 0) {
    const outstandingNote = el("div", "round-meta", `ยังเก็บไม่ครบ (คงเหลือประมาณ ฿${money(outstanding)})`);
    outstandingNote.style.cssText = "color:#B4432E;font-weight:700;";
    collectedCard.appendChild(outstandingNote);
  } else if (summary.totalShrinkageValue > 0) {
    const doneNote = el("div", "round-meta", "เก็บครบตามมูลค่าของหายแล้ว");
    doneNote.style.cssText = "color:var(--green);font-weight:700;";
    collectedCard.appendChild(doneNote);
  }
  if (summary.totalDebtPlanRemaining > 0) {
    const debtRemainNote = el(
      "div",
      "round-meta",
      `ยังค้างอยู่ในแผนหักเงินรายวันทั้งหมด (ทุกช่วงเวลา) ฿${money(summary.totalDebtPlanRemaining)}`
    );
    debtRemainNote.style.cssText = "color:#B4432E;font-weight:700;";
    collectedCard.appendChild(debtRemainNote);
  }
  APP.appendChild(collectedCard);

  APP.appendChild(
    el("div", "section-label", "ของหายรายตัว (เครื่องดื่มอะไรบ้าง กี่ขวด กี่บาท เก็บเงินไปแล้วเท่าไร เหลือใครยังไม่รับผิดชอบ)")
  );
  const shrinkItemsCard = el("div", "card");
  if (!summary.shrinkageRows.length) {
    shrinkItemsCard.appendChild(el("div", "empty-note", "ยังไม่พบของหายในช่วงนี้"));
  } else {
    for (const row of summary.shrinkageRows) {
      const rowEl = el("div", "round-item");
      const rTop = el("div", "round-top");
      rTop.appendChild(el("span", null, row.name));
      rTop.appendChild(el("span", null, `${row.qty} ${row.unit}`));
      rowEl.appendChild(rTop);
      rowEl.appendChild(el("div", "round-meta", `฿${money(row.value)}`));
      if (row.collectedAmount > 0) {
        rowEl.appendChild(
          el("div", "round-meta", `💰 เก็บเงินไปแล้ว ${row.collectedQty} ${row.unit} (฿${money(row.collectedAmount)})`)
        );
      }
      if (row.waivedQty > 0) {
        const waivedLine = el("div", "round-meta", `🚫 ยกเว้นไม่คิดเงิน ${row.waivedQty} ${row.unit} (ไม่นับเป็นยอดค้างแล้ว)`);
        waivedLine.style.cssText = "color:var(--text-secondary,#6b6b6b);";
        rowEl.appendChild(waivedLine);
      }
      if (row.outstandingAmount > 0) {
        const outstandingLine = el(
          "div",
          "round-meta",
          `❗ ยังไม่มีคนรับผิดชอบอีก ${row.outstandingQty} ${row.unit} (฿${money(row.outstandingAmount)})`
        );
        outstandingLine.style.cssText = "color:#B4432E;font-weight:700;";
        rowEl.appendChild(outstandingLine);
      } else {
        const doneLine = el("div", "round-meta", `✅ เก็บเงินครบแล้ว มีคนรับผิดชอบครบทั้งหมด`);
        doneLine.style.cssText = "color:var(--green);font-weight:700;";
        rowEl.appendChild(doneLine);
      }
      shrinkItemsCard.appendChild(rowEl);
    }
  }
  APP.appendChild(shrinkItemsCard);

  // ===== แผนหักเงินรายวัน (ผ่อนจ่ายค่าของหายเป็นรายวันแทนเก็บทีเดียว) =====
  // อยู่ต่อจากรายการของหายด้านบนเลย (ลิงก์กัน) กันต้องสลับหน้าไปมา
  APP.appendChild(el("div", "section-label", "แผนหักเงินรายวัน (ผ่อนจ่ายค่าของหายเป็นรายวันแทนเก็บทีเดียว)"));
  APP.appendChild(
    el(
      "div",
      "round-meta",
      "ตั้งแผนจากรายการของหายด้านบนได้เลย เลือกคนรับผิดชอบ + จำนวนที่จะหักต่อคนต่อวัน แล้วมาติ๊กทุกวันว่าวันนี้หักใครบ้าง (ใครลาก็ข้ามได้ ไม่บังคับหักทุกคนทุกวัน)"
    )
  );

  const sdpToggle = el("button", "btn-secondary", SDP_ADD_SHOW ? "▾ ยกเลิกตั้งแผนใหม่" : "➕ ตั้งแผนหักเงินรายวันใหม่");
  sdpToggle.style.marginBottom = "10px";
  sdpToggle.onclick = () => {
    SDP_ADD_SHOW = !SDP_ADD_SHOW;
    if (SDP_ADD_SHOW) {
      const firstShrink = summary.shrinkageRows.find((r) => r.outstandingAmount > 0);
      SDP_ADD_DRINK_IDS = firstShrink ? [firstShrink.drinkId] : [];
      SDP_ADD_TOTAL_AMOUNT = SDP_ADD_DRINK_IDS.length
        ? String(sumOutstandingForDrinkIds(SDP_ADD_DRINK_IDS, summary.shrinkageRows))
        : "";
      SDP_ADD_DAILY_AMOUNT = "";
      SDP_ADD_EMPLOYEES = [];
      SDP_ADD_NOTE = "";
      SDP_ADD_RECORDER = null;
    }
    render();
  };
  APP.appendChild(sdpToggle);

  if (SDP_ADD_SHOW) {
    const sdpPanel = el("div", "card");
    sdpPanel.style.cssText = "margin-bottom:14px;padding:10px;background:var(--cream-2);";

    sdpPanel.appendChild(el("div", "section-label", "เครื่องดื่ม (เลือกได้หลายรายการ ⚠️ = มีของหายช่วงนี้)"));
    const sdpRows = stockTrackedDrinks()
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name, "th"))
      .map((d) => {
        const row = summary.shrinkageRows.find((r) => r.drinkId === d.id);
        return { id: d.id, label: row ? `${d.name} ⚠️` : d.name, selected: SDP_ADD_DRINK_IDS.includes(d.id) };
      });
    sdpPanel.appendChild(
      renderDrinkCheckScrollList(sdpRows, (id) => {
        SDP_ADD_DRINK_IDS = SDP_ADD_DRINK_IDS.includes(id)
          ? SDP_ADD_DRINK_IDS.filter((x) => x !== id)
          : [...SDP_ADD_DRINK_IDS, id];
        SDP_ADD_TOTAL_AMOUNT = String(sumOutstandingForDrinkIds(SDP_ADD_DRINK_IDS, summary.shrinkageRows));
        render();
      })
    );

    sdpPanel.appendChild(
      el("div", "drink-price", "ยอดรวมที่ต้องเก็บ (บาท) — คำนวณอัตโนมัติจากสินค้าที่เลือก แก้ไขเองได้")
    );
    const sdpTotalInput = document.createElement("input");
    sdpTotalInput.type = "number";
    sdpTotalInput.min = "0";
    sdpTotalInput.className = "step-qty-input";
    sdpTotalInput.style.width = "140px";
    sdpTotalInput.value = SDP_ADD_TOTAL_AMOUNT;
    sdpTotalInput.oninput = () => {
      SDP_ADD_TOTAL_AMOUNT = sdpTotalInput.value;
    };
    sdpPanel.appendChild(sdpTotalInput);

    sdpPanel.appendChild(el("div", "drink-price", "หักต่อคนต่อวัน (บาท)"));
    const sdpDailyInput = document.createElement("input");
    sdpDailyInput.type = "number";
    sdpDailyInput.min = "0";
    sdpDailyInput.className = "step-qty-input";
    sdpDailyInput.style.width = "140px";
    sdpDailyInput.value = SDP_ADD_DAILY_AMOUNT;
    sdpDailyInput.oninput = () => {
      SDP_ADD_DAILY_AMOUNT = sdpDailyInput.value;
    };
    sdpPanel.appendChild(sdpDailyInput);

    sdpPanel.appendChild(el("div", "section-label", "พนักงานที่รับผิดชอบ (หารยอดรวมเท่ากันทุกคน)"));
    const sdpRespGrid = el("div", "staff-grid");
    for (const name of activeStaffNames()) {
      const isSelected = SDP_ADD_EMPLOYEES.includes(name);
      const b = el("button", "staff-btn" + (isSelected ? " selected" : ""), name);
      b.onclick = () => {
        SDP_ADD_EMPLOYEES = isSelected ? SDP_ADD_EMPLOYEES.filter((n) => n !== name) : [...SDP_ADD_EMPLOYEES, name];
        render();
      };
      sdpRespGrid.appendChild(b);
    }
    sdpPanel.appendChild(sdpRespGrid);

    sdpPanel.appendChild(el("div", "section-label", "พนักงาน/CEO ผู้บันทึกรายการนี้"));
    const sdpRecGrid = el("div", "staff-grid");
    for (const name of activeStaffNames()) {
      const b = el("button", "staff-btn" + (SDP_ADD_RECORDER === name ? " selected" : ""), name);
      b.onclick = () => {
        SDP_ADD_RECORDER = name;
        render();
      };
      sdpRecGrid.appendChild(b);
    }
    sdpPanel.appendChild(sdpRecGrid);

    const sdpSaveBtn = el("button", "btn-primary", SAVING ? "กำลังบันทึก..." : "✔ สร้างแผนหักเงินรายวัน");
    sdpSaveBtn.style.marginTop = "10px";
    sdpSaveBtn.onclick = async () => {
      if (!SDP_ADD_DRINK_IDS.length) {
        toast("กรุณาเลือกสินค้าอย่างน้อย 1 รายการ", true);
        return;
      }
      const totalAmount = Number(SDP_ADD_TOTAL_AMOUNT);
      if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
        toast("กรุณาใส่ยอดรวมที่ต้องเก็บให้ถูกต้อง", true);
        return;
      }
      const dailyAmount = Number(SDP_ADD_DAILY_AMOUNT);
      if (!Number.isFinite(dailyAmount) || dailyAmount <= 0) {
        toast("กรุณาใส่จำนวนที่หักต่อคนต่อวันให้ถูกต้อง", true);
        return;
      }
      if (!SDP_ADD_EMPLOYEES.length) {
        toast("กรุณาเลือกพนักงานที่รับผิดชอบอย่างน้อย 1 คน", true);
        return;
      }
      if (!SDP_ADD_RECORDER) {
        toast("กรุณาเลือกพนักงาน/CEO ผู้บันทึกรายการนี้", true);
        return;
      }
      SAVING = true;
      render();
      try {
        STATE = await apiCreateShrinkageDebtPlan({
          drinkIds: SDP_ADD_DRINK_IDS,
          totalAmount,
          dailyAmountPerPerson: dailyAmount,
          employees: SDP_ADD_EMPLOYEES,
          createdBy: SDP_ADD_RECORDER,
          note: SDP_ADD_NOTE,
        });
        SDP_ADD_SHOW = false;
        toast("สร้างแผนหักเงินรายวันเรียบร้อย");
      } catch (e) {
        toast(e.message, true);
      }
      SAVING = false;
      render();
    };
    sdpPanel.appendChild(sdpSaveBtn);
    APP.appendChild(sdpPanel);
  }

  // รายการแผนหักเงินรายวันที่มีอยู่ทั้งหมด (ไม่ผูกกับช่วงสัปดาห์/เดือนที่กำลังดู เพราะเป็นหนี้ระยะยาวที่ผ่อนได้หลายงวด)
  const debtPlans = (STATE.shrinkageDebtPlans || []).slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const debtPlansCard = el("div", "card");
  if (!debtPlans.length) {
    debtPlansCard.appendChild(el("div", "empty-note", "ยังไม่มีแผนหักเงินรายวัน"));
  } else {
    for (const plan of debtPlans) {
      const status = computeShrinkageDebtPlanStatus(plan);
      const planNames = plan.drinkNames || (plan.drinkName ? [plan.drinkName] : []);
      const planEl = el("div", "round-item");
      const planTop = el("div", "round-top");
      planTop.appendChild(el("span", null, `${planNames.join(", ")} — ฿${money(plan.totalAmount)}`));
      planTop.appendChild(el("span", null, status.fullyPaid ? "✅ จ่ายครบแล้ว" : "⏳ กำลังผ่อนจ่าย"));
      planEl.appendChild(planTop);
      planEl.appendChild(
        el(
          "div",
          "round-meta",
          `หักคนละ ฿${money(status.owedPerPerson)} รวม (วันละ ฿${money(plan.dailyAmountPerPerson)}/คน) • ผู้รับผิดชอบ: ${plan.employees.join(", ")}`
        )
      );
      if (plan.note) planEl.appendChild(el("div", "round-meta", `หมายเหตุ: ${plan.note}`));

      // ตั้งค่าเริ่มต้นวันที่/รายชื่อที่จะหักวันนี้ไว้ก่อน เผื่อกดปิดยอดเต็มจำนวนรายคนก่อนเลื่อนไปเจอฟอร์มด้านล่าง
      if (!status.fullyPaid && !SDP_DEDUCT_DATE_BY_PLAN[plan.id]) {
        SDP_DEDUCT_DATE_BY_PLAN[plan.id] = new Date(Date.now() + THAILAND_OFFSET_MS).toISOString().slice(0, 10);
      }

      for (const name of plan.employees) {
        const st = status.byEmployee[name];
        const empRow = el("div", null);
        empRow.style.cssText = "display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;margin-bottom:2px;";
        const line = el("div", "round-meta", `${name}: จ่ายแล้ว ฿${money(st.paid)} • เหลือ ฿${money(st.remaining)}`);
        if (st.remaining <= 0) line.style.cssText = "color:var(--green);font-weight:700;";
        empRow.appendChild(line);
        if (st.remaining > 0) {
          const settleBtn = el("button", "collapse-toggle", "✅ ปิดยอดเต็มจำนวน");
          settleBtn.style.cssText = "color:var(--green);white-space:nowrap;";
          settleBtn.onclick = async () => {
            const recordedBy = SDP_DEDUCT_RECORDER_BY_PLAN[plan.id];
            if (!recordedBy) {
              toast("กรุณาเลือกพนักงาน/CEO ผู้บันทึก ในฟอร์มหักเงินด้านล่างก่อน", true);
              return;
            }
            if (!window.confirm(`ปิดยอด ${name} เต็มจำนวน ฿${money(st.remaining)} เลยใช่ไหม? (คนอื่นในแผนนี้ที่ยังผ่อนอยู่จะไม่ถูกกระทบ)`)) return;
            SAVING = true;
            render();
            try {
              STATE = await apiRecordShrinkageDebtDeduction({
                planId: plan.id,
                date: SDP_DEDUCT_DATE_BY_PLAN[plan.id] || new Date(Date.now() + THAILAND_OFFSET_MS).toISOString().slice(0, 10),
                employees: [],
                settleFullEmployees: [name],
                recordedBy,
              });
              toast(`ปิดยอด ${name} เรียบร้อย หักเต็มจำนวน ฿${money(st.remaining)}`);
            } catch (e) {
              toast(e.message, true);
            }
            SAVING = false;
            render();
          };
          empRow.appendChild(settleBtn);
        }
        planEl.appendChild(empRow);
      }

      // แก้ไข / ลบ แผนนี้
      const planActionsRow = el("div", null);
      planActionsRow.style.cssText = "display:flex;gap:8px;margin-top:8px;";
      const editToggleBtn = el("button", "collapse-toggle", SDP_EDIT_ID === plan.id ? "▾ ยกเลิกแก้ไข" : "✏️ แก้ไขแผนนี้");
      editToggleBtn.onclick = () => {
        if (SDP_EDIT_ID === plan.id) {
          SDP_EDIT_ID = null;
        } else {
          SDP_EDIT_ID = plan.id;
          SDP_EDIT_DRINK_IDS = (plan.drinkIds || (plan.drinkId ? [plan.drinkId] : [])).slice();
          SDP_EDIT_TOTAL_AMOUNT = String(plan.totalAmount);
          SDP_EDIT_DAILY_AMOUNT = String(plan.dailyAmountPerPerson);
          SDP_EDIT_EMPLOYEES = plan.employees.slice();
          SDP_EDIT_NOTE = plan.note || "";
        }
        render();
      };
      planActionsRow.appendChild(editToggleBtn);

      const deleteBtn = el("button", "collapse-toggle", "🗑 ลบแผนนี้");
      deleteBtn.style.color = "#B4432E";
      deleteBtn.onclick = async () => {
        if (!confirmPermanentDelete(`ลบแผนหักเงิน "${planNames.join(", ")}" ถาวร? ประวัติการหักเงินที่บันทึกไปแล้วของแผนนี้จะหายไปด้วย กู้คืนไม่ได้`)) return;
        SAVING = true;
        render();
        try {
          STATE = await apiDeleteShrinkageDebtPlan(plan.id);
          toast("ลบแผนหักเงินนี้แล้ว");
        } catch (e) {
          toast(e.message, true);
        }
        SAVING = false;
        render();
      };
      planActionsRow.appendChild(deleteBtn);
      planEl.appendChild(planActionsRow);

      if (SDP_EDIT_ID === plan.id) {
        const editPanel = el("div", "card");
        editPanel.style.cssText = "margin-top:8px;padding:10px;background:var(--cream-2);";

        editPanel.appendChild(el("div", "section-label", "เครื่องดื่ม (เลือกได้หลายรายการ)"));
        const editRows = stockTrackedDrinks()
          .slice()
          .sort((a, b) => a.name.localeCompare(b.name, "th"))
          .map((d) => {
            const row = summary.shrinkageRows.find((r) => r.drinkId === d.id);
            return { id: d.id, label: row ? `${d.name} ⚠️` : d.name, selected: SDP_EDIT_DRINK_IDS.includes(d.id) };
          });
        editPanel.appendChild(
          renderDrinkCheckScrollList(editRows, (id) => {
            SDP_EDIT_DRINK_IDS = SDP_EDIT_DRINK_IDS.includes(id)
              ? SDP_EDIT_DRINK_IDS.filter((x) => x !== id)
              : [...SDP_EDIT_DRINK_IDS, id];
            SDP_EDIT_TOTAL_AMOUNT = String(sumOutstandingForDrinkIds(SDP_EDIT_DRINK_IDS, summary.shrinkageRows));
            render();
          })
        );

        editPanel.appendChild(el("div", "drink-price", "ยอดรวมที่ต้องเก็บ (บาท)"));
        const editTotalInput = document.createElement("input");
        editTotalInput.type = "number";
        editTotalInput.min = "0";
        editTotalInput.className = "step-qty-input";
        editTotalInput.style.width = "140px";
        editTotalInput.value = SDP_EDIT_TOTAL_AMOUNT;
        editTotalInput.oninput = () => {
          SDP_EDIT_TOTAL_AMOUNT = editTotalInput.value;
        };
        editPanel.appendChild(editTotalInput);

        editPanel.appendChild(el("div", "drink-price", "หักต่อคนต่อวัน (บาท)"));
        const editDailyInput = document.createElement("input");
        editDailyInput.type = "number";
        editDailyInput.min = "0";
        editDailyInput.className = "step-qty-input";
        editDailyInput.style.width = "140px";
        editDailyInput.value = SDP_EDIT_DAILY_AMOUNT;
        editDailyInput.oninput = () => {
          SDP_EDIT_DAILY_AMOUNT = editDailyInput.value;
        };
        editPanel.appendChild(editDailyInput);

        editPanel.appendChild(el("div", "section-label", "พนักงานที่รับผิดชอบ"));
        const editRespGrid = el("div", "staff-grid");
        for (const name of activeStaffNames()) {
          const isSelected = SDP_EDIT_EMPLOYEES.includes(name);
          const b = el("button", "staff-btn" + (isSelected ? " selected" : ""), name);
          b.onclick = () => {
            SDP_EDIT_EMPLOYEES = isSelected ? SDP_EDIT_EMPLOYEES.filter((n) => n !== name) : [...SDP_EDIT_EMPLOYEES, name];
            render();
          };
          editRespGrid.appendChild(b);
        }
        editPanel.appendChild(editRespGrid);

        const editSaveBtn = el("button", "btn-primary", SAVING ? "กำลังบันทึก..." : "✔ บันทึกการแก้ไข");
        editSaveBtn.style.marginTop = "10px";
        editSaveBtn.onclick = async () => {
          if (!SDP_EDIT_DRINK_IDS.length) {
            toast("กรุณาเลือกสินค้าอย่างน้อย 1 รายการ", true);
            return;
          }
          const totalAmount = Number(SDP_EDIT_TOTAL_AMOUNT);
          if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
            toast("กรุณาใส่ยอดรวมที่ต้องเก็บให้ถูกต้อง", true);
            return;
          }
          const dailyAmount = Number(SDP_EDIT_DAILY_AMOUNT);
          if (!Number.isFinite(dailyAmount) || dailyAmount <= 0) {
            toast("กรุณาใส่จำนวนที่หักต่อคนต่อวันให้ถูกต้อง", true);
            return;
          }
          if (!SDP_EDIT_EMPLOYEES.length) {
            toast("กรุณาเลือกพนักงานที่รับผิดชอบอย่างน้อย 1 คน", true);
            return;
          }
          SAVING = true;
          render();
          try {
            STATE = await apiEditShrinkageDebtPlan({
              planId: plan.id,
              drinkIds: SDP_EDIT_DRINK_IDS,
              totalAmount,
              dailyAmountPerPerson: dailyAmount,
              employees: SDP_EDIT_EMPLOYEES,
              note: SDP_EDIT_NOTE,
            });
            SDP_EDIT_ID = null;
            toast("แก้ไขแผนหักเงินเรียบร้อย");
          } catch (e) {
            toast(e.message, true);
          }
          SAVING = false;
          render();
        };
        editPanel.appendChild(editSaveBtn);
        planEl.appendChild(editPanel);
      }

      if (!status.fullyPaid) {
        if (!SDP_DEDUCT_DATE_BY_PLAN[plan.id]) {
          SDP_DEDUCT_DATE_BY_PLAN[plan.id] = new Date(Date.now() + THAILAND_OFFSET_MS).toISOString().slice(0, 10);
        }
        if (!SDP_DEDUCT_SELECTED_BY_PLAN[plan.id]) {
          SDP_DEDUCT_SELECTED_BY_PLAN[plan.id] = plan.employees.filter((n) => status.byEmployee[n].remaining > 0);
        }
        const deductWrap = el("div", null);
        deductWrap.style.cssText = "margin-top:8px;padding-top:8px;border-top:1px dashed var(--border);";
        deductWrap.appendChild(el("div", "drink-price", "บันทึกหักเงินวันที่"));
        const dateInput = document.createElement("input");
        dateInput.type = "date";
        dateInput.className = "step-qty-input";
        dateInput.style.width = "160px";
        dateInput.value = SDP_DEDUCT_DATE_BY_PLAN[plan.id];
        dateInput.oninput = () => {
          SDP_DEDUCT_DATE_BY_PLAN[plan.id] = dateInput.value;
        };
        deductWrap.appendChild(dateInput);

        deductWrap.appendChild(el("div", "section-label", "หักใครบ้างวันนี้ (ใครลา กดออกได้)"));
        const deductGrid = el("div", "staff-grid");
        for (const name of plan.employees) {
          const st = status.byEmployee[name];
          if (st.remaining <= 0) continue;
          const isSel = SDP_DEDUCT_SELECTED_BY_PLAN[plan.id].includes(name);
          const b = el("button", "staff-btn" + (isSel ? " selected" : ""), name);
          b.onclick = () => {
            SDP_DEDUCT_SELECTED_BY_PLAN[plan.id] = isSel
              ? SDP_DEDUCT_SELECTED_BY_PLAN[plan.id].filter((n) => n !== name)
              : [...SDP_DEDUCT_SELECTED_BY_PLAN[plan.id], name];
            render();
          };
          deductGrid.appendChild(b);
        }
        deductWrap.appendChild(deductGrid);

        deductWrap.appendChild(el("div", "section-label", "พนักงาน/CEO ผู้บันทึก"));
        const deductRecGrid = el("div", "staff-grid");
        for (const name of activeStaffNames()) {
          const b = el("button", "staff-btn" + (SDP_DEDUCT_RECORDER_BY_PLAN[plan.id] === name ? " selected" : ""), name);
          b.onclick = () => {
            SDP_DEDUCT_RECORDER_BY_PLAN[plan.id] = name;
            render();
          };
          deductRecGrid.appendChild(b);
        }
        deductWrap.appendChild(deductRecGrid);

        const deductSaveBtn = el("button", "btn-primary", SAVING ? "กำลังบันทึก..." : "✔ บันทึกหักเงินวันนี้");
        deductSaveBtn.style.marginTop = "8px";
        deductSaveBtn.onclick = async () => {
          const selected = SDP_DEDUCT_SELECTED_BY_PLAN[plan.id] || [];
          if (!selected.length) {
            toast("กรุณาเลือกอย่างน้อย 1 คนที่จะหักวันนี้ (ถ้าลาทั้งหมด ข้ามวันนี้ไปได้เลย)", true);
            return;
          }
          const recordedBy = SDP_DEDUCT_RECORDER_BY_PLAN[plan.id];
          if (!recordedBy) {
            toast("กรุณาเลือกพนักงาน/CEO ผู้บันทึก", true);
            return;
          }
          SAVING = true;
          render();
          try {
            // คำนวณไว้ก่อนยิง API ว่าวันนี้หักใครไปกี่บาทบ้าง (อิงยอดคงเหลือ ณ ตอนกดบันทึก เหมือน logic ฝั่งเซิร์ฟเวอร์)
            const deductedParts = selected.map((name) => {
              const before = status.byEmployee[name] ? status.byEmployee[name].remaining : 0;
              const amt = Math.min(plan.dailyAmountPerPerson, before);
              return `${name} ฿${money(amt)}`;
            });
            STATE = await apiRecordShrinkageDebtDeduction({
              planId: plan.id,
              date: SDP_DEDUCT_DATE_BY_PLAN[plan.id],
              employees: selected,
              recordedBy,
            });
            // หลังบันทึกสำเร็จ สรุปให้ว่าหักใครไปเท่าไรวันนี้ + แต่ละคนเหลือเท่าไรที่ยังไม่ได้หัก (รวมคนที่ข้ามวันนี้ด้วย)
            const updatedPlan = (STATE.shrinkageDebtPlans || []).find((p) => p.id === plan.id);
            let summaryMsg = "บันทึกหักเงินวันนี้เรียบร้อย";
            if (updatedPlan) {
              const updatedStatus = computeShrinkageDebtPlanStatus(updatedPlan);
              const remainingParts = updatedPlan.employees.map(
                (name) => `${name} ฿${money(updatedStatus.byEmployee[name].remaining)}`
              );
              summaryMsg = `หักวันนี้: ${deductedParts.join(", ")} — คงเหลือ: ${remainingParts.join(", ")}`;
            }
            toast(summaryMsg);
          } catch (e) {
            toast(e.message, true);
          }
          SAVING = false;
          render();
        };
        deductWrap.appendChild(deductSaveBtn);
        planEl.appendChild(deductWrap);
      }

      debtPlansCard.appendChild(planEl);
    }
  }
  APP.appendChild(debtPlansCard);

  APP.appendChild(el("div", "section-label", "เก็บเงินได้แล้วรายตัว (เครื่องดื่มอะไรบ้าง กี่บาท)"));
  const collectedItemsCard = el("div", "card");
  if (!summary.collectedRows.length) {
    collectedItemsCard.appendChild(el("div", "empty-note", "ยังไม่มีการบันทึกเก็บเงินสต็อกหายในช่วงนี้"));
  } else {
    for (const row of summary.collectedRows) {
      const rowEl = el("div", "round-item");
      const rTop = el("div", "round-top");
      rTop.appendChild(el("span", null, row.name));
      rTop.appendChild(el("span", null, `฿${money(row.collected)}`));
      rowEl.appendChild(rTop);
      rowEl.appendChild(el("div", "round-meta", `${row.count} ครั้ง`));
      collectedItemsCard.appendChild(rowEl);
    }
  }
  APP.appendChild(collectedItemsCard);

  APP.appendChild(el("div", "section-label", "เก็บเงินจากพนักงานคนไหนไปเท่าไร"));
  const empCard = el("div", "card");
  if (!summary.employeeRows.length) {
    empCard.appendChild(el("div", "empty-note", "ยังไม่มีการบันทึกเก็บเงินสต็อกหายในช่วงนี้"));
  } else {
    for (const row of summary.employeeRows) {
      const rowEl = el("div", "round-item");
      const rTop = el("div", "round-top");
      rTop.appendChild(el("span", null, row.name));
      rTop.appendChild(el("span", null, `฿${money(Math.round(row.amount))}`));
      rowEl.appendChild(rTop);
      rowEl.appendChild(el("div", "round-meta", `${row.count} ครั้ง`));
      empCard.appendChild(rowEl);
    }
  }
  APP.appendChild(empCard);

  if (summary.charges.length) {
    APP.appendChild(el("div", "section-label", "รายการเก็บเงินช่วงนี้"));
    const logCard = el("div", "card");
    for (const c of summary.charges) {
      const line = el("div", "round-item");
      const chargeDateLabel = c.chargeDate ? fmtDateOnly(`${c.chargeDate}T12:00:00+07:00`) : fmtDateOnly(c.timestamp);
      const backdateNote =
        c.chargeDate && dayKeyOf(c.timestamp) !== c.chargeDate
          ? ` (ลงย้อนหลัง บันทึกจริงเมื่อ ${fmtDateTime(c.timestamp)})`
          : "";
      const lineTop = el("div", "round-top");
      lineTop.style.cssText = "display:flex;align-items:center;justify-content:space-between;gap:8px;";
      const isWaived = Number(c.chargeAmount || 0) === 0;
      lineTop.appendChild(el("span", null, isWaived ? `${c.drinkName} — 🚫 ยกเว้นไม่คิดเงิน` : `${c.drinkName} — ฿${money(c.chargeAmount)}`));
      const delChargeBtn2 = el("button", "collapse-toggle", "🗑");
      delChargeBtn2.title = "ลบรายการนี้ (เช่น บันทึกซ้ำ)";
      delChargeBtn2.style.cssText = "padding:2px 10px;font-size:14px;flex-shrink:0;";
      delChargeBtn2.onclick = async () => {
        if (!window.confirm("ลบรายการนี้ถาวรใช่ไหม? ยอด \"ยังไม่มีคนรับผิดชอบ\" จะกลับมานับใหม่ตามเดิม")) return;
        SAVING = true;
        render();
        try {
          STATE = await apiDeleteShrinkageCharge(c.id);
          toast("ลบรายการเรียบร้อย");
        } catch (e) {
          toast(e.message, true);
        }
        SAVING = false;
        render();
      };
      lineTop.appendChild(delChargeBtn2);
      line.appendChild(lineTop);
      line.appendChild(
        el(
          "div",
          "round-meta",
          `เก็บจาก ${(c.employees || (c.employee ? [c.employee] : [])).join(", ")} รวม ฿${money(c.employeeCharge)} • บันทึกโดย ${c.recordedBy} • เก็บเมื่อ ${chargeDateLabel}${backdateNote}`
        )
      );
      logCard.appendChild(line);
    }
    APP.appendChild(logCard);
  }
}

function renderProductStats() {
  const top = el("div", "topbar");
  const back = el("button", "back-btn", "←");
  back.onclick = goCeoMenu;
  top.appendChild(back);
  top.appendChild(el("h1", null, "📦 สรุปยอดสินค้า (ขาย/ฟรี/รวม)"));
  APP.appendChild(top);
  APP.appendChild(renderCeoReportNav("product-stats"));

  APP.appendChild(
    el(
      "div",
      "round-meta",
      "ดูว่าแต่ละสินค้าขายไปเท่าไร ใช้ฟรีไปเท่าไร (เช่นญาติ/คนในครอบครัวใช้) และรวมทั้งหมดใช้ไปเท่าไร แยกรายสัปดาห์หรือรายเดือน"
    )
  );

  const psModeRow = el("div", null);
  psModeRow.style.cssText = "display:flex;gap:8px;margin:10px 0;";
  const psWeekBtn = el("button", "btn-" + (PRODUCT_STATS_MODE === "week" ? "primary" : "secondary"), "รายสัปดาห์");
  psWeekBtn.style.flex = "1";
  psWeekBtn.onclick = () => {
    PRODUCT_STATS_MODE = "week";
    render();
  };
  const psMonthBtn = el("button", "btn-" + (PRODUCT_STATS_MODE === "month" ? "primary" : "secondary"), "รายเดือน");
  psMonthBtn.style.flex = "1";
  psMonthBtn.onclick = () => {
    PRODUCT_STATS_MODE = "month";
    render();
  };
  psModeRow.appendChild(psWeekBtn);
  psModeRow.appendChild(psMonthBtn);
  APP.appendChild(psModeRow);

  const psNavRow = el("div", null);
  psNavRow.style.cssText = "display:flex;align-items:center;gap:8px;margin-bottom:6px;flex-wrap:wrap;";
  const psPrevBtn = el("button", "collapse-toggle", "◀ ก่อนหน้า");
  psPrevBtn.onclick = () => {
    PRODUCT_STATS_REF = shiftPeriodRef(PRODUCT_STATS_MODE, PRODUCT_STATS_REF, -1);
    render();
  };
  const psNextBtn = el("button", "collapse-toggle", "ถัดไป ▶");
  psNextBtn.onclick = () => {
    PRODUCT_STATS_REF = shiftPeriodRef(PRODUCT_STATS_MODE, PRODUCT_STATS_REF, 1);
    render();
  };
  const psTodayBtn = el("button", "collapse-toggle", "วันนี้");
  psTodayBtn.onclick = () => {
    PRODUCT_STATS_REF = new Date().toISOString();
    render();
  };
  psNavRow.appendChild(psPrevBtn);
  psNavRow.appendChild(psNextBtn);
  psNavRow.appendChild(psTodayBtn);
  APP.appendChild(psNavRow);

  const productStats = collectProductUsageForPeriod(PRODUCT_STATS_MODE, PRODUCT_STATS_REF);
  APP.appendChild(el("div", "section-label", `ช่วง: ${productStats.label}`));

  const psCard = el("div", "card");
  if (!productStats.rows.length) {
    psCard.appendChild(el("div", "empty-note", "ยังไม่มีรายการขาย/ใช้ไปในช่วงนี้"));
  } else {
    function buildProductStatsColumns(soldLabel, soldQty, unit, soldValue, freeQty, freeValue, freeCostValue) {
      const colsWrap = el("div", null);
      colsWrap.style.cssText = "display:flex;gap:10px;flex-wrap:wrap;margin-top:4px;";

      const soldCol = el("div", null);
      soldCol.style.cssText =
        "flex:1 1 140px;background:#F3F8F1;border-radius:8px;padding:8px 10px;";
      soldCol.appendChild(el("div", "round-meta", "✅ ขายไป"));
      soldCol.appendChild(el("div", null, `${soldQty} ${unit}`)).style.fontWeight = "700";
      soldCol.appendChild(el("div", "round-meta", `฿${money(soldValue)}`));
      colsWrap.appendChild(soldCol);

      const freeCol = el("div", null);
      freeCol.style.cssText =
        "flex:1 1 140px;background:#FDF6E9;border-radius:8px;padding:8px 10px;";
      freeCol.appendChild(el("div", "round-meta", "🎁 ฟรี"));
      freeCol.appendChild(el("div", null, `${freeQty} ${unit}`)).style.fontWeight = "700";
      freeCol.appendChild(
        el("div", "round-meta", freeQty > 0 ? `มูลค่าขาย ฿${money(freeValue)} • ต้นทุน ฿${money(freeCostValue)}` : "-")
      );
      colsWrap.appendChild(freeCol);

      return colsWrap;
    }

    for (const row of productStats.rows) {
      const rowEl = el("div", "round-item");
      const rTop = el("div", "round-top");
      rTop.appendChild(el("span", null, row.name));
      rTop.appendChild(el("span", null, `รวม ${row.totalQty} ${row.unit}`));
      rowEl.appendChild(rTop);
      rowEl.appendChild(
        buildProductStatsColumns(row.name, row.soldQty, row.unit, row.soldValue, row.freeQty, row.freeValue, row.freeCostValue)
      );
      psCard.appendChild(rowEl);
    }
    const totalsRow = el("div", "round-item");
    totalsRow.style.cssText = "border-top:2px solid var(--border);margin-top:6px;padding-top:8px;font-weight:700;";
    const totalsTop = el("div", "round-top");
    totalsTop.appendChild(el("span", null, "รวมทุกสินค้า"));
    totalsTop.appendChild(el("span", null, `รวม ${productStats.totals.totalQty} ขวด/หน่วย`));
    totalsRow.appendChild(totalsTop);
    totalsRow.appendChild(
      buildProductStatsColumns(
        "รวมทุกสินค้า",
        productStats.totals.soldQty,
        "ขวด/หน่วย",
        productStats.totals.soldValue,
        productStats.totals.freeQty,
        productStats.totals.freeValue,
        productStats.totals.freeCostValue
      )
    );
    psCard.appendChild(totalsRow);
  }
  APP.appendChild(psCard);
}

function renderInsights() {
  const top = el("div", "topbar");
  const back = el("button", "back-btn", "←");
  back.onclick = goCeoMenu;
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
  // ล็อกโหมด CEO อัตโนมัติทุกครั้งที่กลับหน้าแรก กันเผลอลืมกดล็อกเอง แล้วพนักงานที่ใช้เครื่องเดียวกันต่อ
  // เห็นข้อมูลยอดเงิน/รายรับที่เป็นความลับไปด้วย (ปุ่มย้อนกลับในหน้า CEO ทุกหน้าจะพากลับมาที่นี่อยู่แล้ว)
  if (CEO_UNLOCKED) {
    CEO_UNLOCKED = false;
    try {
      localStorage.removeItem("ceoUnlocked");
    } catch (e) {}
  }
  render();
}

function goLocation(locationId) {
  VIEW = { name: "location", locationId };
  ROOM_USE_DRAFT = {};
  ROOM_USE_FREE_DRAFT = {};
  ROOM_USE_EMPLOYEE = null;
  KARAOKE_SHOW = false;
  KARAOKE_START = "";
  KARAOKE_END = "";
  KARAOKE_EMPLOYEE = null;
  KARAOKE_DISCOUNT = 0;
  KARAOKE_FREE_HOURS = 0;
  KARAOKE_FREE_MINUTES = 0;
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
  STOCK_HISTORY_EDIT = null;
  STOCK_HISTORY_EDIT_VALUE = "";
  STOCK_HISTORY_EDIT_EMPLOYEE = null;
  STOCK_HISTORY_DELETE = null;
  STOCK_HISTORY_DELETE_EMPLOYEE = null;
  STOCK_HISTORY_FROM = "";
  STOCK_HISTORY_TO = "";
  STOCK_HISTORY_DAY_EXPANDED = new Set();
  VIEW = { name: "stock" };
  render();
}

function goRoomOverview() {
  ROOM_OVERVIEW_SEARCH = "";
  VIEW = { name: "room-overview" };
  render();
}

function goStockReconciliation() {
  requireCeoPin(() => {
    STOCK_RECON_SEARCH = "";
    STOCK_RECON_REF = new Date().toISOString();
    STOCK_RECON_TRACE_SHOW = null;
    SHRINKAGE_CHARGE_SHOW = null;
    SHRINKAGE_CHARGE_AMOUNT = "";
    SHRINKAGE_CHARGE_EMPLOYEE_AMOUNT = "";
    SHRINKAGE_CHARGE_RESPONSIBLE_LIST = [];
    SHRINKAGE_CHARGE_RECORDER = null;
    VIEW = { name: "stock-reconciliation" };
    render();
  });
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
  MENU_ADD_DRAFT = null;
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
    PIN_CHANGE_DRAFT = { ceoPinNew: "", ceoPinConfirm: "", staffPinNew: "", staffPinConfirm: "" };
    render();
  });
}

// สารบัญรวมทุกหน้าของ CEO ไว้ที่เดียว กดรหัสครั้งเดียวแล้วเดินดูได้ทุกหน้าโดยไม่ต้องใส่รหัสซ้ำ
// (ปุ่มย้อนกลับในหน้ารายงาน CEO ทุกหน้าจะพากลับมาที่นี่ ไม่ใช่กลับหน้าแรกโดยตรง กันต้องใส่รหัสใหม่ทุกครั้ง
// ที่ดูรายงานหลายหน้าติดกัน — จะล็อกโหมด CEO ก็ต่อเมื่อกดย้อนกลับจากสารบัญนี้ไปหน้าแรกจริงๆ เท่านั้น)
function goCeoMenu() {
  requireCeoPin(() => {
    VIEW = { name: "ceo-menu" };
    render();
  });
}

function renderCeoMenu() {
  const top = el("div", "topbar");
  const back = el("button", "back-btn", "←");
  back.onclick = goHome;
  top.appendChild(back);
  top.appendChild(el("h1", null, "🗂 เมนู CEO"));
  APP.appendChild(top);

  APP.appendChild(
    el("div", "round-meta", "เลือกดูรายงาน/ตั้งค่าได้เลย ไม่ต้องใส่รหัสซ้ำจนกว่าจะกดย้อนกลับไปหน้าแรก")
  );

  const items = [
    ["🧾 ประวัติบิล", goBillHistory],
    ["🎤 ประวัติคาราโอเกะ", goKaraokeHistory],
    ["🏆 สินค้าขายดี", goBestSellers],
    ["📦 สรุปยอดสินค้า (ขาย/ฟรี/รวม)", goProductStats],
    ["💰 สรุปเก็บเงินสต็อกหาย", goShrinkageSummary],
    ["📊 สถิติเพิ่มเติม", goInsights],
    ["📊 สรุปเติม/ใช้สต็อก", goStockReconciliation],
    ["💰 ต้นทุนสินค้า (คำนวณกำไร)", goMenuCost],
    ["💰 อัตราค่าบริการ (รวมเปลี่ยนรหัสผ่าน)", goRatesAdmin],
  ];
  const menuCard = el("div", "card");
  for (const [label, fn] of items) {
    const btn = el("button", "collapse-toggle", label);
    btn.style.cssText = "width:100%;text-align:left;font-size:17px;padding:14px 12px;margin-bottom:6px;";
    btn.onclick = fn;
    menuCard.appendChild(btn);
  }
  APP.appendChild(menuCard);
}

// ---------- ต้นทุนสินค้า (CEO เท่านั้น) — ใส่ต้นทุนต่อหน่วยแยกจากหน้าจัดการเมนู เพื่อไม่ให้พนักงานเห็น ----------
function goMenuCost() {
  requireCeoPin(() => {
    VIEW = { name: "menu-cost" };
    render();
  });
}

function renderMenuCost() {
  const top = el("div", "topbar");
  const back = el("button", "back-btn", "←");
  back.onclick = goCeoMenu;
  top.appendChild(back);
  top.appendChild(el("h1", null, "💰 ต้นทุนสินค้า (คำนวณกำไร)"));
  APP.appendChild(top);

  APP.appendChild(
    el(
      "div",
      "round-meta",
      "ใส่ต้นทุนต่อหน่วยของแต่ละสินค้า เพื่อคำนวณกำไรต่อหน่วย เห็น/แก้ไขได้เฉพาะ CEO เท่านั้น (ไม่โชว์ในหน้าจัดการเมนูที่พนักงานเห็น)"
    )
  );

  const all = STATE.drinksMenu || [];
  if (!all.length) {
    APP.appendChild(el("div", "empty-note", "ยังไม่มีเครื่องดื่มในเมนู"));
    return;
  }
  const categories = [];
  for (const d of all) if (!categories.includes(d.category)) categories.push(d.category);

  for (const cat of categories) {
    APP.appendChild(el("div", "category-title", cat));
    for (const d of all.filter((x) => x.category === cat)) {
      APP.appendChild(renderMenuCostRow(d));
    }
  }
}

function renderMenuCostRow(d) {
  const row = el("div", "card");
  row.style.marginBottom = "10px";

  const info = el("div", "drink-info");
  info.appendChild(el("div", "drink-name", d.name + (d.active === false ? " (ซ่อนอยู่)" : "")));
  info.appendChild(el("div", "drink-price", `ราคาขาย ฿${money(d.price)} / ${d.unit || "หน่วย"}`));
  row.appendChild(info);

  const costInput = document.createElement("input");
  costInput.type = "number";
  costInput.className = "stock-input";
  costInput.value = d.cost || 0;
  row.appendChild(labeledField("ต้นทุนต่อหน่วย", costInput));

  const profit = Number(d.price || 0) - Number(d.cost || 0);
  row.appendChild(el("div", "round-meta", `กำไรต่อหน่วย ฿${money(profit)}`));

  const saveBtn = el("button", "btn-primary", "💾 บันทึกต้นทุน");
  saveBtn.style.marginTop = "8px";
  saveBtn.onclick = async () => {
    try {
      STATE = await apiMenuAction({ action: "edit", id: d.id, cost: Number(costInput.value) || 0 });
      toast("บันทึกต้นทุนแล้ว");
      render();
    } catch (e) {
      toast(e.message, true);
    }
  };
  row.appendChild(saveBtn);
  return row;
}

function goBillHistory() {
  requireCeoPin(() => {
    VIEW = { name: "bill-history" };
    BILL_HISTORY_EXPANDED = new Set();
    BILL_HISTORY_FROM = "";
    BILL_HISTORY_TO = "";
    BILL_HISTORY_PRODUCT_SHOW = true;
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

function goProductStats() {
  requireCeoPin(() => {
    VIEW = { name: "product-stats" };
    PRODUCT_STATS_MODE = "week";
    PRODUCT_STATS_REF = new Date().toISOString();
    render();
  });
}

function goShrinkageSummary() {
  requireCeoPin(() => {
    VIEW = { name: "shrinkage-summary" };
    SHRINKAGE_SUMMARY_MODE = "week";
    SHRINKAGE_SUMMARY_REF = new Date().toISOString();
    SS_ADD_SHOW = false;
    SS_ADD_DRINK_ID = null;
    SS_ADD_AMOUNT = "";
    SS_ADD_EMPLOYEE_AMOUNT = "";
    SS_ADD_RESPONSIBLE_LIST = [];
    SS_ADD_RECORDER = null;
    SS_ADD_DATE = "";
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
  DRAFT = {
    locationId,
    employee: null,
    items: {},
    emptyCounts: {},
    showEmpty: false,
    editRoundId: null,
    backdate: false, // เปิดไว้เผื่อบันทึกย้อนหลัง (เช่น ครัวเอาสต็อกไปใช้แล้วมาลงทีหลัง) ปกติปิดไว้ใช้เวลาปัจจุบันตอนกดบันทึก
    backdateDate: "",
    backdateTime: "",
  };
  VIEW = { name: "add-round", locationId };
  DRINK_SEARCH = "";
  render();
}

function goEditRound(locationId, round) {
  const items = {};
  for (const i of round.items) {
    items[i.id] = { qty: i.qty, free: !!i.free };
  }
  const existingDate = round.timestamp ? new Date(round.timestamp) : null;
  DRAFT = {
    locationId,
    employee: round.employee,
    items,
    emptyCounts: { ...(round.emptyCounts || {}) },
    showEmpty: !!(round.emptyCounts && Object.keys(round.emptyCounts).length),
    editRoundId: round.id,
    backdate: false,
    backdateDate: existingDate ? existingDate.toISOString().slice(0, 10) : "",
    backdateTime: existingDate ? `${String(existingDate.getHours()).padStart(2, "0")}:${String(existingDate.getMinutes()).padStart(2, "0")}` : "",
  };
  VIEW = { name: "add-round", locationId };
  DRINK_SEARCH = "";
  render();
}

// ---------- Render root ----------
// เก็บ/คืนตำแหน่งเลื่อนหน้าจอ (window scroll) ก่อน/หลัง render() ทุกครั้ง กัน UI ที่ต้อง render() ซ้ำบ่อยๆ
// (เช่น ติ๊กเลือกสินค้า/พนักงาน) ทำให้หน้าเด้งเลื่อนขึ้นบนโดยไม่ตั้งใจ (พบบนมือถือบางรุ่นเวลา element ที่มี focus ถูกสร้างใหม่)
function getPageScrollY() {
  try {
    return window.scrollY || window.pageYOffset || (document.documentElement && document.documentElement.scrollTop) || 0;
  } catch (e) {
    return 0;
  }
}
function setPageScrollY(y) {
  try {
    if (typeof window.scrollTo === "function") window.scrollTo(0, y);
  } catch (e) {}
}

function render() {
  const __scrollY = getPageScrollY();
  renderImpl();
  setPageScrollY(__scrollY);
}

function renderImpl() {
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

  if (PENDING_STAFF_UNLOCK_PIN !== null && !STAFF_UNLOCKED && STATE) {
    const effectiveStaffPinAuto = (SETTINGS && SETTINGS.staffPin) || STAFF_PIN;
    if (String(PENDING_STAFF_UNLOCK_PIN).trim() === effectiveStaffPinAuto) {
      STAFF_UNLOCKED = true;
      try {
        localStorage.setItem("staffUnlocked", "1");
      } catch (e) {}
    } else {
      STAFF_UNLOCK_AUTO_ERROR = "รหัสผ่านไม่ถูกต้อง (ลองอัตโนมัติหลังโหลดข้อมูลเสร็จแล้ว) กรุณาพิมพ์ใหม่อีกครั้ง";
    }
    PENDING_STAFF_UNLOCK_PIN = null;
  }

  // เก็บ toast-root ตัวเดิมไว้ใช้ซ้ำ (ห้ามสร้างใหม่ทุกครั้งที่ render เพราะจะลบข้อความ toast ที่กำลังโชว์อยู่ทิ้งทันที
  // ทำให้ก่อนหน้านี้ผู้ใช้กดบันทึกแล้วรู้สึกเหมือนไม่มีอะไรเกิดขึ้น/ไม่มั่นใจว่าไวหรือช้า)
  if (!TOAST_ROOT_EL) {
    TOAST_ROOT_EL = document.getElementById("toast-root") || document.createElement("div");
    TOAST_ROOT_EL.id = "toast-root";
  }
  APP.innerHTML = "";
  APP.appendChild(TOAST_ROOT_EL);

  // โชว์หน้าใส่รหัสพนักงานทันที ไม่ต้องรอโหลดข้อมูลเสร็จก่อน (กันรู้สึกว่าแอปโหลดช้า) แต่ตัวเช็ครหัสจริง
  // (ใน renderStaffLock/tryUnlock) จะรอให้ STATE โหลดเสร็จก่อนถึงจะยอมเทียบรหัส เพราะรหัสที่ใช้เปรียบเทียบ
  // เก็บอยู่ใน STATE.settings (เปลี่ยนได้จากหน้าอัตราค่าบริการ) ถ้าเทียบก่อนโหลดเสร็จอาจใช้รหัสเริ่มต้นเก่าผิดๆ ได้
  if (!STAFF_UNLOCKED) {
    renderStaffLock();
    return;
  }

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
  else if (VIEW.name === "stock-reconciliation") renderStockReconciliation();
  else if (VIEW.name === "room-card-admin") renderRoomCardAdmin(VIEW.locationId);
  else if (VIEW.name === "menu") renderMenu();
  else if (VIEW.name === "staff-admin") renderStaffPage();
  else if (VIEW.name === "locations-admin") renderLocationsAdmin();
  else if (VIEW.name === "bill-history") renderBillHistory();
  else if (VIEW.name === "karaoke-history") renderKaraokeHistory();
  else if (VIEW.name === "best-sellers") renderBestSellers();
  else if (VIEW.name === "rates-admin") renderRatesAdmin();
  else if (VIEW.name === "insights") renderInsights();
  else if (VIEW.name === "product-stats") renderProductStats();
  else if (VIEW.name === "shrinkage-summary") renderShrinkageSummary();
  else if (VIEW.name === "ceo-menu") renderCeoMenu();
  else if (VIEW.name === "menu-cost") renderMenuCost();
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
  // รวมทุกหน้าของ CEO (ประวัติบิล/คาราโอเกะ/ขายดี/สถิติ/สรุปยอดสินค้า/สรุปเก็บเงินสต็อกหาย/อัตราค่าบริการ)
  // ไว้ในปุ่มเดียว กันแถบเมนูหน้าแรกรกจนหาไม่เจอ กดครั้งเดียวใส่รหัสครั้งเดียวแล้วเดินดูได้ทุกหน้า
  const ceoMenuBtn = el("button", "icon-btn", "🗂 เมนู CEO");
  ceoMenuBtn.onclick = goCeoMenu;
  top.appendChild(ceoMenuBtn);
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
  // หมายเหตุ: "อัตราค่าบริการ" และปุ่มล็อก CEO ย้ายเข้าไปอยู่ใน "🗂 เมนู CEO" ด้านบนแล้ว (ไม่ต้องมีปุ่มล็อกแยก
  // เพราะกดย้อนกลับจากเมนู CEO ไปหน้าแรกจะล็อกให้อัตโนมัติอยู่แล้ว)
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

      const bonusRow = el("div", null);
      bonusRow.style.cssText = "display:flex;gap:16px;flex-wrap:wrap;margin:10px 0;align-items:flex-end;";

      const freeHoursWrap = el("div", null);
      freeHoursWrap.appendChild(el("div", "drink-price", "แถมชั่วโมง (ไม่คิดเงิน)"));
      const freeHoursInput = document.createElement("input");
      freeHoursInput.type = "number";
      freeHoursInput.min = "0";
      freeHoursInput.step = "0.5";
      freeHoursInput.className = "step-qty-input";
      freeHoursInput.style.width = "100px";
      freeHoursInput.value = KARAOKE_FREE_HOURS || "";
      freeHoursInput.placeholder = "0";
      freeHoursInput.oninput = () => {
        KARAOKE_FREE_HOURS = Math.max(0, Number(freeHoursInput.value) || 0);
      };
      freeHoursWrap.appendChild(freeHoursInput);
      bonusRow.appendChild(freeHoursWrap);

      const freeMinutesWrap = el("div", null);
      freeMinutesWrap.appendChild(el("div", "drink-price", "แถมนาที (เพิ่มเติม)"));
      const freeMinutesInput = document.createElement("input");
      freeMinutesInput.type = "number";
      freeMinutesInput.min = "0";
      freeMinutesInput.step = "1";
      freeMinutesInput.className = "step-qty-input";
      freeMinutesInput.style.width = "100px";
      freeMinutesInput.value = KARAOKE_FREE_MINUTES || "";
      freeMinutesInput.placeholder = "0";
      freeMinutesInput.oninput = () => {
        KARAOKE_FREE_MINUTES = Math.max(0, Number(freeMinutesInput.value) || 0);
      };
      freeMinutesWrap.appendChild(freeMinutesInput);
      bonusRow.appendChild(freeMinutesWrap);

      const discountWrap = el("div", null);
      discountWrap.appendChild(el("div", "drink-price", "ส่วนลด (บาท)"));
      const discountInput = document.createElement("input");
      discountInput.type = "number";
      discountInput.min = "0";
      discountInput.className = "step-qty-input";
      discountInput.style.width = "100px";
      discountInput.value = KARAOKE_DISCOUNT || "";
      discountInput.placeholder = "0";
      discountInput.oninput = () => {
        KARAOKE_DISCOUNT = Math.max(0, Number(discountInput.value) || 0);
      };
      discountWrap.appendChild(discountInput);
      bonusRow.appendChild(discountWrap);

      kCard.appendChild(bonusRow);

      const karaokeMins = karaokeMinutes(KARAOKE_START, KARAOKE_END);
      if (karaokeMins !== null && karaokeMins > 0) {
        const { freeMinutes, billableMins, priceAfterFree, finalPrice } = karaokeFinalPrice(
          karaokeMins,
          karaokeRate,
          KARAOKE_FREE_HOURS,
          KARAOKE_DISCOUNT,
          KARAOKE_FREE_MINUTES
        );
        kCard.appendChild(el("div", "round-meta", `เวลาทั้งหมด ${karaokeLabel(karaokeMins)}`));
        if (freeMinutes > 0) {
          kCard.appendChild(
            el(
              "div",
              "round-meta",
              `แถม ${karaokeLabel(Math.min(freeMinutes, karaokeMins))} • เวลาที่คิดเงิน ${karaokeLabel(billableMins)} = ฿${money(priceAfterFree)}`
            )
          );
        }
        if (KARAOKE_DISCOUNT > 0) {
          kCard.appendChild(el("div", "round-meta", `ส่วนลด -฿${money(Math.min(KARAOKE_DISCOUNT, priceAfterFree))}`));
        }
        kCard.appendChild(el("div", "round-meta", `รวมสุทธิ = ฿${money(finalPrice)}`));
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
        const { freeMinutes, finalPrice } = karaokeFinalPrice(m, karaokeRate, KARAOKE_FREE_HOURS, KARAOKE_DISCOUNT, KARAOKE_FREE_MINUTES);
        const noteParts = [];
        if (freeMinutes > 0) noteParts.push(`แถม ${karaokeLabel(Math.min(freeMinutes, m))}`);
        if (KARAOKE_DISCOUNT > 0) noteParts.push(`ส่วนลด ฿${money(KARAOKE_DISCOUNT)}`);
        const noteText = noteParts.length ? ` (${noteParts.join(", ")})` : "";
        SAVING = true;
        render();
        try {
          STATE = await apiOrder({
            locationId,
            employee: KARAOKE_EMPLOYEE,
            items: [
              {
                id: `karaoke_${Date.now()}`,
                name: `ค่าคาราโอเกะ ${KARAOKE_START}–${KARAOKE_END} (${karaokeLabel(m)})${noteText}`,
                qty: 1,
                unitPrice: finalPrice,
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
          KARAOKE_DISCOUNT = 0;
          KARAOKE_FREE_HOURS = 0;
          KARAOKE_FREE_MINUTES = 0;
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
        el("div", "round-meta", fmtDateTime(r.timestamp) + backdateAnnotation(r) + (r.editedAt ? " (แก้ไขล่าสุด)" : "") + (r.pending ? " ⏳ กำลังส่งข้อมูล..." : ""))
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
      const freeEntries = Object.entries(ROOM_USE_DRAFT).filter(([id, qty]) => Number(qty) > 0 && ROOM_USE_FREE_DRAFT[id]);
      if (freeEntries.length) {
        // ไม่แสดงมูลค่าให้พนักงานเห็น (มีต้นทุนแฝงอยู่)
        const freeQtyTotal = freeEntries.reduce((s, [, qty]) => s + Number(qty), 0);
        const freeNote = el("div", "round-meta", `🎁 ใช้ฟรีรวม ${freeQtyTotal} รายการ (ไม่นับเป็นสต็อกหาย)`);
        freeNote.style.cssText = "color:var(--green);font-weight:700;margin-bottom:8px;";
        APP.appendChild(freeNote);
      }
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
          .map(([id, qty]) => ({ id, qty: Number(qty), free: !!ROOM_USE_FREE_DRAFT[id] }));
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
            // หักสต็อกกลางเสมอตามจำนวนที่ใช้ไปจริง ไม่ว่าจะติ๊กฟรีหรือไม่ก็ตาม (ฟรีแค่ไม่คิดเงิน ไม่ได้แปลว่าไม่ได้ใช้ของ)
            roomStockDeduct: Object.fromEntries(usedItems.map((i) => [i.id, i.qty])),
          });
          const freeCount = usedItems.filter((i) => i.free).reduce((s, i) => s + i.qty, 0);
          ROOM_USE_DRAFT = {};
          ROOM_USE_FREE_DRAFT = {};
          ROOM_USE_EMPLOYEE = null;
          toast(
            freeCount > 0
              ? `บันทึกรายการที่ใช้ไปเรียบร้อย (มีของฟรี ${freeCount} รายการ ไม่คิดเงิน)`
              : "บันทึกรายการที่ใช้ไปเรียบร้อย ยอดเงินถูกรวมเข้าบิลแล้ว"
          );
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
      // รวมยอดสินค้าแต่ละชนิดจากบิลที่ปิดแล้วทั้งหมดของห้องนี้ กันต้องมานั่งไล่นับเองทีละบิล
      const roomProductSummary = collectBillsProductSummary(locState.history);
      const summaryToggle = el(
        "button",
        "collapse-toggle",
        `${VIEW.showHistoryProductSummary ? "▾" : "▸"} 📦 รวมยอดสินค้าแต่ละชนิด (ห้องนี้)`
      );
      summaryToggle.style.cssText = "width:100%;text-align:left;margin-bottom:8px;";
      summaryToggle.onclick = () => {
        VIEW = { ...VIEW, showHistoryProductSummary: !VIEW.showHistoryProductSummary };
        render();
      };
      APP.appendChild(summaryToggle);

      if (VIEW.showHistoryProductSummary) {
        const summaryCard = el("div", "card");
        if (!roomProductSummary.rows.length) {
          summaryCard.appendChild(el("div", "empty-note", "ยังไม่มีรายการสินค้าในบิลที่ปิดแล้วของห้องนี้"));
        } else {
          for (const row of roomProductSummary.rows) {
            const line = el("div", "round-item");
            const topRow = el("div", "round-top");
            topRow.appendChild(el("span", null, row.name));
            topRow.appendChild(el("span", null, `${row.totalQty} ${row.unit}`));
            line.appendChild(topRow);
            let metaText = `ขาย ${row.soldQty} ${row.unit} • ฿${money(row.soldValue)}`;
            if (row.freeQty) metaText += ` • ฟรี ${row.freeQty} ${row.unit} (ต้นทุน ฿${money(row.freeCostValue)})`;
            line.appendChild(el("div", "round-meta", metaText));
            summaryCard.appendChild(line);
          }
          const totalLine = el("div", "round-item");
          totalLine.style.cssText = "font-weight:700;border-top:1px solid var(--border);margin-top:6px;padding-top:8px;";
          const totalTop = el("div", "round-top");
          totalTop.appendChild(el("span", null, "รวมทั้งหมด"));
          totalTop.appendChild(el("span", null, `${roomProductSummary.totals.totalQty} ชิ้น`));
          totalLine.appendChild(totalTop);
          let totalMeta = `ขาย ${roomProductSummary.totals.soldQty} ชิ้น • ฿${money(roomProductSummary.totals.soldValue)}`;
          if (roomProductSummary.totals.freeQty)
            totalMeta += ` • ฟรี ${roomProductSummary.totals.freeQty} ชิ้น (ต้นทุน ฿${money(roomProductSummary.totals.freeCostValue)})`;
          totalLine.appendChild(el("div", "round-meta", totalMeta));
          summaryCard.appendChild(totalLine);
        }
        APP.appendChild(summaryCard);
      }

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
            rTop.textContent = `${r.employee} • ${fmtDateTime(r.timestamp)}${backdateAnnotation(r)}${r.editedAt ? " (แก้ไขล่าสุด)" : ""} • ฿${money(r.roundTotal)}`;
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

  if (usedQty > 0) {
    const isFree = !!ROOM_USE_FREE_DRAFT[d.id];
    const freeBtn = el("button", "collapse-toggle" + (isFree ? " selected" : ""), isFree ? "✔ ฟรี (ไม่คิดเงิน เช่นญาติ/คนในครอบครัวใช้)" : "ติ๊กถ้าใช้ฟรี ไม่คิดเงิน");
    freeBtn.style.cssText = "width:100%;margin-top:8px;text-align:left;padding:6px 4px;" + (isFree ? "color:var(--green);font-weight:700;" : "");
    freeBtn.onclick = () => {
      ROOM_USE_FREE_DRAFT[d.id] = !isFree;
      render();
    };
    wrap.appendChild(freeBtn);
    if (isFree) {
      // ไม่แสดงมูลค่าให้พนักงานเห็น (มีต้นทุนแฝงอยู่)
      wrap.appendChild(el("div", "round-meta", "รายการนี้ไม่คิดเงิน — จะไม่นับเป็นสต็อกหาย"));
    }
  }

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
  back.onclick = goCeoMenu;
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

  // สรุปยอดสินค้าแต่ละชนิด รวมทุกบิลที่กรองอยู่ตอนนี้ (ไม่ต้องไล่นับทีละบิลเอง)
  {
    const productToggle = el(
      "button",
      "collapse-toggle",
      `${BILL_HISTORY_PRODUCT_SHOW ? "▾" : "▸"} 📦 สรุปยอดสินค้าแต่ละชนิด (รวมบิลที่แสดงอยู่)`
    );
    productToggle.style.cssText = "width:100%;text-align:left;margin-bottom:8px;";
    productToggle.onclick = () => {
      BILL_HISTORY_PRODUCT_SHOW = !BILL_HISTORY_PRODUCT_SHOW;
      render();
    };
    APP.appendChild(productToggle);

    if (BILL_HISTORY_PRODUCT_SHOW) {
      const summary = collectBillsProductSummary(filteredBills);
      const card = el("div", "card");
      if (!summary.rows.length) {
        card.appendChild(el("div", "empty-note", "ไม่มีรายการสินค้าในช่วงนี้"));
      } else {
        for (const row of summary.rows) {
          const line = el("div", "round-item");
          const topRow = el("div", "round-top");
          topRow.appendChild(el("span", null, row.name));
          topRow.appendChild(el("span", null, `${row.totalQty} ${row.unit}`));
          line.appendChild(topRow);
          let metaText = `ขาย ${row.soldQty} ${row.unit} • ฿${money(row.soldValue)}`;
          if (row.freeQty) metaText += ` • ฟรี ${row.freeQty} ${row.unit} (ต้นทุน ฿${money(row.freeCostValue)})`;
          line.appendChild(el("div", "round-meta", metaText));
          card.appendChild(line);
        }
        const totalLine = el("div", "round-item");
        totalLine.style.cssText = "font-weight:700;border-top:1px solid var(--border);margin-top:6px;padding-top:8px;";
        const totalTop = el("div", "round-top");
        totalTop.appendChild(el("span", null, "รวมทั้งหมด"));
        totalTop.appendChild(el("span", null, `${summary.totals.totalQty} ชิ้น`));
        totalLine.appendChild(totalTop);
        let totalMeta = `ขาย ${summary.totals.soldQty} ชิ้น • ฿${money(summary.totals.soldValue)}`;
        if (summary.totals.freeQty) totalMeta += ` • ฟรี ${summary.totals.freeQty} ชิ้น (ต้นทุน ฿${money(summary.totals.freeCostValue)})`;
        totalLine.appendChild(el("div", "round-meta", totalMeta));
        card.appendChild(totalLine);
      }
      APP.appendChild(card);
    }
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

  // ตัวเลือกลงย้อนหลัง: ปกติปิดไว้ ใช้เวลาปัจจุบันตอนกดบันทึกเสมอ เปิดไว้เผื่อกรณีเช่นครัวเอาสต็อกไปใช้แล้วมาลงทีหลัง จะได้เลือกวันที่ที่แท้จริงได้
  const backdateToggle = el(
    "button",
    "collapse-toggle",
    DRAFT.backdate ? "🕒 ลงย้อนหลัง (กำลังเลือกวันที่เอง)" : "🕒 ลงย้อนหลัง (ถ้าเพิ่งมาบันทึกทีหลัง)"
  );
  backdateToggle.onclick = () => {
    DRAFT.backdate = !DRAFT.backdate;
    if (DRAFT.backdate && !DRAFT.backdateDate) {
      const now = new Date(Date.now() + THAILAND_OFFSET_MS);
      DRAFT.backdateDate = now.toISOString().slice(0, 10);
      DRAFT.backdateTime = `${String(now.getUTCHours()).padStart(2, "0")}:${String(now.getUTCMinutes()).padStart(2, "0")}`;
    }
    render();
  };
  APP.appendChild(backdateToggle);

  if (DRAFT.backdate) {
    const backdateCard = el("div", "card");
    backdateCard.appendChild(
      el("div", "round-meta", "เลือกวันที่/เวลาที่รายการนี้เกิดขึ้นจริง (ระบบจะจดไว้ด้วยว่ามาบันทึกจริงเมื่อไหร่ กันสับสน)")
    );
    const dtRow = el("div", null);
    dtRow.style.cssText = "display:flex;gap:12px;flex-wrap:wrap;margin-top:8px;";

    const dateWrap = el("div", null);
    dateWrap.appendChild(el("div", "drink-price", "วันที่"));
    const backdateDateInput = document.createElement("input");
    backdateDateInput.type = "date";
    backdateDateInput.className = "step-qty-input";
    backdateDateInput.value = DRAFT.backdateDate || "";
    backdateDateInput.oninput = () => {
      DRAFT.backdateDate = backdateDateInput.value;
    };
    dateWrap.appendChild(backdateDateInput);
    dtRow.appendChild(dateWrap);

    const timeWrap = el("div", null);
    timeWrap.appendChild(el("div", "drink-price", "เวลา"));
    const backdateTimeInput = document.createElement("input");
    backdateTimeInput.type = "time";
    backdateTimeInput.className = "step-qty-input";
    backdateTimeInput.value = DRAFT.backdateTime || "";
    backdateTimeInput.oninput = () => {
      DRAFT.backdateTime = backdateTimeInput.value;
    };
    timeWrap.appendChild(backdateTimeInput);
    dtRow.appendChild(timeWrap);

    backdateCard.appendChild(dtRow);
    APP.appendChild(backdateCard);
  }

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

    // ถ้าเปิดโหมดลงย้อนหลังไว้และเลือกวันที่แล้ว ใช้วันที่/เวลานั้นแทน "ตอนนี้" (ตีความเป็นเวลาไทย ให้ตรงกับที่พนักงานเห็นบนจอ)
    let finalTimestamp = new Date().toISOString();
    if (DRAFT.backdate && DRAFT.backdateDate) {
      const timePart = DRAFT.backdateTime || "00:00";
      const localMs = new Date(`${DRAFT.backdateDate}T${timePart}:00.000Z`).getTime() - THAILAND_OFFSET_MS;
      if (Number.isFinite(localMs)) finalTimestamp = new Date(localMs).toISOString();
    }
    const payload = {
      locationId,
      employee: DRAFT.employee,
      items: itemsList,
      emptyCounts: DRAFT.emptyCounts,
      timestamp: finalTimestamp,
      loggedAt: new Date().toISOString(), // เวลาที่มาบันทึกจริงๆ (ต่างจาก timestamp ถ้าเลือกลงย้อนหลัง) กันสับสน/ป้องกันความผิดพลาด
      editRoundId: DRAFT.editRoundId || undefined,
    };
    const itemsSpeech = itemsList.map((i) => `${i.name} ${i.qty} ${i.free ? "ฟรี" : ""}`).join(" ");

    // การเพิ่มรายการใหม่ (ไม่ใช่แก้ไข/ไม่มีการนับขวดเปล่า) เป็นปุ่มที่กดบ่อยที่สุด
    // แสดงผลทันทีแบบ optimistic (ไม่รอ network) แล้วค่อยยืนยันกับเซิร์ฟเวอร์เบื้องหลัง เพื่อให้รู้สึกไวขึ้นมาก
    const canOptimistic = !isEdit && (!DRAFT.emptyCounts || !Object.values(DRAFT.emptyCounts).some((v) => Number(v) > 0));
    if (canOptimistic) {
      const tempId = `pending_${Date.now()}`;
      const prevStateSnapshot = STATE;
      const nextLocations = { ...STATE.locations };
      const prevLocState = nextLocations[locationId] || { openBill: null, history: [] };
      const prevOpenBill = prevLocState.openBill || { rounds: [], returnsLog: [], deletesLog: [] };
      const pendingRound = {
        id: tempId,
        employee: DRAFT.employee,
        timestamp: payload.timestamp,
        loggedAt: payload.loggedAt,
        items: itemsList,
        roundTotal: itemsList.reduce((s, i) => s + (i.lineTotal || 0), 0),
        pending: true,
      };
      nextLocations[locationId] = {
        ...prevLocState,
        openBill: { ...prevOpenBill, rounds: [...prevOpenBill.rounds, pendingRound] },
      };
      STATE = { ...STATE, locations: nextLocations };

      toast("บันทึกเรียบร้อย");
      speakThai(`${DRAFT.employee} เพิ่ม ${itemsSpeech} ลง${loc.label} เรียบร้อยแล้ว`);
      goLocation(locationId);

      try {
        const fresh = await apiOrder(payload);
        STATE = fresh;
        if (VIEW.name === "location" && VIEW.locationId === locationId) render();
      } catch (e) {
        STATE = prevStateSnapshot;
        toast("บันทึกไม่สำเร็จ (" + e.message + ") กรุณาลองใหม่", true);
        render();
      }
      return;
    }

    SAVING = true;
    render();
    try {
      STATE = await apiOrder(payload);
      SAVING = false;
      toast(isEdit ? "แก้ไขเรียบร้อย" : "บันทึกเรียบร้อย");
      if (!isEdit) {
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

// สรุปยอดเก็บเงินสต็อกหายในช่วงเวลาหนึ่ง (สัปดาห์/เดือน) ใช้วันที่เก็บเงินจริง (chargeDate) เป็นหลัก
// ไม่ใช่เวลาที่กดบันทึก เพราะอาจลงย้อนหลัง — ให้ CEO ดูได้ว่าของหายมูลค่าเท่าไร เก็บเงินได้เท่าไร
// และเก็บจากพนักงานคนไหนไปเท่าไรบ้าง โดยไม่ต้องไล่นับเอง
function collectShrinkageChargeSummaryForPeriod(periodType, refIso) {
  const { startMs, endMs, label } = getPeriodBounds(periodType, refIso);

  const charges = (STATE.shrinkageCharges || []).filter((c) => {
    const dateBasis = c.chargeDate ? `${c.chargeDate}T12:00:00+07:00` : c.timestamp;
    const ms = new Date(dateBasis).getTime();
    return ms >= startMs && ms < endMs;
  });

  const byEmployee = new Map(); // name -> { name, amount, count }
  let totalCollected = 0; // ฿ ที่เพิ่มเป็นรายได้ของเครื่องดื่ม (chargeAmount)
  let totalEmployeeCharge = 0; // ฿ ที่เก็บจากพนักงานจริง (employeeCharge)
  for (const c of charges) {
    totalCollected += Number(c.chargeAmount || 0);
    totalEmployeeCharge += Number(c.employeeCharge || 0);
    const names = c.employees && c.employees.length ? c.employees : c.employee ? [c.employee] : [];
    const share = names.length ? Number(c.employeeCharge || 0) / names.length : 0;
    for (const name of names) {
      if (!byEmployee.has(name)) byEmployee.set(name, { name, amount: 0, count: 0 });
      const entry = byEmployee.get(name);
      entry.amount += share;
      entry.count += 1;
    }
  }
  const employeeRows = [...byEmployee.values()].sort((a, b) => b.amount - a.amount);

  // เก็บเงินได้แล้ว แยกรายตัวเครื่องดื่มด้วย (รวม ฿ ที่เก็บได้ต่อเครื่องดื่มหนึ่งชนิด จากทุกครั้งที่บันทึกในช่วงนี้)
  // คำนวณก่อนของหายรายตัว เพราะต้องใช้จับคู่ว่าของหายแต่ละตัวเก็บเงินไปแล้วเท่าไร เหลือใครยังไม่รับผิดชอบเท่าไร
  // waivedQty = จำนวนหน่วยที่ "ยกเว้นไม่คิดเงิน" ไปแล้ว (รายการ chargeAmount = 0 ที่มี qty บันทึกไว้) ต้องหักออกจากยอดค้างด้วย
  // ไม่งั้นกดไม่คิดเงินแล้วยอด "ยังไม่มีคนรับผิดชอบ" จะไม่ลดเลย เพราะเดิมคำนวณจากเงินที่เก็บได้จริงอย่างเดียว
  const collectedByDrink = new Map(); // drinkId -> { name, collected, waivedQty, count }
  for (const c of charges) {
    const key = c.drinkId || c.drinkName;
    if (!collectedByDrink.has(key)) {
      collectedByDrink.set(key, { name: c.drinkName || key, collected: 0, waivedQty: 0, count: 0 });
    }
    const entry = collectedByDrink.get(key);
    entry.collected += Number(c.chargeAmount || 0);
    if (Number(c.chargeAmount || 0) === 0 && typeof c.qty === "number" && c.qty > 0) {
      entry.waivedQty += c.qty;
    }
    entry.count += 1;
  }
  const collectedRows = [...collectedByDrink.values()].sort((a, b) => b.collected - a.collected);

  // ของหายรวม (มูลค่าตามราคาขาย) จากทุกสินค้าที่นับสต็อกในช่วงเดียวกันนี้ — เก็บทั้งยอดรวมและแยกรายตัว
  // (รายตัว: เครื่องดื่มอะไรบ้าง หายไปกี่ขวด คิดเป็นเงินเท่าไร เก็บไปแล้วเท่าไร เหลือใครยังไม่รับผิดชอบเท่าไร) กันต้องไปไล่นับเอง
  let totalShrinkageQty = 0;
  let totalShrinkageValue = 0;
  const shrinkageRows = [];
  for (const d of stockTrackedDrinks()) {
    const r = computeDrinkReconciliation(d.id, periodType, refIso);
    if (r.shrinkageQty > 0) {
      const price = Number(d.price || 0);
      const value = r.shrinkageQty * price;
      const collectedAmount = collectedByDrink.has(d.id) ? collectedByDrink.get(d.id).collected : 0;
      const waivedQty = collectedByDrink.has(d.id) ? collectedByDrink.get(d.id).waivedQty : 0;
      const collectedQty = price > 0 ? Math.min(r.shrinkageQty, Math.round((collectedAmount / price) * 10) / 10) : 0;
      // ยอดค้าง = จำนวนที่ยังไม่เก็บเงินและไม่ได้ถูกยกเว้น (ไม่ใช่แค่ "เงินที่ยังไม่ได้เก็บ" เพราะรายการยกเว้น 0 บาทก็ต้องถือว่าจบเคสแล้ว)
      const outstandingQty = Math.max(0, Math.round((r.shrinkageQty - collectedQty - waivedQty) * 10) / 10);
      const outstandingAmount = Math.max(0, Math.round(outstandingQty * price));
      shrinkageRows.push({
        drinkId: d.id,
        name: d.name,
        unit: d.unit || "หน่วย",
        qty: r.shrinkageQty,
        value,
        collectedAmount,
        collectedQty,
        waivedQty,
        outstandingAmount,
        outstandingQty,
      });
    }
    totalShrinkageQty += r.shrinkageQty;
    totalShrinkageValue += r.shrinkageQty * Number(d.price || 0);
  }
  shrinkageRows.sort((a, b) => b.outstandingAmount - a.outstandingAmount);

  const chargesSorted = charges.slice().sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  // เงินที่หักได้แล้วจากแผนหักเงินรายวัน ในช่วงที่กำลังดูอยู่นี้ (แยกจาก charges แบบเก็บทีเดียว แต่รวมเป็นยอดเดียวกัน
  // ในภาพรวม เพราะเป็นเงินที่เก็บได้จริงเหมือนกัน ไม่ว่าจะเก็บทีเดียวหรือทยอยหักรายวัน)
  const allPlans = STATE.shrinkageDebtPlans || [];
  let totalCollectedFromDebtPlans = 0;
  for (const plan of allPlans) {
    for (const d of plan.deductions || []) {
      const dateBasis = `${d.date}T12:00:00+07:00`;
      const ms = new Date(dateBasis).getTime();
      if (ms >= startMs && ms < endMs) totalCollectedFromDebtPlans += Number(d.amount || 0);
    }
  }
  // ยอดคงเหลือรวมจากทุกแผนหักเงินรายวัน (ทุกแผน ไม่ผูกกับช่วงที่ดูอยู่ เพราะเป็นหนี้ระยะยาวที่ผ่อนจ่ายได้หลายงวด)
  let totalDebtPlanRemaining = 0;
  for (const plan of allPlans) {
    const status = computeShrinkageDebtPlanStatus(plan);
    for (const name of plan.employees || []) {
      totalDebtPlanRemaining += status.byEmployee[name] ? status.byEmployee[name].remaining : 0;
    }
  }
  const totalCollectedCombined = totalCollected + totalCollectedFromDebtPlans;

  return {
    label,
    totalShrinkageQty,
    totalShrinkageValue,
    shrinkageRows,
    totalCollected,
    totalCollectedFromDebtPlans,
    totalCollectedCombined,
    totalDebtPlanRemaining,
    totalEmployeeCharge,
    collectedRows,
    employeeRows,
    charges: chargesSorted,
  };
}

// คำนวณสถานะแผนหักเงินรายวันหนึ่งแผน: เก็บได้แล้วต่อคนเท่าไร เหลือต่อคนเท่าไร จ่ายครบหมดทุกคนหรือยัง
function computeShrinkageDebtPlanStatus(plan) {
  const employees = plan.employees || [];
  const owedPerPerson = employees.length ? Number(plan.totalAmount || 0) / employees.length : 0;
  const deductions = plan.deductions || [];
  const byEmployee = {};
  for (const name of employees) {
    const paid = deductions.filter((d) => d.employee === name).reduce((s, d) => s + Number(d.amount || 0), 0);
    const remaining = Math.max(0, owedPerPerson - paid);
    byEmployee[name] = { paid, remaining };
  }
  const fullyPaid = employees.length > 0 && employees.every((name) => byEmployee[name].remaining <= 0);
  return { owedPerPerson, byEmployee, fullyPaid };
}

// รวมมูลค่าของหายที่ยังไม่มีคนรับผิดชอบ (outstandingAmount) ของสินค้าหลายตัวที่เลือกไว้ ใช้คำนวณยอดรวมอัตโนมัติ
// ให้ตอนตั้ง/แก้ไขแผนหักเงินรายวัน กันต้องมานั่งบวกเลขเอง
function sumOutstandingForDrinkIds(drinkIds, shrinkageRows) {
  let total = 0;
  for (const id of drinkIds) {
    const row = shrinkageRows.find((r) => r.drinkId === id);
    if (row) total += row.outstandingAmount > 0 ? row.outstandingAmount : row.value;
  }
  return total;
}

// กล่องเลื่อนเลือกสินค้าได้หลายรายการ แทนกริดปุ่มเยอะๆ ที่ลายตาเวลามีสินค้าเยอะ
// ใช้ปุ่มธรรมดา (แบบเดียวกับปุ่มเลือกพนักงานที่ใช้ทั่วแอป) แทน <input type=checkbox> เพราะ checkbox/label
// บนมือถือบางรุ่นทำให้หน้าจอเด้งเลื่อนขึ้นบนเวลาถูกสร้างใหม่ทับของเดิมตอน render() (โฟกัสของ input หาย) ปุ่มธรรมดาไม่มีปัญหานี้
function renderDrinkCheckScrollList(rows, onToggle) {
  const wrap = el("div", null);
  wrap.style.cssText =
    "max-height:220px;overflow-y:auto;border:1px solid var(--border);border-radius:8px;padding:6px;background:#fff;margin-bottom:6px;";
  for (const row of rows) {
    const b = el("button", "staff-btn" + (row.selected ? " selected" : ""), (row.selected ? "✔ " : "") + row.label);
    b.type = "button";
    b.style.cssText = "display:block;width:100%;text-align:left;margin-bottom:6px;";
    b.onclick = () => onToggle(row.id);
    wrap.appendChild(b);
  }
  return wrap;
}

// เลื่อนช่วงเวลาอ้างอิงไปข้างหน้า/ถอยหลัง 1 หน่วย (1 สัปดาห์ หรือ 1 เดือน ตามโหมด) อย่างถูกต้องแม้เดือนจะมีจำนวนวันไม่เท่ากัน
function shiftPeriodRef(periodType, refIso, direction) {
  if (periodType === "month") {
    const mKey = monthKeyOf(refIso);
    const [y, m] = mKey.split("-").map(Number);
    const newDateUtc = new Date(Date.UTC(y, m - 1 + direction, 1, 12, 0, 0));
    return newDateUtc.toISOString();
  }
  return new Date(new Date(refIso).getTime() + direction * 7 * 86400000).toISOString();
}

function renderStockReconciliation() {
  const top = el("div", "topbar");
  const back = el("button", "back-btn", "←");
  back.onclick = goCeoMenu;
  top.appendChild(back);
  top.appendChild(el("h1", null, "📊 สรุปเติม/ใช้สต็อก"));
  APP.appendChild(top);
  APP.appendChild(renderCeoReportNav("stock-reconciliation"));

  APP.appendChild(
    el(
      "div",
      "round-meta",
      "ดูว่าช่วงนี้เติมสต็อกไปเท่าไร ขาย/ใช้ไปเท่าไร แล้วควรเหลือเท่าไร เทียบกับยอดในระบบตอนนี้ เพื่อเช็กว่าของหายหรือเปล่า (ลองนับของจริงเทียบดู)"
    )
  );

  const modeRow = el("div", null);
  modeRow.style.cssText = "display:flex;gap:8px;margin:10px 0;";
  const weekBtn = el("button", "btn-" + (STOCK_RECON_MODE === "week" ? "primary" : "secondary"), "รายสัปดาห์");
  weekBtn.style.flex = "1";
  weekBtn.onclick = () => {
    STOCK_RECON_MODE = "week";
    render();
  };
  const monthBtn = el("button", "btn-" + (STOCK_RECON_MODE === "month" ? "primary" : "secondary"), "รายเดือน");
  monthBtn.style.flex = "1";
  monthBtn.onclick = () => {
    STOCK_RECON_MODE = "month";
    render();
  };
  modeRow.appendChild(weekBtn);
  modeRow.appendChild(monthBtn);
  APP.appendChild(modeRow);

  const bounds = getPeriodBounds(STOCK_RECON_MODE, STOCK_RECON_REF);

  const navRow = el("div", null);
  navRow.style.cssText = "display:flex;align-items:center;gap:8px;margin-bottom:6px;flex-wrap:wrap;";
  const prevBtn = el("button", "collapse-toggle", "◀ ก่อนหน้า");
  prevBtn.onclick = () => {
    STOCK_RECON_REF = shiftPeriodRef(STOCK_RECON_MODE, STOCK_RECON_REF, -1);
    render();
  };
  const nextBtn = el("button", "collapse-toggle", "ถัดไป ▶");
  nextBtn.onclick = () => {
    STOCK_RECON_REF = shiftPeriodRef(STOCK_RECON_MODE, STOCK_RECON_REF, 1);
    render();
  };
  const todayBtn = el("button", "collapse-toggle", "วันนี้");
  todayBtn.onclick = () => {
    STOCK_RECON_REF = new Date().toISOString();
    render();
  };
  navRow.appendChild(prevBtn);
  navRow.appendChild(nextBtn);
  navRow.appendChild(todayBtn);
  APP.appendChild(navRow);
  APP.appendChild(el("div", "section-label", `ช่วง: ${bounds.label}`));

  const searchInput = document.createElement("input");
  searchInput.type = "text";
  searchInput.id = "stock-recon-search-input";
  searchInput.placeholder = "🔍 ค้นหาสินค้า...";
  searchInput.className = "step-qty-input";
  searchInput.style.cssText =
    "width:100%;height:48px;font-size:18px;text-align:left;padding:0 14px;margin:10px 0;box-sizing:border-box;";
  searchInput.value = STOCK_RECON_SEARCH;
  searchInput.oninput = () => {
    STOCK_RECON_SEARCH = searchInput.value;
    renderStockReconciliationListInto(listWrap);
  };
  APP.appendChild(searchInput);

  const listWrap = el("div", null);
  APP.appendChild(listWrap);
  renderStockReconciliationListInto(listWrap);
}

function renderStockReconciliationListInto(container) {
  container.innerHTML = "";
  const query = STOCK_RECON_SEARCH.trim().toLowerCase();
  const drinks = stockTrackedDrinks().filter((d) => !query || d.name.toLowerCase().includes(query));

  if (!drinks.length) {
    container.appendChild(el("div", "empty-note", query ? `ไม่พบสินค้าที่ตรงกับ "${STOCK_RECON_SEARCH}"` : "ยังไม่มีสินค้าที่นับสต็อก"));
    return;
  }

  let totalRestocked = 0;
  let totalSold = 0;
  let totalShrinkage = 0;
  let totalFreeQty = 0;
  let totalFreeValue = 0;
  let totalFreeCostValue = 0;
  const freeItemRows = []; // แยกรายตัวว่าฟรีอะไรบ้าง กี่ขวด มูลค่าขาย/ต้นทุนเท่าไร
  const shrinkItemRows = []; // แยกรายตัวว่าของหายอะไรบ้าง กี่ขวด + เก็บเงินไปแล้วเท่าไร เหลือใครยังไม่รับผิดชอบเท่าไร
  const { startMs: reconStartMs, endMs: reconEndMs } = getPeriodBounds(STOCK_RECON_MODE, STOCK_RECON_REF);
  const rows = drinks.map((d) => {
    const r = computeDrinkReconciliation(d.id, STOCK_RECON_MODE, STOCK_RECON_REF);
    totalRestocked += r.restockedQty;
    totalSold += r.soldQty;
    totalShrinkage += r.shrinkageQty;
    totalFreeQty += r.freeQty || 0;
    totalFreeValue += r.freeValue || 0;
    const costValue = (r.freeQty || 0) * Number(d.cost || 0);
    totalFreeCostValue += costValue;
    if (r.freeQty > 0) {
      freeItemRows.push({ name: d.name, unit: d.unit || "หน่วย", qty: r.freeQty, value: r.freeValue || 0, costValue });
    }
    if (r.shrinkageQty > 0) {
      const price = Number(d.price || 0);
      const value = r.shrinkageQty * price;
      // เก็บเงินไปแล้วเท่าไร (ใช้วันที่เก็บเงินจริง chargeDate ถ้ามี เหมือนที่ใช้กรองในการ์ดรายตัวด้านล่าง)
      const chargesForThisDrinkPeriod = (STATE.shrinkageCharges || []).filter((c) => {
        if (c.drinkId !== d.id) return false;
        const dateBasis = c.chargeDate ? `${c.chargeDate}T12:00:00+07:00` : c.timestamp;
        const ms = new Date(dateBasis).getTime();
        return ms >= reconStartMs && ms < reconEndMs;
      });
      const collectedAmount = chargesForThisDrinkPeriod.reduce((s, c) => s + Number(c.chargeAmount || 0), 0);
      // waivedQty = จำนวนที่ยกเว้นไม่คิดเงินไปแล้ว (รายการ 0 บาทที่มี qty บันทึกไว้) ต้องหักออกจากยอดค้างด้วยเช่นกัน
      const waivedQty = chargesForThisDrinkPeriod.reduce(
        (s, c) => s + (Number(c.chargeAmount || 0) === 0 && typeof c.qty === "number" && c.qty > 0 ? c.qty : 0),
        0
      );
      const collectedQty = price > 0 ? Math.min(r.shrinkageQty, Math.round((collectedAmount / price) * 10) / 10) : 0;
      const outstandingQty = Math.max(0, Math.round((r.shrinkageQty - collectedQty - waivedQty) * 10) / 10);
      const outstandingAmount = Math.max(0, Math.round(outstandingQty * price));
      shrinkItemRows.push({
        name: d.name,
        unit: d.unit || "หน่วย",
        qty: r.shrinkageQty,
        value,
        collectedAmount,
        collectedQty,
        waivedQty,
        outstandingAmount,
        outstandingQty,
      });
    }
    return { d, r };
  });
  freeItemRows.sort((a, b) => b.qty - a.qty);
  shrinkItemRows.sort((a, b) => b.outstandingAmount - a.outstandingAmount);

  const summaryCard = el("div", "card");
  summaryCard.appendChild(el("div", "round-top", "ภาพรวมทั้งหมดช่วงนี้"));
  summaryCard.appendChild(el("div", "round-meta", `เติมเข้ามารวม ${totalRestocked} ขวด/หน่วย • ขาย/ใช้ไปรวม ${totalSold} ขวด/หน่วย`));
  if (totalFreeQty > 0) {
    // หน้านี้เป็น CEO เท่านั้นแล้ว (ต้องใส่รหัส CEO ถึงเข้าได้) เลยแสดงมูลค่า/ต้นทุนได้เต็มที่
    const freeNote = el(
      "div",
      "round-meta",
      `🎁 ใช้ฟรีไป (ญาติ/คนในครอบครัว) รวม ${totalFreeQty} ขวด/หน่วย มูลค่าขาย ฿${money(totalFreeValue)} • ต้นทุน ฿${money(totalFreeCostValue)} — ไม่นับเป็นสต็อกหาย`
    );
    freeNote.style.cssText = "color:var(--green);font-weight:700;";
    summaryCard.appendChild(freeNote);
    for (const item of freeItemRows) {
      summaryCard.appendChild(
        el(
          "div",
          "round-meta",
          `　🎁 ${item.name}: ${item.qty} ${item.unit} (มูลค่าขาย ฿${money(item.value)} • ต้นทุน ฿${money(item.costValue)})`
        )
      );
    }
  }
  if (totalShrinkage > 0) {
    const shrinkNote = el("div", "round-meta", `⚠️ ตรวจพบของหายจากการนับสต็อกช่วงนี้รวม ${totalShrinkage} ขวด/หน่วย`);
    shrinkNote.style.cssText = "color:#B4432E;font-weight:700;";
    summaryCard.appendChild(shrinkNote);
    for (const item of shrinkItemRows) {
      summaryCard.appendChild(
        el("div", "round-meta", `　⚠️ ${item.name}: ${item.qty} ${item.unit} (มูลค่า ฿${money(item.value)})`)
      );
    }
    // รายละเอียดเก็บเงินไปแล้ว/ยังไม่มีคนรับผิดชอบ ย้ายไปดูที่เมนู CEO > สรุปเก็บเงินสต็อกหาย แทน (ไม่แสดงตรงนี้แล้ว)
    const seeMoreNote = el("div", "round-meta", "ดูรายละเอียดเก็บเงิน/ยังไม่มีคนรับผิดชอบได้ที่ เมนู CEO > สรุปเก็บเงินสต็อกหาย");
    seeMoreNote.style.cssText = "font-style:italic;opacity:0.8;";
    summaryCard.appendChild(seeMoreNote);
  }
  container.appendChild(summaryCard);

  for (const { d, r } of rows) {
    const card = el("div", "card");
    const headerRow = el("div", "round-top");
    headerRow.appendChild(el("span", null, d.name));
    headerRow.appendChild(el("span", null, `ยอดในระบบตอนนี้ ${STATE.stock[d.id] || 0} ${d.unit || ""}`));
    card.appendChild(headerRow);

    card.appendChild(
      el(
        "div",
        "round-meta",
        `ยอดต้นงวด ${r.startQty}${r.hasBaseline ? "" : " (ประมาณ จากยอดสต็อกปัจจุบันย้อนกลับ เพราะยังไม่เคยนับสต็อกจริงก่อนช่วงนี้)"} • เติมเข้ามา ${r.restockedQty} • ขาย/ใช้ไป ${r.soldQty}`
      )
    );
    const expectRow = el("div", "round-items", `ควรเหลือช่วงนี้: ${r.endQty} ${d.unit || ""}`);
    card.appendChild(expectRow);

    if (r.freeQty > 0) {
      // หน้านี้เป็น CEO เท่านั้นแล้ว แสดงมูลค่าได้เต็มที่
      const freeRow = el(
        "div",
        "round-meta",
        `🎁 ในนั้นใช้ฟรีไป ${r.freeQty} ${d.unit || ""} มูลค่า ฿${money(r.freeValue)} (ไม่นับเป็นสต็อกหาย)`
      );
      freeRow.style.cssText = "color:var(--green);font-weight:700;";
      card.appendChild(freeRow);
    }

    // ลิงก์ตรวจสอบที่มา: ให้ดูได้ว่ายอดต้นงวด/เติม/ขายคำนวณจากประวัติการนับสต็อกรายการไหนบ้าง เผื่อตัวเลขดูไม่ตรงกับที่คาด (เช่น มีรายการที่แก้ไข/ลบไปแล้ว)
    const isTraceShown = STOCK_RECON_TRACE_SHOW === d.id;
    const traceBtn = el("button", "collapse-toggle", isTraceShown ? "▾ ซ่อนรายการนับสต็อกที่เกี่ยวข้อง" : "🔍 ดูรายการนับสต็อกที่เกี่ยวข้อง");
    traceBtn.style.cssText = "margin-top:4px;";
    traceBtn.onclick = () => {
      STOCK_RECON_TRACE_SHOW = isTraceShown ? null : d.id;
      renderStockReconciliationListInto(container);
    };
    card.appendChild(traceBtn);

    if (isTraceShown) {
      const { startMs, endMs } = getPeriodBounds(STOCK_RECON_MODE, STOCK_RECON_REF);
      const relevantEntries = [];
      for (const h of STATE.stockHistory || []) {
        for (const c of h.changes || []) {
          if (c.id !== d.id) continue;
          relevantEntries.push({ h, c });
        }
      }
      relevantEntries.sort((a, b) => new Date(a.h.timestamp) - new Date(b.h.timestamp));
      const traceWrap = el("div", null);
      traceWrap.style.cssText = "margin-top:6px;padding:8px;background:var(--cream-2);border-radius:8px;";
      if (!relevantEntries.length) {
        traceWrap.appendChild(el("div", "round-meta", "ยังไม่เคยมีการนับสต็อกเครื่องดื่มนี้เลย"));
      } else {
        for (const { h, c } of relevantEntries) {
          const ms = new Date(h.timestamp).getTime();
          const zone = ms < startMs ? "ก่อนช่วงนี้" : ms >= endMs ? "หลังช่วงนี้" : "ในช่วงนี้";
          const from = c.from !== undefined ? c.from : c.before;
          const to = c.to !== undefined ? c.to : c.after;
          let statusText = "";
          if (c.deleted) statusText = ` — ลบแล้ว โดย ${c.deletedBy} (กดผิด SKU, ไม่ถูกนับ)`;
          else if (c.corrected) statusText = ` — แก้ไขแล้ว จากเดิม ${c.originalFrom}→${c.originalTo} โดย ${c.correctedBy}`;
          const line = el(
            "div",
            "round-meta",
            `${fmtDateTime(h.timestamp)} • ${h.employee} • ${from}→${to} • (${zone})${statusText}`
          );
          if (c.deleted) line.style.cssText = "text-decoration:line-through;color:#8a8a8a;";
          traceWrap.appendChild(line);
        }
      }
      card.appendChild(traceWrap);
    }

    if (r.shrinkageQty > 0) {
      const shrinkRow = el("div", "round-meta", `⚠️ ของหายที่ตรวจพบตอนนับสต็อกช่วงนี้: ${r.shrinkageQty} ${d.unit || ""}`);
      shrinkRow.style.cssText = "color:#B4432E;font-weight:700;";
      card.appendChild(shrinkRow);

      if (CEO_UNLOCKED) {
        const { startMs, endMs } = getPeriodBounds(STOCK_RECON_MODE, STOCK_RECON_REF);
        const chargesForDrinkInPeriod = (STATE.shrinkageCharges || []).filter((c) => {
          if (c.drinkId !== d.id) return false;
          // ใช้วันที่เก็บเงินจริง (chargeDate) ถ้ามี ไม่ใช่เวลาที่กดบันทึก เพราะอาจลงย้อนหลัง
          const dateBasis = c.chargeDate ? `${c.chargeDate}T12:00:00+07:00` : c.timestamp;
          const ms = new Date(dateBasis).getTime();
          return ms >= startMs && ms < endMs;
        });
        const collectedTotal = chargesForDrinkInPeriod.reduce((s, c) => s + Number(c.chargeAmount || 0), 0);
        if (collectedTotal > 0) {
          card.appendChild(el("div", "round-meta", `บันทึกเก็บเงินสต็อกหายไปแล้วช่วงนี้: ฿${money(collectedTotal)}`));
        }

        const toggleChargeBtn = el(
          "button",
          "btn-secondary",
          SHRINKAGE_CHARGE_SHOW === d.id ? "▾ ยกเลิกบันทึกเก็บเงิน" : "💰 บันทึกเก็บเงินสต็อกหาย"
        );
        toggleChargeBtn.style.marginTop = "8px";
        toggleChargeBtn.onclick = () => {
          if (SHRINKAGE_CHARGE_SHOW === d.id) {
            SHRINKAGE_CHARGE_SHOW = null;
          } else {
            SHRINKAGE_CHARGE_SHOW = d.id;
            SHRINKAGE_CHARGE_AMOUNT = "";
            SHRINKAGE_CHARGE_EMPLOYEE_AMOUNT = "";
            SHRINKAGE_CHARGE_RESPONSIBLE_LIST = [];
            SHRINKAGE_CHARGE_RECORDER = null;
            SHRINKAGE_CHARGE_DATE = new Date(Date.now() + THAILAND_OFFSET_MS).toISOString().slice(0, 10);
          }
          renderStockReconciliationListInto(container);
        };
        card.appendChild(toggleChargeBtn);

        if (SHRINKAGE_CHARGE_SHOW === d.id) {
          const panel = el("div", "card");
          panel.style.cssText = "margin-top:8px;padding:10px;background:var(--cream-2);";

          panel.appendChild(el("div", "drink-price", "จำนวนเงินที่จะเก็บ (บาท) — จะถูกเพิ่มเป็นรายได้ของเครื่องดื่มนี้"));
          const chargeAmountRow = el("div", null);
          chargeAmountRow.style.cssText = "display:flex;align-items:center;gap:8px;flex-wrap:wrap;";
          const chargeInput = document.createElement("input");
          chargeInput.type = "number";
          chargeInput.min = "0";
          chargeInput.className = "step-qty-input";
          chargeInput.style.width = "140px";
          chargeInput.value = SHRINKAGE_CHARGE_AMOUNT;
          chargeInput.oninput = () => {
            SHRINKAGE_CHARGE_AMOUNT = chargeInput.value;
          };
          chargeAmountRow.appendChild(chargeInput);
          const noChargeBtn = el("button", "collapse-toggle", "🚫 ไม่คิดเงิน (0 บาท)");
          noChargeBtn.onclick = () => {
            SHRINKAGE_CHARGE_AMOUNT = "0";
            SHRINKAGE_CHARGE_EMPLOYEE_AMOUNT = "0";
            renderStockReconciliationListInto(container);
          };
          chargeAmountRow.appendChild(noChargeBtn);
          panel.appendChild(chargeAmountRow);

          panel.appendChild(el("div", "drink-price", "วันที่เก็บเงิน (เลือกย้อนหลังได้ ถ้าเพิ่งมาบันทึกทีหลัง)"));
          const chargeDateInput = document.createElement("input");
          chargeDateInput.type = "date";
          chargeDateInput.className = "step-qty-input";
          chargeDateInput.style.width = "160px";
          chargeDateInput.value = SHRINKAGE_CHARGE_DATE || new Date(Date.now() + THAILAND_OFFSET_MS).toISOString().slice(0, 10);
          chargeDateInput.oninput = () => {
            SHRINKAGE_CHARGE_DATE = chargeDateInput.value;
          };
          panel.appendChild(chargeDateInput);

          panel.appendChild(el("div", "drink-price", "จำนวนที่จะเก็บจากพนักงาน (บาท)"));
          const empChargeInput = document.createElement("input");
          empChargeInput.type = "number";
          empChargeInput.min = "0";
          empChargeInput.className = "step-qty-input";
          empChargeInput.style.width = "140px";
          empChargeInput.value = SHRINKAGE_CHARGE_EMPLOYEE_AMOUNT;
          empChargeInput.placeholder = "ค่าเริ่มต้น = จำนวนเดียวกับด้านบน";
          empChargeInput.oninput = () => {
            SHRINKAGE_CHARGE_EMPLOYEE_AMOUNT = empChargeInput.value;
          };
          panel.appendChild(empChargeInput);

          panel.appendChild(el("div", "section-label", "พนักงานที่รับผิดชอบของหาย (เลือกได้หลายคน ถ้ารับผิดชอบร่วมกัน)"));
          const respGrid = el("div", "staff-grid");
          for (const name of activeStaffNames()) {
            const isSelected = SHRINKAGE_CHARGE_RESPONSIBLE_LIST.includes(name);
            const b = el("button", "staff-btn" + (isSelected ? " selected" : ""), name);
            b.onclick = () => {
              SHRINKAGE_CHARGE_RESPONSIBLE_LIST = isSelected
                ? SHRINKAGE_CHARGE_RESPONSIBLE_LIST.filter((n) => n !== name)
                : [...SHRINKAGE_CHARGE_RESPONSIBLE_LIST, name];
              renderStockReconciliationListInto(container);
            };
            respGrid.appendChild(b);
          }
          panel.appendChild(respGrid);
          if (SHRINKAGE_CHARGE_RESPONSIBLE_LIST.length > 1) {
            const perPersonHint = Number(SHRINKAGE_CHARGE_EMPLOYEE_AMOUNT || SHRINKAGE_CHARGE_AMOUNT || 0) / SHRINKAGE_CHARGE_RESPONSIBLE_LIST.length;
            panel.appendChild(
              el(
                "div",
                "round-meta",
                `รับผิดชอบร่วมกัน ${SHRINKAGE_CHARGE_RESPONSIBLE_LIST.length} คน • เฉลี่ยคนละ ฿${money(Math.round(perPersonHint))}`
              )
            );
          }

          panel.appendChild(el("div", "section-label", "พนักงาน/CEO ผู้บันทึกรายการนี้"));
          const recGrid = el("div", "staff-grid");
          for (const name of activeStaffNames()) {
            const b = el("button", "staff-btn" + (SHRINKAGE_CHARGE_RECORDER === name ? " selected" : ""), name);
            b.onclick = () => {
              SHRINKAGE_CHARGE_RECORDER = name;
              renderStockReconciliationListInto(container);
            };
            recGrid.appendChild(b);
          }
          panel.appendChild(recGrid);

          const saveChargeBtn = el("button", "btn-primary", SAVING ? "กำลังบันทึก..." : "✔ บันทึกการเก็บเงิน");
          saveChargeBtn.style.marginTop = "10px";
          saveChargeBtn.onclick = async () => {
            const amount = Number(SHRINKAGE_CHARGE_AMOUNT);
            if (!Number.isFinite(amount) || SHRINKAGE_CHARGE_AMOUNT === "" || amount < 0) {
              toast("กรุณาใส่จำนวนเงินที่จะเก็บให้ถูกต้อง", true);
              return;
            }
            if (!SHRINKAGE_CHARGE_RESPONSIBLE_LIST.length) {
              toast("กรุณาเลือกพนักงานที่รับผิดชอบอย่างน้อย 1 คน", true);
              return;
            }
            if (!SHRINKAGE_CHARGE_RECORDER) {
              toast("กรุณาเลือกพนักงาน/CEO ผู้บันทึกรายการนี้", true);
              return;
            }
            const employeeChargeRaw = SHRINKAGE_CHARGE_EMPLOYEE_AMOUNT === "" ? amount : Number(SHRINKAGE_CHARGE_EMPLOYEE_AMOUNT);
            if (!Number.isFinite(employeeChargeRaw) || employeeChargeRaw < 0) {
              toast("จำนวนที่จะเก็บจากพนักงานไม่ถูกต้อง", true);
              return;
            }
            // ถ้าเป็นรายการ 0 บาท (ยกเว้นไม่คิดเงิน) ต้องส่ง qty ไปด้วย ไม่งั้นยอด "ยังไม่มีคนรับผิดชอบ" จะไม่ลดเลย
            // คำนวณจากของหายทั้งหมดของเครื่องดื่มนี้ในช่วงนี้ ลบด้วยที่เก็บเงิน/ยกเว้นไปแล้วก่อนหน้า = ยอดคงเหลือที่รายการนี้จะเคลียร์
            let chargeWaivedQty;
            if (amount === 0) {
              const priceNow = Number(d.price || 0);
              const paidQtySoFar =
                priceNow > 0 ? chargesForDrinkInPeriod.reduce((s, c) => s + Number(c.chargeAmount || 0), 0) / priceNow : 0;
              const waivedQtySoFar = chargesForDrinkInPeriod.reduce(
                (s, c) => s + (Number(c.chargeAmount || 0) === 0 && typeof c.qty === "number" && c.qty > 0 ? c.qty : 0),
                0
              );
              chargeWaivedQty = Math.max(0, r.shrinkageQty - paidQtySoFar - waivedQtySoFar);
            }
            SAVING = true;
            render();
            try {
              STATE = await apiSaveShrinkageCharge({
                drinkId: d.id,
                drinkName: d.name,
                periodLabel: r.label,
                chargeAmount: amount,
                employees: SHRINKAGE_CHARGE_RESPONSIBLE_LIST,
                employeeCharge: employeeChargeRaw,
                recordedBy: SHRINKAGE_CHARGE_RECORDER,
                chargeDate: SHRINKAGE_CHARGE_DATE || new Date(Date.now() + THAILAND_OFFSET_MS).toISOString().slice(0, 10),
                qty: chargeWaivedQty,
              });
              SHRINKAGE_CHARGE_SHOW = null;
              SHRINKAGE_CHARGE_RESPONSIBLE_LIST = [];
              toast("บันทึกการเก็บเงินสต็อกหายเรียบร้อย");
            } catch (e) {
              toast(e.message, true);
            }
            SAVING = false;
            render();
          };
          panel.appendChild(saveChargeBtn);
          card.appendChild(panel);
        }

        if (chargesForDrinkInPeriod.length) {
          const logWrap = el("div", null);
          logWrap.style.marginTop = "8px";
          for (const c of chargesForDrinkInPeriod) {
            const chargeDateLabel = c.chargeDate ? fmtDateOnly(`${c.chargeDate}T12:00:00+07:00`) : fmtDateOnly(c.timestamp);
            const backdateNote =
              c.chargeDate && dayKeyOf(c.timestamp) !== c.chargeDate
                ? ` (ลงย้อนหลัง บันทึกจริงเมื่อ ${fmtDateTime(c.timestamp)})`
                : "";
            const logRow = el("div", null);
            logRow.style.cssText = "display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;margin-bottom:4px;";
            const isWaived = Number(c.chargeAmount || 0) === 0;
            const logText = el(
              "span",
              "round-meta",
              isWaived
                ? `🚫 ${c.recordedBy} ยกเว้นไม่คิดเงิน (รับผิดชอบ: ${(c.employees || (c.employee ? [c.employee] : [])).join(", ")}) • บันทึกเมื่อ ${chargeDateLabel}${backdateNote}`
                : `💰 ${c.recordedBy} เก็บเงิน ฿${money(c.chargeAmount)} (เก็บจาก ${(c.employees || (c.employee ? [c.employee] : [])).join(", ")} รวม ฿${money(c.employeeCharge)}) • เก็บเมื่อ ${chargeDateLabel}${backdateNote}`
            );
            logRow.appendChild(logText);
            const delChargeBtn = el("button", "collapse-toggle", "🗑");
            delChargeBtn.title = "ลบรายการนี้ (เช่น บันทึกซ้ำ)";
            delChargeBtn.style.cssText = "padding:2px 10px;font-size:14px;flex-shrink:0;";
            delChargeBtn.onclick = async () => {
              if (!window.confirm("ลบรายการนี้ถาวรใช่ไหม? ยอด \"ยังไม่มีคนรับผิดชอบ\" จะกลับมานับใหม่ตามเดิม")) return;
              SAVING = true;
              render();
              try {
                STATE = await apiDeleteShrinkageCharge(c.id);
                toast("ลบรายการเรียบร้อย");
              } catch (e) {
                toast(e.message, true);
              }
              SAVING = false;
              render();
            };
            logRow.appendChild(delChargeBtn);
            logWrap.appendChild(logRow);
          }
          card.appendChild(logWrap);
        }
      }
    }

    container.appendChild(card);
  }
}

function renderStock() {
  const top = el("div", "topbar");
  const back = el("button", "back-btn", "←");
  back.onclick = goHome;
  top.appendChild(back);
  top.appendChild(el("h1", null, "📦 จัดการสต็อกเครื่องดื่ม"));
  APP.appendChild(top);

  // ย้ายปุ่ม "สรุปเติม/ใช้สต็อก" ไปอยู่ใน เมนู CEO แทน (พนักงานไม่ควรเห็น/เข้าหน้านี้ได้จากตรงนี้อีกต่อไป)

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

function renderStockHistoryEntryDetail(item, h) {
  // เรนเดอร์รายละเอียดประวัติการนับสต็อก 1 ครั้ง แยกทีละรายการเครื่องดื่ม พร้อมปุ่มแก้ไข/ลบ (ใช้เฉพาะหน้าสต็อกกลาง)
for (const c of h.changes || []) {
  const from = c.from !== undefined ? c.from : c.before;
  const to = c.to !== undefined ? c.to : c.after;
  const cRow = el("div", "round-items");
  cRow.style.cssText = "display:flex;align-items:center;gap:8px;flex-wrap:wrap;justify-content:space-between;";
  const label = el(
    "span",
    null,
    `${c.name} ${from}→${to}` +
      (c.corrected ? ` (แก้ไขแล้ว จากเดิม ${c.originalFrom}→${c.originalTo} โดย ${c.correctedBy})` : "") +
      (c.deleted ? ` (ลบแล้ว โดย ${c.deletedBy} — กดผิด SKU)` : "")
  );
  if (c.deleted) label.style.cssText = "text-decoration:line-through;color:#8a8a8a;";
  cRow.appendChild(label);

  if (c.deleted) {
    item.appendChild(cRow);
    continue;
  }

  const isEditingThis =
    STOCK_HISTORY_EDIT && STOCK_HISTORY_EDIT.historyId === h.id && STOCK_HISTORY_EDIT.drinkId === c.id;
  const isDeletingThis =
    STOCK_HISTORY_DELETE && STOCK_HISTORY_DELETE.historyId === h.id && STOCK_HISTORY_DELETE.drinkId === c.id;
  const btnGroup = el("div", null);
  btnGroup.style.cssText = "display:flex;gap:6px;";
  const editBtn = el("button", "collapse-toggle", isEditingThis ? "ยกเลิก" : "แก้ไข");
  editBtn.style.marginBottom = "0";
  editBtn.onclick = () => {
    if (isEditingThis) {
      STOCK_HISTORY_EDIT = null;
    } else {
      STOCK_HISTORY_EDIT = { historyId: h.id, drinkId: c.id };
      STOCK_HISTORY_EDIT_VALUE = String(to);
      STOCK_HISTORY_EDIT_EMPLOYEE = null;
      STOCK_HISTORY_DELETE = null;
    }
    render();
  };
  btnGroup.appendChild(editBtn);

  const deleteBtn = el("button", "collapse-toggle", isDeletingThis ? "ยกเลิก" : "ลบ (กดผิด SKU)");
  deleteBtn.style.cssText = "margin-bottom:0;color:#B4432E;";
  deleteBtn.onclick = () => {
    if (isDeletingThis) {
      STOCK_HISTORY_DELETE = null;
    } else {
      STOCK_HISTORY_DELETE = { historyId: h.id, drinkId: c.id };
      STOCK_HISTORY_DELETE_EMPLOYEE = null;
      STOCK_HISTORY_EDIT = null;
    }
    render();
  };
  btnGroup.appendChild(deleteBtn);
  cRow.appendChild(btnGroup);
  item.appendChild(cRow);

  if (isDeletingThis) {
    const deletePanel = el("div", "card");
    deletePanel.style.cssText = "margin:6px 0;padding:10px;background:var(--cream-2);";
    deletePanel.appendChild(
      el("div", "round-meta", `ลบรายการนี้ทิ้ง (${c.name} ${from}→${to}) เพราะกดผิด SKU — ระบบจะปรับสต็อกปัจจุบันของ ${c.name} กลับคืนให้อัตโนมัติ`)
    );
    deletePanel.appendChild(el("div", "section-label", "พนักงานผู้ลบ"));
    const deleteStaffGrid = el("div", "staff-grid");
    for (const name of activeStaffNames()) {
      const b = el("button", "staff-btn" + (STOCK_HISTORY_DELETE_EMPLOYEE === name ? " selected" : ""), name);
      b.onclick = () => {
        STOCK_HISTORY_DELETE_EMPLOYEE = name;
        render();
      };
      deleteStaffGrid.appendChild(b);
    }
    deletePanel.appendChild(deleteStaffGrid);

    const confirmDeleteBtn = el("button", "btn-primary", SAVING ? "กำลังบันทึก..." : "🗑 ยืนยันลบรายการนี้");
    confirmDeleteBtn.style.cssText = "margin-top:10px;background:#B4432E;";
    confirmDeleteBtn.onclick = async () => {
      if (!STOCK_HISTORY_DELETE_EMPLOYEE) {
        toast("กรุณาเลือกพนักงานผู้ลบ", true);
        return;
      }
      if (!confirmPermanentDelete(`ลบรายการนี้ทิ้งจริงหรือไม่? (${c.name} ${from}→${to})`)) return;
      SAVING = true;
      render();
      try {
        STATE = await apiDeleteStockHistoryChange(h.id, c.id, STOCK_HISTORY_DELETE_EMPLOYEE);
        STOCK_HISTORY_DELETE = null;
        toast("ลบรายการเรียบร้อย");
      } catch (e) {
        toast(e.message, true);
      }
      SAVING = false;
      render();
    };
    deletePanel.appendChild(confirmDeleteBtn);
    item.appendChild(deletePanel);
  }

  if (isEditingThis) {
    const editPanel = el("div", "card");
    editPanel.style.cssText = "margin:6px 0;padding:10px;background:var(--cream-2);";
    editPanel.appendChild(
      el("div", "round-meta", `จำนวนที่นับ/เติมไว้เดิม: ${to} — ถ้านับ/เติมผิด ให้ใส่จำนวนที่ถูกต้องแทน`)
    );
    const numInput = document.createElement("input");
    numInput.type = "number";
    numInput.className = "step-qty-input";
    numInput.style.width = "120px";
    numInput.value = STOCK_HISTORY_EDIT_VALUE;
    numInput.oninput = () => {
      STOCK_HISTORY_EDIT_VALUE = numInput.value;
    };
    editPanel.appendChild(numInput);

    editPanel.appendChild(el("div", "section-label", "พนักงานผู้แก้ไข"));
    const editStaffGrid = el("div", "staff-grid");
    for (const name of activeStaffNames()) {
      const b = el("button", "staff-btn" + (STOCK_HISTORY_EDIT_EMPLOYEE === name ? " selected" : ""), name);
      b.onclick = () => {
        STOCK_HISTORY_EDIT_EMPLOYEE = name;
        render();
      };
      editStaffGrid.appendChild(b);
    }
    editPanel.appendChild(editStaffGrid);

    const confirmEditBtn = el("button", "btn-primary", SAVING ? "กำลังบันทึก..." : "✔ ยืนยันแก้ไข");
    confirmEditBtn.style.marginTop = "10px";
    confirmEditBtn.onclick = async () => {
      if (!STOCK_HISTORY_EDIT_EMPLOYEE) {
        toast("กรุณาเลือกพนักงานผู้แก้ไข", true);
        return;
      }
      const newTo = Number(STOCK_HISTORY_EDIT_VALUE);
      if (!Number.isFinite(newTo) || STOCK_HISTORY_EDIT_VALUE === "") {
        toast("กรุณาใส่จำนวนที่ถูกต้อง", true);
        return;
      }
      SAVING = true;
      render();
      try {
        STATE = await apiEditStockHistory(h.id, c.id, newTo, STOCK_HISTORY_EDIT_EMPLOYEE);
        STOCK_HISTORY_EDIT = null;
        toast("แก้ไขประวัติสต็อกเรียบร้อย");
      } catch (e) {
        toast(e.message, true);
      }
      SAVING = false;
      render();
    };
    editPanel.appendChild(confirmEditBtn);
    item.appendChild(editPanel);
  }
}
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

  if (!VIEW[flagKey]) return;

  if (kind !== "stock") {
    // ประวัติสต็อกห้อง/โต๊ะ: แสดงแบบเดิม (รายการเรียงตามเวลา ไม่กรอง ไม่จัดกลุ่มรายวัน)
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
    return;
  }

  // ---------- หน้าสต็อกกลาง: เพิ่มตัวกรองวันที่ + จัดกลุ่มเป็นรายวัน (กางดูได้) ให้ดูง่ายกว่ารายการยาวๆ รวมกันแบบเดิม ----------
  APP.appendChild(el("div", "section-label", "กรองตามช่วงวันที่"));
  const filterRow = el("div", null);
  filterRow.style.cssText = "display:flex;gap:10px;align-items:center;margin-bottom:10px;flex-wrap:wrap;";

  const fromField = el("div", null);
  fromField.style.cssText = "display:flex;flex-direction:column;gap:4px;";
  fromField.appendChild(el("div", "round-meta", "จากวันที่"));
  const fromInput = document.createElement("input");
  fromInput.type = "date";
  fromInput.className = "stock-input";
  fromInput.style.width = "150px";
  fromInput.value = STOCK_HISTORY_FROM;
  fromInput.onchange = () => {
    STOCK_HISTORY_FROM = fromInput.value;
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
  toInput.value = STOCK_HISTORY_TO;
  toInput.onchange = () => {
    STOCK_HISTORY_TO = toInput.value;
    render();
  };
  toField.appendChild(toInput);
  filterRow.appendChild(toField);

  if (STOCK_HISTORY_FROM || STOCK_HISTORY_TO) {
    const clearFilterBtn = el("button", "collapse-toggle", "✕ ล้างตัวกรอง");
    clearFilterBtn.onclick = () => {
      STOCK_HISTORY_FROM = "";
      STOCK_HISTORY_TO = "";
      render();
    };
    filterRow.appendChild(clearFilterBtn);
  }
  APP.appendChild(filterRow);

  const filtered = history.filter((h) => {
    const dk = dayKeyOf(h.timestamp || h.at);
    if (STOCK_HISTORY_FROM && dk < STOCK_HISTORY_FROM) return false;
    if (STOCK_HISTORY_TO && dk > STOCK_HISTORY_TO) return false;
    return true;
  });

  if (!filtered.length) {
    APP.appendChild(el("div", "empty-note", "ไม่พบประวัติการนับสต็อกในช่วงวันที่ที่เลือก"));
    return;
  }

  const byDay = new Map();
  for (const h of filtered) {
    const dk = dayKeyOf(h.timestamp || h.at);
    if (!byDay.has(dk)) byDay.set(dk, []);
    byDay.get(dk).push(h);
  }
  const dayKeys = [...byDay.keys()].sort((a, b) => (a < b ? 1 : -1));

  const card = el("div", "card");
  for (const dk of dayKeys) {
    const entries = [...byDay.get(dk)].reverse();
    const totalChanges = entries.reduce((s, h) => s + (h.changes || []).filter((c) => !c.deleted).length, 0);
    const employeesText = [...new Set(entries.map((h) => h.employee))].join(", ");
    const isExpanded = STOCK_HISTORY_DAY_EXPANDED.has(dk);

    const dayHeader = el(
      "button",
      "collapse-toggle",
      `${isExpanded ? "▾" : "▸"} ${fmtDateOnly(entries[0].timestamp || entries[0].at)} • ${totalChanges} รายการ • ${employeesText}`
    );
    dayHeader.style.cssText = "width:100%;text-align:left;margin-bottom:6px;box-sizing:border-box;";
    dayHeader.onclick = () => {
      if (isExpanded) STOCK_HISTORY_DAY_EXPANDED.delete(dk);
      else STOCK_HISTORY_DAY_EXPANDED.add(dk);
      render();
    };
    card.appendChild(dayHeader);

    if (isExpanded) {
      for (const h of entries) {
        const item = el("div", "round-item");
        const topRow = el("div", "round-top");
        topRow.appendChild(el("span", null, h.employee));
        topRow.appendChild(el("span", null, fmtDateTime(h.timestamp || h.at)));
        item.appendChild(topRow);
        renderStockHistoryEntryDetail(item, h);
        card.appendChild(item);
      }
    }
  }
  APP.appendChild(card);
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

// รวมยอดของแต่ละเครื่องดื่ม ข้ามทุกห้อง/โต๊ะเข้าด้วยกัน (เช่น น้ำดื่มทั้งหมด 5 ขวด ไม่ว่าจะกระจายอยู่ห้องไหนบ้าง)
// ใช้แสดงเป็นการ์ดสรุปด้านบนสุดของหน้านี้ กันต้องไปไล่บวกเองทีละห้อง
function collectRoomOverviewTotals(query) {
  const totals = new Map(); // drinkId -> { d, qty }
  for (const loc of LOCATIONS) {
    const roomStock = (STATE.roomStock && STATE.roomStock[loc.id]) || {};
    for (const [id, qty] of Object.entries(roomStock)) {
      const q = Number(qty) || 0;
      if (q <= 0) continue;
      const d = drinkById(id);
      if (!d) continue;
      if (query && !d.name.toLowerCase().includes(query)) continue;
      if (!totals.has(id)) totals.set(id, { d, qty: 0 });
      totals.get(id).qty += q;
    }
  }
  return [...totals.values()].sort((a, b) => a.d.name.localeCompare(b.d.name, "th"));
}

function renderRoomOverviewListInto(container) {
  container.innerHTML = "";
  const query = ROOM_OVERVIEW_SEARCH.trim().toLowerCase();

  const totals = collectRoomOverviewTotals(query);
  const totalsCard = el("div", "card");
  totalsCard.style.cssText = "border:2px solid var(--yellow);";
  totalsCard.appendChild(el("div", "round-top", "📊 รวมทุกห้อง (ทุกที่ที่วางไว้บวกกัน)"));
  if (!totals.length) {
    totalsCard.appendChild(el("div", "empty-note", "ยังไม่มีของวางไว้ในห้องไหนเลย"));
  } else {
    const totalsGrid = el("div", "stock-grid");
    for (const x of totals) {
      const row = el("div", "stock-row");
      row.appendChild(drinkVisualEl(x.d));
      const info = el("div", "drink-info");
      info.appendChild(el("div", "drink-name", x.d.name));
      if (x.d.unit) info.appendChild(el("div", "drink-price", x.d.unit));
      row.appendChild(info);
      row.appendChild(el("div", "room-overview-qty", String(x.qty)));
      totalsGrid.appendChild(row);
    }
    totalsCard.appendChild(totalsGrid);
  }
  container.appendChild(totalsCard);

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

  const costLinkBtn = el("button", "collapse-toggle", "💰 ตั้งต้นทุน/ดูกำไร (CEO) — ไปหน้าต้นทุนสินค้า");
  costLinkBtn.style.cssText = "margin-bottom:10px;";
  costLinkBtn.onclick = () => {
    goMenuCost();
  };
  bodyWrap.appendChild(costLinkBtn);

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
  if (!MENU_ADD_DRAFT) {
    MENU_ADD_DRAFT = {
      name: "",
      price: 0,
      cost: 0,
      unit: "ขวด",
      category: "",
      icon: "softDrink",
      trackStock: true,
      allowFree: false,
      image: null,
    };
  }
  const draft = MENU_ADD_DRAFT;

  const card = el("div", "card");
  card.appendChild(el("div", "section-label", "เพิ่มเครื่องดื่มใหม่"));

  const nameInput = document.createElement("input");
  nameInput.className = "stock-input";
  nameInput.placeholder = "ชื่อเครื่องดื่ม";
  nameInput.value = draft.name;
  nameInput.oninput = () => {
    draft.name = nameInput.value;
  };
  card.appendChild(labeledField("ชื่อ", nameInput));

  const priceInput = document.createElement("input");
  priceInput.type = "number";
  priceInput.className = "stock-input";
  priceInput.value = draft.price || "";
  priceInput.oninput = () => {
    draft.price = Number(priceInput.value) || 0;
  };
  card.appendChild(labeledField("ราคา", priceInput));

  const costLinkBtn2 = el("button", "collapse-toggle", "💰 ตั้งต้นทุน/ดูกำไร (CEO) — ไปหน้าต้นทุนสินค้า (ตั้งได้หลังเพิ่มเครื่องดื่มนี้เสร็จแล้ว)");
  costLinkBtn2.style.cssText = "margin-bottom:10px;";
  costLinkBtn2.onclick = () => {
    goMenuCost();
  };
  card.appendChild(costLinkBtn2);

  const unitInput = document.createElement("input");
  unitInput.className = "stock-input";
  unitInput.value = draft.unit || "ขวด";
  unitInput.oninput = () => {
    draft.unit = unitInput.value;
  };
  card.appendChild(labeledField("หน่วยนับ", unitInput));

  const catInput = document.createElement("input");
  catInput.className = "stock-input";
  catInput.placeholder = "เช่น เบียร์, เหล้า/สุรา, น้ำอัดลม/เครื่องดื่ม";
  catInput.value = draft.category || "";
  catInput.oninput = () => {
    draft.category = catInput.value;
  };
  card.appendChild(labeledField("หมวดหมู่", catInput));

  card.appendChild(el("div", "drink-price", "ไอคอน (ใช้ถ้ายังไม่มีรูปถ่าย)"));
  const iconGrid = el("div", null);
  iconGrid.style.cssText = "display:flex;flex-wrap:wrap;gap:8px;margin-bottom:10px;";
  const iconButtons = [];
  for (const key of Object.keys(ICONS)) {
    const b = document.createElement("button");
    b.type = "button";
    b.style.cssText =
      "border:2px solid " +
      (key === draft.icon ? "var(--yellow)" : "var(--border)") +
      ";border-radius:10px;padding:4px;background:#fff;cursor:pointer;";
    b.innerHTML = ICONS[key];
    b.onclick = () => {
      draft.icon = key;
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
  trackCb.checked = draft.trackStock;
  trackCb.onchange = () => {
    draft.trackStock = trackCb.checked;
  };
  trackWrap.appendChild(trackCb);
  trackWrap.appendChild(el("label", null, "นับสต็อก (ของร้านเอง)"));
  card.appendChild(trackWrap);

  const freeWrap = el("div", "free-toggle");
  const freeCb = document.createElement("input");
  freeCb.type = "checkbox";
  freeCb.checked = draft.allowFree;
  freeCb.onchange = () => {
    draft.allowFree = freeCb.checked;
  };
  freeWrap.appendChild(freeCb);
  freeWrap.appendChild(el("label", null, "ให้กดฟรีได้ (สำหรับของนำเข้าเอง)"));
  card.appendChild(freeWrap);

  card.appendChild(el("div", "drink-price", "หรืออัปโหลดรูปถ่ายจริงแทนไอคอน (ไม่บังคับ)"));
  if (draft.image) {
    const preview = document.createElement("img");
    preview.src = draft.image;
    preview.style.cssText = "max-width:120px;max-height:120px;border-radius:8px;display:block;margin-bottom:6px;";
    card.appendChild(preview);
  }
  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = "image/*";
  fileInput.onchange = async () => {
    const file = fileInput.files && fileInput.files[0];
    if (!file) return;
    try {
      draft.image = await resizeImageFile(file);
      toast("อัปโหลดรูปแล้ว (จะบันทึกตอนกดเพิ่มเครื่องดื่ม)");
      render();
    } catch (e) {
      toast(e.message, true);
    }
  };
  card.appendChild(fileInput);

  const addBtn = el("button", "btn-primary", "เพิ่มเครื่องดื่ม");
  addBtn.style.marginTop = "12px";
  addBtn.onclick = async () => {
    if (!draft.name.trim()) {
      toast("กรุณาใส่ชื่อเครื่องดื่ม", true);
      return;
    }
    try {
      STATE = await apiMenuAction({
        action: "add",
        name: draft.name,
        price: Number(draft.price) || 0,
        unit: draft.unit || "ขวด",
        category: draft.category || "อื่นๆ",
        icon: draft.icon,
        trackStock: draft.trackStock,
        allowFree: draft.allowFree,
        image: draft.image || undefined,
      });
      MENU_SHOW_ADD = false;
      MENU_ADD_DRAFT = null;
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
  back.onclick = goCeoMenu;
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

  // ---------- เปลี่ยนรหัสผ่าน CEO / พนักงาน ----------
  if (!PIN_CHANGE_DRAFT) {
    PIN_CHANGE_DRAFT = { ceoPinNew: "", ceoPinConfirm: "", staffPinNew: "", staffPinConfirm: "" };
  }
  const pinCard = el("div", "card");
  pinCard.style.marginTop = "14px";
  pinCard.appendChild(el("div", "round-top", "🔑 เปลี่ยนรหัสผ่าน"));
  pinCard.appendChild(
    el("div", "round-meta", "เปลี่ยนได้ตลอด มีผลกับทุกเครื่อง/ทุกคนทันที (คนที่เคยปลดล็อกไว้แล้วไม่ต้องใส่ใหม่ จนกว่าจะล้างข้อมูลเบราว์เซอร์)")
  );

  // CEO PIN
  const ceoPinWrap = el("div", null);
  ceoPinWrap.style.cssText = "margin-top:10px;padding-top:10px;border-top:1px dashed var(--border);";
  ceoPinWrap.appendChild(el("div", "drink-price", `รหัสผ่าน CEO ปัจจุบัน: ${SETTINGS.ceoPin || CEO_PIN}`));
  const ceoRow = el("div", null);
  ceoRow.style.cssText = "display:flex;gap:10px;flex-wrap:wrap;margin-top:6px;align-items:flex-end;";
  const ceoNewWrap = el("div", null);
  ceoNewWrap.appendChild(el("div", "drink-price", "รหัสใหม่ (อย่างน้อย 4 ตัว)"));
  const ceoNewInput = document.createElement("input");
  ceoNewInput.type = "text";
  ceoNewInput.inputMode = "numeric";
  ceoNewInput.className = "stock-input";
  ceoNewInput.style.width = "140px";
  ceoNewInput.value = PIN_CHANGE_DRAFT.ceoPinNew;
  ceoNewInput.oninput = () => {
    PIN_CHANGE_DRAFT.ceoPinNew = ceoNewInput.value;
  };
  ceoNewWrap.appendChild(ceoNewInput);
  ceoRow.appendChild(ceoNewWrap);
  const ceoConfirmWrap = el("div", null);
  ceoConfirmWrap.appendChild(el("div", "drink-price", "ยืนยันรหัสใหม่"));
  const ceoConfirmInput = document.createElement("input");
  ceoConfirmInput.type = "text";
  ceoConfirmInput.inputMode = "numeric";
  ceoConfirmInput.className = "stock-input";
  ceoConfirmInput.style.width = "140px";
  ceoConfirmInput.value = PIN_CHANGE_DRAFT.ceoPinConfirm;
  ceoConfirmInput.oninput = () => {
    PIN_CHANGE_DRAFT.ceoPinConfirm = ceoConfirmInput.value;
  };
  ceoConfirmWrap.appendChild(ceoConfirmInput);
  ceoRow.appendChild(ceoConfirmWrap);
  const ceoSaveBtn = el("button", "btn-primary", "บันทึกรหัส CEO ใหม่");
  ceoSaveBtn.onclick = async () => {
    const a = String(PIN_CHANGE_DRAFT.ceoPinNew || "").trim();
    const b = String(PIN_CHANGE_DRAFT.ceoPinConfirm || "").trim();
    if (a.length < 4) {
      toast("รหัสผ่าน CEO ต้องมีอย่างน้อย 4 ตัวอักษร", true);
      return;
    }
    if (a !== b) {
      toast("รหัสใหม่กับที่ยืนยันไม่ตรงกัน", true);
      return;
    }
    try {
      STATE = await apiSaveSettings({ ceoPin: a });
      PIN_CHANGE_DRAFT.ceoPinNew = "";
      PIN_CHANGE_DRAFT.ceoPinConfirm = "";
      toast("เปลี่ยนรหัสผ่าน CEO เรียบร้อย");
      render();
    } catch (e) {
      toast(e.message, true);
    }
  };
  ceoRow.appendChild(ceoSaveBtn);
  ceoPinWrap.appendChild(ceoRow);
  pinCard.appendChild(ceoPinWrap);

  // Staff PIN
  const staffPinWrap = el("div", null);
  staffPinWrap.style.cssText = "margin-top:10px;padding-top:10px;border-top:1px dashed var(--border);";
  staffPinWrap.appendChild(el("div", "drink-price", `รหัสผ่านพนักงานปัจจุบัน: ${SETTINGS.staffPin || STAFF_PIN}`));
  const staffRow = el("div", null);
  staffRow.style.cssText = "display:flex;gap:10px;flex-wrap:wrap;margin-top:6px;align-items:flex-end;";
  const staffNewWrap = el("div", null);
  staffNewWrap.appendChild(el("div", "drink-price", "รหัสใหม่ (อย่างน้อย 4 ตัว)"));
  const staffNewInput = document.createElement("input");
  staffNewInput.type = "text";
  staffNewInput.inputMode = "numeric";
  staffNewInput.className = "stock-input";
  staffNewInput.style.width = "140px";
  staffNewInput.value = PIN_CHANGE_DRAFT.staffPinNew;
  staffNewInput.oninput = () => {
    PIN_CHANGE_DRAFT.staffPinNew = staffNewInput.value;
  };
  staffNewWrap.appendChild(staffNewInput);
  staffRow.appendChild(staffNewWrap);
  const staffConfirmWrap = el("div", null);
  staffConfirmWrap.appendChild(el("div", "drink-price", "ยืนยันรหัสใหม่"));
  const staffConfirmInput = document.createElement("input");
  staffConfirmInput.type = "text";
  staffConfirmInput.inputMode = "numeric";
  staffConfirmInput.className = "stock-input";
  staffConfirmInput.style.width = "140px";
  staffConfirmInput.value = PIN_CHANGE_DRAFT.staffPinConfirm;
  staffConfirmInput.oninput = () => {
    PIN_CHANGE_DRAFT.staffPinConfirm = staffConfirmInput.value;
  };
  staffConfirmWrap.appendChild(staffConfirmInput);
  staffRow.appendChild(staffConfirmWrap);
  const staffSaveBtn = el("button", "btn-primary", "บันทึกรหัสพนักงานใหม่");
  staffSaveBtn.onclick = async () => {
    const a = String(PIN_CHANGE_DRAFT.staffPinNew || "").trim();
    const b = String(PIN_CHANGE_DRAFT.staffPinConfirm || "").trim();
    if (a.length < 4) {
      toast("รหัสผ่านพนักงานต้องมีอย่างน้อย 4 ตัวอักษร", true);
      return;
    }
    if (a !== b) {
      toast("รหัสใหม่กับที่ยืนยันไม่ตรงกัน", true);
      return;
    }
    try {
      STATE = await apiSaveSettings({ staffPin: a });
      PIN_CHANGE_DRAFT.staffPinNew = "";
      PIN_CHANGE_DRAFT.staffPinConfirm = "";
      toast("เปลี่ยนรหัสผ่านพนักงานเรียบร้อย");
      render();
    } catch (e) {
      toast(e.message, true);
    }
  };
  staffRow.appendChild(staffSaveBtn);
  staffPinWrap.appendChild(staffRow);
  pinCard.appendChild(staffPinWrap);

  APP.appendChild(pinCard);
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
