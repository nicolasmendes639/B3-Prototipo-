/* Carteira → Distribuição: "Por setor e segmento" em gráfico sunburst (ECharts, carregado só quando a página abre).
 * Anel de dentro = classe, do meio = setor (ou segmento), de fora = ativo. Clicar numa fatia aproxima.
 * Sem internet para baixar o ECharts, usa o desenho próprio CH.multinivel.
 * Setor das ações segue a classificação setorial da B3 (setor econômico); segmento é o setor do catálogo.
 */
(function (V) {
  const U = window.U, C = window.CATALOGO, K = window.CONSOL, CH = window.CH;
  const CORES = { "Ações": "#06377b", FIIs: "#0e7c86", ETFs: "#7a3db8", "ETFs de Criptomoedas": "#e07b12", "Tesouro Direto": "#2e8b57", "Renda fixa": "#b8860b", Fundos: "#9b2c5e" };
  // segmento do catálogo → setor econômico (classificação setorial da B3)
  const SETOR_B3 = { "Mineração": "Materiais básicos", "Papel e celulose": "Materiais básicos", Bancos: "Financeiro", "Serviços financeiros": "Financeiro", Bebidas: "Consumo não cíclico", "Máquinas e equipamentos": "Bens industriais", "Aluguel de veículos": "Consumo cíclico", Varejo: "Consumo cíclico", "Varejo farmacêutico": "Saúde", "Energia elétrica": "Utilidade pública", "Telecomunicações": "Comunicações" };
  let zoom = []; // caminho da fatia aproximada, ex.: ["Ações", "Financeiro"] (só nesta visita à página)
  let ec = null, grafico = null;
  const carregaEC = () => ec || (ec = new Promise((ok, erro) => {
    if (window.echarts) return ok(window.echarts);
    const sc = document.createElement("script");
    sc.src = "https://cdnjs.cloudflare.com/ajax/libs/echarts/5.5.0/echarts.min.js";
    sc.onload = () => ok(window.echarts); sc.onerror = () => { ec = null; erro(); };
    document.head.appendChild(sc);
  }));
  addEventListener("resize", () => grafico && !grafico.isDisposed() && grafico.resize());
  const claro = (hex) => { const n = parseInt(hex.slice(1), 16); return ((n >> 16) * 299 + ((n >> 8) & 255) * 587 + (n & 255) * 114) / 1000 > 160; };

  // sunburst do ECharts a partir da árvore (raiz = carteira ou a fatia aproximada)
  function sunburst(echarts, el, raiz, o) {
    const prof = (n) => (n.filhos && n.filhos.length ? 1 + Math.max(...n.filhos.map(prof)) : 0);
    const D = Math.max(1, prof(raiz)), lado = Math.min(el.clientWidth, 460), furo = 32, peq = lado < 360; // peq: celular, letras menores
    // espessura dos anéis (em % do raio): o de fora, com os tickers, é o mais largo
    const pesos = D === 3 ? [0.9, 1, 1.15] : D === 2 ? [1, 1.15] : [1], soma = pesos.reduce((a, b) => a + b, 0);
    const bordas = pesos.reduce((acc, w) => acc.concat(acc[acc.length - 1] + ((98 - furo) * w) / soma), [furo]);
    const dados = (n) => n.filhos.map((f) => ({ name: f.nome, value: f.valor, rotulo: f.rotulo || f.nome, itemStyle: { color: f.cor }, label: { color: claro(f.cor) ? "#14213d" : "#fff" }, children: f.filhos && f.filhos.length ? dados(f) : undefined }));
    const niveis = [{}];
    for (let k = 0; k < D; k++) {
      const anelPx = ((lado / 2) * (bordas[k + 1] - bordas[k])) / 100;
      niveis.push({ r0: `${bordas[k]}%`, r: `${bordas[k + 1]}%`, label: k === 0 && D > 1 ? { rotate: "tangential", fontSize: peq ? 11 : 13, fontWeight: 700, minAngle: 24 } : { rotate: "radial", fontSize: peq ? 9.5 : 11, fontWeight: 700, overflow: "truncate", width: anelPx - (peq ? 3 : 6), minAngle: 5 } });
    }
    el.style.height = lado + "px";
    grafico = echarts.getInstanceByDom(el) || echarts.init(el, null, { renderer: "svg" });
    grafico.off("click");
    grafico.clear(); // redesenha do zero: a animação entre árvores diferentes passa por formas estranhas
    grafico.setOption({
      aria: { enabled: true, label: { description: o.label } },
      tooltip: {
        backgroundColor: "#fff", borderColor: "#06377b", borderWidth: 2, padding: [10, 14], textStyle: { fontSize: 16, color: "#14213d", fontFamily: "Arial, Helvetica, sans-serif" },
        formatter: (p) => { const cam = p.treePathInfo || [], pai = cam.length > 2 ? cam[cam.length - 2] : null, tot = (cam[0] && cam[0].value) || raiz.valor;
          return `<b style="font-size:18px">${U.esc(p.name)}</b><br>${U.brl(p.value)}<br>${U.num((p.value / tot) * 100, 1)}% ${o.de}${pai ? ` · ${U.num((p.value / pai.value) * 100, 1)}% de ${U.esc(pai.name)}` : ""}${p.data && p.data.children ? '<br><span style="font-size:13px;color:#5b6b82">Clique para ver em detalhe</span>' : ""}`; },
      },
      graphic: [{ type: "text", left: "center", top: "middle", onclick: o.onVoltar || null, cursor: o.onVoltar ? "pointer" : "default",
        style: { text: (o.onVoltar ? "{v|‹ Voltar}\n" : "") + `{n|${o.centro}}\n{s|${o.sub}}`, textAlign: "center", rich: { v: { fontSize: 14, fontWeight: 700, fill: "#06377b", padding: [0, 0, 6, 0] }, n: { fontSize: peq ? 13 : 18, fontWeight: 800, fill: "#14213d" }, s: { fontSize: peq ? 11 : 13, fill: "#5b6b82", padding: [4, 0, 0, 0] } } } }],
      series: [{ type: "sunburst", data: dados(raiz), radius: [`${furo}%`, "98%"], sort: null, nodeClick: false, levels: niveis,
        label: { minAngle: 4, formatter: (p) => p.data.rotulo }, itemStyle: { borderColor: "#fff", borderWidth: 1.5 }, emphasis: { focus: "ancestor" } }],
    }, true);
    grafico.on("click", (p) => { if (p.componentType === "series" && p.data && p.data.children) o.onZoom({ nome: p.name }); });
  }

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
        const o = {
          fmt: U.brl, de: raiz === cheia ? "da carteira" : "de " + raiz.nome, label: `Distribuição de ${raiz === cheia ? "toda a carteira" : raiz.nome} por classe, ${modo} e ativo`,
          centro: U.state.hide ? "•••" : raiz.valor >= 1e6 ? "R$ " + U.num(raiz.valor / 1e6, 2) + " mi" : "R$ " + U.num(raiz.valor / 1000, 1) + " mil",
          sub: raiz === cheia ? "na carteira" : `${U.num((raiz.valor / total) * 100, 1)}% da carteira`,
          onZoom: (no) => { zoom.push(no.nome); desenha(); },
          onVoltar: raiz === cheia ? null : voltar,
        };
        const el = document.getElementById("chSetores");
        carregaEC().then((echarts) => { if (document.body.contains(el)) sunburst(echarts, el, raiz, o); })
          .catch(() => { el.style.height = ""; CH.multinivel(el, raiz, o); });
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
