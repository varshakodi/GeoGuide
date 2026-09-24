-- KV Hackathon 2026 · travel data model v1.1.0-rc1
-- Only the 19 tables this problem statement needs.

CREATE EXTENSION IF NOT EXISTS vector;   -- optional, for embedding search

-- categories  (Reference & geography)
CREATE TABLE categories (
  category_id                  TEXT PRIMARY KEY,
  code                         TEXT NOT NULL UNIQUE,
  label                        TEXT NOT NULL,
  parent_category_id           TEXT,
  applies_to                   TEXT NOT NULL,
  updated_at                   TIMESTAMPTZ NOT NULL
);

-- currencies  (Reference & geography)
CREATE TABLE currencies (
  currency_id                  TEXT PRIMARY KEY,
  iso4217                      CHAR(3) NOT NULL UNIQUE,
  name                         TEXT NOT NULL,
  symbol                       TEXT NOT NULL,
  minor_unit_exponent          SMALLINT NOT NULL,
  display_locale               TEXT NOT NULL,
  updated_at                   TIMESTAMPTZ NOT NULL
);

-- languages  (Reference & geography)
CREATE TABLE languages (
  language_id                  TEXT PRIMARY KEY,
  bcp47                        TEXT NOT NULL UNIQUE,
  english_name                 TEXT NOT NULL,
  native_name                  TEXT NOT NULL,
  script                       TEXT NOT NULL,
  rtl                          BOOLEAN NOT NULL,
  tts_supported                BOOLEAN NOT NULL,
  updated_at                   TIMESTAMPTZ NOT NULL
);

-- countries  (Reference & geography)
CREATE TABLE countries (
  country_id                   TEXT PRIMARY KEY,
  iso2                         CHAR(2) NOT NULL UNIQUE,
  iso3                         CHAR(3) NOT NULL UNIQUE,
  name                         TEXT NOT NULL,
  default_currency             CHAR(3) NOT NULL,
  calling_code                 TEXT NOT NULL,
  region                       TEXT NOT NULL,
  updated_at                   TIMESTAMPTZ NOT NULL
);

-- cities  (Reference & geography)
CREATE TABLE cities (
  city_id                      TEXT PRIMARY KEY,
  name                         TEXT NOT NULL,
  state                        TEXT,
  country_id                   TEXT NOT NULL,
  country_code                 CHAR(2) NOT NULL,
  lat                          NUMERIC(9,6) NOT NULL,
  lng                          NUMERIC(9,6) NOT NULL,
  timezone                     TEXT NOT NULL,
  region                       TEXT NOT NULL,
  population                   INTEGER,
  season_profile               TEXT NOT NULL CHECK (season_profile IN ('winter', 'summer', 'monsoon', 'post_monsoon', 'spring', 'autumn')),
  peak_months                  TEXT NOT NULL,
  primary_language             TEXT NOT NULL,
  description                  TEXT,
  status                       TEXT NOT NULL CHECK (status IN ('active', 'inactive', 'archived', 'draft')),
  updated_at                   TIMESTAMPTZ NOT NULL
);

-- events_festivals  (Supply & catalogue)
CREATE TABLE events_festivals (
  event_id                     TEXT PRIMARY KEY,
  city_id                      TEXT NOT NULL,
  name                         TEXT NOT NULL,
  category_id                  TEXT NOT NULL,
  start_date                   DATE NOT NULL,
  end_date                     DATE NOT NULL,
  season                       TEXT NOT NULL CHECK (season IN ('winter', 'summer', 'monsoon', 'post_monsoon', 'spring', 'autumn')),
  recurrence                   TEXT NOT NULL,
  expected_footfall            INTEGER,
  is_ticketed                  BOOLEAN NOT NULL,
  ticket_price                 NUMERIC(12,2),
  currency                     CHAR(3),
  venue_lat                    NUMERIC(9,6),
  venue_lng                    NUMERIC(9,6),
  description                  TEXT NOT NULL,
  status                       TEXT NOT NULL CHECK (status IN ('active', 'inactive', 'archived', 'draft')),
  updated_at                   TIMESTAMPTZ NOT NULL
);

