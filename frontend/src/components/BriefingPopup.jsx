import React, { useCallback, useEffect, useRef, useState } from 'react'
import * as api from '../api.js'
import { t } from '../i18n.js'
import WeatherIcon, { weatherLabel } from './WeatherIcon.jsx'
import ReadAloud from './ReadAloud.jsx'
import { dayLabel, spanLabel, withPrettyDates } from '../dates.js'

// Floating round button (bottom right) that opens the Accessibility Briefing: today's
// briefing in a compact popup with read-aloud, readable in English, Hindi or Kannada. Content comes from /briefing in the
// chosen language (claims are translated by the backend, labels come from i18n.js), so
// the popup is marked translate="no" to keep the page translator off it.

const LANGS = [['en-IN', 'English'], ['hi', 'हिन्दी'], ['kn', 'ಕನ್ನಡ']]
const ORDER = ['weather', 'events', 'safety', 'history', 'culture_etiquette', 'attractions']
const MS = 220
const TITLE = 'Accessibility Briefing'

export default function BriefingPopup({ ctx, date, lang: pageLang }) {
  const [open, setOpen] = useState(false)
  const [visible, setVisible] = useState(false)
  const [lang, setLang] = useState(() => (LANGS.some(([code]) => code === pageLang) ? pageLang : 'en-IN'))
  const [state, setState] = useState({ key: null, brief: null, error: false })
  const req = useRef(0)
  const panel = useRef(null)
  const city = ctx?.city
  const key = city ? `${city.city_id}|${date}|${lang}` : null

  useEffect(() => {
    if (!open || !key || state.key === key) return
    const id = ++req.current
    setState({ key, brief: null, error: false })
    api.briefing(city.city_id, lang, date)
      .then(brief => { if (id === req.current) setState({ key, brief: withPrettyDates(brief), error: false }) })
      .catch(() => { if (id === req.current) setState({ key, brief: null, error: true }) })
  }, [open, key])

  const show = () => { setOpen(true); requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true))) }
  const hide = useCallback(() => { setVisible(false); setTimeout(() => setOpen(false), MS) }, [])
  useEffect(() => {
    if (!open) return undefined
    panel.current?.focus()
    const onKey = e => { if (e.key === 'Escape') hide() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, hide])

  if (!city) return null
  const brief = state.key === key ? state.brief : null
  const spoken = brief ? ORDER.filter(name => brief.sections?.[name]?.type === 'answer')
    .map(name => `${t(lang, name)}. ${brief.sections[name].claims.map(c => c.text).join(' ')}`).join(' ') : ''
  const w = ctx?.weather_today
  return <div translate="no">
    {open && <section ref={panel} tabIndex={-1} role="dialog" aria-label={`${TITLE} · ${city.name}`}
      style={{ opacity: visible ? 1 : 0, transform: visible ? 'none' : 'translateY(12px) scale(.96)', transformOrigin: 'bottom right', transition: `opacity ${MS}ms ease, transform ${MS}ms cubic-bezier(.2,.9,.25,1)` }}
      className="fixed bottom-24 right-4 z-[65] flex max-h-[min(78vh,720px)] w-[min(440px,calc(100vw-2rem))] flex-col overflow-hidden rounded-3xl border border-white/15 bg-[#121815] shadow-2xl shadow-black/40 focus:outline-none sm:right-6">
      <header className="border-b border-white/10 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[.25em] text-lime-300">{TITLE} · {dayLabel(date)}</p>
            <h2 className="mt-1 truncate text-2xl font-black tracking-[-.04em] text-white">{city.name}</h2>
          </div>
          <button type="button" onClick={hide} aria-label="Close briefing" className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/15 text-white/70 hover:border-lime-300 hover:text-white">✕</button>
        </div>
        <ReadAloud text={spoken} lang={lang} className="mt-4 w-full justify-center py-3"/>
        {w && <p className="mt-3 flex items-center gap-2 text-sm font-bold text-white/80"><span className="text-lime-300"><WeatherIcon condition={w.condition}/></span>{w.temp_min_c}–{w.temp_max_c} °C · {weatherLabel(w.condition)}</p>}
        <div className="mt-4 grid grid-cols-3 gap-1 rounded-full border border-white/10 bg-white/[.05] p-1" role="tablist" aria-label="Briefing language">
          {LANGS.map(([code, name]) => <button key={code} type="button" role="tab" aria-selected={lang === code} onClick={() => setLang(code)}
            className={`rounded-full px-3 py-2 text-sm font-extrabold transition ${lang === code ? 'bg-lime-300 text-black' : 'text-white/70 hover:text-white'}`}>{name}</button>)}
        </div>
      </header>
      <div data-lenis-prevent className="flex-1 space-y-3 overflow-y-auto overscroll-contain p-5">
        {state.error && <p className="rounded-2xl bg-white/[.05] p-4 text-sm font-bold text-white/75">The briefing could not be loaded from the backend.</p>}
        {!brief && !state.error && <div role="status" className="flex items-center gap-3 rounded-2xl bg-white/[.05] p-4 text-sm font-bold text-white/70"><span className="h-2.5 w-2.5 animate-pulse rounded-full bg-lime-300"/>{t(lang, 'loading')}</div>}
        {brief?.events_today?.length > 0 && <p className="rounded-2xl border border-[#ff6b57]/40 bg-[#ff6b57]/10 p-3 text-sm font-bold text-orange-50">{brief.events_today.map(e => `${e.name} · ${spanLabel(e.start_date, e.end_date)}`).join(' · ')}</p>}
        {brief && ORDER.map(name => {
          const section = brief.sections?.[name]
          if (!section) return null
          const sources = [...new Set((section.claims || []).flatMap(c => c.source_labels || []))]
          return <article key={name} className="rounded-2xl border border-white/10 bg-white/[.04] p-4">
            <h3 className="flex items-center gap-2 text-sm font-black text-white">{name === 'weather' && w && <span className="text-lime-300"><WeatherIcon condition={w.condition} className="h-4 w-4"/></span>}{t(lang, name)}</h3>
            {section.type === 'answer'
              ? <p className="mt-2 text-sm leading-6 text-white/85">{section.claims.map(c => c.text).join(' ')}</p>
              : <p className="mt-2 text-sm leading-6 text-white/60">{t(lang, 'no_answer')}</p>}
            {sources.length > 0 && <p className="mt-2 font-mono text-[10px] leading-4 text-emerald-200">{sources.join(' · ')}</p>}
          </article>
        })}
      </div>
    </section>}
    <button type="button" onClick={open ? hide : show} aria-expanded={open} aria-label={open ? `Close ${TITLE}` : `Open ${TITLE}`}
      title={TITLE} className="on-color fixed bottom-5 right-4 z-[66] grid h-14 w-14 place-items-center rounded-full bg-blue-600 text-sm font-extrabold text-white shadow-xl shadow-blue-900/40 transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 sm:right-6">
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{open ? <path d="M6 6l12 12M18 6 6 18"/> : <><path d="M6 3.5h9l3 3V20.5H6z"/><path d="M9 10h6M9 13.5h6M9 17h4"/></>}</svg>
    </button>
  </div>
}
