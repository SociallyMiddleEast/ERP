/* Engineering → Electrical engineering   (#engineering/electrical)
   Layout and logic are shared with the other disciplines:
   see js/shared/engineering-discipline.js                                  */
App.page("engineering/electrical", {
  title: "Electrical engineering",
  subtitle: "Single line diagrams, panel layouts, cable schedules and load studies.",
  actions: () => `<a class="btn" href="#purchasing/requests">${App.ui.icon("purchasing", 15)} Purchase requests</a>`,
  render: (root, ctx) => App.views.discipline(root, "electrical", ctx),
});
