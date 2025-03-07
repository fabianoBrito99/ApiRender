const pool = require("../config/mysql.config");

// 🔹 Listar empréstimos de um usuário
async function list(request, response) {
  const usuarioId = request.params.id;

  if (!usuarioId) {
    return response.status(400).json({ erro: "ID do usuário não fornecido" });
  }

  try {
    const [resultado] = await pool.query(
      `SELECT e.id_emprestimo, l.id_livro, l.nome_livro, l.foto_capa, e.data_prevista_devolucao, e.data_devolucao
       FROM emprestimos e
       JOIN usuario_emprestimos ue ON e.id_emprestimo = ue.fk_id_emprestimo
       JOIN livro l ON e.fk_id_livro = l.id_livro
       WHERE ue.fk_id_usuario = ? AND e.data_devolucao IS NULL`,
      [usuarioId]
    );

    resultado.forEach(emprestimo => {
      if (emprestimo.foto_capa) {
        emprestimo.foto_capa = `data:image/jpeg;base64,${Buffer.from(emprestimo.foto_capa).toString('base64')}`;
      }
    });

    return response.json({ dados: resultado });
  } catch (err) {
    console.error("Erro ao buscar os dados do empréstimo:", err);
    return response.status(500).json({ erro: "Erro ao buscar os dados do empréstimo" });
  }
}

// 🔹 Reservar um livro
async function reservar(request, response) {
  const livroId = request.params.id;
  const usuarioId = request.body.usuarioId;

  try {
    const conn = await pool.getConnection();
    await conn.beginTransaction();

    const [resultado] = await conn.query(
      "SELECT quantidade_estoque FROM estoque WHERE fk_id_livro = ?",
      [livroId]
    );

    if (resultado.length === 0 || resultado[0].quantidade_estoque <= 0) {
      conn.release();
      return response.status(400).json({ erro: "Livro indisponível no estoque." });
    }

    await conn.query(
      "UPDATE estoque SET quantidade_estoque = quantidade_estoque - 1 WHERE fk_id_livro = ?",
      [livroId]
    );

    const dataEmprestimo = new Date().toISOString().split('T')[0];
    const dataPrevistaDevolucao = new Date();
    dataPrevistaDevolucao.setDate(dataPrevistaDevolucao.getDate() + 7);

    const [emprestimoResult] = await conn.query(
      "INSERT INTO emprestimos (fk_id_livro, data_emprestimo, data_prevista_devolucao) VALUES (?, ?, ?)",
      [livroId, dataEmprestimo, dataPrevistaDevolucao.toISOString().split('T')[0]]
    );

    await conn.query(
      "INSERT INTO usuario_emprestimos (fk_id_usuario, fk_id_emprestimo) VALUES (?, ?)",
      [usuarioId, emprestimoResult.insertId]
    );

    await conn.commit();
    conn.release();
    
    return response.status(201).json({ mensagem: "Livro reservado com sucesso." });
  } catch (err) {
    console.error("Erro ao reservar livro:", err);
    return response.status(500).json({ erro: "Erro ao reservar livro" });
  }
}

// 🔹 Devolver um livro
async function devolver(request, response) {
  const idEmprestimo = request.params.id;
  const dataAtual = new Date().toISOString().split('T')[0];

  try {
    const conn = await pool.getConnection();
    await conn.beginTransaction();

    const [resultado] = await conn.query(
      "SELECT fk_id_livro FROM emprestimos WHERE id_emprestimo = ?",
      [idEmprestimo]
    );

    if (resultado.length === 0) {
      conn.release();
      return response.status(404).json({ erro: "Empréstimo não encontrado." });
    }

    const idLivro = resultado[0].fk_id_livro;

    await conn.query(
      "UPDATE estoque SET quantidade_estoque = quantidade_estoque + 1 WHERE fk_id_livro = ?",
      [idLivro]
    );

    await conn.query(
      "UPDATE emprestimos SET data_devolucao = ? WHERE id_emprestimo = ?",
      [dataAtual, idEmprestimo]
    );

    await conn.commit();
    conn.release();

    return response.status(200).json({ mensagem: "Livro devolvido com sucesso." });
  } catch (err) {
    console.error("Erro ao devolver livro:", err);
    return response.status(500).json({ erro: "Erro ao devolver livro" });
  }
}

module.exports = { list, reservar, devolver };
