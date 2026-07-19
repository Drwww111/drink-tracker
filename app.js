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
let STOCK_DRAFT = {}; // { drinkId: qty } กำลังแก้ไขสต็อกกลางของร้าน
let STOCK_EMPLOYEE = null;
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

async function apiCloseBill(locationId) {
  const res = await fetch("/api/close-bill", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ locationId }),
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
  render();
}

function goLocation(locationId) {
  VIEW = { name: "location", locationId };
  render();
}

function goStock() {
  STOCK_DRAFT = { ...(STATE.stock || {}) };
  STOCK_EMPLOYEE = null;
  VIEW = { name: "stock" };
  render();
}

function goRoomStock(locationId) {
  const existing = (STATE.roomStock && STATE.roomStock[locationId]) || {};
  ROOM_DRAFT = { ...existing };
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

function goAddRound(locationId) {
  DRAFT = { locationId, employee: null, items: {}, emptyCounts: {}, showEmpty: false, editRoundId: null };
  VIEW = { name: "add-round", locationId };
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
  APP.appendChild(top);

  const groups = [];
  for (const loc of LOCATIONS) {
    if (!groups.includes(loc.group)) groups.push(loc.group);
  }

  for (const g of groups) {
    APP.appendChild(el("div", "group-title", g));
    const grid = el("div", "loc-grid");
    for (const loc of LOCATIONS.filter((l) => l.group === g)) {
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

  const roomStock = (STATE.roomStock && STATE.roomStock[locationId]) || {};
  const roomStockEntries = Object.entries(roomStock).filter(([, qty]) => qty > 0);

  const roomBtn = el(
    "button",
    "btn-secondary",
    "📦 สต็อกที่วางไว้ในห้องนี้" + (roomStockEntries.length ? ` (${roomStockEntries.length} รายการ)` : "")
  );
  roomBtn.style.marginBottom = "14px";
  roomBtn.onclick = () => goRoomStock(locationId);
  APP.appendChild(roomBtn);

  if (roomStockEntries.length) {
    APP.appendChild(el("div", "section-label", "ของที่วางไว้ในห้องนี้อยู่แล้ว (อ้างอิง)"));
    const refCard = el("div", "card");
    for (const [id, qty] of roomStockEntries) {
      const d = drinkById(id);
      if (!d) continue;
      const row = el("div", "drink-row");
      row.appendChild(drinkVisualEl(d));
      const info = el("div", "drink-info");
      info.appendChild(el("div", "drink-name", d.name));
      row.appendChild(info);
      row.appendChild(el("div", "drink-stock", `${qty} ${d.unit}`));
      refCard.appendChild(row);
    }
    APP.appendChild(refCard);
  }

  const addBtn = el("button", "btn-primary", "+ เพิ่มรายการเครื่องดื่ม");
  addBtn.style.marginBottom = "14px";
  addBtn.onclick = () => goAddRound(locationId);
  APP.appendChild(addBtn);

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
      const editBtn = el("button", "collapse-toggle", "✎ แก้ไขรายการนี้");
      editBtn.style.padding = "6px 4px";
      editBtn.onclick = () => goEditRound(locationId, r);
      actionRow.appendChild(editBtn);
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

    const closeBtn = el("button", "btn-danger", "✔ ปิดบิล / เก็บเงินแล้ว");
    closeBtn.style.marginTop = "6px";
    closeBtn.onclick = async () => {
      if (!confirm(`ยืนยันปิดบิล ${loc.label} ยอดรวม ฿${money(billTotal(open))} ?`)) return;
      try {
        STATE = await apiCloseBill(locationId);
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
        item.appendChild(el("div", "round-meta", `ปิดเมื่อ ${fmtDateTime(b.closedAt)}`));

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
  const drinkCard = el("div", "card");
  const categories = [];
  for (const d of activeDrinks()) if (!categories.includes(d.category)) categories.push(d.category);

  for (const cat of categories) {
    drinkCard.appendChild(el("div", "category-title", cat));
    for (const d of activeDrinks().filter((x) => x.category === cat)) {
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
  const qtyEl = el("div", "step-qty", String(value));
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
  stepper.appendChild(qtyEl);
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
      "เลือกเครื่องดื่มและใส่จำนวนที่วางไว้ประจำห้อง/โต๊ะนี้ (แยกจากสต็อกกลางของร้าน ไม่หักสต็อกกลางตอนบันทึก)"
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
      card.appendChild(renderRoomStockRow(d));
    }
  }
  APP.appendChild(card);

  const saveBtn = el("button", "btn-primary", SAVING ? "กำลังบันทึก..." : "✔ บันทึกสต็อกในห้องนี้");
  saveBtn.disabled = SAVING;
  saveBtn.onclick = async () => {
    if (!ROOM_EMPLOYEE) {
      toast("กรุณาเลือกพนักงานที่นับสต็อกก่อน", true);
      return;
    }
    SAVING = true;
    render();
    try {
      STATE = await apiSetRoomStock(locationId, ROOM_EMPLOYEE, ROOM_DRAFT);
      SAVING = false;
      toast("บันทึกสต็อกในห้องเรียบร้อย");
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

function renderRoomStockRow(d) {
  const row = el("div", "drink-row");
  row.appendChild(drinkVisualEl(d));

  const info = el("div", "drink-info");
  info.appendChild(el("div", "drink-name", d.name));
  info.appendChild(el("div", "drink-price", d.unit));
  row.appendChild(info);

  const value = ROOM_DRAFT[d.id] || 0;
  const stepper = renderMiniStepper(value, (v) => {
    ROOM_DRAFT[d.id] = v;
  });
  row.appendChild(stepper);

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
