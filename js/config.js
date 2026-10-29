/* =====================================================================
   CONFIG — the only file you need to edit for names and the menu.
   ===================================================================== */

window.SETTINGS = {
  company: "Socially",                  // brand name in the top-left corner
  user: { name: "Miguel Faraj", initials: "MF", role: "Administrator" },
  currency: "USD",
  locale: "en-US",
  site: "Main office",                 // shown in the status line: "Main office online"
};

/* ---------------------------------------------------------------------
   MENU
   Each section:
     id     url name                  → #id in the address bar
     label  text shown in the menu
     icon   a key from js/core/icons.js
     desc   default line under the page title
     more   true → lives inside the "More" dropdown
     group  heading inside "More"
     pages  sub-tabs: { id, label, action?: true }
            Every page has its own file: js/pages/<section id>/<page id>.js
   --------------------------------------------------------------------- */

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
    desc: "Every open opportunity and where its offer stands.",
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
  {
    id: "project-management", label: "Project Management", icon: "projects",
    desc: "Delivery of every won project.",
    pages: [
      { id: "projects", label: "Projects" },
      { id: "timeline", label: "Timeline" },
      { id: "tasks",    label: "Tasks" },
    ],
  },
  {
    id: "factory", label: "Factory", icon: "factory",
    desc: "Production, workshop capacity and quality.",
    pages: [
      { id: "production-orders", label: "Production orders" },
      { id: "work-centers",      label: "Work centers" },
      { id: "quality",           label: "Quality" },
    ],
  },

  // ---------- Inside "More" ----------
  {
    id: "customer-service", label: "Customer service", icon: "support", more: true, group: "Operations",
    desc: "After-sales support and site visits.",
    pages: [
      { id: "tickets",        label: "Tickets" },
      { id: "service-visits", label: "Service visits" },
    ],
  },
  {
    id: "purchasing", label: "Purchasing", icon: "purchasing", more: true, group: "Supply chain",
    desc: "Buying for projects and the factory.",
    pages: [
      { id: "purchase-orders", label: "Purchase orders" },
      { id: "requests",        label: "Purchase requests" },
      { id: "suppliers",       label: "Suppliers" },
    ],
  },
  {
    id: "stock", label: "Stock", icon: "stock", more: true, group: "Supply chain",
    desc: "What is in the warehouse and what moved.",
    pages: [
      { id: "inventory", label: "Inventory" },
      { id: "movements", label: "Movements" },
    ],
  },
  {
    id: "hr", label: "HR", icon: "hr", more: true, group: "Back office",
    desc: "People and time off.",
    pages: [
      { id: "employees", label: "Employees" },
      { id: "leave",     label: "Leave" },
    ],
  },
  {
    id: "finance", label: "Finance", icon: "finance", more: true, group: "Back office",
    desc: "Invoicing, cash and budgets.",
    pages: [
      { id: "invoices",  label: "Invoices" },
      { id: "cash-flow", label: "Cash flow" },
      { id: "budget",    label: "Budget" },
    ],
  },
];
