"""Every city returns only its own rows, and POI-level chunks keep a city."""
from ai.corpus import load_documents

CITIES = {"Bengaluru": "cty_17b8ef2f", "Mumbai": "cty_95e7c8ca",
          "Pune": "cty_621f4a84", "Hyderabad": "cty_718f03c7"}


def test_every_document_has_a_city():
    assert all(d["meta"]["city_id"] for d in load_documents())


def test_each_demo_city_has_a_full_corpus():
    docs = load_documents()
    for name, cid in CITIES.items():
        mine = [d for d in docs if d["meta"]["city_id"] == cid]
        sections = {d["meta"]["section"] for d in mine if d["meta"]["level"] == "city"}
        assert len(sections) == 8, f"{name}: {sections}"
        assert len(mine) >= 30, f"{name}: only {len(mine)} documents"
