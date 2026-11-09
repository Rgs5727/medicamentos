# Plano do site — SabØr FⱯrmⱯciⱯ (React + Flask + JWT)

> Documento gerado a partir do questionário de 2026-11-07. Toda decisão abaixo
> foi escolhida pelo dono do projeto. Nada é codado fora deste plano sem perguntar.

## Regra obrigatória: dúvidas e decisões (vale para TODAS as etapas)
- Antes de implementar, analisar o projeto, o código existente, os templates antigos e este plano.
- Se houver dúvida, ambiguidade, conflito entre instruções ou decisão não definida, **perguntar antes** de alterar qualquer coisa.
- Não decidir sozinho, não presumir e não escolher solução só por conveniência técnica. Não inventar solução para o que não está especificado: explicar a dúvida e dar alternativas.
- Não perguntar o que já está definido aqui ou pode ser descoberto no próprio projeto, nem repetir perguntas já respondidas.
- Esperar a resposta antes de implementar o que depende dela. É melhor perguntar antes do que implementar errado e refazer.

## Regras gerais
- **Estrutura**: `backend/` (Flask + flask-cors, rotas `/api/*` em JSON) e `frontend/` (Vite + React + axios + react-router-dom). Nunca misturar.
- **Arquitetura do front**: seguir o modelo da livraria (`Navbar`, `Secao`, `Tabela`, `LinhaTabela`, `Filtro`, `Form`, `Pagina` / `PaginaNovo` / `PaginaEditar`, `services/api.js`, `pages/PaginaDeErro`).
- **Visual**: idêntico às páginas antigas. Copiar sem alterar `base.css`, `remedios.css`, `cadastro.css`, `categoria.css`, `remedio_detalhe.css`, `usuario_detalhe.css`, `usuario_editar.css`, `sobre.css`, com as **mesmas classes e a mesma estrutura de HTML** dos templates Jinja antigos. Bootstrap 5.3, Bootstrap Icons e a fonte Inter por CDN, como no `base.html`.
- **Bibliotecas**: axios, react-router-dom e swiper (carrosséis, já instalado).
- **Mensagens**: toast igual ao antigo (`custom-toast`, canto inferior direito, com ícone).

## Autenticação (JWT)
- Login `POST /api/v1/auth/login` devolve `{ token, usuario, expira_em }`. Cadastro: `POST /api/v1/auth/registro`.
- **Validade do token: 30 minutos** (`VALIDADE_DO_TOKEN` em `token_utils.py`).
- Token guardado no **localStorage**. Um interceptor do axios envia `Authorization: Bearer <token>` em toda chamada.
- Quem está logado e se é admin vem **sempre** de `GET /api/v1/auth/me` (que também devolve `expira_em`), nunca de decodificar o token no navegador.
- **Faltando 5 min**: toast "Sua sessão expira em 5 minutos" (sem renovar).
- **Expirou** (pelo timer ou por um 401 da API): apaga o token e abre a página **"Sessão expirada"**, com "Entrar novamente" (depois do login, volta para a página onde a pessoa estava) e "Ir para o início".
- Rotas protegidas no React (`RotaProtegida`): sem login, manda para `/login`.
- Backend: GET é público; POST/PUT/DELETE usam `@login_required`. Usuário comum cria conteúdo **pendente** e o admin cria **aprovado**. Rotas de admin usam `@admin_required` (401 = sem token, 403 = sem permissão).

## Páginas
| Rota | Página | Acesso |
|---|---|---|
| `/` | **Home**: hero, carrossel de categorias, carrossel de destaques, "Como funciona", catálogo em cards com busca; botões "Adicionar remédio" e "Gerenciar remédios" (logado) | público |
| `/remedios/:id` | **Detalhe**: dados do remédio; Editar/Excluir (só dono ou adm); favoritar; ver comentários; comentar e editar/excluir o próprio comentário | público (ações exigem login) |
| `/remedios` | **Gerenciar remédios**: tabela CRUD do modelo | logado |
| `/remedio_novo`, `/remedios/:id/editar` | Formulário no visual `card-cadastro` antigo | logado |
| `/categorias` (+ novo/editar) | **Categorias completa**: listar, cadastrar, editar, excluir (mesma regra pendente/adm) | listar público, resto logado |
| `/conta` | **Minha conta**: "Olá, Nome", cartão do perfil, contador e grade de favoritos | logado |
| `/conta/editar` | Editar perfil (nome/senha) | logado |
| `/esqueci-senha`, `/redefinir-senha/:token` | Recuperação de senha | público |
| `/sobre` | Sobre nós | público |
| `/login`, `/cadastro` | Login e Cadastro com CSS antigo | público |
| `/sessao-expirada` | Aviso de expiração | público |
| `*` | PaginaDeErro | público |

