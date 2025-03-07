const express = require("express");
const cors = require("cors");
const path = require("path");
const livrosRouter = require("./routes/livros.routes");
const usuariosRouter = require("./routes/usuarios.routes");
const emprestimosRouter = require("./routes/emprestimos.router");



const app = express();

// Configuração CORS para permitir múltiplas origens
const allowedOrigins = [
  "http://127.0.0.1:5501",
  "http://localhost:3000",
  "http://10.0.2.2:3000",
  "http://10.0.2.2:3000", // Para emuladores Android
  "http://192.168.1.4:8081", // Endereço do Expo
  "http://localhost:8081",
  "http://192.168.1.101:4000"
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Permite requisições de origens que estão na lista
      if (!origin || allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error("Não permitido por CORS"));
        console.log("Origem da requisição:", origin);
      }
    },
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

app.use(express.static(path.join(__dirname, "public")));

app.use(livrosRouter);
app.use("/api", usuariosRouter);
app.use("/api", emprestimosRouter);


const PORT = 4000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`API rodando na rede em:${PORT}`);
});
