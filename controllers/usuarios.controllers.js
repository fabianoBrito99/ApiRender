const connection = require("../config/mysql.config");

// Listar usuários
async function list(request, response) {
  connection.query(
    `SELECT id_usuario, nome_usuario, email, telefone, cep, rua, bairro, numero FROM usuario`,
    function (err, resultado) {
      if (err) {
        return response.status(500).json({ erro: "Erro ao buscar os usuários" });
      }
      return response.json({ dados: resultado });
    }
  );
}

// Mostrar usuário por ID
async function show(request, response) {
  const userId = request.params.id;
  connection.query(
    `SELECT * FROM usuario WHERE id_usuario = ?`,
    [userId],
    function (err, usuario) {
      if (err) {
        return response.status(500).json({ erro: "Erro ao buscar o usuário" });
      }
      if (usuario.length === 0) {
        return response.status(404).json({ erro: "Usuário não encontrado" });
      }
      response.json({ usuario: usuario[0] });
    }
  );
}

// Criar usuário
async function create(request, response) {
  const { nome_usuario, email, senha, telefone, cep, rua, cidade, estado, bairro, numero } = request.body;
  
  connection.query(
    `INSERT INTO usuario (nome_usuario, email, senha, telefone, cep, rua, cidade, estado, bairro, numero) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,

    [nome_usuario, email, senha, telefone, cep, rua, cidade, estado, bairro, numero],

    function (err, resultado) {
      if (err) {
        console.error("Erro no banco de dados:", err); 
        return response.status(500).json({ erro: "Erro ao criar usuário" });
      }
      return response.status(201).json({ message: "Usuário criado com sucesso", id_usuario: resultado.insertId });
    }
  );
}

// Atualizar usuário
async function update(request, response) {
  const userId = request.params.id;
  const { nome_usuario, email, telefone, cep, rua, bairro, numero } = request.body;
  connection.query(
    `UPDATE usuario SET nome_usuario = ?, email = ?, telefone = ?, cep = ?, rua = ?, bairro = ?, numero = ? WHERE id_usuario = ?`,
    [nome_usuario, email, telefone, cep, rua, bairro, numero, userId],
    function (err) {
      if (err) {
        return response.status(500).json({ erro: "Erro ao atualizar usuário" });
      }
      return response.status(200).json({ message: "Usuário atualizado com sucesso" });
    }
  );
}

// Deletar usuário
async function remove(request, response) {
  const userId = request.params.id;
  connection.query(
    `DELETE FROM usuario WHERE id_usuario = ?`,
    [userId],
    function (err) {
      if (err) {
        return response.status(500).json({ erro: "Erro ao deletar usuário" });
      }
      return response.status(200).json({ message: "Usuário deletado com sucesso" });
    }
  );
}

// API de login
function login(request, response) {
  const { nome_usuario, senha } = request.body;

  // Validação de entrada
  if (!nome_usuario || !senha) {
    return response.status(400).json({ erro: "Todos os campos são obrigatórios" });
  }

  connection.query(
    `SELECT id_usuario, nome_usuario FROM usuario WHERE (nome_usuario = ?) AND senha = ?`,
    [nome_usuario, senha],
    function (err, resultado) {
      if (err) {
        return response.status(500).json({ erro: "Erro ao buscar o usuário" });
      }
      if (resultado.length === 0) {
        return response.status(401).json({ erro: "nome usuario ou senha incorretos" });
      }
  
      return response.status(200).json({
        message: "Login bem-sucedido",
        usuario: {
          id_usuario: resultado[0].id_usuario,
          nome_usuario: resultado[0].nome_usuario, 
        },
      });
    }  
  );
}



module.exports = { list, show, login, create};

