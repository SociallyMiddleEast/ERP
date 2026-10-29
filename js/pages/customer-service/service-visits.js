/* Customer service → Service visits   (#customer-service/service-visits) */
App.page("customer-service/service-visits", {
  title: "Service visits",
  subtitle: "Technicians on customer sites: maintenance, repairs, commissioning and training.",

  render(root) {
    const U = App.ui, D = App.data, Ch = App.charts;
    const V = [...D.visits].sort((a, b) => a.date.localeCompare(b.date));
    const up = V.filter(v => v.status === "Scheduled"), done = V.filter(v => v.status === "Completed").reverse();
    const pTone = { "Preventive maintenance": "teal", "Commissioning support": "violet", "Fault diagnosis": "coral", "Operator training": "blue", "Warranty repair": "amber" };

    const visitRow = v => {
      const d = U.parse(v.date), c = D.customer(v.customerId);
      return `<div class="li clickable" data-v="${v.id}">
        <span class="dateblock t-${pTone[v.purpose]}"><b>${d.getDate()}</b><small>${d.toLocaleDateString("en-US", { month: "short" })}</small></span>
        <div class="li-main"><div class="li-title">${U.esc(c.name)}</div><div class="li-sub">${v.purpose} · ${v.time} · ${v.technician}</div></div>
        <div class="li-side">${v.status === "Scheduled" ? U.badge(U.rel(v.date), U.days(v.date) <= 2 ? "amber" : "teal") : U.badge("Done", "green")}</div>
      </div>`;
    };

    root.innerHTML = `
      <div class="grid cols-4">
        ${U.stat({ label: "Upcoming visits", icon: "calendar", tone: "teal", value: up.length, foot: `next: ${up[0] ? U.rel(up[0].date) : "—"}` })}
        ${U.stat({ label: "This week", icon: "clock", tone: "amber", value: up.filter(v => U.days(v.date) <= 7).length, foot: "visits planned" })}
        ${U.stat({ label: "Completed (20 days)", icon: "check", tone: "green", value: done.length, foot: "visits done" })}
        ${U.stat({ label: "Technicians", icon: "hr", tone: "blue", value: D.team.service.length, foot: "in the field team" })}
      </div>
      <div class="grid split mt">
        ${U.card({ title: "Upcoming", sub: "Scheduled visits", body: `<div class="list">${up.map(visitRow).join("") || U.empty("No visits scheduled.")}</div>` })}
        <div style="display:grid;gap:16px;align-content:start">
          ${U.card({ title: "Visits by technician", sub: "Last 20 days and next 18 days", body: `<div id="sv-tech"></div>` })}
          ${U.card({ title: "Recently completed", body: `<div class="list">${done.slice(0, 4).map(visitRow).join("")}</div>` })}
        </div>
      </div>`;

    Ch.hbars(root.querySelector("#sv-tech"), {
      format: v => `${v} visits`,
      items: D.team.service.map((t, i) => ({ label: U.person(t), value: V.filter(v => v.technician === t).length, color: Ch.PAL[i] })),
    });

    root.addEventListener("click", e => {
      const r = e.target.closest("[data-v]");
      if (!r) return;
      const v = D.visits.find(x => x.id === r.dataset.v), c = D.customer(v.customerId);
      U.drawer({
        title: `${v.purpose}`, sub: `${v.id} · ${U.esc(c.name)}`,
        body: U.kv([
          ["When", `${U.dateY(v.date)} at ${v.time} <span class="muted">(${U.rel(v.date)})</span>`],
          ["Status", U.badge(v.status, v.status === "Completed" ? "green" : "teal", true)],
          ["Technician", U.person(v.technician)],
          ["Customer", `${U.esc(c.name)} <span class="muted">· ${c.country}</span>`],
          ["Site contact", U.person(c.contact, c.email)],
        ]),
        footer: `<a class="btn primary" href="#customer-service/tickets">Related tickets</a>`,
      });
    });
  },
});
