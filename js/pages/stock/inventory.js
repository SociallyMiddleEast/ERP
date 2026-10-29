/* Stock → Inventory   (#stock/inventory)   ?low=1 shows only items below minimum */
App.page("stock/inventory", {
  title: "Inventory",
  subtitle: "What is in the warehouse. Items below their minimum level can be reordered with one click.",
  actions: () => `<a class="btn" href="#stock/movements">${App.ui.icon("transfer", 15)} Movements</a>`,

  render(root, ctx) {
    const U = App.ui, D = App.data;
    const low = s => s.qty < s.min;
    const level = s => (s.qty === 0 ? ["Out of stock", "red"] : low(s) ? ["Low", "amber"] : ["OK", "green"]);
    let only = ctx.query.low ? "low" : "all";

    const stats = () => `
      ${U.stat({ label: "Items (SKUs)", icon: "stock", tone: "teal", value: D.stock.length, foot: `${new Set(D.stock.map(s => s.category)).size} categories` })}
      ${U.stat({ label: "Stock value", icon: "finance", tone: "blue", value: U.compact(U.sum(D.stock, s => s.qty * s.cost)), foot: "at purchase cost" })}
      ${U.stat({ label: "Below minimum", icon: "alert", tone: "amber", value: D.stock.filter(low).length, foot: "need reordering", href: "#stock/inventory?low=1" })}
      ${U.stat({ label: "Out of stock", icon: "x", tone: "red", value: D.stock.filter(s => s.qty === 0).length, foot: "zero on hand" })}`;

    root.innerHTML = `
      <div class="grid cols-4" id="in-stats">${stats()}</div>
      ${U.card({ cls: "mt", title: "Stock list", actions: U.seg([["all", "All items"], ["low", "Below minimum"]], only, "only"), body: `<div id="in-table"></div>` })}`;

    const table = U.table(root.querySelector("#in-table"), {
      rows: () => D.stock.filter(s => only === "all" || low(s)),
      placeholder: "Search item or SKU…", sortKey: "level",
      search: s => `${s.sku} ${s.name} ${s.category} ${s.location}`,
      filters: [{ key: "category", label: "Category", options: [...new Set(D.stock.map(s => s.category))].sort() }],
      rowClass: s => (s.qty === 0 ? "warn" : ""),
      columns: [
        { key: "name", label: "Item", render: s => `<span class="cell-title">${U.esc(s.name)}</span><span class="cell-sub">${s.sku} · ${s.category}</span>` },
        { key: "location", label: "Location", render: s => U.badge(s.location, "gray") },
        { key: "qty", label: "On hand", align: "right", render: s => `<span class="strong">${U.num(s.qty)}</span> <span class="muted">${s.unit}</span>` },
        { key: "level", label: "Level vs minimum", sort: s => s.qty / s.min, render: s => `<div style="width:130px">${U.progress(Math.min(100, (s.qty / (s.min * 2)) * 100), level(s)[1])}<span class="cell-sub">min ${U.num(s.min)} ${s.unit}</span></div>` },
        { key: "status", label: "Status", nosort: true, render: s => U.badge(level(s)[0], level(s)[1], true) },
        { key: "value", label: "Value", align: "right", sort: s => s.qty * s.cost, render: s => U.money(s.qty * s.cost) },
        { key: "act", label: "", nosort: true, render: s => (low(s) ? `<button class="btn sm" data-reorder="${s.sku}">${U.icon("purchasing", 13)} Reorder</button>` : "") },
      ],
    });

    root.addEventListener("click", e => {
      const b = e.target.closest("[data-reorder]");
      if (!b) return;
      const s = D.stock.find(x => x.sku === b.dataset.reorder);
      const qty = s.min * 2 - s.qty;
      const id = "PR-" + (Math.max(...D.requests.map(r => +r.id.split("-")[1])) + 1);
      D.requests.unshift({ id, title: `Restock ${s.name} × ${qty} ${s.unit}`, discipline: "factory", value: Math.round(qty * s.cost), project: D.projects[0].code, requester: SETTINGS.user.name, needed: D.day(10), status: "Pending" });
      App.save("requests");
      b.outerHTML = U.badge("Requested", "teal");
      U.toast(`${id} created for ${U.esc(s.name)} — see Purchase requests`);
    });
    U.onSeg(root, "only", v => { only = v; table.refresh(); });
  },
});
