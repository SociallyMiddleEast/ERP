/* Sales → New opportunity   (#sales/new-opportunity)   ?customer=C101 pre-selects a customer */
App.page("sales/new-opportunity", {
  title: "New opportunity",
  subtitle: "Add a new sales opportunity. It appears in the pipeline straight away and, if it needs a tender, in Tendering too.",

  render(root, ctx) {
    const U = App.ui, D = App.data;
    const openStages = D.stages.filter(s => D.isOpen({ stage: s.id }));

    root.innerHTML = `
      <div class="grid split">
        <form class="card form" id="opp-form" novalidate>
          <div class="sec-title">The opportunity</div>
          <div class="form-grid">
            <div class="field full"><label for="f-title">Title <i>*</i></label>
              <input class="input" id="f-title" placeholder="e.g. Pumping station automation — phase 2"><div class="msg">Give the opportunity a title.</div></div>
            <div class="field"><label for="f-customer">Customer <i>*</i></label>
              <select class="input" id="f-customer"><option value="">Choose a customer…</option>${D.customers.map(c => `<option value="${c.id}" ${ctx.query.customer === c.id ? "selected" : ""}>${U.esc(c.name)}</option>`).join("")}</select>
              <div class="msg">Choose the customer.</div></div>
            <div class="field"><label for="f-owner">Owner</label>
              <select class="input" id="f-owner">${D.team.sales.map(s => `<option>${s}</option>`).join("")}</select></div>
            <div class="field"><label for="f-value">Estimated value <i>*</i></label>
              <div class="money-in"><span>$</span><input class="input" id="f-value" inputmode="numeric" placeholder="250,000"></div>
              <div class="msg">Enter a value above zero.</div></div>
            <div class="field"><label for="f-close">Expected close <i>*</i></label>
              <input class="input" type="date" id="f-close" value="${D.day(60)}"><div class="msg">Pick a date in the future.</div></div>
            <div class="field"><label for="f-stage">Stage</label>
              <select class="input" id="f-stage">${openStages.map(s => `<option value="${s.id}">${s.label}</option>`).join("")}</select></div>
            <div class="field"><label for="f-prob">Probability: <b id="f-prob-v">10%</b></label>
              <input type="range" id="f-prob" min="0" max="100" step="5" value="10"></div>
            <div class="field"><label for="f-source">Source</label>
              <select class="input" id="f-source">${["Existing customer", "Referral", "Website", "Exhibition", "Tender portal"].map(s => `<option>${s}</option>`).join("")}</select></div>
            <div class="field"><label for="f-next">Next step</label>
              <input class="input" id="f-next" placeholder="e.g. Site visit" value="Qualify the scope"></div>
          </div>

          <div class="sec-title" style="margin-top:6px">Scope</div>
          <div class="field"><span class="lbl">Engineering disciplines needed</span>
            <div class="checks">${D.disciplines.map(d => `<label class="check-chip"><input type="checkbox" name="disc" value="${d.id}" ${d.id === "electrical" ? "checked" : ""}><span>${U.icon(d.id, 15)} ${d.label}</span></label>`).join("")}</div>
          </div>
          <label class="switch"><input type="checkbox" id="f-tender"><span class="knob"></span> Requires a formal tender</label>
          <div class="reveal-h" id="tender-box"><div>
            <div class="field" style="padding-top:4px;max-width:260px"><label for="f-tdue">Tender submission date</label>
              <input class="input" type="date" id="f-tdue" value="${D.day(21)}"></div>
          </div></div>
          <div class="field"><label for="f-notes">Notes</label>
            <textarea class="input" id="f-notes" placeholder="Anything the team should know: scope, competitors, decision makers…"></textarea></div>

          <div class="row" style="justify-content:flex-end">
            <button type="reset" class="btn ghost">Clear</button>
            <button type="submit" class="btn primary">${U.icon("check", 15)} Create opportunity</button>
          </div>
        </form>

        <div class="stack" style="display:grid;gap:16px;align-content:start">
          ${U.card({ title: "Preview", sub: "Updates as you type", body: `<div id="preview"></div>` })}
          ${U.card({ title: "Good to know", body: `<div class="list small">
            <div class="li"><span class="li-icon t-violet">${U.icon("tendering", 15)}</span><div class="li-main muted" style="white-space:normal">Opportunities that need a tender get an offer checklist in <b>Tendering</b>.</div></div>
            <div class="li"><span class="li-icon t-teal">${U.icon("board", 15)}</span><div class="li-main muted" style="white-space:normal">You can drag it between stages later on the <b>All opportunities</b> board.</div></div>
          </div>` })}
        </div>
      </div>`;

    const $ = s => root.querySelector(s);
    const form = $("#opp-form");
    const num = () => Number(($("#f-value").value || "").replace(/[^\d.]/g, "")) || 0;

    const preview = () => {
      const st = D.stage($("#f-stage").value), v = num(), p = +$("#f-prob").value;
      const cust = D.customers.find(c => c.id === $("#f-customer").value);
      const discs = [...form.querySelectorAll("[name=disc]:checked")].map(i => i.value);
      $("#preview").innerHTML = `
        <div class="kc-title" style="font-size:16px">${U.esc($("#f-title").value) || '<span class="muted">Untitled opportunity</span>'}</div>
        <div class="kc-sub">${cust ? U.esc(cust.name) : "No customer yet"}</div>
        <div class="row between" style="margin-top:16px">
          <div><div class="big-num tnum">${U.money(v)}</div><div class="muted small">${U.money((v * p) / 100)} weighted</div></div>
          ${App.charts.ring(p, 58)}
        </div>
        <div class="row between" style="margin-top:14px">${U.badge(st.label, st.tone, true)}${U.discChips(discs)}
          <span class="muted small">${$("#f-close").value ? "closes " + U.rel($("#f-close").value) : ""}</span></div>`;
    };

    $("#f-stage").addEventListener("change", () => { $("#f-prob").value = D.stage($("#f-stage").value).prob; $("#f-prob-v").textContent = $("#f-prob").value + "%"; preview(); });
    $("#f-prob").addEventListener("input", () => { $("#f-prob-v").textContent = $("#f-prob").value + "%"; preview(); });
    $("#f-value").addEventListener("input", e => {
      const n = num();
      e.target.value = n ? n.toLocaleString("en-US") : "";
      preview();
    });
    $("#f-tender").addEventListener("change", e => $("#tender-box").classList.toggle("open", e.target.checked));
    form.addEventListener("input", e => { e.target.closest(".field")?.classList.remove("err"); preview(); });
    form.addEventListener("reset", () => setTimeout(() => { $("#tender-box").classList.remove("open"); $("#f-prob-v").textContent = "10%"; form.querySelectorAll(".err").forEach(f => f.classList.remove("err")); preview(); }));

    form.addEventListener("submit", e => {
      e.preventDefault();
      const checks = [
        ["#f-title", $("#f-title").value.trim().length > 2],
        ["#f-customer", !!$("#f-customer").value],
        ["#f-value", num() > 0],
        ["#f-close", $("#f-close").value && U.days($("#f-close").value) > 0],
      ];
      let firstBad = null;
      checks.forEach(([sel, ok]) => {
        const f = $(sel).closest(".field");
        f.classList.remove("err");
        if (!ok) { void f.offsetWidth; f.classList.add("err"); firstBad = firstBad || $(sel); }
      });
      if (firstBad) { firstBad.focus(); U.toast("Please fill in the highlighted fields", "red"); return; }

      const nextNo = Math.max(...D.opps.map(o => +o.id.split("-")[1])) + 1;
      const tender = $("#f-tender").checked;
      const o = {
        id: "OPP-" + nextNo, title: $("#f-title").value.trim(), customerId: $("#f-customer").value,
        stage: $("#f-stage").value, value: num(), probability: +$("#f-prob").value, owner: $("#f-owner").value,
        created: D.today, expectedClose: $("#f-close").value,
        disciplines: [...form.querySelectorAll("[name=disc]:checked")].map(i => i.value),
        source: $("#f-source").value, requiresTender: tender,
        nextAction: $("#f-next").value.trim() || "Qualify the scope", nextDue: D.day(3),
        tenderDue: tender ? $("#f-tdue").value : null, notes: $("#f-notes").value.trim(),
        checklist: Object.fromEntries(D.tenderSteps.map(([k]) => [k, false])),
      };
      D.opps.unshift(o);
      App.save("opps");
      U.toast(`${U.esc(o.title)} created`);
      App.go(`sales/opportunities?open=${o.id}`);
    });

    preview();
  },
});
