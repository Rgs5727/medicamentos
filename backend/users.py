from functools import wraps
from flask import session, flash, redirect, url_for, render_template, request, jsonify, g

# Observação: conferir_token é importado DENTRO de _pegar_payload_do_token()
# (mais abaixo), e não aqui no topo do arquivo. Se importássemos aqui, o
# Python precisaria carregar todo o pacote blueprints.usuarios primeiro —
# e esse pacote importa suas rotas/controllers, que por sua vez importam
# `from users import exigir_adm` daqui de dentro deste mesmo arquivo,
# gerando um import circular (o Python tentaria carregar users.py de novo
# antes dele terminar de carregar da primeira vez). Adiando o import para
# dentro da função evita esse problema, sem mudar em nada o comportamento.


# ============================================================================
# DECORADORES DA API (@login_required e @admin_required) — Aluno 1
# ============================================================================
# Estes dois decoradores são a "porta de entrada" de qualquer rota da API
# que exige login. Eles ficam escritos em cima da rota, assim:
#
#   @medicamentos_bp.route("/api/v1/medicamentos", methods=["POST"])
#   @login_required
#   def criar_medicamento():
#       ...
#
# e rodam ANTES da função da rota. Se o token não vier, ou vier errado, o
# decorador já responde 401/403 sozinho e a função da rota nunca chega a
# executar.
#
# Note que exigir_login()/exigir_adm() (logo abaixo) continuam do jeito que
# estavam — eles usam `session` (cookie) e servem para as páginas antigas,
# renderizadas pelo Jinja, que ainda não foram convertidas para a API JSON.
# @login_required/@admin_required são o caminho novo, baseado em TOKEN, para
# as rotas /api/v1/....
# ============================================================================

def _pegar_payload_do_token():
    """
    Lê o cabeçalho HTTP "Authorization" do pedido que chegou e confere o
    token que vem dentro dele.

    O JavaScript do navegador manda esse cabeçalho no formato:
        Authorization: Bearer eyJhbGciOi...
    (a palavra "Bearer", um espaço, e depois o token).

    Esta função:
      1. Pega o texto do cabeçalho Authorization.
      2. Confere se ele começa com "Bearer ". Se não vier nada, ou vier em
         outro formato, não tem token válido para conferir -> None.
      3. Separa só a parte do token (depois do "Bearer ") e manda ela para
         conferir_token(), do arquivo token_utils.py, que confirma a
         assinatura e a validade.
    Devolve o payload (dict com sub/nome/adm) se estiver tudo certo, ou
    None se não tiver token, o token for inválido ou já tiver expirado.
    """
    from blueprints.usuarios.token_utils import conferir_token  # import adiado, ver nota no topo do arquivo

    cabecalho_auth = request.headers.get("Authorization", "")
    if not cabecalho_auth.startswith("Bearer "):
        return None
    token = cabecalho_auth[len("Bearer "):].strip()
    if not token:
        return None
    return conferir_token(token)


def login_required(funcao_da_rota):
    """
    Decorador para rotas da API que exigem estar logado (qualquer tipo de
    usuário, comum ou administrador).

    Passo a passo do que ele faz a cada pedido:
      1. Chama _pegar_payload_do_token() para achar e conferir o token que
         veio no cabeçalho Authorization do pedido.
      2. Se não veio token, ou o token é inválido/expirado -> devolve
         { "erro": "..." } com o código 401 e PARA por aqui. A rota
         original de baixo nunca roda.
      3. Se o token é válido -> guarda o payload em `g.usuario_token`.
         `g` é um espaço de armazenamento do Flask que dura só durante
         aquele pedido; assim a função da rota consegue ler
         `g.usuario_token["sub"]` (o e-mail de quem está logado) sem
         precisar decodificar o token de novo.
      4. Deixa a função da rota original rodar normalmente.
    """
    @wraps(funcao_da_rota)
    def rota_protegida(*args, **kwargs):
        payload = _pegar_payload_do_token()
        if payload is None:
            return jsonify({"erro": "É necessário estar logado."}), 401
        g.usuario_token = payload
        return funcao_da_rota(*args, **kwargs)
    return rota_protegida


def admin_required(funcao_da_rota):
    """
    Decorador para rotas da API que exigem estar logado E ser
    administrador (ex: aprovar conteúdo, listar todos os usuários).

    Faz a mesma conferência de token do login_required, e depois olha o
    campo "adm" que está escrito dentro do payload do token:
      - sem token válido           -> 401 (não está logado)
      - com token válido, mas
        "adm" é False              -> 403 (está logado, mas não pode)
      - com token válido e "adm"
        é True                     -> deixa a rota rodar
    Essa é exatamente a diferença entre 401 e 403 pedida na especificação
    (item 3.2): 401 é "faltou token", 403 é "tem token, mas não tem
    permissão".
    """
    @wraps(funcao_da_rota)
    def rota_protegida(*args, **kwargs):
        payload = _pegar_payload_do_token()
        if payload is None:
            return jsonify({"erro": "É necessário estar logado."}), 401
        if not payload.get("adm"):
            return jsonify({"erro": "Apenas administradores podem acessar."}), 403
        g.usuario_token = payload
        return funcao_da_rota(*args, **kwargs)
    return rota_protegida


def usuario_do_token_opcional():
    """
    Para rotas PÚBLICAS que querem saber, se der, quem está pedindo.

    Exemplo: GET /api/medicamentos é aberto a todos, mas se a pessoa
    estiver logada queremos marcar quais remédios são favoritos dela.
    Diferente do @login_required, aqui NÃO existe 401: sem token (ou com
    token inválido) devolve None e a rota segue normalmente.
    """
    if hasattr(g, "usuario_token"):
        return g.usuario_token
    return _pegar_payload_do_token()


def exigir_login():
    if not session.get("usuario_email"):
        flash("Acesso negado! Você precisa estar logado.", "danger")
        session.clear()
        return render_template("error403.html")
    return None


def exigir_adm():
    if not session.get("usuario_email"):
        flash("Acesso negado! Você precisa estar logado.", "danger")
        session.clear()
        return render_template("error403.html")

    if not session.get("adm"):
        flash("Apenas administradores podem acessar.", "danger")
        session.clear()
        return render_template("error403.html")

    return None
