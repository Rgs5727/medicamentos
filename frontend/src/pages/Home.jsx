import { useEffect, useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { Swiper, SwiperSlide } from "swiper/react"
import { Navigation } from "swiper/modules"
// Mesmo CSS que o remedios.html antigo carregava do CDN (swiper-bundle.min.css)
import "swiper/css/bundle"
import CssDaPagina from "../components/CssDaPagina"
import CardRemedio from "../components/CardRemedio"
import CardDestaque from "../components/CardDestaque"
import RolarParaAncora from "../components/RolarParaAncora"
import { api, mensagemDeErro } from "../services/api"

// Mesmas opções dos carrosséis do home.js antigo
const SWIPER_BASE = {
    modules: [Navigation],
    speed: 450,
    spaceBetween: 20,
    grabCursor: true,
    watchOverflow: true,
}

// Página inicial: mesma estrutura do templates/remedios/remedios.html antigo.
//   ?q=texto        -> catálogo filtrado pelo NOME do remédio (busca da navbar e do catálogo)
//   ?categoria=id   -> catálogo só com os remédios daquela categoria (clique na categoria)
function Home({ usuario, favoritos, aoFavoritar, mostrarToast }){
    const location = useLocation()
    const navigate = useNavigate()
    const parametros = new URLSearchParams(location.search)
    const termo = (parametros.get("q") || "").trim()
    const categoriaFiltro = parametros.get("categoria")

    const [todos, setTodos] = useState(null)           // todos os aprovados (null = carregando)
    const [categorias, setCategorias] = useState([])
    const [busca, setBusca] = useState({ termo: "", lista: null }) // resultado da busca por nome

    // <body class="has-fixed-nav page-home">, igual ao body_class do remedios.html
    useEffect(() => {
        document.body.classList.add("page-home")
        return () => document.body.classList.remove("page-home")
    }, [])

    // Uma vez: todos os remédios aprovados (para os destaques) e as categorias
    useEffect(() => {
        async function carregar(){
            try {
                const [resRemedios, resCategorias] = await Promise.all([
                    api.get("/api/medicamentos"),
                    api.get("/api/categorias"),
                ])
                setTodos(resRemedios.data)
                setCategorias(resCategorias.data)
            } catch (error) {
                setTodos([])
                mostrarToast(mensagemDeErro(error), "danger")
            }
        }
        carregar()
    }, [mostrarToast])

    // Busca por nome: pergunta ao servidor (GET /api/medicamentos?q=), como o catálogo antigo
    useEffect(() => {
        if(!termo){
            return
        }
        let cancelado = false
        api.get("/api/medicamentos", { params: { q: termo } })
            .then((resposta) => { if(!cancelado) setBusca({ termo, lista: resposta.data }) })
            .catch((error) => {
                if(!cancelado){
                    setBusca({ termo, lista: [] })
                    mostrarToast(mensagemDeErro(error), "danger")
                }
            })
        return () => { cancelado = true }
    }, [termo, mostrarToast])

    // O que o catálogo mostra (null = ainda carregando)
    let catalogo = null
    if(termo){
        catalogo = busca.termo === termo ? busca.lista : null
    } else {
        catalogo = todos
    }
    if(catalogo && categoriaFiltro){
        catalogo = catalogo.filter((m) => String(m.categoria_remedio) === categoriaFiltro)
    }
    const destaques = todos ? todos.filter((m) => m.destaque_remedio) : null
    const nomesDasCategorias = Object.fromEntries(categorias.map((c) => [c.id, c.nome]))
    const logado = Boolean(usuario)

    // Busca do catálogo: vira ?q= na URL (mesma busca da navbar). Buscar vazio mostra tudo.
    function buscarNoCatalogo(e){
        e.preventDefault()
        const texto = String(new FormData(e.currentTarget).get("q") || "").trim()
        navigate(texto ? `/?q=${encodeURIComponent(texto)}#catalogo` : "/#catalogo")
    }

    return (
    <>
    <CssDaPagina arquivo="remedios.css">
        <RolarParaAncora pronto={todos !== null} />

        <section className="hero-section" id="inicio">
            <div className="container">
                <div className="row align-items-center g-4 g-lg-5">
                    <div className="col-lg-6">
                        <h1 className="hero-title">
                            Encontre os medicamentos<br />
                            <span className="text-primary-brand">que você precisa</span>
                        </h1>
                        <img src="/image/remedios_hero.png" alt="Medicamentos"
                            className="img-fluid d-lg-none mb-4 hero-main-image" />
                        <p className="hero-description">
                            Compre medicamentos de forma rápida, segura e prática. Entrega para todo o Brasil.
                        </p>
                        <a href="#como-funciona" className="btn-hero-cta">Saiba mais</a>

                        <div className="hero-features">
                            <div className="hero-feature-item">
                                <span className="hero-feature-icon"><i className="bi bi-shield-check"></i></span>
                                <span>Compra 100% segura</span>
                            </div>
                            <div className="hero-feature-item">
                                <span className="hero-feature-icon"><i className="bi bi-truck"></i></span>
                                <span>Entrega rápida</span>
                            </div>
                            <div className="hero-feature-item">
                                <span className="hero-feature-icon"><i className="bi bi-patch-check"></i></span>
                                <span>Medicamentos originais</span>
                            </div>
                        </div>
                    </div>

                    <div className="col-lg-6">
                        <div className="hero-visual">
                            <span className="hero-deco capsule-1" aria-hidden="true"></span>
                            <span className="hero-deco capsule-2" aria-hidden="true"></span>
                            <span className="hero-deco capsule-3" aria-hidden="true"></span>
                            <span className="hero-deco plus-1" aria-hidden="true">+</span>
                            <span className="hero-deco plus-2" aria-hidden="true">+</span>
                            <span className="hero-deco plus-3" aria-hidden="true">+</span>

                            <div className="hero-image-slot">
                                <img src="/image/remedios_hero.png" alt="Medicamentos"
                                    className="img-fluid hero-main-image d-none d-lg-block" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        {categorias.length > 0 ? (
        <section className="home-section" id="categorias">
            <div className="container">
                <div className="home-section-header">
                    <h2 className="home-section-title">Busque por categorias</h2>
                    <div className="home-section-actions">
                        <Link to="/categoria_nova" state={{ voltarPara: `${location.pathname}${location.search}#categorias` }}
                            className="btn btn-primary btn-sm rounded-3 px-3">
                            <i className="bi bi-plus-lg me-1"></i> Adicionar categoria
                        </Link>
                        <Link to="/categorias" className="link-ver-todas">Ver todas <i className="bi bi-arrow-right"></i></Link>
                    </div>
                </div>

                <div className="carousel-wrap position-relative">
                    <Swiper {...SWIPER_BASE} className="swiper-categorias"
                        slidesPerView={2.2}
                        navigation={{ nextEl: ".swiper-cat-next", prevEl: ".swiper-cat-prev" }}
                        breakpoints={{
                            576: { slidesPerView: 3.2 },
                            768: { slidesPerView: 4.2 },
                            992: { slidesPerView: 5.2 },
                            1200: { slidesPerView: 6.2 },
                        }}>
                        {categorias.map((c) => (
                            <SwiperSlide key={c.id}>
                                <Link to={`/?categoria=${c.id}#catalogo`} className="category-card">
                                    <div className="category-card-icon">
                                        <i className="bi bi-capsule"></i>
                                    </div>
                                    <p className="category-card-name">{c.nome}</p>
                                </Link>
                            </SwiperSlide>
                        ))}
                    </Swiper>
                    <button type="button" className="swiper-button-prev-custom swiper-cat-prev" aria-label="Categorias anteriores">
                        <i className="bi bi-chevron-left"></i>
                    </button>
                    <button type="button" className="swiper-button-next-custom swiper-cat-next" aria-label="Próximas categorias">
                        <i className="bi bi-chevron-right"></i>
                    </button>
                </div>
            </div>
        </section>
        ) : null}

        <section className="home-section" id="medicamentos">
            <div className="container">
                <div className="home-section-header">
                    <h2 className="home-section-title">Medicamentos em destaque</h2>
                    <a href="#catalogo" className="link-ver-todas">Ver todas <i className="bi bi-arrow-right"></i></a>
                </div>

                <div id="carousel-medicamentos" className="carousel-wrap position-relative">
                    <Swiper {...SWIPER_BASE} className="swiper-medicamentos"
                        slidesPerView={1.15}
                        navigation={{ nextEl: ".swiper-med-next", prevEl: ".swiper-med-prev" }}
                        breakpoints={{
                            576: { slidesPerView: 2.2 },
                            768: { slidesPerView: 3.2 },
                            992: { slidesPerView: 4.2 },
                            1200: { slidesPerView: 4.5 },
                        }}>
                        {destaques === null ? (
                            <SwiperSlide>
                                <div className="empty-state w-100">Carregando destaques...</div>
                            </SwiperSlide>
                        ) : destaques.length === 0 ? (
                            <SwiperSlide>
                                <div className="empty-state w-100">Nenhum medicamento em destaque no momento.</div>
                            </SwiperSlide>
                        ) : (
                            destaques.map((m) => (
                                <SwiperSlide key={m.remedio_id}>
                                    <CardDestaque remedio={m} />
                                </SwiperSlide>
                            ))
                        )}
                    </Swiper>
                    <button type="button" className="swiper-button-prev-custom swiper-med-prev" aria-label="Medicamentos anteriores">
                        <i className="bi bi-chevron-left"></i>
                    </button>
                    <button type="button" className="swiper-button-next-custom swiper-med-next" aria-label="Próximos medicamentos">
                        <i className="bi bi-chevron-right"></i>
                    </button>
                </div>
            </div>
        </section>

        <section className="como-funciona-section" id="como-funciona">
            <div className="container">
                <h2 className="home-section-title text-center mb-5">Como funciona?</h2>
                <div className="row g-4">
                    <div className="col-md-4">
                        <article className="step-card">
                            <div className="step-card-icon"><i className="bi bi-search"></i></div>
                            <h3 className="step-card-title">Escolha o medicamento</h3>
                            <p className="step-card-text">
                                Navegue pelo catálogo ou busque pelo nome. Compare opções e encontre o que precisa com praticidade.
                            </p>
                        </article>
                    </div>
                    <div className="col-md-4">
                        <article className="step-card">
                            <div className="step-card-icon"><i className="bi bi-bag-check"></i></div>
                            <h3 className="step-card-title">Faça seu pedido</h3>
                            <p className="step-card-text">
                                Adicione aos favoritos, veja detalhes e finalize com segurança em poucos cliques.
                            </p>
                        </article>
                    </div>
                    <div className="col-md-4">
                        <article className="step-card">
                            <div className="step-card-icon"><i className="bi bi-house-door"></i></div>
                            <h3 className="step-card-title">Receba em casa</h3>
                            <p className="step-card-text">
                                Entrega rápida para todo o Brasil. Medicamentos originais com total confiança.
                            </p>
                        </article>
                    </div>
                </div>
            </div>
        </section>

        <section className="catalog-section" id="catalogo">
            <div className="container py-2">
                <div className="row align-items-center mb-4 g-3 catalog-header">
                    <div className="col-md-4">
                        <h3 className="home-section-title mb-1">Catálogo de remédios</h3>
                        <p className="text-muted small mb-0">Explore todos os medicamentos disponíveis</p>
                    </div>
                    <div className="col-md-5">
                        <form id="form-busca-catalogo" className="d-flex catalog-search-form" onSubmit={buscarNoCatalogo}>
                            <input type="text" name="q" id="input-busca-catalogo" className="form-control"
                                placeholder="Buscar por nome..." defaultValue={termo} key={termo} />
                            <button type="submit" className="btn btn-primary">
                                <i className="bi bi-search"></i>
                            </button>
                        </form>
                    </div>
                    <div className="col-md-3 text-md-end d-flex flex-column gap-2">
                        <Link to="/remedio_novo" state={{ voltarPara: `${location.pathname}${location.search}#catalogo` }}
                            className="btn btn-primary w-100 rounded-3 py-2">
                            <i className="bi bi-plus-lg me-1"></i> Adicionar remédio
                        </Link>
                        {/* "Gerenciar remédios" não aparece mais aqui: fica só no painel do admin */}
                        {categorias.length === 0 ? (
                            <Link to="/categorias" className="btn btn-outline-primary w-100 rounded-3 py-2">
                                <i className="bi bi-plus-lg me-1"></i> Adicionar categoria
                            </Link>
                        ) : null}
                    </div>
                </div>

                <div id="catalogo-grid" className="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 g-4 product-grid">
                    {catalogo === null ? (
                        <div className="col-12" id="catalogo-empty-state">
                            <div className="empty-state">
                                <p className="fs-5 mb-0">Carregando remédios...</p>
                            </div>
                        </div>
                    ) : catalogo.length === 0 ? (
                        <div className="col-12">
                            <div className="empty-state"><p className="fs-5 mb-0">Nenhum remédio cadastrado ainda.</p></div>
                        </div>
                    ) : (
                        catalogo.map((m) => (
                            <CardRemedio key={m.remedio_id} remedio={m}
                                nomeCategoria={nomesDasCategorias[m.categoria_remedio] || m.categoria_remedio}
                                logado={logado} favorito={favoritos.includes(m.remedio_id)} aoFavoritar={aoFavoritar} />
                        ))
                    )}
                </div>
            </div>
        </section>
    </CssDaPagina>
    </>
    )
}

export default Home
