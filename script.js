// ================= DATA =================
// Every page: title, subtitle, sub-tabs ([label, count?])
const PAGES = {
  "desk":         { title: "Desk", sub: "Your morning at a glance.", tabs: [] },
  "applications": { title: "Pipeline", crumb: "Applications", sub: "24 applications moving · $1,482,900 indicated premium", tabs: [["Pipeline"], ["All applications"], ["Info requests", 14]] },
  "renewals":     { title: "Renewals", sub: "1 renewal not started.", tabs: [["Upcoming"], ["In progress", 1], ["Lapsed"]] },
  "bookroll":     { title: "Bookroll", sub: "Every client and vessel you look after.", tabs: [["Clients"], ["Vessels"], ["Carriers"]] },
  "policies":     { title: "Policies", sub: "34 policies bound this year.", tabs: [["Active"], ["Expiring"], ["Cancelled"]] },
  "agency-bills": { title: "Agency bills", sub: "Invoices and statements.", tabs: [["Open"], ["Paid"], ["Statements"]] },
  "clients":      { title: "Clients", sub: "", tabs: [] },
  "carriers":     { title: "Carriers", sub: "", tabs: [] },
  "reports":      { title: "Reports", sub: "", tabs: [["Production"], ["Commission"]] },
  "settings":     { title: "Settings", sub: "", tabs: [["General"], ["Team"], ["Billing"]] },
  "profile":      { title: "Profile", sub: "", tabs: [] },
};
const MAIN = ["desk", "applications", "renewals", "bookroll", "policies", "agency-bills"];
const MORE = ["clients", "carriers", "reports", "settings"];
const label = k => PAGES[k].crumb || PAGES[k].title;

const $ = s => document.querySelector(s);
const tabsEl = $("#tabs"), pill = $("#pill"), moreBtn = $("#more-btn"), moreLabel = $(".more-label");
const crumbsEl = $("#crumbs"), subtabsEl = $("#subtabs"), divider = $("#sub-divider");
const pageEl = $("#page"), titleEl = $("#page-title"), subEl = $("#page-sub"), sweep = $("#sweep");
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

let current = null;
let pillPos = null;

// ================= LIQUID PILL =================
function movePill(el, instant = false) {
  if (!el || !tabsEl.offsetParent) return;
  const box = tabsEl.getBoundingClientRect();
  const r = el.getBoundingClientRect();
  const l = r.left - box.left;
  const rr = box.right - r.right;

  if (instant || !pillPos) {
    pill.style.transition = "none";
  } else {
    pill.style.transition = "";
    pill.classList.toggle("to-right", l > pillPos.l);
    pill.classList.toggle("to-left", l <= pillPos.l);
  }
  pill.style.setProperty("--l", l + "px");
  pill.style.setProperty("--r", rr + "px");
  pill.classList.add("ready");
  pillPos = { l, rr };
  if (instant) requestAnimationFrame(() => (pill.style.transition = ""));
}
const activeTabEl = () => tabsEl.querySelector(".tab.active");

// ================= CLICK RING =================
function ring(x, y) {
  if (reduced) return;
  const r = document.createElement("span");
  r.className = "click-ring";
  r.style.left = x + "px";
  r.style.top = y + "px";
  document.body.appendChild(r);
  r.addEventListener("animationend", () => r.remove());
}

// ================= BREADCRUMB =================
function renderCrumbs(page) {
  crumbsEl.innerHTML =
    `<li>Workspace</li><li class="sep" aria-hidden="true">›</li>` +
    `<li class="current enter">${label(page)}</li>`;
}

