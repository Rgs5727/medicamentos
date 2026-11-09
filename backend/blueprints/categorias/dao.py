import os
from .models import Categoria
import mysql.connector
from blueprints.base.dao import BaseDAO

class CategoriaDAO(BaseDAO):

    def __init__(self):
        super().__init__()
        self._ensure_status_column()

    def _ensure_status_column(self):
        conexao = self._get_connection()
        cursor = conexao.cursor()
        try:
            cursor.execute(
                "SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS "
                "WHERE table_schema = DATABASE() "
                "AND table_name = 'CATEGORIAS' "
                "AND column_name = 'status'"
            )
            if cursor.fetchone()[0] == 0:
                cursor.execute(
                    "ALTER TABLE CATEGORIAS ADD COLUMN status BOOLEAN NOT NULL DEFAULT TRUE"
                )
                conexao.commit()
        except Exception as e:
            print(f"Erro ao garantir a coluna status em CATEGORIAS: {e}")
        finally:
            cursor.close()
            conexao.close()

    def carregar_categoria(self):
        sql = 'SELECT id_categoria, nome, status, criado_por FROM CATEGORIAS WHERE status = TRUE'

        lista_categorias = []

        conexao = self._get_connection()
        cursor = conexao.cursor(dictionary=True)
        try:
            cursor.execute(sql)
            for linha in cursor.fetchall():
                categoria = Categoria(
                    linha['nome'],
                    id_categoria=linha['id_categoria'],
                    status_categoria=linha['status'],
                    criado_por=linha.get('criado_por')
                )
                lista_categorias.append(categoria)
        finally:
            cursor.close()
            conexao.close()
        return lista_categorias

    def salvar_categoria(self, nova_categoria):
        sql = 'INSERT INTO CATEGORIAS (nome, status, criado_por) VALUES (%s, %s, %s)'

        valores = (
            nova_categoria.nome_categoria,
            nova_categoria.status_categoria,
            nova_categoria.criado_por,
        )

        conexao = self._get_connection()
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
        sql = 'SELECT id_categoria, nome, status, criado_por FROM CATEGORIAS WHERE id_categoria = %s'
        valores = (id_categoria,)

        conexao = self._get_connection()
        cursor = conexao.cursor(dictionary=True)

        try:
            cursor.execute(sql, valores)
            linha = cursor.fetchone()
            if linha:
                return Categoria(
                    linha['nome'],
                    id_categoria=linha['id_categoria'],
                    status_categoria=linha['status'],
                    criado_por=linha.get('criado_por')
                )

        finally:
            cursor.close()
            conexao.close()
        return None

    def buscar_categoria_por_nome(self, nome_categoria):
        sql = 'SELECT id_categoria, nome, status FROM CATEGORIAS WHERE LOWER(nome) = LOWER(%s)'
        valores = (nome_categoria,)

        conexao = self._get_connection()
        cursor = conexao.cursor(dictionary=True)

        try:
            cursor.execute(sql, valores)
            linha = cursor.fetchone()
            if linha:
                return Categoria(
                    linha['nome'],
                    id_categoria=linha['id_categoria'],
                    status_categoria=linha['status']
                )
        finally:
            cursor.close()
            conexao.close()
        return None

    def listar_categorias_pendentes(self, criado_por=None):
        """
        Categorias ainda não aprovadas. Sem criado_por: todas (moderação do admin).
        Com criado_por: só as pendentes daquele dono ("Minhas pendentes").
        """
        sql = 'SELECT id_categoria, nome, criado_por FROM CATEGORIAS WHERE status = FALSE'
        valores = ()
        if criado_por is not None:
            sql += ' AND criado_por = %s'
            valores = (criado_por,)
        sql += ' ORDER BY id_categoria DESC'

        conexao = self._get_connection()
        cursor = conexao.cursor(dictionary=True)
        categorias = []
        try:
            cursor.execute(sql, valores)
            for linha in cursor.fetchall():
                categorias.append(Categoria(
                    linha['nome'],
                    id_categoria=linha['id_categoria'],
                    status_categoria=False,
                    criado_por=linha.get('criado_por')
                ))
            return categorias
        finally:
            cursor.close()
            conexao.close()

    def contar_categorias_pendentes(self):
        sql = 'SELECT COUNT(*) AS total FROM CATEGORIAS WHERE status = FALSE'
        conexao = self._get_connection()
        cursor = conexao.cursor(dictionary=True)
        try:
            cursor.execute(sql)
            return cursor.fetchone()['total']
        finally:
            cursor.close()
            conexao.close()

    def aprovar_categoria(self, id_categoria):
        sql = 'UPDATE CATEGORIAS SET status = TRUE WHERE id_categoria = %s'
        conexao = self._get_connection()
        cursor = conexao.cursor()
        try:
            cursor.execute(sql, (id_categoria,))
            conexao.commit()
            return cursor.rowcount > 0
        finally:
            cursor.close()
            conexao.close()

    def rejeitar_categoria(self, id_categoria):
        return self.remover_categoria(id_categoria)


    def atualizar_categoria(self, categoria_atualizada):
        sql = 'UPDATE CATEGORIAS SET nome = %s WHERE id_categoria = %s'

        valores = (
            categoria_atualizada.nome_categoria,
            categoria_atualizada.id_categoria
        )
        conexao = self._get_connection()
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
        conexao = self._get_connection()
        cursor = conexao.cursor()

        try:
            cursor.execute(sql, valores)
            conexao.commit()
            return cursor.rowcount > 0
        finally:
            cursor.close()
            conexao.close()
