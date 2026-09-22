# FanOps ERP — Render

Single Render Web Service: FastAPI serves both API and the production React frontend.

## Render

Build Command:
`pip install -r backend/requirements.txt && cd frontend && npm install --legacy-peer-deps --no-audit --no-fund && npm run build`

Start Command:
`uvicorn backend.server:app --host 0.0.0.0 --port $PORT`

Node version is intentionally not pinned. Render uses its current supported Node version, avoiding a separate Node 20 download failure.

Required environment variables:
- `MONGO_URL` — MongoDB Atlas connection string
- `DB_NAME` — `fanops`
- `JWT_SECRET` — generate a strong secret
- `ADMIN_USERNAME` — `admin`
- `ADMIN_PASSWORD` — your admin password
- `CORS_ORIGINS` — leave empty for same-origin deployment
