# 🌍 GeoGuide — Location-Aware AI Place Companion

> **A travel companion that doesn't just tell you about a place — it proves where every fact came from.**

**Team VVinners · BMS College of Engineering**
**KogniVera Hackathon 2026 · PS-13 — GeoGuide: Location-Aware AI Place Companion**

---

## 🧭 1. What is GeoGuide?

Imagine arriving in a city you don't know.

You want to quickly understand:

* **Where am I?**
* **What is this place known for?**
* **What's happening today?**
* **What can I do nearby right now?**
* **What should I know before visiting?**
* **Can I trust what this AI is telling me?**

**GeoGuide** is a location-aware AI place companion designed to answer all of these in one flow:

```text
ARRIVE → UNDERSTAND → ACT → ASK
```

The application uses:

**location + date + season + weather + events + local knowledge + language**

to create a grounded travel briefing and help the traveller decide what to do next.

But GeoGuide has one principle that drives the entire system:

> ## If the data cannot support the answer, GeoGuide does not guess.

Every displayed factual claim is connected to a source record, and unsupported questions are refused instead of being answered from the model's general memory.

This directly addresses the central PS-13 requirement: building a location-aware companion whose generated information remains grounded and verifiable.

---

# 🎯 2. Problem We Solve

Travel information is usually scattered across maps, websites, blogs, booking platforms and AI assistants.

A normal AI travel assistant introduces another problem:

> **How does a traveller know whether the AI actually has evidence for what it just said?**

GeoGuide solves both problems.

| Traveller need                      | GeoGuide                                                        |
| ----------------------------------- | --------------------------------------------------------------- |
| Where am I?                         | Location detection + city resolution                            |
| Tell me about this place            | Grounded AI briefing                                            |
| What's happening today?             | Date-aware events                                               |
| What should I do now?               | Contextual Action Engine                                        |
| What is nearby?                     | POIs + hotels                                                   |
| What should I know before visiting? | Culture, etiquette + safety                                     |
| Can I ask follow-ups?               | Grounded conversational Q&A                                     |
| Can I use my language?              | English + Hindi + Kannada, with multilingual content generation |
| Can I listen?                       | Browser TTS                                                     |
| What if the AI doesn't know?        | Explicit refusal                                                |
| Can I verify an answer?             | Visible source chips                                            |

---

# ✨ 3. What We Built

GeoGuide is an end-to-end application with the following core capabilities.

---

## 📍 3.1 Location → Place → Briefing

When the application opens:

```text
Device location
      ↓
Nearest supported city
      ↓
Selected date + season
      ↓
Grounded retrieval
      ↓
AI briefing
```

The app requests device location and resolves it to the nearest supported city using geographic distance.

If location permission is unavailable, a city picker provides a reliable demo fallback.

The resulting briefing is based on:

* City
* Date
* Season
* Weather
* Events
* Safety advisories
* Attractions
* Language

---

# 📰 3.2 Grounded AI Briefing

GeoGuide creates a structured briefing covering:

### 🏛️ History

Relevant historical context.

### 📍 Attractions

Places and points of interest relevant to the city.

### 🎉 What's On

Events and festivals relevant to the selected date.

### ☁️ Weather & Tips

Weather-aware advice generated from the selected day's data.

### 🙏 Culture & Etiquette

Useful local cultural information.

### ⚠️ Safety

Applicable safety advisories.

Each displayed claim carries a **visible source chip**.

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

### Why this matters

The source is not hidden inside a backend log.

**Provenance is part of the user interface.**

---

# 📅 3.3 Date-Shift Briefing

One of our mandatory enhancements is a **date-aware briefing**.

The user can move the briefing to another date supported by the dataset.

For example:

```text
24 September
      ↓
17 October
      ↓
Rebuild date-dependent context
      ↓
New briefing
```

The application recomputes information using:

* `events_festivals`
* `weather_daily`
* `activities_poi`
* `safety_advisories`

This can change:

* Events
* Festival information
* Weather tips
* Relevant activities
* Safety information
* Opening-day context

### Important behaviour

If there is no event on a selected date, GeoGuide says so.

It does **not** invent a festival just because the user asked about one.

---

# ⚡ 3.4 Right Now — Contextual Action Engine

Knowing about a city is useful.

Knowing **what to do next** is even more useful.

GeoGuide includes a deterministic **Contextual Action Engine (CAE)** that answers:

