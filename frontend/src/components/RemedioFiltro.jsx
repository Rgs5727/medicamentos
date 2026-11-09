// Filtro do modelo da livraria. "children" (opcional) aparece ao lado da busca
// — na tela Gerenciar remédios é o botão "Adicionar remédio".
function RemedioFiltro({busca, onBuscaChange, children}){
    return (<>
        <div className="row g-2 mb-3">
            <div className="col-md-8">

                <input type="search"
                className="form-control"
                placeholder="Buscar remédio pelo nome..."
                value = {busca}
                onChange={(e) => onBuscaChange(e.target.value)}
                />

            </div>
            {children ? <div className="col-md-4">{children}</div> : null}
        </div>
    </>)
}

export default RemedioFiltro
