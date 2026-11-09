# 💊 SabØr FⱯrmⱯciⱯ — Sistema de Medicamentos

Aplicação web de medicamentos feita com **Flask** (API em JSON), **React + Vite** (telas) e **MySQL**, com login por **token JWT**.

> Todas as decisões tomadas na migração para React, etapa por etapa, estão em [PLANO_SITE.md](PLANO_SITE.md).

---

## 📂 Estrutura do projeto

```
📦 medicamentos
├── backend/                # Flask — API JSON (/api/...) na porta 5000
│   ├── app.py              # arquivo principal
│   ├── users.py            # @login_required e @admin_required (conferem o token)
│   ├── blueprints/         # remedies, categorias, comentarios, usuarios
│   │                       #   (controllers, dao, models, routes)
│   ├── templates/          # páginas antigas em Jinja (o React não usa)
│   ├── static/             # CSS, JS e imagens das páginas antigas
│   ├── script.sql          # criação do banco
│   └── requirements.txt
└── frontend/               # React + Vite na porta 5173
    ├── index.html          # Bootstrap, Bootstrap Icons, fonte Inter e base.css
    ├── public/style/       # CSS das páginas antigas, copiados sem alteração
    ├── public/image/       # logo, imagem do topo e ícone padrão
    └── src/
        ├── App.jsx         # rotas, login (token), toasts e favoritos
        ├── components/     # Navbar, Tabela, Formulário, Cards, RotaProtegida...
        ├── pages/          # Home, Detalhe, Login, Categorias, Minha conta...
        └── services/       # api.js (axios + token)
```

---

## ⚙️ Como executar

### Pré-requisitos

* Python 3 e pip
* MySQL
* Node.js (recomendado instalar pelo **nvm**)

### 1) Banco de dados

Rode o `backend/script.sql` no MySQL.

> ⚠️ O script **apaga** o banco `medicamentos_db` se ele já existir e cria tudo do zero.

Se você já tem um banco de uma versão anterior e não quer perder os dados, adicione só as colunas novas:

```sql
ALTER TABLE MEDICAMENTOS ADD COLUMN criado_por VARCHAR(255) NULL;
ALTER TABLE CATEGORIAS ADD COLUMN criado_por VARCHAR(255) NULL;
```

E, se no seu banco o `status` de MEDICAMENTOS for texto (`'pendente'`/`'aprovado'`), converta para verdadeiro/falso:

```sql
UPDATE MEDICAMENTOS SET status = CASE WHEN status IN ('aprovado', '1') THEN '1' ELSE '0' END;
ALTER TABLE MEDICAMENTOS MODIFY status BOOLEAN DEFAULT FALSE;
```

### 2) Backend (Flask)

```bash
cd backend
python3 -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Crie o arquivo `backend/.env` (ele **nunca** vai para o GitHub):

```
SECRET_KEY=uma-chave-longa-e-secreta
MYSQL_HOST=localhost
MYSQL_USER=seu_usuario
MYSQL_PASSWORD=sua_senha
MYSQL_DATABASE=medicamentos_db
MYSQL_PORT=3306

# administrador criado automaticamente na primeira execução
ADMIN_EMAIL=admin@exemplo.com
ADMIN_PASSWORD=senha-do-admin
ADMIN_NAME=Administrador

# opcional — envio do e-mail de "Esqueci minha senha"
EMAIL_USER=seu-email@gmail.com
EMAIL_PASSWORD=senha-de-app-do-email
EMAIL_SMTP_HOST=smtp.gmail.com
EMAIL_SMTP_PORT=587

