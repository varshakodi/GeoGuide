"""Follow-up context. Conversation state rewrites the question; it is never a source.

"What about there?" cannot be retrieved against. We resolve the reference from the
previous turn's cited POI, deterministically — no extra LLM call, and the rewrite is
shown to the user so the resolution is visible rather than magic.
"""
import re
from collections import defaultdict

# Bare "it" is left out: "is it safe?" or "is it worth it?" is usually a fresh question,
# and pinning it to the last place changed its meaning.
DEICTIC = re.compile(r"\b(there|that place|this place|that one|that spot|the same|वहाँ|वहां|उसी|ಅಲ್ಲಿ)\b", re.I)
POI_FROM_LABEL = re.compile(r"KV (?:POI Facts|Place Guide) / [^/]+ / ([^/]+)")

_sessions = defaultdict(list)          # session_id -> [{"question","poi"}]
MAX_TURNS = 6


def poi_from_claims(claims):
    for c in claims:
        for label in c.get("source_labels", []):
            m = POI_FROM_LABEL.match(label)
            if m and m.group(1).strip() not in ("history", "culture", "etiquette", "food",
                                        "transport", "safety", "seasonal", "practical"):
                return m.group(1).strip()
    return None


def remember(session_id, question, result):
    if not session_id:
        return
    poi = poi_from_claims(result.get("claims", [])) if result.get("type") == "answer" else None
    _sessions[session_id].append({"question": question, "poi": poi})
    del _sessions[session_id][:-MAX_TURNS]


def rewrite(session_id, question):
    """Returns (question_to_retrieve, note_or_None)."""
    if not session_id or not DEICTIC.search(question):
        return question, None
    for turn in reversed(_sessions.get(session_id, [])):
        if turn["poi"]:
            return f"{question} ({turn['poi']})", f"interpreted as being about {turn['poi']}"
    return question, None


def reset(session_id):
    _sessions.pop(session_id, None)
