/* Catálogo estático do protótipo.
 * ATENÇÃO: indicadores, cotações e títulos de conteúdo são ILUSTRATIVOS (dados fictícios para teste).
 * Em produção viriam de market data B3, do sistema de empresas listadas e das plataformas de educação.
 */
window.CATALOGO = (function () {
  // ---------- Ativos ----------
  // tipo: acao | fii | etf | tesouro
  const ativos = {
    PETR4: { tipo: "acao", nome: "Petrobras PN", empresa: "Petróleo Brasileiro S.A.", setor: "Petróleo, gás e biocombustíveis", ind: { pl: 4.1, pvp: 1.02, dy: 13.8, roe: 24.6, margem: 18.2, divEbitda: 1.3, vm: 498 }, freq: "trimestral" },
    VALE3: { tipo: "acao", nome: "Vale ON", empresa: "Vale S.A.", setor: "Mineração", ind: { pl: 6.3, pvp: 1.25, dy: 9.4, roe: 19.8, margem: 16.5, divEbitda: 0.6, vm: 262 }, freq: "semestral" },
    ITUB4: { tipo: "acao", nome: "Itaú Unibanco PN", empresa: "Itaú Unibanco Holding S.A.", setor: "Bancos", ind: { pl: 8.9, pvp: 1.88, dy: 7.6, roe: 21.9, margem: null, divEbitda: null, vm: 318 }, freq: "mensal + complementar" },
    BBDC4: { tipo: "acao", nome: "Bradesco PN", empresa: "Banco Bradesco S.A.", setor: "Bancos", ind: { pl: 7.4, pvp: 0.86, dy: 8.1, roe: 11.6, margem: null, divEbitda: null, vm: 146 }, freq: "mensal + complementar" },
    BBAS3: { tipo: "acao", nome: "Banco do Brasil ON", empresa: "Banco do Brasil S.A.", setor: "Bancos", ind: { pl: 5.2, pvp: 0.74, dy: 9.9, roe: 14.3, margem: null, divEbitda: null, vm: 159 }, freq: "trimestral" },
    ABEV3: { tipo: "acao", nome: "Ambev ON", empresa: "Ambev S.A.", setor: "Bebidas", ind: { pl: 13.6, pvp: 2.15, dy: 6.2, roe: 15.8, margem: 16.9, divEbitda: -0.4, vm: 201 }, freq: "semestral" },
    B3SA3: { tipo: "acao", nome: "B3 ON", empresa: "B3 S.A. – Brasil, Bolsa, Balcão", setor: "Serviços financeiros", ind: { pl: 14.1, pvp: 3.4, dy: 5.3, roe: 23.4, margem: 49.1, divEbitda: 0.9, vm: 62 }, freq: "trimestral" },
    WEGE3: { tipo: "acao", nome: "WEG ON", empresa: "WEG S.A.", setor: "Máquinas e equipamentos", ind: { pl: 24.8, pvp: 6.9, dy: 2.4, roe: 29.7, margem: 16.1, divEbitda: -0.3, vm: 184 }, freq: "trimestral" },
    RENT3: { tipo: "acao", nome: "Localiza ON", empresa: "Localiza Rent a Car S.A.", setor: "Aluguel de veículos", ind: { pl: 17.3, pvp: 2.1, dy: 2.1, roe: 12.4, margem: 7.9, divEbitda: 2.8, vm: 55 }, freq: "trimestral" },
    LREN3: { tipo: "acao", nome: "Lojas Renner ON", empresa: "Lojas Renner S.A.", setor: "Varejo", ind: { pl: 11.2, pvp: 1.6, dy: 4.9, roe: 14.6, margem: 9.8, divEbitda: 0.2, vm: 15 }, freq: "trimestral" },
    RADL3: { tipo: "acao", nome: "Raia Drogasil ON", empresa: "Raia Drogasil S.A.", setor: "Varejo farmacêutico", ind: { pl: 28.5, pvp: 4.8, dy: 1.6, roe: 17.1, margem: 3.1, divEbitda: 1.4, vm: 44 }, freq: "trimestral" },
    SUZB3: { tipo: "acao", nome: "Suzano ON", empresa: "Suzano S.A.", setor: "Papel e celulose", ind: { pl: 9.7, pvp: 1.4, dy: 4.1, roe: 15.2, margem: 14.3, divEbitda: 3.1, vm: 68 }, freq: "semestral" },
    EGIE3: { tipo: "acao", nome: "Engie Brasil ON", empresa: "Engie Brasil Energia S.A.", setor: "Energia elétrica", ind: { pl: 10.4, pvp: 2.6, dy: 7.8, roe: 26.1, margem: 27.9, divEbitda: 2.5, vm: 32 }, freq: "trimestral" },
    TAEE11: { tipo: "acao", nome: "Taesa Unit", empresa: "Transmissora Aliança de Energia Elétrica S.A.", setor: "Energia elétrica", ind: { pl: 8.8, pvp: 1.7, dy: 10.6, roe: 19.4, margem: 41.2, divEbitda: 3.6, vm: 12 }, freq: "trimestral" },
    CPLE6: { tipo: "acao", nome: "Copel PNB", empresa: "Companhia Paranaense de Energia", setor: "Energia elétrica", ind: { pl: 11.9, pvp: 1.3, dy: 6.7, roe: 11.2, margem: 10.6, divEbitda: 2.1, vm: 26 }, freq: "semestral" },
    VIVT3: { tipo: "acao", nome: "Telefônica Brasil ON", empresa: "Telefônica Brasil S.A.", setor: "Telecomunicações", ind: { pl: 14.9, pvp: 1.12, dy: 7.2, roe: 7.9, margem: 10.2, divEbitda: 0.5, vm: 77 }, freq: "trimestral" },

    BTLG11: { tipo: "fii", nome: "BTG Pactual Logística FII", setor: "Logística", ind: { segmento: "Tijolo — galpões logísticos", pvp: 0.97, dy: 9.6, vacancia: 2.1, pl_fundo: 4.3, cotistas: 312 }, freq: "mensal" },
    HGLG11: { tipo: "fii", nome: "Logística FII (HGLG11)", setor: "Logística", ind: { segmento: "Tijolo — galpões logísticos", pvp: 0.99, dy: 8.7, vacancia: 4.4, pl_fundo: 5.1, cotistas: 405 }, freq: "mensal" },
    XPLG11: { tipo: "fii", nome: "XP Log FII", setor: "Logística", ind: { segmento: "Tijolo — galpões logísticos", pvp: 0.88, dy: 9.9, vacancia: 7.2, pl_fundo: 2.9, cotistas: 238 }, freq: "mensal" },
    KNRI11: { tipo: "fii", nome: "Kinea Renda Imobiliária FII", setor: "Híbrido", ind: { segmento: "Híbrido — lajes e galpões", pvp: 0.93, dy: 8.4, vacancia: 5.6, pl_fundo: 3.8, cotistas: 280 }, freq: "mensal" },
    KNCR11: { tipo: "fii", nome: "Kinea Rendimentos Imobiliários FII", setor: "Recebíveis", ind: { segmento: "Papel — CRI pós-fixado (CDI)", pvp: 1.01, dy: 13.1, vacancia: null, pl_fundo: 7.6, cotistas: 290 }, freq: "mensal" },
    MXRF11: { tipo: "fii", nome: "Maxi Renda FII", setor: "Recebíveis", ind: { segmento: "Papel — CRI híbrido", pvp: 1.0, dy: 12.4, vacancia: null, pl_fundo: 4.0, cotistas: 1150 }, freq: "mensal" },
    VISC11: { tipo: "fii", nome: "Vinci Shopping Centers FII", setor: "Shoppings", ind: { segmento: "Tijolo — shoppings", pvp: 0.9, dy: 9.1, vacancia: 3.9, pl_fundo: 3.3, cotistas: 260 }, freq: "mensal" },
    XPML11: { tipo: "fii", nome: "XP Malls FII", setor: "Shoppings", ind: { segmento: "Tijolo — shoppings", pvp: 0.95, dy: 9.8, vacancia: 4.1, pl_fundo: 5.5, cotistas: 470 }, freq: "mensal" },

    BOVA11: { tipo: "etf", nome: "ETF Ibovespa (BOVA11)", setor: "ETF de ações Brasil", ind: { indice: "Ibovespa", taxa: 0.1, pl_fundo: 15.2 }, freq: "não distribui" },
    SMAL11: { tipo: "etf", nome: "ETF Small Cap (SMAL11)", setor: "ETF de ações Brasil", ind: { indice: "Índice Small Cap (SMLL)", taxa: 0.5, pl_fundo: 1.4 }, freq: "não distribui" },
    IVVB11: { tipo: "etf", nome: "ETF S&P 500 (IVVB11)", setor: "ETF internacional", ind: { indice: "S&P 500 (em reais)", taxa: 0.23, pl_fundo: 8.7 }, freq: "não distribui" },

    "Tesouro Selic 2029": { tipo: "tesouro", nome: "Tesouro Selic 2029", setor: "Título público pós-fixado", ind: { indexador: "Selic", taxa: "Selic + 0,07%", vencimento: "2029-03-01" } },
    "Tesouro IPCA+ 2035": { tipo: "tesouro", nome: "Tesouro IPCA+ 2035", setor: "Título público híbrido", ind: { indexador: "IPCA", taxa: "IPCA + 7,12%", vencimento: "2035-05-15" } },
    "Tesouro Prefixado 2031": { tipo: "tesouro", nome: "Tesouro Prefixado 2031", setor: "Título público prefixado", ind: { indexador: "Prefixado", taxa: "13,48% a.a.", vencimento: "2031-01-01" } },
  };

  // ---------- Esferas B3 que o feed conecta ----------
  const esferas = {
    edu: { nome: "B3 Educação", url: "https://edu.b3.com.br/", cor: "#0E7C86" },
    bora: { nome: "Bora Investir", url: "https://borainvestir.b3.com.br/", cor: "#7A3DB8" },
    ofertas: { nome: "Ofertas públicas", url: "#/ofertas", cor: "#B85C00" },
    assembleias: { nome: "Assembleias", url: "#/assembleias", cor: "#5B6B7F" },
    tesouro: { nome: "Tesouro Direto", url: "https://www.tesourodireto.com.br/", cor: "#1F7A3E" },
    area: { nome: "Área do Investidor", url: "#/visao-geral", cor: "#06377B" },
  };

  const BORA = "https://borainvestir.b3.com.br";
  // perfis: con | mod | arr ; nivel: ini | int | ava ; temas livres
  const conteudos = [
    // ----- Conservador -----
    { id: "c1", esfera: "edu", formato: "Curso", dur: "1h20", titulo: "Reserva de emergência: onde deixar e quanto guardar", resumo: "Liquidez, segurança e como separar a reserva dos investimentos de longo prazo.", perfis: ["con", "mod"], nivel: ["ini"], temas: ["planejamento", "renda fixa"], url: esferas.edu.url },
    { id: "c2", esfera: "edu", formato: "Curso", dur: "2h", titulo: "Tesouro Direto do zero: Selic, Prefixado e IPCA+", resumo: "Como cada título se comporta, marcação a mercado e quando vale vender antes do vencimento.", perfis: ["con", "mod"], nivel: ["ini", "int"], temas: ["tesouro", "renda fixa"], url: esferas.edu.url },
    { id: "c3", esfera: "bora", formato: "Artigo", dur: "6 min", titulo: "CDB, LCI e LCA: diferenças de imposto, prazo e garantia do FGC", resumo: "Compare rentabilidade líquida e entenda os limites de cobertura do FGC.", perfis: ["con", "mod"], nivel: ["ini"], temas: ["renda fixa"], url: BORA + "/tipos-de-investimentos/" },
    { id: "c4", esfera: "bora", formato: "Artigo", dur: "5 min", titulo: "Marcação a mercado: por que seu título público oscilou?", resumo: "Entenda por que o valor do Tesouro muda todo dia mesmo sendo renda fixa.", perfis: ["con", "mod"], nivel: ["ini", "int"], temas: ["tesouro"], url: BORA + "/tipos-de-investimentos/" },
    { id: "c5", esfera: "tesouro", formato: "Simulador", dur: "3 min", titulo: "Simule quanto seu Tesouro rende até o vencimento", resumo: "Ferramenta oficial com premissas editáveis de taxa e inflação.", perfis: ["con"], nivel: ["ini", "int"], temas: ["tesouro"], url: esferas.tesouro.url },
    { id: "c6", esfera: "edu", formato: "Vídeo", dur: "12 min", titulo: "Inflação e juros reais: proteja o poder de compra", resumo: "Por que olhar a rentabilidade real, e não só a nominal.", perfis: ["con", "mod"], nivel: ["int"], temas: ["renda fixa", "planejamento"], url: esferas.edu.url },
    // ----- Moderado -----
    { id: "m1", esfera: "edu", formato: "Curso", dur: "2h30", titulo: "Fundos imobiliários: tijolo, papel e como ler o relatório gerencial", resumo: "Vacância, P/VP, dividend yield e riscos de cada segmento.", perfis: ["mod", "arr"], nivel: ["ini", "int"], temas: ["fii", "dividendos"], url: esferas.edu.url },
    { id: "m2", esfera: "bora", formato: "Artigo", dur: "7 min", titulo: "Data-com, data ex e pagamento: quem tem direito ao provento", resumo: "O passo a passo do calendário de dividendos e JCP, com exemplos.", perfis: ["con", "mod", "arr"], nivel: ["ini"], temas: ["dividendos", "acoes"], url: BORA + "/tipos-de-investimentos/renda-variavel/acoes/" },
    { id: "m3", esfera: "edu", formato: "Curso", dur: "1h40", titulo: "ETFs: diversificação com um único ativo", resumo: "Como funcionam BOVA11, SMAL11 e IVVB11, taxas e tributação.", perfis: ["mod", "arr"], nivel: ["ini", "int"], temas: ["etf", "internacional"], url: esferas.edu.url },
    { id: "m4", esfera: "bora", formato: "Artigo", dur: "8 min", titulo: "Índices da B3: o que Ibovespa, IFIX e IDIV medem", resumo: "Metodologia, rebalanceamento e como usar índices como referência.", perfis: ["mod", "arr"], nivel: ["int"], temas: ["acoes", "fii", "etf"], url: BORA + "/tipos-de-investimentos/renda-variavel/indices/" },
    { id: "m5", esfera: "edu", formato: "Curso", dur: "3h", titulo: "Montando uma carteira diversificada por objetivo", resumo: "Alocação entre renda fixa e variável, rebalanceamento e horizonte.", perfis: ["mod"], nivel: ["int"], temas: ["planejamento"], url: esferas.edu.url },
    { id: "m6", esfera: "bora", formato: "Artigo", dur: "6 min", titulo: "JCP ou dividendo? Entenda a diferença no seu bolso", resumo: "Tributação na fonte, como aparece no informe e na declaração.", perfis: ["mod", "arr"], nivel: ["ini", "int"], temas: ["dividendos", "ir"], url: BORA + "/tipos-de-investimentos/renda-variavel/acoes/" },
    { id: "m7", esfera: "bora", formato: "Guia", dur: "10 min", titulo: "Imposto de Renda em ações e FIIs: isenções, DARF e prejuízo", resumo: "Quando há imposto em vendas, como compensar prejuízo e o que é isento.", perfis: ["mod", "arr"], nivel: ["int"], temas: ["ir", "acoes", "fii"], url: BORA + "/tudo-sobre/investimentos/" },
    { id: "m8", esfera: "assembleias", formato: "Serviço", dur: "2 min", titulo: "Vote a distância nas assembleias das empresas que você tem", resumo: "Participe das decisões dos seus ativos pelo celular ou pelo portal.", perfis: ["mod", "arr"], nivel: ["int", "ava"], temas: ["acoes", "fii"], url: esferas.assembleias.url },
    // ----- Arrojado -----
    { id: "a1", esfera: "edu", formato: "Curso", dur: "4h", titulo: "Opções na prática: calls, puts e estratégias de proteção", resumo: "Prêmio, strike, vencimento e como montar travas para limitar perdas.", perfis: ["arr"], nivel: ["int", "ava"], temas: ["derivativos"], url: esferas.edu.url },
    { id: "a2", esfera: "edu", formato: "Curso", dur: "3h", titulo: "Mercado futuro: mini índice e mini dólar sem mistério", resumo: "Ajuste diário, margem de garantia e alavancagem — e seus riscos.", perfis: ["arr"], nivel: ["ava"], temas: ["derivativos"], url: esferas.edu.url },
    { id: "a3", esfera: "edu", formato: "Curso", dur: "3h30", titulo: "Análise fundamentalista: valuation e leitura de balanços", resumo: "DRE, fluxo de caixa, múltiplos (P/L, EV/EBITDA) e fluxo de caixa descontado.", perfis: ["arr", "mod"], nivel: ["int", "ava"], temas: ["acoes"], url: esferas.edu.url },
    { id: "a4", esfera: "bora", formato: "Artigo", dur: "7 min", titulo: "Small caps: potencial e volatilidade das empresas menores", resumo: "O que muda em liquidez e risco quando você sai das blue chips.", perfis: ["arr"], nivel: ["int"], temas: ["acoes", "etf"], url: BORA + "/tipos-de-investimentos/renda-variavel/" },
    { id: "a5", esfera: "bora", formato: "Artigo", dur: "6 min", titulo: "BDRs e ETFs internacionais: exposição global pela B3", resumo: "Câmbio, tributação e diferenças entre BDR patrocinado e não patrocinado.", perfis: ["arr", "mod"], nivel: ["int"], temas: ["internacional", "etf"], url: BORA + "/tipos-de-investimentos/" },
    { id: "a6", esfera: "ofertas", formato: "Serviço", dur: "—", titulo: "Ofertas públicas em andamento: IPOs, follow-ons e debêntures", resumo: "Prospectos, cronograma e período de reserva, num só lugar.", perfis: ["arr", "mod"], nivel: ["int", "ava"], temas: ["acoes", "renda fixa"], url: esferas.ofertas.url },
    { id: "a7", esfera: "edu", formato: "Vídeo", dur: "18 min", titulo: "Gestão de risco: tamanho de posição e stop", resumo: "Como limitar a perda máxima por operação e evitar concentração.", perfis: ["arr"], nivel: ["int", "ava"], temas: ["derivativos", "acoes", "planejamento"], url: esferas.edu.url },
    { id: "a8", esfera: "bora", formato: "Notícia", dur: "4 min", titulo: "Mercado hoje: o que moveu o Ibovespa na semana", resumo: "Resumo semanal com os destaques de alta e baixa e os eventos da agenda.", perfis: ["arr", "mod"], nivel: ["ini", "int", "ava"], temas: ["acoes"], url: BORA + "/noticias/mercado/" },
    // ----- Gerais -----
    { id: "g1", esfera: "edu", formato: "Curso", dur: "1h", titulo: "Primeiros passos na bolsa: como funciona a B3", resumo: "Custódia, corretora, liquidação e o que é a Área do Investidor.", perfis: ["con", "mod", "arr"], nivel: ["ini"], temas: ["acoes", "planejamento"], url: esferas.edu.url },
    { id: "g2", esfera: "bora", formato: "Artigo", dur: "5 min", titulo: "Portabilidade de investimentos: como transferir sem vender", resumo: "Prazos, ativos elegíveis e o que confirmar na instituição de origem.", perfis: ["con", "mod", "arr"], nivel: ["ini", "int"], temas: ["planejamento"], url: BORA + "/objetivos-financeiros/" },
    { id: "g3", esfera: "bora", formato: "Artigo", dur: "6 min", titulo: "Metas financeiras: do objetivo ao plano de aportes", resumo: "Como transformar um objetivo em valor mensal e prazo realistas.", perfis: ["con", "mod", "arr"], nivel: ["ini", "int"], temas: ["planejamento"], url: BORA + "/objetivos-financeiros/" },
  ];

  // ---------- Questionário de perfil (simulação educativa) ----------
  const questionario = [
    { id: "objetivo", titulo: "Qual é o seu principal objetivo ao investir?", tipo: "single", opcoes: [
      { t: "Preservar o que já tenho, com o mínimo de oscilação", p: 0 },
      { t: "Gerar uma renda recorrente (proventos, juros)", p: 1 },
      { t: "Fazer o patrimônio crescer no longo prazo", p: 2 },
      { t: "Buscar retornos acima da média, aceitando oscilações fortes", p: 3 } ] },
    { id: "prazo", titulo: "Por quanto tempo você pretende deixar a maior parte do dinheiro investida?", tipo: "single", opcoes: [
      { t: "Menos de 1 ano", p: 0 }, { t: "De 1 a 3 anos", p: 1 }, { t: "De 3 a 5 anos", p: 2 }, { t: "Mais de 5 anos", p: 3 } ] },
    { id: "queda", titulo: "Se seus investimentos caíssem 20% em um mês, o que você faria?", tipo: "single", opcoes: [
      { t: "Resgataria tudo para não perder mais", p: 0 }, { t: "Resgataria uma parte", p: 1 },
      { t: "Manteria e esperaria recuperar", p: 2 }, { t: "Aproveitaria para investir mais", p: 3 } ] },
    { id: "reserva", titulo: "Você tem uma reserva de emergência separada dos investimentos?", tipo: "single", opcoes: [
      { t: "Não tenho", p: 0 }, { t: "Sim, para menos de 3 meses de gastos", p: 1 },
      { t: "Sim, de 3 a 6 meses", p: 2 }, { t: "Sim, mais de 6 meses", p: 3 } ] },
    { id: "parcela", titulo: "Que parte do seu patrimônio poderia ficar investida sem que você precise dela?", tipo: "single", opcoes: [
      { t: "Menos de 25%", p: 0 }, { t: "De 25% a 50%", p: 1 }, { t: "De 50% a 75%", p: 2 }, { t: "Mais de 75%", p: 3 } ] },
    { id: "experiencia", titulo: "Em quais produtos você já investiu? (marque todos)", tipo: "multi", opcoes: [
      { t: "Poupança, CDB, LCI ou LCA", p: 0 }, { t: "Tesouro Direto ou fundos", p: 1 },
      { t: "Ações, FIIs ou ETFs", p: 2 }, { t: "Opções, mercado futuro ou outros derivativos", p: 3 } ] },
    { id: "conhecimento", titulo: "Como você descreveria seu conhecimento sobre investimentos?", tipo: "single", nivel: true, opcoes: [
      { t: "Iniciante — estou começando agora", v: "ini" },
      { t: "Intermediário — entendo os principais produtos", v: "int" },
      { t: "Avançado — acompanho o mercado e uso estratégias", v: "ava" } ] },
    { id: "interesses", titulo: "Sobre o que você quer aprender ou acompanhar? (marque até 4)", tipo: "multi", interesses: true, max: 4, opcoes: [
      { t: "Renda fixa", v: "renda fixa" }, { t: "Tesouro Direto", v: "tesouro" }, { t: "Dividendos", v: "dividendos" },
      { t: "Fundos imobiliários", v: "fii" }, { t: "Ações", v: "acoes" }, { t: "ETFs", v: "etf" },
      { t: "Internacional / BDRs", v: "internacional" }, { t: "Derivativos", v: "derivativos" },
      { t: "Imposto de Renda", v: "ir" }, { t: "Planejamento e metas", v: "planejamento" } ] },
  ];

  const perfis = {
    con: { nome: "Conservador", cor: "#1F7A3E", desc: "Prioriza segurança e liquidez. Aceita retornos menores para evitar oscilações." },
    mod: { nome: "Moderado", cor: "#B85C00", desc: "Busca equilíbrio: parte em renda fixa, parte em renda variável, com horizonte de médio prazo." },
    arr: { nome: "Arrojado", cor: "#B3261E", desc: "Aceita oscilações fortes em busca de retorno maior no longo prazo e conhece produtos complexos." },
  };
  const niveis = { ini: "Iniciante", int: "Intermediário", ava: "Avançado" };

  return { ativos, esferas, conteudos, questionario, perfis, niveis };
})();
