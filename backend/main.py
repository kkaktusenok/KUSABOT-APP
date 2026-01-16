import os
import json
import psutil
import httpx
from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# ===============================
# Paths & storage
# ===============================

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)

MODELS_CONFIG = DATA_DIR / "models.json"

# Реальное имя модели Ollama (ВАЖНО: lowercase)
DEFAULT_MODEL = os.getenv("DEFAULT_MODEL", "llama3.2:1b")

# Создаём models.json, если его нет
if not MODELS_CONFIG.exists():
    with open(MODELS_CONFIG, "w", encoding="utf-8") as f:
        json.dump([DEFAULT_MODEL], f)

# ===============================
# App
# ===============================

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ===============================
# Schemas
# ===============================

class ChatRequest(BaseModel):
    prompt: str
    model: str

# ===============================
# System stats
# ===============================

@app.get("/system_stats")
async def system_stats():
    vmem = psutil.virtual_memory()
    proc = psutil.Process(os.getpid())

    return {
        "global": {
            "cpu": psutil.cpu_percent(interval=None),
            "ram_pct": vmem.percent,
            "ram_gb": f"{round(vmem.used / (1024**3), 1)}/{round(vmem.total / (1024**3), 1)} GB",
        },
        "app": {
            "cpu": proc.cpu_percent(interval=None),
            "ram_gb": f"{round(proc.memory_info().rss / (1024**3), 2)} GB",
        },
    }

# ===============================
# Models
# ===============================

@app.get("/models")
async def get_models():
    return [DEFAULT_MODEL]

# ===============================
# Generate (Ollama)
# ===============================

@app.post("/generate")
async def generate(request: ChatRequest):
    try:
        async with httpx.AsyncClient() as client:
            r = await client.post(
                "http://ollama-engine:11434/api/chat",
                json={
                    "model": request.model or DEFAULT_MODEL,
                    "messages": [
                        {"role": "user", "content": request.prompt}
                    ],
                    "stream": False,
                },
                timeout=120,
            )

        if r.status_code != 200:
            raise HTTPException(
                status_code=500,
                detail=f"Ollama error: {r.text}",
            )

        data = r.json()

        if "message" not in data or "content" not in data["message"]:
            raise HTTPException(
                status_code=500,
                detail="Invalid response from Ollama",
            )

        return {
            "response": data["message"]["content"]
        }

    except httpx.RequestError as e:
        raise HTTPException(status_code=503, detail=f"Ollama unavailable: {e}")

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ===============================
# Chats
# ===============================

@app.get("/get_chats")
async def get_chats():
    chats = []
    for f in DATA_DIR.glob("*.json"):
        if f.name == "models.json":
            continue
        with open(f, "r", encoding="utf-8") as file:
            chats.append(json.load(file))
    return sorted(chats, key=lambda x: x.get("id", 0), reverse=True)

@app.post("/save_chat")
async def save_chat(chat: dict):
    with open(DATA_DIR / f"{chat['id']}.json", "w", encoding="utf-8") as f:
        json.dump(chat, f, ensure_ascii=False, indent=2)
    return {"ok": True}

@app.delete("/delete_chat/{chat_id}")
async def delete_chat(chat_id: str):
    p = DATA_DIR / f"{chat_id.replace('.json', '')}.json"
    if p.exists():
        p.unlink()
        return {"ok": True}
    raise HTTPException(status_code=404, detail="Chat not found")
