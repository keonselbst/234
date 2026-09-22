from fastapi import FastAPI, APIRouter, HTTPException, Depends, Header, UploadFile, File, Request
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import time
import uuid
import base64
import logging
import bcrypt
import jwt as pyjwt
import httpx
from pathlib import Path
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone, timedelta

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "fanops")
JWT_SECRET = os.environ.get("JWT_SECRET", "change-me-in-production")
JWT_ALGO = os.environ.get('JWT_ALGO', 'HS256')
JWT_EXPIRE_HOURS = int(os.environ.get('JWT_EXPIRE_HOURS', '24'))

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

app = FastAPI(title="FanOps ERP")
api = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("fanops")


# ================== Utils ==================
def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def hash_pw(pw: str) -> str:
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()


def verify_pw(pw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode(), hashed.encode())
    except Exception:
        return False


def make_token(user_id: str, username: str, role: str) -> str:
    payload = {
        "sub": user_id,
        "username": username,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRE_HOURS),
    }
    return pyjwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGO)


async def current_user(authorization: Optional[str] = Header(None)) -> Dict[str, Any]:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(401, "Требуется авторизация")
    token = authorization.split(" ", 1)[1]
    try:
        payload = pyjwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGO])
    except pyjwt.PyJWTError:
        raise HTTPException(401, "Недействительный токен")
    user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(401, "Пользователь не найден")
    return user


def clean(doc: Optional[dict]) -> Optional[dict]:
    if not doc:
        return None
    doc.pop("_id", None)
    doc.pop("password_hash", None)
    return doc


# ================== Models ==================
class RegisterIn(BaseModel):
    model_config = ConfigDict(extra="ignore")
    username: str
    password: str
    full_name: str
    email: Optional[EmailStr] = None
    department_id: Optional[str] = None
    role: str = "employee"  # employee|manager|admin


class LoginIn(BaseModel):
    username: str
    password: str


class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    position: Optional[str] = None
    avatar_url: Optional[str] = None
    language: Optional[str] = None
    theme: Optional[str] = None
    department_id: Optional[str] = None


class PasswordChange(BaseModel):
    old_password: str
    new_password: str


class DepartmentIn(BaseModel):
    name: str
    description: Optional[str] = ""
    color: Optional[str] = "#FF5722"
    custom_roles: Optional[List[str]] = []


class GenericItem(BaseModel):
    model_config = ConfigDict(extra="allow")


# ================== Seed Admin ==================
@app.on_event("startup")
async def startup():
    admin_username = os.environ.get("ADMIN_USERNAME", "keonamore")
    admin_password = os.environ.get("ADMIN_PASSWORD", "admin")
    existing = await db.users.find_one({"username": admin_username})
    if not existing:
        uid = str(uuid.uuid4())
        access_uid = f"UID-{uuid.uuid4().hex[:8].upper()}"
        await db.users.insert_one({
            "id": uid,
            "username": admin_username,
            "password_hash": hash_pw(admin_password),
            "full_name": "Системный администратор",
            "email": f"{admin_username}@fanops.local",
            "role": "admin",
            "position": "Директор",
            "department_id": None,
            "avatar_url": None,
            "access_uid": access_uid,
            "phone": "",
            "language": "ru",
            "theme": "dark",
            "created_at": now_iso(),
        })
        logger.info(f"Admin seeded: {admin_username}")
    # Seed a demo department if empty
    if await db.departments.count_documents({}) == 0:
        await db.departments.insert_many([
            {"id": str(uuid.uuid4()), "name": "Производство", "description": "Цех сборки промышленных вентиляторов", "color": "#FF5722", "custom_roles": ["Мастер","Оператор","Технолог"], "created_at": now_iso()},
            {"id": str(uuid.uuid4()), "name": "Отдел продаж", "description": "Менеджеры и лиды", "color": "#E1FF00", "custom_roles": ["Менеджер","Ведущий менеджер","РОП"], "created_at": now_iso()},
            {"id": str(uuid.uuid4()), "name": "Конструкторское бюро", "description": "Разработка моделей и чертежей", "color": "#4F46E5", "custom_roles": ["Инженер","Главный конструктор"], "created_at": now_iso()},
            {"id": str(uuid.uuid4()), "name": "Закупки", "description": "Снабжение и поставщики", "color": "#22C55E", "custom_roles": ["Снабженец","Руководитель закупок"], "created_at": now_iso()},
        ])


@app.on_event("shutdown")
async def shutdown():
    client.close()


