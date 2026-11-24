/* Gráficos em SVG puro: linha (multi-séries, tooltip), rosca e barras empilhadas.
 * Cada gráfico tem tabela equivalente acessível (gerada pelas views).
 */
window.CH = (function () {
  const NS = "http://www.w3.org/2000/svg";
  let uid = 0;

  function niceTicks(min, max, n = 4) {
    if (min === max) { min -= 1; max += 1; }
    const span = max - min, step0 = span / n, mag = Math.pow(10, Math.floor(Math.log10(step0)));
    const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => span / s <= n) || 10 * mag;
    const lo = Math.floor(min / step) * step, hi = Math.ceil(max / step) * step, out = [];
    for (let v = lo; v <= hi + step / 2; v += step) out.push(+v.toFixed(10));
    return out;
  }

  /** opts: { series:[{nome, cor, pontos:[[x(label), y]], tracejado}], fmtY, fmtX, altura, area, base100 } */
  function linha(el, opts) {
    const W = el.clientWidth || 640, H = opts.altura || 240, P = { l: 64, r: 16, t: 14, b: 28 };
    const series = opts.series.filter((s) => s.pontos.length);
    const n = series[0].pontos.length;
    const ys = series.flatMap((s) => s.pontos.map((p) => p[1]));
    const ticks = niceTicks(Math.min(...ys), Math.max(...ys));
    const y0 = ticks[0], y1 = ticks[ticks.length - 1];
    const X = (i) => P.l + (i * (W - P.l - P.r)) / Math.max(1, n - 1);
    const Y = (v) => P.t + (1 - (v - y0) / (y1 - y0)) * (H - P.t - P.b);
    const fmtY = opts.fmtY || ((v) => v);
    const fmtX = opts.fmtX || ((v) => v);
    const id = "g" + ++uid;
    let s = `<svg viewBox="0 0 ${W} ${H}" width="100%" height="${H}" role="img" aria-label="${opts.label || "Gráfico de linha"}">`;
    s += `<defs>${series.map((se, k) => `<linearGradient id="${id}a${k}" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="${se.cor}" stop-opacity=".18"/><stop offset="1" stop-color="${se.cor}" stop-opacity="0"/></linearGradient>`).join("")}</defs>`;
    ticks.forEach((t) => { s += `<line x1="${P.l}" x2="${W - P.r}" y1="${Y(t)}" y2="${Y(t)}" class="grid"/><text x="${P.l - 8}" y="${Y(t) + 4}" class="axis" text-anchor="end">${fmtY(t, true)}</text>`; });
    const passos = Math.max(1, Math.ceil(n / (W < 480 ? 4 : 7)));
    series[0].pontos.forEach((p, i) => { if ((i % passos === 0 && n - 1 - i >= passos * 0.6) || i === n - 1) s += `<text x="${X(i)}" y="${H - 8}" class="axis" text-anchor="${i === 0 ? "start" : i === n - 1 ? "end" : "middle"}">${fmtX(p[0])}</text>`; });
    series.forEach((se, k) => {
      const d = se.pontos.map((p, i) => `${i ? "L" : "M"}${X(i).toFixed(1)},${Y(p[1]).toFixed(1)}`).join("");
      if (opts.area && k === 0) s += `<path d="${d}L${X(n - 1)},${Y(y0)}L${X(0)},${Y(y0)}Z" fill="url(#${id}a${k})"/>`;
      s += `<path d="${d}" fill="none" stroke="${se.cor}" stroke-width="${k === 0 ? 2.4 : 1.8}" ${se.tracejado ? 'stroke-dasharray="5 4"' : ""} stroke-linejoin="round" stroke-linecap="round"/>`;
    });
    s += `<line class="cursor" x1="0" x2="0" y1="${P.t}" y2="${H - P.b}" style="display:none"/>`;
    series.forEach((se, k) => { s += `<circle class="dot" data-k="${k}" r="4" fill="${se.cor}" stroke="#fff" stroke-width="2" style="display:none"/>`; });
    s += `<rect x="${P.l}" y="${P.t}" width="${W - P.l - P.r}" height="${H - P.t - P.b}" fill="transparent" class="hit"/></svg>`;
    el.innerHTML = s + `<div class="tip" role="status" aria-live="polite"></div>`;
    if (series.length > 1 || opts.legenda) {
      el.insertAdjacentHTML("afterbegin", `<div class="legend">${series.map((se) => `<span><i style="background:${se.cor}${se.tracejado ? ";background:repeating-linear-gradient(90deg," + se.cor + " 0 5px,transparent 5px 8px)" : ""}"></i>${se.nome}</span>`).join("")}</div>`);
    }
    const svg = el.querySelector("svg"), tip = el.querySelector(".tip"), cur = svg.querySelector(".cursor"), dots = svg.querySelectorAll(".dot");
    function show(i) {
      cur.setAttribute("x1", X(i)); cur.setAttribute("x2", X(i)); cur.style.display = "";
      dots.forEach((d) => { const se = series[+d.dataset.k]; d.setAttribute("cx", X(i)); d.setAttribute("cy", Y(se.pontos[i][1])); d.style.display = ""; });
      tip.innerHTML = `<b>${fmtX(series[0].pontos[i][0], true)}</b>` + series.map((se) => `<div><i style="background:${se.cor}"></i>${se.nome}: <b>${fmtY(se.pontos[i][1])}</b></div>`).join("");
      tip.style.display = "block";
      const rect = svg.getBoundingClientRect(), sx = rect.width / W;
      const left = X(i) * sx; tip.style.left = Math.min(Math.max(0, left - tip.offsetWidth / 2), rect.width - tip.offsetWidth) + "px";
      tip.style.top = (el.querySelector(".legend") ? 28 : 0) + "px";
    }
    function hide() { cur.style.display = "none"; dots.forEach((d) => (d.style.display = "none")); tip.style.display = "none"; }
    const hit = svg.querySelector(".hit");
    hit.addEventListener("mousemove", (e) => {
      const rect = svg.getBoundingClientRect(), x = ((e.clientX - rect.left) * W) / rect.width;
      show(Math.max(0, Math.min(n - 1, Math.round(((x - P.l) / (W - P.l - P.r)) * (n - 1)))));
    });
    hit.addEventListener("mouseleave", hide);
    svg.setAttribute("tabindex", "0");
    let ki = n - 1;
    svg.addEventListener("keydown", (e) => { if (e.key === "ArrowLeft") { ki = Math.max(0, ki - 1); show(ki); e.preventDefault(); } if (e.key === "ArrowRight") { ki = Math.min(n - 1, ki + 1); show(ki); e.preventDefault(); } });
    svg.addEventListener("blur", hide);
  }

  /** segs: [{nome, valor, cor}] */
  function rosca(el, segs, opts = {}) {
    const total = segs.reduce((a, s) => a + s.valor, 0) || 1, R = 70, r = 46, C = 90;
    let a0 = -Math.PI / 2, s = `<svg viewBox="0 0 180 180" width="180" height="180" role="img" aria-label="${opts.label || "Distribuição"}">`;
    segs.forEach((sg) => {
      const a1 = a0 + (sg.valor / total) * Math.PI * 2 - (segs.length > 1 ? 0.012 : 0);
      const large = a1 - a0 > Math.PI ? 1 : 0, p = (ang, rad) => `${C + rad * Math.cos(ang)},${C + rad * Math.sin(ang)}`;
      if (segs.length === 1) s += `<circle cx="${C}" cy="${C}" r="${(R + r) / 2}" fill="none" stroke="${sg.cor}" stroke-width="${R - r}"/>`;
      else s += `<path d="M${p(a0, R)}A${R},${R} 0 ${large} 1 ${p(a1, R)}L${p(a1, r)}A${r},${r} 0 ${large} 0 ${p(a0, r)}Z" fill="${sg.cor}"><title>${sg.nome}: ${((sg.valor / total) * 100).toFixed(1)}%</title></path>`;
      a0 = a1 + (segs.length > 1 ? 0.012 : 0);
    });
    s += `<text x="${C}" y="${C - 4}" text-anchor="middle" class="donut-n">${opts.centro || ""}</text><text x="${C}" y="${C + 14}" text-anchor="middle" class="axis">${opts.sub || ""}</text></svg>`;
    el.innerHTML = s;
  }

  /** grupos: [{rotulo, valores:[v1, v2]}], series:[{nome, cor}] — barras empilhadas */
  function barras(el, grupos, series, opts = {}) {
    const W = el.clientWidth || 640, H = opts.altura || 200, P = { l: 56, r: 8, t: 10, b: 26 };
    const tot = grupos.map((g) => g.valores.reduce((a, b) => a + b, 0));
    const ticks = niceTicks(0, Math.max(...tot, 1), 3);
    const y1 = ticks[ticks.length - 1];
    const bw = ((W - P.l - P.r) / grupos.length) * 0.62;
    const X = (i) => P.l + ((i + 0.5) * (W - P.l - P.r)) / grupos.length;
    const Y = (v) => P.t + (1 - v / y1) * (H - P.t - P.b);
    const fmtY = opts.fmtY || ((v) => v);
    let s = `<svg viewBox="0 0 ${W} ${H}" width="100%" height="${H}" role="img" aria-label="${opts.label || "Gráfico de barras"}">`;
    ticks.forEach((t) => { s += `<line x1="${P.l}" x2="${W - P.r}" y1="${Y(t)}" y2="${Y(t)}" class="grid"/><text x="${P.l - 8}" y="${Y(t) + 4}" class="axis" text-anchor="end">${fmtY(t, true)}</text>`; });
    grupos.forEach((g, i) => {
      let acc = 0;
      g.valores.forEach((v, k) => {
        if (v <= 0) return;
        const yTop = Y(acc + v), h = Y(acc) - yTop;
        s += `<rect x="${X(i) - bw / 2}" y="${yTop}" width="${bw}" height="${Math.max(0, h - 1)}" rx="3" fill="${series[k].cor}" ${series[k].hachura ? `fill-opacity=".45" stroke="${series[k].cor}" stroke-dasharray="3 2"` : ""}><title>${g.rotulo} · ${series[k].nome}: ${fmtY(v)}</title></rect>`;
        acc += v;
      });
      s += `<text x="${X(i)}" y="${H - 8}" class="axis" text-anchor="middle">${g.rotulo}</text>`;
    });
    s += "</svg>";
    el.innerHTML = (series.length > 1 ? `<div class="legend">${series.map((se) => `<span><i style="background:${se.cor};${se.hachura ? "opacity:.5" : ""}"></i>${se.nome}</span>`).join("")}</div>` : "") + s;
  }

  /** mini sparkline inline */
  function spark(pontos, cor, w = 96, h = 28) {
    const min = Math.min(...pontos), max = Math.max(...pontos), n = pontos.length;
    const d = pontos.map((v, i) => `${i ? "L" : "M"}${((i * w) / (n - 1)).toFixed(1)},${(h - 2 - ((v - min) / (max - min || 1)) * (h - 4)).toFixed(1)}`).join("");
    return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" aria-hidden="true"><path d="${d}" fill="none" stroke="${cor}" stroke-width="1.6"/></svg>`;
  }

  return { linha, rosca, barras, spark };
})();
