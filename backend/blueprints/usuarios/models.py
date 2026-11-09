from abc import ABC, abstractmethod

class Usuario(ABC):

    def __init__(self, email, senha, nome):
        self.__nome = nome
        self.__email = email
        self.__senha = senha

    @abstractmethod
    def to_dict(self):
        pass

    @abstractmethod
    def tipo(self):
        pass

    @abstractmethod
    def pode_moderar(self):
        # Pedido da especificação do 3º bimestre (item 1.2): toda classe de
        # usuário precisa responder se pode moderar (aprovar/rejeitar
        # conteúdo, editar/apagar de outros usuários) ou não. Cada subtipo
        # (UsuarioComum / UsuarioADM) implementa essa resposta lá embaixo.
        pass
    
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
        return self.__usuario
    
    @usuario.setter
    def usuario(self, valor):
        self.__usuario = valor.lower()

    @property
    def remedio_id(self):
        return self.__remedio_id
    
    @remedio_id.setter
    def remedio_id(self, v):
        self.__remedio_id = v

class UsuarioComum(Usuario):
    def __init__(self, email, senha, nome, plebe):
        super().__init__(email, senha, nome)
        self.__plebe = plebe

    @property
    def plebe(self):
        return self.__plebe
    
    def tipo(self):
        return "comum"

    def pode_moderar(self):
        # Usuário comum nunca pode aprovar/rejeitar nem mexer no que é
        # dos outros (ver tabela de permissões da especificação, item 1.2).
        return False

    def to_dict(self):
        return {
            "nome": self.nome,
            "email": self.email,
            "senha": self.senha,
            "plebe": self.__plebe
        }
    
class UsuarioADM(Usuario):
    def __init__(self, email, senha, nome, poder):
        super().__init__(email, senha, nome)
        self.__poder = poder

    @property
    def poder(self):
        return self.__poder
    
    def tipo(self):
        return "adm"

    def pode_moderar(self):
        # Administrador pode aprovar/rejeitar, editar e apagar qualquer
        # coisa, e tornar outro usuário administrador (item 1.2 da
        # especificação).
        return True

    def to_dict(self):
        return {
            "nome": self.nome,
            "email": self.email,
            "senha": self.senha,
            "poder": self.__poder
        }