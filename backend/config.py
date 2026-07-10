import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

# Locally, this file lives at <project_root>/backend/config.py, so the project
# root (which contains data/) is one level up. In the deployed Docker image,
# backend/'s contents are copied flat into /app, so this file lives at
# /app/config.py and data/ is a sibling in the same directory. Detect which
# layout is on disk rather than assuming one, so the same code works in both.
_MODULE_DIR = Path(__file__).resolve().parent
if (_MODULE_DIR.parent / "data").exists():
    BASE_DIR = _MODULE_DIR.parent
else:
    BASE_DIR = _MODULE_DIR

OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "phi3:mini")
OLLAMA_FAST_MODEL = os.getenv("OLLAMA_FAST_MODEL", "tinyllama")
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")

LLM_PROVIDER = os.getenv("LLM_PROVIDER", "ollama").lower()
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
OPENROUTER_URL = os.getenv("OPENROUTER_URL", "https://openrouter.ai/api/v1/chat/completions")
OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "meta-llama/llama-3.3-70b-instruct:free")
OPENROUTER_FAST_MODEL = os.getenv("OPENROUTER_FAST_MODEL", OPENROUTER_MODEL)

DB_PATH = os.getenv("DB_PATH", "data/stocks.db")

DB_FULL_PATH = BASE_DIR / DB_PATH
DATABASE_URL = f"sqlite:///{DB_FULL_PATH}"

FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")
