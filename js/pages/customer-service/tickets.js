/* Customer service → Tickets   (#customer-service/tickets)   ?new=1 opens a new-ticket form */
App.page("customer-service/tickets", {
  title: "Support tickets",
  subtitle: "After-sales requests from customers, with their response deadline (SLA).",
  actions: () => `<button class="btn primary" id="tk-new">${App.ui.icon("plus", 15)} New ticket</button>`,

  render(root, ctx) {
    const U = App.ui, D = App.data;
    const T = () => D.tickets;
    const isOpen = t => t.status !== "Resolved";
    const breach = t => isOpen(t) && U.days(t.slaDue) < 0;
    const statuses = ["Open", "In progress", "Waiting customer", "Resolved"];

    const stats = () => `
      ${U.stat({ label: "Open tickets", icon: "support", tone: "teal", value: T().filter(isOpen).length, foot: `${T().length} this month` })}
      ${U.stat({ label: "Critical", icon: "alert", tone: "red", value: T().filter(t => isOpen(t) && t.priority === "Critical").length, foot: "need same-day response" })}
      ${U.stat({ label: "SLA breached", icon: "clock", tone: T().some(breach) ? "coral" : "green", value: T().filter(breach).length, foot: "past response deadline" })}
      ${U.stat({ label: "Resolved", icon: "check", tone: "green", value: T().filter(t => !isOpen(t)).length, foot: "avg. 1.8 days to resolve" })}`;

    root.innerHTML = `<div class="grid cols-4" id="tk-stats">${stats()}</div>${U.card({ cls: "mt", title: "All tickets", sub: "Click a ticket to update it", body: `<div id="tk-table"></div>` })}`;

    const table = U.table(root.querySelector("#tk-table"), {
      rows: T, placeholder: "Search subject, customer, number…",
      search: t => `${t.id} ${t.subject} ${D.customer(t.customerId).name} ${t.assignee}`,
      filters: [
        { key: "status", label: "Status", options: statuses },
        { key: "priority", label: "Priority", options: ["Critical", "High", "Medium", "Low"] },
        { key: "assignee", label: "Technician", options: D.team.service },
      ],
      sortKey: "slaDue",
      rowClass: t => (breach(t) ? "warn" : ""),
      columns: [
        { key: "subject", label: "Ticket", render: t => `<span class="cell-title">${U.esc(t.subject)}</span><span class="cell-sub">${t.id} · ${U.esc(D.customer(t.customerId).name)}</span>` },
        { key: "priority", label: "Priority", sort: t => ["Critical", "High", "Medium", "Low"].indexOf(t.priority), render: t => U.badge(t.priority, D.priorityTone[t.priority]) },
        { key: "status", label: "Status", render: t => U.badge(t.status, D.ticketTone[t.status], true) },
        { key: "assignee", label: "Technician", render: t => U.person(t.assignee) },
        { key: "opened", label: "Opened", render: t => U.rel(t.opened) },
        { key: "slaDue", label: "SLA", render: t => U.dueTag(t.slaDue, { done: !isOpen(t) }) },
      ],
      onRow: t => openTicket(t),
    });
    const refresh = () => { table.refresh(); root.querySelector("#tk-stats").innerHTML = stats(); };

    function openTicket(t) {
      U.drawer({
        title: U.esc(t.subject), sub: `${t.id} · ${U.esc(D.customer(t.customerId).name)} · via ${t.channel}`,
        body: `
          <div class="form-grid">
            <div class="field"><label>Status</label><select class="input" id="tk-st">${statuses.map(s => `<option ${s === t.status ? "selected" : ""}>${s}</option>`).join("")}</select></div>
            <div class="field"><label>Technician</label><select class="input" id="tk-as">${D.team.service.map(s => `<option ${s === t.assignee ? "selected" : ""}>${s}</option>`).join("")}</select></div>
          </div>
          ${U.kv([["Priority", U.badge(t.priority, D.priorityTone[t.priority])], ["Opened", `${U.dateY(t.opened)} (${U.rel(t.opened)})`], ["Respond by", `${U.dateY(t.slaDue)} · ${U.dueTag(t.slaDue, { done: !isOpen(t) })}`], ["Contact", U.person(D.customer(t.customerId).contact, D.customer(t.customerId).email)]])}`,
        footer: `<a class="btn" href="#customer-service/service-visits">Plan a site visit</a><button class="btn primary" id="tk-save">Save</button>`,
        onMount(el, api) {
          el.querySelector("#tk-save").addEventListener("click", () => {
            t.status = el.querySelector("#tk-st").value;
            t.assignee = el.querySelector("#tk-as").value;
            App.save("tickets"); refresh(); api.close(); U.toast(`${t.id} saved`);
          });
        },
      });
    }

    function newTicket() {
      U.drawer({
        title: "New support ticket", sub: "Log a request from a customer",
        body: `<form class="form" id="nt" novalidate>
          <div class="field"><label>Subject <i>*</i></label><input class="input" id="nt-s" placeholder="e.g. Pump not starting in auto"><div class="msg">Add a short subject.</div></div>
          <div class="field"><label>Customer</label><select class="input" id="nt-c">${D.customers.map(c => `<option value="${c.id}">${U.esc(c.name)}</option>`).join("")}</select></div>
          <div class="form-grid">
            <div class="field"><label>Priority</label><select class="input" id="nt-p">${["Low", "Medium", "High", "Critical"].map(p => `<option ${p === "Medium" ? "selected" : ""}>${p}</option>`).join("")}</select></div>
            <div class="field"><label>Channel</label><select class="input" id="nt-ch"><option>Phone</option><option>Email</option><option>Portal</option></select></div>
          </div>
          <div class="field"><label>Technician</label><select class="input" id="nt-a">${D.team.service.map(s => `<option>${s}</option>`).join("")}</select></div>
        </form>`,
        footer: `<button class="btn primary" id="nt-go">${U.icon("check", 15)} Create ticket</button>`,
        onMount(el, api) {
          el.querySelector("#nt-go").addEventListener("click", () => {
            const s = el.querySelector("#nt-s");
            if (!s.value.trim()) { s.closest(".field").classList.add("err"); s.focus(); return; }
            const pr = el.querySelector("#nt-p").value;
            D.tickets.unshift({
              id: "TCK-" + (Math.max(...D.tickets.map(t => +t.id.split("-")[1])) + 1), subject: s.value.trim(),
              customerId: el.querySelector("#nt-c").value, priority: pr, status: "Open", assignee: el.querySelector("#nt-a").value,
              opened: D.today, slaDue: D.day({ Critical: 0, High: 1, Medium: 3, Low: 5 }[pr]), channel: el.querySelector("#nt-ch").value,
            });
            App.save("tickets"); refresh(); api.close(); U.toast("Ticket created");
          });
        },
      });
    }

    document.getElementById("tk-new").addEventListener("click", newTicket);
    if (ctx.query.new) setTimeout(newTicket, 450);
  },
});
