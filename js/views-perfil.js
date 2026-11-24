/* Feed "Para você", questionário de perfil e página "Sobre o protótipo". */
(function (V) {
  const U = window.U, C = window.CATALOGO, F = window.FEED, M = window.MERCADO;
  const invAtual = () => document.getElementById("invSel").value;

  // ---------- Card do feed (reutilizado em várias telas) ----------
  V._feedCard = function (f, compacto) {
    const es = C.esferas[f.esfera] || C.esferas.area;
    const alvo = f.externo ? ' target="_blank" rel="noopener"' : "";
    return `<article class="feed-card" data-item="${f.id}"><div class="rail" style="background:${es.cor}"></div><div class="body">
      <div class="meta"><span class="src" style="color:${es.cor}">${es.nome}</span><span>·</span><span>${U.esc(f.formato)}</span>${f.dur && f.dur !== "—" ? `<span>· ${f.dur}</span>` : ""}${f.salvo ? '<span class="chip blue">Salvo</span>' : ""}</div>
      <h3>${U.esc(f.titulo)}</h3><p>${f.resumo}</p>
      ${f.motivos && f.motivos.length ? `<div class="why"><span>${compacto ? "" : "Por que você está vendo isto:"}</span>${f.motivos.slice(0, compacto ? 1 : 3).map((m) => `<span class="chip">${U.esc(m)}</span>`).join("")}</div>` : ""}
      <div class="acts"><a class="btn sm primary" href="${f.url}"${alvo}>${U.esc(f.cta || "Abrir")}${f.externo ? " ↗" : ""}</a>${f.extra ? `<a class="btn sm" href="${f.extra.url}">${f.extra.cta}</a>` : ""}
        ${compacto ? "" : `<button class="btn sm ghost" data-save="${f.id}" aria-pressed="${!!f.salvo}">${f.salvo ? "★ Salvo" : "☆ Salvar"}</button><button class="btn sm ghost" data-hide="${f.id}">Não tenho interesse</button>`}</div>
    </div></article>`;
  };
  V._bindFeed = function (rerender) {
    document.querySelectorAll("[data-save]").forEach((b) => b.addEventListener("click", () => { const on = F.alternarSalvo(invAtual(), b.dataset.save); b.setAttribute("aria-pressed", String(on)); b.textContent = on ? "★ Salvo" : "☆ Salvar"; U.toast(on ? "Salvo para depois" : "Removido dos salvos"); }));
    document.querySelectorAll("[data-hide]").forEach((b) => b.addEventListener("click", () => { F.ocultar(invAtual(), b.dataset.hide); U.toast("Entendido — vamos mostrar menos disso"); rerender && rerender(); }));
  };

  // =============== FEED ===============
  V["para-voce"] = {
    html({ id, params }) {
      const { perfil: pf, itens, ocultosCount } = F.montar(id);
      const P = C.perfis[pf.perfil];
      const aba = params[0] || "tudo";
      const filtrados = itens.filter((i) => aba === "tudo" || (aba === "salvos" ? i.salvo : i.grupo === aba));
      const nivelIdx = { con: 1, mod: 2, arr: 3 }[pf.perfil];
      return `<div class="page-head"><div><div class="crumb">Para você</div><h1>Seu feed</h1><p>Conteúdos e avisos da B3 selecionados pelo seu perfil e pela sua carteira · atualizado em ${U.data(M.BASE)}</p></div></div>
      <div class="grid g-main">
        <div>
          <div class="tabs" role="tablist">${[["tudo", "Tudo"], ["aprender", "Aprender"], ["carteira", "Sua carteira"], ["eventos", "Mercado e eventos"], ["salvos", "Salvos"]].map(([k, t]) => `<button role="tab" aria-selected="${aba === k}" onclick="location.hash='#/para-voce/${k}'">${t}</button>`).join("")}</div>
          ${pf.origem === "inferido" ? `<div class="alert info-a" style="margin-bottom:14px"><span class="ic">🧭</span><div><b>Estamos usando um perfil inferido da sua carteira.</b><p>Responda o questionário (2 min) para receber conteúdos do seu nível e dos temas que você escolher. <a href="#/perfil">Fazer agora</a></p></div></div>` : ""}
          <div class="feed">${filtrados.map((f) => V._feedCard(f)).join("") || '<div class="feed-end">Nada por aqui ainda.</div>'}
            ${filtrados.length ? `<div class="feed-end">✓ Você viu tudo por hoje. O feed é curto de propósito: novos itens aparecem quando houver algo relevante para você.${ocultosCount ? ` <button class="btn sm ghost" id="restaurar">Mostrar ${ocultosCount} item(ns) oculto(s)</button>` : ""}</div>` : ""}</div>
        </div>
        <aside class="stack">
          <div class="card profile-card"><div class="small muted">Seu perfil ${pf.origem === "inferido" ? "(inferido)" : ""}</div><div style="font-size:26px;font-weight:800;margin-top:2px">${P.nome}</div>
            <div class="gauge" aria-hidden="true">${[1, 2, 3].map((n) => `<span class="${n <= nivelIdx ? "on" : ""}"></span>`).join("")}</div>
            <p style="margin:0 0 10px;font-size:13px">${P.desc}</p>
            ${pf.nivel ? `<div class="small" style="margin-bottom:4px">Conhecimento: <b>${C.niveis[pf.nivel]}</b></div>` : ""}
            ${pf.interesses && pf.interesses.length ? `<div class="small" style="margin-bottom:10px">Interesses: <b>${pf.interesses.map(F.nomeTema).join(", ")}</b></div>` : ""}
            <a class="btn sm" href="#/perfil">${pf.origem === "inferido" ? "Responder questionário" : "Refazer questionário"}</a></div>
          <div class="card"><div class="card-h"><div><h2>Ver o feed de outro perfil</h2><div class="sub">Para testes e demonstração</div></div></div>
            <div class="seg" role="group">${Object.entries(C.perfis).map(([k, p]) => `<button data-sim="${k}" aria-pressed="${pf.perfil === k}">${p.nome}</button>`).join("")}</div></div>
          <div class="card"><div class="card-h"><h2>De onde vêm os conteúdos</h2></div>
            ${["edu", "bora", "tesouro", "ofertas", "assembleias", "area"].map((k) => { const e = C.esferas[k]; return `<div class="list-item"><span class="dot" style="background:${e.cor}"></span><div class="grow"><a href="${e.url}" ${e.url.startsWith("http") ? 'target="_blank" rel="noopener"' : ""}>${e.nome}${e.url.startsWith("http") ? " ↗" : ""}</a></div><span class="small muted">${itens.filter((i) => i.esfera === k).length}</span></div>`; }).join("")}</div>
          <div class="card"><h3>Como o feed funciona</h3><ul class="small" style="padding-left:18px;margin:8px 0 0;color:var(--ink-2)">
            <li>Usa seu perfil, nível, interesses e o que você tem na carteira.</li><li>Cada item mostra por que apareceu.</li><li>É finito: sem rolagem infinita nem estímulo a negociar.</li><li>Não é recomendação de investimento.</li></ul></div>
        </aside>
      </div>`;
    },
    after({ id, rerender }) {
      V._bindFeed(rerender);
      const rest = document.getElementById("restaurar"); if (rest) rest.addEventListener("click", () => { F.restaurar(id); rerender(); });
      document.querySelectorAll("[data-sim]").forEach((b) => b.addEventListener("click", () => {
        const atual = U.store.get("perfil:" + id, null) || { nivel: "int", interesses: [] };
        U.store.set("perfil:" + id, Object.assign({}, atual, { perfil: b.dataset.sim, simulado: true, data: M.BASE }));
        U.toast(`Feed recalculado para perfil ${C.perfis[b.dataset.sim].nome}`); rerender();
      }));
    },
  };

  // =============== QUESTIONÁRIO ===============
  let quiz = { passo: 0, resp: {}, editando: false };
  V.perfil = {
    html({ id }) {
      const salvo = U.store.get("perfil:" + id, null);
      if (salvo && !quiz.editando) {
        const P = C.perfis[salvo.perfil];
        return `<div class="page-head"><div><h1>Meu Perfil de Investidor</h1><p>${salvo.simulado ? "Perfil escolhido manualmente para teste" : "Resultado do questionário de " + U.data(salvo.data)}</p></div></div>
        <div class="grid g2"><div class="card profile-card"><div class="small muted">Seu perfil</div><div style="font-size:32px;font-weight:800">${P.nome}</div>
          <div class="gauge">${[1, 2, 3].map((n) => `<span class="${n <= { con: 1, mod: 2, arr: 3 }[salvo.perfil] ? "on" : ""}"></span>`).join("")}</div><p>${P.desc}</p>
          ${salvo.pontos !== undefined ? `<p class="small">Pontuação de risco: ${salvo.pontos} de ${salvo.max}</p>` : ""}
          ${(salvo.travas || []).map((t) => `<p class="small">⚠️ ${t}</p>`).join("")}
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px"><a class="btn" href="#/para-voce">Ver meu feed</a><button class="btn" id="refazer">Refazer questionário</button></div></div>
        <div class="card"><h2>O que muda com o seu perfil</h2><ul style="padding-left:18px;color:var(--ink-2)">
          <li><b>Feed “Para você”</b> prioriza cursos da B3 Educação e artigos do Bora Investir adequados ao perfil <b>${P.nome}</b>${salvo.nivel ? ` e ao nível <b>${C.niveis[salvo.nivel]}</b>` : ""}.</li>
          ${salvo.interesses && salvo.interesses.length ? `<li>Temas escolhidos: <b>${salvo.interesses.map(F.nomeTema).join(", ")}</b>.</li>` : ""}
          <li>${salvo.perfil === "arr" ? "Inclui conteúdos sobre derivativos, small caps e ofertas públicas, sempre com explicação de riscos." : salvo.perfil === "mod" ? "Equilibra renda fixa, FIIs, ETFs e diversificação por objetivo." : "Foca em reserva de emergência, Tesouro Direto e renda fixa com garantia do FGC."}</li>
          <li>Seus dados de carteira continuam iguais — o perfil não altera posições nem limita acessos.</li></ul>
          <div class="alert info-a"><span class="ic">ℹ️</span><div><p>Esta é uma simulação educativa para personalizar conteúdos. O perfil oficial de adequação (suitability, Resolução CVM 30) é feito pela sua corretora.</p></div></div></div></div>`;
      }
      const Q = C.questionario, q = Q[quiz.passo], r = quiz.resp[q.id];
      return `<div class="page-head"><div><div class="crumb">Meu Perfil de Investidor</div><h1>Questionário de perfil</h1><p>8 perguntas · cerca de 2 minutos · suas respostas ficam neste navegador</p></div></div>
      <div class="card quiz"><div class="small muted">Pergunta ${quiz.passo + 1} de ${Q.length}</div><div class="progress"><i style="width:${(quiz.passo / Q.length) * 100}%"></i></div>
        <fieldset style="border:0;padding:0;margin:0"><legend><h2 style="font-size:19px;margin-bottom:16px">${q.titulo}</h2></legend>
        ${q.opcoes.map((o, i) => `<label class="opt"><input type="${q.tipo === "multi" ? "checkbox" : "radio"}" name="q" value="${i}" ${q.tipo === "multi" ? ((r || []).includes(i) ? "checked" : "") : r === i ? "checked" : ""}> <span>${o.t}</span></label>`).join("")}</fieldset>
        ${q.max ? `<div class="small muted">Escolha até ${q.max}.</div>` : ""}
        <div class="quiz-nav"><button class="btn" id="qVoltar" ${quiz.passo === 0 ? "disabled" : ""}>← Voltar</button><button class="btn primary" id="qProx" ${r === undefined || (Array.isArray(r) && !r.length && q.id !== "interesses") ? "disabled" : ""}>${quiz.passo === Q.length - 1 ? "Ver meu perfil" : "Próxima →"}</button></div>
      </div>`;
    },
    after({ id, rerender }) {
      const ref = document.getElementById("refazer");
      if (ref) { ref.addEventListener("click", () => { quiz = { passo: 0, resp: {}, editando: true }; rerender(); }); return; }
      const Q = C.questionario, q = Q[quiz.passo];
      if (q.id === "interesses" && quiz.resp.interesses === undefined) quiz.resp.interesses = [];
      const prox = document.getElementById("qProx");
      document.querySelectorAll('input[name="q"]').forEach((inp) => inp.addEventListener("change", () => {
        if (q.tipo === "multi") {
          let sel = [...document.querySelectorAll('input[name="q"]:checked')].map((x) => +x.value);
          if (q.max && sel.length > q.max) { inp.checked = false; sel = sel.filter((v) => v !== +inp.value); U.toast(`Escolha até ${q.max}`); }
          quiz.resp[q.id] = sel;
          prox.disabled = !sel.length && q.id !== "interesses";
        } else { quiz.resp[q.id] = +inp.value; prox.disabled = false; }
      }));
      document.getElementById("qVoltar").addEventListener("click", () => { quiz.passo--; rerender(); });
      prox.addEventListener("click", () => {
        if (quiz.passo < Q.length - 1) { quiz.passo++; rerender(); return; }
        const res = F.calcularPerfil(quiz.resp);
        U.store.set("perfil:" + id, Object.assign(res, { data: M.BASE, respostas: quiz.resp }));
        quiz = { passo: 0, resp: {}, editando: false };
        U.toast(`Perfil ${C.perfis[res.perfil].nome} — seu feed foi atualizado`);
        location.hash = "#/perfil"; rerender();
      });
    },
  };

  // =============== SOBRE O PROTÓTIPO ===============
  V.sobre = {
    html() {
      const mapa = [
        ["Busca por código/nome + ficha do ativo", "Nasdaq (página por ticker), Status Invest", "Busca no topo (atalho “/”), ficha com cotação, indicadores, proventos e documentos"],
        ["Mercado hoje (índices, altas, baixas, mais negociadas)", "Nasdaq Market Activity", "Universo do ranking explicado; horário e atraso sempre visíveis"],
        ["Calendário de proventos e resultados", "Nasdaq, Sharesight", "Data-com, data ex e pagamento separados; previsto × confirmado"],
        ["Lista de acompanhamento e alertas", "Robinhood, Status Invest", "Separada da carteira; alertas opcionais e desligados por padrão"],
        ["Patrimônio × aportes × resultado", "Kinvo, Gorila", "KPIs separados, metodologia no “i”, rentabilidade × CDI × Ibovespa"],
        ["Recebimentos pago × anunciado × estimado", "Sharesight", "Estimativas nunca entram nos totais"],
        ["Indicadores em camadas e comparador", "Status Invest, Gorila", "Explicação de cada indicador; comparação de até 4 ativos"],
        ["Central de confiança (conexões, permissões, portabilidade)", "B3 (APIs, portabilidade), apps com Open Finance", "Origem, data-base, quem resolve e próximo passo"],
        ["Feed personalizado por perfil", "Empower (objetivos), Robinhood (personalização)", "Liga B3 Educação, Bora Investir, Tesouro Direto, ofertas e assembleias; finito e explicável"],
      ];
      return `<div class="page-head"><div><div class="crumb">Sobre o protótipo</div><h1>Benchmark e decisões de produto</h1><p>Versão de teste construída a partir do benchmark B3 × Kinvo × Status Invest × Gorila × Nasdaq × Empower × Sharesight × Robinhood</p></div></div>
      <div class="card"><div class="tbl-wrap"><table><thead><tr><th>Funcionalidade</th><th>Referência</th><th>Como adaptamos</th></tr></thead><tbody>${mapa.map((m) => `<tr><td><b>${m[0]}</b></td><td>${m[1]}</td><td>${m[2]}</td></tr>`).join("")}</tbody></table></div></div>
      <div class="grid g2 section">
        <div class="card"><h2>O que é real e o que é simulado</h2><ul class="small" style="padding-left:18px;color:var(--ink-2)">
          <li><b>Da planilha Amostra_B3i.xlsx:</b> 100 investidores fictícios, posições por classe e por ativo, movimentações, proventos e evolução patrimonial (data-base ${U.data(M.BASE)}).</li>
          <li><b>Simulado:</b> cotações diárias, índices, CDI, indicadores fundamentalistas, calendário de eventos, ofertas, assembleias e status das conexões.</li>
          <li><b>Conteúdos:</b> títulos ilustrativos que apontam para as páginas das plataformas B3 Educação, Bora Investir e Tesouro Direto.</li></ul></div>
        <div class="card"><h2>Fora do escopo desta versão</h2><ul class="small" style="padding-left:18px;color:var(--ink-2)">
          <li>Login, recuperação de acesso e dados reais.</li><li>Metas e carteiras por objetivo (P2 do backlog).</li><li>Apuração de IR / DARF e dados externos via Open Finance (investigar antes de construir).</li><li>Execução de ordens — fora do papel da Área do Investidor.</li></ul></div>
      </div>
      <div class="card section"><h2>Teste de usabilidade sugerido</h2><p class="small" style="color:var(--ink-2)">Pedir ao investidor, sem ajuda: (1) encontrar PETR4 e explicar o horário/atraso da cotação; (2) dizer quanto recebeu de proventos e quanto ainda vai receber; (3) explicar a diferença entre aporte e resultado; (4) responder o questionário e dizer por que um item do feed apareceu.</p></div>`;
    },
  };
})(window.VIEWS);
