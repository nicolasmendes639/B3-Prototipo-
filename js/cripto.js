/* Cripto (preços ao vivo via CoinGecko, com fallback) + consolidação de TODAS as contas
 * (B3, renda fixa/fundos das corretoras e carteiras cripto) e cálculo de ganho/perda por período.
 */
window.CRIPTO = (function () {
  const U = window.U;
  const MOEDAS = {
    BTC: { id: "bitcoin", nome: "Bitcoin", cor: "#f7931a", tv: "BINANCE:BTCBRL", preco: 357880, ch: { d7: -3.1, d30: -8.4, d180: 4.2, d365: 18.5 } },
    ETH: { id: "ethereum", nome: "Ethereum", cor: "#627eea", tv: "BINANCE:ETHBRL", preco: 10082, ch: { d7: -4.0, d30: -12.1, d180: -6.3, d365: 9.8 } },
    SOL: { id: "solana", nome: "Solana", cor: "#14b8a6", tv: "BINANCE:SOLBRL", preco: 760, ch: { d7: -5.2, d30: -15.0, d180: -10.4, d365: 12.2 } },
  };
  const estado = { aoVivo: false, atualizado: null, series: {} };

  function hash(s) { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0; return Math.abs(h); }

  // Carteira cripto fictícia por investidor (3–8% do patrimônio; menor para perfis de renda fixa)
  function posicoes(id) {
    const inv = window.B3DATA.investidores[id];
    const totalB3 = inv.classes.reduce((a, c) => a + c[4], 0);
    const h = hash(id);
    if (inv.perfilCarteira === "Renda fixa" && h % 3 !== 0) return [];
    const pct = (inv.perfilCarteira === "Renda fixa" ? 0.015 : 0.03) + (h % 50) / 1000;
    const base = totalB3 * pct;
    return [["BTC", 0.6], ["ETH", 0.3], ["SOL", 0.1]].map(([s, w]) => {
      const q = +((base * w) / MOEDAS[s].preco).toFixed(s === "SOL" ? 2 : 5);
      return { sym: s, q, nome: MOEDAS[s].nome, inst: "Exchange cripto A", get preco() { return MOEDAS[s].preco; }, get valor() { return q * MOEDAS[s].preco; } };
    }).filter((p) => p.q > 0);
  }

  async function carregar() {
    try {
      const ids = Object.values(MOEDAS).map((m) => m.id).join(",");
      const r = await fetch(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=brl&ids=${ids}&price_change_percentage=7d,30d,200d,1y`);
      if (!r.ok) throw new Error(r.status);
      const j = await r.json();
      j.forEach((c) => {
        const m = Object.values(MOEDAS).find((x) => x.id === c.id); if (!m) return;
        m.preco = c.current_price;
        m.ch = { d1: c.price_change_percentage_24h, d7: c.price_change_percentage_7d_in_currency, d30: c.price_change_percentage_30d_in_currency, d180: c.price_change_percentage_200d_in_currency, d365: c.price_change_percentage_1y_in_currency };
      });
      estado.aoVivo = true; estado.atualizado = new Date();
      // séries diárias reais (1 ano)
      await Promise.all(Object.entries(MOEDAS).map(async ([s, m]) => {
        try {
          const rr = await fetch(`https://api.coingecko.com/api/v3/coins/${m.id}/market_chart?vs_currency=brl&days=365&interval=daily`);
          if (rr.ok) { const jj = await rr.json(); estado.series[s] = jj.prices.map(([t, p]) => [new Date(t).toISOString().slice(0, 10), p]); }
        } catch (e) { /* mantém série simulada */ }
      }));
      return true;
    } catch (e) { return false; }
  }

  // preço da moeda numa data (série real se houver; senão aproximação pela variação do período)
  function precoEm(sym, dataIso, diasAtras) {
    const s = estado.series[sym];
    if (s && s.length) { let best = s[0][1]; for (const [d, p] of s) { if (d <= dataIso) best = p; else break; } return best; }
    const m = MOEDAS[sym], ch = diasAtras <= 7 ? m.ch.d7 : diasAtras <= 30 ? m.ch.d30 : diasAtras <= 190 ? m.ch.d180 : m.ch.d365;
    const k = Math.min(1, diasAtras / (diasAtras <= 7 ? 7 : diasAtras <= 30 ? 30 : diasAtras <= 190 ? 180 : 365));
    return m.preco / (1 + ((ch || 0) / 100) * k);
  }

  return { MOEDAS, estado, posicoes, carregar, precoEm };
})();

