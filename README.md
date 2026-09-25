# 🌍 GeoGuide — Location-Aware AI Place Companion

> **A travel companion that doesn't just tell you about a place — it proves where every fact came from.**

**Team VVinners · BMS College of Engineering**
**KogniVera Hackathon 2026 · PS-13 — GeoGuide: Location-Aware AI Place Companion**

---

## 1. 👥 Team & Problem Statement

### Team VVinners

| Member                      | Responsibility                     |
| --------------------------- | ---------------------------------- |
| **Vamika A Bhat**           | AI & RAG pipeline, grounding guard |
| **Vishnu Mashalkar**        | Backend, API & orchestration       |
| **Vachana M H**             | Frontend & UI/UX                   |
| **Varsha Kusumadhara Kodi** | Data, embeddings & conformance     |

### Problem Statement

Travel information is fragmented across maps, search engines, blogs, booking platforms and AI assistants.

A traveller arriving in a new city needs answers to questions such as:

* Where am I?
* What is important about this place?
* What's happening today?
* What can I do nearby right now?
* What should I know before visiting?
* Can I ask follow-up questions?
* Can I trust what an AI assistant tells me?

Traditional travel applications can provide information, but an AI assistant introduces another problem:

> **How does the traveller know whether the answer is actually supported by data?**

GeoGuide addresses both problems by combining **location awareness, date-aware context, structured data, retrieval-augmented generation and visible provenance**.

### Our Core Principle

> **If GeoGuide cannot ground an answer in the provided data, it does not answer.**

Instead of hiding provenance inside the backend, GeoGuide makes the source of factual claims visible directly in the user interface.

---

# 2. 🏗️ Architecture

GeoGuide is an end-to-end location-aware AI system built around a grounded RAG pipeline.

```text
┌─────────────────────────────────────────────┐
│                 React + Vite                 │
│                                              │
│ Location · Date · Language · Briefing       │
│ Nearby · Right Now · Ask · TTS              │
└──────────────────────┬──────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────┐
│                  FastAPI                     │
│                                              │
│ Context / Briefing / Nearby / Right Now     │
│ Ask / Session State / Date & Season Logic   │
└───────────────┬─────────────────────────────┘
                │
        ┌───────┴─────────┐
        ▼                 ▼
┌───────────────┐  ┌────────────────────────┐
│   PS-13.db    │  │       ChromaDB         │
│               │  │                        │
│ Structured    │  │ place_kb                │
│ source of     │  │ poi_facts_kb            │
│ truth         │  │ embeddings + metadata   │
└───────┬───────┘  └────────────┬───────────┘
        │                       │
        └──────────┬────────────┘
                   ▼
          ┌─────────────────┐
          │ Relevance Gate  │
          └────────┬────────┘
                   │
          ┌────────┴────────┐
          │                 │
       Relevant          Not relevant
          │                 │
          ▼                 ▼
     ┌──────────┐       ┌─────────┐
     │  Gemini  │       │ REFUSE  │
     └────┬─────┘       └─────────┘
          │
          ▼
┌─────────────────────────────┐
│ Citation / Claim Validation │
│                             │
│ Cited → Show                │
│ Uncited → Drop              │
│ Nothing left → Refuse       │
└──────────────┬──────────────┘
               │
               ▼
       Grounded response
       + source chips
```

### Request Flow

A typical grounded question follows this path:

```text
User question
     ↓
City-aware retrieval
     ↓
Relevant evidence?
     ↓
   YES ──────────────── NO
    │                    │
    ▼                    ▼
Gemini generation      REFUSE
    │
    ▼
Citation validation
    │
    ├── Supported claims → Display
    │
    └── Unsupported claims → Drop
```

The LLM is therefore **not directly trusted with an unrestricted question**.

The system first retrieves evidence, checks relevance, generates only from the retrieved context, and validates citations before displaying the answer.

---

# 3. 🤖 AI Features

## 3.1 Grounded Six-Part Briefing

GeoGuide generates a structured briefing containing:

1. 🏛️ **History**
2. 📍 **Top Attractions**
3. 🎉 **What's On**
4. ☁️ **Weather-Aware Tips**
5. 🙏 **Culture & Etiquette**
6. ⚠️ **Safety**

Every factual claim displayed to the user carries a visible source chip.

For example:

```text
Remove footwear at religious sites.

✓ KV Guide / Bengaluru / etiquette
```

or:

```text
No festivals are scheduled for this date.

✓ events_festivals / query result
```

Uncited generated claims are removed before the answer reaches the UI.

