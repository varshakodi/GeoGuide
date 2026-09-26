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
from . import translate

SYSTEM = (Path(__file__).parent / "prompts" / "system.txt").read_text(encoding="utf-8")
QA = (Path(__file__).parent / "prompts" / "qa.txt").read_text(encoding="utf-8")
SPLIT_SENT = re.compile(r"(?<=[.!?।])\s+")


def _system(max_sentences):
    return SYSTEM.format(sentinel=config.SENTINEL, max_sentences=max_sentences)


def _context(passages):
    return "\n".join(f"[{p.n}] ({p.source_label}) {p.text}" for p in passages)


def _qa(lang, question, passages, max_sentences):
    return QA.format(sentinel=config.SENTINEL, max_sentences=max_sentences, language=lang,
                     context=_context(passages), query=question)


def _user(lang, task, passages):
    lines = [f"Language: {lang}", f"Task: {task}", "", "Passages:"]
    return "\n".join(lines) + "\n" + _context(passages)


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
        # Follow-up questions use the Q&A prompt (detail-preserving); briefing sections the system prompt.
        raw = (generate(None, _qa(lang, question, passages, max_sentences), timeout_ms=config.ASK_TIMEOUT_MS, patient=False) if question
               else generate(_system(max_sentences), _user(lang, task, passages)))
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


# Greetings and thanks, matched against the WHOLE message so "hi, how much is a cab?"
# still goes through the refusal layers. The reply states no facts, so it needs no source.
_SCRIPT_SAFE = re.compile(r"[^\w\s\u0900-\u097F\u0C80-\u0CFF]")
_SMALLTALK = {
    "greeting": re.compile(r"^(hi+|hello+|hey+|hiya|namaste|namaskara?|good (morning|afternoon|evening|day)"
                           r"|who are you|what are you|what can you do|how are you"
                           r"|नमस्ते|नमस्कार|हेलो|ನಮಸ್ಕಾರ|ಹಲೋ)( (there|geoguide|again))?$"),
    "thanks": re.compile(r"^(thanks|thank you|thank you so much|thanks a lot|thx|ty"
                         r"|धन्यवाद|शुक्रिया|ಧನ್ಯವಾದ|ಧನ್ಯವಾದಗಳು)( (so much|a lot|geoguide))?$"),
}
SMALLTALK_MESSAGES = {
    "greeting": {
        "en-IN": "Hello! I'm GeoGuide. I can help you with {city}'s history, top spots, safety tips, or what's happening nearby today. What would you like to know?",
        "hi": "नमस्ते! मैं GeoGuide हूँ। मैं {city} के इतिहास, प्रमुख जगहों, सुरक्षा सुझावों या आज आस-पास क्या हो रहा है, इसमें आपकी मदद कर सकता हूँ। आप क्या जानना चाहेंगे?",
        "kn": "ನಮಸ್ಕಾರ! ನಾನು GeoGuide. {city} ಇತಿಹಾಸ, ಪ್ರಮುಖ ತಾಣಗಳು, ಸುರಕ್ಷತಾ ಸಲಹೆಗಳು ಅಥವಾ ಇಂದು ಹತ್ತಿರದಲ್ಲಿ ಏನು ನಡೆಯುತ್ತಿದೆ ಎಂಬುದರ ಬಗ್ಗೆ ನಾನು ಸಹಾಯ ಮಾಡಬಲ್ಲೆ. ನೀವು ಏನು ತಿಳಿಯಲು ಬಯಸುತ್ತೀರಿ?",
    },
    "thanks": {
        "en-IN": "You're welcome! Ask me anything else about {city}: history, places to visit, safety, or what's on.",
        "hi": "आपका स्वागत है! {city} के बारे में कुछ और पूछिए: इतिहास, घूमने की जगहें, सुरक्षा या आज क्या हो रहा है।",
        "kn": "ಸ್ವಾಗತ! {city} ಬಗ್ಗೆ ಇನ್ನೇನಾದರೂ ಕೇಳಿ: ಇತಿಹಾಸ, ನೋಡಬೇಕಾದ ಸ್ಥಳಗಳು, ಸುರಕ್ಷತೆ ಅಥವಾ ಇಂದು ಏನು ನಡೆಯುತ್ತಿದೆ.",
    },
}


def smalltalk_kind(question):
    q = " ".join(_SCRIPT_SAFE.sub(" ", question.lower()).split())
    return next((kind for kind, rx in _SMALLTALK.items() if rx.match(q)), None)


def smalltalk(kind, city_id, lang):
    from .corpus import connect
    con = connect()
    row = con.execute("SELECT name FROM cities WHERE city_id = ?", (city_id,)).fetchone()
    con.close()
    msgs = SMALLTALK_MESSAGES[kind]
    return {"type": "greeting", "kind": kind, "language": lang,
            "message": msgs.get(lang, msgs["en-IN"]).format(city=row["name"] if row else "this city")}


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


def answer_question(question, city_id, lang="en-IN", max_sentences=None, session_id=None,
                    extra_passages=None):
    """Follow-up Q&A. Every turn re-retrieves; state only resolves references."""
    reason = check_intent(question)                                   # layer 3
    if reason:
        out = refusal(3, reason, lang)
        log_retrieval(question, city_id, None, out)
        return out
    kind = smalltalk_kind(question)                                   # greetings skip retrieval
    if kind:
        out = smalltalk(kind, city_id, lang)
        log_retrieval(question, city_id, None, out)
        return out
    asked, note = sess.rewrite(session_id, question)
    r = retrieve(asked, city_id)                                      # layer 1
    if extra_passages and config.GROUNDING_ENABLED:
        # Day-specific rows (weather, events, advisories, opening hours for the date asked)
        # come from a real query, so they answer the question even when the guide text
        # does not clear the relevance gate. They go first: they are the most specific.
        kept = [] if r.gated else r.passages
        r.passages = list(extra_passages) + kept
        for i, p in enumerate(r.passages, 1):
            p.n = i
        r.gated = False
    if r.gated:
        out = refusal(1, "below_threshold" if r.top_score else "no_retrieval", lang)
        log_retrieval(question, city_id, r, out)
        return out
    out = _compose(translate.generation_lang(lang), f"Answer the traveller's question: {asked}",
                   r.passages, max_sentences or config.QA_MAX_SENTENCES, question=asked)
    out = translate.translate_result(out, lang)
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
