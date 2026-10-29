/* Sales → Schedule   (#sales/schedule)
   Month calendar of meetings, visits, calls, follow-ups and tender deadlines. */
App.page("sales/schedule", {
  title: "Schedule",
  subtitle: "Meetings, site visits, calls and tender deadlines for the sales team.",

  render(root) {
    const U = App.ui, D = App.data;
    const toneOf = Object.fromEntries(D.eventTypes.map(t => [t.id, t.tone]));
    const labelOf = Object.fromEntries(D.eventTypes.map(t => [t.id, t.label]));
    const today = U.parse(D.today);
    let cursor = new Date(today.getFullYear(), today.getMonth(), 1);
    let owner = "";

    // calendar events + every open opportunity's tender deadline
    const allEvents = () => [
      ...D.events,
      ...D.opps.filter(o => D.isOpen(o) && o.tenderDue).map(o => ({
        id: "TD-" + o.id, type: "tender", date: o.tenderDue, time: "17:00",
        title: `Tender due — ${o.title}`, oppId: o.id, owner: o.owner, note: D.customer(o.customerId).name,
      })),
    ].filter(e => !owner || e.owner === owner).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));

    root.innerHTML = `
      <div class="grid split">
        ${U.card({
          title: `<span id="cal-title"></span>`,
          actions: `<button class="btn sm" id="cal-prev" aria-label="Previous month">${U.icon("left", 14)}</button>
                    <button class="btn sm" id="cal-today">Today</button>
                    <button class="btn sm" id="cal-next" aria-label="Next month">${U.icon("right", 14)}</button>`,
          body: `<div class="row between" style="margin-bottom:12px">
                   <div class="legend">${D.eventTypes.map(t => `<span class="t-${t.tone}"><i></i>${t.label}</span>`).join("")}</div>
                   <select class="input sel" id="cal-owner"><option value="">Everyone</option>${D.team.sales.map(s => `<option>${s}</option>`).join("")}</select>
                 </div>
                 <div id="cal"></div>`,
        })}
        ${U.card({ title: "Coming up", sub: "Next 14 days", body: `<div class="list" id="agenda"></div>` })}
      </div>`;

    const cal = root.querySelector("#cal");
    const drawCal = () => {
      const ev = allEvents();
      root.querySelector("#cal-title").textContent = cursor.toLocaleDateString("en-US", { month: "long", year: "numeric" });
      const first = new Date(cursor);
      const start = new Date(first);
      start.setDate(1 - ((first.getDay() + 6) % 7)); // weeks start on Monday
      let html = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(d => `<div class="cal-dow">${d}</div>`).join("");
      for (let i = 0; i < 42; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        const key = D.iso(d);
        const dayEv = ev.filter(e => e.date === key);
        const isToday = key === D.today, other = d.getMonth() !== cursor.getMonth();
        html += `<div class="cal-day${isToday ? " today" : ""}${other ? " other" : ""}">
          <span class="n">${d.getDate()}</span>
          ${dayEv.slice(0, 3).map(e => `<span class="ev t-${toneOf[e.type]}" data-ev="${e.id}" title="${U.esc(e.title)}"><b>${e.time}</b>${U.esc(e.title.split(" — ")[1] || e.title)}</span>`).join("")}
          ${dayEv.length > 3 ? `<span class="more-ev">+${dayEv.length - 3} more</span>` : ""}
        </div>`;
      }
      cal.innerHTML = `<div class="cal">${html}</div>`;
      cal.firstChild.animate([{ opacity: 0, transform: "translateY(6px)" }, { opacity: 1, transform: "none" }], { duration: 300, easing: "ease-out" });
    };

    const drawAgenda = () => {
      const up = allEvents().filter(e => U.days(e.date) >= 0 && U.days(e.date) <= 14);
      root.querySelector("#agenda").innerHTML = up.length ? up.map(e => {
        const d = U.parse(e.date);
        return `<div class="li clickable" data-ev="${e.id}">
          <span class="dateblock t-${toneOf[e.type]}"><b>${d.getDate()}</b><small>${d.toLocaleDateString("en-US", { weekday: "short" })}</small></span>
          <div class="li-main"><div class="li-title">${U.esc(e.title)}</div><div class="li-sub">${e.time} · ${labelOf[e.type]} · ${e.owner.split(" ")[0]}</div></div>
        </div>`;
      }).join("") : U.empty("Nothing scheduled in the next two weeks.");
    };

    const openEvent = id => {
      const e = allEvents().find(x => x.id === id);
      if (!e) return;
      const o = D.opps.find(x => x.id === e.oppId);
      U.drawer({
        title: U.esc(e.title), sub: `${labelOf[e.type]} · ${U.dateY(e.date)} at ${e.time}`,
        body: `${U.kv([
          ["When", `${U.dateY(e.date)} · ${e.time} <span class="muted">(${U.rel(e.date)})</span>`],
          ["Type", U.badge(labelOf[e.type], toneOf[e.type], true)],
          ["Who", U.person(e.owner)],
          o && ["Opportunity", `${U.esc(o.title)} <span class="muted">· ${U.money(o.value)}</span>`],
          ["Note", U.esc(e.note)],
        ])}`,
        footer: o ? `<button class="btn primary" id="ev-opp">Open opportunity</button>` : "",
        onMount(el) { el.querySelector("#ev-opp")?.addEventListener("click", () => App.views.opportunity(o)); },
      });
    };

    root.addEventListener("click", e => { const t = e.target.closest("[data-ev]"); if (t) openEvent(t.dataset.ev); });
    root.querySelector("#cal-prev").addEventListener("click", () => { cursor.setMonth(cursor.getMonth() - 1); drawCal(); });
    root.querySelector("#cal-next").addEventListener("click", () => { cursor.setMonth(cursor.getMonth() + 1); drawCal(); });
    root.querySelector("#cal-today").addEventListener("click", () => { cursor = new Date(today.getFullYear(), today.getMonth(), 1); drawCal(); });
    root.querySelector("#cal-owner").addEventListener("change", e => { owner = e.target.value; drawCal(); drawAgenda(); });
    drawCal();
    drawAgenda();
  },
});
