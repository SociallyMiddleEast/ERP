/* Project Management → Timeline   (#project-management/timeline)
   Gantt chart of every project and its phases. The red line is today. */
App.page("project-management/timeline", {
  title: "Timeline",
  subtitle: "Every project and its phases. The red line marks today — click a row for details.",

  render(root) {
    const U = App.ui, D = App.data, Ch = App.charts;
    const starts = D.projects.map(p => p.start).sort(), ends = D.projects.map(p => p.end).sort();
    const from = D.iso(new Date(+U.parse(starts[0]) - 7 * 864e5));
    const to = D.iso(new Date(+U.parse(ends[ends.length - 1]) + 14 * 864e5));
    let sort = "start";

    root.innerHTML = `
      ${U.card({
        title: "Project phases",
        sub: `${U.dateY(from)} → ${U.dateY(to)}`,
        actions: U.seg([["start", "By start"], ["end", "By finish"], ["status", "By status"]], "start", "sort"),
        body: `<div class="legend" style="margin-bottom:14px">${D.phases.map(ph => `<span class="t-${ph.tone}"><i></i>${ph.label}</span>`).join("")}<span><i style="background:var(--danger)"></i>Today</span></div>
               <div class="gantt-scroll"><div id="gantt"></div></div>`,
      })}
      <div class="grid cols-3 mt">
        ${D.phases.slice(0, 3).map(ph => {
          const now = D.projects.filter(p => {
            const len = U.parse(p.end) - U.parse(p.start), a = +U.parse(p.start) + len * ph.from, b = +U.parse(p.start) + len * ph.to, t = +U.parse(D.today);
            return t >= a && t <= b;
          });
          return U.card({ title: `In ${ph.label.toLowerCase()} now`, sub: `${now.length} project${now.length === 1 ? "" : "s"}`,
            body: `<div class="list">${now.map(p => `<div class="li clickable" data-p="${p.code}"><span class="li-icon t-${ph.tone}">${U.icon("projects", 15)}</span><div class="li-main"><div class="li-title">${U.esc(p.name)}</div><div class="li-sub">${p.code} · ${p.pm}</div></div></div>`).join("") || U.empty("None right now.")}</div>` });
        }).join("")}
      </div>`;

    const order = { "Delayed": 0, "At risk": 1, "On track": 2 };
    const draw = () => {
      const list = [...D.projects].sort((a, b) => sort === "status" ? order[a.status] - order[b.status] : a[sort].localeCompare(b[sort]));
      U.redraw(root, "#gantt", el => Ch.gantt(el, {
        from, to,
        rows: list.map(p => {
          const s = +U.parse(p.start), len = U.parse(p.end) - s;
          return {
            id: p.code, label: p.name, sub: `${p.code} · ${p.progress}% · ${p.status}`,
            segments: D.phases.map(ph => ({ start: D.iso(new Date(s + len * ph.from)), end: D.iso(new Date(s + len * ph.to)), tone: ph.tone, label: ph.label })),
          };
        }),
      }));
    };
    U.onSeg(root, "sort", v => { sort = v; draw(); });
    root.addEventListener("click", e => { const r = e.target.closest("[data-id], [data-p]"); if (r) App.go(`project-management/projects?open=${r.dataset.id || r.dataset.p}`); });
    draw();
  },
});
