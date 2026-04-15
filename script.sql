CREATE DATABASE IF NOT EXISTS medicamentos_db;

USE medicamentos_db;


CREATE TABLE IF NOT EXISTS CATEGORIAS(
    id_categoria INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS MEDICAMENTOS(
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    principio_ativo VARCHAR(255) NOT NULL,
    lab_fabricacao VARCHAR(255) NOT NULL,
    categoria INT NOT NULL,
    data_fabricacao VARCHAR(255) NOT NULL,
    data_validade VARCHAR(255) NOT NULL,
    descricao VARCHAR(255) NOT NULL,
    valor DECIMAL(10, 2) NOT NULL,
    destaque bool NOT NULL, 
    lancamento bool NOT NULL,
    promocao bool NOT NULL,
    imagem_url VARCHAR(255) NOT NULL,


    FOREIGN KEY (categoria)
        REFERENCES CATEGORIAS(id_categoria)
        ON DELETE CASCADE
);


CREATE TABLE IF NOT EXISTS USUARIOS(
    email VARCHAR(255) PRIMARY KEY,
    senha VARCHAR(255) NOT NULL,
    nome_user VARCHAR(255) NOT NULL,
    adm bool DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS FAVORITOS (
    usuario VARCHAR(255),
    id_medicamento INT,

    PRIMARY KEY (usuario, id_medicamento),

    FOREIGN KEY (usuario)
        REFERENCES USUARIOS(email)
        ON DELETE CASCADE,

    FOREIGN KEY (id_medicamento)
        REFERENCES MEDICAMENTOS(id)
        ON DELETE CASCADE
);


CREATE TABLE IF NOT EXISTS COMENTARIOS(
    id_comentario INT AUTO_INCREMENT PRIMARY KEY,
    usuario VARCHAR(255) NOT NULL,
    id_medicamento INT NOT NULL,
    texto VARCHAR(255) NOT NULL,

    FOREIGN KEY (usuario)
        REFERENCES USUARIOS(email)
        ON DELETE CASCADE,

    FOREIGN KEY (id_medicamento)
        REFERENCES MEDICAMENTOS(id)
        ON DELETE CASCADE
);