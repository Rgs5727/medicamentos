import { Link, useLocation, useNavigate } from "react-router-dom"
import CssDaPagina from "../components/CssDaPagina"

// Mesma página do templates/error403.html antigo. Decisão do plano: qualquer
// tentativa de abrir uma página sem permissão (ex: editar pela URL o remédio
// de outra pessoa, ou abrir /moderacao sem ser admin) mostra esta página.
// Os textos mudam conforme quem está vendo, como no Jinja antigo.
// Qual página a pessoa tentou abrir e o que precisa para acessar
const PAGINAS = [
    { rota: /^\/moderacao/, nome: "Moderação (Pendentes)", precisa: "ser administrador", soAdmin: true },
    { rota: /^\/usuarios/, nome: "Controle de Usuários", precisa: "ser administrador", soAdmin: true },
    { rota: /^\/menu/, nome: "Menu do Administrador", precisa: "ser administrador", soAdmin: true },
    { rota: /^\/remedios\/[^/]+\/editar/, nome: "Editar remédio", precisa: "ser quem cadastrou o remédio ou administrador" },
    { rota: /^\/categorias\/[^/]+\/editar/, nome: "Editar categoria", precisa: "ser quem cadastrou a categoria ou administrador" },
    { rota: /^\/comentarios\/[^/]+\/editar/, nome: "Editar comentário", precisa: "ser quem escreveu o comentário ou administrador" },
]

function Erro403({ usuario }){
    const navigate = useNavigate()
    const location = useLocation()
    const logado = Boolean(usuario)
    const ehAdm = Boolean(usuario?.adm)
    const pagina = PAGINAS.find((pg) => pg.rota.test(location.pathname))
    // O banco diz que é admin, mas a página de admin foi recusada: o login (token)
    // é de antes de a pessoa virar administrador
    const loginAntigo = ehAdm && pagina?.soAdmin

    function voltar(e){
        e.preventDefault()
        navigate(-1)
    }

    return (
    <>
    <CssDaPagina arquivo="error403.css">
    <section className="error403-page">
        <div className="error403-card">
            <div className="error403-grid">
                <div className="error403-col error403-col-main">
                    <div className="error403-icon-wrap" aria-hidden="true">
                        <i className="bi bi-shield-lock"></i>
                    </div>
                    <p className="error403-code">403</p>
                    {!logado ? (
                        <>
                        <span className="error403-badge error403-badge-guest">Visitante</span>
                        <h1 className="error403-title">Login necessário</h1>
                        <p className="error403-lead">
                            Esta área é restrita. Entre na sua conta ou crie um cadastro para continuar.
                        </p>
                        </>
                    ) : ehAdm ? (
                        <>
                        <span className="error403-badge error403-badge-admin">Administrador</span>
                        <h1 className="error403-title">Recurso indisponível</h1>
                        <p className="error403-lead">
                            Você está logado como administrador, mas este recurso não pôde ser acessado agora.
                        </p>
                        </>
                    ) : (
                        <>
                        <span className="error403-badge error403-badge-user">Usuário</span>
                        <h1 className="error403-title">Permissão insuficiente</h1>
                        <p className="error403-lead">
                            Sua conta não tem autorização para acessar esta área. Algumas seções são exclusivas para administradores.
                        </p>
                        </>
                    )}
                </div>

                <div className="error403-col error403-col-info">
                    {logado ? (
                        <>
                        <h2 className="error403-subtitle">Seu acesso</h2>
                        <ul className="error403-reasons">
                            <li><i className="bi bi-person-badge"></i> Você é: <strong>{ehAdm ? "Administrador" : "Usuário comum"}</strong></li>
                            <li><i className="bi bi-file-earmark-lock"></i> Página que você tentou abrir: <strong>{pagina ? pagina.nome : location.pathname}</strong></li>
                            <li><i className="bi bi-key"></i> Para acessar é preciso: <strong>{pagina ? pagina.precisa : "ter permissão"}</strong></li>
                        </ul>
                        {loginAntigo ? (
                            <div className="error403-tip">
                                <i className="bi bi-lightbulb"></i>
                                <span>Você virou administrador depois de entrar. Clique em <strong>Sair</strong> (lá em cima) e entre de novo para liberar esta página.</span>
                            </div>
                        ) : null}
                        </>
                    ) : null}
                    <h2 className="error403-subtitle">O que pode ter acontecido</h2>
                    {!logado ? (
                        <ul className="error403-reasons">
                            <li><i className="bi bi-check2-circle"></i> Você ainda não está autenticado</li>
                            <li><i className="bi bi-check2-circle"></i> A página exige uma sessão ativa</li>
                            <li><i className="bi bi-check2-circle"></i> Sua sessão pode ter expirado</li>
                        </ul>
                    ) : ehAdm ? (
                        <ul className="error403-reasons">
                            <li><i className="bi bi-check2-circle"></i> O conteúdo pode ter sido removido</li>
                            <li><i className="bi bi-check2-circle"></i> O link pode estar desatualizado</li>
                            <li><i className="bi bi-check2-circle"></i> Houve um problema ao validar sua sessão</li>
                        </ul>
                    ) : (
                        <ul className="error403-reasons">
                            <li><i className="bi bi-check2-circle"></i> Seu perfil é de usuário comum</li>
                            <li><i className="bi bi-check2-circle"></i> Apenas ADMs podem acessar esta página</li>
                            <li><i className="bi bi-check2-circle"></i> Verifique se entrou com a conta correta</li>
                        </ul>
                    )}

                    <div className="error403-tip">
                        <i className="bi bi-lightbulb"></i>
                        {!logado ? (
                            <span>Faça login para acessar seu perfil, favoritos e outras áreas protegidas.</span>
                        ) : ehAdm ? (
                            <span>Tente voltar ao painel admin ou retornar à página anterior.</span>
                        ) : (
                            <span>Se precisar de acesso administrativo, entre em contato com a equipe responsável.</span>
                        )}
                    </div>

                    <div className="error403-actions">
                        {!logado ? (
                            <>
                            <Link to="/login" className="error403-btn error403-btn-primary">
                                <i className="bi bi-box-arrow-in-right"></i> Entrar
                            </Link>
                            <Link to="/cadastro" className="error403-btn error403-btn-secondary">
                                <i className="bi bi-person-plus"></i> Criar conta
                            </Link>
                            </>
                        ) : null /* logado: só a opção de voltar (pedido do dono do projeto) */}
                        <a href="#" onClick={voltar} className="error403-btn error403-btn-ghost">
                            <i className="bi bi-arrow-left"></i> Voltar
                        </a>
                    </div>
                </div>
            </div>
        </div>
    </section>
    </CssDaPagina>
    </>
    )
}

export default Erro403
