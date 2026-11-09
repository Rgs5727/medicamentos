import { useLocation, useNavigate, useParams } from "react-router-dom"
import { useEffect, useState } from "react"

import { api, mensagemDeErro } from "../services/api"
import CssDaPagina from "./CssDaPagina"
import RemedioForm from "./RemedioForm"
import PaginaDeErro from "../pages/PaginaDeErro"
import Erro403 from "../pages/Erro403"

// Converte o JSON do Flask (to_dict) para os campos do formulário
function remedioParaForm(r){
    const tipo = r.tipo === 'tarjado' ? 'tarjado' : 'venda_livre'
    return {
        nome: r.nome ?? '',
        principio: r.principio ?? '',
        lab: r.lab ?? '',
        categoria: r.categoria ?? '',
        dataF: r.dataFab ?? '',
        dataV: r.dataVal ?? '',
        valor: r.valor ?? '',
        desc: r.desc ?? '',
        tipo: tipo,
        tarjado: r.tarjado ?? '',
        venda_livre: r.venda ?? '',
        destaque: Boolean(r.destaque),
        lancamento: Boolean(r.lancamento),
        promo: Boolean(r.promocao),
        imagem_url: r.imagem_url,
    }
}

// Editar remédio: mesma estrutura do editar_medicamento.html antigo.
// Só o dono ou o admin: para os outros abre a página 403 (decisão do plano).
function RemedioPaginaEditar({ usuario, mostrarToast }){
    const navigate = useNavigate()
    const location = useLocation()
    const { id } = useParams()
    const voltarPara = location.state?.voltarPara || "/"

    // O que veio da API, junto com o id a que pertence
    const [dados, setDados] = useState({ id: null })

    useEffect(() => {
        let cancelado = false
        async function carregarRemedio(){
            try {
                const res = await api.get(`/api/medicamentos/${id}`)
                if(!cancelado) setDados({ id, remedio: res.data })
            } catch (error) {
                if(cancelado) return
                if(error.response?.status === 404){
                    setDados({ id, naoEncontrado: true })
                } else if(error.response?.status !== 401){
                    mostrarToast(mensagemDeErro(error), "danger")
                }
            }
        }

        carregarRemedio()
        return () => { cancelado = true }
    },[id, mostrarToast])

    const atual = dados.id === id ? dados : null
    if(atual?.naoEncontrado){
        return <div className="container"><PaginaDeErro /></div>
    }
    if(!atual){
        return null
    }

    const remedio = atual.remedio
    const podeMexer = Boolean(usuario) && (usuario.adm || usuario.email === remedio.criado_por)
    if(!podeMexer){
        return <Erro403 usuario={usuario} />
    }

    async function salvar(formulario){
        const resposta = await api.put(`/api/medicamentos/${id}`, formulario)
        mostrarToast(resposta.data.mensagem, "success")
        navigate(voltarPara)
    }

    return (<>
    <CssDaPagina arquivo="cadastro.css">
        <div className="container py-5 d-flex justify-content-center">
            <div className="card card-cadastro shadow-sm border-0">
                <div className="card-body p-4 p-md-5">
                    <div className="header-cadastro mb-4">
                        <h3 className="fw-bold text-dark">Editar Medicamento</h3>
                        <p className="text-muted small">
                            Alterando as informações de:{" "}
                            <strong>{remedio.nome}</strong>
                        </p>
                    </div>

                    <RemedioForm valorInicial={remedioParaForm(remedio)} ehEdicao
                        onSalvar={salvar} aoCancelar={() => navigate(voltarPara)} mostrarToast={mostrarToast}/>
                </div>
            </div>
        </div>
    </CssDaPagina>
    </>)
}

export default RemedioPaginaEditar
