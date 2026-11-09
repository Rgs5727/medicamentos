/*
 * api.js — cuida do token no navegador.
 *
 * Depois que o login dá certo, o servidor manda um token dentro do JSON
 * de resposta (veja token_utils.py e o método api_login do controller).
 * Este arquivo é responsável pelas 3 pontas do token DO LADO DO CLIENTE:
 *   1) GUARDAR o token assim que ele chega (guardarToken).
 *   2) LER o token guardado quando for preciso mandá-lo de novo (pegarToken).
 *   3) MANDAR o token de volta ao servidor em toda chamada que precisa de
 *      login, dentro do cabeçalho "Authorization: Bearer <token>" (é a
 *      função chamarApi abaixo).
 *
 * O token é guardado no localStorage do navegador (a especificação cita
 * isso como "um caminho" possível — é o que estamos usando aqui). O
 * localStorage sobrevive mesmo se a pessoa fechar a aba ou o navegador.
 */

const CHAVE_TOKEN_LOCALSTORAGE = "token";

/** Guarda o token recebido do servidor no localStorage do navegador. */
function guardarToken(token) {
  localStorage.setItem(CHAVE_TOKEN_LOCALSTORAGE, token);
}

/** Lê o token salvo, ou null se ninguém tiver feito login ainda. */
function pegarToken() {
  return localStorage.getItem(CHAVE_TOKEN_LOCALSTORAGE);
}

/** Apaga o token do navegador — é o que representa o "logout" no cliente. */
function apagarToken() {
  localStorage.removeItem(CHAVE_TOKEN_LOCALSTORAGE);
}

/**
 * chamarApi(url, opcoes) — um "fetch" que já sabe mandar o token.
 *
 * Toda vez que a página precisar chamar uma rota da API que exige login
 * (ex: GET /api/v1/auth/me, GET /api/v1/usuarios), é esta função que deve
 * ser usada em vez do fetch puro: ela lê o token guardado (pegarToken) e
 * o coloca sozinha no cabeçalho Authorization antes de enviar o pedido.
 * É EXATAMENTE esse cabeçalho que os decoradores @login_required e
 * @admin_required, no back-end (users.py), vão ler para saber quem está
 * logado.
 */
async function chamarApi(url, opcoes = {}) {
  const token = pegarToken();

  const cabecalhos = {
    "Content-Type": "application/json",
    ...(opcoes.headers || {}),
  };

  // Só manda o cabeçalho Authorization se existir um token guardado.
  // Rotas públicas (ex: GET /api/v1/medicamentos) funcionam mesmo sem ele.
  if (token) {
    cabecalhos["Authorization"] = "Bearer " + token;
  }

  return fetch(url, { ...opcoes, headers: cabecalhos });
}

/**
 * pegarUsuarioLogado() — pergunta pro servidor quem está logado.
 *
 * Chama GET /api/v1/auth/me (protegida por @login_required) e devolve:
 *   - o objeto { nome, email, adm } se o token for válido (200)
 *   - null se não tiver token guardado, ou se o token for inválido/
 *     expirado (a rota responde 401 nesse caso)
 *
 * Esta é a função que qualquer página deve usar para saber se a pessoa
 * está logada e se é administradora — nunca decodificando o token à mão
 * no navegador (é isso que a especificação do 3º bimestre pede no item
 * 1.5: "Não confie em um campo lido do token no navegador").
 */
async function pegarUsuarioLogado() {
  if (!pegarToken()) {
    // Nem tenta chamar a API se não existe token nenhum guardado.
    return null;
  }
  const resposta = await chamarApi("/api/v1/auth/me");
  if (!resposta.ok) {
    return null;
  }
  return resposta.json();
}

/**
 * protegerPagina(exigirAdmin) — "tranca" uma página inteira para quem não
 * está logado (e, opcionalmente, para quem não é administrador).
 *
 * Esta é a peça pedida no item da tabela de divisão do trabalho do
 * Aluno 1: "impedir o acesso às páginas quando não está logado". Como
 * agora o Flask entrega a página vazia pra qualquer um (o render_template
 * não sabe mais quem está logado, porque isso virou responsabilidade do
 * token), é o JavaScript que decide se a pessoa pode continuar vendo essa
 * página ou se deve ser mandada embora.
 *
 * Como usar: no topo do arquivo JS de uma página que só pode ser vista
 * por quem está logado (ex: formulário de cadastro de medicamento,
 * painel de moderação), chame:
 *
 *     protegerPagina().then(usuario => {
 *         // só chega aqui se realmente estiver logado
 *     });
 *
 * Ou, se a página é só para administrador:
 *
 *     protegerPagina(true).then(usuario => { ... });
 *
 * Se a pessoa não estiver logada (ou não for admin, quando exigido), a
 * função já redireciona para /login sozinha e a Promise nunca resolve
 * pro código que chamou (a página para de ser processada ali).
 */
async function protegerPagina(exigirAdmin = false) {
  const usuario = await pegarUsuarioLogado();

  if (!usuario) {
    // Sem token válido nenhum -> nem logado está. Manda pro login.
    window.location.href = "/login";
    return new Promise(() => {}); // nunca resolve: a página já está saindo
  }

  if (exigirAdmin && !usuario.adm) {
    // Está logado, mas não é administrador -> não pode ver esta página.
    window.location.href = "/";
    return new Promise(() => {});
  }

  return usuario;
}
