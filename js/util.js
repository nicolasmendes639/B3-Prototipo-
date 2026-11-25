/* Utilitários de formatação, estado e DOM. */
window.U = (function () {
  const nfBRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
  const nf2 = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const nf0 = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });
  const MESES = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

  const state = {
    get hide() { return store.get("hide", false); },
    set hide(v) { store.set("hide", v); },
  };

  const store = {
    get(k, def) { try { const v = localStorage.getItem("b3i:" + k); return v === null ? def : JSON.parse(v); } catch (e) { return def; } },
    set(k, v) { try { localStorage.setItem("b3i:" + k, JSON.stringify(v)); } catch (e) { /* armazenamento indisponível */ } },
  };

  const MASK = "R$ ••••••";
  const brl = (v, force) => (state.hide && !force ? MASK : nfBRL.format(v || 0));
  const num = (v, d = 2) => (v === null || v === undefined || isNaN(v) ? "—" : d === 0 ? nf0.format(v) : new Intl.NumberFormat("pt-BR", { minimumFractionDigits: d, maximumFractionDigits: d }).format(v));
  // Valor abreviado: 2.021.435 -> "2,02 mi"; 123.456 -> "123 mil"; abaixo de mil mantém o número.
  const compacto = (v) => {
    const a = Math.abs(v || 0), sg = v < 0 ? "-" : "";
    if (a >= 999500) return sg + new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(a / 1e6) + " mi";
    if (a >= 1e3) return sg + nf0.format(a / 1e3) + " mil";
    return sg + nf0.format(a);
  };
  const qtd = (v) => (state.hide ? "•••" : Number.isInteger(v) ? nf0.format(v) : num(v, 2));
  const pct = (v, d = 2) => (v === null || v === undefined || isNaN(v) ? "—" : nf2.format(+v.toFixed(d)).replace(/,00$/, ",00") + "%");
  const sinal = (v, d = 2) => {
    if (v === null || v === undefined || isNaN(v)) return '<span class="muted">—</span>';
    const cls = v > 0.0001 ? "pos" : v < -0.0001 ? "neg" : "neu";
    const ic = v > 0.0001 ? "▲" : v < -0.0001 ? "▼" : "■";
    return `<span class="${cls}"><span aria-hidden="true">${ic}</span> ${v > 0 ? "+" : ""}${num(v, d)}%</span>`;
  };
  const data = (s) => { if (!s) return "—"; const [y, m, d] = s.slice(0, 10).split("-"); return `${d}/${m}/${y}`; };
  const dataCurta = (s) => { const [, m, d] = s.split("-"); return `${d} ${MESES[+m - 1]}`; };
  const mesAno = (s) => { const [y, m] = s.split("-"); return `${MESES[+m - 1]}/${y.slice(2)}`; };
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const slug = (s) => encodeURIComponent(s);

  const normaliza = (s) => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const rotuloClasse = (c) => ({ "Renda variavel": "Renda variável", "Renda fixa": "Renda fixa", "Tesouro Direto": "Tesouro Direto", Fundos: "Fundos" }[c] || c);
  const rotuloTipo = (t) => ({ Acoes: "Ações", FII: "FIIs", ETF: "ETFs", "Titulo publico": "Título público", CDB: "CDB", LCA: "LCA", LCI: "LCI", Debenture: "Debênture", "Fundo de investimento": "Fundo de investimento" }[t] || t);
  const rotuloMov = (m) => ({ Negociacao: "Negociação", Aplicacao: "Aplicação", Resgate: "Resgate" }[m] || m);
  const rotuloProv = (p) => ({ "Juros sobre capital proprio": "JCP", Dividendo: "Dividendo", Rendimento: "Rendimento" }[p] || p);

  function downloadCSV(nome, linhas) {
    const csv = "﻿" + linhas.map((l) => l.map((c) => { const s = String(c ?? ""); return /[;"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; }).join(";")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    a.download = nome; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  function toast(msg) {
    const t = document.getElementById("toast"); if (!t) return;
    t.textContent = msg; t.classList.add("show");
    clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove("show"), 2600);
  }

  // Botão "i" que abre explicação de metodologia/origem do dado
  const info = (texto, rotulo = "Como calculamos") => `<button class="info" type="button" data-info="${esc(texto)}" aria-label="${esc(rotulo)}: ${esc(texto)}">i</button>`;

  return { state, store, brl, compacto, num, qtd, pct, sinal, data, dataCurta, mesAno, esc, slug, normaliza, rotuloClasse, rotuloTipo, rotuloMov, rotuloProv, downloadCSV, toast, info, MESES };
})();
