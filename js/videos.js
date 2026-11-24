/* Videoaulas animadas para iniciantes: cenas em HTML/CSS, legenda, narração por voz (Web Speech API) e quiz.
 * Conteúdo original e curto (~1 min). Em produção, podem virar vídeos reais da B3 Educação com o mesmo roteiro.
 */
window.VIDEOS = (function () {
  const U = window.U;
  const svgLinha = (d, cor = "#ffcf4d") => `<svg class="draw" viewBox="0 0 320 120" width="min(70vw,420px)" height="140"><path d="${d}" fill="none" stroke="${cor}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  const barras = (hs, cor = "#ffcf4d") => `<div class="row" style="align-items:flex-end;height:150px">${hs.map((h, i) => `<div class="grow" style="width:38px;height:${h}px;background:${cor};border-radius:8px 8px 0 0;animation-delay:${i * 0.25}s"></div>`).join("")}</div>`;

  const AULAS = [
    { id: "b3", titulo: "O que é a B3?", emoji: "🏛️", cor: "linear-gradient(135deg,#06377b,#0b56b8)", dur: "1 min", cenas: [
      { v: `<div class="em">🏛️</div><h3>A B3 é a bolsa de valores do Brasil</h3>`, t: "A B3 é a bolsa de valores do Brasil. É lá que ações, fundos e títulos são negociados." },
      { v: `<div class="row"><span class="big">🧑‍💼</span><span class="big">🤝</span><span class="big">🏪</span></div><h3>Uma grande “feira” super organizada</h3>`, t: "Pense numa feira gigante e muito organizada: quem quer vender encontra quem quer comprar, com regras claras." },
      { v: `<div class="row"><span class="tag">Você</span><span class="big">➡️</span><span class="tag">Corretora</span><span class="big">➡️</span><span class="tag">B3</span></div>`, t: "Você não negocia direto na B3: usa uma corretora, que leva sua ordem até a bolsa." },
      { v: `<div class="em float">🔐</div><h3>A B3 guarda o registro no seu CPF</h3>`, t: "Tudo o que você compra fica registrado no seu CPF, na B3. É isso que você vê aqui na Área do Investidor." },
    ], quiz: { p: "Para comprar uma ação, você precisa de…", o: ["Ir pessoalmente à B3", "Uma corretora", "Um banco central"], c: 1, e: "Isso! A corretora é a sua porta de entrada para a bolsa." } },
    { id: "acao", titulo: "O que é uma ação?", emoji: "🍕", cor: "linear-gradient(135deg,#b45309,#f59e0b)", dur: "1 min", cenas: [
      { v: `<div class="em">🍕</div><h3>Imagine uma empresa como uma pizza</h3>`, t: "Imagine que uma empresa é uma pizza enorme." },
      { v: `<div class="row"><span class="big">🍕</span><span class="big">➡️</span><span class="big">🍕🍕🍕🍕</span></div><h3>Cada fatia é uma ação</h3>`, t: "A empresa divide essa pizza em milhões de fatias. Cada fatia é uma ação." },
      { v: `<div class="row"><span class="big">🙋</span><span class="big">🍕</span></div><h3>Comprou uma ação? Você virou sócio!</h3>`, t: "Quando você compra uma ação, você vira sócio da empresa — dono de um pedacinho dela." },
      { v: `${svgLinha("M10,100 C60,90 80,40 130,60 S220,20 310,10")}<h3>Se a empresa cresce, sua fatia vale mais</h3>`, t: "Se a empresa cresce e lucra, sua fatia tende a valer mais. Se vai mal, pode valer menos." },
      { v: `<div class="em shake">🎢</div><h3>O preço sobe e desce todo dia</h3>`, t: "O preço muda todo dia, como uma montanha-russa. Por isso, ações combinam com objetivos de longo prazo." },
    ], quiz: { p: "Quem compra uma ação se torna…", o: ["Funcionário da empresa", "Sócio da empresa", "Credor do governo"], c: 1, e: "Exato: você vira sócio, dono de um pedacinho da empresa." } },
    { id: "rendafixa", titulo: "Renda fixa sem mistério", emoji: "🤝", cor: "linear-gradient(135deg,#0e7c86,#14b8a6)", dur: "1 min", cenas: [
      { v: `<div class="row"><span class="big">🙂</span><span class="big">💵➡️</span><span class="big">🏦</span></div><h3>Renda fixa = você empresta dinheiro</h3>`, t: "Na renda fixa, você empresta seu dinheiro para um banco, uma empresa ou o governo." },
      { v: `<div class="row"><span class="big">🏦</span><span class="big">➡️💵💵</span><span class="big">🙂</span></div><h3>E recebe de volta com juros</h3>`, t: "Em troca, recebe o dinheiro de volta com juros, seguindo uma regra combinada desde o início." },
      { v: `<div class="row"><span class="tag">Tesouro Direto</span><span class="tag">CDB</span><span class="tag">LCI</span><span class="tag">LCA</span></div><h3>Alguns exemplos</h3>`, t: "Tesouro Direto é emprestar para o governo. CDB, LCI e LCA são empréstimos para bancos." },
      { v: `<div class="em float">🛡️</div><h3>FGC: proteção até R$ 250 mil por banco</h3>`, t: "CDB, LCI e LCA têm a proteção do FGC, até 250 mil reais por CPF em cada banco." },
    ], quiz: { p: "No Tesouro Direto, para quem você empresta dinheiro?", o: ["Para o governo", "Para a B3", "Para uma empresa de tecnologia"], c: 0, e: "Isso! Tesouro Direto = emprestar para o governo federal." } },
    { id: "dividendos", titulo: "Dividendos e data-com", emoji: "🌳", cor: "linear-gradient(135deg,#15803d,#22c55e)", dur: "1 min", cenas: [
      { v: `<div class="em">🌳</div><h3>A empresa é uma árvore…</h3>`, t: "Pense na empresa como uma árvore." },
      { v: `<div class="row"><span class="big">🌳</span><span class="big fall">🍎</span><span class="big fall" style="animation-delay:.4s">🍎</span></div><h3>…e os lucros são os frutos</h3>`, t: "Quando ela dá lucro, parte desses frutos é dividida com os sócios. São os dividendos." },
      { v: `<div class="em">📋</div><h3>Data-com = a lista de convidados</h3>`, t: "Para receber, você precisa estar na lista: ter a ação no fim do dia da data-com." },
      { v: `<div class="row"><span class="tag">📌 Data-com</span><span class="big">→</span><span class="tag">✂️ Data ex</span><span class="big">→</span><span class="tag">💰 Pagamento</span></div>`, t: "No dia seguinte, a data ex, quem compra já não recebe. E depois vem o dia do pagamento." },
    ], quiz: { p: "Para ter direito ao dividendo, você precisa ter a ação…", o: ["No dia do pagamento", "No fim do dia da data-com", "Só na data ex"], c: 1, e: "Perfeito! A data-com é o último dia para entrar na lista." } },
    { id: "juros", titulo: "Juros compostos: a bola de neve", emoji: "☃️", cor: "linear-gradient(135deg,#1d4ed8,#60a5fa)", dur: "1 min", cenas: [
      { v: `<div class="em">⚪</div><h3>Comece com uma bolinha de neve</h3>`, t: "Juros compostos funcionam como uma bola de neve descendo a montanha." },
      { v: `<div class="row"><span style="font-size:40px">⚪</span><span style="font-size:64px">⚪</span><span style="font-size:96px">⚪</span></div><h3>Ela cresce cada vez mais rápido</h3>`, t: "Você ganha juros sobre o dinheiro e, depois, juros sobre os juros. A bola cresce cada vez mais rápido." },
      { v: `${barras([20, 28, 38, 52, 72, 100, 140])}<h3>R$ 100 por mês, a 1% ao mês</h3>`, t: "Guardando 100 reais por mês a 1% ao mês, em 10 anos você teria cerca de 23 mil reais — tendo depositado 12 mil." },
      { v: `<div class="em float">⏳</div><h3>O segredo é o tempo</h3>`, t: "O ingrediente mais importante é o tempo. Quanto antes começar, maior a bola de neve." },
    ], quiz: { p: "Nos juros compostos, você ganha juros…", o: ["Só sobre o valor inicial", "Sobre o valor + os juros anteriores", "Apenas uma vez por ano"], c: 1, e: "Isso aí: juros sobre juros — a bola de neve!" } },
    { id: "diversificar", titulo: "Não coloque todos os ovos na mesma cesta", emoji: "🧺", cor: "linear-gradient(135deg,#7a3db8,#a855f7)", dur: "1 min", cenas: [
      { v: `<div class="row"><span class="big">🧺</span><span class="big">🥚🥚🥚🥚</span></div><h3>Todos os ovos numa cesta só…</h3>`, t: "Se você coloca todos os ovos numa cesta só…" },
      { v: `<div class="em shake">💥</div><h3>…se a cesta cai, você perde tudo</h3>`, t: "…e essa cesta cai, você perde tudo de uma vez." },
      { v: `<div class="row"><span class="big">🧺🥚</span><span class="big">🧺🥚</span><span class="big">🧺🥚</span><span class="big">🧺🥚</span></div><h3>Divida entre várias cestas</h3>`, t: "Diversificar é dividir: um pouco em renda fixa, um pouco em ações, em setores diferentes." },
      { v: `<div class="em">📊</div><h3>Veja sua divisão no gráfico de pizza</h3>`, t: "Na aba Início, o gráfico de pizza mostra como o seu dinheiro está dividido." },
    ], quiz: { p: "Diversificar serve para…", o: ["Garantir lucro sempre", "Reduzir o impacto de um investimento ruim", "Pagar menos imposto"], c: 1, e: "Exatamente: um tropeço não derruba tudo." } },
    { id: "risco", titulo: "Risco e retorno: bike ou montanha-russa?", emoji: "🎢", cor: "linear-gradient(135deg,#b3261e,#f97316)", dur: "1 min", cenas: [
      { v: `<div class="row"><span class="big">🚲</span><span class="tag">vs</span><span class="big">🎢</span></div><h3>Cada investimento é um tipo de passeio</h3>`, t: "Investir é escolher o passeio: tem os tranquilos, como uma bike, e os radicais, como uma montanha-russa." },
      { v: `${svgLinha("M10,80 L310,40", "#86efac")}<h3>Renda fixa: caminho mais previsível</h3>`, t: "A renda fixa costuma ser um caminho mais previsível, com menos sustos." },
      { v: `${svgLinha("M10,90 L50,30 L90,95 L130,20 L170,85 L210,15 L250,70 L310,5", "#fca5a5")}<h3>Ações e cripto: mais sobe-e-desce</h3>`, t: "Ações e cripto sobem e descem bastante. Podem render mais no longo prazo, mas com mais emoção." },
      { v: `<div class="em">🧭</div><h3>Seu perfil diz qual passeio combina com você</h3>`, t: "O questionário de perfil ajuda a entender quanto sobe-e-desce você aguenta." },
    ], quiz: { p: "Em geral, mais chance de retorno vem com…", o: ["Menos risco", "Mais risco", "Nenhum risco"], c: 1, e: "Isso! Retorno maior costuma vir com mais oscilação." } },
    { id: "cripto", titulo: "O que é cripto?", emoji: "🪙", cor: "linear-gradient(135deg,#f7931a,#fbbf24)", dur: "1 min", cenas: [
      { v: `<div class="em float">🪙</div><h3>Dinheiro 100% digital</h3>`, t: "Criptomoedas são moedas totalmente digitais, como o Bitcoin." },
      { v: `<div class="row"><span class="big">🧱</span><span class="big">🔗</span><span class="big">🧱</span><span class="big">🔗</span><span class="big">🧱</span></div><h3>Blockchain: um livro-caixa público</h3>`, t: "As transações ficam numa blockchain: um livro-caixa público, com blocos ligados como uma corrente." },
      { v: `<div class="em shake">🎢</div><h3>Oscila muito — e 24 horas por dia</h3>`, t: "O preço oscila muito, a qualquer hora, inclusive fim de semana." },
      { v: `<div class="row"><span class="tag">Exchange</span><span class="tag">ETF de cripto na B3</span></div><h3>Onde ficam?</h3>`, t: "Cripto comprada direto fica numa exchange, não na B3. Na bolsa, existem ETFs de cripto." },
    ], quiz: { p: "O Bitcoin comprado numa exchange fica…", o: ["Sob custódia da B3", "Na sua exchange / carteira", "No Tesouro Direto"], c: 1, e: "Certo! Por isso conectamos sua exchange para mostrar tudo junto aqui." } },
  ];

  const feitos = () => new Set(U.store.get("videos:feitos", []));
  const xp = () => feitos().size * 10;

  // ---------------- Player ----------------
  let st = null;
  function abrir(id) {
    const a = AULAS.find((x) => x.id === id); if (!a) return;
    fechar();
    st = { a, i: 0, tocando: true, voz: U.store.get("videos:voz", true), timer: null };
    const wrap = document.createElement("div"); wrap.className = "player-wrap"; wrap.id = "playerWrap";
    wrap.innerHTML = `<div class="player" role="dialog" aria-modal="true" aria-label="Vídeo: ${U.esc(a.titulo)}"><div class="ptitle"><span>🎬 ${U.esc(a.titulo)}</span><span>Videoaula animada · com legenda</span></div><div class="stage" id="stage" style="background:${a.cor}"></div>
      <div class="pctl"><button id="pPrev" aria-label="Cena anterior">⏮</button><button id="pPlay" aria-label="Pausar">⏸</button><button id="pNext" aria-label="Próxima cena">⏭</button><div class="pbar" id="pbar">${a.cenas.map((_, k) => `<i data-k="${k}"><b></b></i>`).join("")}<i data-k="quiz" title="Quiz"><b></b></i></div><button id="pVoz" aria-pressed="${st.voz}" aria-label="Narração por voz" title="Narração por voz">🔊</button><button id="pX" aria-label="Fechar vídeo">✕</button></div></div>`;
    document.body.appendChild(wrap);
    wrap.addEventListener("click", (e) => { if (e.target === wrap) fechar(); });
    document.getElementById("pX").onclick = fechar;
    document.getElementById("pPrev").onclick = () => ir(Math.max(0, st.i - 1));
    document.getElementById("pNext").onclick = () => ir(st.i + 1);
    document.getElementById("pPlay").onclick = alternar;
    document.getElementById("pVoz").onclick = (e) => { st.voz = !st.voz; U.store.set("videos:voz", st.voz); e.currentTarget.setAttribute("aria-pressed", String(st.voz)); if (!st.voz) speechSynthesis.cancel(); else ir(st.i); };
    document.getElementById("pbar").onclick = (e) => { const k = e.target.closest("i"); if (k) ir(k.dataset.k === "quiz" ? a.cenas.length : +k.dataset.k); };
    document.addEventListener("keydown", teclas);
    ir(0);
    document.getElementById("pPlay").focus();
  }
  function teclas(e) { if (!st) return; if (e.key === "Escape") fechar(); if (e.key === " " && e.target.tagName !== "BUTTON") { e.preventDefault(); alternar(); } if (e.key === "ArrowRight") ir(st.i + 1); if (e.key === "ArrowLeft") ir(Math.max(0, st.i - 1)); }
  function alternar() { st.tocando = !st.tocando; document.getElementById("pPlay").textContent = st.tocando ? "⏸" : "▶"; document.getElementById("pPlay").setAttribute("aria-label", st.tocando ? "Pausar" : "Continuar"); if (st.tocando) ir(st.i); else { clearTimeout(st.timer); try { speechSynthesis.cancel(); } catch (e) {} } }
  function falar(txt, fim) {
    try {
      if (!st.voz || !("speechSynthesis" in window)) return false;
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(txt); u.lang = "pt-BR"; u.rate = 1.05;
      const v = speechSynthesis.getVoices().find((x) => x.lang && x.lang.toLowerCase().startsWith("pt")); if (v) u.voice = v;
      u.onend = fim; speechSynthesis.speak(u); return true;
    } catch (e) { return false; }
  }
  function ir(i) {
    if (!st) return;
    clearTimeout(st.timer); try { speechSynthesis.cancel(); } catch (e) {}
    const a = st.a; st.i = i;
    document.querySelectorAll("#pbar i").forEach((el, k) => { el.classList.toggle("done", k < i); el.querySelector("b").style.transition = "none"; el.querySelector("b").style.width = k < i ? "100%" : "0"; });
    const stage = document.getElementById("stage");
    if (i >= a.cenas.length) return quiz();
    const c = a.cenas[i];
    stage.innerHTML = `<div class="scene">${c.v}</div><div class="caption" aria-live="polite">${U.esc(c.t)}</div>`;
    const dur = Math.max(4200, c.t.length * 62);
    const bar = document.querySelectorAll("#pbar i")[i].querySelector("b");
    if (st.tocando) {
      requestAnimationFrame(() => { bar.style.transition = `width ${dur}ms linear`; bar.style.width = "100%"; });
      let terminou = false; const prox = () => { if (!terminou && st && st.i === i && st.tocando) { terminou = true; st.timer = setTimeout(() => ir(i + 1), 500); } };
      const usando = falar(c.t, prox);
      st.timer = setTimeout(prox, usando ? dur + 4000 : dur);
    }
  }
  function quiz() {
    const a = st.a, q = a.quiz, stage = document.getElementById("stage");
    stage.style.aspectRatio = "auto";
    stage.innerHTML = `<div class="quizv" style="width:100%"><div class="small" style="color:#ffcf4d;font-weight:700;margin-bottom:6px">⚡ TESTE RÁPIDO · vale 10 XP</div><h3>${U.esc(q.p)}</h3>${q.o.map((o, k) => `<button class="op" data-k="${k}">${U.esc(o)}</button>`).join("")}<p id="qFb" aria-live="polite"></p></div>`;
    falar(q.p);
    stage.querySelectorAll(".op").forEach((b) => b.addEventListener("click", () => {
      const k = +b.dataset.k, fb = document.getElementById("qFb");
      if (k === q.c) {
        b.classList.add("ok"); stage.querySelectorAll(".op").forEach((x) => (x.disabled = true));
        const novo = !feitos().has(a.id); const s = feitos(); s.add(a.id); U.store.set("videos:feitos", [...s]);
        fb.innerHTML = `✅ ${U.esc(q.e)} ${novo ? "<b>+10 XP!</b>" : ""}<br><br><button class="btn primary" id="qFim">${proxima() ? "Próximo vídeo →" : "Concluir"}</button> <button class="btn" id="qRev" style="background:transparent;color:#fff">Rever</button>`;
        confete(stage); falar(q.e);
        document.getElementById("qFim").onclick = () => { const p = proxima(); fechar(); if (p) abrir(p.id); else if (window.APP) window.APP.render(); };
        document.getElementById("qRev").onclick = () => { stage.style.aspectRatio = ""; ir(0); };
      } else { b.classList.add("no"); fb.textContent = "Quase! Tente outra opção 🙂"; }
    }));
  }
  function proxima() { const f = feitos(); return AULAS.find((x) => !f.has(x.id) && x.id !== (st && st.a.id)); }
  function confete(el) { const c = document.createElement("div"); c.className = "confetti"; const cores = ["#ffcf4d", "#22c55e", "#60a5fa", "#f472b6", "#fff"]; for (let k = 0; k < 60; k++) { const i = document.createElement("i"); i.style.left = Math.random() * 100 + "%"; i.style.background = cores[k % 5]; i.style.animationDelay = Math.random() * 0.5 + "s"; c.appendChild(i); } el.appendChild(c); setTimeout(() => c.remove(), 2600); }
  function fechar() {
    if (!st && !document.getElementById("playerWrap")) return;
    if (st) clearTimeout(st.timer);
    try { speechSynthesis.cancel(); } catch (e) {}
    const w = document.getElementById("playerWrap"); if (w) w.remove();
    document.removeEventListener("keydown", teclas);
    const eraDone = st; st = null;
    if (eraDone && window.APP && location.hash.startsWith("#/aprender")) window.APP.render();
  }

  return { AULAS, abrir, fechar, feitos, xp };
})();
