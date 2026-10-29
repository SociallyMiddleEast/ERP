/* Project Management → Projects   (#project-management/projects)   ?open=PRJ-2401 */
App.page("project-management/projects", {
  title: "Projects",
  subtitle() {
    const D = App.data;
    return `${D.projects.length} active projects worth ${App.ui.compact(App.ui.sum(D.projects, p => p.value))} in contract value.`;
  },
  actions: () => `<a class="btn" href="#project-management/timeline">${App.ui.icon("calendar", 15)} Timeline</a>`,

  render(root, ctx) {
    const U = App.ui, D = App.data, Ch = App.charts;
    const count = s => D.projects.filter(p => p.status === s).length;
    let filter = "all";

    root.innerHTML = `
      <div class="grid cols-4">
        ${U.stat({ label: "Active projects", icon: "projects", tone: "teal", value: D.projects.length, foot: U.compact(U.sum(D.projects, p => p.value)) + " contract value" })}
        ${U.stat({ label: "On track", icon: "check", tone: "green", value: count("On track"), foot: "within budget" })}
        ${U.stat({ label: "At risk", icon: "alert", tone: "amber", value: count("At risk"), foot: "slightly over forecast" })}
        ${U.stat({ label: "Delayed / over budget", icon: "clock", tone: "red", value: count("Delayed"), foot: "need attention" })}
      </div>
      <div class="row between mt" style="margin-bottom:14px">
        ${U.seg([["all", "All"], ["On track", "On track"], ["At risk", "At risk"], ["Delayed", "Delayed"]], "all", "f")}
        <span class="muted small">Click a project for budget and phase details</span>
      </div>
      <div class="grid cols-3" id="pj-grid"></div>`;

    const grid = root.querySelector("#pj-grid");
    const draw = anim => {
      const list = D.projects.filter(p => filter === "all" || p.status === filter);
      grid.innerHTML = list.map((p, i) => {
        const engPct = (p.actual.eng / p.budget.eng) * 100, purPct = (p.actual.purchasing / p.budget.purchasing) * 100;
        const tone = D.statusTone[p.status];
        return `<div class="tile${anim ? " reveal" : ""}" style="--d:${i}" data-p="${p.code}">
          <div class="tile-head">${U.badge(p.status, tone, true)}<span class="muted small">${p.code}</span></div>
          <div class="row between" style="flex-wrap:nowrap;align-items:flex-start">
            <div style="min-width:0"><div class="tile-title">${U.esc(p.name)}</div><div class="tile-sub">${U.esc(D.customer(p.customerId).name)}</div></div>
            <div style="margin-top:8px">${Ch.ring(p.progress, 56, `var(--c${tone === "green" ? 6 : tone === "amber" ? 2 : 4})`)}</div>
          </div>
          <div class="mini">
            <div class="mini-row"><span>Engineering budget</span><span>${Math.round(engPct)}% used</span></div>${U.progress(engPct, engPct > 100 ? "red" : "violet")}
            <div class="mini-row" style="margin-top:4px"><span>Purchasing budget</span><span>${Math.round(purPct)}% used</span></div>${U.progress(purPct, purPct > 100 ? "red" : "amber")}
          </div>
          <div class="tile-foot"><span class="row" style="gap:8px">${U.avatar(p.pm, 24)}${p.pm.split(" ")[0]}</span><span>${U.date(p.start)} → ${U.date(p.end)}</span></div>
        </div>`;
      }).join("") || `<div class="card" style="grid-column:1/-1">${U.empty("No projects with this status.")}</div>`;
    };

    const openProject = p => {
      const f = D.forecast(p);
      const len = U.parse(p.end) - U.parse(p.start);
      const at = k => D.iso(new Date(+U.parse(p.start) + len * k));
      const tasks = D.tasks.filter(t => t.project === p.code && t.status !== "done");
      U.drawer({
        title: U.esc(p.name), sub: `${p.code} · ${U.esc(D.customer(p.customerId).name)}`,
        body: `
          <div class="row between"><div><div class="sec-title">Progress</div><div class="big-num">${p.progress}%</div></div>${U.badge(p.status, D.statusTone[p.status], true)}</div>
          ${U.progress(p.progress, D.statusTone[p.status])}
          ${U.kv([
            ["Project manager", U.person(p.pm)],
            ["Contract value", U.money(p.value)],
            ["Dates", `${U.dateY(p.start)} → ${U.dateY(p.end)}`],
            ["Engineering", `${U.money(p.actual.eng)} <span class="muted">of ${U.money(p.budget.eng)}</span>`],
            ["Purchasing", `${U.money(p.actual.purchasing)} <span class="muted">of ${U.money(p.budget.purchasing)}</span>`],
            ["Forecast at completion", `${U.money(f.total)} ${U.badge(`${f.variance > 0 ? "+" : ""}${f.variance}%`, f.variance > 8 ? "red" : f.variance > 0 ? "amber" : "green")}`],
          ])}
          <div><div class="sec-title">Phases</div><div class="list">${D.phases.map(ph => {
            const done = U.days(at(ph.to)) < 0, now = U.days(at(ph.from)) <= 0 && !done;
            return `<div class="li"><span class="li-icon t-${ph.tone}">${U.icon(done ? "check" : now ? "clock" : "calendar", 15)}</span>
              <div class="li-main"><div class="li-title">${ph.label}</div><div class="li-sub">${U.date(at(ph.from))} → ${U.date(at(ph.to))}</div></div>
              ${U.badge(done ? "Done" : now ? "In progress" : "Upcoming", done ? "green" : now ? "blue" : "gray")}</div>`;
          }).join("")}</div></div>
          <div><div class="sec-title">Open tasks (${tasks.length})</div>${tasks.length ? `<div class="list">${tasks.map(t => `<div class="li"><div class="li-main"><div class="li-title">${U.esc(t.title)}</div><div class="li-sub">${t.assignee}</div></div>${U.dueTag(t.due)}</div>`).join("")}</div>` : `<p class="muted small">No open tasks.</p>`}</div>`,
        footer: `<a class="btn" href="#project-management/tasks?project=${p.code}">Tasks</a><a class="btn primary" href="#project-management/timeline">Timeline</a>`,
      });
    };

    U.onSeg(root, "f", v => { filter = v; draw(true); });
    grid.addEventListener("click", e => { const t = e.target.closest("[data-p]"); if (t) openProject(D.project(t.dataset.p)); });
    draw(true);
    if (ctx.query.open && D.projects.some(p => p.code === ctx.query.open)) setTimeout(() => openProject(D.project(ctx.query.open)), 500);
  },
});
