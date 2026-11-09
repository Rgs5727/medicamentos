from .models import Usuario, UsuarioComum, UsuarioADM
from .factory import UsuarioFactory
from blueprints.remedies.factory import RemedioFactory
from blueprints.base.dao import BaseDAO


class UsuarioDAO(BaseDAO):

    def __init__(self):
        super().__init__()

    def buscar_usuario_por_email(self, email):
        sql = 'SELECT email, senha, nome_user, tipo FROM USUARIOS WHERE email = %s'
        conexao = self._get_connection()
        cursor = conexao.cursor(dictionary=True)
        try:
            cursor.execute(sql, (email,))
            linha = cursor.fetchone()
            if linha:
                return UsuarioFactory.criar(linha['tipo'], linha['email'], linha['senha'], linha['nome_user'])
        finally:
            cursor.close()
            conexao.close()
        return None

    def salvar_usuario(self, usuario):
        if isinstance(usuario, UsuarioADM):
            sql = 'INSERT INTO USUARIOS (email, senha, nome_user, tipo) VALUES (%s, %s, %s, %s)'
            valores = (usuario.email, usuario.senha, usuario.nome, usuario.tipo())
        else:
            sql = 'INSERT INTO USUARIOS (email, senha, nome_user, tipo) VALUES (%s, %s, %s, %s)'
            valores = (usuario.email, usuario.senha, usuario.nome, usuario.tipo())

        conexao = self._get_connection()
        cursor = conexao.cursor()
        try:
            cursor.execute(sql, valores)
            conexao.commit()
        finally:
            cursor.close()
            conexao.close()

    def atualizar_usuario_com_senha(self, email, nome, senha_hash):
        sql = 'UPDATE USUARIOS SET nome_user = %s, senha = %s WHERE email = %s'
        conexao = self._get_connection()
        cursor = conexao.cursor()
        try:
            cursor.execute(sql, (nome, senha_hash, email))
            conexao.commit()
            return True
        finally:
            cursor.close()
            conexao.close()

    def adicionar_favorito(self, usuario_email, remedio_id):
        sql = 'INSERT IGNORE INTO FAVORITOS (usuario, id_medicamento) VALUES (%s, %s)'
        conexao = self._get_connection()
        cursor = conexao.cursor()
        try:
            cursor.execute(sql, (usuario_email, remedio_id))
            conexao.commit()
            return True
        finally:
            cursor.close()
            conexao.close()

    def remover_favorito(self, usuario_email, remedio_id):
        sql = 'DELETE FROM FAVORITOS WHERE usuario = %s AND id_medicamento = %s'
        conexao = self._get_connection()
        cursor = conexao.cursor()
        try:
            cursor.execute(sql, (usuario_email, remedio_id))
            conexao.commit()
            return True
        finally:
            cursor.close()
            conexao.close()

    def is_favorito(self, usuario_email, remedio_id):
        sql = 'SELECT COUNT(*) as count FROM FAVORITOS WHERE usuario = %s AND id_medicamento = %s'
        conexao = self._get_connection()
        cursor = conexao.cursor(dictionary=True)
        try:
            cursor.execute(sql, (usuario_email, remedio_id))
            result = cursor.fetchone()
            return result['count'] > 0
        finally:
            cursor.close()
            conexao.close()

    def carregar_favoritos_usuario(self, email):
        sql = '''
            SELECT m.id, m.nome, m.principio_ativo, m.lab_fabricacao, m.categoria,
            m.data_fabricacao, m.data_validade, m.descricao, m.valor,
            m.destaque, m.lancamento, m.promocao, m.imagem_url, m.tarjado, m.venda_livre,
            m.tipo, m.status, m.criado_por
            FROM MEDICAMENTOS m
            INNER JOIN FAVORITOS f ON m.id = f.id_medicamento
            WHERE f.usuario = %s
        '''
        lista_favoritos = []
        conexao = self._get_connection()
        cursor = conexao.cursor(dictionary=True)
        try:
            cursor.execute(sql, (email,))
            for linha in cursor.fetchall():
                # Correção: o 1º argumento é o TIPO do remédio (antes ia o texto da
                # tarja, e todo favorito virava "Venda Livre").
                remedio = RemedioFactory.criar(
                    linha['tipo'], linha['nome'], linha['principio_ativo'],
                    linha['lab_fabricacao'], linha['categoria'],
                    linha['data_fabricacao'], linha['data_validade'],
                    linha['descricao'], linha['valor'], linha['destaque'],
                    linha['lancamento'], linha['promocao'],
                    imagem_url=linha.get('imagem_url'), status_remedio=linha['status'], remedio_id=linha['id'],
                    tarjado=linha['tarjado'], venda_livre=linha['venda_livre'], criado_por=linha.get('criado_por')
                )
                lista_favoritos.append(remedio)
        finally:
            cursor.close()
            conexao.close()
        return lista_favoritos

    def salvar_token_reset(self, email, token, expira_em):
        conexao = self._get_connection()
        cursor = conexao.cursor()
        try:
            cursor.execute('DELETE FROM RESET_SENHA_TOKENS WHERE email = %s', (email,))
            cursor.execute(
                'INSERT INTO RESET_SENHA_TOKENS (email, token, expira_em) VALUES (%s, %s, %s)',
                (email, token, expira_em)
            )
            conexao.commit()
        finally:
            cursor.close()
            conexao.close()

    def buscar_token_reset(self, token):
        sql = ('SELECT email, token, expira_em, usado '
               'FROM RESET_SENHA_TOKENS '
               'WHERE token = %s AND usado = FALSE AND expira_em > NOW()')
        conexao = self._get_connection()
        cursor = conexao.cursor(dictionary=True)
        try:
            cursor.execute(sql, (token,))
            return cursor.fetchone()
        finally:
            cursor.close()
            conexao.close()

    def marcar_token_usado(self, token):
        conexao = self._get_connection()
        cursor = conexao.cursor()
        try:
            cursor.execute(
                'UPDATE RESET_SENHA_TOKENS SET usado = TRUE WHERE token = %s', (token,)
            )
            conexao.commit()
        finally:
            cursor.close()
            conexao.close()

    def atualizar_senha(self, email, nova_senha_hash):
        conexao = self._get_connection()
        cursor = conexao.cursor()
        try:
            cursor.execute(
                'UPDATE USUARIOS SET senha = %s WHERE email = %s',
                (nova_senha_hash, email)
            )
            conexao.commit()
            return cursor.rowcount > 0
        finally:
            cursor.close()
            conexao.close()

    def listar_usuarios(self):
        sql = 'SELECT email, nome_user, tipo FROM USUARIOS ORDER BY nome_user'
        conexao = self._get_connection()
        cursor = conexao.cursor(dictionary=True)
        try:
            cursor.execute(sql)
            return cursor.fetchall()
        finally:
            cursor.close()
            conexao.close()

    def promover_para_adm(self, email):
        sql = "UPDATE USUARIOS SET tipo = 'adm' WHERE email = %s"
        conexao = self._get_connection()
        cursor = conexao.cursor()
        try:
            cursor.execute(sql, (email,))
            conexao.commit()
            return cursor.rowcount > 0
        finally:
            cursor.close()
            conexao.close()

    def rebaixar_para_comum(self, email):
        sql = "UPDATE USUARIOS SET tipo = 'comum' WHERE email = %s"
        conexao = self._get_connection()
        cursor = conexao.cursor()
        try:
            cursor.execute(sql, (email,))
            conexao.commit()
            return cursor.rowcount > 0
        finally:
            cursor.close()
            conexao.close()