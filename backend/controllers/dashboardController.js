const db = require('../database/db');

function getDashboard(req, res) {
  const totalKg = db.prepare(`
    SELECT COALESCE(SUM(peso_bateria_velha), 0) as total
    FROM vendas
    WHERE logistica_reversa = 1 AND peso_bateria_velha IS NOT NULL
  `).get().total;

  // Composição técnica real de bateria chumbo-ácido: ~70% chumbo, ~20% plástico
  const totalKgChumboSalvo   = parseFloat((totalKg * 0.70).toFixed(2));
  const totalKgPlasticoSalvo = parseFloat((totalKg * 0.20).toFixed(2));

  const totalEconomizado = parseFloat(
    db.prepare("SELECT COALESCE(SUM(desconto_ecologico), 0) as total FROM vendas").get().total.toFixed(2)
  );

  const loteAtivo = db.prepare("SELECT * FROM lotes_sucata WHERE status = 'COLETANDO' LIMIT 1").get();
  const alertaFrete = loteAtivo ? loteAtivo.peso_total_kg >= loteAtivo.peso_meta_kg : false;

  res.json({
    total_kg_chumbo_salvo:      totalKgChumboSalvo,
    total_kg_plastico_salvo:    totalKgPlasticoSalvo,
    total_economizado_clientes: totalEconomizado,
    lote_ativo:   loteAtivo || null,
    alerta_frete: alertaFrete,
    total_vendas: db.prepare('SELECT COUNT(*) as c FROM vendas').get().c
  });
}

module.exports = { getDashboard };