// ================= SUB-TABS =================
function renderSubtabs(page, animate) {
  const tabs = PAGES[page].tabs;
  const build = () => {
    subtabsEl.classList.remove("leaving");
    subtabsEl.innerHTML = tabs.map(([t, c], i) =>
      `<a href="#" class="subtab${i === 0 ? " active" : ""}" style="--i:${i}" data-i="${i}">${t}${c ? ` <span class="count">${c}</span>` : ""}</a>`
    ).join("") + (tabs.length ? `<span class="sub-line grow"></span>` : "");
    divider.classList.toggle("show", tabs.length > 0);
    requestAnimationFrame(() => moveSubLine(subtabsEl.querySelector(".subtab.active"), true));
  };
  if (animate && subtabsEl.children.length) {
    subtabsEl.classList.add("leaving");
    divider.classList.toggle("show", tabs.length > 0);
    setTimeout(build, 170);
  } else build();
}
function moveSubLine(el, instant) {
  const line = subtabsEl.querySelector(".sub-line");
  if (!el || !line) return;
  if (instant) line.style.transition = "none";
  line.style.width = el.offsetWidth - 16 + "px";
  line.style.transform = `translateX(${el.offsetLeft + 8}px)`;
  if (instant) requestAnimationFrame(() => (line.style.transition = ""));
}
subtabsEl.addEventListener("click", e => {
  const t = e.target.closest(".subtab");
  if (!t) return;
  e.preventDefault();
  subtabsEl.querySelectorAll(".subtab").forEach(s => s.classList.toggle("active", s === t));
  moveSubLine(t);
});

// ================= TYPEWRITER TITLE =================
let typeTimer;
function typeTitle(text) {
  clearInterval(typeTimer);
  if (reduced) { titleEl.textContent = text; return; }
  let i = 0;
  titleEl.innerHTML = `<span class="t"></span><span class="caret"></span>`;
  const t = titleEl.querySelector(".t");
  typeTimer = setInterval(() => {
    t.textContent = text.slice(0, ++i);
    if (i >= text.length) {
      clearInterval(typeTimer);
      setTimeout(() => titleEl.querySelector(".caret")?.remove(), 500);
    }
  }, 45);
}

function fillPage(page, animate) {
  const p = PAGES[page];
  subEl.textContent = p.sub;
  pageEl.querySelectorAll(".ghost").forEach((g, i) => g.style.setProperty("--d", i));
  pageEl.classList.remove("out");
  if (animate) {
    pageEl.classList.remove("in"); void pageEl.offsetWidth; pageEl.classList.add("in");
    typeTitle(p.title);
  } else titleEl.textContent = p.title;
}

// ================= NAVIGATE =================
let navTimer;
function go(page, animate = true) {
  if (!PAGES[page]) page = "desk";
  if (page === current) { closeMenus(); closeMobile(); return; }
  current = page;
  const isMore = MORE.includes(page);

  document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
  const tab = isMore ? moreBtn : tabsEl.querySelector(`.tab[data-page="${page}"]`);
  tab?.classList.add("active");
  moreLabel.textContent = isMore ? PAGES[page].title : "More";
  document.querySelectorAll(".dd-item[data-page], .mobile-menu a").forEach(a =>
    a.classList.toggle("active", a.dataset.page === page));

  requestAnimationFrame(() => movePill(tab || activeTabEl(), !animate));
  renderCrumbs(page);
  renderSubtabs(page, animate);
  document.title = `Tideline — ${label(page)}`;

  clearTimeout(navTimer);
  if (animate && !reduced) {
    pageEl.classList.remove("in");
    pageEl.classList.add("out");
    sweep.classList.remove("run"); void sweep.offsetWidth; sweep.classList.add("run");
    navTimer = setTimeout(() => fillPage(page, true), 430);
    setTimeout(() => sweep.classList.remove("run"), 1200);
  } else {
    fillPage(page, animate);
  }
  closeMenus();
  closeMobile();
}

document.addEventListener("click", e => {
  const link = e.target.closest("a[data-page]");
  if (!link) return;
  e.preventDefault();
  if (link.classList.contains("tab")) ring(e.clientX, e.clientY);
  history.replaceState(null, "", "#" + link.dataset.page);
  go(link.dataset.page);
});

// ================= DROPDOWNS =================
function closeMenus(except) {
  document.querySelectorAll(".menu.open").forEach(m => {
    if (m === except) return;
    m.classList.remove("open");
    m.querySelector("[data-toggle]")?.setAttribute("aria-expanded", "false");
  });
}
document.querySelectorAll("[data-toggle]").forEach(btn =>
  btn.addEventListener("click", e => {
    e.stopPropagation();
    const menu = btn.closest(".menu");
    closeMenus(menu);
    btn.setAttribute("aria-expanded", menu.classList.toggle("open"));
  }));
document.addEventListener("click", e => { if (!e.target.closest(".dropdown")) closeMenus(); });

$("#mark-read").addEventListener("click", e => {
  e.stopPropagation();
  document.querySelectorAll(".notif-item.unread").forEach((n, i) => setTimeout(() => n.classList.remove("unread"), i * 90));
  $("#badge").classList.add("hide");
});

