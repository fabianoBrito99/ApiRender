const pool = require("../config/mysql.config");
const fs = require("fs");

// 🔹 Exibe detalhes de um livro específico
async function show(request, response) {
  const codigo = request.params.codigo;
  
  if (!codigo) {
    return response.status(400).json({ erro: "Código do livro não fornecido" });
  }

  try {
    const [resultado] = await pool.query(
      `SELECT Livro.*, Estoque.quantidade_estoque, Categoria.nome_categoria AS categoria, Autor.nome AS nome_autor
       FROM Livro
       LEFT JOIN Estoque ON Livro.id_livro = Estoque.fk_id_livro
       LEFT JOIN Livro_Categoria ON Livro.id_livro = Livro_Categoria.fk_id_livros
       LEFT JOIN Categoria ON Livro_Categoria.fk_id_categoria = Categoria.id_categoria
       LEFT JOIN Autor_Livro ON Livro.id_livro = Autor_Livro.fk_id_livro
       LEFT JOIN Autor ON Autor_Livro.fk_id_autor = Autor.id_autor
       WHERE Livro.id_livro = ?;`,
      [codigo]
    );

    if (resultado.length === 0) {
      return response.status(404).json({ erro: `Livro com código #${codigo} não encontrado` });
    }

    const livro = resultado[0];

    // Convertendo BLOB para Base64 se a foto_capa existir
    if (livro.foto_capa) {
      livro.foto_capa = `data:image/jpeg;base64,${Buffer.from(livro.foto_capa).toString("base64")}`;
    }

    return response.json(livro);
  } catch (err) {
    console.error("Erro ao buscar o livro:", err);
    return response.status(500).json({ erro: "Erro ao buscar o livro" });
  }
}

// 🔹 Lista todos os livros
async function list(request, response) {
  try {
    const [resultado] = await pool.query(
      `SELECT
        Livro.*, 
        Categoria.nome_categoria AS categoria,
        Autor.nome AS autor
      FROM Livro
      LEFT JOIN Livro_Categoria ON Livro.id_livro = Livro_Categoria.fk_id_livros
      LEFT JOIN Categoria ON Livro_Categoria.fk_id_categoria = Categoria.id_categoria
      LEFT JOIN Autor_Livro ON Livro.id_livro = Autor_Livro.fk_id_livro
      LEFT JOIN Autor ON Autor_Livro.fk_id_autor = Autor.id_autor;`
    );

    resultado.forEach((livro) => {
      if (livro.foto_capa) {
        livro.foto_capa = `data:image/jpeg;base64,${Buffer.from(livro.foto_capa).toString("base64")}`;
      }
    });

    return response.json({ livros: resultado });
  } catch (err) {
    console.error("Erro ao buscar livros:", err);
    return response.status(500).json({ erro: "Erro ao buscar livros" });
  }
}

// 🔹 Criar livro
async function create(request, response) {
  const { nomeLivro, descricao, anoPublicacao, quantidade_paginas, categoria_principal, autores, quantidade_estoque, foto_capa } = request.body;

  try {
    const conn = await pool.getConnection();
    await conn.beginTransaction(); // Inicia transação

    const foto_capa_buffer = foto_capa ? Buffer.from(foto_capa.split(",")[1], "base64") : null;

    // 🔹 Inserir o livro primeiro
    const [livroResult] = await conn.query(
      `INSERT INTO Livro (nome_livro, descricao, ano_publicacao, quantidade_paginas, foto_capa) 
       VALUES (?, ?, ?, ?, ?)`,
      [nomeLivro, descricao, anoPublicacao, quantidade_paginas, foto_capa_buffer]
    );
    const livroId = livroResult.insertId;

    // 🔹 Inserir o estoque
    await conn.query(
      `INSERT INTO Estoque (quantidade_estoque, fk_id_livro) VALUES (?, ?)`,
      [quantidade_estoque, livroId]
    );

    // 🔹 Processar autores
    let autorId;
    const [autorResult] = await conn.query(`SELECT id_autor FROM Autor WHERE nome = ?`, [autores]);

    if (autorResult.length === 0) {
      const [novoAutorResult] = await conn.query(`INSERT INTO Autor (nome) VALUES (?)`, [autores]);
      autorId = novoAutorResult.insertId;
    } else {
      autorId = autorResult[0].id_autor;
    }

    await conn.query(`INSERT INTO Autor_Livro (fk_id_livro, fk_id_autor) VALUES (?, ?)`, [livroId, autorId]);

    // 🔹 Processar categoria
    let fk_id_categoria;
    const [categoriaResult] = await conn.query(`SELECT id_categoria FROM Categoria WHERE nome_categoria = ?`, [categoria_principal]);

    if (categoriaResult.length === 0) {
      const [categoriaCriadaResult] = await conn.query(`INSERT INTO Categoria (nome_categoria) VALUES (?)`, [categoria_principal]);
      fk_id_categoria = categoriaCriadaResult.insertId;
    } else {
      fk_id_categoria = categoriaResult[0].id_categoria;
    }

    await conn.query(`INSERT INTO Livro_Categoria (fk_id_livros, fk_id_categoria) VALUES (?, ?)`, [livroId, fk_id_categoria]);

    await conn.commit(); // Confirma a transação
    conn.release();

    return response.status(201).json({ mensagem: "Livro criado com sucesso" });
  } catch (err) {
    console.error("Erro ao criar livro:", err);
    return response.status(500).json({ erro: "Erro ao criar livro", detalhes: err.message });
  }
}

module.exports = {
  show,
  list,
  create,
};
