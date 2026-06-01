# Sistema de Checkout de Baterias e Logística de Reciclagem

Sistema web para a **Moura-Tech** que integra o registro de vendas de baterias novas com a logística reversa de reciclagem de baterias usadas. Calcula descontos ecológicos automaticamente, acumula peso em lotes de sucata e exibe métricas de impacto ambiental e econômico em tempo real.

---

## Funcionalidades

### Módulo 1 — Checkout Inteligente (Frontend)
- Seleção do modelo de bateria a partir do catálogo (Moura 60Ah a 100Ah)
- Ativação da logística reversa via checkbox (cliente trouxe bateria velha)
- Cálculo dinâmico do desconto ecológico em tempo real, sem recarregar a página
- Exibição do recibo completo após finalizar a venda

### Módulo 2 — Validação Defensiva (Backend)
- Bloqueia o salvamento se a logística reversa estiver ativa e o peso não for informado
- Rejeita pesos fora da faixa física real de baterias automotivas (10kg a 50kg)
- Sanitiza todos os campos: tipos errados, campos vazios e códigos inexistentes no catálogo

### Módulo 3 — Gestão de Lotes de Sucata (Backend)
- Acumula automaticamente o peso de cada bateria velha recebida em um lote ativo
- Muda o status do lote de `COLETANDO` para `PRONTO_PARA_ENVIO` ao atingir a meta de peso
- Cria um novo lote vazio ao despachar o anterior, mantendo a operação contínua

### Módulo 4 — Dashboard de Impacto (Frontend)
- Exibe o total de chumbo e plástico salvos do descarte incorreto
- Mostra o total economizado pelos clientes através da reciclagem
- Alerta visual piscante quando o lote atinge a capacidade máxima
- Botão de despacho disponível sempre que o lote ativo tiver peso registrado
- Atualização automática a cada 10 segundos com toast de confirmação
- **Aba "Lotes de Sucata"** com histórico completo de todos os lotes e barra de progresso individual

---

## Stack Tecnológica

| Camada    | Tecnologia                                      |
|-----------|-------------------------------------------------|
| Backend   | Node.js 22+ · Express.js                        |
| Banco     | SQLite via `node:sqlite` (embutido no Node.js)  |
| Frontend  | HTML5 · CSS3 · JavaScript Vanilla               |
| API       | REST · JSON · CORS habilitado                   |

> Nenhuma compilação nativa necessária. O banco de dados SQLite é o módulo oficial embutido no Node.js 22+.

---

## Estrutura do Projeto

```
CheckoutBateriaReciclagem/
├── backend/
│   ├── server.js                        # Entry point — Express + CORS + rotas
│   ├── package.json
│   ├── database/
│   │   └── db.js                        # Inicializa o banco, cria tabelas, seed do catálogo
│   ├── middleware/
│   │   └── validacao.js                 # Validação defensiva e sanitização
│   ├── controllers/
│   │   ├── vendasController.js          # Lógica de venda e cálculo do desconto
│   │   ├── lotesController.js           # Máquina de estados + histórico dos lotes
│   │   └── dashboardController.js       # Agregação das métricas
│   └── routes/
│       ├── vendas.js
│       ├── lotes.js
│       └── dashboard.js
└── frontend/
    ├── index.html                        # Tela de Checkout
    ├── dashboard.html                    # Dashboard com abas: Visão Geral e Lotes
    ├── css/
    │   └── style.css
    └── js/
        ├── checkout.js                   # Formulário dinâmico e recibo
        └── dashboard.js                  # Abas, polling, histórico de lotes, toast
```

---

## Como Rodar

### Pré-requisitos
- **Node.js 22 ou superior** (o projeto usa `node:sqlite`, disponível a partir do Node 22)
- Nenhuma outra dependência externa além do Express e CORS

### Passo a passo

**1. Instalar as dependências do backend:**
```bash
cd backend
npm install
```

**2. Iniciar o servidor:**
```bash
node server.js
```
O terminal exibirá:
```
Servidor rodando em http://localhost:3000
```

**3. Abrir o frontend:**

Abra o arquivo `frontend/index.html` diretamente no navegador, ou use a extensão **Live Server** do VS Code.

---

## API REST

Base URL: `http://localhost:3000`

| Método | Endpoint                  | Descrição                                          |
|--------|---------------------------|----------------------------------------------------|
| GET    | `/api/vendas/catalogo`    | Lista modelos de bateria e cotação do chumbo       |
| POST   | `/api/vendas`             | Registra uma venda                                 |
| GET    | `/api/lotes`              | Retorna o histórico completo de todos os lotes     |
| GET    | `/api/lotes/ativo`        | Retorna o lote de sucata em andamento              |
| POST   | `/api/lotes/despachar`    | Despacha o lote atual e abre um novo               |
| GET    | `/api/dashboard`          | Retorna todas as métricas do dashboard             |

