/* Purchasing → Purchase requests   (#purchasing/requests)
   Engineering asks to buy something → purchasing approves or rejects.  ?new=1 opens the form */
App.page("purchasing/requests", {
  title: "Purchase requests",
  subtitle: "Requests from engineering and the factory. Approve them to turn them into purchase orders.",
  actions: () => `<button class="btn primary" id="pr-new">${App.ui.icon("plus", 15)} New request</button>`,

  render(root, ctx) {
    const U = App.ui, D = App.data;
    const stTone = { Pending: "amber", Approved: "green", Rejected: "red" };
    let filter = "Pending";

    const stats = () => {
      const R = D.requests, pend = R.filter(r => r.status === "Pending");
      return `
        ${U.stat({ label: "Waiting for approval", icon: "clock", tone: "amber", value: pend.length, foot: U.compact(U.sum(pend, r => r.value)) + " requested" })}
        ${U.stat({ label: "Approved", icon: "check", tone: "green", value: R.filter(r => r.status === "Approved").length, foot: U.compact(U.sum(R.filter(r => r.status === "Approved"), r => r.value)) })}
        ${U.stat({ label: "Rejected", icon: "x", tone: "red", value: R.filter(r => r.status === "Rejected").length, foot: "sent back" })}
        ${U.stat({ label: "Needed this week", icon: "calendar", tone: "coral", value: pend.filter(r => U.days(r.needed) <= 7).length, foot: "pending and urgent" })}`;
    };

    root.innerHTML = `
      <div class="grid cols-4" id="pr-stats">${stats()}</div>
      <div class="row between mt" style="margin-bottom:12px">${U.seg([["Pending", "Pending"], ["Approved", "Approved"], ["Rejected", "Rejected"], ["all", "All"]], filter, "f")}</div>
      <div class="card"><div class="list" id="pr-list"></div></div>`;

    const draw = () => {
      const list = D.requests.filter(r => filter === "all" || r.status === filter).sort((a, b) => a.needed.localeCompare(b.needed));
      root.querySelector("#pr-list").innerHTML = list.length ? list.map(r => {
        const d = D.disciplines.find(x => x.id === r.discipline);
        return `<div class="li" data-r="${r.id}">
          <span class="li-icon t-${d ? d.tone : "gray"}">${U.icon(r.discipline in { mechanical: 1, electrical: 1, digital: 1 } ? r.discipline : "factory", 16)}</span>
          <div class="li-main"><div class="li-title">${U.esc(r.title)}</div>
            <div class="li-sub">${r.id} · ${r.requester} · ${U.esc(D.project(r.project).name)} · needed ${U.rel(r.needed)}</div></div>
          <div class="li-side">
            <b class="tnum">${U.money(r.value)}</b>
            ${r.status === "Pending"
              ? `<button class="btn sm ok" data-a="Approved">${U.icon("check", 14)} Approve</button><button class="btn sm no" data-a="Rejected">${U.icon("x", 14)}</button>`
              : U.badge(r.status, stTone[r.status], true)}
          </div></div>`;
      }).join("") : U.empty(filter === "Pending" ? "Nothing waiting for approval. Nice." : "No requests here.");
    };

    root.querySelector("#pr-list").addEventListener("click", e => {
      const b = e.target.closest("[data-a]");
      if (!b) return;
      const row = b.closest("[data-r]");
      const r = D.requests.find(x => x.id === row.dataset.r);
      r.status = b.dataset.a;
      App.save("requests");
      row.animate([{ opacity: 1, transform: "none" }, { opacity: 0, transform: "translateX(30px)" }], { duration: 300, easing: "ease-in" }).onfinish = () => {
        draw();
        root.querySelector("#pr-stats").innerHTML = stats();
      };
      U.toast(`${r.id} ${r.status.toLowerCase()}`, r.status === "Approved" ? "green" : "red");
    });
    U.onSeg(root, "f", v => { filter = v; draw(); });
    draw();

    function newRequest() {
      U.drawer({
        title: "New purchase request", sub: "Ask purchasing to buy something for a project",
        body: `<div class="form">
          <div class="field"><label>What do you need? <i>*</i></label><input class="input" id="nr-t" placeholder="e.g. 12 × pressure transmitters 0–10 bar"><div class="msg">Describe what to buy.</div></div>
          <div class="form-grid">
            <div class="field"><label>Estimated value <i>*</i></label><div class="money-in"><span>$</span><input class="input" id="nr-v" inputmode="numeric" placeholder="5,000"></div><div class="msg">Enter a value.</div></div>
            <div class="field"><label>Needed by</label><input class="input" type="date" id="nr-d" value="${D.day(14)}"></div>
            <div class="field"><label>Project</label><select class="input" id="nr-p">${D.projects.map(p => `<option value="${p.code}">${p.code} · ${U.esc(p.name)}</option>`).join("")}</select></div>
            <div class="field"><label>Discipline</label><select class="input" id="nr-di">${D.disciplines.map(d => `<option value="${d.id}">${d.label}</option>`).join("")}<option value="factory">Factory</option></select></div>
          </div></div>`,
        footer: `<button class="btn primary" id="nr-go">${U.icon("send", 15)} Send request</button>`,
        onMount(el, api) {
          el.querySelector("#nr-v").addEventListener("input", e => { const n = Number(e.target.value.replace(/[^\d]/g, "")); e.target.value = n ? n.toLocaleString("en-US") : ""; });
          el.querySelector("#nr-go").addEventListener("click", () => {
            const t = el.querySelector("#nr-t"), v = Number(el.querySelector("#nr-v").value.replace(/[^\d]/g, ""));
            let bad = false;
            if (!t.value.trim()) { t.closest(".field").classList.add("err"); bad = true; }
            if (!v) { el.querySelector("#nr-v").closest(".field").classList.add("err"); bad = true; }
            if (bad) return;
            const disc = el.querySelector("#nr-di").value;
            D.requests.unshift({
              id: "PR-" + (Math.max(...D.requests.map(r => +r.id.split("-")[1])) + 1), title: t.value.trim(), discipline: disc, value: v,
              project: el.querySelector("#nr-p").value, requester: SETTINGS.user.name, needed: el.querySelector("#nr-d").value, status: "Pending",
            });
            App.save("requests");
            filter = "Pending";
            root.querySelectorAll('[data-seg="f"] button').forEach(b => b.classList.toggle("on", b.dataset.v === "Pending"));
            draw(); root.querySelector("#pr-stats").innerHTML = stats();
            api.close(); U.toast("Request sent to purchasing");
          });
        },
      });
    }
    document.getElementById("pr-new").addEventListener("click", newRequest);
    if (ctx.query.new) setTimeout(newRequest, 450);
  },
});
