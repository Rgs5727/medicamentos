import { useEffect, useState } from "react"
import CssDaPagina from "../components/CssDaPagina"
import Erro403 from "./Erro403"
import { api, mensagemDeErro } from "../services/api"

const FILTROS = [
    { valor: "all", texto: "Todos" },
    { valor: "adm", texto: "Administradores" },
    { valor: "comum", texto: "Usuários Comuns" },
]

// Controle de Usuários: mesma estrutura do templates/usuarios/usuarios.html
// (o CSS do <style> dele foi copiado sem alteração para public/style/usuarios.css).
// Usa a API que já existia: GET /api/v1/usuarios e PUT /api/v1/usuarios/<email>.
// A janela (modal) é controlada pelo React, com as mesmas classes do Bootstrap.
function Usuarios({ usuario, mostrarToast }){
    const [lista, setLista] = useState(null)      // null = carregando
    const [semPermissao, setSemPermissao] = useState(false)
    const [versao, setVersao] = useState(0)       // aumenta para recarregar
    const [busca, setBusca] = useState("")
    const [filtro, setFiltro] = useState("all")
    const [aberto, setAberto] = useState(null)    // e-mail do usuário com a janela aberta

    useEffect(() => {
        let cancelado = false
        api.get("/api/v1/usuarios")
            .then((resposta) => { if(!cancelado) setLista(resposta.data) })
            .catch((error) => {
                if(cancelado) return
                if(error.response?.status === 403){
                    setSemPermissao(true) // ex.: virou admin mas ainda está com o token antigo
                } else if(error.response?.status !== 401){
                    setLista([])
                    mostrarToast(mensagemDeErro(error), "danger")
                }
            })
        return () => { cancelado = true }
    }, [versao, mostrarToast])

    // Igual ao Bootstrap: com a janela aberta, a página de trás não rola e o Esc fecha
    useEffect(() => {
        if(!aberto) return
        document.body.classList.add("modal-open")
        const aoApertarTecla = (e) => { if(e.key === "Escape") setAberto(null) }
        document.addEventListener("keydown", aoApertarTecla)
        return () => {
            document.body.classList.remove("modal-open")
            document.removeEventListener("keydown", aoApertarTecla)
        }
    }, [aberto])

    if(semPermissao){
        return <Erro403 usuario={usuario} />
    }

    const termo = busca.toLowerCase().trim()
    const visiveis = (lista || []).filter((u) => {
        const papel = u.adm ? "adm" : "comum"
        const combinaBusca = u.nome.toLowerCase().includes(termo) || u.email.toLowerCase().includes(termo)
        return combinaBusca && (filtro === "all" || papel === filtro)
    })
    const selecionado = lista?.find((u) => u.email === aberto) || null

    async function mudarCargo(alvo, tornarAdm){
        try {
            await api.put(`/api/v1/usuarios/${encodeURIComponent(alvo.email)}`, { tornar_adm: tornarAdm })
            // Mesmas mensagens do flash antigo
            mostrarToast(tornarAdm
                ? `Usuário ${alvo.email} promovido a administrador.`
                : `Usuário ${alvo.email} rebaixado para usuário comum.`, "success")
            setAberto(null)
            setVersao((v) => v + 1)
        } catch (error) {
            if(error.response?.status !== 401) mostrarToast(mensagemDeErro(error), "danger")
        }
    }

    return (
    <>
    <CssDaPagina arquivo="usuarios.css">
    <div className="container py-5 page-users">
        <header className="users-header-section">
            <div className="users-header-flex">
                <div className="users-header-icon">
                    <i className="bi bi-people-fill"></i>
                </div>
                <div>
                    <h1 className="users-title">Controle de Usuários</h1>
                    <p className="text-muted m-0">Gerencie permissões, papéis administrativos e contas cadastradas na plataforma.</p>
                </div>
            </div>
        </header>

        <div className="users-controls">
            <div className="row g-3 align-items-center">
                <div className="col-lg-6">
                    <div className="search-input-wrap">
                        <i className="bi bi-search"></i>
                        <input type="text" id="userSearchInput" className="form-control" placeholder="Buscar usuário por nome ou e-mail..."
                            autoComplete="off" value={busca} onChange={(e) => setBusca(e.target.value)} />
                    </div>
                </div>
                <div className="col-lg-6 text-lg-end">
                    <div className="filter-btn-group justify-content-lg-end">
                        {FILTROS.map((f) => (
                            <button key={f.valor} type="button" className={`btn-filter${filtro === f.valor ? " active" : ""}`}
                                onClick={() => setFiltro(f.valor)}>
                                {f.texto}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>

        <div className="users-grid" id="usersContainer">
            {visiveis.map((u) => (
                <div key={u.email} className="user-card-item">
                    <button type="button" className="user-card-btn" onClick={() => setAberto(u.email)}>
                        {usuario?.email === u.email ? <span className="badge-self">Você</span> : null}
                        <div className="user-card-avatar">
                            {u.nome ? u.nome[0].toUpperCase() : ""}
                        </div>
                        <h3 className="user-card-name">{u.nome}</h3>
                        <p className="user-card-email">{u.email}</p>
                        {u.adm ? (
                            <span className="badge-role adm"><i className="bi bi-shield-lock-fill"></i> Administrador</span>
                        ) : (
                            <span className="badge-role comum"><i className="bi bi-person-fill"></i> Usuário</span>
                        )}
                    </button>
                </div>
            ))}

            <div className={`users-empty-state${lista !== null && visiveis.length === 0 ? "" : " d-none"}`} id="emptyState">
                <i className="bi bi-person-x fs-1 opacity-50 d-block mb-2"></i>
                <h5>Nenhum usuário encontrado</h5>
                <p className="text-muted m-0">Verifique os termos digitados ou mude a seleção do filtro.</p>
            </div>
        </div>
    </div>

    {selecionado ? (
        <>
        <div className="modal fade show d-block" tabIndex="-1" role="dialog" aria-modal="true"
            onClick={(e) => { if(e.target === e.currentTarget) setAberto(null) }}>
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content modal-content-custom">
                    <div className="modal-header border-0 pb-0">
                        <button type="button" className="btn-close" aria-label="Fechar" onClick={() => setAberto(null)}></button>
                    </div>
                    <div className="modal-body px-4 pt-0">
                        <div className="modal-user-profile">
                            <div className="modal-user-avatar">
                                {selecionado.nome ? selecionado.nome[0].toUpperCase() : ""}
                            </div>
                            <h4 className="fw-bold mb-1 text-dark">{selecionado.nome}</h4>
                            <span className={`badge rounded-pill ${selecionado.adm ? "bg-primary" : "bg-secondary"} bg-opacity-10 ${selecionado.adm ? "text-primary" : "text-secondary"} px-3 py-1 fw-bold fs-7`}>
                                {selecionado.adm ? "Administrador" : "Usuário Padrão"}
                            </span>
                        </div>
                        <div className="mt-4">
                            <div className="modal-info-group">
                                <div className="modal-info-label">Nome Completo</div>
                                <div className="modal-info-value">{selecionado.nome}</div>
                            </div>
                            <div className="modal-info-group">
                                <div className="modal-info-label">Endereço de E-mail</div>
                                <div className="modal-info-value"><i className="bi bi-envelope me-2 text-muted"></i>{selecionado.email}</div>
                            </div>
                            <div className="modal-info-group">
                                <div className="modal-info-label">Status da Conta</div>
                                <div className="modal-info-value">
                                    <span className="text-success fw-bold"><i className="bi bi-circle-fill me-2 fs-8"></i>Ativo</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="modal-footer bg-light border-0 p-4 justify-content-between">
                        <div className="w-100 text-center">
                            {usuario?.email !== selecionado.email ? (
                                selecionado.adm ? (
                                    <button type="button" onClick={() => mudarCargo(selecionado, false)}
                                        className="btn btn-outline-danger rounded-pill w-100 py-2 fw-bold">
                                        <i className="bi bi-shield-minus me-2"></i>Remover Cargo ADM
                                    </button>
                                ) : (
                                    <button type="button" onClick={() => mudarCargo(selecionado, true)}
                                        className="btn btn-primary rounded-pill w-100 py-2 fw-bold shadow-sm">
                                        <i className="bi bi-shield-plus me-2"></i>Promover a ADM
                                    </button>
                                )
                            ) : (
                                <p className="text-muted small m-0"><i className="bi bi-info-circle me-1"></i>Você não pode alterar suas próprias permissões.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div className="modal-backdrop fade show"></div>
        </>
    ) : null}
    </CssDaPagina>
    </>
    )
}

export default Usuarios
