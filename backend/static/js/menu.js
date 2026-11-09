/*
 * menu.js — deixa o menu do topo (base.html) certo com quem está logado.
 *
 * A página chega do Flask sempre no estado "deslogado" (é o que o Jinja
 * consegue saber, já que ele não recebe mais dado nenhum de sessão/banco
 * — ver comentários em base.html). Este arquivo roda em TODA página do
 * site (porque está incluído direto em base.html, não dentro de um
 * bloco extra_js) e corrige isso assim que a página carrega:
 *
 *   1. Pergunta pro servidor "quem está logado?" chamando
 *      pegarUsuarioLogado(), de api.js — que por baixo dos panos chama
 *      GET /api/v1/auth/me mandando o token guardado no localStorage.
 *   2. Se vier alguém logado, troca "Entrar/Cadastrar" por
 *      avatar + "Sair", mostra o coração de favoritos, e -- se for
 *      administrador -- mostra o botão "Gerenciar Admin".
 *   3. Se não vier ninguém (sem token, token expirado/inválido), deixa
 *      tudo como já está (o estado padrão já é "deslogado").
 *
 * Por que isso é feito aqui e não no Jinja: a especificação do 3º
 * bimestre pede exatamente isso no item 1.5 — "Descubra isso chamando
 * GET /api/v1/auth/me. Não confie em um campo lido do token no
 * navegador." O HTML nunca decide sozinho quem está logado; só o
 * servidor, através dessa rota, decide.
 */

document.addEventListener("DOMContentLoaded", async () => {
  const usuario = await pegarUsuarioLogado(); // null se não estiver logado

  if (!usuario) {
    return; // já nasce como "deslogado", não precisa fazer nada
  }

  // --- Logado: troca Entrar/Cadastrar por avatar/Sair ---
  document.getElementById("navbar-login-link")?.classList.add("d-none");
  document.getElementById("navbar-register-link")?.classList.add("d-none");
  document.getElementById("navbar-avatar-link")?.classList.remove("d-none");
  document.getElementById("navbar-logout-link")?.classList.remove("d-none");
  document.getElementById("navbar-fav-link")?.classList.remove("d-none");
  document.getElementById("navbar-search-form")?.classList.remove("d-none");

  const letraAvatar = document.getElementById("navbar-avatar-letter");
  if (letraAvatar && usuario.nome) {
    letraAvatar.textContent = usuario.nome[0].toUpperCase();
  }

  // --- Administrador: mostra o botão/painel de admin ---
  if (usuario.adm) {
    document.getElementById("adminToggleBtn")?.classList.remove("d-none");
    document.getElementById("adminSidebar")?.classList.remove("d-none");

    const toastContainer = document.getElementById("toast-container");
    if (toastContainer) {
      toastContainer.classList.remove("end-0");
      toastContainer.classList.add("start-0", "toast-container--left");
    }
  }
});

// O link "Sair" ainda navega para a rota de página /logout (que limpa a
// session do lado do servidor, usada pelas páginas antigas que ainda não
// foram convertidas). Só isso NÃO apaga o token do navegador — por isso,
// antes de deixar o clique seguir, apagamos o token aqui também. Assim o
// logout funciona tanto para quem depende do token quanto para quem ainda
// depende da session.
document.getElementById("navbar-logout-link")?.addEventListener("click", () => {
  apagarToken();
});
