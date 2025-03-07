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
      `SELECT livro.*, estoque.quantidade_estoque, categoria.nome_categoria AS categoria, autor.nome AS nome_autor
       FROM livro
       LEFT JOIN estoque ON livro.id_livro = estoque.fk_id_livro
       LEFT JOIN livro_categoria ON livro.id_livro = livro_categoria.fk_id_livros
       LEFT JOIN categoria ON livro_categoria.fk_id_categoria = categoria.id_categoria
       LEFT JOIN autor_livro ON livro.id_livro = autor_livro.fk_id_livro
       LEFT JOIN autor ON autor_livro.fk_id_autor = autor.id_autor
       WHERE livro.id_livro = ?;`,
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
      `SELECT livro.*, categoria.nome_categoria AS categoria, autor.nome AS autor
       FROM livro
       LEFT JOIN livro_categoria ON livro.id_livro = livro_categoria.fk_id_livros
       LEFT JOIN categoria ON livro_categoria.fk_id_categoria = categoria.id_categoria
       LEFT JOIN autor_livro ON livro.id_livro = autor_livro.fk_id_livro
       LEFT JOIN autor ON autor_livro.fk_id_autor = autor.id_autor;`
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
      `INSERT INTO livro (nome_livro, descricao, ano_publicacao, quantidade_paginas, foto_capa) 
       VALUES (?, ?, ?, ?, ?)`,
      [nomeLivro, descricao, anoPublicacao, quantidade_paginas, foto_capa_buffer]
    );
    const livroId = livroResult.insertId;

    // 🔹 Inserir o estoque
    await conn.query(
      `INSERT INTO estoque (quantidade_estoque, fk_id_livro) VALUES (?, ?)`,
      [quantidade_estoque, livroId]
    );

    // 🔹 Processar autores
    let autorId;
    const [autorResult] = await conn.query(`SELECT id_autor FROM autor WHERE nome = ?`, [autores]);

    if (autorResult.length === 0) {
      const [novoAutorResult] = await conn.query(`INSERT INTO autor (nome) VALUES (?)`, [autores]);
      autorId = novoAutorResult.insertId;
    } else {
      autorId = autorResult[0].id_autor;
    }

    await conn.query(`INSERT INTO autor_livro (fk_id_livro, fk_id_autor) VALUES (?, ?)`, [livroId, autorId]);

    // 🔹 Processar categoria
    let fk_id_categoria;
    const [categoriaResult] = await conn.query(`SELECT id_categoria FROM categoria WHERE nome_categoria = ?`, [categoria_principal]);

    if (categoriaResult.length === 0) {
      const [categoriaCriadaResult] = await conn.query(`INSERT INTO categoria (nome_categoria) VALUES (?)`, [categoria_principal]);
      fk_id_categoria = categoriaCriadaResult.insertId;
    } else {
      fk_id_categoria = categoriaResult[0].id_categoria;
    }

    await conn.query(`INSERT INTO livro_categoria (fk_id_livros, fk_id_categoria) VALUES (?, ?)`, [livroId, fk_id_categoria]);

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
