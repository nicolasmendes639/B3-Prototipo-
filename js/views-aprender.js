/* V2 — aba Aprender: vídeos para iniciantes, glossário interativo, feed por perfil e como usar o site. */
(function (V) {
  const U = window.U, C = window.CATALOGO, VD = window.VIDEOS;

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
      } else if (aba === "para-voce") corpo = V._embutir(V["para-voce"].html(Object.assign({}, ctx, { params: params.slice(1) })));
      else if (aba === "site") corpo = V._embutir(V.tutoriais.html(Object.assign({}, ctx, { params: params.slice(1) })));
      return `<div class="page-head"><div><h1>Aprender</h1><p>Do zero ao confiante: vídeos curtos, conteúdos para o seu perfil e como usar o site</p></div></div>${V._sub("aprender", aba, abas)}${corpo}`;
    },
    after(ctx) {
      const { params } = ctx, aba = params[0] || "";
      document.querySelectorAll("[data-video]").forEach((b) => b.addEventListener("click", () => VD.abrir(b.dataset.video)));
      document.querySelectorAll(".gl").forEach((b) => b.addEventListener("click", () => { const d = b.querySelector(".gl-d"), o = d.hidden; d.hidden = !o; b.querySelector(".gl-h").hidden = o; b.setAttribute("aria-expanded", String(o)); }));
      if (aba === "para-voce") V["para-voce"].after(Object.assign({}, ctx, { params: params.slice(1) }));
      if (aba === "site") V.tutoriais.after(ctx);
    },
  };
})(window.VIEWS);
