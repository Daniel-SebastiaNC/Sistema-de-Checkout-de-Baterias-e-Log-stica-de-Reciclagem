const express = require('express');
const router = express.Router();
const { getCatalogo, registrarVenda } = require('../controllers/vendasController');
const { validarVenda } = require('../middleware/validacao');

router.get('/catalogo', getCatalogo);
router.post('/', validarVenda, registrarVenda);

module.exports = router;
