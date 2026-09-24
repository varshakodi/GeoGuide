"""Turns cited model output into claims, and drops anything uncited."""
import re

SPLIT = re.compile(r"(?<=[.!?।])\s+")
REF = re.compile(r"\[(\d+)\]")


def parse(text, passages):
    """Returns (claims, dropped). A claim is one sentence with at least one valid citation."""
    by_n = {p.n: p for p in passages}
    claims, dropped = [], []
    for raw in SPLIT.split(text.strip()):
        s = raw.strip()
        if not s:
            continue
        refs = [int(n) for n in REF.findall(s) if int(n) in by_n]
        if not refs:
            dropped.append(s)
            continue
        cited = [by_n[n] for n in dict.fromkeys(refs)]
        claims.append({
            "text": re.sub(r"\s{2,}", " ", re.sub(r"\s+([.!?।])", r"\1", REF.sub("", s))).strip(),
            "source_labels": [p.source_label for p in cited],
            "confidence": min((p.confidence for p in cited), key=lambda c: ["low", "medium", "high"].index(c)),
        })
    return claims, dropped
