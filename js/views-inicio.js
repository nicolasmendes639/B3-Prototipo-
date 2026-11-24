/* V2 — Início, Carteira e Proventos (análises em gráfico; tabelas só em Relatórios). */
window.VIEWS = window.VIEWS || {};
(function (V) {
  const U = window.U, C = window.CATALOGO, M = window.MERCADO, CH = window.CH, D = window.B3DATA, K = window.CONSOL, CR = window.CRIPTO;

  // ---------- helpers compartilhados ----------
  const fmtY = (v, eixo) => (U.state.hide ? (eixo ? "•••" : "R$ ••••") : eixo ? (Math.abs(v) >= 1e6 ? U.num(v / 1e6, 1) + " mi" : Math.abs(v) >= 1e3 ? U.num(v / 1e3, 0) + " mil" : U.num(v, 0)) : U.brl(v));
  const fmtPctY = (v, eixo) => (eixo ? U.num(v, 0) + "%" : (v >= 0 ? "+" : "") + U.num(v, 2) + "%");
  const linkAtivo = (tk) => `<a class="tk" href="#/ativo/${U.slug(tk)}">${U.esc(tk)}</a>`;
  const fonte = (extra = "") => `<div class="card-f"><span>Fontes: B3, corretoras e carteiras conectadas</span>·<span>Posição de ${U.data(D.dataBase)}</span>${extra ? "·<span>" + extra + "</span>" : ""}</div>`;
  const kpi = (lbl, val, det, info) => `<div class="card kpi"><div class="lbl">${lbl}${info ? U.info(info) : ""}</div><div class="val">${val}</div><div class="det">${det}</div></div>`;
  const sub = (base, atual, abas) => `<nav class="subtabs" aria-label="Seções de ${base}">${abas.map(([k, t]) => `<a href="#/${base}${k ? "/" + k : ""}" class="${atual === k ? "on" : ""}" ${atual === k ? 'aria-current="page"' : ""}>${t}</a>`).join("")}</nav>`;
  const corItem = (x) => (x.tipo === "cripto" ? CR.MOEDAS[x.cod].cor : K.CORES[x.classe] || "#06377b");
  const logo = (x) => `<span class="lg" style="background:${corItem(x)}">${U.esc(x.tipo === "rf" ? x.cod.slice(0, 3).toUpperCase() : x.cod.replace("Tesouro ", "TD").slice(0, 4))}</span>`;
  const hrefItem = (x) => (x.tipo === "b3" ? "#/ativo/" + U.slug(x.cod) : x.tipo === "cripto" ? "#/mercado/meus/" + x.cod : "#/carteira/ativos");
  const per = () => U.store.get("periodo", "30D");
  const perTxt = { "7D": "nos últimos 7 dias", "30D": "nos últimos 30 dias", "6M": "nos últimos 6 meses", "12M": "nos últimos 12 meses" };
  const sinalBrl = (v) => (U.state.hide ? "R$ ••••" : (v >= 0 ? "+" : "−") + U.brl(Math.abs(v)).replace("-", ""));
  Object.assign(V, { _fmtY: fmtY, _linkAtivo: linkAtivo, _fonte: fonte, _kpi: kpi, _sub: sub, _logo: logo, _hrefItem: hrefItem, _corItem: corItem });

  function posLista(its, n, per) {
    const contrib = per ? Object.fromEntries(K.contribuicao(window.APP.id(), per).map((c) => [c.cod, c])) : {};
    return `<div class="pos-list">${its.slice(0, n).map((x) => { const c = contrib[x.cod]; return `<a class="pos" href="${hrefItem(x)}">${logo(x)}<div class="nm"><b>${U.esc(x.tipo === "rf" ? x.nome : x.cod)}</b><span>${U.esc(x.tipo === "rf" ? (x.classe === "Fundos" ? "Fundos" : "Renda fixa") + " · " + x.instTxt : x.nome)}</span><div class="bar"><i style="width:${Math.max(2, x.pct)}%;background:${corItem(x)}"></i></div></div>
      <div class="vl"><b>${U.brl(x.valor)}</b><span class="small muted">${U.num(x.pct, 1)}%</span>${c ? `<div>${U.sinal(c.pctVar)}</div>` : ""}</div></a>`; }).join("")}</div>`;
  }

  // =============== INÍCIO ===============
  V.inicio = {
    html({ id, r }) {
      const p = per(), res = K.resultado(id, p), its = K.itens(id), classes = K.porClasse(id);
      const cr = its.filter((x) => x.tipo === "cripto").reduce((a, x) => a + x.valor, 0);
      const anu = r.anunciados.reduce((a, x) => a + x.valor, 0);
      const contas = K.porInstituicao(id).length;
      const up = res.ganho >= 0;
      const prox = r.anunciados.slice().sort((a, b) => (a.data < b.data ? -1 : 1)).slice(0, 4);
      const contrib = K.contribuicao(id, p);
      const vistos = U.store.get("videos:feitos", []).length;
      return `
      <div class="page-head"><div><h1>Olá! 👋</h1><p>Tudo o que você tem, em um só lugar · ${contas} contas conectadas · atualizado em ${U.data(D.dataBase)}</p></div></div>
      <section class="hero" data-tour="hero" aria-label="Resumo do patrimônio">
        <div class="hero-grid">
          <div>
            <div class="lbl">Saldo total da carteira ${U.info("Soma de tudo o que está nas suas contas conectadas: B3 (ações, FIIs, ETFs, Tesouro), renda fixa e fundos das corretoras e suas carteiras cripto. Cripto usa preço ao vivo quando disponível.")}</div>
            <div class="saldo">${U.brl(res.fim)}</div>
            <div class="ganho ${up ? "up" : "down"}" data-tour="ganho"><span aria-hidden="true">${up ? "▲" : "▼"}</span> ${sinalBrl(res.ganho)} <span style="opacity:.85">(${up ? "+" : ""}${U.num(res.pct, 2)}%)</span></div>
            <div class="hero-sub">${up ? "Você ganhou" : "Sua carteira caiu"} ${perTxt[p]} ${U.info("Variação de mercado da sua carteira atual no período: quanto os seus investimentos valorizaram ou desvalorizaram. Não conta dinheiro novo que você colocou ou tirou.", "Como calculamos")}</div>
            <div style="margin-top:16px" class="seg" role="group" aria-label="Período">${Object.keys(K.PERIODOS).map((k) => `<button data-per="${k}" aria-pressed="${k === p}">${k}</button>`).join("")}</div>
          </div>
          <div class="chart" id="chHero" style="min-height:200px"></div>
        </div>
        <div class="hero-mini"><div>Na B3 e corretoras<b>${U.brl(res.fim - cr)}</b></div>${cr ? `<div>Cripto ${CR.estado.aoVivo ? "· ao vivo" : ""}<b>${U.brl(cr)}</b></div>` : ""}<div>Proventos a receber<b>${U.brl(anu)}</b></div></div>
      </section>
      ${r.pendInst ? `<div class="alert section"><span class="ic">⚠️</span><div><b>${r.pendInst} ainda não atualizou sua posição.</b><p>O saldo usa a última posição recebida (19/11). <a href="#/conta/contas">Ver o que falta</a></p></div></div>` : ""}
      <section class="card section" data-tour="carteira"><div class="card-h"><div><h2>Minha carteira</h2><div class="sub">Como seu dinheiro está dividido</div></div><a class="btn sm" href="#/carteira">Ver carteira completa →</a></div>
        <div class="alloc"><div><div id="dHome" style="display:grid;place-items:center"></div><div class="legend-big" style="margin-top:14px">${classes.map((c) => `<div class="row"><span class="dot" style="background:${c.cor}"></span>${c.nome}<b>${U.num(c.pct, 1)}%</b></div>`).join("")}</div></div>
          <div>${posLista(its, 6, p)}${its.length > 6 ? `<a class="small" href="#/carteira/ativos" style="display:block;margin:8px 10px 0">+ ${its.length - 6} investimentos</a>` : ""}</div></div>
      </section>
      <div class="grid g2 section">
        <section class="card"><div class="card-h"><div><h2>O que mais mexeu no resultado</h2><div class="sub">Ganho ou perda em reais ${perTxt[p]}</div></div></div><div class="chart" id="chContrib"></div></section>
        <section class="card"><div class="card-h"><div><h2>Próximos recebimentos</h2><div class="sub">Proventos já anunciados</div></div><a href="#/proventos" class="small">Ver todos</a></div>
          ${prox.length ? prox.map((x) => `<div class="list-item"><div class="date-box"><b>${x.data.slice(8)}</b><span>${U.MESES[+x.data.slice(5, 7) - 1]}</span></div><div class="grow"><div class="t">${x.tk}</div><div class="s">${U.rotuloProv(x.tp)} · anunciado</div></div><b class="num">${U.brl(x.valor)}</b></div>`).join("") : '<div class="empty"><div class="big">🗓️</div>Nenhum provento anunciado agora.</div>'}</section>
      </div>
      ${vistos < 2 ? `<section class="card section" style="display:flex;gap:18px;align-items:center;flex-wrap:wrap"><span style="font-size:42px" aria-hidden="true">🎬</span><div style="flex:1;min-width:220px"><h2>Começando a investir?</h2><p class="muted" style="margin:4px 0 0">Vídeos de 1 minuto, simples e divertidos, explicam o básico. Termine com um quiz rápido.</p></div><a class="btn primary" href="#/aprender">Assistir agora</a></section>` : ""}`;
    },
    after({ id }) {
      const p = per(), res = K.resultado(id, p), up = res.ganho >= 0;
      CH.linha(document.getElementById("chHero"), { series: [{ nome: "Saldo", cor: up ? "#8ff0b5" : "#ffb4ad", pontos: res.serie }], area: true, fmtY, fmtX: (d, l) => (l ? U.data(d) : U.dataCurta(d)), altura: 210, label: "Evolução do saldo no período" });
      CH.rosca(document.getElementById("dHome"), K.porClasse(id), { centro: String(K.porClasse(id).length), sub: "classes", label: "Distribuição por classe" });
      const ct = K.contribuicao(id, p).filter((c) => Math.abs(c.ganho) > 0.5);
      const top = ct.slice(0, 3).concat(ct.slice(-3).filter((x) => !ct.slice(0, 3).includes(x)));
      barrasH(document.getElementById("chContrib"), top.map((c) => ({ rot: c.tipo === "rf" ? c.nome : c.cod, v: c.ganho })));
      document.querySelectorAll("[data-per]").forEach((b) => b.addEventListener("click", () => { U.store.set("periodo", b.dataset.per); window.APP.render(); }));
    },
  };

  // barras horizontais positivo/negativo (sem tabela)
  function barrasH(el, rows) {
    if (!rows.length) { el.innerHTML = '<div class="muted">Sem variação relevante no período.</div>'; return; }
    const max = Math.max(...rows.map((r) => Math.abs(r.v)), 1);
    el.innerHTML = rows.map((r) => `<div style="display:grid;grid-template-columns:110px 1fr 110px;gap:10px;align-items:center;margin:10px 0"><b style="font-size:15px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${U.esc(r.rot)}</b>
      <div style="position:relative;height:14px;background:#f1f4f9;border-radius:99px"><i style="position:absolute;top:0;bottom:0;${r.v >= 0 ? "left:50%" : "right:50%"};width:${(Math.abs(r.v) / max) * 50}%;background:${r.v >= 0 ? "#16a34a" : "#dc2626"};border-radius:99px"></i><i style="position:absolute;left:50%;top:-3px;bottom:-3px;width:2px;background:#cbd5e1"></i></div>
      <span class="num ${r.v >= 0 ? "pos" : "neg"}">${r.v >= 0 ? "▲" : "▼"} ${U.state.hide ? "••••" : U.brl(Math.abs(r.v))}</span></div>`).join("");
  }
  V._barrasH = barrasH;

  // =============== CARTEIRA ===============
  V.carteira = {
    html(ctx) {
      const { id, r, params } = ctx, aba = params[0] || "", its = K.itens(id), p = per();
      const abas = [["", "Distribuição"], ["rentabilidade", "Rentabilidade"], ["ativos", "Todos os investimentos"], ["movimentacoes", "Movimentações"]];
      let corpo = "";
      if (!aba) {
        const inst = K.porInstituicao(id);
        const tipos = {}; its.forEach((x) => { const k = x.tipo === "cripto" ? "Cripto" : U.rotuloTipo(x.sub); tipos[k] = (tipos[k] || 0) + x.valor; });
        corpo = `<div class="grid g2">
          <section class="card"><div class="card-h"><div><h2>Por classe</h2><div class="sub">Quanto de cada tipo de investimento</div></div></div><div class="alloc" style="grid-template-columns:1fr"><div id="dCl" style="display:grid;place-items:center"></div><div class="legend-big">${K.porClasse(id).map((c) => `<div class="row"><span class="dot" style="background:${c.cor}"></span>${c.nome}<b>${U.brl(c.valor)} · ${U.num(c.pct, 1)}%</b></div>`).join("")}</div></div></section>
          <section class="card"><div class="card-h"><div><h2>Por conta</h2><div class="sub">Corretoras e carteiras conectadas</div></div><a class="small" href="#/conta/contas">Gerenciar</a></div>
            ${inst.map((i) => `<div style="margin-bottom:16px"><div style="display:flex;justify-content:space-between;margin-bottom:6px;gap:8px"><span><b>${i.nome}</b> <span class="small muted">${i.tipo}</span> ${i.nome === r.pendInst ? '<span class="chip warn">aguardando</span>' : ""}</span><b class="num">${U.brl(i.valor)}</b></div><div class="bar" style="height:10px"><i style="width:${i.pct}%;background:${i.cor}"></i></div></div>`).join("")}</section>
        </div>
        <section class="card section"><div class="card-h"><div><h2>Por tipo de produto</h2></div></div><div class="chart" id="chTipos"></div></section>`;
        ctx._tipos = tipos;
      } else if (aba === "rentabilidade") {
        corpo = `<section class="card"><div class="card-h"><div><h2>Rentabilidade × CDI × Ibovespa</h2><div class="sub">Últimos 12 meses, já descontando aportes e resgates (método Dietz) ${U.info("Retorno mensal = (valor final − valor inicial − aportes) ÷ (valor inicial + metade dos aportes), meses encadeados. CDI e Ibovespa simulados neste protótipo.")}</div></div></div><div class="chart" id="chRent"></div></section>
          <div class="grid g3 section">${kpi("Sua carteira (12m)", U.sinal(r.rent.at(-1)[1]), "Rentabilidade acumulada")}${kpi("CDI (12m)", U.sinal(r.cdi.at(-1)[1]), "Referência de renda fixa")}${kpi("Ibovespa (12m)", U.sinal(r.ibov.at(-1)[1]), "Referência de ações")}</div>
          <section class="card section"><div class="card-h"><div><h2>Quem ganhou e quem perdeu</h2><div class="sub">Contribuição de cada investimento ${perTxt[p]}</div></div><div class="seg" role="group">${Object.keys(K.PERIODOS).map((k) => `<button data-per="${k}" aria-pressed="${k === p}">${k}</button>`).join("")}</div></div><div id="chContrib2"></div></section>`;
      } else if (aba === "ativos") {
        const grupos = [["Ações, FIIs e ETFs", (x) => x.classe === "Renda variavel"], ["Tesouro Direto", (x) => x.classe === "Tesouro Direto"], ["Renda fixa e fundos", (x) => x.tipo === "rf"], ["Cripto", (x) => x.tipo === "cripto"]];
        corpo = grupos.map(([t, f]) => { const g = its.filter(f); if (!g.length) return ""; const tot = g.reduce((a, x) => a + x.valor, 0); return `<section class="card section"><div class="card-h"><h2>${t}</h2><b class="num">${U.brl(tot)}</b></div><div class="grid g2">${g.map((x) => { const cot = x.tipo === "b3" ? M.cotacoes[x.cod] : null; return `<a class="pos" href="${hrefItem(x)}" style="border:1px solid var(--line)">${logo(x)}<div class="nm"><b>${U.esc(x.tipo === "rf" ? x.nome : x.cod)}</b><span>${U.esc(x.tipo === "rf" ? x.instTxt : x.nome)}</span></div><div class="vl"><b>${U.brl(x.valor)}</b>${cot ? CH.spark(cot.serie.slice(-60).map((s) => s[1]), cot.var12m >= 0 ? "#16a34a" : "#dc2626", 90, 24) : x.tipo === "cripto" ? U.sinal(CR.MOEDAS[x.cod].ch.d30) : '<span class="small muted">rende ~CDI</span>'}</div></a>`; }).join("")}</div></section>`; }).join("") + '<p class="small muted">Quer ver em tabela? <a href="#/relatorios">Relatórios</a> tem a posição completa para exportar.</p>';
      } else if (aba === "movimentacoes") {
        const ult = r.inv.mov.slice(-8).reverse();
        corpo = `<section class="card"><div class="card-h"><div><h2>Dinheiro que entrou e saiu</h2><div class="sub">Compras e aplicações × vendas e resgates, por mês</div></div></div><div class="chart" id="chMov"></div></section>
          <section class="card section"><div class="card-h"><h2>Últimas movimentações</h2><a class="btn sm" href="#/relatorios/movimentacoes">Ver extrato completo</a></div>
          ${ult.map((m) => `<div class="list-item"><span style="font-size:22px" aria-hidden="true">${m[3] === "Compra" ? "🟢" : "🔴"}</span><div class="grow"><div class="t">${m[3] === "Compra" ? "Comprou" : "Vendeu"} ${U.qtd(m[5])} ${U.esc(m[2])}</div><div class="s">${U.data(m[0])} · ${U.rotuloMov(m[4])}</div></div><b class="num">${U.brl(m[7])}</b></div>`).join("")}</section>`;
      }
      return `<div class="page-head"><div><h1>Carteira</h1><p>${its.length} investimentos · ${U.brl(its.reduce((a, x) => a + x.valor, 0))}</p></div></div>${sub("carteira", aba, abas)}${corpo}`;
    },
    after(ctx) {
      const { id, r, params } = ctx, aba = params[0] || "";
      if (!aba) {
        CH.rosca(document.getElementById("dCl"), K.porClasse(id), { centro: U.state.hide ? "•••" : U.num(K.itens(id).reduce((a, x) => a + x.valor, 0) / 1000, 0) + " mil", sub: "total" });
        const t = Object.entries(ctx._tipos || {}).sort((a, b) => b[1] - a[1]);
        CH.barras(document.getElementById("chTipos"), t.map(([k, v]) => ({ rotulo: k, valores: [v] })), [{ nome: "Valor", cor: "#06377b" }], { fmtY, altura: 230 });
      }
      if (aba === "rentabilidade") {
        CH.linha(document.getElementById("chRent"), { series: [{ nome: "Sua carteira", cor: "#06377b", pontos: r.rent }, { nome: "CDI", cor: "#0e7c86", pontos: r.cdi, tracejado: true }, { nome: "Ibovespa", cor: "#c27c0e", pontos: r.ibov, tracejado: true }], fmtY: fmtPctY, fmtX: (d, l) => (l ? U.data(d) : U.mesAno(d)), altura: 300 });
        const ct = K.contribuicao(id, per()); barrasH(document.getElementById("chContrib2"), ct.map((c) => ({ rot: c.tipo === "rf" ? c.nome : c.cod, v: c.ganho })));
        document.querySelectorAll("[data-per]").forEach((b) => b.addEventListener("click", () => { U.store.set("periodo", b.dataset.per); window.APP.render(); }));
      }
      if (aba === "movimentacoes") {
        const mm = {}; r.inv.mov.forEach((m) => { const k = m[0].slice(0, 7); mm[k] = mm[k] || [0, 0]; mm[k][m[3] === "Compra" ? 0 : 1] += m[7]; });
        const ks = Object.keys(mm).sort().slice(-12);
        CH.barras(document.getElementById("chMov"), ks.map((k) => ({ rotulo: U.mesAno(k + "-01"), valores: mm[k] })), [{ nome: "Entrou (compras/aplicações)", cor: "#06377b" }, { nome: "Saiu (vendas/resgates)", cor: "#c27c0e" }], { fmtY, altura: 260 });
      }
    },
  };

  // =============== PROVENTOS ===============
  const CAT = { "Data-com": "com", "Data ex": "ex", Pagamento: "pag", Resultado: "res", Assembleia: "ag" };
  let mesCal = null;
  V.proventos = {
    html(ctx) {
      const { r, params } = ctx, aba = params[0] || "";
      const abas = [["", "Resumo"], ["calendario", "Calendário"], ["assembleias", "Assembleias"]];
      let corpo = "";
      if (!aba) {
        const rec = r.recebidos12.reduce((a, p) => a + p.valor, 0), anu = r.anunciados.reduce((a, p) => a + p.valor, 0);
        const porAtivo = {}; r.recebidos12.forEach((p) => (porAtivo[p.tk] = (porAtivo[p.tk] || 0) + p.valor));
        const rank = Object.entries(porAtivo).sort((a, b) => b[1] - a[1]).slice(0, 6);
        corpo = `<div class="grid g3">${kpi("💰 Recebido em 12 meses", U.brl(rec), `Média de ${U.brl(rec / 12)} por mês`, "Valores líquidos que já caíram na sua conta.")}${kpi("⏳ Vai receber", U.brl(anu), `${r.anunciados.length} pagamentos anunciados`, "Proventos aprovados pelas empresas e ainda não pagos. Podem ser ajustados até o pagamento.")}${kpi("🔮 Estimado", '<span class="muted" style="font-size:20px">Fora dos totais</span>', "Projeções nunca se misturam com valores confirmados")}</div>
          <section class="card section"><div class="card-h"><div><h2>Mês a mês</h2><div class="sub">Barras cheias = pago · tracejadas = anunciado</div></div></div><div class="chart" id="chProv"></div></section>
          <div class="grid g2 section"><section class="card"><div class="card-h"><h2>Quem mais pagou</h2></div><div class="chart" id="chRank"></div></section>
          <section class="card"><div class="card-h"><h2>Próximos pagamentos</h2><a class="small" href="#/proventos/calendario">Calendário</a></div>${r.anunciados.slice().sort((a, b) => (a.data < b.data ? -1 : 1)).map((x) => `<div class="list-item"><div class="date-box"><b>${x.data.slice(8)}</b><span>${U.MESES[+x.data.slice(5, 7) - 1]}</span></div><div class="grow"><div class="t">${linkAtivo(x.tk)}</div><div class="s">${U.rotuloProv(x.tp)}</div></div><span class="chip warn">Anunciado</span><b class="num">${U.brl(x.valor)}</b></div>`).join("") || '<div class="muted">Nenhum agora.</div>'}</section></div>`;
        ctx._rank = rank;
      } else if (aba === "calendario") {
        const base = mesCal || M.BASE.slice(0, 7);
        const [y, m] = base.split("-").map(Number);
        const primeiro = new Date(Date.UTC(y, m - 1, 1, 12)), ini = new Date(primeiro); ini.setUTCDate(1 - primeiro.getUTCDay());
        const held = new Set(r.ativos.map((a) => a.tk)), meus = U.store.get("cal:meus", true);
        const evs = M.eventos.filter((e) => !meus || held.has(e.ticker));
        r.anunciados.forEach((a) => evs.push({ data: a.data, ticker: a.tk, tipo: "Pagamento", categoria: "Provento", status: "Seu recebimento", meu: true, valor: a.valor }));
        const dias = []; for (let k = 0; k < 42; k++) { const d = new Date(ini); d.setUTCDate(ini.getUTCDate() + k); dias.push(d.toISOString().slice(0, 10)); }
        const nomeMes = primeiro.toLocaleDateString("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" });
        corpo = `<section class="card"><div class="card-h"><div style="display:flex;gap:8px;align-items:center"><button class="icon-btn" data-mes="-1" aria-label="Mês anterior">‹</button><h2 style="text-transform:capitalize;min-width:190px;text-align:center">${nomeMes}</h2><button class="icon-btn" data-mes="1" aria-label="Próximo mês">›</button></div>
          <label style="display:flex;gap:8px;align-items:center;font-weight:600"><input type="checkbox" id="calMeus" ${meus ? "checked" : ""} style="width:20px;height:20px"> Só meus ativos</label></div>
          <div class="cal" role="grid">${["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d) => `<div class="dow">${d}</div>`).join("")}
          ${dias.map((d) => { const l = evs.filter((e) => e.data === d); return `<div class="d ${d.slice(0, 7) !== base ? "out" : ""} ${d === M.BASE ? "today" : ""}"><span class="n">${+d.slice(8)}</span>${l.slice(0, 3).map((e) => `<span class="ev ${CAT[e.tipo] || CAT[e.categoria] || "ag"} ${held.has(e.ticker) ? "meu" : ""}" title="${e.ticker} · ${e.tipo} · ${e.status}${e.valor ? " · R$ " + U.num(e.valor, 2) : ""}">${e.ticker} <span>${e.tipo === "Pagamento" ? "💰" : e.tipo === "Data-com" ? "📌" : e.tipo === "Data ex" ? "✂️" : e.categoria === "Resultado" ? "📊" : "🗳️"}</span></span>`).join("")}${l.length > 3 ? `<span class="small muted">+${l.length - 3}</span>` : ""}</div>`; }).join("")}</div>
          <div class="cal-leg"><span class="ev com">📌 Data-com: último dia para ter direito</span><span class="ev ex">✂️ Data ex</span><span class="ev pag">💰 Pagamento</span><span class="ev res">📊 Resultado</span><span class="ev ag">🗳️ Assembleia</span></div></section>`;
      } else if (aba === "assembleias") corpo = V.assembleias.html(ctx).replace(/<div class="page-head">[\s\S]*?<\/div><\/div>/, "");
      return `<div class="page-head"><div><h1>Proventos</h1><p>Dividendos, JCP e rendimentos — o que caiu, o que vai cair e quando</p></div></div>${sub("proventos", aba, abas)}${corpo}`;
    },
    after(ctx) {
      const { r, params } = ctx, aba = params[0] || "";
      if (!aba) {
        const meses = {}; r.prov.forEach((p) => { const k = p.data.slice(0, 7); meses[k] = meses[k] || [0, 0]; meses[k][p.recebido ? 0 : 1] += p.valor; });
        const ks = Object.keys(meses).sort().slice(-13);
        CH.barras(document.getElementById("chProv"), ks.map((k) => ({ rotulo: U.mesAno(k + "-01"), valores: meses[k] })), [{ nome: "Pago", cor: "#0e7c86" }, { nome: "Anunciado", cor: "#c27c0e", hachura: true }], { fmtY, altura: 260 });
        barrasH(document.getElementById("chRank"), (ctx._rank || []).map(([tk, v]) => ({ rot: tk, v })));
      }
      if (aba === "calendario") {
        document.querySelectorAll("[data-mes]").forEach((b) => b.addEventListener("click", () => { const [y, m] = (mesCal || M.BASE.slice(0, 7)).split("-").map(Number); const d = new Date(Date.UTC(y, m - 1 + +b.dataset.mes, 1)); mesCal = d.toISOString().slice(0, 7); window.APP.render(); }));
        document.getElementById("calMeus").addEventListener("change", (e) => { U.store.set("cal:meus", e.target.checked); window.APP.render(); });
      }
      if (aba === "assembleias" && V.assembleias.after) V.assembleias.after(ctx);
    },
  };
})(window.VIEWS);