> **"What should I do in the next 90 minutes?"**

It ranks available activities using structured information such as:

* Current location
* Distance
* Opening hours
* Time required
* Entry cost
* Budget
* Activity type
* Season
* Other available contextual factors

Example:

```text
RIGHT NOW
Next 90 minutes

1. Bengaluru Bazaar
   Open till 21:00
   1.4 km
   ~90 min
   ₹350

   ✓ Open now
   ✓ Fits time
   ✓ Matches activity preference

2. Bengaluru Viewpoint
   Open till 21:00
   2.1 km
   ~60 min
   ₹50

   ✓ Open now
   ✓ Fits time
   ✓ In season
```

### Key design decision

The ranking is performed by the **backend ranker**, not by the LLM.

This makes the recommendation:

* Deterministic
* Reproducible
* Explainable
* Data-driven

Every recommendation also exposes the reasons behind its ranking.

---

# 💬 3.5 Grounded Follow-Up Q&A

GeoGuide is conversational.

After receiving the briefing, a traveller can ask:

> **"Anything I should know before Bengaluru Bazaar?"**

The application retrieves relevant information and answers using the grounded context.

Low-confidence information is explicitly flagged:

```text
LOWER CONFIDENCE
Verify locally

✓ poi_facts_kb
```

The session also preserves context.

For example:

```text
User:
Tell me about Bengaluru Bazaar.

GeoGuide:
...

User:
What should I know before going there?
```

The system can resolve **"there"** using the previously cited POI.

Each follow-up is retrieved and grounded independently.

---

# 🛑 3.6 Refusal Instead of Invention

This is the defining feature of GeoGuide.

Consider the question:

> **"How much is a cab to the airport right now?"**

If the provided data does not contain live cab fares, the correct response is:

```text
No live fares in the grounded data,
so I won't guess.

✕ no grounded data
```

The system does not manufacture a number.

The same principle applies to:

* Unsupported live information
* Unsupported exchange rates
* Made-up landmarks
* Questions outside the retrieved knowledge
* Adversarial probes

---

# 🔐 3.7 Grounding-Off Proof

GeoGuide includes a direct demonstration that the AI does not silently fall back to model memory.

```text
GROUNDING ON
     ↓
Retrieve evidence
     ↓
Relevant evidence?
   ↙        ↘
 YES         NO
  ↓           ↓
 LLM       REFUSE
  ↓
Citation check
  ↓
Answer
```

When grounding is turned off:

```text
GROUNDING OFF
      ↓
No trusted evidence
      ↓
REFUSE
```

This makes grounding a **testable system property**, rather than simply a claim in the documentation.

---

# 🧠 4. How the AI Works

GeoGuide uses **Retrieval-Augmented Generation (RAG)**.

The simplified pipeline is:

```text
                    ┌─────────────────────┐
                    │    React Frontend    │
                    │                     │
                    │ location            │
                    │ date                │
                    │ language            │
                    │ question            │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │    FastAPI Backend   │
                    └──────────┬──────────┘
                               │
                ┌──────────────┴──────────────┐
                │                             │
                ▼                             ▼
        ┌───────────────┐             ┌─────────────────┐
        │   PS-13.db    │             │ Action Ranker   │
        │ Source of     │             │ "Right Now"    │
        │ truth         │             └─────────────────┘
        └───────┬───────┘
                │
                ▼
        ┌─────────────────┐
        │ ChromaDB / RAG  │
        │ Retrieval       │
        └────────┬────────┘
                 │
                 ▼
        ┌─────────────────┐
        │ Relevance Gate  │
        └───────┬─────────┘
                │
          ┌─────┴─────┐
          │           │
       Relevant    Not relevant
          │           │
          ▼           ▼
       Gemini       REFUSE
          │
          ▼
    Citation Check
          │
          ▼
 Grounded response
 + source chips
```

---

# 🛡️ 5. Three-Layer Grounding Guard

GeoGuide protects against unsupported generation at multiple stages.

## Layer 1 — Relevance Gate

Retrieved content is checked against a relevance threshold.

If nothing sufficiently relevant is found:

```text
Retrieval
   ↓
Below threshold
   ↓
LLM is NOT called
   ↓
REFUSAL
```

This is important because simply prompting an LLM to "not hallucinate" does not guarantee that it will refuse.

GeoGuide prevents generation when evidence is missing.

---

