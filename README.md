# 🌍 GeoGuide — Location-Aware AI Place Companion

> **A travel companion that doesn't just tell you about a place — it proves where every fact came from.**

**Team VVinners · BMS College of Engineering**
**KogniVera Hackathon 2026 · PS-13 — GeoGuide: Location-Aware AI Place Companion**

---

## 1. Team & Problem Statement

**VVinners** (BMS College of Engineering): Vamika A Bhat (AI & RAG), Vishnu Mashalkar (backend), Vachana M H (frontend), Varsha Kusumadhara Kodi (data & conformance).
**PS-13 — GeoGuide: Location-Aware AI Place Companion**, with the mandatory **Date-Shift Briefing** enhancement.

## 2. What we built

- **Location → place → context.** On first launch the app asks for device location (city picker as fallback), resolves the nearest of the 60 cities, and reads the date and season — `GET /context`, `frontend/src/hooks/useGeoLocation.js`.
- **Grounded six-part briefing** (history, attractions, what's on, weather, culture & etiquette, safety). Every sentence carries a source chip; uncited sentences are dropped — `GET /briefing`, `ai/briefing.py`, `ai/citations.py`.
- **Date-Shift Briefing (mandatory enhancement).** A date control covering the whole dataset (festival weeks marked). Events, season and weather tips recompute from `events_festivals` and `weather_daily`, each citing its row id (`events_festivals / evt_…`, `weather_daily / wth_…`). An empty date says *"Nothing is scheduled in <city> on <date>."* — `backend/date_facts.py`.
- **Nearby places and hotels** from `activities_poi` and `hotels`, plus a deterministic **Right now** ranker (open now, distance, time fit, budget) with a field-level reason for every pick — `GET /nearby`, `GET /now`, `backend/ranker.py`.
- **Follow-up Q&A** that is grounded or refused (live fares, bookings, made-up places), in English, Hindi and Kannada, with **read-aloud** (browser TTS) — `POST /ask`, `ai/pipeline.py`, `ai/refusal.py`.

## 3. Architecture

`React + Vite (frontend/)` → `FastAPI (backend/)` → `PS-13.db` (read-only SQLite) + `ChromaDB` index over `place_kb` and `poi_facts_kb` → `Gemini` (Ollama optional) → citation check → UI with source chips. Full diagram: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) and the Architecture section below.

## 4. Data model

Canonical tables used unchanged: `cities`, `place_kb`, `poi_facts_kb`, `activities_poi`, `events_festivals`, `weather_daily`, `safety_advisories`, `hotels`, `languages`, `currencies`, `countries`. Additions (vector index, derived source labels, briefing cache, retrieval log, row-cited date facts) and the boundary rules R1–R8 enforced in code are in [data-model/DATA_MODEL.md](data-model/DATA_MODEL.md).

## 5. AI features

| Capability | Mechanism | Grounding |
|---|---|---|
| Briefing | One Gemini call over numbered passages built from DB rows and `place_kb` chunks | Every sentence must cite `[n]`; uncited sentences are dropped; a sentinel refuses a section |
| Q&A | `paraphrase-multilingual-MiniLM-L12-v2` embeddings + ChromaDB, city-filtered | Intent rules (layer 3) → relevance gate (layer 1) → sentinel + citation check (layer 2) |
| Date facts & tips | Deterministic rules over `weather_daily` / `events_festivals` | Each line names the row id and field it read |
| Right now | Deterministic ranker, no model | Each reason names its `activities_poi` field |
| Offline fallback | If no LLM is reachable, sections quote their passages verbatim, cited, and are labelled as such | A question naming a place the sources never mention is refused |

## 6. Run it locally

```bash
python3 -m venv .venv && source .venv/bin/activate
pip install -r backend/requirements.txt
cp .env.example .env              # set GEMINI_API_KEY and GEMINI_MODEL
python -m ai.index --reset        # builds .chroma/ from PS-13.db (~1 min)
python -m ai.prewarm --dates 2026-09-24 2026-10-17   # optional: cache the demo briefings
uvicorn backend.main:app --port 8000
cd frontend && npm install && npm run dev            # open http://localhost:5173
```

## 7. Demo path

Arrive (Bengaluru) → **Open briefing** → note *"Nothing is scheduled in Bengaluru on 2026-09-24"* with its source → click the **Monsoon Music Nights** chip on the date control (17 Oct): events, season and tips recompute with new row ids → **Right now** → **Ask** "Anything I should know before Bengaluru Bazaar?" → **Ask** "How much is a cab to the airport right now?" (refused) → **Grounding off** (every section refuses). Detailed script: [docs/DEMO.md](docs/DEMO.md).

## 8. Tests / proof

```bash
python -m pytest tests -q                         # 32 tests
python -m ai.evals.run_eval --set adversarial      # refusal eval (needs the index)
```

Hard proof: `tests/test_grounding.py` (grounding off refuses everything, uncited output becomes a refusal), `tests/test_date_shift.py` and `tests/test_date_facts.py` (events/season/tips change with the date, an empty date is reported honestly, the fallback refuses a made-up landmark), `tests/test_boundary_rules.py` (R1–R8).

---

## 🧭 What is GeoGuide?

Imagine arriving in a new city.

You want to know:

* **Where am I?**
* **What is important about this place?**
* **What can I do nearby right now?**
* **What's happening today?**
* **What should I know before visiting?**
* **Can I trust what this AI is telling me?**

GeoGuide brings all of this into one location-aware AI companion.

The app uses the traveller's **location, date, season, language and preferences** to create a personalized place briefing, recommend nearby activities, answer follow-up questions, and read the information aloud.

But there is one principle behind the entire system:

> **If GeoGuide cannot ground an answer in the provided data, it does not answer.**

This is the core of our solution.

The PS-13 problem asks for a location-aware companion while requiring that generated information is grounded rather than freely invented. GeoGuide therefore makes **provenance visible to the user**, rather than hiding it inside the AI pipeline.

---

# 🎯 Problem We Are Solving

