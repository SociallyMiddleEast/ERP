/* Purchasing → Purchase orders   (#purchasing/purchase-orders) */
App.page("purchasing/purchase-orders", {
  title: "Purchase orders",
  subtitle: "What has been ordered from suppliers, for which project, and when it arrives.",
  actions: () => `<a class="btn primary" href="#purchasing/requests">${App.ui.icon("tendering", 15)} Purchase requests</a>`,

  render(root) {
    const U = App.ui, D = App.data, Ch = App.charts;
    const P = D.pos;
    const open = P.filter(p => p.status !== "Received" && p.status !== "Draft");
    const late = P.filter(D.poLate);
    const stTone = { Draft: "gray", Sent: "blue", Confirmed: "teal", "Partially received": "amber", Received: "green" };
    const byStatus = D.poStatuses.map(s => ({ label: s, value: U.sum(P.filter(p => p.status === s), p => p.value) }));

    root.innerHTML = `
      <div class="grid cols-4">
        ${U.stat({ label: "Open orders", icon: "purchasing", tone: "amber", value: open.length, foot: `${P.length} this quarter` })}
        ${U.stat({ label: "Committed value", icon: "finance", tone: "blue", value: U.compact(U.sum(open, p => p.value)), foot: "not yet received", trend: D.costMonthly.purchasing })}
        ${U.stat({ label: "Late deliveries", icon: "truck", tone: late.length ? "red" : "green", value: late.length, foot: late.length ? "past expected date" : "all on time" })}
        ${U.stat({ label: "Received", icon: "check", tone: "green", value: P.filter(p => p.status === "Received").length, foot: U.compact(U.sum(P.filter(p => p.status === "Received"), p => p.value)) + " delivered" })}
      </div>
      <div class="grid split mt">
        ${U.card({ title: "All purchase orders", body: `<div id="po-table"></div>` })}
        ${U.card({ title: "Value by status", sub: "All purchase orders", body: `<div id="po-donut"></div>` })}
      </div>`;

    Ch.donut(root.querySelector("#po-donut"), { size: 150, items: byStatus.map((s, i) => ({ ...s, color: ["var(--faint)", "var(--c3)", "var(--c1)", "var(--c2)", "var(--c6)"][i] })) });

    U.table(root.querySelector("#po-table"), {
      rows: P, placeholder: "Search PO, supplier, items…", sortKey: "expected",
      search: p => `${p.id} ${D.supplier(p.supplierId).name} ${p.items} ${p.project}`,
      filters: [
        { key: "status", label: "Status", options: D.poStatuses },
        { key: "supplierId", label: "Supplier", options: D.suppliers.map(s => ({ value: s.id, label: s.name })) },
      ],
      rowClass: p => (D.poLate(p) ? "warn" : ""),
      columns: [
        { key: "id", label: "PO", render: p => `<span class="cell-title">${p.id}</span><span class="cell-sub">${p.project}</span>` },
        { key: "items", label: "Supplier · items", render: p => `<span class="cell-title">${U.esc(D.supplier(p.supplierId).name)}</span><span class="cell-sub">${U.esc(p.items)}</span>` },
        { key: "status", label: "Status", render: p => U.badge(p.status, stTone[p.status], true) },
        { key: "expected", label: "Expected", render: p => p.status === "Received" ? U.badge("Received", "green") : D.poLate(p) ? U.dueTag(p.expected) : U.date(p.expected) },
        { key: "value", label: "Value", align: "right", render: p => `<span class="strong">${U.money(p.value)}</span>` },
      ],
      onRow: p => {
        const s = D.supplier(p.supplierId);
        U.drawer({
          title: p.id, sub: `${U.esc(s.name)} · ${U.esc(p.items)}`,
          body: `<div><div class="sec-title">Value</div><div class="big-num tnum">${U.money(p.value)}</div></div>
            ${U.kv([
              ["Status", U.badge(p.status, stTone[p.status], true)],
              ["Supplier", `${U.esc(s.name)} <span class="muted">· ${s.country}</span>`],
              ["Supplier on-time rate", `${s.onTime}%`],
              ["Project", `${U.esc(D.project(p.project).name)} <span class="muted">(${p.project})</span>`],
              ["Buyer", U.person(p.buyer)],
              ["Ordered", U.dateY(p.ordered)],
              ["Expected", `${U.dateY(p.expected)} ${p.status !== "Received" ? U.dueTag(p.expected) : ""}`],
            ])}`,
          footer: `<a class="btn" href="#purchasing/suppliers?open=${s.id}">Supplier</a><a class="btn primary" href="#stock/inventory">Stock</a>`,
        });
      },
    });
  },
});
