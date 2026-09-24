export const GEO_ENDPOINTS = Object.freeze({
  // Current FastAPI routes used by this repository.
  backend: Object.freeze({
    context: '/context',
    dates: '/dates',
    briefing: '/briefing',
    nearby: '/nearby',
    now: '/now',
    ask: '/ask',
    askReset: '/ask/reset',
    askSuggestions: '/ask/suggestions',
    askFaqs: '/ask/faqs',
    grounding: '/grounding',
    source: '/source',
    translate: '/translate'
  })
})

// The API runs on port 8000 of whichever host served the page: localhost when run
// locally, the LAN address when the preview is opened from another device.
// Where the API lives, in order:
//   1. ?api=<url> in the page link, so a new tunnel address needs no rebuild. Only tunnel,
//      Railway, Render and localhost addresses are accepted, so a crafted link can't point
//      the app at an arbitrary server.
//   2. VITE_API, set when a deployed build is made (e.g. on Vercel).
//   3. Port 8000 on whichever host served the page (local runs and LAN previews).
const TRUSTED_API = /^(https:\/\/([a-z0-9-]+\.)+(trycloudflare\.com|railway\.app|onrender\.com)|http:\/\/(localhost|127\.0\.0\.1)(:\d+)?)$/i
const clean = url => String(url || '').trim().replace(/\/+$/, '')
function apiBase() {
  const fromLink = clean(new URLSearchParams(window.location.search).get('api'))
  if (fromLink && TRUSTED_API.test(fromLink)) return fromLink
  return clean(import.meta.env.VITE_API || `http://${window.location.hostname}:8000`)
}
export const API_BASE = apiBase()
