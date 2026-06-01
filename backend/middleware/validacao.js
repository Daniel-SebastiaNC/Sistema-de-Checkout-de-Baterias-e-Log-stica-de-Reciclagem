const db = require('../database/db');

function validarVenda(req, res, next) {
  const { bateria_id, logistica_reversa, peso_bateria_velha } = req.body;

  if (bateria_id === undefined || bateria_id === null || bateria_id === '') {
    return res.status(400).json({ erro: 'O campo bateria_id é obrigatório.' });
  }

  if (typeof bateria_id !== 'number' || !Number.isInteger(bateria_id)) {
    return res.status(400).json({ erro: 'bateria_id deve ser um número inteiro.' });
  }

  const bateria = db.prepare('SELECT id FROM catalogo_baterias WHERE id = ?').get(bateria_id);
  if (!bateria) {
    return res.status(400).json({ erro: 'Código de produto não encontrado no catálogo.' });
  }

  if (logistica_reversa === true) {
    if (peso_bateria_velha === undefined || peso_bateria_velha === null || peso_bateria_velha === '') {
      return res.status(400).json({ erro: 'Logística reversa ativa: informe o peso da bateria entregue.' });
    }

    if (typeof peso_bateria_velha !== 'number') {
      return res.status(400).json({ erro: 'O peso da bateria deve ser um número.' });
    }

    if (peso_bateria_velha < 10 || peso_bateria_velha > 50) {
      return res.status(400).json({
        erro: `Peso inválido (${peso_bateria_velha}kg). Baterias automotivas pesam entre 10kg e 50kg.`
      });
    }
  }

  next();
}

module.exports = { validarVenda };
