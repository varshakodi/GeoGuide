# Architecture

One request path. Retrieval and source-attribution fence the LLM, so it never generates
outside retrieved context.

```
  React (frontend/src)
    Arrive · Briefing + date shift · Nearby · Right now · Ask
        │ lat/lng, for_date, lang, question
        ▼
  FastAPI (backend/ai_routes.py)
    /context  /dates  /briefing  /nearby  /now  /ask  /grounding  /health
        │                         │
        │ rows                    │ ranking (no model)
        ▼                         ▼
  data_queries.py            ranker.py
    PS-13.db (read-only)       eligibility + score + reasons
        │
        ▼
  ai/ pipeline
    1. layer 3  unsupported intent      → refuse, no model call
    2. layer 1  relevance gate (Chroma, city-filtered, threshold)
                                        → refuse, no model call
    3. LLM      passages only, cite every sentence with [n]
    4. layer 2  sentinel check          → refuse
    5. citations: map [n] → source_label, drop uncited sentences
                                        → refuse if nothing survives
```

## Why the layers are in this order

Layer 3 runs before retrieval because some unanswerable questions retrieve *well*. "How
much is a cab to the airport right now?" sits close to the transport chunk and clears any
usable threshold, so a threshold alone cannot refuse it.

Layer 1 decides whether the model is called at all. No prompt can override it, and turning
grounding off empties retrieval, which is why every answer then refuses.

## Briefing assembly

Briefing sections are fetched by `section` rather than by vector search, because each city
has exactly one chunk per section. Structured rows — weather, events, advisories,
attractions — are formatted into numbered passages with their table as the source label, so
they pass through the same citation check as KB prose. Empty results ("no events are
scheduled on this date") are themselves grounded: they come from a real query.

All passages for a briefing are numbered once and sent in a single LLM call that writes six
fixed headings. One call instead of six keeps the free-tier quota viable and removes five
round trips.

## Date-shift

`for_date` flows through `/context`, `/briefing`, `/nearby` and `/now`. It is clamped to the
dataset range from `weather_daily`. For that date the backend recomputes: events in window,
the season (from the weather row, falling back to `cities.season_profile`), whether the month
is in `peak_months`, the weather rows, the advisories valid at noon on that date, and which
attractions are open given `closed_days`. The cache key includes the date, so each date has
its own entry.

## Failure paths

| Failure | Behaviour |
|---|---|
| Gemini quota | Rotate keys, back off, then fall back to a local Ollama model |
| No network at all | "No internet connection" message; cached briefings still render |
| Retrieval below threshold | Refusal at layer 1, no model call |
| Model answers without citations | Sentences dropped; if none survive, refusal |
| API unreachable from the UI | Banner plus sample data, clearly marked offline |
