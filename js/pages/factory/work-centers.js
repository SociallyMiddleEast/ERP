/* Factory → Work centers   (#factory/work-centers) — workshop load this week */
App.page("factory/work-centers", {
  title: "Work centers",
  subtitle: "How loaded each part of the workshop is this week.",

  render(root) {
    const U = App.ui, D = App.data, Ch = App.charts;
    const load = w => Math.round((w.planned / w.hours) * 100);
    const tone = l => (l > 100 ? "red" : l > 85 ? "amber" : "teal");
    const color = l => (l > 100 ? "var(--danger)" : l > 85 ? "var(--c2)" : "var(--c1)");
    const total = U.sum(D.workCenters, w => w.planned), cap = U.sum(D.workCenters, w => w.hours);
    const busiest = [...D.workCenters].sort((a, b) => load(b) - load(a))[0];

    root.innerHTML = `
      <div class="grid cols-4">
        ${U.stat({ label: "Workshop load", icon: "gauge", tone: tone(Math.round((total / cap) * 100)), value: Math.round((total / cap) * 100) + "%", foot: `${total} of ${cap} h planned` })}
        ${U.stat({ label: "Busiest center", icon: "factory", tone: "coral", value: busiest.name, foot: `${load(busiest)}% loaded` })}
        ${U.stat({ label: "Operators on shift", icon: "hr", tone: "blue", value: U.sum(D.workCenters, w => w.operators), foot: "across 6 work centers" })}
        ${U.stat({ label: "Overloaded", icon: "alert", tone: D.workCenters.some(w => load(w) > 100) ? "red" : "green", value: D.workCenters.filter(w => load(w) > 100).length, foot: "centers above 100%" })}
      </div>
      <div class="grid cols-3 mt">
        ${D.workCenters.map(w => {
          const jobs = D.workOrders.filter(o => o.center === w.id && o.status !== "Done");
          const now = jobs.find(o => o.status === "In progress");
          return `<div class="tile" data-wc="${w.id}">
            <div class="row between" style="flex-wrap:nowrap">
              <div><div class="tile-title" style="margin-top:0">${w.name}</div><div class="tile-sub">${w.operators} operators · ${w.hours} h capacity</div></div>
              ${Ch.ring(load(w), 60, color(load(w)))}
            </div>
            <div class="mini">
              <div class="mini-row"><span>Now working on</span><span style="color:var(--text)">${now ? `${now.product} · ${now.id}` : "Nothing"}</span></div>
              <div class="mini-row"><span>Queue</span><span>${jobs.length} order${jobs.length === 1 ? "" : "s"}</span></div>
            </div>
            <div class="tile-foot"><span>${w.planned} h planned</span>${U.badge(load(w) > 100 ? "Overloaded" : load(w) > 85 ? "Busy" : "Has room", tone(load(w)), true)}</div>
          </div>`;
        }).join("")}
      </div>
      ${U.card({ cls: "mt", title: "Planned hours vs capacity", sub: "This week, per work center", body: `<div id="wc-bars"></div><div class="legend mt"><span class="t-teal"><i></i>Planned</span><span class="t-gray"><i></i>Capacity</span></div>` })}`;

    Ch.bars(root.querySelector("#wc-bars"), {
      labels: D.workCenters.map(w => w.name.split(" ")[0]), height: 240, format: v => `${Math.round(v)} h`,
      series: [{ name: "Planned", values: D.workCenters.map(w => w.planned), color: "var(--c1)" }, { name: "Capacity", values: D.workCenters.map(w => w.hours), color: "var(--hover-strong)" }],
    });

    root.addEventListener("click", e => {
      const t = e.target.closest("[data-wc]");
      if (!t) return;
      const w = D.workCenters.find(x => x.id === t.dataset.wc);
      const jobs = D.workOrders.filter(o => o.center === w.id);
      U.drawer({
        title: w.name, sub: `${w.operators} operators · ${load(w)}% loaded this week`,
        body: `${U.progress(load(w), tone(load(w)))}
          <div><div class="sec-title">Orders (${jobs.length})</div><div class="list">${jobs.map(o => `<div class="li"><div class="li-main"><div class="li-title">${o.id} · ${o.product} × ${o.qty}</div><div class="li-sub">${U.esc(D.project(o.project).name)}</div></div>${U.badge(o.status, { Planned: "gray", "In progress": "blue", "On hold": "amber", Done: "green" }[o.status])}</div>`).join("") || U.empty("No orders.")}</div></div>`,
        footer: `<a class="btn primary" href="#factory/production-orders">All production orders</a>`,
      });
    });
  },
});
