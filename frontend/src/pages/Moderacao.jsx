import { useEffect, useState } from "react"
import CssDaPagina from "../components/CssDaPagina"
import Erro403 from "./Erro403"
import { api, mensagemDeErro } from "../services/api"

// "Tarjado" -> "Tarjado", "Venda Livre" -> "Venda livre" (o filtro |capitalize do Jinja)
function capitalizar(texto){
    return texto ? texto[0].toUpperCase() + texto.slice(1).toLowerCase() : ""
}

// Página de moderação: mesma estrutura do templates/usuarios/moderacao.html
// (o CSS dela, que ficava num <style> dentro do template, foi copiado sem
// alteração para public/style/moderacao.css). Só administrador entra
// (RotaProtegida com exigirAdmin no App.jsx + @admin_required na API).
function Moderacao({ usuario, mostrarToast }){
    const [dados, setDados] = useState(null)
    // true quando a API recusa (403): por exemplo, quem virou admin mas ainda
    // está com o token do login antigo (o token diz "usuário comum")
    const [semPermissao, setSemPermissao] = useState(false)
    // Aumenta depois de cada Aprovar/Rejeitar para recarregar as listas
    const [versao, setVersao] = useState(0)

    useEffect(() => {
        let cancelado = false
        api.get("/api/v1/moderacao")
            .then((resposta) => { if(!cancelado) setDados(resposta.data) })
            .catch((error) => {
                if(cancelado) return
                if(error.response?.status === 403){
                    setSemPermissao(true) // decisão do plano: sem permissão -> página 403
                } else if(error.response?.status !== 401){
                    mostrarToast(mensagemDeErro(error), "danger")
                }
            })
        return () => { cancelado = true }
    }, [versao, mostrarToast])

    // Aprovar / rejeitar: igual aos formulários antigos (POST + mensagem + lista atualizada)
    async function decidir(e, url, corpo, corDoToast){
        e.preventDefault()
        try {
            const resposta = await api.post(url, corpo)
            mostrarToast(resposta.data.mensagem, corDoToast)
            setVersao((v) => v + 1)
        } catch (error) {
            if(error.response?.status !== 401) mostrarToast(mensagemDeErro(error), "danger")
        }
    }

    if(semPermissao){
        return <Erro403 usuario={usuario} />
    }
    if(!dados){
        return null
    }
    const { remedios, categorias } = dados

    return (
    <>
    <CssDaPagina arquivo="moderacao.css">
    <div className="container py-5 page-moderation">

        <header className="mod-header-section">
            <div className="mod-header-flex">
                <div className="mod-header-icon">
                    <i className="bi bi-shield-check"></i>
                </div>
                <div>
                    <h1 className="mod-title">Painel de Moderação</h1>
                    <p className="mod-description">Analise, aprove ou rejeite as solicitações de novos cadastros na plataforma.</p>
                </div>
            </div>
        </header>

        <section className="mb-5">
            <h2 className="mod-section-title">
                Pedidos de cadastro de remédio{" "}
                {remedios.length > 0 ? <span className="badge">{remedios.length}</span> : null}
            </h2>

            {remedios.length > 0 ? (
                <div className="mod-grid">
                    {remedios.map((remedio) => (
                        <div className="mod-card" key={remedio.remedio_id}>
                            <div className="mod-card-body">
                                <span className="mod-card-id">ID #{remedio.remedio_id}</span>
                                <h3 className="mod-card-name">{remedio.nome_remedio}</h3>

                                <div className="mod-meta-item">
                                    <i className="bi bi-tags-fill mod-meta-icon"></i>
                                    <span><strong>Categoria:</strong> {remedio.categoria_remedio}</span>
                                </div>
                                <div className="mod-meta-item">
                                    <i className="bi bi-capsule mod-meta-icon"></i>
                                    <span><strong>Tipo:</strong> {capitalizar(remedio.tipo)}</span>
                                </div>
                            </div>

                            <div className="mod-card-actions">
                                <form className="w-100" onSubmit={(e) => decidir(e, "/api/v1/moderacao/medicamentos/aprovar", { remedio_id: remedio.remedio_id }, "success")}>
                                    <button type="submit" className="mod-btn mod-btn-approve">
                                        <i className="bi bi-check-lg"></i> Aprovar
                                    </button>
                                </form>
                                <form className="w-100" onSubmit={(e) => decidir(e, "/api/v1/moderacao/medicamentos/rejeitar", { remedio_id: remedio.remedio_id }, "info")}>
                                    <button type="submit" className="mod-btn mod-btn-reject">
                                        <i className="bi bi-x-lg"></i> Rejeitar
                                    </button>
                                </form>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="mod-empty-state">
                    <div className="mod-empty-icon">
                        <i className="bi bi-check2-all"></i>
                    </div>
                    <h4 className="mod-empty-title">Tudo limpo por aqui!</h4>
                    <p className="mod-empty-text">Não há pedidos de remédio pendentes no momento.</p>
                </div>
            )}
        </section>

        <section className="mb-4">
            <h2 className="mod-section-title">
                Pedidos de cadastro de categoria{" "}
                {categorias.length > 0 ? <span className="badge">{categorias.length}</span> : null}
            </h2>

            {categorias.length > 0 ? (
                <div className="mod-grid">
                    {categorias.map((categoria) => (
                        <div className="mod-card" key={categoria.id}>
                            <div className="mod-card-body">
                                <span className="mod-card-id">ID #{categoria.id}</span>
                                <h3 className="mod-card-name">{categoria.nome}</h3>

                                <div className="mod-meta-item">
                                    <i className="bi bi-folder-plus mod-meta-icon"></i>
                                    <span>Solicitação de nova categoria base</span>
                                </div>
                            </div>

                            <div className="mod-card-actions">
                                <form className="w-100" onSubmit={(e) => decidir(e, "/api/v1/moderacao/categorias/aprovar", { categoria_id: categoria.id }, "success")}>
                                    <button type="submit" className="mod-btn mod-btn-approve">
                                        <i className="bi bi-check-lg"></i> Aprovar
                                    </button>
                                </form>
                                <form className="w-100" onSubmit={(e) => decidir(e, "/api/v1/moderacao/categorias/rejeitar", { categoria_id: categoria.id }, "info")}>
                                    <button type="submit" className="mod-btn mod-btn-reject">
                                        <i className="bi bi-x-lg"></i> Rejeitar
                                    </button>
                                </form>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="mod-empty-state">
                    <div className="mod-empty-icon">
                        <i className="bi bi-folder-check"></i>
                    </div>
                    <h4 className="mod-empty-title">Nenhuma pendência</h4>
                    <p className="mod-empty-text">Não há pedidos de categoria aguardando revisão.</p>
                </div>
            )}
        </section>
    </div>
    </CssDaPagina>
    </>
    )
}

export default Moderacao
