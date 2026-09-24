import React, { useEffect, useMemo, useRef } from 'react'

const iso = date => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
const month = date => date.toLocaleDateString('en-IN', { month: 'short' })
const weekday = date => date.toLocaleDateString('en-IN', { weekday: 'short' })

export default function DateScrubber({ date, range, events = [], onChange }) {
  const trackRef = useRef(null)
  const days = useMemo(() => {
    if (!range?.min || !range?.max) return []
    const output = []
    for (let current = new Date(`${range.min}T00:00:00`); current <= new Date(`${range.max}T00:00:00`); current.setDate(current.getDate() + 1)) {
      output.push(new Date(current))
    }
    return output
  }, [range])

  const eventDays = useMemo(() => {
    const marked = new Set()
    events.forEach(event => {
      if (!event.start_date) return
      const start = new Date(`${event.start_date}T00:00:00`)
      const end = new Date(`${event.end_date || event.start_date}T00:00:00`)
      for (let current = new Date(start); current <= end; current.setDate(current.getDate() + 1)) marked.add(iso(current))
    })
    return marked
  }, [events])

  useEffect(() => {
    trackRef.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' })
  }, [date, days.length])

  if (!days.length) return null
  const activeIndex = Math.max(0, days.findIndex(day => iso(day) === date))
  const shift = amount => { const next = days[activeIndex + amount]; if (next) onChange(iso(next)) }

  return <section aria-label="Travel through time" className="overflow-hidden rounded-3xl border border-white/10 bg-[#111813] p-4 sm:p-5">
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[.25em] text-lime-300">Time travel</p>
        <p className="mt-2 text-xl font-black">Move through your trip.</p>
        <p className="mt-1 text-xs font-bold text-white/50">{days.length} days in the GeoGuide dataset · {events.length ? `${events.length} event${events.length > 1 ? 's' : ''} flagged` : 'event days appear in coral'}</p>
      </div>
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => shift(-1)} disabled={activeIndex === 0} aria-label="Previous day" className="grid h-9 w-9 place-items-center rounded-full border border-white/15 text-lg font-black text-white/70 transition hover:border-lime-300 hover:text-white disabled:opacity-25">←</button>
        <label className="relative"><span className="sr-only">Choose date</span><input type="date" value={date} min={range.min} max={range.max} onChange={event => onChange(event.target.value)} className="rounded-full border border-white/15 bg-white/[.06] px-3 py-2 text-xs font-black text-white outline-none transition focus:border-lime-300"/></label>
        <button type="button" onClick={() => shift(1)} disabled={activeIndex === days.length - 1} aria-label="Next day" className="grid h-9 w-9 place-items-center rounded-full border border-white/15 text-lg font-black text-white/70 transition hover:border-lime-300 hover:text-white disabled:opacity-25">→</button>
      </div>
    </div>

    <div className="relative mt-6">
      <div aria-hidden="true" className="absolute left-5 right-5 top-[42px] h-px bg-gradient-to-r from-lime-300/10 via-lime-300/50 to-lime-300/10"/>
      <div ref={trackRef} role="listbox" aria-label="Available dates" className="relative flex gap-2 overflow-x-auto pb-3 pt-1 [scrollbar-color:rgba(198,255,0,.55)_transparent]">
        {days.map(day => {
          const value = iso(day)
          const selected = value === date
          const marked = eventDays.has(value)
          return <button key={value} type="button" role="option" aria-selected={selected} onClick={() => onChange(value)} className={`group relative z-10 flex h-[88px] min-w-[58px] flex-col items-center justify-between rounded-2xl border px-2 py-3 transition focus:outline-none focus:ring-2 focus:ring-lime-300 ${selected ? 'border-lime-300 bg-lime-300 text-black shadow-lg shadow-lime-300/20' : 'border-white/10 bg-[#172019] text-white/65 hover:-translate-y-0.5 hover:border-white/35 hover:text-white'}`}><span className={`text-[10px] font-black uppercase ${selected ? 'text-black/60' : 'text-white/40'}`}>{weekday(day)}</span><span className="text-xl font-black leading-none">{day.getDate()}</span><span className={`text-[10px] font-black uppercase ${selected ? 'text-black/60' : 'text-white/40'}`}>{month(day)}</span>{marked && <span aria-label="Event day" className={`absolute -bottom-1 h-2.5 w-2.5 rounded-full border-2 ${selected ? 'border-black bg-[#ff6b57]' : 'border-[#111813] bg-[#ff6b57]'}`}/>}</button>
        })}
      </div>
    </div>

    <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] font-bold text-white/50"><span className="inline-flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-[#ff6b57]"/>Event window</span><span className="inline-flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-lime-300"/>Selected day</span><span className="ml-auto">Drag or swipe to explore</span></div>
    {events.length > 0 && <div className="mt-4 flex gap-2 overflow-x-auto border-t border-white/10 pt-3">{events.slice(0, 4).map(event => <button key={`${event.name}-${event.start_date}`} type="button" onClick={() => onChange(event.start_date)} className="shrink-0 rounded-full border border-[#ff6b57]/35 bg-[#ff6b57]/10 px-3 py-2 text-xs font-black text-orange-100 hover:bg-[#ff6b57]/20">{event.name}</button>)}</div>}
  </section>
}