---

## 3.2 Retrieval-Augmented Generation

The main knowledge base consists of:

* `place_kb`
* `poi_facts_kb`

These are embedded and indexed in ChromaDB.

Retrieval is **city-filtered** so that information from one city cannot accidentally leak into another city's answer.

The retrieval pipeline is:

```text
Question
   ↓
Embedding
   ↓
ChromaDB
   ↓
city_id filter
   ↓
Relevant passages
   ↓
Relevance gate
   ↓
Gemini
   ↓
Citation validation
   ↓
Answer / Refusal
```

The current index contains approximately:

```text
3,173 KB windows
+
900 POI facts
```

---

## 3.3 Three-Layer Grounding Guard

GeoGuide uses multiple protections against unsupported answers.

### Layer 1 — Relevance Gate

If retrieval does not produce sufficiently relevant information:

```text
No sufficient evidence
        ↓
LLM is NOT called
        ↓
Refusal
```

This prevents the model from filling missing information from its general knowledge.

### Layer 2 — Generation Constraint

When the LLM is called, it receives retrieved context and is instructed to:

* use only retrieved passages
* attach citations
* omit unsupported claims
* return insufficient information when evidence is missing

### Layer 3 — Citation Check

After generation:

```text
Generated answer
       ↓
Check claims
       ↓
Has source?
   ┌───┴───┐
  YES      NO
   │        │
 Show     Drop
```

If all claims are removed, GeoGuide refuses instead of displaying an unsupported answer.

---

# 4. 📅 Date-Shift Briefing

The mandatory PS-13 enhancement is **Date-Shift Briefing**.

GeoGuide is not restricted to today's context.

The user can move the date across the available dataset, and the application recomputes date-sensitive information.

```text
Selected city
     +
Selected date
     ↓
events_festivals
weather_daily
safety_advisories
activities_poi
     ↓
New contextual briefing
```

This can change:

* Events and festivals
* Weather-aware advice
* Applicable safety information
* Relevant activities
* Opening information
* Seasonal framing

### Example

On:

```text
24 September
```

Bengaluru can correctly report:

> **Nothing is scheduled in Bengaluru on this date.**

Move to:

```text
17 October
```

and the corresponding event appears with its source row.

Move to an empty date again and GeoGuide reports the absence honestly.

### No Fabricated Events

A date with no matching event does **not** cause the LLM to invent a festival.

```text
No matching event
      ↓
"Nothing is scheduled."
```

This is a deliberate part of the grounding design.

---

# 5. ⚡ Right Now — Contextual Action Engine

GeoGuide does not only describe a city.

It answers:

> **"What can I actually do in the next 90 minutes?"**

The **Contextual Action Engine (CAE)** is deterministic and does not use the LLM to decide which activity to recommend.

It considers structured information such as:

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
```

Every recommendation exposes **data-derived reasons**.

The important distinction is:

> **The recommendation is calculated from structured data — it is not an LLM-generated guess.**

---

# 6. 📍 Nearby Places & Hotels

GeoGuide provides grounded nearby recommendations using the supplied dataset.

### Places

Places come from:

```text
activities_poi
```

and are resolved using geographic distance and relevant structured fields.

### Hotels

Hotels come from:

```text
hotels
```

and are surfaced using the available guest score and contextual information.

Each item can expose information such as:

* Distance
* Opening hours
* Entry cost
* Currency
* Rating / guest score
* Relevant recommendation reasons

---

# 7. 💬 Grounded Follow-Up Q&A

After receiving the briefing, users can continue the conversation naturally.

Example:

```text
User:
Anything I should know before Bengaluru Bazaar?

GeoGuide:
[grounded response]

✓ Source
LOW CONFIDENCE / Verify locally
```

Follow-up questions are retrieved and grounded **per turn**.

Conversation context may help resolve references such as:

```text
"there"
"that place"
"it"
```

but conversation history does not replace source retrieval.

Each factual answer still needs supporting evidence.

---

# 8. 🛑 Refusal Instead of Guessing

One of GeoGuide's core behaviours is knowing when **not** to answer.

For example:

```text
User:
How much is a cab to the airport right now?
```

GeoGuide:

```text
No live fares in the grounded data,
so I won't guess.

