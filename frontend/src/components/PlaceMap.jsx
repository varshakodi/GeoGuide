import React, { useMemo, useState } from 'react'
import { t } from '../i18n.js'

const W = 660, H = 380, PAD = 34
const mins = s => Number(String(s).slice(0, 2)) * 60 + Number(String(s).slice(3, 5))

export const isOpenAt = (p, hhmm) => {
  if (p.closed_today || !p.opens_at) return false
  const now = mins(hhmm)
  return mins(p.opens_at) <= now && now < (p.closes_at ? mins(p.closes_at) : 1440)
}

/** Places drawn from their own lat/lng — no map tiles, nothing fetched.
    Pins follow the clock: open places stay moss, closed ones fade out, so dragging
    the time visibly shuts the city down. */
export default function PlaceMap({ lang, pois = [], hotels = [], centre, at = '15:00', onSelect, selected, numberedIds = [], routeTo }) {
  const [hover, setHover] = useState(null)
  const pts = useMemo(() => {
    const all = [...pois.map(p => ({ ...p, kind: 'poi' })), ...hotels.map(h => ({ ...h, kind: 'hotel' }))]
      .filter(p => typeof p.lat === 'number' && typeof p.lng === 'number')
    if (!all.length || !centre) return { items: [], scale: 1 }
    // Equirectangular around the centre: good enough at city scale, and offline.
    const kx = 111.32 * Math.cos(centre.lat * Math.PI / 180), ky = 110.57
    const rel = all.map(p => ({ ...p, dx: (p.lng - centre.lng) * kx, dy: -(p.lat - centre.lat) * ky }))
    const span = Math.max(2, ...rel.map(p => Math.max(Math.abs(p.dx), Math.abs(p.dy)))) * 1.15
    const scale = (Math.min(W, H) / 2 - PAD) / span
    return {
      items: rel.map(p => ({ ...p, x: W / 2 + p.dx * scale, y: H / 2 + p.dy * scale })),
      scale, span
    }
  }, [pois, hotels, centre])

  if (!pts.items.length) return null
  const rings = [2, 5, 10].filter(km => km * pts.scale < Math.min(W, H) / 2 - 10)
  const active = hover || pts.items.find(p => (p.poi_id || p.hotel_id) === selected)
  const routePoint = routeTo && pts.items.find(p => (p.poi_id || p.hotel_id) === (routeTo.poi_id || routeTo.id))

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" className="map map-stage"
           aria-label={`Places near ${centre?.name || 'you'}`}>
        <defs><pattern id="map-grid" width="32" height="32" patternUnits="userSpaceOnUse"><path d="M32 0H0V32" fill="none" stroke="rgba(198,255,0,.08)" strokeWidth="1" /></pattern></defs>
        <rect x="0" y="0" width={W} height={H} rx="16" fill="#101913" stroke="rgba(198,255,0,.20)" />
        <rect x="0" y="0" width={W} height={H} rx="16" fill="url(#map-grid)" />
        {rings.map(km => (
          <g key={km}>
            <circle cx={W / 2} cy={H / 2} r={km * pts.scale} fill="none"
                    stroke="rgba(198,255,0,.26)" strokeDasharray="4 6" />
            <text x={W / 2 + 4} y={H / 2 - km * pts.scale + 13} fontSize="11" fill="rgba(255,255,255,.62)">{km} km</text>
          </g>
        ))}
        {routePoint && <line x1={W / 2} y1={H / 2} x2={routePoint.x} y2={routePoint.y} stroke="#ff6b57" strokeWidth="2.5" strokeDasharray="8 7" opacity=".95" />}
        {pts.items.map(p => {
          const id = p.poi_id || p.hotel_id
          const open = p.kind === 'poi' ? isOpenAt(p, at) : true
          const on = id === selected || id === hover?.poi_id || id === hover?.hotel_id
          const fill = p.kind === 'hotel' ? '#e09a78' : (open ? '#c6ff00' : 'rgba(255,255,255,.24)')
          const number = numberedIds.indexOf(id) + 1
          return (
            <g key={id} className="pin" onClick={() => onSelect?.(id)}
               role={onSelect ? 'button' : undefined} tabIndex={onSelect ? 0 : undefined} aria-label={p.name}
               onKeyDown={e => { if (onSelect && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onSelect(id) } }}
               onMouseEnter={() => setHover(p)} onMouseLeave={() => setHover(null)}
               onFocus={() => setHover(p)} onBlur={() => setHover(null)}
               style={{ cursor: onSelect ? 'pointer' : 'default', outline: 'none' }}>
              {/* A generous invisible hit area: the drawn pin is small once the map is scaled down. */}
              <circle cx={p.x} cy={p.y} r="26" fill="transparent" />
              {on && <circle cx={p.x} cy={p.y} r="22" fill="none" stroke="#c6ff00" strokeWidth="2" opacity=".6" />}
              {p.kind === 'hotel'
                ? <rect x={p.x - 9} y={p.y - 9} width="18" height="18" rx="3" fill={fill}
                        stroke="#fff" strokeWidth={on ? 3 : 2} />
                : <><circle cx={p.x} cy={p.y} r={on ? 15 : 12} fill={fill} stroke="#080b0a" strokeWidth={on ? 3 : 2.5} />{number > 0 && <text x={p.x} y={p.y + 4.5} textAnchor="middle" fontSize="13" fontWeight="800" fill="#080b0a" pointerEvents="none">{number}</text>}</>}
            </g>
          )
        })}
        <circle className="map-user-pulse" cx={W / 2} cy={H / 2} r="15" fill="none" stroke="#c6ff00" strokeWidth="2" opacity=".35" />
        <circle cx={W / 2} cy={H / 2} r="8" fill="#c6ff00" stroke="#080b0a" strokeWidth="3" />
        <line x1={PAD} y1={H - 22} x2={PAD + 2 * pts.scale} y2={H - 22} stroke="rgba(255,255,255,.62)" strokeWidth="2" />
        <text x={PAD} y={H - 28} fontSize="11" fill="rgba(255,255,255,.72)">2 km</text>
        {active && (
          <g transform={`translate(${Math.min(Math.max(active.x, 90), W - 90)}, ${active.y > 60 ? active.y - 44 : active.y + 26})`}>
            <rect x="-88" y="-20" width="176" height="36" rx="9" fill="rgba(8,11,10,.94)" />
            <text x="0" y="-5" textAnchor="middle" fontSize="12.5" fill="#fff">
              {String(active.name).slice(0, 24)}
            </text>
            <text x="0" y="9" textAnchor="middle" fontSize="11" fill="rgba(255,255,255,.75)">
              {active.kind === 'hotel'
                ? `${active.star_rating}★ · ${active.distance_to_centre_km} km`
                : `${active.distance_km} km · ${isOpenAt(active, at) ? `open till ${active.closes_at || '—'}` : t(lang, 'closed')}`}
            </text>
          </g>
        )}
      </svg>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-2 text-xs font-semibold text-white/70">
        <span className="inline-flex items-center gap-1.5"><i className="h-3 w-3 rounded-full bg-[#c6ff00]" />open at {at}</span>
        <span className="inline-flex items-center gap-1.5"><i className="h-3 w-3 rounded-full bg-white/25" />closed</span>
        {hotels.length > 0 && <span className="inline-flex items-center gap-1.5"><i className="h-3 w-3 rounded-sm bg-[#e09a78]" />hotel</span>}
      </div>
    </div>
  )
}
