"""Formats rows the backend fetched into numbered, labelled passages.

Backend fetches rows; this module turns them into passages. The empty results
("no events today") are grounded too — they come from a real query.
"""
from .retrieval import Passage


def _p(n, text, label, kind):
    return Passage(n=n, text=text, source_label=label, score=1.0, kind=kind)


def weather(n, city, rows):
    """rows: weather_daily rows for today (and optionally tomorrow)."""
    parts = []
    for r in rows:
        parts.append(f"{r['for_date']}: {str(r['condition']).replace('_', ' ')}, "
                     f"{r['temp_min_c']}–{r['temp_max_c']} °C, feels like {r['feels_like_c']} °C, "
                     f"precipitation {r['precipitation_mm']} mm.")
    return _p(n, " ".join(parts), f"weather_daily / {city}", "weather")


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
