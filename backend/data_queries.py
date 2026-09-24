"""Row fetches from the provided database. Read-only; money stays Decimal (rule R3).

NOTE: this is the shared data layer — Vishnu owns it from here. It exists so the
AI endpoints work end to end now; extend it rather than writing a second copy.
"""
import math, sqlite3
from datetime import date, datetime
from decimal import Decimal
from ai.config import DB_PATH


def connect():
    con = sqlite3.connect(f"file:{DB_PATH}?mode=ro", uri=True)
    con.row_factory = sqlite3.Row
    return con


def haversine(lat1, lng1, lat2, lng2):
    r, p = 6371.0, math.radians
    a = (math.sin(p(lat2 - lat1) / 2) ** 2
         + math.cos(p(lat1)) * math.cos(p(lat2)) * math.sin(p(lng2 - lng1) / 2) ** 2)
    return 2 * r * math.asin(math.sqrt(a))


def nearest_city(lat, lng):
    """Resolved from all 60 rows — no city id is hardcoded anywhere in the app."""
    con = connect()
    rows = con.execute("SELECT city_id, name, lat, lng, season_profile, peak_months, "
                       "primary_language, timezone FROM cities").fetchall()
    con.close()
    best = min(rows, key=lambda r: haversine(lat, lng, r["lat"], r["lng"]))
    return {**dict(best), "distance_km": round(haversine(lat, lng, best["lat"], best["lng"]), 2)}


def weather(city_id, today):
    con = connect()
    rows = con.execute("SELECT * FROM weather_daily WHERE city_id=? AND for_date IN (?, date(?,'+1 day')) "
                       "ORDER BY for_date", (city_id, today, today)).fetchall()
    con.close()
    return [dict(r) for r in rows]


def events(city_id, today):
    con = connect()
    cur = con.execute("SELECT * FROM events_festivals WHERE city_id=? AND status='active' "
                      "AND start_date<=? AND end_date>=? ORDER BY start_date", (city_id, today, today)).fetchall()
    up = con.execute("SELECT * FROM events_festivals WHERE city_id=? AND status='active' "
                     "AND start_date>? ORDER BY start_date LIMIT 2", (city_id, today)).fetchall()
    con.close()
    return [dict(r) for r in cur], [dict(r) for r in up]


def advisories(city_id, now=None):
    """Validity is compared as datetimes with offsets (rule R4), not as strings."""
    now = now or datetime.now().astimezone()
    con = connect()
    rows = con.execute("SELECT * FROM safety_advisories WHERE city_id=? AND status='active'", (city_id,)).fetchall()
    con.close()
    out = []
    for r in rows:
        try:
            if datetime.fromisoformat(r["valid_from"]) <= now <= datetime.fromisoformat(r["valid_to"]):
                out.append(dict(r))
        except (TypeError, ValueError):
            continue
    return out


def pois(city_id, lat=None, lng=None, limit=10):
    con = connect()
    rows = con.execute("SELECT * FROM activities_poi WHERE city_id=? AND status='active'", (city_id,)).fetchall()
    con.close()
    out = []
    for r in rows:
        d = dict(r)
        d["entry_cost"] = str(Decimal(str(r["entry_cost"])))      # money as a string + currency
        if lat is not None:
            d["distance_km"] = round(haversine(lat, lng, r["lat"], r["lng"]), 2)
        out.append(d)
    if lat is not None:
        out.sort(key=lambda d: d["distance_km"])
    return out[:limit]


def hotels(city_id, limit=5):
    con = connect()
    rows = con.execute("SELECT * FROM hotels WHERE city_id=? AND status='active' "
                       "ORDER BY guest_score DESC LIMIT ?", (city_id, limit)).fetchall()
    con.close()
    return [dict(r) for r in rows]


def languages_for(city_id):
    """English, Hindi, and the city's own primary language — read from the data (rule R6)."""
    con = connect()
    primary = con.execute("SELECT primary_language FROM cities WHERE city_id=?", (city_id,)).fetchone()[0]
    wanted = list(dict.fromkeys(["en-IN", "hi", primary]))
    q = f"SELECT bcp47, english_name, tts_supported FROM languages WHERE bcp47 IN ({','.join('?' * len(wanted))})"
    rows = con.execute(q, wanted).fetchall()
    con.close()
    order = {b: i for i, b in enumerate(wanted)}
    return sorted([dict(r) for r in rows], key=lambda r: order[r["bcp47"]])
