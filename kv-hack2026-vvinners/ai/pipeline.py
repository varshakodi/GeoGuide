"""Orchestration: the refusal layers, generation, and the citation check.

Order for a question:
  layer 3 intent  ->  layer 1 relevance gate  ->  LLM  ->  layer 2 sentinel  ->  citation check
"""
from pathlib import Path
from . import config
from .citations import parse
from .llm import generate, LLMUnavailable
from .refusal import check_intent, refusal
from .retrieval import retrieve
from . import session as sess

SYSTEM = (Path(__file__).parent / "prompts" / "system.txt").read_text(encoding="utf-8")


def _system(max_sentences):
    return SYSTEM.format(sentinel=config.SENTINEL, max_sentences=max_sentences)


def _user(lang, task, passages):
    lines = [f"Language: {lang}", f"Task: {task}", "", "Passages:"]
    lines += [f"[{p.n}] ({p.source_label}) {p.text}" for p in passages]
    return "\n".join(lines)


def _compose(lang, task, passages, max_sentences):
    """Calls the model and applies layers 2 and the citation check."""
    try:
        raw = generate(_system(max_sentences), _user(lang, task, passages))
    except LLMUnavailable as e:
        return {"type": "error", "reason": "llm_unavailable", "detail": str(e),
                "message": "No internet connection and no local model available."}
    if config.SENTINEL in raw:
        return refusal(2, "sentinel", lang)
    claims, dropped = parse(raw, passages)
    if not claims:
        return refusal(2, "no_cited_claims", lang)
    return {"type": "answer", "claims": claims, "dropped": dropped, "language": lang,
            "flagged": any(c["confidence"] in config.FLAG_CONFIDENCE for c in claims)}


def answer_question(question, city_id, lang="en-IN", max_sentences=None, session_id=None):
    """Follow-up Q&A. Every turn re-retrieves; state only resolves references."""
    reason = check_intent(question)                                   # layer 3
    if reason:
        return refusal(3, reason, lang)
    asked, note = sess.rewrite(session_id, question)
    r = retrieve(asked, city_id)                                      # layer 1
    if r.gated:
        return refusal(1, "below_threshold" if r.top_score else "no_retrieval", lang)
    out = _compose(lang, f"Answer the traveller's question: {asked}",
                   r.passages, max_sentences or config.MAX_SENTENCES)
    if out.get("type") == "answer":
        out["top_score"] = round(r.top_score, 3)
        if note:
            out["resolved"] = note
    sess.remember(session_id, question, out)
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
