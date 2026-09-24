# GeoGuide — Location-Aware AI Place Companion

## 1. Team & Problem Statement

**Team VVinners** — BMS College of Engineering
**PS-13 · GeoGuide — Location-Aware AI Place Companion**, KogniVera Hackathon 2026.

Members: Vamika A Bhat (AI & RAG pipeline, grounding guard) · Vishnu Mashalkar (backend & API, orchestration) · Vachana M H (frontend & UI/UX) · Varsha Kusumadhara Kodi (data & embeddings, conformance).

## 2. What we built

- **Location → place → briefing.** The app requests device location, resolves the nearest of the 60 cities by haversine, and returns a grounded briefing for that place, date and season. A picker covers the demo when permission is denied.
- **Six-section AI briefing** — history, top attractions, what's on, weather-appropriate tips, culture & etiquette, safety — every sentence carrying a visible source chip naming the row or KB chunk it came from.
- **Date-Shift Briefing (mandatory enhancement).** A date control moves the briefing to any date the dataset covers. Events, season framing, weather tips, open attractions and advisory validity all recompute from `events_festivals`, `weather_daily`, `activities_poi` and `safety_advisories`, with sources shown. A date with nothing scheduled says so.
- **Nearby places and hotels** from `activities_poi` and `hotels`, and a **Right now** ranker that picks what fits the next 90 minutes, showing the data-derived reason for each choice.
- **Natural-language follow-up Q&A**, grounded per turn, with low-confidence facts flagged and references like "there" resolved from the previous turn.
- **Refusal instead of invention.** Three layers plus a citation check. Turning grounding off makes every answer refuse — the proof that nothing comes from model memory.
- **Text or voice, in English, Hindi and the city's own language** (Kannada, Marathi or Telugu), read from `cities.primary_language` and `languages.tts_supported`.

## 3. Architecture

```
React (frontend/)
  │  location · date · language · question
  ▼
FastAPI (backend/)  ── data_queries.py ──► PS-13.db   (read-only)
  │                 └─ ranker.py  (Contextual Action Engine, no model)
  ▼
ai/  retrieval ──► Chroma (3,173 KB windows + 900 POI facts)
     │  layer 3 intent → layer 1 relevance gate → LLM → layer 2 sentinel → citation check
     ▼
  claims + source labels, or a refusal
```

Full detail: `docs/ARCHITECTURE.md`.

## 4. Data model

Canonical tables used unchanged: `cities`, `place_kb`, `poi_facts_kb`, `activities_poi`, `events_festivals`, `weather_daily`, `safety_advisories`, `hotels`, `languages`, `currencies`, `countries`.

Added beside them, never renaming or re-keying anything (Rule R1): a ChromaDB index over `place_kb` and `poi_facts_kb`, a derived source label for POI facts (the table ships without one), a disk cache of generated briefings, and in-process session state for follow-ups. Details and reasons: `data-model/DATA_MODEL.md`.

Boundary rules R1–R8 are enforced in `backend/data_queries.py` and covered by `tests/test_boundary_rules.py`.

## 5. AI features

| Capability | Mechanism | How it is grounded |
|---|---|---|
| Briefing | RAG over `place_kb` city chunks plus structured rows, one LLM call, six fixed sections | Every sentence must carry `[n]`; uncited sentences are dropped before display |
| Date-shift | Passages rebuilt from `events_festivals`, `weather_daily`, `activities_poi`, `safety_advisories` for the chosen date | Passage text is generated from the rows themselves, including "nothing scheduled" |
| Follow-up Q&A | Sentence-window vector search (multilingual MiniLM, cosine) filtered by city, top-k with a relevance gate | Below threshold, the model is never called |
| Refusal | Layer 3 intent rules → layer 1 gate → layer 2 sentinel → citation check | A cab-fare question retrieves well but is refused before generation |
| Confidence | `poi_facts_kb.confidence` | `low` facts carry a "verify locally" flag |
| Right now | Deterministic ranker, no model | Each pick lists the fields its reasons came from |
| Multilingual | One English KB, generation in the target language | Facts come from retrieval, so only the surface language changes |

Retrieval note: `place_kb` bodies are indexed as overlapping 2-sentence windows, not whole paragraphs. Measured on this corpus, a tap-water sentence scores 0.78 alone and 0.17 inside its paragraph; titles are excluded from the embedded text because "Bengaluru — safety" pulled any question containing "safe" to the wrong chunk.

## 6. Run it locally

```bash
python3 -m venv .venv && source .venv/bin/activate
pip install -r backend/requirements.txt
cp .env.example .env          # add GEMINI_API_KEY and GEMINI_MODEL
python -m ai.index --reset    # builds the vector index: 3173 + 900
uvicorn backend.main:app --port 8000
# in a second terminal
cd frontend && npm install && npm run dev      # http://localhost:5173
```

Optional: `python -m ai.prewarm` generates the demo briefings once so the demo needs no live call. Offline fallback: set `OLLAMA_MODEL` and run `ollama serve`.

## 7. Demo path

1. Open the app. It resolves your location (or pick **Bengaluru**) and shows date, season and weather.
2. **Brief me** → six grounded sections, each with a source chip. Events show "nothing scheduled" honestly.
3. **Move the date to 17 October** → the events section now names Monsoon Music Nights and the weather tips change, with sources.
4. Switch to **Hyderabad** → a festival is on now today; **Pune** → a live safety advisory.
5. **Right now** → ranked picks with the reason chips behind each one.
6. **Ask** "Anything to know before Bengaluru Bazaar?" → answered and flagged low-confidence. Then "How much is a cab to the airport right now?" → refused.
7. **Turn grounding OFF** → every answer refuses. Nothing came from model memory.

Full click-path: `docs/DEMO.md`.

## 8. Tests / proof

```bash
python -m pytest tests -q            # 27 tests, no API key needed
python -m ai.evals.run_eval --set adversarial   # every adversarial question must refuse
python -m ai.evals.run_eval                     # grounding, refusal, flag and latency numbers
```

`tests/test_grounding.py` is the hard proof: grounding off refuses everything, sentences without a citation are dropped, an entirely uncited answer becomes a refusal, and the adversarial set refuses. `tests/test_date_shift.py` proves the enhancement: dates clamp to the dataset, events change with the date, an empty date says so and names no festival, and a festival date names the real event.

## Tools and libraries disclosed

FastAPI, Uvicorn, Pydantic, ChromaDB, sentence-transformers (`paraphrase-multilingual-MiniLM-L12-v2`), google-genai (Gemini), python-dotenv, pytest, React, Vite. Optional local fallback: Ollama. Claude (Anthropic) was used as an AI coding assistant during the hackathon window.

### Visual assets disclosure

The city hero images in `frontend/public/cities/` are downloaded from Wikimedia Commons and used under their listed Creative Commons licenses:

- Bengaluru: [Bangalore skyline (7121517855).jpg](https://commons.wikimedia.org/wiki/File:Bangalore_skyline_%287121517855%29.jpg), CC BY 2.0, Saad Faruque.
- Mumbai: [Mumbai skyline category](https://commons.wikimedia.org/wiki/Category:Skylines_of_Mumbai), Wikimedia Commons source.
- Hyderabad: [Charminar Evening View Hyderabad.jpg](https://commons.wikimedia.org/wiki/File:Charminar_Evening_View_Hyderabad.jpg), free-use Wikimedia Commons upload.
- Pune: [Pune Skyline.jpg](https://commons.wikimedia.org/wiki/File:Pune_Skyline.jpg), CC BY-SA 3.0, Tushar Mote.

`default.jpg` is a local fallback copy of the Bengaluru image.
