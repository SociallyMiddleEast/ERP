/* Finance → Invoices   (#finance/invoices) — customer invoices per project milestone */
App.page("finance/invoices", {
  title: "Invoices",
  subtitle: "Money customers owe us, billed per project milestone.",

  render(root) {
    const U = App.ui, D = App.data, Ch = App.charts;
    const st = D.invoiceStatus;

    const stats = () => {
      const I = D.invoices, unpaid = I.filter(i => !i.paidOn), over = I.filter(i => st(i) === "Overdue");
      const m = D.today.slice(0, 7);
      return `
        ${U.stat({ label: "Outstanding", icon: "finance", tone: "amber", value: U.compact(U.sum(unpaid, i => i.amount)), foot: `${unpaid.length} unpaid invoices` })}
        ${U.stat({ label: "Overdue", icon: "alert", tone: "red", value: U.compact(U.sum(over, i => i.amount)), foot: `${over.length} past due date` })}
        ${U.stat({ label: "Paid this month", icon: "check", tone: "green", value: U.compact(U.sum(I.filter(i => i.paidOn && i.paidOn.slice(0, 7) === m), i => i.amount)), foot: "received" })}
        ${U.stat({ label: "Invoiced (90 days)", icon: "tendering", tone: "blue", value: U.compact(U.sum(I, i => i.amount)), foot: `${I.length} invoices` })}`;
    };

    root.innerHTML = `
      <div class="grid cols-4" id="iv-stats">${stats()}</div>
      <div class="grid split mt">
        ${U.card({ title: "All invoices", sub: "Click an invoice to mark it paid", body: `<div id="iv-table"></div>` })}
        ${U.card({ title: "Unpaid by age", sub: "How long invoices have been waiting", body: `<div id="iv-age"></div>` })}
      </div>`;

    const drawAge = () => {
      const unpaid = D.invoices.filter(i => !i.paidOn);
      const b = [["Not due yet", i => U.days(i.due) >= 0], ["1–30 days late", i => U.days(i.due) < 0 && U.days(i.due) >= -30], ["31–60 days late", i => U.days(i.due) < -30 && U.days(i.due) >= -60], ["60+ days late", i => U.days(i.due) < -60]];
      Ch.hbars(root.querySelector("#iv-age"), { items: b.map(([label, f], k) => ({ label, value: U.sum(unpaid.filter(f), i => i.amount), color: ["var(--c1)", "var(--c2)", "var(--c4)", "var(--danger)"][k] })) });
    };

    const table = U.table(root.querySelector("#iv-table"), {
      rows: () => D.invoices, placeholder: "Search invoice, customer, project…", sortKey: "due",
      search: i => `${i.id} ${D.customer(i.customerId).name} ${i.project} ${i.milestone}`,
      filters: [{ key: "status", label: "Status", options: ["Due", "Overdue", "Paid"], get: st }],
      rowClass: i => (st(i) === "Overdue" ? "warn" : ""),
      columns: [
        { key: "id", label: "Invoice", render: i => `<span class="cell-title">${i.id}</span><span class="cell-sub">${i.milestone}</span>` },
        { key: "customerId", label: "Customer", sort: i => D.customer(i.customerId).name, render: i => `${U.esc(D.customer(i.customerId).name)}<span class="cell-sub">${i.project}</span>` },
        { key: "issued", label: "Issued", render: i => U.date(i.issued) },
        { key: "due", label: "Due", render: i => (i.paidOn ? `<span class="muted">${U.date(i.due)}</span>` : U.dueTag(i.due)) },
        { key: "status", label: "Status", sort: st, render: i => U.badge(st(i), D.invoiceTone[st(i)], true) },
        { key: "amount", label: "Amount", align: "right", render: i => `<span class="strong">${U.money(i.amount)}</span>` },
      ],
      onRow: i => U.drawer({
        title: i.id, sub: `${U.esc(D.customer(i.customerId).name)} · ${i.milestone}`,
        body: `<div><div class="sec-title">Amount</div><div class="big-num tnum">${U.money(i.amount)}</div></div>
          ${U.kv([["Status", U.badge(st(i), D.invoiceTone[st(i)], true)], ["Project", `${U.esc(D.project(i.project).name)} (${i.project})`], ["Issued", U.dateY(i.issued)], ["Due", U.dateY(i.due)], i.paidOn && ["Paid on", U.dateY(i.paidOn)]])}`,
        footer: i.paidOn ? `<button class="btn" data-x>Close</button>` : `<button class="btn primary" data-pay>${U.icon("check", 15)} Mark as paid</button>`,
        onMount(el, api) {
          el.querySelector("[data-x]")?.addEventListener("click", () => api.close());
          el.querySelector("[data-pay]")?.addEventListener("click", () => {
            i.paidOn = D.today;
            App.save("invoices");
            table.refresh(); drawAge();
            root.querySelector("#iv-stats").innerHTML = stats();
            api.close(); U.toast(`${i.id} marked as paid`, "green");
          });
        },
      }),
    });
    drawAge();
  },
});
