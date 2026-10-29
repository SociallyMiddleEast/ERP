/* =====================================================================
   OPPORTUNITY DETAILS — side panel used by Home, Sales, Customers and
   Tendering.  App.views.opportunity(opp, onChange)
   ===================================================================== */
(function () {
  const U = App.ui, D = App.data;

  App.views.opportunity = (o, onChange) => {
    const cust = D.customer(o.customerId);
    const st = D.stage(o.stage);
    const open = D.isOpen(o);
    const done = o.checklist ? D.tenderSteps.filter(([k]) => o.checklist[k]).length : 0;

    U.drawer({
      title: U.esc(o.title),
      sub: `${o.id} · ${U.esc(cust.name)}`,
      body: `
        <div class="row between">
          <div><div class="sec-title">Value</div><div class="big-num tnum">${U.money(o.value)}</div>
            <div class="muted small">${U.money((o.value * o.probability) / 100)} weighted at ${o.probability}%</div></div>
          ${App.charts.ring(o.probability, 64, `var(--c${{ gray: 1, blue: 3, violet: 5, amber: 2, coral: 4, green: 6, red: 4 }[st.tone]})`)}
        </div>
        <div class="field"><label for="opp-stage">Stage</label>
          <select class="input" id="opp-stage">${D.stages.map(s => `<option value="${s.id}" ${s.id === o.stage ? "selected" : ""}>${s.label}</option>`).join("")}</select>
        </div>
        ${U.kv([
          ["Customer", `${U.esc(cust.name)} <span class="muted">· ${U.esc(cust.country || "")}</span>`],
          ["Contact", cust.contact ? `${U.esc(cust.contact)} <span class="muted">· ${U.esc(cust.email)}</span>` : "—"],
          ["Owner", U.person(o.owner)],
          ["Expected close", `${U.dateY(o.expectedClose)} <span class="muted">(${U.rel(o.expectedClose)})</span>`],
          ["Disciplines", U.discChips(o.disciplines)],
          ["Source", U.esc(o.source)],
          open && ["Next step", `${U.esc(o.nextAction)} · ${U.dueTag(o.nextDue)}`],
          open && ["Tender due", o.tenderDue ? `${U.dateY(o.tenderDue)} · ${U.dueTag(o.tenderDue)}` : "Not set"],
          open && o.checklist && ["Offer ready", `${done} of ${D.tenderSteps.length} steps`],
        ])}
        ${o.notes ? `<div><div class="sec-title">Notes</div><p class="small">${U.esc(o.notes)}</p></div>` : ""}`,
      footer: `${open ? `<a class="btn" href="#tendering/open-opportunities?open=${o.id}">${U.icon("tendering", 15)} Open in Tendering</a>` : ""}
               <button class="btn primary" data-close-x>Done</button>`,
      onMount(el, api) {
        el.querySelector("[data-close-x]").addEventListener("click", () => api.close());
        el.querySelector("#opp-stage").addEventListener("change", e => {
          o.stage = e.target.value;
          o.probability = D.stage(o.stage).prob;
          if (D.isOpen(o) && !o.checklist) o.checklist = Object.fromEntries(D.tenderSteps.map(([k]) => [k, false]));
          App.save("opps");
          U.toast(`${U.esc(o.title)} moved to ${D.stage(o.stage).label}`);
          api.close();
          onChange && onChange(o);
        });
      },
    });
  };
})();