# ================== Auth ==================
@api.post("/auth/register")
async def register(data: RegisterIn, user=Depends(current_user)):
    if user["role"] != "admin":
        raise HTTPException(403, "Только администратор может создавать пользователей")
    if await db.users.find_one({"username": data.username}):
        raise HTTPException(400, "Пользователь уже существует")
    uid = str(uuid.uuid4())
    access_uid = f"UID-{uuid.uuid4().hex[:8].upper()}"
    doc = {
        "id": uid,
        "username": data.username,
        "password_hash": hash_pw(data.password),
        "full_name": data.full_name,
        "email": data.email,
        "role": data.role,
        "department_id": data.department_id,
        "avatar_url": None,
        "access_uid": access_uid,
        "phone": "",
        "position": "",
        "language": "ru",
        "theme": "dark",
        "created_at": now_iso(),
    }
    await db.users.insert_one(doc)
    return clean(doc)


@api.post("/auth/login")
async def login(data: LoginIn):
    user = await db.users.find_one({"username": data.username})
    if not user or not verify_pw(data.password, user["password_hash"]):
        raise HTTPException(401, "Неверный логин или пароль")
    token = make_token(user["id"], user["username"], user["role"])
    return {"token": token, "user": clean(dict(user))}


@api.get("/auth/me")
async def me(user=Depends(current_user)):
    return user


@api.put("/auth/profile")
async def update_profile(data: ProfileUpdate, user=Depends(current_user)):
    updates = {k: v for k, v in data.model_dump(exclude_none=True).items()}
    if updates:
        await db.users.update_one({"id": user["id"]}, {"$set": updates})
    updated = await db.users.find_one({"id": user["id"]}, {"_id": 0, "password_hash": 0})
    return updated


@api.post("/auth/change-password")
async def change_password(data: PasswordChange, user=Depends(current_user)):
    full = await db.users.find_one({"id": user["id"]})
    if not verify_pw(data.old_password, full["password_hash"]):
        raise HTTPException(400, "Неверный старый пароль")
    await db.users.update_one({"id": user["id"]}, {"$set": {"password_hash": hash_pw(data.new_password)}})
    return {"ok": True}


# ================== Employees / Users ==================
@api.get("/employees")
async def list_employees(user=Depends(current_user)):
    items = await db.users.find({}, {"_id": 0, "password_hash": 0}).to_list(1000)
    return items


@api.delete("/employees/{uid}")
async def delete_employee(uid: str, user=Depends(current_user)):
    if user["role"] != "admin":
        raise HTTPException(403, "Только администратор")
    if uid == user["id"]:
        raise HTTPException(400, "Нельзя удалить самого себя")
    await db.users.delete_one({"id": uid})
    return {"ok": True}


@api.put("/employees/{uid}")
async def update_employee(uid: str, data: ProfileUpdate, user=Depends(current_user)):
    if user["role"] != "admin" and user["id"] != uid:
        raise HTTPException(403, "Недостаточно прав")
    updates = {k: v for k, v in data.model_dump(exclude_none=True).items()}
    if updates:
        await db.users.update_one({"id": uid}, {"$set": updates})
    return await db.users.find_one({"id": uid}, {"_id": 0, "password_hash": 0})


# ================== Departments ==================
@api.get("/departments")
async def list_departments(user=Depends(current_user)):
    return await db.departments.find({}, {"_id": 0}).to_list(1000)


@api.post("/departments")
async def create_department(data: DepartmentIn, user=Depends(current_user)):
    if user["role"] != "admin":
        raise HTTPException(403, "Только администратор")
    doc = {"id": str(uuid.uuid4()), **data.model_dump(), "created_at": now_iso()}
    await db.departments.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api.put("/departments/{did}")
async def update_department(did: str, data: DepartmentIn, user=Depends(current_user)):
    if user["role"] != "admin":
        raise HTTPException(403, "Только администратор")
    await db.departments.update_one({"id": did}, {"$set": data.model_dump()})
    return await db.departments.find_one({"id": did}, {"_id": 0})


@api.delete("/departments/{did}")
async def delete_department(did: str, user=Depends(current_user)):
    if user["role"] != "admin":
        raise HTTPException(403, "Только администратор")
    await db.departments.delete_one({"id": did})
    return {"ok": True}


# ================== Generic CRUD collections ==================
COLLECTIONS = {
    "materials": "materials",
    "leads": "leads",
    "models": "models",
    "customers": "customers",
    "suppliers": "suppliers",
    "orders": "orders",
    "budget": "budget",
}


