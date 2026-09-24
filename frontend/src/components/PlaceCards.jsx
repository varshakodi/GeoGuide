import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { fallBack, photoFor } from './placePhotos.js'

// Nearby places as photo cards. Clicking one zooms it open: the detail view starts at
// the card's own position and size and grows into a centred panel, then shrinks back
// into the card when closed.

const ZOOM_MS = 320
const label = value => String(value || '').replaceAll('_', ' ')
const money = p => (p.entry_cost === '0.00' ? 'Free' : [p.currency, p.entry_cost].filter(Boolean).join(' '))

function Fact({ name, value }) {
  return <div className="rounded-2xl bg-white/[.06] p-3"><dt className="text-[10px] font-black uppercase tracking-wider text-white/45">{name}</dt><dd className="mt-1 text-sm font-black text-white">{value}</dd></div>
}

function PlaceZoom({ open, onClose }) {
  const { place, rect } = open
  const panel = useRef(null)
  const closeBtn = useRef(null)
  // 'measure' (full size, invisible) -> 'card' (sitting over the card) -> 'open' (animated).
  const [phase, setPhase] = useState('measure')
  const [start, setStart] = useState('scale(.85)')
  useLayoutEffect(() => {
    const el = panel.current
    if (el && rect) {
      const box = el.getBoundingClientRect()
      const dx = rect.left + rect.width / 2 - (box.left + box.width / 2)
      const dy = rect.top + rect.height / 2 - (box.top + box.height / 2)
      setStart(`translate(${dx}px, ${dy}px) scale(${Math.max(rect.width / box.width, 0.2)})`)
    }
    setPhase('card')
  }, [])
  useEffect(() => {
    if (phase !== 'card') return undefined
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setPhase('open')))
    closeBtn.current?.focus()
    return () => cancelAnimationFrame(id)
  }, [phase])

  const close = useCallback(() => { setPhase('closing'); setTimeout(onClose, ZOOM_MS) }, [onClose])
  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') close() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [close])

  const shown = phase === 'open'
  const animate = phase === 'open' || phase === 'closing'
  const panelStyle = phase === 'measure'
    ? { opacity: 0 }
    : { transform: shown ? 'none' : start, opacity: shown ? 1 : 0.4,
        transition: animate ? `transform ${ZOOM_MS}ms cubic-bezier(.2,.9,.25,1.05), opacity ${ZOOM_MS}ms ease` : 'none' }
  const tags = String(place.tags || '').split(',').map(tag => tag.trim()).filter(Boolean)
  return <div className="fixed inset-0 z-[80] grid place-items-center p-4" role="dialog" aria-modal="true" aria-label={place.name}>
    <button type="button" aria-label="Close" onClick={close} className="absolute inset-0 bg-black/70 backdrop-blur-sm" style={{ opacity: shown ? 1 : 0, transition: `opacity ${ZOOM_MS}ms ease` }}/>
    <article ref={panel} data-lenis-prevent className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[2rem] border border-white/15 bg-[#101713] shadow-2xl"
      style={panelStyle}>
      <div className="on-photo relative h-64 sm:h-80">
        <img src={photoFor(place)} onError={e => fallBack(e, place)} alt="" className="absolute inset-0 h-full w-full object-cover"/>
        <span className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent"/>
        <button ref={closeBtn} type="button" onClick={close} className="absolute right-4 top-4 rounded-full border border-white/25 bg-black/50 px-3 py-2 text-xs font-black text-white backdrop-blur hover:border-lime-300">Close</button>
        <div className="absolute bottom-4 left-6 right-6">
          <p className="text-[11px] font-black uppercase tracking-[.2em] text-lime-300">{label(place.poi_category)}</p>
          <h2 className="mt-1 text-3xl font-black tracking-[-.04em] text-white sm:text-4xl">{place.name}</h2>
        </div>
      </div>
      <div className="space-y-5 p-6">
        {place.description && <p className="text-sm leading-7 text-white/80">{place.description}</p>}
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Fact name="Today" value={place.closed_today ? 'Closed today' : 'Open today'}/>
          <Fact name="Hours" value={`${place.opens_at || '—'} – ${place.closes_at || '—'}`}/>
          <Fact name="Entry fee" value={money(place) || '—'}/>
          <Fact name="Visit length" value={`${place.typical_duration_minutes ?? '—'} min`}/>
          <Fact name="Distance" value={`${place.distance_km ?? '—'} km`}/>
          <Fact name="Accessibility" value={place.accessibility || '—'}/>
        </dl>
        {place.address_line && <p className="rounded-2xl bg-white/[.06] p-3 text-sm font-bold text-white/75">{place.address_line}</p>}
        {tags.length > 0 && <div className="flex flex-wrap gap-2">{tags.map(tag => <span key={tag} className="rounded-full border border-white/15 px-3 py-1 text-[11px] font-bold text-white/70">{tag}</span>)}</div>}
      </div>
    </article>
  </div>
}

export default function PlaceCards({ places }) {
  const [open, setOpen] = useState(null)
  return <>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {places.map(place => <button key={place.poi_id} type="button"
        onClick={e => setOpen({ place, rect: e.currentTarget.getBoundingClientRect() })}
        className="group overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/[.04] text-left transition duration-300 hover:-translate-y-1 hover:border-lime-300/60 hover:shadow-xl hover:shadow-black/40 focus:outline-none focus:ring-2 focus:ring-lime-300">
        <div className="on-photo relative h-44 overflow-hidden">
          <img src={photoFor(place)} onError={e => fallBack(e, place)} alt="" loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105"/>
          <span className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"/>
          <span className="absolute left-3 top-3 rounded-full bg-black/50 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-white backdrop-blur">{label(place.poi_category)}</span>
          <span className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${place.closed_today ? 'bg-white/25 text-white backdrop-blur' : 'bg-lime-300 text-black'}`}>{place.closed_today ? 'Closed today' : 'Open today'}</span>
        </div>
        <div className="p-4">
          <h3 className="text-lg font-black leading-tight">{place.name}</h3>
          {place.description && <p className="mt-2 line-clamp-2 text-sm leading-6 text-white/65">{place.description}</p>}
          <p className="mt-3 text-xs font-bold uppercase tracking-wider text-white/50">{place.distance_km} km · {place.typical_duration_minutes} min · {money(place)}</p>
        </div>
      </button>)}
    </div>
    {open && <PlaceZoom open={open} onClose={() => setOpen(null)}/>}
  </>
}
