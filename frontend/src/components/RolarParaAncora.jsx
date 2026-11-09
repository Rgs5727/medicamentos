import { useEffect } from "react"
import { useLocation } from "react-router-dom"

// Links como "/#catalogo" ou "/#como-funciona": no site antigo o navegador
// rolava até a seção sozinho, porque a página vinha pronta do servidor.
// No React a seção só existe depois que a página desenha, então rolamos aqui.
// Fica DENTRO do conteúdo da página, para rodar só quando as seções já existem.
function RolarParaAncora({ pronto }){
    const location = useLocation()

    useEffect(() => {
        if(!pronto || !location.hash){
            return
        }
        const alvo = document.getElementById(decodeURIComponent(location.hash.slice(1)))
        if(alvo){
            alvo.scrollIntoView({ behavior: "auto", block: "start" })
        }
    }, [pronto, location.key, location.hash])

    return null
}

export default RolarParaAncora
