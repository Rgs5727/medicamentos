class Comentario:
    def __init__(self, usuario, texto, comentario_id=None, comentario_med_id=None, usuario_nome=None, remedio_nome=None):
        self.__comentario_id = comentario_id
        self.__usuario = usuario
        self.__comentario_med_id = comentario_med_id
        self.__texto = texto
        self.__usuario_nome = usuario_nome
        self.__remedio_nome = remedio_nome
        
    def to_dict(self):
        return {
            "comentario_id": self.comentario_id,
            "usuario": self.usuario,
            "usuario_nome": self.usuario_nome,
            "remedio_nome": self.remedio_nome,
            "comentario_med_id": self.comentario_med_id,
            "texto": self.texto,
        }
    @property
    def comentario_id(self):
        return self.__comentario_id
    
    @comentario_id.setter
    def comentario_id(self, v):
        self.__comentario_id = v
        
    @property
    def comentario_med_id(self):
        return self.__comentario_med_id
    
    @comentario_med_id.setter
    def comentario_med_id(self, v):
        self.__comentario_med_id = v
    
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
    def remedio_nome(self):
        return self.__remedio_nome

    @remedio_nome.setter
    def remedio_nome(self, valor):
        self.__remedio_nome = valor

    @property
    def texto(self):
        return self.__texto
    
    @texto.setter
    def texto(self, valor):
        self.__texto = valor
