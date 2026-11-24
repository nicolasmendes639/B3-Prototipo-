/* V2 — Relatórios (o ÚNICO lugar com tabelas) e Conta (contas conectadas, permissões, portabilidade, privacidade). */
(function (V) {
  const U = window.U, M = window.MERCADO, D = window.B3DATA, K = window.CONSOL, CR = window.CRIPTO;

  function tabela(cols, linhas, totalRow) {
    return `<div class="tbl-wrap"><table><thead><tr>${cols.map((c) => `<th class="${c.n ? "num" : ""}">${c.t}</th>`).join("")}</tr></thead><tbody>${linhas.map((l) => `<tr>${l.map((v, i) => `<td class="${cols[i].n ? "num" : ""}">${v}</td>`).join("")}</tr>`).join("")}</tbody>${totalRow ? `<tfoot><tr>${totalRow.map((v, i) => `<td class="${cols[i].n ? "num" : ""}">${v}</td>`).join("")}</tr></tfoot>` : ""}</table></div>`;
  }

  // =============== RELATÓRIOS ===============
  V.relatorios = {
    html(ctx) {
      const { id, r, params } = ctx, aba = params[0] || "";
      const abas = [["", "Posição"], ["movimentacoes", "Movimentações"], ["proventos", "Proventos"], ["informes", "Informes e IR"]];
      let corpo = "";
      const its = K.itens(id);
      if (!aba) {
        const tot = its.reduce((a, x) => a + x.valor, 0);
        corpo = `<section class="card"><div class="card-h"><div><h2>Posição consolidada</h2><div class="sub">Todas as contas · ${U.data(D.dataBase)}</div></div><button class="btn sm" data-csv="pos">⬇ Baixar CSV</button></div>
          ${tabela([{ t: "Investimento" }, { t: "Tipo" }, { t: "Onde está" }, { t: "Quantidade", n: 1 }, { t: "Valor", n: 1 }, { t: "% do total", n: 1 }],
            its.map((x) => [`<b>${U.esc(x.tipo === "rf" ? x.nome : x.cod)}</b><br><span class="small muted">${U.esc(x.tipo === "rf" ? "" : x.nome)}</span>`, x.tipo === "cripto" ? "ETF de Criptomoedas" : U.rotuloTipo(x.sub), x.tipo === "rf" ? x.instTxt : "B3 (custódia)", x.q !== undefined ? U.qtd(x.q) : "—", `<b>${U.brl(x.valor)}</b>`, U.num(x.pct, 1) + "%"]),
            ["Total", "", "", "", `<b>${U.brl(tot)}</b>`, "100%"])}</section>`;
      } else if (aba === "movimentacoes") {
        corpo = `<section class="card"><div class="card-h"><h2>Extrato de movimentações</h2><button class="btn sm" data-csv="mov">⬇ Baixar CSV</button></div>
          <div class="filters"><label>Período<select id="mPer"><option value="365">12 meses</option><option value="90">3 meses</option><option value="30">30 dias</option></select></label><label>Operação<select id="mOp"><option value="">Todas</option><option>Compra</option><option>Venda</option></select></label></div><div id="movT"></div></section>`;
      } else if (aba === "proventos") {
        corpo = `<section class="card"><div class="card-h"><h2>Proventos</h2><button class="btn sm" data-csv="prov">⬇ Baixar CSV</button></div>
          ${tabela([{ t: "Data" }, { t: "Ativo" }, { t: "Tipo" }, { t: "Status" }, { t: "Valor líquido", n: 1 }], r.prov.slice().reverse().map((p) => [U.data(p.data), V._linkAtivo(p.tk), U.rotuloProv(p.tp), p.recebido ? '<span class="chip ok">Pago</span>' : '<span class="chip warn">Anunciado</span>', `<b>${U.brl(p.valor)}</b>`]))}</section>`;
      } else if (aba === "informes") {
        corpo = `<div class="alert info-a"><span class="ic">ℹ️</span><div><b>O informe ajuda, mas não é a declaração completa.</b><p>Não inclui corretagem nem apuração de ganho de capital, inclusive nas vendas de ETFs de Criptomoedas.</p></div></div>
          <section class="card section">${[["Informe de rendimentos 2025", "Proventos e posição em 31/12/2025", "ir25", "Disponível"], ["Informe de rendimentos 2026", "Publicado a partir de fevereiro de 2027", null, "Em fev/2027"], ["Extrato de posição", "Todas as contas, na data-base", "pos", "Disponível"], ["Extrato de movimentações", "Últimos 12 meses", "mov", "Disponível"]].map(([t, s, k, st]) => `<div class="list-item"><span style="font-size:24px" aria-hidden="true">📄</span><div class="grow"><div class="t">${t}</div><div class="s">${s}</div></div><span class="chip ${k ? "ok" : ""}">${st}</span>${k ? `<button class="btn sm" data-csv="${k}">⬇ CSV</button>` : ""}</div>`).join("")}</section>`;
      }
      return `<div class="page-head"><div><h1>Relatórios</h1><p>Todos os números em tabela, para conferir e exportar</p></div></div>${V._sub("relatorios", aba, abas)}${corpo}`;
    },
    after(ctx) {
      const { id, r, params } = ctx, aba = params[0] || "";
      const csv = {
        pos: () => U.downloadCSV(`posicao_${D.dataBase}.csv`, [["Investimento", "Tipo", "Onde está", "Quantidade", "Valor"]].concat(K.itens(id).map((x) => [x.cod, x.sub, x.instTxt || x.inst || "B3", x.q ?? "", x.valor.toFixed(2)]))),
        mov: () => U.downloadCSV("movimentacoes.csv", [["Data", "Classe", "Ativo", "Operação", "Movimentação", "Quantidade", "Preço", "Valor"]].concat(r.inv.mov.map((m) => [m[0], m[1], m[2], m[3], U.rotuloMov(m[4]), m[5], m[6], m[7]]))),
        prov: () => U.downloadCSV("proventos.csv", [["Data", "Ativo", "Tipo", "Status", "Valor"]].concat(r.prov.map((p) => [p.data, p.tk, U.rotuloProv(p.tp), p.recebido ? "Pago" : "Anunciado", p.valor]))),
        ir25: () => U.downloadCSV("informe_2025.csv", [["Data", "Ativo", "Tipo", "Valor líquido"]].concat(r.prov.filter((p) => p.data < "2026-01-01" && p.recebido).map((p) => [p.data, p.tk, U.rotuloProv(p.tp), p.valor]))),
      };
      document.querySelectorAll("[data-csv]").forEach((b) => b.addEventListener("click", () => { csv[b.dataset.csv](); U.toast("Arquivo gerado"); }));
      if (aba === "movimentacoes") {
        const draw = () => {
          const lim = M.addDays(D.dataBase, -+document.getElementById("mPer").value), op = document.getElementById("mOp").value;
          const rows = r.inv.mov.filter((m) => m[0] >= lim && (!op || m[3] === op)).slice().reverse();
          document.getElementById("movT").innerHTML = rows.length ? tabela([{ t: "Data" }, { t: "Ativo" }, { t: "Movimentação" }, { t: "Operação" }, { t: "Quantidade", n: 1 }, { t: "Preço", n: 1 }, { t: "Valor", n: 1 }], rows.map((m) => [U.data(m[0]), V._linkAtivo(m[2]), U.rotuloMov(m[4]), m[3], U.qtd(m[5]), U.brl(m[6], true), `<b>${U.brl(m[7])}</b>`])) : '<div class="empty">Nada nesse período.</div>';
        };
        ["mPer", "mOp"].forEach((i) => document.getElementById(i).addEventListener("change", draw)); draw();
      }
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
