from flask import render_template, request, redirect, url_for, flash, session


from . import remedies_bp

from .controllers import RemedioController

controller = RemedioController()

def _exigir_login():
    if not session.get("usuario_email"):
        flash("Você precisa estar logado para acessar essa página.", "danger")
        return redirect(url_for("remedies.login"))
    return None

def exigir_adm():
    if not session.get("usuario_email"):
        flash("Você precisa estar logado.", "danger")
        return redirect(url_for("remedies.login"))

    if not session.get("adm"):
        flash("Apenas administradores podem acessar.", "danger")
        return redirect(url_for("remedies.listar_remedios"))

    return None
@remedies_bp.route("/cadastrar", methods=["GET", "POST"])
def cadastrar_remedio():
    exigencia = _exigir_login()
    if exigencia:
        return exigencia

    if request.method == "POST":
        return controller.cadastrar_remedio()

    return controller.preparar_cadastro()


@remedies_bp.route("/remedios")
def listar_remedios():
    return controller.listar_remedios()


@remedies_bp.route("/remedios/<int:id>")
def ver_remedio(id):
    return controller.ver_remedio(id)


@remedies_bp.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        return controller.login()
    return controller.preparar_login()


@remedies_bp.route("/register", methods=["GET", "POST"])
def register():
    if request.method == "POST":
        return controller.cadastrar_usuario()
    return controller.preparar_cadastro_usuario()


@remedies_bp.route('/editar_usuario', methods=["GET", "POST"])
def editar_usuario():
    return controller.editar_usuario()

@remedies_bp.route('/usuario_detalhe')
def usuario_detalhe():
    return controller.usuario_detalhe()


@remedies_bp.route("/logout")
def logout():
    return controller.logout()


@remedies_bp.route("/remedios/<int:remedio_id>/comentarios", methods=["POST"])
def adicionar_comentario(remedio_id):
    return controller.adicionar_comentario(remedio_id)

@remedies_bp.route("/comentario/editar/<int:id>", methods=["GET", "POST"])
def editar_comentario(id):
    return controller.editar_comentario(id)

@remedies_bp.route("/comentario/excluir/<int:id>", methods=["POST"])
def excluir_comentario(id):
    return controller.excluir_comentario(id)



@remedies_bp.route("/editar/<int:id>", methods=["GET", "POST"])
def editar_remedio(id):
    exigencia = _exigir_login()
    if exigencia:
        return exigencia

    if request.method == "POST":
        return controller.editar_remedio(id)
    return controller.preparar_edicao(id)


@remedies_bp.route("/excluir/<int:id>", methods=["POST"])
def excluir_remedio(id):
    exigencia = _exigir_login()
    if exigencia:
        return exigencia

    return controller.remover_remedio(id)


@remedies_bp.route('/cadastrarCategoria', methods=["GET", "POST"])
def cadastrar_categoria():
    print(session)
    exigencia = _exigir_login()
    if exigencia:
        return exigencia

    if request.method == "POST":
        return controller.cadastrar_categoria()

    return controller.preparar_cadastro_categoria()


@remedies_bp.route('/editarCategoria/<int:id>', methods=["GET", "POST"])
def editar_categoria(id):
    exigencia = exigir_adm()
    if exigencia:
        return exigencia

    if request.method == "POST":
        return controller.editar_categoria(id)
    return controller.preparar_edicao_categoria(id)


@remedies_bp.route('/excluirCategoria/<int:id>', methods=["POST"])
def excluir_categoria(id):
    exigencia = exigir_adm()
    if exigencia:
        return exigencia
    return controller.remover_categoria(id)

@remedies_bp.route('/sobre')
def sobre():
    return render_template('sobre.html')


@remedies_bp.route("/remedios/<int:id>/favoritar", methods=["POST"])
def favoritar(id):
    return controller.favoritar(id)


