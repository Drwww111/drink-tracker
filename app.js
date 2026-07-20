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
let DRAFT = null; // { locationId, employee, items: {drinkId:{qty,free}}, emptyCounts: {drinkId:qty}, showEmpty:false }
let ROOM_DRAFT = {}; // { drinkId: qty } กำลังแก้ไขสต็อกในห้องปัจจุบัน
let ROOM_EMPLOYEE = null;
let ROOM_USE_DRAFT = {}; // { drinkId: qty } จำนวนที่กำลัง "ใช้ไป" จากของที่วางไว้ในห้อง (ยังไม่บันทึก)
let ROOM_USE_EMPLOYEE = null;
let STOCK_DRAFT = {}; // { drinkId: qty } กำลังแก้ไขสต็อกกลางของร้าน
let STOCK_EMPLOYEE = null;
let BILL_HISTORY_MODE = "daily"; // "daily" | "monthly"
let BILL_HISTORY_EXPANDED = new Set(); // keys (dayKey/monthKey) ที่กางดูรายละเอียดอยู่
let KARAOKE_SHOW = false;
let KARAOKE_START = "";
let KARAOKE_END = "";
let KARAOKE_EMPLOYEE = null;
let KARAOKE_HISTORY_EXPANDED = new Set(); // locationId ที่กางดูรายละเอียดค่าคาราโอเกะอยู่
let CLOSE_BILL_EMPLOYEE = null; // พนักงานผู้ปิดบิล (เลือกก่อนกดปิดบิล)
let HOME_SEARCH = ""; // คำค้นหาห้อง/โต๊ะที่หน้าแรก
let DRINK_SEARCH = ""; // คำค้นหาเครื่องดื่มในหน้าเพิ่ม/แก้ไขรายการ
let MENU_EDIT_ID = null; // id ของเครื่องดื่มที่กำลังแก้ไขอยู่ในหน้าจัดการเมนู
let MENU_EDIT_DRAFT = {};
let MENU_SHOW_ADD = false;
let STAFF_EDIT_ID = null; // id ของพนักงานที่กำลังแก้ไขอยู่ในหน้าจัดการพนักงาน
let LOADING = false;
let SAVING = false;

// ---------- API helpers ----------
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
  const res = await fetch("/api/state");
  if (!res.ok) throw new Error(await readErrorMessage(res, "โหลดข้อมูลไม่สำเร็จ"));
  return res.json();
}

async function apiOrder(payload) {
  const res = await fetch("/api/order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await readErrorMessage(res, "บันทึกไม่สำเร็จ"));
  return res.json();
}

async function apiCloseBill(locationId, employee) {
  const res = await fetch("/api/close-bill", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ locationId, employee }),
  });
  if (!res.ok) throw new Error(await readErrorMessage(res, "ปิดบิลไม่สำเร็จ"));
  return res.json();
}

async function apiSaveStock(employee, items) {
  const res = await fetch("/api/stock", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ employee, items }),
  });
  if (!res.ok) throw new Error(await readErrorMessage(res, "บันทึกสต็อกไม่สำเร็จ"));
  return res.json();
}

async function apiDeleteRound(locationId, roundId) {
  const res = await fetch("/api/delete-round", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ locationId, roundId }),
  });
  if (!res.ok) throw new Error(await readErrorMessage(res, "ลบรายการไม่สำเร็จ"));
  return res.json();
}

async function apiSetRoomStock(locationId, employee, items) {
  const res = await fetch("/api/room-stock", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ locationId, employee, items }),
  });
  if (!res.ok) throw new Error(await readErrorMessage(res, "บันทึกสต็อกในห้องไม่สำเร็จ"));
  return res.json();
}

async function apiKaraokeSession(locationId, action, extra) {
  const res = await fetch("/api/karaoke-session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ locationId, action, ...(extra || {}) }),
  });
  if (!res.ok) throw new Error(await readErrorMessage(res, "บันทึกเวลาคาราโอเกะไม่สำเร็จ"));
  return res.json();
}

