/* Project Management → Tasks   (#project-management/tasks)
   Drag tasks between columns. ?project=PRJ-2401 filters, ?new=1 focuses the add box. */
App.page("project-management/tasks", {
  title: "Tasks",
  subtitle: "What the project teams are working on. Drag a card to update it.",

  render(root, ctx) {
    const U = App.ui, D = App.data;
    const cols = [
      { id: "todo", label: "To do", tone: "gray" }, { id: "doing", label: "In progress", tone: "blue" },
      { id: "review", label: "Review", tone: "amber" }, { id: "done", label: "Done", tone: "green" },
    ];
    const prTone = { Low: "gray", Medium: "blue", High: "coral" };
    let project = ctx.query.project || "";
    const people = [...new Set([...D.team.pm, ...D.team.electrical, ...D.team.mechanical, ...D.team.digital])];

    root.innerHTML = `
      ${U.card({
        body: `<form class="row" id="t-add">
          <input class="input" id="t-title" placeholder="Add a task… e.g. Send FAT invitation" style="flex:2;min-width:200px">
          <select class="input sel" id="t-proj">${D.projects.map(p => `<option value="${p.code}">${p.code} · ${U.esc(p.name)}</option>`).join("")}</select>
          <select class="input sel" id="t-who">${people.map(p => `<option>${p}</option>`).join("")}</select>
          <input class="input" type="date" id="t-due" value="${D.day(7)}" style="width:auto">
          <button class="btn primary" type="submit">${U.icon("plus", 15)} Add</button>
        </form>`,
      })}
      <div class="row between mt" style="margin-bottom:12px">
        <select class="input sel" id="t-filter"><option value="">All projects</option>${D.projects.map(p => `<option value="${p.code}" ${p.code === project ? "selected" : ""}>${p.code} · ${U.esc(p.name)}</option>`).join("")}</select>
        <span class="muted small" id="t-count"></span>
      </div>
      <div id="t-board"></div>`;

    const visible = () => D.tasks.filter(t => !project || t.project === project);
    const board = U.kanban(root.querySelector("#t-board"), {
      columns: cols, items: visible, key: t => t.status,
      card: t => `
        <div class="row between" style="margin-bottom:8px">${U.badge(t.priority, prTone[t.priority])}<span class="muted small">${t.project}</span></div>
        <div class="kc-title">${U.esc(t.title)}</div>
        <div class="kc-sub">${U.esc(D.project(t.project).name)}</div>
        <div class="kc-foot"><span class="row" style="gap:6px">${U.avatar(t.assignee, 22)}${t.assignee.split(" ")[0]}</span>${t.status === "done" ? U.badge("Done", "green") : U.dueTag(t.due)}</div>`,
      onMove(t, col) {
        t.status = col;
        App.save("tasks");
        U.toast(col === "done" ? `“${U.esc(t.title)}” done` : `Moved to ${cols.find(c => c.id === col).label}`, col === "done" ? "green" : "teal");
        count();
      },
      onClick(t) {
        U.drawer({
          title: U.esc(t.title), sub: `${t.id} · ${U.esc(D.project(t.project).name)}`,
          body: `<div class="field"><label>Status</label><select class="input" id="td-st">${cols.map(c => `<option value="${c.id}" ${c.id === t.status ? "selected" : ""}>${c.label}</option>`).join("")}</select></div>
                 ${U.kv([["Assignee", U.person(t.assignee)], ["Priority", U.badge(t.priority, prTone[t.priority])], ["Due", `${U.dateY(t.due)} · ${U.dueTag(t.due)}`], ["Project", `${t.project}`]])}`,
          footer: `<button class="btn no" id="td-del">Delete task</button>`,
          onMount(el, api) {
            el.querySelector("#td-st").addEventListener("change", e => { t.status = e.target.value; App.save("tasks"); board.refresh(); count(); api.close(); U.toast("Task updated"); });
            el.querySelector("#td-del").addEventListener("click", () => { D.tasks.splice(D.tasks.indexOf(t), 1); App.save("tasks"); board.refresh(); count(); api.close(); U.toast("Task deleted", "red"); });
          },
        });
      },
    });

    const count = () => {
      const v = visible();
      root.querySelector("#t-count").textContent = `${v.filter(t => t.status !== "done").length} open · ${v.filter(t => t.status === "done").length} done`;
    };
    root.querySelector("#t-filter").addEventListener("change", e => { project = e.target.value; board.refresh(); count(); });
    root.querySelector("#t-add").addEventListener("submit", e => {
      e.preventDefault();
      const title = root.querySelector("#t-title").value.trim();
      if (!title) { root.querySelector("#t-title").focus(); return U.toast("Type a task title first", "red"); }
      D.tasks.unshift({
        id: "T" + Date.now().toString().slice(-6), title, project: root.querySelector("#t-proj").value,
        assignee: root.querySelector("#t-who").value, status: "todo", due: root.querySelector("#t-due").value || D.day(7), priority: "Medium",
      });
      App.save("tasks");
      root.querySelector("#t-title").value = "";
      board.refresh(); count();
      U.toast("Task added");
    });
    if (project) root.querySelector("#t-proj").value = project;
    count();
    if (ctx.query.new) setTimeout(() => root.querySelector("#t-title").focus(), 400);
  },
});
