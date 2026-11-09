const API_URL = "/api/medicamentos";

document.addEventListener('DOMContentLoaded', async () => {
    const form = document.getElementById('form-cadastrar');
    if (!form) return;

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const formData = new FormData(form);



        const div_msg = document.getElementById("msg");
        const resp = await fetch(API_URL, {
            method: "POST",
            body: formData
        });

        const data = await resp.json();
        if (!div_msg) return;
        div_msg.className = ""; 
        div_msg.classList.add("alert", resp.ok ? "alert-success" : "alert-danger");
        div_msg.textContent = data.mensagem;

        if (resp.ok) {
            window.location.href = "/remedios";
        }
    });
});

function mostrarCampoTipo() {
    const tipo = document.getElementById('tipo').value;
    document.getElementById('campo_tarjado').style.display = this.value === 'tarjado' ? 'block' : 'none';
    document.getElementById('campo_venda_livre').style.display = this.value === 'venda_livre' ? 'block' : 'none';
}