async function apiMenuAction(payload) {
  const res = await fetch("/api/menu", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await readErrorMessage(res, "บันทึกเมนูไม่สำเร็จ"));
  return res.json();
}

async function apiStaffAction(payload) {
  const res = await fetch("/api/staff", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await readErrorMessage(res, "บันทึกพนักงานไม่สำเร็จ"));
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
  const day = d.toLocaleDateString("th-TH", { day: "2-digit", month: "2-digit", year: "2-digit" });
  const time = d.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
  return `${day} • ${time} น.`;
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

function dayKeyOf(iso) {
  return new Date(iso).toISOString().slice(0, 10);
}

function monthKeyOf(iso) {
  return new Date(iso).toISOString().slice(0, 7);
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
        locationId: loc.id,
        locationLabel: loc.label,
        closedAt,
        dayKey: dayKeyOf(closedAt),
        monthKey: monthKeyOf(closedAt),
        total: billTotal(b),
        rounds: b.rounds || [],
      });
    }
  }
  bills.sort((a, b2) => new Date(b2.closedAt) - new Date(a.closedAt));
  return bills;
}

// ---------- ค่าคาราโอเกะ (คิดตามเวลาเริ่ม-เลิก เฉพาะห้องแอร์ 1-3) ----------
const KARAOKE_RATES = { "ห้องแอร์ 1": 180, "ห้องแอร์ 2": 160, "ห้องแอร์ 3": 150 };

