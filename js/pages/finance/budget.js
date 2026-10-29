/* Finance → Budget   (#finance/budget) — department budgets vs actual spend this year */
App.page("finance/budget", {
  title: "Budget",
  subtitle: () => `Spending by department against this year's budget. We are ${Math.round(((new Date().getMonth() + 1) / 12) * 100)}% through the year.`,

  render(root) {
    const U = App.ui, D = App.data, Ch = App.charts;
    const B = D.budgets;
    const yearPct = ((new Date().getMonth() + 1) / 12) * 100;
    const used = b => (b.actual / b.budget) * 100;
    const pace = b => used(b) - yearPct; // positive = spending faster than the calendar
    const tot = U.sum(B, b => b.budget), act = U.sum(B, b => b.actual);

    root.innerHTML = `
      <div class="grid cols-4">
        ${U.stat({ label: "Annual budget", icon: "finance", tone: "teal", value: U.compact(tot), foot: `${B.length} departments` })}
        ${U.stat({ label: "Spent so far", icon: "out", tone: "amber", value: U.compact(act), foot: `${Math.round((act / tot) * 100)}% of budget` })}
        ${U.stat({ label: "Remaining", icon: "in", tone: "green", value: U.compact(tot - act), foot: "for the rest of the year" })}
        ${U.stat({ label: "Ahead of pace", icon: "alert", tone: "red", value: B.filter(b => pace(b) > 5).length, foot: "departments spending fast" })}
      </div>
      <div class="grid split mt">
        ${U.card({ title: "Budget used by department", sub: "The thin mark shows where spending should be at this point in the year", body: `<div id="bu-bars"></div>` })}
        ${U.card({ title: "Share of spending", body: `<div id="bu-donut"></div>` })}
      </div>
      ${U.card({ cls: "mt", title: "Details", body: `<div id="bu-table"></div>` })}`;

    Ch.hbars(root.querySelector("#bu-bars"), {
      max: 100, format: v => `${Math.round(v)}%`,
      items: B.map(b => ({ label: b.dept, sub: `${U.compact(b.actual)} of ${U.compact(b.budget)}`, value: used(b), marker: yearPct, color: pace(b) > 5 ? "var(--danger)" : pace(b) > 0 ? "var(--c2)" : "var(--c1)" })),
    });
    Ch.donut(root.querySelector("#bu-donut"), { size: 150, items: B.map((b, i) => ({ label: b.dept, value: b.actual, color: [...Ch.PAL, "var(--faint)", "var(--danger)"][i] })) });

    U.table(root.querySelector("#bu-table"), {
      rows: B, search: false, sortKey: "pace", sortDir: -1,
      columns: [
        { key: "dept", label: "Department", render: b => `<span class="cell-title">${b.dept}</span>` },
        { key: "budget", label: "Budget", align: "right", render: b => U.money(b.budget) },
        { key: "actual", label: "Spent", align: "right", render: b => U.money(b.actual) },
        { key: "left", label: "Remaining", align: "right", sort: b => b.budget - b.actual, render: b => U.money(b.budget - b.actual) },
        { key: "used", label: "Used", align: "right", sort: used, render: b => `${Math.round(used(b))}%` },
        { key: "pace", label: "Pace", sort: pace, render: b => U.badge(pace(b) > 5 ? "Spending fast" : pace(b) > 0 ? "Slightly ahead" : "On track", pace(b) > 5 ? "red" : pace(b) > 0 ? "amber" : "green", true) },
      ],
    });
  },
});
