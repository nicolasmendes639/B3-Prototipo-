/* V2 — núcleo: 6 abas, rotas por hash, busca, menu da conta, ocultar valores, primeiro acesso.
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
  ];
  // Rotas da v1 continuam funcionando (links antigos, feed, tutoriais)
  const ALIAS = { "visao-geral": "inicio", recebimentos: "proventos", calendario: "proventos/calendario", assembleias: "proventos/assembleias", movimentacoes: "carteira/movimentacoes", documentos: "relatorios/informes", conexoes: "conta/contas", acompanhamento: "mercado/acompanhar", comparar: "mercado/comparar", ofertas: "mercado/ofertas", "para-voce": "aprender/para-voce", perfil: "aprender/perfil", tutoriais: "aprender/site" };

  // ---------- Investidor (identificado no cadastro; ?inv= só para testes) ----------
  const qs = new URLSearchParams(location.search).get("inv");
  if (qs && D.investidores[qs]) U.store.set("inv", qs);
  let invId = U.store.get("inv", DEFAULT_INV); if (!D.investidores[invId]) invId = DEFAULT_INV;

  // ---------- Topo, menu e barra inferior ----------
  function parse() {
    let h = location.hash.replace(/^#\/?/, "") || "inicio";
    const base = h.split("/")[0];
    if (ALIAS[base]) { h = ALIAS[base] + h.slice(base.length); history.replaceState(null, "", "#/" + h); }
    const [rota, ...rest] = h.split("/");
    return { rota, params: rest.map(decodeURIComponent) };
  }
  function renderTabs(rota) {
    const ativa = rota === "ativo" ? "mercado" : rota;
    const html = TABS.map((t) => `<a href="#/${t.r}" class="${ativa === t.r ? "active" : ""}" ${ativa === t.r ? 'aria-current="page"' : ""}>${t.i}<span>${t.t}</span></a>`).join("");
    document.getElementById("tabs").innerHTML = html;
    document.getElementById("bottomNav").innerHTML = html;
    const pf = window.FEED.perfilDe(invId), av = document.getElementById("avatar");
    av.style.background = C.perfis[pf.perfil].cor; av.title = `Minha conta · perfil ${C.perfis[pf.perfil].nome}`;
  }

  const menu = document.getElementById("menuConta"), avatar = document.getElementById("avatar");
  function abrirMenu() {
    const r = window.CART.resumo(invId), pf = window.FEED.perfilDe(invId);
    menu.innerHTML = `<div class="hd"><b>Minha conta</b><div class="small muted">Perfil ${C.perfis[pf.perfil].nome}${pf.origem === "inferido" ? " (inferido)" : ""} · ${window.CONSOL.porInstituicao(invId).length} contas</div></div>
      <a href="#/conta/contas">🔗 Contas conectadas ${r.pendInst ? '<span class="badge" style="margin-left:auto">1</span>' : ""}</a><a href="#/aprender/perfil">🧭 Perfil do investidor</a><a href="#/conta/permissoes">🛡️ Permissões de dados</a><a href="#/conta/portabilidade">🔁 Portabilidade</a><a href="#/conta/privacidade">🔔 Privacidade e alertas</a>
      <a href="#/aprender/site">❓ Ajuda e tutoriais</a><a href="dev.html">🛠️ Guia para desenvolvedores</a><button id="sair">↩ Sair (simulação)</button>`;
    menu.classList.add("open"); avatar.setAttribute("aria-expanded", "true");
    document.getElementById("sair").onclick = () => { U.store.set("onb:visto", false); location.hash = "#/boas-vindas"; fecharPops(); };
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
  function fecharPops() { menu.classList.remove("open"); avatar.setAttribute("aria-expanded", "false"); document.getElementById("searchPop").classList.remove("open"); if (pop) { pop.remove(); pop = null; } }
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") fecharPops(); });

  // ---------- Busca ----------
  const sp = document.getElementById("searchPop"), q = document.getElementById("q"), sugg = document.getElementById("sugg");
  const abrirBusca = () => { fecharPops(); sp.classList.add("open"); q.focus(); };
  document.getElementById("searchBtn").addEventListener("click", (e) => { e.stopPropagation(); sp.classList.contains("open") ? fecharPops() : abrirBusca(); });
  document.addEventListener("keydown", (e) => { if (e.key === "/" && !/INPUT|TEXTAREA/.test(document.activeElement.tagName)) { e.preventDefault(); abrirBusca(); } });
  const paginas = [["Início", "#/inicio", "saldo lucro ganho resumo"], ["Carteira", "#/carteira", "distribuicao pizza"], ["Rentabilidade × CDI", "#/carteira/rentabilidade", "cdi ibovespa rentabilidade"], ["Proventos", "#/proventos", "dividendos jcp rendimentos"], ["Calendário de proventos", "#/proventos/calendario", "data-com data com calendario"], ["Assembleias", "#/proventos/assembleias", "voto"], ["Índices ao vivo", "#/mercado", "ibovespa dolar indices"], ["Acompanhamento e alertas", "#/mercado/acompanhar", "alerta watchlist"], ["Comparar ativos", "#/mercado/comparar", "comparar"], ["Ofertas públicas", "#/mercado/ofertas", "ipo oferta"], ["Vídeos para iniciantes", "#/aprender", "video aula iniciante aprender"], ["Feed para você", "#/aprender/para-voce", "feed conteudo"], ["Questionário de perfil", "#/aprender/perfil", "perfil suitability"], ["Ajuda e tutoriais", "#/aprender/site", "ajuda tour tutorial"], ["Relatórios e extratos", "#/relatorios", "tabela extrato csv exportar"], ["Informe de IR", "#/relatorios/informes", "imposto ir informe"], ["Contas conectadas", "#/conta/contas", "corretora exchange conectar"], ["Portabilidade", "#/conta/portabilidade", "transferir"]];
  let sel = -1, res = [];
  function buscar(txt) {
    const t = U.normaliza(txt.trim()); if (!t) return [];
    const held = new Set(window.CART.resumo(invId).ativos.map((a) => a.tk));
    const at = Object.entries(C.ativos).filter(([tk, m]) => U.normaliza(tk + " " + m.nome + " " + (m.empresa || "") + " " + m.setor).includes(t)).slice(0, 5)
      .map(([tk, m]) => ({ h: `<span class="tk">${U.esc(tk)}</span><span>${U.esc(m.nome)}<br><small class="muted">${U.esc(m.setor)}</small></span>${held.has(tk) ? '<span class="chip blue">Na carteira</span>' : ""}`, u: "#/ativo/" + U.slug(tk) }));
    const cr = Object.entries(CR.MOEDAS).filter(([s, m]) => U.normaliza(s + " " + m.nome + " cripto").includes(t)).map(([s, m]) => ({ h: `<span class="tk">${s}</span><span>${m.nome}<br><small class="muted">Cripto · ao vivo</small></span>`, u: "#/mercado/meus/" + s }));
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
  // preços de cripto ao vivo: atualiza as telas quando chegarem
  CR.carregar().then((ok) => { if (ok && /^#\/(inicio|carteira|mercado|relatorios)?/.test(location.hash || "#/inicio") && !document.querySelector(".tour-pop") && !document.getElementById("playerWrap")) render(); });
})();
