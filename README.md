# ⛩️ KUSABOT-APP (草ボット)

> **High-velocity local AI orchestrator for Linux.**  
> Run powerful open-source LLMs on your own hardware — no cloud, no API keys, no data leaving your machine.

![Stack](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)
![Stack](https://img.shields.io/badge/FastAPI-Python-009688?style=flat-square&logo=fastapi)
![Stack](https://img.shields.io/badge/vLLM-inference-blueviolet?style=flat-square)
![Stack](https://img.shields.io/badge/Docker-compose-2496ED?style=flat-square&logo=docker)
![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)

---

## 🧠 What is KUSABOT?

Most local AI tools are either too slow, too complex to set up, or just wrappers around cloud APIs.

KUSABOT is different. It's a **self-hosted AI chat platform** built for maximum inference speed using **vLLM** — the fastest open-source LLM serving engine. The entire stack runs in Docker and is accessible through a clean **Next.js 15** interface.

**You get:**
- 🔒 100% local — your data never leaves your machine
- ⚡ vLLM-powered inference — significantly faster than Ollama for high-throughput use cases
- 🐳 One command deploy — `docker-compose up` and you're running
- 🖥️ Modern chat UI with streaming responses

---

## 🛠️ Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Frontend | Next.js 15 (App Router), Tailwind CSS | Streaming-first architecture, fast UI |
| Backend | Python, FastAPI | Async, lightweight, pairs perfectly with vLLM |
| Inference | vLLM | PagedAttention for high throughput, much faster than naive inference |
| Deployment | Docker, Docker Compose | Single-command setup, zero dependency hell |
| OS | Linux (Ubuntu/Debian) | Native GPU passthrough support |

---

## ⚡ Why vLLM over Ollama?

| | vLLM | Ollama |
|---|---|---|
| Throughput | High (PagedAttention) | Moderate |
| Concurrent requests | Excellent | Limited |
| Production-ready | Yes | Mostly dev/personal |
| Setup complexity | Higher | Lower |

KUSABOT uses vLLM because it's built for **real workloads** — not just single-user experimentation.

---

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose installed
- NVIDIA GPU with CUDA support (recommended)
- Linux OS (Ubuntu 20.04+ / Debian 11+)

### 1. Clone the repo
```bash
git clone https://github.com/kkaktusenok/KUSABOT-APP.git
cd KUSABOT-APP
```

### 2. Configure your model
Edit `docker-compose.yml` and set the model you want to run:
```yaml
environment:
  - MODEL_NAME=mistralai/Mistral-7B-Instruct-v0.2
```

### 3. Launch
```bash
docker-compose up
```

### 4. Open the UI
Navigate to `http://localhost:3000` — that's it.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────┐
│              Browser                    │
│         Next.js 15 Frontend             │
│    (Streaming chat UI, App Router)      │
└──────────────┬──────────────────────────┘
               │ HTTP / SSE streaming
┌──────────────▼──────────────────────────┐
│           FastAPI Backend               │
│     (Request handling, streaming)       │
└──────────────┬──────────────────────────┘
               │ OpenAI-compatible API
┌──────────────▼──────────────────────────┐
│           vLLM Engine                   │
│  (PagedAttention, GPU inference)        │
│       Model: your choice                │
└─────────────────────────────────────────┘
         All running in Docker
```

---

## 📁 Project Structure

```
KUSABOT-APP/
├── frontend/          # Next.js 15 app
│   ├── app/           # App Router pages
│   └── components/    # Chat UI components
├── backend/           # FastAPI server
│   ├── main.py        # Entry point, routes
│   └── inference.py   # vLLM integration
├── docker-compose.yml # Full stack definition
└── README.md
```

---

## 🔧 Configuration

Key environment variables in `docker-compose.yml`:

| Variable | Default | Description |
|---|---|---|
| `MODEL_NAME` | `mistralai/Mistral-7B-Instruct-v0.2` | HuggingFace model to load |
| `MAX_MODEL_LEN` | `4096` | Maximum context length |
| `TENSOR_PARALLEL_SIZE` | `1` | Number of GPUs to use |
| `FRONTEND_PORT` | `3000` | UI port |

---

## 🧹 Cleanup

```bash
docker-compose down
```

To remove downloaded model weights as well:
```bash
docker-compose down -v
```

---

## 📄 License

MIT — do whatever you want with it.

---

*Built by [kkaktusenok](https://github.com/kkaktusenok)*
