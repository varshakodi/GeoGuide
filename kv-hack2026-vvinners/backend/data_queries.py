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


def date_range(city_id):
    """The dates the dataset actually covers, so the date-shift control can't leave it."""
    con = connect()
    r = con.execute("SELECT min(for_date) lo, max(for_date) hi FROM weather_daily WHERE city_id=?",
                    (city_id,)).fetchone()
    con.close()
    return {"min": r["lo"], "max": r["hi"]}


def clamp_date(city_id, for_date):
    rng = date_range(city_id)
    if not for_date:
        for_date = date.today().isoformat()
    return min(max(for_date, rng["min"]), rng["max"]), rng


def season_for(city_id, for_date):
    """Season for this date, from the weather row; falls back to the city's profile."""
    con = connect()
    r = con.execute("SELECT season FROM weather_daily WHERE city_id=? AND for_date=?",
                    (city_id, for_date)).fetchone()
    c = con.execute("SELECT season_profile, peak_months FROM cities WHERE city_id=?", (city_id,)).fetchone()
    con.close()
    season = (r["season"] if r and r["season"] else c["season_profile"])
    months = [m.strip() for m in str(c["peak_months"]).split(",") if m.strip()]
    peak = str(int(for_date[5:7])) in months
    return season, peak


def event_days(city_id):
    """Dates that have an event, so the UI can point the judge at a festival week."""
    con = connect()
    rows = con.execute("SELECT name, start_date, end_date FROM events_festivals "
                       "WHERE city_id=? AND status='active' ORDER BY start_date", (city_id,)).fetchall()
    con.close()
    return [dict(r) for r in rows]


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


def _weekday(for_date):
    """closed_days uses 0 = Monday, matching Python's weekday()."""
    return date.fromisoformat(for_date).weekday()


def is_closed_on(row, for_date):
    days = [d.strip() for d in str(row["closed_days"] or "").split(",") if d.strip() != ""]
    return str(_weekday(for_date)) in days


def pois(city_id, lat=None, lng=None, limit=10, for_date=None, open_only=False):
    con = connect()
    city = con.execute("SELECT lat, lng FROM cities WHERE city_id=?", (city_id,)).fetchone()
    rows = con.execute("SELECT * FROM activities_poi WHERE city_id=? AND status='active'", (city_id,)).fetchall()
    con.close()
    olat, olng = (lat, lng) if lat is not None else (city["lat"], city["lng"])
    out = []
    for r in rows:
        if for_date and open_only and is_closed_on(r, for_date):
            continue
        d = dict(r)
        d["entry_cost"] = str(Decimal(str(r["entry_cost"])))      # money as a string + currency (rule R3)
        d["distance_km"] = round(haversine(olat, olng, r["lat"], r["lng"]), 2)
        d["closed_today"] = bool(for_date and is_closed_on(r, for_date))
        out.append(d)
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
