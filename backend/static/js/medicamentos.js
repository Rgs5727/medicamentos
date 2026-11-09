const API_URL = "/api/medicamentos"
const API_URL_CATEGORIAS = "/api/categorias"

let categoriasMap = {}
let usuarioLogado = false

document.addEventListener("DOMContentLoaded", async () => {

    // detecta em qual página estamos pelos containers presentes no HTML
    const tbodyAdmin = document.getElementById("tbody-medicamentos")
    const gridCatalogo = document.getElementById("catalogo-grid")
    const wrapperDestaques = document.getElementById("destaques-wrapper")

    usuarioLogado = document.body.dataset.usuarioLogado === "true"

    if (gridCatalogo || wrapperDestaques) {
        // páginas públicas precisam do nome das categorias
        categoriasMap = await carregarCategorias()
    }

    const medicamentos = await carregarMedicamentos()

    if (tbodyAdmin) renderizarTabelaAdmin(medicamentos, tbodyAdmin)
    if (gridCatalogo) renderizarCatalogo(medicamentos, gridCatalogo)
    if (wrapperDestaques) renderizarDestaques(medicamentos, wrapperDestaques)

    const formBusca = document.getElementById("form-busca-catalogo")
    if (formBusca && gridCatalogo) {
        formBusca.addEventListener("submit", async (e) => {
            e.preventDefault()
            const termo = document.getElementById("input-busca-catalogo").value.trim()
            const filtrados = await carregarMedicamentos(termo)
            renderizarCatalogo(filtrados, gridCatalogo)
        })
    }
})

async function carregarCategorias() {
    const res = await fetch(API_URL_CATEGORIAS)
    if (!res.ok) return {}
    const lista = await res.json()
    const mapa = {}
    lista.forEach(c => mapa[c.id] = c.nome)
    return mapa
}

async function carregarMedicamentos(termoBusca) {
    const url = termoBusca ? `${API_URL}?q=${encodeURIComponent(termoBusca)}` : API_URL
    const res = await fetch(url)
    if (!res.ok) throw new Error("Erro ao carregar medicamentos")
    return await res.json()
}

// ---------- tabela admin ----------

function renderizarTabelaAdmin(medicamentos, tbody) {
    tbody.innerHTML = ""
    medicamentos.forEach(m => {
        let tr = document.createElement("tr")
        let keys = ["nome_remedio", "principio_remedio", "categoria_remedio", "tipo", "valor_remedio"]
        keys.forEach(k => tr.appendChild(criar_td(m, k)))

        let btn = document.createElement("button")
        btn.classList.add("btn", "btn-danger")
        btn.textContent = "Excluir"
        btn.addEventListener("click", async () => {
            let res_excluir = await fetch(`${API_URL}/${m.remedio_id}`, { method: "DELETE" })
            let data_excluir = await res_excluir.json()
            exibir_mensagem(data_excluir.mensagem, res_excluir.ok)
            tr.remove()
        })
        tr.appendChild(btn)

        let a_editar = document.createElement("a")
        a_editar.href = `/editar/${m.remedio_id}`
        a_editar.classList.add("btn", "btn-warning")
        a_editar.textContent = "Editar"
        tr.appendChild(a_editar)

        tbody.appendChild(tr)
    })
}

function criar_td(objeto, campo) {
    let td = document.createElement("td")
    td.textContent = objeto[campo]
    return td
}

function exibir_mensagem(msg, codigo) {
    let div_msg = document.getElementById("msg")
    if (!div_msg) return
    div_msg.classList.remove("alert", "alert-success", "alert-danger")
    div_msg.classList.add("alert", codigo ? "alert-success" : "alert-danger")
    div_msg.textContent = msg
}

// ---------- catálogo público (grade de cards) ----------

function renderizarCatalogo(medicamentos, container) {
    container.innerHTML = ""

    if (medicamentos.length === 0) {
        container.innerHTML = `
            <div class="col-12">
                <div class="empty-state"><p class="fs-5 mb-0">Nenhum remédio cadastrado ainda.</p></div>
            </div>`
        return
    }

    medicamentos.forEach(m => container.appendChild(criarCardCatalogo(m)))
}

