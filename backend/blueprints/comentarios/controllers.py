from flask import render_template, request, redirect, url_for, flash, session, jsonify, g
from urllib.parse import urlparse

from .dao import ComentarioDAO
from .models import Comentario

# Observação: RemedioDAO é importado DENTRO de api_adicionar_comentario (e não
# aqui no topo). O remedies/dao.py importa blueprints.comentarios.models, o que
# carrega este pacote inteiro (rotas e este controller); importar o RemedioDAO
# aqui em cima geraria um import circular. Mesma solução usada em users.py.


def _pode_mexer(comentario):
    """Só quem escreveu o comentário ou um administrador pode editar/excluir."""
    return bool(g.usuario_token.get("adm")) or comentario.usuario == g.usuario_token.get("sub")


class ComentarioController:

    def __init__(self):
        self.__dao = ComentarioDAO()

    # ========================================================================
    # API JSON (React) — mesmas regras e mensagens das rotas antigas abaixo,
    # mas quem está logado vem do TOKEN (g.usuario_token), não da session.
    # ========================================================================

    def api_listar_comentarios(self, remedio_id):
        """GET /api/medicamentos/<id>/comentarios (público)"""
        comentarios = self.__dao.carregar_comentarios_do_medicamento(remedio_id)
        return jsonify([c.to_dict() for c in comentarios]), 200

    def api_adicionar_comentario(self, remedio_id):
        """POST /api/medicamentos/<id>/comentarios (@login_required) — JSON {texto}"""
        dados = request.get_json(silent=True) or {}
        texto = (dados.get("texto") or "").strip()
        if not texto:
            return jsonify({"mensagem": "O comentário não pode ficar vazio."}), 400
        from blueprints.remedies.dao import RemedioDAO  # import adiado, ver nota no topo
        if not RemedioDAO().buscar_remedio_por_id(remedio_id):
            return jsonify({"mensagem": "Remédio não encontrado!"}), 404

        comentario = Comentario(g.usuario_token["sub"], texto, comentario_med_id=remedio_id)
        self.__dao.salvar_comentario(comentario)
        return jsonify({"mensagem": "Comentário adicionado com sucesso!", "comentario": comentario.to_dict()}), 201

    def api_buscar_comentario(self, id):
        """GET /api/comentarios/<id> (@login_required) — usado pela página de editar"""
        comentario = self.__dao.buscar_comentario_por_id(id)
        if not comentario:
            return jsonify({"mensagem": "Comentário não encontrado."}), 404
        if not _pode_mexer(comentario):
            return jsonify({"mensagem": "Você não pode editar esse comentário."}), 403
        return jsonify(comentario.to_dict()), 200

    def api_editar_comentario(self, id):
        """PUT /api/comentarios/<id> (@login_required) — JSON {texto}"""
        comentario = self.__dao.buscar_comentario_por_id(id)
        if not comentario:
            return jsonify({"mensagem": "Comentário não encontrado."}), 404
        if not _pode_mexer(comentario):
            return jsonify({"mensagem": "Você não pode editar esse comentário."}), 403

        dados = request.get_json(silent=True) or {}
        texto = (dados.get("texto") or "").strip()
        if not texto:
            return jsonify({"mensagem": "Comentário não pode ficar vazio."}), 400

        comentario.texto = texto
        self.__dao.editar_comentario(comentario)
        return jsonify({"mensagem": "Comentário atualizado!", "comentario": comentario.to_dict()}), 200

    def api_excluir_comentario(self, id):
        """DELETE /api/comentarios/<id> (@login_required)"""
        comentario = self.__dao.buscar_comentario_por_id(id)
        if not comentario:
            return jsonify({"mensagem": "Comentário não encontrado."}), 404
        if not _pode_mexer(comentario):
            return jsonify({"mensagem": "Você não pode excluir esse comentário."}), 403

        self.__dao.excluir_comentario(id)
        return jsonify({"mensagem": "Comentário excluído com sucesso!"}), 200

    # ========================================================================
    # Rotas antigas (páginas Jinja com session) — continuam como estavam
    # ========================================================================

    def adicionar_comentario(self, remedio_id):
        if not session.get("usuario_email"):
            flash("Você precisa estar logado para comentar.", "danger")
            return redirect(url_for("usuarios.login"))

        texto = request.form.get("texto", "").strip()
        if not texto:
            flash("O comentário não pode ficar vazio.", "warning")
            return redirect(url_for("remedies.ver_remedio", id=remedio_id))

        comentario = Comentario(
            session["usuario_email"],
            texto,
            comentario_med_id=remedio_id
        )
        self.__dao.salvar_comentario(comentario)
        flash("Comentário adicionado com sucesso!", "success")

        ref = request.referrer
        if ref:
            parsed = urlparse(ref)
            if parsed.netloc == request.host:
                return redirect(ref)

        return redirect(url_for("remedies.ver_remedio", id=remedio_id))

    def editar_comentario(self, id):
        if not session.get("usuario_email"):
            flash("Você precisa estar logado.", "danger")
            return redirect(url_for("usuarios.login"))

        comentario = self.__dao.buscar_comentario_por_id(id)
        if not comentario:
            flash("Comentário não encontrado.", "danger")
            return redirect(url_for("remedies.listar_remedios"))

        if comentario.usuario != session.get("usuario_email") and not session.get("adm"):
            flash("Você não pode editar esse comentário.", "danger")
            return redirect(url_for("remedies.listar_remedios"))

        if request.method == "POST":
            texto = request.form.get("texto", "").strip()
            if not texto:
                flash("Comentário não pode ficar vazio.", "warning")
                return redirect(url_for("comentarios.editar_comentario", id=id))
            comentario.texto = texto
            self.__dao.editar_comentario(comentario)
            flash("Comentário atualizado!", "success")
            return redirect(url_for("remedies.ver_remedio", id=comentario.comentario_med_id))

        return render_template("comentarios/editar_comentario.html", comentario=comentario)

    def excluir_comentario(self, id):
        if not session.get("usuario_email"):
            flash("Você precisa estar logado.", "danger")
            return redirect(url_for("usuarios.login"))

        comentario = self.__dao.buscar_comentario_por_id(id)
        if not comentario:
            flash("Comentário não encontrado.", "danger")
            return redirect(url_for("remedies.listar_remedios"))

        if comentario.usuario != session.get("usuario_email") and not session.get("adm"):
            flash("Você não pode excluir esse comentário.", "danger")
            return redirect(url_for("remedies.ver_remedio", id=comentario.comentario_med_id))

        remedio_id = comentario.comentario_med_id
        self.__dao.excluir_comentario(id)
        flash("Comentário excluído com sucesso!", "success")
        return redirect(url_for("remedies.ver_remedio", id=remedio_id))