Travel information is usually fragmented across maps, search engines, blogs, booking platforms and AI assistants.

An AI assistant can make this easier — but it introduces another problem:

### **How does the traveller know whether the answer is actually supported by data?**

GeoGuide addresses both problems:

| Traveller need                        | GeoGuide solution                         |
| ------------------------------------- | ----------------------------------------- |
| "Where am I?"                         | Location detection + city resolution      |
| "Tell me about this place."           | Six-section grounded briefing             |
| "What's happening today?"             | Date-aware event retrieval                |
| "What should I do now?"               | Contextual Action Engine                  |
| "What is nearby?"                     | Grounded POI and hotel suggestions        |
| "What should I know before visiting?" | Culture, etiquette and safety information |
| "Can I ask a follow-up?"              | Grounded conversational Q&A               |
| "Can I use my language?"              | English + Hindi + Kannada                 |
| "Can I listen instead of read?"       | Text-to-speech                            |
| "What if the AI doesn't know?"        | Explicit refusal instead of guessing      |
| "How do I verify the answer?"         | Visible source chips on claims            |

---

# ✨ What We Built

GeoGuide is an end-to-end application with five major capabilities.

## 1. 📍 Location → Place → Briefing

When the app opens:

```text
Device Location
      ↓
Nearest supported city
      ↓
Current date + season
      ↓
Grounded retrieval
      ↓
AI-generated briefing
```

The application requests device location and resolves it to the nearest supported city using geographic distance.

If location permission is unavailable, the demo can use a city picker instead.

The briefing adapts to:

* City
* Date
* Season
* Weather
* Events
* Safety advisories
* Language

---

# 2. 📰 Six-Part Grounded Briefing

GeoGuide generates a structured briefing containing:

### 🏛️ History

Important historical context about the place.

### 📍 Top Attractions

Relevant places and points of interest.

### 🎉 What's On

Events and festivals relevant to the selected date.

### ☁️ Weather-Aware Tips

Advice derived from the weather data for that date.

### 🙏 Culture & Etiquette

Locally relevant cultural information.

### ⚠️ Safety

Applicable safety advisories.

Every factual claim displayed to the user carries a **visible source chip**.

For example:

```text
Remove footwear at religious sites.

        ✓ KV Guide / etiquette
```

or:

```text
No festivals are scheduled for this date.

        ✓ events_festivals
```

The source is part of the user interface — not hidden in a technical log.

---

# 3. 📅 Date-Shift Briefing

### Mandatory enhancement

GeoGuide is not restricted to "today".

The user can change the date and the application rebuilds the relevant context for that date.

For example:

```text
24 September
      ↓
Select 17 October
      ↓
events_festivals
weather_daily
activities_poi
safety_advisories
      ↓
New grounded briefing
```

This means the application can change:

* Events and festivals
* Weather-related advice
* Applicable safety advisories
* Relevant activities
* Opening information

If nothing is scheduled on a selected date, GeoGuide explicitly says so.

### No fabricated events.

A date with no matching event produces:

> **Nothing scheduled for this date.**

This is an important part of our grounding philosophy: **absence of data is represented as absence of information, not replaced with an invented answer.**

---

# 4. ⚡ "Right Now" — Contextual Action Engine

A travel companion should not only describe a city.

It should help answer:

> **"What can I actually do in the next 90 minutes?"**

GeoGuide includes a deterministic **Contextual Action Engine (CAE)**.

It ranks nearby activities using available structured data such as:

* Current location
* Distance
* Opening hours
* Time required
* Entry cost
* Budget
* Activity type
* Season
* Weather-related context

Example:

```text
RIGHT NOW
Next 90 minutes

1. Bengaluru Bazaar
   Open till 21:00
   1.4 km
   ~90 min
   ₹350

   Why:
   ✓ Open now
   ✓ Fits time
   ✓ Matches activity preference

2. Bengaluru Viewpoint
   Open till 21:00
   2.1 km
   ~60 min
   ₹50

   Why:
   ✓ Open now
   ✓ Fits time
   ✓ In season
```

The important distinction is:

> **The recommendation is calculated from data — it is not an LLM-generated guess.**

The original PS-13 design describes this as ranking what can be done in the next 90 minutes using factors such as open-now status, distance, time-fit and budget, with each recommendation exposing its data-derived reasons.

---

# 5. 💬 Grounded Follow-Up Q&A

After receiving the briefing, users can continue naturally:

```text
User:
"Anything I should know before Bengaluru Bazaar?"

GeoGuide:
"Footwear is removed before the inner area;
socks help on cold stone."

LOWER CONFIDENCE
✓ poi_facts_kb
```

The conversation maintains context, so references such as:

> "there"

or

> "that place"

can be resolved using the previous turn.

Each follow-up is retrieved and grounded independently.

---

# 🛑 The Most Important Feature: GeoGuide Refuses to Guess

Most AI systems are optimized to produce an answer.

GeoGuide is deliberately designed to sometimes **not answer**.

Consider:

> **"How much is a cab to the airport right now?"**

If the provided data does not contain a live cab fare:

```text
No live fares in the grounded data,
so I won't guess.

        ✕ no grounded data
```

The system does not invent a number.

It also refuses unsupported/adversarial questions such as:

* Live information that is not in the dataset
* Today's unsupported exchange rate
* Made-up landmarks
* Facts outside the retrieved knowledge

### Grounding OFF test

We included a particularly important demonstration:

```text
GROUNDING ON
      ↓
Retrieve relevant evidence
      ↓
Generate grounded answer

GROUNDING OFF
      ↓
No trusted evidence
      ↓
REFUSE
```

Turning grounding off causes answers to refuse rather than fall back to the model's general memory.

This gives us a direct way to demonstrate that the application is actually using its grounding layer.

The submission explicitly identifies retrieval-off refusal as the proof point for the grounding requirement.

---

# 🧠 How the AI Works

GeoGuide uses a **Retrieval-Augmented Generation (RAG)** architecture.

At a high level:

