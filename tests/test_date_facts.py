"""Date-shift facts and the no-LLM fallback: the Date-Shift criterion must hold
without a model, and the fallback must never answer about a place it cannot see."""
from ai import briefing, llm, pipeline
from ai.retrieval import Passage, Retrieval
from backend import date_facts
from backend.ai_routes import briefing_context

BLR = "cty_17b8ef2f"


def facts(for_date):
    ctx, cur, up, season, peak = briefing_context(BLR, "Bengaluru", for_date)
    return date_facts.build("Bengaluru", for_date, ctx["weather"], cur, up, ctx["advisories"], season, peak)


def test_empty_date_says_nothing_is_scheduled_and_names_no_event():
    f = facts("2026-09-24")
    assert f["events"] == []
    assert f["no_events_message"] == "Nothing is scheduled in Bengaluru on 24 Sep 2026."


def test_festival_date_cites_the_event_row():
    f = facts("2026-10-17")
    assert [e["name"] for e in f["events"]] == ["Monsoon Music Nights"]
    assert f["events"][0]["source_label"] == f"events_festivals / {f['events'][0]['event_id']}"
    assert f["no_events_message"] is None


def test_weather_tips_recompute_and_cite_the_weather_row():
    dry, wet = facts("2026-09-24"), facts("2026-10-17")
    assert dry["weather"]["weather_id"] != wet["weather"]["weather_id"]
    assert [t["text"] for t in dry["tips"]] != [t["text"] for t in wet["tips"]]
    for f in (dry, wet):
        assert f["tips"] and all(t["source_label"].startswith(f"weather_daily / {f['weather']['weather_id']}")
                                 for t in f["tips"])


def test_briefing_falls_back_to_cited_passages_without_an_llm(monkeypatch):
    def down(*a, **k):
        raise llm.LLMUnavailable("offline")
    monkeypatch.setattr(briefing, "generate", down)
    ctx, *_ = briefing_context(BLR, "Bengaluru", "2026-09-24")
    out = briefing.build_single_call(BLR, "Bengaluru", "2026-09-24", ctx)
    assert out["events"]["type"] == "answer" and out["events"]["extractive"]
    assert "No events are scheduled on 24 Sep 2026" in out["events"]["claims"][0]["text"]
    assert all(c["source_labels"] for s in out.values() if s["type"] == "answer" for c in s["claims"])


def test_fallback_refuses_a_made_up_landmark(monkeypatch):
    def down(*a, **k):
        raise llm.LLMUnavailable("offline")
    monkeypatch.setattr(pipeline, "generate", down)
    real = Passage(1, "Bengaluru Viewpoint sits in Bengaluru.", "KV Place Guide / Bengaluru / Bengaluru Viewpoint", 0.56)
    monkeypatch.setattr(pipeline, "retrieve", lambda q, c, k=None: Retrieval(passages=[real], top_score=0.56))
    assert pipeline.answer_question("Tell me about the Glass Tower", BLR)["type"] == "refusal"
    assert pipeline.answer_question("Tell me about Bengaluru Viewpoint", BLR)["type"] == "answer"


def test_dates_read_like_a_traveller_would_say_them():
    from ai.passages import human_date, human_range
    assert human_date("2026-09-24") == "24 Sep 2026"
    assert human_date("2026-09-24", weekday=True) == "Thu 24 Sep 2026"
    assert human_range("2026-10-17", "2026-10-22") == "17–22 Oct 2026"
    assert human_range("2026-10-26", "2026-11-02") == "26 Oct – 2 Nov 2026"
    assert human_range("2026-12-30", "2027-01-02") == "30 Dec 2026 – 2 Jan 2027"
