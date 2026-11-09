import { useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { api, mensagemDeErro } from "../services/api"

// Para estas páginas não faz sentido "voltar" depois do login
const PAGINAS_SEM_VOLTA = ["/login", "/cadastro", "/sessao-expirada"]

// Mesma estrutura do usuarios/login.html antigo. O envio funciona como o
// auth.js antigo: manda e-mail e senha em JSON para POST /api/v1/auth/login.
function Login({ aoEntrar, mostrarToast }){
    const navigate = useNavigate()
    const location = useLocation()

    const [email, setEmail] = useState("")
    const [senha, setSenha] = useState("")
    const [erro, setErro] = useState(null)

    async function enviarFormulario(e){
        e.preventDefault() // não deixa a página recarregar
        setErro(null)

        try {
            const resposta = await api.post("/api/v1/auth/login", { email: email.trim(), senha })

            // --- é aqui que o token chega no navegador ---
            // aoEntrar (App.jsx) guarda o token no localStorage e pergunta
            // GET /api/v1/auth/me quem está logado e quando o token vence.
            await aoEntrar(resposta.data.token)
            mostrarToast(resposta.data.mensagem, "success")

            // Volta para a página que a pessoa tentou abrir (RotaProtegida) ou onde
            // a sessão expirou; se não tiver nenhuma, vai para o início (como no antigo).
            const voltarPara = location.state?.voltarPara
            const podeVoltar = voltarPara && !PAGINAS_SEM_VOLTA.some((p) => voltarPara.startsWith(p))
            // "estado": o que a página tentada tinha recebido (a RotaProtegida guardou)
            navigate(podeVoltar ? voltarPara : "/", { state: podeVoltar ? location.state?.estado : undefined })
        } catch (error) {
            // 400 (faltou campo) ou 401 (e-mail/senha errados): mesma caixa vermelha do antigo
            if(error.response){
                setErro(error.response.data?.erro || "Não foi possível entrar.")
            } else {
                setErro(mensagemDeErro(error))
            }
        }
    }

    return (
    <>
    <div className="container py-5">
        <div className="row justify-content-center">
            <div className="col-md-6">
                <div className="card shadow-sm">
                    <div className="card-body">
                        <h3 className="card-title mb-4">Entrar</h3>
                        <div id="login-erro" className={`alert alert-danger ${erro ? "" : "d-none"}`} role="alert">{erro}</div>
                        <form id="form-login" onSubmit={enviarFormulario}>
                            <div className="mb-3">
                                <label htmlFor="email" className="form-label">E-mail</label>
                                <input type="email" className="form-control" id="email" name="email" required
                                    value={email} onChange={(e) => setEmail(e.target.value)} />
                            </div>
                            <div className="mb-3">
                                <label htmlFor="senha" className="form-label">Senha</label>
                                <input type="password" className="form-control" id="senha" name="senha" required
                                    value={senha} onChange={(e) => setSenha(e.target.value)} />
                            </div>
                            <button type="submit" className="btn btn-primary w-100">Entrar</button>
                        </form>
                        <div className="mt-2 text-end">
                            <Link to="/esqueci-senha" className="text-muted small">
                                Esqueci minha senha
                            </Link>
                        </div>
                        <div className="mt-3 text-center">
                            <span>Não tem conta? <Link to="/cadastro">Cadastre-se</Link></span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    </>
    )
}

export default Login
