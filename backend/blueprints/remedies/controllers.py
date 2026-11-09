from flask import render_template, request, redirect, url_for, current_app, session, jsonify
from werkzeug.utils import secure_filename
import os
from datetime import datetime


from .dao import RemedioDAO
from blueprints.categorias.dao import CategoriaDAO
from blueprints.comentarios.dao import ComentarioDAO
from .factory import RemedioFactory
from users import usuario_do_token_opcional


def _usuario_atual():
    """
    Descobre quem está fazendo o pedido e devolve (email, eh_adm).

    1º olha o TOKEN JWT (rotas /api, chamadas pelo React). O payload do
       token tem "sub" (e-mail) e "adm" (True/False), ver token_utils.py.
    2º se não tiver token, cai na session antiga (páginas Jinja que ainda
       usam cookie), para não quebrar o que já funcionava.
    """
    payload = usuario_do_token_opcional()
    if payload:
        return payload.get("sub"), bool(payload.get("adm"))
    return session.get("usuario_email"), bool(session.get("adm"))


def _eh_dono_ou_adm(remedio):
    """
    Regra do plano: só o DONO do remédio (quem cadastrou, coluna criado_por)
    ou um ADMINISTRADOR pode ver o remédio pendente, editar ou excluir.
    Remédios antigos sem dono (criado_por vazio) ficam só para o admin.
    """
    email, eh_adm = _usuario_atual()
    return eh_adm or (email is not None and email == remedio.criado_por)


def remedio_para_lista(remedio, favorito=False):
    """Formato de cada remédio nas listas da API (catálogo e favoritos)."""
    return {
        "remedio_id": remedio.remedio_id,
        "nome_remedio": remedio.nome_remedio,
        "principio_remedio": remedio.principio_remedio,
        "lab_remedio": remedio.lab_remedio,
        "categoria_remedio": remedio.categoria_remedio,
        "descricao_remedio": remedio.descricao_remedio,
        "valor_remedio": remedio.valor_remedio,
        "destaque_remedio": remedio.destaque_remedio,
        "lancamento_remedio": remedio.lancamento_remedio,
        "promocao_remedio": remedio.promocao_remedio,
        "imagem_url": remedio.imagem_url,
        "tipo": "Tarjado" if remedio.tipo() == "tarjado" else "Venda Livre",
        "favorito": favorito,
        "criado_por": remedio.criado_por,
        "status": bool(remedio.status_remedio),  # False = pendente (ainda não aprovado)
    }


