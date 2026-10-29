/* =====================================================================
   CHARTS — hand-drawn SVG, no libraries.
     App.charts.area(el,  { labels, series:[{name, values, color}], format, height })
     App.charts.bars(el,  { labels, series:[…], stacked, format, height })
     App.charts.donut(el, { items:[{label, value, color}], center:{value,label}, format })
     App.charts.hbars(el, { items:[{label, value, display, color, sub}], max, format })
     App.charts.gantt(el, { from, to, rows:[{label, sub, segments:[{start,end,tone,label}]}] })
     App.charts.ring(pct, size, color) → SVG string
   ===================================================================== */
(function () {
  const U = App.ui;
  const C = (App.charts = {});
  const PAL = ["var(--c1)", "var(--c2)", "var(--c3)", "var(--c4)", "var(--c5)", "var(--c6)"];
  C.PAL = PAL;
  let gid = 0;

  const niceMax = v => {
    if (v <= 0) return 1;
    const p = 10 ** Math.floor(Math.log10(v)), n = v / p;
    return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p;
  };

  /* redraw on resize, animate only the first time */
  const responsive = (el, draw) => {
    let w = 0, first = true;
    const run = () => {
      const nw = el.clientWidth;
      if (!nw || Math.abs(nw - w) < 4) return;
      w = nw;
      draw(nw, first);
      first = false;
    };
    run();
    if (window.ResizeObserver) new ResizeObserver(run).observe(el);
  };

  C.smooth = pts => {
    if (pts.length < 2) return "";
    let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2, t = 0.17;
      const c1 = [p1[0] + (p2[0] - p0[0]) * t, p1[1] + (p2[1] - p0[1]) * t];
      const c2 = [p2[0] - (p3[0] - p1[0]) * t, p2[1] - (p3[1] - p1[1]) * t];
      d += ` C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
    }
    return d;
  };

  const grid = (P, W, H, max, y, fmt) => {
    let s = "";
    for (let g = 0; g <= 4; g++) {
      const v = (max * g) / 4, yy = y(v).toFixed(1);
      s += `<line class="gl" x1="${P.l}" x2="${W - P.r}" y1="${yy}" y2="${yy}"/><text class="ax" x="${P.l - 10}" y="${+yy + 4}" text-anchor="end">${fmt(v)}</text>`;
    }
    return s;
  };
  const xLabels = (labels, x, W, P, H) => {
    const step = Math.max(1, Math.ceil(labels.length / Math.max(2, Math.floor((W - P.l) / 52))));
    return labels.map((l, i) => (i % step === 0 || i === labels.length - 1)
      ? `<text class="ax" x="${x(i).toFixed(1)}" y="${H - 8}" text-anchor="middle">${l}</text>` : "").join("");
  };
  const tipHtml = (series, i, label, fmt) =>
    series.map((s, k) => `<div class="tip-row"><i style="background:${s.color || PAL[k]}"></i>${series.length > 1 ? `<span>${s.name}</span>` : ""}<b>${fmt(s.values[i])}</b></div>`).join("") +
    `<div class="tip-label">${label}</div>`;
  const placeTip = (tip, x, y, W) => {
    tip.style.left = Math.max(70, Math.min(W - 70, x)) + "px";
    tip.style.top = y + "px";
    tip.classList.add("on");
  };

  /* ---------------- smooth area / line ---------------- */
  C.area = (el, o) => {
    const H = o.height || 260, fmt = o.format || U.compact;
    el.classList.add("chart");
    responsive(el, (W, first) => {
      const P = { t: 16, r: 14, b: 28, l: 52 }, n = o.labels.length;
      const max = o.max || niceMax(Math.max(...o.series.flatMap(s => s.values)) * 1.08);
      const min = o.min || 0;
      const x = i => P.l + (i * (W - P.l - P.r)) / Math.max(n - 1, 1);
      const y = v => P.t + (H - P.t - P.b) * (1 - (v - min) / (max - min));
      const id = "g" + ++gid;
      let s = `<svg width="${W}" height="${H}"><defs>${o.series.map((se, k) =>
        `<linearGradient id="${id}${k}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:${se.color || PAL[k]};stop-opacity:.32"/><stop offset="1" style="stop-color:${se.color || PAL[k]};stop-opacity:0"/></linearGradient>`).join("")}</defs>`;
      s += grid(P, W, H, max - min, v => y(v + min), v => fmt(v + min)) + xLabels(o.labels, x, W, P, H);
      o.series.forEach((se, k) => {
        const line = C.smooth(se.values.map((v, i) => [x(i), y(v)]));
        if (!se.noFill) s += `<path class="${first ? "ar" : ""}" d="${line} L${x(n - 1)},${H - P.b} L${x(0)},${H - P.b}Z" fill="url(#${id}${k})"/>`;
        s += `<path class="ln${first ? " draw" : ""}" pathLength="1" d="${line}" style="stroke:${se.color || PAL[k]}"/>`;
      });
      s += `<line class="cross" y1="${P.t}" y2="${H - P.b}"/>`;
      s += o.series.map((se, k) => `<circle class="hdot" r="5" style="stroke:${se.color || PAL[k]}"/>`).join("");
      s += `<rect class="hit" x="${P.l}" y="0" width="${W - P.l - P.r}" height="${H}" fill="transparent"/></svg>`;
      el.innerHTML = `<div class="chart-in" style="height:${H}px">${s}<div class="tip"></div></div>`;

      const hit = el.querySelector(".hit"), cross = el.querySelector(".cross"), dots = el.querySelectorAll(".hdot"), tip = el.querySelector(".tip");
      hit.addEventListener("pointermove", e => {
        const r = hit.getBoundingClientRect();
        const i = Math.max(0, Math.min(n - 1, Math.round(((e.clientX - r.left) / r.width) * (n - 1))));
        const xx = x(i);
        cross.setAttribute("x1", xx); cross.setAttribute("x2", xx); cross.classList.add("on");
        dots.forEach((d, k) => { d.setAttribute("cx", xx); d.setAttribute("cy", y(o.series[k].values[i])); d.classList.add("on"); });
        tip.innerHTML = tipHtml(o.series, i, o.labels[i], fmt);
        placeTip(tip, xx, y(Math.max(...o.series.map(se => se.values[i]))), W);
      });
      hit.addEventListener("pointerleave", () => { cross.classList.remove("on"); dots.forEach(d => d.classList.remove("on")); tip.classList.remove("on"); });
    });
  };

  /* ---------------- vertical bars (grouped or stacked) ---------------- */
  C.bars = (el, o) => {
    const H = o.height || 260, fmt = o.format || U.compact, S = o.series;
    el.classList.add("chart");
    responsive(el, (W, first) => {
      const P = { t: 16, r: 8, b: 28, l: 52 }, n = o.labels.length;
      const tops = o.labels.map((_, i) => o.stacked ? S.reduce((a, s) => a + s.values[i], 0) : Math.max(...S.map(s => s.values[i])));
      const max = o.max || niceMax(Math.max(...tops) * 1.08);
      const band = (W - P.l - P.r) / n;
      const y = v => P.t + (H - P.t - P.b) * (1 - v / max), h = v => (H - P.t - P.b) * (v / max);
      const gw = Math.min(band * 0.64, o.stacked ? 36 : 14 * S.length + 4);
      const x = i => P.l + band * i + band / 2;
      let s = `<svg width="${W}" height="${H}">` + grid(P, W, H, max, y, fmt);
      s += o.labels.map((_, i) => `<rect class="hcol" data-i="${i}" x="${P.l + band * i + 2}" y="${P.t}" width="${band - 4}" height="${H - P.t - P.b}" rx="8"/>`).join("");
      o.labels.forEach((_, i) => {
        const x0 = x(i) - gw / 2, delay = first ? `animation-delay:${i * 35}ms` : "animation:none";
        if (o.stacked) {
          let acc = 0;
          S.forEach((se, k) => {
            const v = se.values[i];
            s += `<rect class="bar" x="${x0}" y="${y(acc + v)}" width="${gw}" height="${Math.max(0, h(v) - 1.5)}" rx="4" style="fill:${se.color || PAL[k]};${delay}"/>`;
            acc += v;
          });
        } else {
          const bw = (gw - (S.length - 1) * 3) / S.length;
          S.forEach((se, k) => {
            const v = se.values[i];
            s += `<rect class="bar" x="${x0 + k * (bw + 3)}" y="${y(v)}" width="${bw}" height="${h(v)}" rx="4" style="fill:${se.color || PAL[k]};${delay}"/>`;
          });
        }
      });
      s += xLabels(o.labels, x, W, P, H) + `</svg>`;
      el.innerHTML = `<div class="chart-in" style="height:${H}px">${s}<div class="tip"></div></div>`;
      const tip = el.querySelector(".tip");
      el.querySelector("svg").addEventListener("pointermove", e => {
        const r = e.currentTarget.getBoundingClientRect();
        const i = Math.floor((e.clientX - r.left - P.l) / band);
        el.querySelectorAll(".hcol").forEach(c => c.classList.toggle("on", +c.dataset.i === i));
        if (i < 0 || i >= n) return tip.classList.remove("on");
        tip.innerHTML = tipHtml(S, i, o.labels[i], fmt);
        placeTip(tip, x(i), y(tops[i]), W);
      });
      el.querySelector("svg").addEventListener("pointerleave", () => {
        tip.classList.remove("on");
        el.querySelectorAll(".hcol.on").forEach(c => c.classList.remove("on"));
      });
    });
  };

  /* ---------------- donut with legend ---------------- */
  C.donut = (el, o) => {
    const size = o.size || 176, sw = o.stroke || 20, r = (size - sw) / 2, c = 2 * Math.PI * r, mid = size / 2;
    const fmt = o.format || U.compact;
    const total = o.items.reduce((a, b) => a + b.value, 0) || 1;
    let acc = 0;
    const segs = o.items.map((it, k) => {
      const len = (it.value / total) * c, gap = o.items.length > 1 ? 3 : 0;
      const seg = `<circle class="dseg" data-k="${k}" r="${r}" cx="${mid}" cy="${mid}" style="stroke:${it.color || PAL[k]};stroke-width:${sw};stroke-dasharray:${Math.max(len - gap, 0.01)} ${c};stroke-dashoffset:${-acc};animation-delay:${k * 80}ms"/>`;
      acc += len;
      return seg;
    }).join("");
    el.innerHTML = `
      <div class="donut-wrap">
        <div class="donut" style="width:${size}px;height:${size}px">
          <svg width="${size}" height="${size}"><g transform="rotate(-90 ${mid} ${mid})"><circle class="dtrack" r="${r}" cx="${mid}" cy="${mid}" style="stroke-width:${sw}"/>${segs}</g></svg>
          <div class="donut-center"><b class="tnum">${o.center?.value ?? fmt(total)}</b><span>${o.center?.label ?? "Total"}</span></div>
        </div>
        <div class="dlegend">${o.items.map((it, k) => `
          <div class="dl-row" data-k="${k}"><i style="background:${it.color || PAL[k]}"></i><span>${it.label}</span>
          <b class="tnum">${fmt(it.value)}</b><small>${Math.round((it.value / total) * 100)}%</small></div>`).join("")}</div>
      </div>`;
    const wrap = el.querySelector(".donut-wrap");
    const hl = k => wrap.querySelectorAll("[data-k]").forEach(n => n.classList.toggle("dim", k != null && n.dataset.k !== String(k)));
    wrap.addEventListener("pointerover", e => { const t = e.target.closest("[data-k]"); hl(t ? t.dataset.k : null); });
    wrap.addEventListener("pointerleave", () => hl(null));
  };

  /* ---------------- horizontal bars (HTML) ---------------- */
  C.hbars = (el, o) => {
    const fmt = o.format || U.compact;
    const max = o.max || Math.max(...o.items.map(i => i.value)) || 1;
    el.innerHTML = `<div class="hb">${o.items.map((it, k) => `
      <div class="hb-row">
        <div class="hb-top"><span>${it.label}${it.sub ? ` <small>${it.sub}</small>` : ""}</span><b class="tnum">${it.display ?? fmt(it.value)}</b></div>
        <div class="progress" style="--b:${it.color || o.color || PAL[0]}"><i style="--p:${Math.min(100, (it.value / max) * 100)}%;animation-delay:${0.2 + k * 0.06}s"></i>${it.marker != null ? `<em style="left:${Math.min(100, (it.marker / max) * 100)}%"></em>` : ""}</div>
      </div>`).join("")}</div>`;
  };

  /* ---------------- gantt timeline (HTML) ---------------- */
  C.gantt = (el, o) => {
    const from = +U.parse(o.from), to = +U.parse(o.to), span = to - from;
    const pos = d => Math.max(0, Math.min(100, ((+U.parse(d) - from) / span) * 100));
    const months = [];
    const m = new Date(from); m.setDate(1); m.setMonth(m.getMonth() + 1);
    while (+m < to) { months.push({ left: ((+m - from) / span) * 100, label: m.toLocaleDateString("en-US", { month: "short" }) }); m.setMonth(m.getMonth() + 1); }
    const today = pos(App.data.today);
    el.innerHTML = `
      <div class="gantt">
        <div class="g-head"><div class="g-label"></div><div class="g-track">${months.map(mo => `<span style="left:${mo.left}%">${mo.label}</span>`).join("")}</div></div>
        ${o.rows.map((row, ri) => `
          <div class="g-row" ${row.id ? `data-id="${row.id}"` : ""}>
            <div class="g-label"><b>${row.label}</b>${row.sub ? `<small>${row.sub}</small>` : ""}</div>
            <div class="g-track">
              ${months.map(mo => `<i class="g-grid" style="left:${mo.left}%"></i>`).join("")}
              ${row.segments.map((sg, si) => `<div class="g-bar t-${sg.tone}" style="left:${pos(sg.start)}%;width:${Math.max(0.8, pos(sg.end) - pos(sg.start))}%;animation-delay:${ri * 60 + si * 40}ms" title="${U.esc(sg.label)}: ${U.date(sg.start)} – ${U.date(sg.end)}"><span>${sg.label}</span></div>`).join("")}
              <i class="g-today" style="left:${today}%"></i>
            </div>
          </div>`).join("")}
      </div>`;
  };

  /* ---------------- progress ring ---------------- */
  C.ring = (pct, size = 54, color = "var(--c1)", label) => {
    const sw = 5, r = (size - sw) / 2, c = 2 * Math.PI * r, mid = size / 2;
    return `<svg class="ring" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <circle class="dtrack" r="${r}" cx="${mid}" cy="${mid}" style="stroke-width:${sw}"/>
      <circle class="ring-v" r="${r}" cx="${mid}" cy="${mid}" transform="rotate(-90 ${mid} ${mid})" style="stroke:${color};stroke-width:${sw};stroke-dasharray:${(c * Math.min(100, pct)) / 100} ${c}"/>
      <text x="50%" y="50%" dy=".35em" text-anchor="middle">${label ?? Math.round(pct) + "%"}</text></svg>`;
  };
})();
