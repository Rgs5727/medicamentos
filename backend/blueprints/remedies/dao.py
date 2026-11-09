from .models import Remedio, Tarjado, Venda
from blueprints.comentarios.models import Comentario
from blueprints.base.dao import BaseDAO
from .factory import RemedioFactory


class RemedioDAO(BaseDAO):

    def __init__(self):
        super().__init__()

    def carregar_remedios(self, termo_busca=None):
        sql = '''
            SELECT m.id, m.nome, m.principio_ativo, m.lab_fabricacao, m.categoria,
            m.data_fabricacao, m.data_validade, m.descricao, m.valor, m.destaque,
            m.lancamento, m.promocao, m.status, m.imagem_url, m.tarjado, m.venda_livre, m.tipo,
            m.criado_por
            FROM MEDICAMENTOS m
            WHERE m.status = TRUE
            '''

        valores = None

        if termo_busca:
            sql += ' AND m.nome LIKE %s'
            valores = ('%' + termo_busca + '%',)

        lista_remedios = {}
        conexao = self._get_connection()
        cursor = conexao.cursor(dictionary=True)
        try:
            cursor.execute(sql, valores) if valores else cursor.execute(sql)
            for linha in cursor.fetchall():
                lid = linha["id"]
                if lid not in lista_remedios:
                    lista_remedios[lid] = RemedioFactory.criar(
                        linha['tipo'], linha['nome'], linha['principio_ativo'],
                        linha['lab_fabricacao'], linha['categoria'],
                        linha['data_fabricacao'], linha['data_validade'],
                        linha['descricao'], linha['valor'], linha['destaque'],
                        linha['lancamento'], linha['promocao'], linha['status'],
                        imagem_url=linha.get('imagem_url'), remedio_id=linha['id'],
                        tarjado=linha['tarjado'], venda_livre=linha['venda_livre'], criado_por=linha.get('criado_por')
                    )
        finally:
            cursor.close()
            conexao.close()
        return list(lista_remedios.values())

    def salvar_remedio(self, novo_remedio):
        if isinstance(novo_remedio, Tarjado):
            sql = ('INSERT INTO MEDICAMENTOS (nome, principio_ativo, lab_fabricacao, categoria, '
                'data_fabricacao, data_validade, descricao, valor, destaque, lancamento, '
                'promocao, status, imagem_url, tipo, tarjado, criado_por) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)')
            valores = (
                novo_remedio.nome_remedio, novo_remedio.principio_remedio,
                novo_remedio.lab_remedio, novo_remedio.categoria_remedio,
                novo_remedio.dataFab_remedio, novo_remedio.dataVal_remedio,
                novo_remedio.descricao_remedio, novo_remedio.valor_remedio,
                novo_remedio.destaque_remedio, novo_remedio.lancamento_remedio,
                novo_remedio.promocao_remedio, novo_remedio.status_remedio, novo_remedio.imagem_url, novo_remedio.tipo(), novo_remedio.tarjado,
                novo_remedio.criado_por
            )
        else:
            sql = ('INSERT INTO MEDICAMENTOS (nome, principio_ativo, lab_fabricacao, categoria, '
                'data_fabricacao, data_validade, descricao, valor, destaque, lancamento, '
                'promocao, status, imagem_url, tipo, venda_livre, criado_por) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)')
            valores = (
                novo_remedio.nome_remedio, novo_remedio.principio_remedio,
                novo_remedio.lab_remedio, novo_remedio.categoria_remedio,
                novo_remedio.dataFab_remedio, novo_remedio.dataVal_remedio,
                novo_remedio.descricao_remedio, novo_remedio.valor_remedio,
                novo_remedio.destaque_remedio, novo_remedio.lancamento_remedio,
                novo_remedio.promocao_remedio, novo_remedio.status_remedio, novo_remedio.imagem_url, novo_remedio.tipo(), novo_remedio.livre,
                novo_remedio.criado_por
            )

        conexao = self._get_connection()
        cursor = conexao.cursor()
        try:
            cursor.execute(sql, valores)
            conexao.commit()
            novo_remedio.remedio_id = cursor.lastrowid
        finally:
            cursor.close()
            conexao.close()
        return novo_remedio.remedio_id

    def listar_remedios_pendentes(self, criado_por=None):
        """
        Remédios ainda não aprovados. Sem criado_por: todos (moderação do admin).
        Com criado_por: só os pendentes daquele dono ("Meus pendentes").
        """
        sql = ('SELECT m.id, m.nome, m.principio_ativo, m.lab_fabricacao, m.categoria, '
               'm.data_fabricacao, m.data_validade, m.descricao, m.valor, m.destaque, '
               'm.lancamento, m.promocao, m.status, m.imagem_url, m.tarjado, m.venda_livre, m.tipo, m.criado_por '
               'FROM MEDICAMENTOS m WHERE m.status = FALSE')
        valores = ()
        if criado_por is not None:
            sql += ' AND m.criado_por = %s'
            valores = (criado_por,)
        sql += ' ORDER BY m.id DESC'
        conexao = self._get_connection()
        cursor = conexao.cursor(dictionary=True)
        remedios = []
        try:
            cursor.execute(sql, valores)
            for linha in cursor.fetchall():
                remedios.append(RemedioFactory.criar(
                    linha['tipo'], linha['nome'], linha['principio_ativo'],
                    linha['lab_fabricacao'], linha['categoria'],
                    linha['data_fabricacao'], linha['data_validade'],
                    linha['descricao'], linha['valor'], linha['destaque'],
                    linha['lancamento'], linha['promocao'], linha['status'],
                    imagem_url=linha.get('imagem_url'), remedio_id=linha['id'],
                    tarjado=linha['tarjado'], venda_livre=linha['venda_livre'], criado_por=linha.get('criado_por')
                ))
            return remedios
        finally:
            cursor.close()
            conexao.close()

    def contar_remedios_pendentes(self):
        sql = 'SELECT COUNT(*) AS total FROM MEDICAMENTOS WHERE status = FALSE'
        conexao = self._get_connection()
        cursor = conexao.cursor(dictionary=True)
        try:
            cursor.execute(sql)
            return cursor.fetchone()['total']
        finally:
            cursor.close()
            conexao.close()

    def aprovar_remedio(self, remedio_id):
        sql = 'UPDATE MEDICAMENTOS SET status = TRUE WHERE id = %s'
        conexao = self._get_connection()
        cursor = conexao.cursor()
        try:
            cursor.execute(sql, (remedio_id,))
            conexao.commit()
            return cursor.rowcount > 0
        finally:
            cursor.close()
            conexao.close()

    def rejeitar_remedio(self, remedio_id):
        return self.remover_remedio(remedio_id)

    def buscar_remedio_por_id(self, id_remedio):
        sql = ('SELECT m.id, m.nome, m.principio_ativo, m.lab_fabricacao, m.categoria, '
               'm.data_fabricacao, m.data_validade, m.descricao, m.valor, m.destaque, '
               'm.lancamento, m.promocao, m.status, m.imagem_url, m.tarjado, m.venda_livre, m.tipo, m.criado_por '
               'FROM MEDICAMENTOS m WHERE m.id = %s')
        conexao = self._get_connection()
        cursor = conexao.cursor(dictionary=True)
        remedio = None
        try:
            cursor.execute(sql, (id_remedio,))
            for linha in cursor.fetchall():
                if remedio is None:
                    remedio = RemedioFactory.criar(
                        linha['tipo'], linha['nome'], linha['principio_ativo'],
                        linha['lab_fabricacao'], linha['categoria'],
                        linha['data_fabricacao'], linha['data_validade'],
                        linha['descricao'], linha['valor'], linha['destaque'],
                        linha['lancamento'], linha['promocao'], linha['status'],
                        imagem_url=linha.get('imagem_url'), remedio_id=linha['id'],
                        tarjado=linha['tarjado'], venda_livre=linha['venda_livre'], criado_por=linha.get('criado_por')
                    )
            return remedio
        finally:
            cursor.close()
            conexao.close()

    def atualizar_remedio(self, remedio_atualizado):
        if isinstance(remedio_atualizado, Tarjado):
            sql = ('UPDATE MEDICAMENTOS SET nome = %s, valor = %s, principio_ativo = %s, '
                'lab_fabricacao = %s, categoria = %s, data_fabricacao = %s, '
                'data_validade = %s, descricao = %s, destaque = %s, lancamento = %s, '
                'promocao = %s, status = %s, imagem_url = %s, tipo = %s, tarjado = %s WHERE id = %s')
            valores = (
                remedio_atualizado.nome_remedio, remedio_atualizado.valor_remedio,
                remedio_atualizado.principio_remedio, remedio_atualizado.lab_remedio,
                remedio_atualizado.categoria_remedio, remedio_atualizado.dataFab_remedio,
                remedio_atualizado.dataVal_remedio, remedio_atualizado.descricao_remedio,
                remedio_atualizado.destaque_remedio, remedio_atualizado.lancamento_remedio,
                remedio_atualizado.promocao_remedio, remedio_atualizado.status_remedio, remedio_atualizado.imagem_url,
                remedio_atualizado.tipo(), remedio_atualizado.tarjado,
                remedio_atualizado.remedio_id
            )
        else:
            sql = ('UPDATE MEDICAMENTOS SET nome = %s, valor = %s, principio_ativo = %s, '
                'lab_fabricacao = %s, categoria = %s, data_fabricacao = %s, '
                'data_validade = %s, descricao = %s, destaque = %s, lancamento = %s, '
                'promocao = %s, status = %s, imagem_url = %s, tipo = %s, venda_livre = %s WHERE id = %s')
            valores = (
                remedio_atualizado.nome_remedio, remedio_atualizado.valor_remedio,
                remedio_atualizado.principio_remedio, remedio_atualizado.lab_remedio,
                remedio_atualizado.categoria_remedio, remedio_atualizado.dataFab_remedio,
                remedio_atualizado.dataVal_remedio, remedio_atualizado.descricao_remedio,
                remedio_atualizado.destaque_remedio, remedio_atualizado.lancamento_remedio,
                remedio_atualizado.promocao_remedio,remedio_atualizado.status_remedio, remedio_atualizado.imagem_url,
                remedio_atualizado.tipo(), remedio_atualizado.livre,
                remedio_atualizado.remedio_id
            )

        conexao = self._get_connection()
        cursor = conexao.cursor()
        try:
            cursor.execute(sql, valores)
            conexao.commit()
            return remedio_atualizado.remedio_id
        finally:
            cursor.close()
            conexao.close()

    def remover_remedio(self, id_remedio):
        conexao = self._get_connection()
        cursor = conexao.cursor()
        try:
            cursor.execute('DELETE FROM MEDICAMENTOS WHERE id = %s', (id_remedio,))
            conexao.commit()
            return cursor.rowcount > 0
        finally:
            cursor.close()
            conexao.close()

    def carregar_comentarios_por_medicamento(self):
        sql = '''
            SELECT c.id_comentario, c.usuario, u.nome_user, c.id_medicamento, c.texto
            FROM COMENTARIOS c
            LEFT JOIN USUARIOS u ON c.usuario = u.email
        '''
        conexao = self._get_connection()
        cursor = conexao.cursor(dictionary=True)
        comentarios = []
        try:
            cursor.execute(sql)
            for linha in cursor.fetchall():
                comentario = Comentario(
                    linha['usuario'], linha['texto'],
                    comentario_id=linha['id_comentario'],
                    comentario_med_id=linha['id_medicamento'],
                    usuario_nome=linha['nome_user']
                )
                comentarios.append(comentario)
        finally:
            cursor.close()
            conexao.close()

        comentarios_por_remedio = {}
        for comentario in comentarios:
            comentarios_por_remedio.setdefault(comentario.comentario_med_id, []).append(comentario)
        return comentarios_por_remedio

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