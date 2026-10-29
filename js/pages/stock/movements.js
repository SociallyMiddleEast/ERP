/* Stock → Movements   (#stock/movements) — goods in, goods out, transfers */
App.page("stock/movements", {
  title: "Stock movements",
  subtitle: "Every item received from suppliers, issued to production or moved between locations.",

  render(root) {
    const U = App.ui, D = App.data, Ch = App.charts;
    const M = D.movements;
    const item = sku => D.stock.find(s => s.sku === sku) || { name: sku, unit: "" };
    const tTone = { In: "green", Out: "coral", Transfer: "blue" };
    const tIcon = { In: "in", Out: "out", Transfer: "transfer" };
    let type = "all";

    // last 10 days, movements per day
    const days = Array.from({ length: 10 }, (_, i) => D.day(i - 9));
    const perDay = t => days.map(d => M.filter(m => m.date === d && m.type === t).length);

    root.innerHTML = `
      <div class="grid cols-4">
        ${U.stat({ label: "Movements (10 days)", icon: "transfer", tone: "teal", value: M.length, foot: "all types" })}
        ${U.stat({ label: "Goods in", icon: "in", tone: "green", value: M.filter(m => m.type === "In").length, foot: "received from suppliers" })}
        ${U.stat({ label: "Goods out", icon: "out", tone: "coral", value: M.filter(m => m.type === "Out").length, foot: "issued to production" })}
        ${U.stat({ label: "Transfers", icon: "pin", tone: "blue", value: M.filter(m => m.type === "Transfer").length, foot: "between locations" })}
      </div>
      <div class="grid split-r mt">
        ${U.card({ title: "Per day", sub: "Last 10 days", body: `<div id="mv-chart"></div><div class="legend mt"><span class="t-green"><i></i>In</span><span class="t-coral"><i></i>Out</span><span class="t-blue"><i></i>Transfer</span></div>` })}
        ${U.card({ title: "Movement log", actions: U.seg([["all", "All"], ["In", "In"], ["Out", "Out"], ["Transfer", "Transfer"]], "all", "t"), body: `<div class="list" id="mv-list"></div>` })}
      </div>`;

    Ch.bars(root.querySelector("#mv-chart"), {
      labels: days.map(d => U.date(d).split(" ")[0]), stacked: true, height: 250, format: v => Math.round(v),
      series: [{ name: "In", values: perDay("In"), color: "var(--c6)" }, { name: "Out", values: perDay("Out"), color: "var(--c4)" }, { name: "Transfer", values: perDay("Transfer"), color: "var(--c3)" }],
    });

    const draw = () => {
      const list = M.filter(m => type === "all" || m.type === type);
      let last = "";
      root.querySelector("#mv-list").innerHTML = list.map((m, i) => {
        const it = item(m.sku), head = m.date !== last ? `<div class="sec-title" style="margin:${i ? 14 : 0}px 0 2px">${U.rel(m.date) === "today" ? "Today" : U.rel(m.date) === "yesterday" ? "Yesterday" : U.dateY(m.date)}</div>` : "";
        last = m.date;
        return `${head}<div class="li">
          <span class="li-icon t-${tTone[m.type]}">${U.icon(tIcon[m.type], 16)}</span>
          <div class="li-main"><div class="li-title">${U.esc(it.name)}</div><div class="li-sub">${m.id} · ${m.ref} · ${m.by}</div></div>
          <b class="tnum t-${tTone[m.type]}" style="color:var(--b)">${m.type === "In" ? "+" : m.type === "Out" ? "−" : ""}${m.qty} ${it.unit}</b>
        </div>`;
      }).join("") || U.empty("No movements.");
    };
    U.onSeg(root, "t", v => { type = v; draw(); });
    draw();
  },
});
