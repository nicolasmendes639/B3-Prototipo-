/* ETFs de Criptomoedas negociados na B3 (a B3 não intermedia a compra direta de cripto)
 * + consolidação de TODAS as contas (B3 e renda fixa/fundos das corretoras) e cálculo de ganho/perda por período.
 */
window.CRIPTO = (function () {
  const U = window.U;
  // Preços e variações fictícios (data-base); o gráfico da aba Mercado usa a cotação real na B3.
  const MOEDAS = {
    QBTC11: { nome: "ETF de Bitcoin (QBTC11)", cor: "#f7931a", tv: "BMFBOVESPA:QBTC11", preco: 38.5, ch: { d1: -0.8, d7: -3.1, d30: -8.4, d180: 4.2, d365: 18.5 } },
    QETH11: { nome: "ETF de Ethereum (QETH11)", cor: "#627eea", tv: "BMFBOVESPA:QETH11", preco: 21.4, ch: { d1: -1.1, d7: -4.0, d30: -12.1, d180: -6.3, d365: 9.8 } },
    QSOL11: { nome: "ETF de Solana (QSOL11)", cor: "#14b8a6", tv: "BMFBOVESPA:QSOL11", preco: 9.8, ch: { d1: -1.4, d7: -5.2, d30: -15.0, d180: -10.4, d365: 12.2 } },
  };
  const estado = { aoVivo: false };

  function hash(s) { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0; return Math.abs(h); }

  // ETFs de Criptomoedas fictícios por investidor (3–8% do patrimônio; menor para perfis de renda fixa),
  // custodiados na B3 por meio da corretora principal do investidor
  function posicoes(id) {
    const inv = window.B3DATA.investidores[id];
    const totalB3 = inv.classes.reduce((a, c) => a + c[4], 0);
    const h = hash(id);
    if (inv.perfilCarteira === "Renda fixa" && h % 3 !== 0) return [];
    const pct = (inv.perfilCarteira === "Renda fixa" ? 0.015 : 0.03) + (h % 50) / 1000;
    const base = totalB3 * pct;
    const inst = (window.CART.resumo(id).porInst[0] || {}).nome || "Corretora";
    return [["QBTC11", 0.6], ["QETH11", 0.3], ["QSOL11", 0.1]].map(([s, w]) => {
      const q = Math.floor((base * w) / MOEDAS[s].preco);
      return { sym: s, q, nome: MOEDAS[s].nome, inst, get preco() { return MOEDAS[s].preco; }, get valor() { return q * MOEDAS[s].preco; } };
    }).filter((p) => p.q > 0);
  }

  // preço do ETF numa data (aproximação pela variação do período)
  function precoEm(sym, dataIso, diasAtras) {
    const m = MOEDAS[sym], ch = diasAtras <= 7 ? m.ch.d7 : diasAtras <= 30 ? m.ch.d30 : diasAtras <= 190 ? m.ch.d180 : m.ch.d365;
    // mais de 1 ano: repete a variação de 12 meses a cada ano
    if (diasAtras > 365) return m.preco / Math.pow(1 + m.ch.d365 / 100, diasAtras / 365);
    const k = Math.min(1, diasAtras / (diasAtras <= 7 ? 7 : diasAtras <= 30 ? 30 : diasAtras <= 190 ? 180 : 365));
    return m.preco / (1 + ((ch || 0) / 100) * k);
  }

  return { MOEDAS, estado, posicoes, precoEm };
})();

