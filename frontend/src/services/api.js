import axios from 'axios'

export const API_URL = "http://localhost:5000"

export const api = axios.create({
    baseURL: API_URL,
})

// As imagens dos remédios ficam em static/uploads do Flask
export function urlImagem(imagem_url){
    return imagem_url ? `${API_URL}/static/${imagem_url}` : null
}

export function mensagemDeErro(erro){
    if(erro.response){
        // O Flask devolve {"mensagem": "..."} nos remédios/categorias e
        // {"erro": "..."} nas rotas de login e nos decoradores do token
        const dados = erro.response.data
        if(dados && (dados.mensagem || dados.erro)){
            return dados.mensagem || dados.erro
        }
        return `Erro ${erro.response.status} na API`
    }

    if(erro.request){
        return 'Não foi possivel falar com o servidor!'
    }

    return erro.message
}

// ============================================================================
// TOKEN JWT — o lado do navegador (mesma ideia do static/js/api.js antigo)
//
//   1) GUARDAR: o login (POST /api/v1/auth/login) devolve o token no JSON e
//      ele é guardado no localStorage (guardarToken).
//   2) MANDAR: antes de CADA pedido, o interceptor de "request" coloca o
//      token no cabeçalho  Authorization: Bearer <token>. É esse cabeçalho
//      que o @login_required / @admin_required do Flask (users.py) lê.
//   3) PERCEBER QUE VENCEU: depois de CADA resposta, o interceptor de
//      "response" olha se a API respondeu 401 para um pedido que levou
//      token. Se sim, o token venceu (30 min) ou é inválido -> o App apaga
//      o token e abre a página "Sessão expirada".
//
// Quem está logado e se é administrador NUNCA é lido de dentro do token:
// sempre vem de GET /api/v1/auth/me (pegarUsuarioLogado, lá embaixo).
// ============================================================================

const CHAVE_TOKEN = "token"

/** Guarda o token recebido do login no localStorage do navegador. */
export function guardarToken(token){
    localStorage.setItem(CHAVE_TOKEN, token)
}

/** Lê o token guardado, ou null se ninguém fez login. */
export function pegarToken(){
    return localStorage.getItem(CHAVE_TOKEN)
}

/** Apaga o token: é isso que representa o "logout" no navegador. */
export function apagarToken(){
    localStorage.removeItem(CHAVE_TOKEN)
}

// 2) MANDAR: roda antes de todo api.get / api.post / api.put / api.delete
api.interceptors.request.use((config) => {
    const token = pegarToken()
    if(token){
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

// 3) PERCEBER QUE VENCEU: o App.jsx registra aqui a função que deve rodar
// quando a sessão expira (apagar token, deslogar e abrir /sessao-expirada).
let aoExpirarSessao = null

export function definirAoExpirarSessao(funcao){
    aoExpirarSessao = funcao
}

api.interceptors.response.use(
    (resposta) => resposta,
    (erro) => {
        const levouToken = Boolean(erro.config?.headers?.Authorization)
        // O login também responde 401 quando a senha está errada: isso é erro
        // de digitação, não sessão expirada, então ele fica de fora.
        const ehLogin = erro.config?.url === "/api/v1/auth/login"
        // pegarToken() ainda existir garante que só o PRIMEIRO 401 dispara a
        // expiração (depois dele o token já foi apagado).
        if(erro.response?.status === 401 && levouToken && !ehLogin && pegarToken() && aoExpirarSessao){
            aoExpirarSessao()
        }
        return Promise.reject(erro)
    }
)

/**
 * Pergunta ao servidor quem está logado (GET /api/v1/auth/me).
 * Devolve { nome, email, adm, expira_em } ou null se não tiver token,
 * se o token for inválido/vencido ou se o servidor não responder.
 */
export async function pegarUsuarioLogado(){
    if(!pegarToken()){
        return null
    }
    try {
        const resposta = await api.get("/api/v1/auth/me")
        return resposta.data
    } catch {
        return null
    }
}
