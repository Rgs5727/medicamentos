import { useNavigate } from "react-router-dom"
import { urlImagem } from "../services/api"

// Mesmo card do catálogo antigo (criarCardCatalogo, em static/js/medicamentos.js).
// Clicar no card abre o detalhe; o coração (só para quem está logado) favorita.
function CardRemedio({ remedio, nomeCategoria, logado, favorito, aoFavoritar }){
    const navigate = useNavigate()
    const valor = Number(remedio.valor_remedio).toFixed(2)

    function abrirDetalhe(){
        navigate(`/remedios/${remedio.remedio_id}`)
    }

    function favoritar(e){
        e.stopPropagation() // não deixa o clique no coração abrir o detalhe
        aoFavoritar(remedio.remedio_id)
    }

    return (
    <>
    <div className="col">
        <div className="card product-card h-100" style={{ cursor: "pointer" }} onClick={abrirDetalhe}>
            {remedio.imagem_url
                ? <img src={urlImagem(remedio.imagem_url)} className="card-img-top" alt={remedio.nome_remedio}
                    style={{ height: "200px", objectFit: "cover" }} />
                : <div className="bg-light d-flex align-items-center justify-content-center" style={{ height: "200px" }}>
                    <span className="text-muted">Sem imagem</span>
                  </div>}
            <div className="card-body d-flex flex-column">
                {nomeCategoria ? <span className="badge bg-primary bg-opacity-10 text-primary mb-2" style={{ width: "fit-content" }}>{nomeCategoria}</span> : null}
                <h5 className="card-title fw-bold text-dark">{remedio.nome_remedio}</h5>
                <p className="card-text text-muted small">{(remedio.descricao_remedio || "Sem descrição disponível").slice(0, 80)}</p>
                <div className="mt-auto">
                    <div className="d-flex align-items-center justify-content-between mb-3">
                        {remedio.promocao_remedio
                            ? <div className="alert alert-warning d-flex align-items-center mb-0 py-2 px-3" role="alert">
                                <i className="bi bi-tag-fill me-2"></i><strong>R$ {valor}</strong>
                              </div>
                            : <span className="fs-4 fw-bold text-dark">R$ {valor}</span>}
                    </div>
                    {remedio.promocao_remedio ? <span className="badge bg-warning text-dark">Promoção</span> : null}
                    <div className="mb-2">
                        {remedio.destaque_remedio ? <span className="badge bg-primary">Destaque</span> : null}{" "}
                        {remedio.lancamento_remedio ? <span className="badge bg-secondary">Lançamento</span> : null}{" "}
                        {remedio.tipo === "Tarjado"
                            ? <span className="badge bg-warning position-absolute top-0 end-0 m-3" style={{ color: "black" }}>{remedio.tipo}</span>
                            : null}
                    </div>
                </div>
            </div>
            {logado ? (
                <button type="button" onClick={favoritar}
                    className="btn-favoritar btn btn-light shadow-sm rounded-circle p-0 position-absolute top-0 start-0 m-3"
                    style={{ width: "38px", height: "38px", border: "none", background: "white", zIndex: 10 }}>
                    <i className={`bi bi-heart${favorito ? "-fill text-danger" : ""}`} style={{ fontSize: "1.2rem" }}></i>
                </button>
            ) : null}
        </div>
    </div>
    </>
    )
}

export default CardRemedio