## Layer 2 — Context-Only Generation

When the LLM is called, it receives retrieved context.

The model is instructed to:

* Use only the supplied context
* Cite claims using the retrieved source labels
* Omit unsupported claims
* Return insufficient information when the evidence is not enough

---

## Layer 3 — Citation Validation

The generated answer is checked before reaching the UI.

```text
Generated response
        ↓
Check claims
        ↓
Source attached?
    ↙          ↘
   YES          NO
    ↓            ↓
  Show         Drop
```

If an entire response becomes uncited, GeoGuide refuses instead of displaying it.

---

# 🔍 6. Retrieval Design

The knowledge base is indexed as **overlapping two-sentence windows** rather than embedding entire paragraphs.

This improves retrieval precision.

For example, a question about tap water can retrieve the specific relevant sentence rather than a large paragraph containing unrelated information.

Titles are excluded from embedded text to prevent generic words from causing incorrect retrieval.

Current index:

```text
place_kb       → 3,173 windows
poi_facts_kb   →   900 facts
```

---

# 📊 7. Data Model

The provided **PS-13.db remains the source of truth**.

GeoGuide uses the supplied tables without renaming or repurposing them.

| Table               | Used for                                        |
| ------------------- | ----------------------------------------------- |
| `cities`            | City identity, coordinates, season and language |
| `place_kb`          | Main RAG knowledge                              |
| `poi_facts_kb`      | Grounded POI facts + confidence                 |
| `activities_poi`    | Nearby places, hours, cost and coordinates      |
| `events_festivals`  | Date-aware events                               |
| `weather_daily`     | Weather and weather-aware advice                |
| `safety_advisories` | Safety information                              |
| `hotels`            | Nearby accommodation                            |
| `languages`         | Language + TTS support                          |
| `currencies`        | Currency information                            |
| `countries`         | Country relationships                           |

### Supporting infrastructure added beside the data

We add:

* ChromaDB vector index
* Retrieval logs
* Briefing cache
* Session state
* Derived source labels where required

The original database structure remains intact.

---

# 📅 8. Date-Aware Data Flow

Date shifting is handled at the backend rather than simply changing text in the UI.

```text
Selected date
      ↓
Date validation / clamping
      ↓
┌─────────────────────────────┐
│ events_festivals            │
│ weather_daily               │
│ activities_poi              │
│ safety_advisories           │
└──────────────┬──────────────┘
               ↓
      Date-specific passages
               ↓
           Retrieval
               ↓
       Grounded briefing
```

The backend includes date-aware handling for:

* Date ranges
* Dataset date limits
* Season calculation
* Event windows
* Closed-day handling

---

# 🌐 9. Multilingual + Voice

GeoGuide supports:

* 🇬🇧 English
* 🇮🇳 Hindi
* 🟡 Kannada

The content can be generated in the selected language from the same grounded evidence.

The knowledge base does not need to be duplicated for every language:

```text
One grounded knowledge base
          ↓
Same retrieved facts
          ↓
English / Hindi / Kannada
          ↓
Text / TTS
```

Browser-based TTS is used where the selected language is supported by the device/browser.

### Current limitation

The **content** can be generated in the supported target languages, but some UI labels currently fall back to English.

---

# 🏗️ 10. Architecture

```text
React + Vite
│
├── Location
├── Date control
├── Language
├── Briefing
├── Attractions
├── Nearby & Act
├── Right Now
├── Follow-up Q&A
├── Grounding toggle
└── TTS
        │
        ▼
FastAPI
│
├── Place resolution
├── Date handling
├── Data queries
├── Session state
├── AI routes
└── Contextual Action Engine
        │
        ├──────────────► PS-13.db
        │
        ▼
AI / RAG
│
├── Passage construction
├── ChromaDB retrieval
├── Relevance gate
├── Gemini generation
├── Citation validation
├── Confidence handling
└── Refusal
        │
        ▼
Grounded claims
+
Source labels
OR
Refusal
```

---

# 🧰 11. Technology Stack

| Layer            | Technology             | Purpose                      |
| ---------------- | ---------------------- | ---------------------------- |
| Frontend         | React + Vite           | Interactive web application  |
| Backend          | Python + FastAPI       | APIs + orchestration         |
| Database         | SQLite / PS-13.db      | Source of truth              |
| Vector store     | ChromaDB               | Semantic retrieval           |
| Embeddings       | Sentence Transformers  | Knowledge indexing           |
| LLM              | Gemini API             | Grounded response generation |
| Testing          | Pytest                 | Automated verification       |
| Voice            | Browser Web Speech API | Read-aloud                   |
| Offline fallback | Ollama                 | Local model fallback         |

