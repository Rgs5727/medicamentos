import { useEffect, useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"

// Mesma navbar do base.html antigo (mesmas classes e mesma estrutura).
// No antigo, o menu.js trocava as classes d-none depois de perguntar
// GET /api/v1/auth/me; aqui quem decide é a prop "usuario", que o App.jsx
// preenche com a resposta dessa mesma rota.
function Navbar({ usuario, qtdFavoritos, aoSair }){
    const location = useLocation()
    const navigate = useNavigate()
    const [busca, setBusca] = useState(() => new URLSearchParams(location.search).get("q") || "")
    const [logoFalhou, setLogoFalhou] = useState(false)

    const logado = Boolean(usuario)
    const letraAvatar = usuario?.nome ? usuario.nome[0].toUpperCase() : "U"

    // No antigo cada clique recarregava a página, e o menu do celular fechava
    // sozinho. No React não recarrega, então fechamos o menu ao trocar de página.
    useEffect(() => {
        const menu = document.getElementById("menu")
        if(menu?.classList.contains("show") && window.bootstrap){
            window.bootstrap.Collapse.getOrCreateInstance(menu, { toggle: false }).hide()
        }
    }, [location.key])

    // Busca da navbar: leva ao catálogo da página inicial filtrado pelo nome
    // (no antigo era um formulário GET para /remedios?q=...#catalogo)
    function buscar(e){
        e.preventDefault()
        const texto = busca.trim()
        navigate(texto ? `/?q=${encodeURIComponent(texto)}#catalogo` : "/#catalogo")
    }

    function sair(e){
        e.preventDefault()
        aoSair()
    }

    // O ícone reserva tinha style="color: #3B56FF !important" no antigo.
    // O React não aceita !important no style={{}}, por isso vai por aqui.
    function corDoIconeReserva(elemento){
        if(elemento){
            elemento.style.setProperty("color", "#3B56FF", "important")
            elemento.style.fontSize = "1.5rem"
        }
    }

    return (
    <>
    <div className="navbar-wrapper">
        <nav className="navbar navbar-expand-xl navbar-light navbar-sabor">
            <div className="container-fluid px-0 px-xl-2">
                <Link className="navbar-brand d-flex align-items-center" to="/">
                    {!logoFalhou && <img src="/image/vitamina.png" alt="Logo" className="me-2" onError={() => setLogoFalhou(true)} />}
                    <i ref={corDoIconeReserva} className={`bi bi-capsule-pill text-primary me-2 ${logoFalhou ? "" : "d-none"} logo-fallback-icon`}></i>
                    <span className="logo-text">SabØr FⱯrmⱯciⱯ</span>
                </Link>

                <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#menu"
                    aria-controls="menu" aria-expanded="false" aria-label="Alternar menu">
                    <span className="navbar-toggler-icon"></span>
                </button>

                <div className="collapse navbar-collapse" id="menu">
                    <ul className="navbar-nav mx-auto mb-2 mb-xl-0 align-items-xl-center">
                        <li className="nav-item">
                            <Link className="nav-link" to="/">Início</Link>
                        </li>
                        <li className="nav-item">
                            <Link className="nav-link" to="/#medicamentos">Medicamentos</Link>
                        </li>
                        <li className="nav-item">
                            <Link className="nav-link" to="/categorias">Categorias</Link>
                        </li>
                        <li className="nav-item">
                            <Link className="nav-link" to="/#como-funciona">Como funciona</Link>
                        </li>
                        <li className="nav-item">
                            <Link className="nav-link" to="/sobre">Sobre nós</Link>
                        </li>
                    </ul>

                    <div className="d-flex flex-column flex-xl-row align-items-xl-center gap-2 gap-xl-3 ms-xl-auto">
                        <form id="navbar-search-form" onSubmit={buscar}
                            className={`navbar-search-form ${logado ? "" : "d-none"}`}>
                            <input type="text" name="q" placeholder="Buscar medicamentos..." value={busca}
                                onChange={(e) => setBusca(e.target.value)} aria-label="Buscar medicamentos" />
                            <button type="submit" className="navbar-search-btn" aria-label="Buscar">
                                <i className="bi bi-search"></i>
                            </button>
                        </form>

                        <Link id="navbar-fav-link" to="/conta" className={`navbar-fav-link ${logado ? "" : "d-none"}`}
                            title="Meus favoritos" aria-label="Favoritos">
                            <i className="bi bi-heart fs-5"></i>
                            {/* Selo com a quantidade de favoritos (aparece quando há pelo menos 1) */}
                            <span className={`navbar-fav-badge ${qtdFavoritos > 0 ? "" : "d-none"}`} id="fav-badge">{qtdFavoritos}</span>
                        </Link>

                        <div className="d-flex gap-2 align-items-center navbar-auth-group">
                            <Link id="navbar-avatar-link" to="/conta" className={`avatar-link ${logado ? "" : "d-none"}`}
                                title="Minha conta">
                                <div className="avatar-circle" id="navbar-avatar-letter">{letraAvatar}</div>
                            </Link>
                            <a id="navbar-logout-link" href="/" onClick={sair} className={`btn-auth logout ${logado ? "" : "d-none"}`}>Sair</a>
                            <Link id="navbar-login-link" to="/login" className={`btn-auth login ${logado ? "d-none" : ""}`}>Entrar</Link>
                            <Link id="navbar-register-link" to="/cadastro" className={`btn-auth register ${logado ? "d-none" : ""}`}>Cadastrar</Link>
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    </div>
    </>
    )
}

export default Navbar
