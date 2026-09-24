// The browser preview can be opened as localhost or through the LAN preview host.
// In this environment the API is exposed on the LAN host, so localhost pages use it too.
import { API_BASE, GEO_ENDPOINTS } from './config/geoEndpoints.js'

const BASE = API_BASE

async function get(path, params = {}) {
  const url = new URL(BASE + path)
  Object.entries(params).forEach(([k, v]) => {
    if (v !== null && v !== undefined && v !== '') url.searchParams.set(k, v)
  })
  const r = await fetch(url)
  if (!r.ok) throw new Error(`${path} ${r.status}`)
  return r.json()
}

export const health = () => get('/health')
export const context = (lat, lng, for_date, at) => get(GEO_ENDPOINTS.backend.context, { lat, lng, for_date, at })
export const dates = (city_id) => get(GEO_ENDPOINTS.backend.dates, { city_id })
export const briefing = (city_id, lang, for_date) => get(GEO_ENDPOINTS.backend.briefing, { city_id, lang, for_date })
export const nearby = (city_id, lat, lng, for_date) => get(GEO_ENDPOINTS.backend.nearby, { city_id, lat, lng, for_date })
export const now = (city_id, lat, lng, at, for_date, budget, window) =>
  get(GEO_ENDPOINTS.backend.now, { city_id, lat, lng, at, for_date, budget, window })
export const setGrounding = (enabled) => get(GEO_ENDPOINTS.backend.grounding, { enabled })
export const askSuggestions = (city_id, limit = 4) => get(GEO_ENDPOINTS.backend.askSuggestions, { city_id, limit })
export const askFaqs = (city_id, lang, limit = 4) => get(GEO_ENDPOINTS.backend.askFaqs, { city_id, lang, limit })

export async function ask(question, city_id, lang, session_id) {
  const r = await fetch(BASE + GEO_ENDPOINTS.backend.ask, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, city_id, lang, session_id })
  })
  if (!r.ok) throw new Error('ask ' + r.status)
  return r.json()
}
