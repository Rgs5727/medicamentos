import { useEffect, useState } from "react"
import { useLocation, useNavigate, useParams } from "react-router-dom"
import CssDaPagina from "../components/CssDaPagina"
import PaginaDeErro from "./PaginaDeErro"
import Erro403 from "./Erro403"
import { api, mensagemDeErro } from "../services/api"
import { podeMexerNaCategoria } from "../services/categorias"

// Editar categoria: mesma estrutura do templates/categorias/editar_categoria.html.
// Só o dono da categoria ou o admin: para os outros abre a página 403.
// Salvando, volta para /categorias (o antigo mostrava um JSON cru — defeito).
function CategoriaEditar({ usuario, mostrarToast }){
    const { id } = useParams()
    const navigate = useNavigate()
    const location = useLocation()
    const voltarPara = location.state?.voltarPara || "/categorias"

    const [dados, setDados] = useState({ id: null }) // { id, categoria } ou { id, naoEncontrada }
    const [nome, setNome] = useState("")

    useEffect(() => {
        let cancelado = false
        api.get(`/api/categorias/${id}`)
            .then((resposta) => {
                if(!cancelado){
                    setDados({ id, categoria: resposta.data })
                    setNome(resposta.data.nome)
                }
            })
            .catch((error) => {
                if(cancelado) return
                if(error.response?.status === 404){
                    setDados({ id, naoEncontrada: true })
                } else if(error.response?.status !== 401){
                    mostrarToast(mensagemDeErro(error), "danger")
                }
            })
        return () => { cancelado = true }
    }, [id, mostrarToast])

    const atual = dados.id === id ? dados : null
    if(atual?.naoEncontrada){
        return <div className="container"><PaginaDeErro /></div>
    }
    if(!atual){
        return null
    }
    if(!podeMexerNaCategoria(usuario, atual.categoria)){
        return <Erro403 usuario={usuario} />
    }

    async function salvar(e){
        e.preventDefault()
        try {
            const resposta = await api.put(`/api/categorias/${id}`, { nome })
            mostrarToast(resposta.data.mensagem, "success")
            navigate("/categorias")
        } catch (error) {
            if(error.response?.status !== 401) mostrarToast(mensagemDeErro(error), "danger")
        }
    }

    function cancelar(e){
        e.preventDefault()
        navigate(voltarPara)
    }

    return (
    <>
    <CssDaPagina arquivos={["cadastro.css", "categoria.css"]}>
    <div className="container py-5 d-flex justify-content-center">
        <div className="card card-cadastro shadow-sm border-0">
            <div className="card-body p-4 p-md-5">
                <div className="header-cadastro mb-4">
                    <h3 className="fw-bold text-dark">Editar Categoria</h3>
                    <p className="text-muted small">Atualize o nome da categoria.</p>
                </div>
                <form onSubmit={salvar}>
                    <div className="row justify-content-center">
                        <div className="col-lg-8 col-md-10 mb-4">
                            <label className="form-label">Nome da categoria <span className="text-danger">*</span></label>
                            <input type="text" name="nome" className="form-control" placeholder="Ex: Analgésico"
                                value={nome} onChange={(e) => setNome(e.target.value)} required />
                        </div>
                    </div>

                    <div className="d-flex gap-2">
                        <button type="submit" className="btn btn-primary btn-save flex-fill py-2 fw-bold">
                            Atualizar Categoria
                        </button>
                        <a href="/categorias" onClick={cancelar} className="btn btn-light border flex-fill py-2">Cancelar</a>
                    </div>
                </form>
            </div>
        </div>
    </div>
    </CssDaPagina>
    </>
    )
}

export default CategoriaEditar
