"""Configuration for the AI layer. Everything comes from the environment."""
import os
from pathlib import Path

try:
    from dotenv import load_dotenv
    load_dotenv(Path(__file__).resolve().parent.parent / ".env")
except ImportError:
    pass

ROOT = Path(__file__).resolve().parent.parent
DB_PATH = Path(os.getenv("DB_PATH", ROOT / "data-model" / "seed" / "PS-13.db"))
CHROMA_PATH = Path(os.getenv("CHROMA_PATH", ROOT / ".chroma"))

EMBED_MODEL = os.getenv("EMBED_MODEL", "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2")
RELEVANCE_THRESHOLD = float(os.getenv("RELEVANCE_THRESHOLD", "0.30"))
TOP_K = int(os.getenv("TOP_K", "4"))

LLM_PROVIDER = os.getenv("LLM_PROVIDER", "gemini")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "")
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434/api/chat")
# Live requests fail fast to the extractive fallback; prewarm can raise these to wait out quotas.
LLM_TIMEOUT_MS = int(os.getenv("LLM_TIMEOUT_MS", "30000"))
LLM_QUOTA_ROUNDS = int(os.getenv("LLM_QUOTA_ROUNDS", "2"))
LLM_QUOTA_WAIT = int(os.getenv("LLM_QUOTA_WAIT", "5"))

# Demo switch: when false, retrieval returns nothing and every answer refuses.
GROUNDING_ENABLED = os.getenv("GROUNDING_ENABLED", "true").lower() != "false"

SENTINEL = "INSUFFICIENT_GROUNDED_INFORMATION"
FLAG_CONFIDENCE = {"low"}          # decision D3
MAX_SENTENCES = int(os.getenv("MAX_SENTENCES", "3"))


def gemini_keys():
    return [k for k in (os.getenv("GEMINI_API_KEY"), os.getenv("GEMINI_API_KEY_2")) if k]
