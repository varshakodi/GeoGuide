"""Orchestration: the refusal layers, generation, and the citation check.

Order for a question:
  layer 3 intent  ->  layer 1 relevance gate  ->  LLM  ->  layer 2 sentinel  ->  citation check
"""
import json, re, time
from pathlib import Path
from . import config
from .citations import parse
from .llm import generate, LLMUnavailable
from .refusal import check_intent, refusal
from .retrieval import retrieve
from . import session as sess

SYSTEM = (Path(__file__).parent / "prompts" / "system.txt").read_text(encoding="utf-8")
SPLIT_SENT = re.compile(r"(?<=[.!?।])\s+")


def _system(max_sentences):
    return SYSTEM.format(sentinel=config.SENTINEL, max_sentences=max_sentences)


def _user(lang, task, passages):
    lines = [f"Language: {lang}", f"Task: {task}", "", "Passages:"]
    lines += [f"[{p.n}] ({p.source_label}) {p.text}" for p in passages]
    return "\n".join(lines)


NAME = re.compile(r"\b[A-Z][a-zA-Z]+\b")


def unknown_names(question, passages):
    """Capitalised names in the question that no retrieved passage mentions.

    Without a model there is no layer-2 sentinel, and the embedding score alone lets a
    made-up landmark ("the Glass Tower") match a real one. A name the sources never
    mention means the passages are about something else, so the fallback refuses.
    """
    words = NAME.findall(question)[1:]            # the first word is capitalised anyway
    text = " ".join(p.text + " " + p.source_label for p in passages).lower()
    return [w for w in words if len(w) > 1 and w.lower() not in text]


def _compose(lang, task, passages, max_sentences, question=None):
    """Calls the model and applies layers 2 and the citation check."""
    try:
        raw = generate(_system(max_sentences), _user(lang, task, passages))
    except LLMUnavailable as e:
        # No model reachable: quote the best passage that already cleared the relevance
        # gate, verbatim and cited, rather than failing the question.
        if question and unknown_names(question, passages):
            return refusal(1, "unknown_name", lang)
        best = passages[0]
        sents = [s.strip() for s in SPLIT_SENT.split(best.text.strip()) if s.strip()][:2]
        return {"type": "answer", "extractive": True, "detail": str(e)[:200], "dropped": [],
                "language": "en-IN", "flagged": best.confidence in config.FLAG_CONFIDENCE,
                "claims": [{"text": s, "source_labels": [best.source_label], "confidence": best.confidence}
                           for s in sents]}
    if config.SENTINEL in raw:
        return refusal(2, "sentinel", lang)
    claims, dropped = parse(raw, passages)
    if not claims:
        return refusal(2, "no_cited_claims", lang)
    return {"type": "answer", "claims": claims, "dropped": dropped, "language": lang,
            "flagged": any(c["confidence"] in config.FLAG_CONFIDENCE for c in claims)}


LOG = Path(config.CHROMA_PATH).parent / ".cache" / "retrieval_log.jsonl"


def log_retrieval(question, city_id, r, out):
    """Application-side retrieval log: score, outcome and chunks for every question."""
    try:
        LOG.parent.mkdir(parents=True, exist_ok=True)
        with LOG.open("a", encoding="utf-8") as f:
            f.write(json.dumps({"at": time.strftime("%Y-%m-%dT%H:%M:%S%z"), "city_id": city_id,
                                "question": question, "top_score": round(r.top_score, 3) if r else None,
                                "gated": r.gated if r else None, "outcome": out.get("type"),
                                "reason": out.get("reason"), "extractive": bool(out.get("extractive")),
                                "sources": [p.source_label for p in (r.passages if r else [])]},
                               ensure_ascii=False) + "\n")
    except OSError:
        pass                       # logging must never break an answer


def answer_question(question, city_id, lang="en-IN", max_sentences=None, session_id=None):
    """Follow-up Q&A. Every turn re-retrieves; state only resolves references."""
    reason = check_intent(question)                                   # layer 3
    if reason:
        out = refusal(3, reason, lang)
        log_retrieval(question, city_id, None, out)
        return out
    asked, note = sess.rewrite(session_id, question)
    r = retrieve(asked, city_id)                                      # layer 1
    if r.gated:
        out = refusal(1, "below_threshold" if r.top_score else "no_retrieval", lang)
        log_retrieval(question, city_id, r, out)
        return out
    out = _compose(lang, f"Answer the traveller's question: {asked}",
                   r.passages, max_sentences or config.MAX_SENTENCES, question=asked)
    if out.get("type") == "answer":
        out["top_score"] = round(r.top_score, 3)
        if note:
            out["resolved"] = note
    sess.remember(session_id, question, out)
    log_retrieval(question, city_id, r, out)
    return out


def briefing_section(section_name, task, passages, lang="en-IN", max_sentences=None):
    """One briefing section. Passages come from city_sections() and passages.py,
    so structured rows and KB chunks go through the same citation path."""
    if not config.GROUNDING_ENABLED or not passages:
        return {**refusal(1, "no_retrieval", lang), "section": section_name}
    for i, p in enumerate(passages, 1):
        p.n = i
    out = _compose(lang, task, passages, max_sentences or config.MAX_SENTENCES)
    out["section"] = section_name
    return out
