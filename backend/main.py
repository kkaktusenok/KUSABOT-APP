# backend/main.py
import os
import json
import psutil
from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from openai import AsyncOpenAI

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)

# Путь к списку моделей
MODELS_CONFIG = DATA_DIR / "models.json"

# Если файла нет, создаем его с твоей текущей моделью
with open(MODELS_CONFIG, "w", encoding="utf-8") as f:
    json.dump(["unsloth/Llama-3.2-1B-Instruct"], f)

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

# Инициализация клиента OpenAI для работы с vLLM
client = AsyncOpenAI(base_url=os.getenv("VLLM_URL", "http://vllm-engine:8000/v1"), api_key="not-needed")

class ChatRequest(BaseModel):
    prompt: str
    model: str

@app.get("/system_stats")
async def system_stats():
    # Мониторинг CPU и RAM
    vmem = psutil.virtual_memory()
    proc = psutil.Process(os.getpid())
    return {
        "global": {
            "cpu": psutil.cpu_percent(interval=None),
            "ram_pct": vmem.percent,
            "ram_gb": f"{round(vmem.used/(1024**3), 1)}/{round(vmem.total/(1024**3), 1)} GB"
        },
        "app": {
            "cpu": proc.cpu_percent(interval=None),
            "ram_gb": f"{round(proc.memory_info().rss/(1024**3), 2)} GB"
        }
    }

@app.get("/models")
async def get_models():
    # Просто читаем список из JSON
    with open(MODELS_CONFIG, "r", encoding="utf-8") as f:
        return json.load(f)

@app.post("/generate")
async def generate(request: ChatRequest):
    try:
        # Генерируем ответ, используя модель из дробдауна
        response = await client.chat.completions.create(
            model=request.model,
            messages=[{"role": "user", "content": request.prompt}]
        )
        return {"response": response.choices[0].message.content}
    except Exception as e:
        return {"error": str(e)}

@app.get("/get_chats")
async def get_chats():
    chats = []
    for f in DATA_DIR.glob("*.json"):
        if f.name == "models.json": continue
        with open(f, "r", encoding="utf-8") as file:
            chats.append(json.load(file))
    return sorted(chats, key=lambda x: x.get('id', 0), reverse=True)

@app.post("/save_chat")
async def save_chat(chat: dict):
    with open(DATA_DIR / f"{chat['id']}.json", "w", encoding="utf-8") as f:
        json.dump(chat, f, ensure_ascii=False, indent=2)
    return {"ok": True}

@app.delete("/delete_chat/{chat_id}")
async def delete_chat(chat_id: str):
    p = DATA_DIR / f"{chat_id.replace('.json','')}.json"
    if p.exists():
        p.unlink()
        return {"ok": True}
    raise HTTPException(404)