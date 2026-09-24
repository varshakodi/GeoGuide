# ai/ — retrieval, grounded generation, refusal

| File | Role |
|---|---|
| `config.py` | All settings from env; `GROUNDING_ENABLED` is the demo switch |
| `corpus.py` | Loads documents from the DB; derives the city for POI-level chunks and the source label for POI facts |
| `index.py` | Builds and opens the Chroma index (cosine; similarity = 1 − distance) |
| `retrieval.py` | City-filtered top-k + the relevance gate (refusal layer 1) |
| `refusal.py` | Layer 3 intent rules and the message catalogue |
| `passages.py` | Turns backend rows (weather, events, advisories) into numbered passages |
| `pipeline.py` | Orchestration: layer 3 → layer 1 → LLM → layer 2 → citation check |
| `briefing.py` | Which passages each briefing section gets |
| `citations.py` | Parses `[n]`, maps to source labels, drops uncited sentences |
| `llm.py` | Gemini with key rotation, Ollama fallback |
| `evals/` | Question set and the measurement runner |

## Backend interface

```python
from ai.briefing import build as build_briefing
from ai.pipeline import answer_question

answer_question(question, city_id, lang="en-IN")
# -> {"type": "answer", "claims": [{text, source_labels, confidence}], "flagged": bool}
# -> {"type": "refusal", "layer": 1|2|3, "reason": str, "message": str}

build_briefing(city_id, city_name, today, ctx, lang)
# ctx = {"weather": rows, "events_current": rows, "events_upcoming": rows, "advisories": rows}
# -> {section_name: answer-or-refusal}
```

## Build the index

```bash
python -m ai.index --reset
```
