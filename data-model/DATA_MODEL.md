# Data model — canonical tables used, and what we added

Source of truth: the provided `PS-13.db` (19 tables, 23,215 rows), verified by sha256.
Schema copy: `data-model/schema.sql`. Seed used by the demo: `data-model/seed/PS-13.db`.

## Canonical tables we read

| Table | Used for | Key fields |
|---|---|---|
| `cities` | Place resolution, season, peak months, primary language | `lat`, `lng`, `season_profile`, `peak_months`, `primary_language` |
| `place_kb` | Briefing prose and the RAG corpus | `section`, `body`, `source_label`, `city_id`, `poi_id` |
| `poi_facts_kb` | POI facts in Q&A, with honest uncertainty | `fact_text`, `confidence` |
| `activities_poi` | Attractions, nearby places, the ranker | `lat/lng`, `opens_at`, `closes_at`, `closed_days`, `entry_cost`, `currency`, `typical_duration_minutes` |
| `events_festivals` | "What's on" for the briefing date | `start_date`, `end_date`, `name`, `status` |
| `weather_daily` | Weather tips and the season for a date | `for_date`, `temp_min_c`, `temp_max_c`, `condition`, `season`, `is_extreme` |
| `safety_advisories` | Safety section, validity checked against the date | `level`, `advisory_type`, `valid_from`, `valid_to` |
| `hotels` | Stay-nearby suggestions | `star_rating`, `guest_score`, `distance_to_centre_km` |
| `languages` | Language and voice routing | `bcp47`, `tts_supported` |
| `currencies`, `countries` | Currency and country reference | `iso4217`, `minor_unit_exponent` |

Nothing above was renamed, dropped or re-keyed (Rule R1). The database is opened read-only.

## What we added, and why

| Addition | Why |
|---|---|
| ChromaDB index (`.chroma/`) over `place_kb` and `poi_facts_kb` | Vector retrieval. Keyed on `embedding_ref`; the provided embeddings parquet was not in the data folder |
| Derived source label for POI facts | `poi_facts_kb` has no `source_label`, and every displayed claim must name a source. Format: `KV POI Facts / <city> / <POI> / <fact_type>` |
| Sentence-window indexing of `place_kb` bodies | A whole-paragraph vector dilutes each specific fact in it. Windows are index-time only; `source_label` and the stored rows are untouched |
| City derived for POI-level `place_kb` chunks | 720 of 1,200 chunks carry `poi_id` and no `city_id`; the city comes from `activities_poi` so a city filter doesn't drop them |
| Briefing cache (`.cache/briefings`) | A briefing is one LLM call; caching makes the demo instant and rehearsals free. Keyed by city, language, date, model and the grounding flag, and never caches a refusal |
| In-process session state | Resolves "there" to the previously cited POI. It only rewrites the question; it is never a source |

## Boundary rules enforced in code

| Rule | Where | Test |
|---|---|---|
| R1 additive only | `data_queries.connect()` opens `mode=ro` | `test_r1_database_is_opened_read_only` |
| R2 opaque IDs | IDs passed through as strings, never parsed | `test_r2_ids_are_opaque_strings` |
| R3 money is decimal + ISO-4217 | `pois()` returns `Decimal`-exact strings with `currency` | `test_r3_money_is_a_decimal_string_with_a_currency` |
| R4 ISO-8601 with offset | `advisories()` compares `datetime.fromisoformat` values | `test_r4_timestamps_are_compared_with_their_offset` |
| R5 lowercase snake_case enums | Seasons and conditions used verbatim | `test_r5_enums_are_lowercase_snake_case` |
| R6 BCP-47 language | `languages_for()` joins `languages` | `test_r6_languages_are_bcp47_tags` |
| R7 WGS-84, lat+lng together | `haversine()` takes both or neither | `test_r7_geography_is_a_pair` |
| R8 nothing hard-deleted | Every query filters `status='active'` | `test_r8_inactive_rows_are_filtered_not_deleted` |

`closed_days` uses 0 = Monday, matching `date.weekday()`. A null `closes_at` means open-ended, not an error — several Pune POIs have one.
