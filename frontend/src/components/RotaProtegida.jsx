import { useEffect, useRef } from "react"
import { Navigate, useLocation } from "react-router-dom"
import Erro403 from "../pages/Erro403"

// "Tranca" uma página (mesma ideia do protegerPagina() do api.js antigo).
//
//   - carregando:       o App ainda está perguntando GET /api/v1/auth/me -> não mostra nada
//   - encerrandoSessao: a pessoa acabou de sair / a sessão acabou de expirar e o App
//                       já está levando ela para outra página -> não mostra nada
//   - sem usuário:      toast "Acesso negado!" + manda para /login, guardando a página
//                       que ela tentou abrir (voltarPara) para voltar depois do login
//   - exigirAdmin e a pessoa não é admin: página 403 antiga (decisão: tentativa de
//                       página não autorizada abre a página de erro)
//   - tudo certo:       mostra a página
function RotaProtegida({ usuario, carregando, encerrandoSessao, mostrarToast, exigirAdmin = false, children }){
    const location = useLocation()
    const barrado = !carregando && !encerrandoSessao && !usuario
    const jaAvisou = useRef(false)

    useEffect(() => {
        // jaAvisou: em modo de desenvolvimento o React roda os efeitos duas
        // vezes; sem isso o toast apareceria em dobro.
        if(barrado && !jaAvisou.current){
            jaAvisou.current = true
            mostrarToast("Acesso negado! Você precisa estar logado.", "danger")
        }
    }, [barrado, mostrarToast])

    if(carregando || encerrandoSessao){
        return null
    }

    if(!usuario){
        const voltarPara = location.pathname + location.search + location.hash
        // "estado": o que a página original recebeu (ex: para onde o formulário volta
        // depois de salvar), para não se perder no caminho pelo login
        return <Navigate to="/login" replace state={{ voltarPara, estado: location.state }} />
    }

    if(exigirAdmin && !usuario.adm){
        return <Erro403 usuario={usuario} />
    }

    return children
}

export default RotaProtegida
