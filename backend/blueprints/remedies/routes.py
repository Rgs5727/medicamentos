from flask import render_template, request, redirect, url_for
from . import remedies_bp
from .controllers import RemedioController
from users import exigir_login, login_required


controller = RemedioController()


@remedies_bp.route("/cadastrar", methods=["GET", "POST"])
def cadastrar_remedio():
    exigencia = exigir_login()
    if exigencia:
        return exigencia
    if request.method == "POST":
        resposta = controller.cadastrar_remedio()
        status_code = resposta[1] if isinstance(resposta, tuple) else resposta.status_code
        if status_code < 300:
            return redirect(url_for("remedies.listar_remedios"))
        return resposta
    return controller.preparar_cadastro()


@remedies_bp.route("/remedios")
def listar_remedios():
    return controller.listar_remedios()


@remedies_bp.route("/remedios/<int:id>")
def ver_remedio(id):
    return controller.ver_remedio(id)

@remedies_bp.route("/editar/<int:id>", methods=["GET", "POST"])
def editar_remedio(id):
    exigencia = exigir_login()
    if exigencia:
        return exigencia
    if request.method == "POST":
        resposta = controller.editar_remedio(id)
        status_code = resposta[1] if isinstance(resposta, tuple) else resposta.status_code
        if status_code < 300:
            return redirect(url_for("remedies.listar_remedios"))
        return resposta
    return controller.preparar_edicao(id)


@remedies_bp.route("/excluir/<int:id>", methods=["POST"])
def excluir_remedio(id):
    exigencia = exigir_login()
    if exigencia:
        return exigencia
    controller.remover_remedio(id)
    return redirect(url_for("remedies.listar_remedios"))


@remedies_bp.route("/sobre")
def sobre():
    return render_template("sobre.html")


# ============================================================================
# API JSON de medicamentos (usada pelo React)
#
# Cada método HTTP virou uma função separada. Motivo: o decorador
# (@login_required) protege a função INTEIRA. Se GET e POST ficassem na
# mesma função, ou os dois exigiriam token, ou nenhum exigiria.
#
#   GET    -> público (qualquer um vê o catálogo)
#   POST   -> precisa de token (usuário comum fica pendente, adm já aprova)
#   PUT    -> precisa de token
#   DELETE -> precisa de token
#
# Sem token (ou token inválido/expirado) o próprio decorador responde 401
# e a função nem chega a rodar.
# ============================================================================

@remedies_bp.route("/api/medicamentos", methods=["GET"])
def api_listar_medicamentos():
    return controller.listar_remedios_api()


@remedies_bp.route("/api/medicamentos", methods=["POST"])
@login_required
def api_cadastrar_medicamento():
    return controller.cadastrar_remedio()


@remedies_bp.route("/api/medicamentos/pendentes", methods=["GET"])
@login_required  # "Meus pendentes" (admin: todos os pendentes)
def api_listar_pendentes():
    return controller.listar_pendentes_api()


@remedies_bp.route("/api/medicamentos/<int:id>", methods=["GET"])
def api_buscar_medicamento(id):
    return controller.buscar_remedio_por_id(id)


@remedies_bp.route("/api/medicamentos/<int:id>", methods=["PUT"])
@login_required
def api_editar_medicamento(id):
    return controller.editar_remedio(id)


@remedies_bp.route("/api/medicamentos/<int:id>", methods=["DELETE"])
@login_required
def api_excluir_medicamento(id):
    return controller.remover_remedio(id)
