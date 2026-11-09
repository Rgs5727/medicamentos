import { Link } from "react-router-dom"
import { urlImagem } from "../services/api"

// Linha da tabela do modelo da livraria.
// Editar/Excluir só aparecem para o dono do remédio ou para o admin.
// Remédio pendente (ainda não aprovado) ganha o selo "Pendente".
function LinhaTabela({remedio, categorias, usuario, onDelete}){
    const categoria = categorias.find(c => c.id === remedio.categoria_remedio)
    const podeMexer = Boolean(usuario) && (usuario.adm || usuario.email === remedio.criado_por)

    return (
        <>
            <tr>
                <td>
                    {remedio.imagem_url &&
                        <img src={urlImagem(remedio.imagem_url)} alt={remedio.nome_remedio} width="50" height="50" style={{objectFit: "cover"}} className="rounded" />}
                </td>
                <td>
                    {remedio.nome_remedio}
                    {remedio.status === false ? <> <span className="badge bg-warning text-dark">Pendente</span></> : null}
                </td>
                <td>{remedio.principio_remedio}</td>
                <td>{remedio.lab_remedio}</td>
                <td>{categoria ? categoria.nome : "-"}</td>
                <td>{remedio.tipo}</td>
                <td>R$ {Number(remedio.valor_remedio).toFixed(2)}</td>
                <td>
                    {podeMexer ? <Link to={`/remedios/${remedio.remedio_id}/editar`} state={{ voltarPara: "/remedios" }} className="btn btn-warning">Editar</Link> : null}
                </td>
                <td>
                    {podeMexer ? <button className="btn btn-danger" onClick={() => onDelete(remedio.remedio_id)}>Excluir</button> : null}
                </td>
            </tr>
        </>
    )
}

export default LinhaTabela
