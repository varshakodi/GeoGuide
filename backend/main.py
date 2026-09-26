"""FastAPI app; the AI router is mounted here."""
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from ai import config
from . import data_queries as dq
from .ai_routes import router as ai_router

app = FastAPI(title="GeoGuide API")
# A deployed frontend is listed in ALLOWED_ORIGINS (comma-separated, e.g. the Render URL).
# Any host on the Vite dev ports stays allowed, so the app works on localhost and when
# opened over the LAN, without hardcoding one machine's IP.
ALLOWED_ORIGINS = [o.strip().rstrip("/") for o in os.getenv("ALLOWED_ORIGINS", "").split(",") if o.strip()]
app.add_middleware(CORSMiddleware, allow_origins=ALLOWED_ORIGINS, allow_origin_regex=r"https?://[^/]+:517[3-5]",
                   allow_methods=["*"], allow_headers=["*"])
app.include_router(ai_router)


@app.on_event("startup")
def warm_search_model():
    """Load the embedding model and the index in the background at startup. Loaded lazily,
    they made the first question after a restart take about 17 seconds longer."""
    import threading

    def warm():
        from ai.index import collections, embed
        embed(["warm up"])
        collections()
    threading.Thread(target=warm, daemon=True).start()


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
                    "anthropic_model": config.ANTHROPIC_MODEL if config.ANTHROPIC_API_KEY else None,
                    "gemini_keys": len(config.gemini_keys()),
                    "ollama_model": config.OLLAMA_MODEL or None, "ollama_reachable": ollama_up}}
