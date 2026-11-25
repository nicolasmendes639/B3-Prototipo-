/* Proventos detalhados do investidor (aba Proventos → Resumo), no estilo de um extrato:
 * cada lançamento tem ativo, categoria, segmento, corretora, tipo, quantidade, valor por cota, total bruto e líquido,
 * data-com e pagamento.
 * - Últimos 12 meses e anunciados: vêm da carteira (CART.resumo().prov), valores líquidos.
 * - Antes disso, até "desde o começo" (CONSOL.inicio): histórico simulado a partir do provento anual por cota
 *   de cada ativo (historicoAnual), com a quantidade crescendo aos poucos até a atual.
 * - Data-com futura: eventos já anunciados (MERCADO.proventosAtivo) com data-com depois da data-base.
 * JCP tem 15% de IR retido na fonte (total líquido = 85% do bruto); dividendos e rendimentos de FII são isentos.
 */
window.PROV = (function () {
  const M = window.MERCADO, C = window.CATALOGO, U = window.U;
  const IR_JCP = 0.15;
  const CATEG = { acao: "Ações", fii: "FIIs", etf: "ETFs" };
  const CORES_CAT = { "Ações": "#06377b", FIIs: "#0e7c86", ETFs: "#7a3db8" };
  const MES_PAG = { semestral: [3, 9], mensal: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], trimestral: [2, 5, 8, 11] };

  function hash(s) { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) | 0; return Math.abs(h); }
  const dias = (a, b) => (M.toD(b) - M.toD(a)) / 864e5;
  const iso = (y, m, d) => M.iso(new Date(Date.UTC(y, m, d, 12)));
  const util = (s) => { let d = s; while ([0, 6].includes(M.toD(d).getDay())) d = M.addDays(d, 1); return d; };
  const rotuloTipo = (t) => U.rotuloProv(t);

  const categoria = (tk) => CATEG[(C.ativos[tk] || {}).tipo] || "Outros";
  function segmento(tk) {
    const m = C.ativos[tk] || {};
    return m.tipo === "fii" ? ((m.ind && m.ind.segmento) || m.setor || "FII").split(" — ")[0] : m.setor || "Outros";
  }

  // corretora de cada ativo: uma das instituições em que o investidor tem renda variável (estável por ativo)
  function corretoras(r) {
    const rv = [...new Set(r.inv.classes.filter((c) => c[1] === "Renda variavel").map((c) => c[0]))];
    return rv.length ? rv : r.porInst.map((i) => i.nome);
  }

  // evento do ativo (MERCADO.proventosAtivo) com pagamento mais perto da data
  function eventoPerto(tk, data) {
    const evs = M.proventosAtivo[tk] || [];
    let melhor = null;
    evs.forEach((e) => { const d = Math.abs(dias(e.pagamento, data)); if (!melhor || d < melhor.d) melhor = { e, d }; });
    return melhor && melhor.d <= 40 ? melhor.e : null;
  }

  // provento anual por cota no ano (antes de 2022, recua 8% ao ano)
  function anualPorCota(meta, y) {
    const h = meta.historicoAnual || [];
    if (!h.length) return 0;
    const ex = h.find((x) => x.ano === y);
    return ex ? ex.valor : y < h[0].ano ? h[0].valor * Math.pow(0.92, h[0].ano - y) : h[h.length - 1].valor;
  }

  const cache = {};
  function lancamentos(id) {
    if (cache[id]) return cache[id];
    const r = window.CART.resumo(id), held = Object.fromEntries(r.ativos.map((a) => [a.tk, a]));
    const insts = corretoras(r), out = [];
    const add = (o) => {
      const tipo = rotuloTipo(o.tipo), jcp = tipo === "JCP";
      const liq = o.liq !== undefined ? o.liq : o.bruto * (jcp ? 1 - IR_JCP : 1);
      const bruto = o.bruto !== undefined ? o.bruto : liq / (jcp ? 1 - IR_JCP : 1);
      out.push(Object.assign(o, { tipo, liq, bruto, valor: o.q ? bruto / o.q : 0, categoria: categoria(o.tk), segmento: segmento(o.tk), corretora: insts[hash(id + o.tk) % insts.length] }));
    };

    // 1) últimos 12 meses e anunciados (dados da carteira)
    r.prov.forEach((p) => {
      const ev = eventoPerto(p.tk, p.data), a = held[p.tk];
      const jcp = rotuloTipo(p.tp) === "JCP", bruto = p.valor / (jcp ? 1 - IR_JCP : 1);
      const q = a ? a.q : ev ? Math.max(1, Math.round(bruto / ev.valor)) : 1;
      let dataCom = ev ? ev.dataCom : M.addDays(p.data, -21);
      if (!p.recebido && dataCom > M.BASE) dataCom = M.BASE;
      add({ tk: p.tk, tipo: p.tp, q, liq: p.valor, dataCom, pagamento: p.data, status: p.recebido ? "pago" : "provisionado" });
    });

    // 2) histórico anterior, desde o começo até 12 meses atrás.
    // Calibrado pelo que o ativo pagou de fato nos últimos 12 meses (ativo que não pagou nada não ganha histórico).
    const inicio = window.CONSOL.inicio(id).data, limite = M.addDays(M.BASE, -365);
    const pago12 = {}; out.filter((l) => l.status === "pago").forEach((l) => (pago12[l.tk] = (pago12[l.tk] || 0) + l.bruto));
    r.ativos.forEach((a) => {
      const meta = C.ativos[a.tk];
      if (!meta || (meta.tipo !== "acao" && meta.tipo !== "fii") || !(meta.historicoAnual || []).length || !pago12[a.tk]) return;
      const escala = pago12[a.tk] / (anualPorCota(meta, +M.BASE.slice(0, 4)) * a.q);
      const meses = meta.tipo === "fii" ? MES_PAG.mensal : MES_PAG[Object.keys(MES_PAG).find((k) => (meta.freq || "").startsWith(k))] || MES_PAG.trimestral;
      // começou com parte da posição em uma data própria e foi comprando até chegar à quantidade atual
      const entrada = M.addDays(inicio, hash(id + a.tk) % 400), tot = dias(entrada, limite);
      for (let y = +inicio.slice(0, 4); y <= +limite.slice(0, 4); y++) {
        const porEvento = (anualPorCota(meta, y) * escala) / meses.length;
        meses.forEach((m) => {
          const pagamento = util(iso(y, m, 8 + (hash(a.tk + y + m) % 18)));
          if (pagamento < entrada || pagamento >= limite) return;
          const frac = tot > 0 ? dias(entrada, pagamento) / tot : 1;
          const q = Math.max(1, Math.round(a.q * (0.3 + 0.7 * frac)));
          const tipo = meta.tipo === "fii" ? "Rendimento" : hash(a.tk + y + m) % 3 === 0 ? "JCP" : "Dividendo";
          add({ tk: a.tk, tipo, q, bruto: porEvento * (0.9 + (hash(a.tk + m + y) % 20) / 100) * q, dataCom: util(M.addDays(pagamento, -20)), pagamento, status: "pago", simulado: true });
        });
      }
    });

    // 3) data-com futura: terá direito se ainda tiver o ativo na data-com
    r.ativos.forEach((a) => (M.proventosAtivo[a.tk] || []).filter((e) => e.dataCom > M.BASE).forEach((e) => {
      add({ tk: a.tk, tipo: e.tipo, q: a.q, bruto: e.valor * a.q, dataCom: e.dataCom, pagamento: e.pagamento, status: "futura" });
    }));

    out.sort((x, z) => (x.pagamento < z.pagamento ? 1 : x.pagamento > z.pagamento ? -1 : x.tk.localeCompare(z.tk)));
    return (cache[id] = out);
  }

  // soma líquida dos pagos nos últimos n meses (n = null: desde o começo)
  function recebido(id, n) {
    const de = n ? M.addDays(M.BASE, -Math.round(n * 30.44)) : "0000";
    return lancamentos(id).filter((l) => l.status === "pago" && l.pagamento > de && l.pagamento <= M.BASE).reduce((s, l) => s + l.liq, 0);
  }

  return { lancamentos, recebido, categoria, segmento, CORES_CAT, IR_JCP };
})();
