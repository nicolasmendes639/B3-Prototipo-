/* Cálculos da carteira de um investidor a partir da amostra. Toda métrica expõe sua metodologia. */
window.CART = (function () {
  const D = window.B3DATA, M = window.MERCADO, C = window.CATALOGO;
  const CORES_CLASSE = { "Renda variavel": "var(--c1)", "Tesouro Direto": "var(--c2)", "Renda fixa": "var(--c4)", Fundos: "var(--c3)" };
  const CORES_HEX = { "Renda variavel": "#06377b", "Tesouro Direto": "#0e7c86", "Renda fixa": "#c27c0e", Fundos: "#7a3db8" };
  const PALETA = ["#06377b", "#0e7c86", "#7a3db8", "#c27c0e", "#2e8b57", "#c2410c", "#4f6d9a", "#9b2c5e", "#5f7d1f", "#8a5a44", "#2a6f97", "#a23b72"];
  const cache = {};

  const ym = (s) => s.slice(0, 7);
  const soma = (arr, f = (x) => x) => arr.reduce((a, x) => a + f(x), 0);

  function hash(s) { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0; return Math.abs(h); }

  function resumo(id) {
    if (cache[id]) return cache[id];
    const inv = D.investidores[id];
    const total = soma(inv.classes, (c) => c[4]);
    const agrupa = (idx) => { const o = {}; inv.classes.forEach((c) => (o[c[idx]] = (o[c[idx]] || 0) + c[4])); return Object.entries(o).map(([k, v]) => ({ nome: k, valor: v, pct: (v / total) * 100 })).sort((a, b) => b.valor - a.valor); };
    const porClasse = agrupa(1).map((x) => Object.assign(x, { cor: CORES_HEX[x.nome] || "#888" }));
    const porInst = agrupa(0).map((x, i) => Object.assign(x, { cor: PALETA[i % PALETA.length] }));
    const porTipo = (() => { const o = {}; inv.classes.forEach((c) => { const k = c[1] + "|" + c[2]; o[k] = o[k] || { classe: c[1], tipo: c[2], valor: 0, qtd: 0, inst: new Set() }; o[k].valor += c[4]; o[k].qtd += c[3]; o[k].inst.add(c[0]); }); return Object.values(o).sort((a, b) => b.valor - a.valor); })();

    // Posições por ativo (renda variável e Tesouro) com cotação simulada do dia
    const ativos = inv.ativos.map(([tk, classe, tipo, q, p, v]) => {
      const cot = M.cotacoes[tk];
      return { tk, classe, tipo, q, preco: p, valor: v, pct: (v / total) * 100, var: cot ? cot.var : null, var12m: cot ? cot.var12m : null, meta: C.ativos[tk] || {} };
    }).sort((a, b) => b.valor - a.valor);

    const evol = inv.evol; // [data, patrimonio]
    const ini = evol[0][1], fim = evol[evol.length - 1][1];
    const dataIni = evol[0][0];
    const movs12 = inv.mov.filter((m) => m[0] > dataIni);
    const entradas = soma(movs12.filter((m) => m[3] === "Compra"), (m) => m[7]);
    const saidas = soma(movs12.filter((m) => m[3] === "Venda"), (m) => m[7]);
    const aportesLiq = entradas - saidas;
    const variacao = fim - ini;
    const resultado = variacao - aportesLiq;

    // Rentabilidade mensal (Modified Dietz simplificado: fluxos no meio do mês)
    const fluxoMes = {};
    inv.mov.forEach((m) => { const k = ym(m[0]); fluxoMes[k] = (fluxoMes[k] || 0) + (m[3] === "Compra" ? m[7] : -m[7]); });
    // proventos recebidos no mês entram como retorno na curva "com proventos"
    const provMes = {};
    inv.prov.forEach((p) => { if (p[6]) provMes[ym(p[0])] = (provMes[ym(p[0])] || 0) + p[5]; });
    const rent = [[evol[0][0], 0]], cdi = [[evol[0][0], 0]], rentProv = [[evol[0][0], 0]];
    let acc = 1, accCdi = 1, accProv = 1;
    for (let i = 1; i < evol.length; i++) {
      const v0 = evol[i - 1][1], v1 = evol[i][1];
      const k = ym(evol[i][0]);
      const f = i === evol.length - 1 && ym(evol[i][0]) === ym(evol[i - 1][0]) ? 0 : fluxoMes[k] || 0;
      let r = (v1 - v0 - f) / (v0 + 0.5 * f || 1);
      r = Math.max(-0.35, Math.min(0.35, r));
      const rp = Math.max(-0.35, Math.min(0.35, r + (provMes[k] || 0) / (v0 + 0.5 * f || 1)));
      acc *= 1 + r; accCdi *= 1 + (M.cdiMensal[i - 1] || 1) / 100; accProv *= 1 + rp;
      rent.push([evol[i][0], (acc - 1) * 100]); cdi.push([evol[i][0], (accCdi - 1) * 100]); rentProv.push([evol[i][0], (accProv - 1) * 100]);
    }
    const ibovS = M.indices.IBOV.serie;
    const ibov = evol.map(([d]) => { const p = ibovS.filter((x) => x[0] <= d).pop() || ibovS[0]; return [d, (p[1] / ibovS.find((x) => x[0] >= dataIni)[1] - 1) * 100]; });

    // Proventos
    const prov = inv.prov.map(([data, classe, tipo, tk, tp, valor, recebido]) => ({ data, classe, tipo, tk, tp, valor, recebido }));
    const recebidos12 = prov.filter((p) => p.recebido && p.data > dataIni);
    const anunciados = prov.filter((p) => !p.recebido);

    // Instituições: status de atualização simulado (um caso "aguardando origem" quando há 3+ instituições)
    const insts = porInst.map((x) => x.nome).sort();
    const pend = insts.length >= 3 ? insts[hash(id) % insts.length] : null;
    const conexoes = insts.map((n) => ({ nome: n, valor: porInst.find((x) => x.nome === n).valor, status: n === pend ? "aguardando" : "ok", posicao: n === pend ? "2026-11-19" : D.dataBase }));

    const r = { id, inv, total, porClasse, porInst, porTipo, ativos, evol, ini, fim, variacao, aportesLiq, entradas, saidas, resultado, rent, rentProv, cdi, ibov, prov, recebidos12, anunciados, conexoes, pendInst: pend, dataIni };
    cache[id] = r;
    return r;
  }

  // Temas que a carteira sugere (para o feed)
  function temasCarteira(r) {
    const t = new Set();
    r.porTipo.forEach((p) => {
      if (p.tipo === "Acoes") t.add("acoes"); if (p.tipo === "FII") t.add("fii"); if (p.tipo === "ETF") t.add("etf");
      if (p.tipo === "Titulo publico") t.add("tesouro"); if (p.classe === "Renda fixa") t.add("renda fixa");
    });
    if (r.prov.length) t.add("dividendos");
    return t;
  }

  const perfilInferido = (inv) => ({ "Renda fixa": "con", Mista: "mod", "Renda variavel": "arr" }[inv.perfilCarteira] || "mod");

  return { resumo, temasCarteira, perfilInferido, CORES_CLASSE, CORES_HEX, PALETA };
})();
