import { Link } from "react-router-dom"
import CssDaPagina from "../components/CssDaPagina"

// "Quinta-feira, 8 de novembro de 2026" (mesmo formato do script do menu.html antigo)
function dataDeHoje(){
    const texto = new Date().toLocaleDateString("pt-BR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })
    return texto.charAt(0).toUpperCase() + texto.slice(1)
}

// Menu do Administrador: mesma estrutura do templates/usuarios/menu.html
// (o CSS do <style> dele foi copiado sem alteração para public/style/menu.css).
// Só administrador entra (RotaProtegida com exigirAdmin no App.jsx).
function MenuAdmin({ usuario }){
    return (
    <>
    <CssDaPagina arquivo="menu.css">
    <div className="container py-5">

        <div className="hero-admin d-flex flex-column flex-md-row justify-content-between align-items-md-center">
            <div>
                <div className="d-flex align-items-center mb-2">
                    <i className="bi bi-shield-check fs-2 me-3"></i>
                    <h1 className="display-6 fw-bold m-0">Painel Geral</h1>
                </div>
                <p className="lead mb-0 opacity-75">Olá, {usuario?.nome || "Administrador"}. Selecione uma ação abaixo para gerenciar o sistema.</p>
            </div>
            <div className="text-md-end mt-3 mt-md-0">
                <div id="current-date" className="fw-bold fs-5">{dataDeHoje()}</div>
                <div className="small opacity-75"><i className="bi bi-clock me-1"></i> Acesso Administrativo</div>
            </div>
        </div>

        <h4 className="fw-bold mb-4 text-secondary">Gerenciamento do Sistema</h4>
        <div className="row g-4">
            <div className="col-sm-6 col-lg-3">
                <Link to="/remedio_novo" state={{ voltarPara: "/menu" }} className="action-btn">
                    <i className="bi bi-plus-circle text-primary"></i>
                    <span>Novo Remédio</span>
                </Link>
            </div>
            <div className="col-sm-6 col-lg-3">
                <Link to="/categorias" className="action-btn">
                    <i className="bi bi-folder-plus text-warning"></i>
                    <span>Categorias</span>
                </Link>
            </div>
            <div className="col-sm-6 col-lg-3">
                <Link to="/moderacao" className="action-btn">
                    <i className="bi bi-shield-exclamation text-danger"></i>
                    <span>Moderação</span>
                </Link>
            </div>
            <div className="col-sm-6 col-lg-3">
                <Link to="/usuarios" className="action-btn">
                    <i className="bi bi-people-fill text-success"></i>
                    <span>Usuários</span>
                </Link>
            </div>
        </div>

    </div>
    </CssDaPagina>
    </>
    )
}

export default MenuAdmin
