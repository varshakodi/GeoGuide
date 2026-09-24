import React from 'react'

// One icon per weather_daily.condition value in the data: clear, partly_cloudy, cloudy,
// haze, light_rain, heavy_rain. Unknown conditions fall back to the plain cloud.

const SUN = <><circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4"/></>
const CLOUD = <path d="M7 18h10.5a4 4 0 0 0 .6-7.95A5.5 5.5 0 0 0 7.5 9.2 4.4 4.4 0 0 0 7 18Z"/>

const SHAPES = {
  clear: SUN,
  partly_cloudy: <><path d="M8.5 3.5v1.3M3.9 5.4l.9.9M2.5 10h1.3M13.1 5.4l-.9.9"/><path d="M5.4 12.3A3.6 3.6 0 1 1 12 8.6"/><path d="M9 20h8.5a3.5 3.5 0 0 0 .5-6.96 4.8 4.8 0 0 0-9.2-.9A3.9 3.9 0 0 0 9 20Z"/></>,
  cloudy: CLOUD,
  haze: <><circle cx="12" cy="9" r="3.5"/><path d="M12 2.5v1.5M6.3 4.8l1 1M17.7 4.8l-1 1M4 16h16M6 19.5h12M8 12.8H4.5M19.5 12.8H16"/></>,
  light_rain: <><path d="M7 15h10.5a4 4 0 0 0 .6-7.95A5.5 5.5 0 0 0 7.5 6.2 4.4 4.4 0 0 0 7 15Z"/><path d="M9 18l-.8 2M13 18l-.8 2M17 18l-.8 2"/></>,
  heavy_rain: <><path d="M7 13.5h10.5a4 4 0 0 0 .6-7.95A5.5 5.5 0 0 0 7.5 4.7 4.4 4.4 0 0 0 7 13.5Z"/><path d="M8 16l-1.5 4M12 16l-1.5 4M16 16l-1.5 4"/></>,
}

export const weatherLabel = condition => String(condition || '').replaceAll('_', ' ')

export default function WeatherIcon({ condition, className = 'h-5 w-5' }) {
  return <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.7"
    strokeLinecap="round" strokeLinejoin="round" role="img" aria-label={weatherLabel(condition) || 'weather'}>
    {SHAPES[condition] || CLOUD}
  </svg>
}
