import os
from .models import Comentario
from blueprints.base.dao import BaseDAO

import mysql.connector

class ComentarioDAO(BaseDAO):
    def __init__(self):
        super().__init__()


    def salvar_comentario(self, comentario):
        sql = 'INSERT INTO COMENTARIOS (usuario, id_medicamento, texto) VALUES (%s, %s, %s)'
        valores = (
            comentario.usuario,
            comentario.comentario_med_id,
            comentario.texto,
        )

        conexao = self._get_connection()
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
                u.nome_user,
                m.nome AS remedio_nome
            FROM COMENTARIOS c
            LEFT JOIN USUARIOS u ON c.usuario = u.email
            LEFT JOIN MEDICAMENTOS m ON c.id_medicamento = m.id
            WHERE c.id_comentario = %s
        '''

        valores = (id_comentario,)

        conexao = self._get_connection()
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
                    usuario_nome=linha['nome_user'],
                    remedio_nome=linha.get('remedio_nome')
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

        conexao = self._get_connection()
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

    def carregar_comentarios_do_medicamento(self, remedio_id):
        """Comentários de UM remédio (usado pela página de detalhe do React)."""
        sql = '''
            SELECT c.id_comentario, c.usuario, u.nome_user, c.id_medicamento, c.texto
            FROM COMENTARIOS c
            LEFT JOIN USUARIOS u ON c.usuario = u.email
            WHERE c.id_medicamento = %s
            ORDER BY c.id_comentario
        '''
        conexao = self._get_connection()
        cursor = conexao.cursor(dictionary=True)
        comentarios = []
        try:
            cursor.execute(sql, (remedio_id,))
            for linha in cursor.fetchall():
                comentarios.append(Comentario(
                    linha['usuario'],
                    linha['texto'],
                    comentario_id=linha['id_comentario'],
                    comentario_med_id=linha['id_medicamento'],
                    usuario_nome=linha['nome_user']
                ))
        finally:
            cursor.close()
            conexao.close()
        return comentarios

    def listar_comentarios_pendentes(self):
        sql = '''
            SELECT c.id_comentario, c.usuario, u.nome_user, c.id_medicamento, c.texto, m.nome AS remedio_nome
            FROM COMENTARIOS c
            LEFT JOIN USUARIOS u ON c.usuario = u.email
            LEFT JOIN MEDICAMENTOS m ON c.id_medicamento = m.id
            ORDER BY c.id_comentario DESC
        '''
        conexao = self._get_connection()
        cursor = conexao.cursor(dictionary=True)
        comentarios = []
        try:
            cursor.execute(sql)
            for linha in cursor.fetchall():
                comentarios.append(Comentario(
                    usuario=linha['usuario'],
                    texto=linha['texto'],
                    comentario_id=linha['id_comentario'],
                    comentario_med_id=linha['id_medicamento'],
                    usuario_nome=linha['nome_user'],
                    remedio_nome=linha.get('remedio_nome')
                ))
            return comentarios
        finally:
            cursor.close()
            conexao.close()

    def editar_comentario(self, comentario_atualizado):
        sql = 'UPDATE COMENTARIOS SET texto = %s WHERE id_comentario = %s'

        valores = (
            comentario_atualizado.texto,
            comentario_atualizado.comentario_id
        )

        conexao = self._get_connection()
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

        conexao = self._get_connection()
        cursor = conexao.cursor()

        try:
            cursor.execute(sql, valores)
            conexao.commit()
        finally:
            cursor.close()
            conexao.close()
            

