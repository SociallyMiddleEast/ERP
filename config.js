/* =====================================================================
   NAVIGATION CONFIG — the only file you edit to change the menu.

   Each section:
     id        url name (no spaces)       → becomes #id in the address bar
     label     text shown in the menu
     icon      one of the keys in ICONS below
     desc      short line shown under the page title
     more      true  → shown inside the "More" dropdown instead of the bar
     group     heading it sits under inside "More"
     pages     the sub-tabs:  { id, label, action?: true }
               (action: true → styled as a "+ create" button)
   ===================================================================== */

window.NAV = [
  {
    id: "home", label: "Home", icon: "home",
    desc: "Your two main dashboards.",
    pages: [
      { id: "sales-pipeline",      label: "Sales pipeline" },
      { id: "eng-purchasing-cost", label: "Engineering & purchasing cost" },
    ],
  },
  {
    id: "sales", label: "Sales", icon: "sales",
    desc: "Opportunities, customers and the sales calendar.",
    pages: [
      { id: "opportunities",   label: "All opportunities" },
      { id: "customers",       label: "Customers" },
      { id: "schedule",        label: "Schedule" },
      { id: "new-opportunity", label: "New opportunity", action: true },
    ],
  },
  {
    id: "tendering", label: "Tendering", icon: "tendering",
    desc: "Every opportunity currently open for tender.",
    pages: [
      { id: "open-opportunities", label: "Open opportunities" },
    ],
  },
  {
    id: "engineering", label: "Engineering", icon: "engineering",
    desc: "Mechanical, electrical and digital engineering.",
    pages: [
      { id: "mechanical", label: "Mechanical" },
      { id: "electrical", label: "Electrical" },
      { id: "digital",    label: "Digital" },
    ],
  },
  { id: "project-management", label: "Project Management", icon: "projects", desc: "Coming next.", pages: [] },
  { id: "factory",            label: "Factory",            icon: "factory",  desc: "Coming next.", pages: [] },

  // ---- Inside "More" ----
  { id: "customer-service", label: "Customer service", icon: "support",    more: true, group: "Operations",   desc: "Coming next.", pages: [] },
  { id: "purchasing",       label: "Purchasing",       icon: "purchasing", more: true, group: "Supply chain", desc: "Coming next.", pages: [] },
  { id: "stock",            label: "Stock",            icon: "stock",      more: true, group: "Supply chain", desc: "Coming next.", pages: [] },
  { id: "hr",               label: "HR",               icon: "hr",         more: true, group: "Back office",  desc: "Coming next.", pages: [] },
  { id: "finance",          label: "Finance",          icon: "finance",    more: true, group: "Back office",  desc: "Coming next.", pages: [] },
];

/* Simple line icons (24×24 SVG paths) */
window.ICONS = {
  home:        "M3 11l9-7 9 7M5 9.5V20h5v-6h4v6h5V9.5",
  sales:       "M3 17l6-6 4 4 8-8M15 7h6v6",
  tendering:   "M14 3H6v18h12V7zM14 3v4h4M9 12h6M9 16h6",
  engineering: "M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.4-.6-.6-2.4z",
  projects:    "M4 4h16v16H4zM9.5 4v16M15 4v10",
  factory:     "M3 21V10l6 4v-4l6 4V6l6 3v12zM7 17h2M12 17h2M17 17h1",
  support:     "M4 14v-2a8 8 0 0 1 16 0v2M4 14h3v5H4zM17 14h3v5h-3z",
  purchasing:  "M3 4h2.5l2.2 11h10.6L21 7H6.4M9 20.5h.01M17 20.5h.01",
  stock:       "M3 7.5l9-4.5 9 4.5v9L12 21l-9-4.5zM3 7.5l9 4.5 9-4.5M12 12v9",
  hr:          "M16 20v-1.5a4 4 0 0 0-8 0V20M12 11a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4M21 20v-1a3 3 0 0 0-2.5-3M17 4.6a3.2 3.2 0 0 1 0 6",
  finance:     "M12 3v18M16.5 7H10a3 3 0 0 0 0 6h4a3 3 0 0 1 0 6H7",
  plus:        "M12 5v14M5 12h14",
};
