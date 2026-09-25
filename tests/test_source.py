"""Every citation label resolves to the rows behind it, by key, and never to invented data."""
from backend.source import resolve

BLR = "cty_17b8ef2f"


def test_row_label_returns_that_row():
    out = resolve("events_festivals / evt_c46d368e")
    assert out["table"] == "events_festivals" and out["query"] == "event_id = 'evt_c46d368e'"
    assert [r["name"] for r in out["rows"]] == ["Monsoon Music Nights"]


def test_field_suffix_is_kept_so_the_ui_can_highlight_it():
    out = resolve("weather_daily / wth_833a28a0 (precipitation_mm)")
    assert out["field"] == "precipitation_mm"
    assert out["rows"][0]["for_date"] == "2026-09-25" and "precipitation_mm" in out["rows"][0]


def test_city_level_passage_label_is_rebuilt_for_the_briefing_date():
    out = resolve("events_festivals / Bengaluru", BLR, "2026-10-17")
    assert out["rows"][0]["name"] == "Monsoon Music Nights"
    quiet = resolve("weather_daily / Bengaluru", BLR, "2026-09-25")
    assert quiet["rows"][0]["weather_id"] == "wth_833a28a0"


def test_empty_date_chip_shows_the_query_and_zero_rows():
    out = resolve("events_festivals · 0 rows on 2026-09-25", BLR)
    assert out["rows"] == [] and "start_date <= '2026-09-25'" in out["query"]


def test_knowledge_base_and_poi_fact_labels_return_their_chunks():
    kb = resolve("KV Place Guide / Bengaluru / history")
    assert kb["table"] == "place_kb" and "hunting reserve" in kb["rows"][0]["body"]
    fact = resolve("KV POI Facts / Bengaluru / Bengaluru Bazaar / etiquette")
    assert fact["table"] == "poi_facts_kb" and fact["rows"] and fact["rows"][0]["fact_type"] == "etiquette"


def test_field_style_reason_labels_are_not_record_references():
    assert resolve("activities_poi.closes_at") is None
    assert resolve("") is None


def test_right_now_reason_on_a_pick_opens_that_poi_row():
    out = resolve("activities_poi / poi_c07155aa (lat/lng)")
    assert out["field"] == "lat/lng" and out["query"] == "poi_id = 'poi_c07155aa'"
    assert out["rows"][0]["name"] == "Bengaluru Bird Sanctuary"


def test_hotel_label_returns_that_hotel():
    out = resolve("hotels / htl_ed48c7a2")
    assert out["table"] == "hotels" and out["rows"][0]["name"] == "Hillview Kothi Boutique Stay"