function karaokeRateFor(loc) {
  return KARAOKE_RATES[loc.group] || null;
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

function isSyntheticChargeItem(id) {
  return typeof id === "string" && id.startsWith("karaoke_");
}

function collectAllKaraokeCharges() {
  const charges = [];
  for (const loc of LOCATIONS) {
    const locState = STATE.locations[loc.id] || { openBill: null, history: [] };
    const allRounds = [];
    if (locState.openBill && locState.openBill.rounds) allRounds.push(...locState.openBill.rounds);
    for (const b of locState.history || []) {
      if (b.rounds) allRounds.push(...b.rounds);
    }
    for (const r of allRounds) {
      for (const i of r.items || []) {
        if (isSyntheticChargeItem(i.id)) {
          charges.push({
            locationId: loc.id,
            locationLabel: loc.label,
            locationGroup: loc.group,
            employee: r.employee,
            timestamp: r.timestamp,
            name: i.name,
            amount: i.lineTotal != null ? i.lineTotal : i.qty * i.unitPrice,
          });
        }
      }
    }
  }
  charges.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  return charges;
}

function renderKaraokeHistory() {
  const top = el("div", "topbar");
  const back = el("button", "back-btn", "←");
  back.onclick = goHome;
  top.appendChild(back);
  top.appendChild(el("h1", null, "🎤 ประวัติคาราโอเกะ"));
  APP.appendChild(top);

  const charges = collectAllKaraokeCharges();
  const totalAmount = charges.reduce((s, c) => s + c.amount, 0);

  const summaryCard = el("div", "card total-card");
  summaryCard.appendChild(el("div", "label", "ยอดค่าคาราโอเกะรวมทั้งหมด"));
  summaryCard.appendChild(el("div", "amount", `${charges.length} ครั้ง • ฿${money(totalAmount)}`));
  APP.appendChild(summaryCard);

  if (!charges.length) {
    APP.appendChild(el("div", "empty-note", "ยังไม่มีรายการค่าคาราโอเกะ"));
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

// ---------- Load & boot ----------
async function boot() {
  LOADING = true;
  render();
  try {
    STATE = await apiGet();
  } catch (e) {
    STATE = { locations: {}, stock: {}, roomStock: {}, stockHistory: [], roomStockHistory: {}, drinksMenu: [], staffList: [] };
    toast("โหลดข้อมูลไม่สำเร็จ: " + e.message, true);
  }
  LOADING = false;
  render();
}

function goHome() {
  VIEW = { name: "home" };
  DRAFT = null;
  HOME_SEARCH = "";
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
  CLOSE_BILL_EMPLOYEE = null;
  render();
}

function goStock() {
  STOCK_DRAFT = { ...(STATE.stock || {}) };
  STOCK_EMPLOYEE = null;
  VIEW = { name: "stock" };
  render();
}

function goRoomStock(locationId) {
  ROOM_DRAFT = {}; // จำนวนที่จะ "เติมเพิ่ม" รอบนี้ (ไม่ใช่ยอดรวม) เริ่มจาก 0 เสมอ
  ROOM_EMPLOYEE = null;
  VIEW = { name: "room-stock", locationId };
  render();
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

function goBillHistory() {
  VIEW = { name: "bill-history" };
  BILL_HISTORY_EXPANDED = new Set();
  render();
}

function goKaraokeHistory() {
  VIEW = { name: "karaoke-history" };
  KARAOKE_HISTORY_EXPANDED = new Set();
  render();
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
  APP.innerHTML = "";
  const toastRoot = document.createElement("div");
  toastRoot.id = "toast-root";
  APP.appendChild(toastRoot);

  if (LOADING || !STATE) {
    const p = document.createElement("div");
    p.className = "empty-note";
    p.textContent = "กำลังโหลด...";
    APP.appendChild(p);
    return;
  }

  if (VIEW.name === "home") renderHome();
  else if (VIEW.name === "location") renderLocation(VIEW.locationId);
  else if (VIEW.name === "add-round") renderAddRound(VIEW.locationId);
  else if (VIEW.name === "stock") renderStock();
  else if (VIEW.name === "room-stock") renderRoomStock(VIEW.locationId);
  else if (VIEW.name === "menu") renderMenu();
  else if (VIEW.name === "staff-admin") renderStaffPage();
  else if (VIEW.name === "bill-history") renderBillHistory();
  else if (VIEW.name === "karaoke-history") renderKaraokeHistory();
}

// ---------- Home ----------
function renderHome() {
  const top = el("div", "topbar");
  top.appendChild(el("h1", null, "🍹 บันทึกเครื่องดื่ม"));
  const menuBtn = el("button", "icon-btn", "🍺 เมนู");
  menuBtn.onclick = goMenu;
  top.appendChild(menuBtn);
  const staffBtn = el("button", "icon-btn", "🧑\u200d🍳 พนักงาน");
  staffBtn.onclick = goStaffPage;
  top.appendChild(staffBtn);
  const stockBtn = el("button", "icon-btn", "📦 สต็อก");
  stockBtn.onclick = goStock;
  top.appendChild(stockBtn);
  const billHistBtn = el("button", "icon-btn", "🧾 ประวัติบิล");
  billHistBtn.onclick = goBillHistory;
  top.appendChild(billHistBtn);
  const karaokeHistBtn = el("button", "icon-btn", "🎤 ประวัติคาราโอเกะ");
  karaokeHistBtn.onclick = goKaraokeHistory;
  top.appendChild(karaokeHistBtn);
  APP.appendChild(top);

  const searchInput = document.createElement("input");
  searchInput.type = "text";
  searchInput.id = "home-search-input";
  searchInput.placeholder = "🔍 ค้นหาห้อง/โต๊ะ...";
  searchInput.className = "step-qty-input";
  searchInput.style.cssText =
    "width:100%;height:48px;font-size:18px;text-align:left;padding:0 14px;margin-bottom:14px;box-sizing:border-box;";
  searchInput.value = HOME_SEARCH;
  searchInput.oninput = () => {
    const pos = searchInput.selectionStart;
    HOME_SEARCH = searchInput.value;
    render();
    const revived = document.getElementById("home-search-input");
    if (revived) {
      revived.focus();
      if (revived.setSelectionRange) revived.setSelectionRange(pos, pos);
    }
  };
  APP.appendChild(searchInput);

  const query = HOME_SEARCH.trim().toLowerCase();
  const filteredLocations = query ? LOCATIONS.filter((l) => l.label.toLowerCase().includes(query)) : LOCATIONS;

  const groups = [];
  for (const loc of filteredLocations) {
    if (!groups.includes(loc.group)) groups.push(loc.group);
  }

  if (query && !filteredLocations.length) {
    APP.appendChild(el("div", "empty-note", `ไม่พบห้อง/โต๊ะที่ตรงกับ "${HOME_SEARCH}"`));
    return;
  }

  for (const g of groups) {
    APP.appendChild(el("div", "group-title", g));
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
    APP.appendChild(grid);
  }
}

// ---------- Location detail ----------
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

  const addBtn = el("button", "btn-primary", "+ เพิ่มรายการเครื่องดื่ม");
  addBtn.style.marginBottom = "14px";
  addBtn.onclick = () => goAddRound(locationId);
  APP.appendChild(addBtn);

  const karaokeRate = karaokeRateFor(loc);
  if (karaokeRate) {
    const karaokeSession = locState.karaokeSession || null;
    // ถ้ามี session ที่บันทึกไว้ (จากเครื่อง/คนอื่น) และยังไม่ได้แก้ไขอะไรในเครื่องนี้ ให้ดึงมาเติมอัตโนมัติ
    if (karaokeSession && !KARAOKE_START) KARAOKE_START = karaokeSession.startTime;
    if (karaokeSession && !KARAOKE_EMPLOYEE) KARAOKE_EMPLOYEE = karaokeSession.employee;

    const karaokeToggleBtn = el(
      "button",
      "btn-secondary",
      (KARAOKE_SHOW ? "▾ " : "▸ ") +
        `🎤 คิดเงินค่าคาราโอเกะ (฿${karaokeRate}/ชม)` +
        (karaokeSession ? ` • เริ่มไว้ ${karaokeSession.startTime} โดย ${karaokeSession.employee}` : "")
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
        const badge = el(
          "div",
          "round-meta",
          `🎤 กำลังจับเวลาอยู่ ตั้งแต่ ${karaokeSession.startTime} น. โดย ${karaokeSession.employee}`
        );
        badge.style.cssText = "color:var(--brown);font-weight:700;margin-bottom:8px;";
        kCard.appendChild(badge);
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

      const saveStartBtn = el("button", "collapse-toggle", "▶ บันทึกเวลาเริ่ม");
      saveStartBtn.onclick = async () => {
        if (!KARAOKE_START) {
          toast("กรุณาใส่เวลาเริ่มก่อน", true);
          return;
        }
        if (!KARAOKE_EMPLOYEE) {
          toast("กรุณาเลือกพนักงานก่อนบันทึกเวลาเริ่ม", true);
          return;
        }
        SAVING = true;
        render();
        try {
          STATE = await apiKaraokeSession(locationId, "start", { startTime: KARAOKE_START, employee: KARAOKE_EMPLOYEE });
          toast(`บันทึกเวลาเริ่ม ${KARAOKE_START} น. เรียบร้อย`);
        } catch (e) {
          toast(e.message, true);
        }
        SAVING = false;
        render();
      };
      timeRow.appendChild(saveStartBtn);

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
              },
            ],
            timestamp: new Date().toISOString(),
            clearKaraokeSession: true,
          });
          KARAOKE_SHOW = false;
          KARAOKE_START = "";
          KARAOKE_END = "";
          KARAOKE_EMPLOYEE = null;
          toast("บันทึกค่าคาราโอเกะเรียบร้อย");
        } catch (e) {
          toast(e.message, true);
        }
        SAVING = false;
        render();
      };
      kCard.appendChild(saveKaraokeBtn);

      if (karaokeSession) {
        const cancelBtn = el("button", "btn-secondary", "✖ ยกเลิกการจับเวลานี้");
        cancelBtn.style.marginTop = "8px";
        cancelBtn.onclick = async () => {
          if (!confirm("ยกเลิกเวลาเริ่มที่บันทึกไว้ใช่ไหม?")) return;
          SAVING = true;
          render();
          try {
            STATE = await apiKaraokeSession(locationId, "cancel");
            KARAOKE_START = "";
            KARAOKE_END = "";
            KARAOKE_EMPLOYEE = null;
            toast("ยกเลิกเรียบร้อย");
          } catch (e) {
            toast(e.message, true);
          }
          SAVING = false;
          render();
        };
        kCard.appendChild(cancelBtn);
      }

      APP.appendChild(kCard);
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
      const itemsText = r.items
        .map((i) => `${i.name} x${i.qty}${i.free ? " (ฟรี)" : ""}`)
        .join(", ");
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
      const delBtn = el("button", "collapse-toggle", "🗑 ลบรายการนี้");
      delBtn.style.padding = "6px 4px";
      delBtn.style.color = "var(--red)";
      delBtn.onclick = async () => {
        if (!confirm(`ลบรายการนี้ของ ${r.employee} ยอด ฿${money(r.roundTotal)} ใช่ไหม? (สต็อกที่หักไปจะคืนกลับให้อัตโนมัติ)`)) return;
        try {
          STATE = await apiDeleteRound(locationId, r.id);
          toast("ลบรายการเรียบร้อย");
          render();
        } catch (e) {
          toast(e.message, true);
        }
      };
      actionRow.appendChild(delBtn);
      item.appendChild(actionRow);
      card.appendChild(item);
    }
    APP.appendChild(card);

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
      if (!confirm(`ยืนยันปิดบิล ${loc.label} ยอดรวม ฿${money(billTotal(open))} โดย ${CLOSE_BILL_EMPLOYEE} ?`)) return;
      try {
        STATE = await apiCloseBill(locationId, CLOSE_BILL_EMPLOYEE);
        CLOSE_BILL_EMPLOYEE = null;
        toast("ปิดบิลเรียบร้อย");
        render();
      } catch (e) {
        toast(e.message, true);
      }
    };
    APP.appendChild(closeBtn);
  } else {
    APP.appendChild(el("div", "empty-note", "ยังไม่มีรายการในบิลนี้"));
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
    for (const [id, placedQty] of roomStockEntries) {
      const d = drinkById(id);
      if (!d) continue;
      refCard.appendChild(renderRoomUsageRow(d, placedQty));
    }
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
    const btn = el("button", "collapse-toggle", `ดูบิลที่ปิดแล้ว (${locState.history.length})`);
    btn.onclick = () => {
      VIEW = { name: "location", locationId, showHistory: !VIEW.showHistory };
      render();
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
            const itemsText = r.items
              .map((i) => `${i.name} x${i.qty}${i.free ? " (ฟรี)" : ""}`)
              .join(", ");
            rRow.appendChild(el("div", "round-items", itemsText));
            roundsWrap.appendChild(rRow);
          }
          item.appendChild(roundsWrap);
        }

        card.appendChild(item);
      }
      APP.appendChild(card);
    }
  }

  renderStockHistorySection((STATE.roomStockHistory && STATE.roomStockHistory[locationId]) || [], "room");
}