-- hotels  (Supply & catalogue)
CREATE TABLE hotels (
  hotel_id                     TEXT PRIMARY KEY,
  city_id                      TEXT NOT NULL,
  name                         TEXT NOT NULL,
  property_type                TEXT NOT NULL CHECK (property_type IN ('hotel', 'resort', 'homestay', 'hostel', 'apartment', 'boutique', 'heritage', 'guesthouse')),
  star_rating                  SMALLINT NOT NULL,
  guest_score                  NUMERIC(2,1),
  review_count                 INTEGER NOT NULL,
  address_line                 TEXT NOT NULL,
  lat                          NUMERIC(9,6) NOT NULL,
  lng                          NUMERIC(9,6) NOT NULL,
  distance_to_centre_km        NUMERIC(6,2) NOT NULL,
  description                  TEXT NOT NULL,
  base_currency                CHAR(3) NOT NULL,
  checkin_time                 TEXT NOT NULL,
  checkout_time                TEXT NOT NULL,
  chain_code                   TEXT,
  has_xr_scene                 BOOLEAN NOT NULL,
  status                       TEXT NOT NULL CHECK (status IN ('active', 'inactive', 'archived', 'draft')),
  created_at                   TIMESTAMPTZ NOT NULL,
  updated_at                   TIMESTAMPTZ NOT NULL
);

-- safety_advisories  (Content, knowledge & safety)
CREATE TABLE safety_advisories (
  advisory_id                  TEXT PRIMARY KEY,
  city_id                      TEXT NOT NULL,
  advisory_type                TEXT NOT NULL CHECK (advisory_type IN ('weather', 'health', 'safety', 'transport', 'political', 'wildlife')),
  level                        TEXT NOT NULL CHECK (level IN ('info', 'advisory', 'caution', 'warning', 'severe')),
  title                        TEXT NOT NULL,
  body                         TEXT NOT NULL,
  language                     TEXT NOT NULL,
  valid_from                   TIMESTAMPTZ NOT NULL,
  valid_to                     TIMESTAMPTZ NOT NULL,
  issuing_body                 TEXT NOT NULL,
  affected_area                TEXT,
  source_url                   TEXT,
  status                       TEXT NOT NULL CHECK (status IN ('active', 'inactive', 'archived', 'draft')),
  updated_at                   TIMESTAMPTZ NOT NULL
);

-- users  (Identity & preference)
CREATE TABLE users (
  user_id                      TEXT PRIMARY KEY,
  display_name                 TEXT NOT NULL,
  email                        TEXT NOT NULL UNIQUE,
  home_city_id                 TEXT NOT NULL,
  home_currency                CHAR(3) NOT NULL,
  locale                       TEXT NOT NULL,
  budget_band                  TEXT NOT NULL CHECK (budget_band IN ('shoestring', 'value', 'mid', 'premium', 'luxury')),
  travel_style                 TEXT NOT NULL CHECK (travel_style IN ('budget', 'comfort', 'luxury', 'adventure', 'slow', 'cultural', 'wellness')),
  traveller_type               TEXT NOT NULL CHECK (traveller_type IN ('solo', 'couple', 'family', 'business', 'friends', 'senior', 'backpacker')),
  segment                      TEXT NOT NULL CHECK (segment IN ('heavy', 'light', 'cold_start')),
  date_of_signup               DATE NOT NULL,
  loyalty_tier                 TEXT,
  status                       TEXT NOT NULL CHECK (status IN ('active', 'inactive', 'archived', 'draft')),
  created_at                   TIMESTAMPTZ NOT NULL,
  updated_at                   TIMESTAMPTZ NOT NULL
);

