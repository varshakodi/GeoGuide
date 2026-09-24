"""Vector retrieval with the city filter and the relevance gate (refusal layer 1)."""
from dataclasses import dataclass, field
from . import config
from .index import collections, embed


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
    hits = search(question, city_id, k)
    top = hits[0]["score"] if hits else 0.0
    kept = [h for h in hits if h["score"] >= config.RELEVANCE_THRESHOLD]
    if not kept:
        return Retrieval(passages=[], top_score=top, gated=True)
    passages = [Passage(n=i, text=h["text"], source_label=h["source_label"], score=h["score"],
                        confidence=h.get("confidence", "high"), section=h.get("section", ""))
                for i, h in enumerate(kept, 1)]
    return Retrieval(passages=passages, top_score=top, gated=False)
