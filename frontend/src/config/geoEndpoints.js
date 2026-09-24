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
    translate: '/translate'
  })
})

// The API runs on port 8000 of whichever host served the page: localhost when run
// locally, the LAN address when the preview is opened from another device.
export const API_BASE = import.meta.env.VITE_API || `http://${window.location.hostname}:8000`
