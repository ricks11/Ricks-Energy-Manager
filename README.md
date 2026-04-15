# Ricks Energy Manager (REM)

Aplicacao web full-stack para gestao de energia pre-paga com foco em previsao de consumo e visibilidade do saldo restante.

## Estrutura Atual

```text
/
├── backend/
│   ├── __init__.py
│   ├── .env.example
│   ├── config.py
│   ├── database.py
│   ├── main.py
│   ├── models.py
│   └── requirements.txt
├── frontend/
│   ├── .env.example
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── App.jsx
│       ├── main.jsx
│       └── styles.css
├── Procfile
└── README.md
```

## Stack

- Frontend: React + Vite
- Backend: FastAPI + SQLAlchemy
- Database: MySQL (producao) ou SQLite (desenvolvimento rapido)
- Deploy: Heroku com Procfile

## Como Executar

### Pre-requisitos

- Python 3.10+
- Node.js 18+
- NPM

### 1. Configurar backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
cd ..
python -m backend.bootstrap_db
```

Executar API (a partir da raiz do projeto):

```powershell
uvicorn backend.main:app --reload
```

### 2. Configurar frontend

```powershell
cd frontend
npm install
Copy-Item .env.example .env
npm run dev
```

## Variaveis de Ambiente

Backend ([backend/.env.example](backend/.env.example)):

```env
APP_NAME=Ricks Energy Manager API
APP_VERSION=0.1.0
DEBUG_MODE=True
DATABASE_URL=sqlite:///./ricks_energy.db
DATABASE_AUTO_CREATE=False
DATABASE_AUTO_SEED=False
FRONTEND_ORIGIN=http://localhost:5173
```

Para ambiente MySQL hospedado (ex.: Hostinger), use o template [backend/.env.template](backend/.env.template):

```powershell
cd backend
Copy-Item .env.template .env
```

Mantenha `DATABASE_AUTO_CREATE=False` e `DATABASE_AUTO_SEED=False` para ambiente de producao.

Frontend ([frontend/.env.example](frontend/.env.example)):

```env
VITE_API_URL=http://localhost:8000
```

## Endpoints Iniciais

- GET / -> mensagem de estado da API
- GET /health -> health check para validar integracao com frontend

## Proximos Passos

- Adicionar schemas Pydantic e rotas de leituras/recargas
- Implementar calculo de consumo medio diario e dias restantes
- Integrar persistencia MySQL em ambiente de producao