function renderRoomUsageRow(d, placedQty) {
  const usedQty = ROOM_USE_DRAFT[d.id] || 0;
  const remaining = Math.max(0, placedQty - usedQty);

  const wrap = el("div", "drink-row");
  wrap.style.flexWrap = "wrap";
  wrap.appendChild(drinkVisualEl(d));

  const info = el("div", "drink-info");
  info.appendChild(el("div", "drink-name", d.name));
  info.appendChild(el("div", "drink-price", `วางไว้ ${placedQty} ${d.unit}`));
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

  const isDaily = BILL_HISTORY_MODE === "daily";
  const groupsMap = new Map();
  for (const b of bills) {
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
            const itemsText = r.items.map((i) => `${i.name} x${i.qty}${i.free ? " (ฟรี)" : ""}`).join(", ");
            rRow.appendChild(el("div", "round-items", itemsText));
            roundsWrap.appendChild(rRow);
          }
          item.appendChild(roundsWrap);
        }
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
  drinkSearchInput.oninput = () => {
    const pos = drinkSearchInput.selectionStart;
    DRINK_SEARCH = drinkSearchInput.value;
    render();
    const revived = document.getElementById("drink-search-input");
    if (revived) {
      revived.focus();
      if (revived.setSelectionRange) revived.setSelectionRange(pos, pos);
    }
  };
  APP.appendChild(drinkSearchInput);

  const drinkQuery = DRINK_SEARCH.trim().toLowerCase();
  const visibleDrinks = drinkQuery
    ? activeDrinks().filter((d) => d.name.toLowerCase().includes(drinkQuery))
    : activeDrinks();

  const drinkCard = el("div", "card");
  const categories = [];
  for (const d of visibleDrinks) if (!categories.includes(d.category)) categories.push(d.category);

  if (drinkQuery && !visibleDrinks.length) {
    drinkCard.appendChild(el("div", "empty-note", `ไม่พบเครื่องดื่มที่ตรงกับ "${DRINK_SEARCH}"`));
  }

  for (const cat of categories) {
    drinkCard.appendChild(el("div", "category-title", cat));
    for (const d of visibleDrinks.filter((x) => x.category === cat)) {
      drinkCard.appendChild(renderDrinkRow(d));
    }
  }
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
  const totalCard = el("div", "card total-card");
  totalCard.appendChild(el("div", "label", "ยอดรวมรอบนี้"));
  totalCard.appendChild(el("div", "amount", `฿${money(total)}`));
  APP.appendChild(totalCard);

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
      goLocation(locationId);
    } catch (e) {
      SAVING = false;
      toast(e.message, true);
      render();
    }
  };
  APP.appendChild(saveBtn);

  if (isEdit) {
    const cancelBtn = el("button", "btn-secondary", "ยกเลิกการแก้ไข");
    cancelBtn.style.marginTop = "10px";
    cancelBtn.onclick = () => goLocation(locationId);
    APP.appendChild(cancelBtn);
  }
}

