from abc import ABC, abstractmethod


def _data_iso(data):
    # Datas viram "AAAA-MM-DD" no JSON (formato que o <input type="date"> do React entende)
    return data.isoformat() if hasattr(data, "isoformat") else data

class Remedio(ABC):

    def __init__(self, nome_remedio, principio_remedio, lab_remedio, categoria_remedio,
                dataFab_remedio, dataVal_remedio, descricao_remedio, valor_remedio,
                destaque_remedio, lancamento_remedio, promocao_remedio, status_remedio,
                imagem_url=None, remedio_id=None, criado_por=None):
        self.__criado_por = criado_por  # e-mail de quem cadastrou (dono)
        self.__nome = nome_remedio
        self.__principio = principio_remedio
        self.__lab = lab_remedio
        self.__categoria = categoria_remedio
        self.__dataFab = dataFab_remedio
        self.__dataVal = dataVal_remedio
        self.__desc = descricao_remedio
        self.__id = remedio_id
        self.__valor = valor_remedio
        self.__destaque = destaque_remedio
        self.__lancamento = lancamento_remedio
        self.__promocao = promocao_remedio
        self.__status = status_remedio
        self.__imagem = imagem_url

    @abstractmethod
    def to_dict(self):
        pass
    
    @abstractmethod
    def tipo(self):
        pass
    
    @property
    def criado_por(self):
        return self.__criado_por

    @property
    def status_remedio(self):
        return self.__status

    @status_remedio.setter
    def status_remedio(self, valor):
        self.__status = valor

    @property
    def nome_remedio(self):
        return str.capitalize(self.__nome)

    @nome_remedio.setter
    def nome_remedio(self, valor):
        self.__nome = str.capitalize(valor)

    @property
    def principio_remedio(self):
        return self.__principio

    @principio_remedio.setter
    def principio_remedio(self, valor):
        self.__principio = valor

    @property
    def lab_remedio(self):
        return self.__lab

    @lab_remedio.setter
    def lab_remedio(self, valor):
        self.__lab = str.capitalize(valor)

    @property
    def categoria_remedio(self):
        return self.__categoria

    @categoria_remedio.setter
    def categoria_remedio(self, valor):
        self.__categoria = valor

    @property
    def remedio_id(self):
        return self.__id

    @remedio_id.setter
    def remedio_id(self, v):
        self.__id = v

    @property
    def dataFab_remedio(self):
        return self.__dataFab

    @dataFab_remedio.setter
    def dataFab_remedio(self, valor):
        self.__dataFab = valor

    @property
    def dataVal_remedio(self):
        return self.__dataVal

    @dataVal_remedio.setter
    def dataVal_remedio(self, valor):
        self.__dataVal = valor

    @property
    def descricao_remedio(self):
        return self.__desc

    @descricao_remedio.setter
    def descricao_remedio(self, valor):
        self.__desc = str.capitalize(valor)

    @property
    def valor_remedio(self):
        return self.__valor

    @valor_remedio.setter
    def valor_remedio(self, valor):
        self.__valor = float(valor)

    @property
    def destaque_remedio(self):
        return self.__destaque

    @destaque_remedio.setter
    def destaque_remedio(self, valor):
        self.__destaque = valor

    @property
    def lancamento_remedio(self):
        return self.__lancamento

    @lancamento_remedio.setter
    def lancamento_remedio(self, valor):
        self.__lancamento = valor

    @property
    def promocao_remedio(self):
        return self.__promocao

    @promocao_remedio.setter
    def promocao_remedio(self, valor):
        self.__promocao = valor

    @property
    def imagem_url(self):
        return self.__imagem

    @imagem_url.setter
    def imagem_url(self, valor):
        self.__imagem = valor


class Tarjado(Remedio):
    def __init__(self, nome_remedio, principio_remedio, lab_remedio, categoria_remedio,
                dataFab_remedio, dataVal_remedio, descricao_remedio, valor_remedio,
                destaque_remedio, lancamento_remedio, promocao_remedio, status_remedio, tarja,
                imagem_url=None, remedio_id=None, criado_por=None):
        super().__init__(nome_remedio, principio_remedio, lab_remedio, categoria_remedio,
                dataFab_remedio, dataVal_remedio, descricao_remedio, valor_remedio,
                destaque_remedio, lancamento_remedio, promocao_remedio, status_remedio,
                imagem_url=imagem_url, remedio_id=remedio_id, criado_por=criado_por)
        self.__tarja = tarja

    @property
    def tarjado(self):
        return self.__tarja
    
    def tipo(self):
        return 'tarjado'
    
    def to_dict(self):
        return {
            "nome": self.nome_remedio,
            "principio": self.principio_remedio,
            "lab": self.lab_remedio,
            "categoria": self.categoria_remedio,
            "id": self.remedio_id,
            "dataFab": _data_iso(self.dataFab_remedio),
            "dataVal": _data_iso(self.dataVal_remedio),
            "desc": self.descricao_remedio,
            "tipo": self.tipo(),
            "valor": self.valor_remedio,
            "destaque": self.destaque_remedio,
            "lancamento": self.lancamento_remedio,
            "promocao": self.promocao_remedio,
            "imagem_url": self.imagem_url,
            "tarjado": self.__tarja,
            "status": self.status_remedio,
            "criado_por": self.criado_por,
        }
    
class Venda(Remedio):
    def __init__(self, nome_remedio, principio_remedio, lab_remedio, categoria_remedio,
                dataFab_remedio, dataVal_remedio, descricao_remedio, valor_remedio,
                destaque_remedio, lancamento_remedio, promocao_remedio, status_remedio, livre,
                imagem_url=None, remedio_id=None, criado_por=None):
        super().__init__(nome_remedio, principio_remedio, lab_remedio, categoria_remedio,
                dataFab_remedio, dataVal_remedio, descricao_remedio, valor_remedio,
                destaque_remedio, lancamento_remedio, promocao_remedio,status_remedio,
                imagem_url=imagem_url, remedio_id=remedio_id, criado_por=criado_por)
        self.__livre = livre

    @property
    def livre(self):
        return self.__livre
    
    def tipo(self):
        return "Venda Livre"
    
    def to_dict(self):
        return {
            "nome": self.nome_remedio,
            "principio": self.principio_remedio,
            "lab": self.lab_remedio,
            "categoria": self.categoria_remedio,
            "id": self.remedio_id,
            "dataFab": _data_iso(self.dataFab_remedio),
            "dataVal": _data_iso(self.dataVal_remedio),
            "desc": self.descricao_remedio,
            "tipo": self.tipo(),
            "valor": self.valor_remedio,
            "destaque": self.destaque_remedio,
            "lancamento": self.lancamento_remedio,
            "promocao": self.promocao_remedio,
            "imagem_url": self.imagem_url,
            "venda": self.__livre,
            "status": self.status_remedio,
            "criado_por": self.criado_por,
        }

