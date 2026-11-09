import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { api, mensagemDeErro } from "../services/api"

// Mesma estrutura do usuarios/register.html antigo. Envia para
// POST /api/v1/auth/registro. O cadastro NÃO devolve token (só o login
// devolve), então, logo depois de cadastrar, o React faz o login sozinho
// com o mesmo e-mail e senha e leva a pessoa para o início já logada.
function Cadastro({ aoEntrar, mostrarToast }){
    const navigate = useNavigate()

    const [nome, setNome] = useState("")
    const [email, setEmail] = useState("")
    const [senha, setSenha] = useState("")
    const [erro, setErro] = useState(null)

    async function enviarFormulario(e){
        e.preventDefault()
        setErro(null)

        try {
            const resposta = await api.post("/api/v1/auth/registro", { nome: nome.trim(), email: email.trim(), senha })

            try {
                // Login automático: o mesmo POST /api/v1/auth/login da página de login
                const login = await api.post("/api/v1/auth/login", { email: email.trim(), senha })
                await aoEntrar(login.data.token)
                mostrarToast(resposta.data.mensagem, "success")
                navigate("/")
            } catch {
                // Se o login automático falhar, a conta já existe: vai para o login normal
                mostrarToast(resposta.data.mensagem, "success")
                navigate("/login")
            }
        } catch (error) {
            // 400 (campo faltando/senha curta) ou 409 (e-mail já cadastrado)
            if(error.response){
                setErro(error.response.data?.erro || "Não foi possível cadastrar.")
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
                        <h3 className="card-title mb-4">Criar Conta</h3>
                        <div id="cadastro-erro" className={`alert alert-danger ${erro ? "" : "d-none"}`} role="alert">{erro}</div>
                        <form id="form-cadastro" onSubmit={enviarFormulario}>
                            <div className="mb-3">
                                <label htmlFor="nome" className="form-label">Nome</label>
                                <input type="text" className="form-control" id="nome" name="nome" required
                                    value={nome} onChange={(e) => setNome(e.target.value)} />
                            </div>
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
                            <button type="submit" className="btn btn-primary w-100">
                                Cadastrar
                            </button>
                        </form>
                        <div className="mt-3 text-center">
                            <span>Já tem conta? <Link to="/login">Entrar</Link></span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    </>
    )
}

export default Cadastro
