import os
import mysql.connector

class BaseDAO:
    def __init__(self):
        self.__db_config = {
            'host' : os.getenv("MYSQL_HOST"),
            'user' : os.getenv("MYSQL_USER"),
            'password' : os.getenv("MYSQL_PASSWORD"),
            'database' : os.getenv("MYSQL_DATABASE")
        }

        mysql_port = os.getenv("MYSQL_PORT")
        if mysql_port:
            self.__db_config['port'] = int(mysql_port)

    def _get_connection(self):
        return mysql.connector.connect(**self.__db_config)
