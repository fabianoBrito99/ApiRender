const express = require('express');
const emprestimosController = require('../controllers/emprestimos.controllers');

const router = express.Router();

router.get('/emprestimos/:id', emprestimosController.list);

router.put('/emprestimos/:id/reservar', emprestimosController.reservar);
router.put('/emprestimos/:id/devolver', emprestimosController.devolver);



module.exports = router;
