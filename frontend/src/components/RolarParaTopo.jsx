import { useLayoutEffect } from "react"
import { useLocation, useNavigationType } from "react-router-dom"

// No site antigo cada página abria do TOPO, porque era um carregamento novo.
// No React a rolagem continuaria onde estava (ex: clicar num card lá embaixo
// no catálogo abriria o detalhe já rolado). Aqui voltamos ao topo a cada
// troca de página, com duas exceções:
//   - links com # (ex: /#catalogo): quem rola é o RolarParaAncora;
//   - voltar/avançar do navegador ("POP"): o próprio navegador devolve a
//     posição em que a pessoa estava, como acontecia no site antigo.
function RolarParaTopo(){
    const location = useLocation()
    const tipoDeNavegacao = useNavigationType()

    useLayoutEffect(() => {
        if(tipoDeNavegacao === "POP" || location.hash){
            return
        }
        // "instant": sem a animação suave do Bootstrap (o antigo também não animava)
        window.scrollTo({ top: 0, left: 0, behavior: "instant" })
    }, [location.key, location.hash, tipoDeNavegacao])

    return null
}

export default RolarParaTopo
