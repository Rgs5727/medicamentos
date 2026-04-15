from flask import render_template, request, redirect, url_for, flash, current_app, session
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from urllib.parse import urlparse
import os

from .dao import RemedioDAO

from .models import Remedio, Categoria, Usuario, Comentario, Favoritos


class RemedioController:
    def __init__(self):
        self.__dao = RemedioDAO()

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
        termo_busca = request.args.get('q', '').strip()
        lista = self.__dao.carregar_remedios(termo_busca if termo_busca else None)
        comentarios_por_remedio = self.__dao.carregar_comentarios_por_medicamento()
        categorias = self.__dao.carregar_categoria()
        categorias_map = {cat.id_categoria: cat.nome_categoria for cat in categorias}
        
        usuario_email = session.get('usuario_email')
        for remedio in lista:
            remedio.favorito = self.__dao.is_favorito(usuario_email, remedio.remedio_id) if usuario_email else False
        
        return render_template("remedios.html", remedios=lista, comentarios_por_remedio=comentarios_por_remedio, categorias_map=categorias_map, usuario_email=usuario_email)

    def cadastrar_remedio(self):
        nome = request.form.get("nome")
        principio = request.form.get("principio")
        lab = request.form.get("lab")
        categoria = request.form.get("categoria")
        dataFab = request.form.get("dataF")
        dataVal = request.form.get("dataV")
        desc = request.form.get("desc")
        valor = request.form.get("valor")   
        destaque = True if request.form.get('destaque') else False
        lancamento = True if request.form.get('lancamento') else False
        promocao = True if request.form.get('promo') else False
        imagem_file = request.files.get('imagem')

        if not nome or not principio or not lab or not categoria or not dataFab or not dataVal or not desc:
            flash("Todos os campos são obrigatórios!", "danger")
        else:
            try:
                valor_float = float(valor)
                if valor_float <= 0:
                    flash("O valor deve ser maior que zero!", "danger")
                else:
                    imagem_url = self.__salvar_imagem(imagem_file)
                    novo_remedio = Remedio(nome, principio, lab, categoria, dataFab, dataVal, desc, valor, destaque, lancamento, promocao, imagem_url=imagem_url)

                    self.__dao.salvar_remedio(novo_remedio)

                    nome_exibicao = (nome[:10] + '...') if len(nome) > 10 else nome

                    flash(f"O remédio '{nome_exibicao}' foi cadastrado!", "success")
                    return redirect(url_for("remedies.listar_remedios"))
            except ValueError:
                flash("Digite um número válido para o valor.", "danger")

        return self.preparar_cadastro()

    def preparar_cadastro(self):
        categorias = self.__dao.carregar_categoria()
        return render_template("cadastrar_medicamento.html", categorias=categorias)

    def preparar_edicao(self, id):
        remedio = self.__dao.buscar_remedio_por_id(id)
        if not remedio:
            flash("Remédio não encontrado!", "danger")
            return redirect(url_for("remedies.listar_remedios"))
        categorias = self.__dao.carregar_categoria()
        return render_template("editar.html", remedio=remedio, categorias=categorias)

    def ver_remedio(self, id):
        remedio = self.__dao.buscar_remedio_por_id(id)
        if not remedio:
            flash("Remédio não encontrado!", "danger")
            return redirect(url_for("remedies.listar_remedios"))

        categorias = self.__dao.carregar_categoria()
        categorias_map = {cat.id_categoria: cat.nome_categoria for cat in categorias}
        categoria_nome = categorias_map.get(remedio.categoria_remedio, remedio.categoria_remedio)

        comentarios_por_remedio = self.__dao.carregar_comentarios_por_medicamento()
        comentarios = comentarios_por_remedio.get(id, [])

        usuario_email = session.get('usuario_email')
        is_favorito = self.__dao.is_favorito(usuario_email, id) if usuario_email else False
        
        return render_template("remedio_detalhe.html", remedio=remedio, categoria_nome=categoria_nome, comentarios=comentarios, usuario_email=usuario_email, is_favorito=is_favorito)

    def editar_remedio(self, id):
        nome = request.form.get("nome")
        principio = request.form.get("principio")
        lab = request.form.get("lab")
        categoria = request.form.get("categoria")
        dataFab = request.form.get("dataF")
        dataVal = request.form.get("dataV")
        desc = request.form.get("desc")
        valor = request.form.get("valor")
        destaque = True if request.form.get('destaque') else False
        lancamento = True if request.form.get('lancamento') else False
        promocao = True if request.form.get('promo') else False
        imagem_file = request.files.get('imagem')

        if not nome or not principio or not lab or not categoria or not dataFab or not dataVal or not desc:
            flash("Todos os campos são obrigatórios!", "danger")
            return redirect(url_for("remedies.editar_remedio", id=id))

        try:
            valor_float = float(valor)
            if valor_float <= 0:
                flash("O valor deve ser maior que zero!", "danger")
                return redirect(url_for("remedies.editar_remedio", id=id))

            remedio_atual = self.__dao.buscar_remedio_por_id(id)
            if imagem_file and imagem_file.filename:
                if remedio_atual and remedio_atual.imagem_url:
                    self.deletar_img(remedio_atual.imagem_url)
                imagem_url = self.__salvar_imagem(imagem_file)
            else:
                imagem_url = remedio_atual.imagem_url if remedio_atual else None

            remedio_atualizado = Remedio(nome, principio, lab, categoria, dataFab, dataVal, desc, valor, destaque, lancamento, promocao, imagem_url=imagem_url, remedio_id=id)
            self.__dao.atualizar_remedio(remedio_atualizado)

            flash(f"O remédio foi atualizado com sucesso!", "success")
            return redirect(url_for("remedies.listar_remedios"))
        except ValueError:
            flash("Digite um número válido para o valor.", "danger")
            return redirect(url_for("remedies.editar_remedio", id=id))

    def remover_remedio(self, id):
        remedio = self.__dao.buscar_remedio_por_id(id)
        if remedio and remedio.imagem_url:
            self.deletar_img(remedio.imagem_url)

        self.__dao.remover_remedio(id)
        flash("Remédio removido com sucesso!", "success")
        return redirect(url_for("remedies.listar_remedios"))
        
    def listar_categorias(self):
        lista = self.__dao.carregar_categoria()
        return render_template("cadastrar.html", tipo="categoria", categorias=lista)

    def cadastrar_categoria(self):
        nome = request.form.get("nome", "").strip()

        if not nome:
            flash("O campo é obrigatório!", "danger")
            return self.preparar_cadastro_categoria()

        if self.__dao.buscar_categoria_por_nome(nome):
            flash("Já existe uma categoria com esse nome.", "danger")
            return self.preparar_cadastro_categoria()

        nova_categoria = Categoria(nome)
        self.__dao.salvar_categoria(nova_categoria)
        nome_exibicao = (nome[:10] + '...') if len(nome) > 10 else nome

        flash(f"A categoria '{nome_exibicao}' foi cadastrada!", "success")
        return redirect(url_for("remedies.cadastrar_categoria"))

    def preparar_cadastro_categoria(self):
        categorias = self.__dao.carregar_categoria()
        return render_template("cadastrar_categoria.html", categorias=categorias)

    def preparar_edicao_categoria(self, id):
        categoria = self.__dao.buscar_categoria_por_id(id)
        if not categoria:
            flash("Categoria não encontrada!", "danger")
            return redirect(url_for("remedies.listar_remedios"))
        categorias = self.__dao.carregar_categoria()
        return render_template("cadastrar_categoria.html", categorias=categorias, categoria=categoria)

    def editar_categoria(self, id):
        nome = request.form.get("nome")

        if not nome:
            flash("O campo é obrigatório!", "danger")
            return redirect(url_for("remedies.cadastrar_categoria"))
        else:
            categoria_atualizada = Categoria(nome, id_categoria=id)
            self.__dao.atualizar_categoria(categoria_atualizada)

            flash(f"A categoria foi atualizada com sucesso!", "success")
            return redirect(url_for("remedies.cadastrar_categoria"))

    def remover_categoria(self, id):
        self.__dao.remover_categoria(id)
        flash("Categoria removida com sucesso!", "success")
        return redirect(url_for("remedies.cadastrar_categoria"))
    
    def preparar_login(self):
        return render_template("login.html")

    def login(self):
        email = request.form.get("email", "").strip().lower()
        senha = request.form.get("senha", "")

        if not email or not senha:
            flash("E-mail e senha são obrigatórios.", "danger")
            return self.preparar_login()

        usuario = self.__dao.buscar_usuario_por_email(email)
        if not usuario:
            flash("Usuário ou senha incorretos.", "danger")
            return self.preparar_login()

        if not check_password_hash(usuario.senha, senha):
            flash("Usuário ou senha incorretos.", "danger")
            return self.preparar_login()
        session["adm"] = str(usuario.adm).strip() in ["1", "True", "true"]
        session["usuario_senha_plain"] = senha

        session["usuario_email"] = usuario.email
        session["usuario_nome"] = usuario.nome
        session["adm"] = bool(int(usuario.adm))      
        flash("Login realizado com sucesso!", "success")
        return redirect(url_for("remedies.listar_remedios"))

    def preparar_cadastro_usuario(self):
        return render_template("register.html")

    def cadastrar_usuario(self):
        nome = request.form.get("nome", "").strip()
        email = request.form.get("email", "").strip().lower()
        senha = request.form.get("senha", "")

        if not nome or not email or not senha:
            flash("Todos os campos são obrigatórios.", "danger")
            return self.preparar_cadastro_usuario()

        if self.__dao.buscar_usuario_por_email(email):
            flash("Já existe um usuário cadastrado com esse e-mail.", "danger")
            return self.preparar_cadastro_usuario()

        senha_hash = generate_password_hash(senha)
        novo_usuario = Usuario(email, senha_hash, nome, adm=False)
        self.__dao.salvar_usuario(novo_usuario)

        session["usuario_email"] = novo_usuario.email
        session["usuario_nome"] = novo_usuario.nome
        session['adm'] = novo_usuario.adm
        session['usuario_senha_plain'] = senha
        flash("Conta criada com sucesso!", "success")
        return redirect(url_for("remedies.listar_remedios"))
    
    def usuario_detalhe(self):
        if not session.get("usuario_email"):
            flash("Você precisa estar logado para acessar seu perfil.", "danger")
            return redirect(url_for("remedies.listar_remedios"))

        email = session["usuario_email"]
        user = self.__dao.buscar_usuario_por_email(email)
        if not user:
            flash("Usuário não encontrado.", "danger")
            session.clear()
            return redirect(url_for("remedies.login"))

        favoritos = self.__dao.carregar_favoritos_usuario(email)
        return render_template("usuario_detalhe.html", 
                            usuario_nome=user.nome, 
                            usuario_email=user.email, 
                            favoritos=favoritos)

        
    def editar_usuario(self):
        if not session.get("usuario_email"):
            flash("Você precisa estar logado.", "danger")
            return redirect(url_for("remedies.login"))

        email = session["usuario_email"]
        
        if request.method == "GET":
            usuario_atual = self.__dao.buscar_usuario_por_email(email)
            if not usuario_atual:
                flash("Usuário não encontrado.", "danger")
                session.clear()
                return redirect(url_for("remedies.login"))
            session['usuario_senha'] = session.get('usuario_senha_plain', 'Senha não disponível')
            return render_template("usuario_editar.html", 
                                usuario_nome=usuario_atual.nome, 
                                usuario_email=usuario_atual.email)
        
        nome = request.form.get("nome_user", "").strip()
        nova_senha = request.form.get("nova_senha", "").strip()
        confirm_senha = request.form.get("confirm_senha", "").strip()
        
        usuario_atual = self.__dao.buscar_usuario_por_email(email)
        if not usuario_atual:
            flash("Usuário não encontrado.", "danger")
            session.clear()
            return redirect(url_for("remedies.login"))
        
        if nova_senha and nova_senha != confirm_senha:
            flash("Nova senha e confirmação não coincidem.", "danger")
            return render_template("usuario_editar.html", 
                                usuario_nome=usuario_atual.nome, 
                                usuario_email=usuario_atual.email)

        if nome:
            usuario_atual.nome = nome
        
        if nova_senha:
            usuario_atual.senha = generate_password_hash(nova_senha)
            session["usuario_senha_plain"] = nova_senha
        
        self.__dao.atualizar_usuario_com_senha(email, usuario_atual.nome, usuario_atual.senha)
        
        session["usuario_nome"] = usuario_atual.nome
        flash("Perfil atualizado com sucesso!", "success")
        return redirect(url_for('remedies.usuario_detalhe'))

    def logout(self):
        if 'usuario_senha_plain' in session:
            del session['usuario_senha_plain']
        session.clear()
        flash("Desconectado com sucesso. Volte sempre!", "success")
        return redirect(url_for("remedies.listar_remedios"))

    def adicionar_comentario(self, remedio_id):
        if not session.get("usuario_email"):
            flash("Você precisa estar logado para comentar.", "danger")
            return redirect(url_for("remedies.login"))
        texto = request.form.get("texto", "").strip()
        if not texto:
            flash("O comentário não pode ficar vazio.", "warning")
            return redirect(url_for("remedies.listar_remedios"))
        comentario = Comentario(
            session["usuario_email"],
            texto,
            comentario_med_id=remedio_id
        )
        self.__dao.salvar_comentario(comentario)
        flash("Comentário adicionado com sucesso!", "success")
        redirect_url = url_for("remedies.listar_remedios")
        ref = request.referrer
        if ref:
            parsed = urlparse(ref)
            if parsed.netloc == request.host:
                redirect_url = ref
        return redirect(redirect_url)
    
    def editar_comentario(self, id):
        if not session.get("usuario_email"):
            flash("Você precisa estar logado.", "danger")
            return redirect(url_for("remedies.login"))
        comentario = self.__dao.buscar_comentario_por_id(id)
        if not comentario:
            flash("Comentário não encontrado.", "danger")
            return redirect(url_for("remedies.listar_remedios"))
        if comentario.usuario != session.get("usuario_email") and not session['adm']:
            flash("Você não pode editar esse comentário.", "danger")
            return redirect(url_for("remedies.listar_remedios"))
        if request.method == "POST":
            texto = request.form.get("texto", "").strip()
            if not texto:
                flash("Comentário não pode ficar vazio.", "warning")
                return redirect(url_for('remedies.editar_comentario'))
            comentario.texto = texto
            self.__dao.editar_comentario(comentario)
            flash("Comentário atualizado!", "success")
            return redirect(url_for('remedies.ver_remedio', id=comentario.comentario_med_id))
        return render_template("editar_comentario.html", comentario=comentario)
    
    def excluir_comentario(self, id):
        if not session.get("usuario_email"):
            flash("Você precisa estar logado.", "danger")
            return redirect(url_for("remedies.login"))
        comentario = self.__dao.buscar_comentario_por_id(id)
        if not comentario:
            flash("Comentário não encontrado.", "danger")
            return redirect(url_for('remedies.ver_remedio', id=comentario.comentario_med_id))
        if comentario.usuario != session.get("usuario_email") and not session['adm']:
            flash("Você não pode excluir esse comentário.", "danger")
            return redirect(url_for('remedies.ver_remedio', id=comentario.comentario_med_id))
        self.__dao.excluir_comentario(id)
        flash("Comentário excluído com sucesso!", "success")
        return redirect(url_for('remedies.ver_remedio', id=comentario.comentario_med_id))        

    def favoritar(self, remedio_id):
        if not session.get("usuario_email"):
            flash("Você precisa estar logado para favoritar.", "danger")
            return redirect(url_for("remedies.listar_remedios"))
        
        usuario_email = session["usuario_email"]
        is_fav = self.__dao.is_favorito(usuario_email, remedio_id)
        
        if is_fav:
            self.__dao.remover_favorito(usuario_email, remedio_id)
            flash("Removido dos favoritos!", "info")
        else:
            self.__dao.adicionar_favorito(usuario_email, remedio_id)
            flash("Adicionado aos favoritos!", "success")
        
        ref = request.referrer
        if '/remedio_detalhe' in ref or f'/remedios/{remedio_id}' in ref:
            return redirect(url_for("remedies.ver_remedio", id=remedio_id))
        elif '/usuario_detalhe' in ref:
            return redirect(url_for("remedies.usuario_detalhe"))
        
        return redirect(url_for("remedies.listar_remedios"))