### Exemplo — Registrar venda com logística reversa

**Requisição:**
```http
POST /api/vendas
Content-Type: application/json

{
  "bateria_id": 2,
  "logistica_reversa": true,
  "peso_bateria_velha": 17.5
}
```

**Resposta `201`:**
```json
{
  "mensagem": "Venda registrada com sucesso!",
  "venda": {
    "id": 1,
    "modelo": "Moura 70Ah",
    "preco_original": 480.00,
    "desconto_ecologico": 140.00,
    "preco_final": 340.00,
    "logistica_reversa": true,
    "peso_bateria_velha": 17.5
  },
  "lote": {
    "id": 1,
    "status": "COLETANDO",
    "peso_total_kg": 17.5,
    "peso_meta_kg": 500
  }
}
```

### Exemplo — Histórico de lotes

**Requisição:**
```http
GET /api/lotes
```

**Resposta `200`:**
```json
[
  {
    "id": 2,
    "status": "COLETANDO",
    "peso_total_kg": 35.0,
    "peso_meta_kg": 500,
    "criado_em": "2026-06-01T19:00:00.000Z",
    "fechado_em": null
  },
  {
    "id": 1,
    "status": "PRONTO_PARA_ENVIO",
    "peso_total_kg": 500.0,
    "peso_meta_kg": 500,
    "criado_em": "2026-06-01T18:00:00.000Z",
    "fechado_em": "2026-06-01T18:59:00.000Z"
  }
]
```

### Erros de validação — exemplos

| Cenário                              | HTTP | Mensagem                                                               |
|--------------------------------------|------|------------------------------------------------------------------------|
| Logística ativa sem informar peso    | 400  | `"Logística reversa ativa: informe o peso da bateria entregue."`       |
| Peso fora da faixa (< 10 ou > 50kg) | 400  | `"Peso inválido (5kg). Baterias automotivas pesam entre 10kg e 50kg."` |
| Código de produto inexistente        | 400  | `"Código de produto não encontrado no catálogo."`                      |

---

## Banco de Dados

O arquivo `backend/database/dados.db` é criado automaticamente na primeira execução.

### Catálogo inicial (seed automático)

| Modelo       | Peso  | Preço      |
|--------------|-------|------------|
| Moura 60Ah   | 16 kg | R$ 420,00  |
| Moura 70Ah   | 18 kg | R$ 480,00  |
| Moura 75Ah   | 19 kg | R$ 520,00  |
| Moura 90Ah   | 22 kg | R$ 610,00  |
| Moura 100Ah  | 25 kg | R$ 720,00  |

### Configurações padrão

| Configuração          | Valor padrão |
|-----------------------|--------------|
| Cotação do chumbo     | R$ 8,00 / kg |
| Meta de peso por lote | 500 kg       |

### Fórmula do desconto ecológico

```
desconto   = peso_bateria_velha × cotacao_chumbo_kg
preco_final = preco_original − desconto
```

### Composição técnica da bateria (para as métricas do dashboard)

```
Chumbo salvo   = peso_total_coletado × 70%
Plástico salvo = peso_total_coletado × 20%
```

---

## Máquina de Estados dos Lotes

```
   ┌─────────────────────────────────────────────────────────┐
   │                                                         │
   ▼                                                         │
COLETANDO ──── (peso >= 500kg) ────▶ PRONTO_PARA_ENVIO       │
                                           │                  │
                               POST /api/lotes/despachar      │
                                           │                  │
                                    (novo lote criado) ───────┘
```

O botão **Despachar Lote** fica disponível sempre que o lote ativo tiver peso registrado (maior que zero), permitindo despacho manual antes de atingir a meta se necessário.

---

## Telas

### Checkout (`index.html`)
- Seletor de modelo com peso e preço visíveis
- Toggle de logística reversa com animação
- Campo de peso que aparece/some conforme o toggle
- Preview do desconto calculado em tempo real
- Recibo final após confirmação com opção de nova venda

### Dashboard (`dashboard.html`)

**Aba "Visão Geral"**
- Cards de métricas: chumbo salvo, plástico salvo, economia gerada, total de vendas
- Alerta piscante quando o lote está cheio
- Lote ativo com barra de progresso e botão de despacho
- Toast de confirmação após despacho
- Atualização automática a cada 10 segundos

**Aba "Lotes de Sucata"**
- Histórico completo de todos os lotes em ordem cronológica reversa
- Cada lote exibe: ID, status, peso coletado, meta, data de abertura e fechamento
- Barra de progresso individual por lote
- Destaque visual no lote atualmente ativo
- Contador total de lotes registrados