-- weather_daily  (Reference & geography)
CREATE TABLE weather_daily (
  weather_id                   TEXT PRIMARY KEY,
  city_id                      TEXT NOT NULL,
  for_date                     DATE NOT NULL,
  temp_min_c                   NUMERIC(4,1) NOT NULL,
  temp_max_c                   NUMERIC(4,1) NOT NULL,
  feels_like_c                 NUMERIC(4,1),
  precipitation_mm             NUMERIC(6,2) NOT NULL,
  humidity_pct                 SMALLINT NOT NULL,
  wind_kph                     NUMERIC(5,1) NOT NULL,
  condition                    TEXT NOT NULL CHECK (condition IN ('clear', 'partly_cloudy', 'cloudy', 'light_rain', 'heavy_rain', 'thunderstorm', 'fog', 'haze', 'snow')),
  season                       TEXT NOT NULL CHECK (season IN ('winter', 'summer', 'monsoon', 'post_monsoon', 'spring', 'autumn')),
  is_extreme                   BOOLEAN NOT NULL,
  updated_at                   TIMESTAMPTZ NOT NULL,
  UNIQUE (city_id, for_date)
);

-- activities_poi  (Supply & catalogue)
CREATE TABLE activities_poi (
  poi_id                       TEXT PRIMARY KEY,
  city_id                      TEXT NOT NULL,
  name                         TEXT NOT NULL,
  category_id                  TEXT NOT NULL,
  poi_category                 TEXT NOT NULL CHECK (poi_category IN ('heritage', 'nature', 'museum', 'religious', 'adventure', 'food', 'shopping', 'nightlife', 'beach', 'wildlife', 'wellness', 'viewpoint')),
  lat                          NUMERIC(9,6) NOT NULL,
  lng                          NUMERIC(9,6) NOT NULL,
  typical_duration_minutes     INTEGER NOT NULL,
  entry_cost                   NUMERIC(12,2) NOT NULL,
  currency                     CHAR(3) NOT NULL,
  carbon_kg                    NUMERIC(8,3) NOT NULL,
  popularity_score             SMALLINT NOT NULL,
  value_score                  SMALLINT NOT NULL,
  opens_at                     TEXT,
  closes_at                    TEXT,
  closed_days                  TEXT,
  best_season                  TEXT CHECK (best_season IN ('winter', 'summer', 'monsoon', 'post_monsoon', 'spring', 'autumn')),
  accessibility                TEXT NOT NULL,
  tags                         TEXT NOT NULL,
  description                  TEXT NOT NULL,
  has_xr_scene                 BOOLEAN NOT NULL,
  status                       TEXT NOT NULL CHECK (status IN ('active', 'inactive', 'archived', 'draft')),
  updated_at                   TIMESTAMPTZ NOT NULL
);

-- place_kb  (Content, knowledge & safety)
CREATE TABLE place_kb (
  chunk_id                     TEXT PRIMARY KEY,
  city_id                      TEXT,
  poi_id                       TEXT,
  section                      TEXT NOT NULL CHECK (section IN ('history', 'culture', 'etiquette', 'food', 'transport', 'safety', 'seasonal', 'practical')),
  title                        TEXT NOT NULL,
  body                         TEXT NOT NULL,
  language                     TEXT NOT NULL,
  token_estimate               INTEGER NOT NULL,
  source_label                 TEXT NOT NULL,
  embedding_ref                TEXT,
  seasonal_relevance           TEXT CHECK (seasonal_relevance IN ('winter', 'summer', 'monsoon', 'post_monsoon', 'spring', 'autumn')),
  updated_at                   TIMESTAMPTZ NOT NULL
);

