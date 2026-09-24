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
  const metrics = [
    { value: n.events?.length || 0, label: t(lang, 'live_signals') },
    { value: n.open_count || 0, label: t(lang, 'open_nearby') },
    { value: n.advisory ? String(n.advisory.level).toUpperCase() : 'CLEAR', label: t(lang, 'safety_clear') },
    { value: w?.temp_max_c != null ? `${w.temp_max_c}°` : '—', label: t(lang, 'high_today') }
  ]

  return (
    <section className="panel solid reveal arrival-hero">
      <div className="hero-editorial">
        <div className="hero-copy">
          <div className="spread">
            <span className="eyebrow"><span className="live-dot" /> here, now · {ctx.at}</span>
            <span className="pill">{ctx.date}</span>
          </div>
          <span className="journey-kicker">{t(lang, 'journey_kicker')}</span>
          <h1>{ctx.city.name}</h1>
          <p className="hero-lede">{t(lang, 'hero_lede')}</p>
          <p className="muted hero-season">
            {String(ctx.season).replace('_', ' ')}{ctx.peak_season ? ` · ${t(lang, 'peak')}` : ''}
            {ctx.city.distance_km != null ? ` · ${ctx.city.distance_km} km ${t(lang, 'from_centre')}` : ''}
          </p>
          <div className="hero-actions">
            <button className="btn cta hero-cta" onClick={onOpenBriefing}>{t(lang, 'brief_me')} <span aria-hidden="true">→</span></button>
            <button className="btn ghost" onClick={onOpenNow}><Icon name="clock" size={16} /> {t(lang, 'now')}</button>
          </div>
        </div>
        <div className="hero-atmosphere" aria-label={`Editorial map view of ${ctx.city.name}`}>
          <div className="route-line route-one" />
          <div className="route-line route-two" />
          <div className="route-node node-start"><Icon name="pin" size={15} /></div>
          <div className="route-node node-mid"><span /></div>
          <div className="route-node node-end"><Icon name="compass" size={16} /></div>
          <span className="map-label map-label-top">ARRIVAL LOG</span>
          <span className="map-label map-label-bottom">{ctx.city.name} / {ctx.date}</span>
          <div className="contour contour-a" /><div className="contour contour-b" />
        </div>
      </div>

      <div className="journey-progress" aria-label="Trip progress">
        <span className="progress-label">{t(lang, 'todays_route')}</span>
        <div className="progress-track"><span /><i /><i /><i /></div>
        <span className="progress-value">01 / 04</span>
      </div>

      <div className="metric-grid" aria-label="At a glance">
        {metrics.map(m => <div className="metric" key={m.label}><strong>{m.value}</strong><span>{m.label}</span></div>)}
      </div>

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

    </section>
  )
}
