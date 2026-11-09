const API_URL = "/api/categorias"

document.addEventListener("DOMContentLoaded", async () => {
    const form = document.getElementById("form-categoria")
    const grid = document.getElementById("categorias-grid")

    if (form) {
        form.addEventListener("submit", async (e) => {
            e.preventDefault()

            const categoriaId = form.dataset.categoriaId
            const formData = new FormData(form)
            const editando = !!categoriaId

            // editarCategoria é uma rota POST na página atual (não PUT em /api),
            // então mantemos o fluxo de POST pra página atual em ambos os casos
            const resp = await fetch(window.location.pathname, {
                method: "POST",
                body: formData
            })

            const data = await resp.json()
            exibir_mensagem(data.mensagem, resp.ok)

            if (resp.ok && !editando) {
                form.reset()
                carregarCategorias(grid)
            }
        })
    }

    if (grid) {
        await carregarCategorias(grid)
    }
})

async function carregarCategorias(grid) {
    const res = await fetch(API_URL)
    if (!res.ok) return
    const categorias = await res.json()
    renderizarCategorias(categorias, grid)
}

function renderizarCategorias(categorias, grid) {
    const usuarioAdm = grid.dataset.usuarioAdm === "true"
    const cardStyle = grid.dataset.cardStyle || "simple"
    grid.innerHTML = ""

    if (categorias.length === 0) {
        grid.innerHTML = cardStyle === "premium" ? `
            <div class="col-12 text-center py-5 my-4">
                <div class="mb-3 d-inline-flex p-4 bg-white rounded-circle border border-light shadow-sm text-muted">
                    <i class="bi bi-folder-x display-4 text-secondary"></i>
                </div>
                <h5 class="fw-bold text-dark mb-2">Nenhuma categoria encontrada</h5>
                <p class="text-muted small mb-4">Inicie o catálogo cadastrando as seções de medicamentos do sistema.</p>
                <a href="/cadastrarCategoria" class="btn btn-primary px-4 py-2" style="border-radius:12px;font-weight:600;">
                    Criar Primeira Categoria
                </a>
            </div>` : `
            <div class="col-12 text-center py-5">
                <p class="text-muted italic">Nenhuma categoria encontrada.</p>
            </div>`
        return
    }

    categorias.forEach(cat => {
        const col = document.createElement("div")
        col.className = "col"

        col.innerHTML = cardStyle === "premium"
            ? criarCardPremium(cat, usuarioAdm)
            : criarCardSimples(cat, usuarioAdm)

        const btnExcluir = col.querySelector(".btn-excluir-categoria")
        if (btnExcluir) {
            btnExcluir.addEventListener("click", async () => {
                const confirmado = confirm("Atenção: excluir esta categoria removerá todos os itens vinculados. Deseja continuar?")
                if (!confirmado) return

                const res = await fetch(`${API_URL}/${cat.id}`, { method: "DELETE" })
                const data = await res.json()
                exibir_mensagem(data.mensagem, res.ok)
                if (res.ok) col.remove()
            })
        }

        grid.appendChild(col)
    })
}

function criarCardSimples(cat, usuarioAdm) {
    return `
        <div class="card h-100 category-card shadow-sm border-0">
            <div class="card-body d-flex flex-column align-items-center p-4">
                <div class="icon-box mb-3 d-flex align-items-center justify-content-center">
                    <img src="/static/${cat.imagem_categoria || 'image/img_padrao.png'}" alt="${cat.nome}" width="35" class="img-fluid" />
                </div>
                <h5 class="category-title fw-bold text-dark text-center">${cat.nome}</h5>
                ${usuarioAdm ? `
                <div class="d-grid gap-2 w-100 mt-auto pt-3">
                    <a href="/editarCategoria/${cat.id}" class="btn btn-sm btn-outline-primary w-100 py-2">
                        <i class="bi bi-pencil me-1"></i> Editar
                    </a>
                    <button type="button" class="btn btn-sm btn-outline-danger w-100 py-2 btn-excluir-categoria" data-id="${cat.id}">
                        <i class="bi bi-trash me-1"></i> Excluir
                    </button>
                </div>` : ""}
            </div>
        </div>
    `
}

function criarCardPremium(cat, usuarioAdm) {
    return `
        <div class="card h-100 category-card">
            <div class="card-body d-flex flex-column align-items-center p-4">
                <div class="icon-wrapper d-flex align-items-center justify-content-center">
                    <img src="/static/${cat.imagem_categoria || 'image/img_padrao.png'}" alt="${cat.nome_categoria}" width="32" class="img-fluid" />
                </div>
                <h5 class="category-title">${cat.nome_categoria}</h5>
                ${usuarioAdm ? `
                <div class="admin-actions-grid">
                    <a href="/editarCategoria/${cat.id_categoria}" class="btn btn-edit-action border-0">
                        <i class="bi bi-pencil-square"></i> Editar
                    </a>
                    <button type="button" class="btn btn-delete-action border-0 w-100 btn-excluir-categoria" data-id="${cat.id_categoria}">
                        <i class="bi bi-trash3"></i> Excluir
                    </button>
                </div>` : ""}
            </div>
        </div>
    `
}

function exibir_mensagem(msg, ok) {
    const div_msg = document.getElementById("msg")
    if (!div_msg) return
    div_msg.classList.remove("alert", "alert-success", "alert-danger")
    div_msg.classList.add("alert", ok ? "alert-success" : "alert-danger")
    div_msg.textContent = msg
}