-- poi_facts_kb  (Content, knowledge & safety)
CREATE TABLE poi_facts_kb (
  fact_id                      TEXT PRIMARY KEY,
  poi_id                       TEXT NOT NULL,
  fact_type                    TEXT NOT NULL,
  fact_text                    TEXT NOT NULL,
  language                     TEXT NOT NULL,
  confidence                   TEXT NOT NULL CHECK (confidence IN ('high', 'medium', 'low')),
  display_priority             SMALLINT NOT NULL,
  embedding_ref                TEXT,
  updated_at                   TIMESTAMPTZ NOT NULL
);

-- poi_media  (Supply & catalogue)
CREATE TABLE poi_media (
  media_id                     TEXT PRIMARY KEY,
  poi_id                       TEXT NOT NULL,
  file_path                    TEXT NOT NULL,
  media_role                   TEXT NOT NULL CHECK (media_role IN ('hero', 'room', 'lobby', 'exterior', 'dining', 'pool', 'bathroom', 'view', 'landmark', 'menu', 'sign', 'receipt')),
  alt_text                     TEXT NOT NULL,
  label_class                  TEXT NOT NULL,
  dataset_split                TEXT NOT NULL CHECK (dataset_split IN ('train', 'eval')),
  width_px                     INTEGER NOT NULL,
  height_px                    INTEGER NOT NULL,
  capture_conditions           TEXT,
  updated_at                   TIMESTAMPTZ NOT NULL
);

-- trips  (Trip & itinerary)
CREATE TABLE trips (
  trip_id                      TEXT PRIMARY KEY,
  owner_user_id                TEXT NOT NULL,
  title                        TEXT NOT NULL,
  origin_city_id               TEXT,
  destination_city_id          TEXT NOT NULL,
  start_date                   DATE NOT NULL,
  end_date                     DATE NOT NULL,
  party_size                   SMALLINT NOT NULL,
  adults                       SMALLINT NOT NULL,
  children                     SMALLINT NOT NULL,
  trip_type                    TEXT NOT NULL CHECK (trip_type IN ('solo', 'couple', 'family', 'business', 'friends', 'senior', 'backpacker')),
  is_group_trip                BOOLEAN NOT NULL,
  status                       TEXT NOT NULL CHECK (status IN ('draft', 'planning', 'confirmed', 'in_progress', 'completed', 'cancelled')),
  home_currency                CHAR(3) NOT NULL,
  notes                        TEXT,
  created_at                   TIMESTAMPTZ NOT NULL,
  updated_at                   TIMESTAMPTZ NOT NULL
);

-- user_devices  (Identity & preference)
CREATE TABLE user_devices (
  device_id                    TEXT PRIMARY KEY,
  user_id                      TEXT NOT NULL,
  platform                     TEXT NOT NULL,
  model                        TEXT NOT NULL,
  os_version                   TEXT NOT NULL,
  push_token                   TEXT,
  locale                       TEXT NOT NULL,
  last_lat                     NUMERIC(9,6),
  last_lng                     NUMERIC(9,6),
  last_seen_at                 TIMESTAMPTZ,
  device_class                 TEXT NOT NULL CHECK (device_class IN ('phone_ar', 'tablet_ar', 'headset_vr', 'desktop')),
  xr_capability                TEXT NOT NULL,
  updated_at                   TIMESTAMPTZ NOT NULL
);

-- user_preferences  (Identity & preference)
CREATE TABLE user_preferences (
  preference_id                TEXT PRIMARY KEY,
  user_id                      TEXT NOT NULL UNIQUE,
  preferred_languages          TEXT NOT NULL,
  guide_language               TEXT,
  interests                    TEXT NOT NULL,
  dietary_flags                TEXT,
  accessibility_needs          TEXT,
  preferred_currency           CHAR(3) NOT NULL,
  max_daily_budget             NUMERIC(12,2),
  max_daily_budget_currency    CHAR(3),
  pace                         TEXT NOT NULL,
  updated_at                   TIMESTAMPTZ NOT NULL
);