- **Card de remédio**: o clique abre o detalhe. O coração de favoritar aparece para quem está logado.
- **Navbar idêntica à antiga**: Início, Medicamentos, Categorias, Como funciona, Sobre nós, busca, favoritos com badge, avatar, Sair / Entrar, Cadastrar.
- **Painel Admin lateral** (só adm): botão "Gerenciar Admin" e o visual antigo. "Gerenciar remédios" funciona; os outros links (Menu, Moderação, Usuários) levam a uma página "Em breve".

## APIs novas no backend (todas JSON + token)
- `POST /api/favoritos/<id>` (alternar) e `GET /api/favoritos`: `@login_required`
- `GET /api/medicamentos/<id>/comentarios` (público); `POST` / `PUT` / `DELETE` de comentários: `@login_required` (só o dono ou adm)
- Categorias: proteger POST/PUT/DELETE com `@login_required`
- `PUT /api/v1/auth/perfil`: `@login_required`
- Esqueci/redefinir senha em JSON
- O detalhe passa a devolver quem cadastrou, para decidir se mostra Editar/Excluir

## Decisões tomadas antes da Etapa 1
- **Referência "página antiga"**: os templates que continuam em `backend/templates/` (iguais aos do `Projeto Nunes.zip`). O CSS é igual em todas as cópias.
- **Quem está logado**: estado no `App.jsx` + props (sem AuthContext). As funções do token ficam em `services/api.js`.
- **CSS**: cada página liga só o seu CSS (componente `CssDaPagina`). Arquivos copiados sem alteração para `frontend/public/style/`. O `base.css` fica sempre ativo (`index.html`).
- **Provisório até cada etapa**: `/` continua indo para a tabela `/remedios`. Links para páginas futuras (Medicamentos, Como funciona, busca, Categorias, Sobre, Minha conta, Favoritos, Esqueci senha) abrem "Em breve".
- **Sessão expirada / Em breve**: visual da página 403 antiga (`error403.css`).
- **Toast**: direita para visitante/usuário, **esquerda para administrador** (como o menu.js antigo). Fecha no X ou **sozinho em 5 s**, e some ao trocar de página. Um toast criado logo antes de um redirecionamento acompanha a página nova.
- **Mensagens**:
  - Erros de login/cadastro ficam na caixa vermelha do card.
  - Toast de sucesso no cadastro, no login e no Sair ("Desconectado com sucesso. Volte sempre!").
  - Toast "Acesso negado! Você precisa estar logado." quando a pessoa é barrada.
- **Depois do login**: volta para a página que tentou abrir (RotaProtegida) ou onde a sessão expirou; senão, vai para `/`.
- **401**: só vira "sessão expirada" se o pedido levou token. A senha errada no login continua sendo erro normal.

## Decisões da Etapa 2 (aprovada a Etapa 1)
- **Cadastro**: depois de cadastrar, o React faz o login sozinho (mesmo POST /api/v1/auth/login) e leva para o início já logado, com o toast "Usuário cadastrado com sucesso.".
- **Banco** (ajustado, com backup em `backup_banco/`, que fica fora do commit):
  - O `medicamentos_db` tinha sido criado pelo script de outra versão (pasta `nigga`). O `status` de MEDICAMENTOS era texto e virou BOOLEAN: 'aprovado' = 1, o resto = 0.
  - A coluna `criado_por`, que já existia, é o **dono** do remédio. Foi adicionada ao `script.sql`.
- **Dono ou admin em tudo**:
  - A API de editar/excluir remédio responde 403 para quem não é dono nem admin, e os botões ficam invisíveis.
  - O dono vê o próprio remédio pendente (antes de aprovar ou recusar) e pode editar ou excluir. Para os outros, o pendente dá 404.
  - Remédios antigos sem dono ficam só para o admin.
- **Filtros corrigidos**: a busca da navbar e a do catálogo filtram pelo nome (`/?q=...#catalogo`). Clicar numa categoria filtra pela categoria (`/?categoria=id#catalogo`). Buscar vazio mostra tudo.
- **Selo de favoritos**: a quantidade aparece no coração da navbar em todas as páginas (quando há 1 ou mais).
- **Relógio**: o login e o `/auth/me` também mandam `segundos_para_expirar`, contados pelo servidor. O React conta a partir disso, então não depende do relógio do computador.
- **SECRET_KEY**: fica como está (decisão do dono do projeto).
- **Seguindo o antigo**:
  - Home = `remedios.html` e Detalhe = `remedio_detalhe.html` (sem a seção "Detalhes do Formato").
  - Os comentários mostram o e-mail de quem comentou.
  - Editar comentário tem página própria (`/comentarios/:id/editar`).
  - Os toasts usam as mensagens antigas.
  - Cada página nova abre no topo. O voltar do navegador devolve a posição.
