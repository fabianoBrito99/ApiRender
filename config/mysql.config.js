require('dotenv').config();
const mysql = require('mysql2');

const pool = mysql.createPool({
  host: process.env.MYSQLHOST,
  port: process.env.MYSQLPORT,
  user: process.env.MYSQLUSER,
  password: process.env.MYSQLPASSWORD,
  database: process.env.MYSQLDATABASE,
  waitForConnections: true,
  connectionLimit: 10, // Número de conexões simultâneas
  queueLimit: 0,
  ssl: { rejectUnauthorized: false } // Necessário para conexões seguras
});

pool.getConnection((err, connection) => {
  if (err) {
    console.error("❌ Erro ao conectar ao banco:", err);
    return;
  }
  console.log("✅ Conectado ao banco de dados Railway!");
  connection.release();
});

module.exports = pool.promise(); // Usa `promise()` para trabalhar com async/await