-- itineraries  (Trip & itinerary)
CREATE TABLE itineraries (
  itinerary_id                 TEXT PRIMARY KEY,
  trip_id                      TEXT NOT NULL,
  name                         TEXT NOT NULL,
  version                      INTEGER NOT NULL,
  is_active                    BOOLEAN NOT NULL,
  generated_by                 TEXT NOT NULL CHECK (generated_by IN ('user', 'ai_planner', 'optimizer', 'agent', 'vote', 'import')),
  total_cost                   NUMERIC(12,2) NOT NULL,
  currency                     CHAR(3) NOT NULL,
  total_duration_minutes       INTEGER NOT NULL,
  total_carbon_kg              NUMERIC(10,3) NOT NULL,
  optimizer_weights            TEXT,
  status                       TEXT NOT NULL CHECK (status IN ('active', 'inactive', 'archived', 'draft')),
  created_at                   TIMESTAMPTZ NOT NULL,
  updated_at                   TIMESTAMPTZ NOT NULL
);

-- itinerary_items  (Trip & itinerary)
CREATE TABLE itinerary_items (
  item_id                      TEXT PRIMARY KEY,
  itinerary_id                 TEXT NOT NULL,
  day_index                    SMALLINT NOT NULL,
  sort_order                   SMALLINT NOT NULL,
  starts_at                    TIMESTAMPTZ,
  ends_at                      TIMESTAMPTZ,
  item_type                    TEXT NOT NULL CHECK (item_type IN ('hotel', 'flight', 'poi', 'package', 'guide', 'transfer', 'meal', 'free')),
  entity_type                  TEXT CHECK (entity_type IN ('hotel', 'room_type', 'rate_plan', 'flight', 'flight_fare', 'poi', 'package', 'package_component', 'guide', 'transfer', 'event', 'xr_scene')),
  entity_id                    TEXT,
  title                        TEXT NOT NULL,
  cost                         NUMERIC(12,2) NOT NULL,
  currency                     CHAR(3) NOT NULL,
  carbon_kg                    NUMERIC(8,3) NOT NULL,
  duration_minutes             INTEGER NOT NULL,
  source                       TEXT NOT NULL CHECK (source IN ('user', 'ai_planner', 'optimizer', 'agent', 'vote', 'import')),
  explanation                  TEXT,
  locked                       BOOLEAN NOT NULL,
  status                       TEXT NOT NULL CHECK (status IN ('proposed', 'confirmed', 'removed', 'replaced')),
  created_at                   TIMESTAMPTZ NOT NULL,
  updated_at                   TIMESTAMPTZ NOT NULL
);

