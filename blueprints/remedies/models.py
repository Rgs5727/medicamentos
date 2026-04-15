class Categoria:
    def __init__(self, nome_categoria, id_categoria=None):
        self.__nome = nome_categoria
        self.__id = id_categoria
        
    def to_dict(self):
        return {
            "nome": self.nome_categoria,
            "id": self.id_categoria
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


class Remedio:
    
    def __init__(self, nome_remedio, principio_remedio, lab_remedio, categoria_remedio, dataFab_remedio, dataVal_remedio, descricao_remedio, valor_remedio, destaque_remedio, lancamento_remedio, promocao_remedio, imagem_url=None, remedio_id=None):
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
        self.__imagem = imagem_url


    def to_dict(self):
        return {
            "nome": self.nome_remedio,
            "principio": self.principio_remedio,
            "lab": self.lab_remedio,
            "categoria": self.categoria_remedio,
            "id":self.remedio_id,
            "dataFab":self.dataFab_remedio,
            "dataVal":self.dataVal_remedio,
            "desc": self.descricao_remedio,
            "valor": self.valor_remedio,
            "destaque": self.destaque_remedio,
            "lancamento": self.lancamento_remedio,
            "promocao": self.promocao_remedio,
            "imagem_url": self.imagem_url
        }
    
    #getter utilizado para recuperar valor 
    @property
    def nome_remedio(self):
        return str.capitalize(self.__nome)
    
    #utilizado para atribuir valor
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
        self.__lab = valor

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
        self.__desc = valor


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

class Usuario:

    def __init__(self, email, senha, nome, adm=False):
        self.__nome = nome
        self.__email = email
        self.__senha = senha
        self.__adm = adm

    def to_dict(self):
        return {
            "nome": self.nome,
            "email": self.email,
            "senha": self.senha,
            "adm": self.adm
        }
    
    @property
    def nome(self):
        return self.__nome
    
    @nome.setter
    def nome(self, valor):
        self.__nome = valor

    @property
    def email(self):
        return self.__email
    
    @email.setter
    def email(self, valor):
        self.__email = valor.lower()

    @property
    def senha(self):
        return self.__senha
    
    @senha.setter
    def senha(self, valor):
        self.__senha = valor
        
    @property
    def adm(self):
        return self.__adm
    
    @adm.setter
    def adm(self, valor):
        self.__adm = valor
        

class Comentario:
    def __init__(self, usuario, texto, comentario_id=None, comentario_med_id=None, usuario_nome=None):
        self.__comentario_id = comentario_id
        self.__usuario = usuario
        self.__comentario_med_id = comentario_med_id
        self.__texto = texto
        self.__usuario_nome = usuario_nome
        
    def to_dict(self):
        return {
            "comentario_id": self.comentario_id,
            "usuario": self.usuario,
            "usuario_nome": self.usuario_nome,
            "comentario_med_id": self.comentario_med_id,
            "texto": self.texto
        }
    @property
    def comentario_id(self):
        return self.__comentario_id
    
    @comentario_id.setter
    def comentario_id(self, v):
        self.__comentario_id = v
    
    @property
    def usuario(self):
        return self.__usuario
    
    @usuario.setter
    def usuario(self, valor):
        self.__usuario = valor
    
    @property
    def usuario_nome(self):
        return self.__usuario_nome or self.__usuario
    
    @usuario_nome.setter
    def usuario_nome(self, valor):
        self.__usuario_nome = valor
    
    @property
    def comentario_med_id(self):
        return self.__comentario_med_id
    
    @comentario_med_id.setter
    def comentario_med_id(self, v):
        self.__comentario_med_id = v
        
    @property
    def texto(self):
        return self.__texto
    
    @texto.setter
    def texto(self, valor):
        self.__texto = valor

class Favoritos:
    def __init__(self, usuario, remedio_id):
        self.__usuario = usuario
        self.__remedio_id = remedio_id
    
    def to_dict(self):
        return {
            "usuario": self.usuario,
            "remedio_id": self.remedio_id
        }
    
    @property
    def usuario(self):
        return self.__usuario or self.__usuario
    
    @usuario.setter
    def usuario_nome(self, valor):
        self.__usuario = valor.lower()

    @property
    def remedio_id(self):
        return self.__remedio_id
    
    @remedio_id.setter
    def remedio_id(self, v):
        self.__remedio_id = v
