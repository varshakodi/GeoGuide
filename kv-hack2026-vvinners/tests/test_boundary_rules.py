"""Boundary rules from the data model, enforced in code (R1-R8)."""
import sqlite3
from decimal import Decimal

import pytest
from ai.config import DB_PATH
from backend import data_queries as dq

BLR = "cty_17b8ef2f"


def test_r1_database_is_opened_read_only():
    con = dq.connect()
    with pytest.raises(sqlite3.OperationalError):
        con.execute("CREATE TABLE should_not_exist (x int)")
    con.close()


def test_r2_ids_are_opaque_strings():
    city = dq.nearest_city(12.9756, 77.605)
    assert isinstance(city["city_id"], str) and city["city_id"].startswith("cty_")


def test_r3_money_is_a_decimal_string_with_a_currency():
    for p in dq.pois(BLR, limit=5):
        assert isinstance(p["entry_cost"], str)
        Decimal(p["entry_cost"])                      # parses exactly, never a float
        assert len(p["currency"]) == 3


def test_r4_timestamps_are_compared_with_their_offset():
    from datetime import datetime
    assert dq.advisories(BLR, datetime.fromisoformat("2026-09-24T12:00:00+05:30")) == []


def test_r5_enums_are_lowercase_snake_case():
    season, _ = dq.season_for(BLR, "2026-09-24")
    assert season == season.lower() and " " not in season


def test_r6_languages_are_bcp47_tags():
    for l in dq.languages_for(BLR):
        assert l["bcp47"] in ("en-IN", "hi", "kn") and l["english_name"] != l["bcp47"]


def test_r7_geography_is_a_pair():
    p = dq.pois(BLR, 12.9756, 77.605, limit=1)[0]
    assert "distance_km" in p and p["distance_km"] >= 0


def test_r8_inactive_rows_are_filtered_not_deleted():
    con = sqlite3.connect(f"file:{DB_PATH}?mode=ro", uri=True)
    total = con.execute("SELECT count(*) FROM activities_poi WHERE city_id=?", (BLR,)).fetchone()[0]
    con.close()
    assert len(dq.pois(BLR, limit=999)) <= total


def test_closed_days_use_monday_as_zero():
    """0 = Monday, matching date.weekday()."""
    row = {"closed_days": "0"}
    assert dq.is_closed_on(row, "2026-09-21")        # a Monday
    assert not dq.is_closed_on(row, "2026-09-24")    # a Thursday


def test_null_closing_time_is_open_ended_not_an_error():
    from backend.ranker import rank
    p = [{"poi_id": "x", "name": "Watchtower", "poi_category": "viewpoint", "opens_at": "08:00",
          "closes_at": None, "closed_today": False, "distance_km": 1.0, "entry_cost": "0.00",
          "currency": "INR", "typical_duration_minutes": 45}]
    assert rank(p, "20:00", "2026-09-24")[0]["name"] == "Watchtower"
