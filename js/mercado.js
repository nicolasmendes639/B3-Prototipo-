/* Gera dados de mercado FICTÍCIOS e determinísticos a partir dos preços da amostra.
 * Em produção: market data B3 (cotações com atraso de 15 min), boletim diário e calendário de eventos corporativos.
 */
window.MERCADO = (function () {
  const D = window.B3DATA, C = window.CATALOGO;
  const BASE = D.dataBase; // 2026-11-23
  const ATUALIZACAO = BASE + "T18:05:00"; // horário de fechamento simulado

  function rng(seedStr) {
    let h = 1779033703 ^ seedStr.length;
    for (let i = 0; i < seedStr.length; i++) { h = Math.imul(h ^ seedStr.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
    return function () {
      h = Math.imul(h ^ (h >>> 16), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909);
      return ((h ^= h >>> 16) >>> 0) / 4294967296;
    };
  }
  const gauss = (r) => { let u = 0, v = 0; while (!u) u = r(); while (!v) v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };

  const toD = (s) => new Date(s + "T12:00:00");
  const iso = (d) => d.toISOString().slice(0, 10);
  const addDays = (s, n) => { const d = toD(s); d.setDate(d.getDate() + n); return iso(d); };
  const isBiz = (s) => { const w = toD(s).getDay(); return w !== 0 && w !== 6; };
  const nextBiz = (s, n = 1) => { let d = s; let k = 0; while (k < n) { d = addDays(d, 1); if (isBiz(d)) k++; } return d; };
  const prevBiz = (s) => { let d = s; while (!isBiz(d)) d = addDays(d, -1); return d; };
  const lastBizOfMonth = (y, m) => prevBiz(iso(new Date(Date.UTC(y, m + 1, 0, 12))));

  // dias úteis dos últimos ~12 meses até a data-base
  const dias = [];
  { let d = BASE; while (dias.length < 252) { if (isBiz(d)) dias.unshift(d); d = addDays(d, -1); } }

  // preço de referência = média dos preços da amostra
  const somas = {};
  Object.values(D.investidores).forEach((inv) => inv.ativos.forEach(([a, , , , p]) => { (somas[a] = somas[a] || []).push(p); }));
  const precoRef = {}; Object.entries(somas).forEach(([a, arr]) => { precoRef[a] = arr.reduce((x, y) => x + y, 0) / arr.length; });

  const vol = { acao: 0.019, fii: 0.008, etf: 0.012, tesouro: 0.002 };
  const drift = { acao: 0.0004, fii: 0.0002, etf: 0.0004, tesouro: 0.0005 };

  function serie(ticker, fim, tipo) {
    const r = rng("px:" + ticker);
    const out = new Array(dias.length); out[dias.length - 1] = fim;
    for (let i = dias.length - 2; i >= 0; i--) {
      const ret = drift[tipo] + vol[tipo] * gauss(r);
      out[i] = out[i + 1] / (1 + ret);
    }
    return dias.map((d, i) => [d, +out[i].toFixed(2)]);
  }

  const cotacoes = {};
  Object.entries(C.ativos).forEach(([tk, meta]) => {
    const fim = precoRef[tk] || 100;
    const s = serie(tk, fim, meta.tipo);
    const r = rng("vol:" + tk);
    const ultimo = s[s.length - 1][1], ant = s[s.length - 2][1];
    const precos = s.map((x) => x[1]);
    const ini12 = s[0][1];
    const volumeMi = meta.tipo === "tesouro" ? null : +(meta.tipo === "acao" ? (meta.ind.vm || 20) * (0.9 + r() * 1.4) : 8 + r() * 40).toFixed(1);
    cotacoes[tk] = {
      ticker: tk, serie: s, ultimo, anterior: ant, var: (ultimo / ant - 1) * 100,
      max: +(ultimo * (1 + r() * 0.012)).toFixed(2), min: +(ultimo * (1 - r() * 0.012)).toFixed(2),
      abertura: +(ant * (1 + (r() - 0.5) * 0.01)).toFixed(2),
      var12m: (ultimo / ini12 - 1) * 100, max52: Math.max(...precos), min52: Math.min(...precos),
      volumeMi, negocios: volumeMi ? Math.round(volumeMi * (900 + r() * 600)) : null,
    };
  });

  // Histórico longo (até 8 anos), só para o saldo em 24 meses e "desde o começo".
  // Os últimos 252 dias são as mesmas cotações acima; antes disso, o mesmo sorteio continua para trás.
  const diasLongos = [];
  { let d = BASE; while (diasLongos.length < 252 * 8) { if (isBiz(d)) diasLongos.unshift(d); d = addDays(d, -1); } }
  const longas = {};
  function serieLonga(tk) {
    if (longas[tk]) return longas[tk];
    const s = cotacoes[tk].serie, tipo = C.ativos[tk].tipo, r = rng("pxl:" + tk), extra = diasLongos.length - s.length, out = new Array(extra);
    let v = s[0][1];
    for (let i = extra - 1; i >= 0; i--) { v = v / (1 + drift[tipo] + vol[tipo] * gauss(r)); out[i] = [diasLongos[i], +v.toFixed(2)]; }
    return (longas[tk] = out.concat(s));
  }

  // ---------- Índices ----------
  function indice(nome, fim, v, dr) {
    const r = rng("ix:" + nome); const out = new Array(dias.length); out[dias.length - 1] = fim;
    for (let i = dias.length - 2; i >= 0; i--) out[i] = out[i + 1] / (1 + dr + v * gauss(r));
    const s = dias.map((d, i) => [d, +out[i].toFixed(2)]);
    const u = s[s.length - 1][1], a = s[s.length - 2][1];
    return { nome, serie: s, ultimo: u, var: (u / a - 1) * 100, var12m: (u / s[0][1] - 1) * 100 };
  }
  const indices = {
    IBOV: Object.assign(indice("Ibovespa", 158420, 0.011, 0.0004), { codigo: "IBOV", unidade: "pts" }),
    IFIX: Object.assign(indice("IFIX", 3612, 0.005, 0.0002), { codigo: "IFIX", unidade: "pts" }),
    SMLL: Object.assign(indice("Small Cap", 2318, 0.014, 0.0003), { codigo: "SMLL", unidade: "pts" }),
    IDIV: Object.assign(indice("Dividendos", 10870, 0.009, 0.0003), { codigo: "IDIV", unidade: "pts" }),
    USD: Object.assign(indice("Dólar", 5.38, 0.006, 0), { codigo: "USD/BRL", unidade: "R$" }),
  };
  // CDI mensal fictício (% a.m.) para os 12 meses da evolução patrimonial
  const cdiMensal = [1.16, 1.12, 1.15, 1.08, 1.13, 1.1, 1.12, 1.09, 1.11, 1.07, 1.06, 1.05, 0.8];

  // ---------- Proventos de mercado (por ativo) ----------
  const proventosAtivo = {};
  const eventos = [];
  const hoje = BASE;
  Object.entries(C.ativos).forEach(([tk, meta]) => {
    if (meta.tipo !== "acao" && meta.tipo !== "fii") return;
    const r = rng("prov:" + tk);
    const preco = cotacoes[tk].ultimo;
    const dyAnual = (meta.ind.dy || 0) / 100;
    const hist = [];
    if (meta.tipo === "fii") {
      for (let k = 13; k >= -1; k--) {
        const ref = new Date(Date.UTC(2026, 10 - k, 1, 12));
        const dataCom = lastBizOfMonth(ref.getUTCFullYear(), ref.getUTCMonth());
        const valor = +((preco * dyAnual) / 12 * (0.92 + r() * 0.16)).toFixed(2);
        hist.push({ tipo: "Rendimento", dataCom, dataEx: nextBiz(dataCom), pagamento: nextBiz(dataCom, 10), valor });
      }
    } else {
      const meses = meta.freq.startsWith("semestral") ? [3, 9] : meta.freq.startsWith("mensal") ? [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] : [2, 5, 8, 11];
      const porEvento = (preco * dyAnual) / meses.length;
      [2025, 2026].forEach((y) => meses.forEach((m) => {
        const dia = 5 + Math.floor(r() * 18);
        const dataCom = prevBiz(iso(new Date(Date.UTC(y, m, dia, 12))));
        const tipo = r() < 0.4 ? "JCP" : "Dividendo";
        const valor = +(porEvento * (0.7 + r() * 0.6) * (tipo === "JCP" ? 0.85 : 1)).toFixed(4);
        hist.push({ tipo, dataCom, dataEx: nextBiz(dataCom), pagamento: nextBiz(dataCom, 15 + Math.floor(r() * 25)), valor });
      }));
    }
    hist.sort((a, b) => (a.dataCom < b.dataCom ? -1 : 1));
    proventosAtivo[tk] = hist.filter((h) => h.dataCom <= addDays(hoje, 45));
    // eventos de calendário: data-com, data ex e pagamento dos últimos 20 / próximos 75 dias
    proventosAtivo[tk].forEach((h) => {
      const futuro = h.dataCom > hoje;
      const status = futuro ? (r() < 0.55 ? "Confirmado" : "Previsto") : "Confirmado";
      h.status = status;
      [["Data-com", h.dataCom], ["Data ex", h.dataEx], ["Pagamento", h.pagamento]].forEach(([tipoEv, data]) => {
        if (data >= addDays(hoje, -20) && data <= addDays(hoje, 75))
          eventos.push({ data, ticker: tk, categoria: "Provento", tipo: tipoEv, provento: h.tipo, valor: h.valor, status, dataCom: h.dataCom, pagamento: h.pagamento });
      });
    });
    // histórico anual por cota (5 anos) para gráfico de DY
    const anos = [2022, 2023, 2024, 2025, 2026];
    meta.historicoAnual = anos.map((a, i) => ({ ano: a, valor: +((preco * dyAnual) * (0.75 + i * 0.06 + r() * 0.2)).toFixed(2) }));
  });

  // resultados trimestrais e assembleias
  Object.entries(C.ativos).forEach(([tk, meta]) => {
    if (meta.tipo !== "acao") return;
    const r = rng("res:" + tk);
    const data = prevBiz(iso(new Date(Date.UTC(2027, 1, 3 + Math.floor(r() * 45), 12))));
    eventos.push({ data, ticker: tk, categoria: "Resultado", tipo: "Resultado 4T26", status: r() < 0.3 ? "Confirmado" : "Previsto" });
    if (r() < 0.45) {
      const dAg = prevBiz(iso(new Date(Date.UTC(2026, 11, 2 + Math.floor(r() * 20), 12))));
      eventos.push({ data: dAg, ticker: tk, categoria: "Assembleia", tipo: "AGE — voto a distância", status: "Confirmado" });
    }
  });
  eventos.sort((a, b) => (a.data < b.data ? -1 : a.data > b.data ? 1 : a.ticker < b.ticker ? -1 : 1));

  // Ofertas públicas fictícias (genéricas)
  const ofertas = [
    { nome: "Empresa de Energia Exemplo S.A.", tipo: "Debênture incentivada (IPCA+)", periodo: "25/11 a 09/12/2026", status: "Reserva aberta", publico: "Investidores em geral" },
    { nome: "FII Logística Exemplo", tipo: "Oferta subsequente de cotas (follow-on)", periodo: "01/12 a 15/12/2026", status: "Em breve", publico: "Investidores em geral" },
    { nome: "Varejo Exemplo S.A.", tipo: "Oferta inicial de ações (IPO)", periodo: "a definir", status: "Em análise", publico: "Investidores em geral" },
  ];

  return { BASE, ATUALIZACAO, dias, diasLongos, serieLonga, cotacoes, indices, cdiMensal, proventosAtivo, eventos, ofertas, addDays, nextBiz, iso, toD };
})();
