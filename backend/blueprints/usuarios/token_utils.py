# ============================================================================
# TOKEN DE AUTENTICAÇÃO — o que é, pra que serve e por onde ele viaja
# ============================================================================
#
# O HTTP não tem memória: cada requisição que chega no Flask é tratada como
# se fosse a primeira, o servidor não sabe sozinho "quem" está do outro lado.
# No 2º bimestre isso era resolvido com a `session` do Flask (um cookie).
#
# Agora o front-end fala com o back-end por fetch/JSON (uma API de verdade),
# então quem prova que a pessoa está logada é o TOKEN, não mais um cookie de
# sessão. O token é uma string comprida (formato JWT) que funciona como uma
# carteirinha assinada: dentro dela está escrito QUEM é o usuário (e-mail,
# nome, se é administrador) e ATÉ QUANDO essa carteirinha vale.
#
# --- O caminho completo do token, do login até uma rota protegida --------
#
#   1) POST /api/v1/auth/login chega com e-mail e senha no corpo (JSON).
#   2) Se a senha bate, o controller chama gerar_token(usuario) (função
#      abaixo). O token PRONTO é colocado dentro do JSON de resposta:
#         { "token": "eyJhbGciOi...", "usuario": {...} }
#      -> é aqui, na resposta HTTP do login, que o token nasce e sai do
#         servidor pela primeira vez.
#   3) O JavaScript do navegador recebe essa resposta e GUARDA o token
#      (isso acontece em static/js/api.js, com localStorage.setItem).
#   4) Em qualquer pedido seguinte que precise de login (ex: GET
#      /api/v1/auth/me, GET /api/v1/usuarios, PUT /api/v1/usuarios/<id>),
#      o JavaScript reenvia esse mesmo token dentro do cabeçalho HTTP
#      "Authorization", assim: Authorization: Bearer eyJhbGciOi...
#      -> é aqui que o token viaja de volta, do navegador para o servidor.
#   5) O Flask lê esse cabeçalho e chama conferir_token(token) (função
#      abaixo) para checar se ele é válido e descobrir quem é o dono, sem
#      precisar de sessão nenhuma. Quem faz essa leitura automaticamente
#      são os decoradores @login_required e @admin_required, definidos em
#      users.py — eles ficam "na frente" da rota e só deixam ela rodar se
#      o token passar nessa conferência.
#
# O token NUNCA é guardado no banco de dados nem em sessão no servidor.
# Ele é auto-suficiente: tudo que o servidor precisa saber sobre quem está
# logado já está escrito (e assinado) dentro do próprio token.
# ============================================================================

import jwt
from datetime import datetime, timedelta, timezone
from flask import current_app

# Quanto tempo um token vale depois de criado. Passado esse tempo, o token
# some sozinho (conferir_token começa a recusar ele), mesmo que a assinatura
# continue correta. Isso é o "exp" (expiration) que vai dentro do token.
#
# 30 minutos (decisão do plano do site). O React recebe o horário exato em
# que o token vence (campo "expira_em" do login e do /auth/me), mostra um
# aviso quando faltam 5 minutos e, quando chega a hora, desloga a pessoa e
# abre a página "Sessão expirada".
VALIDADE_DO_TOKEN = timedelta(minutes=30)


def _chave_secreta():
    """
    Devolve a chave usada para ASSINAR e CONFERIR o token.

    É a mesma SECRET_KEY que o Flask já usa (definida no .env e carregada
    em app.py com `app.secret_key = os.getenv("SECRET_KEY")`). Usar essa
    chave é o que impede qualquer pessoa de inventar um token na mão: só
    quem conhece essa chave consegue gerar uma assinatura que o servidor
    aceite como válida.
    """
    return current_app.config["SECRET_KEY"]


def gerar_token(usuario):
    """
    Cria (assina) o token de um usuário que acabou de logar ou se cadastrar.

    Dentro do token vai um pequeno dicionário, chamado de "payload":
      - sub  -> o e-mail do usuário. É o identificador de quem é o dono
                do token (igual um "de quem é essa carteirinha").
      - nome -> só para o front-end poder mostrar "Olá, Fulano" sem
                precisar fazer outra chamada.
      - adm  -> True ou False, se esse usuário é administrador. É esse
                campo que o front-end vê ao chamar GET /api/v1/auth/me
                (mas SEMPRE através da rota, nunca lendo o token direto
                no navegador — é para isso que a rota /auth/me existe).
      - iat  -> "issued at", quando o token foi criado.
      - exp  -> "expiration", até quando o token vale. Depois desse
                horário, conferir_token() abaixo passa a recusar o token.

    jwt.encode(...) pega esse dicionário, transforma em texto e ASSINA
    esse texto com a chave secreta. O resultado é a string que devolvemos
    dentro do JSON de resposta do login/registro — é ela que o navegador
    vai guardar e reenviar depois.
    """
    agora = datetime.now(timezone.utc)
    payload = {
        "sub": usuario.email,
        "nome": usuario.nome,
        "adm": usuario.tipo() == "adm",
        "iat": agora,
        "exp": agora + VALIDADE_DO_TOKEN,
    }
    token = jwt.encode(payload, _chave_secreta(), algorithm="HS256")
    return token


def expira_em_iso(payload):
    """
    Transforma o "exp" do payload em texto de data/hora no formato ISO
    (ex: "2026-11-07T23:30:00+00:00", sempre em UTC).

    Dentro do token o "exp" fica guardado como um número (segundos desde
    1970). Mandamos esse horário para o front-end no campo "expira_em" do
    JSON, para o React saber QUANDO o token vence sem precisar abrir o
    token no navegador — quem informa a validade é sempre o servidor.
    """
    return datetime.fromtimestamp(payload["exp"], tz=timezone.utc).isoformat()


def segundos_para_expirar(payload):
    """
    Quantos segundos faltam para o token vencer, contados pelo relógio do
    SERVIDOR. O React usa este número (e não o horário de expira_em) para o
    aviso de 5 minutos e para deslogar: assim, mesmo que o relógio do
    computador de quem usa o site esteja adiantado ou atrasado, a contagem
    continua certa.
    """
    return max(0, int(payload["exp"] - datetime.now(timezone.utc).timestamp()))


def conferir_token(token):
    """
    Confere se um token é válido e devolve o que está escrito dentro dele.

    jwt.decode(...) faz duas verificações antes de devolver qualquer coisa:
      1) Confere a ASSINATURA usando a mesma chave secreta que criou o
         token. Se alguém trocar uma letra do token, ou tentar montar um
         token na unha, a assinatura não bate e o decode falha.
      2) Confere o campo "exp" (validade). Se o token já expirou, o
         decode também falha, mesmo com a assinatura certa.

    Se passar nas duas conferências, devolve o payload (dict com sub,
    nome e adm) — é esse retorno que os decoradores em users.py usam
    para saber quem está fazendo o pedido.

    Se qualquer coisa der errado (token ausente, alterado, expirado ou
    mal formado), devolve None. Quem chama essa função entende None
    como "não está logado" e responde 401 para quem pediu.
    """
    try:
        payload = jwt.decode(token, _chave_secreta(), algorithms=["HS256"])
        return payload
    except jwt.ExpiredSignatureError:
        # O token era válido, mas o prazo (exp) já passou.
        return None
    except jwt.InvalidTokenError:
        # Assinatura não bate, token corrompido, mal formado, etc.
        return None
