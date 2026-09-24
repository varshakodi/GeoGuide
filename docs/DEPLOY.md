# Deploying GeoGuide

Two services on [Render](https://render.com), both defined in [`render.yaml`](../render.yaml):

| Service | What it is | Plan |
|---|---|---|
| `geoguide-api` | The FastAPI backend, built from the [`Dockerfile`](../Dockerfile) | **Standard (2 GB)**: the API uses about 860 MB once the search model loads, so 512 MB plans (Free, Starter) run out of memory |
| `geoguide-web` | The React app, built with Vite and served as a static site | Free |

The Docker image installs CPU-only PyTorch and builds the search index at build time, so a new
container starts without downloading anything. API keys are never in the repo or the image; they
are environment variables set in the Render dashboard, and only the API sees them.

Standard is billed per second, so keeping it for the demo days costs a dollar or two. Suspend or
delete both services afterwards.

## 1. Create the services (the person deploying)

1. Sign in to Render and connect GitHub. The repo lives in the `kognivera-org` organisation, so an
   org owner may need to approve Render's GitHub app for it.
2. **New → Blueprint**, pick `kognivera-org/kv-hack2026-vvinners`, branch `master`. Render reads
   `render.yaml` and shows both services.
3. It asks for the values marked `sync: false`. Leave the keys and URLs empty for now and create
   the Blueprint. The first API build takes 5–10 minutes (PyTorch and the index); the web app builds
   in about a minute.
4. Note both URLs from the dashboard, for example `https://geoguide-api.onrender.com` and
   `https://geoguide-web.onrender.com` (Render adds a suffix if a name is taken).

## 2. Add the keys (the key owner)

Invite the key owner to the Render workspace (**Workspace settings → Members**). They open
**geoguide-api → Environment** and set:

| Variable | Value |
|---|---|
| `GEMINI_API_KEY` | the Gemini key |
| `SARVAM_API_KEY` | the Sarvam key (full-page Hindi and Kannada) |

**Save** redeploys the API. Keys go straight into the dashboard, never into a chat, the repo or a
`VITE_` variable (those are built into the public web page).

## 3. Connect the two services

| Service → Environment | Variable | Value |
|---|---|---|
| `geoguide-api` | `ALLOWED_ORIGINS` | the web app's URL, e.g. `https://geoguide-web.onrender.com` |
| `geoguide-web` | `VITE_API` | the API's URL, e.g. `https://geoguide-api.onrender.com` |

`VITE_API` is baked in when the web app builds, so after setting it run **Manual Deploy → Deploy
latest commit** on `geoguide-web`.

## 4. Check it

1. Open `<API URL>/health`. Expect `"status": "ok"`, the index at `place_kb: 3173` and
   `poi_facts_kb: 900`, `"provider": "gemini"` and `"gemini_keys": 1`.
2. Open the web app and follow the demo path in [DEMO.md](DEMO.md): location, briefing, date shift,
   Nearby, Ask, a language switch.
3. Open it on a phone too. The location prompt only appears on HTTPS, which Render provides.

## Before the demo

- Open the web app 10 minutes early and click through the demo cities and dates once. Generated
  briefings and translations are cached until the API restarts, so the stage path is instant.
- Keep grounding **on**. The Grounding switch is shared by everyone using the site, so share the
  URL only with the judges.
- Keep the local setup ready as a fallback (see the README's "Run it locally").

## When something is wrong

| Symptom | Cause and fix |
|---|---|
| The API restarts or logs "out of memory" | The plan is below 2 GB. Set `geoguide-api` to Standard. |
| "The backend is unavailable" on the web app | `VITE_API` is missing or wrong, or the web app wasn't redeployed after setting it. |
| Browser console shows a CORS error | `ALLOWED_ORIGINS` doesn't match the web app's URL exactly (scheme included, e.g. `https://`). |
| Briefings show the amber "AI model is unreachable" banner | `GEMINI_API_KEY` is missing or invalid (check `/health`), or Gemini is overloaded. Answers stay grounded, quoted from the sources, until it recovers. |
| Hindi or Kannada only partly translates | `SARVAM_API_KEY` is missing on `geoguide-api`. |

## Afterwards

Suspend or delete both services, and create new Gemini and Sarvam keys, since the demo URL was
shared.
