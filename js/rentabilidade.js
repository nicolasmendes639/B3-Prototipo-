/* Rentabilidade com e sem proventos + índices de referência (CDI, IPCA, Poupança, Ibovespa, IFIX, S&P 500).
 * Rentabilidade com proventos = variação do preço + proventos ÷ preço inicial (soma simples, sem reinvestir).
 * Ex.: a cota subiu 10% e pagou proventos equivalentes a 10% do preço inicial → 20% com proventos.
 */
window.RENT = (function () {
  const M = window.MERCADO, CR = window.CRIPTO;

  function hash(s) { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0; return Math.abs(h); }
  const provs = (tk) => M.proventosAtivo[tk] || [];
  const distribui = (tk) => provs(tk).length > 0;
  // cotação na data (primeiro pregão a partir dela; se for depois da série, o último)
  function precoEm(tk, d) { const s = M.cotacoes[tk].serie; return (s.find((p) => p[0] >= d) || s[s.length - 1])[1]; }

  // ---------- Período (ficha do ativo, comparador, acompanhamento) ----------
  // Proventos entram pela data ex (quando o preço "desconta" o provento).
  function periodo(tk, de, ate = M.BASE) {
    const p0 = precoEm(tk, de), p1 = precoEm(tk, ate);
    const prov = provs(tk).filter((p) => p.dataEx > de && p.dataEx <= ate).reduce((a, p) => a + p.valor, 0);
    const preco = (p1 / p0 - 1) * 100, provPct = (prov / p0) * 100;
    return { de, ate, p0, p1, preco, prov, provPct, total: preco + provPct, distribui: distribui(tk) };
  }
  const doze = (tk) => periodo(tk, M.dias[0]);

  // Série base 100 para gráficos (com proventos somados a partir da data ex)
  function serieBase100(tk, comProv) {
    const s = M.cotacoes[tk].serie, ps = provs(tk), p0 = s[0][1];
    return s.map(([d, v]) => [d, ((v + (comProv ? ps.filter((p) => p.dataEx > s[0][0] && p.dataEx <= d).reduce((a, p) => a + p.valor, 0) : 0)) / p0) * 100]);
  }

  // ---------- Posição do investidor (desde que ele tem o ativo) ----------
  // Data de entrada e preço médio simulados, estáveis por investidor e ativo.
  // Contam os proventos já pagos com data-com a partir da entrada.
  function posicao(id, x) {
    const h = hash(id + x.cod);
    if (x.tipo === "cripto") {
      const pm = CR.precoEm(x.cod, null, 60 + (h % 300)), preco = (x.preco / pm - 1) * 100;
      return { pm, entrada: null, preco, provCota: 0, provR: 0, provPct: 0, total: preco, distribui: false };
    }
    const s = M.cotacoes[x.cod].serie, ini = Math.floor(((h % 80) / 100) * s.length);
    const pm = (s.slice(ini).reduce((a, p) => a + p[1], 0) / (s.length - ini)) * (1 + (((h >> 3) % 9) - 4) / 100);
    const entrada = s[ini][0];
    const provCota = provs(x.cod).filter((p) => p.dataCom >= entrada && p.pagamento <= M.BASE).reduce((a, p) => a + p.valor, 0);
    const preco = (x.preco / pm - 1) * 100, provPct = (provCota / pm) * 100;
    return { pm, entrada, preco, provCota, provR: provCota * x.q, provPct, total: preco + provPct, distribui: distribui(x.cod) };
  }

  // Proventos (R$) recebidos nos últimos n pregões por uma posição de q cotas
  function provPeriodo(tk, q, n) {
    const de = M.dias[Math.max(0, M.dias.length - 1 - n)];
    return provs(tk).filter((p) => p.dataEx > de && p.dataEx <= M.BASE).reduce((a, p) => a + p.valor, 0) * q;
  }

  // ---------- Índices de referência ----------
  // Taxas mensais (%) de dez/25 a nov/26, alinhadas ao CDI da base (M.cdiMensal). IPCA e TR ilustrativos.
  const IPCA_MES = [0.52, 0.33, 0.47, 0.41, 0.36, 0.26, 0.24, 0.21, 0.38, 0.45, 0.32, 0.27, 0.18];
  const TR_MES = [0.17, 0.16, 0.15, 0.18, 0.17, 0.16, 0.18, 0.17, 0.16, 0.17, 0.16, 0.15, 0.1];
  const POUP_MES = TR_MES.map((tr) => 0.5 + tr); // Selic acima de 8,5% a.a.: 0,5% ao mês + TR
  const MESES = [...new Set(M.dias.map((d) => d.slice(0, 7)))]; // dez/25 … nov/26

  function diariaDeMensal(taxas) {
    const porMes = {}; M.dias.forEach((d) => (porMes[d.slice(0, 7)] = (porMes[d.slice(0, 7)] || 0) + 1));
    let acc = 1;
    return M.dias.map((d) => { const k = MESES.indexOf(d.slice(0, 7)); acc *= Math.pow(1 + (taxas[k] || 0) / 100, 1 / porMes[d.slice(0, 7)]); return [d, acc]; });
  }
  const deSerie = (s) => s.map(([d, v]) => [d, v / s[0][1]]);
  const INDICES = {
    cdi: { nome: "CDI", cor: "#0e7c86", desc: "Referência da renda fixa", fator: () => diariaDeMensal(M.cdiMensal) },
    ibov: { nome: "Ibovespa", cor: "#c27c0e", desc: "Referência de ações", fator: () => deSerie(M.indices.IBOV.serie) },
    ifix: { nome: "IFIX", cor: "#7a3db8", desc: "Referência de fundos imobiliários", fator: () => deSerie(M.indices.IFIX.serie) },
    ipca: { nome: "IPCA", cor: "#b3261e", desc: "Inflação oficial", fator: () => diariaDeMensal(IPCA_MES) },
    poup: { nome: "Poupança", cor: "#5b6b82", desc: "0,5% ao mês + TR", fator: () => diariaDeMensal(POUP_MES) },
    sp500: { nome: "S&P 500", cor: "#1f8a4c", desc: "Bolsa americana, em reais (via IVVB11)", fator: () => deSerie(M.cotacoes.IVVB11.serie) },
  };
  const cache = {};
  const fator = (k) => (cache[k] = cache[k] || INDICES[k].fator());
  // Variação acumulada (%) do índice entre a primeira data e cada data pedida
  function acumulado(k, datas) {
    const f = fator(k), em = (d) => (f.filter((p) => p[0] <= d).pop() || [d, 1])[1], b = em(datas[0]);
    return datas.map((d) => [d, (em(d) / b - 1) * 100]);
  }
  const base100 = (k) => fator(k).map(([d, v]) => [d, v * 100]);
  const total12 = (k) => (fator(k).at(-1)[1] - 1) * 100;

  return { distribui, periodo, doze, serieBase100, posicao, provPeriodo, INDICES, acumulado, base100, total12 };
})();
