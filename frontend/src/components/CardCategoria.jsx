import { Link } from "react-router-dom"

// Mesmo card "simples" do categorias.js antigo (criarCardSimples).
// Editar/Excluir só para o dono da categoria ou o admin.
function CardCategoria({ categoria, podeMexer, pendente = false, voltarPara, aoExcluir }){
    return (
    <>
    <div className="col">
        <div className="card h-100 category-card shadow-sm border-0">
            <div className="card-body d-flex flex-column align-items-center p-4">
                <div className="icon-box mb-3 d-flex align-items-center justify-content-center">
                    <img src="/image/img_padrao.png" alt={categoria.nome} width="35" className="img-fluid" />
                </div>
                <h5 className="category-title fw-bold text-dark text-center">{categoria.nome}</h5>
                {pendente ? <span className="badge bg-warning text-dark mx-auto mt-2">Pendente</span> : null}
                {podeMexer ? (
                <div className="d-grid gap-2 w-100 mt-auto pt-3">
                    <Link to={`/categorias/${categoria.id}/editar`} state={{ voltarPara }}
                        className="btn btn-sm btn-outline-primary w-100 py-2">
                        <i className="bi bi-pencil me-1"></i> Editar
                    </Link>
                    <button type="button" onClick={() => aoExcluir(categoria)}
                        className="btn btn-sm btn-outline-danger w-100 py-2 btn-excluir-categoria">
                        <i className="bi bi-trash me-1"></i> Excluir
                    </button>
                </div>
                ) : null}
            </div>
        </div>
    </div>
    </>
    )
}

export default CardCategoria
