/* Home → Engineering & purchasing cost dashboard   (#home/eng-purchasing-cost) */
App.page("home/eng-purchasing-cost", {
  title: "Engineering & purchasing cost",
  subtitle() {
    const U = App.ui, D = App.data;
    const over = D.projects.filter(p => App.data.forecast(p).total > p.budget.eng + p.budget.purchasing).length;
    return `Where project money goes, compared with budget. <b>${over} project${over === 1 ? "" : "s"}</b> forecast to finish over budget.`;
  },
  actions: () => `<a class="btn" href="#purchasing/purchase-orders">${App.ui.icon("purchasing", 15)} Purchase orders</a>`,

  render(root) {
    const U = App.ui, D = App.data, Ch = App.charts;
    const m = new Date().getMonth();
    const ytd = arr => U.sum(arr.slice(11 - m));
    const engYTD = ytd(D.costMonthly.eng), purYTD = ytd(D.costMonthly.purchasing);
    const engBudget = U.sum(D.projects, p => p.budget.eng), purBudget = U.sum(D.projects, p => p.budget.purchasing);
    const openPOs = D.pos.filter(p => p.status !== "Received" && p.status !== "Draft");
    const committed = U.sum(openPOs, p => p.value);
    const overList = D.projects.filter(p => App.data.forecast(p).total > p.budget.eng + p.budget.purchasing);

    const engByDisc = { mechanical: 0, electrical: 0, digital: 0 };
    D.deliverables.forEach(d => (engByDisc[d.discipline] += d.hours * 65));
    const purCats = {};
    D.pos.forEach(po => { const c = D.supplier(po.supplierId).category; purCats[c] = (purCats[c] || 0) + po.value; });
    const topCats = Object.entries(purCats).sort((a, b) => b[1] - a[1]);
    const supSpend = D.suppliers.map(s => ({ s, v: U.sum(D.pos.filter(p => p.supplierId === s.id), p => p.value) })).sort((a, b) => b.v - a.v).slice(0, 6);

    root.innerHTML = `
      <div class="grid cols-4">
        ${U.stat({ label: "Engineering cost YTD", icon: "engineering", tone: "violet", value: U.compact(engYTD), foot: `budget ${U.compact(engBudget)}`, trend: D.costMonthly.eng })}
        ${U.stat({ label: "Purchasing spend YTD", icon: "purchasing", tone: "amber", value: U.compact(purYTD), foot: `budget ${U.compact(purBudget)}`, trend: D.costMonthly.purchasing })}
        ${U.stat({ label: "Committed in open POs", icon: "truck", tone: "blue", value: U.compact(committed), foot: `${openPOs.length} purchase orders`, href: "#purchasing/purchase-orders" })}
        ${U.stat({ label: "Projects over budget", icon: "alert", tone: overList.length ? "red" : "green", value: overList.length, foot: `of ${D.projects.length} active projects`, href: "#project-management/projects" })}
      </div>

      <div class="grid split mt">
        ${U.card({
          title: "Monthly cost", sub: "Engineering hours and purchasing spend · last 12 months",
          actions: U.seg([["stack", "Stacked"], ["side", "Side by side"]], "stack", "mode"),
          body: `<div id="cost-chart"></div><div class="legend mt"><span class="t-violet"><i></i>Engineering</span><span class="t-amber"><i></i>Purchasing</span></div>`,
        })}
        ${U.card({ title: "Where it goes", sub: "Engineering by discipline and purchasing by category", body: `<div id="cost-donut"></div>` })}
      </div>

      ${U.card({ cls: "mt", title: "Budget vs actual by project", sub: "Forecast = spent so far, projected to 100% progress. Click a project for details.", body: `<div id="cost-table"></div>` })}

      <div class="grid cols-2 mt">
        ${U.card({ title: "Top suppliers", sub: "Spend in purchase orders", actions: `<a class="link" href="#purchasing/suppliers">All suppliers ${U.icon("arrow", 14)}</a>`, body: `<div id="cost-sup"></div>` })}
        ${U.card({ title: "Engineering hours by discipline", sub: "Estimated hours on current deliverables", body: `<div id="cost-hours"></div>` })}
      </div>`;

    const drawBars = mode => U.redraw(root, "#cost-chart", el => Ch.bars(el, {
      labels: D.months, stacked: mode === "stack", height: 270,
      series: [{ name: "Engineering", values: D.costMonthly.eng, color: "var(--c5)" }, { name: "Purchasing", values: D.costMonthly.purchasing, color: "var(--c2)" }],
    }));
    drawBars("stack");
    U.onSeg(root, "mode", drawBars);

    Ch.donut(root.querySelector("#cost-donut"), {
      size: 168,
      items: [
        { label: "Mechanical eng.", value: engByDisc.mechanical, color: "var(--c5)" },
        { label: "Electrical eng.", value: engByDisc.electrical, color: "var(--c3)" },
        { label: "Digital eng.", value: engByDisc.digital, color: "var(--c1)" },
        ...topCats.slice(0, 3).map(([c, v], i) => ({ label: c, value: v, color: ["var(--c2)", "var(--c4)", "var(--c6)"][i] })),
      ],
    });

    U.table(root.querySelector("#cost-table"), {
      rows: D.projects, search: p => `${p.code} ${p.name} ${D.customer(p.customerId).name}`,
      placeholder: "Search projects…", sortKey: "variance", sortDir: -1,
      filters: [{ key: "status", label: "Status", options: ["On track", "At risk", "Delayed"] }],
      rowClass: p => (App.data.forecast(p).total > p.budget.eng + p.budget.purchasing ? "warn" : ""),
      columns: [
        { key: "name", label: "Project", render: p => `<span class="cell-title">${U.esc(p.name)}</span><span class="cell-sub">${p.code} · ${U.esc(D.customer(p.customerId).name)}</span>` },
        { key: "progress", label: "Progress", render: p => `<div style="width:110px">${U.progress(p.progress)}<span class="cell-sub">${p.progress}% done</span></div>` },
        { key: "eng", label: "Engineering", align: "right", sort: p => p.actual.eng, render: p => `${U.compact(p.actual.eng)}<span class="cell-sub">of ${U.compact(p.budget.eng)}</span>` },
        { key: "pur", label: "Purchasing", align: "right", sort: p => p.actual.purchasing, render: p => `${U.compact(p.actual.purchasing)}<span class="cell-sub">of ${U.compact(p.budget.purchasing)}</span>` },
        { key: "forecast", label: "Forecast", align: "right", sort: p => App.data.forecast(p).total, render: p => U.compact(App.data.forecast(p).total) },
        { key: "variance", label: "Variance", align: "right", sort: p => App.data.forecast(p).variance, render: p => { const v = App.data.forecast(p).variance; return U.badge(`${v > 0 ? "+" : ""}${v}%`, v > 5 ? "red" : v > 0 ? "amber" : "green"); } },
        { key: "status", label: "Status", render: p => U.badge(p.status, D.statusTone[p.status], true) },
      ],
      onRow: p => App.go(`project-management/projects?open=${p.code}`),
    });

    Ch.hbars(root.querySelector("#cost-sup"), { items: supSpend.map((x, i) => ({ label: x.s.name, sub: x.s.category, value: x.v, color: Ch.PAL[i % 6] })) });
    Ch.hbars(root.querySelector("#cost-hours"), {
      format: v => `${U.num(v)} h`,
      items: D.disciplines.map(d => ({ label: d.label, value: U.sum(D.deliverables.filter(x => x.discipline === d.id), x => x.hours), color: `var(--c${{ amber: 2, blue: 3, violet: 5 }[d.tone]})` })),
    });
  },
});