- **APIs novas**:
  - `GET/POST /api/favoritos[/<id>]`
  - `GET/POST /api/medicamentos/<id>/comentarios`
  - `GET/PUT/DELETE /api/comentarios/<id>` (só autor ou admin)
- **Git**:
  - O repositório é github.com/Rgs5727/medicamentos (versão antiga, de abril).
  - Preparar **direto no `main`**, substituindo a estrutura antiga. Eu NÃO faço commit nem push.
  - Entra só o que o site usa, mais o README novo e este `PLANO_SITE.md`.
  - Fica fora: `.env`, uploads, venv, node_modules, dist, caches, backups.

## Decisões da Etapa 3
- **Gerenciar remédios** (`/remedios`, tabela do modelo):
  - Lista todos os aprovados.
  - Acima, o bloco "Meus pendentes" (para o admin, "Pendentes", com todos), que **só aparece se existir algum**, sem mensagem de vazio.
  - Selo "Pendente" nas linhas pendentes.
  - Editar/Excluir só nos remédios da pessoa (admin: em todos).
  - Botão "Adicionar remédio" no topo.
- **Formulários**:
  - Iguais a `cadastrar_medicamento.html` / `editar_medicamento.html` (cadastro.css).
  - Corrigidos 3 defeitos antigos: tarja/venda livre preenchidas, "Venda Livre" selecionado, "Selecione o tipo" sem valor inválido.
  - Mensagens em toast.
  - Depois de salvar ou cancelar, volta para onde a pessoa veio (catálogo, detalhe, tabela). Se não souber, vai para o início.
- **Moderação convertida** (`/moderacao`, só admin):
  - Igual à `moderacao.html` antiga. O CSS do `<style>` dela foi copiado sem alteração para `public/style/moderacao.css`.
  - Aprovar/rejeitar remédios e categorias, com as mensagens antigas.
  - API nova: `GET /api/v1/moderacao` e `POST /api/v1/moderacao/medicamentos/aprovar|rejeitar`. As de categorias já existiam.
- **Página não autorizada** (logado, sem permissão: editar remédio ou comentário de outra pessoa pela URL, `/moderacao` sem ser admin) abre a **página 403 antiga** (`error403.html`). Quem não está logado continua indo para o login.
- **Painel Admin**:
  - Igual ao antigo, com "Gerenciar remédios" em Gerenciamento, fechando ao trocar de página.
  - Voltaram o selo "Novos" e o pontinho no botão quando há pendentes.
  - "Menu do Administrador" e "Usuários" continuam "Em breve".
- **Dados da outra versão**: tipo 'Tarjado' → 'tarjado' no banco (com backup) e as 2 fotos copiadas da pasta `nigga2` (as fotos não entram no commit).

## Decisões da Etapa 4
- **Categorias com dono**:
  - A coluna `criado_por` (que já existia no banco) foi adicionada ao `script.sql`.
  - Editar/excluir só o dono ou o admin. A API responde 403; pela URL abre a página 403.
- **Excluir categoria = igual ao antigo**: apaga também os remédios dela (ON DELETE CASCADE), depois do aviso antigo "removerá todos os itens vinculados".
- **"Minhas pendentes"** (admin: "Pendentes") na página de categorias, só quando existe alguma. A categoria pendente de outra pessoa dá 404.
- **Páginas**:
  - `/categorias` = `categorias.html`. O CSS do `<style>` dele foi para `public/style/categorias.css`.
  - `/categoria_nova` = `cadastrar_categoria.html`, com "Categorias Existentes". Depois de salvar, limpa o campo e atualiza a lista.
  - `/categorias/:id/editar` = `editar_categoria.html`. Ao salvar, volta para `/categorias`.
- **Corrigido**:
  - `GET /api/categorias/<id>` dava erro 500.
  - POST/PUT/DELETE agora exigem token.
  - Nome repetido também é bloqueado ao editar.

## Decisões da Etapa 5
- **Minha conta** (`/conta`) = `usuario_detalhe.html`:
  - O coração tira dos favoritos e o clique abre o detalhe. "Desde 2026" é fixo, como no antigo.
  - O contador usa a mesma lista do selo da navbar.
- **Editar perfil** (`/conta/editar`) = `usuario_editar.html`:
  - **Sem o campo "SUA SENHA ATUAL"**: o antigo guardava a senha em texto puro no cookie, e o banco só tem o hash.
  - Trocar a senha **não pede a atual** (igual ao antigo). Mínimo de 6 caracteres.
  - Ao salvar, volta para `/conta` e a navbar atualiza.
