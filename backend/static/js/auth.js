/*
 * auth.js — liga os formulários de login e cadastro à API JSON.
 *
 * Nenhuma das duas páginas (login.html / register.html) manda mais os
 * dados direto pro servidor com method="POST" no <form>. Em vez disso,
 * este arquivo escuta o evento "submit" de cada formulário, impede o
 * comportamento padrão do navegador (que recarregaria a página) e envia
 * os dados como JSON usando fetch (via chamarApi, de api.js).
 */

const formLogin = document.getElementById("form-login");
if (formLogin) {
  formLogin.addEventListener("submit", async (evento) => {
    evento.preventDefault(); // não deixa a página recarregar/navegar

    const email = document.getElementById("email").value.trim();
    const senha = document.getElementById("senha").value;
    const caixaErro = document.getElementById("login-erro");
    caixaErro.classList.add("d-none");

    const resposta = await chamarApi("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, senha }),
    });
    const dados = await resposta.json();

    if (!resposta.ok) {
      // 400 (faltou campo) ou 401 (e-mail/senha errados)
      caixaErro.textContent = dados.erro || "Não foi possível entrar.";
      caixaErro.classList.remove("d-none");
      return;
    }

    // --- é aqui que o token chega no navegador e é guardado ---
    guardarToken(dados.token);

    // Depois de guardar o token, manda a pessoa para a página inicial.
    window.location.href = "/";
  });
}

const formCadastro = document.getElementById("form-cadastro");
if (formCadastro) {
  formCadastro.addEventListener("submit", async (evento) => {
    evento.preventDefault();

    const nome = document.getElementById("nome").value.trim();
    const email = document.getElementById("email").value.trim();
    const senha = document.getElementById("senha").value;
    const caixaErro = document.getElementById("cadastro-erro");
    caixaErro.classList.add("d-none");

    const resposta = await chamarApi("/api/v1/auth/registro", {
      method: "POST",
      body: JSON.stringify({ nome, email, senha }),
    });
    const dados = await resposta.json();

    if (!resposta.ok) {
      // 400 (campo faltando/senha curta) ou 409 (e-mail já cadastrado)
      caixaErro.textContent = dados.erro || "Não foi possível cadastrar.";
      caixaErro.classList.remove("d-none");
      return;
    }

    // O cadastro não devolve token (só o login devolve). Por isso, depois
    // de cadastrar com sucesso, mandamos a pessoa para a tela de login
    // para ela entrar normalmente e então SIM receber o token.
    window.location.href = "/login";
  });
}
