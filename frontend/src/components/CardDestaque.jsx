import { useNavigate } from "react-router-dom"
import { urlImagem } from "../services/api"

// Mesmo card do carrossel "Medicamentos em destaque" antigo
// (renderizarDestaques, em static/js/medicamentos.js). Clicar abre o detalhe.
function CardDestaque({ remedio }){
    const navigate = useNavigate()
    const valor = Number(remedio.valor_remedio).toFixed(2)

    return (
    <>
    <article className="featured-product-card" style={{ cursor: "pointer" }}
        onClick={() => navigate(`/remedios/${remedio.remedio_id}`)}>
        <div className="featured-product-img-wrap">
            {remedio.imagem_url
                ? <img src={urlImagem(remedio.imagem_url)} alt={remedio.nome_remedio} />
                : <i className="bi bi-capsule text-muted" style={{ fontSize: "3rem" }}></i>}
        </div>
        <div className="featured-product-body">
            <h3 className="featured-product-name">{remedio.nome_remedio}</h3>
            <p className="featured-product-meta">
                {remedio.principio_remedio || (remedio.descricao_remedio || "").slice(0, 40) || "Consulte o rótulo"}
            </p>
            <p className="featured-product-price mb-0">
                R$ {valor}{" "}
                {remedio.promocao_remedio ? <span className="badge bg-warning text-dark promo-badge">Promoção</span> : null}
            </p>
        </div>
    </article>
    </>
    )
}

export default CardDestaque
