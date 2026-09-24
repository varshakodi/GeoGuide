"""Resolves a citation label back to the database rows behind it.

Every label the UI shows can be traced to a query: a row id (`events_festivals / evt_…`),
a city-level passage (`weather_daily / Bengaluru`, rebuilt for the briefing date), a
knowledge-base chunk (`KV Place Guide / Bengaluru / history`) or a POI fact. Lookups are
by key on the read-only database; nothing is generated or filled in.
"""
import re
from datetime import datetime

from . import data_queries as dq

ROW_KEYS = {
    "events_festivals": ("event_id", "evt_"),
    "weather_daily": ("weather_id", "wth_"),
    "safety_advisories": ("advisory_id", "adv_"),
    "activities_poi": ("poi_id", "poi_"),
}
FIELD = re.compile(r"^(.*?)\s*\(([a-z_]+)\)$")
EMPTY = re.compile(r"^events_festivals · 0 rows on (\d{4}-\d{2}-\d{2})$")


def _rows(sql, params=()):
    con = dq.connect()
    rows = [dict(r) for r in con.execute(sql, params).fetchall()]
    con.close()
    return rows


def _city_id(name):
    rows = _rows("SELECT city_id FROM cities WHERE name = ?", (name,))
    return rows[0]["city_id"] if rows else None


def _noon(for_date):
    return datetime.fromisoformat(f"{for_date}T12:00:00+05:30")


def _result(label, table, query, rows, field=None):
    return {"label": label, "table": table, "query": query, "rows": rows, "field": field}


def resolve(label, city_id=None, for_date=None):
    """The rows a label names, or None when the label is not a record reference."""
    label = str(label or "").strip()
    field = None
    m = FIELD.match(label)
    if m:
        label, field = m.group(1).strip(), m.group(2)

    m = EMPTY.match(label)
    if m:
        d = m.group(1)
        rows = _rows("SELECT * FROM events_festivals WHERE city_id = ? AND status = 'active' "
                     "AND start_date <= ? AND end_date >= ?", (city_id, d, d)) if city_id else []
        return _result(label, "events_festivals",
                       f"city_id = '{city_id}' AND status = 'active' AND start_date <= '{d}' AND end_date >= '{d}'",
                       rows)

    parts = [p.strip() for p in label.split(" / ")]
    table = parts[0]

    if table in ROW_KEYS and len(parts) >= 2:
        key, prefix = ROW_KEYS[table]
        if parts[1].startswith(prefix):
            return _result(label, table, f"{key} = '{parts[1]}'",
                           _rows(f"SELECT * FROM {table} WHERE {key} = ?", (parts[1],)), field)
        # A city-level label from a briefing passage: the rows that passage was built from.
        cid = _city_id(parts[1]) or city_id
        if not cid:
            return None
        d = for_date or dq.clamp_date(cid, None)[0]
        if table == "events_festivals":
            cur, up = dq.events(cid, d)
            return _result(label, table, f"city_id = '{cid}' AND status = 'active' AND start_date <= '{d}' "
                           f"AND end_date >= '{d}', plus the next start_date > '{d}'", cur + up[:1], field)
        if table == "weather_daily":
            return _result(label, table, f"city_id = '{cid}' AND for_date IN ('{d}', '{d}' + 1 day)",
                           dq.weather(cid, d), field)
        if table == "safety_advisories":
            return _result(label, table, f"city_id = '{cid}' AND status = 'active' AND valid_from <= "
                           f"'{d}T12:00+05:30' <= valid_to", dq.advisories(cid, _noon(d)), field)
        if table == "activities_poi":
            return _result(label, table, f"city_id = '{cid}' AND status = 'active' AND not closed on '{d}', "
                           "nearest 5", dq.pois(cid, limit=5, for_date=d, open_only=True), field)

    if table == "cities" and len(parts) >= 2:
        return _result(label, "cities", f"name = '{parts[1]}'",
                       _rows("SELECT * FROM cities WHERE name = ?", (parts[1],)), field)

    if table == "KV Place Guide":
        return _result(label, "place_kb", f"source_label = '{label}'",
                       _rows("SELECT chunk_id, city_id, poi_id, section, title, body, source_label "
                             "FROM place_kb WHERE source_label = ? LIMIT 5", (label,)), field)

    if table == "KV POI Facts" and len(parts) == 4:
        city, poi, fact_type = parts[1:]
        return _result(label, "poi_facts_kb",
                       f"city = '{city}' AND poi = '{poi}' AND fact_type = '{fact_type}'",
                       _rows("SELECT f.* FROM poi_facts_kb f JOIN activities_poi p USING (poi_id) "
                             "JOIN cities c ON c.city_id = p.city_id "
                             "WHERE c.name = ? AND p.name = ? AND f.fact_type = ? ORDER BY f.display_priority",
                             (city, poi, fact_type)), field)
    return None
