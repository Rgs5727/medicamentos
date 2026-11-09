import { api, mensagemDeErro } from "./api"

// Mesmo aviso do categorias.js antigo: no banco, apagar uma categoria apaga
// junto os remédios dela (decisão: manter igual ao antigo, com este aviso).
export const AVISO_EXCLUIR_CATEGORIA = "Atenção: excluir esta categoria removerá todos os itens vinculados. Deseja continuar?"

// Dono da categoria (criado_por) ou admin: pode editar/excluir
export function podeMexerNaCategoria(usuario, categoria){
    return Boolean(usuario) && (usuario.adm || usuario.email === categoria.criado_por)
}

// Pergunta, exclui e mostra a mensagem. Devolve true se excluiu.
export async function excluirCategoria(categoria, mostrarToast){
    if(!window.confirm(AVISO_EXCLUIR_CATEGORIA)) return false
    try {
        const resposta = await api.delete(`/api/categorias/${categoria.id}`)
        mostrarToast(resposta.data.mensagem, "success")
        return true
    } catch (error) {
        if(error.response?.status !== 401) mostrarToast(mensagemDeErro(error), "danger")
        return false
    }
}
