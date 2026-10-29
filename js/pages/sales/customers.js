/* Sales → Customers   (#sales/customers)   ?open=C101 opens a customer */
App.page("sales/customers", {
  title: "Customers",
  subtitle: () => `${App.data.customers.length} customers across ${new Set(App.data.customers.map(c => c.country)).size} countries`,
  actions: () => `<a class="btn primary" href="#sales/new-opportunity">${App.ui.icon("plus", 15)} New opportunity</a>`,

  render(root, ctx) {
    const U = App.ui, D = App.data, Ch = App.charts;
    const stats = c => {
      const list = D.opps.filter(o => o.customerId === c.id);
      const open = list.filter(D.isOpen);
      return { list, open: open.length, pipeline: U.sum(open, o => o.value), won: U.sum(list.filter(o => o.stage === "won"), o => o.value) };
    };
    const active = D.customers.filter(c => stats(c).open > 0).length;
    const industries = [...new Set(D.customers.map(c => c.industry))];
    const byIndustry = industries.map(ind => ({ ind, v: U.sum(D.opps.filter(o => D.customer(o.customerId).industry === ind && D.isOpen(o)), o => o.value) }))
      .sort((a, b) => b.v - a.v);
    const wonAll = D.opps.filter(o => o.stage === "won");

    root.innerHTML = `
      <div class="grid cols-4">
        ${U.stat({ label: "Customers", icon: "user", tone: "teal", value: D.customers.length, foot: `${active} with open opportunities` })}
        ${U.stat({ label: "Top industry", icon: "factory", tone: "amber", value: byIndustry[0].ind, foot: `${U.compact(byIndustry[0].v)} open pipeline` })}
        ${U.stat({ label: "Average deal won", icon: "finance", tone: "blue", value: U.compact(U.sum(wonAll, o => o.value) / Math.max(1, wonAll.length)), foot: `${wonAll.length} deals` })}
        ${U.stat({ label: "Not contacted in 30 days", icon: "clock", tone: "coral", value: D.customers.filter(c => U.days(c.lastContact) < -30).length, foot: "worth a call" })}
      </div>
      <div class="grid split mt">
        ${U.card({ title: "Customer list", sub: "Click a customer to see contacts and opportunities", body: `<div id="cu-table"></div>` })}
        ${U.card({ title: "Open pipeline by industry", sub: "Where the next projects come from", body: `<div id="cu-ind"></div>` })}
      </div>`;

    U.table(root.querySelector("#cu-table"), {
      rows: D.customers, placeholder: "Search customers or contacts…",
      search: c => `${c.name} ${c.contact} ${c.country} ${c.industry}`,
      filters: [
        { key: "industry", label: "Industry", options: industries.sort() },
        { key: "country", label: "Country", options: [...new Set(D.customers.map(c => c.country))].sort() },
      ],
      sortKey: "pipeline", sortDir: -1,
      columns: [
        { key: "name", label: "Customer", render: c => `<span class="person">${U.avatar(c.name, 32)}<span><b>${U.esc(c.name)}</b><small>${U.esc(c.country)}</small></span></span>` },
        { key: "industry", label: "Industry", render: c => U.badge(c.industry, "gray") },
        { key: "open", label: "Open", align: "right", sort: c => stats(c).open, render: c => stats(c).open },
        { key: "pipeline", label: "Pipeline", align: "right", sort: c => stats(c).pipeline, render: c => U.compact(stats(c).pipeline) },
        { key: "lastContact", label: "Last contact", render: c => `<span class="${U.days(c.lastContact) < -30 ? "t-coral" : ""}" style="${U.days(c.lastContact) < -30 ? "color:var(--b)" : ""}">${U.rel(c.lastContact)}</span>` },
      ],
      onRow: c => openCustomer(c),
    });

    Ch.hbars(root.querySelector("#cu-ind"), { items: byIndustry.map((x, i) => ({ label: x.ind, value: x.v, color: Ch.PAL[i % 6] })) });

    function openCustomer(c) {
      const s = stats(c);
      U.drawer({
        title: U.esc(c.name), sub: `${c.id} · ${U.esc(c.industry)} · ${U.esc(c.country)}`,
        body: `
          <div class="grid cols-2">
            <div><div class="sec-title">Open pipeline</div><div class="big-num tnum">${U.compact(s.pipeline)}</div></div>
            <div><div class="sec-title">Won to date</div><div class="big-num tnum">${U.compact(s.won)}</div></div>
          </div>
          ${U.kv([
            ["Contact", U.person(c.contact, c.email)],
            ["Account owner", U.person(c.owner)],
            ["Customer since", c.since],
            ["Last contact", `${U.dateY(c.lastContact)} (${U.rel(c.lastContact)})`],
          ])}
          <div><div class="sec-title">Opportunities (${s.list.length})</div>
            <div class="list">${s.list.length ? s.list.map(o => `
              <div class="li clickable" data-opp="${o.id}">
                <div class="li-main"><div class="li-title">${U.esc(o.title)}</div><div class="li-sub">${o.id} · ${U.money(o.value)}</div></div>
                ${U.badge(D.stage(o.stage).label, D.stage(o.stage).tone, true)}
              </div>`).join("") : U.empty("No opportunities yet.")}</div>
          </div>`,
        footer: `<a class="btn" href="mailto:${c.email}">${U.icon("mail", 15)} Email</a><a class="btn primary" href="#sales/new-opportunity?customer=${c.id}">${U.icon("plus", 15)} New opportunity</a>`,
        onMount(el) {
          el.addEventListener("click", e => {
            const r = e.target.closest("[data-opp]");
            if (r) App.views.opportunity(D.opps.find(o => o.id === r.dataset.opp), () => App.refresh());
          });
        },
      });
    }

    if (ctx.query.open) {
      const c = D.customers.find(x => x.id === ctx.query.open);
      if (c) setTimeout(() => openCustomer(c), 500);
    }
  },
});