```text
                    ┌──────────────────┐
                    │     React UI     │
                    │ location/date/   │
                    │ language/query   │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │     FastAPI      │
                    │   Backend/API    │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │   PS-13.db      │
                    │ Structured Data │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │   Retrieval      │
                    │ ChromaDB +       │
                    │ embeddings       │
                    └────────┬─────────┘
                             │
                       Relevance Gate
                        ↙          ↘
                 Relevant          Not relevant
                    │                   │
                    ▼                   ▼
              ┌──────────┐          REFUSE
              │   LLM    │
              │ Gemini   │
              └────┬─────┘
                   │
                   ▼
            Citation / Claim Check
                   │
                   ▼
          Grounded response
          + source chips
```

The critical part is the **relevance gate**.

The LLM is not simply given a question and asked to answer it.

Instead:

1. Retrieve relevant evidence.
2. Check whether retrieval is sufficiently relevant.
3. If evidence is insufficient → **refuse**.
4. If evidence is sufficient → send retrieved context to the LLM.
5. Require citations for generated claims.
6. Remove unsupported uncited claims before displaying the answer.

---

# 🛡️ Three-Layer Grounding Guard

GeoGuide uses multiple protections against hallucination.

## Layer 1 — Relevance Gate

If retrieval does not produce sufficiently relevant information:

```text
No sufficient evidence
        ↓
LLM is NOT called
        ↓
Refusal
```

This prevents the model from filling missing information from memory.

## Layer 2 — Generation Constraint

When the LLM is called, it receives only the retrieved context.

The prompt requires the model to:

* Use only retrieved passages
* Attach citations
* Omit unsupported claims
* Return insufficient information when evidence is missing

## Layer 3 — Citation Check

After generation:

```text
Generated answer
      ↓
Check claims
      ↓
Has source?
  ↙       ↘
YES       NO
 ↓         ↓
Show    Drop claim
```

If an entire answer becomes uncited, GeoGuide refuses instead of showing it.

---

# 🔍 Retrieval Design

The knowledge base is not embedded as large paragraphs.

`place_kb` content is divided into **overlapping two-sentence windows** before indexing.

This improves retrieval precision.

For example, a sentence specifically about tap water can be retrieved independently instead of being buried inside a large city paragraph.

Titles are also excluded from the embedded text to prevent generic words such as "safe" from pulling unrelated safety sections.

The current index contains:

```text
3,173 KB windows
+
900 POI facts
```

---

# 📊 Data Grounding

The provided **PS-13.db is the source of truth**.

We use the provided tables directly and follow the additive-only data rule.

### Core tables

| Table               | GeoGuide uses it for                               |
| ------------------- | -------------------------------------------------- |
| `cities`            | Location, city identity, season and language       |
| `place_kb`          | Main RAG knowledge base                            |
| `poi_facts_kb`      | Grounded POI facts + confidence                    |
| `activities_poi`    | Nearby places, opening hours, cost and coordinates |
| `events_festivals`  | Date-aware events and festivals                    |
| `weather_daily`     | Weather and weather-aware advice                   |
| `safety_advisories` | Safety information                                 |
| `hotels`            | Nearby accommodation                               |
| `languages`         | Language and TTS support                           |
| `currencies`        | Currency-related structured information            |
| `countries`         | Country relationships                              |

The original dataset contains **19 tables and 23,215 rows**, with GeoGuide using the required subset without renaming or repurposing the provided fields.

### What we add

We add supporting infrastructure **beside** the supplied data:

* ChromaDB vector index
* Retrieval logs
* Generated briefing cache
* Session conversation state
* Derived source labels where required

We do **not** replace the supplied data model.

---

# 🌐 Multilingual + Voice

GeoGuide supports:

* 🇬🇧 English
* 🇮🇳 Hindi
* 🟡 Kannada

The language is selected using the supported language information in the dataset.

The same grounded facts are retrieved regardless of the output language.

Only the **surface language** changes.

```text
PS-13 data
     ↓
Same grounded facts
     ↓
English / Hindi / Kannada
     ↓
Text or TTS
```

This means multilingual output does not require maintaining separate knowledge bases.

The PS-13 design specifically calls for Hindi and Kannada support alongside English, including voice read-aloud where supported.

---

# 🏗️ Architecture

```text
React Frontend
│
├── Location
├── Date
├── Language
├── Briefing UI
├── Nearby & Act
├── Right Now
├── Follow-up Q&A
└── Text / Voice
        │
        ▼
FastAPI Backend
│
├── Place resolution
├── Date / season handling
├── Data queries
├── Session state
└── Contextual Action Engine
        │
        ├──────────────► PS-13.db
        │
        ▼
AI / RAG
│
├── Retrieval
├── Relevance gate
├── Gemini generation
├── Citation check
└── Confidence handling
        │
        ▼
Grounded claims
+
Source labels
OR
Refusal
```

---

# 🧰 Technology Stack

| Layer                     | Technology                           |
| ------------------------- | ------------------------------------ |
| Frontend                  | React + Vite                         |
| Backend                   | Python + FastAPI                     |
| Database                  | SQLite / provided `PS-13.db`         |
| Vector Database           | ChromaDB                             |
| Embeddings                | Sentence Transformers                |
| LLM                       | Gemini API                           |
| Validation                | Pytest                               |
| Voice                     | Browser Web Speech API / TTS         |
| Environment               | Python virtual environment + Node.js |
| Optional offline fallback | Ollama                               |

---

# 👥 Team VVinners

| Member                      | Responsibility                     |
| --------------------------- | ---------------------------------- |
| **Vamika A Bhat**           | AI & RAG pipeline, grounding guard |
| **Vishnu Mashalkar**        | Backend, API & orchestration       |
| **Vachana M H**             | Frontend & UI/UX                   |
| **Varsha Kusumadhara Kodi** | Data, embeddings & conformance     |

The team ownership follows the architecture submitted for PS-13.

---

# 🧪 Testing & Proof

GeoGuide is designed to be **measurable**, not just visually demonstrable.

## Automated tests

```bash
python -m pytest tests -q
```

