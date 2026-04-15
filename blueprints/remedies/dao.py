import os
from .models import Remedio, Categoria, Usuario, Comentario
import mysql.connector

class RemedioDAO:



    

    def __init__(self):
        self.__db_config = {
            'host': os.getenv('MYSQL_HOST'),
            'user': os.getenv('MYSQL_USER'),
            'password': os.getenv('MYSQL_PASSWORD'),
            'database': os.getenv('MYSQL_DATABASE'),
            'port': os.getenv('MYSQL_PORT')
        }

    def __get_connection(self):

        return mysql.connector.connect(**self.__db_config)

    @property
    def arquivo_caminho(self):
        return self.__arquivo_caminho


    @arquivo_caminho.setter
    def arquivo_caminho(self, v):
        self.__arquivo_caminho = v

    def carregar_remedios(self, termo_busca=None):
        sql = 'SELECT id, nome, principio_ativo, lab_fabricacao, categoria, data_fabricacao, data_validade, descricao, valor, destaque, lancamento, promocao, imagem_url FROM MEDICAMENTOS'
        valores = None

        if termo_busca:
            sql += ' WHERE nome LIKE %s'
            valores = ('%' + termo_busca + '%',)

        lista_remedios = []

        conexao = self.__get_connection()
        cursor = conexao.cursor(dictionary=True)
        try:
            if valores:
                cursor.execute(sql, valores)
            else:
                cursor.execute(sql)
            for linha in cursor.fetchall():
                remedio = Remedio(
                    linha['nome'],
                    linha['principio_ativo'],
                    linha['lab_fabricacao'],
                    linha['categoria'],
                    linha['data_fabricacao'],
                    linha['data_validade'],
                    linha['descricao'],
                    linha['valor'],
                    linha['destaque'],
                    linha['lancamento'],
                    linha['promocao'],
                    imagem_url=linha.get('imagem_url'),
                    remedio_id=linha['id']
                )
                lista_remedios.append(remedio)
        finally:
            cursor.close()
            conexao.close()
        return lista_remedios

    def salvar_remedio(self, novo_remedio):
        sql = 'INSERT INTO MEDICAMENTOS (nome, principio_ativo, lab_fabricacao, categoria, data_fabricacao, data_validade, descricao, valor, destaque, lancamento, promocao, imagem_url) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)'

        valores = (
            novo_remedio.nome_remedio,
            novo_remedio.principio_remedio,
            novo_remedio.lab_remedio,
            novo_remedio.categoria_remedio,
            novo_remedio.dataFab_remedio,
            novo_remedio.dataVal_remedio,
            novo_remedio.descricao_remedio,
            novo_remedio.valor_remedio,
            novo_remedio.destaque_remedio,
            novo_remedio.lancamento_remedio,
            novo_remedio.promocao_remedio,
            novo_remedio.imagem_url
            )        
        conexao = self.__get_connection()
        cursor = conexao.cursor()

        try:
            cursor.execute(sql, valores)
            conexao.commit()
            novo_remedio.remedio_id = cursor.lastrowid
        finally:
            cursor.close()
            conexao.close()

        return novo_remedio.remedio_id

    def buscar_remedio_por_id(self, id_remedio):
        sql = 'SELECT id, nome, principio_ativo, lab_fabricacao, categoria, data_fabricacao, data_validade, descricao, valor, destaque, lancamento, promocao, imagem_url FROM MEDICAMENTOS WHERE id = %s'
        valores = (id_remedio,)

        conexao = self.__get_connection()
        cursor = conexao.cursor(dictionary=True)

        try:
            cursor.execute(sql, valores)
            linha = cursor.fetchone()
            if linha:
                return Remedio(
                    linha['nome'],
                    linha['principio_ativo'],
                    linha['lab_fabricacao'],
                    linha['categoria'],
                    linha['data_fabricacao'],
                    linha['data_validade'],
                    linha['descricao'],
                    linha['valor'],
                    linha['destaque'],
                    linha['lancamento'],
                    linha['promocao'],
                    imagem_url=linha.get('imagem_url'),
                    remedio_id=linha['id']
                )

        finally: 
            cursor.close()
            conexao.close()
        return None


    def atualizar_remedio(self, remedio_atualizado):
        sql = 'UPDATE MEDICAMENTOS SET nome = %s, valor = %s, principio_ativo = %s, lab_fabricacao = %s, categoria = %s, data_fabricacao = %s, data_validade = %s, descricao = %s, destaque = %s, lancamento = %s, promocao = %s, imagem_url = %s WHERE id = %s'

        valores = (
            remedio_atualizado.nome_remedio,
            remedio_atualizado.valor_remedio,
            remedio_atualizado.principio_remedio,
            remedio_atualizado.lab_remedio,
            remedio_atualizado.categoria_remedio,
            remedio_atualizado.dataFab_remedio,
            remedio_atualizado.dataVal_remedio,
            remedio_atualizado.descricao_remedio,
            remedio_atualizado.destaque_remedio,
            remedio_atualizado.lancamento_remedio,
            remedio_atualizado.promocao_remedio,
            remedio_atualizado.imagem_url,
            remedio_atualizado.remedio_id
        )
        conexao = self.__get_connection()
        cursor = conexao.cursor()

        try:
            cursor.execute(sql, valores)
            conexao.commit()
            return remedio_atualizado.remedio_id  
        finally:
            cursor.close()
            conexao.close()
    
    def remover_remedio(self, id_remedio):
        sql = 'DELETE FROM MEDICAMENTOS WHERE id = %s'
        valores = [id_remedio]
        conexao = self.__get_connection()
        cursor = conexao.cursor()

        try:
            cursor.execute(sql, valores)
            conexao.commit()
        finally:

            cursor.close()

            conexao.close()

    def buscar_usuario_por_email(self, email):
        sql = 'SELECT email, senha, nome_user, adm FROM USUARIOS WHERE email = %s'
        valores = (email,)
        conexao = self.__get_connection()
        cursor = conexao.cursor(dictionary=True)

        try:
            cursor.execute(sql, valores)
            linha = cursor.fetchone()
            if linha:
                return Usuario(
                    linha['email'],
                    linha['senha'],
                    linha['nome_user'],
                    linha['adm']
                )
        finally:
            cursor.close()
            conexao.close()
        return None

    def salvar_usuario(self, usuario):
        sql = 'INSERT INTO USUARIOS (email, senha, nome_user, adm) VALUES (%s, %s, %s, %s)'
        valores = (
            usuario.email,
            usuario.senha,
            usuario.nome,
            usuario.adm
        )
        conexao = self.__get_connection()
        cursor = conexao.cursor()

        try:
            cursor.execute(sql, valores)
            conexao.commit()
        finally:
            cursor.close()
            conexao.close()

    def atualizar_usuario_com_senha(self, email, nome, senha_hash):
        sql = 'UPDATE USUARIOS SET nome_user = %s, senha = %s WHERE email = %s'
        valores = (nome, senha_hash, email)
        
        conexao = self.__get_connection()
        cursor = conexao.cursor()
        try:
            cursor.execute(sql, valores)
            conexao.commit()
            return True
        finally:
            cursor.close()
            conexao.close()
    
    def atualizar_usuario(self, atualizar_usuario):
        return self.atualizar_usuario_com_senha(atualizar_usuario.email, atualizar_usuario.nome, atualizar_usuario.senha)

    def salvar_comentario(self, comentario):
        sql = 'INSERT INTO COMENTARIOS (usuario, id_medicamento, texto) VALUES (%s, %s, %s)'
        valores = (
            comentario.usuario,
            comentario.comentario_med_id,
            comentario.texto
        )
        conexao = self.__get_connection()
        cursor = conexao.cursor()

        try:
            cursor.execute(sql, valores)
            conexao.commit()
            comentario.comentario_id = cursor.lastrowid
        finally:
            cursor.close()
            conexao.close()

    def buscar_comentario_por_id(self, id_comentario):
        sql = '''
            SELECT 
                c.id_comentario,
                c.usuario,
                c.id_medicamento,
                c.texto,
                u.nome_user
            FROM COMENTARIOS c
            LEFT JOIN USUARIOS u ON c.usuario = u.email
            WHERE c.id_comentario = %s
        '''

        valores = (id_comentario,)

        conexao = self.__get_connection()
        cursor = conexao.cursor(dictionary=True)

        try:
            cursor.execute(sql, valores)
            linha = cursor.fetchone()

            if linha:
                return Comentario(
                    usuario=linha['usuario'],
                    texto=linha['texto'],
                    comentario_id=linha['id_comentario'],
                    comentario_med_id=linha['id_medicamento'],
                    usuario_nome=linha['nome_user']
                )
        finally:
            cursor.close()
            conexao.close()

        return None
    
    def carregar_comentarios_por_medicamento(self):
        sql = '''
            SELECT c.id_comentario, c.usuario, u.nome_user, c.id_medicamento, c.texto
            FROM COMENTARIOS c
            LEFT JOIN USUARIOS u ON c.usuario = u.email
        '''
        conexao = self.__get_connection()
        cursor = conexao.cursor(dictionary=True)
        comentarios = []

        try:
            cursor.execute(sql)
            for linha in cursor.fetchall():
                comentario = Comentario(
                    linha['usuario'],
                    linha['texto'],
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

    def editar_comentario(self, comentario_atualizado):
        sql = 'UPDATE COMENTARIOS SET texto = %s WHERE id_comentario = %s'

        valores = (
            comentario_atualizado.texto,
            comentario_atualizado.comentario_id
        )

        conexao = self.__get_connection()
        cursor = conexao.cursor()

        try:
            cursor.execute(sql, valores)
            conexao.commit()
            return comentario_atualizado.comentario_id  
        finally:
            cursor.close()
            conexao.close()
        
    def excluir_comentario(self, comentario_id):
        sql = 'DELETE FROM COMENTARIOS WHERE id_comentario = %s'
        valores = (comentario_id,)

        conexao = self.__get_connection()
        cursor = conexao.cursor()

        try:
            cursor.execute(sql, valores)
            conexao.commit()
        finally:
            cursor.close()
            conexao.close()
            

    def carregar_categoria(self):
        sql = 'SELECT id_categoria, nome FROM CATEGORIAS'

        lista_categorias = []

        conexao = self.__get_connection()

        cursor = conexao.cursor(dictionary=True)
        try:
            cursor.execute(sql)
            for linha in cursor.fetchall():
                categoria = Categoria(
                    linha['nome'],
                    id_categoria=linha['id_categoria']
                )
                lista_categorias.append(categoria)
        finally: 
            cursor.close()
            conexao.close()
        return lista_categorias

    def salvar_categoria(self, nova_categoria):
        sql = 'INSERT INTO CATEGORIAS (nome) VALUES (%s)'

        valores = (
            nova_categoria.nome_categoria,
            )        
        conexao = self.__get_connection()
        cursor = conexao.cursor()

        try:
            cursor.execute(sql, valores)
            conexao.commit()
            nova_categoria.id_categoria = cursor.lastrowid
        finally:
            cursor.close()
            conexao.close()

        return nova_categoria.id_categoria

    def buscar_categoria_por_id(self, id_categoria):
        sql = 'SELECT id_categoria, nome FROM CATEGORIAS WHERE id_categoria = %s'
        valores = (id_categoria,)

        conexao = self.__get_connection()
        cursor = conexao.cursor(dictionary=True)

        try:
            cursor.execute(sql, valores)
            linha = cursor.fetchone()
            if linha:
                return Categoria(
                    linha['nome'],
                    id_categoria=linha['id_categoria']
                )

        finally: 
            cursor.close()
            conexao.close()
        return None

    def buscar_categoria_por_nome(self, nome_categoria):
        sql = 'SELECT id_categoria, nome FROM CATEGORIAS WHERE LOWER(nome) = LOWER(%s)'
        valores = (nome_categoria,)

        conexao = self.__get_connection()
        cursor = conexao.cursor(dictionary=True)

        try:
            cursor.execute(sql, valores)
            linha = cursor.fetchone()
            if linha:
                return Categoria(
                    linha['nome'],
                    id_categoria=linha['id_categoria']
                )
        finally:
            cursor.close()
            conexao.close()
        return None


    def atualizar_categoria(self, categoria_atualizada):
        sql = 'UPDATE CATEGORIAS SET nome = %s WHERE id_categoria = %s'

        valores = (
            categoria_atualizada.nome_categoria,
            categoria_atualizada.id_categoria
        )
        conexao = self.__get_connection()
        cursor = conexao.cursor()

        try:
            cursor.execute(sql, valores)
            conexao.commit()
            return categoria_atualizada.id_categoria  
        finally:
            cursor.close()
            conexao.close()
    
    def remover_categoria(self, id_categoria):
        sql = 'DELETE FROM CATEGORIAS WHERE id_categoria = %s'
        valores = [id_categoria]
        conexao = self.__get_connection()
        cursor = conexao.cursor()

        try:
            cursor.execute(sql, valores)
            conexao.commit()
        finally:
            cursor.close()
            conexao.close()

    def carregar_favoritos(self):
        sql = 'SELECT usuario, id_medicamento FROM FAVORITOS'

        lista_favoritos = []

        conexao = self.__get_connection()

        cursor = conexao.cursor(dictionary=True)
        try:
            cursor.execute(sql)
            for linha in cursor.fetchall():
                categoria = Categoria(
                    usuario=linha['usuario'],
                    id_medicamento=linha['id_categoria']
                )
                lista_favoritos.append(categoria)
        finally:
            cursor.close()
            conexao.close()
        return lista_favoritos

    def adicionar_favorito(self, usuario_email, remedio_id):
        sql = 'INSERT IGNORE INTO FAVORITOS (usuario, id_medicamento) VALUES (%s, %s)'
        valores = (usuario_email, remedio_id)
        conexao = self.__get_connection()
        cursor = conexao.cursor()
        try:
            cursor.execute(sql, valores)
            conexao.commit()
            return True
        finally:
            cursor.close()
            conexao.close()
    
    def remover_favorito(self, usuario_email, remedio_id):
        sql = 'DELETE FROM FAVORITOS WHERE usuario = %s AND id_medicamento = %s'
        valores = (usuario_email, remedio_id)
        conexao = self.__get_connection()
        cursor = conexao.cursor()
        try:
            cursor.execute(sql, valores)
            conexao.commit()
            return True
        finally:
            cursor.close()
            conexao.close()

    def carregar_favoritos_usuario(self, email):
        sql = '''
            SELECT m.id, m.nome, m.principio_ativo, m.lab_fabricacao, m.categoria, 
            m.data_fabricacao, m.data_validade, m.descricao, m.valor, 
            m.destaque, m.lancamento, m.promocao, m.imagem_url 
            FROM MEDICAMENTOS m 
            INNER JOIN FAVORITOS f ON m.id = f.id_medicamento 
            WHERE f.usuario = %s
        '''
        valores = (email,)

        lista_favoritos = []
        conexao = self.__get_connection()
        cursor = conexao.cursor(dictionary=True)
        try:
            cursor.execute(sql, valores)
            for linha in cursor.fetchall():
                remedio = Remedio(
                    linha['nome'],
                    linha['principio_ativo'],
                    linha['lab_fabricacao'],
                    linha['categoria'],
                    linha['data_fabricacao'],
                    linha['data_validade'],
                    linha['descricao'],
                    linha['valor'],
                    linha['destaque'],
                    linha['lancamento'],
                    linha['promocao'],
                    imagem_url=linha.get('imagem_url'),
                    remedio_id=linha['id']
                )
                lista_favoritos.append(remedio)
        finally:
            cursor.close()
            conexao.close()
        return lista_favoritos

    def is_favorito(self, usuario_email, remedio_id):
        sql = 'SELECT COUNT(*) as count FROM FAVORITOS WHERE usuario = %s AND id_medicamento = %s'
        valores = (usuario_email, remedio_id)
        conexao = self.__get_connection()
        cursor = conexao.cursor(dictionary=True)
        try:
            cursor.execute(sql, valores)
            result = cursor.fetchone()
            return result['count'] > 0
        finally:
            cursor.close()
            conexao.close()

