from .models import Tarjado, Venda

class RemedioFactory:

    @staticmethod
    def criar(tipo, nome_remedio, principio_remedio, lab_remedio, categoria_remedio,
                dataFab_remedio, dataVal_remedio, descricao_remedio, valor_remedio,
                destaque_remedio, lancamento_remedio, promocao_remedio, status_remedio,
                imagem_url=None, **kwargs):
        if tipo == "tarjado":
            return Tarjado(nome_remedio, principio_remedio, lab_remedio, categoria_remedio,
                dataFab_remedio, dataVal_remedio, descricao_remedio, valor_remedio,
                destaque_remedio, lancamento_remedio, promocao_remedio, status_remedio,
                kwargs.get("tarjado"), imagem_url=imagem_url, remedio_id=kwargs.get("remedio_id"),
                criado_por=kwargs.get("criado_por"))
        else:
            return Venda(nome_remedio, principio_remedio, lab_remedio, categoria_remedio,
                dataFab_remedio, dataVal_remedio, descricao_remedio, valor_remedio,
                destaque_remedio, lancamento_remedio, promocao_remedio, status_remedio,
                kwargs.get("venda_livre"), imagem_url=imagem_url, remedio_id=kwargs.get("remedio_id"),
                criado_por=kwargs.get("criado_por"))