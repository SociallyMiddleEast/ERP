/* =====================================================================
   UI BUILDING BLOCKS — small helpers every page uses.
   Most return HTML strings; table/kanban/drawer attach behaviour.
   ===================================================================== */
(function () {
  const U = (App.ui = {});
  const S = window.SETTINGS;

  /* ---------- formatting ---------- */
  U.esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const money0 = new Intl.NumberFormat(S.locale, { style: "currency", currency: S.currency, maximumFractionDigits: 0 });
  const moneyC = new Intl.NumberFormat(S.locale, { style: "currency", currency: S.currency, notation: "compact", maximumFractionDigits: 1 });
  U.money = n => money0.format(n || 0);
  U.compact = n => moneyC.format(n || 0);
  U.num = n => (n || 0).toLocaleString(S.locale);
  U.pct = n => `${Math.round(n)}%`;
  U.sum = (arr, f) => arr.reduce((a, x) => a + (f ? f(x) : x), 0);

  U.parse = s => { const [y, m, d] = String(s).split("-").map(Number); return new Date(y, m - 1, d); };
  U.days = s => Math.round((U.parse(s) - U.parse(App.data.today)) / 864e5);
  U.date = s => s ? U.parse(s).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "—";
  U.dateY = s => s ? U.parse(s).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—";
  U.rel = s => {
    const d = U.days(s);
    if (d === 0) return "today";
    if (d === 1) return "tomorrow";
    if (d === -1) return "yesterday";
    return d > 0 ? `in ${d} days` : `${-d} days ago`;
  };
  /* "in 3 days" / "2 days late" pill */
  U.dueTag = (s, { done = false } = {}) => {
    if (!s) return U.badge("No date", "gray");
    const d = U.days(s);
    if (done) return U.badge(U.date(s), "gray");
    if (d < 0) return U.badge(`${-d} day${d === -1 ? "" : "s"} late`, "red");
    if (d === 0) return U.badge("today", "amber");
    if (d <= 3) return U.badge(`in ${d} day${d === 1 ? "" : "s"}`, "amber");
    return U.badge(`in ${d} days`, "teal");
  };

  /* ---------- small pieces ---------- */
  U.icon = (name, size = 16) =>
    `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${(window.ICONS || {})[name] || ""}"/></svg>`;
  U.badge = (text, tone = "gray", dot = false) => `<span class="badge t-${tone}${dot ? " bdot" : ""}">${U.esc(text)}</span>`;
  U.hue = name => [...String(name)].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7);
  U.initials = name => String(name).split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
  U.avatar = (name, size = 28) =>
    `<span class="av" style="--h:${U.hue(name)};width:${size}px;height:${size}px;font-size:${Math.round(size * 0.38)}px" title="${U.esc(name)}">${U.initials(name)}</span>`;
  U.person = (name, sub) => `<span class="person">${U.avatar(name)}<span><b>${U.esc(name)}</b>${sub ? `<small>${U.esc(sub)}</small>` : ""}</span></span>`;
  U.progress = (p, tone = "teal") => `<div class="progress t-${tone}"><i style="--p:${Math.max(0, Math.min(100, p))}%"></i></div>`;
  U.discChips = list => `<span class="dchips">${App.data.disciplines.map(d =>
    `<span class="dchip t-${d.tone}${list.includes(d.id) ? " on" : ""}" title="${d.label}">${d.short}</span>`).join("")}</span>`;
  U.stars = r => `<span class="stars" title="${r} / 5">${[1, 2, 3, 4, 5].map(i =>
    `<i class="${r >= i ? "on" : r >= i - 0.5 ? "half" : ""}">${U.icon("star", 13)}</i>`).join("")}</span>`;
  U.empty = text => `<div class="empty">${U.icon("search", 20)}<span>${text}</span></div>`;

  /* ---------- layout pieces ---------- */
  U.card = ({ title, sub, actions = "", body = "", cls = "", id = "" }) => `
    <section class="card ${cls}" ${id ? `id="${id}"` : ""}>
      ${title ? `<div class="card-head"><div><h3 class="card-title">${title}</h3>${sub ? `<p class="card-sub">${sub}</p>` : ""}</div>${actions ? `<div class="card-actions">${actions}</div>` : ""}</div>` : ""}
      ${body}
    </section>`;

  U.spark = vals => {
    const w = 96, h = 34, mn = Math.min(...vals), mx = Math.max(...vals);
    const pts = vals.map((v, i) => [(i * w) / (vals.length - 1), h - 3 - (h - 8) * ((v - mn) / (mx - mn || 1))]);
    const d = App.charts.smooth(pts);
    return `<svg class="spark" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none"><path class="a" d="${d} L${w},${h} L0,${h}Z"/><path class="l draw" pathLength="1" d="${d}"/></svg>`;
  };

  /* KPI card like the reference: label, big number, footer, sparkline */
  U.stat = ({ label, value, icon, tone = "teal", foot = "", trend, delta, href }) => `
    <${href ? `a href="${href}"` : "div"} class="stat ${tone}">
      <div class="stat-label">${icon ? U.icon(icon, 15) : ""}<span>${label}</span></div>
      <div class="stat-value tnum" data-count>${value}</div>
      <div class="stat-foot">
        <span>${delta != null ? `<span class="delta ${delta >= 0 ? "up" : "down"}">${delta >= 0 ? "↑" : "↓"} ${Math.abs(delta)}%</span> ` : ""}${foot}</span>
        ${trend ? U.spark(trend) : ""}
      </div>
    </${href ? "a" : "div"}>`;

  /* segmented switch: U.seg([["a","Label"],…], "a", "name") then U.onSeg(root,"name",cb) */
  U.seg = (opts, active, name) =>
    `<div class="seg" data-seg="${name}">${opts.map(([v, l]) => `<button type="button" data-v="${v}" class="${v === active ? "on" : ""}">${l}</button>`).join("")}</div>`;
  U.onSeg = (root, name, cb) => {
    const el = root.querySelector(`[data-seg="${name}"]`);
    if (!el) return;
    el.addEventListener("click", e => {
      const b = e.target.closest("button");
      if (!b || b.classList.contains("on")) return;
      el.querySelectorAll("button").forEach(x => x.classList.toggle("on", x === b));
      cb(b.dataset.v);
    });
  };

  /* replace a chart host with a fresh element, then draw into it */
  U.redraw = (root, sel, draw) => {
    const old = root.querySelector(sel);
    const fresh = old.cloneNode(false);
    old.replaceWith(fresh);
    draw(fresh);
  };

  /* ---------- toast ---------- */
  let toastTimer;
  U.toast = (msg, tone = "teal") => {
    let t = document.getElementById("toast");
    if (!t) { t = document.createElement("div"); t.id = "toast"; document.body.appendChild(t); }
    t.className = `toast t-${tone}`;
    t.innerHTML = `${U.icon(tone === "red" ? "alert" : "check", 16)}<span>${msg}</span>`;
    void t.offsetWidth;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 2600);
  };

  /* ---------- side drawer (details panel) ---------- */
  let current = null;
  U.drawer = ({ title, sub = "", body = "", footer = "", onMount }) => {
    if (current) current.close(true);
    const bg = document.createElement("div");
    bg.className = "drawer-bg";
    const el = document.createElement("aside");
    el.className = "drawer";
    el.setAttribute("role", "dialog");
    el.innerHTML = `
      <div class="drawer-head"><div><h3>${title}</h3>${sub ? `<p>${sub}</p>` : ""}</div>
        <button class="icon-btn" data-close aria-label="Close">${U.icon("x", 16)}</button></div>
      <div class="drawer-body">${body}</div>
      ${footer ? `<div class="drawer-foot">${footer}</div>` : ""}`;
    document.body.append(bg, el);
    requestAnimationFrame(() => { bg.classList.add("open"); el.classList.add("open"); });
    const onKey = e => e.key === "Escape" && api.close();
    const api = {
      el,
      close(instant) {
        document.removeEventListener("keydown", onKey);
        if (current === api) current = null;
        if (instant) { bg.remove(); el.remove(); return; }
        bg.classList.remove("open"); el.classList.remove("open");
        setTimeout(() => { bg.remove(); el.remove(); }, 450);
      },
    };
    bg.addEventListener("click", () => api.close());
    el.querySelector("[data-close]").addEventListener("click", () => api.close());
    document.addEventListener("keydown", onKey);
    current = api;
    if (onMount) onMount(el, api);
    return api;
  };
  U.closeDrawer = () => current && current.close();
  U.kv = pairs => `<dl class="kv">${pairs.filter(Boolean).map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join("")}</dl>`;

  /* ---------- sortable, searchable, filterable table ----------
     U.table(el, {
       columns: [{ key, label, render(row), sort(row), align:"right" }],
       rows: array | () => array,
       search: row => "text to search",          (optional)
       filters: [{ key, label, options:[…], get(row) }],
       initial: { filterKey: value },
       sortKey, sortDir (1|-1), pageSize, onRow(row), empty, toolbar
     })                                                              */
  U.table = (el, cfg) => {
    const cols = cfg.columns, filters = cfg.filters || [];
    const st = { q: "", sortKey: cfg.sortKey || null, dir: cfg.sortDir || 1, f: { ...(cfg.initial || {}) }, page: 0 };
    el.innerHTML = `
      ${cfg.search !== false || filters.length || cfg.toolbar ? `<div class="tbl-toolbar">
        ${cfg.search !== false ? `<label class="search">${U.icon("search", 15)}<input type="search" placeholder="${cfg.placeholder || "Search…"}"></label>` : ""}
        ${filters.map(f => `<select class="input sel" data-f="${f.key}"><option value="">${f.label}: all</option>${f.options.map(o =>
          `<option value="${U.esc(o.value ?? o)}">${U.esc(o.label ?? o)}</option>`).join("")}</select>`).join("")}
        <span class="grow"></span>${cfg.toolbar || ""}
      </div>` : ""}
      <div class="tbl-wrap"><table class="tbl"><thead><tr>${cols.map(c =>
        `<th data-k="${c.key}" class="${c.align === "right" ? "num" : ""}${c.nosort ? " nosort" : ""}">${c.label}<i class="arr"></i></th>`).join("")}</tr></thead><tbody></tbody></table></div>
      <div class="tbl-foot"><span class="cnt"></span><span class="pager"></span></div>`;
    const tbody = el.querySelector("tbody"), cnt = el.querySelector(".cnt"), pager = el.querySelector(".pager");
    filters.forEach(f => { if (st.f[f.key]) el.querySelector(`[data-f="${f.key}"]`).value = st.f[f.key]; });
    let shown = [];

    const draw = () => {
      const all = typeof cfg.rows === "function" ? cfg.rows() : cfg.rows;
      let r = all.filter(row => {
        if (st.q) {
          const hay = (cfg.search ? cfg.search(row) : cols.map(c => row[c.key]).join(" ")).toLowerCase();
          if (!hay.includes(st.q)) return false;
        }
        return filters.every(f => !st.f[f.key] || String(f.get ? f.get(row) : row[f.key]) === st.f[f.key]);
      });
      if (st.sortKey) {
        const c = cols.find(c => c.key === st.sortKey);
        const g = c.sort || (row => row[c.key]);
        r = [...r].sort((a, b) => { const x = g(a), y = g(b); return (x > y ? 1 : x < y ? -1 : 0) * st.dir; });
      }
      const ps = cfg.pageSize || 10, pages = Math.max(1, Math.ceil(r.length / ps));
      st.page = Math.min(st.page, pages - 1);
      shown = r.slice(st.page * ps, st.page * ps + ps);
      tbody.innerHTML = shown.length
        ? shown.map((row, i) => `<tr style="--r:${i}" data-i="${i}" class="${cfg.onRow ? "clickable" : ""} ${cfg.rowClass ? cfg.rowClass(row) : ""}">${cols.map(c =>
            `<td class="${c.align === "right" ? "num" : ""}">${c.render ? c.render(row) : U.esc(row[c.key])}</td>`).join("")}</tr>`).join("")
        : `<tr><td colspan="${cols.length}">${U.empty(cfg.empty || "Nothing matches your search or filters.")}</td></tr>`;
      cnt.textContent = `${r.length} of ${all.length}`;
      pager.innerHTML = pages > 1
        ? `<button class="btn sm" data-p="-1" ${st.page === 0 ? "disabled" : ""}>${U.icon("left", 14)}</button><span>Page ${st.page + 1} of ${pages}</span><button class="btn sm" data-p="1" ${st.page === pages - 1 ? "disabled" : ""}>${U.icon("right", 14)}</button>`
        : "";
      el.querySelectorAll("th").forEach(th => {
        th.classList.toggle("sorted", th.dataset.k === st.sortKey);
        th.querySelector(".arr").textContent = th.dataset.k === st.sortKey ? (st.dir > 0 ? "↑" : "↓") : "";
      });
    };

    el.querySelector(".search input")?.addEventListener("input", e => { st.q = e.target.value.trim().toLowerCase(); st.page = 0; draw(); });
    el.querySelectorAll("select[data-f]").forEach(s => s.addEventListener("change", () => { st.f[s.dataset.f] = s.value; st.page = 0; draw(); }));
    el.querySelector("thead").addEventListener("click", e => {
      const th = e.target.closest("th");
      if (!th || th.classList.contains("nosort")) return;
      st.dir = st.sortKey === th.dataset.k ? -st.dir : 1;
      st.sortKey = th.dataset.k;
      draw();
    });
    pager.addEventListener("click", e => { const b = e.target.closest("[data-p]"); if (b) { st.page += +b.dataset.p; draw(); } });
    tbody.addEventListener("click", e => {
      if (e.target.closest("button, a, input, select")) return;
      const tr = e.target.closest("tr[data-i]");
      if (tr && cfg.onRow) cfg.onRow(shown[+tr.dataset.i]);
    });
    draw();
    return { refresh: draw };
  };

  /* ---------- drag & drop board ----------
     U.kanban(el, { columns:[{id,label,tone}], items, key:item=>colId,
                    card:item=>html, onMove(item,colId), onClick(item), colSum(items) }) */
  U.kanban = (el, cfg) => {
    let dragId = null;
    const items = () => (typeof cfg.items === "function" ? cfg.items() : cfg.items);
    const draw = droppedId => {
      const all = items();
      el.innerHTML = `<div class="board">${cfg.columns.map(c => {
        const its = all.filter(i => cfg.key(i) === c.id);
        return `<div class="col" data-col="${c.id}">
          <div class="col-head">${U.badge(c.label, c.tone, true)}<small>${its.length}${cfg.colSum && its.length ? ` · ${cfg.colSum(its)}` : ""}</small></div>
          ${its.map(i => `<div class="kcard${i.id === droppedId ? " dropped" : ""}" draggable="true" data-id="${i.id}">${cfg.card(i)}</div>`).join("")}
          <div class="col-drop">Drop here</div>
        </div>`;
      }).join("")}</div>`;
    };
    el.addEventListener("dragstart", e => {
      const k = e.target.closest(".kcard");
      if (!k) return;
      dragId = k.dataset.id;
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", dragId);
      requestAnimationFrame(() => k.classList.add("dragging"));
      el.querySelector(".board").classList.add("is-dragging");
    });
    el.addEventListener("dragend", () => {
      el.querySelectorAll(".dragging, .over").forEach(x => x.classList.remove("dragging", "over"));
      el.querySelector(".board")?.classList.remove("is-dragging");
    });
    el.addEventListener("dragover", e => {
      const col = e.target.closest(".col");
      if (!col || !dragId) return;
      e.preventDefault();
      el.querySelectorAll(".col.over").forEach(c => c !== col && c.classList.remove("over"));
      col.classList.add("over");
    });
    el.addEventListener("drop", e => {
      const col = e.target.closest(".col");
      if (!col || !dragId) return;
      e.preventDefault();
      const item = items().find(i => i.id === dragId);
      const id = dragId;
      dragId = null;
      if (item && cfg.key(item) !== col.dataset.col) cfg.onMove(item, col.dataset.col);
      draw(id);
    });
    el.addEventListener("click", e => {
      const k = e.target.closest(".kcard");
      if (k && cfg.onClick) cfg.onClick(items().find(i => i.id === k.dataset.id));
    });
    draw();
    return { refresh: () => draw() };
  };

  /* ---------- count-up animation for KPI numbers ---------- */
  U.countUp = root => {
    root.querySelectorAll("[data-count]").forEach(el => {
      const text = el.textContent.trim();
      const m = text.match(/-?[\d,]*\.?\d+/);
      if (!m) return;
      const target = parseFloat(m[0].replace(/,/g, ""));
      const dec = (m[0].split(".")[1] || "").length;
      const pre = text.slice(0, m.index), post = text.slice(m.index + m[0].length);
      const t0 = performance.now(), dur = 1000;
      const step = t => {
        const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
        const v = (target * e).toFixed(dec);
        el.textContent = pre + (dec ? v : Number(v).toLocaleString("en-US")) + post;
        if (k < 1) requestAnimationFrame(step);
        else el.textContent = text;
      };
      requestAnimationFrame(step);
    });
  };
})();
