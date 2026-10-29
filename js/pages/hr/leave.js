/* HR → Leave   (#hr/leave) — approve or reject time off, see who is away */
App.page("hr/leave", {
  title: "Leave",
  subtitle: "Time-off requests waiting for a decision, and who is away in the next two weeks.",

  render(root) {
    const U = App.ui, D = App.data;
    const tone = { Pending: "amber", Approved: "green", Rejected: "red" };
    const typeTone = { Annual: "teal", Sick: "coral", Personal: "violet" };

    const awaySoon = () => D.leave.filter(l => l.status === "Approved" && U.days(l.to) >= 0 && U.days(l.from) <= 14).sort((a, b) => a.from.localeCompare(b.from));
    const stats = () => `
      ${U.stat({ label: "Waiting for approval", icon: "clock", tone: "amber", value: D.leave.filter(l => l.status === "Pending").length, foot: "requests" })}
      ${U.stat({ label: "Away in next 14 days", icon: "calendar", tone: "blue", value: awaySoon().length, foot: "approved leave" })}
      ${U.stat({ label: "Days requested", icon: "hr", tone: "teal", value: U.sum(D.leave, l => l.days), foot: "this period" })}
      ${U.stat({ label: "Sick days", icon: "alert", tone: "coral", value: U.sum(D.leave.filter(l => l.type === "Sick"), l => l.days), foot: "this period" })}`;

    root.innerHTML = `
      <div class="grid cols-4" id="lv-stats">${stats()}</div>
      <div class="grid split mt">
        ${U.card({ title: "Requests", sub: "Approve or reject pending requests", body: `<div id="lv-table"></div>` })}
        ${U.card({ title: "Away soon", sub: "Approved leave, next 14 days", body: `<div class="list" id="lv-away"></div>` })}
      </div>`;

    const drawAway = () => {
      root.querySelector("#lv-away").innerHTML = awaySoon().map(l => {
        const d = U.parse(l.from);
        return `<div class="li"><span class="dateblock t-${typeTone[l.type]}"><b>${d.getDate()}</b><small>${d.toLocaleDateString("en-US", { month: "short" })}</small></span>
          <div class="li-main"><div class="li-title">${l.employee}</div><div class="li-sub">${l.type} · ${l.days} day${l.days > 1 ? "s" : ""} · back ${U.date(D.iso(new Date(+U.parse(l.to) + 864e5)))}</div></div></div>`;
      }).join("") || U.empty("Nobody is away soon.");
    };

    const table = U.table(root.querySelector("#lv-table"), {
      rows: () => D.leave, search: l => `${l.employee} ${l.department} ${l.type}`, placeholder: "Search people…",
      filters: [{ key: "status", label: "Status", options: ["Pending", "Approved", "Rejected"] }, { key: "type", label: "Type", options: ["Annual", "Sick", "Personal"] }],
      sortKey: "status",
      columns: [
        { key: "employee", label: "Employee", render: l => U.person(l.employee, l.department) },
        { key: "type", label: "Type", render: l => U.badge(l.type, typeTone[l.type]) },
        { key: "from", label: "Dates", render: l => `${U.date(l.from)} → ${U.date(l.to)}<span class="cell-sub">${l.days} day${l.days > 1 ? "s" : ""}</span>` },
        { key: "status", label: "Status", sort: l => ["Pending", "Approved", "Rejected"].indexOf(l.status), render: l => l.status === "Pending"
          ? `<span class="row" style="gap:6px;flex-wrap:nowrap"><button class="btn sm ok" data-id="${l.id}" data-a="Approved">${U.icon("check", 13)} Approve</button><button class="btn sm no" data-id="${l.id}" data-a="Rejected">${U.icon("x", 13)}</button></span>`
          : U.badge(l.status, tone[l.status], true) },
      ],
    });

    root.querySelector("#lv-table").addEventListener("click", e => {
      const b = e.target.closest("[data-a]");
      if (!b) return;
      const l = D.leave.find(x => x.id === b.dataset.id);
      l.status = b.dataset.a;
      App.save("leave");
      table.refresh(); drawAway();
      root.querySelector("#lv-stats").innerHTML = stats();
      U.toast(`${l.employee.split(" ")[0]}'s leave ${l.status.toLowerCase()}`, l.status === "Approved" ? "green" : "red");
    });
    drawAway();
  },
});
