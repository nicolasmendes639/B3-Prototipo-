/* Proventos → Resumo: extrato detalhado de proventos (dados em PROV.lancamentos).
 * Seções: totais, gráfico com filtros, proventos por categoria, rendimento mês a mês, ativos por categoria,
 * lista de proventos e proventos futuros. As escolhas de filtro ficam salvas neste navegador (U.store "prov:*").
 */
(function (V) {
  const U = window.U, M = window.MERCADO, C = window.CATALOGO, CH = window.CH, P = window.PROV;
  const PAL = window.CART.PALETA;
  const st = (k, def) => U.store.get("prov:" + k, def);
  const fmtY = (v, eixo) => (eixo ? (v >= 1000 ? U.num(v / 1000, 0) + " mil" : U.num(v, 0)) : U.brl(v));
  const corCat = (c) => P.CORES_CAT[c] || "#888";
  const ativoCel = (tk) => `<a class="tk-cell" href="#/ativo/${U.slug(tk)}" data-emp="${U.esc(tk)}">${V._logo({ tipo: "b3", classe: "Renda variavel", cod: tk }, true)}<b>${U.esc(tk)}</b></a>`;
  const catCel = (c) => `<span class="cat-tag" style="--c:${corCat(c)}">${c}</span>`;
  // opção com 3º item = texto do botão (i) que explica a opção
  const seg = (k, opcoes, atual, rotulo) => `<div class="seg" role="group" aria-label="${rotulo}">${opcoes.map(([v, t, info]) => `<button type="button" data-k="${k}" data-v="${v}" aria-pressed="${String(v) === String(atual)}">${t}</button>${info ? U.info(info, t) : ""}`).join("")}</div>`;
  const sel = (k, rotulo, opcoes, atual) => `<label class="fld">${rotulo}<select data-k="${k}">${opcoes.map(([v, t]) => `<option value="${U.esc(v)}" ${String(v) === String(atual) ? "selected" : ""}>${U.esc(t)}</option>`).join("")}</select></label>`;
  const soma = (ls) => ls.reduce((a, l) => a + l.liq, 0);
  const pct = (v) => U.num(v, 2) + "%";

  // período: data inicial (exclusiva) para cada opção
  function desde(per, id) {
    const y = M.BASE.slice(0, 4);
    if (per === "ano") return `${+y - 1}-12-31`;
    if (per === "tudo") return "0000";
    if (per === "mes") return M.BASE.slice(0, 8) + "00";
    if (per === "mesant") return M.addDays(M.BASE.slice(0, 8) + "01", -1).slice(0, 8) + "00";
    return M.addDays(M.BASE, -Math.round(+per * 30.44));
  }
  const dataDe = (l, base) => (base === "com" ? l.dataCom : l.pagamento);

  // agrupamento do gráfico: mensal, trimestral, semestral, anual
  const chave = (d, agr) => { const y = d.slice(0, 4), m = +d.slice(5, 7); return agr === "M" ? d.slice(0, 7) : agr === "T" ? `${y}-T${Math.ceil(m / 3)}` : agr === "S" ? `${y}-S${Math.ceil(m / 6)}` : y; };
  const rotuloChave = (k, agr) => (agr === "M" ? U.mesAno(k + "-01") : agr === "A" ? k : `${k.slice(-1)}${k.slice(5, 6)}${k.slice(2, 4)}`);
  function chaves(de, ate, agr) {
    const out = []; let d = de.slice(0, 7) + "-01";
    while (d <= ate) { const k = chave(d, agr); if (out[out.length - 1] !== k) out.push(k); d = M.iso(new Date(Date.UTC(+d.slice(0, 4), +d.slice(5, 7), 1, 12))); }
    return out;
  }

  // séries empilhadas do gráfico conforme a visão escolhida
  function series(ls, visao) {
    if (visao === "completo") return [{ nome: "Proventos", cor: "#06377b", f: () => true }];
    const campo = visao === "categoria" ? "categoria" : visao === "segmento" ? "segmento" : "tk";
    const tot = {}; ls.forEach((l) => (tot[l[campo]] = (tot[l[campo]] || 0) + l.liq));
    const top = Object.keys(tot).sort((a, b) => tot[b] - tot[a]), max = visao === "categoria" ? 9 : 7;
    const out = top.slice(0, max).map((n, i) => ({ nome: n, cor: visao === "categoria" ? corCat(n) : PAL[i % PAL.length], f: (l) => l[campo] === n }));
    if (top.length > max) { const resto = new Set(top.slice(max)); out.push({ nome: "Outros", cor: "#9aa7b8", f: (l) => resto.has(l[campo]) }); }
    return out;
  }

  // barra horizontal "Proventos por categoria"
  function barraCategorias(ls) {
    const tot = {}; ls.forEach((l) => (tot[l.categoria] = (tot[l.categoria] || 0) + l.liq));
    const t = soma(ls), cats = Object.keys(tot).sort((a, b) => tot[b] - tot[a]);
    if (!t) return '<div class="muted">Sem proventos no período.</div>';
    return `<div class="cat-sum">${cats.map((c) => `<div style="flex:${tot[c] / t}"><span class="lbl" style="color:${corCat(c)}">${c}</span><b>${U.brl(tot[c])}</b><span class="small muted">${U.num((tot[c] / t) * 100, 1)}%</span><i style="background:${corCat(c)}"></i></div>`).join("")}</div>`;
  }

  // tabela ordenável: cols = [[título, num?, info?]], linhas = [{ord:[...], html}]
  function tabela(cols, linhas, extra = "") {
    return `<div class="tbl-wrap"><table class="tbl-ativos tbl-prov">${extra}<thead><tr>${cols.map(([t, n, info], i) => `<th class="${n ? "num" : ""}"><button type="button" class="th-sort" data-col="${i}">${t} <span aria-hidden="true">↕</span></button>${info ? U.info(info, t) : ""}</th>`).join("")}</tr></thead><tbody>${linhas.map((l) => `<tr data-ord='${JSON.stringify(l.ord).replace(/'/g, "&#39;")}'>${l.html}</tr>`).join("")}</tbody></table></div>`;
  }
  function ordenavel(raiz) {
    raiz.querySelectorAll(".tbl-prov .th-sort").forEach((b) => b.addEventListener("click", () => {
      const th = b.closest("th"), tb = b.closest("table").tBodies[0], col = +b.dataset.col, asc = th.getAttribute("aria-sort") !== "ascending";
      b.closest("tr").querySelectorAll("th").forEach((x) => x.removeAttribute("aria-sort"));
      th.setAttribute("aria-sort", asc ? "ascending" : "descending");
      [...tb.rows].filter((r) => r.dataset.ord).sort((r1, r2) => { const a = JSON.parse(r1.dataset.ord)[col], z = JSON.parse(r2.dataset.ord)[col]; return (typeof a === "string" ? a.localeCompare(z) : a - z) * (asc ? 1 : -1); }).forEach((r) => tb.appendChild(r));
    }));
  }

  const COLS_LANC = (comCorretora) => [["Categoria"], ["Ativo"]].concat(comCorretora ? [["Corretora/banco"]] : []).concat([["Tipo"], ["Quantidade", 1], ["Valor", 1, "Valor bruto por cota ou ação."], ["Total", 1, "Valor bruto (quantidade × valor)."], ["Total líq.", 1, "O que cai na conta. JCP tem 15% de IR retido na fonte; dividendos e rendimentos de FII são isentos."], ["Data com", 0, "Último dia para comprar o ativo e ter direito ao provento."], ["Pagamento"]]);
  const linhaLanc = (l, comCorretora) => ({
    ord: [l.categoria, l.tk].concat(comCorretora ? [l.corretora] : []).concat([l.tipo, l.q, l.valor, l.bruto, l.liq, l.dataCom, l.pagamento]),
    html: `<td>${catCel(l.categoria)}</td><td>${ativoCel(l.tk)}</td>${comCorretora ? `<td>${U.esc(l.corretora)}</td>` : ""}<td>${l.tipo}</td><td class="num">${U.qtd(l.q)}</td><td class="num">R$ ${U.num(l.valor, 6)}</td><td class="num">${U.brl(l.bruto)}</td><td class="num"><b>${U.brl(l.liq)}</b></td><td>${U.data(l.dataCom)}</td><td>${U.data(l.pagamento)}</td>`,
  });

  // ---------- seções ----------
  const S = {};

  // 1) gráfico com filtros + proventos por categoria
  S.graf = (id) => {
    const agr = st("agr", "M"), base = st("base", "pag"), visao = st("visao", "completo"), per = st("per", "12");
    const de = per === "tudo" ? M.addDays(window.CONSOL.inicio(id).data, -1) : desde(per, id);
    const ls = P.lancamentos(id).filter((l) => l.status === "pago" && dataDe(l, base) > de && dataDe(l, base) <= M.BASE);
    const ks = chaves(M.addDays(de, 1), M.BASE, agr), ss = series(ls, visao);
    document.getElementById("provPeriodo").textContent = U.brl(soma(ls));
    CH.barras(document.getElementById("chProvG"), ks.map((k) => ({ rotulo: rotuloChave(k, agr), valores: ss.map((s) => soma(ls.filter((l) => chave(dataDe(l, base), agr) === k && s.f(l)))) })), ss, { fmtY, altura: 280, label: "Proventos recebidos por período" });
    document.getElementById("provCat").innerHTML = barraCategorias(ls);
  };

  // 2) rendimento mês a mês (últimos 12 meses e ano a ano), em R$, YoC ou DY
  S.mm = (id) => {
    const vis = st("mm", "ambos"), modo = st("mmv", "total"), cat = st("mmc", "Carteira");
    const its = window.CONSOL.itens(id).filter((x) => x.tipo === "b3" && x.classe === "Renda variavel" && (cat === "Carteira" || P.categoria(x.cod) === cat));
    const custo = its.reduce((a, x) => a + window.RENT.posicao(id, x).pm * x.q, 0), mercado = its.reduce((a, x) => a + x.valor, 0);
    const ls = P.lancamentos(id).filter((l) => l.status === "pago" && l.pagamento <= M.BASE && (cat === "Carteira" || l.categoria === cat));
    const porMes = {}; ls.forEach((l) => { const k = l.pagamento.slice(0, 7); porMes[k] = (porMes[k] || 0) + l.liq; });
    const conv = (v) => (modo === "yoc" ? (custo ? (v / custo) * 100 : 0) : modo === "dy" ? (mercado ? (v / mercado) * 100 : 0) : v);
    const fmt = (v) => (v === null ? '<span class="muted">—</span>' : U.state.hide ? "•••" : modo === "total" ? U.num(v, 2) : pct(v));
    const ini = window.CONSOL.inicio(id).data.slice(0, 7), fim = M.BASE.slice(0, 7);
    const celula = (k) => (k < ini || k > fim ? null : conv(porMes[k] || 0));
    const linha = (rot, ks) => { const vs = ks.map(celula), ok = vs.filter((v) => v !== null), tot = ok.reduce((a, v) => a + v, 0); return `<tr><th scope="row" class="tag-c">${rot}</th>${vs.map((v) => `<td class="num">${fmt(v)}</td>`).join("")}<td class="num"><b>${fmt(tot)}</b></td><td class="num"><b>${fmt(ok.length ? tot / ok.length : 0)}</b></td></tr>`; };
    const ult = []; for (let i = 11; i >= 0; i--) { const d = new Date(Date.UTC(+fim.slice(0, 4), +fim.slice(5, 7) - 1 - i, 1, 12)); ult.push(M.iso(d).slice(0, 7)); }
    const anos = []; for (let y = +fim.slice(0, 4); y >= +ini.slice(0, 4); y--) anos.push(y);
    const cab = (t, rots) => `<thead><tr><th class="mm-t">${t}<small>${cat}${modo === "total" ? " · R$" : " · %"}</small></th>${rots.map((x) => `<th class="num">${x}</th>`).join("")}<th class="num">Total</th><th class="num">Média</th></tr></thead>`;
    const t12 = `<div class="tbl-wrap"><table class="tbl-ativos tbl-mm">${cab("Últ. 12M", ult.map((k) => U.MESES[+k.slice(5) - 1] + "/" + k.slice(2, 4)))}<tbody>${linha(cat, ult)}</tbody></table></div>`;
    const tAnos = `<div class="tbl-wrap"><table class="tbl-ativos tbl-mm">${cab("Ano a ano", U.MESES)}<tbody>${anos.map((y) => linha(y, U.MESES.map((_, m) => `${y}-${String(m + 1).padStart(2, "0")}`))).join("")}</tbody></table></div>`;
    const nota = modo === "total" ? "Valores líquidos recebidos em cada mês." : modo === "yoc" ? `Yield on cost: proventos do mês ÷ quanto você pagou pelos ativos (${U.brl(custo)}).` : `Dividend yield: proventos do mês ÷ valor atual dos ativos (${U.brl(mercado)}).`;
    document.getElementById("provMM").innerHTML = (vis !== "anos" ? t12 : "") + (vis !== "12" ? `<div style="margin-top:${vis === "ambos" ? 14 : 0}px">${tAnos}</div>` : "") + `<p class="small muted" style="margin:10px 0 0">${nota} Meses antes de você começar a investir ficam com “—”.</p>`;
  };

  // 3) ativos por categoria
  S.at = (id) => {
    const per = st("atp", "12"), todos = P.lancamentos(id), r = window.CART.resumo(id), held = Object.fromEntries(r.ativos.map((a) => [a.tk, a]));
    const pagos = (n) => todos.filter((l) => l.status === "pago" && l.pagamento <= M.BASE && l.pagamento > M.addDays(M.BASE, -Math.round(n * 30.44)));
    const prov = todos.filter((l) => l.status === "provisionado");
    const base = per === "prov" ? prov : pagos(+per);
    const cats = [...new Set(todos.map((l) => l.categoria))].sort((a, b) => soma(base.filter((l) => l.categoria === b)) - soma(base.filter((l) => l.categoria === a)));
    const segs = cats.map((c) => ({ nome: c, valor: soma(base.filter((l) => l.categoria === c)), cor: corCat(c) })).filter((s) => s.valor > 0);
    const porAtivo = {}; base.forEach((l) => (porAtivo[l.tk] = (porAtivo[l.tk] || 0) + l.liq));
    const topAt = Object.entries(porAtivo).sort((a, b) => b[1] - a[1]);
    const COLS = [["Ativo"], ["Quantidade", 1], ["DY", 1, "Dividend yield: proventos brutos por cota nos últimos 12 meses ÷ preço atual."], ["Yield on cost", 1, "Proventos brutos por cota nos últimos 12 meses ÷ seu preço médio."], ["Último provento", 1], ["Total acumulado", 1, "Tudo o que você já recebeu deste ativo, desde o começo."], ["Provisionado", 1, "Já tem direito (data-com passou) e ainda não foi pago."], ["Últ. 12M", 1]];
    const acc = cats.map((c, i) => {
      const lc = todos.filter((l) => l.categoria === c), tks = [...new Set(lc.map((l) => l.tk))];
      const linhas = tks.map((tk) => {
        const lt = lc.filter((l) => l.tk === tk), a = held[tk], p12 = lt.filter((l) => l.status === "pago" && l.pagamento <= M.BASE && l.pagamento > M.addDays(M.BASE, -365));
        const ult = lt.filter((l) => l.status === "pago" && l.pagamento <= M.BASE)[0], porCota12 = p12.reduce((s, l) => s + l.valor, 0);
        const pos = a ? window.RENT.posicao(id, { cod: tk, tipo: "b3", preco: a.preco, q: a.q }) : null;
        const dy = a ? (porCota12 / a.preco) * 100 : null, yoc = pos ? (porCota12 / pos.pm) * 100 : null;
        const acum = soma(lt.filter((l) => l.status === "pago" && l.pagamento <= M.BASE)), provis = soma(lt.filter((l) => l.status === "provisionado")), ul12 = soma(p12);
        return { ord: [tk, a ? a.q : 0, dy || 0, yoc || 0, ult ? ult.liq : 0, acum, provis, ul12], html: `<td>${ativoCel(tk)}</td><td class="num">${a ? U.qtd(a.q) : '<span class="muted">vendido</span>'}</td><td class="num">${dy === null ? "—" : pct(dy)}</td><td class="num">${yoc === null ? "—" : pct(yoc)}</td><td class="num">${ult ? `${U.brl(ult.liq)}<small class="muted">${U.data(ult.pagamento)}</small>` : "—"}</td><td class="num">${U.brl(acum)}</td><td class="num">${U.brl(provis)}</td><td class="num"><b>${U.brl(ul12)}</b></td>` };
      });
      const kp = (rot, v) => `<div class="grp-kpi"><span class="lbl">${rot}</span><b>${U.brl(v)}</b></div>`;
      return `<details class="acc-cat" ${i === 0 ? "open" : ""}><summary><span class="acc-n" style="color:${corCat(c)}">${c}</span><span class="acc-k">${kp("Total últ. 6m", soma(pagos(6).filter((l) => l.categoria === c)))}${kp("Total últ. 12m", soma(pagos(12).filter((l) => l.categoria === c)))}${kp("Total últ. 24m", soma(pagos(24).filter((l) => l.categoria === c)))}${kp("Provisionado", soma(prov.filter((l) => l.categoria === c)))}</span></summary>${tabela(COLS, linhas)}</details>`;
    }).join("");
    document.getElementById("provAt").innerHTML = `<div class="at-grid"><div><div id="dProvAt"></div><div class="at-top">${topAt.slice(0, 8).map(([tk, v], k) => `<div><span>${k + 1}. ${U.esc(tk)}</span><b>${U.brl(v)}</b></div>`).join("") || '<div class="muted">Nada neste período.</div>'}</div></div><div>${acc}</div></div>`;
    if (segs.length) CH.rosca(document.getElementById("dProvAt"), segs, { centro: U.state.hide ? "•••" : "R$ " + U.num(soma(base) / 1000, 1) + " mil", sub: per === "prov" ? "provisionado" : `em ${per} meses`, label: "Proventos por categoria" });
    ordenavel(document.getElementById("provAt"));
  };

  // 4) lista de proventos recebidos
  S.ls = (id) => {
    const busca = (document.getElementById("lsBusca").value || "").trim().toUpperCase(), base = st("lbase", "pag"), agr = st("lagr", "todos"), cor = st("lcor", ""), per = st("lper", "6"), tam = +st("ltam", 15);
    const de = desde(per, id), ate = per === "mesant" ? M.BASE.slice(0, 8) + "00" : M.BASE;
    const ls = P.lancamentos(id).filter((l) => l.status === "pago" && dataDe(l, base) > de && dataDe(l, base) <= ate && l.pagamento <= M.BASE && (!busca || l.tk.includes(busca)) && (!cor || l.corretora === cor))
      .sort((a, b) => (dataDe(a, base) < dataDe(b, base) ? 1 : -1));
    const pag = Math.min(+(document.getElementById("provLs").dataset.pag || 0), tam ? Math.max(0, Math.ceil(ls.length / tam) - 1) : 0);
    const visiveis = tam && agr === "todos" ? ls.slice(pag * tam, pag * tam + tam) : ls;
    let corpo;
    if (agr === "todos") corpo = tabela(COLS_LANC(true), visiveis.map((l) => linhaLanc(l, true)));
    else {
      const campo = agr === "ativo" ? (l) => l.tk : agr === "categoria" ? (l) => l.categoria : (l) => U.mesAno(dataDe(l, base));
      const grupos = []; ls.forEach((l) => { const g = campo(l); let x = grupos.find((y) => y.g === g); if (!x) grupos.push((x = { g, ls: [] })); x.ls.push(l); });
      if (agr !== "mes") grupos.sort((a, b) => soma(b.ls) - soma(a.ls));
      corpo = grupos.map((g) => `<div class="grp-sub"><h3>${U.esc(g.g)}</h3><span class="small muted">${g.ls.length} ${g.ls.length === 1 ? "pagamento" : "pagamentos"}</span><b>${U.brl(soma(g.ls))}</b></div>${tabela(COLS_LANC(true), g.ls.map((l) => linhaLanc(l, true)))}`).join("");
    }
    const nPag = tam && agr === "todos" ? Math.ceil(ls.length / tam) : 1;
    document.getElementById("lsTotal").textContent = U.brl(soma(ls));
    document.getElementById("provLs").innerHTML = (ls.length ? corpo : '<div class="empty"><div class="big">🔎</div>Nenhum provento com esses filtros.</div>') +
      (ls.length ? `<div class="pager">${sel("ltam", "Por página", [[15, "15"], [30, "30"], [0, "Todos"]], tam)}${nPag > 1 ? `<button type="button" class="icon-btn" data-pag="${pag - 1}" ${pag ? "" : "disabled"} aria-label="Página anterior">‹</button><span>Página ${pag + 1} de ${nPag}</span><button type="button" class="icon-btn" data-pag="${pag + 1}" ${pag < nPag - 1 ? "" : "disabled"} aria-label="Próxima página">›</button>` : ""}</div>` : "");
    ordenavel(document.getElementById("provLs"));
  };

  // 5) proventos futuros
  S.fu = (id) => {
    const base = st("fbase", "pag"), todos = P.lancamentos(id), pv = todos.filter((l) => l.status === "provisionado"), fu = todos.filter((l) => l.status === "futura");
    const ord = (ls) => ls.slice().sort((a, b) => (dataDe(a, base) < dataDe(b, base) ? -1 : 1));
    const ks = [...new Set(ord(pv.concat(fu)).map((l) => dataDe(l, base).slice(0, 7)))];
    CH.barras(document.getElementById("chProvF"), ks.map((k) => ({ rotulo: U.mesAno(k + "-01"), valores: [soma(pv.filter((l) => dataDe(l, base).startsWith(k))), soma(fu.filter((l) => dataDe(l, base).startsWith(k)))] })), [{ nome: "Provisionado", cor: "#0e7c86" }, { nome: "Data com futura", cor: "#c27c0e", hachura: true }], { fmtY, altura: 240, label: "Proventos futuros por mês" });
    const bloco = (t, sub, ls) => `<div class="grp-sub fut"><div><h3>${t}</h3><span class="small muted">${sub}</span></div><div class="tot-liq"><span>total líquido</span><b>${U.brl(soma(ls))}</b></div></div>${ls.length ? tabela(COLS_LANC(false), ord(ls).map((l) => linhaLanc(l, false))) : '<p class="muted">Nenhum agora.</p>'}`;
    document.getElementById("provFuCat").innerHTML = barraCategorias(pv.concat(fu));
    document.getElementById("provFu").innerHTML = bloco("Provisionado", "Você tem direito a estes proventos pela data com", pv) + bloco("Data com futura", "Você terá direito se ainda tiver o ativo na data com", fu);
    ordenavel(document.getElementById("provFu"));
  };

  const SECAO = { agr: "graf", base: "graf", visao: "graf", per: "graf", mm: "mm", mmv: "mm", mmc: "mm", atp: "at", lbase: "ls", lagr: "ls", lcor: "ls", lper: "ls", ltam: "ls", fbase: "fu" };

  V._provResumo = {
    html({ id, r }) {
      const todos = P.lancamentos(id), provis = todos.filter((l) => l.status === "provisionado");
      const cats = ["Carteira"].concat([...new Set(todos.map((l) => l.categoria))]);
      const insts = [...new Set(todos.map((l) => l.corretora))];
      const kpi = (rot, v, info) => `<div class="pk"><span class="lbl">${rot}${info ? U.info(info, rot) : ""}</span><b>${v}</b></div>`;
      return `<div id="provRoot"><section class="card prov-top">
          <div class="pk-row"><div class="pk-dest">${kpi("Total recebido", U.brl(P.recebido(id, null)), "Tudo o que você já recebeu, desde que começou a investir (valores líquidos).")}${kpi("Total provisionado", U.brl(soma(provis)), "Já tem direito pela data com e ainda não foi pago.")}</div>
            ${kpi("Total do período", `<span id="provPeriodo"></span>`)}${kpi("Últ. 6 meses", U.brl(P.recebido(id, 6)))}${kpi("Últ. 12 meses", U.brl(P.recebido(id, 12)))}${kpi("Últ. 24 meses", U.brl(P.recebido(id, 24)))}</div>
          <div class="prov-fil">${sel("agr", "Agrupar", [["M", "Mensal"], ["T", "Trimestral"], ["S", "Semestral"], ["A", "Anual"]], st("agr", "M"))}${sel("base", "Data base", [["pag", "Pagamento"], ["com", "Data com"]], st("base", "pag"))}${sel("visao", "Visão", [["completo", "Completo"], ["categoria", "Por categoria"], ["segmento", "Por segmento"], ["ativos", "Por ativo"]], st("visao", "completo"))}${sel("per", "Período", [["ano", "Ano atual"], ["6", "6 meses"], ["12", "1 ano"], ["24", "2 anos"], ["60", "5 anos"], ["tudo", "Tudo"]], st("per", "12"))}</div>
          <div class="chart" id="chProvG"></div>
          <h3 class="sec-mini">Proventos por categoria ${U.info("Quanto cada categoria pagou no período escolhido acima.")}</h3><div id="provCat"></div></section>

        <section class="card section"><div class="card-h"><div><h2>Rendimento mês a mês</h2><div class="sub">Quanto caiu na sua conta em cada mês</div></div>
          <div class="prov-fil">${seg("mm", [["12", "Últ. 12M"], ["anos", "Ano a ano"], ["ambos", "Ambos"]], st("mm", "ambos"), "Tabelas")}${seg("mmv", [["total", "Total e média"], ["yoc", "YoC", "Yield on cost (YoC): quanto os proventos rendem sobre o que você PAGOU pelos ativos. Ex.: comprou por R$ 1.000 e recebeu R$ 10 no mês = 1% de YoC no mês."], ["dy", "DY", "Dividend yield (DY): quanto os proventos rendem sobre o valor ATUAL dos ativos. Ex.: seus ativos valem hoje R$ 2.000 e você recebeu R$ 10 no mês = 0,5% de DY no mês."]], st("mmv", "total"), "Mostrar em")}${sel("mmc", "Mostrar", cats.map((c) => [c, c]), st("mmc", "Carteira"))}</div></div>
          <div id="provMM"></div></section>

        <section class="card section"><div class="card-h"><div><h2>Ativos por categoria</h2><div class="sub">Quanto cada ativo pagou, com DY e yield on cost</div></div>${seg("atp", [["6", "Últ. 6M"], ["12", "Últ. 12M"], ["24", "Últ. 24M"], ["prov", "Provisionado"]], st("atp", "12"), "Período")}</div>
          <div id="provAt"></div></section>

        <section class="card section"><div class="card-h"><div><h2>Proventos</h2><div class="sub">Cada pagamento que você recebeu</div></div><div class="tot-liq"><span>total líquido</span><b id="lsTotal"></b></div></div>
          <div class="prov-fil"><label class="fld">Buscar ativo<input id="lsBusca" type="search" placeholder="ex.: PETR4" autocomplete="off"></label>${sel("lbase", "Data base", [["com", "Data com"], ["pag", "Data de pagamento"]], st("lbase", "pag"))}${sel("lagr", "Agrupar proventos", [["todos", "Listar todos"], ["ativo", "Por ativo"], ["categoria", "Por categoria"], ["mes", "Por mês"]], st("lagr", "todos"))}${sel("lcor", "Corretora/banco", [["", "Todas"]].concat(insts.map((i) => [i, i])), st("lcor", ""))}${sel("lper", "Período", [["mes", "Mês atual"], ["mesant", "Mês anterior"], ["6", "6 meses"], ["12", "1 ano"], ["24", "2 anos"], ["60", "5 anos"], ["tudo", "Tudo"]], st("lper", "6"))}</div>
          <div id="provLs" data-pag="0"></div></section>

        <section class="card section"><div class="card-h"><div><h2>Proventos futuros</h2><div class="sub">O que já foi anunciado e ainda vai cair</div></div>${sel("fbase", "Data base", [["pag", "Data de pagamento"], ["com", "Data com"]], st("fbase", "pag"))}</div>
          <div class="chart" id="chProvF"></div><h3 class="sec-mini">Proventos por categoria</h3><div id="provFuCat"></div><div id="provFu"></div></section>
        <p class="small muted">Dados simulados neste protótipo. Antes dos últimos 12 meses, o histórico é estimado pelo provento anual de cada ativo.</p></div>`;
    },
    after({ id }) {
      const raiz = document.getElementById("provRoot");
      Object.values(S).forEach((f) => f(id));
      const muda = (k, v) => {
        U.store.set("prov:" + k, v);
        raiz.querySelectorAll(`button[data-k="${k}"]`).forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.v === String(v))));
        if (SECAO[k] === "ls") document.getElementById("provLs").dataset.pag = 0;
        S[SECAO[k]](id);
      };
      raiz.addEventListener("click", (e) => {
        const b = e.target.closest("button[data-k]"); if (b) return muda(b.dataset.k, b.dataset.v);
        const p = e.target.closest("[data-pag]"); if (p && p.tagName === "BUTTON") { document.getElementById("provLs").dataset.pag = p.dataset.pag; S.ls(id); }
      });
      raiz.addEventListener("change", (e) => { const s = e.target.closest("select[data-k]"); if (s) muda(s.dataset.k, s.value); });
      let t; document.getElementById("lsBusca").addEventListener("input", () => { clearTimeout(t); t = setTimeout(() => { document.getElementById("provLs").dataset.pag = 0; S.ls(id); }, 200); });
    },
  };
})(window.VIEWS);
