/* Onboarding (boas-vindas no primeiro acesso), biblioteca de tutoriais e motor de tour guiado. */
(function (V) {
  const U = window.U;

  // ======================================================================
  // Conteúdo dos tutoriais. Cada passo: rota da tela, elemento a destacar
  // (seletor CSS), título, texto e uma ação opcional antes de destacar.
  // ======================================================================
  const TUTORIAIS = [
    { id: "primeiros-passos", cat: "Começando", ic: "🧭", titulo: "Primeiros passos na Área do Investidor", desc: "As 6 abas, a busca, ocultar valores e a assistente de IA.", passos: [
      { rota: "inicio", sel: ".tabs-main, .bottom-nav", titulo: "Seis abas, tudo à mão", texto: "Início, Carteira, Proventos, Mercado, Aprender e Relatórios. No celular, elas ficam na barra de baixo." },
      { rota: "inicio", sel: ".hero", titulo: "Seu resumo", texto: "O saldo total de todas as suas contas e quanto você ganhou ou perdeu no período escolhido." },
      { rota: "inicio", sel: "#searchBtn", titulo: "Busca", texto: "Encontre qualquer ação, FII, ETF, cripto ou página. Atalho: tecla /." },
      { rota: "inicio", sel: "#hideBtn", titulo: "Ocultar valores", texto: "Esconde todos os valores em reais, em todas as telas, até você desligar." },
      { rota: "inicio", sel: "#aiFab", titulo: "Assistente de IA", texto: "Tire dúvidas a qualquer momento. O chat abre ao lado, sem esconder a tela, e pode te mostrar onde clicar." },
      { rota: "inicio", sel: "#avatar", titulo: "Minha conta", texto: "Contas conectadas, permissões, portabilidade, privacidade e seu perfil de investidor." },
    ] },
    { id: "patrimonio", cat: "Meus investimentos", ic: "📊", titulo: "Entenda seu saldo e seu ganho", desc: "Saldo, ganho no período, pizza da carteira e o que mais mexeu no resultado.", passos: [
      { rota: "inicio", sel: ".hero .saldo", titulo: "Saldo total", texto: "Soma de tudo: B3, renda fixa e fundos das corretoras e suas criptos." },
      { rota: "inicio", sel: ".hero .ganho", titulo: "Ganho ou perda", texto: "Quanto seus investimentos valorizaram ou caíram no período, em reais e em porcentagem. Não conta dinheiro novo que você colocou." },
      { rota: "inicio", sel: ".hero .seg", titulo: "Escolha o período", texto: "Troque entre 7 dias, 30 dias, 6 meses e 12 meses. O gráfico e os números mudam juntos." },
      { rota: "inicio", sel: "[data-tour=carteira]", titulo: "Sua carteira em pizza", texto: "Cada fatia é um tipo de investimento. Ao lado, seus maiores investimentos, com o peso de cada um." },
      { rota: "inicio", sel: "#chContrib", titulo: "O que mais mexeu", texto: "Barras verdes ajudaram, vermelhas atrapalharam. Assim você entende o porquê do resultado." },
      { rota: "carteira/rentabilidade", sel: ".card:has(#chRent)", titulo: "Comparar com o CDI", texto: "Veja se sua carteira rendeu mais ou menos que a renda fixa (CDI) e que a bolsa (Ibovespa)." },
    ] },
    { id: "ativo", cat: "Mercado", ic: "🔎", titulo: "Encontre um ativo e veja o gráfico real", desc: "Busque PETR4, leia o gráfico ao vivo e os indicadores.", passos: [
      { rota: "inicio", sel: "#searchBtn", acao: () => { document.getElementById("searchBtn").click(); const q = document.getElementById("q"); q.value = "PETR"; q.dispatchEvent(new Event("input")); }, titulo: "1. Pesquise", texto: "Digite o código ou o nome. As sugestões mostram se o ativo já está na sua carteira." },
      { rota: "ativo/PETR4", sel: ".asset-head", acao: () => { const q = document.getElementById("q"); q.value = ""; document.getElementById("searchPop").classList.remove("open"); }, titulo: "2. A ficha do ativo", texto: "Nome, setor e preço no topo. Daqui você acompanha, compara ou abre os documentos oficiais." },
      { rota: "ativo/PETR4", sel: "#tvAtivo", titulo: "3. Gráfico ao vivo", texto: "Cotação real de mercado. Passe o mouse para ver cada dia e use a roda do mouse para dar zoom." },
      { rota: "ativo/PETR4", sel: ".ind-grid", titulo: "4. Indicadores", texto: "Toque no “i” de cada indicador para entender o que ele mede." },
      { rota: "ativo/PETR4", sel: "#watchBtn", titulo: "5. Acompanhar", texto: "Coloca o ativo na sua lista de acompanhamento, separada do que você tem." },
    ] },
    { id: "proventos", cat: "Meus investimentos", ic: "💰", titulo: "Proventos e calendário", desc: "Quanto recebeu, quanto vai receber e quando.", passos: [
      { rota: "proventos", sel: "#app .grid.g3", titulo: "Recebido × a receber", texto: "O que já caiu na conta fica separado do que foi anunciado. Estimativas nunca entram nos totais." },
      { rota: "proventos", sel: ".card:has(#chProv)", titulo: "Mês a mês", texto: "Barras cheias são valores pagos. As tracejadas são valores anunciados." },
      { rota: "proventos/calendario", sel: ".cal", titulo: "Calendário", texto: "📌 data-com, ✂️ data ex, 💰 pagamento, 📊 resultado e 🗳️ assembleia, dia a dia." },
      { rota: "proventos/calendario", sel: "#calMeus", titulo: "Só meus ativos", texto: "Desmarque para ver também eventos de outros ativos." },
    ] },
    { id: "feed", cat: "Aprender", ic: "✨", titulo: "Vídeos, feed e perfil", desc: "Como a aba Aprender se adapta a você.", passos: [
      { rota: "aprender", sel: ".xp", titulo: "Seu progresso", texto: "Cada vídeo concluído vale 10 XP. Suba de nível enquanto aprende." },
      { rota: "aprender", sel: ".vgrid", titulo: "Vídeos de 1 minuto", texto: "Animados, com narração e legenda, e um quiz rápido no final." },
      { rota: "aprender/para-voce", sel: "#app .feed-card", titulo: "Feed para você", texto: "Conteúdos da B3 Educação, do Bora Investir e avisos da sua carteira, escolhidos pelo seu perfil." },
      { rota: "aprender/para-voce", sel: "#app .feed-card .why", titulo: "Por que estou vendo isto?", texto: "Todo item explica o motivo: seu perfil, um interesse seu ou um ativo que você tem." },
      { rota: "aprender/perfil", sel: "#app .card", titulo: "Questionário de perfil", texto: "8 perguntas e 2 minutos. Personaliza os conteúdos, mas não substitui o perfil da sua corretora." },
    ] },
    { id: "acompanhamento", cat: "Mercado", ic: "👀", titulo: "Índices, acompanhamento e alertas", desc: "Acompanhe o mercado e ativos sem precisar tê-los.", passos: [
      { rota: "mercado", sel: "#tvIbov", titulo: "Índices ao vivo", texto: "Gráficos reais do Ibovespa e de outros índices, com uma explicação simples de cada um." },
      { rota: "mercado/meus", sel: ".pick", titulo: "Seus ativos e criptos", texto: "Escolha um dos seus investimentos para ver o gráfico real ao lado da sua posição." },
      { rota: "mercado/acompanhar", sel: "#addW", titulo: "Lista de acompanhamento", texto: "Adicione ativos para acompanhar e, se quiser, crie alertas de preço. Eles começam desligados." },
    ] },
    { id: "conexoes", cat: "Conta", ic: "🔗", titulo: "Contas conectadas e seus dados", desc: "Corretoras, exchanges, permissões e portabilidade.", passos: [
      { rota: "conta/contas", sel: "#app .alert", titulo: "Situação das contas", texto: "Encontramos suas contas pelo CPF e pelas autorizações do Open Finance. Aqui você vê se alguma está desatualizada." },
      { rota: "conta/contas", sel: "#addConta", titulo: "Conectar outra conta", texto: "Escolha a instituição e autorize no app dela. Nunca pedimos sua senha aqui." },
      { rota: "conta/permissoes", sel: "#app .card", titulo: "Permissões", texto: "Veja quem pode ler seus dados e retire o acesso quando quiser." },
    ] },
    { id: "documentos", cat: "Relatórios", ic: "📄", titulo: "Tabelas, extratos e informes", desc: "Onde estão os números em tabela e como exportar.", passos: [
      { rota: "relatorios", sel: "#app .card", titulo: "Tudo em tabela, num lugar só", texto: "As outras abas usam gráficos. Quando precisar conferir número por número, venha aqui." },
      { rota: "relatorios", sel: "[data-csv]", titulo: "Baixar CSV", texto: "Exporte para abrir no Excel ou enviar para o contador." },
      { rota: "relatorios/informes", sel: "#app .alert", titulo: "Imposto de Renda", texto: "O informe ajuda, mas não inclui corretagem, ganho de capital nem cripto." },
    ] },
  ];

  const FAQ = [
    ["Por que meu total é diferente do que vejo na corretora?", "A B3 mostra o que está registrado em seu nome na data-base, em todas as instituições. A corretora pode usar outro horário de preço ou incluir produtos que não ficam na B3, como conta corrente e previdência. Em Conexões e dados você vê a data de cada origem."],
    ["As cotações são em tempo real?", "Não. As cotações têm atraso de 15 minutos durante o pregão e mostram o fechamento depois dele. Toda cotação informa o horário e o atraso."],
    ["O que é data-com?", "É o último dia para ter o ativo e garantir o direito a um provento. No dia seguinte (data ex), quem compra não recebe aquele pagamento."],
    ["O feed recomenda investimentos?", "Não. O feed escolhe conteúdos educativos e avisos sobre a sua própria carteira. Ele não sugere comprar nem vender."],
    ["Como refaço meu perfil?", "Clique no círculo no topo → Perfil do investidor → “Refazer questionário”. Também dá para perguntar à assistente de IA."],
    ["Como a IA sabe dos meus números?", "A assistente recebe um resumo da tela e da sua carteira para responder. Ela explica e guia, mas não recomenda investimentos."],
    ["De onde vêm os gráficos ao vivo?", "Os gráficos marcados como “ao vivo” usam cotações reais do TradingView, e os preços de cripto vêm do CoinGecko. O restante do protótipo usa dados de teste."],
    ["Quem pode ver meus dados?", "Somente as empresas que você autorizou em Conexões e dados → Permissões de compartilhamento. Lá você também pode retirar o acesso."],
    ["Posso negociar pela Área do Investidor?", "Não. Compras e vendas são feitas pela sua corretora. A Área do Investidor serve para consultar, entender e resolver."],
  ];

  const feitos = () => new Set(U.store.get("tutoriais:feitos", []));
  const marcarFeito = (id) => { const s = feitos(); s.add(id); U.store.set("tutoriais:feitos", [...s]); };

  // ======================================================================
  // Motor de tour guiado (destaque sobre a tela real)
  // ======================================================================
  const TOUR = (function () {
    let tut = null, i = 0, layer = null, hl = null, pop = null, onScroll = null;
    const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
    async function achar(sel) { for (let k = 0; k < 20; k++) { const el = document.querySelector(sel); if (el && el.getBoundingClientRect().width) return el; await esperar(80); } return null; }

    function montar() {
      layer = document.createElement("div"); layer.className = "tour-layer";
      hl = document.createElement("div"); hl.className = "tour-hl";
      pop = document.createElement("div"); pop.className = "tour-pop"; pop.setAttribute("role", "dialog"); pop.setAttribute("aria-modal", "true"); pop.setAttribute("aria-live", "polite");
      document.body.append(layer, hl, pop);
      layer.addEventListener("click", fechar);
      document.addEventListener("keydown", teclas);
      onScroll = () => posicionar(); window.addEventListener("scroll", onScroll, { passive: true }); window.addEventListener("resize", aposResize);
    }
    let rzT; function aposResize() { clearTimeout(rzT); rzT = setTimeout(() => passo(i, true), 350); }
    function teclas(e) { if (!tut) return; if (e.key === "Escape") fechar(); if (e.key === "ArrowRight") passo(i + 1); if (e.key === "ArrowLeft" && i > 0) passo(i - 1); }

    let alvo = null;
    function posicionar() {
      if (!alvo || !pop) return;
      const r = alvo.getBoundingClientRect(), pad = 6;
      Object.assign(hl.style, { display: "block", top: r.top - pad + "px", left: r.left - pad + "px", width: r.width + pad * 2 + "px", height: r.height + pad * 2 + "px" });
      const vw = innerWidth, vh = innerHeight;
      if (vw < 560) { pop.classList.add("sheet"); pop.style.top = pop.style.left = ""; return; }
      pop.classList.remove("sheet");
      const pw = pop.offsetWidth, ph = pop.offsetHeight;
      let top = r.bottom + 14; if (top + ph > vh - 12) top = r.top - ph - 14; if (top < 12) top = Math.min(vh - ph - 12, Math.max(12, r.top + 12));
      let left = Math.min(Math.max(12, r.left), vw - pw - 12);
      if (r.width > vw * 0.6 && r.height > vh * 0.5) { top = vh - ph - 20; left = vw - pw - 20; }
      pop.style.top = top + "px"; pop.style.left = left + "px";
    }

    async function passo(n, silencioso) {
      if (!tut) return;
      if (n >= tut.passos.length) return concluir();
      i = Math.max(0, n);
      const p = tut.passos[i];
      if (location.hash.replace(/^#\/?/, "") !== p.rota) { location.hash = "#/" + p.rota; await esperar(120); }
      alvo = await achar(p.sel);
      if (p.acao && !silencioso) { p.acao(); await esperar(150); alvo = await achar(p.sel); }
      const total = tut.passos.length;
      pop.innerHTML = `<div class="tour-top"><span class="tour-count">${tut.ic} ${U.esc(tut.titulo)} · ${i + 1} de ${total}</span><button class="tour-x" aria-label="Fechar tutorial">✕</button></div>
        <div class="tour-dots" aria-hidden="true">${tut.passos.map((_, k) => `<i class="${k <= i ? "on" : ""}"></i>`).join("")}</div>
        <h3>${U.esc(p.titulo)}</h3><p>${U.esc(p.texto)}</p>
        <div class="tour-nav"><button class="btn sm ghost" data-t="prev" ${i === 0 ? "disabled" : ""}>← Anterior</button><button class="btn sm primary" data-t="next">${i === total - 1 ? "Concluir ✓" : "Próximo →"}</button></div>`;
      pop.querySelector(".tour-x").onclick = fechar;
      pop.querySelector('[data-t="prev"]').onclick = () => passo(i - 1);
      pop.querySelector('[data-t="next"]').onclick = () => passo(i + 1);
      if (alvo) { alvo.scrollIntoView({ block: "center", behavior: silencioso ? "auto" : "smooth" }); await esperar(silencioso ? 30 : 380); }
      else hl.style.display = "none";
      if (!alvo) { pop.classList.remove("sheet"); pop.style.top = "30%"; pop.style.left = `calc(50% - ${pop.offsetWidth / 2}px)`; }
      posicionar();
      pop.querySelector('[data-t="next"]').focus({ preventScroll: true });
    }

    function concluir() {
      marcarFeito(tut.id);
      const t = tut; fechar();
      U.toast(`Tutorial concluído: ${t.titulo}`);
      location.hash = "#/aprender/site";
    }
    function fechar() {
      tut = null; alvo = null;
      [layer, hl, pop].forEach((x) => x && x.remove()); layer = hl = pop = null;
      document.removeEventListener("keydown", teclas); window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", aposResize);
      document.body.classList.remove("touring");
    }
    function iniciar(id) {
      const t = TUTORIAIS.find((x) => x.id === id); if (!t) return;
      if (tut) fechar();
      tut = t; document.body.classList.add("touring"); montar(); passo(0);
    }
    return { iniciar, fechar };
  })();
  window.TOUR = TOUR;

  // ======================================================================
  // Tela de boas-vindas (primeiro acesso)
  // ======================================================================
  const mock = {
    inicio: `<div class="mk mk-hero"><img src="assets/b3-logo.png" alt=""><div class="mk-lines"><i style="width:70%"></i><i style="width:50%"></i></div><div class="mk-row"><b></b><b></b><b></b></div></div>`,
    contas: `<div class="conn-list">${[["B3", "#06377b", "B3 · pelo seu CPF", "Ações, FIIs, ETFs e Tesouro"], ["CO", "#0e7c86", "Sua corretora", "Open Finance · renda fixa e fundos"], ["BC", "#7a3db8", "Seu banco", "Open Finance · CDB, LCI, LCA"], ["₿", "#f7931a", "Sua exchange cripto", "Bitcoin, Ethereum…"]].map((x, k) => `<div class="conn" style="animation-delay:${k * 0.45}s"><span class="lg" style="background:${x[1]}">${x[0]}</span><div><b>${x[2]}</b><small>${x[3]}</small></div><span class="st chip ok">✓</span></div>`).join("")}</div>`,
    numeros: `<div class="mk" style="background:linear-gradient(135deg,#0b56b8,#06377b);color:#fff"><span style="color:#cfe0fb;font-size:14px">Saldo total da carteira</span><strong style="font-size:30px">R$ ••••••</strong><span style="background:rgba(255,255,255,.14);border-radius:10px;padding:6px 10px;width:max-content;color:#b7f5cf;font-weight:700">▲ R$ •••• (+2,4%) em 30 dias</span><svg viewBox="0 0 300 80" class="mk-chart"><path d="M0,60 L40,52 L80,58 L120,40 L160,44 L200,28 L240,24 L300,8" fill="none" stroke="#8ff0b5" stroke-width="3"/></svg></div>`,
    ia: `<div class="mk" style="gap:8px"><div class="msg me" style="max-width:85%;align-self:flex-end;font-size:14px">Quanto eu ganhei em 30 dias?</div><div class="msg bot" style="max-width:92%;font-size:14px">Sua carteira ganhou R$ •••• (+2,4%). Quem mais ajudou foi PETR4.<div class="acts"><button>▶ Me mostre na tela</button></div></div><div style="align-self:flex-end;width:52px;height:52px;border-radius:50%;background:linear-gradient(135deg,#0b56b8,#3b1f8f);color:#fff;display:grid;place-items:center;font-size:20px">✦</div></div>`,
    aprender: `<div class="mk"><div class="vthumb" style="background:linear-gradient(135deg,#b45309,#f59e0b);border-radius:12px;font-size:54px">🍕<span class="play">▶</span><span class="dur">1 min</span></div><b>O que é uma ação?</b><div style="display:flex;gap:8px;align-items:center"><span class="chip ok">✓ Quiz</span><span class="chip" style="background:#fff7e0;color:#8a6100">+10 XP</span></div></div>`,
    privacidade: `<div class="mk mk-priv"><div class="mk-toggle"><span>👁 Ocultar valores</span><i class="on"></i></div><div class="mk-kpi"><span>Saldo total</span><strong>R$ ••••••</strong></div><div class="mk-toggle"><span>🔔 Alertas de preço</span><i></i></div><div class="mk-toggle"><span>🔗 App de controle financeiro</span><em>Retirar acesso</em></div></div>`,
  };
  const SLIDES = [
    { k: "inicio", kicker: "Boas-vindas", titulo: "Tudo o que você tem, em um só lugar", texto: "A nova Área do Investidor junta seus investimentos da B3, das corretoras, dos bancos e até das criptos — com gráficos simples e ajuda o tempo todo.", itens: ["Leva 1 minuto", "Dá para pular e rever depois"] },
    { k: "contas", kicker: "Suas contas", titulo: "Encontramos suas contas para você", texto: "Pelo seu CPF e pelas autorizações de Open Finance, trazemos tudo automaticamente. Nada de planilha ou cadastro manual.", itens: ["Nunca pedimos a senha das instituições", "Você escolhe e pode desconectar quando quiser"] },
    { k: "numeros", kicker: "Início", titulo: "Quanto você tem e quanto ganhou", texto: "Logo na primeira tela: o saldo total e quanto sua carteira ganhou ou perdeu nos últimos 30 dias, em reais e em porcentagem. Logo abaixo, a carteira em gráfico de pizza.", itens: ["Troque o período: 7 dias, 30 dias, 6 meses ou 1 ano", "Toque no “i” para entender cada número"] },
    { k: "ia", kicker: "Assistente de IA", titulo: "Uma assistente sempre ao seu lado", texto: "Toque no botão ✦ no canto da tela. O chat abre ao lado, sem esconder sua área, explica seus números e mostra onde clicar.", itens: ["Pergunte em português, do seu jeito", "Ela guia — não recomenda investimentos"] },
    { k: "aprender", kicker: "Aprender", titulo: "Aprenda sem complicação", texto: "Vídeos de 1 minuto, animados e com quiz, explicam o básico. Conteúdos da B3 Educação chegam de acordo com o seu perfil.", itens: ["Ganhe XP a cada vídeo", "Glossário em 1 clique"] },
    { k: "privacidade", kicker: "Privacidade", titulo: "Você no controle", texto: "Oculte valores com um toque, escolha quais avisos receber e veja quem acessa seus dados.", itens: ["Alertas começam desligados", "Retire permissões quando quiser"] },
  ];
  let slide = 0;

  V["boas-vindas"] = {
    html() {
      const fim = slide >= SLIDES.length;
      const dots = `<div class="onb-dots" role="tablist" aria-label="Etapas">${SLIDES.concat([{}]).map((_, k) => `<button role="tab" aria-selected="${k === slide}" aria-label="Etapa ${k + 1}" data-go="${k}" class="${k === slide ? "on" : k < slide ? "done" : ""}"></button>`).join("")}</div>`;
      if (fim) {
        return `<div class="onb"><div class="onb-card onb-final">${dots}
          <div class="onb-kicker">Tudo pronto</div><h1>Por onde você quer começar?</h1><p class="onb-text">Escolha uma opção. Você pode rever tudo em <b>Aprender → Como usar o site</b>, ou perguntar à assistente ✦.</p>
          <div class="onb-choices">
            <button class="onb-choice rec" data-fim="explorar"><span class="ic">🏠</span><b>Ver minha carteira</b><small>Ir para o Início</small><span class="chip blue">Recomendado</span></button>
            <button class="onb-choice" data-fim="video"><span class="ic">🎬</span><b>Sou iniciante</b><small>Vídeo de 1 minuto: o que é a B3</small></button>
            <button class="onb-choice" data-fim="tour"><span class="ic">🎯</span><b>Tour guiado</b><small>1 minuto · mostra a tela de verdade</small></button>
            <button class="onb-choice" data-fim="perfil"><span class="ic">🧭</span><b>Descobrir meu perfil</b><small>2 minutos · personaliza o Aprender</small></button>
          </div>
          <div class="onb-nav"><button class="btn ghost" data-nav="prev">← Voltar</button><a class="btn ghost" href="#/aprender/site" data-fim="tutoriais">Ver todos os tutoriais</a></div></div></div>`;
      }
      const s = SLIDES[slide];
      return `<div class="onb"><div class="onb-card">
        <div class="onb-head">${dots}<button class="btn sm ghost" data-fim="pular">Pular introdução</button></div>
        <div class="onb-body"><div class="onb-copy"><div class="onb-kicker">${slide + 1} de ${SLIDES.length} · ${s.kicker}</div><h1>${s.titulo}</h1><p class="onb-text">${s.texto}</p>
          <ul class="onb-list">${s.itens.map((t) => `<li>${t}</li>`).join("")}</ul></div>
          <div class="onb-art" aria-hidden="true">${mock[s.k]}</div></div>
        <div class="onb-nav"><button class="btn" data-nav="prev" ${slide === 0 ? "style=\"visibility:hidden\"" : ""}>← Voltar</button><button class="btn primary" data-nav="next">${slide === 0 ? "Começar →" : "Próximo →"}</button></div>
      </div></div>`;
    },
    after({ rerender }) {
      const ir = (n) => { slide = Math.max(0, Math.min(SLIDES.length, n)); rerender(); };
      document.querySelectorAll("[data-nav]").forEach((b) => b.addEventListener("click", () => ir(slide + (b.dataset.nav === "next" ? 1 : -1))));
      document.querySelectorAll("[data-go]").forEach((b) => b.addEventListener("click", () => ir(+b.dataset.go)));
      document.querySelectorAll("[data-fim]").forEach((b) => b.addEventListener("click", (e) => {
        U.store.set("onb:visto", true); slide = 0;
        const f = b.dataset.fim;
        if (f === "tutoriais") return;
        e.preventDefault();
        if (f === "perfil") location.hash = "#/aprender/perfil";
        else if (f === "tour") { location.hash = "#/inicio"; setTimeout(() => TOUR.iniciar("primeiros-passos"), 300); }
        else if (f === "video") { location.hash = "#/aprender"; setTimeout(() => window.VIDEOS.abrir("b3"), 300); }
        else location.hash = "#/inicio";
        if (f === "pular") U.toast("Você pode rever a introdução em Aprender → Como usar o site");
      }));
      const onKey = (e) => { if (!document.querySelector(".onb")) return document.removeEventListener("keydown", onKey); if (e.key === "ArrowRight") ir(slide + 1); if (e.key === "ArrowLeft") ir(slide - 1); };
      document.addEventListener("keydown", onKey);
    },
  };

  // ======================================================================
  // Página Tutoriais e ajuda
  // ======================================================================
  V.tutoriais = {
    html({ params }) {
      const f = feitos(), cat = params[0] || "";
      const cats = [...new Set(TUTORIAIS.map((t) => t.cat))];
      const lista = TUTORIAIS.filter((t) => !cat || t.cat === cat);
      const pct = Math.round((f.size / TUTORIAIS.length) * 100);
      return `<div class="page-head"><div><div class="crumb">Para você</div><h1>Tutoriais e ajuda</h1><p>Tours guiados pela tela de verdade, passo a passo para ler com calma e respostas para as dúvidas mais comuns</p></div>
        <a class="btn" href="#/boas-vindas">↺ Rever boas-vindas</a></div>
      <div class="card tut-progress"><div><b>${f.size} de ${TUTORIAIS.length} tutoriais concluídos</b><div class="small muted">${f.size === TUTORIAIS.length ? "Você conhece tudo por aqui! 🎉" : "Comece por “Primeiros passos” se é sua primeira vez."}</div></div><div class="bar" style="flex:1;max-width:320px"><i style="width:${pct}%;background:var(--pos)"></i></div><span class="num"><b>${pct}%</b></span></div>
      <div class="filters" style="margin-top:16px"><div class="seg" role="group" aria-label="Categoria"><button aria-pressed="${!cat}" onclick="location.hash='#/aprender/site'">Todos</button>${cats.map((c) => `<button aria-pressed="${cat === c}" onclick="location.hash='#/aprender/site/${encodeURIComponent(c)}'">${c}</button>`).join("")}</div>
        <input id="tutBusca" type="search" placeholder="Buscar tutorial…" aria-label="Buscar tutorial" style="margin-left:auto"></div>
      <div class="grid g2" id="tutGrid">${lista.map((t) => `<article class="card tut" data-busca="${U.esc(U.normaliza(t.titulo + " " + t.desc + " " + t.passos.map((p) => p.titulo + " " + p.texto).join(" ")))}">
        <div class="tut-h"><span class="tut-ic" aria-hidden="true">${t.ic}</span><div class="grow"><div class="small muted">${t.cat} · ${t.passos.length} passos · ~${Math.max(1, Math.round(t.passos.length * 0.25))} min</div><h2>${t.titulo}</h2></div>${f.has(t.id) ? '<span class="chip ok">✓ Concluído</span>' : '<span class="chip blue">Novo</span>'}</div>
        <p class="small" style="color:var(--ink-2);margin:6px 0 12px">${t.desc}</p>
        <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn sm primary" data-tour="${t.id}">▶ ${f.has(t.id) ? "Refazer tour" : "Iniciar tour guiado"}</button></div>
        <details class="tut-steps"><summary>Ler passo a passo</summary><ol>${t.passos.map((p) => `<li><b>${U.esc(p.titulo)}</b><br><span>${U.esc(p.texto)}</span> <a href="#/${p.rota}" class="small">Ir para a tela →</a></li>`).join("")}</ol></details>
      </article>`).join("")}</div>
      <div id="tutVazio" class="empty" hidden>Nenhum tutorial encontrado.</div>
      <div class="section"><h2 style="margin-bottom:12px">Perguntas frequentes</h2><div class="card faq">${FAQ.map(([q, a]) => `<details><summary>${q}</summary><p>${a}</p></details>`).join("")}</div></div>
      <div class="card section" style="display:flex;gap:16px;align-items:center;flex-wrap:wrap"><span style="font-size:28px" aria-hidden="true">🎓</span><div class="grow" style="flex:1;min-width:200px"><h2>Quer ir além?</h2><p class="small muted" style="margin:4px 0 0">Cursos gratuitos sobre investimentos na B3 Educação e conteúdos diários no Bora Investir.</p></div><a class="btn" href="https://edu.b3.com.br/" target="_blank" rel="noopener">B3 Educação ↗</a><a class="btn" href="https://borainvestir.b3.com.br/" target="_blank" rel="noopener">Bora Investir ↗</a></div>`;
    },
    after() {
      document.querySelectorAll("[data-tour]").forEach((b) => b.addEventListener("click", () => TOUR.iniciar(b.dataset.tour)));
      const busca = document.getElementById("tutBusca");
      busca.addEventListener("input", () => {
        const q = U.normaliza(busca.value.trim()); let n = 0;
        document.querySelectorAll("#tutGrid .tut").forEach((c) => { const ok = !q || c.dataset.busca.includes(q); c.hidden = !ok; if (ok) n++; });
        document.getElementById("tutVazio").hidden = n > 0;
      });
    },
  };

  window.TUTORIAIS = TUTORIAIS;
})(window.VIEWS);