Tests cover:

* Grounding behaviour
* Citation enforcement
* Refusal behaviour
* Date shifting
* Empty-event dates
* Festival dates
* Boundary rules
* Adversarial questions
* Data conformance

## AI evaluation

```bash
python -m ai.evals.run_eval --set adversarial
```

and:

```bash
python -m ai.evals.run_eval
```

### Important proof cases

| Test                    | Expected behaviour        |
| ----------------------- | ------------------------- |
| Valid grounded question | Answer with sources       |
| Low-confidence fact     | Answer + "verify locally" |
| No relevant retrieval   | Refuse                    |
| Live cab fare           | Refuse                    |
| Made-up landmark        | Refuse                    |
| Grounding disabled      | Refuse                    |
| Date with event         | Show event                |
| Date without event      | Say nothing is scheduled  |
| Action recommendation   | Show data-derived reasons |

---

# 📈 What We Measure

GeoGuide targets measurable properties rather than relying only on subjective quality.

### Grounding

**100% of displayed claims carry a source label.**

### Refusal

Unsupported and adversarial questions are refused rather than answered from model memory.

### Confidence

Low-confidence facts are explicitly marked:

> **Verify locally**

### Action Engine

Each recommendation exposes its data-derived reasoning.

### Conformance

The provided database schema is checked against the required constraints.

### Latency

The first briefing is designed to begin rendering within approximately **3 seconds** under the demonstrated setup.

These metrics and behaviours are part of the PS-13 submission's verification strategy.

---

# 🎬 Judge Demo — Recommended 3-Minute Flow

The easiest way to understand GeoGuide is to follow one traveller.

## Step 1 — Arrive

Open GeoGuide.

```text
Location detected
        ↓
Bengaluru
        ↓
24 September
        ↓
Current season + weather
```

Show the initial context.

---

## Step 2 — Brief Me

Click:

> **Brief me on Bengaluru**

Show the six sections.

Point out:

> **Every claim has a source chip.**

This demonstrates the central thesis immediately.

---

## Step 3 — Shift the Date

Move the date to:

> **17 October**

Show how the briefing changes.

The events section now retrieves the matching event, and the weather/date-sensitive information is rebuilt from the selected date.

This demonstrates that the app is **data-aware, not a static chatbot response**.

---

## Step 4 — Right Now

Click:

> **What should I do in the next 90 minutes?**

Show the ranked activities.

Point to the reasons:

```text
Open now
Distance
Time fit
Budget
Interest
```

Explain:

> **The ranking is deterministic and data-driven — the LLM is not deciding what to recommend.**

---

## Step 5 — Ask

Ask:

> **"Anything to know before Bengaluru Bazaar?"**

Show the grounded answer and confidence indicator.

Then ask:

> **"How much is a cab to the airport right now?"**

GeoGuide responds:

> **No live fares in the grounded data, so I won't guess.**

This is the key **refusal moment**.

---

## Step 6 — Grounding OFF

Turn grounding off.

Ask another question.

Show:

> **Refusal**

This demonstrates that the AI does not silently fall back to general model knowledge.

---

# 🚫 What GeoGuide Deliberately Does NOT Do

We intentionally kept the scope focused.

### No booking or payments

GeoGuide surfaces hotels and places but does not perform transactions.

### No live third-party fact APIs

The demo does not depend on Maps, live search or external fact APIs.

### No second replacement database

The provided PS-13 data remains the source of truth.

### No AR/XR

GeoGuide is a web/mobile application and does not require an AR/VR device.

### No fabricated live information

If a fact is not supported by the available data, GeoGuide refuses.

These boundaries were deliberately defined in the PS-13 scope to keep the 24-hour build focused on the grounding requirement.

---

# 🚀 Running GeoGuide Locally

## 1. Clone the repository

```bash
git clone <YOUR_REPOSITORY_URL>
cd <YOUR_REPOSITORY_FOLDER>
```

## 2. Create Python environment

```bash
python3 -m venv .venv
source .venv/bin/activate
```

Windows:

```bash
.venv\Scripts\activate
```

## 3. Install backend dependencies

```bash
pip install -r backend/requirements.txt
```

## 4. Configure environment

```bash
cp .env.example .env
```

Add:

```env
GEMINI_API_KEY=your_key
GEMINI_MODEL=your_model
```

## 5. Build the vector index

```bash
python -m ai.index --reset
```

This creates the retrieval index from the provided knowledge base.

## 6. Start the backend

```bash
uvicorn backend.main:app --port 8000
```

## 7. Start the frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

Then open:

```text
http://localhost:5173
```

---

# 📁 Project Structure

```text
GeoGuide/
│
├── frontend/
│   ├── React UI
│   └── Vite configuration
│
├── backend/
│   ├── main.py
│   ├── data_queries.py
│   └── ranker.py
│
├── ai/
│   ├── retrieval
│   ├── indexing
│   ├── prompts
│   └── evaluations
│
├── data-model/
│   └── DATA_MODEL.md
│
├── docs/
│   ├── ARCHITECTURE.md
│   └── DEMO.md
│
├── tests/
│   ├── test_grounding.py
│   ├── test_date_shift.py
│   └── test_boundary_rules.py
│
├── PS-13.db
├── .env.example
└── README.md
```

---

# 🔐 Why GeoGuide Is Different

GeoGuide is not simply:

> **"Ask an AI about a city."**

It is:

```text
LOCATION
   +
DATE
   +
STRUCTURED DATA
   +
RETRIEVAL
   +
GROUNDING GUARD
   +
AI
   +
VISIBLE PROVENANCE
   +
REFUSAL
   =
TRUSTWORTHY PLACE COMPANION
```

Our central design decision is simple:

> **An AI answer is useful only when the system can show why it is allowed to say it.**

That principle affects the entire application — from the database layer to retrieval, generation, citation checking, recommendations and the final UI.

---

# 🏁 PS-13 Requirement Coverage

