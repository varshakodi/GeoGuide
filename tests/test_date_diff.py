"""Moving the date recomputes everything from the data, and the diff names each change
with the rows it compared."""
from backend.date_diff import compare
from backend.source import resolve

BLR = "cty_17b8ef2f"


def texts(out):
    return [c["text"] for c in out["changes"]]


def test_festival_week_brings_the_event_peak_season_and_drier_weather():
    out = compare(BLR, "2026-09-25", "2026-10-17")
    assert out["from_label"] == "Fri 25 Sep" and out["to_label"] == "Sat 17 Oct"
    assert "Monsoon Music Nights is on (17–22 Oct)" in texts(out)
    assert "Rain: 10.65 mm → 1 mm" in texts(out)
    assert any(t.startswith("Peak travel season") for t in texts(out))


def test_the_week_after_says_the_festival_is_over():
    out = compare(BLR, "2026-10-17", "2026-10-24")
    assert "Monsoon Music Nights is over (ended Thu 22 Oct)" in texts(out)
    assert not any(c["kind"] == "event" and c["change"] == "added" for c in out["changes"])


def test_a_sunday_lists_the_places_closed_that_day():
    out = compare(BLR, "2026-09-25", "2026-09-27")
    closure = next(c for c in out["changes"] if c["kind"] == "closure")
    assert closure["text"].startswith("Closed on Sun 27 Sep:")
    assert all(label.endswith("(closed_days)") for label in closure["source_labels"])


def test_the_same_date_has_no_changes():
    assert compare(BLR, "2026-10-17", "2026-10-17")["changes"] == []


def test_every_cited_label_resolves_to_a_real_row():
    for a, b in [("2026-09-25", "2026-10-17"), ("2026-10-17", "2026-10-24"), ("2026-09-25", "2026-09-27")]:
        for change in compare(BLR, a, b)["changes"]:
            for label in change["source_labels"]:
                out = resolve(label, BLR, b)
                assert out and out["rows"], label
