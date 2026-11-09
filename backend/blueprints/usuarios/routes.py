from flask import request
from . import usuarios_bp
from .controllers import UsuarioController
from users import exigir_login, login_required, admin_required

controller = UsuarioController()


@usuarios_bp.route("/login", methods=["GET"])
def login():
    # Só GET agora: a página chega vazia (sem dado de banco nenhum) e
    # quem faz o login de verdade é a API (POST /api/v1/auth/login),
    # chamada pelo JavaScript. Não existe mais um POST aqui.
    return controller.preparar_login()


@usuarios_bp.route("/register", methods=["GET"])
def register():
    # Mesma ideia: só GET. Quem cadastra é POST /api/v1/auth/registro.
    return controller.preparar_cadastro_usuario()


@usuarios_bp.route("/editar_usuario", methods=["GET", "POST"])
def editar_usuario():
    return controller.editar_usuario()


@usuarios_bp.route("/usuario_detalhe")
def usuario_detalhe():
    return controller.usuario_detalhe()


@usuarios_bp.route("/logout")
def logout():
    return controller.logout()


@usuarios_bp.route("/remedios/<int:id>/favoritar", methods=["POST"])
def favoritar(id):
    return controller.favoritar(id)


@usuarios_bp.route("/esqueci-senha", methods=["GET", "POST"])
def esqueci_senha():
    if request.method == "POST":
        return controller.solicitar_reset()
    return controller.preparar_esqueci_senha()


@usuarios_bp.route("/redefinir-senha/<token>", methods=["GET", "POST"])
def redefinir_senha(token):
    if request.method == "POST":
        return controller.redefinir_senha(token)
    return controller.preparar_redefinir_senha(token)

# ===========================
# ADM
# ===========================

@usuarios_bp.route('/menu')
def menu():
    return controller.menu()


@usuarios_bp.route('/usuarios')
def usuarios():
    return controller.usuarios()


@usuarios_bp.route('/usuarios/promover', methods=['POST'])
def promover():
    return controller.promover_usuario()


@usuarios_bp.route('/usuarios/rebaixar', methods=['POST'])
def rebaixar():
    return controller.rebaixar_usuario()


@usuarios_bp.route('/moderacao')
def moderacao():
    return controller.moderacao()



@usuarios_bp.route('/moderacao/medicamentos/aprovar', methods=['POST'])
def aprovar_remedio():
    return controller.aprovar_remedio()


@usuarios_bp.route('/moderacao/medicamentos/rejeitar', methods=['POST'])
def rejeitar_remedio():
    return controller.rejeitar_remedio()


@usuarios_bp.route('/moderacao/categorias/aprovar', methods=['POST'])
def aprovar_categoria():
    return controller.aprovar_categoria()


@usuarios_bp.route('/moderacao/categorias/rejeitar', methods=['POST'])
def rejeitar_categoria():
    return controller.rejeitar_categoria()


# ============================================================================
# API JSON (3º bimestre) — Aluno 1
# Estas são as rotas que o JavaScript chama com fetch. Cada uma devolve
# jsonify(...) e o código HTTP certo, nunca HTML.
# ============================================================================

@usuarios_bp.route('/api/v1/auth/registro', methods=['POST'])
def api_registro():
    return controller.api_registro()


@usuarios_bp.route('/api/v1/auth/login', methods=['POST'])
def api_login():
    return controller.api_login()


@usuarios_bp.route('/api/v1/auth/logout', methods=['POST'])
@login_required  # precisa mandar o token no cabeçalho Authorization
def api_logout():
    return controller.api_logout()


@usuarios_bp.route('/api/v1/auth/me', methods=['GET'])
@login_required  # precisa mandar o token no cabeçalho Authorization
def api_me():
    return controller.api_me()


@usuarios_bp.route('/api/v1/usuarios', methods=['GET'])
@admin_required  # só administrador; 401 sem token, 403 se não for admin
def api_listar_usuarios():
    return controller.api_listar_usuarios()


@usuarios_bp.route('/api/v1/usuarios/<id>', methods=['PUT'])
@admin_required  # só administrador; 401 sem token, 403 se não for admin
def api_editar_usuario(id):
    return controller.api_editar_usuario(id)


@usuarios_bp.route('/api/v1/auth/perfil', methods=['PUT'])
@login_required  # editar o próprio perfil (nome e senha)
def api_editar_perfil():
    return controller.api_editar_perfil()


@usuarios_bp.route('/api/v1/auth/esqueci-senha', methods=['POST'])
def api_esqueci_senha():
    return controller.api_esqueci_senha()


@usuarios_bp.route('/api/v1/auth/redefinir-senha/<token>', methods=['GET'])
def api_conferir_token_reset(token):
    return controller.api_conferir_token_reset(token)


@usuarios_bp.route('/api/v1/auth/redefinir-senha/<token>', methods=['POST'])
def api_redefinir_senha(token):
    return controller.api_redefinir_senha(token)


@usuarios_bp.route('/api/favoritos', methods=['GET'])
@login_required  # lista os favoritos de quem está logado
def api_listar_favoritos():
    return controller.api_listar_favoritos()


@usuarios_bp.route('/api/favoritos/<int:id>', methods=['POST'])
@login_required  # coloca/tira dos favoritos
def api_alternar_favorito(id):
    return controller.api_alternar_favorito(id)


@usuarios_bp.route('/api/v1/moderacao', methods=['GET'])
@admin_required  # pendentes (remédios e categorias) para a página /moderacao
def api_moderacao():
    return controller.api_moderacao()


@usuarios_bp.route('/api/v1/moderacao/medicamentos/aprovar', methods=['POST'])
@admin_required
def api_aprovar_remedio():
    return controller.api_aprovar_remedio()


@usuarios_bp.route('/api/v1/moderacao/medicamentos/rejeitar', methods=['POST'])
@admin_required
def api_rejeitar_remedio():
    return controller.api_rejeitar_remedio()


@usuarios_bp.route('/api/v1/moderacao/categorias/aprovar', methods=['POST'])
@admin_required  # só administrador; 401 sem token, 403 se não for admin
def api_aprovar_categoria():
    return controller.api_aprovar_categoria()


@usuarios_bp.route('/api/v1/moderacao/categorias/rejeitar', methods=['POST'])
@admin_required  # só administrador; 401 sem token, 403 se não for admin
def api_rejeitar_categoria():
    return controller.api_rejeitar_categoria()