// ================= THEME: circle reveal from the button =================
const root = document.documentElement;
$("#theme-btn").addEventListener("click", e => {
  const next = root.dataset.theme === "dark" ? "light" : "dark";
  const apply = () => {
    root.dataset.theme = next;
    try { localStorage.setItem("theme", next); } catch (err) {}
  };
  if (!document.startViewTransition || reduced) return apply();

  const b = e.currentTarget.getBoundingClientRect();
  const x = b.left + b.width / 2, y = b.top + b.height / 2;
  const end = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
  document.startViewTransition(apply).ready.then(() => {
    root.animate(
      { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${end}px at ${x}px ${y}px)`] },
      { duration: 750, easing: "cubic-bezier(.65, 0, .25, 1)", pseudoElement: "::view-transition-new(root)" }
    );
  });
});

// ================= MOBILE MENU =================
const burger = $("#burger"), mobileMenu = $("#mobile-menu");
mobileMenu.innerHTML = `<div class="mobile-menu-inner">` + [...MAIN, ...MORE].map(k => {
  const c = { applications: 14, renewals: 1 }[k];
  return `<a href="#${k}" data-page="${k}">${label(k)}${c ? `<span class="count">${c}</span>` : ""}</a>`;
}).join("") + `</div>`;
function closeMobile() {
  burger.classList.remove("open");
  mobileMenu.classList.remove("open");
  burger.setAttribute("aria-expanded", "false");
}
burger.addEventListener("click", () => {
  const open = mobileMenu.classList.toggle("open");
  burger.classList.toggle("open", open);
  burger.setAttribute("aria-expanded", open);
  mobileMenu.querySelectorAll("a").forEach((a, i) => (a.style.transitionDelay = open ? `${80 + i * 35}ms` : "0ms"));
});

// ================= CLOCK =================
const clock = $("#clock");
const tick = () => (clock.textContent = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }));
tick(); setInterval(tick, 15000);

// ================= SEARCH PALETTE (Ctrl/Cmd + K) =================
const palette = $("#palette"), pInput = $("#palette-input"), pList = $("#palette-list");
let sel = 0, results = [];
function renderPalette() {
  const q = pInput.value.trim().toLowerCase();
  results = Object.keys(PAGES).filter(k => label(k).toLowerCase().includes(q));
  sel = Math.min(sel, Math.max(results.length - 1, 0));
  pList.innerHTML = results.length
    ? results.map((k, i) => `<li data-k="${k}" class="${i === sel ? "sel" : ""}">${label(k)}</li>`).join("")
    : `<li>No matches</li>`;
}
function openPalette() { palette.classList.add("open"); pInput.value = ""; sel = 0; renderPalette(); setTimeout(() => pInput.focus(), 50); }
function closePalette() { palette.classList.remove("open"); }
function pick(k) { history.replaceState(null, "", "#" + k); closePalette(); go(k); }
$("#search-btn").addEventListener("click", openPalette);
palette.addEventListener("click", e => { if (e.target === palette) closePalette(); });
pInput.addEventListener("input", () => { sel = 0; renderPalette(); });
pList.addEventListener("click", e => { const li = e.target.closest("li[data-k]"); if (li) pick(li.dataset.k); });
pInput.addEventListener("keydown", e => {
  if (!results.length) return;
  if (e.key === "ArrowDown") { sel = (sel + 1) % results.length; renderPalette(); e.preventDefault(); }
  if (e.key === "ArrowUp") { sel = (sel - 1 + results.length) % results.length; renderPalette(); e.preventDefault(); }
  if (e.key === "Enter") pick(results[sel]);
});
document.addEventListener("keydown", e => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); openPalette(); }
  if (e.key === "Escape") { closePalette(); closeMenus(); closeMobile(); }
});

// ================= INIT =================
window.addEventListener("resize", () => {
  movePill(activeTabEl(), true);
  moveSubLine(subtabsEl.querySelector(".subtab.active"), true);
});
window.addEventListener("hashchange", () => go(location.hash.slice(1)));
go(location.hash.slice(1) || "desk", false);
document.fonts?.ready.then(() => {
  movePill(activeTabEl(), true);
  moveSubLine(subtabsEl.querySelector(".subtab.active"), true);
});