def make_crud(path: str, coll_name: str):
    @api.get(f"/{path}")
    async def _list(user=Depends(current_user)):
        return await db[coll_name].find({}, {"_id": 0}).sort("created_at", -1).to_list(2000)

    @api.post(f"/{path}")
    async def _create(item: Dict[str, Any], user=Depends(current_user)):
        doc = {"id": str(uuid.uuid4()), **item, "created_at": now_iso(), "created_by": user["id"]}
        await db[coll_name].insert_one(doc)
        doc.pop("_id", None)
        return doc

    @api.put(f"/{path}/{{item_id}}")
    async def _update(item_id: str, item: Dict[str, Any], user=Depends(current_user)):
        item.pop("id", None)
        item.pop("_id", None)
        await db[coll_name].update_one({"id": item_id}, {"$set": item})
        return await db[coll_name].find_one({"id": item_id}, {"_id": 0})

    @api.delete(f"/{path}/{{item_id}}")
    async def _delete(item_id: str, user=Depends(current_user)):
        await db[coll_name].delete_one({"id": item_id})
        return {"ok": True}

    _list.__name__ = f"list_{path}"
    _create.__name__ = f"create_{path}"
    _update.__name__ = f"update_{path}"
    _delete.__name__ = f"delete_{path}"


for p, c in COLLECTIONS.items():
    make_crud(p, c)


# ================== File uploads (drawings/avatars) ==================
@api.post("/upload")
async def upload_file(file: UploadFile = File(...), user=Depends(current_user)):
    content = await file.read()
    if len(content) > 8 * 1024 * 1024:
        raise HTTPException(413, "Файл слишком большой (max 8 МБ)")
    b64 = base64.b64encode(content).decode()
    doc = {
        "id": str(uuid.uuid4()),
        "filename": file.filename,
        "content_type": file.content_type,
        "size": len(content),
        "data_url": f"data:{file.content_type};base64,{b64}",
        "owner_id": user["id"],
        "created_at": now_iso(),
    }
    await db.files.insert_one(doc)
    return {"id": doc["id"], "data_url": doc["data_url"], "filename": doc["filename"], "size": doc["size"]}


# ================== KPI / Dashboard ==================
@api.get("/dashboard/summary")
async def dashboard(user=Depends(current_user)):
    materials = await db.materials.find({}, {"_id": 0}).to_list(2000)
    orders = await db.orders.find({}, {"_id": 0}).to_list(2000)
    leads = await db.leads.find({}, {"_id": 0}).to_list(2000)
    budget = await db.budget.find({}, {"_id": 0}).to_list(2000)
    customers_count = await db.customers.count_documents({})
    employees_count = await db.users.count_documents({})
    departments_count = await db.departments.count_documents({})

    stock_value = sum(float(m.get("price", 0)) * float(m.get("quantity", 0)) for m in materials)
    low_stock = [m for m in materials if float(m.get("quantity", 0)) < float(m.get("min_stock", 0) or 0)]
    balance = sum(float(b.get("amount", 0)) if b.get("type") == "income" else -float(b.get("amount", 0)) for b in budget)
    income = sum(float(b.get("amount", 0)) for b in budget if b.get("type") == "income")
    expense = sum(float(b.get("amount", 0)) for b in budget if b.get("type") == "expense")
    active_orders = [o for o in orders if o.get("status") in (None, "new", "in_progress", "production")]
    hot_leads = [l for l in leads if l.get("status") in ("new", "hot", "negotiation")]

    return {
        "kpis": {
            "stock_value": round(stock_value, 2),
            "balance": round(balance, 2),
            "income": round(income, 2),
            "expense": round(expense, 2),
            "active_orders": len(active_orders),
            "total_orders": len(orders),
            "hot_leads": len(hot_leads),
            "total_leads": len(leads),
            "customers": customers_count,
            "employees": employees_count,
            "departments": departments_count,
            "low_stock": len(low_stock),
        },
        "recent_orders": sorted(orders, key=lambda x: x.get("created_at", ""), reverse=True)[:6],
        "recent_leads": sorted(leads, key=lambda x: x.get("created_at", ""), reverse=True)[:6],
        "low_stock_items": low_stock[:6],
        "budget_timeline": sorted(budget, key=lambda x: x.get("date", x.get("created_at", "")))[-30:],
    }


# ================== AI Assistant (GigaChat / Emergent fallback) ==================
_gc_token: Dict[str, Any] = {"value": None, "expires": 0}


