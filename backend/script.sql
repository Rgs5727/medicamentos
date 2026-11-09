drop database if EXISTS medicamentos_db;

CREATE DATABASE IF NOT EXISTS medicamentos_db;
USE medicamentos_db;


CREATE TABLE IF NOT EXISTS CATEGORIAS(
    id_categoria INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    status BOOLEAN NOT NULL DEFAULT TRUE,
    -- e-mail de quem cadastrou (o "dono"): só o dono ou um administrador
    -- pode ver a categoria pendente, editar ou excluir
    criado_por VARCHAR(255) NULL
);

CREATE TABLE IF NOT EXISTS MEDICAMENTOS(
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    principio_ativo VARCHAR(255) NOT NULL,
    lab_fabricacao VARCHAR(255) NOT NULL,
    categoria INT NOT NULL,
    data_fabricacao DATE NOT NULL,
    data_validade DATE NOT NULL,
    descricao TEXT NOT NULL,
    valor DECIMAL(10, 2) NOT NULL,
    destaque BOOLEAN NOT NULL, 
    lancamento BOOLEAN NOT NULL,
    promocao BOOLEAN NOT NULL,
    tipo VARCHAR(20) NOT NULL,
    imagem_url VARCHAR(255) NOT NULL,
    tarjado varchar(255) null,
    venda_livre varchar(255) null,
    status BOOLEAN DEFAULT FALSE,
    -- e-mail de quem cadastrou (o "dono"): só o dono ou um administrador
    -- pode ver o remédio pendente, editar ou excluir
    criado_por VARCHAR(255) NULL
);


CREATE TABLE IF NOT EXISTS USUARIOS(
    email VARCHAR(255) PRIMARY KEY,
    senha VARCHAR(255) NOT NULL,
    nome_user VARCHAR(255) NOT NULL,
    tipo varchar(20) NOT NULL
);


CREATE TABLE IF NOT EXISTS FAVORITOS (
    usuario VARCHAR(255),
    id_medicamento INT,
    PRIMARY KEY (usuario, id_medicamento)
);

CREATE TABLE IF NOT EXISTS COMENTARIOS(
    id_comentario INT AUTO_INCREMENT PRIMARY KEY,
    usuario VARCHAR(255) NOT NULL,
    id_medicamento INT NOT NULL,
    texto TEXT NOT NULL
);



CREATE TABLE IF NOT EXISTS RESET_SENHA_TOKENS (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    token VARCHAR(64) NOT NULL UNIQUE,
    expira_em DATETIME NOT NULL,
    usado BOOLEAN DEFAULT FALSE
);



ALTER TABLE MEDICAMENTOS
ADD CONSTRAINT fk_medicamento_categoria
FOREIGN KEY (categoria) 
REFERENCES CATEGORIAS(id_categoria)
ON DELETE CASCADE;

ALTER TABLE FAVORITOS
ADD CONSTRAINT fk_fav_usuario
FOREIGN KEY (usuario)
REFERENCES USUARIOS(email)
ON DELETE CASCADE;

ALTER TABLE FAVORITOS
ADD CONSTRAINT fk_fav_medicamento
FOREIGN KEY (id_medicamento)
REFERENCES MEDICAMENTOS(id)
ON DELETE CASCADE;

ALTER TABLE COMENTARIOS
ADD CONSTRAINT fk_coment_usuario
FOREIGN KEY (usuario)
REFERENCES USUARIOS(email)
ON DELETE CASCADE;

ALTER TABLE COMENTARIOS
ADD CONSTRAINT fk_coment_medicamento
FOREIGN KEY (id_medicamento)
REFERENCES MEDICAMENTOS(id)
ON DELETE CASCADE;

-- RESET SENHA -> USUARIOS
ALTER TABLE RESET_SENHA_TOKENS
ADD CONSTRAINT fk_reset_usuario
FOREIGN KEY (email)
REFERENCES USUARIOS(email)
ON DELETE CASCADE;