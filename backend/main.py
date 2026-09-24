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
    return {"status": "ok" if db_ok and counts else "degraded", "db": db_ok, "index": counts,
            "llm_provider": config.LLM_PROVIDER, "grounding_enabled": config.GROUNDING_ENABLED}
