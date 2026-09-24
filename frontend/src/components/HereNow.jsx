import React from 'react'
import Icon from './Icon.jsx'
import { SourceChip } from './Bits.jsx'
import { t } from '../i18n.js'

/** The PS scenario in one card: where you are, what it's like, what's on, what's open.
    Four facts, four sources — the whole thesis above the fold. */
export default function HereNow({ ctx, lang, onOpenBriefing, onOpenNow }) {
  if (!ctx) return null
  const n = ctx.now || {}
  const w = ctx.weather_today
  const ev = n.events?.[0]
  const rows = []

  if (w) rows.push({
    icon: 'cloud',
    text: `${String(w.condition).replace('_', ' ')}, ${w.temp_min_c}–${w.temp_max_c} °C${w.feels_like_c ? `, feels ${w.feels_like_c} °C` : ''}`,
    src: n.weather_source
  })
  rows.push(ev
    ? { icon: 'calendar', text: `${ev.name} is on now, ${ev.start_date} → ${ev.end_date}`, src: ev.source_label, tone: 'now' }
    : { icon: 'calendar', src: n.next_event?.source_label || `events_festivals / ${ctx.city.name}`,
        text: n.next_event ? `Nothing on today — next is ${n.next_event.name}, ${n.next_event.start_date}`
                           : 'Nothing scheduled today' })
  if (n.advisory) rows.push({
    icon: 'shield', tone: 'warn',
    text: `${n.advisory.level} advisory — ${n.advisory.title}`, src: n.advisory.source_label
  })
  rows.push(n.nearest_open
    ? { icon: 'compass', src: n.nearest_open.source_label,
        text: `${n.open_count} places open now — nearest is ${n.nearest_open.name}, ${n.nearest_open.distance_km} km${n.nearest_open.closes_at ? `, till ${n.nearest_open.closes_at}` : ''}` }
    : { icon: 'compass', src: 'activities_poi', text: `Nothing is open at ${ctx.at}` })

  return (
    <section className="panel solid reveal">
      <div className="spread">
        <span className="eyebrow">here, now · {ctx.at}</span>
        <span className="muted">{ctx.date}</span>
      </div>
      <h1 style={{ marginTop: 4 }}>{ctx.city.name}</h1>
      <p className="muted" style={{ marginTop: -2 }}>
        {String(ctx.season).replace('_', ' ')}{ctx.peak_season ? ` · ${t(lang, 'peak')}` : ''}
        {ctx.city.distance_km != null ? ` · ${ctx.city.distance_km} km ${t(lang, 'from_centre')}` : ''}
      </p>

      <div className="nowlist">
        {rows.map((r, i) => (
          <div className={`nowrow ${r.tone || ''}`} key={i}>
            <Icon name={r.icon} size={18} />
            <div>
              <div className="body" style={{ margin: 0 }}>{r.text}</div>
              <SourceChip label={r.src} />
            </div>
          </div>
        ))}
      </div>

      <div className="row" style={{ marginTop: 14 }}>
        <button className="btn cta" onClick={onOpenBriefing}>{t(lang, 'brief_me')} →</button>
        <button className="btn" onClick={onOpenNow}><Icon name="clock" size={16} /> {t(lang, 'now')}</button>
      </div>
    </section>
  )
}
