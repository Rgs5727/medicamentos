from flask import render_template, request, redirect, url_for, flash, current_app, session, jsonify, g
from werkzeug.security import generate_password_hash, check_password_hash
import os
import secrets
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta
from users import exigir_adm


from blueprints.remedies.dao import RemedioDAO
from blueprints.categorias.dao import CategoriaDAO
from .dao import UsuarioDAO
from .models import Usuario
from .factory import UsuarioFactory
from .token_utils import gerar_token, conferir_token, expira_em_iso, segundos_para_expirar
from blueprints.remedies.controllers import remedio_para_lista


class UsuarioController:
    def __init__(self):
        self.__dao = UsuarioDAO()
        self.__remedio_dao = RemedioDAO()
        self.__categoria_dao = CategoriaDAO()
        

    def preparar_login(self):
        # A partir do 3º bimestre esta página é só o esqueleto: nenhum
        # dado do banco é passado pro template. Quem confere e-mail/senha
        # agora é a rota da API (api_login, mais abaixo) — quem chama ela
        # é o JavaScript (static/js/auth.js), não mais um POST de formulário
        # tradicional. Por isso não existe mais um método "login()" aqui
        # que lê request.form e mexe em session.
        return render_template("usuarios/login.html")

    def preparar_cadastro_usuario(self):
        # Mesma ideia do login: só o esqueleto. Quem cadastra de verdade é
        # api_registro (mais abaixo), chamada via fetch pelo auth.js.
        return render_template("usuarios/register.html")

    def usuario_detalhe(self):
        if not session.get("usuario_email"):
            flash("Acesso negado! Você precisa estar logado para acessar seu perfil.", "danger")
            return render_template("error403.html")
        
        email = session["usuario_email"]
        user = self.__dao.buscar_usuario_por_email(email)
        
        if not user:
            flash("Acesso negado! Usuario não encontrado", "danger")
            session.clear()
            return render_template("error403.html")
        
        favoritos = self.__dao.carregar_favoritos_usuario(email)
        return render_template("usuarios/usuario_detalhe.html", usuario_nome=user.nome, usuario_email=user.email, favoritos=favoritos)

    def editar_usuario(self):
        email = session["usuario_email"]

        if request.method == "GET":
            usuario_atual = self.__dao.buscar_usuario_por_email(email)
            if not usuario_atual:
                flash("Acesso negado! Usuario não encontrado", "danger")
                session.clear()
                return render_template("error403.html")
            session["usuario_senha"] = session.get("usuario_senha_plain", "Senha não disponível")
            return render_template("usuarios/usuario_editar.html",
                                   usuario_nome=usuario_atual.nome,
                                   usuario_email=usuario_atual.email)
        
        nome = request.form.get("nome_user", "").strip()
        nova_senha = request.form.get("nova_senha", "").strip()
        confirm_senha = request.form.get("confirm_senha", "").strip()

        usuario_atual = self.__dao.buscar_usuario_por_email(email)
        if not usuario_atual:
            flash("Acesso negado! Usuario não encontrado", "danger")
            session.clear()
            return render_template("error403.html")

        if nova_senha and nova_senha != confirm_senha:
            flash("Nova senha e confirmação não coincidem.", "danger")
            return render_template("usuarios/usuario_editar.html",
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
        return redirect(url_for("usuarios.usuario_detalhe"))

    def logout(self):
        session.clear()
        flash("Desconectado com sucesso. Volte sempre!", "success")
        return redirect(url_for("remedies.listar_remedios"))

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
        if ref:
            from urllib.parse import urlparse

            ref_host = urlparse(ref).netloc
            req_host = urlparse(request.host_url).netloc
            if ref_host == req_host:
                return redirect(ref)

        return redirect(url_for("remedies.listar_remedios"))

    def _enviar_email_reset(self, destinatario, link):
        remetente = os.getenv("EMAIL_USER")
        senha_email = os.getenv("EMAIL_PASSWORD")
        smtp_host = os.getenv("EMAIL_SMTP_HOST", "smtp.gmail.com")
        smtp_port = int(os.getenv("EMAIL_SMTP_PORT", 587))

        msg = MIMEMultipart("alternative")
        msg["Subject"] = "Recuperação de senha – Medicamentos"
        msg["From"] = remetente
        msg["To"] = destinatario

        corpo_texto = (
            f"Olá!\n\n"
            f"Recebemos uma solicitação para redefinir a senha da sua conta.\n"
            f"Acesse o link abaixo (válido por 30 minutos):\n\n"
            f"{link}\n\n"
            f"Se você não solicitou isso, apenas ignore este e-mail.\n"
        )
        corpo_html = f"""
        <html>
        <body style="margin:0;padding:0;background:#f4f6f9;font-family:Arial,Helvetica,sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:40px 0;">
            <tr><td align="center">
                <table width="500" cellpadding="0" cellspacing="0"
                       style="background:#ffffff;border-radius:10px;box-shadow:0 4px 15px rgba(0,0,0,0.08);padding:30px;">
                    <tr><td align="center" style="padding-bottom:20px;">
                        <h2 style="margin:0;color:#0d6efd;">Redefinição de Senha</h2>
                    </td></tr>
                    <tr><td style="color:#333;font-size:15px;line-height:1.6;">
                        <p>Olá,</p>
                        <p>Recebemos uma solicitação para redefinir a senha da sua conta.</p>
                        <p>Para continuar, clique no botão abaixo. Este link é válido por <strong>30 minutos</strong>.</p>
                    </td></tr>
                    <tr><td align="center" style="padding:25px 0;">
                        <a href="{link}" style="background:#0d6efd;color:#ffffff;padding:12px 28px;
                           border-radius:6px;text-decoration:none;font-weight:bold;display:inline-block;">
                        Redefinir minha senha</a>
                    </td></tr>
                    <tr><td style="color:#555;font-size:14px;word-break:break-all;">
                        <p>Se o botão não funcionar, copie e cole o link abaixo no seu navegador:</p>
                        <p style="background:#f1f3f5;padding:10px;border-radius:5px;font-size:12px;color:#0d6efd;">{link}</p>
                    </td></tr>
                    <tr><td style="padding-top:20px;border-top:1px solid #eee;color:#777;font-size:12px;">
                        <p>Se você não solicitou esta alteração, pode ignorar este e-mail com segurança.</p>
                    </td></tr>
                </table>
            </td></tr>
            </table>
        </body>
        </html>
        """

        msg.attach(MIMEText(corpo_texto, "plain"))
        msg.attach(MIMEText(corpo_html, "html"))

        with smtplib.SMTP(smtp_host, smtp_port) as servidor:
            servidor.ehlo()
            servidor.starttls()
            servidor.login(remetente, senha_email)
            servidor.sendmail(remetente, destinatario, msg.as_string())

    def preparar_esqueci_senha(self):
        return render_template("usuarios/esqueci_senha.html")

    def solicitar_reset(self):
        email = request.form.get("email", "").strip().lower()
        usuario = self.__dao.buscar_usuario_por_email(email)
        mensagem_generica = ("Se esse e-mail estiver cadastrado, você receberá "
                            "as instruções em breve.")

        if usuario:
            token = secrets.token_urlsafe(32)
            expira_em = datetime.now() + timedelta(minutes=30)
            self.__dao.salvar_token_reset(email, token, expira_em)
            link = url_for("usuarios.redefinir_senha", token=token, _external=True)
            try:
                self._enviar_email_reset(email, link)
            except Exception as e:
                current_app.logger.error(f"Erro ao enviar e-mail de reset: {e}")
                flash("Ocorreu um erro ao enviar o e-mail. Tente novamente.", "danger")
                return render_template("usuarios/esqueci_senha.html")

        flash(mensagem_generica, "info")
        return redirect(url_for("usuarios.login"))

    def preparar_redefinir_senha(self, token):
        dado = self.__dao.buscar_token_reset(token)
        if not dado:
            flash("Link inválido ou expirado. Solicite um novo.", "danger")
            return redirect(url_for("usuarios.esqueci_senha"))
        return render_template("usuarios/redefinir_senha.html", token=token)

    def redefinir_senha(self, token):
        dado = self.__dao.buscar_token_reset(token)
        if not dado:
            flash("Link inválido ou expirado. Solicite um novo.", "danger")
            return redirect(url_for("usuarios.esqueci_senha"))

        nova_senha = request.form.get("senha", "")
        confirmar = request.form.get("confirmar_senha", "")

        if len(nova_senha) < 6:
            flash("A senha deve ter no mínimo 6 caracteres.", "danger")
            return render_template("usuarios/redefinir_senha.html", token=token)

        if nova_senha != confirmar:
            flash("As senhas não coincidem.", "danger")
            return render_template("usuarios/redefinir_senha.html", token=token)

        hash_senha = generate_password_hash(nova_senha)
        self.__dao.atualizar_senha(dado["email"], hash_senha)
        self.__dao.marcar_token_usado(token)

        flash("Senha redefinida com sucesso! Faça login.", "success")
        return redirect(url_for("usuarios.login"))

    def menu(self):
        resp = exigir_adm()
        if resp:
            return resp
        return render_template('usuarios/menu.html')

    def usuarios(self):
        resp = exigir_adm()
        if resp:
            return resp
        usuarios = self.__dao.listar_usuarios()
        return render_template('usuarios/usuarios.html', usuarios=usuarios)

    def promover_usuario(self):
        resp = exigir_adm()
        if resp:
            return resp

        email = request.form.get('email')
        if not email:
            flash('E-mail inválido.', 'danger')
            return redirect(url_for('usuarios.usuarios'))

        success = self.__dao.promover_para_adm(email)
        if success:
            flash(f'Usuário {email} promovido a administrador.', 'success')
        else:
            flash('Não foi possível promover o usuário.', 'danger')
        return redirect(url_for('usuarios.usuarios'))

    def rebaixar_usuario(self):
        resp = exigir_adm()
        if resp:
            return resp

        email = request.form.get('email')
        if not email:
            flash('E-mail inválido.', 'danger')
            return redirect(url_for('usuarios.usuarios'))

        if email == session.get('usuario_email'):
            flash('Você não pode rebaixar seu próprio usuário.', 'danger')
            return redirect(url_for('usuarios.usuarios'))

        success = self.__dao.rebaixar_para_comum(email)
        if success:
            flash(f'Usuário {email} rebaixado para usuário comum.', 'success')
        else:
            flash('Não foi possível rebaixar o usuário.', 'danger')
        return redirect(url_for('usuarios.usuarios'))

    def moderacao(self):
        resp = exigir_adm()
        if resp:
            return resp
        remedios = self.__remedio_dao.listar_remedios_pendentes()
        categorias = self.__categoria_dao.listar_categorias_pendentes()
        return render_template('usuarios/moderacao.html', remedios=remedios, categorias=categorias)

    def aprovar_remedio(self):
        resp = exigir_adm()
        if resp:
            return resp

        remedio_id = request.form.get('remedio_id')
        if not remedio_id:
            flash('Remédio inválido.', 'danger')
            return redirect(url_for('admin.moderacao'))

        if self.__remedio_dao.aprovar_remedio(remedio_id):
            flash('Pedido de remédio aprovado com sucesso.', 'success')
        else:
            flash('Erro ao aprovar pedido de remédio.', 'danger')
        return redirect(url_for('usuarios.moderacao'))

    def rejeitar_remedio(self):
        resp = exigir_adm()
        if resp:
            return resp

        remedio_id = request.form.get('remedio_id')
        if not remedio_id:
            flash('Remédio inválido.', 'danger')
            return redirect(url_for('usuarios.moderacao'))

        if self.__remedio_dao.rejeitar_remedio(remedio_id):
            flash('Pedido de remédio rejeitado com sucesso.', 'info')
        else:
            flash('Erro ao rejeitar pedido de remédio.', 'danger')
        return redirect(url_for('usuarios.moderacao'))

    def aprovar_categoria(self):
        # Rota antiga (página /moderacao, form tradicional com session).
        # Mantida porque templates/usuarios/moderacao.html ainda usa
        # url_for('usuarios.aprovar_categoria') com method="post" e espera
        # um redirect + flash de volta, não um JSON.
        resp = exigir_adm()
        if resp:
            return resp

        categoria_id = request.form.get('categoria_id')
        if not categoria_id:
            flash('Categoria inválida.', 'danger')
            return redirect(url_for('usuarios.moderacao'))

        if self.__categoria_dao.aprovar_categoria(categoria_id):
            flash('Pedido de categoria aprovado com sucesso.', 'success')
        else:
            flash('Erro ao aprovar pedido de categoria.', 'info')
        return redirect(url_for('usuarios.moderacao'))

    def rejeitar_categoria(self):
        # Rota antiga — mesma observação do aprovar_categoria acima.
        resp = exigir_adm()
        if resp:
            return resp

        categoria_id = request.form.get('categoria_id')
        if not categoria_id:
            flash('Categoria inválida.', 'danger')
            return redirect(url_for('usuarios.moderacao'))

        if self.__categoria_dao.rejeitar_categoria(categoria_id):
            flash('Pedido de categoria rejeitado com sucesso.', 'info')
        else:
            flash('Erro ao rejeitar pedido de categoria.', 'danger')
        return redirect(url_for('usuarios.moderacao'))

    # ========================================================================
    # Moderação de categorias — versão em JSON (a pedido). Não está na
    # especificação nova (categoria não tem "status" na spec do 3º
    # bimestre — isso é uma sobra do 2º bimestre), mas segue o mesmo
    # padrão das outras rotas da API: recebe JSON, devolve jsonify(...)
    # com o código HTTP certo, e é protegida por @admin_required (feito
    # em routes.py), não mais por exigir_adm() com sessão.
    #
    # Ficam em endereços separados (/api/v1/...) para não conflitar com
    # as rotas antigas acima, que a página /moderacao ainda usa.
    # ========================================================================

    def api_aprovar_categoria(self):
        """
        POST /api/v1/moderacao/categorias/aprovar
        Corpo esperado: {"categoria_id": <id>}
        """
        dados = request.get_json(silent=True) or {}
        categoria_id = dados.get("categoria_id")
        if not categoria_id:
            return jsonify({"erro": "categoria_id é obrigatório."}), 400

        if not self.__categoria_dao.aprovar_categoria(categoria_id):
            return jsonify({"erro": "Categoria não encontrada ou já processada."}), 404

        return jsonify({"mensagem": "Categoria aprovada com sucesso."}), 200

    # ------------------------------------------------------------------------
    # Moderação em JSON para a página /moderacao do React (só admin,
    # @admin_required em routes.py). Mesmas regras e mensagens das rotas
    # antigas aprovar_remedio / rejeitar_remedio lá em cima.
    # ------------------------------------------------------------------------

    def api_moderacao(self):
        """GET /api/v1/moderacao -> { remedios: [pendentes], categorias: [pendentes] }"""
        remedios = self.__remedio_dao.listar_remedios_pendentes()
        categorias = self.__categoria_dao.listar_categorias_pendentes()
        return jsonify({
            "remedios": [remedio_para_lista(r) for r in remedios],
            "categorias": [c.to_dict() for c in categorias],
        }), 200

    def api_aprovar_remedio(self):
        """POST /api/v1/moderacao/medicamentos/aprovar  — corpo {"remedio_id": <id>}"""
        dados = request.get_json(silent=True) or {}
        remedio_id = dados.get("remedio_id")
        if not remedio_id:
            return jsonify({"mensagem": "Remédio inválido."}), 400
        if not self.__remedio_dao.aprovar_remedio(remedio_id):
            return jsonify({"mensagem": "Erro ao aprovar pedido de remédio."}), 404
        return jsonify({"mensagem": "Pedido de remédio aprovado com sucesso."}), 200

    def api_rejeitar_remedio(self):
        """POST /api/v1/moderacao/medicamentos/rejeitar — corpo {"remedio_id": <id>}
        Igual ao antigo: rejeitar = apagar o pedido do banco."""
        dados = request.get_json(silent=True) or {}
        remedio_id = dados.get("remedio_id")
        if not remedio_id:
            return jsonify({"mensagem": "Remédio inválido."}), 400
        if not self.__remedio_dao.rejeitar_remedio(remedio_id):
            return jsonify({"mensagem": "Erro ao rejeitar pedido de remédio."}), 404
        return jsonify({"mensagem": "Pedido de remédio rejeitado com sucesso."}), 200

    def api_rejeitar_categoria(self):
        """
        POST /api/v1/moderacao/categorias/rejeitar
        Corpo esperado: {"categoria_id": <id>}
        """
        dados = request.get_json(silent=True) or {}
        categoria_id = dados.get("categoria_id")
        if not categoria_id:
            return jsonify({"erro": "categoria_id é obrigatório."}), 400

        if not self.__categoria_dao.rejeitar_categoria(categoria_id):
            return jsonify({"erro": "Categoria não encontrada ou já processada."}), 404

        return jsonify({"mensagem": "Categoria rejeitada com sucesso."}), 200

    # ========================================================================
    # API JSON (3º bimestre) — Aluno 1
    # ------------------------------------------------------------------------
    # A partir daqui os métodos não usam mais `session`/cookie nem
    # `render_template` com dado nenhum: eles recebem JSON (request.get_json)
    # e devolvem JSON (jsonify), sempre com o código HTTP certo. É essa
    # API que o JavaScript (fetch) chama para logar, cadastrar e listar
    # usuários. Em nenhum lugar aqui devolvemos a senha (nem o hash) no
    # JSON de resposta — só nome, e-mail e tipo.
    # ========================================================================

    def api_registro(self):
        """
        POST /api/v1/auth/registro
        Cria um UsuarioComum novo. Não loga automaticamente: quem cadastrou
        precisa chamar /api/v1/auth/login depois (o token só nasce no
        login, ver token_utils.gerar_token).
        """
        dados = request.get_json(silent=True) or {}
        nome = (dados.get("nome") or "").strip()
        email = (dados.get("email") or "").strip().lower()
        senha = dados.get("senha") or ""

        if not nome or not email or not senha:
            return jsonify({"erro": "Nome, e-mail e senha são obrigatórios."}), 400

        if len(senha) < 6:
            return jsonify({"erro": "A senha deve ter no mínimo 6 caracteres."}), 400

        if self.__dao.buscar_usuario_por_email(email):
            # 409 = conflito: já existe alguém com esse e-mail.
            return jsonify({"erro": "Já existe um usuário cadastrado com esse e-mail."}), 409

        # A senha nunca é guardada em texto puro: generate_password_hash
        # devolve um hash (uma "impressão digital" da senha) que não dá
        # para reverter. É esse hash que vai para o banco.
        senha_hash = generate_password_hash(senha)
        novo_usuario = UsuarioFactory.criar("comum", email, senha_hash, nome)
        self.__dao.salvar_usuario(novo_usuario)

        return jsonify({
            "mensagem": "Usuário cadastrado com sucesso.",
            "usuario": {"nome": novo_usuario.nome, "email": novo_usuario.email, "tipo": novo_usuario.tipo()}
        }), 201

    def api_login(self):
        """
        POST /api/v1/auth/login
        Confere e-mail/senha e, se estiver certo, CRIA o token (é aqui que
        ele nasce, dentro de gerar_token) e devolve ele no JSON de
        resposta. É esse token que o JavaScript vai guardar no navegador.
        """
        dados = request.get_json(silent=True) or {}
        email = (dados.get("email") or "").strip().lower()
        senha = dados.get("senha") or ""

        if not email or not senha:
            return jsonify({"erro": "E-mail e senha são obrigatórios."}), 400

        usuario = self.__dao.buscar_usuario_por_email(email)
        # check_password_hash compara a senha digitada com o hash salvo no
        # banco, sem nunca descobrir a senha original.
        if not usuario or not check_password_hash(usuario.senha, senha):
            return jsonify({"erro": "E-mail ou senha incorretos."}), 401

        # --- aqui o token é gerado e sai do servidor pela 1ª vez ---
        token = gerar_token(usuario)
        payload = conferir_token(token)

        return jsonify({
            "mensagem": "Login realizado com sucesso.",
            "token": token,
            # Horário em que este token vence (30 min a partir de agora) e
            # quantos segundos faltam (contados no servidor). O React usa os
            # segundos para o aviso de 5 minutos e para deslogar.
            "expira_em": expira_em_iso(payload),
            "segundos_para_expirar": segundos_para_expirar(payload),
            "usuario": {"nome": usuario.nome, "email": usuario.email, "adm": usuario.tipo() == "adm"}
        }), 200

    def api_logout(self):
        """
        POST /api/v1/auth/logout
        Protegida por @login_required (só quem tem token válido pode
        chamar). Como o token é JWT (sem estado guardado no servidor), o
        Flask não tem como "cancelar" um token que já foi entregue.

        Escolha adotada aqui (para colocar no README.md, como pede o item
        3.2 da especificação): o logout é feito só do lado do cliente —
        o JavaScript apaga o token do localStorage depois que essa rota
        responder 200. O token antigo continuaria matematicamente válido
        até a hora de expiração (30 min, ver VALIDADE_DO_TOKEN em
        token_utils.py), mas como ninguém mais vai reenviá-lo, na prática
        o usuário já está deslogado.
        """
        return jsonify({"mensagem": "Logout efetuado. Apague o token salvo no navegador."}), 200

    def api_me(self):
        """
        GET /api/v1/auth/me
        Protegida por @login_required. Diz quem está logado e se é
        administrador.

        Importante: em vez de simplesmente devolver o que já veio dentro
        do token (g.usuario_token), esta rota busca o usuário DE NOVO no
        banco pelo e-mail (g.usuario_token["sub"]). Assim, se um
        administrador tirar os poderes de alguém depois que o token foi
        emitido, essa rota já reflete a situação atual — o front-end nunca
        deve confiar em um campo lido direto do token no navegador,
        apenas na resposta desta rota (é literalmente o que a
        especificação pede no item 1.5).
        """
        email_logado = g.usuario_token["sub"]
        usuario = self.__dao.buscar_usuario_por_email(email_logado)
        if not usuario:
            return jsonify({"erro": "Usuário do token não existe mais."}), 401

        return jsonify({
            "nome": usuario.nome,
            "email": usuario.email,
            "adm": usuario.tipo() == "adm",
            # Quando o token que veio neste pedido vence. Assim, mesmo
            # depois de recarregar a página, o React sabe quanto tempo falta.
            "expira_em": expira_em_iso(g.usuario_token),
            "segundos_para_expirar": segundos_para_expirar(g.usuario_token),
        }), 200

    def api_listar_usuarios(self):
        """
        GET /api/v1/usuarios
        Protegida por @admin_required (só administrador acessa - 401 sem
        login, 403 se não for admin). Lista todo mundo, sem devolver
        senha nenhuma.
        """
        usuarios = self.__dao.listar_usuarios()
        lista = [
            {"email": u["email"], "nome": u["nome_user"], "adm": u["tipo"] == "adm"}
            for u in usuarios
        ]
        return jsonify(lista), 200

    def api_editar_usuario(self, id):
        """
        PUT /api/v1/usuarios/<id>
        Protegida por @admin_required. Como a tabela USUARIOS usa o
        e-mail como chave primária (não existe uma coluna numérica "id"
        nela), o <id> da URL é o e-mail do usuário sendo editado.

        Só o administrador chega até aqui (o decorador @admin_required já
        barrou com 401/403 quem não pode), então "só o admin pode
        promover alguém" já fica garantido pela própria rota.
        Campos aceitos no JSON do corpo:
          - nome        (opcional) novo nome
          - senha       (opcional) nova senha (será re-criptografada)
          - tornar_adm  (opcional) true/false para promover/rebaixar
        """
        dados = request.get_json(silent=True) or {}
        usuario_alvo = self.__dao.buscar_usuario_por_email(id)
        if not usuario_alvo:
            return jsonify({"erro": "Usuário não encontrado."}), 404

        nome = dados.get("nome")
        senha = dados.get("senha")
        tornar_adm = dados.get("tornar_adm")

        # Mesma trava da rota antiga rebaixar_usuario: o admin não pode tirar
        # o próprio cargo (senão o sistema poderia ficar sem administrador).
        if tornar_adm is False and usuario_alvo.email == g.usuario_token.get("sub"):
            return jsonify({"erro": "Você não pode rebaixar seu próprio usuário."}), 400

        if nome is not None and not str(nome).strip():
            return jsonify({"erro": "Nome inválido."}), 400
        if senha is not None and len(senha) < 6:
            return jsonify({"erro": "A senha deve ter no mínimo 6 caracteres."}), 400

        novo_nome = nome.strip() if nome else usuario_alvo.nome
        novo_hash_senha = generate_password_hash(senha) if senha else usuario_alvo.senha
        self.__dao.atualizar_usuario_com_senha(usuario_alvo.email, novo_nome, novo_hash_senha)

        if tornar_adm is True:
            self.__dao.promover_para_adm(usuario_alvo.email)
        elif tornar_adm is False:
            self.__dao.rebaixar_para_comum(usuario_alvo.email)

        usuario_atualizado = self.__dao.buscar_usuario_por_email(usuario_alvo.email)
        return jsonify({
            "mensagem": "Usuário atualizado com sucesso.",
            "usuario": {
                "nome": usuario_atualizado.nome,
                "email": usuario_atualizado.email,
                "adm": usuario_atualizado.tipo() == "adm"
            }
        }), 200

    # ========================================================================
    # FAVORITOS (API JSON) — usados pelo coração dos cards, do detalhe e
    # pelo selo com a quantidade de favoritos na navbar
    # ========================================================================

    def api_listar_favoritos(self):
        """
        GET /api/favoritos  (@login_required)
        Lista os remédios favoritos de quem está logado (e-mail vem do token).
        """
        email = g.usuario_token["sub"]
        favoritos = self.__dao.carregar_favoritos_usuario(email)
        return jsonify([remedio_para_lista(r, favorito=True) for r in favoritos]), 200

    def api_alternar_favorito(self, remedio_id):
        """
        POST /api/favoritos/<id>  (@login_required)
        Se já é favorito, tira; se não é, coloca (mesma lógica do favoritar
        antigo, com as mesmas mensagens).
        """
        email = g.usuario_token["sub"]
        if not self.__remedio_dao.buscar_remedio_por_id(remedio_id):
            return jsonify({"mensagem": "Remédio não encontrado!"}), 404

        if self.__dao.is_favorito(email, remedio_id):
            self.__dao.remover_favorito(email, remedio_id)
            return jsonify({"favorito": False, "mensagem": "Removido dos favoritos!"}), 200

        self.__dao.adicionar_favorito(email, remedio_id)
        return jsonify({"favorito": True, "mensagem": "Adicionado aos favoritos!"}), 200

    # ========================================================================
    # PERFIL E SENHA (API JSON) — páginas /conta/editar, /esqueci-senha e
    # /redefinir-senha do React. Mesmas regras e mensagens das rotas antigas
    # editar_usuario / solicitar_reset / redefinir_senha.
    # ========================================================================

    def api_editar_perfil(self):
        """
        PUT /api/v1/auth/perfil  (@login_required) — JSON {nome, nova_senha, confirm_senha}
        Igual ao antigo: muda o nome e, se vier nova senha, troca a senha sem
        pedir a atual. O e-mail não muda. A senha atual NÃO é mais mostrada
        (o banco só guarda o hash, que não dá para reverter).
        """
        email = g.usuario_token["sub"]
        usuario = self.__dao.buscar_usuario_por_email(email)
        if not usuario:
            return jsonify({"erro": "Usuário do token não existe mais."}), 401

        dados = request.get_json(silent=True) or {}
        nome = (dados.get("nome") or "").strip()
        nova_senha = (dados.get("nova_senha") or "").strip()
        confirm_senha = (dados.get("confirm_senha") or "").strip()

        if nova_senha and nova_senha != confirm_senha:
            return jsonify({"erro": "Nova senha e confirmação não coincidem."}), 400
        if nova_senha and len(nova_senha) < 6:
            # mesma regra do cadastro (api_registro)
            return jsonify({"erro": "A senha deve ter no mínimo 6 caracteres."}), 400

        if nome:
            usuario.nome = nome
        if nova_senha:
            usuario.senha = generate_password_hash(nova_senha)

        self.__dao.atualizar_usuario_com_senha(email, usuario.nome, usuario.senha)
        return jsonify({
            "mensagem": "Perfil atualizado com sucesso!",
            "usuario": {"nome": usuario.nome, "email": usuario.email, "adm": usuario.tipo() == "adm"},
        }), 200

    def api_esqueci_senha(self):
        """
        POST /api/v1/auth/esqueci-senha — JSON {email}
        Igual ao antigo: responde sempre a mesma mensagem genérica (não conta
        se o e-mail existe). Se existir, cria o token (30 min) e manda o
        e-mail com o link da página do REACT: FRONTEND_URL do .env
        (padrão http://localhost:5173, o mesmo endereço liberado no CORS).
        O endereço vem do .env e NUNCA do pedido, para ninguém conseguir
        trocar o link do e-mail por um site falso.
        """
        dados = request.get_json(silent=True) or {}
        email = (dados.get("email") or "").strip().lower()
        mensagem_generica = ("Se esse e-mail estiver cadastrado, você receberá "
                             "as instruções em breve.")

        usuario = self.__dao.buscar_usuario_por_email(email) if email else None
        if usuario:
            token = secrets.token_urlsafe(32)
            expira_em = datetime.now() + timedelta(minutes=30)
            self.__dao.salvar_token_reset(email, token, expira_em)
            frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173").rstrip("/")
            link = f"{frontend_url}/redefinir-senha/{token}"
            try:
                self._enviar_email_reset(email, link)
            except Exception as e:
                current_app.logger.error(f"Erro ao enviar e-mail de reset: {e}")
                return jsonify({"mensagem": "Ocorreu um erro ao enviar o e-mail. Tente novamente."}), 500

        return jsonify({"mensagem": mensagem_generica}), 200

    def api_conferir_token_reset(self, token):
        """GET /api/v1/auth/redefinir-senha/<token> — o link ainda vale?"""
        if not self.__dao.buscar_token_reset(token):
            return jsonify({"mensagem": "Link inválido ou expirado. Solicite um novo."}), 400
        return jsonify({"valido": True}), 200

    def api_redefinir_senha(self, token):
        """POST /api/v1/auth/redefinir-senha/<token> — JSON {senha, confirmar_senha}"""
        dado = self.__dao.buscar_token_reset(token)
        if not dado:
            return jsonify({"mensagem": "Link inválido ou expirado. Solicite um novo."}), 400

        dados = request.get_json(silent=True) or {}
        nova_senha = dados.get("senha") or ""
        confirmar = dados.get("confirmar_senha") or ""

        if len(nova_senha) < 6:
            return jsonify({"mensagem": "A senha deve ter no mínimo 6 caracteres."}), 400
        if nova_senha != confirmar:
            return jsonify({"mensagem": "As senhas não coincidem."}), 400

        self.__dao.atualizar_senha(dado["email"], generate_password_hash(nova_senha))
        self.__dao.marcar_token_usado(token)
        return jsonify({"mensagem": "Senha redefinida com sucesso! Faça login."}), 200
