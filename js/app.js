/* V2 — núcleo: 7 abas, rotas por hash, busca, menu da conta, ocultar valores, primeiro acesso.
 * O investidor é identificado no cadastro (CPF + contas conectadas). Para testes, use ?inv=INV-0XX (ver dev.html).
 */
(function () {
  const D = window.B3DATA, C = window.CATALOGO, U = window.U, V = window.VIEWS, CR = window.CRIPTO;
  const DEFAULT_INV = "INV-035";

  const ic = (d) => `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const TABS = [
    { r: "inicio", t: "Início", i: ic('<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>') },
    { r: "carteira", t: "Carteira", i: ic('<path d="M21 12A9 9 0 1 1 12 3v9z"/><path d="M15 3.5A9 9 0 0 1 20.5 9H15z"/>') },
    { r: "proventos", t: "Proventos", i: ic('<circle cx="12" cy="12" r="9"/><path d="M14.5 9.5c-.5-1-1.5-1.5-2.5-1.5-1.5 0-2.5.8-2.5 2s1 1.6 2.5 2 2.5.8 2.5 2-1 2-2.5 2c-1.2 0-2.2-.6-2.6-1.6M12 6v2m0 8v2"/>') },
    { r: "mercado", t: "Mercado", i: ic('<path d="M3 3v18h18"/><path d="m7 15 4-4 3 3 6-6"/>') },
    { r: "aprender", t: "Aprender", i: ic('<path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11v5c3 2 9 2 12 0v-5"/>') },
    { r: "relatorios", t: "Relatórios", i: ic('<path d="M14 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8z"/><path d="M14 3v5h5M9 13h6M9 17h6"/>') },
    { r: "perfil", t: "Meu Perfil de Investidor", c: "Meu Perfil", i: ic('<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>') },
  ];
  // Rotas da v1 continuam funcionando (links antigos, feed, tutoriais)
  const ALIAS = { "visao-geral": "inicio", recebimentos: "proventos", calendario: "proventos/calendario", assembleias: "proventos/assembleias", movimentacoes: "carteira/movimentacoes", documentos: "relatorios/informes", conexoes: "conta/contas", acompanhamento: "mercado/acompanhar", comparar: "mercado/comparar", ofertas: "mercado/ofertas", "para-voce": "aprender/para-voce", tutoriais: "aprender/site" };

  // ---------- Investidor (identificado no cadastro; ?inv= só para testes) ----------
  const qs = new URLSearchParams(location.search).get("inv");
  if (qs && D.investidores[qs]) U.store.set("inv", qs);
  let invId = U.store.get("inv", DEFAULT_INV); if (!D.investidores[invId]) invId = DEFAULT_INV;

  // ---------- Topo, menu e barra inferior ----------
  function parse() {
    let h = location.hash.replace(/^#\/?/, "") || "inicio";
    const base = h.split("/")[0];
    if (ALIAS[base]) { h = ALIAS[base] + h.slice(base.length); history.replaceState(null, "", "#/" + h); }
    if (h.startsWith("aprender/perfil")) { h = "perfil"; history.replaceState(null, "", "#/perfil"); } // o perfil saiu do Aprender e virou aba
    const [rota, ...rest] = h.split("/");
    return { rota, params: rest.map(decodeURIComponent) };
  }
  function renderTabs(rota) {
    const ativa = rota === "ativo" ? "mercado" : rota;
    const html = (curto) => TABS.map((t) => `<a href="#/${t.r}" class="${ativa === t.r ? "active" : ""}" ${ativa === t.r ? 'aria-current="page"' : ""} title="${t.t}" aria-label="${t.t}">${t.i}<span>${!t.c ? t.t : curto ? t.c : `<span class="lbl-l">${t.t}</span><span class="lbl-c">${t.c}</span>`}</span></a>`).join("");
    document.getElementById("tabs").innerHTML = html(false);
    document.getElementById("bottomNav").innerHTML = html(true);
    const pf = window.FEED.perfilDe(invId), av = document.getElementById("avatar");
    av.style.background = C.perfis[pf.perfil].cor; av.title = `Minha conta · perfil ${C.perfis[pf.perfil].nome}`;
  }

  const menu = document.getElementById("menuConta"), avatar = document.getElementById("avatar");
  function abrirMenu() {
    const r = window.CART.resumo(invId), pf = window.FEED.perfilDe(invId);
    menu.innerHTML = `<div class="hd"><b>Minha conta</b><div class="small muted">Perfil ${C.perfis[pf.perfil].nome}${pf.origem === "inferido" ? " (inferido)" : ""} · ${window.CONSOL.porInstituicao(invId).length} contas</div></div>
      <a href="#/conta/contas">🔗 Contas conectadas ${r.pendInst ? '<span class="badge" style="margin-left:auto">1</span>' : ""}</a><a href="#/perfil">🧭 Meu Perfil de Investidor</a><a href="#/conta/permissoes">🛡️ Permissões de dados</a><a href="#/conta/portabilidade">🔁 Portabilidade</a><a href="#/conta/privacidade">🔔 Privacidade e alertas</a>
      <a href="#/aprender/site">❓ Ajuda e tutoriais</a><a href="dev.html">🛠️ Guia para desenvolvedores</a><button id="sair">↩ Sair (simulação)</button>`;
    menu.classList.add("open"); avatar.setAttribute("aria-expanded", "true");
    document.getElementById("sair").onclick = () => {
      U.store.set("onb:visto", false); perfilSugerido = false; // novo acesso: o convite do perfil volta a aparecer
      try { sessionStorage.removeItem("b3i:perfil:sugerido"); } catch (e) { /* sem sessionStorage */ }
      location.hash = "#/boas-vindas"; fecharPops();
    };
  }
  avatar.addEventListener("click", (e) => { e.stopPropagation(); menu.classList.contains("open") ? fecharPops() : (fecharPops(), abrirMenu()); });

  const hideBtn = document.getElementById("hideBtn");
  const syncHide = () => { hideBtn.setAttribute("aria-pressed", String(U.state.hide)); hideBtn.title = U.state.hide ? "Mostrar valores" : "Ocultar valores"; };
  hideBtn.addEventListener("click", () => { U.state.hide = !U.state.hide; syncHide(); U.toast(U.state.hide ? "Valores ocultos" : "Valores visíveis"); render(); });
  syncHide();

  // ---------- Render ----------
  function render() {
    const { rota, params } = parse();
    const view = V[rota] || V["nao-encontrado"];
    renderTabs(rota);
    document.body.classList.toggle("onb-mode", rota === "boas-vindas");
    const ctx = { id: invId, r: window.CART.resumo(invId), params, rerender: render };
    const app = document.getElementById("app");
    app.innerHTML = view.html(ctx);
    if (view.after) view.after(ctx, app);
    sugerirPerfil(rota);
  }

  // ---------- Ao entrar: sugere o questionário de perfil a quem ainda não respondeu ----------
  // "Fazer mais tarde" vale só para esta visita: na próxima entrada no site o convite aparece de novo.
  let perfilSugerido = false;
  try { perfilSugerido = sessionStorage.getItem("b3i:perfil:sugerido") === "1"; } catch (e) { /* sem sessionStorage */ }
  function sugerirPerfil(rota) {
    if (perfilSugerido || rota === "boas-vindas" || rota === "perfil") return;
    // espera um instante: tour e vídeo do fim das boas-vindas abrem logo depois e têm prioridade
    setTimeout(() => {
      const salvo = U.store.get("perfil:" + invId, null);
      if (perfilSugerido || parse().rota !== rota || (salvo && !salvo.simulado) || document.querySelector(".tour-pop, #playerWrap")) return;
      abrirConvitePerfil();
    }, 700);
  }
  function abrirConvitePerfil() {
    perfilSugerido = true;
    try { sessionStorage.setItem("b3i:perfil:sugerido", "1"); } catch (e) { /* sem sessionStorage */ }
    const volta = document.activeElement;
    const dlg = document.createElement("div"); dlg.className = "dlg-wrap"; dlg.id = "perfilDlg";
    dlg.innerHTML = `<div class="dlg" role="dialog" aria-modal="true" aria-labelledby="perfilDlgT" aria-describedby="perfilDlgD">
      <div class="dlg-ic" aria-hidden="true">🧭</div>
      <h2 id="perfilDlgT">Vamos descobrir seu perfil de investidor?</h2>
      <p id="perfilDlgD">São 8 perguntas rápidas, cerca de 2 minutos. Com elas, os conteúdos e vídeos ficam mais adequados a você.</p>
      <p class="small muted">É uma simulação educativa. O perfil oficial (suitability) continua sendo feito pela sua corretora.</p>
      <div class="dlg-acoes"><button class="btn" type="button" data-dlg="depois">Fazer mais tarde</button><button class="btn primary" type="button" data-dlg="agora">Fazer o questionário</button></div>
      <p class="small muted" style="margin:12px 0 0">Você pode fazer ou refazer quando quiser na aba <b>Meu Perfil de Investidor</b>.</p></div>`;
    document.body.appendChild(dlg);
    const fechar = (ir) => { dlg.remove(); document.removeEventListener("keydown", tecla, true); if (ir) location.hash = "#/perfil"; else if (volta && volta.focus) volta.focus(); };
    const tecla = (e) => {
      if (e.key === "Escape") { e.stopPropagation(); fechar(false); }
      if (e.key === "Tab") { const bs = [...dlg.querySelectorAll("button")], i = bs.indexOf(document.activeElement); if (e.shiftKey ? i <= 0 : i === bs.length - 1) { e.preventDefault(); bs[e.shiftKey ? bs.length - 1 : 0].focus(); } }
    };
    document.addEventListener("keydown", tecla, true);
    dlg.addEventListener("click", (e) => { const b = e.target.closest("[data-dlg]"); if (b) fechar(b.dataset.dlg === "agora"); });
    dlg.querySelector('[data-dlg="agora"]').focus();
  }
  window.APP = { id: () => invId, render };

  let ultima = null;
  window.addEventListener("hashchange", () => {
    const { rota, params } = parse(); render(); fecharPops();
    const chave = rota + "/" + (params[0] || "");
    if (chave !== ultima) { window.scrollTo(0, 0); document.getElementById("app").focus({ preventScroll: true }); }
    ultima = chave;
  });
  let rz, larg = innerWidth; window.addEventListener("resize", () => { if (Math.abs(innerWidth - larg) < 40) return; larg = innerWidth; clearTimeout(rz); rz = setTimeout(render, 250); });

  // ---------- Popover "i" ----------
  let pop = null;
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-info]");
    if (pop) { pop.remove(); pop = null; }
    if (!e.target.closest(".menu-conta") && !e.target.closest("#avatar")) menu.classList.remove("open");
    if (!e.target.closest("#searchPop") && !e.target.closest("#searchBtn")) document.getElementById("searchPop").classList.remove("open");
    if (!b) return;
    pop = document.createElement("div"); pop.className = "pop"; pop.setAttribute("role", "tooltip"); pop.textContent = b.dataset.info;
    document.body.appendChild(pop);
    const r = b.getBoundingClientRect();
    pop.style.top = window.scrollY + r.bottom + 8 + "px";
    pop.style.left = Math.max(8, Math.min(window.scrollX + r.left - 20, window.scrollX + document.documentElement.clientWidth - pop.offsetWidth - 8)) + "px";
    e.stopPropagation();
  });
  document.addEventListener("click", (e) => document.querySelectorAll("details.acao[open]").forEach((d) => !d.contains(e.target) && (d.open = false)));
  addEventListener("scroll", () => document.querySelectorAll("details.acao[open]").forEach((d) => (d.open = false)), { passive: true });

  // ---------- Nome da empresa ao passar o mouse (ou focar) no logo ou no ticker ----------
  const APELIDO = { VIVT3: "Vivo", TAEE11: "Taesa", CPLE6: "Copel", RADL3: "RD Saúde (Raia Drogasil)" };
  function empresa(tk) {
    const m = C.ativos[tk], cr = CR.MOEDAS[tk];
    if (cr) return { tipo: "ETF de Criptomoedas", nome: cr.nome.replace(/ \(\w+\)$/, ""), det: "Fundo negociado na B3 que acompanha o preço da cripto" };
    if (!m) return null;
    if (m.tipo === "acao") return { tipo: "Ação", nome: APELIDO[tk] || m.nome.replace(/ (ON|PN|PNA|PNB|Unit)$/, ""), det: m.empresa };
    if (m.tipo === "fii") return { tipo: "Fundo imobiliário (FII)", nome: m.nome.replace(/ \(\w+\)$/, ""), det: m.ind.segmento || m.setor };
    if (m.tipo === "etf") return { tipo: "ETF", nome: m.nome.replace(/ \(\w+\)$/, ""), det: "Acompanha o índice " + m.ind.indice };
    return null;
  }
  let tip = null, tipAlvo = null;
  function escondeEmp() { if (tip) tip.remove(); if (tipAlvo) tipAlvo.removeAttribute("aria-describedby"); tip = tipAlvo = null; }
  // Proventos recebidos desde a compra (Carteira → Todos os investimentos, coluna Rent. c/ proventos)
  function provHtml(d) {
    const n = +d.provN, desde = d.provDesde ? ` desde ${U.data(d.provDesde)}` : "";
    return `<span class="emp-tk">${U.esc(d.prov)} · Proventos recebidos${desde}</span><b>${U.brl(+d.provR)}</b>
      <span class="emp-det">${n} ${n === 1 ? "pagamento" : "pagamentos"} · R$ ${U.num(+d.provCota, 2)} por ${U.esc(d.provUn)}</span>
      <span class="emp-det">${U.num(+d.provPct, 2)}% do preço médio</span>
      <span class="emp-conta"><span>Variação do preço</span>${U.sinal(+d.provPreco)}<span>+ Proventos</span>${U.sinal(+d.provPct)}<b>= Rentabilidade total</b><b>${U.sinal(+d.provTotal)}</b></span>`;
  }
  function mostraEmp(el) {
    if (el === tipAlvo) return;
    const e = el.dataset.prov ? null : empresa(el.dataset.emp); escondeEmp(); if (!e && !el.dataset.prov) return;
    tipAlvo = el; el.setAttribute("aria-describedby", "empPop");
    tip = document.createElement("div"); tip.className = "emp-pop"; tip.id = "empPop"; tip.setAttribute("role", "tooltip");
    tip.innerHTML = e ? `<span class="emp-tk">${U.esc(el.dataset.emp)} · ${U.esc(e.tipo)}</span><b>${U.esc(e.nome)}</b><span class="emp-det">${U.esc(e.det)}</span>` : provHtml(el.dataset);
    document.body.appendChild(tip);
    const r = el.getBoundingClientRect(), cabe = r.bottom + 10 + tip.offsetHeight < innerHeight;
    tip.style.top = scrollY + (cabe ? r.bottom + 10 : r.top - 10 - tip.offsetHeight) + "px";
    tip.style.left = Math.max(8, Math.min(scrollX + r.left, scrollX + document.documentElement.clientWidth - tip.offsetWidth - 8)) + "px";
  }
  const alvoEmp = (e) => { const el = e.target.closest && e.target.closest("[data-emp],[data-prov]"); el ? mostraEmp(el) : escondeEmp(); };
  document.addEventListener("mouseover", alvoEmp);
  document.addEventListener("focusin", alvoEmp);
  addEventListener("scroll", escondeEmp, { passive: true });
  addEventListener("hashchange", escondeEmp);

  function fecharPops() { menu.classList.remove("open"); avatar.setAttribute("aria-expanded", "false"); document.getElementById("searchPop").classList.remove("open"); if (pop) { pop.remove(); pop = null; } escondeEmp(); }
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") fecharPops(); });

  // ---------- Busca ----------
  const sp = document.getElementById("searchPop"), q = document.getElementById("q"), sugg = document.getElementById("sugg");
  const abrirBusca = () => { fecharPops(); sp.classList.add("open"); q.focus(); };
  document.getElementById("searchBtn").addEventListener("click", (e) => { e.stopPropagation(); sp.classList.contains("open") ? fecharPops() : abrirBusca(); });
  document.addEventListener("keydown", (e) => { if (e.key === "/" && !/INPUT|TEXTAREA/.test(document.activeElement.tagName)) { e.preventDefault(); abrirBusca(); } });
  const paginas = [["Início", "#/inicio", "saldo lucro ganho resumo"], ["Carteira", "#/carteira", "distribuicao pizza"], ["Rentabilidade × CDI", "#/carteira/rentabilidade", "cdi ibovespa rentabilidade"], ["Proventos", "#/proventos", "dividendos jcp rendimentos"], ["Calendário de proventos", "#/proventos/calendario", "data-com data com calendario"], ["Assembleias", "#/proventos/assembleias", "voto"], ["Índices ao vivo", "#/mercado", "ibovespa dolar indices"], ["Acompanhamento e alertas", "#/mercado/acompanhar", "alerta watchlist"], ["Comparar ativos", "#/mercado/comparar", "comparar"], ["Ofertas públicas", "#/mercado/ofertas", "ipo oferta"], ["Vídeos para iniciantes", "#/aprender", "video aula iniciante aprender"], ["Feed para você", "#/aprender/para-voce", "feed conteudo"], ["Questionário de perfil", "#/perfil", "perfil suitability"], ["Ajuda e tutoriais", "#/aprender/site", "ajuda tour tutorial"], ["Relatórios e extratos", "#/relatorios", "tabela extrato csv exportar"], ["Informe de IR", "#/relatorios/informes", "imposto ir informe"], ["Contas conectadas", "#/conta/contas", "corretora banco conectar"], ["Portabilidade", "#/conta/portabilidade", "transferir"]];
  let sel = -1, res = [];
  function buscar(txt) {
    const t = U.normaliza(txt.trim()); if (!t) return [];
    const held = new Set(window.CART.resumo(invId).ativos.map((a) => a.tk));
    const at = Object.entries(C.ativos).filter(([tk, m]) => U.normaliza(tk + " " + m.nome + " " + (m.empresa || "") + " " + m.setor).includes(t)).slice(0, 5)
      .map(([tk, m]) => ({ h: `<span class="tk">${U.esc(tk)}</span><span>${U.esc(m.nome)}<br><small class="muted">${U.esc(m.setor)}</small></span>${held.has(tk) ? '<span class="chip blue">Na carteira</span>' : ""}`, u: "#/ativo/" + U.slug(tk) }));
    const cr = Object.entries(CR.MOEDAS).filter(([s, m]) => U.normaliza(s + " " + m.nome + " etf fundo criptomoedas cripto").includes(t)).map(([s, m]) => ({ h: `<span class="tk">${s}</span><span>${m.nome}<br><small class="muted">ETF de Criptomoedas · B3</small></span>`, u: "#/mercado/meus/" + s }));
    const pg = paginas.filter(([n, , k]) => U.normaliza(n + " " + k).includes(t)).slice(0, 3).map(([n, u]) => ({ h: `<span class="tk">Página</span><span>${n}</span>`, u }));
    return at.concat(cr, pg);
  }
  function desenha() {
    sugg.innerHTML = res.length ? res.map((r, i) => `<a href="${r.u}" role="option" aria-selected="${i === sel}">${r.h}</a>`).join("") + '<div class="hint">↑↓ navegar · Enter abrir · não achou? Pergunte à IA ✦</div>' : `<div class="hint">Nada para “${U.esc(q.value)}”. <button class="btn sm" data-ask="${U.esc(q.value)}">✦ Perguntar à IA</button></div>`;
    sugg.classList.toggle("open", !!q.value.trim());
  }
  q.addEventListener("input", () => { res = buscar(q.value); sel = res.length ? 0 : -1; desenha(); });
  q.addEventListener("keydown", (e) => {
    if (e.key === "ArrowDown") { sel = Math.min(res.length - 1, sel + 1); desenha(); e.preventDefault(); }
    else if (e.key === "ArrowUp") { sel = Math.max(0, sel - 1); desenha(); e.preventDefault(); }
    else if (e.key === "Enter" && res[sel]) { location.hash = res[sel].u; q.value = ""; sugg.classList.remove("open"); fecharPops(); }
  });
  sugg.addEventListener("click", (e) => { if (e.target.closest("a")) { q.value = ""; sugg.classList.remove("open"); fecharPops(); } });

  // ---------- Início ----------
  if (!U.store.get("onb:visto", false)) history.replaceState(null, "", location.pathname + location.search + "#/boas-vindas");
  render();
  ultima = parse().rota + "/" + (parse().params[0] || "");
})();
