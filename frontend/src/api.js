// The browser preview can be opened as localhost or through the LAN preview host.
// In this environment the API is exposed on the LAN host, so localhost pages use it too.
import { API_BASE, GEO_ENDPOINTS } from './config/geoEndpoints.js'

const BASE = API_BASE

// Offline cache. Every successful GET is saved in localStorage under its path and query;
// when the network fails, or the API answers with a server error, the saved copy is
// returned instead and the app is told it is offline (see `offline`). Nothing is ever
// served from the cache while the API is reachable.
const CACHE = 'gg:v1:'
const listeners = new Set()
export const offline = {
  at: null,                                  // timestamp of the saved data being shown, or null when live
  subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn) },
}
function setOffline(at) {
  if (offline.at === at) return
  offline.at = at
  listeners.forEach(fn => fn(at))
}
const readCache = key => { try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : null } catch { return null } }
const writeCache = (key, data) => { try { localStorage.setItem(key, JSON.stringify({ at: Date.now(), data })) } catch { /* storage full or blocked: live data still works */ } }
const fromCache = (key, error) => {
  const saved = readCache(key)
  if (!saved) throw error
  setOffline(saved.at)
  return saved.data
}

async function get(path, params = {}, { cache = true } = {}) {
  const url = new URL(BASE + path)
  Object.entries(params).forEach(([k, v]) => {
    if (v !== null && v !== undefined && v !== '') url.searchParams.set(k, v)
  })
  const key = CACHE + url.pathname + url.search
  let r
  try {
    r = await fetch(url)
  } catch (error) {                          // no network, or the tunnel is down
    if (cache) return fromCache(key, error)
    throw error
  }
  if (!r.ok) {
    const error = new Error(`${path} ${r.status}`)
    if (cache && r.status >= 500) return fromCache(key, error)
    throw error
  }
  const data = await r.json()
  if (cache) { writeCache(key, data); setOffline(null) }
  return data
}

// Saves the demo set for offline use: place, date, nearby places and hotels, quick answers
// and today's briefing for each preset city. Sequential and quiet, at most once every
// 30 minutes, so it never competes with what the user is doing.
export async function seedOffline(presets) {
  const stamp = CACHE + 'seeded-at'
  const last = Number(readCache(stamp)?.data || 0)
  if (offline.at || Date.now() - last < 30 * 60 * 1000) return
  writeCache(stamp, Date.now())
  for (const p of presets) {
    try {
      const ctx = await context(p.lat, p.lng)
      await nearby(ctx.city.city_id, p.lat, p.lng, ctx.date)
      await dates(ctx.city.city_id)
      await askFaqs(ctx.city.city_id, 'en-IN')
      await briefing(ctx.city.city_id, 'en-IN', ctx.date)
    } catch { /* already offline, or one city failed: keep going */ }
  }
}

export const health = () => get('/health', {}, { cache: false })
export const context = (lat, lng, for_date, at) => get(GEO_ENDPOINTS.backend.context, { lat, lng, for_date, at })
export const dates = (city_id) => get(GEO_ENDPOINTS.backend.dates, { city_id })
export const briefing = (city_id, lang, for_date) => get(GEO_ENDPOINTS.backend.briefing, { city_id, lang, for_date })
export const nearby = (city_id, lat, lng, for_date) => get(GEO_ENDPOINTS.backend.nearby, { city_id, lat, lng, for_date })
export const now = (city_id, lat, lng, at, for_date, budget, window) =>
  get(GEO_ENDPOINTS.backend.now, { city_id, lat, lng, at, for_date, budget, window })
export const setGrounding = (enabled) => get(GEO_ENDPOINTS.backend.grounding, { enabled }, { cache: false })
export const source = (label, city_id, for_date) => get(GEO_ENDPOINTS.backend.source, { label, city_id, for_date })
export const askSuggestions = (city_id, limit = 4) => get(GEO_ENDPOINTS.backend.askSuggestions, { city_id, limit })
export const askFaqs = (city_id, lang, limit = 6) => get(GEO_ENDPOINTS.backend.askFaqs, { city_id, lang, limit })

export async function resetSession(session_id) {
  const r = await fetch(BASE + GEO_ENDPOINTS.backend.askReset, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id })
  })
  if (!r.ok) throw new Error('reset ' + r.status)
  return r.json()
}

export async function ask(question, city_id, lang, session_id) {
  const r = await fetch(BASE + GEO_ENDPOINTS.backend.ask, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, city_id, lang, session_id })
  })
  if (!r.ok) throw new Error('ask ' + r.status)
  return r.json()
}

export async function translateTexts(texts, lang) {
  const r = await fetch(BASE + GEO_ENDPOINTS.backend.translate, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ texts, lang })
  })
  if (!r.ok) throw new Error(`translate ${r.status}`)
  return r.json()
}
