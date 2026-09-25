"""What changes when the trip date moves: the Date-Shift criterion as a diff.

Both dates are recomputed from the database the same way the briefing is: events on the
date, the weather row, the season and peak months, advisories valid at noon, and places
closed on that weekday. Only the differences are returned. Every line cites the rows it
compared, so the UI can open them. No model is involved.
"""
from datetime import date, datetime
from decimal import Decimal

from . import data_queries as dq

WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]


def _num(v):
    return Decimal(str(v)) if v is not None else None


def _words(v):
    return str(v or "").replace("_", " ")


def _short(d):
    """2026-10-17 -> 'Sat 17 Oct', for lines that name a weekday."""
    x = date.fromisoformat(d)
    return f"{WEEKDAYS[x.weekday()]} {x.day} {x.strftime('%b')}"


def _span(start, end):
    """'17–22 Oct', or '28 Sep – 3 Oct' across a month."""
    a, b = date.fromisoformat(start), date.fromisoformat(end)
    if (a.year, a.month) == (b.year, b.month):
        return f"{a.day}–{b.day} {b.strftime('%b')}"
    return f"{a.day} {a.strftime('%b')} – {b.day} {b.strftime('%b')}"


def _change(kind, change, text, labels):
    return {"kind": kind, "change": change, "text": text, "source_labels": labels}


def _snapshot(city_id, d):
    cur, _ = dq.events(city_id, d)
    season, peak = dq.season_for(city_id, d)
    weather = next((w for w in dq.weather(city_id, d) if w["for_date"] == d), None)
    noon = datetime.fromisoformat(f"{d}T12:00:00+05:30")
    closed = [p for p in dq.pois(city_id, limit=1000, for_date=d) if p["closed_today"]]
    return {"events": cur, "season": season, "peak": peak, "weather": weather,
            "advisories": dq.advisories(city_id, noon), "closed": closed}


def _weather_changes(a, b):
    if not a or not b:
        return []
    la, lb = f"weather_daily / {a['weather_id']}", f"weather_daily / {b['weather_id']}"
    out = []
    if a["condition"] != b["condition"]:
        out.append(_change("weather", "changed", f"Sky: {_words(a['condition'])} → {_words(b['condition'])}",
                           [f"{lb} (condition)", f"{la} (condition)"]))
    ra, rb = _num(a["precipitation_mm"]), _num(b["precipitation_mm"])
    if abs(ra - rb) >= 2:
        out.append(_change("weather", "up" if rb > ra else "down", f"Rain: {ra} mm → {rb} mm",
                           [f"{lb} (precipitation_mm)", f"{la} (precipitation_mm)"]))
    ta, tb = _num(a["temp_max_c"]), _num(b["temp_max_c"])
    if abs(ta - tb) >= 1:
        out.append(_change("weather", "up" if tb > ta else "down", f"Daytime high: {ta} °C → {tb} °C",
                           [f"{lb} (temp_max_c)", f"{la} (temp_max_c)"]))
    ha, hb = int(a["humidity_pct"]), int(b["humidity_pct"])
    if abs(ha - hb) >= 10:
        out.append(_change("weather", "up" if hb > ha else "down", f"Humidity: {ha}% → {hb}%",
                           [f"{lb} (humidity_pct)", f"{la} (humidity_pct)"]))
    if bool(a.get("is_extreme")) != bool(b.get("is_extreme")):
        out.append(_change("weather", "added" if b.get("is_extreme") else "removed",
                           "Flagged as extreme weather" if b.get("is_extreme") else "No longer flagged as extreme weather",
                           [f"{lb} (is_extreme)", f"{la} (is_extreme)"]))
    return out


def compare(city_id, from_date, to_date):
    """The differences between two dates in one city, each citing the rows compared."""
    from_date, _ = dq.clamp_date(city_id, from_date)
    to_date, _ = dq.clamp_date(city_id, to_date)
    con = dq.connect()
    city = con.execute("SELECT name FROM cities WHERE city_id=?", (city_id,)).fetchone()
    con.close()
    name = city["name"] if city else city_id
    a, b = _snapshot(city_id, from_date), _snapshot(city_id, to_date)
    changes = []

    ids_a = {e["event_id"] for e in a["events"]}
    ids_b = {e["event_id"] for e in b["events"]}
    for e in b["events"]:
        if e["event_id"] not in ids_a:
            changes.append(_change("event", "added", f"{e['name']} is on ({_span(e['start_date'], e['end_date'])})",
                                   [f"events_festivals / {e['event_id']}"]))
    for e in a["events"]:
        if e["event_id"] not in ids_b:
            ended = e["end_date"] < to_date
            when = _short(e["end_date"] if ended else e["start_date"])
            changes.append(_change("event", "removed",
                                   f"{e['name']} is over (ended {when})" if ended
                                   else f"{e['name']} hasn't started yet (starts {when})",
                                   [f"events_festivals / {e['event_id']}"]))

    if a["peak"] != b["peak"]:
        changes.append(_change("season", "added" if b["peak"] else "removed",
                               "Peak travel season: expect more visitors and higher prices" if b["peak"]
                               else "Out of peak travel season",
                               [f"cities / {name} (peak_months)"]))
    if a["season"] != b["season"]:
        labels = [f"weather_daily / {w['weather_id']} (season)" for w in (b["weather"], a["weather"]) if w]
        changes.append(_change("season", "changed", f"Season: {_words(a['season'])} → {_words(b['season'])}",
                               labels or [f"cities / {name} (season_profile)"]))

    changes += _weather_changes(a["weather"], b["weather"])

    adv_a = {x["advisory_id"] for x in a["advisories"]}
    adv_b = {x["advisory_id"] for x in b["advisories"]}
    for x in b["advisories"]:
        if x["advisory_id"] not in adv_a:
            changes.append(_change("advisory", "added", f"Advisory now in effect: {x['title']} ({x['level']} level)",
                                   [f"safety_advisories / {x['advisory_id']}"]))
    for x in a["advisories"]:
        if x["advisory_id"] not in adv_b:
            changes.append(_change("advisory", "removed", f"Advisory no longer in effect: {x['title']}",
                                   [f"safety_advisories / {x['advisory_id']}"]))

    shut_a = {p["poi_id"] for p in a["closed"]}
    shut_b = {p["poi_id"] for p in b["closed"]}
    newly = [p for p in b["closed"] if p["poi_id"] not in shut_a]
    reopened = [p for p in a["closed"] if p["poi_id"] not in shut_b]
    if newly:
        changes.append(_change("closure", "added",
                               f"Closed on {_short(to_date)}: {', '.join(p['name'] for p in newly[:4])}"
                               + (f" and {len(newly) - 4} more" if len(newly) > 4 else ""),
                               [f"activities_poi / {p['poi_id']} (closed_days)" for p in newly]))
    if reopened:
        changes.append(_change("closure", "removed",
                               f"Open again on {_short(to_date)}: {', '.join(p['name'] for p in reopened[:4])}"
                               + (f" and {len(reopened) - 4} more" if len(reopened) > 4 else ""),
                               [f"activities_poi / {p['poi_id']} (closed_days)" for p in reopened]))

    return {"city_id": city_id, "city": name, "from": from_date, "to": to_date,
            "from_label": _short(from_date), "to_label": _short(to_date), "changes": changes}
