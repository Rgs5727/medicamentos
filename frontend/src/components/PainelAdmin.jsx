import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { api } from "../services/api"

// Mesmo botão "Gerenciar Admin" + painel lateral do base.html antigo (só aparece
// para administrador). O App remonta este componente a cada troca de página,
// então ele começa sempre FECHADO — igual ao antigo, em que cada página recarregava.
//
// Selo "Novos" e o pontinho no botão: aparecem quando há pedidos pendentes
// (remédios ou categorias). Existiam na versão anterior e só tinham sido
// tirados porque não havia uma rota de API para saber se havia pendentes.
function PainelAdmin(){
    const [aberto, setAberto] = useState(false)
    const [temPendentes, setTemPendentes] = useState(false)

    useEffect(() => {
        let cancelado = false
        api.get("/api/v1/moderacao")
            .then((resposta) => {
                if(!cancelado){
                    setTemPendentes(resposta.data.remedios.length + resposta.data.categorias.length > 0)
                }
            })
            .catch(() => {}) // sem o selo se der erro (401 a sessão expirada já trata)
        return () => { cancelado = true }
    }, [])

    return (
    <>
    <button className={`admin-toggle-btn${temPendentes ? " has-pending" : ""}`} id="adminToggleBtn"
        onClick={() => setAberto(true)}>
        Gerenciar Admin
    </button>

    <aside className={`admin-sidebar${aberto ? "" : " hidden"}`} id="adminSidebar">
        <div className="admin-sidebar-header">
            <h3>Painel Admin</h3>
            <button id="closeAdminSidebar" className="close-btn" aria-label="Fechar Painel"
                onClick={() => setAberto(false)}>&times;</button>
        </div>

        <nav className="admin-sidebar-nav">
            <ul>
                <li><Link to="/menu" className="admin-link">Menu do Administrador</Link></li>

                <li className="nav-section-title">Moderação</li>
                <li>
                    <Link to="/moderacao" className="admin-link warning">
                        Pendentes{" "}
                        {temPendentes ? <span className="badge badge-warning">Novos</span> : null}
                    </Link>
                </li>

                <li className="nav-section-title">Gerenciamento</li>
                <li><Link to="/remedios" className="admin-link">Gerenciar remédios</Link></li>
                <li><Link to="/usuarios" className="admin-link">Usuários</Link></li>
            </ul>
        </nav>
    </aside>
    </>
    )
}

export default PainelAdmin
