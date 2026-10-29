/* Factory → Quality   (#factory/quality) — inspections and non-conformance reports (NCRs) */
App.page("factory/quality", {
  title: "Quality",
  subtitle: "Inspections, first-pass yield and open non-conformance reports (NCRs).",

  render(root) {
    const U = App.ui, D = App.data, Ch = App.charts;
    const I = D.inspections;
    const fails = I.filter(i => i.result === "Fail").length;
    const openN = D.ncrs.filter(n => n.status !== "Closed");
    const resTone = { Pass: "green", Fail: "red", Pending: "amber" };

    root.innerHTML = `
      <div class="grid cols-4">
        ${U.stat({ label: "First-pass yield", icon: "check", tone: "green", value: D.fpy[11] + "%", delta: Math.round((D.fpy[11] - D.fpy[10]) * 10) / 10, foot: "vs last month", trend: D.fpy })}
        ${U.stat({ label: "Inspections (30 days)", icon: "shield", tone: "blue", value: I.length, foot: `${I.filter(i => i.result === "Pending").length} pending` })}
        ${U.stat({ label: "Failed", icon: "alert", tone: fails ? "red" : "green", value: fails, foot: `${Math.round((fails / I.length) * 100)}% fail rate` })}
        ${U.stat({ label: "Open NCRs", icon: "tendering", tone: "amber", value: openN.length, foot: `${openN.filter(n => n.severity === "Major").length} major` })}
      </div>
      <div class="grid split mt">
        ${U.card({ title: "First-pass yield", sub: "Share of products passing inspection first time · last 12 months", body: `<div id="q-fpy"></div>` })}
        ${U.card({ title: "Open NCRs", sub: "Non-conformance reports to close", body: `<div class="list">${openN.map(n => `
          <div class="li"><span class="li-icon t-${n.severity === "Major" ? "red" : "amber"}">${U.icon("alert", 15)}</span>
            <div class="li-main"><div class="li-title">${U.esc(n.title)}</div><div class="li-sub">${n.id} · ${n.owner} · opened ${U.rel(n.opened)}</div></div>
            ${U.badge(n.severity, n.severity === "Major" ? "red" : "amber")}</div>`).join("")}</div>` })}
      </div>
      ${U.card({ cls: "mt", title: "Inspection log", body: `<div id="q-table"></div>` })}`;

    Ch.area(root.querySelector("#q-fpy"), { labels: D.months, series: [{ name: "FPY", values: D.fpy, color: "var(--c6)" }], format: v => `${Math.round(v)}%`, min: 80, max: 100, height: 240 });

    U.table(root.querySelector("#q-table"), {
      rows: I, placeholder: "Search inspections…", sortKey: "date", sortDir: -1,
      search: i => `${i.id} ${i.wo} ${i.type} ${i.inspector}`,
      filters: [{ key: "result", label: "Result", options: ["Pass", "Fail", "Pending"] }, { key: "type", label: "Type", options: ["Incoming", "In-process", "Final", "FAT"] }],
      columns: [
        { key: "id", label: "Inspection", render: i => `<span class="strong">${i.id}</span>` },
        { key: "wo", label: "Work order", render: i => { const w = D.workOrders.find(x => x.id === i.wo); return `${i.wo}<span class="cell-sub">${w ? w.product : ""}</span>`; } },
        { key: "type", label: "Type" },
        { key: "inspector", label: "Inspector", render: i => U.person(i.inspector) },
        { key: "date", label: "Date", render: i => `${U.date(i.date)}<span class="cell-sub">${U.rel(i.date)}</span>` },
        { key: "result", label: "Result", render: i => U.badge(i.result, resTone[i.result], true) },
      ],
    });
  },
});
