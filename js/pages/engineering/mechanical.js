/* Engineering → Mechanical engineering   (#engineering/mechanical)
   Layout and logic are shared with the other disciplines:
   see js/shared/engineering-discipline.js                                  */
App.page("engineering/mechanical", {
  title: "Mechanical engineering",
  subtitle: "Structures, skids, piping and 3D models.",
  actions: () => `<a class="btn" href="#purchasing/requests">${App.ui.icon("purchasing", 15)} Purchase requests</a>`,
  render: (root, ctx) => App.views.discipline(root, "mechanical", ctx),
});
