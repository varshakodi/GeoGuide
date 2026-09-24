"""The five briefing sections: which passages each one gets, and its task line.

Backend supplies the structured rows (weather, events, advisories); this module
assembles passages and calls the pipeline.
"""
import re
from pathlib import Path

from . import cache, config
from . import passages as P
from .citations import parse
from .corpus import city_sections
from .llm import LLMUnavailable, generate
from .pipeline import briefing_section, _system, _user

BRIEFING_TASK = (Path(__file__).parent / "prompts" / "briefing.txt").read_text(encoding="utf-8")
HEADING = re.compile(r"^##\s*(\w+)\s*$", re.M)

SECTIONS = ["history", "attractions", "events", "weather", "culture_etiquette", "safety"]

TASKS = {
    "attractions": "Write the 'Top attractions' section for the briefing date.",
    "history": "Write the 'History' section of a briefing for a traveller arriving today.",
    "culture_etiquette": "Write the 'Culture & etiquette' section for a traveller arriving today.",
    "events": "Write the 'What's on right now' section. State the time situation exactly as the passage does.",
    "weather": "Write the 'What to wear today' section, using today's conditions and tomorrow's if given.",
    "safety": "Write the 'Safety' section. If no advisory is valid, say so plainly.",
}


def all_passages(city_id, city_name, today, ctx):
    """Every passage the briefing needs, numbered once across all sections.

    `today` is the briefing date, which the date-shift control can move to any date in
    the dataset. Events, season and weather passages are all rebuilt from that date.
    """
    kb = city_sections(city_id)
    ps, n = [], 0
    def add(p):
        nonlocal n
        n += 1; p.n = n; ps.append(p); return p
    section_map = {}
    if "history" in kb:
        section_map["history"] = [add(P.kb_section(0, kb["history"]))]
    ce = [add(P.kb_section(0, kb[s])) for s in ("culture", "etiquette") if s in kb]
    section_map["culture_etiquette"] = ce
    section_map["attractions"] = [add(P.attractions(0, city_name, ctx.get("attractions", []), today))]
    section_map["events"] = [add(P.events(0, city_name, today, ctx.get("events_current", []),
                                          ctx.get("events_upcoming", [])))]
    section_map["weather"] = [add(P.weather(0, city_name, ctx.get("weather", []),
                                            ctx.get("season"), ctx.get("peak_season", False)))]
    safety = [add(P.advisories(0, city_name, today, ctx.get("advisories", [])))]
    if "safety" in kb:
        safety.append(add(P.kb_section(0, kb["safety"])))
    section_map["safety"] = safety
    return ps, section_map


def build_single_call(city_id, city_name, today, ctx, lang="en-IN"):
    """One LLM call for the whole briefing instead of five.

    Five calls per briefing exhausts a free-tier quota fast and adds five round trips.
    Passages are numbered once across all sections, so citations still resolve to the
    same source labels and the citation check is unchanged.
    """
    ps, section_map = all_passages(city_id, city_name, today, ctx)
    task = BRIEFING_TASK.format(sentinel=config.SENTINEL) + f"\n\nThe briefing date is {today}."
    try:
        raw = generate(_system(14), _user(lang, task, ps))
    except LLMUnavailable as e:
        err = {"type": "error", "reason": "llm_unavailable", "detail": str(e),
               "message": "No internet connection and no local model available."}
        return {name: {**err, "section": name} for name in SECTIONS}

    parts, out = {}, {}
    chunks = HEADING.split(raw)
    for i in range(1, len(chunks) - 1, 2):
        parts[chunks[i].strip()] = chunks[i + 1].strip()
    for name in SECTIONS:
        body = parts.get(name, "")
        allowed = section_map.get(name, [])
        if not body or config.SENTINEL in body:
            out[name] = {"type": "refusal", "layer": 2, "reason": "sentinel", "section": name,
                         "message_key": "general", "language": lang}
            continue
        claims, dropped = parse(body, ps)
        if not claims:
            out[name] = {"type": "refusal", "layer": 2, "reason": "no_cited_claims", "section": name,
                         "message_key": "general", "language": lang}
            continue
        out[name] = {"type": "answer", "section": name, "claims": claims, "dropped": dropped,
                     "language": lang,
                     "flagged": any(c["confidence"] in config.FLAG_CONFIDENCE for c in claims)}
    return out


def build(city_id, city_name, today, ctx, lang="en-IN", use_cache=True, single_call=True):
    """ctx: {'weather': rows, 'events_current': rows, 'events_upcoming': rows, 'advisories': rows}"""
    if use_cache:
        hit = cache.get(city_id, lang, today)
        if hit:
            for s in hit.values():
                s["cached"] = True
            return hit
    if single_call:
        out = build_single_call(city_id, city_name, today, ctx, lang)
        if use_cache:
            cache.put(city_id, lang, today, out)
        return out
    kb = city_sections(city_id)
    out = {}
    for name in SECTIONS:
        ps = []
        if name == "history" and "history" in kb:
            ps = [P.kb_section(1, kb["history"])]
        elif name == "attractions":
            ps = [P.attractions(1, city_name, ctx.get("attractions", []), today)]
        elif name == "culture_etiquette":
            ps = [P.kb_section(i, kb[s]) for i, s in enumerate(("culture", "etiquette"), 1) if s in kb]
        elif name == "events":
            ps = [P.events(1, city_name, today, ctx.get("events_current", []), ctx.get("events_upcoming", []))]
        elif name == "weather":
            ps = [P.weather(1, city_name, ctx.get("weather", []), ctx.get("season"),
                            ctx.get("peak_season", False))]
        elif name == "safety":
            ps = [P.advisories(1, city_name, today, ctx.get("advisories", []))]
            if "safety" in kb:
                ps.append(P.kb_section(2, kb["safety"]))
        out[name] = briefing_section(name, TASKS[name], ps, lang)
    if use_cache:
        cache.put(city_id, lang, today, out)
    return out
