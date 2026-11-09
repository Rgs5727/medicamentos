import { useEffect, useState } from "react"

// Faz o papel do {% block extra_css %} do Jinja antigo: liga o CSS próprio
// de uma página quando ela abre e desliga quando ela fecha.
//
// Por quê: em React, todo CSS importado fica ativo no site inteiro. Alguns
// CSS antigos têm regras gerais (ex: sobre.css muda o <body>, cadastro.css
// muda todo .form-control). No site antigo cada página carregava só o seu,
// então os arquivos (em public/style/, copiados SEM alteração) são ligados
// só na página que usa.
//
// Uso:  <CssDaPagina arquivo="error403.css"> ...página... </CssDaPagina>
//   ou  <CssDaPagina arquivos={["remedios.css", "remedio_detalhe.css"]}> ... </CssDaPagina>
//       (vários arquivos, na mesma ordem do template antigo)
// O conteúdo só aparece depois que os CSS carregaram, para a página não
// "piscar" sem estilo.
function CssDaPagina({ arquivo, arquivos, children }){
    const lista = arquivos || [arquivo]
    const chave = lista.join("|")
    const [carregados, setCarregados] = useState(null)

    useEffect(() => {
        const nomes = chave.split("|")
        let faltam = nomes.length
        const links = nomes.map((nome) => {
            const link = document.createElement("link")
            link.rel = "stylesheet"
            link.href = `/style/${nome}`
            link.onload = link.onerror = () => {
                faltam -= 1
                if(faltam === 0){
                    setCarregados(chave)
                }
            }
            document.head.appendChild(link)
            return link
        })

        // Saiu da página: tira os CSS dela (igual a trocar de página no antigo)
        return () => links.forEach((link) => link.remove())
    }, [chave])

    return carregados === chave ? children : null
}

export default CssDaPagina
