# Wiring guide — read this first

Everything here was written and tested against the real PS-13 database. What could not be
tested here: the Gemini call, the embedding model, and the browser. Budget 20 minutes.

## 1. Drop it in (2 min)

Unzip at the repo root. It overwrites `ai/`, `backend/`, `tests/`, `README.md` and adds
`frontend/`, `docs/`, `data-model/DATA_MODEL.md`, `.env.example`.

```bash
python -m pytest tests -q          # expect 27 passed, no API key needed
```

If that passes, the logic is sound and only wiring remains.

## 2. Update .env (1 min)

`TOP_K=6` is the one value to change from yours. Keep your `RELEVANCE_THRESHOLD` if you
recalibrated it after the windowing change; otherwise re-measure (see step 5).

## 3. Rebuild the index if you haven't (5 min)

```bash
python -m ai.index --reset         # {'place_kb': 3173, 'poi_facts_kb': 900}
```

## 4. Start both halves (2 min)

```bash
uvicorn backend.main:app --port 8000
cd frontend && npm install && npm run dev
```

Open http://localhost:5173. Without the API the UI shows a banner and sample data, so a
blank screen means the frontend itself failed — check the terminal.

## 5. Check the three things most likely to be wrong (5 min)

```bash
curl -s localhost:8000/health
curl -s "localhost:8000/briefing?city_id=cty_718f03c7&fresh=true" | head -c 400
curl -s "localhost:8000/briefing?city_id=cty_17b8ef2f&for_date=2026-10-17&fresh=true" | python -m json.tool | head -30
```

1. `/health` shows 3173 + 900.
2. Hyderabad briefing has six sections, all `type: answer`.
3. The 17 October briefing's events section names Monsoon Music Nights.

If sections come back as `refusal / sentinel`, print the raw model output before parsing —
the six headings must match `## history` exactly.

## 6. Prewarm and commit (5 min)

```bash
python -m ai.prewarm --langs en-IN --dates 2026-09-24 2026-10-17
git add -A && git commit -m "Date-shift briefing, attractions, ranker, frontend, tests, docs"
git push
```

## What is new since your snapshot

| Area | Change |
|---|---|
| `ai/llm.py` | Clients reused per key (fixes "client has been closed"); quota backoff across keys |
| `ai/briefing.py` | One LLM call for the whole briefing instead of six; new **attractions** section; date-aware |
| `ai/passages.py` | Season and extreme-weather in the weather passage; new attractions passage |
| `ai/cache.py`, `ai/prewarm.py` | Disk cache of complete briefings; never caches a refusal |
| `ai/session.py` | "there" resolved from the previously cited POI |
| `backend/data_queries.py` | `date_range`, `clamp_date`, `season_for`, `event_days`, closed-day handling |
| `backend/ranker.py` | Contextual Action Engine with reasons |
| `backend/ai_routes.py` | `for_date` everywhere, `/dates`, `/now` |
| `frontend/` | Whole app: five screens, date control, TTS, languages, grounding toggle |
| `tests/` | 27 tests: grounding, date-shift, boundary rules, city isolation |
| docs | README (8 required sections), DATA_MODEL.md, ARCHITECTURE.md, DEMO.md |

## Hand these to the team

- **Vishnu:** `backend/ranker.py` is his to tune (weights, the 90-minute window, budget from `user_preferences`). `/briefing` streaming is still unbuilt if he wants it.
- **Varsha:** `data-model/DATA_MODEL.md` needs the sha256 line and any additions she made; `tests/test_boundary_rules.py` is the conformance evidence.
- **Vachana:** `frontend/` compiles and runs; the visual pass is hers — spacing, the palette, and checking which TTS voices exist on the demo device.

## Known gaps

- No SSE streaming; briefings arrive in one response. The cache makes them fast, which was the reason for streaming.
- Kannada, Marathi and Telugu UI labels fall back to English; the *content* is generated in those languages.
- The ranker's budget must be passed explicitly; it does not yet read `user_preferences`.
