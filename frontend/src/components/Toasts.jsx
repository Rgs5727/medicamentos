// Mesmo toast do base.html antigo (as mensagens "flash" do Flask).
// Ícone conforme o tipo, igual ao Jinja antigo: success -> check,
// danger -> X, qualquer outro (warning/info) -> triângulo de alerta.
const ICONES = {
    success: "bi-check-circle-fill",
    danger: "bi-x-circle-fill",
}

function Toasts({ toasts, adm, aoFechar }){
    // Igual ao menu.js antigo: para administrador os toasts vão para o canto
    // inferior ESQUERDO, porque o botão "Gerenciar Admin" fica no direito.
    const lado = adm ? "start-0 toast-container--left" : "end-0"

    return (
    <>
    <div className={`toast-container position-fixed bottom-0 p-3 ${lado}`} id="toast-container" style={{ zIndex: 1055 }}>
        {toasts.map((t) => (
            <div key={t.id} className={`custom-toast alert alert-${t.tipo} alert-dismissible fade show`} role="alert">
                <div className="d-flex align-items-center">
                    <i className={`bi ${ICONES[t.tipo] || "bi-exclamation-triangle-fill"} me-2`}></i>
                    <div className="flex-grow-1">{t.texto}</div>
                </div>
                {/* Fecha pelo React (e não pelo data-bs-dismiss do Bootstrap), senão o
                    Bootstrap apagaria um elemento que o React ainda controla */}
                <button type="button" className="btn-close btn-close-white ms-2" aria-label="Fechar"
                    onClick={() => aoFechar(t.id)}></button>
            </div>
        ))}
    </div>
    </>
    )
}

export default Toasts
