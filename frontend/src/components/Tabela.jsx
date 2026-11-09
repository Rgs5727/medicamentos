import LinhaTabela from "./LinhaTabela";

function Tabela({remedios, categorias, usuario, onDelete}){

    if(remedios.length === 0){
        return (<><p>Não há remédios cadastrados</p></>)
    }

    return (
        <>
            <div className="table-responsive">
                <table className="table table-striped table-hover bg-white shadow-sm align-middle">
                <thead className="table-dark">
                    <tr>
                    <th></th>
                    <th>Nome</th>
                    <th>Princípio Ativo</th>
                    <th>Laboratório</th>
                    <th>Categoria</th>
                    <th>Tipo</th>
                    <th>Preço</th>
                    <th></th>
                    <th></th>
                    </tr>
                </thead>
                <tbody>
                    {
                        remedios.map(r => <LinhaTabela remedio={r} categorias={categorias} usuario={usuario} key={r.remedio_id} onDelete={onDelete}/>)
                    }
                </tbody>
                </table>
            </div>
        </>
    )
}

export default Tabela