✕ No grounded data
```

GeoGuide refuses unsupported questions including:

* Live information not present in the dataset
* Unsupported exchange rates
* Booking/payment requests
* Made-up landmarks
* Facts outside the retrieved knowledge
* Adversarial/prompt-injection style questions

The goal is not to produce an answer at any cost.

The goal is to produce an answer **only when the system can support it**.

---

# 9. 🔌 Grounding-Off Proof

GeoGuide includes an explicit demonstration of its grounding dependency.

### Grounding ON

```text
Question
   ↓
Retrieve evidence
   ↓
Generate grounded answer
   ↓
Source
```

### Grounding OFF

```text
Question
   ↓
No trusted evidence
   ↓
REFUSE
```

Turning grounding off causes questions to refuse rather than silently fall back to the model's general memory.

This provides a direct proof that the application's answers depend on the grounding layer.

---

# 10. 🌐 Multilingual & Voice

GeoGuide supports:

* 🇬🇧 English
* 🇮🇳 Hindi
* 🟡 Kannada

The underlying grounded information remains the same.

Only the presentation language changes.

```text
PS-13 Data
     ↓
Same grounded facts
     ↓
English / Hindi / Kannada
     ↓
Text / TTS
```

### Read Aloud

The application uses browser-supported text-to-speech where available.

Voice availability depends on the device's installed browser voices.

---

# 11. 📦 Offline Fallback

GeoGuide includes a fallback for situations where the LLM is unreachable.

Instead of inventing content, the application can display the grounded source passages directly, with an indication that the fallback is being used.

```text
Gemini available
      ↓
Grounded generated briefing

Gemini unavailable
      ↓
Grounded source passages
      ↓
Still cited
```

This preserves the central grounding principle even when generation is unavailable.

---

# 12. 🗄️ Data Model

The provided **PS-13.db remains the source of truth**.

GeoGuide uses the supplied tables without replacing the underlying data model.

### Core Tables

| Table               | Purpose                                      |
| ------------------- | -------------------------------------------- |
| `cities`            | Location, city identity, season and language |
| `place_kb`          | Main RAG knowledge base                      |
| `poi_facts_kb`      | Grounded POI facts and confidence            |
| `activities_poi`    | Nearby places, coordinates, hours and cost   |
| `events_festivals`  | Date-aware events and festivals              |
| `weather_daily`     | Weather and weather-aware advice             |
| `safety_advisories` | Safety information                           |
| `hotels`            | Nearby accommodation                         |
| `languages`         | Language and TTS support                     |
| `currencies`        | Currency-related structured information      |
| `countries`         | Country relationships                        |

### Supporting Infrastructure

GeoGuide adds supporting infrastructure beside the supplied database:

```text
PS-13.db
   │
   ├── Structured queries
   │
   ├── ChromaDB vector index
   │
   ├── Retrieval logs
   │
   ├── Briefing cache
   │
   ├── Session state
   │
   └── Derived source labels
```

The supplied database is not replaced by a second application database.

---

# 13. 🧠 AI / RAG Architecture

The high-level AI pipeline is:

```text
                    User
                      │
                      ▼
              ┌───────────────┐
              │ React Frontend│
              └───────┬───────┘
                      │
                      ▼
              ┌───────────────┐
              │    FastAPI    │
              └───────┬───────┘
                      │
          ┌───────────┴───────────┐
          │                       │
          ▼                       ▼
   Structured Data          ChromaDB
     PS-13.db             Vector Retrieval
          │                       │
          └───────────┬───────────┘
                      ▼
              Relevance Gate
                      │
              ┌───────┴───────┐
              │               │
           Relevant       Not relevant
              │               │
              ▼               ▼
           Gemini          REFUSAL
              │
              ▼
        Citation Check
              │
        ┌─────┴─────┐
        │           │
    Supported    Unsupported
        │           │
        ▼           ▼
      Show         Drop
```

### Why this architecture?

The system separates responsibilities:

* **Structured database** → deterministic facts
* **Vector retrieval** → relevant unstructured knowledge
* **Relevance gate** → determines whether evidence is sufficient
* **LLM** → language generation
* **Citation validation** → claim-level verification
* **Deterministic ranker** → explainable recommendations
* **Frontend** → visible provenance and user interaction

---

# 14. 🧰 Technology Stack

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
| Optional Offline Fallback | Ollama                               |
| Runtime                   | Python virtual environment + Node.js |

---

# 15. 🎬 Demo Path

The recommended judge demo follows one traveller.

```text
ARRIVE
  ↓
Bengaluru detected
  ↓
OPEN BRIEFING
  ↓
Source-backed claims
  ↓
24 Sep → Nothing scheduled
  ↓
17 Oct → Monsoon Music Nights
  ↓
RIGHT NOW
  ↓