function criarCardCatalogo(m) {
    const col = document.createElement("div")
    col.className = "col"

    const categoriaNome = categoriasMap[m.categoria_remedio] || m.categoria_remedio
    const valorFormatado = Number(m.valor_remedio).toFixed(2)
    const urlDetalhe = `/remedios/${m.remedio_id}`

    col.innerHTML = `
        <div class="card product-card h-100" style="cursor:pointer">
            ${m.imagem_url
                ? `<img src="/static/${m.imagem_url}" class="card-img-top" alt="${m.nome_remedio}" style="height:200px;object-fit:cover" />`
                : `<div class="bg-light d-flex align-items-center justify-content-center" style="height:200px"><span class="text-muted">Sem imagem</span></div>`
            }
            <div class="card-body d-flex flex-column">
                ${categoriaNome ? `<span class="badge bg-primary bg-opacity-10 text-primary mb-2" style="width:fit-content">${categoriaNome}</span>` : ""}
                <h5 class="card-title fw-bold text-dark">${m.nome_remedio}</h5>
                <p class="card-text text-muted small">${(m.descricao_remedio || "Sem descrição disponível").slice(0, 80)}</p>
                <div class="mt-auto">
                    <div class="d-flex align-items-center justify-content-between mb-3">
                        ${m.promocao_remedio
                            ? `<div class="alert alert-warning d-flex align-items-center mb-0 py-2 px-3" role="alert"><i class="bi bi-tag-fill me-2"></i><strong>R$ ${valorFormatado}</strong></div>`
                            : `<span class="fs-4 fw-bold text-dark">R$ ${valorFormatado}</span>`
                        }
                    </div>
                    ${m.promocao_remedio ? `<span class="badge bg-warning text-dark">Promoção</span>` : ""}
                    <div class="mb-2">
                        ${m.destaque_remedio ? `<span class="badge bg-primary">Destaque</span>` : ""}
                        ${m.lancamento_remedio ? `<span class="badge bg-secondary">Lançamento</span>` : ""}
                        ${m.tipo === "Tarjado" ? `<span class="badge bg-warning position-absolute top-0 end-0 m-3" style="color:black;">${m.tipo}</span>` : ""}
                    </div>
                </div>
            </div>
            ${usuarioLogado ? `
            <button type="button" class="btn-favoritar btn btn-light shadow-sm rounded-circle p-0 position-absolute top-0 start-0 m-3"
                data-id="${m.remedio_id}" style="width:38px;height:38px;border:none;background:white;z-index:10;">
                <i class="bi bi-heart${m.favorito ? "-fill text-danger" : ""}" style="font-size:1.2rem;"></i>
            </button>` : ""}
        </div>
    `

    col.querySelector(".card").addEventListener("click", (e) => {
        if (e.target.closest(".btn-favoritar")) return
        location.href = urlDetalhe
    })

    const btnFav = col.querySelector(".btn-favoritar")
    if (btnFav) {
        btnFav.addEventListener("click", async (e) => {
            e.stopPropagation()
            const icone = btnFav.querySelector("i")
            const res = await fetch(`/api/favoritos/${m.remedio_id}`, { method: "POST" })
            if (res.ok) {
                icone.classList.toggle("bi-heart-fill")
                icone.classList.toggle("text-danger")
            }
        })
    }

    return col
}

// ---------- carrossel de destaques ----------

function renderizarDestaques(medicamentos, wrapper) {
    const destaques = medicamentos.filter(m => m.destaque_remedio)
    wrapper.innerHTML = ""

    if (destaques.length === 0) {
        wrapper.innerHTML = `<div class="swiper-slide"><div class="empty-state w-100">Nenhum medicamento em destaque no momento.</div></div>`
        return
    }

    destaques.forEach(m => {
        const slide = document.createElement("div")
        slide.className = "swiper-slide"
        const valorFormatado = Number(m.valor_remedio).toFixed(2)
        const urlDetalhe = `/remedios/${m.remedio_id}`

        slide.innerHTML = `
            <article class="featured-product-card" style="cursor:pointer">
                <div class="featured-product-img-wrap">
                    ${m.imagem_url
                        ? `<img src="/static/${m.imagem_url}" alt="${m.nome_remedio}" />`
                        : `<i class="bi bi-capsule text-muted" style="font-size:3rem;"></i>`
                    }
                </div>
                <div class="featured-product-body">
                    <h3 class="featured-product-name">${m.nome_remedio}</h3>
                    <p class="featured-product-meta">${m.principio_remedio || (m.descricao_remedio || "").slice(0, 40) || "Consulte o rótulo"}</p>
                    <p class="featured-product-price mb-0">
                        R$ ${valorFormatado}
                        ${m.promocao_remedio ? `<span class="badge bg-warning text-dark promo-badge">Promoção</span>` : ""}
                    </p>
                </div>
            </article>
        `
        slide.addEventListener("click", () => location.href = urlDetalhe)
        wrapper.appendChild(slide)
    })
}