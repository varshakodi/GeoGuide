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


def test_a_generic_it_is_not_pinned_to_the_last_place():
    answer = {"type": "answer",
              "claims": [{"source_labels": ["KV POI Facts / Pune / Pune Street Food Lane / timing"]}]}
    sess.remember("s2", "Tell me about Pune Street Food Lane", answer)
    assert sess.rewrite("s2", "is it safe to walk around at night?") == ("is it safe to walk around at night?", None)
    assert sess.rewrite("s2", "What time does that place close?")[1] == "interpreted as being about Pune Street Food Lane"
