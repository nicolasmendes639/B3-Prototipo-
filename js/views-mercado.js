/* Telas de mercado: Mercado hoje, ficha do ativo, calendário, acompanhamento, comparar, ofertas, assembleias. */
(function (V) {
  const U = window.U, C = window.CATALOGO, M = window.MERCADO, CH = window.CH, D = window.B3DATA;
  const linkAtivo = (tk) => V._linkAtivo(tk);
  const stamp = () => `<span class="stamp">Fechamento de ${U.data(M.BASE)} às 18:05 · atraso de 15 min · dados simulados</span>`;
  const RV = Object.keys(C.ativos).filter((t) => C.ativos[t].tipo !== "tesouro");
  const fmtPx = (v, eixo) => (eixo ? U.num(v, v >= 1000 ? 0 : 2) : "R$ " + U.num(v, 2));
  const fmtX = (d, l) => (l ? U.data(d) : U.dataCurta(d));
  const watchKey = (id) => "watch:" + id;
  const getWatch = (id) => U.store.get(watchKey(id), []);
  const setWatch = (id, w) => U.store.set(watchKey(id), w);

  // =============== MERCADO HOJE ===============
  V.destaques = {
    html() {
      return `<div class="page-head"><div><h2>Destaques do dia (simulado)</h2><p>${stamp()}</p></div></div>
      <div class="ix-strip">${Object.values(M.indices).map((i) => `<div class="ix"><span class="n">${i.codigo} · ${i.nome}</span><span class="v">${i.unidade === "R$" ? "R$ " + U.num(i.ultimo, 2) : U.num(i.ultimo, 0)}</span>${U.sinal(i.var)}${CH.spark(i.serie.slice(-40).map((x) => x[1]), i.var >= 0 ? "#137a43" : "#b3261e", 120, 26)}</div>`).join("")}</div>
      <div class="card section"><div class="card-h"><div><h2>Ibovespa</h2><div class="sub">Pontos · últimos 12 meses · ${U.sinal(M.indices.IBOV.var12m)} no período</div></div></div><div class="chart" id="chIbov"></div></div>
      <div class="section"><div class="page-head" style="margin-bottom:12px"><h2>Destaques do dia ${U.info("Universo: os " + RV.length + " ativos de renda variável desta amostra (ações, FIIs e ETFs). Em produção, o ranking usaria todos os ativos negociados no dia, com filtro mínimo de liquidez para evitar distorções.", "Quais ativos entram")}</h2>
        <div class="seg" role="group" aria-label="Filtrar por tipo">${[["", "Todos"], ["acao", "Ações"], ["fii", "FIIs"], ["etf", "ETFs"]].map(([v, t], i) => `<button data-ft="${v}" aria-pressed="${i === 0}">${t}</button>`).join("")}</div></div>
        <div class="grid g3" id="rankings"></div></div>`;
    },
    after() {
      CH.linha(document.getElementById("chIbov"), { series: [{ nome: "Ibovespa", cor: "#06377b", pontos: M.indices.IBOV.serie }], area: true, fmtY: (v, e) => (e ? U.num(v / 1000, 0) + " mil" : U.num(v, 0) + " pts"), fmtX, label: "Ibovespa 12 meses" });
      const draw = (ft) => {
        const base = RV.filter((t) => !ft || C.ativos[t].tipo === ft).map((t) => M.cotacoes[t]);
        const bloco = (titulo, arr, col) => `<div class="card"><div class="card-h"><h2>${titulo}</h2></div>${arr.map((c, i) => `<div class="list-item"><span class="muted small" style="width:14px">${i + 1}</span><div class="grow"><div>${linkAtivo(c.ticker)}</div><div class="s">${U.esc(C.ativos[c.ticker].nome)}</div></div><div style="text-align:right"><div class="num">R$ ${U.num(c.ultimo, 2)}</div>${col(c)}</div></div>`).join("")}</div>`;
        document.getElementById("rankings").innerHTML =
          bloco("Maiores altas", base.slice().sort((a, b) => b.var - a.var).slice(0, 5), (c) => U.sinal(c.var)) +
          bloco("Maiores baixas", base.slice().sort((a, b) => a.var - b.var).slice(0, 5), (c) => U.sinal(c.var)) +
          bloco("Mais negociadas", base.slice().sort((a, b) => b.volumeMi - a.volumeMi).slice(0, 5), (c) => `<div class="small muted">R$ ${U.num(c.volumeMi, 1)} mi</div>`);
      };
      document.querySelectorAll("[data-ft]").forEach((b) => b.addEventListener("click", () => { document.querySelectorAll("[data-ft]").forEach((x) => x.setAttribute("aria-pressed", String(x === b))); draw(b.dataset.ft); }));
      draw("");
    },
  };

  // =============== FICHA DO ATIVO ===============
  const explica = {
    pl: "Preço/Lucro: quantos anos de lucro atual seriam necessários para pagar o preço da ação. Compare com empresas do mesmo setor.",
    pvp: "Preço/Valor patrimonial: quanto o mercado paga por cada R$ 1 de patrimônio líquido. Abaixo de 1 = negociado abaixo do valor contábil.",
    dy: "Dividend yield: proventos pagos nos últimos 12 meses ÷ preço atual. Resultado passado não garante pagamentos futuros.",
    roe: "Retorno sobre o patrimônio: lucro líquido ÷ patrimônio líquido. Mede a rentabilidade do capital dos acionistas.",
    margem: "Margem líquida: lucro líquido ÷ receita líquida.",
    divEbitda: "Dívida líquida ÷ EBITDA: em quantos anos a geração de caixa operacional pagaria a dívida. Negativo = caixa líquido.",
    vm: "Valor de mercado: preço × total de ações emitidas.",
    vacancia: "Vacância física: % da área do fundo que está desocupada.",
    taxa: "Taxa de administração anual cobrada pelo ETF, já descontada do valor da cota.",
  };
  function indicadores(tk, meta, cot) {
    const i = meta.ind, cel = (l, v, k) => `<div class="ind"><div class="l">${l}${k && explica[k] ? U.info(explica[k], l) : ""}</div><div class="v">${v}</div></div>`;
    if (meta.tipo === "acao") return cel("P/L", U.num(i.pl, 1), "pl") + cel("P/VP", U.num(i.pvp, 2), "pvp") + cel("Dividend yield", U.num(i.dy, 1) + "%", "dy") + cel("ROE", U.num(i.roe, 1) + "%", "roe") + cel("Margem líquida", i.margem === null ? "—" : U.num(i.margem, 1) + "%", "margem") + cel("Dív. líq./EBITDA", i.divEbitda === null ? "n/a (banco)" : U.num(i.divEbitda, 1), "divEbitda") + cel("Valor de mercado", "R$ " + U.num(i.vm, 0) + " bi", "vm") + cel("Min/Máx 52 sem.", `${U.num(cot.min52, 2)} / ${U.num(cot.max52, 2)}`);
    if (meta.tipo === "fii") return cel("Segmento", `<span style="font-size:13px">${i.segmento}</span>`) + cel("P/VP", U.num(i.pvp, 2), "pvp") + cel("Dividend yield", U.num(i.dy, 1) + "%", "dy") + cel("Vacância", i.vacancia === null ? "n/a (papel)" : U.num(i.vacancia, 1) + "%", "vacancia") + cel("Patrimônio do fundo", "R$ " + U.num(i.pl_fundo, 1) + " bi") + cel("Cotistas", U.num(i.cotistas, 0) + " mil") + cel("Pagamentos", meta.freq) + cel("Min/Máx 52 sem.", `${U.num(cot.min52, 2)} / ${U.num(cot.max52, 2)}`);
    if (meta.tipo === "etf") return cel("Índice de referência", `<span style="font-size:13px">${i.indice}</span>`) + cel("Taxa de administração", U.num(i.taxa, 2) + "% a.a.", "taxa") + cel("Patrimônio", "R$ " + U.num(i.pl_fundo, 1) + " bi") + cel("Distribuição", "Reinveste") + cel("Variação 12m", U.sinal(cot.var12m)) + cel("Min/Máx 52 sem.", `${U.num(cot.min52, 2)} / ${U.num(cot.max52, 2)}`) + cel("Volume médio", "R$ " + U.num(cot.volumeMi, 1) + " mi") + cel("Negócios/dia", U.num(cot.negocios, 0));
    return cel("Indexador", i.indexador) + cel("Taxa de referência", i.taxa) + cel("Vencimento", U.data(i.vencimento)) + cel("Preço unitário", "R$ " + U.num(cot.ultimo, 2));
  }
  V.ativo = {
    html({ params, r, id }) {
      const tk = params[0], meta = C.ativos[tk], cot = M.cotacoes[tk];
      if (!meta) return `<div class="empty"><div class="big">🔎</div><h2>Ativo “${U.esc(tk)}” não encontrado</h2><p>Este protótipo cobre os ${Object.keys(C.ativos).length} ativos da amostra. Tente PETR4, VALE3, HGLG11, BOVA11…</p></div>`;
      const pos = r.ativos.find((a) => a.tk === tk);
      const w = getWatch(id).includes(tk);
      const provs = M.proventosAtivo[tk] || [];
      const prox = provs.filter((p) => p.dataCom >= M.BASE);
      const tipoNome = { acao: "Ação", fii: "Fundo imobiliário", etf: "ETF", tesouro: "Tesouro Direto" }[meta.tipo];
      const tema = { acao: "acoes", fii: "fii", etf: "etf", tesouro: "tesouro" }[meta.tipo];
      const pf = window.FEED.perfilDe(id);
      const cont = C.conteudos.filter((c) => c.temas.includes(tema)).sort((a, b) => (b.perfis.includes(pf.perfil) ? 1 : 0) - (a.perfis.includes(pf.perfil) ? 1 : 0)).slice(0, 3);
      const meusProv = r.prov.filter((p) => p.tk === tk);
      return `<div class="crumb"><a href="#/mercado">Mercado</a> › ${U.esc(tipoNome)} › ${U.esc(tk)}</div>
      <div class="card"><div class="asset-head">
        <div><div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap"><span class="tkr">${U.esc(tk)}</span><span class="chip blue">${tipoNome}</span>${pos ? '<span class="chip ok">Na sua carteira</span>' : ""}</div>
          <div style="font-size:15px;font-weight:600;margin-top:2px">${U.esc(meta.nome)}</div><div class="muted small">${U.esc(meta.empresa || "")}${meta.empresa ? " · " : ""}${U.esc(meta.setor)}</div>
          <div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap"><button class="star" id="watchBtn" aria-pressed="${w}">${w ? "★ Acompanhando" : "☆ Acompanhar"}</button><a class="btn" href="#/comparar/${U.slug(tk)}">Comparar</a>${meta.tipo === "tesouro" ? `<a class="btn" href="${C.esferas.tesouro.url}" target="_blank" rel="noopener">Tesouro Direto ↗</a>` : '<a class="btn" href="https://www.b3.com.br/pt_br/produtos-e-servicos/negociacao/renda-variavel/empresas-listadas.htm" target="_blank" rel="noopener">Documentos oficiais ↗</a>'}</div></div>
        <div><div class="price">R$ ${U.num(cot.ultimo, 2)}</div><div style="text-align:right">${U.sinal(cot.var)} <span class="muted small">hoje</span></div><div class="small muted" style="text-align:right;margin-top:4px">Abertura ${U.num(cot.abertura, 2)} · Mín ${U.num(cot.min, 2)} · Máx ${U.num(cot.max, 2)}</div><div style="text-align:right;margin-top:6px">${stamp()}</div></div>
      </div></div>
      ${pos ? `<div class="alert info-a section"><span class="ic">📌</span><div><b>Você tem ${U.qtd(pos.q)} ${meta.tipo === "tesouro" ? "títulos" : meta.tipo === "fii" || meta.tipo === "etf" ? "cotas" : "ações"} · ${U.brl(pos.valor)}</b><p>${U.num(pos.pct, 1)}% do seu patrimônio na B3${meusProv.length ? ` · ${U.brl(meusProv.filter((p) => p.recebido).reduce((a, p) => a + p.valor, 0))} recebidos em proventos (12m)` : ""}. Isto é a sua posição — acompanhar é separado.</p></div></div>` : ""}
      ${meta.tipo !== "tesouro" ? `<section class="card section"><div class="card-h"><div><h2>Gráfico ao vivo</h2><div class="sub">Cotação real de mercado via TradingView — sua posição acima usa os dados de teste</div></div><span class="real-badge">ao vivo</span></div><div class="tv-box" id="tvAtivo" data-sym="BMFBOVESPA:${tk}"></div></section>` : ""}
      <div class="grid g-main section">
        <div class="card"><div class="card-h"><h2>Histórico simulado</h2><div class="seg" role="group" aria-label="Período">${[["21", "1M"], ["126", "6M"], ["252", "12M"]].map(([n, t]) => `<button data-per="${n}" aria-pressed="${n === "252"}">${t}</button>`).join("")}</div></div><div class="chart" id="chAtivo"></div>
          <div class="card-f">Fonte: B3 market data (simulado) · preço de fechamento ajustado · ${U.sinal(cot.var12m)} em 12 meses</div></div>
        <div class="card"><div class="card-h"><h2>Próximo provento</h2></div>
          ${prox.length ? prox.slice(0, 1).map((p) => `<div class="stack"><div><span class="chip ${p.status === "Confirmado" ? "ok" : "warn"}">${p.status}</span> <b>${p.tipo}</b> · R$ ${U.num(p.valor, p.valor < 1 ? 4 : 2)} por ${meta.tipo === "fii" ? "cota" : "ação"}</div>
            <div class="list-item"><div class="date-box"><b>${p.dataCom.slice(8)}</b><span>${U.MESES[+p.dataCom.slice(5, 7) - 1]}</span></div><div class="grow"><div class="t">Data-com</div><div class="s">Último dia para comprar e ter direito</div></div></div>
            <div class="list-item"><div class="date-box"><b>${p.dataEx.slice(8)}</b><span>${U.MESES[+p.dataEx.slice(5, 7) - 1]}</span></div><div class="grow"><div class="t">Data ex</div><div class="s">Negocia sem direito ao provento</div></div></div>
            <div class="list-item"><div class="date-box"><b>${p.pagamento.slice(8)}</b><span>${U.MESES[+p.pagamento.slice(5, 7) - 1]}</span></div><div class="grow"><div class="t">Pagamento</div><div class="s">${p.status === "Previsto" ? "Data estimada pelo histórico" : "Data confirmada pela empresa"}</div></div></div></div>`).join("")
            : `<div class="muted">${meta.tipo === "etf" || meta.tipo === "tesouro" ? "Este ativo não distribui proventos." : "Nenhum provento anunciado no momento."}</div>`}
        </div>
      </div>
      <div class="card section"><div class="card-h"><div><h2>Indicadores</h2><div class="sub">Clique em “i” para entender cada indicador · dados ilustrativos</div></div></div><div class="ind-grid">${indicadores(tk, meta, cot)}</div></div>
      ${provs.length ? `<div class="grid g2 section"><div class="card"><div class="card-h"><div><h2>Proventos por ano</h2><div class="sub">R$ por ${meta.tipo === "fii" ? "cota" : "ação"}</div></div></div><div class="chart" id="chAnual"></div></div>
        <div class="card"><div class="card-h"><h2>Histórico de proventos</h2></div><div class="tbl-wrap" style="max-height:280px;overflow-y:auto"><table><thead><tr><th>Tipo</th><th>Data-com</th><th>Pagamento</th><th class="num">Valor</th></tr></thead><tbody>${provs.slice().reverse().map((p) => `<tr><td>${p.tipo}</td><td>${U.data(p.dataCom)}</td><td>${U.data(p.pagamento)}</td><td class="num">R$ ${U.num(p.valor, p.valor < 1 ? 4 : 2)}</td></tr>`).join("")}</tbody></table></div></div></div>` : ""}
      <div class="section"><h2 style="margin-bottom:12px">Aprenda sobre ${tipoNome.toLowerCase()}s com a B3</h2><div class="grid g3">${cont.map((c) => V._feedCard(Object.assign({}, c, { motivos: ["Relacionado a " + tk], externo: c.url.startsWith("http"), cta: "Abrir" }), true)).join("")}</div></div>`;
    },
    after({ params, id }) {
      const tk = params[0], meta = C.ativos[tk]; if (!meta) return;
      const cot = M.cotacoes[tk];
      const draw = (n) => CH.linha(document.getElementById("chAtivo"), { series: [{ nome: tk, cor: cot.var12m >= 0 ? "#137a43" : "#b3261e", pontos: cot.serie.slice(-n) }], area: true, fmtY: fmtPx, fmtX, label: "Cotação de " + tk });
      draw(252);
      document.querySelectorAll("[data-per]").forEach((b) => b.addEventListener("click", () => { document.querySelectorAll("[data-per]").forEach((x) => x.setAttribute("aria-pressed", String(x === b))); draw(+b.dataset.per); }));
      const an = document.getElementById("chAnual");
      if (an && meta.historicoAnual) CH.barras(an, meta.historicoAnual.map((h) => ({ rotulo: String(h.ano) + (h.ano === 2026 ? "*" : ""), valores: [h.valor] })), [{ nome: "Proventos", cor: "#0e7c86" }], { fmtY: (v) => "R$ " + U.num(v, 2), altura: 220 });
      document.getElementById("watchBtn").addEventListener("click", (e) => {
        const w = getWatch(id), on = !w.includes(tk);
        setWatch(id, on ? w.concat(tk) : w.filter((x) => x !== tk));
        e.currentTarget.setAttribute("aria-pressed", String(on)); e.currentTarget.textContent = on ? "★ Acompanhando" : "☆ Acompanhar";
        U.toast(on ? `${tk} adicionado à lista de acompanhamento` : `${tk} removido da lista`);
      });
      V._bindFeed();
    },
  };

  // =============== CALENDÁRIO ===============
  V.calendario = {
    html({ r }) {
      return `<div class="page-head"><div><div class="crumb">Mercado</div><h1>Calendário de eventos</h1><p>Proventos, resultados e assembleias — previsto e confirmado sempre identificados</p></div></div>
      <div class="grid g3" style="margin-bottom:16px">
        <div class="card"><h3>Data-com</h3><p class="small muted" style="margin:4px 0 0">Último dia para ter o ativo e garantir o provento.</p></div>
        <div class="card"><h3>Data ex</h3><p class="small muted" style="margin:4px 0 0">A partir daqui, quem compra não recebe esse provento.</p></div>
        <div class="card"><h3>Pagamento</h3><p class="small muted" style="margin:4px 0 0">Dia em que o valor cai na conta da corretora.</p></div>
      </div>
      <div class="card"><div class="filters">
        <label>Período<select id="cPer"><option value="30">Próximos 30 dias</option><option value="75">Próximos 75 dias</option><option value="-20">Últimos 20 dias</option></select></label>
        <label>Evento<select id="cTipo"><option value="">Todos</option><option>Data-com</option><option>Data ex</option><option>Pagamento</option><option value="Resultado">Resultados</option><option value="Assembleia">Assembleias</option></select></label>
        <label>Empresa / ativo<select id="cAtivo"><option value="">Todos</option>${RV.filter((t) => C.ativos[t].tipo !== "etf").map((t) => `<option>${t}</option>`).join("")}</select></label>
        <label style="flex-direction:row;align-items:center;gap:6px;margin-top:18px;color:var(--ink)"><input type="checkbox" id="cMeus" style="min-width:0;height:auto"> Só meus ativos</label>
        <label style="flex-direction:row;align-items:center;gap:6px;margin-top:18px;color:var(--ink)"><input type="checkbox" id="cWatch" style="min-width:0;height:auto"> Só acompanhados</label>
      </div><div id="calList"></div></div>`;
    },
    after({ r, id }) {
      const held = new Set(r.ativos.map((a) => a.tk));
      const draw = () => {
        const per = +document.getElementById("cPer").value, tipo = document.getElementById("cTipo").value, at = document.getElementById("cAtivo").value;
        const meus = document.getElementById("cMeus").checked, wl = document.getElementById("cWatch").checked, w = new Set(getWatch(id));
        const ini = per > 0 ? M.BASE : M.addDays(M.BASE, per), fim = per > 0 ? M.addDays(M.BASE, per) : M.addDays(M.BASE, -1);
        const evs = M.eventos.filter((e) => e.data >= ini && e.data <= fim && (!tipo || e.tipo === tipo || e.categoria === tipo) && (!at || e.ticker === at) && (!meus || held.has(e.ticker)) && (!wl || w.has(e.ticker)));
        const grupos = {}; evs.forEach((e) => (grupos[e.data] = grupos[e.data] || []).push(e));
        const el = document.getElementById("calList");
        el.innerHTML = evs.length ? Object.entries(grupos).map(([d, list]) => `<div style="margin-bottom:6px"><div class="small" style="font-weight:700;color:var(--ink-2);padding:10px 0 4px;border-bottom:2px solid var(--line)">${["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"][M.toD(d).getDay()]}, ${U.data(d)}</div>
          ${list.map((e) => `<div class="list-item"><div style="width:80px">${linkAtivo(e.ticker)}</div><div class="grow"><div class="t">${e.tipo}${e.provento ? ` · ${e.provento}` : ""}</div><div class="s">${e.valor ? `R$ ${U.num(e.valor, e.valor < 1 ? 4 : 2)} por ${e.ticker.endsWith("11") && C.ativos[e.ticker].tipo === "fii" ? "cota" : "ação"} · pagamento ${U.data(e.pagamento)}` : C.ativos[e.ticker].nome}</div></div>${held.has(e.ticker) ? '<span class="chip blue">Você tem</span>' : ""}<span class="chip ${e.status === "Confirmado" ? "ok" : "warn"}">${e.status}</span></div>`).join("")}</div>`).join("")
          : `<div class="empty"><div class="big">🗓️</div>Nenhum evento com esses filtros.${wl && !w.size ? ' Sua lista de acompanhamento está vazia — <a href="#/acompanhamento">adicione ativos</a>.' : ""}</div>`;
      };
      ["cPer", "cTipo", "cAtivo", "cMeus", "cWatch"].forEach((i) => document.getElementById(i).addEventListener("change", draw));
      draw();
    },
  };

  // =============== ACOMPANHAMENTO ===============
  V.acompanhamento = {
    html({ id, r }) {
      const w = getWatch(id), alertas = U.store.get("alertas:" + id, {});
      const sugest = r.ativos.filter((a) => M.cotacoes[a.tk] && C.ativos[a.tk].tipo !== "tesouro" && !w.includes(a.tk)).slice(0, 3).map((a) => a.tk).concat(["PETR4", "VALE3", "HGLG11", "IVVB11"].filter((t) => !w.includes(t))).filter((v, i, s) => s.indexOf(v) === i).slice(0, 5);
      const disparados = w.filter((tk) => { const a = alertas[tk], c = M.cotacoes[tk]; return a && ((a.acima && c.ultimo >= a.acima) || (a.abaixo && c.ultimo <= a.abaixo)); });
      return `<div class="page-head"><div><div class="crumb">Mercado</div><h1>Lista de acompanhamento</h1><p>Ativos que você quer acompanhar — separados dos que você tem</p></div>
        <div style="display:flex;gap:8px;align-items:flex-end"><label class="small muted" style="display:flex;flex-direction:column;gap:4px">Adicionar ativo<select class="sel" id="addW"><option value="">Escolha…</option>${Object.keys(C.ativos).filter((t) => !w.includes(t)).map((t) => `<option>${t}</option>`).join("")}</select></label></div></div>
      ${disparados.length ? `<div class="alert info-a" style="margin-bottom:16px"><span class="ic">🔔</span><div><b>${disparados.length} alerta(s) atingido(s)</b><p>${disparados.map((t) => `${t} está em R$ ${U.num(M.cotacoes[t].ultimo, 2)}`).join(" · ")}</p></div></div>` : ""}
      <div class="card">${w.length ? `<div class="tbl-wrap"><table><thead><tr><th>Ativo</th><th class="num">Preço</th><th class="num">Dia</th><th class="num">12 meses</th><th class="num">DY</th><th>Próximo evento</th><th>Alerta de preço</th><th>Avisar data-com</th><th></th></tr></thead><tbody>
        ${w.map((tk) => { const c = M.cotacoes[tk], m = C.ativos[tk], a = alertas[tk] || {}, ev = M.eventos.find((e) => e.ticker === tk && e.data >= M.BASE);
          return `<tr><td><div class="asset">${linkAtivo(tk)}<small>${U.esc(m.nome)}</small></div>${r.ativos.some((x) => x.tk === tk) ? '<span class="chip blue" style="margin-top:4px">Você tem</span>' : ""}</td><td class="num">R$ ${U.num(c.ultimo, 2)}</td><td class="num">${U.sinal(c.var)}</td><td class="num">${U.sinal(c.var12m)}</td><td class="num">${m.ind.dy ? U.num(m.ind.dy, 1) + "%" : "—"}</td>
          <td class="small">${ev ? `${ev.tipo} · ${U.data(ev.data)}` : '<span class="muted">—</span>'}</td>
          <td><div style="display:flex;gap:4px"><input aria-label="Avisar se ${tk} ficar acima de" data-al="acima" data-tk="${tk}" type="number" step="0.01" placeholder="acima de" value="${a.acima || ""}" style="width:86px;height:30px;border:1px solid var(--line);border-radius:6px;padding:0 6px"><input aria-label="Avisar se ${tk} ficar abaixo de" data-al="abaixo" data-tk="${tk}" type="number" step="0.01" placeholder="abaixo de" value="${a.abaixo || ""}" style="width:86px;height:30px;border:1px solid var(--line);border-radius:6px;padding:0 6px"></div></td>
          <td><input type="checkbox" data-al="datacom" data-tk="${tk}" ${a.datacom ? "checked" : ""} aria-label="Avisar data-com de ${tk}"></td>
          <td><button class="btn sm ghost" data-rm="${tk}" aria-label="Remover ${tk}">✕</button></td></tr>`; }).join("")}
        </tbody></table></div><div class="card-f">Alertas são opcionais e desligados por padrão. Não enviamos alertas de oscilação diária automaticamente.</div>`
        : `<div class="empty"><div class="big">👀</div><h3>Sua lista está vazia</h3><p>Acompanhe ativos sem precisar tê-los na carteira. Sugestões rápidas:</p><div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap">${sugest.map((t) => `<button class="btn sm" data-add="${t}">+ ${t}</button>`).join("")}</div></div>`}</div>`;
    },
    after({ id, rerender }) {
      const add = (tk) => { if (!tk) return; const w = getWatch(id); if (!w.includes(tk)) setWatch(id, w.concat(tk)); U.toast(`${tk} adicionado`); rerender(); };
      document.getElementById("addW").addEventListener("change", (e) => add(e.target.value));
      document.querySelectorAll("[data-add]").forEach((b) => b.addEventListener("click", () => add(b.dataset.add)));
      document.querySelectorAll("[data-rm]").forEach((b) => b.addEventListener("click", () => { setWatch(id, getWatch(id).filter((x) => x !== b.dataset.rm)); rerender(); }));
      document.querySelectorAll("[data-al]").forEach((inp) => inp.addEventListener("change", () => {
        const al = U.store.get("alertas:" + id, {}), tk = inp.dataset.tk; al[tk] = al[tk] || {};
        al[tk][inp.dataset.al] = inp.type === "checkbox" ? inp.checked : inp.value ? +inp.value : null;
        U.store.set("alertas:" + id, al); U.toast("Alerta salvo");
      }));
    },
  };

  // =============== COMPARAR ===============
  V.comparar = {
    html({ params, r }) {
      const sel = (params[0] ? params[0].split(",") : r.ativos.filter((a) => C.ativos[a.tk].tipo !== "tesouro").slice(0, 2).map((a) => a.tk).concat(["PETR4", "VALE3"])).filter((t, i, s) => C.ativos[t] && s.indexOf(t) === i).slice(0, 4);
      const linhas = [["Tipo", (m) => ({ acao: "Ação", fii: "FII", etf: "ETF", tesouro: "Tesouro" }[m.tipo])], ["Setor", (m) => m.setor], ["Preço", (m, c) => "R$ " + U.num(c.ultimo, 2)], ["Variação 12m", (m, c) => U.sinal(c.var12m)], ["Dividend yield", (m) => (m.ind.dy ? U.num(m.ind.dy, 1) + "%" : "—")], ["P/VP", (m) => (m.ind.pvp ? U.num(m.ind.pvp, 2) : "—")], ["P/L", (m) => (m.ind.pl ? U.num(m.ind.pl, 1) : "—")], ["ROE", (m) => (m.ind.roe ? U.num(m.ind.roe, 1) + "%" : "—")], ["Vacância", (m) => (m.ind.vacancia !== undefined && m.ind.vacancia !== null ? U.num(m.ind.vacancia, 1) + "%" : "—")], ["Volume médio", (m, c) => (c.volumeMi ? "R$ " + U.num(c.volumeMi, 1) + " mi" : "—")]];
      return `<div class="page-head"><div><div class="crumb">Mercado</div><h1>Comparar ativos</h1><p>Até 4 ativos lado a lado. Indicadores diferentes medem coisas diferentes — compare ativos do mesmo tipo.</p></div></div>
      <div class="filters">${[0, 1, 2, 3].map((i) => `<label>Ativo ${i + 1}<select data-cmp="${i}"><option value="">—</option>${Object.keys(C.ativos).map((t) => `<option ${sel[i] === t ? "selected" : ""}>${t}</option>`).join("")}</select></label>`).join("")}</div>
      ${sel.length ? `<div class="card"><div class="card-h"><div><h2>Desempenho em 12 meses</h2><div class="sub">Base 100 no início do período</div></div></div><div class="chart" id="chCmp"></div></div>
      <div class="card section"><div class="tbl-wrap"><table><thead><tr><th></th>${sel.map((t) => `<th>${linkAtivo(t)}</th>`).join("")}</tr></thead><tbody>${linhas.map(([l, f]) => `<tr><td class="muted">${l}</td>${sel.map((t) => `<td>${f(C.ativos[t], M.cotacoes[t])}</td>`).join("")}</tr>`).join("")}</tbody></table></div><div class="card-f">Indicadores ilustrativos · não constitui recomendação</div></div>` : '<div class="card empty">Escolha ao menos um ativo.</div>'}`;
    },
    after({ params, r }) {
      document.querySelectorAll("[data-cmp]").forEach((s) => s.addEventListener("change", () => {
        const v = [...document.querySelectorAll("[data-cmp]")].map((x) => x.value).filter(Boolean);
        location.hash = "#/mercado/comparar/" + v.join(",");
      }));
      const sel = [...document.querySelectorAll("[data-cmp]")].map((x) => x.value).filter(Boolean);
      const el = document.getElementById("chCmp"); if (!el || !sel.length) return;
      const cores = ["#06377b", "#0e7c86", "#c27c0e", "#7a3db8"];
      CH.linha(el, { series: sel.map((t, i) => { const s = M.cotacoes[t].serie.filter((_, k) => k % 3 === 0 || k === 251); return { nome: t, cor: cores[i], pontos: s.map(([d, v]) => [d, (v / s[0][1]) * 100]) }; }), fmtY: (v, e) => (e ? U.num(v, 0) : U.num(v, 1)), fmtX, legenda: true, label: "Comparação base 100" });
    },
  };

  // =============== OFERTAS PÚBLICAS ===============
  V.ofertas = {
    html() {
      return `<div class="page-head"><div><div class="crumb">Serviços B3</div><h1>Ofertas públicas</h1><p>IPOs, follow-ons e títulos de renda fixa com cronograma divulgado</p></div></div>
      <div class="alert info-a" style="margin-bottom:16px"><span class="ic">ℹ️</span><div><b>Leia o prospecto antes de reservar.</b><p>A reserva é feita na sua corretora. Exemplos genéricos neste protótipo.</p></div></div>
      <div class="card">${M.ofertas.map((o) => `<div class="list-item"><span style="font-size:22px" aria-hidden="true">🚀</span><div class="grow"><div class="t">${o.nome}</div><div class="s">${o.tipo} · período de reserva: ${o.periodo} · ${o.publico}</div></div><span class="chip ${o.status === "Reserva aberta" ? "ok" : o.status === "Em breve" ? "warn" : ""}">${o.status}</span><button class="btn sm" onclick="U.toast('Simulação: prospecto abriria aqui')">Prospecto</button></div>`).join("")}</div>`;
    },
  };

  // =============== ASSEMBLEIAS ===============
  V.assembleias = {
    html({ r }) {
      const held = new Set(r.ativos.map((a) => a.tk));
      const ags = M.eventos.filter((e) => e.categoria === "Assembleia" && e.data >= M.BASE).sort((a, b) => (held.has(b.ticker) ? 1 : 0) - (held.has(a.ticker) ? 1 : 0));
      return `<div class="page-head"><div><div class="crumb">Serviços B3</div><h1>Assembleias</h1><p>Vote a distância nas decisões das empresas — você vota pelos ativos que tem na data de corte</p></div></div>
      <div class="card">${ags.map((e, i) => `<div class="list-item" style="align-items:flex-start"><div class="date-box"><b>${e.data.slice(8)}</b><span>${U.MESES[+e.data.slice(5, 7) - 1]}</span></div><div class="grow"><div class="t">${linkAtivo(e.ticker)} · ${e.tipo}</div><div class="s">${U.esc(C.ativos[e.ticker].empresa || C.ativos[e.ticker].nome)}</div>
        ${held.has(e.ticker) ? `<details style="margin-top:8px"><summary class="small" style="cursor:pointer;color:var(--b3);font-weight:600">Ver pauta e votar</summary><form data-vote="${i}" style="margin-top:8px">${["Aprovar as contas e o relatório da administração", "Eleger membros do conselho fiscal"].map((p, k) => `<fieldset style="border:1px solid var(--line);border-radius:8px;margin:0 0 8px;padding:8px 12px"><legend class="small" style="font-weight:600">Item ${k + 1}: ${p}</legend>${["A favor", "Contra", "Abstenção"].map((o) => `<label class="small" style="margin-right:12px"><input type="radio" name="i${k}" value="${o}" required> ${o}</label>`).join("")}</fieldset>`).join("")}<button class="btn sm primary" type="submit">Enviar voto</button></form></details>` : '<div class="s">Você não tem este ativo — apenas acompanhamento.</div>'}</div>${held.has(e.ticker) ? '<span class="chip blue">Você pode votar</span>' : ""}</div>`).join("") || '<div class="empty">Nenhuma assembleia agendada.</div>'}</div>`;
    },
    after() {
      document.querySelectorAll("[data-vote]").forEach((f) => f.addEventListener("submit", (e) => { e.preventDefault(); f.innerHTML = '<div class="alert ok"><span class="ic">✅</span><div><b>Voto registrado (simulação)</b><p>Protocolo enviado por e-mail. Você pode alterar até 7 dias antes da assembleia.</p></div></div>'; }));
    },
  };

  V["nao-encontrado"] = { html: () => `<div class="empty"><div class="big">🧭</div><h2>Página não encontrada</h2><p><a href="#/para-voce">Voltar ao início</a></p></div>` };
})(window.VIEWS);

