// =====================================================================
//  Navigation engine — builds the whole menu from config.js
//  URLs look like:  #sales/customers   (section / sub-page)
// =====================================================================

const $ = s => document.querySelector(s);
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const SECTIONS = Object.fromEntries(NAV.map(s => [s.id, s]));
const icon = (name, size = 16) =>
  `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="${ICONS[name] || ""}"/></svg>`;
const chev = `<svg class="chev" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="m6 9 6 6 6-6"/></svg>`;

const tabsEl = $("#tabs"), pill = $("#pill");
const crumbsEl = $("#crumbs"), subtabsEl = $("#subtabs"), divider = $("#sub-divider");
const pageEl = $("#page"), titleEl = $("#page-title"), subEl = $("#page-sub"), sweep = $("#sweep");

let state = { section: null, page: null };
let pillPos = null;

// ================= BUILD THE MENUS =================
function buildDesktopTabs() {
  const main = NAV.filter(s => !s.more);
  const more = NAV.filter(s => s.more);

  let html = main.map(s => `<a class="tab" href="#${s.id}" data-section="${s.id}">${s.label}</a>`).join("");

  if (more.length) {
    const groups = [...new Set(more.map(s => s.group || ""))];
    html += `
      <div class="menu">
        <button class="tab more-btn" id="more-btn" data-toggle aria-haspopup="true" aria-expanded="false">
          <span class="more-label">More</span>${chev}
        </button>
        <div class="dropdown mega" role="menu">
          ${groups.map(g => `
            <div class="dd-group">
              ${g ? `<div class="dd-group-label">${g}</div>` : ""}
              ${more.filter(s => (s.group || "") === g).map(s => `
                <a href="#${s.id}" data-section="${s.id}" class="dd-item">
                  <span class="dd-icon">${icon(s.icon)}</span>${s.label}
                </a>`).join("")}
            </div>`).join("")}
        </div>
      </div>`;
  }
  tabsEl.insertAdjacentHTML("beforeend", html);
}

function buildMobileMenu() {
  const main = NAV.filter(s => !s.more);
  const more = NAV.filter(s => s.more);
  const groups = [...new Set(more.map(s => s.group || "More"))];
  const link = s => `<a href="#${s.id}" data-section="${s.id}"><span class="m-icon">${icon(s.icon, 17)}</span>${s.label}</a>`;
  $("#mobile-menu").innerHTML = `<div class="mobile-menu-inner">
    ${main.map(link).join("")}
    ${groups.map(g => `<div class="m-group">${g}</div>${more.filter(s => (s.group || "More") === g).map(link).join("")}`).join("")}
  </div>`;
}

buildDesktopTabs();
buildMobileMenu();
const moreBtn = $("#more-btn"), moreLabel = $(".more-label");

