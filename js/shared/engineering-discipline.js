/* =====================================================================
   ENGINEERING DISCIPLINE SCREEN — shared by
   engineering/mechanical.js, electrical.js and digital.js
   App.views.discipline(root, "mechanical" | "electrical" | "digital", ctx)
   ===================================================================== */
(function () {
  const U = App.ui, D = App.data, Ch = App.charts;

  App.views.discipline = (root, disc, ctx = {}) => {
    const info = D.disciplines.find(d => d.id === disc);
    const dels = () => D.deliverables.filter(d => d.discipline === disc);
    const team = D.engineers.filter(e => e.discipline === disc);
    const active = dels().filter(d => !["Issued"].includes(d.status));
    const booked = U.sum(team, e => e.booked), cap = U.sum(team, e => e.capacity);
    const util = Math.round((booked / cap) * 100);
    const checking = dels().filter(d => d.status === "Checking").length;
    const overdue = dels().filter(d => d.status !== "Issued" && d.status !== "Approved" && U.days(d.due) < 0).length;
    const tone = { mechanical: "amber", electrical: "blue", digital: "violet" }[disc];

    root.innerHTML = `
      <div class="grid cols-4">
        ${U.stat({ label: "Active deliverables", icon: disc, tone, value: active.length, foot: `${dels().length} in total`, trend: [8, 10, 9, 12, 11, 13, active.length] })}
        ${U.stat({ label: "Team utilization", icon: "gauge", tone: util > 100 ? "red" : "teal", value: util + "%", foot: `${booked} of ${cap} h this week`, trend: [78, 85, 82, 91, 88, 95, util] })}
        ${U.stat({ label: "Waiting for check", icon: "check", tone: "amber", value: checking, foot: "need a reviewer" })}
        ${U.stat({ label: "Overdue", icon: "alert", tone: overdue ? "red" : "green", value: overdue, foot: overdue ? "past their due date" : "nothing late" })}
      </div>

      <div class="grid split mt">
        ${U.card({ title: "Team workload", sub: "Booked hours this week against 40 h capacity", body: `<div id="dl-team"></div>` })}
        ${U.card({ title: "Deliverables by status", sub: `${dels().length} ${info.label.toLowerCase()} deliverables`, body: `<div id="dl-status"></div>` })}
      </div>

      ${U.card({ cls: "mt", title: "Deliverables register", sub: "Drawings, calculations and documents. Click a row to update its status.", body: `<div id="dl-table"></div>` })}`;

    Ch.hbars(root.querySelector("#dl-team"), {
      max: 50,
      items: team.map(e => ({
        label: U.person(e.name), value: e.booked, marker: e.capacity,
        display: `${e.booked} h`,
        color: e.booked > e.capacity ? "var(--danger)" : e.booked > 36 ? "var(--c2)" : "var(--c1)",
      })),
    });

    const drawStatus = () => Ch.donut(root.querySelector("#dl-status"), {
      size: 160, format: v => v,
      items: D.delStatuses.map((s, i) => ({ label: s, value: dels().filter(d => d.status === s).length, color: ["var(--faint)", "var(--c3)", "var(--c2)", "var(--c1)", "var(--c6)"][i] })),
      center: { value: dels().length, label: "deliverables" },
    });
    drawStatus();

    const table = U.table(root.querySelector("#dl-table"), {
      rows: dels,
      placeholder: "Search number, title, engineer…",
      search: d => `${d.id} ${d.title} ${d.engineer} ${d.project}`,
      filters: [
        { key: "status", label: "Status", options: D.delStatuses },
        { key: "engineer", label: "Engineer", options: D.team[disc] },
        { key: "project", label: "Project", options: [...new Set(dels().map(d => d.project))].sort() },
      ],
      initial: ctx.query && ctx.query.status ? { status: ctx.query.status } : {},
      sortKey: "due",
      columns: [
        { key: "id", label: "Number", render: d => `<span class="strong">${d.id}</span>` },
        { key: "title", label: "Deliverable", render: d => `<span class="cell-title">${U.esc(d.type)}</span><span class="cell-sub">${U.esc(D.project(d.project).name)} · ${d.project}</span>` },
        { key: "engineer", label: "Engineer", render: d => U.person(d.engineer) },
        { key: "rev", label: "Rev", render: d => `<span class="badge t-gray">${d.rev}</span>` },
        { key: "status", label: "Status", render: d => U.badge(d.status, D.delTone[d.status], true), sort: d => D.delStatuses.indexOf(d.status) },
        { key: "hours", label: "Hours", align: "right", render: d => `${d.hours} h` },
        { key: "due", label: "Due", render: d => U.dueTag(d.due, { done: d.status === "Issued" || d.status === "Approved" }) },
      ],
      onRow: d => U.drawer({
        title: `${d.id} · ${U.esc(d.type)}`,
        sub: `${U.esc(D.project(d.project).name)} · ${d.project}`,
        body: `
          <div class="field"><label for="del-st">Status</label>
            <select class="input" id="del-st">${D.delStatuses.map(s => `<option ${s === d.status ? "selected" : ""}>${s}</option>`).join("")}</select></div>
          ${U.kv([
            ["Engineer", U.person(d.engineer, info.label + " engineering")],
            ["Revision", d.rev],
            ["Estimated hours", `${d.hours} h`],
            ["Due", `${U.dateY(d.due)} · ${U.dueTag(d.due)}`],
            ["Project", `${U.esc(D.project(d.project).name)} <span class="muted">(${d.project})</span>`],
          ])}`,
        footer: `<a class="btn" href="#project-management/projects?open=${d.project}">Open project</a>`,
        onMount(el, api) {
          el.querySelector("#del-st").addEventListener("change", e => {
            d.status = e.target.value;
            App.save("deliverables");
            U.toast(`${d.id} is now “${d.status}”`);
            api.close();
            table.refresh();
            drawStatus();
          });
        },
      }),
    });
  };
})();
