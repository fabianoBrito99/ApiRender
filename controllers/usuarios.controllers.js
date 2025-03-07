const pool = require("../config/mysql.config");

// 🔹 Listar usuários
async function list(request, response) {
  try {
    const [resultado] = await pool.query(
      `SELECT id_usuario, nome_usuario, email, telefone, cep, rua, bairro, numero FROM usuario`
    );
    return response.json({ dados: resultado });
  } catch (err) {
    console.error("Erro no banco de dados:", err);
    return response.status(500).json({ erro: "Erro ao buscar os usuários" });
  }
}

// 🔹 Mostrar usuário por ID
async function show(request, response) {
  const userId = request.params.id;
  try {
    const [usuario] = await pool.query(`SELECT * FROM usuario WHERE id_usuario = ?`, [userId]);

    if (usuario.length === 0) {
      return response.status(404).json({ erro: "Usuário não encontrado" });
    }
    return response.json({ usuario: usuario[0] });
  } catch (err) {
    console.error("Erro ao buscar o usuário:", err);
    return response.status(500).json({ erro: "Erro ao buscar o usuário" });
  }
}

// 🔹 Criar usuário
async function create(request, response) {
  const { nome_usuario, email, senha, telefone, cep, rua, cidade, estado, bairro, numero } = request.body;
  
  try {
    const [resultado] = await pool.query(
      `INSERT INTO usuario (nome_usuario, email, senha, telefone, cep, rua, cidade, estado, bairro, numero) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [nome_usuario, email, senha, telefone, cep, rua, cidade, estado, bairro, numero]
    );

    return response.status(201).json({ message: "Usuário criado com sucesso", id_usuario: resultado.insertId });
  } catch (err) {
    console.error("Erro no banco de dados:", err);
    return response.status(500).json({ erro: "Erro ao criar usuário" });
  }
}

// 🔹 Atualizar usuário
async function update(request, response) {
  const userId = request.params.id;
  const { nome_usuario, email, telefone, cep, rua, bairro, numero } = request.body;

  try {
    const [resultado] = await pool.query(
      `UPDATE usuario SET nome_usuario = ?, email = ?, telefone = ?, cep = ?, rua = ?, bairro = ?, numero = ? WHERE id_usuario = ?`,
      [nome_usuario, email, telefone, cep, rua, bairro, numero, userId]
    );

    if (resultado.affectedRows === 0) {
      return response.status(404).json({ erro: "Usuário não encontrado" });
    }
    return response.status(200).json({ message: "Usuário atualizado com sucesso" });
  } catch (err) {
    console.error("Erro ao atualizar usuário:", err);
    return response.status(500).json({ erro: "Erro ao atualizar usuário" });
  }
}

// 🔹 Deletar usuário
async function remove(request, response) {
  const userId = request.params.id;

  try {
    const [resultado] = await pool.query(`DELETE FROM usuario WHERE id_usuario = ?`, [userId]);

    if (resultado.affectedRows === 0) {
      return response.status(404).json({ erro: "Usuário não encontrado" });
    }
    return response.status(200).json({ message: "Usuário deletado com sucesso" });
  } catch (err) {
    console.error("Erro ao deletar usuário:", err);
    return response.status(500).json({ erro: "Erro ao deletar usuário" });
  }
}

// 🔹 API de Login
async function login(request, response) {
  const { nome_usuario, senha } = request.body;

  // Validação de entrada
  if (!nome_usuario || !senha) {
    return response.status(400).json({ erro: "Todos os campos são obrigatórios" });
  }

  try {
    const [resultado] = await pool.query(
      `SELECT id_usuario, nome_usuario FROM usuario WHERE nome_usuario = ? AND senha = ?`,
      [nome_usuario, senha]
    );

    if (resultado.length === 0) {
      return response.status(401).json({ erro: "Nome de usuário ou senha incorretos" });
    }

    return response.status(200).json({
      message: "Login bem-sucedido",
      usuario: {
        id_usuario: resultado[0].id_usuario,
        nome_usuario: resultado[0].nome_usuario, 
      },
    });
  } catch (err) {
    console.error("Erro ao buscar o usuário:", err);
    return response.status(500).json({ erro: "Erro ao buscar o usuário" });
  }
}

module.exports = { list, show, login, create };