Data-derived recommendations
  ↓
ASK
  ↓
Grounded answer
  ↓
Live cab fare → REFUSAL
  ↓
GROUNDING OFF
  ↓
REFUSAL
```

### Step 1 — Arrive

Open GeoGuide and allow location access.

The application resolves the device location to the nearest supported city.

If browser location is unavailable, a city picker can be used.

---

### Step 2 — Briefing

Open the Bengaluru briefing.

Show the six sections and point out:

> **Every factual claim has a source chip.**

---

### Step 3 — Date Shift

Move the date from:

```text
24 September
```

to:

```text
17 October
```

Show that:

* The event changes
* Seasonal framing changes
* Weather-aware information changes
* The corresponding source IDs change

Then select an empty date and show:

> **Nothing is scheduled.**

---

### Step 4 — Right Now

Open:

> **What should I do in the next 90 minutes?**

Show the ranked recommendations.

Point at:

```text
Open now
Distance
Time fit
Budget
```

Explain that the ranking is deterministic and data-driven.

---

### Step 5 — Ask

Ask:

> **"Anything I should know before Bengaluru Bazaar?"**

Show the grounded answer and source.

Then ask:

> **"How much is a cab to the airport right now?"**

Show the refusal.

---

### Step 6 — Grounding OFF

Turn grounding off.

Ask another question.

Show:

> **Refusal**

This demonstrates that GeoGuide does not silently fall back to model memory when trusted evidence is unavailable.

---

# 16. 🧪 Tests & Proof

GeoGuide is designed to be measurable rather than only visually demonstrable.

## Run Tests

```bash
python -m pytest tests -q
```

## Run Adversarial Evaluation

```bash
python -m ai.evals.run_eval --set adversarial
```

## Full Evaluation

```bash
python -m ai.evals.run_eval
```

### Test Coverage

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

### Important Proof Cases

| Scenario                | Expected Behaviour        |
| ----------------------- | ------------------------- |
| Valid grounded question | Answer with sources       |
| Low-confidence fact     | Answer + verify locally   |
| No relevant retrieval   | Refuse                    |
| Live cab fare           | Refuse                    |
| Made-up landmark        | Refuse                    |
| Grounding disabled      | Refuse                    |
| Date with event         | Show event                |
| Date without event      | Say nothing is scheduled  |
| Right Now               | Show data-derived reasons |

### Grounding Proof

The strongest proof cases are:

```text
Grounding ON
    ↓
Evidence available
    ↓
Answer + source
```

versus:

```text
Grounding OFF
    ↓
No trusted evidence
    ↓
REFUSAL
```

This makes the grounding behaviour directly observable during the demo.

---

# 17. 📊 What We Measure

GeoGuide focuses on measurable grounding behaviour.

### Grounding

Every displayed factual claim is expected to carry a source label.

### Refusal

Unsupported and adversarial questions are refused rather than answered from model memory.

### Confidence

Low-confidence facts can be explicitly marked:

> **Verify locally**

### Explainable Recommendations

Each Right Now recommendation exposes data-derived reasoning.

### Conformance

The supplied database schema and boundary rules are validated through tests.

---

# 18. 🚀 Running GeoGuide Locally

## Prerequisites

* Python 3
* Node.js
* npm
* A Gemini API key
* The supplied `PS-13.db`

---

## 1. Clone the repository

```bash
git clone <YOUR_REPOSITORY_URL>
cd <YOUR_REPOSITORY_FOLDER>
```

---

## 2. Create the Python environment

```bash
python3 -m venv .venv
source .venv/bin/activate
```

### Windows

```bash
.venv\Scripts\activate
```

---

## 3. Install backend dependencies

```bash
pip install -r backend/requirements.txt
```

---

## 4. Configure environment variables

```bash
cp .env.example .env
```

Set:

```env
GEMINI_API_KEY=your_key
GEMINI_MODEL=your_model
```

Never commit `.env` or API keys to the repository.

---

## 5. Build the vector index

```bash
python -m ai.index --reset
```

This builds the ChromaDB retrieval index from the supplied PS-13 knowledge base.

---

## 6. Optional: Prewarm demo briefings

```bash
python -m ai.prewarm --dates 2026-09-24 2026-10-17
```

This can cache the main demo briefings so they load quickly during the presentation.

---

## 7. Start the backend

```bash
uvicorn backend.main:app --port 8000
```

The FastAPI backend will run on:

```text
http://localhost:8000
```

---

## 8. Start the frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

Open:

```text
http://localhost:5173
```

---

# 19. 📁 Project Structure

```text
GeoGuide/
│
├── frontend/
│   ├── src/
│   ├── public/
│   └── Vite configuration
│
├── backend/
│   ├── main.py
│   ├── data_queries.py
│   ├── ranker.py
│   └── date_facts.py
│
├── ai/
│   ├── retrieval/
│   ├── indexing/
│   ├── prompts/
│   ├── pipeline.py
│   └── evaluations/
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
│   ├── test_date_facts.py
│   └── test_boundary_rules.py
│
├── PS-13.db
├── .env.example
├── README.md
└── requirements / configuration files
```

---

# 20. 🚫 What GeoGuide Deliberately Does NOT Do

GeoGuide intentionally keeps the scope focused.

### No booking or payments

GeoGuide surfaces places and hotels but does not perform transactions.

### No live third-party fact APIs

The core demo does not depend on live Maps, search or external fact APIs.

### No replacement database

The supplied PS-13 database remains the source of truth.

### No AR/XR

GeoGuide is designed as a web application and does not require an AR/VR device.

### No fabricated live information

If the available data does not support a claim, GeoGuide refuses instead of inventing one.

These boundaries keep the system focused on the central PS-13 requirement: a useful location-aware companion with grounded, explainable AI behaviour.

---

# 21. 🔐 Why GeoGuide Is Different

GeoGuide is not simply:

> **"Ask an AI about a city."**

It combines:

```text
LOCATION
    +
