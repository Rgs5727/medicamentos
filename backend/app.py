from dotenv import load_dotenv
import os

load_dotenv()

from flask import Flask, redirect, url_for, session, request
from flask_cors import CORS

from blueprints.remedies import remedies_bp
from blueprints.categorias import categorias_bp
from blueprints.comentarios import comentarios_bp
from blueprints.usuarios import usuarios_bp
from blueprints.remedies.dao import RemedioDAO
from blueprints.categorias.dao import CategoriaDAO
from blueprints.usuarios.dao import UsuarioDAO
from blueprints.usuarios.models import UsuarioADM

from werkzeug.security import generate_password_hash

app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY") or "socorro"

# Libera o React (Vite, porta 5173) para chamar as rotas /api/* do Flask.
# Os dois endereços do mesmo computador: "localhost" e "127.0.0.1" são o
# mesmo lugar, mas para o navegador (CORS) são origens diferentes — sem os
# dois, abrir o site por http://127.0.0.1:5173 dava "Não foi possível falar
# com o servidor!" (o navegador bloqueava as respostas do Flask).
CORS(app, resources={r"/api/*": {"origins": ["http://localhost:5173", "http://127.0.0.1:5173"]}})


# A porta 5000 é só a API. Quem abrir uma PÁGINA aqui (ex.: 127.0.0.1:5000/remedios)
# é levado para a mesma página no site React, na porta 5173, com o mesmo nome de
# endereço (127.0.0.1 ou localhost), para o login guardado no navegador valer.
# Ficam na 5000: /api/... (dados) e /static/... (imagens dos remédios).
@app.before_request
def levar_para_o_react():
    if request.path.startswith("/api/") or request.path.startswith("/static/"):
        return None
    servidor = request.host.split(":")[0]
    destino = f"http://{servidor}:5173{request.full_path.rstrip('?')}"
    return redirect(destino)


@app.context_processor
def inject_user():
    tem_moderacao_pendente = False

    if session.get("adm"):
        remedio_dao = RemedioDAO()
        categoria_dao = CategoriaDAO()
        tem_moderacao_pendente = (
            remedio_dao.contar_remedios_pendentes() > 0
            or categoria_dao.contar_categorias_pendentes() > 0
        )

    return {
        "usuario_logado": session.get("usuario_email"),
        "usuario_nome": session.get("usuario_nome"),
        "tem_moderacao_pendente": tem_moderacao_pendente,
    }


app.register_blueprint(remedies_bp)
app.register_blueprint(categorias_bp)
app.register_blueprint(comentarios_bp)
app.register_blueprint(usuarios_bp)



def Padim():
    try:
        dao = UsuarioDAO()
        admin_email = os.getenv("ADMIN_EMAIL", "1@1").strip().lower()
        admin_pass = os.getenv("ADMIN_PASSWORD", "3")
        admin_name = os.getenv("ADMIN_NAME", "Administrador")

        if not dao.buscar_usuario_por_email(admin_email):
            senha_hash = generate_password_hash(admin_pass)
            admin = UsuarioADM(admin_email, senha_hash, admin_name, poder=True)
            dao.salvar_usuario(admin)
            print(f"Usuário administrador criado: {admin_email}")

    except Exception as e:
        print(f"Falha ao garantir usuário admin: {e}")
        


@app.route("/")
def index():
    return redirect(url_for("remedies.listar_remedios"))


with app.app_context():
    Padim()


if __name__ == "__main__":
    app.run(debug=True)
