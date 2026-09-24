"""All endpoints. Every one takes the city and the briefing date as parameters —
no city and no date is ever hardcoded."""
import os
from datetime import date
from fastapi import APIRouter, Query
from pydantic import BaseModel

from ai import config
from ai.briefing import build as build_briefing
from ai.pipeline import answer_question
from . import data_queries as dq
from .ranker import opens_earliest, rank, why_not

router = APIRouter()


def default_date():
    return os.getenv("DEMO_DATE") or date.today().isoformat()


def city_name(city_id):
    con = dq.connect()
    row = con.execute("SELECT name FROM cities WHERE city_id=?", (city_id,)).fetchone()
    con.close()
    return row["name"] if row else None


def _as_dt(for_date):
    """Advisory validity is compared against noon on the briefing date, so moving the
    date also moves which advisories are in effect."""
    from datetime import datetime
    return datetime.fromisoformat(f"{for_date}T12:00:00+05:30")


def briefing_context(city_id, name, for_date):
    """Everything the briefing is grounded in, all recomputed for `for_date`."""
    cur, up = dq.events(city_id, for_date)
    season, peak = dq.season_for(city_id, for_date)
    return {"weather": dq.weather(city_id, for_date),
            "events_current": cur, "events_upcoming": up,
            "advisories": dq.advisories(city_id, _as_dt(for_date)),
            "attractions": dq.pois(city_id, limit=5, for_date=for_date, open_only=True),
            "season": season, "peak_season": peak}, cur, up, season, peak


def _open_at(poi, hhmm):
    """Open at a clock time, treating a missing closing time as open-ended."""
    if poi.get("closed_today") or not poi.get("opens_at"):
        return False
    m = lambda t: int(str(t)[:2]) * 60 + int(str(t)[3:5])
    now = m(hhmm)
    return m(poi["opens_at"]) <= now < (m(poi["closes_at"]) if poi.get("closes_at") else 24 * 60)


@router.get("/context")
def context(lat: float, lng: float, for_date: str = None, at: str = None):
    """Place, date, season — plus the composed "here, now" the first screen shows.
    Every element carries the table it came from, so the hero is as sourced as the briefing."""
    from datetime import datetime
    city = dq.nearest_city(lat, lng)
    cid = city["city_id"]
    d, rng = dq.clamp_date(cid, for_date or default_date())
    at = at or datetime.now().strftime("%H:%M")
    w = dq.weather(cid, d)
    season, peak = dq.season_for(cid, d)
    cur, up = dq.events(cid, d)
    adv = dq.advisories(cid, _as_dt(d))
    pois = dq.pois(cid, lat, lng, limit=30, for_date=d)
    open_now = [p for p in pois if _open_at(p, at)]
    return {"city": city, "date": d, "at": at, "season": season, "peak_season": peak,
            "date_range": rng, "weather_today": w[0] if w else None,
            "languages": dq.languages_for(cid),
            "grounding_enabled": config.GROUNDING_ENABLED,
            "now": {
                "events": [{"name": e["name"], "start_date": e["start_date"], "end_date": e["end_date"],
                            "source_label": f"events_festivals / {city['name']}"} for e in cur],
                "next_event": ({"name": up[0]["name"], "start_date": up[0]["start_date"],
                                "source_label": f"events_festivals / {city['name']}"} if up else None),
                "advisory": ({"level": adv[0]["level"], "type": adv[0]["advisory_type"],
                              "title": adv[0]["title"],
                              "source_label": f"safety_advisories / {city['name']}"} if adv else None),
                "weather_source": f"weather_daily / {city['name']}",
                "open_count": len(open_now),
                "nearest_open": ({"name": open_now[0]["name"], "distance_km": open_now[0]["distance_km"],
                                  "closes_at": open_now[0]["closes_at"],
                                  "entry_cost": open_now[0]["entry_cost"], "currency": open_now[0]["currency"],
                                  "source_label": "activities_poi"} if open_now else None)
            }}


@router.get("/dates")
def dates(city_id: str):
    """Feeds the date-shift control: the dataset's range and the weeks that have events."""
    return {"range": dq.date_range(city_id), "today": default_date(),
            "events": dq.event_days(city_id)}


@router.get("/briefing")
def briefing(city_id: str, lang: str = "en-IN", for_date: str = None, fresh: bool = False):
    name = city_name(city_id)
    d, rng = dq.clamp_date(city_id, for_date or default_date())
    ctx, cur, up, season, peak = briefing_context(city_id, name, d)
    sections = build_briefing(city_id, name, d, ctx, lang, use_cache=not fresh)
    adv = ctx["advisories"]
    return {"city_id": city_id, "city": name, "date": d, "date_range": rng, "language": lang,
            "season": season, "peak_season": peak,
            "time_state": "on_now" if cur else ("upcoming" if up else "none"),
            "events_today": [{"name": e["name"], "start_date": e["start_date"], "end_date": e["end_date"]} for e in cur],
            "next_event": ({"name": up[0]["name"], "start_date": up[0]["start_date"]} if up else None),
            "advisory_state": adv[0]["level"] if adv else "none",
            "grounding_enabled": config.GROUNDING_ENABLED,
            "sections": sections}


class Ask(BaseModel):
    question: str
    city_id: str
    lang: str = "en-IN"
    session_id: str | None = None


@router.post("/ask")
def ask(body: Ask):
    return answer_question(body.question, body.city_id, body.lang, session_id=body.session_id)


@router.get("/nearby")
def nearby(city_id: str, lat: float = None, lng: float = None, for_date: str = None):
    d, _ = dq.clamp_date(city_id, for_date or default_date())
    return {"date": d, "pois": dq.pois(city_id, lat, lng, limit=8, for_date=d),
            "hotels": dq.hotels(city_id)}


@router.get("/now")
def now(city_id: str, lat: float = None, lng: float = None, at: str = "15:00",
        for_date: str = None, budget: float = None, window: int = 90):
    d, _ = dq.clamp_date(city_id, for_date or default_date())
    pois = dq.pois(city_id, lat, lng, limit=30, for_date=d)
    picks = rank(pois, at, d, budget=budget, window=window)
    out = {"date": d, "at": at, "window_minutes": window, "picks": picks,
           "budget": budget, "city_id": city_id}
    if not picks:
        # Nothing open is a real answer. Say which field ruled each place out,
        # and what opens earliest, so the screen is informative rather than blank.
        near = sorted(pois, key=lambda p: p["distance_km"])[:4]
        out["excluded"] = [{"name": p["name"], "distance_km": p["distance_km"],
                            "reason": why_not(p, at, window, budget),
                            "source_label": "activities_poi"} for p in near]
        out["opens_earliest"] = opens_earliest(pois)
    return out


@router.get("/grounding")
def grounding(enabled: bool = Query(None)):
    """Demo switch. enabled=false empties retrieval, so every answer refuses at layer 1."""
    if enabled is not None:
        config.GROUNDING_ENABLED = enabled
    return {"grounding_enabled": config.GROUNDING_ENABLED}
