import { useState, useEffect } from "react"
import { api, mensagemDeErro, urlImagem } from "../services/api"

export const FORM_VAZIO = {
    nome: '',
    principio: '',
    lab: '',
    categoria: '',
    dataF: '',
    dataV: '',
    valor: '',
    desc: '',
    tipo: '',          // "Selecione o tipo" (antes mandava o valor inválido "tipo")
    tarjado: '',
    venda_livre: '',
    destaque: false,
    lancamento: false,
    promo: false,
    imagem_url: null,
}

// Campos do formulário: mesma estrutura do cadastrar_medicamento.html /
// editar_medicamento.html antigos (classes do cadastro.css). As mensagens de
// erro aparecem em toast (decisão do plano).
//   ehEdicao: muda os campos obrigatórios, o botão e mostra a imagem atual
function RemedioForm({valorInicial = FORM_VAZIO, onSalvar, aoCancelar, mostrarToast, ehEdicao = false}){

    const [form, setForm] = useState(valorInicial)
    const [imagem, setImagem] = useState(null)
    const [categorias, setCategorias] = useState([])
    const [carregando, setCarregando] = useState(false)

    function alterarCampo(e){
        const { name, value, type, checked } = e.target
        setForm({...form, [name]: type === "checkbox" ? checked : value})
    }

    async function enviarFormulario(e){
        e.preventDefault();

        // O Flask lê os dados com request.form e a imagem com request.files,
        // por isso enviamos um FormData (multipart) em vez de JSON.
        const dados = new FormData()
        dados.append("nome", form.nome.trim())
        dados.append("principio", form.principio.trim())
        dados.append("lab", form.lab.trim())
        dados.append("categoria", form.categoria)
        dados.append("dataF", form.dataF)
        dados.append("dataV", form.dataV)
        dados.append("valor", form.valor)
        dados.append("desc", form.desc.trim())
        dados.append("tipo", form.tipo)
        if(form.tipo === "tarjado"){
            dados.append("tarjado", form.tarjado)
        } else {
            dados.append("venda_livre", form.venda_livre)
        }
        // Checkbox: o Flask só considera marcado se o campo existir
        if(form.destaque) dados.append("destaque", "on")
        if(form.lancamento) dados.append("lancamento", "on")
        if(form.promo) dados.append("promo", "on")
        if(imagem) dados.append("imagem", imagem)

        try {
            setCarregando(true)
            await onSalvar(dados)
        } catch (error) {
            // 401 = sessão expirada (o App já leva para /sessao-expirada)
            if(error.response?.status !== 401) mostrarToast(mensagemDeErro(error), "danger")
        }finally{
            setCarregando(false)
        }
    }

    function cancelar(e){
        e.preventDefault()
        aoCancelar()
    }

    useEffect(()=>{
     async function carregarOpcoes(){
        try {
            const respCategorias = await api.get("/api/categorias")
            setCategorias(respCategorias.data)
        } catch (error) {
            mostrarToast(mensagemDeErro(error), "danger")
        }
     }

     carregarOpcoes()
    }, [mostrarToast])

    return (<>
           <form id={ehEdicao ? undefined : "form-cadastrar"} onSubmit={enviarFormulario} className="form-medpills">
            <div className="row">
                <div className="col-md-6 mb-3">
                    <label className="form-label">Nome do Remédio</label>
                    <input type="text" name="nome" className="form-control" placeholder="Ex: Dipirona Monoidratada" required value={form.nome} onChange={alterarCampo}/>
                </div>
                <div className="col-md-6 mb-3">
                    <label className="form-label">Princípio Ativo</label>
                    <input type="text" name="principio" className="form-control" placeholder="Ex: Metamizol" required={!ehEdicao} value={form.principio} onChange={alterarCampo}/>
                </div>

                <div className="col-md-6 mb-3">
                    <label className="form-label">Laboratório Fabricante</label>
                    <input type="text" name="lab" className="form-control" placeholder="Ex: Medley, EMS..." required={!ehEdicao} value={form.lab} onChange={alterarCampo}/>
                </div>
                <div className="col-md-6 mb-3">
                    <label className="form-label">Categoria</label>
                    <select name="categoria" className="form-select" required value={form.categoria} onChange={alterarCampo}>
                        <option value="">Selecione uma categoria</option>
                        {categorias.map((c) => (<option key={c.id} value={c.id}>{c.nome}</option>))}
                    </select>
                </div>

                <div className="col-md-6 mb-3">
                    <label className="form-label">Data de Fabricação</label>
                    <input type="date" name="dataF" className="form-control" value={form.dataF} onChange={alterarCampo}/>
                </div>
                <div className="col-md-6 mb-3">
                    <label className="form-label">Data de Validade</label>
                    <input type="date" name="dataV" className="form-control" value={form.dataV} onChange={alterarCampo}/>
                </div>

                <div className="col-md-4 mb-3">
                    <label className="form-label">Valor (R$)</label>
                    <div className="input-group">
                        <span className="input-group-text bg-light">R$</span>
                        <input type="number" step="0.01" name="valor" className="form-control" placeholder="0,00" value={form.valor} onChange={alterarCampo}/>
                    </div>
                </div>
                <div className="col-md-8 mb-3">
                    <label className="form-label">Descrição Curta</label>
                    <input type="text" name="desc" className="form-control" placeholder="Ex: Uso adulto e pediátrico acima de 15 anos" value={form.desc} onChange={alterarCampo}/>
                </div>

                <div className="col-md-6 mb-3">
                    <label className="form-label">Tipo</label>
                    <select name="tipo" className="form-select" id="tipo" required value={form.tipo} onChange={alterarCampo}>
                        <option value="">Selecione o tipo</option>
                        <option value="tarjado">Tarjado</option>
                        <option value="venda_livre">Venda Livre</option>
                    </select>
                </div>

                {/* Igual ao antigo: o campo Tarja aparece de começo; Venda Livre só quando escolhido */}
                {form.tipo !== 'venda_livre' ? (
                <div className="col-md-6 mb-3" id="campo_tarjado">
                    <label className="form-label">Tarja</label>
                    <input type="text" name="tarjado" className="form-control" placeholder="Ex: Tarja Vermelha" value={form.tarjado} onChange={alterarCampo}/>
                </div>) : (
                <div className="col-md-6 mb-3" id="campo_venda_livre">
                    <label className="form-label">Venda Livre</label>
                    <input type="text" name="venda_livre" className="form-control" placeholder="Ex: Sem restrição" value={form.venda_livre} onChange={alterarCampo}/>
                </div>)}

                <div className="col-md-12 mb-3">
                    <label className="form-label">Imagem do Remédio</label>
                    <input type="file" name="imagem" className="form-control" accept="image/*" required={!ehEdicao}
                        onChange={(e) => setImagem(e.target.files[0] ?? null)}/>
                </div>
                {ehEdicao && form.imagem_url ? (
                <div className="col-12 mb-3">
                    <img src={urlImagem(form.imagem_url)} alt={form.nome} className="img-fluid rounded" />
                </div>) : null}

                <div className="col-12 mb-4 mt-2">
                    <div className="d-flex flex-wrap gap-4 p-3 bg-light rounded shadow-inner">
                        <div className="form-check form-switch">
                            <input type="checkbox" name="destaque" className="form-check-input" id="destaque" checked={form.destaque} onChange={alterarCampo}/>
                            <label className="form-check-label" htmlFor="destaque">Destaque</label>
                        </div>
                        <div className="form-check form-switch">
                            <input type="checkbox" name="lancamento" className="form-check-input" id="lancamento" checked={form.lancamento} onChange={alterarCampo}/>
                            <label className="form-check-label" htmlFor="lancamento">Lançamento</label>
                        </div>
                        <div className="form-check form-switch">
                            <input type="checkbox" name="promo" className="form-check-input" id="promo" checked={form.promo} onChange={alterarCampo}/>
                            <label className="form-check-label" htmlFor="promo">Promoção</label>
                        </div>
                    </div>
                </div>
            </div>

            {ehEdicao ? (
            <div className="d-flex gap-2">
                <button type="submit" className="btn btn-primary btn-save w-100 py-2 fw-bold" disabled={carregando}>
                    {carregando ? "Salvando..." : "Atualizar Medicamento"}
                </button>
                <a href="/" onClick={cancelar} className="btn btn-light border w-50 py-2">Cancelar</a>
            </div>
            ) : (
            <div className="d-flex gap-2">
                <button type="submit" className="btn btn-primary btn-save flex-fill py-2 fw-bold" disabled={carregando}>
                    {carregando ? "Salvando..." : "Salvar Medicamento"}
                </button>
                <a href="/" onClick={cancelar} className="btn btn-light border flex-fill py-2">Cancelar</a>
            </div>
            )}
            </form>
    </>)
}

export default RemedioForm
