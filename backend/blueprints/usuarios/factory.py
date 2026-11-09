from .models import UsuarioComum, UsuarioADM


class UsuarioFactory:

    @staticmethod
    def criar(tipo, email, senha, nome, **kwargs):
        if tipo == "adm":
            return UsuarioADM(email, senha, nome, poder=kwargs.get("poder"))
        else:
            return UsuarioComum(email, senha, nome, plebe=kwargs.get("plebe"))