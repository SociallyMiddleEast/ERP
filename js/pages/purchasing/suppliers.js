/* Purchasing → Suppliers   (#purchasing/suppliers)   ?open=S201 */
App.page("purchasing/suppliers", {
  title: "Suppliers",
  subtitle: "Who we buy from, how reliable they are and how much we spend.",

  render(root, ctx) {
    const U = App.ui, D = App.data, Ch = App.charts;
    const S = D.suppliers;
    const avgOnTime = Math.round(U.sum(S, s => s.onTime) / S.length);

    root.innerHTML = `
      <div class="grid cols-4">
        ${U.stat({ label: "Suppliers", icon: "truck", tone: "teal", value: S.length, foot: `${new Set(S.map(s => s.country)).size} countries` })}
        ${U.stat({ label: "Spend this year", icon: "finance", tone: "amber", value: U.compact(U.sum(S, s => s.spend)), foot: "across all suppliers" })}
        ${U.stat({ label: "Average on-time", icon: "clock", tone: avgOnTime > 90 ? "green" : "coral", value: avgOnTime + "%", foot: "deliveries on time" })}
        ${U.stat({ label: "Below 85% on-time", icon: "alert", tone: "red", value: S.filter(s => s.onTime < 85).length, foot: "worth a review" })}
      </div>
      <div class="grid split mt">
        ${U.card({ title: "Supplier list", sub: "Click a supplier for details", body: `<div id="su-table"></div>` })}
        ${U.card({ title: "Spend by supplier", sub: "This year", body: `<div id="su-spend"></div>` })}
      </div>`;

    const openSupplier = s => {
      const pos = D.pos.filter(p => p.supplierId === s.id);
      U.drawer({
        title: s.name, sub: `${s.category} · ${s.country}`,
        body: `<div class="grid cols-2"><div><div class="sec-title">Spend</div><div class="big-num tnum">${U.compact(s.spend)}</div></div><div><div class="sec-title">On time</div><div class="big-num">${s.onTime}%</div></div></div>
          ${U.kv([["Rating", U.stars(s.rating)], ["Typical lead time", `${s.leadTime} days`], ["Category", s.category]])}
          <div><div class="sec-title">Purchase orders (${pos.length})</div><div class="list">${pos.map(p => `<div class="li"><div class="li-main"><div class="li-title">${p.id} · ${U.esc(p.items)}</div><div class="li-sub">${p.project} · expected ${U.date(p.expected)}</div></div><b class="tnum">${U.compact(p.value)}</b></div>`).join("") || '<p class="muted small">No open orders.</p>'}</div></div>`,
        footer: `<a class="btn primary" href="#purchasing/purchase-orders">All purchase orders</a>`,
      });
    };

    U.table(root.querySelector("#su-table"), {
      rows: S, placeholder: "Search suppliers…", sortKey: "spend", sortDir: -1,
      search: s => `${s.name} ${s.category} ${s.country}`,
      filters: [{ key: "category", label: "Category", options: [...new Set(S.map(s => s.category))].sort() }],
      columns: [
        { key: "name", label: "Supplier", render: s => `<span class="cell-title">${U.esc(s.name)}</span><span class="cell-sub">${s.category} · ${s.country}</span>` },
        { key: "rating", label: "Rating", render: s => U.stars(s.rating) },
        { key: "onTime", label: "On time", render: s => `<div style="width:100px">${U.progress(s.onTime, s.onTime >= 90 ? "green" : s.onTime >= 85 ? "amber" : "red")}<span class="cell-sub">${s.onTime}%</span></div>` },
        { key: "leadTime", label: "Lead time", align: "right", render: s => `${s.leadTime} d` },
        { key: "spend", label: "Spend", align: "right", render: s => `<span class="strong">${U.compact(s.spend)}</span>` },
      ],
      onRow: openSupplier,
    });

    Ch.hbars(root.querySelector("#su-spend"), { items: [...S].sort((a, b) => b.spend - a.spend).slice(0, 8).map((s, i) => ({ label: s.name, value: s.spend, color: Ch.PAL[i % 6] })) });
    if (ctx.query.open) { const s = S.find(x => x.id === ctx.query.open); if (s) setTimeout(() => openSupplier(s), 500); }
  },
});
