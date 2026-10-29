/* Tendering → Open opportunities   (#tendering/open-opportunities)
   Every open opportunity with its tender deadline and offer checklist.  ?open=OPP-2608 */
App.page("tendering/open-opportunities", {
  title: "Open opportunities",
  subtitle: "Every open opportunity, sorted by tender deadline. Tick off the offer checklist as the team works on it.",

  render(root, ctx) {
    const U = App.ui, D = App.data, Ch = App.charts;
    const steps = D.tenderSteps;
    const open = () => D.opps.filter(D.isOpen);
    const ready = o => (o.checklist ? steps.filter(([k]) => o.checklist[k]).length : 0);
    const pct = o => Math.round((ready(o) / steps.length) * 100);
    const next = o => (steps.find(([k]) => !(o.checklist && o.checklist[k])) || [])[1];
    let filter = "all", stage = "", q = "";

    const thisWeek = open().filter(o => o.tenderDue && U.days(o.tenderDue) >= 0 && U.days(o.tenderDue) <= 7);
    const withDue = open().filter(o => o.tenderDue);
    const avgReady = Math.round(U.sum(open(), pct) / Math.max(1, open().length));

    root.innerHTML = `
      <div class="grid cols-4">
        ${U.stat({ label: "Open opportunities", icon: "tendering", tone: "violet", value: open().length, foot: U.compact(U.sum(open(), o => o.value)) + " total value" })}
        ${U.stat({ label: "With a tender date", icon: "calendar", tone: "blue", value: withDue.length, foot: `${open().length - withDue.length} not scheduled yet` })}
        ${U.stat({ label: "Due this week", icon: "clock", tone: thisWeek.length ? "coral" : "green", value: thisWeek.length, foot: thisWeek.length ? U.compact(U.sum(thisWeek, o => o.value)) + " at stake" : "nothing urgent" })}
        ${U.stat({ label: "Average offer readiness", icon: "check", tone: "teal", value: avgReady + "%", foot: "of checklist steps done" })}
      </div>
      <div class="row between mt" style="margin-bottom:14px">
        <div class="row">
          ${U.seg([["all", "All"], ["due", "Has tender date"], ["week", "Due this week"], ["none", "No date yet"]], "all", "f")}
          <select class="input sel" id="t-stage"><option value="">Stage: all</option>${D.stages.filter(s => D.isOpen({ stage: s.id })).map(s => `<option value="${s.id}">${s.label}</option>`).join("")}</select>
        </div>
        <label class="search">${U.icon("search", 15)}<input type="search" id="t-q" placeholder="Search…"></label>
      </div>
      <div class="grid cols-3" id="t-grid"></div>`;

    const grid = root.querySelector("#t-grid");
    const draw = (anim = false) => {
      const list = open().filter(o =>
        (filter === "all" || (filter === "due" && o.tenderDue) || (filter === "none" && !o.tenderDue) ||
          (filter === "week" && o.tenderDue && U.days(o.tenderDue) >= 0 && U.days(o.tenderDue) <= 7)) &&
        (!stage || o.stage === stage) &&
        (!q || `${o.title} ${D.customer(o.customerId).name} ${o.id}`.toLowerCase().includes(q))
      ).sort((a, b) => (a.tenderDue || "9999").localeCompare(b.tenderDue || "9999"));

      grid.innerHTML = list.length ? list.map((o, i) => {
        const s = D.stage(o.stage), p = pct(o);
        return `<div class="tile${anim ? " reveal" : ""}" style="--d:${Math.min(i, 12)}" data-opp="${o.id}">
          <div class="tile-head">${U.badge(s.label, s.tone, true)}${o.tenderDue ? U.dueTag(o.tenderDue) : U.badge("No tender date", "gray")}</div>
          <div class="row between" style="align-items:flex-start;flex-wrap:nowrap">
            <div style="min-width:0"><div class="tile-title">${U.esc(o.title)}</div>
              <div class="tile-sub">${U.esc(D.customer(o.customerId).name)} · ${o.id}</div></div>
            <div style="margin-top:10px">${Ch.ring(p, 52, p === 100 ? "var(--c6)" : "var(--c5)")}</div>
          </div>
          <div class="steps">${steps.map(([k, label]) => `<i class="${o.checklist && o.checklist[k] ? "on" : ""}" title="${label}"></i>`).join("")}</div>
          <div class="tile-sub">${ready(o)} of ${steps.length} steps done${next(o) ? ` · next: <span style="color:var(--text)">${next(o)}</span>` : " · ready to submit"}</div>
          <div class="tile-foot"><span class="row" style="gap:8px">${U.avatar(o.owner, 24)}${U.discChips(o.disciplines)}</span><b class="tnum" style="color:var(--text)">${U.money(o.value)}</b></div>
        </div>`;
      }).join("") : `<div class="card" style="grid-column:1/-1">${U.empty("No opportunities match.")}</div>`;
    };
    const redraw = () => draw(true);

    const openTender = o => {
      if (!o.checklist) o.checklist = Object.fromEntries(steps.map(([k]) => [k, false]));
      U.drawer({
        title: U.esc(o.title), sub: `${o.id} · ${U.esc(D.customer(o.customerId).name)} · ${U.money(o.value)}`,
        body: `
          <div class="row between"><div><div class="sec-title">Offer readiness</div><div class="big-num" id="t-pct">${pct(o)}%</div></div>${U.badge(D.stage(o.stage).label, D.stage(o.stage).tone, true)}</div>
          <div class="checklist">${steps.map(([k, label]) => `
            <label class="chk"><input type="checkbox" data-k="${k}" ${o.checklist[k] ? "checked" : ""}><span class="box">${U.icon("check", 13)}</span><span>${label}</span></label>`).join("")}</div>
          <div class="field"><label for="t-due">Tender submission date</label><input class="input" type="date" id="t-due" value="${o.tenderDue || ""}"></div>
          ${U.kv([["Owner", U.person(o.owner)], ["Disciplines", U.discChips(o.disciplines)], ["Next step", `${U.esc(o.nextAction)} · ${U.dueTag(o.nextDue)}`]])}`,
        footer: `<a class="btn" href="#sales/opportunities?open=${o.id}">Open in Sales</a><button class="btn primary" data-done>Done</button>`,
        onMount(el, api) {
          el.querySelectorAll("[data-k]").forEach(cb => cb.addEventListener("change", () => {
            o.checklist[cb.dataset.k] = cb.checked;
            el.querySelector("#t-pct").textContent = pct(o) + "%";
            App.save("opps");
            draw();
            if (pct(o) === 100) U.toast("Offer complete — ready to submit");
          }));
          el.querySelector("#t-due").addEventListener("change", e => { o.tenderDue = e.target.value || null; App.save("opps"); draw(); U.toast("Tender date saved"); });
          el.querySelector("[data-done]").addEventListener("click", () => api.close());
        },
      });
    };

    U.onSeg(root, "f", v => { filter = v; redraw(); });
    root.querySelector("#t-stage").addEventListener("change", e => { stage = e.target.value; redraw(); });
    root.querySelector("#t-q").addEventListener("input", e => { q = e.target.value.trim().toLowerCase(); draw(); });
    grid.addEventListener("click", e => { const t = e.target.closest("[data-opp]"); if (t) openTender(D.opps.find(o => o.id === t.dataset.opp)); });
    draw(true);

    if (ctx.query.open) {
      const o = D.opps.find(x => x.id === ctx.query.open);
      if (o) setTimeout(() => openTender(o), 500);
    }
  },
});
