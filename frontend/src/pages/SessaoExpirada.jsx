import { Link, useLocation } from "react-router-dom"
import CssDaPagina from "../components/CssDaPagina"

// Aberta pelo App.jsx quando o token vence (timer de 30 min) ou quando a
// API responde 401 para um pedido que levou token.
// Visual: o mesmo da página 403 antiga (error403.css, sem alteração).
function SessaoExpirada(){
    const location = useLocation()
    // Página onde a sessão expirou: o "Entrar novamente" leva ela até o
    // login, e o login devolve a pessoa para lá depois de entrar.
    const voltarPara = location.state?.voltarPara

    return (
    <>
    <CssDaPagina arquivo="error403.css">
        <section className="error403-page">
            <div className="error403-card">
                <div className="error403-grid">
                    <div className="error403-col error403-col-main">
                        <div className="error403-icon-wrap" aria-hidden="true">
                            <i className="bi bi-clock-history"></i>
                        </div>
                        <p className="error403-code">401</p>
                        <span className="error403-badge error403-badge-guest">Desconectado</span>
                        <h1 className="error403-title">Sessão expirada</h1>
                        <p className="error403-lead">
                            Por segurança, o login vale 30 minutos. Esse tempo acabou e você foi desconectado.
                        </p>
                    </div>

                    <div className="error403-col error403-col-info">
                        <h2 className="error403-subtitle">O que aconteceu</h2>
                        <ul className="error403-reasons">
                            <li><i className="bi bi-check2-circle"></i> O token de acesso passou do prazo de 30 minutos</li>
                            <li><i className="bi bi-check2-circle"></i> O token foi apagado deste navegador</li>
                            <li><i className="bi bi-check2-circle"></i> As páginas protegidas pedem um novo login</li>
                        </ul>

                        <div className="error403-tip">
                            <i className="bi bi-lightbulb"></i>
                            <span>Entre novamente para voltar para a página onde você estava.</span>
                        </div>

                        <div className="error403-actions">
                            <Link to="/login" state={{ voltarPara }} className="error403-btn error403-btn-primary">
                                <i className="bi bi-box-arrow-in-right"></i> Entrar novamente
                            </Link>
                            <Link to="/" className="error403-btn error403-btn-secondary">
                                <i className="bi bi-house-door"></i> Ir para o início
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    </CssDaPagina>
    </>
    )
}

export default SessaoExpirada
