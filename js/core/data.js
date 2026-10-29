/* =====================================================================
   SAMPLE DATA
   Everything here is invented demo data. Dates are generated relative
   to today so the app always looks current.
   Later, replace these arrays with data loaded from your real system.

   Edits made in the app (new opportunities, moved cards, approvals…)
   are saved in the browser (localStorage). Avatar menu → "Reset demo data"
   clears them.
   ===================================================================== */
(function () {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const day = n => { const d = new Date(today); d.setDate(d.getDate() + n); return iso(d); };

  // Seeded random → same demo data on every load
  let seed = 20261;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const pick = a => a[Math.floor(rnd() * a.length)];
  const between = (a, b) => a + Math.floor(rnd() * (b - a + 1));
  const round = (n, s = 500) => Math.round(n / s) * s;
  const series = (n, lo, hi, smooth = 0.6) => {
    let v = (lo + hi) / 2;
    return Array.from({ length: n }, () => (v = Math.max(lo, Math.min(hi, v * smooth + (lo + rnd() * (hi - lo)) * (1 - smooth)))));
  };

  const D = (App.data = { today: iso(today), day, iso });

  D.months = Array.from({ length: 12 }, (_, i) =>
    new Date(today.getFullYear(), today.getMonth() - 11 + i, 1).toLocaleDateString("en-US", { month: "short" }));

  /* ---------------- People ---------------- */
  D.team = {
    sales:       ["Rania Khoury", "Karim Nassar", "Lea Haddad", "Omar Saleh"],
    mechanical:  ["Fadi Azar", "Maya Rizk", "Joseph Tannous", "Nour Kassem"],
    electrical:  ["Ziad Hamdan", "Carla Mansour", "Elie Daher", "Hiba Saad", "Tony Gerges"],
    digital:     ["Sami Fares", "Yara Aoun", "Marc Chidiac"],
    pm:          ["Nadim Sfeir", "Rita Abboud", "Georges Najjar"],
    purchasing:  ["Dana Khalil", "Walid Issa"],
    factory:     ["Hussein Kanaan", "Bilal Chahine", "Pierre Azzi", "Samir Toufic", "Antoine Bou Saab", "Rami Hayek"],
    service:     ["Hadi Mattar", "Charbel Wakim", "Ali Sabbagh"],
    finance:     ["Maya Sleiman", "Jad Harb"],
    hr:          ["Rouba Nasr"],
  };

  /* ---------------- Sales ---------------- */
  D.stages = [
    { id: "lead",        label: "Lead",        tone: "gray",   prob: 10 },
    { id: "qualified",   label: "Qualified",   tone: "blue",   prob: 25 },
    { id: "tendering",   label: "Tendering",   tone: "violet", prob: 40 },
    { id: "quote",       label: "Quote sent",  tone: "amber",  prob: 60 },
    { id: "negotiation", label: "Negotiation", tone: "coral",  prob: 80 },
    { id: "won",         label: "Won",         tone: "green",  prob: 100 },
    { id: "lost",        label: "Lost",        tone: "red",    prob: 0 },
  ];
  D.stage = id => D.stages.find(s => s.id === id) || D.stages[0];
  D.isOpen = o => o.stage !== "won" && o.stage !== "lost";

  D.disciplines = [
    { id: "mechanical", label: "Mechanical", short: "M", tone: "amber" },
    { id: "electrical", label: "Electrical", short: "E", tone: "blue" },
    { id: "digital",    label: "Digital",    short: "D", tone: "violet" },
  ];

  const contacts = ["Hassan Mourad", "Sara Fakhoury", "Ahmad Zein", "Mira Saliba", "Khaled Odeh", "Lina Bitar",
    "Rami Jaber", "Nadia Farah", "Tarek Habib", "Joelle Karam", "Bassam Ali", "Rima Daou"];
  const custList = [
    ["Atlas Cement", "Cement", "Lebanon"],
    ["Cedar Water Authority", "Water", "Lebanon"],
    ["Byblos Foods", "Food & beverage", "Lebanon"],
    ["Nile Agro Industries", "Food & beverage", "Egypt"],
    ["Gulf Polymers", "Petrochemical", "UAE"],
    ["Sahara Mining Co.", "Mining", "Algeria"],
    ["Phoenicia Pharma", "Pharmaceutical", "Lebanon"],
    ["Levant Steel", "Metals", "Jordan"],
    ["Red Sea Desalination", "Water", "Saudi Arabia"],
    ["Kyrenia Paper Mill", "Paper", "Cyprus"],
    ["Najd Logistics Hubs", "Logistics", "Saudi Arabia"],
    ["Aqaba Power Services", "Energy", "Jordan"],
  ];
  D.customers = custList.map(([name, industry, country], i) => {
    const contact = contacts[i];
    const slug = name.toLowerCase().replace(/[^a-z]+/g, "-").replace(/-$/, "");
    return {
      id: "C" + (101 + i), name, industry, country, contact,
      email: `${contact.split(" ")[0].toLowerCase()}@${slug}.example`,
      owner: D.team.sales[i % 4],
      since: 2014 + ((i * 3) % 11),
      lastContact: day(-between(1, 45)),
    };
  });
  D.customer = id => D.customers.find(c => c.id === id) || { name: "Unknown customer" };

  const oppTitles = [
    "Pumping station automation", "MCC & PCC panels", "SCADA upgrade", "Conveyor line retrofit",
    "Boiler house controls", "Water treatment PLC system", "11 kV switchgear substation", "Packaging line integration",
    "Kiln instrumentation upgrade", "RO desalination skid controls", "Cold storage refrigeration controls", "Steel platforms & walkways",
    "Batching plant automation", "Energy monitoring system", "Fire pump controllers", "Bottling line upgrade",
    "BMS & HVAC integration", "Generator synchronization panels", "Crusher plant electrical", "Mixer skid fabrication",
    "Clean room HVAC controls", "Wastewater lift stations", "Solar PV hybrid controller", "Paper machine drives retrofit",
  ];
  const stagePlan = ["lead", "lead", "lead", "qualified", "qualified", "qualified", "qualified", "tendering",
    "tendering", "tendering", "tendering", "quote", "quote", "quote", "negotiation", "negotiation",
    "won", "won", "won", "won", "won", "lost", "lost", "qualified"];
  const nextActions = {
    lead: ["Qualify the scope", "Intro call"],
    qualified: ["Site visit", "Clarify the scope", "Request drawings"],
    tendering: ["Submit technical offer", "Finish BOM costing", "Answer tender clarifications"],
    quote: ["Follow up on quote", "Send revised quote"],
    negotiation: ["Agree payment terms", "Final price review"],
    won: ["Kick-off meeting"], lost: ["Lessons learned"],
  };

  D.tenderSteps = [
    ["technical", "Technical offer"],
    ["costing", "BOM & costing"],
    ["drawings", "Preliminary drawings"],
    ["commercial", "Commercial offer"],
    ["compliance", "Compliance documents"],
  ];

  D.opps = oppTitles.map((title, i) => {
    const stage = stagePlan[i];
    const cust = D.customers[(i * 5) % 12];
    const closed = stage === "won" || stage === "lost";
    const discs = D.disciplines.map(d => d.id).filter(() => rnd() > 0.45);
    if (!discs.length) discs.push("electrical");
    const o = {
      id: "OPP-" + (2601 + i), title, customerId: cust.id, stage,
      value: round(between(45, 1150) * 1000, 500),
      probability: D.stage(stage).prob,
      owner: D.team.sales[i % 4],
      created: day(-between(20, 200)),
      expectedClose: closed ? day(-between(5, 280)) : day(between(10, 140)),
      disciplines: discs,
      source: pick(["Referral", "Existing customer", "Website", "Exhibition", "Tender portal"]),
      requiresTender: ["tendering", "quote"].includes(stage) || rnd() > 0.55,
      nextAction: pick(nextActions[stage]),
      nextDue: day(between(-4, 12)),
      notes: "",
    };
    if (!closed) {
      o.tenderDue = stage === "lead" || (stage === "qualified" && i % 2) ? null : day(between(2, 34));
      const done = { lead: 0, qualified: 1, tendering: 2, quote: 4, negotiation: 5 }[stage];
      o.checklist = Object.fromEntries(D.tenderSteps.map(([k], j) => [k, j < done || (j === done && rnd() > 0.5)]));
    }
    return o;
  });

  const m = today.getMonth();
  D.salesMonthly = {
    pipeline: series(12, 2.1e6, 3.6e6, 0.5).map(v => round(v, 1000)),
    won:      series(12, 0.08e6, 0.46e6, 0.3).map(v => round(v, 1000)),
    count:    series(12, 14, 26, 0.5).map(Math.round),
    winRate:  series(12, 38, 62, 0.5).map(Math.round),
  };
  D.wonYTD = D.salesMonthly.won.slice(11 - m).reduce((a, b) => a + b, 0);

  const evTypes = { meeting: "Meeting", visit: "Site visit", call: "Call", followup: "Follow-up", tender: "Tender deadline" };
  D.eventTypes = [
    { id: "meeting", label: "Meeting", tone: "teal" },
    { id: "visit", label: "Site visit", tone: "blue" },
    { id: "call", label: "Call", tone: "amber" },
    { id: "followup", label: "Follow-up", tone: "coral" },
    { id: "tender", label: "Tender deadline", tone: "violet" },
  ];
  D.events = Array.from({ length: 26 }, (_, i) => {
    const type = pick(["meeting", "meeting", "visit", "call", "call", "followup"]);
    const o = D.opps[between(0, 15)];
    const cust = D.customer(o.customerId);
    return {
      id: "EV" + i, type, date: day(between(-25, 38)),
      time: `${String(between(8, 16)).padStart(2, "0")}:${pick(["00", "30"])}`,
      title: `${evTypes[type]} — ${cust.name}`, oppId: o.id, owner: o.owner,
      note: type === "visit" ? "Bring site survey checklist and PPE." : `About: ${o.title}`,
    };
  });

  /* ---------------- Projects ---------------- */
  const projList = [
    ["Pumping station automation", "C102"], ["MCC & PCC panels", "C108"], ["Kiln instrumentation upgrade", "C101"],
    ["RO desalination skid controls", "C109"], ["Bottling line upgrade", "C103"], ["Crusher plant electrical", "C106"],
    ["Clean room HVAC controls", "C107"], ["Generator synchronization panels", "C112"],
  ];
  D.phases = [
    { id: "eng", label: "Engineering", tone: "violet", from: 0, to: 0.32 },
    { id: "proc", label: "Procurement", tone: "amber", from: 0.18, to: 0.55 },
    { id: "mfg", label: "Manufacturing", tone: "blue", from: 0.45, to: 0.8 },
    { id: "fat", label: "FAT", tone: "coral", from: 0.78, to: 0.88 },
    { id: "del", label: "Delivery & site", tone: "teal", from: 0.86, to: 1 },
  ];
  D.projects = projList.map(([name, cust], i) => {
    const startOff = -between(40, 200), len = between(150, 320);
    const progress = Math.max(5, Math.min(97, Math.round((-startOff / len) * 100 + between(-12, 8))));
    const engB = round(between(60, 260) * 1000, 1000), purB = round(between(160, 900) * 1000, 1000);
    const drift = 0.8 + rnd() * 0.5;
    const engA = round(engB * Math.min(1, progress / 70) * drift, 100);
    const purA = round(purB * Math.min(1, Math.max(0, (progress - 15) / 60)) * (0.85 + rnd() * 0.35), 100);
    const status = drift > 1.15 ? "Delayed" : drift > 1.03 ? "At risk" : "On track";
    return {
      code: "PRJ-" + (2401 + i * 3), name, customerId: cust, pm: D.team.pm[i % 3],
      start: day(startOff), end: day(startOff + len), progress, status,
      budget: { eng: engB, purchasing: purB }, actual: { eng: engA, purchasing: purA },
      value: round((engB + purB) * (1.35 + rnd() * 0.2), 1000),
    };
  });
  D.project = code => D.projects.find(p => p.code === code) || { name: code };
  D.statusTone = { "On track": "green", "At risk": "amber", "Delayed": "red" };
  /* forecast cost at completion: spend so far projected to 100% progress */
  D.forecast = p => {
    const k = Math.max(p.progress, 10) / 100;
    const eng = Math.max(p.actual.eng / Math.min(1, k * 1.25), p.actual.eng);
    const pur = Math.max(p.actual.purchasing / Math.min(1, k * 1.1), p.actual.purchasing);
    const total = Math.round(Math.min(eng, p.budget.eng * 1.6) + Math.min(pur, p.budget.purchasing * 1.6));
    const budget = p.budget.eng + p.budget.purchasing;
    return { total, budget, variance: Math.round(((total - budget) / budget) * 100) };
  };
  // status follows the cost forecast so the two always agree
  D.projects.forEach(p => {
    const v = D.forecast(p).variance;
    p.status = v > 8 ? "Delayed" : v > 0 ? "At risk" : "On track";
  });

  /* ---------------- Engineering ---------------- */
  const delTypes = {
    mechanical: ["GA drawing", "Steel structure calc", "Piping isometric", "3D model", "Skid layout", "Mechanical BOM"],
    electrical: ["Single line diagram", "Panel layout", "Cable schedule", "Load calculation", "Schematic set", "Earthing study"],
    digital: ["PLC program", "SCADA screens", "Network architecture", "I/O list", "FAT procedure", "Alarm list"],
  };
  const prefix = { mechanical: "ME", electrical: "EL", digital: "DG" };
  D.delStatuses = ["Not started", "In progress", "Checking", "Approved", "Issued"];
  D.delTone = { "Not started": "gray", "In progress": "blue", "Checking": "amber", "Approved": "teal", "Issued": "green" };
  D.deliverables = [];
  ["mechanical", "electrical", "digital"].forEach(disc => {
    for (let k = 0; k < 15; k++) {
      const p = D.projects[between(0, 7)];
      const type = pick(delTypes[disc]);
      D.deliverables.push({
        id: `${prefix[disc]}-${1040 + k * 3}`, discipline: disc, type,
        title: `${type} — ${p.name}`, project: p.code,
        engineer: pick(D.team[disc]), rev: pick(["A", "B", "C", "0", "1"]),
        status: pick(["Not started", "In progress", "In progress", "In progress", "Checking", "Approved", "Issued", "Issued"]),
        due: day(between(-7, 32)), hours: between(8, 90),
      });
    }
  });
  D.engineers = ["mechanical", "electrical", "digital"].flatMap(disc =>
    D.team[disc].map(name => ({ name, discipline: disc, capacity: 40, booked: between(22, 49) })));

  D.costMonthly = {
    eng: series(12, 55e3, 120e3, 0.5).map(v => round(v, 100)),
    purchasing: series(12, 160e3, 420e3, 0.4).map(v => round(v, 100)),
  };

  /* ---------------- Project tasks ---------------- */
  const taskTitles = ["Approve GA drawings", "Order MCC enclosures", "Prepare FAT plan", "Update cable schedule",
    "Confirm site access", "Release BOM to purchasing", "Review PLC logic", "Schedule painting", "Book transport",
    "Send progress report", "Customer witness test", "Finalize I/O list", "Check welding certificates", "Close NCR-014",
    "Issue as-built drawings", "Plan commissioning team"];
  D.tasks = taskTitles.map((title, i) => ({
    id: "T" + (100 + i), title, project: D.projects[i % 8].code,
    assignee: pick([...D.team.pm, ...D.team.electrical, ...D.team.mechanical]),
    status: ["todo", "doing", "todo", "review", "doing", "done", "todo", "done"][i % 8],
    due: day(between(-3, 20)), priority: pick(["Low", "Medium", "Medium", "High"]),
  }));

  /* ---------------- Factory ---------------- */
  D.workCenters = [
    { id: "WC1", name: "Sheet metal", hours: 120 }, { id: "WC2", name: "Welding", hours: 96 },
    { id: "WC3", name: "Panel assembly", hours: 160 }, { id: "WC4", name: "Wiring", hours: 200 },
    { id: "WC5", name: "Painting", hours: 80 }, { id: "WC6", name: "Testing & FAT bay", hours: 64 },
  ].map(w => ({ ...w, planned: Math.round(w.hours * (0.55 + rnd() * 0.6)), operators: between(2, 7) }));
  const products = ["MCC panel", "PLC cabinet", "Steel platform", "Pump skid", "Control desk", "Junction boxes", "Distribution board", "Cable tray set"];
  D.workOrders = Array.from({ length: 14 }, (_, i) => {
    const status = pick(["Planned", "In progress", "In progress", "In progress", "On hold", "Done"]);
    return {
      id: "WO-" + (5301 + i), project: D.projects[i % 8].code, product: pick(products), qty: between(1, 12),
      center: pick(D.workCenters).id, start: day(between(-20, 6)), due: day(between(-3, 30)), status,
      progress: status === "Done" ? 100 : status === "Planned" ? 0 : between(10, 90),
    };
  });
  D.inspections = Array.from({ length: 12 }, (_, i) => ({
    id: "QC-" + (880 + i), wo: D.workOrders[i].id, type: pick(["Incoming", "In-process", "Final", "FAT"]),
    result: pick(["Pass", "Pass", "Pass", "Pass", "Fail", "Pending"]), inspector: pick(["Rami Hayek", "Antoine Bou Saab"]),
    date: day(-between(0, 25)),
  }));
  D.ncrs = [
    { id: "NCR-014", title: "Wrong busbar thickness on MCC section 3", severity: "Major", owner: "Pierre Azzi", opened: day(-9), status: "Open" },
    { id: "NCR-015", title: "Paint thickness below spec on platform", severity: "Minor", owner: "Samir Toufic", opened: day(-6), status: "Open" },
    { id: "NCR-016", title: "Supplier sent IP54 instead of IP65 enclosures", severity: "Major", owner: "Dana Khalil", opened: day(-4), status: "Waiting supplier" },
    { id: "NCR-017", title: "Weld porosity on skid frame joint W12", severity: "Minor", owner: "Bilal Chahine", opened: day(-2), status: "Open" },
    { id: "NCR-012", title: "Missing ferrules on control wiring", severity: "Minor", owner: "Pierre Azzi", opened: day(-21), status: "Closed" },
  ];
  D.fpy = series(12, 87, 98, 0.5).map(v => Math.round(v * 10) / 10);

  /* ---------------- Customer service ---------------- */
  const subjects = ["VFD tripping on overload", "HMI screen frozen", "Request for spare fuses", "PLC communication loss",
    "Panel door lock broken", "Need as-built drawings", "Alarm list not clearing", "Pump not starting in auto",
    "Warranty claim — contactor", "Firmware update request", "Operator training request", "Remote access not working"];
  D.tickets = subjects.map((subject, i) => {
    const status = pick(["Open", "Open", "In progress", "Waiting customer", "Resolved"]);
    const opened = -between(0, 14);
    return {
      id: "TCK-" + (3100 + i), subject, customerId: D.customers[(i * 7) % 12].id,
      priority: pick(["Low", "Medium", "Medium", "High", "Critical"]), status,
      assignee: pick(D.team.service), opened: day(opened), slaDue: day(opened + between(1, 6)),
      channel: pick(["Phone", "Email", "Portal"]),
    };
  });
  D.priorityTone = { Low: "gray", Medium: "blue", High: "amber", Critical: "red" };
  D.ticketTone = { Open: "teal", "In progress": "blue", "Waiting customer": "amber", Resolved: "green" };
  D.visits = Array.from({ length: 10 }, (_, i) => {
    const off = between(-20, 18);
    return {
      id: "SV-" + (410 + i), customerId: D.customers[(i * 5 + 2) % 12].id,
      purpose: pick(["Preventive maintenance", "Commissioning support", "Fault diagnosis", "Operator training", "Warranty repair"]),
      technician: pick(D.team.service), date: day(off), time: `${pick(["08", "09", "10", "13"])}:00`,
      status: off < 0 ? "Completed" : "Scheduled",
    };
  });

  /* ---------------- Purchasing ---------------- */
  const supList = [
    ["Volta Components", "Electrical components", "Lebanon"], ["Medtech Steel", "Steel & metals", "Turkey"],
    ["Orion Cables", "Cables", "UAE"], ["Delta Enclosures", "Enclosures", "Italy"],
    ["Apex Automation Supply", "PLC & automation", "Germany"], ["Mare Fasteners", "Fasteners", "Lebanon"],
    ["Sirocco Paints", "Paint & coatings", "Lebanon"], ["Petra Instruments", "Instrumentation", "Jordan"],
    ["Helios Drives", "Drives & motors", "Germany"], ["Unity Logistics", "Freight", "Lebanon"],
  ];
  D.suppliers = supList.map(([name, category, country], i) => ({
    id: "S" + (201 + i), name, category, country,
    rating: Math.round((3 + rnd() * 2) * 2) / 2, onTime: between(72, 99),
    leadTime: between(5, 42), spend: round(between(40, 520) * 1000, 1000),
  }));
  D.supplier = id => D.suppliers.find(s => s.id === id) || { name: id };
  const poItems = ["Contactors & breakers", "Enclosures 800×600", "Power cables 4×95 mm²", "PLC CPUs & I/O cards",
    "Steel sheets 2 mm", "VFD 37 kW", "Paint RAL 7035", "Pressure transmitters", "Busbars & supports", "Freight to site"];
  D.poStatuses = ["Draft", "Sent", "Confirmed", "Partially received", "Received"];
  D.pos = Array.from({ length: 16 }, (_, i) => {
    const status = pick(["Sent", "Confirmed", "Confirmed", "Partially received", "Received", "Draft"]);
    const sup = D.suppliers[i % 10];
    return {
      id: "PO-" + (26140 + i), supplierId: sup.id, project: D.projects[(i * 3) % 8].code,
      items: poItems[i % 10], value: round(between(4, 140) * 1000, 100),
      ordered: day(-between(3, 50)), expected: day(between(-10, 30)), status,
      buyer: D.team.purchasing[i % 2],
    };
  });
  D.poLate = po => po.status !== "Received" && po.status !== "Draft" && po.expected < D.today;
  D.requests = [
    ["Enclosures for MCC section 4", "electrical", 18400], ["Stainless pipes DN100", "mechanical", 9200],
    ["Industrial Ethernet switches", "digital", 6100], ["Pressure transmitters ×12", "electrical", 7400],
    ["Structural steel beams", "mechanical", 22800], ["SCADA licences (2 clients)", "digital", 11500],
    ["Cable glands & lugs", "electrical", 2300], ["Anchor bolts M20", "mechanical", 1400],
  ].map(([title, disc, value], i) => ({
    id: "PR-" + (720 + i), title, discipline: disc, value, project: D.projects[(i * 2) % 8].code,
    requester: D.team[disc][i % D.team[disc].length], needed: day(between(4, 30)),
    status: i < 5 ? "Pending" : pick(["Approved", "Rejected", "Approved"]),
  }));

  /* ---------------- Stock ---------------- */
  D.stock = [
    ["CTR-25A", "Contactor 25 A", "Electrical", "A-01", 64, 40, "pcs", 38],
    ["MCB-16C", "MCB 16 A C-curve", "Electrical", "A-02", 210, 120, "pcs", 9],
    ["CBL-4X16", "Cable 4×16 mm²", "Cables", "Yard-2", 380, 500, "m", 11],
    ["PLC-CPU", "PLC CPU module", "Automation", "B-04", 3, 4, "pcs", 1450],
    ["DI-16", "Digital input card 16 ch", "Automation", "B-04", 14, 10, "pcs", 310],
    ["STL-2MM", "Steel sheet 2 mm", "Steel", "Yard-1", 46, 30, "sheets", 95],
    ["ENC-8060", "Enclosure 800×600", "Enclosures", "C-01", 6, 8, "pcs", 420],
    ["TB-4", "Terminal block 4 mm²", "Electrical", "A-05", 1650, 800, "pcs", 1.2],
    ["TRY-300", "Cable tray 300 mm", "Cables", "Yard-2", 140, 100, "m", 14],
    ["PNT-7035", "Paint RAL 7035", "Paint", "D-02", 0, 40, "L", 12],
    ["VFD-7K5", "VFD 7.5 kW", "Drives", "B-02", 5, 3, "pcs", 890],
    ["PB-GRN", "Push button green", "Electrical", "A-07", 96, 50, "pcs", 6],
    ["RLY-24", "Relay 24 V DC", "Electrical", "A-03", 34, 60, "pcs", 7.5],
    ["BUS-30X5", "Copper busbar 30×5", "Electrical", "C-03", 72, 40, "m", 48],
    ["BLT-M10", "Hex bolts M10 (box)", "Fasteners", "D-05", 22, 15, "boxes", 18],
    ["ESW-8", "Ethernet switch 8-port", "Automation", "B-05", 2, 4, "pcs", 260],
  ].map(([sku, name, category, location, qty, min, unit, cost]) => ({ sku, name, category, location, qty, min, unit, cost }));
  D.movements = Array.from({ length: 22 }, (_, i) => {
    const item = D.stock[(i * 5) % 16];
    const type = pick(["In", "Out", "Out", "Transfer"]);
    return {
      id: "MV-" + (9100 + i), date: day(-Math.floor(i / 2.2)), sku: item.sku, type,
      qty: Math.max(1, Math.round(item.min * (0.1 + rnd() * 0.5))),
      ref: type === "In" ? pick(D.pos).id : type === "Out" ? pick(D.workOrders).id : `${item.location} → ${pick(["A-09", "B-07", "Yard-3"])}`,
      by: pick(["Hussein Kanaan", "Walid Issa", "Rami Hayek"]),
    };
  });

  /* ---------------- HR ---------------- */
  const roleOf = {
    sales: ["Sales", "Sales engineer"], mechanical: ["Engineering", "Mechanical engineer"],
    electrical: ["Engineering", "Electrical engineer"], digital: ["Engineering", "Automation engineer"],
    pm: ["Project Management", "Project manager"], purchasing: ["Purchasing", "Buyer"],
    factory: ["Factory", "Technician"], service: ["Customer service", "Service technician"],
    finance: ["Finance", "Accountant"], hr: ["HR", "HR manager"],
  };
  const special = { "Hussein Kanaan": "Workshop supervisor", "Maya Sleiman": "Finance manager", "Rania Khoury": "Sales manager", "Ziad Hamdan": "Engineering manager", "Bilal Chahine": "Welder", "Pierre Azzi": "Panel wirer", "Samir Toufic": "Painter", "Rami Hayek": "QC inspector", "Antoine Bou Saab": "QC inspector" };
  D.employees = Object.entries(D.team).flatMap(([k, names]) => names.map(name => ({
    name, department: roleOf[k][0], role: special[name] || roleOf[k][1],
    status: pick(["Active", "Active", "Active", "Active", "Remote", "On leave"]),
    joined: 2012 + between(0, 14), phone: `+961 ${between(3, 81)} ${between(100, 999)} ${between(100, 999)}`,
  })));
  D.departments = [...new Set(D.employees.map(e => e.department))];
  D.leave = Array.from({ length: 9 }, (_, i) => {
    const e = D.employees[(i * 7) % D.employees.length];
    const from = between(-5, 20), days = between(1, 6);
    return {
      id: "LV-" + (300 + i), employee: e.name, department: e.department,
      type: pick(["Annual", "Annual", "Sick", "Personal"]), from: day(from), to: day(from + days - 1), days,
      status: i < 4 ? "Pending" : pick(["Approved", "Approved", "Rejected"]),
    };
  });

  /* ---------------- Finance ---------------- */
  D.invoices = Array.from({ length: 16 }, (_, i) => {
    const p = D.projects[i % 8];
    const issued = -between(5, 90), due = issued + 30;
    const paid = rnd() > 0.55;
    return {
      id: "INV-" + (2650 + i), customerId: p.customerId, project: p.code,
      milestone: pick(["Advance payment", "Engineering approval", "Delivery", "FAT completion", "Commissioning"]),
      amount: round(p.value * (0.1 + rnd() * 0.25), 100), issued: day(issued), due: day(due),
      paidOn: paid ? day(Math.min(-1, due - between(-10, 5))) : null,
    };
  });
  D.invoiceStatus = inv => inv.paidOn ? "Paid" : inv.due < D.today ? "Overdue" : "Due";
  D.invoiceTone = { Paid: "green", Overdue: "red", Due: "amber" };
  D.cashMonthly = {
    in: series(12, 260e3, 520e3, 0.4).map(v => round(v, 1000)),
    out: series(12, 230e3, 470e3, 0.4).map(v => round(v, 1000)),
  };
  D.budgets = [
    ["Sales", 420e3], ["Engineering", 1.15e6], ["Project Management", 380e3], ["Factory", 1.6e6],
    ["Customer service", 260e3], ["Purchasing", 190e3], ["Finance", 210e3], ["HR", 140e3],
  ].map(([dept, budget]) => ({ dept, budget, actual: round(budget * ((m + 1) / 12) * (0.82 + rnd() * 0.35), 1000) }));
  D.payments = Array.from({ length: 12 }, (_, i) => {
    const incoming = i % 3 !== 1;
    return incoming
      ? { date: day(-i * 2), party: D.customer(D.invoices[i].customerId).name, type: "In", amount: D.invoices[i].amount, ref: D.invoices[i].id }
      : { date: day(-i * 2), party: D.supplier(D.pos[i].supplierId).name, type: "Out", amount: D.pos[i].value, ref: D.pos[i].id };
  });

  /* ---------------- Saving edits in the browser ---------------- */
  const KEY = "socially.v1.";
  const PERSIST = ["opps", "tasks", "requests", "leave", "tickets", "deliverables", "invoices", "stock"];
  PERSIST.forEach(name => {
    try {
      const saved = localStorage.getItem(KEY + name);
      if (saved) D[name] = JSON.parse(saved);
    } catch (e) { /* storage blocked: use defaults */ }
  });
  App.save = name => {
    try { localStorage.setItem(KEY + name, JSON.stringify(D[name])); } catch (e) { /* ignore */ }
  };
  App.resetData = () => {
    PERSIST.forEach(name => { try { localStorage.removeItem(KEY + name); } catch (e) { /* ignore */ } });
    location.reload();
  };
})();
