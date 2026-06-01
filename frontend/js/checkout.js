const API = 'http://localhost:3000/api';

let catalogo = [];
let cotacaoChumbo = 0;

async function carregarCatalogo() {
  try {
    const res  = await fetch(`${API}/vendas/catalogo`);
    const data = await res.json();
    catalogo      = data.baterias;
    cotacaoChumbo = data.cotacao_chumbo_kg;

    const select = document.getElementById('bateria-select');
    catalogo.forEach(b => {
      const opt = document.createElement('option');
      opt.value = b.id;
      opt.textContent = `${b.modelo} — ${b.peso_kg}kg — R$ ${b.preco.toFixed(2)}`;
      select.appendChild(opt);
    });
  } catch {
    mostrarAlerta('Não foi possível conectar ao servidor. Verifique se o backend está rodando.', 'erro');
  }
}

function getBateriaSelecionada() {
  const id = parseInt(document.getElementById('bateria-select').value);
  return catalogo.find(b => b.id === id) || null;
}

function atualizarPreview() {
  const bateria    = getBateriaSelecionada();
  const logistica  = document.getElementById('logistica-checkbox').checked;
  const pesoInput  = document.getElementById('peso-velha');
  const pesoValor  = parseFloat(pesoInput.value);
  const preview    = document.getElementById('preview-desconto');

  if (!bateria) { preview.classList.remove('visivel'); return; }

  document.getElementById('prev-modelo').textContent  = bateria.modelo;
  document.getElementById('prev-original').textContent = `R$ ${bateria.preco.toFixed(2)}`;

  let desconto = 0;
  if (logistica && !isNaN(pesoValor) && pesoValor > 0) {
    desconto = pesoValor * cotacaoChumbo;
    document.getElementById('prev-desconto-row').style.display = 'flex';
    document.getElementById('prev-desconto').textContent =
      `- R$ ${desconto.toFixed(2)} (${pesoValor}kg × R$ ${cotacaoChumbo}/kg)`;
  } else {
    document.getElementById('prev-desconto-row').style.display = 'none';
  }

  const final = bateria.preco - desconto;
  document.getElementById('prev-final').textContent = `R$ ${final.toFixed(2)}`;
  preview.classList.add('visivel');
}

function toggleLogistica() {
  const row     = document.getElementById('logistica-row');
  const checkbox = document.getElementById('logistica-checkbox');
  const campo   = document.getElementById('campo-peso');

  checkbox.checked = !checkbox.checked;
  row.classList.toggle('checked', checkbox.checked);
  campo.classList.toggle('visivel', checkbox.checked);

  if (!checkbox.checked) {
    document.getElementById('peso-velha').value = '';
  }
  atualizarPreview();
}

function mostrarAlerta(msg, tipo) {
  const el = document.getElementById('alerta');
  el.textContent = msg;
  el.className   = tipo;
}

function limparAlerta() {
  const el = document.getElementById('alerta');
  el.className = '';
  el.textContent = '';
}

function mostrarRecibo(venda, lote) {
  document.getElementById('form-venda').style.display = 'none';
  document.getElementById('preview-desconto').classList.remove('visivel');

  const recibo = document.getElementById('recibo');
  recibo.classList.add('visivel');

  document.getElementById('rec-modelo').textContent   = venda.modelo;
  document.getElementById('rec-original').textContent = `R$ ${venda.preco_original.toFixed(2)}`;

  const rowDesconto = document.getElementById('rec-desconto-row');
  if (venda.desconto_ecologico > 0) {
    rowDesconto.style.display = 'flex';
    document.getElementById('rec-desconto').textContent =
      `- R$ ${venda.desconto_ecologico.toFixed(2)}`;
  } else {
    rowDesconto.style.display = 'none';
  }

  document.getElementById('rec-final').textContent = `R$ ${venda.preco_final.toFixed(2)}`;
  document.getElementById('rec-id').textContent    = `#${venda.id}`;

  if (lote) {
    const loteInfo = document.getElementById('rec-lote-info');
    loteInfo.style.display = 'block';
    document.getElementById('rec-lote-peso').textContent = lote.peso_total_kg.toFixed(1);
    document.getElementById('rec-lote-status').textContent =
      lote.status === 'PRONTO_PARA_ENVIO' ? 'PRONTO PARA ENVIO' : 'COLETANDO';
  }
}

async function finalizarVenda(e) {
  e.preventDefault();
  limparAlerta();

  const bateria   = getBateriaSelecionada();
  const logistica = document.getElementById('logistica-checkbox').checked;
  const pesoStr   = document.getElementById('peso-velha').value.trim();

  if (!bateria) {
    mostrarAlerta('Selecione um modelo de bateria.', 'erro');
    return;
  }

  const body = {
    bateria_id:        bateria.id,
    logistica_reversa: logistica,
    peso_bateria_velha: logistica && pesoStr !== '' ? parseFloat(pesoStr) : undefined
  };

  const btn = document.getElementById('btn-finalizar');
  btn.disabled     = true;
  btn.textContent  = 'Registrando...';

  try {
    const res  = await fetch(`${API}/vendas`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body)
    });
    const data = await res.json();

    if (!res.ok) {
      mostrarAlerta(data.erro || 'Erro ao registrar venda.', 'erro');
      return;
    }

    mostrarRecibo(data.venda, data.lote);
  } catch {
    mostrarAlerta('Erro de conexão com o servidor.', 'erro');
  } finally {
    btn.disabled    = false;
    btn.textContent = 'Finalizar Venda';
  }
}

function novaVenda() {
  document.getElementById('recibo').classList.remove('visivel');
  document.getElementById('form-venda').style.display = 'block';
  document.getElementById('form-venda').reset();
  document.getElementById('logistica-row').classList.remove('checked');
  document.getElementById('logistica-checkbox').checked = false;
  document.getElementById('campo-peso').classList.remove('visivel');
  document.getElementById('preview-desconto').classList.remove('visivel');
  document.getElementById('rec-lote-info').style.display = 'none';
  limparAlerta();
}

document.addEventListener('DOMContentLoaded', () => {
  carregarCatalogo();

  document.getElementById('bateria-select').addEventListener('change', atualizarPreview);
  document.getElementById('logistica-row').addEventListener('click', toggleLogistica);
  document.getElementById('peso-velha').addEventListener('input', atualizarPreview);
  document.getElementById('form-venda').addEventListener('submit', finalizarVenda);
  document.getElementById('btn-nova-venda').addEventListener('click', novaVenda);
});
