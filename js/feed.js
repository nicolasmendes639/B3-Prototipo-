/* Motor do feed "Para você".
 * Combina: (1) perfil do questionário (ou inferido da carteira), (2) nível de conhecimento,
 * (3) interesses declarados, (4) o que a pessoa tem na carteira e (5) eventos dos ativos dela.
 * Regras de produto (do benchmark): feed finito, explica "por que estou vendo isto",
 * não recomenda compra/venda e não estimula giro.
 */
window.FEED = (function () {
  const C = window.CATALOGO, M = window.MERCADO, U = window.U;
  const LIMITE_CONTEUDO = 10;

  function perfilDe(id) {
    const p = U.store.get("perfil:" + id, null);
    if (p) return Object.assign({ origem: "questionario" }, p);
    const inv = window.B3DATA.investidores[id];
    return { perfil: window.CART.perfilInferido(inv), nivel: null, interesses: [], origem: "inferido" };
  }

  function montar(id) {
    const r = window.CART.resumo(id);
    const pf = perfilDe(id);
    const ocultos = new Set(U.store.get("feed:ocultos:" + id, []));
    const salvos = new Set(U.store.get("feed:salvos:" + id, []));
    const temasCart = window.CART.temasCarteira(r);
    const held = new Set(r.ativos.map((a) => a.tk));
    const itens = [];
    const hoje = M.BASE;

    // ---------- Cards da carteira (dinâmicos) ----------
    const prox = r.anunciados.slice().sort((a, b) => (a.data < b.data ? -1 : 1));
    if (prox.length) {
      const tot = prox.reduce((a, p) => a + p.valor, 0);
      itens.push({ id: "d-receb", grupo: "carteira", esfera: "area", formato: "Recebimentos", titulo: `Você tem ${U.brl(tot)} em proventos anunciados`,
        resumo: `Próximo: ${prox[0].tk} · ${U.rotuloProv(prox[0].tp)} de ${U.brl(prox[0].valor)} em ${U.data(prox[0].data)}. Valores anunciados ainda não entram no total recebido.`,
        url: "#/recebimentos", cta: "Ver recebimentos", motivos: ["Você tem proventos a receber"], score: 100 });
    }
    const dataCom = M.eventos.filter((e) => e.tipo === "Data-com" && held.has(e.ticker) && e.data >= hoje && e.data <= M.addDays(hoje, 20));
    if (dataCom.length) {
      const e = dataCom[0];
      itens.push({ id: "d-datacom-" + e.ticker, grupo: "eventos", esfera: "area", formato: "Calendário", titulo: `${e.ticker}: data-com em ${U.data(e.data)}`,
        resumo: `${e.provento} de R$ ${U.num(e.valor, e.valor < 1 ? 4 : 2)} por ${e.ticker.endsWith("11") ? "cota" : "ação"} (${e.status.toLowerCase()}). Quem tiver o ativo no fim desse dia tem direito; pagamento em ${U.data(e.pagamento)}.`,
        url: "#/calendario", cta: "Abrir calendário", extra: { url: "#/ativo/" + e.ticker, cta: "Ficha do ativo" }, motivos: [`Você tem ${e.ticker}`], score: 95 });
    }
    const top = r.ativos[0];
    if (top && top.pct > 35) {
      itens.push({ id: "d-conc", grupo: "carteira", esfera: "edu", formato: "Para refletir", titulo: `${top.tk} representa ${U.num(top.pct, 1)}% do seu patrimônio na B3`,
        resumo: "Concentração alta aumenta o impacto de um único ativo no seu resultado. Veja um conteúdo sobre diversificação — isto não é uma recomendação de compra ou venda.",
        url: C.esferas.edu.url, cta: "Aprender sobre diversificação", externo: true, motivos: ["Concentração na sua carteira"], score: 90 });
    }
    if (r.pendInst) {
      itens.push({ id: "d-conexao", grupo: "carteira", esfera: "area", formato: "Pendência", titulo: `${r.pendInst} ainda não atualizou sua posição`,
        resumo: "Seu consolidado pode estar incompleto. Veja a data da última posição, o motivo provável e quem resolve.", url: "#/conexoes", cta: "Ver detalhes", motivos: ["Afeta o seu total"], score: 92 });
    }
    const ag = M.eventos.filter((e) => e.categoria === "Assembleia" && held.has(e.ticker) && e.data >= hoje);
    if (ag.length) {
      itens.push({ id: "d-ag-" + ag[0].ticker, grupo: "eventos", esfera: "assembleias", formato: "Assembleia", titulo: `Assembleia de ${ag[0].ticker} em ${U.data(ag[0].data)}`,
        resumo: "Você pode votar a distância nas decisões da empresa, sem sair da Área do Investidor.", url: "#/assembleias", cta: "Ver pauta e votar", motivos: [`Você tem ${ag[0].ticker}`], score: 70 });
    }
    // Card de mercado (curto, sem estímulo a negociar)
    const ib = M.indices.IBOV;
    itens.push({ id: "d-mercado", grupo: "eventos", esfera: "area", formato: "Mercado hoje", titulo: `Ibovespa fechou em ${U.num(ib.ultimo, 0)} pontos (${ib.var >= 0 ? "+" : ""}${U.num(ib.var, 2)}%)`,
      resumo: "Veja maiores altas, baixas e mais negociadas, com o horário e o atraso de cada dado.", url: "#/mercado", cta: "Abrir Mercado hoje", motivos: ["Resumo diário"], score: 40 });
    if (pf.perfil !== "con") {
      itens.push({ id: "d-ofertas", grupo: "eventos", esfera: "ofertas", formato: "Ofertas públicas", titulo: `${M.ofertas.length} ofertas públicas com cronograma divulgado`,
        resumo: "Prospectos, período de reserva e público-alvo em um só lugar. Leia o prospecto antes de decidir.", url: "#/ofertas", cta: "Ver ofertas", motivos: [`Perfil ${C.perfis[pf.perfil].nome}`], score: 45 });
    }

    // ---------- Conteúdo educativo das esferas B3 ----------
    const conteudo = C.conteudos.map((c) => {
      let s = 0; const mot = [];
      if (c.perfis.includes(pf.perfil)) { s += 4; mot.push(`Perfil ${C.perfis[pf.perfil].nome}${pf.origem === "inferido" ? " (inferido da carteira)" : ""}`); }
      if (pf.nivel && c.nivel.includes(pf.nivel)) { s += 2; mot.push(`Nível ${C.niveis[pf.nivel]}`); }
      const ints = c.temas.filter((t) => (pf.interesses || []).includes(t));
      if (ints.length) { s += 4 + (ints.length - 1); mot.push("Seu interesse em " + ints.map(nomeTema).join(", ")); }
      const cart = c.temas.filter((t) => temasCart.has(t));
      if (cart.length) { s += (pf.interesses || []).length ? 1 : 2; mot.push("Você investe em " + cart.map(nomeTema).join(", ")); }
      if (!c.perfis.includes(pf.perfil)) s -= 3;
      return Object.assign({}, c, { grupo: "aprender", motivos: mot, score: s, externo: c.url.startsWith("http"), cta: ctaPorFormato(c.formato) });
    }).filter((c) => c.score > 0 && !ocultos.has(c.id)).sort((a, b) => b.score - a.score).slice(0, LIMITE_CONTEUDO);

    // Intercala: 2 cards dinâmicos de maior prioridade, depois alterna conteúdo e eventos
    const dinamicos = itens.filter((i) => !ocultos.has(i.id)).sort((a, b) => b.score - a.score);
    const out = dinamicos.slice(0, 2);
    let di = 2, ci = 0;
    while (di < dinamicos.length || ci < conteudo.length) {
      for (let k = 0; k < 2 && ci < conteudo.length; k++) out.push(conteudo[ci++]);
      if (di < dinamicos.length) out.push(dinamicos[di++]);
    }
    out.forEach((i) => (i.salvo = salvos.has(i.id)));
    return { perfil: pf, itens: out, ocultosCount: ocultos.size };
  }

  function nomeTema(t) {
    return { "renda fixa": "renda fixa", tesouro: "Tesouro Direto", dividendos: "dividendos", fii: "FIIs", acoes: "ações", etf: "ETFs", internacional: "internacional", derivativos: "derivativos", ir: "IR", planejamento: "planejamento" }[t] || t;
  }
  function ctaPorFormato(f) { return { Curso: "Fazer o curso", Artigo: "Ler artigo", Vídeo: "Assistir", Podcast: "Ouvir", Guia: "Abrir guia", Simulador: "Simular", Serviço: "Acessar", Notícia: "Ler notícia" }[f] || "Abrir"; }

  function ocultar(id, itemId) { const s = new Set(U.store.get("feed:ocultos:" + id, [])); s.add(itemId); U.store.set("feed:ocultos:" + id, [...s]); }
  function alternarSalvo(id, itemId) { const s = new Set(U.store.get("feed:salvos:" + id, [])); s.has(itemId) ? s.delete(itemId) : s.add(itemId); U.store.set("feed:salvos:" + id, [...s]); return s.has(itemId); }
  function restaurar(id) { U.store.set("feed:ocultos:" + id, []); }

  function calcularPerfil(respostas) {
    let pts = 0, max = 0;
    C.questionario.forEach((q) => {
      if (q.nivel || q.interesses) return;
      const r = respostas[q.id];
      if (q.tipo === "multi") { max += 3; pts += r && r.length ? Math.max(...r.map((i) => q.opcoes[i].p)) : 0; }
      else { max += 3; pts += r !== undefined ? q.opcoes[r].p : 0; }
    });
    // trava de adequação: sem reserva de emergência ou prazo < 1 ano limita a Moderado/Conservador
    let perfil = pts <= 6 ? "con" : pts <= 12 ? "mod" : "arr";
    const travas = [];
    if (respostas.prazo === 0 && perfil !== "con") { perfil = "con"; travas.push("Prazo menor que 1 ano limita o perfil a Conservador."); }
    if (respostas.reserva === 0 && perfil === "arr") { perfil = "mod"; travas.push("Sem reserva de emergência, o perfil fica limitado a Moderado."); }
    const qn = C.questionario.find((q) => q.nivel);
    const nivel = respostas.conhecimento !== undefined ? qn.opcoes[respostas.conhecimento].v : "ini";
    const qi = C.questionario.find((q) => q.interesses);
    const interesses = (respostas.interesses || []).map((i) => qi.opcoes[i].v);
    return { perfil, nivel, interesses, pontos: pts, max, travas };
  }

  return { montar, perfilDe, ocultar, alternarSalvo, restaurar, calcularPerfil, nomeTema };
})();
