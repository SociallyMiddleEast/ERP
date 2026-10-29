# Socially — company workspace

A dashboard web app for sales, tendering, engineering, projects, factory, service,
purchasing, stock, HR and finance. Plain HTML, CSS and JavaScript: no build step,
no libraries. It runs on GitHub Pages as-is.

## Put it online (GitHub Pages)

1. Create a repository on GitHub and upload **everything in this folder** (keep the folders).
2. Settings → Pages → Source: *Deploy from a branch* → `main` / `(root)` → Save.
3. After a minute it is live at `https://<your-user>.github.io/<repo>/`.

To try it on your computer, double-click `index.html`.

## Folder map

```
index.html                      the page shell (top bar) + list of scripts
css/
  base.css                      colours (dark & light) and the top navigation
  components.css                cards, tables, charts, forms, drawer, calendar…
js/
  config.js                     ← company name, user, currency, and the MENU
  core/
    icons.js                    line icons
    app.js                      the App object every file plugs into
    data.js                     sample data (replace with real data later)
    ui.js                       building blocks: stat cards, tables, boards, drawer…
    charts.js                   area, bar, donut, gantt, rings (pure SVG)
    router.js                   draws a page when the URL changes
    nav.js                      builds the menu and starts the app (loaded last)
  shared/
    opportunity-drawer.js       opportunity details panel (used on 4 pages)
    engineering-discipline.js   layout shared by the 3 engineering pages
  pages/                        ONE FILE PER PATH
    home/sales-pipeline.js            #home/sales-pipeline
    home/eng-purchasing-cost.js       #home/eng-purchasing-cost
    sales/opportunities.js            #sales/opportunities
    sales/customers.js                #sales/customers
    sales/schedule.js                 #sales/schedule
    sales/new-opportunity.js          #sales/new-opportunity
    tendering/open-opportunities.js   #tendering/open-opportunities
    engineering/mechanical.js         #engineering/mechanical
    engineering/electrical.js         #engineering/electrical
    engineering/digital.js            #engineering/digital
    project-management/projects.js    …and so on for every page
```

## Common changes

**Rename the company or user** — edit `SETTINGS` at the top of `js/config.js`.

**Add a page** (example: *Sales → Price lists*)
1. In `js/config.js`, add `{ id: "price-lists", label: "Price lists" }` to the Sales `pages`.
2. Create `js/pages/sales/price-lists.js`:
   ```js
   App.page("sales/price-lists", {
     title: "Price lists",
     subtitle: "Standard prices for panels and services.",
     render(root) {
       const U = App.ui;
       root.innerHTML = U.card({ title: "Hello", body: "<p>My new page</p>" });
     },
   });
   ```
3. In `index.html`, add `<script src="js/pages/sales/price-lists.js"></script>` with the other pages
   (before `js/core/nav.js`).

**Add a department** — add a new section to `NAV` in `js/config.js`
(set `more: true` and a `group` to put it inside the "More" menu), then add its page files as above.

**Use real data** — every page reads from `App.data` (`js/core/data.js`). Replace those arrays with
data from your system (e.g. `fetch()` from an API or a JSON file) and the pages keep working.

## Notes

- Changes you make in the app (new opportunities, approvals, moved cards) are saved in your
  browser only. Avatar menu → **Reset demo data** clears them.
- Press **Ctrl + K** (⌘K on Mac) to search pages, opportunities, customers and projects.
- The circular theme switch animation needs Chrome, Edge or Safari 18+; other browsers switch instantly.