function renderDrinkRow(d) {
  const row = el("div", "drink-row");
  row.appendChild(drinkVisualEl(d));

  const info = el("div", "drink-info");
  info.appendChild(el("div", "drink-name", d.name));
  info.appendChild(el("div", "drink-price", `฿${money(d.price)} / ${d.unit}`));
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

  const categories = [];
  for (const d of activeDrinks()) {
    if (!d.trackStock) continue;
    if (!categories.includes(d.category)) categories.push(d.category);
  }

  const card = el("div", "card");
  for (const cat of categories) {
    card.appendChild(el("div", "category-title", cat));
    for (const d of activeDrinks().filter((x) => x.category === cat && x.trackStock)) {
      card.appendChild(renderStockDraftRow(d));
    }
  }
  APP.appendChild(card);

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
  const row = el("div", "stock-row");
  row.appendChild(drinkVisualEl(d));

  const info = el("div", "drink-info");
  info.appendChild(el("div", "drink-name", d.name));
  info.appendChild(el("div", "drink-stock", `ล่าสุด ${STATE.stock[d.id] || 0} ${d.unit}`));
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
  return changes.map((c) => `${c.name} ${c.from}→${c.to}`).join(", ");
}

function renderStockHistorySection(history, kind) {
  if (!history || !history.length) return;
  const flagKey = kind === "stock" ? "showStockHistory" : "showRoomHistory";
  const btn = el(
    "button",
    "collapse-toggle",
    VIEW[flagKey] ? "ซ่อนประวัติการนับสต็อก" : `ดูประวัติการนับสต็อก (${history.length})`
  );
  btn.onclick = () => {
    VIEW = { ...VIEW, [flagKey]: !VIEW[flagKey] };
    render();
  };
  APP.appendChild(btn);

  if (VIEW[flagKey]) {
    const card = el("div", "card");
    const rev = [...history].reverse();
    for (const h of rev) {
      const item = el("div", "round-item");
      const topRow = el("div", "round-top");
      topRow.appendChild(el("span", null, h.employee));
      topRow.appendChild(el("span", null, fmtDateTime(h.timestamp)));
      item.appendChild(topRow);
      item.appendChild(el("div", "round-items", renderChangesText(h.changes)));
      card.appendChild(item);
    }
    APP.appendChild(card);
  }
}