---

# ⚙️ 12. Run Locally

## Step 1 — Create environment

```bash
python3 -m venv .venv
source .venv/bin/activate
```

Windows:

```bash
.venv\Scripts\activate
```

---

## Step 2 — Install dependencies

```bash
pip install -r backend/requirements.txt
```

---

## Step 3 — Configure environment

```bash
cp .env.example .env
```

Configure the Gemini credentials/model required by the application.

---

## Step 4 — Build the retrieval index

```bash
python -m ai.index --reset
```

Expected index:

```text
place_kb:       3173
poi_facts_kb:    900
```

---

## Step 5 — Run backend

```bash
uvicorn backend.main:app --port 8000
```

---

## Step 6 — Run frontend

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

# 🧪 13. Verification

GeoGuide includes automated tests so the core behaviour can be checked without an API key.

Run:

```bash
python -m pytest tests -q
```

Expected:

```text
27 passed
```

The test suite covers:

* Grounding
* Refusal
* Citation enforcement
* Date shifting
* Empty-event dates
* Festival dates
* Boundary rules
* City isolation
* Adversarial questions

---

# 🔬 14. Quick Backend Checks

After starting the backend:

### Health check

```bash
curl -s localhost:8000/health
```

The health response should show the indexed knowledge counts.

### Current briefing

```bash
curl -s "localhost:8000/briefing?city_id=cty_718f03c7&fresh=true"
```

### Date-shift test

```bash
curl -s "localhost:8000/briefing?city_id=cty_17b8ef2f&for_date=2026-10-17&fresh=true"
```

The date-shift response should contain the appropriate event information for 17 October.

---

# 🔥 15. Prewarming the Demo

GeoGuide supports caching of complete generated briefings.

This lets the demo avoid unnecessary repeated model calls.

Example:

```bash
python -m ai.prewarm \
  --langs en-IN \
  --dates 2026-09-24 2026-10-17
```

### Important

Refusals are **never cached as successful briefings**.

---

# 🎬 16. Recommended Judge Demo

The fastest way to understand GeoGuide is to follow one traveller.

---

## ① ARRIVE

Open the application.

Show:

```text
Location detected
      ↓
Bengaluru
      ↓
Date + season + weather
```

If GPS permission is unavailable, use the city picker.

---

## ② BRIEF ME

Click:

> **Brief me on Bengaluru**

Show the sections and point out:

> **Every factual claim has a source chip.**

This establishes the main thesis immediately.

---

## ③ MOVE THE DATE

Change the date to:

> **17 October**

Show that:

* The event information changes
* Weather context changes
* Date-dependent information is rebuilt

This demonstrates that the briefing is **data-driven rather than a static chatbot response**.

---

## ④ RIGHT NOW

Ask:

> **What should I do in the next 90 minutes?**

Show the ranked recommendations.

Point out:

```text
Open now
Distance
Time fit
Budget
Other data-derived reasons
```

Explain:

> **The ranking is performed by our deterministic Action Engine, not by the LLM.**

---

## ⑤ ASK

Ask:

> **"Anything I should know before Bengaluru Bazaar?"**

Show:

* Grounded response
* Source
* Confidence indicator

Then ask:

> **"How much is a cab to the airport right now?"**

The app should refuse:

> **No live fares in the grounded data, so I won't guess.**

---

## ⑥ TURN GROUNDING OFF

Ask another factual question.

Show:

> **Refusal**

This is the proof that the system does not simply fall back to the LLM's memory.

---

# 📈 17. What We Measure

GeoGuide focuses on properties that can actually be tested.

### Grounding

Every displayed factual claim must have a source label.

### Refusal

Unsupported/adversarial questions must be refused.

### Confidence

Low-confidence facts display:

> **Verify locally**

### Action Engine

Recommendations expose their data-derived reasons.

### Conformance

Database usage is checked against the required boundary rules.

### Date correctness

The test suite verifies that changing the date changes the relevant event/weather context and that dates with no scheduled events are represented honestly.

---

# 👥 18. Team VVinners