// ================= LIQUID PILL =================
function movePill(el, instant = false) {
  if (!el || !tabsEl.offsetParent) return;
  const box = tabsEl.getBoundingClientRect();
  const r = el.getBoundingClientRect();
  const l = r.left - box.left, rr = box.right - r.right;
  if (instant || !pillPos) pill.style.transition = "none";
  else {
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
function renderCrumbs(sec, pg, animateFrom) {
  const parts = [`<li>Workspace</li>`, `<li class="sep" aria-hidden="true">›</li>`];
  parts.push(pg
    ? `<li><a href="#${sec.id}" data-section="${sec.id}" class="crumb-link${animateFrom === "section" ? " enter" : ""}">${sec.label}</a></li>`
    : `<li class="current${animateFrom ? " enter" : ""}">${sec.label}</li>`);
  if (pg) parts.push(`<li class="sep" aria-hidden="true">›</li><li class="current${animateFrom ? " enter" : ""}">${pg.label}</li>`);
  crumbsEl.innerHTML = parts.join("");
}

// ================= SUB-TABS =================
function renderSubtabs(sec, pg, animate) {
  const build = () => {
    subtabsEl.classList.remove("leaving");
    subtabsEl.innerHTML = sec.pages.map((p, i) => `
      <a href="#${sec.id}/${p.id}" data-section="${sec.id}" data-page="${p.id}"
         class="subtab${p.action ? " action" : ""}${pg && p.id === pg.id ? " active" : ""}" style="--i:${i}">
        ${p.action ? icon("plus", 13) : ""}${p.label}
      </a>`).join("") + (sec.pages.length ? `<span class="sub-line grow"></span>` : "");
    divider.classList.toggle("show", sec.pages.length > 0);
    $(".subbar").classList.toggle("has-tabs", sec.pages.length > 0);
    requestAnimationFrame(() => moveSubLine(true));
  };
  if (animate && subtabsEl.children.length) {
    subtabsEl.classList.add("leaving");
    divider.classList.toggle("show", sec.pages.length > 0);
    setTimeout(build, 170);
  } else build();
}
function moveSubLine(instant) {
  const el = subtabsEl.querySelector(".subtab.active");
  const line = subtabsEl.querySelector(".sub-line");
  if (!el || !line) return;
  if (instant) line.style.transition = "none";
  line.style.width = el.offsetWidth - 16 + "px";
  line.style.transform = `translateX(${el.offsetLeft + 8}px)`;
  if (instant) requestAnimationFrame(() => (line.style.transition = ""));
  el.scrollIntoView({ block: "nearest", inline: "nearest", behavior: instant ? "auto" : "smooth" });
}

// ================= PAGE CONTENT (placeholder for now) =================
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
  }, 40);
}
function fillPage(sec, pg, animate) {
  const title = pg ? pg.label : sec.label;
  subEl.textContent = pg ? `${sec.label} · ${sec.desc}` : sec.desc;
  pageEl.querySelectorAll(".ghost").forEach((g, i) => g.style.setProperty("--d", i));
  pageEl.classList.remove("out");
  if (animate) {
    pageEl.classList.remove("in"); void pageEl.offsetWidth; pageEl.classList.add("in");
    typeTitle(title);
  } else titleEl.textContent = title;
}

// ================= ROUTER =================
function parseHash() {
  const [s, p] = location.hash.slice(1).split("/");
  const sec = SECTIONS[s] || NAV[0];
  const pg = sec.pages.find(x => x.id === p) || sec.pages.find(x => !x.action) || null;
  return { sec, pg };
}

let navTimer;
function go(sec, pg, animate = true) {
  const sameSection = state.section === sec.id;
  if (sameSection && state.page === (pg && pg.id)) { closeMenus(); closeMobile(); return; }
  state = { section: sec.id, page: pg && pg.id };
  document.title = `Tideline — ${pg ? pg.label : sec.label}`;

  if (sameSection) {
    // ---- only the sub-page changed: slide underline, retype title ----
    subtabsEl.querySelectorAll(".subtab").forEach(s => s.classList.toggle("active", s.dataset.page === state.page));
    moveSubLine(false);
    renderCrumbs(sec, pg, "page");
    fillPage(sec, pg, animate);
  } else {
    // ---- new section: pill, crumbs, sub-tabs, wave ----
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    const tab = sec.more ? moreBtn : tabsEl.querySelector(`.tab[data-section="${sec.id}"]`);
    tab?.classList.add("active");
    if (moreLabel) moreLabel.textContent = sec.more ? sec.label : "More";
    requestAnimationFrame(() => movePill(tab, !animate));
    renderCrumbs(sec, pg, animate ? "section" : null);
    renderSubtabs(sec, pg, animate);

    clearTimeout(navTimer);
    if (animate && !reduced) {
      pageEl.classList.remove("in");
      pageEl.classList.add("out");
      sweep.classList.remove("run"); void sweep.offsetWidth; sweep.classList.add("run");
      navTimer = setTimeout(() => fillPage(sec, pg, true), 430);
      setTimeout(() => sweep.classList.remove("run"), 1200);
    } else fillPage(sec, pg, animate);
  }

  document.querySelectorAll(".dd-item[data-section], .mobile-menu a").forEach(a =>
    a.classList.toggle("active", a.dataset.section === sec.id));
  closeMenus();
  closeMobile();
}

