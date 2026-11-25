/* App B3 Investidor (PWA) — mesma base de dados, cálculos e visual do site, em formato de aplicativo.
 * Telas: login (Face ID simulado) · Início · Carteira · Proventos · Mercado · Mais (Aprender, Perfil, Relatórios, Ajustes)
 * e telas empilhadas: detalhe do ativo e questionário de perfil.
 */
(function () {
  const D = window.B3DATA, C = window.CATALOGO, U = window.U, M = window.MERCADO, CH = window.CH, K = window.CONSOL, CR = window.CRIPTO, RT = window.RENT, P = window.PROV || window.PROVENTOS, F = window.FEED, VD = window.VIDEOS;
  const DEFAULT_INV = "INV-035";
  const qs = new URLSearchParams(location.search).get("inv");
  if (qs && D.investidores[qs]) U.store.set("inv", qs);
  let invId = U.store.get("inv", DEFAULT_INV); if (!D.investidores[invId]) invId = DEFAULT_INV;
  const $ = (s) => document.querySelector(s);

  // ---------- ícones ----------
  const ic = (d, w = 22) => `<svg width="${w}" height="${w}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const I = {
    inicio: ic('<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>'),
    carteira: ic('<path d="M21 12A9 9 0 1 1 12 3v9z"/><path d="M15 3.5A9 9 0 0 1 20.5 9H15z"/>'),
    proventos: ic('<circle cx="12" cy="12" r="9"/><path d="M14.5 9.5c-.5-1-1.5-1.5-2.5-1.5-1.5 0-2.5.8-2.5 2s1 1.6 2.5 2 2.5.8 2.5 2-1 2-2.5 2c-1.2 0-2.2-.6-2.6-1.6M12 6v2m0 8v2"/>'),
    mercado: ic('<path d="M3 3v18h18"/><path d="m7 15 4-4 3 3 6-6"/>'),
    mais: ic('<circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>'),
    olho: ic('<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>', 20),
    sino: ic('<path d="M6 8a6 6 0 0 1 12 0c0 7 3 8 3 8H3s3-1 3-8"/><path d="M10.3 20a2 2 0 0 0 3.4 0"/>', 20),
    voltar: ic('<path d="m15 18-6-6 6-6"/>', 24),
    chev: ic('<path d="m9 18 6-6-6-6"/>', 18),
  };
  const TABS = [["inicio", "Início"], ["carteira", "Carteira"], ["proventos", "Proventos"], ["mercado", "Mercado"], ["mais", "Mais"]];
  // rotas do site (usadas pela assistente) → telas do app
  const ALIAS = { "visao-geral": "inicio", aprender: "mais/aprender", relatorios: "mais/relatorios", conta: "mais", "para-voce": "mais/aprender", calendario: "proventos", recebimentos: "proventos", tutoriais: "mais" };

  // ---------- helpers visuais (mesmo padrão do site) ----------
  const fmtY = (v, eixo) => (U.state.hide ? (eixo ? "•••" : "R$ ••••") : eixo ? (Math.abs(v) >= 1e6 ? U.num(v / 1e6, 1) + " mi" : Math.abs(v) >= 1e3 ? U.num(v / 1e3, 0) + " mil" : U.num(v, 0)) : U.brl(v));
  const fmtPctY = (v, eixo) => (eixo ? U.num(v, 0) + "%" : (v >= 0 ? "+" : "") + U.num(v, 2) + "%");
  const cor = (x) => (x.tipo === "cripto" ? (CR.MOEDAS[x.cod] || {}).cor || "#f7931a" : K.CORES[x.classe] || "#06377b");
  const temLogo = (x) => x.tipo === "b3" && x.classe !== "Tesouro Direto";
  const logo = (x) => `<span class="lg" style="background:${cor(x)}">${U.esc(x.tipo === "rf" ? x.cod.slice(0, 3).toUpperCase() : x.cod.replace("Tesouro ", "TD").slice(0, 4))}${temLogo(x) ? `<img src="https://icons.brapi.dev/icons/${encodeURIComponent(x.cod)}.svg" alt="" loading="lazy" onerror="this.remove()">` : ""}</span>`;
  const sinalBrl = (v) => (U.state.hide ? "R$ ••••" : (v >= 0 ? "+" : "−") + U.brl(Math.abs(v)));
  const nomeItem = (x) => (x.tipo === "rf" ? x.nome : x.cod);
  const per = () => U.store.get("periodo", "30D");
  const PER_TXT = { "7D": "nos últimos 7 dias", "30D": "nos últimos 30 dias", "6M": "nos últimos 6 meses", "12M": "nos últimos 12 meses", "24M": "nos últimos 24 meses", TUDO: "desde o começo" };
  const linhaItem = (x, dir) => `<a class="ap-row" href="${x.tipo === "rf" ? "#/carteira" : "#/ativo/" + U.slug(x.cod)}">${logo(x)}<div class="grow"><b>${U.esc(nomeItem(x))}</b><span>${U.esc(x.tipo === "rf" ? x.instTxt || "" : x.nome)}</span></div><div class="ap-right">${dir}</div></a>`;
  function variacoes(x) {
    if (x.tipo === "cripto") { const ch = (CR.MOEDAS[x.cod] || {}).ch || {}; return { d1: ch.d1 ?? 0, d7: ch.d7 ?? 0, d30: ch.d30 ?? 0 }; }
    const c = M.cotacoes[x.cod]; if (!c) return null; const s = c.serie, L = s.length, v = (n) => (s[L - 1][1] / s[L - 1 - n][1] - 1) * 100;
    return { d1: c.var, d7: v(5), d30: v(21) };
  }
  const rvItens = (id) => K.itens(id).filter((x) => (x.tipo === "b3" && x.classe !== "Tesouro Direto" && M.cotacoes[x.cod]) || x.tipo === "cripto");
  const seg = (attr, atual, opcoes) => `<div class="seg ap-seg" role="group">${opcoes.map(([k, t]) => `<button data-${attr}="${k}" aria-pressed="${k === atual}">${t}</button>`).join("")}</div>`;
  const sec = (titulo, link, corpo) => `<section class="ap-sec"><div class="ap-sec-h"><h2>${titulo}</h2>${link || ""}</div>${corpo}</section>`;

  // ======================================================================
  // TELAS
  // ======================================================================
  const T = {};

  // ---------- Login (Face ID simulado) ----------
  T.login = {
    semAbas: true,
    html: () => `<div class="ap-login"><img src="../assets/b3-logo.png" alt="B3" class="ap-login-logo"><h1>Área do Investidor</h1><p>Tudo o que você tem, em um só lugar.</p>
      <button class="ap-faceid" id="faceId" aria-label="Entrar com Face ID"><span class="ap-face">${ic('<path d="M7 3H5a2 2 0 0 0-2 2v2M17 3h2a2 2 0 0 1 2 2v2M7 21H5a2 2 0 0 1-2-2v-2M17 21h2a2 2 0 0 0 2-2v-2"/><path d="M9 9v1M15 9v1M12 9v4h-1M9 16c1.7 1.3 4.3 1.3 6 0"/>', 54)}</span><b>Entrar com Face ID</b></button>
      <button class="btn ap-cpf" id="entrarCpf">Entrar com CPF e senha</button><p class="small muted">Protótipo · dados de teste · não é o app oficial</p></div>`,
    after() {
      const entrar = (btn) => { btn.classList.add("lendo"); setTimeout(() => { U.store.set("app:logado", true); go("#/inicio"); }, 900); };
      $("#faceId").onclick = (e) => entrar(e.currentTarget);
      $("#entrarCpf").onclick = () => abrirSheet(`<h2>Entrar com CPF</h2><label class="ap-field">CPF<input inputmode="numeric" placeholder="000.000.000-00" id="cpfIn"></label><label class="ap-field">Senha<input type="password" placeholder="••••••" id="senhaIn"></label><button class="btn primary ap-full" id="cpfOk">Entrar</button><p class="small muted">Simulação: qualquer valor funciona. Não use dados reais.</p>`, () => { $("#cpfOk").onclick = () => { fecharSheet(); U.store.set("app:logado", true); go("#/inicio"); }; });
    },
  };

  // ---------- Início ----------
  T.inicio = {
    titulo: "Início",
    html({ id, r }) {
      const p = per(), res = K.resultado(id, p), up = res.ganho >= 0, its = K.itens(id), classes = K.porClasse(id);
      const rv = rvItens(id).map((x) => Object.assign({ x }, variacoes(x))).sort((a, b) => b.d1 - a.d1);
      const prox = (P ? P.lancamentos(id).filter((l) => l.status !== "pago") : r.anunciados.map((a) => ({ tk: a.tk, tipo: a.tp, liq: a.valor, pagamento: a.data }))).slice().sort((a, b) => (a.pagamento < b.pagamento ? -1 : 1)).slice(0, 3);
      return `<section class="hero ap-hero"><div class="lbl">Saldo total da carteira ${U.info("Soma de tudo o que está nas suas contas conectadas: B3, renda fixa e fundos das corretoras e ETFs de Criptomoedas.")}</div>
          <div class="saldo">${U.brl(res.fim)}</div>
          <div class="ganho ${up ? "up" : "down"}"><span aria-hidden="true">${up ? "▲" : "▼"}</span> ${sinalBrl(res.ganho)} <span style="opacity:.85">(${up ? "+" : ""}${U.num(res.pct, 2)}%)</span></div>
          <div class="hero-sub">${up ? "Você ganhou" : "Sua carteira caiu"} ${PER_TXT[p] || ""}</div>
          <div class="chart" id="chHero" style="margin-top:8px"></div>
          ${seg("per", p, Object.keys(K.PERIODOS).filter((k) => k !== "TUDO").map((k) => [k, k]))}</section>
        <div class="ap-acoes">${[["#/proventos", "💰", "Proventos"], ["#/carteira/rentabilidade", "📈", "Rentab."], ["#/mais/relatorios", "📄", "Extrato"], ["ia", "✦", "Pergunte"]].map(([h, e, t]) => h === "ia" ? `<button data-ask="Como está minha carteira hoje?"><span>${e}</span>${t}</button>` : `<a href="${h}"><span>${e}</span>${t}</a>`).join("")}</div>
        ${sec("Minha carteira", '<a href="#/carteira">Ver tudo</a>', `<div class="card ap-card"><div class="ap-donut"><div id="dHome"></div><div class="legend-big">${classes.map((c) => `<div class="row"><span class="dot" style="background:${c.cor}"></span>${c.nome}<b>${U.num(c.pct, 1)}%</b></div>`).join("")}</div></div>
          ${its.slice(0, 4).map((x) => linhaItem(x, `<b>${U.brl(x.valor)}</b><span>${U.num(x.pct, 1)}%</span>`)).join("")}</div>`)}
        ${rv.length ? sec("Seus ativos hoje", '<a href="#/mercado">Ver todos</a>', `<div class="card ap-card"><div class="ap-duo"><div class="alert ok"><span class="ic">📈</span><div><b>${U.esc(rv[0].x.cod)}</b><p>${U.sinal(rv[0].d1)}</p></div></div><div class="alert"><span class="ic">📉</span><div><b>${U.esc(rv.at(-1).x.cod)}</b><p>${U.sinal(rv.at(-1).d1)}</p></div></div></div>
          ${rv.slice(0, 4).map((l) => linhaItem(l.x, `${U.sinal(l.d1)}<span>hoje</span>`)).join("")}</div>`) : ""}
        ${sec("Próximos recebimentos", '<a href="#/proventos">Ver todos</a>', `<div class="card ap-card">${prox.length ? prox.map((l) => `<div class="list-item"><div class="date-box"><b>${l.pagamento.slice(8)}</b><span>${U.MESES[+l.pagamento.slice(5, 7) - 1]}</span></div><div class="grow"><div class="t">${U.esc(l.tk)}</div><div class="s">${U.esc(U.rotuloProv(l.tipo))}</div></div><b class="num">${U.brl(l.liq)}</b></div>`).join("") : '<div class="muted">Nenhum provento anunciado agora.</div>'}</div>`)}`;
    },
    after({ id }) {
      const p = per(), res = K.resultado(id, p), up = res.ganho >= 0;
      CH.linha($("#chHero"), { series: [{ nome: "Saldo", cor: up ? "#8ff0b5" : "#ffb4ad", pontos: res.serie }], area: true, fmtY, fmtX: (d, l) => (l ? U.data(d) : U.dataCurta(d)), altura: 150, label: "Evolução do saldo" });
      CH.rosca($("#dHome"), K.porClasse(id), { centro: String(K.porClasse(id).length), sub: "classes" });
      document.querySelectorAll("[data-per]").forEach((b) => (b.onclick = () => { U.store.set("periodo", b.dataset.per); render(); }));
    },
  };

  // ---------- Carteira ----------
  T.carteira = {
    titulo: "Carteira",
    html({ id, r, params }) {
      const aba = params[0] || "ativos", its = K.itens(id), total = its.reduce((a, x) => a + x.valor, 0);
      let corpo = "";
      if (aba === "ativos") {
        const rfModo = U.store.get("rf:modo", "junto"), ehRF = (x) => x.classe === "Tesouro Direto" || (x.tipo === "rf" && x.classe === "Renda fixa");
        const subs = [...new Set(its.filter((x) => x.tipo === "rf" && x.classe === "Renda fixa").map((x) => x.sub))];
        const grupos = [["Ações", (x) => x.tipo === "b3" && x.sub === "Acoes"], ["FIIs", (x) => x.tipo === "b3" && x.sub === "FII"], ["ETFs", (x) => x.tipo === "b3" && x.sub === "ETF"], ["ETFs de Criptomoedas", (x) => x.tipo === "cripto"]]
          .concat(rfModo === "junto" ? [["Renda fixa", ehRF]] : [["Tesouro Direto", (x) => x.classe === "Tesouro Direto"]].concat(subs.map((s) => [U.rotuloTipo(s), (x) => x.tipo === "rf" && x.classe === "Renda fixa" && x.sub === s])))
          .concat([["Fundos", (x) => x.classe === "Fundos"]]);
        corpo = (its.some(ehRF) ? `<div class="ap-rfmodo"><span class="small muted">Renda fixa:</span>${seg("rf", rfModo, [["junto", "Tudo junto"], ["produto", "Por produto"]])}</div>` : "") + grupos.map(([t, f]) => {
          const g = its.filter(f); if (!g.length) return ""; const tot = g.reduce((a, x) => a + x.valor, 0);
          return sec(t, `<span class="small muted">${U.brl(tot)} · ${U.num((tot / total) * 100, 1)}%</span>`, `<div class="card ap-card">${g.map((x) => {
            if (x.tipo === "rf" || x.classe === "Tesouro Direto") return linhaItem(x, `<b>${U.brl(x.valor)}</b><span>${U.num(x.pct, 1)}%</span>`);
            const rp = RT.posicao(id, x);
            return linhaItem(x, `<b>${U.brl(x.valor)}</b>${U.sinal(rp.total)}<span>PM R$ ${U.num(rp.pm, 2)}</span>`);
          }).join("")}</div>`);
        }).join("") + '<p class="small muted ap-nota">Variação desde a compra, somando proventos · preço médio simulado</p>';
      } else if (aba === "distribuicao") {
        const inst = K.porInstituicao(id);
        corpo = sec("Por classe", "", `<div class="card ap-card"><div class="ap-donut"><div id="dCl"></div><div class="legend-big">${K.porClasse(id).map((c) => `<div class="row"><span class="dot" style="background:${c.cor}"></span>${c.nome}<b>${U.num(c.pct, 1)}%</b></div>`).join("")}</div></div></div>`)
          + sec("Por conta", "", `<div class="card ap-card">${inst.map((i) => `<div style="margin:8px 0 14px"><div style="display:flex;justify-content:space-between;gap:8px;margin-bottom:6px"><span><b>${i.nome}</b> <span class="small muted">${i.tipo}</span></span><b class="num">${U.brl(i.valor)}</b></div><div class="bar" style="height:9px"><i style="width:${i.pct}%;background:${i.cor}"></i></div></div>`).join("")}</div>`);
      } else if (aba === "rentabilidade") {
        const sel = U.store.get("rent:idx2", ["cdi", "ibov", "usd"]).filter((k) => RT.INDICES[k]);
        const av = aportes(r), cresc = av.fim - av.ini;
        corpo = sec("Rentabilidade × índices", "", `<div class="card ap-card"><div class="idx-sel ap-idx">${Object.entries(RT.INDICES).map(([k, ix]) => `<button type="button" class="chip-tg" data-idx="${k}" aria-pressed="${sel.includes(k)}"><i style="background:${ix.cor}"></i>${ix.nome}</button>`).join("")}</div><div class="chart" id="chRent"></div>
            <div class="ap-kpis">${[["Sua carteira", r.rent.at(-1)[1], "#06377b"], ["+ proventos", r.rentProv.at(-1)[1], "#137a43"]].concat(sel.map((k) => [RT.INDICES[k].nome, RT.total12(k), RT.INDICES[k].cor])).map(([n, v, c]) => `<div><span><i style="background:${c}"></i>${n}</span>${U.sinal(v)}</div>`).join("")}</div></div>`)
          + sec("Aportes × rendimento", "", `<div class="card ap-card"><p class="small muted" style="margin:0 0 6px">A distância entre as linhas é o que seus investimentos renderam.</p><div class="chart" id="chAportes"></div>
            <div class="ap-kpis"><div><span>Crescimento 12m</span><b>${U.brl(cresc)}</b></div><div><span>Veio de aportes</span><b>${U.brl(av.aportes)}</b></div><div><span>Veio de rendimento</span><b class="${av.rend >= 0 ? "pos" : "neg"}">${U.brl(av.rend)}</b></div></div></div>`);
      }
      return seg("cab", aba, [["ativos", "Ativos"], ["distribuicao", "Distribuição"], ["rentabilidade", "Rentabilidade"]]) + corpo;
    },
    after({ id, r, params }) {
      const aba = params[0] || "ativos";
      document.querySelectorAll("[data-cab]").forEach((b) => (b.onclick = () => go("#/carteira/" + b.dataset.cab)));
      document.querySelectorAll("[data-rf]").forEach((b) => (b.onclick = () => { U.store.set("rf:modo", b.dataset.rf); render(); }));
      if (aba === "distribuicao") CH.rosca($("#dCl"), K.porClasse(id), { centro: U.state.hide ? "•••" : U.num(K.itens(id).reduce((a, x) => a + x.valor, 0) / 1000, 0) + " mil", sub: "total" });
      if (aba === "rentabilidade") {
        const sel = U.store.get("rent:idx2", ["cdi", "ibov", "usd"]).filter((k) => RT.INDICES[k]), datas = r.rent.map((x) => x[0]);
        CH.linha($("#chRent"), { series: [{ nome: "Sua carteira", cor: "#06377b", pontos: r.rent }, { nome: "+ proventos", cor: "#137a43", pontos: r.rentProv }].concat(sel.map((k) => ({ nome: RT.INDICES[k].nome, cor: RT.INDICES[k].cor, pontos: RT.acumulado(k, datas), tracejado: true }))), fmtY: fmtPctY, fmtX: (d, l) => (l ? U.data(d) : U.mesAno(d)), altura: 220 });
        const av = aportes(r);
        CH.linha($("#chAportes"), { series: [{ nome: "Patrimônio", cor: "#06377b", pontos: r.evol }, { nome: "Aportado", cor: "#c27c0e", pontos: av.aportado, tracejado: true }], area: true, fmtY, fmtX: (d, l) => (l ? U.data(d) : U.mesAno(d)), altura: 200, legenda: true });
        document.querySelectorAll("[data-idx]").forEach((b) => (b.onclick = () => { const s = U.store.get("rent:idx2", ["cdi", "ibov", "usd"]), k = b.dataset.idx; U.store.set("rent:idx2", s.includes(k) ? s.filter((x) => x !== k) : s.concat(k)); render(); }));
      }
    },
  };
  function aportes(r) {
    const fluxo = {}; r.inv.mov.forEach((m) => { const k = m[0].slice(0, 7); fluxo[k] = (fluxo[k] || 0) + (m[3] === "Compra" ? m[7] : -m[7]); });
    let acc = r.evol[0][1];
    const aportado = r.evol.map(([d], i) => { if (i) acc += fluxo[d.slice(0, 7)] || 0; return [d, acc]; });
    const ini = r.evol[0][1], fim = r.evol.at(-1)[1], ap = aportado.at(-1)[1] - ini;
    return { aportado, ini, fim, aportes: ap, rend: fim - ini - ap };
  }

  // ---------- Proventos ----------
  T.proventos = {
    titulo: "Proventos",
    html({ id, r }) {
      const ls = P ? P.lancamentos(id) : [];
      const pagos = ls.filter((l) => l.status === "pago" && l.pagamento <= M.BASE).sort((a, b) => (a.pagamento < b.pagamento ? 1 : -1));
      const futuros = ls.filter((l) => l.status !== "pago").sort((a, b) => (a.pagamento < b.pagamento ? -1 : 1));
      const rec12 = P ? P.recebido(id, 12) : r.recebidos12.reduce((a, p) => a + p.valor, 0), aRec = futuros.reduce((a, l) => a + (l.liq || 0), 0);
      const item = (l, st) => `<div class="list-item"><div class="date-box"><b>${l.pagamento.slice(8)}</b><span>${U.MESES[+l.pagamento.slice(5, 7) - 1]}</span></div><div class="grow"><div class="t">${U.esc(l.tk)}</div><div class="s">${U.esc(U.rotuloProv(l.tipo))}${l.dataCom ? " · data-com " + U.data(l.dataCom) : ""}</div></div><div style="text-align:right"><b class="num">${U.brl(l.liq)}</b>${st}</div></div>`;
      return `<div class="ap-duo"><div class="card ap-kpi"><span>💰 Recebido em 12 meses</span><b>${U.brl(rec12)}</b><small>média de ${U.brl(rec12 / 12)}/mês</small></div><div class="card ap-kpi"><span>⏳ Vai receber</span><b>${U.brl(aRec)}</b><small>${futuros.length} pagamentos</small></div></div>
        ${sec("Mês a mês", "", `<div class="card ap-card"><div class="chart" id="chProv"></div></div>`)}
        ${sec("Próximos pagamentos", "", `<div class="card ap-card">${futuros.length ? futuros.slice(0, 6).map((l) => item(l, `<div><span class="chip warn">${l.status === "futura" ? "Previsto" : "Anunciado"}</span></div>`)).join("") : '<div class="muted">Nenhum agora.</div>'}</div>`)}
        ${sec("Últimos recebidos", "", `<div class="card ap-card">${pagos.slice(0, 8).map((l) => item(l, '<div><span class="chip ok">Pago</span></div>')).join("")}</div>`)}`;
    },
    after({ id }) {
      const ls = P ? P.lancamentos(id) : [], meses = {};
      ls.forEach((l) => { const k = l.pagamento.slice(0, 7); meses[k] = meses[k] || [0, 0]; meses[k][l.status === "pago" && l.pagamento <= M.BASE ? 0 : 1] += l.liq || 0; });
      const ks = Object.keys(meses).sort().filter((k) => k <= M.addDays(M.BASE, 60).slice(0, 7)).slice(-9);
      CH.barras($("#chProv"), ks.map((k) => ({ rotulo: U.mesAno(k + "-01").split("/")[0], valores: meses[k] })), [{ nome: "Pago", cor: "#0e7c86" }, { nome: "A receber", cor: "#c27c0e", hachura: true }], { fmtY, altura: 190 });
    },
  };

  // ---------- Mercado ----------
  T.mercado = {
    titulo: "Mercado",
    html({ id }) {
      const p = U.store.get("mov:per", "d1"), rv = rvItens(id).map((x) => Object.assign({ x }, variacoes(x))).sort((a, b) => b[p] - a[p]);
      const ixs = ["IBOV", "IFIX", "SMLL", "USD"].map((k) => M.indices[k]).filter(Boolean);
      return sec("Índices", '<span class="small muted">simulado</span>', `<div class="ap-ix">${ixs.map((i) => `<div class="card ap-ixc"><span>${i.codigo}</span><b>${i.unidade === "R$" ? "R$ " + U.num(i.ultimo, 2) : U.num(i.ultimo, 0)}</b>${U.sinal(i.var)}${CH.spark(i.serie.slice(-30).map((x) => x[1]), i.var >= 0 ? "#16a34a" : "#dc2626", 110, 26)}</div>`).join("")}</div>`)
        + sec("Seus ativos", seg("mov", p, [["d1", "Hoje"], ["d7", "Semana"], ["d30", "Mês"]]), `<div class="card ap-card">${rv.map((l) => linhaItem(l.x, `<b>R$ ${U.num(l.x.preco || (M.cotacoes[l.x.cod] || {}).ultimo || 0, 2)}</b>${U.sinal(l[p])}`)).join("")}</div>`)
        + '<p class="small muted ap-nota">Toque num ativo para ver o gráfico real (TradingView).</p>';
    },
    after() { document.querySelectorAll("[data-mov]").forEach((b) => (b.onclick = () => { U.store.set("mov:per", b.dataset.mov); render(); })); },
  };

  // ---------- Detalhe do ativo (tela empilhada) ----------
  T.ativo = {
    empilhada: true,
    titulo: ({ params }) => params[0],
    html({ id, params }) {
      const tk = params[0], x = K.itens(id).find((i) => i.cod === tk), meta = C.ativos[tk] || (CR.MOEDAS[tk] ? { nome: CR.MOEDAS[tk].nome, setor: "ETF de Criptomoedas", tipo: "etf" } : null);
      if (!meta) return '<div class="empty">Ativo não encontrado.</div>';
      const cot = M.cotacoes[tk], v = x ? variacoes(x) : cot ? { d1: cot.var, d7: 0, d30: 0 } : null, rp = x && x.tipo !== "rf" ? RT.posicao(id, x) : null;
      const prox = (M.proventosAtivo[tk] || []).filter((p) => p.dataCom >= M.BASE)[0];
      return `<div class="ap-ativo-h">${x ? logo(x) : ""}<div><b>${U.esc(meta.nome)}</b><span>${U.esc(meta.setor || "")}</span></div></div>
        <div class="ap-preco"><b>R$ ${U.num(cot ? cot.ultimo : x ? x.preco : 0, 2)}</b>${v ? U.sinal(v.d1) + ' <span class="small muted">hoje</span>' : ""}</div>
        ${meta.tipo !== "tesouro" ? `<div class="card ap-card"><div class="ap-sec-h" style="margin:0 0 8px"><h2>Gráfico</h2><span class="real-badge">ao vivo</span></div><div class="tv-box ap-tv" id="tvAtivo"></div></div>` : ""}
        ${x ? sec("Sua posição", "", `<div class="card ap-card"><div class="ap-grid2"><div><span>Quantidade</span><b>${U.qtd(x.q)}</b></div><div><span>Valor</span><b>${U.brl(x.valor)}</b></div>${rp ? `<div><span>Preço médio</span><b>R$ ${U.num(rp.pm, 2)}</b></div><div><span>Desde a compra</span><b>${U.sinal(rp.preco)}</b></div><div><span>Com proventos</span><b>${U.sinal(rp.total)}</b></div>` : ""}<div><span>% da carteira</span><b>${U.num(x.pct, 1)}%</b></div></div></div>`) : ""}
        ${v && x ? sec("Desempenho", "", `<div class="card ap-card ap-grid3"><div><span>Hoje</span>${U.sinal(v.d1)}</div><div><span>Semana</span>${U.sinal(v.d7)}</div><div><span>Mês</span>${U.sinal(v.d30)}</div></div>`) : ""}
        ${prox ? sec("Próximo provento", "", `<div class="card ap-card"><div class="list-item"><div class="date-box"><b>${prox.pagamento.slice(8)}</b><span>${U.MESES[+prox.pagamento.slice(5, 7) - 1]}</span></div><div class="grow"><div class="t">${prox.tipo} · R$ ${U.num(prox.valor, prox.valor < 1 ? 4 : 2)}/cota</div><div class="s">Data-com ${U.data(prox.dataCom)} · ${prox.status}</div></div></div></div>`) : ""}
        <button class="btn ap-full" data-ask="Me explique como está meu investimento em ${U.esc(tk)}">✦ Perguntar à IA sobre ${U.esc(tk)}</button>
        <a class="btn ghost ap-full" href="../#/ativo/${U.slug(tk)}" target="_blank" rel="noopener">Ver ficha completa no site ↗</a>`;
    },
    after({ params }) {
      const tk = params[0], el = $("#tvAtivo"); if (!el) return;
      const sym = CR.MOEDAS[tk] && CR.MOEDAS[tk].tv ? CR.MOEDAS[tk].tv : "BMFBOVESPA:" + tk;
      el.innerHTML = '<div class="empty" style="padding:20px">Carregando gráfico ao vivo…</div>';
      const box = document.createElement("div"); box.className = "tradingview-widget-container"; box.style.height = "100%";
      const w = document.createElement("div"); w.className = "tradingview-widget-container__widget"; w.style.height = "100%"; box.appendChild(w);
      const s = document.createElement("script"); s.async = true; s.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
      s.text = JSON.stringify({ symbol: sym, interval: "D", range: "6M", autosize: true, hide_top_toolbar: true, hide_side_toolbar: true, allow_symbol_change: false, style: "3", locale: "br", theme: "light", timezone: "America/Sao_Paulo" });
      box.appendChild(s); setTimeout(() => { el.innerHTML = ""; el.appendChild(box); }, 50);
    },
  };

  // ---------- Mais ----------
  T.mais = {
    titulo: "Mais",
    html({ id, params }) {
      const aba = params[0] || "";
      if (aba === "aprender") {
        const f = VD.feitos(), n = f.size;
        return `<div class="card xp ap-card"><div class="lvl">${n >= VD.AULAS.length ? "🏆" : n >= 2 ? "🌱" : "🐣"}</div><div style="flex:1"><div class="small muted">Seu nível</div><h2>${VD.xp()} XP · ${n}/${VD.AULAS.length} vídeos</h2><div class="bar" style="height:8px;margin-top:6px"><i style="width:${(n / VD.AULAS.length) * 100}%;background:linear-gradient(90deg,#f59e0b,#ffcf4d)"></i></div></div></div>
          <div class="ap-videos">${VD.AULAS.map((a, i) => `<button class="vcard" data-video="${a.id}"><div class="vthumb" style="background:${a.cor}"><span aria-hidden="true">${a.emoji}</span>${f.has(a.id) ? '<span class="chip ok done">✓</span>' : ""}<span class="dur">${a.dur}</span><span class="play">▶</span></div><div class="vbody"><span>Aula ${i + 1}</span><b>${U.esc(a.titulo)}</b></div></button>`).join("")}</div>`;
      }
      if (aba === "relatorios") {
        return `<div class="card ap-card">${[["pos", "📊", "Posição consolidada", "Todos os investimentos na data-base"], ["mov", "🔁", "Extrato de movimentações", "Compras, vendas, aplicações e resgates"], ["prov", "💰", "Proventos", "Pagos e a receber"]].map(([k, e, t, s]) => `<button class="ap-row ap-btnrow" data-csv="${k}"><span class="lg" style="background:#e8f0fc;color:#06377b;font-size:20px">${e}</span><div class="grow"><b>${t}</b><span>${s}</span></div><div class="ap-right"><span class="chip blue">⬇ CSV</span></div></button>`).join("")}</div>
          <p class="small muted ap-nota">O arquivo abre no Excel e no Google Planilhas. A planilha completa (.xlsx com várias abas) está na versão web, em Relatórios.</p>`;
      }
      const pf = F.perfilDe(id), Pf = C.perfis[pf.perfil];
      const item = (h, e, t, s) => `<a class="ap-row" href="${h}"><span class="lg" style="background:#e8f0fc;color:#06377b;font-size:20px">${e}</span><div class="grow"><b>${t}</b><span>${s}</span></div><div class="ap-right">${I.chev}</div></a>`;
      return `<div class="card ap-card ap-perfil"><div class="lvl" style="background:${Pf.cor}">${{ con: "🛡️", mod: "⚖️", arr: "🚀" }[pf.perfil]}</div><div class="grow"><span class="small muted">Meu perfil de investidor${pf.origem === "inferido" ? " · estimado" : ""}</span><h2>${Pf.nome}</h2></div><a class="btn sm primary" href="#/perfil">${pf.origem === "inferido" ? "Descobrir" : "Refazer"}</a></div>
        <div class="card ap-card">${item("#/mais/aprender", "🎬", "Aprender", "Vídeos de 1 minuto com quiz")}${item("#/mais/relatorios", "📄", "Relatórios e extratos", "Baixe sua posição e movimentações")}${item("#/notificacoes", "🔔", "Avisos", "Proventos, data-com e pendências")}</div>
        <div class="card ap-card"><div class="ap-row"><span class="lg" style="background:#e8f0fc;color:#06377b">${I.olho}</span><div class="grow"><b>Ocultar valores</b><span>Esconde os valores em reais</span></div><div class="ap-right"><button class="ap-switch" id="swHide" aria-pressed="${U.state.hide}" aria-label="Ocultar valores"><i></i></button></div></div>
          ${item("../", "🌐", "Abrir a versão web", "Mais detalhes e tabelas completas")}
          <button class="ap-row ap-btnrow" id="sair"><span class="lg" style="background:#fdeceb;color:#b3261e;font-size:20px">↩</span><div class="grow"><b>Sair</b><span>Volta para a tela de entrada</span></div></button></div>
        <p class="small muted ap-nota">B3 Investidor · protótipo de app · dados de teste</p>`;
    },
    after({ id, r, params }) {
      document.querySelectorAll("[data-video]").forEach((b) => (b.onclick = () => VD.abrir(b.dataset.video)));
      const sw = $("#swHide"); if (sw) sw.onclick = () => { U.state.hide = !U.state.hide; render(); };
      const sair = $("#sair"); if (sair) sair.onclick = () => { U.store.set("app:logado", false); go("#/login"); };
      document.querySelectorAll("[data-csv]").forEach((b) => (b.onclick = () => {
        const k = b.dataset.csv;
        if (k === "pos") U.downloadCSV("posicao.csv", [["Investimento", "Tipo", "Quantidade", "Valor"]].concat(K.itens(id).map((x) => [nomeItem(x), x.sub, x.q ?? "", x.valor.toFixed(2)])));
        if (k === "mov") U.downloadCSV("movimentacoes.csv", [["Data", "Ativo", "Operação", "Quantidade", "Preço", "Valor"]].concat(r.inv.mov.map((m) => [m[0], m[2], m[3], m[5], m[6], m[7]])));
        if (k === "prov") U.downloadCSV("proventos.csv", [["Pagamento", "Ativo", "Tipo", "Status", "Valor líquido"]].concat((P ? P.lancamentos(id) : []).map((l) => [l.pagamento, l.tk, U.rotuloProv(l.tipo), l.status, (l.liq || 0).toFixed(2)])));
        U.toast("Arquivo baixado");
      }));
    },
  };
  T.mais.tituloDe = (params) => ({ aprender: "Aprender", relatorios: "Relatórios" }[params[0]]);

  // ---------- Avisos (sininho) ----------
  function avisos(id) {
    const r = window.CART.resumo(id), held = new Set(r.ativos.map((a) => a.tk)), out = [];
    r.anunciados.slice().sort((a, b) => (a.data < b.data ? -1 : 1)).forEach((p) => out.push(["💰", `${p.tk}: ${U.brl(p.valor)} a receber`, `${U.rotuloProv(p.tp)} em ${U.data(p.data)}`, "#/proventos"]));
    M.eventos.filter((e) => e.tipo === "Data-com" && held.has(e.ticker) && e.data >= M.BASE && e.data <= M.addDays(M.BASE, 20)).slice(0, 3).forEach((e) => out.push(["📌", `${e.ticker}: data-com em ${U.data(e.data)}`, "Último dia para ter direito ao provento", "#/ativo/" + e.ticker]));
    if (r.pendInst) out.push(["⚠️", `${r.pendInst} não atualizou`, "Seu saldo pode estar incompleto", "../#/conta/contas"]);
    return out;
  }
  T.notificacoes = {
    empilhada: true, titulo: () => "Avisos",
    html: ({ id }) => { const a = avisos(id); return `<div class="card ap-card">${a.length ? a.map(([e, t, s, h]) => `<a class="ap-row" href="${h}"><span class="lg" style="background:#e8f0fc;font-size:20px">${e}</span><div class="grow"><b>${U.esc(t)}</b><span>${U.esc(s)}</span></div><div class="ap-right">${I.chev}</div></a>`).join("") : '<div class="empty">Nenhum aviso agora ✓</div>'}</div><p class="small muted ap-nota">Você escolhe quais avisos receber na versão web, em Minha conta → Privacidade e alertas.</p>`; },
  };

  // ---------- Perfil (reaproveita o questionário do site) ----------
  T.perfil = {
    empilhada: true, titulo: () => "Meu perfil de investidor",
    html: (ctx) => (window.VIEWS.perfil ? window.VIEWS.perfil.html(ctx) : "<div class='empty'>Indisponível</div>"),
    after: (ctx) => { if (window.VIEWS.perfil && window.VIEWS.perfil.after) window.VIEWS.perfil.after(ctx); },
  };

  // ======================================================================
  // NAVEGAÇÃO
  // ======================================================================
  function parse() {
    let h = location.hash.replace(/^#\/?/, "") || "inicio";
    const base = h.split("/")[0];
    if (ALIAS[base]) h = ALIAS[base] + h.slice(base.length);
    if (base === "aprender" && h.startsWith("mais/aprender/perfil")) h = "perfil";
    const [rota, ...params] = h.split("/");
    return { rota, params: params.map(decodeURIComponent) };
  }
  function go(h) { if (location.hash === h) render(); else location.hash = h; }
  const pilha = [];

  function render() {
    let { rota, params } = parse();
    if (!U.store.get("app:logado", false)) rota = "login";
    const tela = T[rota] || T.inicio, ctx = { id: invId, r: window.CART.resumo(invId), params, rerender: render };
    const titulo = typeof tela.titulo === "function" ? tela.titulo(ctx) : (tela.tituloDe && tela.tituloDe(params)) || tela.titulo;
    const sub = rota === "mais" && params[0];
    const top = $("#apTop"), avs = rota !== "login" ? avisos(invId).length : 0;
    document.body.classList.toggle("ap-sem-abas", !!tela.semAbas);
    document.body.classList.toggle("ap-login-on", rota === "login");
    top.innerHTML = tela.semAbas ? "" : (tela.empilhada || sub)
      ? `<button class="ap-ib" id="voltar" aria-label="Voltar">${I.voltar}</button><h1 class="ap-h1">${U.esc(titulo || "")}</h1><span class="ap-ib-sp"></span>`
      : `<img src="../assets/b3-logo.png" alt="B3" class="ap-logo"><h1 class="ap-h1">${rota === "inicio" ? "Olá! 👋" : U.esc(titulo || "")}</h1><button class="ap-ib" id="apHide" aria-pressed="${U.state.hide}" aria-label="Ocultar valores">${I.olho}</button><a class="ap-ib" href="#/notificacoes" aria-label="Avisos">${I.sino}${avs ? `<span class="badge">${avs}</span>` : ""}</a>`;
    $("#apTabs").innerHTML = TABS.map(([k, t]) => `<a href="#/${k}" class="${rota === k || (rota === "ativo" && k === "mercado") ? "on" : ""}" ${rota === k ? 'aria-current="page"' : ""}>${I[k]}<span>${t}</span></a>`).join("");
    const app = $("#app");
    app.innerHTML = `<div class="ap-conteudo">${tela.html(ctx)}</div>`;
    if (tela.after) tela.after(ctx);
    const v = $("#voltar"); if (v) v.onclick = () => (history.length > 1 ? history.back() : go(sub ? "#/mais" : "#/inicio"));
    const hb = $("#apHide"); if (hb) hb.onclick = () => { U.state.hide = !U.state.hide; U.toast(U.state.hide ? "Valores ocultos" : "Valores visíveis"); render(); };
  }
  let ultima = "";
  window.addEventListener("hashchange", () => { const h = location.hash; render(); if (h.split("/").slice(0, 2).join("/") !== ultima) { $("#app").scrollTop = 0; window.scrollTo(0, 0); } ultima = h.split("/").slice(0, 2).join("/"); });

  // popover dos "i" (mesmo comportamento do site)
  let pop = null;
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-info]"); if (pop) { pop.remove(); pop = null; } if (!b) return;
    pop = document.createElement("div"); pop.className = "pop"; pop.textContent = b.dataset.info; document.body.appendChild(pop);
    const r = b.getBoundingClientRect(); pop.style.top = window.scrollY + r.bottom + 8 + "px"; pop.style.left = Math.max(8, Math.min(r.left - 20, innerWidth - pop.offsetWidth - 8)) + "px"; e.stopPropagation();
  });

  // folha inferior (bottom sheet)
  function abrirSheet(html, after) { const s = $("#sheet"), bg = $("#sheetBg"); s.innerHTML = `<div class="ap-grab"></div>${html}`; s.hidden = false; bg.hidden = false; requestAnimationFrame(() => { s.classList.add("on"); bg.classList.add("on"); }); bg.onclick = fecharSheet; if (after) after(); }
  function fecharSheet() { const s = $("#sheet"), bg = $("#sheetBg"); s.classList.remove("on"); bg.classList.remove("on"); setTimeout(() => { s.hidden = true; bg.hidden = true; }, 220); }

  // a assistente e os vídeos do site usam window.APP e window.TOUR
  window.APP = { id: () => invId, render };
  window.TOUR = { iniciar: () => { U.toast("Os tours guiados estão na versão web"); }, fechar() {} };
  window.APP_INICIAR = function () {
    render();
    if ("serviceWorker" in navigator && location.protocol !== "file:") navigator.serviceWorker.register("sw.js").catch(() => {});
  };
})();
