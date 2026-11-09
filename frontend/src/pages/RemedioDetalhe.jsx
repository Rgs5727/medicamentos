import { useCallback, useEffect, useState } from "react"
import { Link, useLocation, useNavigate, useParams } from "react-router-dom"
import CssDaPagina from "../components/CssDaPagina"
import PaginaDeErro from "./PaginaDeErro"
import { api, mensagemDeErro, urlImagem } from "../services/api"

// Detalhe do remédio: mesma estrutura do templates/remedios/remedio_detalhe.html.
// Editar/Excluir: só o dono (quem cadastrou) ou um administrador.
// Remédio pendente: o servidor só devolve para o dono ou o admin (senão 404).
function RemedioDetalhe({ usuario, favoritos, aoFavoritar, mostrarToast }){
    const { id } = useParams()
    const navigate = useNavigate()
    const location = useLocation()

    // Tudo o que vem da API, guardado junto com o id a que pertence
    const [dados, setDados] = useState({ id: null })
    const [texto, setTexto] = useState("")

    const carregarComentarios = useCallback(async () => {
        const resposta = await api.get(`/api/medicamentos/${id}/comentarios`)
        setDados((atual) => ({ ...atual, comentarios: resposta.data }))
    }, [id])

    useEffect(() => {
        let cancelado = false
        async function carregar(){
            try {
                const [resRemedio, resCategorias, resComentarios] = await Promise.all([
                    api.get(`/api/medicamentos/${id}`),
                    api.get("/api/categorias"),
                    api.get(`/api/medicamentos/${id}/comentarios`),
                ])
                if(!cancelado){
                    setDados({ id, remedio: resRemedio.data, categorias: resCategorias.data, comentarios: resComentarios.data })
                }
            } catch (error) {
                if(cancelado) return
                if(error.response?.status === 404){
                    setDados({ id, naoEncontrado: true })
                } else {
                    mostrarToast(mensagemDeErro(error), "danger")
                }
            }
        }
        carregar()
        return () => { cancelado = true }
    }, [id, mostrarToast])

    const atual = dados.id === id ? dados : null
    if(atual?.naoEncontrado){
        return <div className="container"><PaginaDeErro /></div>
    }
    if(!atual){
        return null
    }

    const { remedio, categorias, comentarios } = atual
    const categoria = categorias.find((c) => c.id === remedio.categoria)
    const nomeCategoria = categoria ? categoria.nome : remedio.categoria
    const podeMexer = Boolean(usuario) && (usuario.adm || usuario.email === remedio.criado_por)
    const favorito = favoritos.includes(remedio.id)

    async function excluirRemedio(){
        if(!window.confirm("Tem certeza que deseja excluir este remédio permanentemente?")) return
        try {
            const resposta = await api.delete(`/api/medicamentos/${remedio.id}`)
            mostrarToast(resposta.data.mensagem, "success")
            navigate("/")
        } catch (error) {
            if(error.response?.status !== 401) mostrarToast(mensagemDeErro(error), "danger")
        }
    }

    async function enviarComentario(e){
        e.preventDefault()
        try {
            const resposta = await api.post(`/api/medicamentos/${remedio.id}/comentarios`, { texto })
            mostrarToast(resposta.data.mensagem, "success")
            setTexto("")
            await carregarComentarios()
        } catch (error) {
            if(error.response?.status !== 401){
                mostrarToast(mensagemDeErro(error), error.response?.status === 400 ? "warning" : "danger")
            }
        }
    }

    async function excluirComentario(comentarioId){
        if(!window.confirm("Tem certeza que deseja excluir?")) return
        try {
            const resposta = await api.delete(`/api/comentarios/${comentarioId}`)
            mostrarToast(resposta.data.mensagem, "success")
            await carregarComentarios()
        } catch (error) {
            if(error.response?.status !== 401) mostrarToast(mensagemDeErro(error), "danger")
        }
    }

    return (
    <>
    <CssDaPagina arquivos={["remedios.css", "remedio_detalhe.css"]}>
    <div className="container py-5">
        <div className="d-flex justify-content-between align-items-center mb-5">
            <Link to="/"
                className="btn btn-light rounded-pill px-4 py-2 shadow-sm text-secondary border d-inline-flex align-items-center">
                <i className="bi bi-arrow-left me-2"></i>Voltar ao Catálogo
            </Link>

            {podeMexer ? (
            <div className="d-flex align-items-center gap-3">
                <Link to={`/remedios/${remedio.id}/editar`} state={{ voltarPara: `/remedios/${remedio.id}` }}
                    className="btn btn-warning rounded-pill px-4 py-2 shadow-sm fw-semibold d-inline-flex align-items-center text-dark">
                    <i className="bi bi-pencil-square me-2"></i> Editar
                </Link>

                <button type="button" onClick={excluirRemedio}
                    className="btn btn-outline-danger rounded-pill px-4 py-2 shadow-sm fw-semibold d-inline-flex align-items-center">
                    <i className="bi bi-trash3 me-2"></i> Excluir
                </button>
            </div>
            ) : null}
        </div>

        <div className="bg-white rounded-4 p-4 p-md-5 shadow-sm border mb-5">
            <div className="row g-5 align-items-center">

                <div className="col-lg-5 text-center">
                    <div className="bg-light rounded-4 p-4 shadow-sm border">
                        {remedio.imagem_url ? (
                            <img src={urlImagem(remedio.imagem_url)} className="img-fluid" alt={remedio.nome}
                                style={{ maxHeight: "380px", objectFit: "contain" }} />
                        ) : (
                            <div className="py-5 text-muted">
                                <i className="bi bi-image display-1 opacity-50"></i>
                                <p className="mt-3 mb-0 fw-medium">Imagem não disponível</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="col-lg-7">
                    <div className="d-flex align-items-center justify-content-between mb-3">
                        <span className="badge bg-primary-subtle text-primary px-3 py-2 rounded-pill fw-bold">{nomeCategoria || "Geral"}</span>

                        {usuario ? (
                            <button type="button" onClick={() => aoFavoritar(remedio.id)}
                                className="btn btn-light shadow-sm rounded-circle p-0 d-flex align-items-center justify-content-center border"
                                style={{ width: "45px", height: "45px", background: "white" }}
                                title={favorito ? "Remover dos favoritos" : "Adicionar aos favoritos"}>
                                <i className={`bi bi-heart${favorito ? "-fill text-danger" : ""}`} style={{ fontSize: "1.3rem" }}></i>
                            </button>
                        ) : null}
                    </div>

                    <h1 className="fw-bold mb-2 text-dark" style={{ letterSpacing: "-1px" }}>{remedio.nome}</h1>

                    <div className="badge bg-secondary-subtle text-secondary px-3 py-1.5 rounded-pill mb-4 fw-medium fs-6">
                        {remedio.tipo}
                    </div>

                    <div className="fs-4 fw-bold text-primary mb-4">
                        R$ <span className="fs-2 fw-extrabold">{remedio.valor}</span>
                    </div>

                    <p className="text-secondary lh-lg mb-4">
                        {remedio.desc || "Este medicamento não possui descrição detalhada cadastrada."}
                    </p>

                    <hr className="my-4 opacity-50" />

                    <h6 className="fw-bold text-uppercase text-muted mb-3 small" style={{ letterSpacing: "1px" }}>Informações Principais</h6>
                    <div className="row g-3">
                        <div className="col-6 col-md-4">
                            <div className="bg-light rounded-3 p-3 border text-center h-100">
                                <small className="d-block text-uppercase text-muted fw-bold mb-1" style={{ fontSize: "0.65rem" }}>Laboratório</small>
                                <span className="fw-semibold text-dark text-break">{remedio.lab}</span>
                            </div>
                        </div>
                        <div className="col-6 col-md-4">
                            <div className="bg-light rounded-3 p-3 border text-center h-100">
                                <small className="d-block text-uppercase text-muted fw-bold mb-1" style={{ fontSize: "0.65rem" }}>Princípio Ativo</small>
                                <span className="fw-semibold text-dark text-break">{remedio.principio}</span>
                            </div>
                        </div>
                        <div className="col-12 col-md-4">
                            <div className="bg-danger bg-opacity-10 rounded-3 p-3 border border-danger-subtle text-center h-100">
                                <small className="d-block text-uppercase text-danger fw-bold mb-1" style={{ fontSize: "0.65rem" }}>Validade</small>
                                <span className="fw-bold text-danger">{remedio.dataVal}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div className="row justify-content-center">
            <div className="col-lg-12">
                <div className="bg-white rounded-4 p-4 p-md-5 shadow-sm border">
                    <h3 className="fw-bold mb-4 d-flex align-items-center text-dark">
                        <i className="bi bi-chat-left-text-fill me-3 text-primary"></i>Avaliações e Comentários
                    </h3>

                    {comentarios.length > 0 ? (
                        <div className="d-flex flex-column gap-3 mb-4">
                            {comentarios.map((c) => (
                                <div key={c.comentario_id} className="bg-light rounded-3 p-3 border position-relative">
                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                        <div className="d-flex align-items-center gap-2">
                                            <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold text-uppercase"
                                                style={{ width: "32px", height: "32px", fontSize: "0.85rem" }}>
                                                {c.usuario.slice(0, 1)}
                                            </div>
                                            <strong className="text-dark">{c.usuario}</strong>
                                        </div>

                                        {usuario && (usuario.adm || usuario.email === c.usuario) ? (
                                            <div className="d-flex gap-3">
                                                <Link to={`/comentarios/${c.comentario_id}/editar`} className="text-muted text-decoration-none small">
                                                    <i className="bi bi-pencil me-1"></i>Editar
                                                </Link>
                                                <button type="button" onClick={() => excluirComentario(c.comentario_id)}
                                                    className="btn btn-link text-danger text-decoration-none small p-0 m-0 border-0 align-baseline">
                                                    <i className="bi bi-trash me-1"></i>Excluir
                                                </button>
                                            </div>
                                        ) : null}
                                    </div>
                                    <p className="mb-0 text-secondary ms-1">{c.texto}</p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-4 text-muted border rounded-4 bg-light bg-opacity-50 mb-4">
                            <i className="bi bi-chat-square-dots fs-2 opacity-50 mb-2 d-block"></i>
                            Seja o primeiro a comentar sobre este medicamento.
                        </div>
                    )}

                    {usuario ? (
                        <form onSubmit={enviarComentario}>
                            <div className="form-floating mb-3">
                                <textarea className="form-control shadow-sm border" name="texto" placeholder="Sua opinião" id="floatingTextarea" required
                                    style={{ height: "120px", borderRadius: "16px", background: "#f8fafc" }}
                                    value={texto} onChange={(e) => setTexto(e.target.value)}></textarea>
                                <label htmlFor="floatingTextarea" className="text-muted">Escreva sua experiência com este medicamento...</label>
                            </div>
                            <div className="text-end">
                                <button type="submit" className="btn btn-primary px-5 py-3 rounded-pill fw-bold shadow-sm">
                                    <i className="bi bi-send me-2"></i>Enviar Comentário
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="alert alert-light border rounded-4 text-center py-4 m-0 bg-light">
                            <p className="mb-3 text-secondary">Você precisa estar logado para compartilhar sua opinião.</p>
                            <Link to="/login" state={{ voltarPara: location.pathname }}
                                className="btn btn-outline-primary rounded-pill px-4 fw-semibold">Fazer Login</Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    </div>
    </CssDaPagina>
    </>
    )
}

export default RemedioDetalhe
