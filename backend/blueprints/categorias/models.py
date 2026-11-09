class Categoria:
    def __init__(self, nome_categoria, id_categoria=None, status_categoria=True, criado_por=None):
        self.__nome = nome_categoria
        self.__id = id_categoria
        self.__status = status_categoria
        self.__criado_por = criado_por  # e-mail de quem cadastrou (dono)

    def to_dict(self):
        return {
            "nome": self.nome_categoria,
            "id": self.id_categoria,
            "status": self.status_categoria,
            "criado_por": self.criado_por,
        }

    @property
    def nome_categoria(self):
        return str.capitalize(self.__nome)

    @nome_categoria.setter
    def nome_categoria(self, valor):
        self.__nome = str.capitalize(valor)

    @property
    def id_categoria(self):
        return self.__id

    @id_categoria.setter
    def id_categoria(self, v):
        self.__id = v

    @property
    def status_categoria(self):
        return self.__status

    @status_categoria.setter
    def status_categoria(self, valor):
        self.__status = bool(valor)

    @property
    def criado_por(self):
        return self.__criado_por