window.CONSOL = (function () {
  const M = window.MERCADO, C = window.CATALOGO, CR = window.CRIPTO;
  // rendimento mensal aproximado de produtos sem cotação diária (para reconstruir a curva)
  const TAXA_MES = { CDB: 0.0105, LCA: 0.0092, LCI: 0.0092, Debenture: 0.0115, "Fundo de investimento": 0.0095 };
  const CORES = { "Renda variavel": "#06377b", "Tesouro Direto": "#0e7c86", "Renda fixa": "#c27c0e", Fundos: "#7a3db8", Cripto: "#f7931a" };
  const ROTULO = { "Renda variavel": "Ações, FIIs e ETFs", "Tesouro Direto": "Tesouro Direto", "Renda fixa": "Renda fixa", Fundos: "Fundos", Cripto: "ETFs de Criptomoedas" };

  function itens(id) {
    const r = window.CART.resumo(id);
    const out = [];
    r.ativos.forEach((a) => out.push({ tipo: "b3", cod: a.tk, nome: (C.ativos[a.tk] || {}).nome || a.tk, classe: a.classe, sub: a.tipo, valor: a.valor, q: a.q, preco: a.preco }));
    const agg = {};
    r.inv.classes.filter((c) => c[1] === "Renda fixa" || c[1] === "Fundos").forEach((c) => { const k = c[2]; agg[k] = agg[k] || { tipo: "rf", cod: k, nome: k === "Fundo de investimento" ? "Fundos de investimento" : k === "Debenture" ? "Debêntures" : k, classe: c[1], sub: k, valor: 0, inst: new Set() }; agg[k].valor += c[4]; agg[k].inst.add(c[0]); });
    Object.values(agg).forEach((x) => out.push(Object.assign(x, { instTxt: [...x.inst].join(", ") })));
    CR.posicoes(id).forEach((p) => out.push({ tipo: "cripto", cod: p.sym, nome: p.nome, classe: "Cripto", sub: "ETF de Criptomoedas", valor: p.valor, q: p.q, preco: p.preco, inst: p.inst }));
    const total = out.reduce((a, x) => a + x.valor, 0);
    out.forEach((x) => (x.pct = (x.valor / total) * 100));
    return out.sort((a, b) => b.valor - a.valor);
  }

  function porClasse(id) {
    const o = {}; itens(id).forEach((x) => (o[x.classe] = (o[x.classe] || 0) + x.valor));
    const tot = Object.values(o).reduce((a, b) => a + b, 0);
    return Object.entries(o).map(([k, v]) => ({ chave: k, nome: ROTULO[k] || k, valor: v, pct: (v / tot) * 100, cor: CORES[k] || "#888" })).sort((a, b) => b.valor - a.valor);
  }

  function porInstituicao(id) {
    const r = window.CART.resumo(id);
    const out = r.porInst.map((i) => ({ nome: i.nome, valor: i.valor, tipo: "Corretora" }));
    // ETFs de Criptomoedas ficam na B3, pela corretora em que foram comprados
    CR.posicoes(id).forEach((p) => { const i = out.find((x) => x.nome === p.inst); if (i) i.valor += p.valor; else out.push({ nome: p.inst, valor: p.valor, tipo: "Corretora" }); });
    const tot = out.reduce((a, x) => a + x.valor, 0);
    return out.map((x, i) => Object.assign(x, { pct: (x.valor / tot) * 100, cor: window.CART.PALETA[i % 12] })).sort((a, b) => b.valor - a.valor);
  }

  // Série diária do patrimônio atual nos últimos n dias úteis (variação de mercado, sem aportes).
  // Períodos longos usam um ponto a cada poucos dias, para o gráfico continuar leve.
  function serie(id, n) {
    const its = itens(id), L = M.diasLongos.length, passo = Math.ceil(n / 260);
    const dias = M.diasLongos.slice(-n - 1).filter((_, k, a) => k === 0 || (a.length - 1 - k) % passo === 0);
    return dias.map((d) => {
      const back = L - 1 - M.diasLongos.lastIndexOf(d); // dias úteis atrás
      let v = 0;
      its.forEach((x) => {
        if (x.tipo === "b3") { const s = M.serieLonga(x.cod); v += x.valor * (s[L - 1 - back][1] / s[L - 1][1]); }
        else if (x.tipo === "rf") v += x.valor / Math.pow(1 + (TAXA_MES[x.sub] || 0.01), back / 21);
        else { const dc = Math.round(back * 1.45); v += x.q * CR.precoEm(x.cod, d, dc); }
      });
      return [d, v];
    });
  }

  const PERIODOS = { "7D": 5, "30D": 21, "6M": 126, "12M": 251, "24M": 503, TUDO: null };
  const ROTULO_PER = { TUDO: "Desde o começo" };
  // "Desde o começo": data simulada em que o investidor começou a investir (3 a 7 anos atrás)
  function inicio(id) { const n = 252 * 3 + (hash(id) % (252 * 4)); return { n, data: M.diasLongos[M.diasLongos.length - 1 - n] }; }
  const nDias = (id, per) => (per === "TUDO" ? inicio(id).n : PERIODOS[per] || PERIODOS["30D"]);
  function hash(s) { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0; return Math.abs(h); }
  function resultado(id, per) {
    const s = serie(id, nDias(id, per));
    const ini = s[0][1], fim = s[s.length - 1][1];
    return { serie: s, ini, fim, ganho: fim - ini, pct: ((fim - ini) / ini) * 100 };
  }
  // contribuição de cada item para o resultado do período
  function contribuicao(id, per) {
    const n = nDias(id, per), L = M.diasLongos.length;
    return itens(id).map((x) => {
      let ini;
      if (x.tipo === "b3") { const s = M.serieLonga(x.cod); ini = x.valor * (s[L - 1 - n][1] / s[L - 1][1]); }
      else if (x.tipo === "rf") ini = x.valor / Math.pow(1 + (TAXA_MES[x.sub] || 0.01), n / 21);
      else ini = x.q * CR.precoEm(x.cod, M.diasLongos[L - 1 - n], Math.round(n * 1.45));
      // proventos com data ex no período (ações, FIIs e ETFs que distribuem)
      const provR = x.tipo === "b3" && x.classe === "Renda variavel" ? window.RENT.provPeriodo(x.cod, x.q, n) : 0;
      return Object.assign({}, x, { ganho: x.valor - ini, pctVar: ((x.valor - ini) / ini) * 100, provR, ganhoProv: x.valor - ini + provR, pctProv: ((x.valor - ini + provR) / ini) * 100 });
    }).sort((a, b) => b.ganho - a.ganho);
  }

  return { itens, porClasse, porInstituicao, serie, resultado, contribuicao, inicio, PERIODOS, ROTULO_PER, CORES, ROTULO };
})();