Vachana M H, Vamika A Bhat, Varsha Kusumadhara Kodi and Vishnu Mashalkar, BMS College of Engineering.

---

# 🚧 19. Current Known Limitations

We prefer to state limitations clearly rather than hide them.

### No SSE streaming

Briefings currently arrive as one response rather than streaming token-by-token.

Caching is used to keep repeated demo briefings fast.

### Some UI labels fall back to English

The generated **content** supports the selected language, while some interface labels are currently English.

### Budget input for the Action Engine

The ranker's budget currently needs to be passed explicitly rather than being automatically read from `user_preferences`.

### Browser TTS availability

Available voices depend on the browser/device. The application checks supported TTS languages before offering read-aloud.

### Gemini dependency

The primary live generation path uses Gemini.

An optional Ollama fallback can be used for local generation if configured.

---

# 🚫 20. What We Deliberately Do NOT Build

These are intentional scope decisions.

### ❌ Booking / payments

GeoGuide can surface hotels and places but does not transact.

### ❌ Live third-party map/fact APIs

The demo does not depend on external Maps, geocoding or fact-fetching APIs for its factual content.

### ❌ Replacement database

The provided PS-13 database remains the source of truth.

### ❌ AR/XR

GeoGuide is a web/mobile application and does not require AR/VR hardware.

### ❌ Invented information

If the database cannot support an answer, GeoGuide refuses.

---

# 📁 21. Project Structure

```text
GeoGuide/
│
├── frontend/
│   ├── React application
│   ├── UI screens
│   ├── date control
│   ├── language / TTS
│   └── grounding controls
│
├── backend/
│   ├── main.py
│   ├── data_queries.py
│   ├── ai_routes.py
│   └── ranker.py
│
├── ai/
│   ├── llm.py
│   ├── briefing.py
│   ├── passages.py
│   ├── cache.py
│   ├── prewarm.py
│   ├── session.py
│   └── retrieval / indexing
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

# 🔗 22. PS-13 Requirement Coverage

| PS-13 requirement           | GeoGuide implementation                          |
| --------------------------- | ------------------------------------------------ |
| Device location             | GPS + fallback city picker                       |
| Place identification        | Nearest supported city                           |
| Date / season               | Date + `cities.season_profile`                   |
| History                     | `place_kb`                                       |
| Attractions                 | `activities_poi` + grounded attraction retrieval |
| Culture / etiquette         | `place_kb`                                       |
| Events                      | `events_festivals`                               |
| Weather tips                | `weather_daily`                                  |
| Safety                      | `safety_advisories`                              |
| Nearby places               | `activities_poi`                                 |
| Hotels                      | `hotels`                                         |
| Follow-up Q&A               | Session-aware RAG                                |
| Low-confidence facts        | `poi_facts_kb.confidence`                        |
| Multilingual                | English + Hindi + Kannada content                |
| Voice                       | TTS                                              |
| Contextual recommendations  | Contextual Action Engine                         |
| Explainable recommendations | Data-derived reason chips                        |
| Unsupported questions       | Relevance gate + refusal                         |
| Adversarial testing         | Refusal test set                                 |
| Grounding proof             | Citation validation + grounding-off refusal      |
| Date-shift enhancement      | Date-aware retrieval and structured data         |

---

# 💡 23. Why GeoGuide?

GeoGuide is not simply:

> **"Ask an AI about a city."**

It is:

```text
LOCATION
    +
DATE
    +
PS-13 DATA
    +
RETRIEVAL
    +
GROUNDING GUARD
    +
AI
    +
VISIBLE PROVENANCE
    +
CONTEXTUAL ACTION ENGINE
    +
REFUSAL
    =
A TRUST-AWARE PLACE COMPANION
```

Our central design decision is:

> ## An AI answer is useful only when the system can show why it is allowed to say it.

That principle influences the entire application:

**database → retrieval → relevance gate → generation → citation validation → UI**

and also determines when the system should **say nothing at all**.

---

# 🏁 24. One-Line Pitch

> **GeoGuide is a location-aware AI travel companion that tells you what matters about a place, what you can do right now, and what you should know — while showing the source behind every claim and refusing to guess when the data doesn't support an answer.**

---

## Team VVinners

**BMS College of Engineering**
**KogniVera Hackathon 2026**
**PS-13 — GeoGuide: Location-Aware AI Place Companion**

> **Arrive. Understand. Act. Ask. — with evidence.**
