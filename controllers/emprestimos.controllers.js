const connection = require("../config/mysql.config");

function list(request, response) {
  const usuarioId = request.params.id; // Obtém o ID do usuário da URL

  if (!usuarioId) {
    return response.status(400).json({ erro: "ID do usuário não fornecido" });
  }

  connection.query(
    `SELECT e.id_emprestimo, l.id_livro, l.nome_livro, l.foto_capa, e.data_prevista_devolucao, e.data_devolucao
     FROM emprestimos e
     JOIN usuario_emprestimos ue ON e.id_emprestimo = ue.fk_id_emprestimo
     JOIN livro l ON e.fk_id_livro = l.id_livro
     WHERE ue.fk_id_usuario = ? AND e.data_devolucao IS NULL`,
    [usuarioId],
    function (err, resultado) {
      if (err) {
        return response.status(500).json({ erro: "Erro ao buscar os dados do empréstimo" });
      }

      resultado.forEach(emprestimo => {
        if (emprestimo.foto_capa) {
          emprestimo.foto_capa = `data:image/jpeg;base64,${Buffer.from(emprestimo.foto_capa).toString('base64')}`;
        }
      });

      return response.json({ dados: resultado });
    }
  );
}


function reservar(request, response) {
  const livroId = request.params.id;
  const usuarioId = request.body.usuarioId;

  connection.query(
    "SELECT quantidade_estoque FROM estoque WHERE fk_id_livro = ?",
    [livroId],
    function (err, resultado) {
      if (err || resultado.length === 0) {
        return response.json({ erro: "Erro ao buscar estoque do livro." });
      }

      const quantidadeEstoque = resultado[0].quantidade_estoque;

      if (quantidadeEstoque <= 0) {
        return response.json({ erro: "Livro indisponível no estoque." });
      }

      connection.query(
        "UPDATE estoque SET quantidade_estoque = quantidade_estoque - 1 WHERE fk_id_livro = ?",
        [livroId],
        function (err) {
          if (err) {
            return response.json({ erro: "Erro ao atualizar o estoque." });
          }

          const dataEmprestimo = new Date().toISOString().split('T')[0];
          const dataPrevistaDevolucao = new Date();
          dataPrevistaDevolucao.setDate(dataPrevistaDevolucao.getDate() + 7);

          connection.query(
            "INSERT INTO emprestimos (fk_id_livro, data_emprestimo, data_prevista_devolucao) VALUES (?, ?, ?)",
            [livroId, dataEmprestimo, dataPrevistaDevolucao.toISOString().split('T')[0]],
            function (err, emprestimoResult) {
              if (err) {
                return response.json({ erro: "Erro ao registrar a reserva." });
              }

              const emprestimoId = emprestimoResult.insertId;

              connection.query(
                "INSERT INTO usuario_emprestimos (fk_id_usuario, fk_id_emprestimo) VALUES (?, ?)",
                [usuarioId, emprestimoId],
                function (err) {
                  if (err) {
                    return response.json({ erro: "Erro ao associar usuário ao empréstimo." });
                  }
                  return response.json({ mensagem: "Livro reservado com sucesso." });
                }
              );
            }
          );
        }
      );
    }
  );
}

function devolver(request, response) {
  const idEmprestimo = request.params.id;
  const dataAtual = new Date().toISOString().split('T')[0];

  connection.query(
    "SELECT fk_id_livro FROM emprestimos WHERE id_emprestimo = ?",
    [idEmprestimo],
    function (err, resultado) {
      if (err || resultado.length === 0) {
        return response.json({ erro: "Erro ao obter o livro do empréstimo ou empréstimo não encontrado." });
      }

      const idLivro = resultado[0].fk_id_livro;

      connection.query(
        "UPDATE estoque SET quantidade_estoque = quantidade_estoque + 1 WHERE fk_id_livro = ?",
        [idLivro],
        function (err) {
          if (err) {
            return response.json({ erro: "Erro ao atualizar a quantidade do livro." });
          }

          connection.query(
            "UPDATE emprestimos SET data_devolucao = ? WHERE id_emprestimo = ?",
            [dataAtual, idEmprestimo],
            function (err) {
              if (err) {
                return response.json({ erro: "Erro ao atualizar a data de devolução." });
              }

              return response.json({ mensagem: "Livro devolvido com sucesso." });
            }
          );
        }
      );
    }
  );
}

module.exports = { list, reservar, devolver };
