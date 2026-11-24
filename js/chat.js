/* Assistente de IA (canto inferior direito). Abre um painel lateral SEM esconder a tela.
 * - Com o servidor (server.py) + SDK + credencial: usa o Claude de verdade (POST /api/chat).
 * - Sem isso: responde com o assistente local (modo demonstração), usando o contexto da carteira.
 * O assistente pode abrir abas, iniciar tours e vídeos: [[ir:rota]] [[tour:id]] [[video:id]].
 */
window.CHAT = (function () {
  const U = window.U, K = window.CONSOL, C = window.CATALOGO, M = window.MERCADO;
  let hist = U.store.get("chat:hist", []), modo = "verificando", aberto = false;
  const fab = document.getElementById("aiFab"), painel = document.getElementById("aiPanel");

  const SUG = {
    inicio: ["Quanto eu ganhei em 30 dias?", "O que mais pesou no resultado?", "Explique o gráfico de pizza"],
    carteira: ["Qual é meu maior investimento?", "Estou bem diversificado?", "O que é rentabilidade × CDI?"],
    proventos: ["Quanto vou receber?", "O que é data-com?", "Me mostre o calendário"],
    mercado: ["O que é o Ibovespa?", "Como ler esse gráfico?", "Como acompanho um ativo?"],
    aprender: ["Por qual vídeo eu começo?", "O que é renda fixa?", "Qual é o meu perfil?"],
    relatorios: ["Como exporto meu extrato?", "O informe serve para o IR?"],
    conta: ["Como conecto outra corretora?", "Quem pode ver meus dados?"],
    ativo: ["O que significa P/L?", "Quando cai o próximo provento?", "Como ler esse gráfico?"],
  };

  function contexto() {
    const id = window.APP.id(), r = window.CART.resumo(id), res = K.resultado(id, "30D"), its = K.itens(id);
    const rota = (location.hash.replace(/^#\/?/, "") || "inicio");
    const pf = window.FEED.perfilDe(id);
    return {
      tela: rota, titulo_tela: (document.querySelector("#app h1") || {}).textContent || "",
      saldo_total: +res.fim.toFixed(2), ganho_30d: +res.ganho.toFixed(2), ganho_30d_pct: +res.pct.toFixed(2),
      distribuicao: K.porClasse(id).map((c) => `${c.nome}: ${c.pct.toFixed(1)}%`),
      maiores_investimentos: its.slice(0, 6).map((x) => `${x.tipo === "rf" ? x.nome : x.cod} R$ ${x.valor.toFixed(2)} (${x.pct.toFixed(1)}%)`),
      proventos_recebidos_12m: +r.recebidos12.reduce((a, p) => a + p.valor, 0).toFixed(2),
      proventos_a_receber: r.anunciados.map((p) => `${p.tk} R$ ${p.valor.toFixed(2)} em ${p.data}`),
      conta_pendente: r.pendInst || null,
      perfil: C.perfis[pf.perfil].nome + (pf.origem === "inferido" ? " (inferido da carteira)" : ""),
      videos_assistidos: U.store.get("videos:feitos", []),
      data_base: M.BASE,
    };
  }

  // ------------- Assistente local (modo demonstração) -------------
  const has = (t, ...ws) => ws.some((w) => t.includes(w));
  function local(pergunta) {
    const t = U.normaliza(pergunta), x = contexto(), brl = (v) => U.brl(v, true);
    const id = window.APP.id();
    if (has(t, "ganh", "lucr", "perd", "rendeu", "resultado", "caiu", "subiu")) {
      const ct = K.contribuicao(id, "30D"), mais = ct[0], menos = ct[ct.length - 1];
      return `Nos últimos 30 dias sua carteira ${x.ganho_30d >= 0 ? "ganhou" : "perdeu"} ${brl(Math.abs(x.ganho_30d))} (${x.ganho_30d_pct >= 0 ? "+" : ""}${U.num(x.ganho_30d_pct, 2)}%).\n\nQuem mais ajudou: ${mais.tipo === "rf" ? mais.nome : mais.cod} (${brl(mais.ganho)}). Quem mais pesou contra: ${menos.tipo === "rf" ? menos.nome : menos.cod} (${brl(menos.ganho)}).\n\nIsso é variação de mercado — não conta dinheiro que você colocou ou tirou.\n[[ir:carteira/rentabilidade]]`;
    }
    if (has(t, "saldo", "patrimonio", "quanto eu tenho", "total")) return `Seu saldo total hoje é ${brl(x.saldo_total)}, somando B3 e corretoras.\n\nDivisão: ${x.distribuicao.join(" · ")}.\n[[ir:carteira]]`;
    if (has(t, "maior investimento", "maior ativo", "concentr", "diversific")) {
      const top = K.itens(id)[0];
      return `Seu maior investimento é ${top.tipo === "rf" ? top.nome : top.cod}, com ${U.num(top.pct, 1)}% da carteira.${top.pct > 30 ? "\n\nIsso é uma concentração alta: se ele cair, sente-se muito no total. Diversificar ajuda a suavizar." : "\n\nNenhum investimento passa de 30% — sinal de boa divisão."}\n[[video:diversificar]]`;
    }
    if (has(t, "receber", "provento", "dividend", "jcp", "rendimento")) return x.proventos_a_receber.length ? `Você tem ${x.proventos_a_receber.length} pagamento(s) anunciado(s):\n• ${window.CART.resumo(id).anunciados.slice().sort((a, b) => (a.data < b.data ? -1 : 1)).map((p) => `${p.tk}: ${brl(p.valor)} em ${U.data(p.data)}`).join("\n• ")}\n\nNos últimos 12 meses você já recebeu ${brl(x.proventos_recebidos_12m)}.\n[[ir:proventos]]` : `Não há proventos anunciados agora. Em 12 meses você recebeu ${brl(x.proventos_recebidos_12m)}.\n[[ir:proventos]]`;
    if (has(t, "data-com", "data com", "datacom", "data ex")) return "Data-com é o último dia para ter o ativo e garantir o provento — como estar na lista de convidados. No dia seguinte (data ex), quem compra já não recebe aquele pagamento.\n[[video:dividendos]]";
    if (has(t, "calendario")) return "O calendário mostra data-com, data ex, pagamentos, resultados e assembleias dos seus ativos, mês a mês.\n[[ir:proventos/calendario]]";
    if (has(t, "ibovespa", "ibov", "indice")) return "O Ibovespa é o termômetro da bolsa: mostra o desempenho médio das ações mais negociadas da B3. Se ele sobe, a maioria das grandes empresas subiu no dia.\n[[ir:mercado]]";
    if (has(t, "grafico", "ler")) return "Dica rápida: o eixo de baixo é o tempo e o da esquerda é o preço. Linha subindo = valorizou. Nos gráficos ao vivo, passe o mouse para ver o preço de cada dia e use a roda do mouse para dar zoom.\n[[tour:ativo]]";
    if (has(t, "pizza", "rosca", "divisao")) return `O gráfico de pizza mostra como seu dinheiro está dividido entre tipos de investimento: ${x.distribuicao.join(" · ")}. Cada fatia é uma classe.\n[[video:diversificar]]`;
    if (has(t, "cdi")) return "CDI é a taxa que os bancos usam entre si e serve de régua para a renda fixa. Quando um investimento “rende 100% do CDI”, ele acompanha essa taxa. Comparar sua carteira com o CDI mostra se valeu o risco.\n[[ir:carteira/rentabilidade]]";
    if (has(t, "renda fixa", "tesouro", "cdb", "lci", "lca")) return "Renda fixa é emprestar dinheiro (para o governo, no Tesouro Direto, ou para bancos, em CDB/LCI/LCA) e receber de volta com juros combinados. É o caminho mais previsível.\n[[video:rendafixa]]";
    if (has(t, "acao", "acoes")) return "Uma ação é um pedacinho de uma empresa. Ao comprar, você vira sócio: pode ganhar com a valorização e com dividendos — e o preço oscila todo dia.\n[[video:acao]]";
    if (has(t, "cripto", "bitcoin", "btc", "ethereum")) return "A B3 não intermedia a compra direta de criptomoedas. Na bolsa, o que existe são ETFs de Criptomoedas e Fundos de Criptomoedas: fundos com cotas negociadas na B3, como uma ação, que acompanham o preço de criptos como o Bitcoin. O preço oscila bastante, então é um investimento de alto risco.\n[[ir:mercado/meus]]";
    if (has(t, "p/l", "pl ", "indicador", "p/vp", "dividend yield", "roe")) return "P/L é preço ÷ lucro: quantos anos de lucro “pagariam” a ação. P/VP compara o preço com o patrimônio da empresa. Dividend yield é quanto ela pagou de proventos em 12 meses vs. o preço. Na ficha do ativo, toque no “i” de cada um.\n[[tour:ativo]]";
    if (has(t, "perfil", "suitability", "questionario")) return `Seu perfil atual é ${x.perfil}. Ele personaliza os conteúdos do Aprender. Quer refazer o questionário? Leva 2 minutos.\n[[ir:perfil]]`;
    if (has(t, "video", "comec", "iniciante", "aprender", "leigo")) { const f = new Set(x.videos_assistidos), p = window.VIDEOS.AULAS.find((a) => !f.has(a.id)) || window.VIDEOS.AULAS[0]; return `Sugiro começar por “${p.titulo}” — tem 1 minuto e termina com um quiz rápido.\n[[video:${p.id}]]`; }
    if (has(t, "export", "extrato", "csv", "planilha", "tabela")) return "Todas as tabelas ficam em Relatórios: posição, movimentações e proventos, com botão para baixar em CSV (abre no Excel).\n[[ir:relatorios]]";
    if (has(t, "imposto", " ir", "informe", "declara")) return "O informe de rendimentos da B3 ajuda na declaração, mas não inclui corretagem nem ganho de capital. O de 2026 sai em fevereiro de 2027.\n[[ir:relatorios/informes]]";
    if (has(t, "conect", "corretora", "open finance", "adicionar conta")) return "Suas contas são identificadas pelo CPF. Para incluir outra corretora ou banco, vá em Minha conta → Contas conectadas → “Conectar outra conta”. Você autoriza no app da instituição; nunca pedimos senha aqui.\n[[ir:conta/contas]]";
    if (has(t, "quem pode", "permiss", "privacidade", "dados")) return "Só as empresas que você autorizou podem ver seus dados, e você pode retirar o acesso quando quiser.\n[[ir:conta/permissoes]]";
    if (has(t, "acompanh", "alerta", "watchlist")) return "Para acompanhar um ativo sem tê-lo, abra a ficha dele e toque em “Acompanhar”. Os alertas de preço ficam em Mercado → Acompanhamento e começam desligados.\n[[tour:acompanhamento]]";
    if (has(t, "ocultar", "esconder")) return "Toque no ícone de olho no topo para ocultar todos os valores. Útil em lugares públicos.";
    if (has(t, "comprar", "vender", "devo", "recomenda", "vale a pena", "investir em")) return "Não posso recomendar compra ou venda de ativos específicos. Posso explicar como um investimento funciona, mostrar seus números ou indicar um conteúdo para você decidir com mais segurança.\n[[ir:aprender]]";
    if (has(t, "como usar", "ajuda", "tour", "tutorial", "nao sei", "passo a passo")) return "Posso te guiar pela tela, passo a passo. Quer começar pelo tour de primeiros passos?\n[[tour:primeiros-passos]]";
    if (has(t, "oi", "ola", "bom dia", "boa tarde", "boa noite")) return `Olá! Sou a assistente da sua Área do Investidor. Posso explicar seus números, tirar dúvidas e te guiar pelo site. Seu saldo hoje é ${brl(x.saldo_total)}.`;
    return "Ainda não sei responder isso no modo demonstração 😅. Experimente perguntar sobre seu saldo, quanto ganhou, proventos, data-com, gráficos ou como usar o site.\n[[tour:primeiros-passos]]";
  }

  // ------------- Ações dentro das respostas -------------
  const NOMES_ROTA = { inicio: "Início", carteira: "Carteira", proventos: "Proventos", mercado: "Mercado", aprender: "Aprender", relatorios: "Relatórios", conta: "Minha conta" };
  function rotuloAcao(tipo, alvo) {
    if (tipo === "ir") { const b = alvo.split("/")[0]; return b === "ativo" ? `Abrir ${alvo.split("/")[1]}` : `Abrir ${NOMES_ROTA[b] || alvo}${alvo.includes("/") ? " › " + alvo.split("/").slice(1).join(" ") : ""}`; }
    if (tipo === "tour") { const t = (window.TUTORIAIS || []).find((x) => x.id === alvo); return "▶ Me mostre na tela" + (t ? ": " + t.titulo.split(" ").slice(0, 4).join(" ") : ""); }
    if (tipo === "video") { const v = window.VIDEOS.AULAS.find((x) => x.id === alvo); return "🎬 " + (v ? v.titulo : "Ver vídeo"); }
  }
  function executar(tipo, alvo) {
    if (tipo === "ir") location.hash = "#/" + alvo;
    if (tipo === "tour") window.TOUR.iniciar(alvo);
    if (tipo === "video") window.VIDEOS.abrir(alvo);
  }
  function separar(txt) { const acoes = []; const limpo = txt.replace(/\[\[(ir|tour|video):([^\]]+)\]\]/g, (_, a, b) => { acoes.push([a, b.trim()]); return ""; }).trim(); return { limpo, acoes }; }

  function desenhar() {
    const box = document.getElementById("aiMsgs"); if (!box) return;
    box.innerHTML = hist.map((m, i) => { if (m.role === "user") return `<div class="msg me">${U.esc(m.content)}</div>`; const { limpo, acoes } = separar(m.content); return `<div class="msg bot">${U.esc(limpo)}${acoes.length ? `<div class="acts">${acoes.map(([a, b]) => `<button data-a="${a}" data-b="${U.esc(b)}">${U.esc(rotuloAcao(a, b))}</button>`).join("")}</div>` : ""}</div>`; }).join("");
    box.querySelectorAll("[data-a]").forEach((b) => b.addEventListener("click", () => executar(b.dataset.a, b.dataset.b)));
    box.scrollTop = box.scrollHeight;
    sugestoes();
  }
  function sugestoes() {
    const el = document.getElementById("aiSugs"); if (!el) return;
    const base = (location.hash.replace(/^#\/?/, "") || "inicio").split("/")[0];
    el.innerHTML = (SUG[base] || SUG.inicio).map((s) => `<button>${U.esc(s)}</button>`).join("");
    el.querySelectorAll("button").forEach((b) => b.addEventListener("click", () => enviar(b.textContent)));
  }

  async function enviar(txt) {
    txt = (txt || "").trim(); if (!txt) return;
    hist.push({ role: "user", content: txt }); desenhar();
    const box = document.getElementById("aiMsgs"); box.insertAdjacentHTML("beforeend", '<div class="msg bot" id="aiTyping"><span class="typing"><i></i><i></i><i></i></span></div>'); box.scrollTop = box.scrollHeight;
    let resposta = null;
    if (modo === "ia") {
      try {
        const r = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mensagens: hist.slice(-20), contexto: contexto() }) });
        const j = await r.json(); if (r.ok && j.texto) resposta = j.texto; else if (j.erro) resposta = "⚠️ " + j.erro + "\n\n" + local(txt);
      } catch (e) { resposta = null; }
    } else await new Promise((r) => setTimeout(r, 450));
    if (!resposta) resposta = local(txt);
    const t = document.getElementById("aiTyping"); if (t) t.remove();
    hist.push({ role: "assistant", content: resposta }); hist = hist.slice(-40); U.store.set("chat:hist", hist); desenhar();
  }

  function montar() {
    painel.innerHTML = `<div class="ai-head"><div class="av" aria-hidden="true">✦</div><div><b>Assistente B3</b><small id="aiModo"><i></i>verificando…</small></div><button class="icon-btn x" id="aiLimpar" title="Nova conversa" aria-label="Nova conversa" style="width:36px;height:36px;font-size:15px">↺</button><button class="icon-btn" id="aiX" aria-label="Fechar assistente" style="width:36px;height:36px;font-size:15px">✕</button></div>
      <div class="ai-msgs" id="aiMsgs" aria-live="polite"></div><div class="ai-sugs" id="aiSugs"></div>
      <form class="ai-form" id="aiForm"><input id="aiIn" placeholder="Pergunte sobre sua carteira ou o site…" aria-label="Mensagem para a assistente" autocomplete="off"><button aria-label="Enviar">➤</button></form>
      <div class="ai-foot">A assistente explica e guia — não recomenda investimentos.</div>`;
    document.getElementById("aiX").onclick = fechar;
    document.getElementById("aiLimpar").onclick = () => { hist = []; U.store.set("chat:hist", hist); boasVindas(); };
    document.getElementById("aiForm").onsubmit = (e) => { e.preventDefault(); const i = document.getElementById("aiIn"); enviar(i.value); i.value = ""; };
    if (!hist.length) boasVindas(); else desenhar();
    fetch("/api/status").then((r) => r.json()).then((j) => { modo = j.ia ? "ia" : "demo"; rotuloModo(j.modelo); }).catch(() => { modo = "demo"; rotuloModo(); });
  }
  function rotuloModo(modelo) { const el = document.getElementById("aiModo"); if (el) el.innerHTML = modo === "ia" ? `<i></i>IA ativa · Claude` : `<i style="background:#f59e0b"></i>Modo demonstração (respostas locais)`; }
  function boasVindas() {
    const x = contexto();
    hist = [{ role: "assistant", content: `Oi! Eu sou a assistente da sua Área do Investidor ✦\n\nPosso explicar seus números enquanto você navega — a tela continua aberta ao lado. Hoje seu saldo é ${U.brl(x.saldo_total, true)} e nos últimos 30 dias você ${x.ganho_30d >= 0 ? "ganhou" : "perdeu"} ${U.brl(Math.abs(x.ganho_30d), true)}.\n\nPergunte o que quiser ou escolha uma sugestão abaixo.` }];
    U.store.set("chat:hist", hist); desenhar();
  }
  function abrir(pergunta) {
    if (!painel.innerHTML) montar();
    aberto = true; document.body.classList.add("chat-open"); painel.setAttribute("aria-hidden", "false"); fab.setAttribute("aria-expanded", "true");
    sugestoes(); setTimeout(() => document.getElementById("aiIn").focus(), 250);
    redesenhar();
    if (pergunta) enviar(pergunta);
  }
  function fechar() { aberto = false; document.body.classList.remove("chat-open"); painel.setAttribute("aria-hidden", "true"); fab.setAttribute("aria-expanded", "false"); fab.focus(); redesenhar(); }
  // a área principal muda de largura quando o chat abre/fecha: redesenha os gráficos
  function redesenhar() { if (innerWidth >= 1100 && !document.querySelector(".tour-pop") && !/mercado|ativo/.test(location.hash)) setTimeout(() => window.APP.render(), 280); }
  fab.addEventListener("click", () => abrir());
  document.addEventListener("click", (e) => { const b = e.target.closest("[data-ask]"); if (b) abrir(b.dataset.ask); });
  window.addEventListener("hashchange", () => { if (aberto) sugestoes(); });
  return { abrir, fechar, local, contexto };
})();
