/* Home → Sales pipeline dashboard   (#home/sales-pipeline) */
App.page("home/sales-pipeline", {
  title() {
    const h = new Date().getHours();
    return `${h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening"}, ${SETTINGS.user.name.split(" ")[0]}`;
  },

  subtitle() {
    const U = App.ui, D = App.data;
    const open = D.opps.filter(D.isOpen);
    const due = open.filter(o => U.days(o.nextDue) <= 0).length;
    const tenders = open.filter(o => o.tenderDue && U.days(o.tenderDue) >= 0 && U.days(o.tenderDue) <= 7).length;
    const top = open.filter(o => o.stage === "negotiation").sort((a, b) => b.value - a.value)[0];
    const date = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
    return `${date} · ${due} follow-up${due === 1 ? "" : "s"} due and ${tenders} tender${tenders === 1 ? "" : "s"} closing this week.` +
      (top ? ` <b>${U.esc(top.title)}</b> is your biggest deal in negotiation.` : "");
  },

  actions: () => `
    <a class="btn" href="#sales/opportunities">${App.ui.icon("board", 15)} Pipeline</a>
    <a class="btn primary" href="#sales/new-opportunity">${App.ui.icon("plus", 15)} New opportunity</a>`,

  render(root) {
    const U = App.ui, D = App.data, Ch = App.charts;
    const open = D.opps.filter(D.isOpen);
    const won = D.opps.filter(o => o.stage === "won"), lost = D.opps.filter(o => o.stage === "lost");
    const pipeline = U.sum(open, o => o.value);
    const weighted = U.sum(open, o => (o.value * o.probability) / 100);
    const winRate = Math.round((won.length / Math.max(1, won.length + lost.length)) * 100);
    const waiting = [...open].sort((a, b) => a.nextDue.localeCompare(b.nextDue)).slice(0, 6);
    const stageIcon = { lead: "chat", qualified: "chat", tendering: "tendering", quote: "send", negotiation: "target" };
    const biggest = [...open].sort((a, b) => b.value - a.value).slice(0, 6);
    const byRep = D.team.sales.map(r => ({ name: r, value: U.sum(D.opps.filter(o => o.owner === r && o.stage === "won"), o => o.value), open: open.filter(o => o.owner === r).length }))
      .sort((a, b) => b.value - a.value);

    root.innerHTML = `
      <div class="grid cols-4">
        ${U.stat({ label: "Open opportunities", icon: "sales", tone: "teal", value: open.length, foot: `${open.filter(o => o.stage === "tendering").length} in tendering`, trend: D.salesMonthly.count, href: "#sales/opportunities" })}
        ${U.stat({ label: "Pipeline value", icon: "finance", tone: "amber", value: U.compact(pipeline), foot: `${U.compact(weighted)} weighted`, trend: D.salesMonthly.pipeline, href: "#sales/opportunities?view=list" })}
        ${U.stat({ label: "Won this year", icon: "check", tone: "blue", value: U.compact(D.wonYTD), foot: `${won.length} deals closed`, trend: D.salesMonthly.won, href: "#sales/opportunities?stage=won" })}
        ${U.stat({ label: "Win rate", icon: "target", tone: "coral", value: winRate + "%", delta: winRate - 52, foot: "vs last year", trend: D.salesMonthly.winRate })}
      </div>

      <div class="grid split mt">
        ${U.card({
          title: "Pipeline over time", sub: "Open pipeline value · last 12 months",
          actions: U.seg([["pipeline", "Pipeline"], ["won", "Won"], ["count", "Deals"]], "pipeline", "metric"),
          body: `<div id="sp-chart"></div>`,
        })}
        ${U.card({
          title: "Waiting on you", sub: `${waiting.length} next steps across the pipeline`,
          body: `<div class="list">${waiting.map(o => `
            <div class="li clickable" data-opp="${o.id}">
              <span class="li-icon t-${D.stage(o.stage).tone}">${U.icon(stageIcon[o.stage] || "chat", 16)}</span>
              <div class="li-main"><div class="li-title">${U.esc(o.nextAction)} — ${U.esc(o.title)}</div>
                <div class="li-sub">${U.esc(D.customer(o.customerId).name)} · ${o.owner.split(" ")[0]}</div></div>
              <div class="li-side">${U.dueTag(o.nextDue)}</div>
            </div>`).join("")}</div>`,
        })}
      </div>

      ${U.card({
        cls: "mt", title: "Pipeline by stage", sub: "Click a stage to see its opportunities",
        actions: `<a class="link" href="#sales/opportunities">Open board ${U.icon("arrow", 14)}</a>`,
        body: `<div class="stages">${D.stages.filter(s => s.id !== "lost").map(s => {
          const list = D.opps.filter(o => o.stage === s.id), val = U.sum(list, o => o.value);
          const maxV = Math.max(...D.stages.map(x => U.sum(D.opps.filter(o => o.stage === x.id), o => o.value)));
          return `<a class="stage t-${s.tone}" href="#sales/opportunities?stage=${s.id}">
            <div class="stage-top"><span>${s.label}</span>${U.badge(s.prob + "%", s.tone)}</div>
            <div class="stage-n tnum">${list.length}</div>
            <div class="stage-v tnum">${U.compact(val)}</div>
            ${U.progress((val / maxV) * 100, s.tone)}
          </a>`;
        }).join("")}</div>`,
      })}

      <div class="grid split mt">
        ${U.card({
          title: "Biggest open deals", sub: "Sorted by value",
          body: `<div class="tbl-wrap"><table class="tbl"><thead><tr><th class="nosort">Opportunity</th><th class="nosort">Stage</th><th class="nosort">Owner</th><th class="nosort">Close</th><th class="nosort num">Value</th></tr></thead><tbody>
            ${biggest.map((o, i) => `<tr class="clickable" style="--r:${i}" data-opp="${o.id}">
              <td><span class="cell-title">${U.esc(o.title)}</span><span class="cell-sub">${U.esc(D.customer(o.customerId).name)}</span></td>
              <td>${U.badge(D.stage(o.stage).label, D.stage(o.stage).tone, true)}</td>
              <td>${U.person(o.owner)}</td>
              <td class="muted">${U.date(o.expectedClose)}</td>
              <td class="num strong">${U.money(o.value)}</td></tr>`).join("")}
          </tbody></table></div>`,
        })}
        ${U.card({ title: "Sales team", sub: "Won value this year", body: `<div id="sp-reps"></div>` })}
      </div>`;

    const metrics = {
      pipeline: { name: "Pipeline", values: D.salesMonthly.pipeline, color: "var(--c1)", format: U.compact, sub: "Open pipeline value" },
      won: { name: "Won", values: D.salesMonthly.won, color: "var(--c6)", format: U.compact, sub: "Value won per month" },
      count: { name: "Deals", values: D.salesMonthly.count, color: "var(--c3)", format: v => Math.round(v), sub: "Open deals per month" },
    };
    const drawChart = key => {
      const m = metrics[key];
      U.redraw(root, "#sp-chart", el => Ch.area(el, { labels: D.months, series: [m], format: m.format, height: 270 }));
      root.querySelector("#sp-chart").closest(".card").querySelector(".card-sub").textContent = `${m.sub} · last 12 months`;
    };
    drawChart("pipeline");
    U.onSeg(root, "metric", drawChart);

    Ch.hbars(root.querySelector("#sp-reps"), {
      items: byRep.map((r, i) => ({ label: U.person(r.name, `${r.open} open`), value: r.value, color: Ch.PAL[i] })),
    });

    root.addEventListener("click", e => {
      const row = e.target.closest("[data-opp]");
      if (row) App.views.opportunity(D.opps.find(o => o.id === row.dataset.opp), () => App.refresh());
    });
  },
});
