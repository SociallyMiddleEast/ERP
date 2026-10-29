/* =====================================================================
   NAVIGATION — builds the top bar from config.js and runs the app.
   URLs look like  #sales/customers  or  #sales/opportunities?stage=won
   This file is loaded LAST (after every page file).
   ===================================================================== */
(function () {
  const $ = s => document.querySelector(s);
  const U = App.ui;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const SECTIONS = Object.fromEntries(NAV.map(s => [s.id, s]));
  const chev = `<svg class="chev" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="m6 9 6 6 6-6"/></svg>`;

  const tabsEl = $("#tabs"), pill = $("#pill");
  const crumbsEl = $("#crumbs"), subtabsEl = $("#subtabs"), divider = $("#sub-divider");
  const pageEl = $("#page"), sweep = $("#sweep");

  // brand + user from settings
  $(".brand-name").textContent = SETTINGS.company;
  $(".avatar").firstChild.textContent = SETTINGS.user.initials;
  $(".dd-user").innerHTML = `<b>${U.esc(SETTINGS.user.name)}</b><small>${U.esc(SETTINGS.user.role)}</small>`;
  $(".status-text").innerHTML = `${U.esc(SETTINGS.site)} online ·&nbsp;`;

  let state = { section: null, page: null, qs: null };
  let pillPos = null;

  /* ================= BUILD MENUS ================= */
  const main = NAV.filter(s => !s.more), more = NAV.filter(s => s.more);
  const groups = [...new Set(more.map(s => s.group || "More"))];

  tabsEl.insertAdjacentHTML("beforeend",
    main.map(s => `<a class="tab" href="#${s.id}" data-section="${s.id}">${s.label}</a>`).join("") +
    (more.length ? `
      <div class="menu">
        <button class="tab more-btn" id="more-btn" data-toggle aria-haspopup="true" aria-expanded="false"><span class="more-label">More</span>${chev}</button>
        <div class="dropdown mega" role="menu">
          ${groups.map(g => `<div class="dd-group"><div class="dd-group-label">${g}</div>
            ${more.filter(s => (s.group || "More") === g).map(s =>
              `<a href="#${s.id}" data-section="${s.id}" class="dd-item"><span class="dd-icon">${U.icon(s.icon)}</span>${s.label}</a>`).join("")}
          </div>`).join("")}
        </div>
      </div>` : ""));

  const mLink = s => `<a href="#${s.id}" data-section="${s.id}"><span class="m-icon">${U.icon(s.icon, 17)}</span>${s.label}</a>`;
  $("#mobile-menu").innerHTML = `<div class="mobile-menu-inner">${main.map(mLink).join("")}${groups.map(g =>
    `<div class="m-group">${g}</div>${more.filter(s => (s.group || "More") === g).map(mLink).join("")}`).join("")}</div>`;

  const moreBtn = $("#more-btn"), moreLabel = $(".more-label");

  /* ================= LIQUID PILL ================= */
  function movePill(el, instant = false) {
    if (!el || !tabsEl.offsetParent) return;
    const box = tabsEl.getBoundingClientRect(), r = el.getBoundingClientRect();
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

  function ring(x, y) {
    if (reduced) return;
    const r = document.createElement("span");
    r.className = "click-ring";
    r.style.left = x + "px";
    r.style.top = y + "px";
    document.body.appendChild(r);
    r.addEventListener("animationend", () => r.remove());
  }

  /* ================= BREADCRUMB + SUB-TABS ================= */
  function renderCrumbs(sec, pg, anim) {
    let h = `<li>Workspace</li><li class="sep" aria-hidden="true">›</li>`;
    h += pg
      ? `<li><a href="#${sec.id}" data-section="${sec.id}" class="crumb-link${anim === "section" ? " enter" : ""}">${sec.label}</a></li><li class="sep" aria-hidden="true">›</li><li class="current${anim ? " enter" : ""}">${pg.label}</li>`
      : `<li class="current${anim ? " enter" : ""}">${sec.label}</li>`;
    crumbsEl.innerHTML = h;
  }

  function renderSubtabs(sec, pg, animate) {
    const build = () => {
      subtabsEl.classList.remove("leaving");
      subtabsEl.innerHTML = sec.pages.map((p, i) => `
        <a href="#${sec.id}/${p.id}" data-section="${sec.id}" data-page="${p.id}"
           class="subtab${p.action ? " action" : ""}${pg && p.id === pg.id ? " active" : ""}" style="--i:${i}">${p.action ? U.icon("plus", 13) : ""}${p.label}</a>`).join("") +
        (sec.pages.length ? `<span class="sub-line grow"></span>` : "");
      divider.classList.toggle("show", sec.pages.length > 0);
      $(".subbar").classList.toggle("has-tabs", sec.pages.length > 0);
      requestAnimationFrame(() => moveSubLine(true));
    };
    if (animate && subtabsEl.children.length) {
      subtabsEl.classList.add("leaving");
      setTimeout(build, 170);
    } else build();
  }

  function moveSubLine(instant) {
    const el = subtabsEl.querySelector(".subtab.active"), line = subtabsEl.querySelector(".sub-line");
    if (!line) return;
    line.style.opacity = el ? 1 : 0;
    if (!el) return;
    if (instant) line.style.transition = "none";
    line.style.width = el.offsetWidth - 16 + "px";
    line.style.transform = `translateX(${el.offsetLeft + 8}px)`;
    if (instant) requestAnimationFrame(() => (line.style.transition = ""));
    const sl = subtabsEl.scrollLeft, w = subtabsEl.clientWidth;
    if (el.offsetLeft < sl || el.offsetLeft + el.offsetWidth > sl + w) subtabsEl.scrollTo({ left: el.offsetLeft - 20, behavior: instant ? "auto" : "smooth" });
  }

  /* ================= ROUTING ================= */
  function parseHash() {
    const [path, qs = ""] = location.hash.slice(1).split("?");
    const [s, p] = path.split("/");
    const sec = SECTIONS[s] || NAV[0];
    const pg = sec.pages.find(x => x.id === p) || sec.pages.find(x => !x.action) || null;
    return { sec, pg, qs, query: Object.fromEntries(new URLSearchParams(qs)) };
  }

  let navTimer;
  function go({ sec, pg, qs, query }, animate = true) {
    const sameSection = state.section === sec.id;
    const pid = pg ? pg.id : null;
    if (sameSection && state.page === pid && state.qs === qs) { closeMenus(); closeMobile(); return; }
    state = { section: sec.id, page: pid, qs };
    document.title = `${SETTINGS.company} — ${pg ? pg.label : sec.label}`;
    clearTimeout(navTimer);

    if (sameSection) {
      // only the sub-page (or its filters) changed → light fade
      subtabsEl.querySelectorAll(".subtab").forEach(s => s.classList.toggle("active", s.dataset.page === pid));
      moveSubLine(false);
      renderCrumbs(sec, pg, "page");
      if (animate && !reduced) {
        pageEl.classList.remove("in");
        pageEl.classList.add("out");
        navTimer = setTimeout(() => { App.renderPage(sec, pg, query, true); scrollTo({ top: 0 }); }, 200);
      } else App.renderPage(sec, pg, query, animate);
    } else {
      // new department → pill, sub-tabs, wave
      document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
      const tab = sec.more ? moreBtn : tabsEl.querySelector(`.tab[data-section="${sec.id}"]`);
      tab?.classList.add("active");
      if (moreLabel) moreLabel.textContent = sec.more ? sec.label : "More";
      requestAnimationFrame(() => movePill(tab, !animate));
      renderCrumbs(sec, pg, animate ? "section" : null);
      renderSubtabs(sec, pg, animate);
      if (animate && !reduced) {
        pageEl.classList.remove("in");
        pageEl.classList.add("out");
        sweep.classList.remove("run"); void sweep.offsetWidth; sweep.classList.add("run");
        navTimer = setTimeout(() => { App.renderPage(sec, pg, query, true); scrollTo({ top: 0 }); }, 430);
        setTimeout(() => sweep.classList.remove("run"), 1200);
      } else App.renderPage(sec, pg, query, animate);
    }

    document.querySelectorAll(".dd-item[data-section], .mobile-menu a").forEach(a =>
      a.classList.toggle("active", a.dataset.section === sec.id));
    closeMenus();
    closeMobile();
  }

  /* navigate from code: App.go("sales/opportunities?stage=won") */
  App.go = hash => {
    if (location.hash.slice(1) === hash) return;
    history.pushState(null, "", "#" + hash);
    go(parseHash());
  };
  /* re-render the current page (after data changes) without animation */
  App.refresh = () => { const p = parseHash(); state.qs = null; App.renderPage(p.sec, p.pg, p.query, false); state.qs = p.qs; };

  document.addEventListener("click", e => {
    const link = e.target.closest("a[data-section]");
    if (!link) return;
    e.preventDefault();
    if (link.classList.contains("tab")) ring(e.clientX, e.clientY);
    App.go(link.dataset.section + (link.dataset.page ? "/" + link.dataset.page : ""));
  });

  /* ================= DROPDOWNS ================= */
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
  $("#reset-data").addEventListener("click", e => { e.preventDefault(); App.resetData(); });

  /* ================= THEME: circle reveal ================= */
  const root = document.documentElement;
  $("#theme-btn").addEventListener("click", e => {
    const next = root.dataset.theme === "dark" ? "light" : "dark";
    const apply = () => {
      root.dataset.theme = next;
      try { localStorage.setItem("theme", next); } catch (err) { /* ignore */ }
    };
    if (!document.startViewTransition || reduced) return apply();
    const b = e.currentTarget.getBoundingClientRect();
    const x = b.left + b.width / 2, y = b.top + b.height / 2;
    const end = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    document.startViewTransition(apply).ready.then(() => {
      root.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${end}px at ${x}px ${y}px)`] },
        { duration: 750, easing: "cubic-bezier(.65, 0, .25, 1)", pseudoElement: "::view-transition-new(root)" });
    });
  });

  /* ================= MOBILE MENU ================= */
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

  /* ================= CLOCK ================= */
  const clock = $("#clock");
  const tick = () => (clock.textContent = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }));
  tick();
  setInterval(tick, 15000);

  /* ================= SEARCH (Ctrl/Cmd + K) ================= */
  const D = App.data;
  const entries = () => [
    ...NAV.flatMap(s => [
      { hash: s.id, text: s.label, sub: "Department", icon: s.icon },
      ...s.pages.map(p => ({ hash: `${s.id}/${p.id}`, text: p.label, sub: s.label, icon: s.icon })),
    ]),
    ...D.opps.map(o => ({ hash: `sales/opportunities?open=${o.id}`, text: o.title, sub: `Opportunity · ${D.customer(o.customerId).name}`, icon: "sales" })),
    ...D.customers.map(c => ({ hash: `sales/customers?open=${c.id}`, text: c.name, sub: `Customer · ${c.country}`, icon: "user" })),
    ...D.projects.map(p => ({ hash: `project-management/projects?open=${p.code}`, text: p.name, sub: `Project · ${p.code}`, icon: "projects" })),
  ];
  const palette = $("#palette"), pInput = $("#palette-input"), pList = $("#palette-list");
  let sel = 0, results = [];
  function renderPalette() {
    const q = pInput.value.trim().toLowerCase();
    results = entries().filter(e => (e.text + " " + e.sub).toLowerCase().includes(q)).slice(0, q ? 30 : 12);
    sel = Math.min(sel, Math.max(results.length - 1, 0));
    pList.innerHTML = results.length
      ? results.map((e, i) => `<li data-i="${i}" class="${i === sel ? "sel" : ""}">${U.icon(e.icon, 15)}<span>${U.esc(e.text)}<small>${U.esc(e.sub)}</small></span></li>`).join("")
      : `<li class="none">No matches</li>`;
    pList.querySelector(".sel")?.scrollIntoView({ block: "nearest" });
  }
  function openPalette() { palette.classList.add("open"); pInput.value = ""; sel = 0; renderPalette(); setTimeout(() => pInput.focus(), 50); }
  function closePalette() { palette.classList.remove("open"); }
  function pick(e) { closePalette(); App.go(e.hash); }
  $("#search-btn").addEventListener("click", openPalette);
  palette.addEventListener("click", e => { if (e.target === palette) closePalette(); });
  pInput.addEventListener("input", () => { sel = 0; renderPalette(); });
  pList.addEventListener("click", e => { const li = e.target.closest("li[data-i]"); if (li) pick(results[+li.dataset.i]); });
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

  /* ================= START ================= */
  addEventListener("resize", () => { movePill(activeTabEl(), true); moveSubLine(true); });
  addEventListener("hashchange", () => go(parseHash()));
  addEventListener("popstate", () => go(parseHash()));
  go(parseHash(), false);
  pageEl.classList.add("in");
  document.fonts?.ready.then(() => { movePill(activeTabEl(), true); moveSubLine(true); });
})();