DATE
    +
STRUCTURED DATA
    +
RETRIEVAL
    +
RELEVANCE GATE
    +
AI GENERATION
    +
CITATION VALIDATION
    +
VISIBLE PROVENANCE
    +
REFUSAL
    ↓
TRUSTWORTHY PLACE COMPANION
```

The central design decision is:

> **An AI answer is useful only when the system can show why it is allowed to say it.**

That principle affects the entire application — from the database and retrieval layer to generation, citation checking, recommendations and the final UI.

---

# 22. 🏁 PS-13 Requirement Coverage

| PS-13 Capability            | GeoGuide Implementation                     |
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
| Voice                       | Browser TTS                                 |
| Contextual recommendations  | Contextual Action Engine                    |
| Explainable recommendations | Data-derived reason chips                   |
| Unsupported questions       | Relevance gate + refusal                    |
| Adversarial probes          | Curated refusal test set                    |
| Grounding proof             | Retrieval-off refusal + citation validation |

---

# 23. 🧰 Tools & Libraries

GeoGuide uses:

* FastAPI
* Uvicorn
* Pydantic
* ChromaDB
* Sentence Transformers
* `paraphrase-multilingual-MiniLM-L12-v2`
* Google Gemini / `google-genai`
* Python dotenv
* Pytest
* React
* Vite
* Browser Web Speech API
* Optional Ollama fallback

Claude (Anthropic) was used as an AI coding assistant during the hackathon window.

---

# 24. 🖼️ Visual Assets

City and place images used by the application are sourced from Wikimedia Commons and used according to their listed licenses.

The repository contains the corresponding image/source information for the city and place assets.

---

# 25. 👥 Team VVinners

### Vamika A Bhat

**AI & RAG**

Responsible for:

* Retrieval pipeline
* Embeddings
* Prompt design
* Grounding guard
* Citation validation
* AI evaluation
* Refusal behaviour

### Vishnu Mashalkar

**Backend & Orchestration**

Responsible for:

* FastAPI
* API design
* Structured database queries
* Date-Shift logic
* Context resolution
* Right Now ranker
* Session state
* Backend integration

### Vachana M H

**Frontend & UX**

Responsible for:

* React/Vite application
* Briefing interface
* Nearby interface
* Right Now interface
* Ask interface
* Source chips
* Language UI
* TTS
* Demo presentation

### Varsha Kusumadhara Kodi

**Data & Conformance**

Responsible for:

* PS-13 database integration
* Data validation
* Embedding/index preparation
* Boundary rules
* Conformance tests
* Evaluation suite
* Data documentation

---

# 26. 💡 One-Line Pitch

> **GeoGuide is a location-aware AI travel companion that tells you what matters about a place, what you can do right now, and what you should know — while showing the source behind every claim and refusing to guess when the data doesn't support an answer.**

---

## 🌍 GeoGuide

**Arrive. Understand. Act. Ask. — with evidence.**

**Team VVinners · BMS College of Engineering**
**KogniVera Hackathon 2026 · PS-13**
