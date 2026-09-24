export const GEO_ENDPOINTS = Object.freeze({
  weather: '/api/weather',
  briefing: '/api/briefing',
  nearbyPlaces: '/api/places/nearby',
  reverseGeocoding: '/api/geocode/reverse',
  // Current FastAPI routes used by this repository.
  backend: Object.freeze({
    context: '/context',
    dates: '/dates',
    briefing: '/briefing',
    nearby: '/nearby',
    now: '/now',
    ask: '/ask',
    askSuggestions: '/ask/suggestions',
    askFaqs: '/ask/faqs',
    grounding: '/grounding'
  })
})

export const API_BASE = import.meta.env.VITE_API || `http://${
  ['localhost', '127.0.0.1'].includes(window.location.hostname) ? '130.1.44.145' : window.location.hostname
}:8000`
