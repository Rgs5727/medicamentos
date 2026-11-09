from flask import render_template, request, redirect, url_for, current_app, session, jsonify
from werkzeug.utils import secure_filename
import os

from .dao import CategoriaDAO

from .models import Categoria
from users import usuario_do_token_opcional


def _usuario_atual():
    """
    Descobre quem está fazendo o pedido e devolve (email, eh_adm).
    1º o TOKEN JWT (rotas /api chamadas pelo React); sem token, a session
    antiga (páginas Jinja que ainda existem no Flask).
    """
    payload = usuario_do_token_opcional()
    if payload:
        return payload.get("sub"), bool(payload.get("adm"))
    return session.get("usuario_email"), bool(session.get("adm"))


def _eh_dono_ou_adm(categoria):
    """Mesma regra dos remédios: só quem cadastrou (criado_por) ou um admin."""
    email, eh_adm = _usuario_atual()
    return eh_adm or (email is not None and email == categoria.criado_por)


def _dados_do_pedido():
    """O React manda JSON; as páginas Jinja antigas mandam formulário."""
    return request.get_json(silent=True) or request.form


class CategoriaController:
    def __init__(self):
        self.__dao = CategoriaDAO()

    def listar_categorias(self):
        lista = self.__dao.carregar_categoria()
        return render_template("categorias/categorias.html", tipo="categoria", categorias=lista)

    def cadastrar_categoria(self):
        nome = (_dados_do_pedido().get("nome") or "").strip()

        # adm -> já entra aprovada; usuário comum -> pendente. Quem cadastrou vira o dono.
        email, eh_adm = _usuario_atual()

        if not nome:
            return jsonify({"mensagem": "O campo nome é obrigatório!"}), 400

        if self.__dao.buscar_categoria_por_nome(nome):
            return jsonify({"mensagem": "Já existe uma categoria com esse nome."}), 400

        nova_categoria = Categoria(nome, criado_por=email)
        nova_categoria.status_categoria = eh_adm

        self.__dao.salvar_categoria(nova_categoria)

        if eh_adm:
            return jsonify({"mensagem": "Categoria cadastrada com sucesso!"}), 201
        else:
            nome_exibicao = (nome[:10] + "...") if len(nome) > 10 else nome
            return jsonify({
                "mensagem": f"O pedido de adição da categoria '{nome_exibicao}' foi enviado para aprovação."
            }), 201

    def listar_categorias_api(self):
        lista = self.__dao.carregar_categoria()
        return jsonify([c.to_dict() for c in lista]), 200

    def listar_pendentes_api(self):
        """
        GET /api/categorias/pendentes (@login_required) — bloco "Minhas pendentes":
        as pendentes de quem está logado; para o admin, todas.
        """
        email, eh_adm = _usuario_atual()
        lista = self.__dao.listar_categorias_pendentes(None if eh_adm else email)
        return jsonify([c.to_dict() for c in lista]), 200

    def preparar_cadastro_categoria(self):
        categorias = self.__dao.carregar_categoria()
        return render_template("categorias/cadastrar_categoria.html", categorias=categorias)

    def preparar_edicao_categoria(self, id):
        categoria = self.__dao.buscar_categoria_por_id(id)
        if not categoria:
            return jsonify({"mensagem": "Categoria não encontrada!"}), 404
        categorias = self.__dao.carregar_categoria()
        return render_template("categorias/editar_categoria.html", categorias=categorias, categoria=categoria)

    def editar_categoria(self, id):
        categoria = self.__dao.buscar_categoria_por_id(id)
        if not categoria:
            return jsonify({"mensagem": "Categoria não encontrada!"}), 404
        if not _eh_dono_ou_adm(categoria):
            return jsonify({"mensagem": "Você não pode editar esta categoria."}), 403

        nome = (_dados_do_pedido().get("nome") or "").strip()

        if not nome:
            return jsonify({"mensagem": "O campo nome é obrigatório!"}), 400

        # Nome repetido também é bloqueado ao editar (antes só no cadastro)
        existente = self.__dao.buscar_categoria_por_nome(nome)
        if existente and existente.id_categoria != id:
            return jsonify({"mensagem": "Já existe uma categoria com esse nome."}), 400

        categoria_atualizada = Categoria(nome, id_categoria=id)
        self.__dao.atualizar_categoria(categoria_atualizada)

        return jsonify({"mensagem": "A categoria foi atualizada com sucesso!"}), 200

    def remover_categoria(self, id):
        # Atenção (igual ao antigo): no banco, apagar a categoria apaga junto os
        # remédios dela (FOREIGN KEY ... ON DELETE CASCADE). O site avisa antes.
        categoria = self.__dao.buscar_categoria_por_id(id)
        if not categoria:
            return jsonify({"mensagem": "Categoria não encontrada!"}), 404
        if not _eh_dono_ou_adm(categoria):
            return jsonify({"mensagem": "Você não pode excluir esta categoria."}), 403

        self.__dao.remover_categoria(id)
        return jsonify({"mensagem": "Categoria removida!"}), 200

    def buscar_categoria_por_id(self, id):
        # Correção: antes chamava self.__dao.buscar_por_id, que não existe (erro 500)
        categoria = self.__dao.buscar_categoria_por_id(id)
        # Pendente: só o dono e o admin conseguem ver (para os outros, 404)
        if not categoria or (not categoria.status_categoria and not _eh_dono_ou_adm(categoria)):
            return jsonify({"mensagem": "Categoria não encontrada!"}), 404

        return jsonify(categoria.to_dict()), 200
