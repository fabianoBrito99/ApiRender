require('dotenv').config();
const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: process.env.MYSQLHOST,
  port: process.env.MYSQLPORT,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE,
  ssl: { rejectUnauthorized: true } // Necessário para conexões seguras
});

connection.connect((err) => {
  if (err) {
    console.error("❌ Erro ao conectar ao banco:", err);
    return;
  }
  console.log("✅ Conectado ao banco de dados Railway!");
});

module.exports = connection;
