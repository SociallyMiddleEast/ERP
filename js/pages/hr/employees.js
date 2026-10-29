/* HR → Employees   (#hr/employees) — company directory */
App.page("hr/employees", {
  title: "Employees",
  subtitle: () => `${App.data.employees.length} people in ${App.data.departments.length} departments.`,

  render(root) {
    const U = App.ui, D = App.data, Ch = App.charts;
    const E = D.employees;
    const sTone = { Active: "green", Remote: "blue", "On leave": "amber" };
    let dept = "", q = "";

    root.innerHTML = `
      <div class="grid cols-4">
        ${U.stat({ label: "Headcount", icon: "hr", tone: "teal", value: E.length, foot: `${D.departments.length} departments` })}
        ${U.stat({ label: "In today", icon: "check", tone: "green", value: E.filter(e => e.status === "Active").length, foot: `${E.filter(e => e.status === "Remote").length} remote` })}
        ${U.stat({ label: "On leave", icon: "calendar", tone: "amber", value: E.filter(e => e.status === "On leave").length, foot: "today", href: "#hr/leave" })}
        ${U.stat({ label: "Joined this year", icon: "plus", tone: "blue", value: E.filter(e => e.joined === new Date().getFullYear()).length, foot: "new colleagues" })}
      </div>
      <div class="grid split mt">
        <div>
          <div class="row" style="margin-bottom:12px">
            <label class="search">${U.icon("search", 15)}<input type="search" id="e-q" placeholder="Search name or role…"></label>
            <select class="input sel" id="e-d"><option value="">All departments</option>${D.departments.map(d => `<option>${d}</option>`).join("")}</select>
          </div>
          <div class="people" id="e-grid"></div>
        </div>
        ${U.card({ title: "By department", body: `<div id="e-dept"></div>` })}
      </div>`;

    Ch.donut(root.querySelector("#e-dept"), {
      size: 150, format: v => v, center: { value: E.length, label: "people" },
      items: D.departments.map((d, i) => ({ label: d, value: E.filter(e => e.department === d).length, color: [...Ch.PAL, "var(--faint)", "var(--danger)"][i] })),
    });

    const draw = () => {
      const list = E.filter(e => (!dept || e.department === dept) && (!q || `${e.name} ${e.role}`.toLowerCase().includes(q)));
      root.querySelector("#e-grid").innerHTML = list.map((e, i) => `
        <div class="pcard" data-e="${E.indexOf(e)}" style="animation:rise .45s both ${Math.min(i, 16) * 25}ms">
          ${U.avatar(e.name, 42)}
          <div style="min-width:0"><b class="clip">${U.esc(e.name)}</b><small class="clip">${U.esc(e.role)}</small>
            <small><span class="status-dot t-${sTone[e.status]}"></span>${e.status} · ${e.department}</small></div>
        </div>`).join("") || `<div class="card">${U.empty("Nobody matches.")}</div>`;
    };
    root.querySelector("#e-q").addEventListener("input", e => { q = e.target.value.trim().toLowerCase(); draw(); });
    root.querySelector("#e-d").addEventListener("change", e => { dept = e.target.value; draw(); });
    root.querySelector("#e-grid").addEventListener("click", e => {
      const c = e.target.closest("[data-e]");
      if (!c) return;
      const p = E[+c.dataset.e];
      const leave = D.leave.filter(l => l.employee === p.name);
      U.drawer({
        title: U.esc(p.name), sub: `${U.esc(p.role)} · ${p.department}`,
        body: `<div class="row">${U.avatar(p.name, 64)}<div>${U.badge(p.status, sTone[p.status], true)}<p class="muted small" style="margin-top:6px">With the company since ${p.joined}</p></div></div>
          ${U.kv([["Department", p.department], ["Role", U.esc(p.role)], ["Phone", p.phone], ["Email", `${p.name.split(" ")[0].toLowerCase()}@company.example`]])}
          <div><div class="sec-title">Leave</div>${leave.length ? `<div class="list">${leave.map(l => `<div class="li"><div class="li-main"><div class="li-title">${l.type} leave · ${l.days} day${l.days > 1 ? "s" : ""}</div><div class="li-sub">${U.date(l.from)} → ${U.date(l.to)}</div></div>${U.badge(l.status, { Pending: "amber", Approved: "green", Rejected: "red" }[l.status])}</div>`).join("")}</div>` : '<p class="muted small">No leave requests.</p>'}</div>`,
        footer: `<a class="btn primary" href="#hr/leave">Leave requests</a>`,
      });
    });
    draw();
  },
});