async def gigachat_token() -> Optional[str]:
    key = os.environ.get("GIGACHAT_AUTH_KEY", "").strip()
    if not key:
        return None
    if _gc_token["value"] and time.time() < _gc_token["expires"] - 60:
        return _gc_token["value"]
    try:
        async with httpx.AsyncClient(timeout=20, verify=False) as c:
            r = await c.post(
                "https://ngw.devices.sberbank.ru:9443/api/v2/oauth",
                headers={
                    "Authorization": f"Basic {key}",
                    "RqUID": str(uuid.uuid4()),
                    "Accept": "application/json",
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                data={"scope": os.environ.get("GIGACHAT_SCOPE", "GIGACHAT_API_PERS")},
            )
            r.raise_for_status()
            data = r.json()
            _gc_token["value"] = data["access_token"]
            _gc_token["expires"] = data.get("expires_at", int(time.time()) + 1800) / (1000 if data.get("expires_at", 0) > 10**12 else 1)
            return _gc_token["value"]
    except Exception as e:
        logger.warning(f"GigaChat token error: {e}")
        return None


async def gigachat_chat(message: str, history: List[Dict[str, str]]) -> Optional[str]:
    tok = await gigachat_token()
    if not tok:
        return None
    try:
        messages = [{"role": "system", "content": "Ты корпоративный AI-ассистент завода по производству промышленных вентиляторов FanOps. Помогай сотрудникам — отвечай кратко и по делу на русском языке."}]
        messages.extend(history[-8:])
        messages.append({"role": "user", "content": message})
        base = os.environ.get("GIGACHAT_BASE_URL", "https://gigachat.devices.sberbank.ru/api/v1")
        async with httpx.AsyncClient(timeout=60, verify=False) as c:
            r = await c.post(
                f"{base}/chat/completions",
                headers={"Authorization": f"Bearer {tok}", "Content-Type": "application/json"},
                json={"model": os.environ.get("GIGACHAT_MODEL", "GigaChat"), "messages": messages, "stream": False},
            )
            r.raise_for_status()
            return r.json()["choices"][0]["message"]["content"]
    except Exception as e:
        logger.warning(f"GigaChat error: {e}")
        return None


async def emergent_llm_chat(message: str, history: List[Dict[str, str]]) -> Optional[str]:
    """Fallback: use Emergent LLM key (Claude) via emergentintegrations."""
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        key = os.environ.get("EMERGENT_LLM_KEY", "").strip()
        if not key:
            return None
        session_id = f"fanops-{uuid.uuid4().hex[:8]}"
        chat = LlmChat(
            api_key=key,
            session_id=session_id,
            system_message="Ты корпоративный AI-ассистент завода промышленных вентиляторов FanOps. Отвечай на русском кратко и по делу.",
        ).with_model("openai", "gpt-4o-mini")
        resp = await chat.send_message(UserMessage(text=message))
        return resp
    except Exception as e:
        logger.warning(f"Emergent LLM error: {e}")
        return None


class ChatIn(BaseModel):
    message: str
    history: Optional[List[Dict[str, str]]] = []


@api.post("/assistant/chat")
async def assistant_chat(data: ChatIn, user=Depends(current_user)):
    # Try GigaChat first
    text = await gigachat_chat(data.message, data.history or [])
    provider = "GigaChat"
    if not text:
        text = await emergent_llm_chat(data.message, data.history or [])
        provider = "Emergent LLM (fallback)"
    if not text:
        text = "AI-ассистент временно недоступен. Проверьте ключ GIGACHAT_AUTH_KEY в настройках."
        provider = "offline"
    # save history
    await db.chat_history.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "user_message": data.message,
        "assistant_response": text,
        "provider": provider,
        "created_at": now_iso(),
    })
    return {"text": text, "provider": provider}


@api.get("/assistant/history")
async def assistant_history(user=Depends(current_user)):
    items = await db.chat_history.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).limit(50).to_list(50)
    return list(reversed(items))


# ================== Health ==================
@api.get("/")
async def root():
    return {"service": "FanOps ERP", "status": "ok"}


app.include_router(api)

# The frontend and API are served by the same Render service.
# CORS is only needed when developing the frontend separately.
cors_origins = [x.strip() for x in os.environ.get("CORS_ORIGINS", "").split(",") if x.strip()]
if cors_origins:
    app.add_middleware(
        CORSMiddleware,
        allow_credentials=True,
        allow_origins=cors_origins,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Serve the production React build from the same FastAPI process.
# This removes the need for a separate Render Static Site.
FRONTEND_DIR = ROOT_DIR.parent / "frontend" / "build"
INDEX_FILE = FRONTEND_DIR / "index.html"

@app.get("/{path:path}")
async def frontend(path: str):
    if not INDEX_FILE.exists():
        return {
            "service": "FanOps ERP",
            "status": "ok",
            "message": "Frontend build not found. Run: cd frontend && npm run build"
        }

    requested = (FRONTEND_DIR / path).resolve()

    # Prevent path traversal and serve existing static files directly.
    try:
        requested.relative_to(FRONTEND_DIR.resolve())
    except ValueError:
        return FileResponse(INDEX_FILE)

    if requested.is_file():
        return FileResponse(requested)

    # React Router routes (/, /orders, /profile, etc.) all receive index.html.
    return FileResponse(INDEX_FILE)
