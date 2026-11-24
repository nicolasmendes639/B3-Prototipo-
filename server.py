"""Servidor local da Área do Investidor v2.

- Serve os arquivos estáticos do protótipo.
- POST /api/chat  -> assistente de IA (Claude) com o contexto da tela e da carteira.
- GET  /api/status -> informa se a IA real está disponível.

IA real (opcional):
    pip install anthropic            # requer Python 3.10+
    export ANTHROPIC_API_KEY=...     # ou `ant auth login`
    python3 server.py 8766

Sem SDK ou sem credencial, /api/chat responde 503 e o front usa o assistente local (modo demonstração).
A chave NUNCA vai para o navegador: só este servidor fala com a API.
"""
import json
import os
import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

ROOT = os.path.dirname(os.path.abspath(__file__))
MODEL = os.environ.get("B3I_MODEL", "claude-opus-5-5")

try:
    import anthropic  # SDK oficial
    _client = anthropic.Anthropic()  # resolve ANTHROPIC_API_KEY / perfil do `ant auth login`
except Exception as e:  # SDK ausente ou sem credencial
    anthropic = None
    _client = None
    _motivo = str(e)
else:
    _motivo = ""

SYSTEM = """Você é a assistente virtual da Área do Investidor da B3 (protótipo de teste com dados fictícios).
Fale em português do Brasil, de forma simples, curta (até ~120 palavras) e acolhedora, como para alguém leigo.
Você recebe, a cada mensagem, um bloco <contexto> com a tela que a pessoa está vendo e um resumo da carteira dela.
Use esse contexto para responder sobre os números dela. Nunca invente valores que não estejam no contexto.
Você pode guiar a pessoa pelo site. Quando fizer sentido, termine a resposta com UMA ação, numa linha própria, no formato:
[[ir:ROTA]] para abrir uma aba (rotas: inicio, carteira, proventos, mercado, aprender, relatorios, perfil, conta, ativo/CODIGO)
[[tour:ID]] para iniciar um tour guiado (ids: primeiros-passos, patrimonio, ativo, proventos, feed, acompanhamento, conexoes, documentos)
[[video:ID]] para abrir uma videoaula (ids: acao, rendafixa, dividendos, diversificar, juros, cripto, b3, risco)
Regras: não recomende comprar ou vender ativos específicos, não faça previsões de preço, não peça senhas ou dados pessoais.
Se perguntarem algo fora de investimentos/site, redirecione com gentileza."""


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=ROOT, **kw)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def _json(self, code, payload):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if self.path.startswith("/api/status"):
            return self._json(200, {"ia": _client is not None, "modelo": MODEL if _client else None, "motivo": _motivo})
        return super().do_GET()

    def do_POST(self):
        if not self.path.startswith("/api/chat"):
            return self._json(404, {"erro": "rota inexistente"})
        if _client is None:
            return self._json(503, {"erro": "IA indisponível neste servidor", "motivo": _motivo})
        try:
            n = int(self.headers.get("Content-Length", "0"))
            dados = json.loads(self.rfile.read(n) or b"{}")
            historico = [m for m in dados.get("mensagens", []) if m.get("role") in ("user", "assistant") and isinstance(m.get("content"), str)][-20:]
            if not historico or historico[-1]["role"] != "user":
                return self._json(400, {"erro": "a última mensagem deve ser do usuário"})
            contexto = json.dumps(dados.get("contexto", {}), ensure_ascii=False)[:8000]
            historico[-1] = {"role": "user", "content": f"<contexto>{contexto}</contexto>\n\n{historico[-1]['content']}"}
            resp = _client.beta.messages.create(
                model=MODEL,
                max_tokens=16000,
                system=SYSTEM,
                messages=historico,
                output_config={"effort": "low"},  # chat curto: esforço baixo
                betas=["server-side-fallback-2026-07-01"],
                extra_body={"fallbacks": "default"},  # se o modelo recusar, a API tenta outro modelo
            )
            if resp.stop_reason == "refusal":
                return self._json(200, {"texto": "Não consigo ajudar com isso por aqui. Posso explicar algo da sua carteira ou do site?"})
            texto = "".join(b.text for b in resp.content if b.type == "text").strip()
            return self._json(200, {"texto": texto or "Desculpe, não consegui responder agora.", "modelo": resp.model})
        except anthropic.RateLimitError:
            return self._json(429, {"erro": "Muitas perguntas seguidas. Tente de novo em instantes."})
        except anthropic.APIStatusError as e:
            return self._json(502, {"erro": f"Erro da API ({e.status_code})"})
        except anthropic.APIConnectionError:
            return self._json(502, {"erro": "Sem conexão com a API"})
        except (ValueError, KeyError) as e:
            return self._json(400, {"erro": f"Requisição inválida: {e}"})

    def log_message(self, fmt, *args):
        if "/api/" in (args[0] if args else ""):
            sys.stderr.write("%s\n" % (fmt % args))


if __name__ == "__main__":
    porta = int(sys.argv[1]) if len(sys.argv) > 1 else 8766
    print(f"Área do Investidor v2 em http://localhost:{porta}  ·  IA real: {'sim (' + MODEL + ')' if _client else 'não — modo demonstração'}")
    ThreadingHTTPServer(("127.0.0.1", porta), Handler).serve_forever()
