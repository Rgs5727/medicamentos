# 💊 Sistema de Gerenciamento de Medicamentos

## 📌 Sobre o Projeto

Este projeto é uma aplicação web desenvolvida com **Python e Flask**, com o objetivo de gerenciar medicamentos de forma prática e organizada.

A aplicação permite cadastrar, visualizar, editar e organizar remédios, além de contar com um sistema de usuários. O sistema foi estruturado utilizando boas práticas de desenvolvimento, como separação em camadas (controllers, models e DAO) e uso de **Blueprints**, facilitando a manutenção e escalabilidade.

---

## 🚀 Funcionalidades

* ✅ Cadastro de medicamentos
* ✅ Edição e exclusão de medicamentos
* ✅ Organização por categorias
* ✅ Upload de imagens dos produtos
* ✅ Sistema de usuários (login e registro)
* ✅ Comentários e descrições
* ✅ Interface web simples e intuitiva

---

## 🛠️ Tecnologias Utilizadas

* **Python**
* **Flask**
* **SQLite / SQL**
* **HTML5**
* **CSS3**
* **Jinja2**

---

## 📂 Estrutura do Projeto

```
📦 projeto
├── blueprints/        # Rotas organizadas por módulos
├── models/            # Estruturas de dados
├── dao/               # Acesso ao banco de dados
├── templates/         # Arquivos HTML
├── static/            # CSS, imagens e uploads
├── script.sql         # Script de criação do banco
├── app.py             # Arquivo principal
```

---

## ⚙️ Como Executar o Projeto

### 🔧 Pré-requisitos

Antes de começar, você vai precisar ter instalado:

* Python 3.x
* pip (gerenciador de pacotes)

---

### 📥 Clonando o repositório

```bash
git clone https://github.com/seu-usuario/seu-repositorio.git
cd seu-repositorio
```

---

### 📦 Criando ambiente virtual (recomendado)

```bash
python -m venv venv
```

Ativando o ambiente:

* **Linux/Mac:**

```bash
source venv/bin/activate
```

* **Windows:**

```bash
venv\Scripts\activate
```

---

### 📚 Instalando dependências

```bash
pip install -r requirements.txt
```

> Caso não tenha o arquivo `requirements.txt`, instale manualmente:

```bash
pip install flask
```

---

### 🗄️ Configurando o banco de dados

Execute o script SQL:

```bash
sqlite3 banco.db < script.sql
```

Ou utilize seu gerenciador de banco preferido para rodar o arquivo `script.sql`.

---

### ▶️ Executando a aplicação

```bash
python app.py
```

Acesse no navegador:

```
http://localhost:5000
```

---

## 📸 Demonstração

*(Adicione aqui prints do sistema futuramente para deixar o projeto mais atrativo)*

---

## 📌 Melhorias Futuras

* 🔒 Sistema de autenticação mais robusto
* 📊 Dashboard com estatísticas
* 📱 Melhor responsividade (mobile)
* ☁️ Deploy em nuvem

---

## 👨‍💻 Autor

Desenvolvido por Rafael Gomes da Silva, Otávio André Scalli Carboni e Samuel de Sousa Nunes
