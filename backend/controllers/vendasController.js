const db = require('../database/db');
const { adicionarPeso } = require('./lotesController');

function getCatalogo(req, res) {
  const baterias = db.prepare('SELECT * FROM catalogo_baterias ORDER BY peso_kg').all();
  const cotacao = parseFloat(
    db.prepare("SELECT valor FROM configuracoes WHERE chave = 'cotacao_chumbo_kg'").get().valor
  );
  res.json({ baterias, cotacao_chumbo_kg: cotacao });
}

function registrarVenda(req, res) {
  const { bateria_id, logistica_reversa, peso_bateria_velha } = req.body;

  const bateria = db.prepare('SELECT * FROM catalogo_baterias WHERE id = ?').get(bateria_id);
  const cotacao = parseFloat(
    db.prepare("SELECT valor FROM configuracoes WHERE chave = 'cotacao_chumbo_kg'").get().valor
  );

  let desconto = 0;
  if (logistica_reversa === true && peso_bateria_velha) {
    desconto = parseFloat((peso_bateria_velha * cotacao).toFixed(2));
  }

  const precoFinal = parseFloat((bateria.preco - desconto).toFixed(2));

  const resultado = db.prepare(`
    INSERT INTO vendas (bateria_id, logistica_reversa, peso_bateria_velha, desconto_ecologico, preco_final, criado_em)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    bateria_id,
    logistica_reversa ? 1 : 0,
    logistica_reversa ? peso_bateria_velha : null,
    desconto,
    precoFinal,
    new Date().toISOString()
  );

  let loteAtualizado = null;
  if (logistica_reversa === true && peso_bateria_velha) {
    loteAtualizado = adicionarPeso(peso_bateria_velha);
  }

  res.status(201).json({
    mensagem: 'Venda registrada com sucesso!',
    venda: {
      id:                  resultado.lastInsertRowid,
      modelo:              bateria.modelo,
      preco_original:      bateria.preco,
      desconto_ecologico:  desconto,
      preco_final:         precoFinal,
      logistica_reversa:   !!logistica_reversa,
      peso_bateria_velha:  logistica_reversa ? peso_bateria_velha : null,
    },
    lote: loteAtualizado
  });
}

module.exports = { getCatalogo, registrarVenda };