function navigate(hash) {
  history.replaceState(null, "", "#" + hash);
  const { sec, pg } = parseHash();
  go(sec, pg);
}

document.addEventListener("click", e => {
  const link = e.target.closest("a[data-section]");
  if (!link) return;
  e.preventDefault();
  if (link.classList.contains("tab")) ring(e.clientX, e.clientY);
  navigate(link.dataset.section + (link.dataset.page ? "/" + link.dataset.page : ""));
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
function closeMobile() {
  burger.classList.remove("open");
  mobileMenu.classList.remove("open");
  burger.setAttribute("aria-expanded", "false");
}
burger.addEventListener("click", () => {
  const open = mobileMenu.classList.toggle("open");
  burger.classList.toggle("open", open);
  burger.setAttribute("aria-expanded", open);
  mobileMenu.querySelectorAll("a, .m-group").forEach((a, i) => (a.style.transitionDelay = open ? `${60 + i * 28}ms` : "0ms"));
});

// ================= CLOCK =================
const clock = $("#clock");
const tick = () => (clock.textContent = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }));
tick(); setInterval(tick, 15000);

// ================= SEARCH PALETTE (Ctrl/Cmd + K) =================
// Lists every section and every sub-page
const ENTRIES = NAV.flatMap(s => [
  { hash: s.id, text: s.label, icon: s.icon },
  ...s.pages.map(p => ({ hash: `${s.id}/${p.id}`, text: `${s.label} › ${p.label}`, icon: s.icon })),
]);
const palette = $("#palette"), pInput = $("#palette-input"), pList = $("#palette-list");
let sel = 0, results = [];
function renderPalette() {
  const q = pInput.value.trim().toLowerCase();
  results = ENTRIES.filter(e => e.text.toLowerCase().includes(q));
  sel = Math.min(sel, Math.max(results.length - 1, 0));
  pList.innerHTML = results.length
    ? results.map((e, i) => `<li data-h="${e.hash}" class="${i === sel ? "sel" : ""}">${icon(e.icon, 15)}<span>${e.text}</span></li>`).join("")
    : `<li>No matches</li>`;
  pList.querySelector(".sel")?.scrollIntoView({ block: "nearest" });
}
function openPalette() { palette.classList.add("open"); pInput.value = ""; sel = 0; renderPalette(); setTimeout(() => pInput.focus(), 50); }
function closePalette() { palette.classList.remove("open"); }
function pick(h) { closePalette(); navigate(h); }
$("#search-btn").addEventListener("click", openPalette);
palette.addEventListener("click", e => { if (e.target === palette) closePalette(); });
pInput.addEventListener("input", () => { sel = 0; renderPalette(); });
pList.addEventListener("click", e => { const li = e.target.closest("li[data-h]"); if (li) pick(li.dataset.h); });
pInput.addEventListener("keydown", e => {
  if (!results.length) return;
  if (e.key === "ArrowDown") { sel = (sel + 1) % results.length; renderPalette(); e.preventDefault(); }
  if (e.key === "ArrowUp") { sel = (sel - 1 + results.length) % results.length; renderPalette(); e.preventDefault(); }
  if (e.key === "Enter") pick(results[sel].hash);
});
document.addEventListener("keydown", e => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); openPalette(); }
  if (e.key === "Escape") { closePalette(); closeMenus(); closeMobile(); }
});

// ================= INIT =================
window.addEventListener("resize", () => { movePill(activeTabEl(), true); moveSubLine(true); });
window.addEventListener("hashchange", () => { const { sec, pg } = parseHash(); go(sec, pg); });
{ const { sec, pg } = parseHash(); go(sec, pg, false); }
document.fonts?.ready.then(() => { movePill(activeTabEl(), true); moveSubLine(true); });
