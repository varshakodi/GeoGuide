import React, { useCallback, useEffect, useRef, useState } from 'react'
import { fallBack, photoFor } from './placePhotos.js'

// Nearby places as a shuffling deck of photo cards. The top card flies off and slides
// back in at the bottom every few seconds; hovering, focusing or dragging takes over.
// Photos match the place type in the name (public/places/names/), else its category
// (public/places/); all are credited in the README.

const INTERVAL_MS = 3400
const FLY_MS = 450
const label = value => String(value || '').replaceAll('_', ' ')

function cardStyle(depth, leaving) {
  if (leaving) return { transform: 'translate(115%, -4%) rotate(14deg)', opacity: 0, zIndex: 50 }
  const tilt = depth === 0 ? 0 : (depth % 2 ? -1 : 1) * (2 + depth)
  return {
    transform: `translateY(${depth * 12}px) scale(${1 - depth * 0.05}) rotate(${tilt}deg)`,
    opacity: depth > 3 ? 0 : 1 - depth * 0.12,
    zIndex: 40 - depth,
  }
}

export default function PlaceDeck({ places, isOpen, onOpen }) {
  const [order, setOrder] = useState(() => places.map((_, i) => i))
  const [leaving, setLeaving] = useState(null)
  const [paused, setPaused] = useState(false)
  const drag = useRef(null)
  const reduceMotion = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

  useEffect(() => { setOrder(places.map((_, i) => i)); setLeaving(null) }, [places])

  const next = useCallback(() => {
    if (leaving !== null || order.length < 2) return
    setLeaving(order[0])
    setTimeout(() => { setOrder(o => [...o.slice(1), o[0]]); setLeaving(null) }, FLY_MS)
  }, [leaving, order])
  const prev = () => { if (leaving === null) setOrder(o => [o[o.length - 1], ...o.slice(0, -1)]) }
  const jumpTo = index => { if (leaving === null) setOrder(o => [...o.slice(o.indexOf(index)), ...o.slice(0, o.indexOf(index))]) }

  useEffect(() => {
    if (paused || reduceMotion || places.length < 2) return undefined
    const timer = setInterval(next, INTERVAL_MS)
    return () => clearInterval(timer)
  }, [paused, reduceMotion, places.length, next])

  if (!places.length) return null
  const top = order[0]
  return <div onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}>
    <div className="relative mx-auto h-[330px] w-full max-w-[340px]" role="region" aria-roledescription="carousel" aria-label="Nearby places">
      {order.map((index, depth) => {
        const place = places[index]
        const open = isOpen(place)
        const isTop = depth === 0 && leaving === null
        return <button key={place.poi_id} type="button" tabIndex={isTop ? 0 : -1} aria-hidden={!isTop}
          aria-label={`${place.name}, ${label(place.poi_category)}, ${place.distance_km} km, ${open ? 'open' : 'closed'}. Show details`}
          onClick={() => { if (isTop && !drag.current?.moved) onOpen(place) }}
          onPointerDown={e => { if (isTop) drag.current = { x: e.clientX, moved: false } }}
          onPointerMove={e => { if (drag.current && Math.abs(e.clientX - drag.current.x) > 8) drag.current.moved = true }}
          onPointerUp={e => {
            // Swipe left for the next card, right for the previous; a drag is never also a tap.
            const d = drag.current
            if (!d) return
            const dx = e.clientX - d.x
            if (dx < -50) next(); else if (dx > 50) prev()
            setTimeout(() => { drag.current = null }, 0)
          }}
          style={{ ...cardStyle(depth, leaving === index), transition: `transform ${FLY_MS + 100}ms cubic-bezier(.2,.8,.2,1), opacity ${FLY_MS}ms ease` }}
          className="on-photo absolute inset-x-0 top-0 h-[290px] overflow-hidden rounded-[1.75rem] border border-white/15 bg-[#121815] text-left shadow-2xl shadow-black/50 focus:outline-none focus:ring-2 focus:ring-lime-300">
          <img src={photoFor(place)} onError={e => fallBack(e, place)} alt="" draggable="false" className="absolute inset-0 h-full w-full object-cover"/>
          <span className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/10"/>
          <span className="absolute left-4 right-4 top-4 flex items-center justify-between">
            <span className="rounded-full bg-black/45 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-white backdrop-blur">{label(place.poi_category)}</span>
            <span className={`rounded-full px-3 py-1 text-[11px] font-black ${open ? 'bg-lime-300 text-black' : 'bg-white/20 text-white backdrop-blur'}`}>{open ? 'Open' : 'Closed'}</span>
          </span>
          <span className="absolute bottom-4 left-4 right-4">
            <span className="block text-2xl font-black leading-tight tracking-[-.03em] text-white">{place.name}</span>
            <span className="mt-1 block text-sm font-bold text-white/75">{place.distance_km} km away{place.opens_at ? ` · ${place.opens_at}–${place.closes_at || 'late'}` : ''}</span>
          </span>
        </button>
      })}
    </div>
    <div className="mt-2 flex items-center justify-between">
      <button type="button" onClick={prev} aria-label="Previous place" className="grid h-9 w-9 place-items-center rounded-full border border-white/20 bg-black/25 text-white hover:border-lime-300">←</button>
      <div className="flex gap-1.5">{places.map((place, i) => <button key={place.poi_id} type="button" onClick={() => jumpTo(i)} aria-label={`Show ${place.name}`} aria-current={i === top} className={`h-2 rounded-full transition-all ${i === top ? 'w-6 bg-lime-300' : 'w-2 bg-white/35 hover:bg-white/60'}`}/>)}</div>
      <button type="button" onClick={next} aria-label="Next place" className="grid h-9 w-9 place-items-center rounded-full border border-white/20 bg-black/25 text-white hover:border-lime-300">→</button>
    </div>
  </div>
}
