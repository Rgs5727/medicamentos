import { useEffect, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import CssDaPagina from "../components/CssDaPagina"
import CardCategoria from "../components/CardCategoria"
import { api, mensagemDeErro } from "../services/api"
import { excluirCategoria, podeMexerNaCategoria } from "../services/categorias"

// Cadastrar categoria: mesma estrutura do templates/categorias/cadastrar_categoria.html
// (cadastro.css + categoria.css), com "Categorias Existentes" embaixo.
// Igual ao antigo: depois de salvar, limpa o campo e atualiza a lista.
function CategoriaNova({ usuario, mostrarToast }){
    const navigate = useNavigate()
    const location = useLocation()
    const voltarPara = location.state?.voltarPara || "/categorias"

    const [nome, setNome] = useState("")
    const [categorias, setCategorias] = useState(null)
    const [versao, setVersao] = useState(0)

    useEffect(() => {
        let cancelado = false
        api.get("/api/categorias")
            .then((resposta) => { if(!cancelado) setCategorias(resposta.data) })
            .catch((error) => {
                if(!cancelado){
                    setCategorias([])
                    mostrarToast(mensagemDeErro(error), "danger")
                }
            })
        return () => { cancelado = true }
    }, [versao, mostrarToast])

    async function salvar(e){
        e.preventDefault()
        try {
            const resposta = await api.post("/api/categorias", { nome })
            // adm: "Categoria cadastrada com sucesso!"; comum: "...enviado para aprovação."
            mostrarToast(resposta.data.mensagem, "success")
            setNome("")
            setVersao((v) => v + 1)
        } catch (error) {
            if(error.response?.status !== 401) mostrarToast(mensagemDeErro(error), "danger")
        }
    }

    function cancelar(e){
        e.preventDefault()
        navigate(voltarPara)
    }

    async function excluir(categoria){
        if(await excluirCategoria(categoria, mostrarToast)) setVersao((v) => v + 1)
    }

    return (
    <>
    <CssDaPagina arquivos={["cadastro.css", "categoria.css"]}>
    <div className="container py-5 d-flex justify-content-center">
        <div className="card card-cadastro shadow-sm border-0">
            <div className="card-body p-4 p-md-5">
                <div className="header-cadastro mb-4">
                    <h3 className="fw-bold text-dark">Cadastrar Categoria</h3>
                    <p className="text-muted small">Adicione uma nova categoria ao catálogo.</p>
                </div>

                <form id="form-categoria" onSubmit={salvar}>
                    <div className="row justify-content-center">
                        <div className="col-lg-8 col-md-10 mb-4">
                            <label className="form-label">Nome da categoria <span className="text-danger">*</span></label>
                            <input type="text" name="nome" className="form-control" placeholder="Ex: Analgésico"
                                value={nome} onChange={(e) => setNome(e.target.value)} required />
                        </div>
                        <div className="col-lg-8 col-md-10 mb-4"></div>
                    </div>

                    <div className="d-flex gap-2">
                        <button type="submit" className="btn btn-primary btn-save flex-fill py-2 fw-bold">
                            Salvar Categoria
                        </button>
                        <a href="/categorias" onClick={cancelar} className="btn btn-light border flex-fill py-2">Cancelar</a>
                    </div>
                </form>

                <hr className="my-5" />
                <h4 className="fw-bold mb-4">Categorias Existentes</h4>

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
                                voltarPara="/categoria_nova" aoExcluir={excluir} />
                        ))
                    )}
                </div>
            </div>
        </div>
    </div>
    </CssDaPagina>
    </>
    )
}

export default CategoriaNova
