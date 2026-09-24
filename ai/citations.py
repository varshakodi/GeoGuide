"""Turns cited model output into claims, and drops anything uncited."""
import re

SPLIT = re.compile(r"(?<=[.!?।])\s+")
REF = re.compile(r"\[(\d+)\]")
LEADING_REFS = re.compile(r"^(\s*\[\d+\])+")


def parse(text, passages):
    """Returns (claims, dropped). A claim is one sentence with at least one valid citation."""
    by_n = {p.n: p for p in passages}
    claims, dropped = [], []
    sentences = []
    for raw in SPLIT.split(text.strip()):
        s = raw.strip()
        if not s:
            continue
        # Models often write "…at religious sites. [1] Next sentence.": the split puts the
        # citation at the start of the next fragment. It belongs to the sentence before it;
        # left where it is, that sentence is dropped as uncited and the citation is
        # credited to the wrong sentence (or becomes an empty claim on its own).
        lead = LEADING_REFS.match(s)
        if lead and sentences:
            sentences[-1] = f"{sentences[-1]} {lead.group(0).strip()}"
            s = s[lead.end():].strip()
            if not s:
                continue
        sentences.append(s)
    for s in sentences:
        refs = [int(n) for n in REF.findall(s) if int(n) in by_n]
        text_only = re.sub(r"\s{2,}", " ", re.sub(r"\s+([.!?।])", r"\1", REF.sub("", s))).strip()
        if not refs or not text_only.strip(" .!?।"):
            dropped.append(s)
            continue
        cited = [by_n[n] for n in dict.fromkeys(refs)]
        claims.append({
            "text": text_only,
            "source_labels": [p.source_label for p in cited],
            "confidence": min((p.confidence for p in cited), key=lambda c: ["low", "medium", "high"].index(c)),
        })
    return claims, dropped
