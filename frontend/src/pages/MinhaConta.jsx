import { useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import CssDaPagina from "../components/CssDaPagina"
import { api, mensagemDeErro, urlImagem } from "../services/api"

// Minha conta: mesma estrutura do templates/usuarios/usuario_detalhe.html.
// O coração tira dos favoritos (o card some, como quando a página antiga
// recarregava); clicar no card abre o detalhe.
function MinhaConta({ usuario, favoritos, aoFavoritar, mostrarToast }){
    const navigate = useNavigate()
    const [lista, setLista] = useState(null) // remédios favoritos (null = carregando)

    useEffect(() => {
        let cancelado = false
        api.get("/api/favoritos")
            .then((resposta) => { if(!cancelado) setLista(resposta.data) })
            .catch((error) => {
                if(!cancelado){
                    setLista([])
                    if(error.response?.status !== 401) mostrarToast(mensagemDeErro(error), "danger")
                }
            })
        return () => { cancelado = true }
    }, [mostrarToast])

    // Só os que continuam favoritos (o App atualiza "favoritos" ao clicar no coração)
    const visiveis = lista ? lista.filter((m) => favoritos.includes(m.remedio_id)) : []
    // O contador usa a lista de favoritos que o App já tem (a mesma do selo da
    // navbar): aparece certo desde o primeiro instante, como na página antiga.
    const quantidade = favoritos.length

    function tirarDosFavoritos(e, remedioId){
        e.stopPropagation() // não abre o detalhe
        aoFavoritar(remedioId)
    }

    return (
    <>
    <CssDaPagina arquivo="usuario_detalhe.css">
    <div className="container py-5">

        <div className="profile-hero shadow-lg">
            <div className="row align-items-center">
                <div className="col-md-8">
                    <h1 className="display-5 fw-bold mb-2">Olá, {usuario.nome}!</h1>
                    <p className="lead opacity-75 mb-0">Bem-vindo ao seu painel de saúde e bem-estar.</p>
                </div>
                <div className="col-md-4 text-md-end mt-4 mt-md-0">
                    <Link to="/conta/editar" className="btn btn-light btn-lg rounded-pill px-4 fw-bold shadow-sm">
                        <i className="bi bi-gear-fill me-2"></i>Editar
                    </Link>
                </div>
            </div>
        </div>

        <div className="row justify-content-center">
            <div className="col-lg-11">
                <div className="info-card">
                    <div className="row g-4">
                        <div className="col-md-6 border-end-md">
                            <div className="d-flex align-items-center gap-4">
                                <div className="avatar-circle"
                                    style={{ width: "100px", height: "100px", fontSize: "2.5rem", background: "#f1f5f9", color: "#4f46e5", border: "4px solid #fff", boxShadow: "0 0 20px rgba(0,0,0,0.1)" }}>
                                    {usuario.nome ? usuario.nome[0].toUpperCase() : ""}
                                </div>
                                <div>
                                    <h4 className="fw-bold text-dark mb-1">{usuario.nome}</h4>
                                    <p className="text-muted mb-2"><i className="bi bi-envelope-fill me-2"></i>{usuario.email}</p>
                                    <span className="badge rounded-pill bg-success bg-opacity-10 text-success px-3 py-2">
                                        <i className="bi bi-patch-check-fill me-1"></i> Conta Ativa
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="col-md-6">
                            <div className="row g-3">
                                <div className="col-6">
                                    <div className="stat-box">
                                        <i className="bi bi-heart-fill text-danger fs-3 mb-2"></i>
                                        <h3 className="fw-bold mb-0 text-dark">{quantidade}</h3>
                                        <small className="text-muted text-uppercase fw-bold">Favoritos</small>
                                    </div>
                                </div>
                                <div className="col-6">
                                    <div className="stat-box">
                                        <i className="bi bi-calendar-check text-primary fs-3 mb-2"></i>
                                        <h3 className="fw-bold mb-0 text-dark">2026</h3>
                                        <small className="text-muted text-uppercase fw-bold">Desde</small>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div className="section-header">
            <h3 className="section-title">
                <i className="bi bi-bookmark-star-fill text-warning me-2"></i>Seus Favoritos
            </h3>
            <span className="text-muted">{quantidade} itens salvos</span>
        </div>

        <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 g-4">
            {lista === null ? null : visiveis.length > 0 ? (
                visiveis.map((remedio) => (
                    <div className="col" key={remedio.remedio_id}>
                        <div className="card product-card h-100 shadow-sm" style={{ cursor: "pointer" }}
                            onClick={() => navigate(`/remedios/${remedio.remedio_id}`)}>

                            <div className="position-relative">
                                <div className="position-absolute top-0 start-0 m-3" style={{ zIndex: 10 }}>
                                    <button type="button" onClick={(e) => tirarDosFavoritos(e, remedio.remedio_id)}
                                        className="btn btn-light shadow-sm rounded-circle p-0 d-flex align-items-center justify-content-center"
                                        style={{ width: "38px", height: "38px", border: "none", background: "white", transition: "transform 0.2s ease" }}
                                        onMouseOver={(e) => { e.currentTarget.style.transform = "scale(1.1)" }}
                                        onMouseOut={(e) => { e.currentTarget.style.transform = "scale(1)" }}>
                                        <i className="bi bi-heart-fill text-danger" style={{ fontSize: "1.2rem" }}></i>
                                    </button>
                                </div>

                                {remedio.imagem_url ? (
                                    <img src={urlImagem(remedio.imagem_url)} className="card-img-top" alt={remedio.nome_remedio}
                                        style={{ height: "200px", objectFit: "cover", borderRadius: "20px 20px 0 0" }} />
                                ) : (
                                    <div className="bg-light d-flex align-items-center justify-content-center"
                                        style={{ height: "200px", borderRadius: "20px 20px 0 0" }}>
                                        <i className="bi bi-capsule text-muted fs-1"></i>
                                    </div>
                                )}

                                {remedio.promocao_remedio ? (
                                    <span className="position-absolute top-0 end-0 m-3 badge bg-warning text-dark fw-bold px-3 py-2 rounded-pill shadow-sm">
                                        PROMOÇÃO
                                    </span>
                                ) : null}
                            </div>

                            <div className="card-body d-flex flex-column p-4">
                                <h5 className="card-title fw-bold text-dark mb-3">{remedio.nome_remedio}</h5>

                                <div className="mt-auto d-flex align-items-center justify-content-between">
                                    <span className="price-tag">R$ {remedio.valor_remedio}</span>
                                    <i className="bi bi-arrow-right-circle-fill text-primary fs-4"></i>
                                </div>
                            </div>
                        </div>
                    </div>
                ))
            ) : (
                <div className="col-12 text-center py-5 bg-white rounded-4 shadow-sm">
                    <h5 className="text-muted">Você ainda não favoritou nenhum remédio.</h5>
                    <p className="text-muted small mb-4">Explore nosso catálogo e salve seus itens preferidos aqui!</p>
                    <Link to="/" className="btn btn-primary rounded-pill px-4">Explorar Agora</Link>
                </div>
            )}
        </div>
    </div>
    </CssDaPagina>
    </>
    )
}

export default MinhaConta