/* ===== V2: aba Mercado com gráficos reais (TradingView) e cripto ao vivo (CoinGecko) ===== */
(function (V) {
  const U = window.U, C = window.CATALOGO, M = window.MERCADO, CR = window.CRIPTO;

  // Carrega um widget oficial do TradingView dentro do elemento (gráfico real de mercado)
  function tv(el, tipo, cfg) {
    if (!el) return;
    el.innerHTML = '<div class="empty" style="padding:24px">Carregando gráfico ao vivo…<br><span class="small">Se não aparecer, verifique sua conexão com a internet.</span></div>';
    const box = document.createElement("div"); box.className = "tradingview-widget-container"; box.style.height = "100%";
    const w = document.createElement("div"); w.className = "tradingview-widget-container__widget"; w.style.height = "100%"; box.appendChild(w);
    const s = document.createElement("script"); s.async = true; s.src = `https://s3.tradingview.com/external-embedding/embed-widget-${tipo}.js`;
    s.text = JSON.stringify(Object.assign({ locale: "br", colorTheme: "light", isTransparent: false, width: "100%", height: "100%" }, cfg));
    box.appendChild(s);
    setTimeout(() => { el.innerHTML = ""; el.appendChild(box); }, 50);
  }
  const avancado = (el, sym) => tv(el, "advanced-chart", { symbol: sym, interval: "D", range: "12M", autosize: true, hide_side_toolbar: true, allow_symbol_change: false, style: "3", timezone: "America/Sao_Paulo", theme: "light" });
  const mini = (el, sym) => tv(el, "mini-symbol-overview", { symbol: sym, dateRange: "1M", chartOnly: false, trendLineColor: "#06377b", underLineColor: "rgba(6,55,123,.12)" });
  V._tv = { avancado, mini };

  const INDICES = [
    { sym: "BMFBOVESPA:IBOV", nome: "Ibovespa", o: "As ~80 ações mais negociadas da B3. É o “termômetro” da bolsa brasileira." },
    { sym: "BMFBOVESPA:IFIX", nome: "IFIX", o: "Média dos fundos imobiliários (FIIs) mais negociados." },
    { sym: "BMFBOVESPA:SMLL", nome: "Small Caps", o: "Empresas menores da bolsa: podem crescer mais, mas oscilam mais." },
    { sym: "FX_IDC:USDBRL", nome: "Dólar", o: "Quantos reais custa 1 dólar. Afeta importados, viagens e ETFs internacionais." },
    { sym: "SP:SPX", nome: "S&P 500", o: "As 500 maiores empresas dos EUA — referência do mercado global." },
    { sym: "BINANCE:BTCBRL", nome: "Bitcoin", o: "A maior criptomoeda, cotada em reais. Funciona 24h por dia, 7 dias por semana." },
  ];

  V.mercado = {
    html(ctx) {
      const { r, params, id } = ctx, aba = params[0] || "";
      const abas = [["", "Índices"], ["meus", "Meus ativos e cripto"], ["destaques", "Destaques do dia"], ["acompanhar", "Acompanhamento"], ["comparar", "Comparar"], ["ofertas", "Ofertas públicas"]];
      let corpo = "";
      if (!aba) {
        corpo = `<section class="card"><div class="card-h"><div><h2>Ibovespa</h2><div class="sub">Gráfico real · 12 meses · arraste e use a roda do mouse para explorar</div></div><span class="real-badge">ao vivo</span></div><div class="tv-box" id="tvIbov"></div></section>
          <div class="grid g3 section">${INDICES.map((i, k) => `<section class="card" style="padding:16px"><div class="tv-mini" id="tvI${k}"></div><p class="small" style="margin:10px 2px 0;color:var(--ink-2)"><b>${i.nome}:</b> ${i.o}</p></section>`).join("")}</div>
          <p class="small muted">Gráficos fornecidos pelo TradingView com dados reais de mercado (podem ter atraso). Não é recomendação de investimento.</p>`;
      } else if (aba === "meus") {
        const rv = r.ativos.filter((a) => C.ativos[a.tk] && C.ativos[a.tk].tipo !== "tesouro");
        const cr = CR.posicoes(id);
        const sel = params[1] || (rv[0] ? rv[0].tk : cr[0] ? cr[0].sym : "");
        const isCr = !!CR.MOEDAS[sel];
        const sym = isCr ? CR.MOEDAS[sel].tv : "BMFBOVESPA:" + sel;
        const pos = isCr ? cr.find((p) => p.sym === sel) : rv.find((a) => a.tk === sel);
        const m = isCr ? CR.MOEDAS[sel] : null;
        corpo = `<div class="pick" role="group" aria-label="Escolha o ativo">${rv.map((a) => `<button data-sel="${a.tk}" aria-pressed="${a.tk === sel}"><b>${a.tk}</b><span>${U.brl(a.valor)}</span></button>`).join("")}${cr.map((p) => `<button data-sel="${p.sym}" aria-pressed="${p.sym === sel}"><b>${p.sym} <span style="color:${CR.MOEDAS[p.sym].cor}">●</span></b><span>${U.brl(p.valor)}</span></button>`).join("")}</div>
          ${sel ? `<div class="grid g-main"><section class="card"><div class="card-h"><div><h2>${U.esc(sel)} · ${U.esc(isCr ? m.nome : C.ativos[sel].nome)}</h2><div class="sub">${isCr ? "Cotação real em reais (Binance)" : "Cotação real na B3"}</div></div><span class="real-badge">ao vivo</span></div><div class="tv-box" id="tvMeu"></div></section>
            <section class="card"><h2>Sua posição</h2>
              <div class="kpi" style="margin-top:12px"><div class="lbl">Quantidade</div><div class="val">${U.qtd(pos.q)}</div></div>
              <div class="kpi" style="margin-top:12px"><div class="lbl">Valor ${isCr && CR.estado.aoVivo ? "(preço ao vivo)" : "(data-base)"}</div><div class="val">${U.brl(pos.valor)}</div></div>
              ${isCr ? `<div class="kpi" style="margin-top:12px"><div class="lbl">Preço agora</div><div class="val">R$ ${U.num(m.preco, 2)}</div><div class="det">24h ${U.sinal(m.ch.d1)} · 30 dias ${U.sinal(m.ch.d30)}</div></div>
                <div class="alert info-a" style="margin-top:14px"><span class="ic">ℹ️</span><div><p>Cripto não fica sob custódia da B3: estes dados vêm da sua exchange conectada. O preço oscila 24h por dia.</p></div></div>`
              : `<a class="btn" style="margin-top:16px" href="#/ativo/${sel}">Ficha completa do ativo →</a>`}
              <button class="btn ghost" style="margin-top:8px" data-ask="Me explique como ler o gráfico de ${sel}">✦ Perguntar à IA sobre ${U.esc(sel)}</button></section></div>` : '<div class="card empty">Você ainda não tem ações ou cripto para mostrar.</div>'}`;
        ctx._tvSym = sym;
      } else if (aba === "destaques") corpo = V.destaques.html(ctx);
      else if (aba === "acompanhar") corpo = V.acompanhamento.html(ctx).replace(/<div class="crumb">Mercado<\/div><h1>[^<]*<\/h1>/, "<h2>Lista de acompanhamento</h2>");
      else if (aba === "comparar") corpo = V.comparar.html(Object.assign({}, ctx, { params: params.slice(1) })).replace(/<div class="crumb">Mercado<\/div><h1>[^<]*<\/h1>/, "<h2>Comparar ativos</h2>");
      else if (aba === "ofertas") corpo = V.ofertas.html(ctx).replace(/<div class="crumb">Serviços B3<\/div><h1>[^<]*<\/h1>/, "<h2>Ofertas públicas</h2>");
      return `<div class="page-head"><div><h1>Mercado</h1><p>Índices e cotações reais, seus ativos e criptos em gráfico</p></div></div>${V._sub("mercado", aba, abas)}${corpo}`;
    },
    after(ctx) {
      const { params } = ctx, aba = params[0] || "";
      if (!aba) { avancado(document.getElementById("tvIbov"), "BMFBOVESPA:IBOV"); INDICES.forEach((i, k) => mini(document.getElementById("tvI" + k), i.sym)); }
      if (aba === "meus") {
        avancado(document.getElementById("tvMeu"), ctx._tvSym);
        document.querySelectorAll("[data-sel]").forEach((b) => b.addEventListener("click", () => (location.hash = "#/mercado/meus/" + b.dataset.sel)));
      }
      if (aba === "destaques") V.destaques.after(ctx);
      if (aba === "acompanhar") V.acompanhamento.after(ctx);
      if (aba === "comparar") V.comparar.after(Object.assign({}, ctx, { params: params.slice(1) }));
    },
  };

  // Ficha do ativo: carrega também o gráfico real
  const afterAtivo = V.ativo.after;
  V.ativo.after = function (ctx) { afterAtivo(ctx); const el = document.getElementById("tvAtivo"); if (el) avancado(el, el.dataset.sym); };
})(window.VIEWS);
