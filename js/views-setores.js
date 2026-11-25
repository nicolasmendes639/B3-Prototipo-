/* Carteira → Distribuição: "Por setor e segmento" em gráfico multinível (CH.multinivel).
 * Anel de dentro = classe, do meio = setor (ou segmento), de fora = ativo. Clicar numa fatia aproxima.
 * Setor das ações segue a classificação setorial da B3 (setor econômico); segmento é o setor do catálogo.
 */
(function (V) {
  const U = window.U, C = window.CATALOGO, K = window.CONSOL, CH = window.CH;
  const CORES = { "Ações": "#06377b", FIIs: "#0e7c86", ETFs: "#7a3db8", "ETFs de Criptomoedas": "#e07b12", "Tesouro Direto": "#2e8b57", "Renda fixa": "#b8860b", Fundos: "#9b2c5e" };
  // segmento do catálogo → setor econômico (classificação setorial da B3)
  const SETOR_B3 = { "Mineração": "Materiais básicos", "Papel e celulose": "Materiais básicos", Bancos: "Financeiro", "Serviços financeiros": "Financeiro", Bebidas: "Consumo não cíclico", "Máquinas e equipamentos": "Bens industriais", "Aluguel de veículos": "Consumo cíclico", Varejo: "Consumo cíclico", "Varejo farmacêutico": "Saúde", "Energia elétrica": "Utilidade pública", "Telecomunicações": "Comunicações" };
  let zoom = []; // caminho da fatia aproximada, ex.: ["Ações", "Financeiro"] (só nesta visita à página)

  const classe = (x) => (x.tipo === "cripto" ? "ETFs de Criptomoedas" : x.classe === "Renda variavel" ? { Acoes: "Ações", FII: "FIIs", ETF: "ETFs" }[x.sub] || "Ações" : x.classe === "Tesouro Direto" ? "Tesouro Direto" : x.classe === "Fundos" ? "Fundos" : "Renda fixa");
  function grupo(x, modo) {
    const m = C.ativos[x.cod] || {}, seg = modo === "segmento";
    if (x.tipo === "cripto") return seg ? (x.nome.match(/de (\w+)/) || [, "Cripto"])[1] : "Criptomoedas";
    if (x.tipo === "rf") return x.classe === "Fundos" ? "Fundos de investimento" : seg ? x.nome : x.sub === "Debenture" ? "Crédito privado" : "Crédito bancário";
    if (m.tipo === "acao") return seg ? m.setor : SETOR_B3[m.setor] || m.setor;
    if (m.tipo === "fii") return seg ? (m.ind.segmento || m.setor).replace(/^\w+ — (.)/, (_, l) => l.toUpperCase()) : m.setor;
    if (m.tipo === "etf") return seg ? m.ind.indice : m.setor;
    if (m.tipo === "tesouro") return seg ? m.ind.indexador : m.setor.replace("Título público ", "Título ");
    return "Outros";
  }

  // tons do pai: mistura com branco, alternando claro/escuro para separar fatias vizinhas
  function tom(hex, k, n) {
    const t = 0.12 + (0.5 * (k % 2 ? k + n : k)) / (2 * Math.max(1, n)), c = parseInt(hex.slice(1), 16);
    const mix = (v) => Math.round(v + (255 - v) * Math.min(0.62, t));
    return "#" + [c >> 16, (c >> 8) & 255, c & 255].map(mix).map((v) => v.toString(16).padStart(2, "0")).join("");
  }

  function arvore(id, modo) {
    const its = K.itens(id), raiz = { nome: "Carteira", valor: 0, filhos: [] };
    const filho = (pai, nome) => { let f = pai.filhos.find((z) => z.nome === nome); if (!f) pai.filhos.push((f = { nome, valor: 0, filhos: [] })); return f; };
    its.forEach((x) => {
      const c = filho(raiz, classe(x)), g = filho(c, grupo(x, modo));
      g.filhos.push({ nome: x.tipo === "rf" ? x.nome : x.cod, rotulo: x.tipo === "rf" ? x.nome.split(" ")[0] : x.cod, valor: x.valor });
      raiz.valor += x.valor; c.valor += x.valor; g.valor += x.valor;
    });
    const ordena = (n) => { if (n.filhos) { n.filhos.sort((a, b) => b.valor - a.valor); n.filhos.forEach(ordena); } };
    ordena(raiz);
    raiz.filhos.forEach((c) => {
      c.cor = CORES[c.nome] || "#888";
      c.filhos.forEach((g, i) => { g.cor = tom(c.cor, i, c.filhos.length); g.filhos.forEach((a, j) => (a.cor = tom(g.cor, j + 1, g.filhos.length + 1))); });
    });
    return raiz;
  }

  function legenda(raiz, total) {
    const p = (v) => U.num((v / total) * 100, 1) + "%";
    return `<table class="mn-leg"><thead><tr><th>${raiz.nome === "Carteira" ? "Classe e setor" : "Detalhe"}</th><th class="num">%</th><th class="num">Valor</th></tr></thead><tbody>${raiz.filhos.map((c) => `<tr class="mn-h"><td>${c.filhos && c.filhos.length ? `<button type="button" class="mn-go" data-zoom="${U.esc(c.nome)}"><i style="background:${c.cor}"></i>${U.esc(c.nome)}</button>` : `<span class="mn-go"><i style="background:${c.cor}"></i>${U.esc(c.nome)}</span>`}</td><td class="num">${p(c.valor)}</td><td class="num">${U.brl(c.valor)}</td></tr>${(c.filhos || []).map((g) => `<tr><td><span class="mn-sub"><i style="background:${g.cor}"></i>${U.esc(g.nome)}</span></td><td class="num">${p(g.valor)}</td><td class="num">${U.brl(g.valor)}</td></tr>`).join("")}`).join("")}</tbody></table>`;
  }

  V._setores = {
    // topo = primeira seção da página (sem o espaço de cima)
    html(topo) {
      const modo = U.store.get("setor:modo", "setor");
      return `<section class="card${topo ? "" : " section"}" id="secSetores"><div class="card-h"><div><h2>Por setor e segmento ${U.info("Anel de dentro: classe (ações, FIIs, renda fixa…). Anel do meio: setor ou segmento. Anel de fora: cada investimento. Clique numa fatia para ver em detalhe; clique no centro para voltar. O setor das ações segue a classificação setorial da B3.", "Como ler")}</h2><div class="sub">Em quais setores da economia está o seu dinheiro</div></div>
        <div class="seg" role="group" aria-label="Anel do meio"><button type="button" data-smodo="setor" aria-pressed="${modo === "setor"}">Setor</button><button type="button" data-smodo="segmento" aria-pressed="${modo === "segmento"}">Segmento</button></div></div>
        <div class="mn-grid"><div id="chSetores"></div><div id="legSetores"></div></div></section>`;
    },
    after({ id }) {
      zoom = [];
      const desenha = () => {
        const modo = U.store.get("setor:modo", "setor"), cheia = arvore(id, modo);
        let raiz = cheia;
        zoom = zoom.filter((nome) => { const f = (raiz.filhos || []).find((c) => c.nome === nome); if (f && f.filhos) raiz = f; return !!(f && f.filhos); });
        const total = cheia.valor, voltar = () => { zoom.pop(); desenha(); };
        document.querySelectorAll("[data-smodo]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.smodo === modo)));
        CH.multinivel(document.getElementById("chSetores"), raiz, {
          fmt: U.brl, de: raiz === cheia ? "da carteira" : "de " + raiz.nome, label: `Distribuição de ${raiz === cheia ? "toda a carteira" : raiz.nome} por classe, ${modo} e ativo`,
          centro: U.state.hide ? "•••" : raiz.valor >= 1e6 ? "R$ " + U.num(raiz.valor / 1e6, 2) + " mi" : "R$ " + U.num(raiz.valor / 1000, 1) + " mil",
          sub: raiz === cheia ? "na carteira" : `${U.num((raiz.valor / total) * 100, 1)}% da carteira`,
          onZoom: (no) => { zoom.push(no.nome); desenha(); },
          onVoltar: raiz === cheia ? null : voltar,
        });
        const leg = document.getElementById("legSetores");
        leg.innerHTML = (raiz !== cheia ? `<div class="mn-path"><button type="button" class="btn ghost mn-back">‹ Voltar</button><span>Carteira › ${zoom.map(U.esc).join(" › ")}</span></div>` : "") + legenda(raiz, raiz.valor);
        leg.querySelectorAll("[data-zoom]").forEach((b) => b.addEventListener("click", () => { zoom.push(b.dataset.zoom); desenha(); }));
        const back = leg.querySelector(".mn-back"); if (back) back.addEventListener("click", voltar);
      };
      document.querySelectorAll("[data-smodo]").forEach((b) => b.addEventListener("click", () => { U.store.set("setor:modo", b.dataset.smodo); desenha(); }));
      desenha();
    },
  };
})(window.VIEWS);
