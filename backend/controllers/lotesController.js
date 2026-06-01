const db = require('../database/db');

function getLoteAtivo() {
  return db.prepare("SELECT * FROM lotes_sucata WHERE status = 'COLETANDO' LIMIT 1").get();
}

function criarNovoLote() {
  const meta = parseFloat(
    db.prepare("SELECT valor FROM configuracoes WHERE chave = 'peso_meta_lote_kg'").get().valor
  );
  const res = db.prepare(
    'INSERT INTO lotes_sucata (status, peso_total_kg, peso_meta_kg, criado_em) VALUES (?, 0, ?, ?)'
  ).run('COLETANDO', meta, new Date().toISOString());
  return db.prepare('SELECT * FROM lotes_sucata WHERE id = ?').get(res.lastInsertRowid);
}

function fecharLote(lote, pesoFinal) {
  const fechado_em = new Date().toISOString();
  db.prepare(
    "UPDATE lotes_sucata SET status = 'PRONTO_PARA_ENVIO', peso_total_kg = ?, fechado_em = ? WHERE id = ?"
  ).run(pesoFinal, fechado_em, lote.id);
}

function adicionarPeso(pesoKg) {
  let lote = getLoteAtivo();
  if (!lote) lote = criarNovoLote();

  const novoTotal = parseFloat((lote.peso_total_kg + pesoKg).toFixed(3));

  if (novoTotal >= lote.peso_meta_kg) {
    // Fecha o lote atual exatamente na meta
    fecharLote(lote, lote.peso_meta_kg);

    // Calcula o excedente e abre um novo lote com esse peso
    const restante = parseFloat((novoTotal - lote.peso_meta_kg).toFixed(3));
    const novoLote = criarNovoLote();

    if (restante > 0) {
      db.prepare('UPDATE lotes_sucata SET peso_total_kg = ? WHERE id = ?')
        .run(restante, novoLote.id);
    }

    return db.prepare('SELECT * FROM lotes_sucata WHERE id = ?').get(novoLote.id);
  }

  db.prepare('UPDATE lotes_sucata SET peso_total_kg = ? WHERE id = ?')
    .run(novoTotal, lote.id);

  return db.prepare('SELECT * FROM lotes_sucata WHERE id = ?').get(lote.id);
}

function getLoteAtivoHandler(req, res) {
  let lote = getLoteAtivo();
  if (!lote) lote = criarNovoLote();

  const percentual = Math.min((lote.peso_total_kg / lote.peso_meta_kg) * 100, 100);
  res.json({ ...lote, percentual_meta: Math.round(percentual * 10) / 10 });
}

function despacharLote(req, res) {
  const lote = getLoteAtivo();
  const fechado_em = new Date().toISOString();

  if (lote) {
    db.prepare("UPDATE lotes_sucata SET status = 'PRONTO_PARA_ENVIO', fechado_em = ? WHERE id = ?")
      .run(fechado_em, lote.id);
  }

  const novoLote = criarNovoLote();

  res.json({
    mensagem: 'Lote despachado com sucesso. Novo lote iniciado.',
    lote_despachado_id: lote ? lote.id : null,
    novo_lote: novoLote
  });
}

function getHistoricoHandler(req, res) {
  const lotes = db.prepare(
    'SELECT * FROM lotes_sucata ORDER BY id DESC'
  ).all();
  res.json(lotes);
}

module.exports = { adicionarPeso, getLoteAtivoHandler, despacharLote, getHistoricoHandler };