// ---------- Room stock (สต็อกย่อยประจำห้อง/โต๊ะ) ----------
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

  const categories = [];
  for (const d of activeDrinks()) {
    if (!d.trackStock) continue;
    if (!categories.includes(d.category)) categories.push(d.category);
  }

  const card = el("div", "card");
  for (const cat of categories) {
    card.appendChild(el("div", "category-title", cat));
    for (const d of activeDrinks().filter((x) => x.category === cat && x.trackStock)) {
      card.appendChild(renderRoomStockRow(d, locationId));
    }
  }
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

  renderStockHistorySection((STATE.roomStockHistory && STATE.roomStockHistory[locationId]) || [], "room");
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
  info.appendChild(el("div", "drink-price", `มีอยู่แล้ว ${existingQty} ${d.unit}`));
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
    for (const d of all.filter((x) => x.category === cat)) {
      APP.appendChild(renderMenuRow(d));
    }
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
  const row = el("div", "card");
  row.style.marginBottom = "10px";
  if (d.active === false) row.style.opacity = "0.55";

  if (!isEditing) {
    const topRow = el("div", "drink-row");
    topRow.appendChild(drinkVisualEl(d));
    const info = el("div", "drink-info");
    info.appendChild(el("div", "drink-name", d.name + (d.active === false ? " (ซ่อนอยู่)" : "")));
    info.appendChild(el("div", "drink-price", `฿${money(d.price)} / ${d.unit}`));
    topRow.appendChild(info);
    row.appendChild(topRow);

    const actionRow = el("div", null);
    actionRow.style.display = "flex";
    actionRow.style.gap = "14px";
    actionRow.style.marginTop = "6px";
    const editBtn = el("button", "collapse-toggle", "✎ แก้ไข");
    editBtn.onclick = () => {
      MENU_EDIT_ID = d.id;
      MENU_EDIT_DRAFT = { name: d.name, price: d.price, unit: d.unit, image: null, removeImage: false };
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
        !confirm(
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

    row.appendChild(actionRow);
    return row;
  }

  row.appendChild(el("div", "section-label", "แก้ไข: " + d.name));

  const nameInput = document.createElement("input");
  nameInput.className = "stock-input";
  nameInput.value = MENU_EDIT_DRAFT.name;
  nameInput.oninput = () => { MENU_EDIT_DRAFT.name = nameInput.value; };
  row.appendChild(labeledField("ชื่อ", nameInput));

  const priceInput = document.createElement("input");
  priceInput.className = "stock-input";
  priceInput.type = "number";
  priceInput.value = MENU_EDIT_DRAFT.price;
  priceInput.oninput = () => { MENU_EDIT_DRAFT.price = Number(priceInput.value) || 0; };
  row.appendChild(labeledField("ราคา", priceInput));

  const unitInput = document.createElement("input");
  unitInput.className = "stock-input";
  unitInput.value = MENU_EDIT_DRAFT.unit;
  unitInput.oninput = () => { MENU_EDIT_DRAFT.unit = unitInput.value; };
  row.appendChild(labeledField("หน่วยนับ", unitInput));

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
  row.appendChild(photoRow);

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
  row.appendChild(btnRow);

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

// ---------- tiny element helper ----------
function el(tag, className, text) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (text !== undefined) e.textContent = text;
  return e;
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
