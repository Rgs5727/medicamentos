import { api } from "../services/api"
import { useLocation, useNavigate } from "react-router-dom"
import CssDaPagina from "./CssDaPagina"
import RemedioForm from "./RemedioForm"

// Cadastrar remédio: mesma estrutura do cadastrar_medicamento.html antigo.
// Depois de salvar (ou cancelar) volta para onde a pessoa veio
// (catálogo, tabela...); se não souber, vai para o início como no antigo.
function RemedioPaginaNovo({ mostrarToast }){
    const navigate = useNavigate()
    const location = useLocation()
    const voltarPara = location.state?.voltarPara || "/"

    async function salvar(dados) {
        const resposta = await api.post("/api/medicamentos", dados)
        // admin: "Remédio cadastrado com sucesso!"; usuário comum: "...enviado para aprovação."
        mostrarToast(resposta.data.mensagem, "success")
        navigate(voltarPara)
    }

    return (<>
    <CssDaPagina arquivo="cadastro.css">
        <div className="container py-5 d-flex justify-content-center">
            <div className="card card-cadastro shadow-sm border-0">
                <div className="card-body p-4 p-md-5">
                    <div className="header-cadastro mb-4">
                        <h3 className="fw-bold text-dark">Cadastrar Medicamento</h3>
                        <p className="text-muted small">Preencha as informações abaixo para adicionar ao estoque.</p>
                    </div>

                    <RemedioForm onSalvar={salvar} aoCancelar={() => navigate(voltarPara)} mostrarToast={mostrarToast}/>
                </div>
            </div>
        </div>
    </CssDaPagina>
    </>)
}

export default RemedioPaginaNovo
