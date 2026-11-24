# Área do Investidor B3: protótipo v1

Protótipo navegável de uma nova **Área do Investidor da B3**. Ele junta em um só lugar as melhores ferramentas de outras plataformas (Status Invest, Kinvo, Gorila, Nasdaq, Sharesight, Empower e Robinhood) e acrescenta um **feed personalizado pelo perfil do investidor**. Esse feed conecta a área logada às outras frentes da B3: B3 Educação, Bora Investir, Tesouro Direto, ofertas públicas e assembleias.

> ⚠️ **Projeto conceitual, sem relação oficial com a B3.** Os dados são fictícios e anonimizados, e as cotações, índices e indicadores são simulados. Nada aqui é recomendação de investimento. A marca B3 pertence à B3 S.A. – Brasil, Bolsa, Balcão e aparece apenas para ilustrar a proposta.

---

## 🚀 Como abrir

### Online (GitHub Pages)
Se o repositório estiver publicado no GitHub Pages, basta abrir o link da página. O endereço segue o formato `https://SEU-USUARIO.github.io/NOME-DO-REPOSITORIO/`.

### No seu computador
Não há nada para instalar: o site é só HTML, CSS e JavaScript.

```bash
git clone https://github.com/SEU-USUARIO/NOME-DO-REPOSITORIO.git
cd NOME-DO-REPOSITORIO
python3 -m http.server 8765
```

Depois, abra **http://localhost:8765** no navegador. Também funciona abrindo o `index.html` com dois cliques, mas o servidor local evita problemas de alguns navegadores.

---

## 🧭 Como usar (primeiro acesso)

1. No primeiro acesso, aparece a **tela de boas-vindas** com as instruções de uso. Ela tem 6 etapas e pode ser pulada.
2. No fim, escolha **responder o questionário de perfil**, **fazer o tour guiado** ou **explorar sozinho**.
3. O botão **?** no topo leva a **Tutoriais e ajuda**, com 8 tours guiados que destacam cada parte da tela, mais as perguntas frequentes.
4. O seletor no topo troca entre os **100 investidores de teste** da amostra, para ver carteiras e perfis diferentes.
5. O olho no topo **oculta todos os valores** em reais.

Para ver a tela de boas-vindas de novo, use *Tutoriais e ajuda → Rever boas-vindas*.

---

## ✨ O que tem no protótipo

| Área | Tela | Inspiração |
|---|---|---|
| Para você | **Feed personalizado**: finito, explica “por que estou vendo isto” e liga B3 Educação, Bora Investir, Tesouro Direto, ofertas e assembleias | Empower, Robinhood |
| Para você | **Questionário de perfil**: 8 perguntas que definem Conservador/Moderado/Arrojado, nível de conhecimento e interesses | Suitability |
| Para você | **Boas-vindas + Tutoriais e ajuda**: tours guiados, passo a passo e perguntas frequentes | — |
| Meus investimentos | Visão geral: patrimônio, aportes e resultado separados, e rentabilidade × CDI × Ibovespa | Kinvo, Gorila |
| Meus investimentos | Carteira, recebimentos (pago × anunciado × estimado), movimentações, documentos e exportação CSV | Kinvo, Sharesight, B3 |
| Conta | Conexões e dados: status por instituição, permissões de APIs, portabilidade | B3, Open Finance |
| Mercado | Mercado hoje, ficha do ativo, calendário (data-com, data ex, pagamento), acompanhamento com alertas, comparador | Nasdaq, Status Invest |
| Serviços B3 | Ofertas públicas e assembleias com voto a distância | B3 |

---

## 🧠 Como o feed escolhe os conteúdos

Cada conteúdo recebe uma pontuação:

- **+4** se combina com o perfil (Conservador, Moderado ou Arrojado). Fica **−3** se não combina.
- **+2** se combina com o nível de conhecimento.
- **+4** se bate com um interesse marcado no questionário, e **+1** para cada interesse a mais.
- **+1 ou +2** se fala de algo que a pessoa tem na carteira.

O feed também gera avisos a partir da carteira: proventos anunciados, data-com de ativos que a pessoa tem, concentração alta, pendências de conexão e assembleias. O feed mostra **até 10 conteúdos** e explica por que cada item apareceu. Antes do questionário, o perfil é inferido da carteira.

---

## 🗂️ Estrutura

```
index.html              página única (rotas por #hash)
css/styles.css          estilos
assets/b3-logo.png      logo
dados/Amostra_B3i.xlsx  amostra fictícia (100 investidores)
scripts/build_data.py   converte a planilha em js/data.js (sem dependências)
js/data.js              dados gerados da planilha
js/catalogo.js          ativos, conteúdos de educação e questionário
js/mercado.js           cotações, índices e calendário simulados
js/carteira.js          cálculos: patrimônio, aportes, resultado, rentabilidade
js/feed.js              motor do feed e cálculo do perfil
js/tutoriais.js         boas-vindas, tutoriais e tour guiado
js/views-*.js           telas
js/app.js               rotas, busca, ocultar valores
```

Para atualizar os dados depois de trocar a planilha:

```bash
python3 scripts/build_data.py
```

---

## 🧪 Roteiro de teste com usuários

Peça para a pessoa fazer, sem ajuda:

1. Encontrar **PETR4** e explicar o horário e o atraso da cotação.
2. Dizer quanto recebeu de proventos e quanto ainda vai receber.
3. Explicar a diferença entre **aporte** e **resultado**.
4. Responder o questionário e dizer por que um item do feed apareceu.

---

## 📌 Status

**v1, congelada em 24/11/2026.** É a versão apresentada no primeiro teste. A evolução, com menos abas, chat com IA, gráficos reais e vídeos para iniciantes, está sendo feita em uma v2 separada.
