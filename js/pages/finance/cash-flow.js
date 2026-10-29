/* Finance → Cash flow   (#finance/cash-flow) — money in vs money out */
App.page("finance/cash-flow", {
  title: "Cash flow",
  subtitle: "Money coming in from customers and going out to suppliers and payroll.",

  render(root) {
    const U = App.ui, D = App.data, Ch = App.charts;
    const inn = D.cashMonthly.in, out = D.cashMonthly.out;
    const net = inn.map((v, i) => v - out[i]);
    let bal = 1.2e6;
    const balance = net.map(n => (bal += n));
    const m = new Date().getMonth();
    const ytdIn = U.sum(inn.slice(11 - m)), ytdOut = U.sum(out.slice(11 - m));

    root.innerHTML = `
      <div class="grid cols-4">
        ${U.stat({ label: "Cash balance", icon: "finance", tone: "teal", value: U.compact(balance[11]), foot: "end of this month", trend: balance })}
        ${U.stat({ label: "Received YTD", icon: "in", tone: "green", value: U.compact(ytdIn), foot: "from customers", trend: inn })}
        ${U.stat({ label: "Paid out YTD", icon: "out", tone: "coral", value: U.compact(ytdOut), foot: "suppliers & payroll", trend: out })}
        ${U.stat({ label: "Net this month", icon: "sales", tone: net[11] >= 0 ? "green" : "red", value: (net[11] >= 0 ? "+" : "") + U.compact(net[11]), foot: net[11] >= 0 ? "more in than out" : "more out than in" })}
      </div>
      <div class="grid split mt">
        ${U.card({ title: "In vs out", sub: "Last 12 months", body: `<div id="cf-bars"></div><div class="legend mt"><span class="t-green"><i></i>In</span><span class="t-coral"><i></i>Out</span></div>` })}
        ${U.card({ title: "Recent payments", body: `<div class="list">${D.payments.map(p => `
          <div class="li"><span class="li-icon t-${p.type === "In" ? "green" : "coral"}">${U.icon(p.type === "In" ? "in" : "out", 15)}</span>
            <div class="li-main"><div class="li-title">${U.esc(p.party)}</div><div class="li-sub">${p.ref} · ${U.rel(p.date)}</div></div>
            <b class="tnum" style="color:var(--${p.type === "In" ? "ok" : "text"})">${p.type === "In" ? "+" : "−"}${U.compact(p.amount)}</b></div>`).join("")}</div>` })}
      </div>
      ${U.card({ cls: "mt", title: "Cash balance", sub: "End of each month", body: `<div id="cf-bal"></div>` })}`;

    Ch.bars(root.querySelector("#cf-bars"), { labels: D.months, height: 260, series: [{ name: "In", values: inn, color: "var(--c6)" }, { name: "Out", values: out, color: "var(--c4)" }] });
    Ch.area(root.querySelector("#cf-bal"), { labels: D.months, height: 220, series: [{ name: "Balance", values: balance, color: "var(--c1)" }], min: Math.floor(Math.min(...balance) * 0.8 / 1e5) * 1e5 });
  },
});
