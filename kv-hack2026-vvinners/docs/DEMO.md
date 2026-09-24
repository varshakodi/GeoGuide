# Demo path — exact clicks

Before: `uvicorn backend.main:app --port 8000`, `npm run dev`, and `python -m ai.prewarm`
so nothing on stage needs a live call. Check `/health` shows the index at 3173 + 900.

| # | Action | What to say |
|---|---|---|
| 1 | Open the app on **Bengaluru** | "It asks for location, resolves the city from 60 in the data, and reads the date and season." |
| 2 | **Brief me** | "Six sections. Every sentence names the row or chunk it came from." |
| 3 | Point at the events section | "Nothing is scheduled today, and it says so. It does not invent a festival." |
| 4 | **Move the date to 17 October** | "Same city, different date. Events, season framing and the weather tips recompute from the data, and the sources change with them." |
| 5 | Move to an empty week | "Empty again, reported honestly." |
| 6 | Switch to **Hyderabad** | "A festival is running today — the on-now state, from real rows." |
| 7 | Switch to **Pune** | "A live safety advisory, valid on this date." |
| 8 | **Right now** | "Ranked by open-now, distance, time fit and budget. Every reason names its field. No model is involved, so it's reproducible." |
| 9 | **Ask**: "Anything to know before Bengaluru Bazaar?" | "Answered, and flagged lower-confidence because the underlying fact is marked low." |
| 10 | **Ask**: "How much is a cab to the airport right now?" | "It refuses. That question retrieves well — it looks like the transport chunk — so the threshold alone wouldn't catch it. A separate layer does." |
| 11 | **Turn grounding OFF**, ask anything | "Every answer refuses. Nothing was ever coming from the model's own knowledge." |

Timing: aim for 4 minutes, leaving the rest for questions. If you are short, cut steps 5 and 8.

## Likely questions

- *"How do you know it isn't hallucinating?"* Step 11, plus `pytest tests/test_grounding.py`.
- *"What if the date has no data?"* Dates clamp to the dataset range; `tests/test_date_shift.py`.
- *"Is this only Bengaluru?"* Four cities are demoed; all 60 work — no city ID is hardcoded.
- *"Is the demo pre-baked?"* Briefings are cached after a real generation; `?fresh=true` regenerates live.
