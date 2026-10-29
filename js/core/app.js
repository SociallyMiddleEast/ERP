/* =====================================================================
   App namespace — every other file adds itself onto window.App
     App.page(path, definition)   register a page (see js/pages/*)
     App.data                     sample data        (js/core/data.js)
     App.ui                       UI building blocks (js/core/ui.js)
     App.charts                   charts             (js/core/charts.js)
     App.views                    shared screens     (js/shared/*)
     App.go("sales/customers")    navigate from code
   ===================================================================== */

window.App = {
  settings: window.SETTINGS,
  pages: {},
  views: {},

  /*  A page definition:
      {
        title:    "Text" | (ctx) => "Text",
        subtitle: "Text" | (ctx) => "Text / HTML",
        actions:  (ctx) => "<a class='btn'>…</a>",   // buttons on the right of the title
        render:   (root, ctx) => { … }               // fills the page body
      }
      ctx = { section, page, query }  — query holds ?key=value from the URL  */
  page(path, def) {
    this.pages[path] = def;
  },
};
