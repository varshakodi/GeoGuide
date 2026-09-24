"""FastAPI app. Vishnu owns this file; the AI router is mounted here."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from ai import config
from . import data_queries as dq
from .ai_routes import router as ai_router

app = FastAPI(title="GeoGuide API")
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
                   allow_methods=["*"], allow_headers=["*"])
app.include_router(ai_router)


@app.get("/health")
def health():
    try:
        con = dq.connect()
        cities = con.execute("SELECT count(*) FROM cities").fetchone()[0]
        con.close()
        db_ok = cities > 0
    except Exception:
        db_ok = False
    try:
        from ai.index import collections
        counts = {n: c.count() for n, c in collections().items()}
    except Exception:
        counts = {}
    ollama_up = False
    if config.OLLAMA_MODEL:
        try:
            import urllib.request
            urllib.request.urlopen(config.OLLAMA_URL.replace("/api/chat", "/api/tags"), timeout=2)
            ollama_up = True
        except Exception:
            ollama_up = False
    return {"status": "ok" if db_ok and counts else "degraded", "db": db_ok, "index": counts,
            "grounding_enabled": config.GROUNDING_ENABLED,
            "llm": {"provider": config.LLM_PROVIDER, "gemini_model": config.GEMINI_MODEL or None,
                    "gemini_keys": len(config.gemini_keys()),
                    "ollama_model": config.OLLAMA_MODEL or None, "ollama_reachable": ollama_up}}
