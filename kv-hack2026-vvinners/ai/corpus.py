"""Loads the retrieval corpus out of the provided database. Read-only, never modified."""
import re
import sqlite3
from .config import DB_PATH

SPLIT = re.compile(r"(?<=[.!?])\s+")
WINDOW = 2          # sentences per passage
STRIDE = 1


def windows(body):
    """A place_kb body covers several topics in one paragraph, so one vector per body
    dilutes every specific fact in it (measured: a tap-water sentence scores 0.78 alone
    and 0.17 inside its body). Index overlapping 2-sentence windows instead.

    The title is deliberately NOT embedded: "Bengaluru - safety" pulls any question
    containing "safe" towards the safety chunk regardless of topic (measured: it cost
    the correct chunk 0.04 and gave the wrong one 0.02). The city filter already
    supplies the context the title was carrying. source_label is unchanged, so
    provenance is identical.
    """
    sents = [x.strip() for x in SPLIT.split(body.strip()) if x.strip()]
    if len(sents) <= WINDOW:
        return [body.strip()]
    return [" ".join(sents[i:i + WINDOW]) for i in range(0, len(sents) - WINDOW + 1, STRIDE)]


def connect():
    con = sqlite3.connect(f"file:{DB_PATH}?mode=ro", uri=True)
    con.row_factory = sqlite3.Row
    return con


def fact_source_label(city_name, poi_name, fact_type):
    """Derived label — poi_facts_kb ships without source_label (documented as an addition)."""
    return f"KV POI Facts / {city_name} / {poi_name} / {fact_type}"


def load_documents():
    """Every indexable document, with a city on each one.

    place_kb holds 480 city-level chunks (city_id set) and 720 POI-level chunks
    (poi_id set, city_id NULL). The POI ones get their city through activities_poi,
    otherwise a city-filtered query silently drops them.
    """
    con = connect()
    docs = []

    q = """SELECT k.chunk_id, k.section, k.title, k.body, k.source_label, k.embedding_ref,
                  k.poi_id, COALESCE(k.city_id, p.city_id) AS city_id
           FROM place_kb k LEFT JOIN activities_poi p ON p.poi_id = k.poi_id"""
    for r in con.execute(q):
        meta = {"collection": "place_kb", "city_id": r["city_id"], "section": r["section"], "title": r["title"],
                "source_label": r["source_label"], "row_id": r["chunk_id"],
                "level": "poi" if r["poi_id"] else "city", "confidence": "high"}
        if r["poi_id"]:
            meta["poi_id"] = r["poi_id"]
        base = r["embedding_ref"] or r["chunk_id"]
        for i, text in enumerate(windows(r["body"])):
            docs.append({"id": f"{base}#w{i}", "text": text,
                         "meta": {**meta, "parent_id": base, "window": i}})

    q = """SELECT f.fact_id, f.fact_type, f.fact_text, f.confidence, f.embedding_ref,
                  p.poi_id, p.name AS poi_name, p.city_id, c.name AS city_name
           FROM poi_facts_kb f JOIN activities_poi p USING(poi_id) JOIN cities c ON c.city_id = p.city_id"""
    for r in con.execute(q):
        docs.append({"id": r["embedding_ref"] or r["fact_id"], "text": r["fact_text"],
                     "meta": {"collection": "poi_facts_kb", "city_id": r["city_id"],
                              "section": r["fact_type"], "poi_id": r["poi_id"],
                              "source_label": fact_source_label(r["city_name"], r["poi_name"], r["fact_type"]),
                              "confidence": r["confidence"], "row_id": r["fact_id"], "level": "poi"}})
    con.close()
    return docs


def city_sections(city_id):
    """The 8 city-level briefing chunks, fetched directly — no vector search needed."""
    con = connect()
    rows = con.execute(
        "SELECT section, title, body, source_label FROM place_kb WHERE city_id = ? AND poi_id IS NULL",
        (city_id,)).fetchall()
    con.close()
    return {r["section"]: dict(r) for r in rows}