window.CONSOL = (function () {
  const M = window.MERCADO, C = window.CATALOGO, CR = window.CRIPTO;
  // rendimento mensal aproximado de produtos sem cotação diária (para reconstruir a curva)
  const TAXA_MES = { CDB: 0.0105, LCA: 0.0092, LCI: 0.0092, Debenture: 0.0115, "Fundo de investimento": 0.0095 };
  const CORES = { "Renda variavel": "#06377b", "Tesouro Direto": "#0e7c86", "Renda fixa": "#c27c0e", Fundos: "#7a3db8", Cripto: "#f7931a" };
  const ROTULO = { "Renda variavel": "Ações, FIIs e ETFs", "Tesouro Direto": "Tesouro Direto", "Renda fixa": "Renda fixa", Fundos: "Fundos", Cripto: "Cripto" };

  function itens(id) {
    const r = window.CART.resumo(id);
    const out = [];
    r.ativos.forEach((a) => out.push({ tipo: "b3", cod: a.tk, nome: (C.ativos[a.tk] || {}).nome || a.tk, classe: a.classe, sub: a.tipo, valor: a.valor, q: a.q, preco: a.preco }));
    const agg = {};
    r.inv.classes.filter((c) => c[1] === "Renda fixa" || c[1] === "Fundos").forEach((c) => { const k = c[2]; agg[k] = agg[k] || { tipo: "rf", cod: k, nome: k === "Fundo de investimento" ? "Fundos de investimento" : k === "Debenture" ? "Debêntures" : k, classe: c[1], sub: k, valor: 0, inst: new Set() }; agg[k].valor += c[4]; agg[k].inst.add(c[0]); });
    Object.values(agg).forEach((x) => out.push(Object.assign(x, { instTxt: [...x.inst].join(", ") })));
    CR.posicoes(id).forEach((p) => out.push({ tipo: "cripto", cod: p.sym, nome: p.nome, classe: "Cripto", sub: "Cripto", valor: p.valor, q: p.q, preco: p.preco, inst: p.inst }));
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
    const cr = CR.posicoes(id); if (cr.length) out.push({ nome: "Exchange cripto A", valor: cr.reduce((a, p) => a + p.valor, 0), tipo: "Carteira cripto" });
    const tot = out.reduce((a, x) => a + x.valor, 0);
    return out.map((x, i) => Object.assign(x, { pct: (x.valor / tot) * 100, cor: window.CART.PALETA[i % 12] })).sort((a, b) => b.valor - a.valor);
  }

  // Série diária do patrimônio atual nos últimos n dias úteis (variação de mercado, sem aportes)
  function serie(id, n) {
    const its = itens(id), dias = M.dias.slice(-n - 1), L = M.dias.length;
    return dias.map((d, k) => {
      const back = dias.length - 1 - k; // dias úteis atrás
      let v = 0;
      its.forEach((x) => {
        if (x.tipo === "b3") { const s = M.cotacoes[x.cod].serie; v += x.valor * (s[L - 1 - back][1] / s[L - 1][1]); }
        else if (x.tipo === "rf") v += x.valor / Math.pow(1 + (TAXA_MES[x.sub] || 0.01), back / 21);
        else { const dc = Math.round(back * 1.45); v += x.q * CR.precoEm(x.cod, d, dc); }
      });
      return [d, v];
    });
  }

  const PERIODOS = { "7D": 5, "30D": 21, "6M": 126, "12M": 251 };
  function resultado(id, per) {
    const s = serie(id, PERIODOS[per]);
    const ini = s[0][1], fim = s[s.length - 1][1];
    return { serie: s, ini, fim, ganho: fim - ini, pct: ((fim - ini) / ini) * 100 };
  }
  // contribuição de cada item para o resultado do período
  function contribuicao(id, per) {
    const n = PERIODOS[per], L = M.dias.length;
    return itens(id).map((x) => {
      let ini;
      if (x.tipo === "b3") { const s = M.cotacoes[x.cod].serie; ini = x.valor * (s[L - 1 - n][1] / s[L - 1][1]); }
      else if (x.tipo === "rf") ini = x.valor / Math.pow(1 + (TAXA_MES[x.sub] || 0.01), n / 21);
      else ini = x.q * CR.precoEm(x.cod, M.dias[L - 1 - n], Math.round(n * 1.45));
      return Object.assign({}, x, { ganho: x.valor - ini, pctVar: ((x.valor - ini) / ini) * 100 });
    }).sort((a, b) => b.ganho - a.ganho);
  }

  return { itens, porClasse, porInstituicao, serie, resultado, contribuicao, PERIODOS, CORES, ROTULO };
})();
