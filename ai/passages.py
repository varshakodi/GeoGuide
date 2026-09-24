"""Formats rows the backend fetched into numbered, labelled passages.

Backend fetches rows; this module turns them into passages. The empty results
("no events today") are grounded too — they come from a real query.
"""
from .retrieval import Passage


def _p(n, text, label, kind):
    return Passage(n=n, text=text, source_label=label, score=1.0, kind=kind)


def weather(n, city, rows, season=None, peak=False):
    """rows: weather_daily rows for the briefing date (and the day after, if given)."""
    parts = []
    for r in rows:
        bit = (f"{r['for_date']}: {str(r['condition']).replace('_', ' ')}, "
               f"{r['temp_min_c']}–{r['temp_max_c']} °C, feels like {r['feels_like_c']} °C, "
               f"precipitation {r['precipitation_mm']} mm")
        if r.get("is_extreme"):
            bit += ", flagged as extreme weather"
        parts.append(bit + ".")
    if season:
        parts.append(f"The season on this date is {str(season).replace('_', ' ')}"
                     + (", which is peak travel season for this city." if peak else "."))
    if not parts:
        parts = ["No weather record exists for this date."]
    return _p(n, " ".join(parts), f"weather_daily / {city}", "weather")


def attractions(n, city, rows, for_date):
    """Top attractions on a given date, from activities_poi. Closed POIs are excluded
    by the caller, so anything listed here is genuinely open that day."""
    if not rows:
        return _p(n, f"No attractions in the data are open on {for_date}.",
                  f"activities_poi / {city}", "poi")
    bits = []
    for r in rows:
        hours = f"{r['opens_at']}–{r['closes_at']}" if r.get("closes_at") else f"from {r['opens_at']}"
        cost = "free entry" if str(r["entry_cost"]) in ("0", "0.00") else f"entry {r['currency']} {r['entry_cost']}"
        bits.append(f"{r['name']} ({r['poi_category'].replace('_', ' ')}), open {hours}, {cost}, "
                    f"about {r['typical_duration_minutes']} minutes.")
    return _p(n, " ".join(bits), f"activities_poi / {city}", "poi")


def events(n, city, today, current, upcoming):
    if current:
        text = " ".join(f"{e['name']} is on now, {e['start_date']} to {e['end_date']}." for e in current)
        if upcoming:
            text += f" Next after that: {upcoming[0]['name']}, {upcoming[0]['start_date']} to {upcoming[0]['end_date']}."
    elif upcoming:
        text = (f"No events are scheduled on {today}. "
                f"Next event: {upcoming[0]['name']}, {upcoming[0]['start_date']} to {upcoming[0]['end_date']}.")
    else:
        text = f"No events are scheduled on {today}, and none are upcoming in the data."
    return _p(n, text, f"events_festivals / {city}", "events")


def advisories(n, city, today, rows):
    if not rows:
        text = f"No safety advisory is valid on {today}."
    else:
        text = " ".join(f"{r['level']} advisory ({r['advisory_type']}): {r['title']}. {r['body']}" for r in rows)
    return _p(n, text, f"safety_advisories / {city}", "advisory")


def kb_section(n, row):
    """A place_kb city chunk fetched by section rather than by vector search."""
    return _p(n, row["body"], row["source_label"], "kb")