-- foreign keys
ALTER TABLE categories ADD CONSTRAINT fk_categories_parent_category_id FOREIGN KEY (parent_category_id) REFERENCES categories(category_id);
ALTER TABLE countries ADD CONSTRAINT fk_countries_default_currency FOREIGN KEY (default_currency) REFERENCES currencies(iso4217);
ALTER TABLE cities ADD CONSTRAINT fk_cities_country_id FOREIGN KEY (country_id) REFERENCES countries(country_id);
ALTER TABLE cities ADD CONSTRAINT fk_cities_primary_language FOREIGN KEY (primary_language) REFERENCES languages(bcp47);
ALTER TABLE events_festivals ADD CONSTRAINT fk_events_festivals_city_id FOREIGN KEY (city_id) REFERENCES cities(city_id);
ALTER TABLE events_festivals ADD CONSTRAINT fk_events_festivals_category_id FOREIGN KEY (category_id) REFERENCES categories(category_id);
ALTER TABLE events_festivals ADD CONSTRAINT fk_events_festivals_currency FOREIGN KEY (currency) REFERENCES currencies(iso4217);
ALTER TABLE hotels ADD CONSTRAINT fk_hotels_city_id FOREIGN KEY (city_id) REFERENCES cities(city_id);
ALTER TABLE hotels ADD CONSTRAINT fk_hotels_base_currency FOREIGN KEY (base_currency) REFERENCES currencies(iso4217);
ALTER TABLE safety_advisories ADD CONSTRAINT fk_safety_advisories_city_id FOREIGN KEY (city_id) REFERENCES cities(city_id);
ALTER TABLE safety_advisories ADD CONSTRAINT fk_safety_advisories_language FOREIGN KEY (language) REFERENCES languages(bcp47);
ALTER TABLE users ADD CONSTRAINT fk_users_home_city_id FOREIGN KEY (home_city_id) REFERENCES cities(city_id);
ALTER TABLE users ADD CONSTRAINT fk_users_home_currency FOREIGN KEY (home_currency) REFERENCES currencies(iso4217);
ALTER TABLE users ADD CONSTRAINT fk_users_locale FOREIGN KEY (locale) REFERENCES languages(bcp47);
ALTER TABLE weather_daily ADD CONSTRAINT fk_weather_daily_city_id FOREIGN KEY (city_id) REFERENCES cities(city_id);
ALTER TABLE activities_poi ADD CONSTRAINT fk_activities_poi_city_id FOREIGN KEY (city_id) REFERENCES cities(city_id);
ALTER TABLE activities_poi ADD CONSTRAINT fk_activities_poi_category_id FOREIGN KEY (category_id) REFERENCES categories(category_id);
ALTER TABLE activities_poi ADD CONSTRAINT fk_activities_poi_currency FOREIGN KEY (currency) REFERENCES currencies(iso4217);
ALTER TABLE place_kb ADD CONSTRAINT fk_place_kb_city_id FOREIGN KEY (city_id) REFERENCES cities(city_id);
ALTER TABLE place_kb ADD CONSTRAINT fk_place_kb_poi_id FOREIGN KEY (poi_id) REFERENCES activities_poi(poi_id);
ALTER TABLE place_kb ADD CONSTRAINT fk_place_kb_language FOREIGN KEY (language) REFERENCES languages(bcp47);
ALTER TABLE poi_facts_kb ADD CONSTRAINT fk_poi_facts_kb_poi_id FOREIGN KEY (poi_id) REFERENCES activities_poi(poi_id);
ALTER TABLE poi_facts_kb ADD CONSTRAINT fk_poi_facts_kb_language FOREIGN KEY (language) REFERENCES languages(bcp47);
ALTER TABLE poi_media ADD CONSTRAINT fk_poi_media_poi_id FOREIGN KEY (poi_id) REFERENCES activities_poi(poi_id);
ALTER TABLE trips ADD CONSTRAINT fk_trips_owner_user_id FOREIGN KEY (owner_user_id) REFERENCES users(user_id);
ALTER TABLE trips ADD CONSTRAINT fk_trips_origin_city_id FOREIGN KEY (origin_city_id) REFERENCES cities(city_id);
ALTER TABLE trips ADD CONSTRAINT fk_trips_destination_city_id FOREIGN KEY (destination_city_id) REFERENCES cities(city_id);
ALTER TABLE trips ADD CONSTRAINT fk_trips_home_currency FOREIGN KEY (home_currency) REFERENCES currencies(iso4217);
ALTER TABLE user_devices ADD CONSTRAINT fk_user_devices_user_id FOREIGN KEY (user_id) REFERENCES users(user_id);
ALTER TABLE user_devices ADD CONSTRAINT fk_user_devices_locale FOREIGN KEY (locale) REFERENCES languages(bcp47);
ALTER TABLE user_preferences ADD CONSTRAINT fk_user_preferences_user_id FOREIGN KEY (user_id) REFERENCES users(user_id);
ALTER TABLE user_preferences ADD CONSTRAINT fk_user_preferences_guide_language FOREIGN KEY (guide_language) REFERENCES languages(bcp47);
ALTER TABLE user_preferences ADD CONSTRAINT fk_user_preferences_preferred_currency FOREIGN KEY (preferred_currency) REFERENCES currencies(iso4217);
ALTER TABLE user_preferences ADD CONSTRAINT fk_user_preferences_max_daily_budget_currency FOREIGN KEY (max_daily_budget_currency) REFERENCES currencies(iso4217);
ALTER TABLE itineraries ADD CONSTRAINT fk_itineraries_trip_id FOREIGN KEY (trip_id) REFERENCES trips(trip_id);
ALTER TABLE itineraries ADD CONSTRAINT fk_itineraries_currency FOREIGN KEY (currency) REFERENCES currencies(iso4217);
ALTER TABLE itinerary_items ADD CONSTRAINT fk_itinerary_items_itinerary_id FOREIGN KEY (itinerary_id) REFERENCES itineraries(itinerary_id);
ALTER TABLE itinerary_items ADD CONSTRAINT fk_itinerary_items_currency FOREIGN KEY (currency) REFERENCES currencies(iso4217);