class RemedioController:
    def __init__(self):
        self.__dao = RemedioDAO()
        self.__categoria_dao = CategoriaDAO()

    def _validar_datas(self, data_fab_str: str, data_val_str: str):
        if not data_fab_str or not data_val_str:
            return False, "As datas são obrigatórias."

        try:
            data_fab = datetime.strptime(data_fab_str, "%Y-%m-%d").date()
            data_val = datetime.strptime(data_val_str, "%Y-%m-%d").date()
        except ValueError:
            return False, "Informe as datas em formato válido (YYYY-MM-DD)."

        ano_minimo = 2024
        if data_fab.year < ano_minimo or data_val.year < ano_minimo:
            return False, f"As datas devem ser a partir de {ano_minimo}."

        if data_val < data_fab:
            return False, "A data de validade não pode ser anterior à data de fabricação."

        return True, None


    def __salvar_imagem(self, arquivo):
        if not arquivo or arquivo.filename == "":
            return None
        filename = secure_filename(arquivo.filename)
        upload_folder = current_app.config.get("UPLOAD_FOLDER")
        if not upload_folder:
            upload_folder = os.path.join(current_app.root_path, "static", "uploads")
            os.makedirs(upload_folder, exist_ok=True)
        caminho = os.path.join(upload_folder, filename)
        arquivo.save(caminho)
        return f"uploads/{filename}"

    def deletar_img(self, imagem_url):
        if not imagem_url:
            return
        upload_folder = current_app.config.get("UPLOAD_FOLDER")
        if not upload_folder:
            upload_folder = os.path.join(current_app.root_path, "static", "uploads")
        nome_arquivo = os.path.basename(imagem_url)
        caminho = os.path.join(upload_folder, nome_arquivo)
        if os.path.exists(caminho):
            try:
                os.remove(caminho)
            except OSError:
                pass

    def listar_remedios(self):
        termo_busca = request.args.get("q", "").strip()
        lista = self.__dao.carregar_remedios(termo_busca if termo_busca else None)
        comentarios_por_remedio = self.__dao.carregar_comentarios_por_medicamento()
        if not comentarios_por_remedio:
            try:
                comentarios_por_remedio = ComentarioDAO().carregar_comentarios_por_medicamento()
            except Exception:
                pass

        categorias = self.__categoria_dao.carregar_categoria()
        categorias_map = {cat.id_categoria: cat.nome_categoria for cat in categorias}

        usuario_email = session.get("usuario_email")
        for remedio in lista:
            remedio.favorito = self.__dao.is_favorito(usuario_email, remedio.remedio_id) if usuario_email else False

        return render_template("remedios/remedios.html", remedios=lista,
                            comentarios_por_remedio=comentarios_por_remedio,
                            categorias_map=categorias_map,
                            usuario_email=usuario_email)

    def listar_remedios_api(self):
        termo_busca = request.args.get("q", "").strip()
        lista = self.__dao.carregar_remedios(termo_busca if termo_busca else None)
        usuario_email, _ = _usuario_atual()  # None se não estiver logado

        medicamentos = []
        for remedio in lista:
            favorito = (
                self.__dao.is_favorito(usuario_email, remedio.remedio_id)
                if usuario_email else False
            )
            medicamentos.append(remedio_para_lista(remedio, favorito))

        return jsonify(medicamentos), 200

    def listar_pendentes_api(self):
        """
        GET /api/medicamentos/pendentes  (@login_required)
        Bloco "Meus pendentes" da tabela Gerenciar remédios: os pendentes de
        quem está logado. Para o admin, todos os pendentes.
        """
        email, eh_adm = _usuario_atual()
        lista = self.__dao.listar_remedios_pendentes(None if eh_adm else email)
        return jsonify([remedio_para_lista(r) for r in lista]), 200

    def cadastrar_remedio(self):
        nome = request.form.get("nome")
        principio = request.form.get("principio")
        lab = request.form.get("lab")
        categoria = request.form.get("categoria")
        dataFab = request.form.get("dataF")
        dataVal = request.form.get("dataV")
        desc = request.form.get("desc")
        valor = request.form.get("valor")
        destaque = True if request.form.get("destaque") else False
        lancamento = True if request.form.get("lancamento") else False
        promocao = True if request.form.get("promo") else False
        tipo = request.form.get("tipo")
        tarjado = request.form.get("tarjado")
        venda_livre = request.form.get("venda_livre")
        imagem_file = request.files.get("imagem")

        # adm (lido do token) -> já entra aprovado; usuário comum -> pendente.
        # O e-mail de quem está cadastrando vira o "dono" (criado_por).
        email, eh_adm = _usuario_atual()
        status = eh_adm

        if not nome or not principio or not lab or not categoria or not dataFab or not dataVal or not desc or not tipo:
            return jsonify({"mensagem": "Todos os campos são obrigatórios!"}), 400
        try:
            ok, msg = self._validar_datas(dataFab, dataVal)
            if not ok:
                return jsonify({"mensagem": msg}), 400
            valor_float = float(valor)
            if valor_float <= 0:
                return jsonify({"mensagem": "O valor deve ser maior que zero!"}), 400
            if not imagem_file or imagem_file.filename == "":
                return jsonify({"mensagem": "Selecione uma imagem!"}), 400
            imagem_url = self.__salvar_imagem(imagem_file)
            novo_remedio = RemedioFactory.criar(
                tipo, nome, principio, lab, categoria, dataFab, dataVal, desc,
                valor, destaque, lancamento, promocao, status, imagem_url=imagem_url, tarjado=tarjado, venda_livre=venda_livre,
                criado_por=email
            )
            self.__dao.salvar_remedio(novo_remedio)
            if eh_adm:
                return jsonify({"mensagem": "Remédio cadastrado com sucesso!"}), 201
            else:
                nome_exibicao = (nome[:10] + "...") if len(nome) > 10 else nome
                return jsonify({
                    "mensagem": f"O pedido de adição do remédio '{nome_exibicao}' foi enviado para aprovação."
                }), 201
        except ValueError:
            return jsonify({"mensagem": "Digite um número válido para o valor."}), 400

    def preparar_cadastro(self):
        categorias = self.__categoria_dao.carregar_categoria()
        return render_template("remedios/cadastrar_medicamento.html", categorias=categorias)

    def preparar_edicao(self, id):
        remedio = self.__dao.buscar_remedio_por_id(id)
        if not remedio:
            return jsonify({"mensagem": "Remédio não encontrado!"}), 404
        categorias = self.__categoria_dao.carregar_categoria()
        return render_template("remedios/editar_medicamento.html", remedio=remedio, categorias=categorias)

    def buscar_remedio_por_id(self, id):
        remedio = self.__dao.buscar_remedio_por_id(id)
        # Pendente (ainda não aprovado): só o dono e o admin conseguem ver.
        # Para os outros é como se não existisse (404, igual ao ver_remedio antigo).
        if not remedio or (not remedio.status_remedio and not _eh_dono_ou_adm(remedio)):
            return jsonify({"mensagem": "Remédio não encontrado!"}), 404

        return jsonify(remedio.to_dict()), 200

    def ver_remedio(self, id):
        remedio = self.__dao.buscar_remedio_por_id(id)
        if not remedio or (not remedio.status_remedio and not session.get('adm')):
            return jsonify({"mensagem": "Remédio não encontrado!"}), 404

        categorias = self.__categoria_dao.carregar_categoria()
        categorias_map = {cat.id_categoria: cat.nome_categoria for cat in categorias}
        categoria_nome = categorias_map.get(remedio.categoria_remedio, remedio.categoria_remedio)

        comentarios_por_remedio = self.__dao.carregar_comentarios_por_medicamento()
        comentarios = comentarios_por_remedio.get(int(id), [])

        usuario_email = session.get("usuario_email")
        is_favorito = self.__dao.is_favorito(usuario_email, id) if usuario_email else False

        return render_template("remedios/remedio_detalhe.html", remedio=remedio,
                            categoria_nome=categoria_nome, comentarios=comentarios,
                            usuario_email=usuario_email, is_favorito=is_favorito)

    def editar_remedio(self, id):
        nome = request.form.get("nome")
        principio = request.form.get("principio")
        lab = request.form.get("lab")
        categoria = request.form.get("categoria")
        dataFab = request.form.get("dataF")
        dataVal = request.form.get("dataV")
        desc = request.form.get("desc")
        valor = request.form.get("valor")
        destaque = True if request.form.get("destaque") else False
        lancamento = True if request.form.get("lancamento") else False
        promocao = True if request.form.get("promo") else False
        tipo = request.form.get("tipo")
        tarjado = request.form.get("tarjado")
        venda_livre = request.form.get("venda_livre")
        imagem_file = request.files.get("imagem")

        # Primeiro: o remédio existe e quem pediu pode mexer nele?
        remedio_atual = self.__dao.buscar_remedio_por_id(id)
        if not remedio_atual:
            return jsonify({"mensagem": "Remédio não encontrado!"}), 404
        if not _eh_dono_ou_adm(remedio_atual):
            return jsonify({"mensagem": "Você não pode editar este remédio."}), 403

        if not nome or not principio or not lab or not categoria or not dataFab or not dataVal or not valor or not desc or not tipo:
            return jsonify({"mensagem": "Todos os campos são obrigatórios!"}), 400

        if tipo == "tarjado" and not tarjado:
            return jsonify({"mensagem": "Informe a tarja do medicamento!"}), 400

        if tipo == "venda_livre" and not venda_livre:
            return jsonify({"mensagem": "Informe as informações de venda livre!"}), 400

        if tipo not in ["tarjado", "venda_livre"]:
            return jsonify({"mensagem": "Tipo de medicamento inválido!"}), 400

        if tipo == "tarjado" and venda_livre:
            return jsonify({"mensagem": "Venda livre não deve ser informada para medicamentos do tipo tarjado."}), 400

        if tipo == "venda_livre" and tarjado:
            return jsonify({"mensagem": "Tarja não deve ser informada para medicamentos do tipo venda livre."}), 400

        try:
            ok, msg = self._validar_datas(dataFab, dataVal)
            if not ok:
                return jsonify({"mensagem": msg}), 400

            valor_float = float(valor)

            if valor_float <= 0:
                return jsonify({"mensagem": "O valor deve ser maior que zero!"}), 400
            if imagem_file and imagem_file.filename:
                if remedio_atual.imagem_url:
                    self.deletar_img(remedio_atual.imagem_url)
                imagem_url = self.__salvar_imagem(imagem_file)
            else:
                imagem_url = remedio_atual.imagem_url

            remedio_atualizado = RemedioFactory.criar(
                tipo, nome, principio, lab, categoria, dataFab, dataVal, desc,
                valor, destaque, lancamento, promocao, remedio_atual.status_remedio,
                imagem_url=imagem_url, tarjado=tarjado, venda_livre=venda_livre,
                remedio_id=id, criado_por=remedio_atual.criado_por  # editar não troca o dono
            )
            self.__dao.atualizar_remedio(remedio_atualizado)
            return jsonify({"mensagem": "O remédio foi atualizado com sucesso!"}), 200
        except ValueError:
            return jsonify({"mensagem": "Digite um número válido para o valor."}), 400

    def remover_remedio(self, id):
        remedio = self.__dao.buscar_remedio_por_id(id)
        if not remedio:
            return jsonify({"mensagem": "Remédio não encontrado!"}), 404
        if not _eh_dono_ou_adm(remedio):
            return jsonify({"mensagem": "Você não pode excluir este remédio."}), 403
        if remedio.imagem_url:
            self.deletar_img(remedio.imagem_url)
        self.__dao.remover_remedio(id)
        return jsonify({"mensagem": "Remédio removido!"}), 200