| PS-13 capability            | GeoGuide implementation                     |
| --------------------------- | ------------------------------------------- |
| Device location             | GPS + fallback city picker                  |
| Place identification        | Location → nearest supported city           |
| Date / season context       | City season + selected date                 |
| Grounded briefing           | RAG over provided knowledge base            |
| History                     | `place_kb`                                  |
| Culture / etiquette         | `place_kb`                                  |
| Events                      | `events_festivals` + selected date          |
| Weather tips                | `weather_daily`                             |
| Safety                      | `safety_advisories`                         |
| Nearby places               | `activities_poi`                            |
| Hotels                      | `hotels`                                    |
| Follow-up Q&A               | Per-turn retrieval + session context        |
| Low-confidence facts        | `poi_facts_kb.confidence`                   |
| Multilingual                | English + Hindi + Kannada                   |
| Voice                       | TTS                                         |
| Contextual recommendations  | Contextual Action Engine                    |
| Explainable recommendations | Data-derived reason chips                   |
| Unsupported questions       | Relevance gate + refusal                    |
| Adversarial probes          | Curated refusal test set                    |
| Grounding proof             | Retrieval-off refusal + citation validation |

The submission's appendix maps the PS-13 requirements FR-1 through FR-25 to the implemented features and data sources.

---

# 🧰 Tools and libraries disclosed

FastAPI, Uvicorn, Pydantic, ChromaDB, sentence-transformers (`paraphrase-multilingual-MiniLM-L12-v2`), google-genai (Gemini), python-dotenv, pytest, React, Vite. Optional local fallback: Ollama. Claude (Anthropic) was used as an AI coding assistant during the hackathon window.

## Visual assets disclosure

The city hero images in `frontend/public/cities/` are downloaded from Wikimedia Commons and used under their listed Creative Commons licenses:

