# FanOps ERP — Render-ready

Проект упрощён до одного Render Web Service:

- FastAPI — API + раздача готового React frontend
- MongoDB Atlas — база данных
- React собирается во время deploy
- отдельный Static Site для frontend не нужен
- отдельный backend service не нужен

## 1. MongoDB Atlas

Создайте бесплатный кластер MongoDB Atlas и получите connection string.

В Atlas:
1. Database Access → создайте пользователя БД.
2. Network Access → добавьте `0.0.0.0/0` (для простого Render deploy).
3. Скопируйте `mongodb+srv://...` строку.

## 2. Deploy на Render

Самый простой вариант:

1. Загрузите проект в GitHub.
2. Render → New → Blueprint.
3. Выберите репозиторий с этим проектом.
4. Render найдёт `render.yaml`.
5. Заполните секретные переменные:
   - `MONGO_URL` — строка MongoDB Atlas.
   - `ADMIN_PASSWORD` — пароль администратора.
6. Запустите deploy.

Render сам:
- установит Python-зависимости;
- установит Node-зависимости;
- соберёт React;
- запустит FastAPI;
- выдаст один URL вида `https://fanops.onrender.com`.

## 3. Если создавать сервис вручную

Runtime: `Python`

Build Command:
```bash
pip install -r backend/requirements.txt && cd frontend && npm install --legacy-peer-deps && npm run build
```

Start Command:
```bash
uvicorn backend.server:app --host 0.0.0.0 --port $PORT
```

Health Check Path:
```text
/api/
```

Environment:
```text
MONGO_URL=...
DB_NAME=fanops
JWT_SECRET=...
ADMIN_USERNAME=admin
ADMIN_PASSWORD=...
```

## 4. Локальный запуск

Backend:
```bash
pip install -r backend/requirements.txt
uvicorn backend.server:app --reload --port 8000
```

Frontend отдельно:
```bash
cd frontend
npm install --legacy-peer-deps
npm start
```

Для отдельного frontend при локальной разработке:
```text
REACT_APP_BACKEND_URL=http://localhost:8000
```

Для Render эту переменную задавать не нужно.

## Важно

Файлы пользователей сейчас хранятся как Base64 в MongoDB. Это сохранено специально, чтобы не добавлять S3/Cloudinary и другие сервисы в простой deploy. Для больших объёмов файлов позже лучше вынести файлы в object storage.

Не храните реальные пароли в GitHub. Используйте Environment Variables Render.
