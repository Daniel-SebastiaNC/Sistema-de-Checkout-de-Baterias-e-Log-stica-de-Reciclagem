const express = require('express');
const router = express.Router();
const { getLoteAtivoHandler, despacharLote, getHistoricoHandler } = require('../controllers/lotesController');

router.get('/', getHistoricoHandler);
router.get('/ativo', getLoteAtivoHandler);
router.post('/despachar', despacharLote);

module.exports = router;
