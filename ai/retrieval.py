"""Vector retrieval with the city filter and the relevance gate (refusal layer 1)."""
import re
from dataclasses import dataclass, field
from functools import lru_cache
from . import config
from .corpus import connect
from .index import collections, embed

# Travellers ask "what to do here"; the passages all name the city, so a vague question
# scores below the gate. Only questions with travel vocabulary get a second search with
# the city named: off-topic questions ("tell me a joke") gain as much from the city name
# as real ones do, so the vocabulary, not the score, is what tells them apart.
HERE = re.compile(r"\b(here|this (city|place|town))\b", re.I)
TRAVEL = re.compile(
    r"\b((to|can i|should i|could i|things to|what to) do|(should|can|could) i go|where to go|go out|"
    r"visit|visiting|see|seeing|sightseeing|get around|eat|eating|food|drink|stay|hotels?|shop|"
    r"shopping|safe|safety|avoid|tips?|famous|kids|family|relax|crowded|weather|wear|rain|"
    r"festivals?|events?|temples?|museums?|parks?|beach|markets?|explore|attractions?|places?|"
    r"walk|travel|tourists?|culture|history|etiquette|local|special|must)\b", re.I)


@lru_cache(maxsize=None)
def _city_name(city_id):
    con = connect()
    row = con.execute("SELECT name FROM cities WHERE city_id=?", (city_id,)).fetchone()
    con.close()
    return row[0] if row else None


def _in_city(question, name):
    q = HERE.sub(name, question)
    return q if name.lower() in q.lower() else f"{q.rstrip(' ?.!')} in {name}"


@dataclass
class Passage:
    n: int
    text: str
    source_label: str
    score: float
    confidence: str = "high"
    section: str = ""
    kind: str = "kb"


@dataclass
class Retrieval:
    passages: list = field(default_factory=list)
    top_score: float = 0.0
    gated: bool = False          # True => nothing cleared the threshold, do not call the LLM


def search(question, city_id, k=None):
    """Top-k across both collections, always filtered to one city.

    The city filter is mandatory: the same template text repeats across cities,
    so without it another city's chunk can win with its own source label.
    """
    if not config.GROUNDING_ENABLED:
        return []
    k = k or config.TOP_K
    qvec = embed([question])[0]
    hits = []
    for coll in collections().values():
        res = coll.query(query_embeddings=[qvec], n_results=k * 3, where={"city_id": city_id},
                         include=["documents", "metadatas", "distances"])
        for doc, meta, dist in zip(res["documents"][0], res["metadatas"][0], res["distances"][0]):
            hits.append({"text": doc, "score": 1.0 - dist, **meta})
    hits.sort(key=lambda h: h["score"], reverse=True)
    best = {}                       # one passage per source, keeping its best window
    for h in hits:
        if h["source_label"] not in best:
            best[h["source_label"]] = h
    return list(best.values())[:k]


def retrieve(question, city_id, k=None):
    r = _gate(search(question, city_id, k))
    if r.gated and TRAVEL.search(question):
        name = _city_name(city_id)
        if name and name.lower() not in question.lower():
            named = _gate(search(_in_city(question, name), city_id, k))
            if not named.gated:
                return named
    return r


def _gate(hits):
    top = hits[0]["score"] if hits else 0.0
    kept = [h for h in hits if h["score"] >= config.RELEVANCE_THRESHOLD]
    if not kept:
        return Retrieval(passages=[], top_score=top, gated=True)
    passages = [Passage(n=i, text=h["text"], source_label=h["source_label"], score=h["score"],
                        confidence=h.get("confidence", "high"), section=h.get("section", ""))
                for i, h in enumerate(kept, 1)]
    return Retrieval(passages=passages, top_score=top, gated=False)
