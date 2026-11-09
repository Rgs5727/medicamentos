import RemedioFiltro from "./RemedioFiltro";
import Secao from "./Secao"
import Tabela from "./Tabela"
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api, mensagemDeErro } from "../services/api";

// "Gerenciar remédios": tabela do modelo da livraria.
//  - "Meus pendentes" (admin: "Pendentes") só aparece se existir algum pendente
//  - "Listar Remédios": todos os aprovados
//  - Editar/Excluir só nos remédios da pessoa (admin: em todos) — ver LinhaTabela
function RemedioPagina({ usuario, mostrarToast }){

    const [busca, setBusca] = useState("")
    const [remedios, setRemedios] = useState([])
    const [pendentes, setPendentes] = useState([])
    const [categorias, setCategorias] = useState([])


    useEffect(() => {
        async function carregarRemedios(){
            try {
                const [res, resPendentes, resCategorias] = await Promise.all([
                    api.get("/api/medicamentos"),
                    api.get("/api/medicamentos/pendentes"),
                    api.get("/api/categorias"),
                ])
                setRemedios(res.data)
                setPendentes(resPendentes.data)
                setCategorias(resCategorias.data)
            } catch (error) {
                if(error.response?.status !== 401) mostrarToast(mensagemDeErro(error), "danger")
            }
        }

        carregarRemedios()
    },[mostrarToast])

    const filtrar = (lista) => lista.filter(r => r.nome_remedio.toLowerCase().includes(busca.toLowerCase()))

    async function excluirRemedio(id){
        if(!window.confirm("Deseja mesmo excluir este remédio?")) return
        try {
            const resposta = await api.delete(`/api/medicamentos/${id}`)
            setRemedios(lista => lista.filter(r => r.remedio_id !== id))
            setPendentes(lista => lista.filter(r => r.remedio_id !== id))
            mostrarToast(resposta.data.mensagem, "success")
        } catch (error) {
            if(error.response?.status !== 401) mostrarToast(mensagemDeErro(error), "danger")
        }
    }

return (
    <>
        <RemedioFiltro busca={busca} onBuscaChange={setBusca}>
            <Link to="/remedio_novo" state={{ voltarPara: "/remedios" }} className="btn btn-primary w-100 rounded-3 py-2">
                <i className="bi bi-plus-lg me-1"></i> Adicionar remédio
            </Link>
        </RemedioFiltro>

        {pendentes.length > 0 ? (
            <Secao titulo={usuario?.adm ? "Pendentes" : "Meus pendentes"}>
                <Tabela remedios={filtrar(pendentes)} categorias={categorias} usuario={usuario} onDelete={excluirRemedio}/>
            </Secao>
        ) : null}

        <Secao titulo="Listar Remédios">
            <Tabela remedios={filtrar(remedios)} categorias={categorias} usuario={usuario} onDelete={excluirRemedio}/>
        </Secao>
    </>
)


}

export default RemedioPagina
