const BASE = import.meta.env.VITE_API || 'http://localhost:8000'

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
export const context = (lat, lng, for_date) => get('/context', { lat, lng, for_date })
export const dates = (city_id) => get('/dates', { city_id })
export const briefing = (city_id, lang, for_date) => get('/briefing', { city_id, lang, for_date })
export const nearby = (city_id, lat, lng, for_date) => get('/nearby', { city_id, lat, lng, for_date })
export const now = (city_id, lat, lng, at, for_date, budget) =>
  get('/now', { city_id, lat, lng, at, for_date, budget })
export const setGrounding = (enabled) => get('/grounding', { enabled })

export async function ask(question, city_id, lang, session_id) {
  const r = await fetch(BASE + '/ask', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question, city_id, lang, session_id })
  })
  if (!r.ok) throw new Error('ask ' + r.status)
  return r.json()
}
