from . import comentarios_bp
from .controllers import ComentarioController
from users import login_required

controller = ComentarioController()

@comentarios_bp.route("/comentario/<int:remedio_id>/comentarios", methods=["POST"])
def adicionar_comentario(remedio_id):
    return controller.adicionar_comentario(remedio_id)


@comentarios_bp.route("/comentario/editar/<int:id>", methods=["GET", "POST"])
def editar_comentario(id):
    return controller.editar_comentario(id)


@comentarios_bp.route("/comentario/excluir/<int:id>", methods=["POST"])
def excluir_comentario(id):
    return controller.excluir_comentario(id)


# ============================================================================
# API JSON de comentários (usada pelo React)
#   GET    /api/medicamentos/<id>/comentarios -> público (lista do remédio)
#   POST   /api/medicamentos/<id>/comentarios -> precisa de token
#   GET    /api/comentarios/<id>              -> precisa de token (dono/adm)
#   PUT    /api/comentarios/<id>              -> precisa de token (dono/adm)
#   DELETE /api/comentarios/<id>              -> precisa de token (dono/adm)
# ============================================================================

@comentarios_bp.route("/api/medicamentos/<int:remedio_id>/comentarios", methods=["GET"])
def api_listar_comentarios(remedio_id):
    return controller.api_listar_comentarios(remedio_id)


@comentarios_bp.route("/api/medicamentos/<int:remedio_id>/comentarios", methods=["POST"])
@login_required
def api_adicionar_comentario(remedio_id):
    return controller.api_adicionar_comentario(remedio_id)


@comentarios_bp.route("/api/comentarios/<int:id>", methods=["GET"])
@login_required
def api_buscar_comentario(id):
    return controller.api_buscar_comentario(id)


@comentarios_bp.route("/api/comentarios/<int:id>", methods=["PUT"])
@login_required
def api_editar_comentario(id):
    return controller.api_editar_comentario(id)


@comentarios_bp.route("/api/comentarios/<int:id>", methods=["DELETE"])
@login_required
def api_excluir_comentario(id):
    return controller.api_excluir_comentario(id)
