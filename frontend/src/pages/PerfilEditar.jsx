import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import CssDaPagina from "../components/CssDaPagina"
import { api, mensagemDeErro } from "../services/api"

// Editar perfil: mesma estrutura do templates/usuarios/usuario_editar.html.
// Decisões: o campo "SUA SENHA ATUAL" foi TIRADO (o banco só guarda o hash
// da senha, que não dá para mostrar); trocar a senha continua sem pedir a
// atual, igual ao antigo. Os campos de senha começam visíveis com o "olho",
// como no antigo.
function PerfilEditar({ usuario, aoAtualizarUsuario, mostrarToast }){
    const navigate = useNavigate()
    const [nome, setNome] = useState(usuario.nome)
    const [novaSenha, setNovaSenha] = useState("")
    const [confirmSenha, setConfirmSenha] = useState("")
    const [visivel, setVisivel] = useState({ nova_senha: true, confirm_senha: true })
    // Igual ao script antigo: o aviso só começa depois de mexer na confirmação
    const [mexeuNaConfirmacao, setMexeuNaConfirmacao] = useState(false)

    const naoCoincidem = mexeuNaConfirmacao && Boolean(novaSenha) && confirmSenha !== novaSenha

    function alternar(campo){
        setVisivel((atual) => ({ ...atual, [campo]: !atual[campo] }))
    }

    async function salvar(e){
        e.preventDefault()
        try {
            const resposta = await api.put("/api/v1/auth/perfil", {
                nome, nova_senha: novaSenha, confirm_senha: confirmSenha,
            })
            mostrarToast(resposta.data.mensagem, "success")
            await aoAtualizarUsuario() // a navbar pega o nome novo (letra do avatar)
            navigate("/conta")
        } catch (error) {
            if(error.response?.status !== 401) mostrarToast(mensagemDeErro(error), "danger")
        }
    }

    return (
    <>
    <CssDaPagina arquivo="usuario_editar.css">
    <div className="container">
        <div className="edit-container">
            <div className="card border-0 shadow-lg rounded-4 overflow-hidden">
                <div className="card-header bg-primary py-3">
                    <h5 className="text-white mb-0 text-center">Alterar Informações</h5>
                </div>
                <div className="card-body p-4">
                    <form onSubmit={salvar}>

                        <div className="mb-4">
                            <label className="form-label fw-bold text-muted small">E-MAIL DA CONTA</label>
                            <div className="input-group">
                                <span className="input-group-text field-immutable"><i className="bi bi-lock-fill"></i></span>
                                <input type="email" className="form-control field-immutable" value={usuario.email} readOnly disabled />
                            </div>
                            <div className="form-text">O e-mail não pode ser alterado.</div>
                        </div>

                        <div className="mb-4">
                            <label className="form-label fw-bold text-muted small">NOME DE EXIBIÇÃO</label>
                            <div className="input-group">
                                <span className="input-group-text bg-white"><i className="bi bi-person-fill text-primary"></i></span>
                                <input type="text" name="nome_user" className="form-control" value={nome}
                                    onChange={(e) => setNome(e.target.value)} required />
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="form-label fw-bold text-muted small">ALTERAR SENHA</label>
                            <div className="row">
                                <div className="col-md-6 mb-3">
                                    <label className="form-label small">Nova senha</label>
                                    <div className="input-group">
                                        <input type={visivel.nova_senha ? "text" : "password"} name="nova_senha" id="nova_senha"
                                            className="form-control" placeholder="Nova senha"
                                            value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} />
                                        <button className="btn btn-outline-secondary" type="button" onClick={() => alternar("nova_senha")}>
                                            <i className={`bi ${visivel.nova_senha ? "bi-eye-slash" : "bi-eye"}`} id="toggle_nova_senha"></i>
                                        </button>
                                    </div>
                                </div>
                                <div className="col-md-6 mb-3">
                                    <label className="form-label small">Confirmar nova senha</label>
                                    <div className="input-group">
                                        <input type={visivel.confirm_senha ? "text" : "password"} name="confirm_senha" id="confirm_senha"
                                            className="form-control" placeholder="Confirmar nova senha"
                                            value={confirmSenha}
                                            onChange={(e) => { setConfirmSenha(e.target.value); setMexeuNaConfirmacao(true) }} />
                                        <button className="btn btn-outline-secondary" type="button" onClick={() => alternar("confirm_senha")}>
                                            <i className={`bi ${visivel.confirm_senha ? "bi-eye-slash" : "bi-eye"}`} id="toggle_confirm_senha"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="form-text">Deixe em branco se não quiser alterar a senha. Sem necessidade de senha atual.</div>
                        </div>

                        <div className="d-grid gap-2">
                            <button type="submit" className="btn btn-primary py-2 fw-bold" id="btn-salvar" disabled={naoCoincidem}>
                                {naoCoincidem ? "Senhas não coincidem" : "Salvar Alterações"}
                            </button>
                            <Link to="/conta" className="btn btn-link text-muted">Cancelar</Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
    </CssDaPagina>
    </>
    )
}

export default PerfilEditar
