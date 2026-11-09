from flask import render_template, request, redirect, url_for, flash, session

from . import categorias_bp

from .controllers import CategoriaController
from users import exigir_adm, exigir_login, login_required

controller = CategoriaController()

@categorias_bp.route('/categorias')
def listar_categorias():
    return controller.listar_categorias()

@categorias_bp.route('/cadastrarCategoria', methods=["GET", "POST"])
def cadastrar_categoria():
    exigencia = exigir_login()
    if exigencia:
        return exigencia

    if request.method == "POST":
        return controller.cadastrar_categoria()

    return controller.preparar_cadastro_categoria()


@categorias_bp.route('/editarCategoria/<int:id>', methods=["GET", "POST"])
def editar_categoria(id):
    exigencia = exigir_adm()
    if exigencia:
        return exigencia

    if request.method == "POST":
        return controller.editar_categoria(id)
    return controller.preparar_edicao_categoria(id)


@categorias_bp.route('/excluirCategoria/<int:id>', methods=["POST"])
def excluir_categoria(id):
    exigencia = exigir_adm()
    if exigencia:
        return exigencia
    return controller.remover_categoria(id)


# ============================================================================
# API JSON de categorias (usada pelo React)
#   GET    /api/categorias            -> público (aprovadas)
#   POST   /api/categorias            -> precisa de token (comum: pendente; adm: aprovada)
#   GET    /api/categorias/pendentes  -> precisa de token ("Minhas pendentes"; adm: todas)
#   GET    /api/categorias/<id>       -> público (pendente só para o dono/adm)
#   PUT    /api/categorias/<id>       -> precisa de token (dono ou adm)
#   DELETE /api/categorias/<id>       -> precisa de token (dono ou adm)
# ============================================================================

@categorias_bp.route("/api/categorias", methods=["GET"])
def api_categorias():
    return controller.listar_categorias_api()


@categorias_bp.route("/api/categorias", methods=["POST"])
@login_required
def api_cadastrar_categoria():
    return controller.cadastrar_categoria()


@categorias_bp.route("/api/categorias/pendentes", methods=["GET"])
@login_required
def api_categorias_pendentes():
    return controller.listar_pendentes_api()


@categorias_bp.route("/api/categorias/<int:id>", methods=["GET"])
def api_buscar_categoria(id):
    return controller.buscar_categoria_por_id(id)


@categorias_bp.route("/api/categorias/<int:id>", methods=["PUT"])
@login_required
def api_editar_categoria(id):
    return controller.editar_categoria(id)


@categorias_bp.route("/api/categorias/<int:id>", methods=["DELETE"])
@login_required
def api_excluir_categoria(id):
    return controller.remover_categoria(id)
