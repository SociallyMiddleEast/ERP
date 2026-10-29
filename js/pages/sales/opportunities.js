/* Sales → All opportunities   (#sales/opportunities)
   Board (drag cards between stages) or list view.
   URL options: ?stage=won  ?view=list  ?open=OPP-2601                     */
App.page("sales/opportunities", {
  title: "All opportunities",
  subtitle() {
    const U = App.ui, D = App.data, open = D.opps.filter(D.isOpen);
    return `${open.length} open · ${U.compact(U.sum(open, o => o.value))} in the pipeline · ${U.compact(U.sum(open, o => (o.value * o.probability) / 100))} weighted`;
  },
  actions: () => `<a class="btn primary" href="#sales/new-opportunity">${App.ui.icon("plus", 15)} New opportunity</a>`,

  render(root, ctx) {
    const U = App.ui, D = App.data;
    let saved = "board";
    try { saved = localStorage.getItem("socially.oppView") || "board"; } catch (e) { /* ignore */ }
    let view = ctx.query.stage || ctx.query.view === "list" ? "list" : saved;
    let q = "", owner = "";

    root.innerHTML = `
      <div class="row between" style="margin-bottom:14px">
        <div class="row">
          ${U.seg([["board", `${U.icon("board", 14)} Board`], ["list", `${U.icon("list", 14)} List`]], view, "view")}
          <label class="search board-only">${U.icon("search", 15)}<input type="search" placeholder="Search opportunities…" id="b-q"></label>
          <select class="input sel board-only" id="b-owner"><option value="">Owner: all</option>${D.team.sales.map(s => `<option>${s}</option>`).join("")}</select>
        </div>
        <div class="legend board-only"><span>Drag a card to another column to change its stage</span></div>
      </div>
      <div id="opp-view"></div>`;

    const host = root.querySelector("#opp-view");
    const openDrawer = o => App.views.opportunity(o, () => draw());
    const visible = () => D.opps.filter(o =>
      (!owner || o.owner === owner) &&
      (!q || `${o.title} ${D.customer(o.customerId).name} ${o.id}`.toLowerCase().includes(q)));

    const card = o => `
      <div class="kc-title">${U.esc(o.title)}</div>
      <div class="kc-sub">${U.esc(D.customer(o.customerId).name)}</div>
      <div class="kc-value tnum">${U.money(o.value)}</div>
      <div class="kc-foot">${U.avatar(o.owner, 24)}${U.discChips(o.disciplines)}<span>${U.date(o.expectedClose)}</span></div>`;

    const draw = () => {
      root.querySelectorAll(".board-only").forEach(el => (el.style.display = view === "board" ? "" : "none"));
      if (view === "board") {
        U.kanban(host, {
          columns: D.stages,
          items: visible,
          key: o => o.stage,
          card,
          colSum: its => U.compact(U.sum(its, o => o.value)),
          onMove(o, stage) {
            o.stage = stage;
            o.probability = D.stage(stage).prob;
            App.save("opps");
            U.toast(`${U.esc(o.title)} → ${D.stage(stage).label}`, stage === "lost" ? "red" : "teal");
          },
          onClick: openDrawer,
        });
      } else {
        U.table(host, {
          rows: () => D.opps,
          placeholder: "Search title, customer, number…",
          search: o => `${o.id} ${o.title} ${D.customer(o.customerId).name} ${o.owner}`,
          filters: [
            { key: "stage", label: "Stage", options: D.stages.map(s => ({ value: s.id, label: s.label })) },
            { key: "owner", label: "Owner", options: D.team.sales },
            { key: "customerId", label: "Customer", options: D.customers.map(c => ({ value: c.id, label: c.name })) },
          ],
          initial: ctx.query.stage ? { stage: ctx.query.stage } : {},
          sortKey: "value", sortDir: -1, pageSize: 12,
          columns: [
            { key: "title", label: "Opportunity", render: o => `<span class="cell-title">${U.esc(o.title)}</span><span class="cell-sub">${o.id} · ${U.esc(D.customer(o.customerId).name)}</span>` },
            { key: "stage", label: "Stage", sort: o => D.stages.indexOf(D.stage(o.stage)), render: o => U.badge(D.stage(o.stage).label, D.stage(o.stage).tone, true) },
            { key: "owner", label: "Owner", render: o => U.person(o.owner) },
            { key: "disciplines", label: "Scope", nosort: true, render: o => U.discChips(o.disciplines) },
            { key: "expectedClose", label: "Close", render: o => `${U.date(o.expectedClose)}<span class="cell-sub">${U.rel(o.expectedClose)}</span>` },
            { key: "probability", label: "Prob.", align: "right", render: o => `${o.probability}%` },
            { key: "value", label: "Value", align: "right", render: o => `<span class="strong">${U.money(o.value)}</span>` },
          ],
          onRow: openDrawer,
        });
      }
    };

    U.onSeg(root, "view", v => {
      view = v;
      try { localStorage.setItem("socially.oppView", v); } catch (e) { /* ignore */ }
      host.style.opacity = 0;
      setTimeout(() => { draw(); host.style.opacity = 1; }, 150);
    });
    host.style.transition = "opacity .15s";
    root.querySelector("#b-q").addEventListener("input", e => { q = e.target.value.trim().toLowerCase(); draw(); });
    root.querySelector("#b-owner").addEventListener("change", e => { owner = e.target.value; draw(); });
    draw();

    if (ctx.query.open) {
      const o = D.opps.find(x => x.id === ctx.query.open);
      if (o) setTimeout(() => openDrawer(o), 500);
    }
  },
});
