"""Disk cache for generated briefings.

A briefing is five LLM calls. Two rehearsals plus the live demo across three cities
is 45 calls, which is most of a free-tier day, and every call adds seconds on stage.
Cached briefings are deterministic and instant. The key includes the model and the
grounding flag, so a cache entry can never mask a config change.
"""
import hashlib, json, time
from pathlib import Path
from . import config

DIR = Path(config.CHROMA_PATH).parent / ".cache" / "briefings"


def key(city_id, lang, today):
    raw = f"v2|{city_id}|{lang}|{today}|{config.GEMINI_MODEL}|{config.LLM_PROVIDER}|{config.GROUNDING_ENABLED}"
    return hashlib.sha256(raw.encode()).hexdigest()[:16]


def get(city_id, lang, today):
    f = DIR / f"{key(city_id, lang, today)}.json"
    if not f.exists():
        return None
    try:
        return json.loads(f.read_text(encoding="utf-8"))["sections"]
    except Exception:
        return None


def put(city_id, lang, today, sections):
    """Only cache a complete briefing — never one with a refusal or an LLM error in it."""
    if any(s.get("type") != "answer" or s.get("extractive") for s in sections.values()):
        return False
    DIR.mkdir(parents=True, exist_ok=True)
    (DIR / f"{key(city_id, lang, today)}.json").write_text(
        json.dumps({"city_id": city_id, "lang": lang, "date": today,
                    "cached_at": time.strftime("%Y-%m-%dT%H:%M:%S"), "sections": sections},
                   ensure_ascii=False, indent=1), encoding="utf-8")
    return True


def clear():
    n = 0
    for f in DIR.glob("*.json"):
        f.unlink(); n += 1
    return n
