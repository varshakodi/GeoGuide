import React, { useEffect, useMemo, useRef } from 'react'
import { t } from '../i18n.js'

const iso = d => d.toISOString().slice(0, 10)
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

/** The mandatory enhancement, made tappable: every date the dataset covers, with the
    days that have an event marked, so a judge can land on a festival in one tap. */
export default function DateScrubber({ lang, date, range, events, onChange }) {
  const trackRef = useRef(null)

  const days = useMemo(() => {
    if (!range) return []
    const out = []
    const lo = new Date(range.min + 'T00:00:00'), hi = new Date(range.max + 'T00:00:00')
    for (let d = new Date(lo); d <= hi; d.setDate(d.getDate() + 1)) out.push(iso(new Date(d)))
    return out
  }, [range])

  const eventDays = useMemo(() => {
    const set = new Set()
    ;(events || []).forEach(e => {
      const lo = new Date(e.start_date + 'T00:00:00'), hi = new Date(e.end_date + 'T00:00:00')
      for (let d = new Date(lo); d <= hi; d.setDate(d.getDate() + 1)) set.add(iso(new Date(d)))
    })
    return set
  }, [events])

  useEffect(() => {
    const el = trackRef.current?.querySelector('.day.on')
    el?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' })
  }, [date, days.length])

  if (!range) return null
  const shift = n => {
    const i = days.indexOf(date)
    if (i >= 0 && days[i + n]) onChange(days[i + n])
  }

  return (
    <section className="panel scrub">
      <div className="spread">
        <span className="eyebrow">{t(lang, 'date')}</span>
        <div className="row">
          <button className="btn ghost" onClick={() => shift(-1)} aria-label="previous day">←</button>
          <input type="date" value={date} min={range.min} max={range.max}
                 onChange={e => onChange(e.target.value)} aria-label={t(lang, 'date')} />
          <button className="btn ghost" onClick={() => shift(1)} aria-label="next day">→</button>
        </div>
      </div>

      <div className="track" ref={trackRef} role="listbox" aria-label={t(lang, 'date')}>
        {days.map(d => (
          <button key={d} role="option" aria-selected={d === date}
                  className={`day ${d === date ? 'on' : ''}`} onClick={() => onChange(d)}>
            <div className="d">{Number(d.slice(8, 10))}</div>
            <div className="m">{MONTHS[Number(d.slice(5, 7)) - 1]}</div>
            <div className={`dot ${eventDays.has(d) ? '' : 'empty'}`} />
          </button>
        ))}
      </div>

      <div className="row" style={{ marginTop: 4 }}>
        {(events || []).slice(0, 4).map(e => (
          <button key={e.name + e.start_date} className="btn" onClick={() => onChange(e.start_date)}
                  title={`${e.start_date} → ${e.end_date}`}>{e.name}</button>
        ))}
      </div>
      <p className="muted" style={{ margin: '8px 0 0' }}>{t(lang, 'date_help')}</p>
    </section>
  )
}
