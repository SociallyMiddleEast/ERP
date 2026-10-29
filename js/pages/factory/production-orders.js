/* Factory → Production orders   (#factory/production-orders) */
App.page("factory/production-orders", {
  title: "Production orders",
  subtitle: "Work orders on the shop floor: what is being built, where, and when it is due.",
  actions: () => `<a class="btn" href="#factory/work-centers">${App.ui.icon("gauge", 15)} Work centers</a>`,

  render(root) {
    const U = App.ui, D = App.data;
    const wc = id => D.workCenters.find(w => w.id === id);
    const stTone = { Planned: "gray", "In progress": "blue", "On hold": "amber", Done: "green" };
    const W = D.workOrders;
    const active = W.filter(w => w.status === "In progress");
    const dueWeek = W.filter(w => w.status !== "Done" && U.days(w.due) >= 0 && U.days(w.due) <= 7);
    const late = W.filter(w => w.status !== "Done" && U.days(w.due) < 0);

    root.innerHTML = `
      <div class="grid cols-4">
        ${U.stat({ label: "In progress", icon: "factory", tone: "blue", value: active.length, foot: `${W.length} orders in total`, trend: [5, 6, 8, 7, 9, 8, active.length] })}
        ${U.stat({ label: "Due this week", icon: "calendar", tone: "amber", value: dueWeek.length, foot: "to finish by Sunday" })}
        ${U.stat({ label: "Late", icon: "alert", tone: late.length ? "red" : "green", value: late.length, foot: late.length ? "past due date" : "all on time" })}
        ${U.stat({ label: "On hold", icon: "clock", tone: "coral", value: W.filter(w => w.status === "On hold").length, foot: "waiting for material or info" })}
      </div>
      ${U.card({ cls: "mt", title: "All work orders", sub: "Click an order for details", body: `<div id="wo-table"></div>` })}`;

    U.table(root.querySelector("#wo-table"), {
      rows: W, placeholder: "Search order, product, project…",
      search: w => `${w.id} ${w.product} ${w.project} ${D.project(w.project).name}`,
      filters: [
        { key: "status", label: "Status", options: Object.keys(stTone) },
        { key: "center", label: "Work center", options: D.workCenters.map(w => ({ value: w.id, label: w.name })) },
      ],
      sortKey: "due",
      rowClass: w => (w.status !== "Done" && U.days(w.due) < 0 ? "warn" : ""),
      columns: [
        { key: "id", label: "Order", render: w => `<span class="strong">${w.id}</span>` },
        { key: "product", label: "Product", render: w => `<span class="cell-title">${w.product} × ${w.qty}</span><span class="cell-sub">${U.esc(D.project(w.project).name)}</span>` },
        { key: "center", label: "Work center", render: w => wc(w.center).name },
        { key: "progress", label: "Progress", render: w => `<div style="width:120px">${U.progress(w.progress, stTone[w.status])}<span class="cell-sub">${w.progress}%</span></div>` },
        { key: "status", label: "Status", render: w => U.badge(w.status, stTone[w.status], true) },
        { key: "start", label: "Start", render: w => U.date(w.start) },
        { key: "due", label: "Due", render: w => U.dueTag(w.due, { done: w.status === "Done" }) },
      ],
      onRow: w => U.drawer({
        title: `${w.id} · ${w.product}`, sub: `${U.esc(D.project(w.project).name)} · ${w.project}`,
        body: `<div class="row between"><div><div class="sec-title">Progress</div><div class="big-num">${w.progress}%</div></div>${U.badge(w.status, stTone[w.status], true)}</div>
               ${U.progress(w.progress, stTone[w.status])}
               ${U.kv([["Quantity", w.qty], ["Work center", wc(w.center).name], ["Start", U.dateY(w.start)], ["Due", `${U.dateY(w.due)} · ${U.dueTag(w.due, { done: w.status === "Done" })}`]])}
               <div><div class="sec-title">Inspections</div><div class="list">${D.inspections.filter(i => i.wo === w.id).map(i => `<div class="li"><div class="li-main"><div class="li-title">${i.type} inspection</div><div class="li-sub">${i.id} · ${i.inspector} · ${U.date(i.date)}</div></div>${U.badge(i.result, { Pass: "green", Fail: "red", Pending: "amber" }[i.result])}</div>`).join("") || '<p class="muted small">No inspections yet.</p>'}</div></div>`,
        footer: `<a class="btn" href="#factory/quality">Quality</a><a class="btn primary" href="#project-management/projects?open=${w.project}">Open project</a>`,
      }),
    });
  },
});