- Bengaluru: [Bangalore skyline (7121517855).jpg](https://commons.wikimedia.org/wiki/File:Bangalore_skyline_%287121517855%29.jpg), CC BY 2.0, Saad Faruque.
- Mumbai: [Mumbai skyline category](https://commons.wikimedia.org/wiki/Category:Skylines_of_Mumbai), Wikimedia Commons source.
- Hyderabad: [Charminar Evening View Hyderabad.jpg](https://commons.wikimedia.org/wiki/File:Charminar_Evening_View_Hyderabad.jpg), free-use Wikimedia Commons upload.
- Pune: [Pune Skyline.jpg](https://commons.wikimedia.org/wiki/File:Pune_Skyline.jpg), CC BY-SA 3.0, Tushar Mote.

Day and night variants for the day/night toggle, also from Wikimedia Commons (resized to 1920 px):

- Bengaluru by day (`bengaluru-day.jpg`): [Vidhana Soudha, front (01).jpg](https://commons.wikimedia.org/wiki/File:Vidhana_Soudha,_front_(01).jpg), CC BY-SA 4.0, Moheen Reeyad.
- Mumbai by night (`mumbai-night.jpg`): [Mumbai Skyline Marine Drive Night.jpg](https://commons.wikimedia.org/wiki/File:Mumbai_Skyline_Marine_Drive_Night.jpg), CC BY-SA 4.0, Av9.
- Hyderabad by night (`hyderabad-night.jpg`): [Charminar Hyderabad night view.jpg](https://commons.wikimedia.org/wiki/File:Charminar_Hyderabad_night_view.jpg), CC BY-SA 4.0, Rashid Jorvee.
- Pune by night (`pune-night.jpg`): [Sinhagad Road Pune at Night.jpg](https://commons.wikimedia.org/wiki/File:Sinhagad_Road_Pune_at_Night.jpg), public domain, Amityadav8.

The Bengaluru skyline above is the night view; the Mumbai, Hyderabad and Pune images above are the day views. `default.jpg` is a local fallback copy of the Bengaluru image.

The place-card photos in `frontend/public/places/` (one per place category, shown on the Arrive page's nearby-places deck; the dataset's places have no photos of their own) are also from Wikimedia Commons, resized to 900 px:

- Wellness (`wellness.jpg`): [Yogi in meditation, Banyan tree in meditation, Paliem, Goa, India.jpg](https://commons.wikimedia.org/wiki/File:Yogi_in_meditation,_Banyan_tree_in_meditation,_Paliem,_Goa,_India.jpg), CC BY 4.0, Vyacheslav Argenberg.
- Beach (`beach.jpg`): [Vagator Beach, Goa, India, Palms.jpg](https://commons.wikimedia.org/wiki/File:Vagator_Beach,_Goa,_India,_Palms.jpg), CC BY 4.0, Vyacheslav Argenberg.
- Nature (`nature.jpg`): [Western ghats waterfall.jpg](https://commons.wikimedia.org/wiki/File:Western_ghats_waterfall.jpg), CC BY-SA 4.0, Samson Joseph.
- Adventure (`adventure.jpg`): [Paragliding at Bir, HP.jpg](https://commons.wikimedia.org/wiki/File:Paragliding_at_Bir,_HP.jpg), CC BY-SA 4.0, PanWoyteczek (derivative work).
- Food (`food.jpg`): [South Indian Thali Cropped.jpg](https://commons.wikimedia.org/wiki/File:South_Indian_Thali_Cropped.jpg), CC BY 2.0, Tracy Hunter.
- Nightlife (`nightlife.jpg`): [Brigade Road, Bangalore at night (2024) 01.jpg](https://commons.wikimedia.org/wiki/File:Brigade_Road,_Bangalore_at_night_(2024)_01.jpg), CC BY-SA 4.0, Gpkp.
- Shopping (`shopping.jpg`): [Shopkeeper - Indian Market.jpg](https://commons.wikimedia.org/wiki/File:Shopkeeper_-_Indian_Market.jpg), CC BY 4.0, RioRiyoRio.
- Wildlife (`wildlife.jpg`): [Elephas maximus (Bandipur).jpg](https://commons.wikimedia.org/wiki/File:Elephas_maximus_(Bandipur).jpg), CC BY-SA 3.0, Yathin S Krishnappa.
- Viewpoint (`viewpoint.jpg`): [Sunrise at Nandi Hills.jpg](https://commons.wikimedia.org/wiki/File:Sunrise_at_Nandi_Hills.jpg), CC BY-SA 4.0, JzG.
- Museum (`museum.jpg`): [Indian Museum, Gallery, Kolkata, India.jpg](https://commons.wikimedia.org/wiki/File:Indian_Museum,_Gallery,_Kolkata,_India.jpg), CC BY 4.0, Vyacheslav Argenberg.
- Religious (`religious.jpg`): [Hindu Temple in Hunsur.jpg](https://commons.wikimedia.org/wiki/File:Hindu_Temple_in_Hunsur.jpg), CC BY-SA 4.0, Prof tpms.
- Heritage (`heritage.jpg`): [Hampi Vitthala Temple 3465.jpg](https://commons.wikimedia.org/wiki/File:Hampi_Vitthala_Temple_3465.jpg), CC BY-SA 4.0, Basavaraj M.

Place-type photos in `frontend/public/places/names/` match the type in each place's name ("Butterfly Reserve", "Stepwell"); a place with no matching type uses its category photo above. All from Wikimedia Commons, resized to 900 px:

- `antique-lane.jpg`: [Antique items for sale at a roadside shop in Ballygunge, Kolkata.jpg](https://commons.wikimedia.org/wiki/File:Antique_items_for_sale_at_a_roadside_shop_in_Ballygunge,_Kolkata.jpg), CC BY-SA 4.0, Billjones94.
- `ayurveda-centre.jpg`: [Sadananda vaidyasala2.jpg](https://commons.wikimedia.org/wiki/File:Sadananda_vaidyasala2.jpg), CC BY-SA 4.0, Fotokannan.
- `backwater-channel.jpg`: [Kerala Backwaters - Canal near Chamabakulam.jpg](https://commons.wikimedia.org/wiki/File:Kerala_Backwaters_-_Canal_near_Chamabakulam.jpg), CC BY-SA 4.0, Ingo Mehling.
- `bazaar.jpg`: [Hampi Bazaar, India.jpg](https://commons.wikimedia.org/wiki/File:Hampi_Bazaar,_India.jpg), CC BY 4.0, Vyacheslav Argenberg.
- `bird-sanctuary.jpg`: [Eurasian Spoonbill Walking Ranganathittu Karnataka Jan24 A7C 09151.jpg](https://commons.wikimedia.org/wiki/File:Eurasian_Spoonbill_Walking_Ranganathittu_Karnataka_Jan24_A7C_09151.jpg), CC BY-SA 4.0, This Photo was taken by Timothy A. Gonsalves.  Feel free to.
- `blue-pottery-workshop.jpg`: [Blue Pottery Jaipur Collection.jpg](https://commons.wikimedia.org/wiki/File:Blue_Pottery_Jaipur_Collection.jpg), CC BY-SA 4.0, Neek-Theri.
- `botanical-gardens.jpg`: [Indian Independence day celebration 216th flower show 2024, Lalbagh, Bangalore 129.jpg](https://commons.wikimedia.org/wiki/File:Indian_Independence_day_celebration_216th_flower_show_2024,_Lalbagh,_Bangalore_129.jpg), CC BY-SA 4.0, Gpkp.
- `butterfly-reserve.jpg`: [Peacock butterfly (Aglais io) 2.jpg](https://commons.wikimedia.org/wiki/File:Peacock_butterfly_(Aglais_io)_2.jpg), CC BY-SA 3.0, Charles J. Sharp.
- `chhatri-complex.jpg`: [Jaisalmer-Vyas Chhatri Cenotaphs-20131010.jpg](https://commons.wikimedia.org/wiki/File:Jaisalmer-Vyas_Chhatri_Cenotaphs-20131010.jpg), CC BY-SA 3.0, Daniel VILLAFRUELA.
- `city-museum.jpg`: [Thekke Kottaram Heritage Museum Mar24 A7C 10164.jpg](https://commons.wikimedia.org/wiki/File:Thekke_Kottaram_Heritage_Museum_Mar24_A7C_10164.jpg), CC BY-SA 4.0, This Photo was taken by Timothy A. Gonsalves.  Feel free to.
- `city-walls-walk.jpg`: [Hyderabad City Wall Afzal Darwaza.jpg](https://commons.wikimedia.org/wiki/File:Hyderabad_City_Wall_Afzal_Darwaza.jpg), public domain, Claude Campbell.
- `cliff-walk.jpg`: [Varkala Cliff by KS.jpg](https://commons.wikimedia.org/wiki/File:Varkala_Cliff_by_KS.jpg), CC BY-SA 4.0, Krissubh.
- `coffee-roastery-tour.jpg`: [Dülmen, Privatrösterei Schröer -- 2018 -- 2.jpg](https://commons.wikimedia.org/wiki/File:D%C3%BClmen,_Privatr%C3%B6sterei_Schr%C3%B6er_--_2018_--_2.jpg), CC BY-SA 4.0, Dietmar Rabich.
- `cooking-class.jpg`: [Kenya-cooking-class-1024x683-1.webp](https://commons.wikimedia.org/wiki/File:Kenya-cooking-class-1024x683-1.webp), CC BY-SA 4.0, K a r a044.
- `crocodile-park.jpg`: [Mugger crocodile (Crocodylus palustris) Gal Oya.jpg](https://commons.wikimedia.org/wiki/File:Mugger_crocodile_(Crocodylus_palustris)_Gal_Oya.jpg), CC BY-SA 4.0, Charles J. Sharp.
- `cycling-loop.jpg`: [Tour la Nuit Montreal 2019 approaching Olympic Stadium.jpg](https://commons.wikimedia.org/wiki/File:Tour_la_Nuit_Montreal_2019_approaching_Olympic_Stadium.jpg), CC BY-SA 4.0, Kenneth C. Zirkel.
- `elephant-camp.jpg`: [Dubare elephant camp (4).jpg](https://commons.wikimedia.org/wiki/File:Dubare_elephant_camp_(4).jpg), CC BY-SA 4.0, Vinayaraj.
- `fishermens-cove.jpg`: [Fishermen at Kavarathi, Lakshadweep, India (edit).jpg](https://commons.wikimedia.org/wiki/File:Fishermen_at_Kavarathi,_Lakshadweep,_India_(edit).jpg), CC BY-SA 4.0, Shafeeq Thamarassery (derivative work).
- `fort.jpg`: [Champaner citadel walls.jpg](https://commons.wikimedia.org/wiki/File:Champaner_citadel_walls.jpg), CC BY-SA 3.0, Anahgem.
- `gallery-of-modern-art.jpg`: [National Gallery of Modern Art - NGMA - Bangalore 6645.JPG](https://commons.wikimedia.org/wiki/File:National_Gallery_of_Modern_Art_-_NGMA_-_Bangalore_6645.JPG), CC BY-SA 3.0, Rameshng.
- `great-mosque.jpg`: [20191203 Jama Masjid, Delhi 0707 6468 DxO.jpg](https://commons.wikimedia.org/wiki/File:20191203_Jama_Masjid,_Delhi_0707_6468_DxO.jpg), CC BY-SA 4.0, Jakub Hałun.
- `handloom-cooperative.jpg`: [Complicated hand-loom for silk weaving, Kanchipuram, Tamil Nadu.jpg](https://commons.wikimedia.org/wiki/File:Complicated_hand-loom_for_silk_weaving,_Kanchipuram,_Tamil_Nadu.jpg), CC BY 2.0, McKay Savage.
- `hilltop-shrine.jpg`: [Palani Steps to Hill Temple.JPG](https://commons.wikimedia.org/wiki/File:Palani_Steps_to_Hill_Temple.JPG), CC BY-SA 3.0, Ranjithsiji.
- `hot-air-balloon-field.jpg`: [Hot Air Balloon Ride by Sky Waltz.jpg](https://commons.wikimedia.org/wiki/File:Hot_Air_Balloon_Ride_by_Sky_Waltz.jpg), public domain, Meeta.
- `hot-springs.jpg`: [Dead trees at Mammoth Hot Springs.jpg](https://commons.wikimedia.org/wiki/File:Dead_trees_at_Mammoth_Hot_Springs.jpg), CC BY-SA 3.0, Brocken Inaglory.
- `jain-temple-complex.jpg`: [Jain Temple Ranakpur.jpg](https://commons.wikimedia.org/wiki/File:Jain_Temple_Ranakpur.jpg), CC BY-SA 3.0, Ingo Mehling.
- `jazz-cellar.jpg`: [The Spotted Cat New Orleans 2015 - Shotgun Jazz Band.jpg](https://commons.wikimedia.org/wiki/File:The_Spotted_Cat_New_Orleans_2015_-_Shotgun_Jazz_Band.jpg), CC BY-SA 2.0, Gary J. Wood.
- `kayaking.jpg`: [Evening Sunset kayaking view.jpg](https://commons.wikimedia.org/wiki/File:Evening_Sunset_kayaking_view.jpg), CC BY-SA 4.0, Prahallads.
- `lake.jpg`: [Ulsoor Lake, Bangalore.jpg](https://commons.wikimedia.org/wiki/File:Ulsoor_Lake,_Bangalore.jpg), CC BY 2.0, Abhishek Kumar.
- `lighthouse-beach.jpg`: [Kovalam beach trivandrum kerala.jpg](https://commons.wikimedia.org/wiki/File:Kovalam_beach_trivandrum_kerala.jpg), CC BY-SA 4.0, Georgeumartin.
- `maritime-museum.jpg`: [Ship models, North Devon Maritime Museum.jpg](https://commons.wikimedia.org/wiki/File:Ship_models,_North_Devon_Maritime_Museum.jpg), CC0, Northerner.
- `museum-of-coins.jpg`: [Coin collection.jpg](https://commons.wikimedia.org/wiki/File:Coin_collection.jpg), CC BY-SA 4.0, Anemonemma, Generalissima, 3df.
- `night-food-bazaar.jpg`: [SZ Shenzhen Luohu Dongmen night market shop cooked food March 2025 R12S 211.jpg](https://commons.wikimedia.org/wiki/File:SZ_Shenzhen_Luohu_Dongmen_night_market_shop_cooked_food_March_2025_R12S_211.jpg), CC0, Breandy Makallonz.
- `north-beach.jpg`: [Havelock Island, Sandy lagoon, Andaman Islands.jpg](https://commons.wikimedia.org/wiki/File:Havelock_Island,_Sandy_lagoon,_Andaman_Islands.jpg), CC BY 4.0, Vyacheslav Argenberg.
- `observatory.jpg`: [Doors of Jantar Mantar.jpg](https://commons.wikimedia.org/wiki/File:Doors_of_Jantar_Mantar.jpg), CC BY-SA 4.0, Sudipta Maulik.
- `old-palace.jpg`: [Mysore Palace Windows.jpg](https://commons.wikimedia.org/wiki/File:Mysore_Palace_Windows.jpg), CC BY-SA 4.0, Sumit Surai.
- `paragliding-launch.jpg`: [Pilots on a paragliding takeoff at Bir-Billing.JPG](https://commons.wikimedia.org/wiki/File:Pilots_on_a_paragliding_takeoff_at_Bir-Billing.JPG), CC BY-SA 3.0, Okorok.
- `puppet-museum.jpg`: [Kathputli ke dhage.jpg](https://commons.wikimedia.org/wiki/File:Kathputli_ke_dhage.jpg), CC BY-SA 4.0, Vicky Puppeteer.
- `quiet-bay.jpg`: [El Guamache Bay, Margarita island.jpg](https://commons.wikimedia.org/wiki/File:El_Guamache_Bay,_Margarita_island.jpg), CC0, Wilfredor.
- `ridge-lookout.jpg`: [Zagedan Ridge, Zagedan Valley, Caucasus Mountains, Karachay-Cherkessia.jpg](https://commons.wikimedia.org/wiki/File:Zagedan_Ridge,_Zagedan_Valley,_Caucasus_Mountains,_Karachay-Cherkessia.jpg), CC BY 4.0, Vyacheslav Argenberg.
- `riverside-ghats.jpg`: [Varanasi Munshi Ghat3.jpg](https://commons.wikimedia.org/wiki/File:Varanasi_Munshi_Ghat3.jpg), CC BY-SA 3.0, Marcin Białek.
- `riverside-lounge.jpg`: [DZ6 2225 Riverside dining under temple lights - a bustling night market and restaurant glow against an ornate temple silhouette.jpg](https://commons.wikimedia.org/wiki/File:DZ6_2225_Riverside_dining_under_temple_lights_-_a_bustling_night_market_and_restaurant_glow_against_an_ornate_temple_silhouette.jpg), CC BY-SA 4.0, PattayaPatrol.
- `rock-climbing-wall.jpg`: [Climbing wall 20211103 145408.jpg](https://commons.wikimedia.org/wiki/File:Climbing_wall_20211103_145408.jpg), CC BY-SA 4.0, Ka23 13.
- `rock-garden.jpg`: [Nek Chand Garden (6175284222).jpg](https://commons.wikimedia.org/wiki/File:Nek_Chand_Garden_(6175284222).jpg), CC BY-SA 2.0, Rod Waddington from Kergunyah, Australia.
- `rooftop-live-music.jpg`: [Music band performs on stage during a live concert.jpg](https://commons.wikimedia.org/wiki/File:Music_band_performs_on_stage_during_a_live_concert.jpg), CC BY 2.0, Shixart1985.
- `royal-cenotaphs.jpg`: [Royal Cenotaphs, Bada Bagh, Jaisalmer (retouched).jpg](https://commons.wikimedia.org/wiki/File:Royal_Cenotaphs,_Bada_Bagh,_Jaisalmer_(retouched).jpg), CC BY-SA 3.0, Ankit khare derivative work: MagentaGreen.
- `spice-market-walk.jpg`: [20191205 Spice market, Old Delhi 0711 6765.jpg](https://commons.wikimedia.org/wiki/File:20191205_Spice_market,_Old_Delhi_0711_6765.jpg), CC BY-SA 4.0, Jakub Hałun.
- `st-marys-church.jpg`: [St. Mary's Basilica Bangalore pillar.jpg](https://commons.wikimedia.org/wiki/File:St._Mary%27s_Basilica_Bangalore_pillar.jpg), CC BY-SA 3.0, Tinucherian (talk).
- `stepwell.jpg`: [Chand Baori, stepwell.jpg](https://commons.wikimedia.org/wiki/File:Chand_Baori,_stepwell.jpg), CC BY 2.0, Pablo Nicolás Taibi Cicare.
- `street-food-lane.jpg`: [Pani Puri Stall - Kolkata 2013-10-11 3268.JPG](https://commons.wikimedia.org/wiki/File:Pani_Puri_Stall_-_Kolkata_2013-10-11_3268.JPG), CC BY 3.0, Biswarup Ganguly.
- `sunset-point.jpg`: [Hampi, India, Rocky landscape of Hampi, Granite rocks of Matanga Hill.jpg](https://commons.wikimedia.org/wiki/File:Hampi,_India,_Rocky_landscape_of_Hampi,_Granite_rocks_of_Matanga_Hill.jpg), CC BY 4.0, Vyacheslav Argenberg.
- `tea-estate-trail.jpg`: [Tea Estate Munnar.jpg](https://commons.wikimedia.org/wiki/File:Tea_Estate_Munnar.jpg), CC BY-SA 3.0, Nikolas Becker.
- `temple.jpg`: [A Hindu temple gopuram in Chennai India.jpg](https://commons.wikimedia.org/wiki/File:A_Hindu_temple_gopuram_in_Chennai_India.jpg), CC BY-SA 2.0, Johann-Nikolaus Andreae from Hamburg, Germany.
- `textile-museum.jpg`: [Jacket, India (fabric), Iran (tailoring), Safavid dynasty, late 17th century AD, silk, metal-wrapped silk, silver foil, view 4 - Textile Museum, George Washington University - DSC09609.JPG](https://commons.wikimedia.org/wiki/File:Jacket,_India_(fabric),_Iran_(tailoring),_Safavid_dynasty,_late_17th_century_AD,_silk,_metal-wrapped_silk,_silver_foil,_view_4_-_Textile_Museum,_George_Washington_University_-_DSC09609.JPG), public domain, Daderot.
- `viewpoint.jpg`: [Indus Valley near Leh.jpg](https://commons.wikimedia.org/wiki/File:Indus_Valley_near_Leh.jpg), CC BY-SA 3.0, KennyOMG.
- `watchtower-terrace.jpg`: [View from Hatta Hill Park Watchtower.jpg](https://commons.wikimedia.org/wiki/File:View_from_Hatta_Hill_Park_Watchtower.jpg), CC BY-SA 4.0, Florian Kriechbaumer.
- `water-palace.jpg`: [Jalmahal jaipur 2013.JPG](https://commons.wikimedia.org/wiki/File:Jalmahal_jaipur_2013.JPG), CC BY-SA 3.0, Arjuncm3.
- `zipline-point.jpg`: [Zip line over the falls of Li Phi at sunrise in Don Khon Laos.jpg](https://commons.wikimedia.org/wiki/File:Zip_line_over_the_falls_of_Li_Phi_at_sunrise_in_Don_Khon_Laos.jpg), CC BY-SA 4.0, Basile Morin.

---

# 💡 The One-Line Pitch

> **GeoGuide is a location-aware AI travel companion that tells you what matters about a place, what you can do right now, and what you should know — while showing the source behind every claim and refusing to guess when the data doesn't support an answer.**

---

## Team VVinners

**BMS College of Engineering**
**KogniVera Hackathon 2026**
**PS-13 — GeoGuide: Location-Aware AI Place Companion**

> **Arrive. Understand. Act. Ask. — with evidence.**
