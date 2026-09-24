"""Day-specific sources for a chat question.

The chat searches the written city guide, which has no per-day data: "what's the
weather on 30th sep" retrieves the general seasonal text and is rightly refused. The
briefing's tables (weather_daily, events_festivals, safety_advisories, activities_poi)
do have it, so a question that names a date or asks about weather, events, advisories
or opening hours gets those rows as extra cited passages, for the date it asks about.
"""
import re
from datetime import date, timedelta

from ai import passages as P
from . import data_queries as dq

MONTHS = {m: i for i, m in enumerate(
    ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"], 1)}
MONTH = r"(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?"
DAY = r"(\d{1,2})(?:st|nd|rd|th)?"
WEEKDAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]

TOPICS = {
    "weather": re.compile(r"\b(weather|rain|raining|rainy|temperature|hot|cold|humid|sunny|cloudy|"
                          r"forecast|wear|umbrella|climate)\b", re.I),
    "events": re.compile(r"\b(events?|festivals?|happening|what'?s on|going on|celebrations?|"
                         r"concerts?|shows?|fairs?)\b", re.I),
    "safety": re.compile(r"\b(advisor(y|ies)|alerts?|warnings?|safe|safety|danger|dangerous)\b", re.I),
    "open": re.compile(r"\b(open|opens|opening|closed|closes|hours|timings?)\b", re.I),
}


def _month_day(month, day, today):
    try:
        return date(today.year, MONTHS[month[:3].lower()], int(day))
    except (KeyError, ValueError):
        return None


def question_date(question, today):
    """The date a question asks about, or None. `today` is the app's current date."""
    q = question.lower()
    if m := re.search(r"\b(\d{4})-(\d{2})-(\d{2})\b", q):
        try:
            return date(int(m[1]), int(m[2]), int(m[3]))
        except ValueError:
            return None
    if m := re.search(rf"\b{DAY}\s*(?:of\s+)?{MONTH}", q):
        return _month_day(m[2], m[1], today)
    if m := re.search(rf"\b{MONTH}\s+{DAY}\b", q):
        return _month_day(m[1], m[2], today)
    if m := re.search(r"\b(\d{1,2})[/.](\d{1,2})\b", q):             # 30/09, day first (India)
        try:
            return date(today.year, int(m[2]), int(m[1]))
        except ValueError:
            return None
    if "day after tomorrow" in q:
        return today + timedelta(days=2)
    if "tomorrow" in q:
        return today + timedelta(days=1)
    if re.search(r"\b(today|tonight|right now|now)\b", q):
        return today
    for i, name in enumerate(WEEKDAYS):
        if re.search(rf"\b{name}\b", q):
            return today + timedelta(days=(i - today.weekday()) % 7)
    return None


def _weather(city_id, city, d):
    """The weather_daily row for one day, as a sentence a model can repeat accurately.

    The briefing's terse "2026-09-30: partly cloudy, 22–30.8 °C" line, with the next day
    and the season appended, led a small model to quote the season instead of the
    forecast. Only the forecast for the day asked about is included.
    """
    rows = [r for r in dq.weather(city_id, d) if r["for_date"] == d]
    if not rows:
        text = f"No weather record exists for {city} on {d}."
    else:
        r = rows[0]
        text = (f"The weather in {city} on {d} is {str(r['condition']).replace('_', ' ')}, "
                f"with a low of {r['temp_min_c']} °C and a high of {r['temp_max_c']} °C, "
                f"feeling like {r['feels_like_c']} °C, and {r['precipitation_mm']} mm of rain.")
        if r.get("is_extreme"):
            text += " This day is flagged as extreme weather."
    return P._p(0, text, f"weather_daily / {city}", "weather")


def passages_for(question, city_id, city, today_iso, as_dt):
    """Structured passages for the question's date and topics; [] when neither applies."""
    today = date.fromisoformat(today_iso)
    asked = question_date(question, today)
    topics = [t for t, rx in TOPICS.items() if rx.search(question)]
    if not asked and not topics:
        return []
    if asked and not topics:
        topics = ["weather", "events"]              # "what about 30th sep?" -> the day's essentials
    d = (asked or today).isoformat()
    rng = dq.date_range(city_id)
    if not rng["min"] <= d <= rng["max"]:
        # Outside the data: say so, citably, instead of letting the model guess.
        return [P._p(0, f"GeoGuide's data for {city} covers {rng['min']} to {rng['max']}; "
                        f"there is no record for {d}.", f"weather_daily / {city}", "range")]
    out = []
    if "weather" in topics:
        out.append(_weather(city_id, city, d))
    if "events" in topics:
        cur, up = dq.events(city_id, d)
        out.append(P.events(0, city, d, cur, up))
    if "safety" in topics:
        out.append(P.advisories(0, city, d, dq.advisories(city_id, as_dt(d))))
    if "open" in topics:
        # The briefing's attractions text never names the date; a chat answer needs it.
        p = P.attractions(0, city, dq.pois(city_id, limit=5, for_date=d, open_only=True), d)
        p.text = f"Open on {d}: {p.text}"
        out.append(p)
    return out
