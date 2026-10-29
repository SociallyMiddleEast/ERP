/* =====================================================================
   ROUTER — draws a registered page into <main id="page">.
   Called by nav.js whenever the URL (#section/page?x=y) changes.
   ===================================================================== */
(function () {
  const U = App.ui;
  const pageEl = document.getElementById("page");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let typeTimer;

  const typeTitle = (el, text) => {
    clearInterval(typeTimer);
    if (reduced) { el.textContent = text; return; }
    let i = 0;
    el.innerHTML = `<span class="t"></span><span class="caret"></span>`;
    const t = el.querySelector(".t");
    typeTimer = setInterval(() => {
      t.textContent = text.slice(0, ++i);
      if (i >= text.length) {
        clearInterval(typeTimer);
        setTimeout(() => el.querySelector(".caret")?.remove(), 600);
      }
    }, 34);
  };

  App.renderPage = (sec, pg, query, animate) => {
    const path = pg ? `${sec.id}/${pg.id}` : sec.id;
    const def = App.pages[path];
    const ctx = { section: sec, page: pg, query: query || {} };
    const val = v => (typeof v === "function" ? v(ctx) : v);
    U.closeDrawer();

    const title = def ? val(def.title) || (pg ? pg.label : sec.label) : pg ? pg.label : sec.label;
    const sub = def && def.subtitle ? val(def.subtitle) : sec.desc;
    const actions = def && def.actions ? val(def.actions) : "";

    pageEl.innerHTML = `
      <div class="page-head">
        <div class="page-head-text"><h1 class="page-title"></h1><p class="page-sub">${sub || ""}</p></div>
        ${actions ? `<div class="page-actions">${actions}</div>` : ""}
      </div>
      <div class="page-body"></div>`;
    const body = pageEl.querySelector(".page-body");
    const h1 = pageEl.querySelector(".page-title");

    if (def) {
      try { def.render(body, ctx); }
      catch (err) {
        console.error(err);
        body.innerHTML = `<div class="card">${U.empty("This page hit an error: " + U.esc(err.message))}</div>`;
      }
    } else {
      body.innerHTML = `<div class="card">${U.empty(`No file found for <b>${path}</b>. Create js/pages/${path}.js`)}</div>`;
    }

    // staggered entrance for cards
    body.querySelectorAll(".stat, .card, .tile").forEach((c, i) => {
      c.classList.add("reveal");
      c.style.setProperty("--d", Math.min(i, 14));
    });

    pageEl.classList.remove("out", "in");
    if (animate) {
      void pageEl.offsetWidth;
      pageEl.classList.add("in");
      typeTitle(h1, title);
      U.countUp(body);
    } else {
      h1.textContent = title;
    }
  };
})();
