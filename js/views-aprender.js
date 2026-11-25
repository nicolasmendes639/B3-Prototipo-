/* V2 — aba Aprender: vídeos para iniciantes, glossário interativo, feed por perfil e como usar o site. */
(function (V) {
  const U = window.U, C = window.CATALOGO, VD = window.VIDEOS, F = window.FEED;

  // Reaproveita uma tela antiga dentro de uma sub-aba: tira o cabeçalho e ajusta links para as rotas novas
  V._embutir = function (html) {
    const t = document.createElement("div"); t.innerHTML = html;
    const ph = t.querySelector(".page-head");
    if (ph) { ["h1", ".crumb", "p"].forEach((s) => { const e = ph.querySelector(s); if (e) e.remove(); }); if (!ph.textContent.trim()) ph.remove(); }
    return t.innerHTML.replace(/#\/para-voce\//g, "#/aprender/para-voce/").replace(/'#\/tutoriais'/g, "'#/aprender/site'").replace(/#\/tutoriais\//g, "#/aprender/site/");
  };

  const GLOSSARIO = [
    ["CDI", "💯", "Taxa que os bancos usam entre si. É a régua da renda fixa: “rende 100% do CDI”."],
    ["Dividend yield", "🌳", "Quanto uma ação pagou de proventos em 12 meses, comparado ao preço dela."],
    ["Data-com", "📌", "Último dia para ter o ativo e garantir o direito ao provento."],
    ["Ibovespa", "🌡️", "O termômetro da bolsa: a média das ações mais negociadas."],
    ["Liquidez", "💧", "Facilidade de transformar o investimento em dinheiro sem perder valor."],
    ["Volatilidade", "🎢", "O quanto o preço sobe e desce. Mais volatilidade = mais emoção."],
    ["FII", "🏢", "Fundo imobiliário: você vira cotista de prédios, galpões ou shoppings e recebe aluguéis."],
    ["ETF", "🧺", "Um único ativo que já carrega uma cesta de ações. Diversificação com um clique."],
  ];


  // ---------- Padrão visual único do Aprender: cartão de progresso + grade de cartões coloridos ----------
  const COR_ESFERA = { edu: "linear-gradient(135deg,#0e7c86,#14b8a6)", bora: "linear-gradient(135deg,#6d28d9,#a855f7)", tesouro: "linear-gradient(135deg,#15803d,#22c55e)", ofertas: "linear-gradient(135deg,#c2410c,#f59e0b)", assembleias: "linear-gradient(135deg,#334155,#64748b)", area: "linear-gradient(135deg,#06377b,#0b56b8)" };
  const EMOJI_FMT = { Curso: "🎓", Artigo: "📰", Vídeo: "🎬", Podcast: "🎧", Guia: "📘", Simulador: "🧮", Serviço: "🛎️", Notícia: "🗞️", Recebimentos: "💰", Calendário: "📅", "Para refletir": "💭", Pendência: "⚠️", Assembleia: "🗳️", "Mercado hoje": "📈", "Ofertas públicas": "🚀" };
  const COR_CAT = { "Começando": "linear-gradient(135deg,#06377b,#0b56b8)", "Meus investimentos": "linear-gradient(135deg,#0e7c86,#14b8a6)", Mercado: "linear-gradient(135deg,#c2410c,#f59e0b)", Aprender: "linear-gradient(135deg,#6d28d9,#a855f7)", Conta: "linear-gradient(135deg,#334155,#64748b)", "Relatórios": "linear-gradient(135deg,#15803d,#22c55e)" };
  const EMOJI_PERFIL = { con: "🛡️", mod: "⚖️", arr: "🚀" };

  function cardFeed(f) {
    const es = C.esferas[f.esfera] || C.esferas.area, alvo = f.externo ? ' target="_blank" rel="noopener"' : "";
    return `<article class="vcard fcard"><a class="vhit" href="${f.url}"${alvo}><div class="vthumb" style="background:${COR_ESFERA[f.esfera] || COR_ESFERA.area}"><span aria-hidden="true">${EMOJI_FMT[f.formato] || "✨"}</span><span class="dur">${U.esc(f.formato)}${f.dur && f.dur !== "—" ? " · " + U.esc(f.dur) : ""}</span>${f.salvo ? '<span class="chip blue done">★ Salvo</span>' : ""}<span class="play" aria-hidden="true">${f.externo ? "↗" : "→"}</span></div>
      <div class="vbody"><span>${U.esc(es.nome)}</span><b>${U.esc(f.titulo)}</b>${f.motivos && f.motivos[0] ? `<em class="why1">Por quê: ${U.esc(f.motivos[0])}</em>` : ""}</div></a>
      <div class="vacts"><button type="button" class="btn sm ghost" data-save="${f.id}" aria-pressed="${!!f.salvo}">${f.salvo ? "★ Salvo" : "☆ Salvar"}</button><button type="button" class="btn sm ghost" data-hide="${f.id}" title="Não tenho interesse">✕ Ocultar</button></div></article>`;
  }

  function paraVoce(id) {
    const { perfil: pf, itens, ocultosCount } = F.montar(id), P = C.perfis[pf.perfil], nv = { con: 1, mod: 2, arr: 3 }[pf.perfil];
    const avisos = itens.filter((i) => i.grupo !== "aprender"), conteudos = itens.filter((i) => i.grupo === "aprender"), salvos = itens.filter((i) => i.salvo);
    return `<section class="card xp"><div class="lvl" aria-hidden="true" style="background:${P.cor}">${EMOJI_PERFIL[pf.perfil]}</div><div style="flex:1;min-width:220px"><div class="small muted">Seu perfil${pf.origem === "inferido" ? " · estimado pela sua carteira" : ""}</div><h2>${P.nome}${pf.nivel ? " · " + C.niveis[pf.nivel] : ""}</h2>
        <div class="segbar" aria-hidden="true">${[1, 2, 3].map((n) => `<i class="${n <= nv ? "on" : ""}" style="${n <= nv ? "background:" + P.cor : ""}"></i>`).join("")}</div><div class="small muted" style="margin-top:6px">${P.desc} Os conteúdos abaixo foram escolhidos para esse perfil.</div></div>
        <a class="btn primary" href="#/perfil">${pf.origem === "inferido" ? "▶ Descobrir meu perfil" : "↺ Refazer questionário"}</a></section>
      ${avisos.length ? `<h2 class="section" style="margin-bottom:14px">Avisos da sua carteira</h2><div class="vgrid">${avisos.map(cardFeed).join("")}</div>` : ""}
      <h2 class="section" style="margin-bottom:14px">Conteúdos para o seu perfil</h2>
      ${conteudos.length ? `<div class="vgrid">${conteudos.map(cardFeed).join("")}</div>` : '<div class="card empty">Nenhum conteúdo agora.</div>'}
      ${salvos.length ? `<p class="small muted" style="margin-top:14px">★ ${salvos.length} item(ns) salvo(s) para ler depois.</p>` : ""}
      <section class="card section" style="display:flex;gap:16px;align-items:center;flex-wrap:wrap"><span style="font-size:34px" aria-hidden="true">🧭</span><div style="flex:1;min-width:220px"><h2>Por que estes conteúdos?</h2><p class="muted" style="margin:4px 0 0">Usamos o seu perfil, o seu nível e o que você tem na carteira. Não é recomendação de investimento.${ocultosCount ? "" : " Toque em ✕ para ver menos de algo."}</p></div>${ocultosCount ? `<button class="btn" id="restaurarFeed">Mostrar ${ocultosCount} oculto(s)</button>` : ""}</section>`;
  }

  function comoUsar() {
    const T = window.TUTORIAIS || [], feitos = new Set(U.store.get("tutoriais:feitos", [])), n = T.filter((t) => feitos.has(t.id)).length, prox = T.find((t) => !feitos.has(t.id)) || T[0];
    const faq = window.FAQ_B3 || [];
    return `<section class="card xp"><div class="lvl" aria-hidden="true" style="background:linear-gradient(135deg,#0b56b8,#06377b)">🧭</div><div style="flex:1;min-width:220px"><div class="small muted">Seu progresso</div><h2>${n} de ${T.length} tutoriais concluídos</h2><div class="bar" style="height:10px;margin-top:8px;max-width:420px"><i style="width:${(n / T.length) * 100}%;background:linear-gradient(90deg,#0b56b8,#5b9cff)"></i></div><div class="small muted" style="margin-top:6px">Cada tour mostra a tela de verdade, passo a passo · leva de 1 a 2 minutos</div></div>
        <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn primary" data-tour="${prox.id}">▶ ${n ? "Continuar" : "Começar"}</button><a class="btn" href="#/boas-vindas">↺ Rever boas-vindas</a></div></section>
      <h2 class="section" style="margin-bottom:14px">Tours guiados</h2>
      <div class="vgrid">${T.map((t, i) => `<button class="vcard" data-tour="${t.id}"><div class="vthumb" style="background:${COR_CAT[t.cat] || COR_CAT["Começando"]}"><span aria-hidden="true">${t.ic}</span>${feitos.has(t.id) ? '<span class="chip ok done">✓ Concluído</span>' : ""}<span class="dur">~${Math.max(1, Math.round(t.passos.length * 0.3))} min · ${t.passos.length} passos</span><span class="play" aria-hidden="true">▶</span></div><div class="vbody"><span>Tour ${i + 1} · ${U.esc(t.cat)}</span><b>${U.esc(t.titulo)}</b></div></button>`).join("")}</div>
      <h2 class="section" style="margin-bottom:6px">Prefere ler?</h2><p class="muted" style="margin:0 0 14px">O mesmo passo a passo dos tours, em texto.</p>
      <section class="card faq">${T.map((t) => `<details><summary>${t.ic} ${U.esc(t.titulo)}</summary><ol style="margin:10px 0 0;padding-left:20px">${t.passos.map((p) => `<li style="margin-bottom:6px"><b>${U.esc(p.titulo)}:</b> <span style="color:var(--ink-2)">${U.esc(p.texto)}</span></li>`).join("")}</ol></details>`).join("")}</section>
      ${faq.length ? `<h2 class="section" style="margin-bottom:14px">Perguntas frequentes</h2><section class="card faq">${faq.map(([q, a]) => `<details><summary>${U.esc(q)}</summary><p>${U.esc(a)}</p></details>`).join("")}</section>` : ""}
      <section class="card section" style="display:flex;gap:16px;align-items:center;flex-wrap:wrap"><span style="font-size:34px" aria-hidden="true">✦</span><div style="flex:1;min-width:220px"><h2>Ainda com dúvida?</h2><p class="muted" style="margin:4px 0 0">Pergunte à assistente: ela responde e mostra na tela onde clicar.</p></div><button class="btn primary" data-ask="Como eu uso este site?">✦ Perguntar à IA</button></section>`;
  }

  V.aprender = {
    html(ctx) {
      const { params } = ctx, aba = params[0] || "";
      const abas = [["", "🎬 Começando"], ["para-voce", "✨ Para você"], ["site", "❓ Como usar o site"]];
      let corpo = "";
      if (!aba) {
        const f = VD.feitos(), n = f.size, tot = VD.AULAS.length, nivel = n >= tot ? "Mestre" : n >= 5 ? "Investidor curioso" : n >= 2 ? "Aprendiz" : "Iniciante";
        corpo = `<section class="card xp"><div class="lvl" aria-hidden="true">${n >= tot ? "🏆" : n >= 5 ? "🚀" : n >= 2 ? "🌱" : "🐣"}</div><div style="flex:1;min-width:220px"><div class="small muted">Seu nível</div><h2>${nivel} · ${VD.xp()} XP</h2><div class="bar" style="height:10px;margin-top:8px;max-width:420px"><i style="width:${(n / tot) * 100}%;background:linear-gradient(90deg,#f59e0b,#ffcf4d)"></i></div><div class="small muted" style="margin-top:6px">${n} de ${tot} vídeos concluídos · cada vídeo tem ~1 minuto e termina com um quiz</div></div>
          ${n < tot ? `<button class="btn primary" data-video="${(VD.AULAS.find((a) => !f.has(a.id)) || VD.AULAS[0]).id}">▶ ${n ? "Continuar" : "Começar"}</button>` : ""}</section>
          <h2 class="section" style="margin-bottom:14px">Vídeos rápidos para quem está começando</h2>
          <div class="vgrid">${VD.AULAS.map((a, i) => `<button class="vcard" data-video="${a.id}"><div class="vthumb" style="background:${a.cor}"><span aria-hidden="true">${a.emoji}</span>${f.has(a.id) ? '<span class="chip ok done">✓ Assistido</span>' : ""}<span class="dur">${a.dur}</span><span class="play" aria-hidden="true">▶</span></div><div class="vbody"><span>Aula ${i + 1}</span><b>${U.esc(a.titulo)}</b></div></button>`).join("")}</div>
          <h2 class="section" style="margin-bottom:6px">Glossário em 1 clique</h2><p class="muted" style="margin:0 0 14px">Toque num cartão para ver o significado.</p>
          <div class="grid g4">${GLOSSARIO.map(([t, e, d]) => `<button class="card gl" style="text-align:left;cursor:pointer;min-height:150px" aria-expanded="false"><div style="font-size:30px" aria-hidden="true">${e}</div><b style="font-size:18px">${t}</b><p class="gl-d" style="margin:8px 0 0;color:var(--ink-2)" hidden>${d}</p><span class="gl-h small muted">Toque para ver ↓</span></button>`).join("")}</div>
          <section class="card section" style="display:flex;gap:16px;align-items:center;flex-wrap:wrap"><span style="font-size:34px" aria-hidden="true">🎓</span><div style="flex:1;min-width:220px"><h2>Quer ir mais fundo?</h2><p class="muted" style="margin:4px 0 0">Cursos completos e gratuitos na B3 Educação e notícias diárias no Bora Investir.</p></div><a class="btn" href="https://edu.b3.com.br/" target="_blank" rel="noopener">B3 Educação ↗</a><a class="btn" href="https://borainvestir.b3.com.br/" target="_blank" rel="noopener">Bora Investir ↗</a></section>`;
      } else if (aba === "para-voce") corpo = paraVoce(ctx.id);
      else if (aba === "site") corpo = comoUsar();
      return `<div class="page-head"><div><h1>Aprender</h1><p>Do zero ao confiante: vídeos curtos, conteúdos para o seu perfil e como usar o site</p></div></div>${V._sub("aprender", aba, abas)}${corpo}`;
    },
    after(ctx) {
      const { params } = ctx, aba = params[0] || "";
      document.querySelectorAll("[data-video]").forEach((b) => b.addEventListener("click", () => VD.abrir(b.dataset.video)));
      document.querySelectorAll(".gl").forEach((b) => b.addEventListener("click", () => { const d = b.querySelector(".gl-d"), o = d.hidden; d.hidden = !o; b.querySelector(".gl-h").hidden = o; b.setAttribute("aria-expanded", String(o)); }));
      if (aba === "para-voce") {
        V._bindFeed(ctx.rerender);
        const rest = document.getElementById("restaurarFeed"); if (rest) rest.addEventListener("click", () => { F.restaurar(ctx.id); ctx.rerender(); });
      }
      if (aba === "site") document.querySelectorAll("[data-tour]").forEach((b) => b.addEventListener("click", () => window.TOUR.iniciar(b.dataset.tour)));
    },
  };
})(window.VIEWS);
