const { DatabaseSync } = require('node:sqlite');
const path = require('path');

const db = new DatabaseSync(path.join(__dirname, 'dados.db'));

db.exec(`PRAGMA journal_mode = WAL`);
db.exec(`PRAGMA foreign_keys = ON`);

db.exec(`
  CREATE TABLE IF NOT EXISTS catalogo_baterias (
    id      INTEGER PRIMARY KEY AUTOINCREMENT,
    modelo  TEXT    NOT NULL,
    peso_kg REAL    NOT NULL,
    preco   REAL    NOT NULL
  );

  CREATE TABLE IF NOT EXISTS vendas (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    bateria_id          INTEGER NOT NULL,
    logistica_reversa   INTEGER NOT NULL DEFAULT 0,
    peso_bateria_velha  REAL,
    desconto_ecologico  REAL    NOT NULL DEFAULT 0,
    preco_final         REAL    NOT NULL,
    criado_em           TEXT    NOT NULL,
    FOREIGN KEY (bateria_id) REFERENCES catalogo_baterias(id)
  );

  CREATE TABLE IF NOT EXISTS lotes_sucata (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    status        TEXT    NOT NULL DEFAULT 'COLETANDO',
    peso_total_kg REAL    NOT NULL DEFAULT 0,
    peso_meta_kg  REAL    NOT NULL DEFAULT 500,
    criado_em     TEXT    NOT NULL,
    fechado_em    TEXT
  );

  CREATE TABLE IF NOT EXISTS configuracoes (
    chave TEXT PRIMARY KEY,
    valor TEXT NOT NULL
  );
`);

const catalogoVazio = db.prepare('SELECT COUNT(*) as c FROM catalogo_baterias').get().c === 0;
if (catalogoVazio) {
  const ins = db.prepare('INSERT INTO catalogo_baterias (modelo, peso_kg, preco) VALUES (?, ?, ?)');
  [
    ['Moura 60Ah',  16, 420.00],
    ['Moura 70Ah',  18, 480.00],
    ['Moura 75Ah',  19, 520.00],
    ['Moura 90Ah',  22, 610.00],
    ['Moura 100Ah', 25, 720.00],
  ].forEach(b => ins.run(...b));
}

const configVazia = db.prepare('SELECT COUNT(*) as c FROM configuracoes').get().c === 0;
if (configVazia) {
  const ins = db.prepare('INSERT INTO configuracoes (chave, valor) VALUES (?, ?)');
  ins.run('cotacao_chumbo_kg',  '8.00');
  ins.run('peso_meta_lote_kg', '500');
}

const semLoteAtivo = !db.prepare("SELECT id FROM lotes_sucata WHERE status = 'COLETANDO' LIMIT 1").get();
if (semLoteAtivo) {
  const meta = parseFloat(db.prepare("SELECT valor FROM configuracoes WHERE chave = 'peso_meta_lote_kg'").get().valor);
  db.prepare('INSERT INTO lotes_sucata (status, peso_total_kg, peso_meta_kg, criado_em) VALUES (?, 0, ?, ?)')
    .run('COLETANDO', meta, new Date().toISOString());
}

module.exports = db;
