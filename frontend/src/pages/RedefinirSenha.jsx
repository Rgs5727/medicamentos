import { useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { api, mensagemDeErro } from "../services/api"

// Redefinir senha (link do e-mail): mesma estrutura do
// templates/usuarios/redefinir_senha.html. Link inválido/expirado: igual ao
// antigo, mostra a mensagem e manda para /esqueci-senha.
function RedefinirSenha({ mostrarToast }){
    const { token } = useParams()
    const navigate = useNavigate()
    const [valido, setValido] = useState(false)
    const [senha, setSenha] = useState("")
    const [confirmar, setConfirmar] = useState("")

    useEffect(() => {
        let cancelado = false
        api.get(`/api/v1/auth/redefinir-senha/${token}`)
            .then(() => { if(!cancelado) setValido(true) })
            .catch((error) => {
                if(!cancelado){
                    mostrarToast(mensagemDeErro(error), "danger")
                    navigate("/esqueci-senha")
                }
            })
        return () => { cancelado = true }
    }, [token, mostrarToast, navigate])

    // Igual ao script antigo: avisa quando a confirmação não bate
    const naoCoincidem = Boolean(confirmar) && senha !== confirmar

    async function redefinir(e){
        e.preventDefault()
        try {
            const resposta = await api.post(`/api/v1/auth/redefinir-senha/${token}`, { senha, confirmar_senha: confirmar })
            mostrarToast(resposta.data.mensagem, "success")
            navigate("/login")
        } catch (error) {
            mostrarToast(mensagemDeErro(error), "danger")
        }
    }

    if(!valido){
        return null
    }

    return (
    <>
    <div className="container py-5">
        <div className="row justify-content-center">
            <div className="col-md-6">
                <div className="card shadow-sm">
                    <div className="card-body">
                        <h3 className="card-title mb-1">Redefinir senha</h3>
                        <p className="text-muted mb-4">Escolha uma nova senha para sua conta.</p>
                        <form onSubmit={redefinir}>
                            <div className="mb-3">
                                <label htmlFor="senha" className="form-label">Nova senha</label>
                                <input type="password" className="form-control" id="senha" name="senha"
                                    minLength="6" placeholder="Mínimo 6 caracteres" required
                                    value={senha} onChange={(e) => setSenha(e.target.value)} />
                            </div>
                            <div className="mb-3">
                                <label htmlFor="confirmar_senha" className="form-label">Confirmar nova senha</label>
                                <input type="password" className="form-control" id="confirmar_senha" name="confirmar_senha"
                                    minLength="6" placeholder="Repita a senha" required
                                    value={confirmar} onChange={(e) => setConfirmar(e.target.value)} />
                                <div id="senha-feedback" className={`form-text text-danger ${naoCoincidem ? "" : "d-none"}`}>
                                    As senhas não coincidem.
                                </div>
                            </div>
                            <button type="submit" className="btn btn-success w-100" id="btn-redefinir" disabled={naoCoincidem}>
                                Redefinir senha
                            </button>
                        </form>
                        <div className="mt-3 text-center">
                            <Link to="/login">Voltar para o login</Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    </>
    )
}

export default RedefinirSenha
