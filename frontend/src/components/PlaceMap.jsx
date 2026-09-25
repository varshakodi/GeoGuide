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
    Quiet by default: places are muted grey (closed ones fainter, so dragging the time
    visibly shuts the city down), the numbered picks are dark green, and only the
    selected place glows emerald, joined to you by a faint dashed line. */
const EMERALD = '#34d399', PICK_FILL = '#022c22', PICK_STROKE = '#065f46', GREY = '#525252' 
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
        <defs>
          <pattern id="map-grid" width="32" height="32" patternUnits="userSpaceOnUse"><path d="M32 0H0V32" fill="none" stroke="rgba(255,255,255,.04)" strokeWidth="1" /></pattern>
          <filter id="pin-glow" x="-100%" y="-100%" width="300%" height="300%"><feDropShadow dx="0" dy="0" stdDeviation="5" floodColor={EMERALD} floodOpacity=".45" /></filter>
        </defs>
        <rect x="0" y="0" width={W} height={H} rx="16" fill="#0d1411" stroke="rgba(52,211,153,.14)" />
        <rect x="0" y="0" width={W} height={H} rx="16" fill="url(#map-grid)" />
        {rings.map(km => (
          <g key={km}>
            <circle cx={W / 2} cy={H / 2} r={km * pts.scale} fill="none"
                    stroke="rgba(255,255,255,.10)" strokeDasharray="4 6" />
            <text x={W / 2 + 4} y={H / 2 - km * pts.scale + 13} fontSize="11" fill="rgba(255,255,255,.45)">{km} km</text>
          </g>
        ))}
        {routePoint && <line x1={W / 2} y1={H / 2} x2={routePoint.x} y2={routePoint.y} stroke="#10b981" strokeOpacity=".5" strokeWidth="2" strokeDasharray="6 6" />}
        {pts.items.map(p => {
          const id = p.poi_id || p.hotel_id
          const open = p.kind === 'poi' ? isOpenAt(p, at) : true
          const on = id === selected || id === hover?.poi_id || id === hover?.hotel_id
          const number = numberedIds.indexOf(id) + 1
          const chosen = id === selected
          const fill = p.kind === 'hotel' ? '#e09a78' : chosen ? EMERALD : number > 0 ? PICK_FILL : GREY
          return (
            <g key={id} className="pin" onClick={() => onSelect?.(id)}
               role={onSelect ? 'button' : undefined} tabIndex={onSelect ? 0 : undefined} aria-label={p.name}
               onKeyDown={e => { if (onSelect && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onSelect(id) } }}
               onMouseEnter={() => setHover(p)} onMouseLeave={() => setHover(null)}
               onFocus={() => setHover(p)} onBlur={() => setHover(null)}
               style={{ cursor: onSelect ? 'pointer' : 'default', outline: 'none' }}>
              {/* A generous invisible hit area: the drawn pin is small once the map is scaled down. */}
              <circle cx={p.x} cy={p.y} r="26" fill="transparent" />
              {on && !chosen && <circle cx={p.x} cy={p.y} r="19" fill="none" stroke={EMERALD} strokeWidth="1.5" opacity=".35" />}
              {p.kind === 'hotel'
                ? <rect x={p.x - 9} y={p.y - 9} width="18" height="18" rx="3" fill={fill}
                        stroke="#fff" strokeWidth={on ? 3 : 2} />
                : <><circle cx={p.x} cy={p.y} r={chosen ? 14 : number > 0 ? 12 : 8} fill={fill} opacity={open || number > 0 ? 1 : 0.4}
                          stroke={chosen ? '#064e3b' : number > 0 ? PICK_STROKE : '#0d1411'} strokeWidth={number > 0 || chosen ? 1.5 : 2}
                          filter={chosen ? 'url(#pin-glow)' : undefined} />{number > 0 && <text x={p.x} y={p.y + 4.5} textAnchor="middle" fontSize="12.5" fontWeight="800" fill={chosen ? '#022c22' : EMERALD} pointerEvents="none">{number}</text>}</>}
            </g>
          )
        })}
        <circle className="map-user-pulse" cx={W / 2} cy={H / 2} r="15" fill="none" stroke={EMERALD} strokeWidth="1.5" opacity=".35" />
        <circle cx={W / 2} cy={H / 2} r="6.5" fill="#e5e7eb" stroke={EMERALD} strokeWidth="2.5" />
        <line x1={PAD} y1={H - 22} x2={PAD + 2 * pts.scale} y2={H - 22} stroke="rgba(255,255,255,.4)" strokeWidth="2" />
        <text x={PAD} y={H - 28} fontSize="11" fill="rgba(255,255,255,.55)">2 km</text>
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
        <span className="inline-flex items-center gap-1.5"><i className="h-3 w-3 rounded-full bg-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.4)]" />selected</span>
        {numberedIds.length > 0 && <span className="inline-flex items-center gap-1.5"><i className="h-3 w-3 rounded-full border border-emerald-800 bg-emerald-950" />picks</span>}
        <span className="inline-flex items-center gap-1.5"><i className="h-3 w-3 rounded-full bg-neutral-600" />open at {at}</span>
        <span className="inline-flex items-center gap-1.5"><i className="h-3 w-3 rounded-full bg-neutral-600 opacity-40" />closed</span>
        <span className="inline-flex items-center gap-1.5"><i className="h-3 w-3 rounded-full border-2 border-emerald-400 bg-neutral-200" />you</span>
        {hotels.length > 0 && <span className="inline-flex items-center gap-1.5"><i className="h-3 w-3 rounded-sm bg-[#e09a78]" />hotel</span>}
      </div>
    </div>
  )
}
