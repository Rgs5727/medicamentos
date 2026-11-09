import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import CssDaPagina from "../components/CssDaPagina"
import PaginaDeErro from "./PaginaDeErro"
import Erro403 from "./Erro403"
import { api, mensagemDeErro } from "../services/api"

// Editar comentário: mesma estrutura do templates/comentarios/editar_comentario.html.
// Só quem escreveu ou um admin: para os outros o servidor responde 403 e abre
// a página 403 antiga (decisão do plano); comentário que não existe -> página de erro.
function ComentarioEditar({ usuario, mostrarToast }){
    const { id } = useParams()
    const navigate = useNavigate()
    // { id, comentario } ou { id, erro: 403 | 404 }
    const [dados, setDados] = useState({ id: null })
    const [texto, setTexto] = useState("")

    useEffect(() => {
        let cancelado = false
        api.get(`/api/comentarios/${id}`)
            .then((resposta) => {
                if(!cancelado){
                    setDados({ id, comentario: resposta.data })
                    setTexto(resposta.data.texto)
                }
            })
            .catch((error) => {
                if(cancelado) return
                const status = error.response?.status
                if(status === 403 || status === 404){
                    setDados({ id, erro: status })
                } else if(status !== 401){ // 401 (sessão expirou) o App já trata
                    mostrarToast(mensagemDeErro(error), "danger")
                }
            })
        return () => { cancelado = true }
    }, [id, mostrarToast])

    const atual = dados.id === id ? dados : null
    if(atual?.erro === 403){
        return <Erro403 usuario={usuario} />
    }
    if(atual?.erro === 404){
        return <div className="container"><PaginaDeErro /></div>
    }
    if(!atual){
        return null
    }
    const comentario = atual.comentario

    async function salvar(e){
        e.preventDefault()
        try {
            const resposta = await api.put(`/api/comentarios/${id}`, { texto })
            mostrarToast(resposta.data.mensagem, "success")
            navigate(`/remedios/${comentario.comentario_med_id}`)
        } catch (error) {
            if(error.response?.status !== 401){
                mostrarToast(mensagemDeErro(error), error.response?.status === 400 ? "warning" : "danger")
            }
        }
    }

    function cancelar(e){
        e.preventDefault()
        navigate(-1) // o antigo voltava para a página anterior (request.referrer)
    }

    return (
    <>
    <CssDaPagina arquivo="editar_comentario.css">
    <div className="container py-5">

        <div className="row justify-content-center">
            <div className="col-lg-6">
                <div className="card edit-card shadow-lg p-4 p-md-5">

                    <h3 className="fw-bold mb-4 d-flex align-items-center">
                        <i className="bi bi-pencil-square me-3 text-primary"></i>
                        Editar Comentário
                    </h3>

                    <div className="mb-3">
                        <small className="text-muted">Comentando como:</small>
                        <div className="fw-bold">{comentario.usuario_nome || comentario.usuario}</div>
                    </div>

                    <form onSubmit={salvar}>
                        <div className="form-floating mb-4">
                            <textarea className="form-control shadow-sm" name="texto" id="texto" style={{ height: "140px" }}
                                required value={texto} onChange={(e) => setTexto(e.target.value)}></textarea>
                            <label htmlFor="texto">Edite seu comentário</label>
                        </div>

                        <div className="d-flex justify-content-between">

                            <a href="/" onClick={cancelar} className="btn btn-outline-secondary btn-custom">
                                Cancelar
                            </a>

                            <button type="submit" className="btn btn-primary btn-custom shadow">
                                <i className="bi bi-check-circle me-2"></i>Salvar Alterações
                            </button>

                        </div>
                    </form>

                </div>
            </div>
        </div>
    </div>
    </CssDaPagina>
    </>
    )
}

export default ComentarioEditar
