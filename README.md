# 🌍 GeoGuide — Location-Aware AI Place Companion

> **A travel companion that doesn't just tell you about a place — it proves where every fact came from.**

**Team VVinners · BMS College of Engineering**
**KogniVera Hackathon 2026 · PS-13 — GeoGuide: Location-Aware AI Place Companion**

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

`default.jpg` is a local fallback copy of the Bengaluru image.

---

# 💡 The One-Line Pitch

> **GeoGuide is a location-aware AI travel companion that tells you what matters about a place, what you can do right now, and what you should know — while showing the source behind every claim and refusing to guess when the data doesn't support an answer.**

---

## Team VVinners

**BMS College of Engineering**
**KogniVera Hackathon 2026**
**PS-13 — GeoGuide: Location-Aware AI Place Companion**

> **Arrive. Understand. Act. Ask. — with evidence.**