-- indexes
CREATE INDEX idx_categories_parent_category_id ON categories(parent_category_id);
CREATE INDEX idx_countries_default_currency ON countries(default_currency);
CREATE INDEX idx_cities_country_id ON cities(country_id);
CREATE INDEX idx_cities_primary_language ON cities(primary_language);
CREATE INDEX idx_events_festivals_city_id ON events_festivals(city_id);
CREATE INDEX idx_events_festivals_category_id ON events_festivals(category_id);
CREATE INDEX idx_events_festivals_currency ON events_festivals(currency);
CREATE INDEX idx_hotels_city_id ON hotels(city_id);
CREATE INDEX idx_hotels_base_currency ON hotels(base_currency);
CREATE INDEX idx_safety_advisories_city_id ON safety_advisories(city_id);
CREATE INDEX idx_safety_advisories_language ON safety_advisories(language);
CREATE INDEX idx_users_home_city_id ON users(home_city_id);
CREATE INDEX idx_users_home_currency ON users(home_currency);
CREATE INDEX idx_users_locale ON users(locale);
CREATE INDEX idx_weather_daily_city_id ON weather_daily(city_id);
CREATE INDEX idx_activities_poi_city_id ON activities_poi(city_id);
CREATE INDEX idx_activities_poi_category_id ON activities_poi(category_id);
CREATE INDEX idx_activities_poi_currency ON activities_poi(currency);
CREATE INDEX idx_place_kb_city_id ON place_kb(city_id);
CREATE INDEX idx_place_kb_poi_id ON place_kb(poi_id);
CREATE INDEX idx_place_kb_language ON place_kb(language);
CREATE INDEX idx_poi_facts_kb_poi_id ON poi_facts_kb(poi_id);
CREATE INDEX idx_poi_facts_kb_language ON poi_facts_kb(language);
CREATE INDEX idx_poi_media_poi_id ON poi_media(poi_id);
CREATE INDEX idx_trips_owner_user_id ON trips(owner_user_id);
CREATE INDEX idx_trips_origin_city_id ON trips(origin_city_id);
CREATE INDEX idx_trips_destination_city_id ON trips(destination_city_id);
CREATE INDEX idx_trips_home_currency ON trips(home_currency);
CREATE INDEX idx_user_devices_user_id ON user_devices(user_id);
CREATE INDEX idx_user_devices_locale ON user_devices(locale);
CREATE INDEX idx_user_preferences_guide_language ON user_preferences(guide_language);
CREATE INDEX idx_user_preferences_preferred_currency ON user_preferences(preferred_currency);
CREATE INDEX idx_user_preferences_max_daily_budget_currency ON user_preferences(max_daily_budget_currency);
CREATE INDEX idx_itineraries_trip_id ON itineraries(trip_id);
CREATE INDEX idx_itineraries_currency ON itineraries(currency);
CREATE INDEX idx_itinerary_items_itinerary_id ON itinerary_items(itinerary_id);
CREATE INDEX idx_itinerary_items_currency ON itinerary_items(currency);