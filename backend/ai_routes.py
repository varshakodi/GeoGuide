"""AI-facing endpoints. Mount this router in the FastAPI app."""
from datetime import date, datetime
from fastapi import APIRouter, Query
from pydantic import BaseModel

from ai import config
from ai.briefing import build as build_briefing
from ai.pipeline import answer_question
from . import data_queries as dq

router = APIRouter()


def today_str():
    return config_today() or date.today().isoformat()


def config_today():
    import os
    return os.getenv("DEMO_DATE") or None


@router.get("/context")
def context(lat: float, lng: float):
    city = dq.nearest_city(lat, lng)
    today = today_str()
    w = dq.weather(city["city_id"], today)
    return {"city": city, "date": today, "season": city["season_profile"],
            "weather_today": w[0] if w else None,
            "languages": dq.languages_for(city["city_id"]),
            "grounding_enabled": config.GROUNDING_ENABLED}


@router.get("/briefing")
def briefing(city_id: str, lang: str = "en-IN"):
    today = today_str()
    con = dq.connect()
    name = con.execute("SELECT name FROM cities WHERE city_id=?", (city_id,)).fetchone()["name"]
    con.close()
    cur, up = dq.events(city_id, today)
    ctx = {"weather": dq.weather(city_id, today), "events_current": cur,
           "events_upcoming": up, "advisories": dq.advisories(city_id)}
    sections = build_briefing(city_id, name, today, ctx, lang)
    return {"city_id": city_id, "city": name, "date": today, "language": lang,
            "time_state": "on_now" if cur else ("upcoming" if up else "none"),
            "advisory_state": (dq.advisories(city_id)[0]["level"] if dq.advisories(city_id) else "none"),
            "sections": sections}


class Ask(BaseModel):
    question: str
    city_id: str
    lang: str = "en-IN"


@router.post("/ask")
def ask(body: Ask):
    return answer_question(body.question, body.city_id, body.lang)


@router.get("/nearby")
def nearby(city_id: str, lat: float = None, lng: float = None):
    return {"pois": dq.pois(city_id, lat, lng), "hotels": dq.hotels(city_id)}


@router.get("/grounding")
def grounding(enabled: bool = Query(None)):
    """Demo switch. GET /grounding?enabled=false makes every answer refuse."""
    if enabled is not None:
        config.GROUNDING_ENABLED = enabled
    return {"grounding_enabled": config.GROUNDING_ENABLED}