# opcional — endereço do React usado no link do e-mail (padrão: http://localhost:5173)
FRONTEND_URL=http://localhost:5173
```

```bash
python app.py                     # API em http://localhost:5000 (abrir uma página aqui leva para o site, na 5173)
```

### 3) Frontend (React)

```bash
cd frontend
npm install
npm run dev                       # http://localhost:5173
```

Acesse **http://localhost:5173** ou **http://127.0.0.1:5173** (o backend precisa estar rodando ao mesmo tempo).

---

## 🔐 Login com token JWT

1. `POST /api/v1/auth/login` confere e-mail e senha e devolve um **token JWT**, que vale **30 minutos**, junto com `expira_em` e `segundos_para_expirar`.
2. O React guarda o token no `localStorage`. O axios (`frontend/src/services/api.js`) manda `Authorization: Bearer <token>` em todo pedido.
3. No Flask, `@login_required` / `@admin_required` (`backend/users.py`) conferem o token: **401** = sem token ou token vencido, **403** = sem permissão.
4. Quem está logado e se é administrador vem sempre de `GET /api/v1/auth/me` — o navegador nunca lê o token.
5. Faltando 5 minutos aparece um aviso. Quando o token vence, o site desloga e abre a página **Sessão expirada**. A contagem usa os segundos que o servidor informa, então não depende do relógio do computador.
6. Sair = apagar o token do navegador (o servidor não guarda token nenhum).
7. Depois de se cadastrar, a pessoa já entra logada.

---

## 👥 Quem pode fazer o quê

| Quem | Pode |
|---|---|
| Visitante | Ver o catálogo, os detalhes, as categorias, os comentários e a página Sobre |
| Usuário logado | Comentar, favoritar, cadastrar remédios e categorias (ficam **pendentes** até um admin aprovar) |
| Dono (quem cadastrou) | Ver o próprio pendente, editar e excluir o que cadastrou |
| Administrador | Tudo acima em qualquer item; o que ele cadastra já entra aprovado; aprova/rejeita na **Moderação** (botão "Gerenciar Admin") |

* Tentar abrir uma página sem permissão (ex.: editar pela URL algo de outra pessoa) abre a **página 403**.
* Excluir uma categoria apaga junto os remédios dela (o site avisa antes).

---

## 🧭 Páginas (React)

| Rota | Página | Acesso |
|---|---|---|
| `/` | Início: catálogo, carrosséis, busca e filtro por categoria | público |
| `/remedios/:id` | Detalhe do remédio, favoritos e comentários | público |
| `/remedios` | Gerenciar remédios (tabela) | logado |
| `/remedio_novo`, `/remedios/:id/editar` | Cadastrar / editar remédio | logado (editar: dono ou admin) |
| `/comentarios/:id/editar` | Editar comentário | autor ou admin |
| `/categorias`, `/categoria_nova`, `/categorias/:id/editar` | Categorias | listar: público; resto: logado |
| `/moderacao` | Pendentes para aprovar/rejeitar | admin |
| `/conta`, `/conta/editar` | Minha conta e editar perfil | logado |
| `/login`, `/cadastro` | Entrar e criar conta | público |
| `/esqueci-senha`, `/redefinir-senha/:token` | Recuperar a senha por e-mail | público |
| `/sessao-expirada`, `/sobre` | Sessão expirada e Sobre nós | público |

---

## 🔌 API (JSON)

| Grupo | Rotas |
|---|---|
| Login | `POST /api/v1/auth/registro`, `POST /api/v1/auth/login`, `POST /api/v1/auth/logout`, `GET /api/v1/auth/me`, `PUT /api/v1/auth/perfil` |
| Senha | `POST /api/v1/auth/esqueci-senha`, `GET` e `POST /api/v1/auth/redefinir-senha/<token>` |
| Remédios | `GET` e `POST /api/medicamentos`, `GET /api/medicamentos/pendentes`, `GET`, `PUT` e `DELETE /api/medicamentos/<id>` |
| Categorias | `GET` e `POST /api/categorias`, `GET /api/categorias/pendentes`, `GET`, `PUT` e `DELETE /api/categorias/<id>` |
| Comentários | `GET` e `POST /api/medicamentos/<id>/comentarios`, `GET`, `PUT` e `DELETE /api/comentarios/<id>` |
| Favoritos | `GET /api/favoritos`, `POST /api/favoritos/<id>` (coloca/tira) |
| Moderação (admin) | `GET /api/v1/moderacao`, `POST /api/v1/moderacao/medicamentos/aprovar` e `/rejeitar`, `POST /api/v1/moderacao/categorias/aprovar` e `/rejeitar` |
| Usuários (admin) | `GET /api/v1/usuarios`, `PUT /api/v1/usuarios/<id>` |

---

## 🛠️ Tecnologias

* **Backend:** Python, Flask, flask-cors, PyJWT, python-dotenv, MySQL (mysql-connector-python)
* **Frontend:** React, Vite, react-router-dom, axios, Swiper, Bootstrap 5 e Bootstrap Icons

---

## 👨‍💻 Autores

Desenvolvido por Rafael Gomes da Silva, Otávio André Scalli Carboni e Samuel de Sousa Nunes
