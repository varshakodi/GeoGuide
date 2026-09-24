import React, { useEffect, useMemo, useRef, useState } from 'react'
import Icon from './Icon.jsx'

const W = 640
const H = 420
const PAD = 42
const BOUNDS = { minLat: 11, maxLat: 21, minLng: 71.5, maxLng: 80 }
const project = ([lat, lng]) => ({
  x: PAD + ((lng - BOUNDS.minLng) / (BOUNDS.maxLng - BOUNDS.minLng)) * (W - PAD * 2),
  y: H - PAD - ((lat - BOUNDS.minLat) / (BOUNDS.maxLat - BOUNDS.minLat)) * (H - PAD * 2)
})

const viewBoxFor = (center, zoom) => {
  const width = W / zoom
  const height = H / zoom
  return `${center.x - width / 2} ${center.y - height / 2} ${width} ${height}`
}

export default function JourneyMap({ waypoints, selectedId, onSelect }) {
  const [viewBox, setViewBox] = useState(`0 0 ${W} ${H}`)
  const animation = useRef(null)
  const points = useMemo(() => waypoints.map(w => ({ ...w, point: project(w.coordinates) })), [waypoints])
  const route = points.map(p => `${p.point.x},${p.point.y}`).join(' ')

  useEffect(() => () => cancelAnimationFrame(animation.current), [])

  const flyTo = (waypoint) => {
    const target = project(waypoint.coordinates)
    const from = viewBox.split(' ').map(Number)
    const width = W / 1.55
    const height = H / 1.55
    const to = viewBoxFor(target, 1.55).split(' ').map(Number)
    const started = performance.now()
    cancelAnimationFrame(animation.current)
    const tick = now => {
      const progress = Math.min(1, (now - started) / 520)
      const eased = 1 - Math.pow(1 - progress, 3)
      setViewBox(from.map((v, i) => v + (to[i] - v) * eased).join(' '))
      if (progress < 1) animation.current = requestAnimationFrame(tick)
    }
    animation.current = requestAnimationFrame(tick)
    onSelect(waypoint.id)
  }

  return (
    <div className="journey-map-wrap">
      <svg className="journey-map" viewBox={viewBox} role="img" aria-label="Journey route map">
        <defs>
          <linearGradient id="journey-map-bg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="var(--journey-map-a)" />
            <stop offset="1" stopColor="var(--journey-map-b)" />
          </linearGradient>
          <filter id="journey-glow"><feGaussianBlur stdDeviation="4" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        </defs>
        <rect width={W} height={H} rx="22" fill="url(#journey-map-bg)" />
        <path className="map-grid-lines" d="M0 120H640M0 240H640M0 360H640M120 0V420M280 0V420M440 0V420" />
        <polyline points={route} fill="none" stroke="var(--journey-route)" strokeWidth="7" opacity=".18" filter="url(#journey-glow)" />
        <polyline points={route} fill="none" stroke="var(--journey-route)" strokeWidth="2.5" strokeDasharray="7 8" />
        {points.map((waypoint, index) => {
          const active = waypoint.id === selectedId
          return (
            <g key={waypoint.id} className={`journey-marker ${active ? 'active' : ''}`} onClick={() => flyTo(waypoint)}
               onMouseEnter={() => onSelect(waypoint.id)} role="button" tabIndex="0"
               onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && flyTo(waypoint)}>
              {active && <circle className="marker-pulse" cx={waypoint.point.x} cy={waypoint.point.y} r="17" />}
              <circle cx={waypoint.point.x} cy={waypoint.point.y} r={active ? 8 : 6} fill="var(--journey-marker)" stroke="var(--journey-marker-ring)" strokeWidth="3" />
              <text x={waypoint.point.x + 12} y={waypoint.point.y - 10} className="marker-label">{String(index + 1).padStart(2, '0')} {waypoint.name}</text>
            </g>
          )
        })}
        <text x="22" y="395" className="map-caption">GEOGUIDE / FIELD NOTES</text>
      </svg>
      <div className="journey-map-controls">
        <span><Icon name="compass" size={15} /> {points.length} stops</span>
        <span>click a marker to fly</span>
      </div>
    </div>
  )
}
