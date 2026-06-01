const API = 'http://localhost:3000/api';

// ─── ABAS ────────────────────────────────────────────────
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');

    if (btn.dataset.tab === 'lotes') carregarHistorico();
  });
});

// ─── VISÃO GERAL ─────────────────────────────────────────
async function carregarDashboard() {
  try {
    const res  = await fetch(`${API}/dashboard`);
    const data = await res.json();
    renderizarMetricas(data);
    renderizarLoteAtivo(data.lote_ativo);
    toggleAlertaFrete(data.alerta_frete);
  } catch {
    document.getElementById('status-conexao').textContent = 'Servidor offline';
    document.getElementById('status-conexao').style.color = '#ff6b7a';
  }
}

function renderizarMetricas(data) {
  document.getElementById('val-chumbo').textContent   = data.total_kg_chumbo_salvo.toFixed(1);
  document.getElementById('val-plastico').textContent = data.total_kg_plastico_salvo.toFixed(1);
  document.getElementById('val-economia').textContent = `R$ ${data.total_economizado_clientes.toFixed(2)}`;
  document.getElementById('val-vendas').textContent   = data.total_vendas;

  const agora = new Date().toLocaleTimeString('pt-BR');
  document.getElementById('status-conexao').textContent = `Atualizado às ${agora}`;
  document.getElementById('status-conexao').style.color = '';
}

function renderizarLoteAtivo(lote) {
  const semDados = document.getElementById('lote-sem-dados');
  const dados    = document.getElementById('lote-dados');
  const btnDesp  = document.getElementById('btn-despachar');

  if (!lote) {
    semDados.style.display = 'block';
    dados.style.display    = 'none';
    btnDesp.disabled = true;
    return;
  }

  semDados.style.display = 'none';
  dados.style.display    = 'block';

  // Habilita o botão sempre que houver lote ativo com algum peso
  btnDesp.disabled = lote.peso_total_kg <= 0;

  document.getElementById('lote-id').textContent   = `#${lote.id}`;
  document.getElementById('lote-peso').textContent = `${lote.peso_total_kg.toFixed(1)} kg`;
  document.getElementById('lote-meta').textContent = `${lote.peso_meta_kg.toFixed(0)} kg`;

  const pct  = Math.min((lote.peso_total_kg / lote.peso_meta_kg) * 100, 100);
  const fill = document.getElementById('progresso-fill');
  fill.style.width = `${pct}%`;
  fill.classList.toggle('cheio', pct >= 100);
  document.getElementById('progresso-pct').textContent = `${pct.toFixed(1)}%`;

  const badge = document.getElementById('lote-status');
  if (lote.status === 'PRONTO_PARA_ENVIO') {
    badge.textContent = 'Pronto para Envio';
    badge.className   = 'status-badge pronto';
  } else {
    badge.textContent = 'Coletando';
    badge.className   = 'status-badge coletando';
  }

  document.getElementById('lote-criado').textContent =
    new Date(lote.criado_em).toLocaleString('pt-BR');
}

function toggleAlertaFrete(ativo) {
  document.getElementById('alerta-frete').classList.toggle('ativo', ativo);
}

// ─── DESPACHAR ───────────────────────────────────────────
async function despacharLote() {
  if (!confirm('Confirmar despacho do lote atual?\nUm novo lote será criado automaticamente.')) return;

  const btn = document.getElementById('btn-despachar');
  btn.disabled    = true;
  btn.textContent = 'Despachando...';

  try {
    const res  = await fetch(`${API}/lotes/despachar`, { method: 'POST' });
    const data = await res.json();

    await carregarDashboard();

    // Atualiza aba de lotes se estiver visível
    if (document.getElementById('tab-lotes').classList.contains('active')) {
      await carregarHistorico();
    }

    mostrarToast(data.mensagem);
  } catch {
    mostrarToast('Erro ao despachar lote.', true);
  } finally {
    btn.textContent = 'Despachar Lote';
  }
}

// ─── HISTÓRICO DE LOTES ──────────────────────────────────
async function carregarHistorico() {
  try {
    const res   = await fetch(`${API}/lotes`);
    const lotes = await res.json();
    renderizarHistorico(lotes);
  } catch {
    document.getElementById('historico-lista').innerHTML =
      '<p class="empty">Erro ao carregar histórico.</p>';
  }
}

function renderizarHistorico(lotes) {
  const lista  = document.getElementById('historico-lista');
  const vazio  = document.getElementById('historico-vazio');
  const badge  = document.getElementById('lotes-total-badge');

  badge.textContent = `${lotes.length} lote${lotes.length !== 1 ? 's' : ''}`;

  if (lotes.length === 0) {
    vazio.style.display = 'block';
    lista.innerHTML     = '';
    return;
  }

  vazio.style.display = 'none';
  lista.innerHTML = lotes.map(lote => {
    const isAtivo    = lote.status === 'COLETANDO';
    const isPronto   = lote.status === 'PRONTO_PARA_ENVIO';
    const pct        = Math.min((lote.peso_total_kg / lote.peso_meta_kg) * 100, 100);
    const badgeClass = isAtivo ? 'coletando' : 'pronto';
    const badgeText  = isAtivo ? 'Coletando' : 'Pronto para Envio';
    const abertura   = new Date(lote.criado_em).toLocaleString('pt-BR');
    const fechamento = lote.fechado_em
      ? new Date(lote.fechado_em).toLocaleString('pt-BR')
      : '—';

    const fillClass = pct >= 100 ? 'cheio' : '';

    return `
      <div class="lote-historico-item ${isAtivo ? 'lote-ativo-destaque' : ''}">
        <div class="lote-hist-header">
          <div class="lote-hist-id">
            Lote <strong>#${lote.id}</strong>
            ${isAtivo ? '<span class="lote-ativo-tag">ATIVO</span>' : ''}
          </div>
          <span class="status-badge ${badgeClass}">${badgeText}</span>
        </div>

        <div class="lote-hist-info">
          <div class="info-item">
            <span class="info-label">Peso coletado</span>
            <span class="info-valor">${lote.peso_total_kg.toFixed(1)} kg</span>
          </div>
          <div class="info-item">
            <span class="info-label">Meta</span>
            <span class="info-valor">${lote.peso_meta_kg.toFixed(0)} kg</span>
          </div>
          <div class="info-item">
            <span class="info-label">Abertura</span>
            <span class="info-valor">${abertura}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Fechamento</span>
            <span class="info-valor">${fechamento}</span>
          </div>
        </div>

        <div class="progresso-wrapper" style="margin-top:12px; margin-bottom:0;">
          <div class="progresso-header">
            <span style="font-size:0.78rem;">${pct.toFixed(1)}% da meta atingida</span>
          </div>
          <div class="progresso-track" style="height:10px;">
            <div class="progresso-fill ${fillClass}" style="width:${pct}%"></div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// ─── TOAST ───────────────────────────────────────────────
function mostrarToast(msg, erro = false) {
  let toast = document.getElementById('toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.className   = erro ? 'toast-erro' : 'toast-ok';
  toast.classList.add('visivel');
  setTimeout(() => toast.classList.remove('visivel'), 3500);
}

// ─── INIT ────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  carregarDashboard();
  setInterval(carregarDashboard, 10000);

  document.getElementById('btn-despachar').addEventListener('click', despacharLote);
  document.getElementById('btn-atualizar').addEventListener('click', () => {
    carregarDashboard();
    if (document.getElementById('tab-lotes').classList.contains('active')) {
      carregarHistorico();
    }
  });
});
