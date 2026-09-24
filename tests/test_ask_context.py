"""Day-specific sources for chat questions (backend/ask_context.py)."""
from datetime import date

from backend.ai_routes import _as_dt
from backend.ask_context import passages_for, question_date

TODAY = date(2026, 9, 24)
CITY = "cty_17b8ef2f"


def test_reads_the_date_a_question_asks_about():
    assert question_date("tell me about the weather on 30th sep", TODAY) == date(2026, 9, 30)
    assert question_date("weather sep 30", TODAY) == date(2026, 9, 30)
    assert question_date("anything on 30/09?", TODAY) == date(2026, 9, 30)
    assert question_date("is it raining tomorrow", TODAY) == date(2026, 9, 25)
    assert question_date("events this saturday", TODAY) == date(2026, 9, 26)
    assert question_date("where do i eat?", TODAY) is None


def test_weather_question_gets_that_days_weather_row():
    ps = passages_for("tell me about the weather on 30th sep", CITY, "Bengaluru", "2026-09-24", _as_dt)
    assert [p.source_label for p in ps] == ["weather_daily / Bengaluru"]
    assert "2026-09-30" in ps[0].text


def test_general_question_adds_nothing():
    assert passages_for("where do i eat?", CITY, "Bengaluru", "2026-09-24", _as_dt) == []


def test_date_outside_the_data_says_so():
    ps = passages_for("weather on 25th december", CITY, "Bengaluru", "2026-09-24", _as_dt)
    assert len(ps) == 1 and "no record for 2026-12-25" in ps[0].text