- **Esqueci / redefinir senha**: templates e mensagens antigas.
  - O link do e-mail usa `FRONTEND_URL` do `.env` (padrão `http://localhost:5173`).
  - O endereço nunca vem do pedido, para ninguém trocar o link por um site falso.
- **Sobre** = `sobre.html`, com as partículas e o acordeão.
- "Menu do Administrador" e "Usuários" do painel continuam "Em breve" (não estão no plano).
- **APIs novas**:
  - `PUT /api/v1/auth/perfil`
  - `POST /api/v1/auth/esqueci-senha`
  - `GET/POST /api/v1/auth/redefinir-senha/<token>`

## Decisões do commit (preparação para o GitHub)
- **Páginas antigas do Flask** (`backend/templates` + `backend/static`) entram no commit, como no modelo da livraria.
- **`backend/app.py` fica como está**: os valores padrão de `SECRET_KEY` e do admin continuam no código, por decisão do dono.
- **Apagados** por não fazerem nada no site:
  - `backend/config.py` (ninguém usava; tinha import circular)
  - `frontend/README.md` e `frontend/public/icons.svg` (exemplos do Vite)
- **Novos na raiz**: `README.md` (como rodar, login JWT, permissões, páginas e API) e `.gitignore` (o do grupo + `node_modules/`, `dist/`, `backend/static/uploads/`, `backup_banco/`).
- **Git**: preparado direto no `main`, a partir do `main` do GitHub, com tudo no stage. **Sem commit e sem push**: quem faz é o dono do projeto.
- **CORS**: o Flask aceita `http://localhost:5173` **e** `http://127.0.0.1:5173`. Antes, abrir o site por `127.0.0.1` dava "Não foi possível falar com o servidor!" no login e no cadastro. Nenhuma outra origem é liberada.

## Depois do commit preparado (2026-11-08)
- **Cargo de admin continua conferido pelo token** (decisão do dono). Quem vira admin, ou perde o admin, precisa sair e entrar de novo.
  - Enquanto isso, as páginas de admin que a API recusa (Pendentes, Usuários) mostram a **página 403** em vez de ficar em branco.
- **Menu do Administrador** (`/menu`) = `menu.html`, só admin.
  - O CSS do `<style>` dele foi copiado sem alteração para `public/style/menu.css`.
  - Tem "Painel Geral", "Olá, nome", a data de hoje e os atalhos Novo Remédio, Categorias, Moderação e Usuários.
- **Controle de Usuários** (`/usuarios`) = `usuarios.html`, só admin.
  - O CSS foi para `public/style/usuarios.css`.
  - Tem cards, busca, filtros e a janela com "Promover a ADM" / "Remover Cargo ADM", com as mensagens antigas em toast.
  - Usa a API que já existia (`GET /api/v1/usuarios`, `PUT /api/v1/usuarios/<email>`). Ela ganhou a trava antiga: ninguém rebaixa a si mesmo.
- A página 403, para quem está logado, mostra só o botão "Voltar". Ela também diz o que a pessoa é, qual página tentou abrir e o que precisa para acessar. No caso do login antigo, ela diz para sair e entrar de novo.
- O botão "Gerenciar remédios" saiu do catálogo da Home. O acesso fica pelo painel do admin. A tela `/remedios` continua aberta para quem está logado pela URL (com "Meus pendentes").
- **Porta 5000 leva para a 5173**: abrir qualquer página na 5000 (ex.: `127.0.0.1:5000/remedios`) redireciona para a mesma página no React (5173), com o mesmo nome de endereço. Na 5000 ficam só `/api/...` e `/static/...`. As páginas antigas em Jinja continuam na pasta, mas não abrem mais.
- A página provisória "Em breve" foi apagada, porque todas as páginas do painel agora existem.
- O git **não** foi mexido depois disso, a pedido do dono. Antes de commitar, rodar `git add -A`.

## Etapas (parar ao fim de cada uma para teste e aprovação)
> Atualização: o dono pediu para fazer as etapas 2 a 5 seguidas, perguntando as dúvidas de cada uma antes de começá-la. O teste dele fica para o final.
1. **Base**: CSS + imagens, `index.html`, Navbar, Rodapé, Toast, JWT (30 min, aviso de 5 min, sessão expirada), Login, Cadastro, RotaProtegida
2. **Home + Detalhe + Favoritos + Comentários**
3. **Gerenciar remédios + Painel Admin**
4. **Categorias**
5. **Minha conta + Editar perfil + Esqueci senha + Sobre**
