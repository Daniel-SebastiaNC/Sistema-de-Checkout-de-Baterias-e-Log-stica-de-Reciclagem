const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.use('/api/vendas',    require('./routes/vendas'));
app.use('/api/lotes',     require('./routes/lotes'));
app.use('/api/dashboard', require('./routes/dashboard'));

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
  console.log('Endpoints disponíveis:');
  console.log('  GET  /api/vendas/catalogo');
  console.log('  POST /api/vendas');
  console.log('  GET  /api/lotes/ativo');
  console.log('  POST /api/lotes/despachar');
  console.log('  GET  /api/dashboard');
});
