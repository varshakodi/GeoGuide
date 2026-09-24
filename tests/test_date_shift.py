"""Mandatory enhancement: the briefing recomputes for any date in the dataset,
and an empty date is reported honestly rather than filled in."""
import pytest
from backend import data_queries as dq
from backend.ai_routes import briefing_context
from ai import passages as P

BLR, HYD, PUN = "cty_17b8ef2f", "cty_718f03c7", "cty_621f4a84"


def test_date_range_comes_from_the_data():
    r = dq.date_range(BLR)
    assert r["min"] <= "2026-09-24" <= r["max"]


def test_dates_outside_the_dataset_are_clamped():
    lo, _ = dq.clamp_date(BLR, "2020-01-01")
    hi, _ = dq.clamp_date(BLR, "2030-01-01")
    assert lo == dq.date_range(BLR)["min"] and hi == dq.date_range(BLR)["max"]


def test_events_change_when_the_date_moves():
    """Bengaluru has nothing on 24 Sep and Monsoon Music Nights from 17 Oct."""
    quiet, _, _, _, _ = briefing_context(BLR, "Bengaluru", "2026-09-24")
    festival, _, _, _, _ = briefing_context(BLR, "Bengaluru", "2026-10-17")
    assert quiet["events_current"] == []
    assert festival["events_current"], "17 Oct must have an event"


def test_empty_date_says_so_and_names_no_festival():
    ctx, *_ = briefing_context(BLR, "Bengaluru", "2026-09-24")
    p = P.events(1, "Bengaluru", "2026-09-24", ctx["events_current"], ctx["events_upcoming"])
    assert "No events are scheduled on 2026-09-24" in p.text
    assert p.source_label == "events_festivals / Bengaluru"


def test_a_festival_date_names_the_real_event():
    ctx, *_ = briefing_context(HYD, "Hyderabad", "2026-09-24")
    p = P.events(1, "Hyderabad", "2026-09-24", ctx["events_current"], ctx["events_upcoming"])
    assert "is on now" in p.text
    assert any(e["name"] in p.text for e in ctx["events_current"])


def test_weather_passage_changes_with_the_date():
    a, *_ = briefing_context(BLR, "Bengaluru", "2026-09-24")
    b, *_ = briefing_context(BLR, "Bengaluru", "2026-10-20")
    assert a["weather"] and b["weather"]
    assert a["weather"][0]["for_date"] != b["weather"][0]["for_date"]


def test_every_briefing_passage_carries_a_source():
    ctx, *_ = briefing_context(PUN, "Pune", "2026-09-24")
    from ai.briefing import all_passages
    ps, _ = all_passages(PUN, "Pune", "2026-09-24", ctx)
    assert ps and all(p.source_label for p in ps)
    assert len({p.n for p in ps}) == len(ps), "passage numbers must be unique"


def test_advisory_validity_is_date_aware():
    """Pune has an advisory valid to 28 Sep; nothing is valid in December."""
    live = dq.advisories(PUN, __import__("datetime").datetime.fromisoformat("2026-09-24T12:00:00+05:30"))
    later = dq.advisories(PUN, __import__("datetime").datetime.fromisoformat("2026-12-24T12:00:00+05:30"))
    assert live and not later
