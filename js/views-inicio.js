/* V2 — Início, Carteira e Proventos (análises em gráfico; tabelas só em Relatórios). */
window.VIEWS = window.VIEWS || {};
(function (V) {
  const U = window.U, C = window.CATALOGO, M = window.MERCADO, CH = window.CH, D = window.B3DATA, K = window.CONSOL, CR = window.CRIPTO;

  // ---------- helpers compartilhados ----------
  const fmtY = (v, eixo) => (U.state.hide ? (eixo ? "•••" : "R$ ••••") : eixo ? U.compacto(v) : U.brl(v));
  const fmtPctY = (v, eixo) => (eixo ? U.num(v, 0) + "%" : (v >= 0 ? "+" : "") + U.num(v, 2) + "%");
  const linkAtivo = (tk) => `<a class="tk" href="#/ativo/${U.slug(tk)}">${U.esc(tk)}</a>`;
  const fonte = (extra = "") => `<div class="card-f"><span>Fontes: B3, corretoras e carteiras conectadas</span>·<span>Posição de ${U.data(D.dataBase)}</span>${extra ? "·<span>" + extra + "</span>" : ""}</div>`;
  const kpi = (lbl, val, det, info) => `<div class="card kpi"><div class="lbl">${lbl}${info ? U.info(info) : ""}</div><div class="val">${val}</div><div class="det">${det}</div></div>`;
  const sub = (base, atual, abas) => `<nav class="subtabs" aria-label="Seções de ${base}">${abas.map(([k, t]) => `<a href="#/${base}${k ? "/" + k : ""}" class="${atual === k ? "on" : ""}" ${atual === k ? 'aria-current="page"' : ""}>${t}</a>`).join("")}</nav>`;
  const corItem = (x) => (x.tipo === "cripto" ? CR.MOEDAS[x.cod].cor : K.CORES[x.classe] || "#06377b");
  // Ações, FIIs, ETFs e ETFs de Criptomoedas têm logo (icons.brapi.dev) e mostram o nome da empresa ao passar o mouse
  const temLogo = (x) => x.tipo === "cripto" || (x.tipo === "b3" && x.classe === "Renda variavel");
  const emp = (x) => (temLogo(x) ? ` data-emp="${U.esc(x.cod)}"` : "");
  const logo = (x, semEmp) => `<span class="lg" style="background:${corItem(x)}"${semEmp ? "" : emp(x)}>${U.esc(x.tipo === "rf" ? x.cod.slice(0, 3).toUpperCase() : x.cod.replace("Tesouro ", "TD").slice(0, 4))}${temLogo(x) ? `<img src="https://icons.brapi.dev/icons/${encodeURIComponent(x.cod)}.svg" alt="" loading="lazy" onerror="this.remove()">` : ""}</span>`;
  const hrefItem = (x) => (x.tipo === "b3" ? "#/ativo/" + U.slug(x.cod) : x.tipo === "cripto" ? "#/mercado/meus/" + x.cod : "#/carteira/ativos");
  const per = () => U.store.get("periodo", "30D");
  const PER_TXT = { "7D": "nos últimos 7 dias", "30D": "nos últimos 30 dias", "6M": "nos últimos 6 meses", "12M": "nos últimos 12 meses", "24M": "nos últimos 24 meses" };
  const perTxt = (p, id) => PER_TXT[p] || `desde que começou a investir, em ${U.MESES[+K.inicio(id).data.slice(5, 7) - 1]}/${K.inicio(id).data.slice(0, 4)}`;
  // botões de período (Início e Carteira → Rentabilidade)
  const segPer = (p) => `<div class="seg seg-per" role="group" aria-label="Período">${Object.keys(K.PERIODOS).map((k) => `<button data-per="${k}" aria-pressed="${k === p}">${K.ROTULO_PER[k] || k}</button>`).join("")}</div>`;
  // datas no eixo do gráfico: com o ano quando o período passa de 1 ano
  const fmtXPer = (p) => (d, l) => (l ? U.data(d) : p === "24M" || p === "TUDO" ? U.mesAno(d) : U.dataCurta(d));
  const sinalBrl = (v) => (U.state.hide ? "R$ ••••" : (v >= 0 ? "+" : "−") + U.brl(Math.abs(v)).replace("-", ""));
  Object.assign(V, { _fmtY: fmtY, _linkAtivo: linkAtivo, _fonte: fonte, _kpi: kpi, _sub: sub, _logo: logo, _hrefItem: hrefItem, _corItem: corItem });

  // ---------- Tabela de ativos (Carteira → Todos os investimentos) ----------
  // Preço médio, data de entrada e proventos vêm de RENT.posicao (simulados, estáveis por investidor e ativo)
  const GRUPOS_RV = [["Ações", (x) => x.tipo === "b3" && x.sub === "Acoes"], ["FIIs", (x) => x.tipo === "b3" && x.sub === "FII"], ["ETFs", (x) => x.tipo === "b3" && x.sub === "ETF"], ["ETFs de Criptomoedas", (x) => x.tipo === "cripto"]];
  const COLS = [["Ativo"], ["Preço médio", 1], ["Preço atual", 1], ["Quant.", 1], ["Patr. atual", 1], ["Var. hoje", 1], ["Var. total", 1, "Só a variação do preço desde a compra (preço atual ÷ preço médio)."], ["Rent. c/ proventos", 1, "Variação do preço + proventos recebidos (dividendos, JCP e rendimentos), sobre o preço médio. Ex.: subiu 10% e pagou 10% em proventos = 20%. Passe o mouse no valor para ver os proventos."], ["% na cart.", 1]];
  const preco = (v) => "R$ " + U.num(v, 2);
  const duo = (topo, v) => `${topo}<small>${U.sinal(v)}</small>`;
  const naoDistribui = '<span class="muted">—</span><small class="muted">não distribui</small>';

  function tabelaAtivos(id, titulo, g, total) {
    if (!g.length) return "";
    const ls = g.map((x) => {
      const rp = window.RENT.posicao(id, x), dia = x.tipo === "cripto" ? CR.MOEDAS[x.cod].ch.d1 : M.cotacoes[x.cod].var, custo = rp.pm * x.q;
      return { x, rp, custo, dia, hoje: x.valor - x.valor / (1 + dia / 100), tot: x.valor - custo };
    });
    const soma = (f) => ls.reduce((a, l) => a + f(l), 0);
    const valor = soma((l) => l.x.valor), custo = soma((l) => l.custo), hoje = soma((l) => l.hoje), tot = soma((l) => l.tot), prov = soma((l) => l.rp.provR), pct = (valor / total) * 100;
    const algumDistribui = ls.some((l) => l.rp.distribui);
    const linhas = ls.map((l) => {
      const { x, rp } = l, tk = U.esc(x.cod);
      const menu = `<details class="acao"><summary aria-label="Opções para ${tk}">⋮</summary><div class="acao-menu">${x.tipo === "b3" ? `<a href="#/ativo/${U.slug(x.cod)}">Ver ficha do ativo</a>` : ""}<a href="#/mercado/meus/${U.slug(x.cod)}">Ver gráfico</a><button type="button" data-ask="Como está meu investimento em ${tk}?">✦ Perguntar à IA</button></div></details>`;
      const ord = [x.cod, rp.pm, rp.preco, x.q, x.valor, l.hoje, l.tot, rp.distribui ? rp.total : -1e9, x.pct];
      // proventos recebidos aparecem num popup ao passar o mouse (ou focar) na rentabilidade c/ proventos
      const prov = `data-prov="${tk}" data-prov-un="${x.sub === "Acoes" ? "ação" : "cota"}" data-prov-r="${rp.provR}" data-prov-cota="${rp.provCota}" data-prov-pct="${rp.provPct}" data-prov-n="${rp.nProv}" data-prov-preco="${rp.preco}" data-prov-total="${rp.total}" data-prov-desde="${rp.entrada || ""}"`;
      return `<tr data-ord='${JSON.stringify(ord)}'><td><a class="tk-cell" href="${hrefItem(x)}" data-emp="${tk}">${logo(x, true)}<b>${tk}</b></a></td>
        <td class="num">${preco(rp.pm)}${rp.entrada ? `<small class="muted">desde ${U.data(rp.entrada)}</small>` : ""}</td><td class="num">${duo(preco(x.preco), rp.preco)}</td><td class="num">${U.qtd(x.q)}</td><td class="num">${U.brl(x.valor)}</td>
        <td class="num">${duo(U.brl(l.hoje), l.dia)}</td><td class="num">${duo(U.brl(l.tot), rp.preco)}</td>
        <td class="num rent-prov">${rp.distribui ? `<span class="prov-alvo" tabindex="0" ${prov}>${duo(U.brl(l.tot + rp.provR), rp.total)}</span>` : naoDistribui}</td><td class="num">${U.num(x.pct, 2)}%</td><td>${menu}</td></tr>`;
    }).join("");
    return `<section class="card section"><div class="grp-h">
        <div class="grp-t"><h2>${titulo}</h2><span class="muted">${g.length} ${g.length === 1 ? "ativo" : "ativos"}</span></div>
        <div class="grp-kpi"><span class="lbl">Variação total</span>${U.sinal(custo ? (tot / custo) * 100 : 0)}<span class="small">${U.brl(tot)}</span></div>
        ${algumDistribui ? `<div class="grp-kpi"><span class="lbl">Com proventos</span>${U.sinal(custo ? ((tot + prov) / custo) * 100 : 0)}<span class="small">${U.brl(tot + prov)} · ${U.brl(prov)} em proventos</span></div>` : ""}
        <div class="grp-kpi"><span class="lbl">Variação hoje</span>${U.sinal((hoje / (valor - hoje)) * 100)}<span class="small">${U.brl(hoje)}</span></div>
        <div class="grp-kpi grp-tot"><span class="lbl">${U.brl(valor)}</span><b>${U.num(pct, 2)}% da carteira</b><div class="bar"><i style="width:${pct}%;background:var(--b3)"></i></div></div>
      </div>
      <div class="tbl-wrap"><table class="tbl-ativos"><thead><tr>${COLS.map(([t, n, info], i) => `<th class="${n ? "num" : ""}"><button type="button" class="th-sort" data-col="${i}">${t} <span aria-hidden="true">↕</span></button>${info ? U.info(info, t) : ""}</th>`).join("")}<th>Ação</th></tr></thead><tbody>${linhas}</tbody></table></div></section>`;
  }

  // Ordena a tabela pela coluna clicada (clicar de novo inverte)
  function ordenaTabelas() {
    document.querySelectorAll(".tbl-ativos .th-sort").forEach((b) => b.addEventListener("click", () => {
      const th = b.closest("th"), tb = b.closest("table").tBodies[0], col = +b.dataset.col;
      const asc = th.getAttribute("aria-sort") !== "ascending";
      b.closest("tr").querySelectorAll("th").forEach((t) => t.removeAttribute("aria-sort"));
      th.setAttribute("aria-sort", asc ? "ascending" : "descending");
      [...tb.rows].sort((r1, r2) => { const a = JSON.parse(r1.dataset.ord)[col], z = JSON.parse(r2.dataset.ord)[col]; return (typeof a === "string" ? a.localeCompare(z) : a - z) * (asc ? 1 : -1); }).forEach((r) => tb.appendChild(r));
    }));
    // menu "⋮": abre por cima da tabela (a rolagem horizontal cortaria o menu)
    document.querySelectorAll("details.acao").forEach((d) => d.addEventListener("toggle", () => {
      if (!d.open) return;
      document.querySelectorAll("details.acao[open]").forEach((o) => o !== d && (o.open = false));
      const r = d.querySelector("summary").getBoundingClientRect(), m = d.querySelector(".acao-menu");
      m.style.top = r.bottom + 4 + "px"; m.style.left = Math.max(8, r.right - m.offsetWidth) + "px";
    }));
  }

  function posLista(its, n, per) {
    const contrib = per ? Object.fromEntries(K.contribuicao(window.APP.id(), per).map((c) => [c.cod, c])) : {};
    return `<div class="pos-list">${its.slice(0, n).map((x) => { const c = contrib[x.cod]; return `<a class="pos" href="${hrefItem(x)}">${logo(x)}<div class="nm"><b${emp(x)}>${U.esc(x.tipo === "rf" ? x.nome : x.cod)}</b><span>${U.esc(x.tipo === "rf" ? (x.classe === "Fundos" ? "Fundos" : "Renda fixa") + " · " + x.instTxt : x.nome)}</span><div class="bar"><i style="width:${Math.max(2, x.pct)}%;background:${corItem(x)}"></i></div></div>
      <div class="vl"><b>${U.brl(x.valor)}</b><span class="small muted">${U.num(x.pct, 1)}%</span>${c ? `<div>${U.sinal(c.pctVar)}</div>${c.provR ? `<div class="small" title="Com os proventos recebidos no período">c/ prov. ${U.sinal(c.pctProv)}</div>` : ""}` : ""}</div></a>`; }).join("")}</div>`;
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
            <div class="lbl">Saldo total da carteira ${U.info("Soma de tudo o que está nas suas contas conectadas: B3 (ações, FIIs, ETFs, Tesouro), renda fixa e fundos das corretoras e seus ETFs de Criptomoedas.")}</div>
            <div class="saldo">${U.brl(res.fim)}</div>
            <div class="ganho ${up ? "up" : "down"}" data-tour="ganho"><span aria-hidden="true">${up ? "▲" : "▼"}</span> ${sinalBrl(res.ganho)} <span style="opacity:.85">(${up ? "+" : ""}${U.num(res.pct, 2)}%)</span></div>
            <div class="hero-sub">${up ? "Você ganhou" : "Sua carteira caiu"} ${perTxt(p, id)} ${U.info("Variação de mercado da sua carteira atual no período: quanto os seus investimentos valorizaram ou desvalorizaram. Não conta dinheiro novo que você colocou ou tirou.", "Como calculamos")}</div>
            <div style="margin-top:16px">${segPer(p)}</div>
          </div>
          <div class="chart" id="chHero" style="min-height:200px"></div>
        </div>
        <div class="hero-mini"><div>Na B3 e corretoras<b>${U.brl(res.fim - cr)}</b></div>${cr ? `<div>ETFs de Criptomoedas<b>${U.brl(cr)}</b></div>` : ""}<div>Proventos a receber<b>${U.brl(anu)}</b></div></div>
      </section>
      ${r.pendInst ? `<div class="alert section"><span class="ic">⚠️</span><div><b>${r.pendInst} ainda não atualizou sua posição.</b><p>O saldo usa a última posição recebida (19/11). <a href="#/conta/contas">Ver o que falta</a></p></div></div>` : ""}
      <section class="card section" data-tour="carteira"><div class="card-h"><div><h2>Minha carteira</h2><div class="sub">Como seu dinheiro está dividido</div></div><a class="btn sm" href="#/carteira">Ver carteira completa →</a></div>
        <div class="alloc"><div><div id="dHome" style="display:grid;place-items:center"></div><div class="legend-big" style="margin-top:14px">${classes.map((c) => `<div class="row"><span class="dot" style="background:${c.cor}"></span>${c.nome}<b>${U.num(c.pct, 1)}%</b></div>`).join("")}</div></div>
          <div>${posLista(its, 6, p)}${its.length > 6 ? `<a class="small" href="#/carteira/ativos" style="display:block;margin:8px 10px 0">+ ${its.length - 6} investimentos</a>` : ""}</div></div>
      </section>
      <div class="grid g2 section">
        <section class="card"><div class="card-h"><div><h2>O que mais mexeu no resultado</h2><div class="sub">Ganho ou perda em reais ${perTxt(p, id)}</div></div></div><div class="chart" id="chContrib"></div></section>
        <section class="card"><div class="card-h"><div><h2>Próximos recebimentos</h2><div class="sub">Proventos já anunciados</div></div><a href="#/proventos" class="small">Ver todos</a></div>
          ${prox.length ? prox.map((x) => `<div class="list-item"><div class="date-box"><b>${x.data.slice(8)}</b><span>${U.MESES[+x.data.slice(5, 7) - 1]}</span></div><div class="grow"><div class="t">${x.tk}</div><div class="s">${U.rotuloProv(x.tp)} · anunciado</div></div><b class="num">${U.brl(x.valor)}</b></div>`).join("") : '<div class="empty"><div class="big">🗓️</div>Nenhum provento anunciado agora.</div>'}</section>
      </div>
      ${vistos < 2 ? `<section class="card section" style="display:flex;gap:18px;align-items:center;flex-wrap:wrap"><span style="font-size:42px" aria-hidden="true">🎬</span><div style="flex:1;min-width:220px"><h2>Começando a investir?</h2><p class="muted" style="margin:4px 0 0">Vídeos de 1 minuto, simples e divertidos, explicam o básico. Termine com um quiz rápido.</p></div><a class="btn primary" href="#/aprender">Assistir agora</a></section>` : ""}`;
    },
    after({ id }) {
      const p = per(), res = K.resultado(id, p), up = res.ganho >= 0;
      CH.linha(document.getElementById("chHero"), { series: [{ nome: "Saldo", cor: up ? "#8ff0b5" : "#ffb4ad", pontos: res.serie }], area: true, fmtY, fmtX: fmtXPer(p), altura: 210, label: "Evolução do saldo no período" });
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
        const tipos = {}; its.forEach((x) => { const k = x.tipo === "cripto" ? "ETFs de Criptomoedas" : U.rotuloTipo(x.sub); tipos[k] = (tipos[k] || 0) + x.valor; });
        corpo = `<div class="grid g2">
          <section class="card"><div class="card-h"><div><h2>Por classe</h2><div class="sub">Quanto de cada tipo de investimento</div></div></div><div class="alloc" style="grid-template-columns:1fr"><div id="dCl" style="display:grid;place-items:center"></div><div class="legend-big">${K.porClasse(id).map((c) => `<div class="row"><span class="dot" style="background:${c.cor}"></span>${c.nome}<b>${U.brl(c.valor)} · ${U.num(c.pct, 1)}%</b></div>`).join("")}</div></div></section>
          <section class="card"><div class="card-h"><div><h2>Por conta</h2><div class="sub">Corretoras e bancos conectados</div></div><a class="small" href="#/conta/contas">Gerenciar</a></div>
            ${inst.map((i) => `<div style="margin-bottom:16px"><div style="display:flex;justify-content:space-between;margin-bottom:6px;gap:8px"><span><b>${i.nome}</b> <span class="small muted">${i.tipo}</span> ${i.nome === r.pendInst ? '<span class="chip warn">aguardando</span>' : ""}</span><b class="num">${U.brl(i.valor)}</b></div><div class="bar" style="height:10px"><i style="width:${i.pct}%;background:${i.cor}"></i></div></div>`).join("")}</section>
        </div>
        <section class="card section"><div class="card-h"><div><h2>Por tipo de produto</h2></div></div><div class="chart" id="chTipos"></div></section>`;
        ctx._tipos = tipos;
      } else if (aba === "rentabilidade") {
        const comProv = U.store.get("contrib:prov", true);
        corpo = `<section class="card"><div class="card-h"><div><h2>Rentabilidade × índices</h2><div class="sub">Últimos 12 meses, já descontando aportes e resgates (método Dietz) ${U.info("Retorno mensal = (valor final − valor inicial − aportes) ÷ (valor inicial + metade dos aportes), meses encadeados. A linha “com proventos” soma os dividendos, JCP e rendimentos recebidos no mês. Índices simulados neste protótipo; S&P 500 em reais, pela cota do IVVB11.")}</div></div></div>
            <div class="idx-sel" role="group" aria-label="Comparar com"><span class="lbl">Comparar com:</span>${Object.entries(window.RENT.INDICES).map(([k, ix]) => `<button type="button" class="chip-tg" data-idx="${k}" aria-pressed="false" title="${ix.desc}"><i style="background:${ix.cor}"></i>${ix.nome}</button>`).join("")}</div>
            <div class="chart" id="chRent"></div></section>
          <div class="grid g4 section" id="kpiRent"></div>
          <section class="card section"><div class="card-h"><div><h2>Quem ganhou e quem perdeu</h2><div class="sub">Contribuição de cada investimento ${perTxt(p, id)}${comProv ? ", somando os proventos" : ""}</div></div><div style="display:flex;gap:8px;flex-wrap:wrap"><div class="seg" role="group" aria-label="Proventos"><button data-cprov="0" aria-pressed="${!comProv}">Só preço</button><button data-cprov="1" aria-pressed="${comProv}">Com proventos</button></div>${segPer(p)}</div></div><div id="chContrib2"></div></section>`;
      } else if (aba === "ativos") {
        const total = its.reduce((a, x) => a + x.valor, 0);
        const grupos = [["Tesouro Direto", (x) => x.classe === "Tesouro Direto"], ["Renda fixa e fundos", (x) => x.tipo === "rf"]];
        corpo = GRUPOS_RV.map(([t, f]) => tabelaAtivos(id, t, its.filter(f), total)).join("") + grupos.map(([t, f]) => { const g = its.filter(f); if (!g.length) return ""; const tot = g.reduce((a, x) => a + x.valor, 0); return `<section class="card section"><div class="card-h"><h2>${t}</h2><b class="num">${U.brl(tot)}</b></div><div class="grid g2">${g.map((x) => { const cot = x.tipo === "b3" ? M.cotacoes[x.cod] : null; return `<a class="pos" href="${hrefItem(x)}" style="border:1px solid var(--line)">${logo(x)}<div class="nm"><b${emp(x)}>${U.esc(x.tipo === "rf" ? x.nome : x.cod)}</b><span>${U.esc(x.tipo === "rf" ? x.instTxt : x.nome)}</span></div><div class="vl"><b>${U.brl(x.valor)}</b>${cot ? CH.spark(cot.serie.slice(-60).map((s) => s[1]), cot.var12m >= 0 ? "#16a34a" : "#dc2626", 90, 24) : x.tipo === "cripto" ? U.sinal(CR.MOEDAS[x.cod].ch.d30) : '<span class="small muted">rende ~CDI</span>'}</div></a>`; }).join("")}</div></section>`; }).join("") + '<p class="small muted">Preço médio simulado neste protótipo. Para exportar a posição completa, use <a href="#/relatorios">Relatórios</a>.</p>';
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
        CH.rosca(document.getElementById("dCl"), K.porClasse(id), { centro: U.state.hide ? "•••" : U.compacto(K.itens(id).reduce((a, x) => a + x.valor, 0)), sub: "total em R$" });
        const t = Object.entries(ctx._tipos || {}).sort((a, b) => b[1] - a[1]);
        CH.barras(document.getElementById("chTipos"), t.map(([k, v]) => ({ rotulo: k, valores: [v] })), [{ nome: "Valor", cor: "#06377b" }], { fmtY, altura: 230 });
      }
      if (aba === "rentabilidade") {
        // índices escolhidos (vários de uma vez ou só um); a escolha fica salva neste navegador
        const RT = window.RENT, datas = r.rent.map((p) => p[0]);
        const desenha = () => {
          const sel = U.store.get("rent:idx2", ["cdi", "ibov", "usd"]).filter((k) => RT.INDICES[k]);
          document.querySelectorAll("[data-idx]").forEach((b) => b.setAttribute("aria-pressed", String(sel.includes(b.dataset.idx))));
          const linhas = [{ nome: "Sua carteira", cor: "#06377b", pontos: r.rent, desc: "Só a variação do patrimônio" }, { nome: "Sua carteira + proventos", cor: "#137a43", pontos: r.rentProv, desc: "Somando dividendos, JCP e rendimentos" }]
            .concat(sel.map((k) => ({ nome: RT.INDICES[k].nome, cor: RT.INDICES[k].cor, pontos: RT.acumulado(k, datas), tracejado: true, desc: RT.INDICES[k].desc })));
          CH.linha(document.getElementById("chRent"), { series: linhas, fmtY: fmtPctY, fmtX: (d, l) => (l ? U.data(d) : U.mesAno(d)), altura: 300 });
          document.getElementById("kpiRent").innerHTML = linhas.map((l) => kpi(`<i class="kpi-dot" style="background:${l.cor}"></i>${l.nome} (12m)`, U.sinal(l.pontos.at(-1)[1]), l.desc)).join("");
        };
        document.querySelectorAll("[data-idx]").forEach((b) => b.addEventListener("click", () => {
          const sel = U.store.get("rent:idx2", ["cdi", "ibov", "usd"]), k = b.dataset.idx;
          U.store.set("rent:idx2", sel.includes(k) ? sel.filter((x) => x !== k) : sel.concat(k)); desenha();
        }));
        desenha();
        const comProv = U.store.get("contrib:prov", true);
        const ct = K.contribuicao(id, per()).map((c) => Object.assign(c, { v: comProv ? c.ganhoProv : c.ganho })).sort((a, b) => b.v - a.v);
        barrasH(document.getElementById("chContrib2"), ct.map((c) => ({ rot: c.tipo === "rf" ? c.nome : c.cod, v: c.v })));
        document.querySelectorAll("[data-cprov]").forEach((b) => b.addEventListener("click", () => { U.store.set("contrib:prov", b.dataset.cprov === "1"); window.APP.render(); }));
        document.querySelectorAll("[data-per]").forEach((b) => b.addEventListener("click", () => { U.store.set("periodo", b.dataset.per); window.APP.render(); }));
      }
      if (aba === "ativos") ordenaTabelas();
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
