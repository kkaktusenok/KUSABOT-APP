from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from openai import AsyncOpenAI
import os
import json
from pathlib import Path

# 1. СНАЧАЛА СОЗДАЕМ APP
app = FastAPI(title="KUSABOT-OS API")

# 2. НАСТРОЙКИ ПУТЕЙ
DATA_DIR = Path("data")
DATA_DIR.mkdir(exist_ok=True)

# 3. НАСТРОЙКИ CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

VLLM_URL = os.getenv("VLLM_URL", "http://vllm-engine:8000/v1")
client = AsyncOpenAI(base_url=VLLM_URL, api_key="not-needed")

class ChatRequest(BaseModel):
    prompt: str

# --- ЭНДПОИНТЫ ДЛЯ ЧАТА ---

@app.get("/get_chats")
async def get_chats():
    chats = []
    for file in DATA_DIR.glob("*.json"):
        with open(file, "r", encoding="utf-8") as f:
            chats.append(json.load(f))
    chats.sort(key=lambda x: x.get('id', 0), reverse=True)
    return chats

@app.post("/save_chat")
async def save_chat(chat: dict):
    chat_id = chat.get("id")
    if not chat_id:
        return {"error": "No ID"}
    with open(DATA_DIR / f"{chat_id}.json", "w", encoding="utf-8") as f:
        json.dump(chat, f, ensure_ascii=False, indent=2)
    return {"status": "saved"}

@app.post("/generate")
async def generate(request: ChatRequest):
    try:
        response = await client.chat.completions.create(
            model="neuralmagic/Meta-Llama-3.1-8B-Instruct-FP8",
            messages=[{"role": "user", "content": request.prompt}],
            max_tokens=512,
            temperature=0.7
        )
        return {"response": response.choices[0].message.content}
    except Exception as e:
        return {"error": str(e)}