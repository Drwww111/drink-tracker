// ===== แอปบันทึกเครื่องดื่ม (SPA vanilla JS) =====

const APP = document.getElementById("app");

let STATE = null; // { locations: {id: {openBill, history}}, stock: {drinkId: qty} }
let VIEW = { name: "home" };
let DRAFT = null; // { locationId, employee, items: {drinkId:{qty,free}}, emptyCounts: {drinkId:qty}, showEmpty:false }
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

async function apiStock(drinkId, mode, value) {
  const res = await fetch("/api/stock", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ drinkId, mode, value }),
  });
  if (!res.ok) throw new Error(await readErrorMessage(res, "อัปเดตสต็อกไม่สำเร็จ"));
  return res.json();
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
  return DRINKS.find((d) => d.id === id);
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
    STATE = { locations: {}, stock: {} };
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
  VIEW = { name: "stock" };
  render();
}

function goAddRound(locationId) {
  DRAFT = { locationId, employee: null, items: {}, emptyCounts: {}, showEmpty: false };
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
}

// ---------- Home ----------
function renderHome() {
  const top = el("div", "topbar");
  top.appendChild(el("h1", null, "🍹 บันทึกเครื่องดื่ม"));
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
      item.appendChild(el("div", "round-meta", fmtDateTime(r.timestamp)));
      const itemsText = r.items
        .map((i) => `${i.name} x${i.qty}${i.free ? " (ฟรี)" : ""}`)
        .join(", ");
      item.appendChild(el("div", "round-items", itemsText));
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
        card.appendChild(item);
      }
      APP.appendChild(card);
    }
  }
}

// ---------- Add round ----------
function renderAddRound(locationId) {
  const loc = locById(locationId);

  const top = el("div", "topbar");
  const back = el("button", "back-btn", "←");
  back.onclick = () => goLocation(locationId);
  top.appendChild(back);
  top.appendChild(el("h1", null, loc.label));
  APP.appendChild(top);

  APP.appendChild(el("div", "section-label", "1. พนักงานที่นำเข้าไป"));
  const staffGrid = el("div", "staff-grid");
  for (const name of STAFF) {
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
  for (const d of DRINKS) if (!categories.includes(d.category)) categories.push(d.category);

  for (const cat of categories) {
    drinkCard.appendChild(el("div", "category-title", cat));
    for (const d of DRINKS.filter((x) => x.category === cat)) {
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
    for (const d of DRINKS) {
      const row = el("div", "drink-row");
      row.appendChild(el("div", "drink-icon", d.icon));
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

  const saveBtn = el("button", "btn-primary", SAVING ? "กำลังบันทึก..." : "✔ บันทึกรายการนี้");
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
      });
      SAVING = false;
      toast("บันทึกเรียบร้อย");
      goLocation(locationId);
    } catch (e) {
      SAVING = false;
      toast(e.message, true);
      render();
    }
  };
  APP.appendChild(saveBtn);
}

function renderDrinkRow(d) {
  const row = el("div", "drink-row");
  row.appendChild(el("div", "drink-icon", d.icon));

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

// ---------- Stock management ----------
function renderStock() {
  const top = el("div", "topbar");
  const back = el("button", "back-btn", "←");
  back.onclick = goHome;
  top.appendChild(back);
  top.appendChild(el("h1", null, "📦 จัดการสต็อกเครื่องดื่ม"));
  APP.appendChild(top);

  APP.appendChild(
    el("div", "round-meta", "ตั้งค่าจำนวนเริ่มต้นตอนเปิดร้าน หรือกดเพิ่มเมื่อรับของใหม่เข้า ระบบจะหักออกอัตโนมัติเมื่อพนักงานบันทึกรายการ")
  );

  const categories = [];
  for (const d of DRINKS) {
    if (!d.trackStock) continue;
    if (!categories.includes(d.category)) categories.push(d.category);
  }

  const card = el("div", "card");
  for (const cat of categories) {
    card.appendChild(el("div", "category-title", cat));
    for (const d of DRINKS.filter((x) => x.category === cat && x.trackStock)) {
      card.appendChild(renderStockRow(d));
    }
  }
  APP.appendChild(card);
}

function renderStockRow(d) {
  const row = el("div", "stock-row");
  row.appendChild(el("div", "drink-icon", d.icon));

  const info = el("div", "drink-info");
  info.appendChild(el("div", "drink-name", d.name));
  const stock = STATE.stock[d.id] || 0;
  info.appendChild(el("div", "drink-stock", `คงเหลือ ${stock} ${d.unit}`));
  row.appendChild(info);

  const input = document.createElement("input");
  input.className = "stock-input";
  input.type = "number";
  input.value = stock;
  row.appendChild(input);

  const setBtn = el("button", "icon-btn", "บันทึก");
  setBtn.style.fontSize = "15px";
  setBtn.style.minWidth = "auto";
  setBtn.onclick = async () => {
    const v = Number(input.value) || 0;
    try {
      STATE = await apiStock(d.id, "set", v);
      toast(`ตั้งสต็อก ${d.name} เป็น ${v} แล้ว`);
      render();
    } catch (e) {
      toast(e.message, true);
    }
  };
  row.appendChild(setBtn);

  const quick = el("div", "quick-add");
  for (const q of [1, 12, 24]) {
    const b = document.createElement("button");
    b.textContent = "+" + q;
    b.onclick = async () => {
      try {
        STATE = await apiStock(d.id, "add", q);
        toast(`เพิ่ม ${d.name} +${q} แล้ว`);
        render();
      } catch (e) {
        toast(e.message, true);
      }
    };
    quick.appendChild(b);
  }
  row.appendChild(quick);

  return row;
}

// ---------- tiny element helper ----------
function el(tag, className, text) {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (text !== undefined) e.textContent = text;
  return e;
}

boot();
