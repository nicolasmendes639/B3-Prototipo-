"""Converte dados/Amostra_B3i.xlsx em js/data.js (sem dependências externas).

Uso:  python3 scripts/build_data.py
"""
import json
import os
import re
import zipfile
import xml.etree.ElementTree as ET
from datetime import date, timedelta

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
XLSX = os.path.join(ROOT, "dados", "Amostra_B3i.xlsx")
OUT = os.path.join(ROOT, "js", "data.js")
NS = {"m": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
T = "{%s}t" % NS["m"]


def excel_date(v):
    return (date(1899, 12, 30) + timedelta(days=int(float(v)))).isoformat()


def col_index(ref):
    n = 0
    for ch in re.match(r"[A-Z]+", ref).group():
        n = n * 26 + ord(ch) - 64
    return n - 1


def read_workbook(path):
    z = zipfile.ZipFile(path)
    shared = []
    if "xl/sharedStrings.xml" in z.namelist():
        root = ET.fromstring(z.read("xl/sharedStrings.xml"))
        shared = ["".join(t.text or "" for t in si.iter(T)) for si in root.findall("m:si", NS)]
    wb = ET.fromstring(z.read("xl/workbook.xml"))
    rels = ET.fromstring(z.read("xl/_rels/workbook.xml.rels"))
    target = {r.get("Id"): r.get("Target") for r in rels}
    sheets = {}
    for s in wb.find("m:sheets", NS):
        rid = s.get("{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id")
        root = ET.fromstring(z.read("xl/" + target[rid].lstrip("/").replace("xl/", "")))
        rows = []
        for r in root.iter("{%s}row" % NS["m"]):
            cells = {}
            for c in r.findall("m:c", NS):
                v, t = c.find("m:v", NS), c.get("t")
                if t == "inlineStr":
                    val = "".join(x.text or "" for x in c.iter(T))
                elif v is None:
                    val = ""
                elif t == "s":
                    val = shared[int(v.text)]
                else:
                    val = v.text
                cells[col_index(c.get("r"))] = val
            if cells:
                rows.append([cells.get(i, "") for i in range(max(cells) + 1)])
        header, body = rows[0], rows[1:]
        sheets[s.get("name")] = [dict(zip(header, r)) for r in body]
    return sheets


def num(v, nd=2):
    return round(float(v), nd)


def main():
    s = read_workbook(XLSX)
    inv = {}
    for r in s["INVESTIDORES"]:
        inv[r["ID_INVESTIDOR"]] = {
            "id": r["ID_INVESTIDOR"],
            "perfilCarteira": r["PERFIL_CARTEIRA"],
            "faixa": r["FAIXA_PATRIMONIO"],
            "classes": [], "ativos": [], "mov": [], "prov": [], "evol": [],
        }
    data_base = None
    for r in s["POSICAO_CLASSE"]:
        data_base = excel_date(r["DATA_BASE"])
        inv[r["ID_INVESTIDOR"]]["classes"].append(
            [r["INSTITUICAO"].replace("Instituicao", "Instituição"), r["CLASSE"], r["TIPO_PRODUTO"],
             int(float(r["QTD_ATIVOS"])), num(r["VALOR"])])
    for r in s["POSICAO_ATIVO"]:
        inv[r["ID_INVESTIDOR"]]["ativos"].append(
            [r["ATIVO"], r["CLASSE"], r["TIPO_PRODUTO"], num(r["QUANTIDADE"], 4), num(r["PRECO"]), num(r["VALOR"])])
    for r in s["MOVIMENTACOES"]:
        inv[r["ID_INVESTIDOR"]]["mov"].append(
            [excel_date(r["DATA"]), r["CLASSE"], r["ATIVO"], r["OPERACAO"], r["MOVIMENTACAO"],
             num(r["QUANTIDADE"], 4), num(r["PRECO"]), num(r["VALOR"])])
    for r in s["PROVENTOS"]:
        inv[r["ID_INVESTIDOR"]]["prov"].append(
            [excel_date(r["DATA"]), r["CLASSE"], r["TIPO_PRODUTO"], r["ATIVO"], r["TIPO_PROVENTO"],
             num(r["VALOR_LIQUIDO"]), r["RECEBIDO"] == "Sim"])
    for r in s["EVOLUCAO_PATRIMONIAL"]:
        inv[r["ID_INVESTIDOR"]]["evol"].append([excel_date(r["DATA"]), num(r["PATRIMONIO"])])
    for v in inv.values():
        for k in ("mov", "prov", "evol"):
            v[k].sort(key=lambda x: x[0])

    payload = {"dataBase": data_base, "fonte": "Amostra_B3i.xlsx (dados anonimizados e fictícios)",
               "investidores": inv}
    with open(OUT, "w", encoding="utf-8") as f:
        f.write("/* Gerado por scripts/build_data.py — não editar à mão. */\n")
        f.write("window.B3DATA = ")
        json.dump(payload, f, ensure_ascii=False, separators=(",", ":"))
        f.write(";\n")
    print(f"{OUT}: {len(inv)} investidores, data-base {data_base}, {os.path.getsize(OUT)//1024} KB")


if __name__ == "__main__":
    main()
