"""A new chat (or a city change) must drop follow-up context, so "there" can never
resolve to a place from the previous conversation."""
from ai import session as sess
from backend.ai_routes import Reset, ask_reset


def test_reset_forgets_the_previous_place():
    answer = {"type": "answer",
              "claims": [{"source_labels": ["KV POI Facts / Bengaluru / Bengaluru Bazaar / etiquette"]}]}
    sess.remember("s1", "Tell me about Bengaluru Bazaar", answer)
    assert sess.rewrite("s1", "Is it open there?")[1] == "interpreted as being about Bengaluru Bazaar"
    assert ask_reset(Reset(session_id="s1"))["cleared"]
    assert sess.rewrite("s1", "Is it open there?") == ("Is it open there?", None)
