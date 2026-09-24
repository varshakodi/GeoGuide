"""Date-shift facts: events, season, weather and weather tips for one city and date.

Deterministic — no model is involved — so the Date-Shift criterion holds even when
the LLM is slow or unreachable. Every item names the exact row it came from
(events_festivals.event_id, weather_daily.weather_id, safety_advisories.advisory_id),
and a date with no events says so plainly instead of naming a festival.
"""
from decimal import Decimal

from ai.passages import human_date


def _num(v):
    return Decimal(str(v)) if v is not None else None


def weather_tips(row):
    """Tips derived from one weather_daily row. Each cites the row and the field it read."""
    if not row:
        return []
    src = f"weather_daily / {row['weather_id']}"
    tmax, tmin = _num(row["temp_max_c"]), _num(row["temp_min_c"])
    rain, hum = _num(row["precipitation_mm"]), int(row["humidity_pct"])
    tips = []
    if rain >= 10 or row["condition"] == "heavy_rain":
        tips.append((f"Heavy rain expected ({rain} mm): carry a rain jacket, wear shoes that grip, "
                     "and keep indoor options ready.", "precipitation_mm"))
    elif rain > 0 or row["condition"] == "light_rain":
        tips.append((f"Some rain likely ({rain} mm): pack a compact umbrella.", "precipitation_mm"))
    else:
        tips.append(("No rain recorded for this date: outdoor sights are a good bet.", "precipitation_mm"))
    if tmax >= 33:
        tips.append((f"Hot, up to {tmax} °C: wear loose cotton, carry water, and plan outdoor visits "
                     "for morning or evening.", "temp_max_c"))
    elif tmax >= 28:
        tips.append((f"Warm afternoon, up to {tmax} °C: light breathable clothes and sunscreen.", "temp_max_c"))
    if tmin <= 15:
        tips.append((f"Cool at night, down to {tmin} °C: bring a light layer for the evening.", "temp_min_c"))
    if hum >= 80:
        tips.append((f"Humid ({hum}%): quick-dry fabrics are more comfortable than denim.", "humidity_pct"))
    if row["condition"] == "haze":
        tips.append(("Hazy air: consider a mask for long stretches outdoors.", "condition"))
    if row.get("is_extreme"):
        tips.append(("This date is flagged as extreme weather: check local conditions before travelling.",
                     "is_extreme"))
    return [{"text": text, "source_label": f"{src} ({field})"} for text, field in tips]


def build(city_name, for_date, weather_rows, current, upcoming, advisories, season, peak):
    today = next((w for w in weather_rows if w["for_date"] == for_date), None)
    return {
        "date": for_date,
        "season": season,
        "peak_season": peak,
        "season_source": (f"weather_daily / {today['weather_id']} (season)" if today
                          else f"cities / {city_name} (season_profile)"),
        "events": [{"event_id": e["event_id"], "name": e["name"], "start_date": e["start_date"],
                    "end_date": e["end_date"], "description": e["description"],
                    "source_label": f"events_festivals / {e['event_id']}"} for e in current],
        # Stated plainly, never filled in: this is the "honest empty date" the brief asks for.
        "no_events_message": (None if current else f"Nothing is scheduled in {city_name} on {human_date(for_date)}."),
        "next_event": ({"event_id": upcoming[0]["event_id"], "name": upcoming[0]["name"],
                        "start_date": upcoming[0]["start_date"], "end_date": upcoming[0]["end_date"],
                        "source_label": f"events_festivals / {upcoming[0]['event_id']}"} if upcoming else None),
        "weather": ({"weather_id": today["weather_id"], "condition": today["condition"],
                     "temp_min_c": str(today["temp_min_c"]), "temp_max_c": str(today["temp_max_c"]),
                     "precipitation_mm": str(today["precipitation_mm"]), "humidity_pct": today["humidity_pct"],
                     "source_label": f"weather_daily / {today['weather_id']}"} if today else None),
        "tips": weather_tips(today),
        "advisories": [{"advisory_id": a["advisory_id"], "level": a["level"], "title": a["title"],
                        "source_label": f"safety_advisories / {a['advisory_id']}"} for a in advisories],
    }
