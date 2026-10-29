/* Engineering → Digital engineering   (#engineering/digital)
   Layout and logic are shared with the other disciplines:
   see js/shared/engineering-discipline.js                                  */
App.page("engineering/digital", {
  title: "Digital engineering",
  subtitle: "PLC programs, SCADA screens, networks and FAT procedures.",
  actions: () => `<a class="btn" href="#purchasing/requests">${App.ui.icon("purchasing", 15)} Purchase requests</a>`,
  render: (root, ctx) => App.views.discipline(root, "digital", ctx),
});
