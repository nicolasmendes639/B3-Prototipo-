/* V2 — Relatórios (o ÚNICO lugar com tabelas) e Conta (contas conectadas, permissões, portabilidade, privacidade). */
(function (V) {
  const U = window.U, M = window.MERCADO, D = window.B3DATA, K = window.CONSOL, CR = window.CRIPTO;

  function tabela(cols, linhas, totalRow) {
    return `<div class="tbl-wrap"><table><thead><tr>${cols.map((c) => `<th class="${c.n ? "num" : ""}">${c.t}</th>`).join("")}</tr></thead><tbody>${linhas.map((l) => `<tr>${l.map((v, i) => `<td class="${cols[i].n ? "num" : ""}">${v}</td>`).join("")}</tr>`).join("")}</tbody>${totalRow ? `<tfoot><tr>${totalRow.map((v, i) => `<td class="${cols[i].n ? "num" : ""}">${v}</td>`).join("")}</tr></tfoot>` : ""}</table></div>`;
  }

  // =============== RELATÓRIOS ===============
  // Único lugar com tabelas. Extrato por período, planilha Excel (.xlsx com várias abas) e informes de IR.
  const PERIODOS_REL = [["30", "30 dias"], ["90", "3 meses"], ["180", "6 meses"], ["365", "12 meses"], ["tudo", "Tudo"]];
  const perRel = () => U.store.get("rel:per", "180");
  const inicioPer = (p) => (p === "tudo" ? "0000-00-00" : M.addDays(D.dataBase, -+p));
  const nomePer = (p) => (PERIODOS_REL.find((x) => x[0] === p) || [, "personalizado"])[1];
  const segPer = (p) => `<div class="seg" role="group" aria-label="Período">${PERIODOS_REL.map(([k, t]) => `<button data-relper="${k}" aria-pressed="${k === p}">${t}</button>`).join("")}</div>`;
  const ISENTO = { Dividendo: true, Rendimento: true };

  // Linhas do extrato: movimentações + proventos pagos, em ordem de data
  function extrato(r, de, filtro) {
    const out = [];
    if (filtro !== "prov") r.inv.mov.forEach((m) => { if (m[0] >= de) out.push({ data: m[0], ativo: m[2], tipo: m[3] === "Compra" ? (m[4] === "Aplicacao" ? "Aplicação" : "Compra") : m[4] === "Resgate" ? "Resgate" : "Venda", desc: `${U.rotuloMov(m[4])} · ${U.num(m[5], m[5] % 1 ? 2 : 0)} × R$ ${U.num(m[6], 2)}`, entrada: m[3] === "Venda" ? m[7] : 0, saida: m[3] === "Compra" ? m[7] : 0, q: m[5], preco: m[6], classe: m[1] }); });
    if (filtro !== "mov") r.prov.forEach((p) => { if (p.recebido && p.data >= de && p.data <= D.dataBase) out.push({ data: p.data, ativo: p.tk, tipo: U.rotuloProv(p.tp), desc: "Provento creditado", entrada: p.valor, saida: 0, classe: p.classe }); });
    return out.sort((a, b) => (a.data < b.data ? 1 : -1));
  }
  // Resumo para IR de um ano: isentos, JCP e bens e direitos
  function resumoIR(id, r, ano) {
    const pagos = r.prov.filter((p) => p.recebido && p.data.startsWith(String(ano)));
    const porAtivo = (f) => { const o = {}; pagos.filter(f).forEach((p) => (o[p.tk] = (o[p.tk] || 0) + p.valor)); return Object.entries(o).sort((a, b) => b[1] - a[1]); };
    return { isentos: porAtivo((p) => ISENTO[p.tp]), jcp: porAtivo((p) => !ISENTO[p.tp]), bens: K.itens(id), qtd: pagos.length };
  }

  // Carrega a biblioteca de Excel (SheetJS) só quando a pessoa pede o arquivo
  let xlsxPromise = null;
  function carregarXLSX() {
    if (window.XLSX) return Promise.resolve(window.XLSX);
    xlsxPromise = xlsxPromise || new Promise((ok, erro) => { const s = document.createElement("script"); s.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"; s.onload = () => ok(window.XLSX); s.onerror = () => { xlsxPromise = null; erro(new Error("sem conexão")); }; document.head.appendChild(s); });
    return xlsxPromise;
  }
  const dt = (s) => new Date(s + "T12:00:00");
  // abas: [{ nome, cab: [..], linhas: [[..]], fmt: { colIdx: "data"|"brl"|"num"|"pct" }, larg: [..] }]
  async function baixarExcel(nomeArq, abas) {
    try {
      const X = await carregarXLSX(), wb = X.utils.book_new();
      abas.forEach((a) => {
        const ws = X.utils.aoa_to_sheet([a.cab].concat(a.linhas), { cellDates: true });
        const rg = X.utils.decode_range(ws["!ref"]);
        for (let R = 1; R <= rg.e.r; R++) Object.entries(a.fmt || {}).forEach(([c, f]) => { const cel = ws[X.utils.encode_cell({ r: R, c: +c })]; if (!cel) return; cel.z = { data: "dd/mm/yyyy", brl: '"R$" #,##0.00', num: "#,##0.####", pct: "0.0%" }[f]; });
        ws["!cols"] = (a.larg || a.cab.map(() => 16)).map((w) => ({ wch: w }));
        X.utils.book_append_sheet(wb, ws, a.nome.slice(0, 31));
      });
      X.writeFile(wb, nomeArq);
      U.toast("Planilha Excel baixada");
    } catch (e) {
      U.toast("Sem conexão para gerar o Excel — baixando em CSV");
      abas.forEach((a) => U.downloadCSV(nomeArq.replace(".xlsx", `_${a.nome}.csv`), [a.cab].concat(a.linhas.map((l) => l.map((v) => (v instanceof Date ? v.toISOString().slice(0, 10) : v))))));
    }
  }
  function abasPlanilha(id, r, de, incluir) {
    const its = K.itens(id), tot = its.reduce((a, x) => a + x.valor, 0), ext = extrato(r, de, "tudo");
    const mov = r.inv.mov.filter((m) => m[0] >= de), prov = r.prov.filter((p) => p.data >= de);
    const abas = [];
    if (incluir.resumo) {
      const compras = mov.filter((m) => m[3] === "Compra").reduce((a, m) => a + m[7], 0), vendas = mov.filter((m) => m[3] === "Venda").reduce((a, m) => a + m[7], 0);
      const rec = prov.filter((p) => p.recebido && p.data <= D.dataBase).reduce((a, p) => a + p.valor, 0), anu = r.anunciados.reduce((a, p) => a + p.valor, 0);
      abas.push({ nome: "Resumo", cab: ["Item", "Valor"], fmt: { 1: "brl" }, larg: [42, 20], linhas: [
        ["Período do extrato", `${de === "0000-00-00" ? "início do histórico" : U.data(de)} a ${U.data(D.dataBase)}`], ["Posição na data-base", U.data(D.dataBase)],
        ["Saldo total da carteira", +tot.toFixed(2)], ["Compras e aplicações no período", +compras.toFixed(2)], ["Vendas e resgates no período", +vendas.toFixed(2)],
        ["Proventos recebidos no período", +rec.toFixed(2)], ["Proventos anunciados (a receber)", +anu.toFixed(2)], ["", ""], ["Distribuição por classe", ""]]
        .concat(K.porClasse(id).map((c) => [`  ${c.nome} (${U.num(c.pct, 1)}%)`, +c.valor.toFixed(2)])).concat([["", ""], ["Fonte", "Protótipo — dados fictícios; não é documento oficial"]]) });
    }
    if (incluir.extrato) abas.push({ nome: "Extrato", cab: ["Data", "Ativo", "Lançamento", "Descrição", "Entrada (R$)", "Saída (R$)"], fmt: { 0: "data", 4: "brl", 5: "brl" }, larg: [12, 22, 14, 34, 14, 14], linhas: ext.map((e) => [dt(e.data), e.ativo, e.tipo, e.desc, e.entrada ? +e.entrada.toFixed(2) : "", e.saida ? +e.saida.toFixed(2) : ""]) });
    if (incluir.posicao) abas.push({ nome: "Posição", cab: ["Investimento", "Nome", "Tipo", "Classe", "Onde está", "Quantidade", "Preço (R$)", "Valor (R$)", "% do total"], fmt: { 5: "num", 6: "brl", 7: "brl", 8: "pct" }, larg: [22, 30, 20, 16, 22, 12, 12, 14, 10], linhas: its.map((x) => [x.tipo === "rf" ? x.nome : x.cod, x.tipo === "rf" ? x.instTxt : x.nome, x.tipo === "cripto" ? "ETF de Criptomoedas" : U.rotuloTipo(x.sub), U.rotuloClasse(x.classe), x.tipo === "rf" ? x.instTxt : "B3 (custódia)", x.q ?? "", x.preco ? +x.preco.toFixed(2) : "", +x.valor.toFixed(2), +(x.pct / 100).toFixed(4)]) });
    if (incluir.movimentacoes) abas.push({ nome: "Movimentações", cab: ["Data", "Ativo", "Classe", "Operação", "Tipo", "Quantidade", "Preço (R$)", "Valor (R$)"], fmt: { 0: "data", 5: "num", 6: "brl", 7: "brl" }, larg: [12, 22, 16, 10, 12, 12, 12, 14], linhas: mov.slice().reverse().map((m) => [dt(m[0]), m[2], U.rotuloClasse(m[1]), m[3], U.rotuloMov(m[4]), m[5], m[6], m[7]]) });
    if (incluir.proventos) abas.push({ nome: "Proventos", cab: ["Data de pagamento", "Ativo", "Tipo", "Status", "Valor líquido (R$)"], fmt: { 0: "data", 4: "brl" }, larg: [16, 12, 12, 12, 16], linhas: prov.slice().reverse().map((p) => [dt(p.data), p.tk, U.rotuloProv(p.tp), p.recebido ? "Pago" : "Anunciado", p.valor]) });
    if (incluir.ir) {
      const ano = +D.dataBase.slice(0, 4), ir = resumoIR(id, r, ano);
      abas.push({ nome: `IR ${ano} (prévia)`, cab: ["Ficha da declaração", "Ativo / item", "Valor (R$)"], fmt: { 2: "brl" }, larg: [44, 30, 14], linhas:
        [["Rendimentos isentos — dividendos e rendimentos de FII", "", ""]].concat(ir.isentos.map(([tk, v]) => ["", tk, +v.toFixed(2)]))
        .concat([["", "", ""], ["Tributação exclusiva — JCP", "", ""]]).concat(ir.jcp.map(([tk, v]) => ["", tk, +v.toFixed(2)]))
        .concat([["", "", ""], [`Bens e direitos — posição em ${U.data(D.dataBase)}`, "", ""]]).concat(ir.bens.map((x) => ["", x.tipo === "rf" ? `${x.nome} (${x.instTxt})` : x.cod, +x.valor.toFixed(2)]))
        .concat([["", "", ""], ["Atenção", "Prévia de apoio: não inclui corretagem nem ganho de capital", ""]]) });
    }
    return abas;
  }

  V.relatorios = {
    html(ctx) {
      const { id, r, params } = ctx, aba = params[0] || "";
      const abas = [["", "Posição"], ["movimentacoes", "Extrato"], ["planilha", "⬇ Baixar planilha (Excel)"], ["proventos", "Proventos"], ["informes", "Informes e IR"]];
      let corpo = "";
      const its = K.itens(id), p = perRel(), de = inicioPer(p);
      if (!aba) {
        const tot = its.reduce((a, x) => a + x.valor, 0);
        corpo = `<section class="card"><div class="card-h"><div><h2>Posição consolidada</h2><div class="sub">Todas as contas · ${U.data(D.dataBase)}</div></div><div style="display:flex;gap:8px"><button class="btn sm primary" data-xls="pos">⬇ Excel</button><button class="btn sm" data-csv="pos">CSV</button></div></div>
          ${tabela([{ t: "Investimento" }, { t: "Tipo" }, { t: "Onde está" }, { t: "Quantidade", n: 1 }, { t: "Valor", n: 1 }, { t: "% do total", n: 1 }],
            its.map((x) => [`<b>${U.esc(x.tipo === "rf" ? x.nome : x.cod)}</b><br><span class="small muted">${U.esc(x.tipo === "rf" ? "" : x.nome)}</span>`, x.tipo === "cripto" ? "ETF de Criptomoedas" : U.rotuloTipo(x.sub), x.tipo === "rf" ? x.instTxt : "B3 (custódia)", x.q !== undefined ? U.qtd(x.q) : "—", `<b>${U.brl(x.valor)}</b>`, U.num(x.pct, 1) + "%"]),
            ["Total", "", "", "", `<b>${U.brl(tot)}</b>`, "100%"])}</section>`;
      } else if (aba === "movimentacoes") {
        const filtro = U.store.get("rel:filtro", "tudo"), ext = extrato(r, de, filtro);
        const ent = ext.reduce((a, e) => a + e.entrada, 0), sai = ext.reduce((a, e) => a + e.saida, 0), provs = ext.filter((e) => e.desc === "Provento creditado").reduce((a, e) => a + e.entrada, 0);
        corpo = `<section class="card"><div class="card-h"><div><h2>Extrato</h2><div class="sub">Compras, vendas, aplicações, resgates e proventos creditados · ${nomePer(p)}</div></div><div style="display:flex;gap:8px"><button class="btn sm primary" data-xls="ext">⬇ Baixar Excel</button><button class="btn sm" data-csv="ext">CSV</button></div></div>
          <div class="filters">${segPer(p)}<div class="seg" role="group" aria-label="Tipo de lançamento">${[["tudo", "Tudo"], ["mov", "Compras e vendas"], ["prov", "Proventos"]].map(([k, t]) => `<button data-relfil="${k}" aria-pressed="${k === filtro}">${t}</button>`).join("")}</div></div>
          <div class="grid g3" style="margin-bottom:14px">${V._kpi("Lançamentos", String(ext.length), `de ${de === "0000-00-00" ? "início do histórico" : U.data(de)} a ${U.data(D.dataBase)}`)}${V._kpi("Entraram na conta", U.brl(ent), `${U.brl(provs)} em proventos`)}${V._kpi("Saíram da conta", U.brl(sai), "compras e aplicações")}</div>
          ${ext.length ? tabela([{ t: "Data" }, { t: "Ativo" }, { t: "Lançamento" }, { t: "Descrição" }, { t: "Entrada", n: 1 }, { t: "Saída", n: 1 }], ext.map((e) => [U.data(e.data), V._linkAtivo(e.ativo), e.tipo, `<span class="small muted">${U.esc(e.desc)}</span>`, e.entrada ? `<span class="pos">+ ${U.brl(e.entrada)}</span>` : "", e.saida ? `<span class="neg">− ${U.brl(e.saida)}</span>` : ""]), ["Total", "", "", "", `<b>${U.brl(ent)}</b>`, `<b>${U.brl(sai)}</b>`]) : '<div class="empty"><div class="big">📭</div>Nada nesse período. Tente um período maior.</div>'}</section>`;
      } else if (aba === "planilha") {
        const inc = U.store.get("rel:incluir", { resumo: true, extrato: true, posicao: true, movimentacoes: true, proventos: true, ir: true });
        const ab = abasPlanilha(id, r, de, inc);
        const op = [["resumo", "Resumo", "saldo, entradas, saídas, proventos e divisão por classe"], ["extrato", "Extrato", "tudo o que entrou e saiu, em ordem de data"], ["posicao", "Posição", "cada investimento, quantidade, preço e valor"], ["movimentacoes", "Movimentações", "compras, vendas, aplicações e resgates"], ["proventos", "Proventos", "pagos e anunciados"], ["ir", "IR (prévia)", "isentos, JCP e bens e direitos do ano"]];
        corpo = `<section class="card"><div class="card-h"><div><h2>📊 Baixar planilha em Excel</h2><div class="sub">Escolha o período e o que entra no arquivo. Ele abre no Excel, Google Planilhas ou Numbers.</div></div></div>
          <h3 style="margin:6px 0 10px">1. Período</h3><div class="filters">${segPer(p)}<label>ou de<input type="date" id="relDe" value="${de === "0000-00-00" ? "" : de}" max="${D.dataBase}"></label></div>
          <h3 style="margin:16px 0 10px">2. O que incluir (cada item vira uma aba da planilha)</h3>
          <div class="grid g3">${op.map(([k, t, d]) => { const a = ab.find((x) => x.nome.startsWith(t.split(" ")[0])); return `<label class="card" style="padding:14px;cursor:pointer;display:flex;gap:12px;align-items:flex-start;box-shadow:none"><input type="checkbox" data-inc="${k}" ${inc[k] ? "checked" : ""} style="width:22px;height:22px;margin-top:2px"><span><b>${t}</b><br><span class="small muted">${d}</span>${a ? `<br><span class="chip blue" style="margin-top:6px">${a.linhas.length} linhas</span>` : ""}</span></label>`; }).join("")}</div>
          <h3 style="margin:18px 0 10px">3. Baixar</h3>
          <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center"><button class="btn primary" data-xls="tudo" ${ab.length ? "" : "disabled"} style="height:50px;font-size:17px;padding:0 24px">⬇ Baixar planilha Excel (.xlsx)</button><button class="btn" data-csv="tudo" ${ab.length ? "" : "disabled"}>Prefiro CSV</button><span class="small muted">${ab.length} aba(s) · ${ab.reduce((a, x) => a + x.linhas.length, 0)} linhas · arquivo <code>extrato_${D.dataBase}.xlsx</code></span></div></section>
          ${ab.find((x) => x.nome === "Extrato") ? `<section class="card section"><div class="card-h"><h2>Prévia do extrato</h2><span class="small muted">primeiras 8 linhas</span></div>${tabela([{ t: "Data" }, { t: "Ativo" }, { t: "Lançamento" }, { t: "Entrada", n: 1 }, { t: "Saída", n: 1 }], extrato(r, de, "tudo").slice(0, 8).map((e) => [U.data(e.data), e.ativo, e.tipo, e.entrada ? U.brl(e.entrada) : "", e.saida ? U.brl(e.saida) : ""]))}</section>` : ""}`;
      } else if (aba === "proventos") {
        corpo = `<section class="card"><div class="card-h"><h2>Proventos</h2><div style="display:flex;gap:8px"><button class="btn sm primary" data-xls="prov">⬇ Excel</button><button class="btn sm" data-csv="prov">CSV</button></div></div>
          ${tabela([{ t: "Data" }, { t: "Ativo" }, { t: "Tipo" }, { t: "Status" }, { t: "Valor líquido", n: 1 }], r.prov.slice().reverse().map((p) => [U.data(p.data), V._linkAtivo(p.tk), U.rotuloProv(p.tp), p.recebido ? '<span class="chip ok">Pago</span>' : '<span class="chip warn">Anunciado</span>', `<b>${U.brl(p.valor)}</b>`]))}</section>`;
      } else if (aba === "informes") {
        const ano = +D.dataBase.slice(0, 4), ir = resumoIR(id, r, ano), soma = (l) => l.reduce((a, x) => a + x[1], 0);
        const ir25 = resumoIR(id, r, ano - 1);
        corpo = `<div class="alert info-a"><span class="ic">ℹ️</span><div><b>O informe ajuda, mas não é a declaração completa.</b><p>Não inclui corretagem nem apuração de ganho de capital, inclusive nas vendas de ETFs de Criptomoedas.</p></div></div>
          <section class="card section"><div class="card-h"><div><h2>Imposto de Renda ${ano} — prévia</h2><div class="sub">Proventos pagos de janeiro até ${U.data(D.dataBase)} e posição na data-base</div></div><button class="btn sm primary" data-xls="ir">⬇ Baixar prévia (Excel)</button></div>
            <div class="grid g3">${V._kpi("Rendimentos isentos", U.brl(soma(ir.isentos)), `${ir.isentos.length} ativos · dividendos e rendimentos de FII`)}${V._kpi("JCP (tributação exclusiva)", U.brl(soma(ir.jcp)), `${ir.jcp.length} ativos · IR já retido na fonte`)}${V._kpi("Bens e direitos", String(ir.bens.length) + " itens", `${U.brl(ir.bens.reduce((a, x) => a + x.valor, 0))} na data-base`)}</div>
            ${ir.isentos.length ? `<h3 style="margin:18px 0 6px">Rendimentos isentos por ativo</h3>${tabela([{ t: "Ativo" }, { t: "Valor no ano", n: 1 }], ir.isentos.map(([tk, v]) => [V._linkAtivo(tk), U.brl(v)]), ["Total", `<b>${U.brl(soma(ir.isentos))}</b>`])}` : ""}
            ${ir.jcp.length ? `<h3 style="margin:18px 0 6px">JCP por ativo</h3>${tabela([{ t: "Ativo" }, { t: "Valor no ano", n: 1 }], ir.jcp.map(([tk, v]) => [V._linkAtivo(tk), U.brl(v)]), ["Total", `<b>${U.brl(soma(ir.jcp))}</b>`])}` : ""}</section>
          <section class="card section">${[[`Informe de rendimentos ${ano}`, "Documento oficial publicado a partir de fevereiro de " + (ano + 1), null, "Em fev/" + (ano + 1)], [`Informe de rendimentos ${ano - 1}`, ir25.qtd ? `${ir25.qtd} proventos (o histórico desta conta começa em dez/${ano - 1})` : "Sem proventos no ano", "ir25", "Disponível"], ["Extrato de posição", "Todas as contas, na data-base", "pos", "Disponível"], ["Extrato completo", "Movimentações e proventos do período escolhido", "ext", "Disponível"]].map(([t, s, k, st]) => `<div class="list-item"><span style="font-size:24px" aria-hidden="true">📄</span><div class="grow"><div class="t">${t}</div><div class="s">${s}</div></div><span class="chip ${k ? "ok" : ""}">${st}</span>${k ? `<button class="btn sm" data-xls="${k}">⬇ Excel</button><button class="btn sm ghost" data-csv="${k}">CSV</button>` : ""}</div>`).join("")}</section>`;
      }
      return `<div class="page-head"><div><h1>Relatórios</h1><p>Todos os números em tabela, para conferir e baixar em Excel</p></div></div>${V._sub("relatorios", aba, abas)}${corpo}`;
    },
    after(ctx) {
      const { id, r } = ctx, p = perRel(), de = U.store.get("rel:de", null) && p === "custom" ? U.store.get("rel:de") : inicioPer(p);
      const sufixo = `${D.dataBase}`;
      const inc = U.store.get("rel:incluir", { resumo: true, extrato: true, posicao: true, movimentacoes: true, proventos: true, ir: true });
      const todas = { resumo: true, extrato: true, posicao: true, movimentacoes: true, proventos: true, ir: true };
      const so = (k) => Object.fromEntries(Object.keys(todas).map((x) => [x, x === k]));
      const conjuntos = { tudo: inc, pos: so("posicao"), ext: so("extrato"), prov: so("proventos"), ir: so("ir") };
      const nomes = { tudo: `extrato_${sufixo}.xlsx`, pos: `posicao_${sufixo}.xlsx`, ext: `extrato_${nomePer(p).replace(" ", "")}_${sufixo}.xlsx`, prov: `proventos_${sufixo}.xlsx`, ir: `IR_${D.dataBase.slice(0, 4)}_previa.xlsx` };
      document.querySelectorAll("[data-xls]").forEach((b) => b.addEventListener("click", () => {
        const k = b.dataset.xls;
        if (k === "ir25") { const ano = +D.dataBase.slice(0, 4) - 1, pg = r.prov.filter((x) => x.recebido && x.data.startsWith(String(ano))); return baixarExcel(`informe_${ano}.xlsx`, [{ nome: `Informe ${ano}`, cab: ["Data", "Ativo", "Tipo", "Valor líquido (R$)"], fmt: { 0: "data", 3: "brl" }, larg: [12, 12, 12, 18], linhas: pg.map((x) => [dt(x.data), x.tk, U.rotuloProv(x.tp), x.valor]) }]); }
        baixarExcel(nomes[k], abasPlanilha(id, r, k === "pos" || k === "ir" ? "0000-00-00" : de, conjuntos[k]));
      }));
      document.querySelectorAll("[data-csv]").forEach((b) => b.addEventListener("click", () => {
        const k = b.dataset.csv;
        if (k === "ir25") { const ano = +D.dataBase.slice(0, 4) - 1; U.downloadCSV(`informe_${ano}.csv`, [["Data", "Ativo", "Tipo", "Valor líquido"]].concat(r.prov.filter((x) => x.recebido && x.data.startsWith(String(ano))).map((x) => [x.data, x.tk, U.rotuloProv(x.tp), x.valor]))); return U.toast("CSV baixado"); }
        abasPlanilha(id, r, k === "pos" ? "0000-00-00" : de, conjuntos[k]).forEach((a) => U.downloadCSV(`${a.nome.replace(/\s|\(|\)/g, "_")}_${sufixo}.csv`, [a.cab].concat(a.linhas.map((l) => l.map((v) => (v instanceof Date ? v.toISOString().slice(0, 10) : v))))));
        U.toast("CSV baixado");
      }));
      document.querySelectorAll("[data-relper]").forEach((b) => b.addEventListener("click", () => { U.store.set("rel:per", b.dataset.relper); window.APP.render(); }));
      document.querySelectorAll("[data-relfil]").forEach((b) => b.addEventListener("click", () => { U.store.set("rel:filtro", b.dataset.relfil); window.APP.render(); }));
      document.querySelectorAll("[data-inc]").forEach((c) => c.addEventListener("change", () => { const x = U.store.get("rel:incluir", todas); x[c.dataset.inc] = c.checked; U.store.set("rel:incluir", x); window.APP.render(); }));
      const deEl = document.getElementById("relDe");
      if (deEl) deEl.addEventListener("change", () => { if (!deEl.value) return; const dias = Math.round((dt(D.dataBase) - dt(deEl.value)) / 864e5); U.store.set("rel:per", String(Math.max(1, dias))); window.APP.render(); });
    },
  };

  // =============== CONTA ===============
  const CORRETORAS = ["Corretora Alfa", "Banco Beta Investimentos", "Corretora Gama", "Banco Delta", "Corretora Ômega"];
  V.conta = {
    html(ctx) {
      const { id, r, params } = ctx, aba = params[0] || "contas";
      const abas = [["contas", "Contas conectadas"], ["permissoes", "Permissões"], ["portabilidade", "Portabilidade"], ["privacidade", "Privacidade e alertas"]];
      let corpo = "";
      if (aba === "contas") {
        const inst = K.porInstituicao(id), extras = U.store.get("contas:extras", []);
        corpo = `<div class="alert ${r.pendInst ? "" : "ok"}"><span class="ic">${r.pendInst ? "⚠️" : "✅"}</span><div><b>${r.pendInst ? "Uma conta ainda não atualizou" : "Todas as contas estão atualizadas"}</b><p>Identificamos suas contas automaticamente pelo seu CPF (B3) e pelas autorizações de Open Finance.</p></div></div>
          <section class="card section"><div class="card-h"><h2>Suas contas</h2><button class="btn sm primary" id="addConta">+ Conectar outra conta</button></div>
          ${inst.concat(extras.map((n) => ({ nome: n, valor: 0, tipo: "Conectando…", novo: true }))).map((c) => { const pend = c.nome === r.pendInst; return `<div class="list-item" style="align-items:flex-start"><span style="font-size:22px" aria-hidden="true">${c.novo ? "🔄" : pend ? "🟠" : "🟢"}</span><div class="grow"><div class="t">${c.nome} <span class="small muted">· ${c.tipo}</span></div><div class="s">${c.novo ? "Aguardando a primeira sincronização (até 1 dia útil)" : `Posição de ${pend ? "19/11/2026" : U.data(D.dataBase)} · ${U.brl(c.valor)}`}</div>
            ${pend ? `<details style="margin-top:8px"><summary class="small" style="cursor:pointer;color:var(--b3);font-weight:600">Entenda o prazo e quem resolve</summary><div class="steps"><div class="st done">Conta identificada</div><div class="st done">Última posição 19/11</div><div class="st now">Aguardando a instituição</div><div class="st">Atualizado</div></div><p class="small">Normalmente resolve em até 2 dias úteis. Se continuar, a instituição é quem corrige — abra uma solicitação já com o contexto.</p><button class="btn sm" data-sol>Abrir solicitação</button></details>` : ""}</div><span class="chip ${c.novo ? "" : pend ? "warn" : "ok"}">${c.novo ? "Sincronizando" : pend ? "Pendente" : "Atualizada"}</span></div>`; }).join("")}</section>
          <div id="addBox" hidden class="card section"><h2>Conectar outra conta</h2><p class="muted">Escolha a instituição. Você será levado ao app dela para autorizar o compartilhamento (Open Finance) — nunca pedimos sua senha aqui.</p><div class="grid g3">${CORRETORAS.map((n) => `<button class="btn" data-conn="${n}" style="justify-content:flex-start;height:54px">🏦 ${n}</button>`).join("")}</div></div>`;
      } else if (aba === "permissoes") {
        const perms = U.store.get("perms", [{ n: "Aplicativo de controle financeiro (exemplo)", d: "Posição e movimentações · desde 03/2026", on: true }, { n: "Plataforma de declaração de IR (exemplo)", d: "Proventos e informe · desde 01/2026", on: true }]);
        corpo = `<section class="card"><div class="card-h"><div><h2>Quem pode ver seus dados</h2><div class="sub">Empresas que você autorizou via APIs da B3</div></div></div>${perms.map((p, i) => `<div class="list-item"><div class="grow"><div class="t">${p.n}</div><div class="s">${p.d}</div></div>${p.on ? `<span class="chip ok">Ativa</span><button class="btn sm" data-rev="${i}">Retirar acesso</button>` : '<span class="chip">Revogada</span>'}</div>`).join("")}</section>`;
      } else if (aba === "portabilidade") {
        corpo = `<section class="card"><div class="card-h"><div><h2>Portabilidade</h2><div class="sub">Transfira investimentos entre instituições sem vender</div></div><button class="btn sm primary" data-sol>Nova solicitação</button></div>
          <div class="t"><b>Solicitação #2026-1187</b> · Instituição 02 → Instituição 05 · 3 ativos</div><div class="steps"><div class="st done">Recebida</div><div class="st now">Confirmação na origem</div><div class="st">Transferência</div><div class="st">Posição atualizada</div></div>
          <p class="muted">Depende da confirmação na instituição de origem. Prazo de referência: até 2 dias úteis após a confirmação.</p></section>`;
      } else if (aba === "privacidade") {
        const al = U.store.get("prefs", { proventos: true, datacom: false, pendencias: true, preco: false, conteudo: true });
        const itens = [["proventos", "💰 Avisar quando um provento for pago"], ["datacom", "📌 Avisar data-com dos meus ativos"], ["pendencias", "⚠️ Avisar pendências nas contas"], ["preco", "📈 Alertas de preço (configure em Mercado → Acompanhamento)"], ["conteudo", "🎓 Sugestões de conteúdo para o meu perfil"]];
        corpo = `<div class="grid g2"><section class="card"><h2>Privacidade</h2><div class="list-item" style="margin-top:10px"><div class="grow"><div class="t">Ocultar valores</div><div class="s">Esconde os valores em reais em todas as telas</div></div><button class="btn sm" id="tgHide">${U.state.hide ? "Ligado" : "Desligado"}</button></div>
          <div class="list-item"><div class="grow"><div class="t">Rever a introdução</div><div class="s">Mostra de novo a tela de boas-vindas</div></div><a class="btn sm" href="#/boas-vindas">Abrir</a></div></section>
          <section class="card"><h2>Notificações</h2>${itens.map(([k, t]) => `<label class="list-item" style="cursor:pointer"><span class="grow">${t}</span><input type="checkbox" data-pref="${k}" ${al[k] ? "checked" : ""} style="width:22px;height:22px"></label>`).join("")}<p class="small muted">Nada de alertas de oscilação diária: você decide o que recebe.</p></section></div>`;
      }
      return `<div class="page-head"><div><h1>Minha conta</h1><p>Contas conectadas, permissões, portabilidade e privacidade</p></div></div>${V._sub("conta", aba, abas)}${corpo}`;
    },
    after(ctx) {
      document.querySelectorAll("[data-sol]").forEach((b) => b.addEventListener("click", () => U.toast("Simulação: solicitação registrada com protocolo")));
      const add = document.getElementById("addConta"); if (add) add.addEventListener("click", () => { const b = document.getElementById("addBox"); b.hidden = !b.hidden; b.scrollIntoView({ behavior: "smooth", block: "center" }); });
      document.querySelectorAll("[data-conn]").forEach((b) => b.addEventListener("click", () => { const e = U.store.get("contas:extras", []); if (!e.includes(b.dataset.conn)) e.push(b.dataset.conn); U.store.set("contas:extras", e); U.toast(`Simulação: autorização enviada para ${b.dataset.conn}`); window.APP.render(); }));
      document.querySelectorAll("[data-rev]").forEach((b) => b.addEventListener("click", () => {
        const perms = U.store.get("perms", [{ n: "Aplicativo de controle financeiro (exemplo)", d: "Posição e movimentações · desde 03/2026", on: true }, { n: "Plataforma de declaração de IR (exemplo)", d: "Proventos e informe · desde 01/2026", on: true }]);
        if (!confirm(`Retirar o acesso de "${perms[+b.dataset.rev].n}"?`)) return;
        perms[+b.dataset.rev].on = false; U.store.set("perms", perms); U.toast("Acesso retirado"); window.APP.render();
      }));
      const th = document.getElementById("tgHide"); if (th) th.addEventListener("click", () => document.getElementById("hideBtn").click());
      document.querySelectorAll("[data-pref]").forEach((c) => c.addEventListener("change", () => { const p = U.store.get("prefs", {}); p[c.dataset.pref] = c.checked; U.store.set("prefs", p); U.toast("Preferência salva"); }));
    },
  };
})(window.VIEWS);
