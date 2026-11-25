# Área do Investidor B3: protótipo (v2, versão atual)

Protótipo navegável de uma nova **Área do Investidor da B3**. Ele junta em um só lugar tudo o que o investidor tem (B3, corretoras e bancos, inclusive ETFs de Criptomoedas), mostra os números em gráficos simples e tem uma **assistente de IA** que abre ao lado da tela.

🔗 **Site:** https://nicolasmendes639.github.io/B3-Prototipo-/
🛠️ **Guia para desenvolvedores:** https://nicolasmendes639.github.io/B3-Prototipo-/dev.html
🕰️ **Versão antiga (v1):** https://nicolasmendes639.github.io/B3-Prototipo-/versao-antiga-v1/

> ⚠️ Projeto conceitual, sem vínculo oficial com a B3. Os dados de carteira são fictícios. Os gráficos marcados como **“ao vivo”** usam cotações reais do TradingView. Nada aqui é recomendação de investimento.

---

## ✨ As 7 abas

| Aba | O que tem |
|---|---|
| **Início** | Saldo total e quanto a carteira **ganhou ou perdeu nos últimos 30 dias**, em R$ e % (também 7D, 6M, 12M, 24M e “Desde o começo”). Logo abaixo vêm a carteira em gráfico de pizza, o que mais pesou no resultado e os próximos recebimentos. |
| **Carteira** | Distribuição por classe, conta e tipo, e gráfico multinível por setor e segmento (classe → setor → ativo, com zoom ao clicar); rentabilidade × CDI, Ibovespa, Dólar e outros índices; todos os investimentos; entradas e saídas. |
| **Proventos** | Extrato completo: totais (recebido, provisionado, 6/12/24 meses), gráfico com agrupamento, data base, visão e período, proventos por categoria, rendimento mês a mês (R$, YoC ou DY), ativos por categoria, lista de pagamentos com filtros e proventos futuros (provisionado e data com futura). Também calendário visual e assembleias. |
| **Mercado** | Gráficos **reais** dos índices e dos ativos do investidor (inclusive ETFs de Criptomoedas); destaques; acompanhamento e alertas; comparador; ofertas. |
| **Aprender** | 8 vídeos animados de cerca de 1 minuto para iniciantes, com quiz e XP; glossário; feed por perfil; tutoriais guiados. |
| **Relatórios** | O único lugar com tabelas: posição, extrato por período (30 dias a 12 meses), **planilha Excel (.xlsx) com várias abas**, proventos e prévia do IR do ano. |
| **Meu Perfil de Investidor** | Questionário de perfil (8 perguntas, ~2 min), resultado e botão para refazer. Ao entrar no site, quem ainda não respondeu recebe um convite, com a opção “Fazer mais tarde”. |

**Rentabilidade com proventos:** em todo lugar que mostra a rentabilidade de um ativo que distribui (ações, FIIs, ETFs e BDRs que pagam), aparecem duas: só o preço e com os proventos pagos (preço + proventos ÷ preço inicial, sem reinvestir). Na carteira, conta desde a compra; na ficha, no comparador e no acompanhamento, em 12 meses.

O botão **✦ Pergunte à IA**, no canto inferior direito, abre o chat ao lado da tela. No site publicado ele funciona em **modo demonstração**, com respostas locais.

---

## 🧑‍💻 Como trabalhar no projeto

### Rodar no computador
```bash
git clone https://github.com/nicolasmendes639/B3-Prototipo-.git
cd B3-Prototipo-
python3 server.py 8766
```
Depois, abra http://localhost:8766.

### Onde mexer
```
index.html            página principal (rotas por #hash)
dev.html              guia para desenvolvedores
css/styles.css        cores, fontes e componentes
js/app.js             abas, rotas, busca, menu da conta
js/views-inicio.js    Início, Carteira e Proventos
js/views-proventos.js Proventos → Resumo (extrato detalhado)
js/views-setores.js   Carteira → Distribuição: por setor e segmento (sunburst do ECharts, baixado do cdnjs só nesta página)
js/views-mercado.js   Mercado, ficha do ativo, acompanhamento, comparador
js/views-aprender.js  Aprender (vídeos, glossário, feed)
js/views-perfil.js    feed “Para você” e Meu Perfil de Investidor (questionário)
js/views-conta.js     Relatórios e Minha conta
js/videos.js          roteiro e player dos vídeos
js/chat.js            assistente de IA
js/tutoriais.js       boas-vindas e tours guiados
js/cripto.js          ETFs de Criptomoedas + consolidação das contas
js/rentabilidade.js   rentabilidade com e sem proventos + índices (CDI, IPCA, Poupança, Ibovespa, IFIX, S&P 500, Dólar)
js/proventos.js       PROV: lançamentos de proventos do investidor (pagos, provisionados e data com futura)
js/data.js            dados fictícios dos 100 investidores
server.py             servidor local + IA real (opcional)
versao-antiga-v1/     v1 guardada (arquivo único)
```

### Publicar alterações
Faça commit e push na branch `main`. O GitHub Pages atualiza o site sozinho em cerca de 1 minuto.

### IA real (opcional, só local)
```bash
pip install anthropic          # requer Python 3.10+
export ANTHROPIC_API_KEY=...
python3 server.py 8766
```
⚠️ Nunca coloque a chave da API no código nem no repositório.

### Trocar o investidor de teste
Use `?inv=INV-010` na URL. Os links para os 100 investidores estão no `dev.html`.

---

## 🕰️ Histórico

- **v2 (atual):** 7 abas, Início no estilo da B3, gráficos reais, vídeos para iniciantes, assistente de IA, letras maiores e tabelas só em Relatórios.
- **v1:** guardada em [`versao-antiga-v1/`](versao-antiga-v1/).
