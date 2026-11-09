import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { api, mensagemDeErro } from "../services/api"

// Esqueci minha senha: mesma estrutura do templates/usuarios/esqueci_senha.html.
// Igual ao antigo: mostra sempre a mesma mensagem (não conta se o e-mail existe)
// e volta para o login. O e-mail traz um link para /redefinir-senha/<token>.
function EsqueciSenha({ mostrarToast }){
    const navigate = useNavigate()
    const [email, setEmail] = useState("")

    async function enviar(e){
        e.preventDefault()
        try {
            const resposta = await api.post("/api/v1/auth/esqueci-senha", { email: email.trim() })
            mostrarToast(resposta.data.mensagem, "info")
            navigate("/login")
        } catch (error) {
            mostrarToast(mensagemDeErro(error), "danger")
        }
    }

    return (
    <>
    <div className="container py-5">
        <div className="row justify-content-center">
            <div className="col-md-6">
                <div className="card shadow-sm">
                    <div className="card-body">
                        <h3 className="card-title mb-1">Esqueci minha senha</h3>
                        <p className="text-muted mb-4">
                            Informe seu e-mail cadastrado e enviaremos um link para redefinir sua senha.
                        </p>
                        <form onSubmit={enviar}>
                            <div className="mb-3">
                                <label htmlFor="email" className="form-label">E-mail</label>
                                <input type="email" className="form-control" id="email" name="email"
                                    placeholder="seu@email.com" required
                                    value={email} onChange={(e) => setEmail(e.target.value)} />
                            </div>
                            <button type="submit" className="btn btn-primary w-100">
                                Enviar link de redefinição
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

export default EsqueciSenha
