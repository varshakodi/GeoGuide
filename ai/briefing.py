"""The five briefing sections: which passages each one gets, and its task line.

Backend supplies the structured rows (weather, events, advisories); this module
assembles passages and calls the pipeline.
"""
from . import passages as P
from .corpus import city_sections
from .pipeline import briefing_section

SECTIONS = ["history", "culture_etiquette", "events", "weather", "safety"]

TASKS = {
    "history": "Write the 'History' section of a briefing for a traveller arriving today.",
    "culture_etiquette": "Write the 'Culture & etiquette' section for a traveller arriving today.",
    "events": "Write the 'What's on right now' section. State the time situation exactly as the passage does.",
    "weather": "Write the 'What to wear today' section, using today's conditions and tomorrow's if given.",
    "safety": "Write the 'Safety' section. If no advisory is valid, say so plainly.",
}


def build(city_id, city_name, today, ctx, lang="en-IN"):
    """ctx: {'weather': rows, 'events_current': rows, 'events_upcoming': rows, 'advisories': rows}"""
    kb = city_sections(city_id)
    out = {}
    for name in SECTIONS:
        ps = []
        if name == "history" and "history" in kb:
            ps = [P.kb_section(1, kb["history"])]
        elif name == "culture_etiquette":
            ps = [P.kb_section(i, kb[s]) for i, s in enumerate(("culture", "etiquette"), 1) if s in kb]
        elif name == "events":
            ps = [P.events(1, city_name, today, ctx.get("events_current", []), ctx.get("events_upcoming", []))]
        elif name == "weather":
            ps = [P.weather(1, city_name, ctx.get("weather", []))]
        elif name == "safety":
            ps = [P.advisories(1, city_name, today, ctx.get("advisories", []))]
            if "safety" in kb:
                ps.append(P.kb_section(2, kb["safety"]))
        out[name] = briefing_section(name, TASKS[name], ps, lang)
    return out
