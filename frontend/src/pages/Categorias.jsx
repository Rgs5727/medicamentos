import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import CssDaPagina from "../components/CssDaPagina"
import CardCategoria from "../components/CardCategoria"
import { api, mensagemDeErro } from "../services/api"
import { excluirCategoria, podeMexerNaCategoria } from "../services/categorias"

// Lista de categorias: mesma estrutura do templates/categorias/categorias.html
// (o CSS do <style> dele foi copiado sem alteração para public/style/categorias.css).
//  - "Minhas pendentes" (admin: "Pendentes") só aparece se existir alguma
//  - Editar/Excluir só para o dono da categoria ou o admin
function Categorias({ usuario, mostrarToast }){
    const [categorias, setCategorias] = useState(null) // null = carregando
    const [pendentes, setPendentes] = useState([])
    const [versao, setVersao] = useState(0)            // aumenta para recarregar
    const logado = Boolean(usuario)

    useEffect(() => {
        let cancelado = false
        const pedidos = [api.get("/api/categorias")]
        if(logado) pedidos.push(api.get("/api/categorias/pendentes"))
        Promise.all(pedidos)
            .then(([resAprovadas, resPendentes]) => {
                if(!cancelado){
                    setCategorias(resAprovadas.data)
                    setPendentes(resPendentes ? resPendentes.data : [])
                }
            })
            .catch((error) => {
                if(!cancelado){
                    setCategorias([])
                    if(error.response?.status !== 401) mostrarToast(mensagemDeErro(error), "danger")
                }
            })
        return () => { cancelado = true }
    }, [versao, logado, mostrarToast])

    async function excluir(categoria){
        if(await excluirCategoria(categoria, mostrarToast)) setVersao((v) => v + 1)
    }

    return (
    <>
    <CssDaPagina arquivo="categorias.css">
    <div className="container py-5">

        <div className="page-header-box d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-3 mb-5">
            <div>
                <h2 className="h3 fw-bold text-dark mb-1">Categorias</h2>
                <p className="text-muted small mb-0">Gerencie e organize as divisões de medicamentos do catálogo.</p>
            </div>
            <Link to="/categoria_nova" state={{ voltarPara: "/categorias" }}
                className="btn btn-primary btn-create-premium px-4 py-2_5 text-decoration-none">
                <i className="bi bi-plus-lg me-1"></i> Nova Categoria
            </Link>
        </div>

        {pendentes.length > 0 ? (
            <>
            <h4 className="fw-bold mb-4">{usuario?.adm ? "Pendentes" : "Minhas pendentes"}</h4>
            <div className="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 g-4 mb-5">
                {pendentes.map((c) => (
                    <CardCategoria key={c.id} categoria={c} pendente podeMexer={podeMexerNaCategoria(usuario, c)}
                        voltarPara="/categorias" aoExcluir={excluir} />
                ))}
            </div>
            </>
        ) : null}

        <div id="categorias-grid" className="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 g-4">
            {categorias === null ? (
                <div className="col-12 text-center py-5" id="categorias-empty-state">
                    <p className="text-muted italic">Carregando categorias...</p>
                </div>
            ) : categorias.length === 0 ? (
                <div className="col-12 text-center py-5">
                    <p className="text-muted italic">Nenhuma categoria encontrada.</p>
                </div>
            ) : (
                categorias.map((c) => (
                    <CardCategoria key={c.id} categoria={c} podeMexer={podeMexerNaCategoria(usuario, c)}
                        voltarPara="/categorias" aoExcluir={excluir} />
                ))
            )}
        </div>

    </div>
    </CssDaPagina>
    </>
    )
}

export default Categorias
