import React, { useCallback, useEffect, useRef, useState } from 'react'
import * as api from './api.js'
import { t } from './i18n.js'
import Icon from './components/Icon.jsx'
import { Caution, SectionCard, Skeleton, Speak, SourceChip, TimeBadge } from './components/Bits.jsx'
import DateScrubber from './components/DateScrubber.jsx'
import { FIXTURE_BRIEFING } from './fixtures.js'

const SECTIONS = ['history', 'attractions', 'events', 'weather', 'culture_etiquette', 'safety']
const TABS = [
  { id: 'arrive', icon: 'pin', label: 'tab_arrive' },
  { id: 'briefing', icon: 'book', label: 'tab_brief' },
  { id: 'nearby', icon: 'compass', label: 'tab_near' },
  { id: 'now', icon: 'clock', label: 'tab_now' },
  { id: 'ask', icon: 'chat', label: 'tab_ask' }
]
const PRESETS = [
  { name: 'Bengaluru', lat: 12.971599, lng: 77.594566, note: 'quiet week' },
  { name: 'Hyderabad', lat: 17.385044, lng: 78.486671, note: 'festival on now' },
  { name: 'Pune', lat: 18.520430, lng: 73.856744, note: 'live advisory' },
  { name: 'Mumbai', lat: 19.075984, lng: 72.877656, note: 'rain today' }
]
const SUGGESTED = [
  'Do I need to remove my shoes at temples?',
  'Is tap water safe to drink?',
  'Anything to know before visiting the bazaar?',
  'How much is a cab to the airport right now?'
]
const SID = (globalThis.crypto?.randomUUID?.() ?? String(Math.random()))

export default function App() {
  const [tab, setTab] = useState('arrive')
  const [pos, setPos] = useState(PRESETS[0])
  const [ctx, setCtx] = useState(null)
  const [date, setDate] = useState('')
  const [lang, setLang] = useState('en-IN')
  const [voice, setVoice] = useState(false)
  const [brief, setBrief] = useState(null)
  const [dateInfo, setDateInfo] = useState(null)
  const [places, setPlaces] = useState(null)
  const [picks, setPicks] = useState(null)
  const [at, setAt] = useState(() => new Date().toTimeString().slice(0, 5))
  const [budget, setBudget] = useState(2500)
  const [chat, setChat] = useState([])
  const [q, setQ] = useState('')
  const [busy, setBusy] = useState(false)
  const [thinking, setThinking] = useState(false)
  const [offline, setOffline] = useState(false)
  const [grounding, setGrounding] = useState(true)
  const [toast, setToast] = useState(null)
  const chatEnd = useRef(null)

  const flash = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2600) }

  const loadContext = useCallback(async (p, d) => {
    try {
      const c = await api.context(p.lat, p.lng, d)
      setCtx(c); setDate(c.date); setOffline(false); setGrounding(c.grounding_enabled)
      api.dates(c.city.city_id).then(setDateInfo).catch(() => {})
      return c
    } catch { setOffline(true); return null }
  }, [])

  useEffect(() => { loadContext(pos) }, [])                     // eslint-disable-line

  const locate = () => {
    if (!navigator.geolocation) return flash('This browser has no geolocation')
    navigator.geolocation.getCurrentPosition(
      p => { const n = { name: null, lat: p.coords.latitude, lng: p.coords.longitude }
             setPos(n); loadContext(n, date); flash('Location captured') },
      () => flash('Permission denied — choose a city below')
    )
  }

  const pickCity = async (p) => {
    setPos(p); setBrief(null); setPlaces(null); setPicks(null)
    const c = await loadContext(p, date)
    if (c) flash(`${c.city.name} · ${String(c.season).replace('_', ' ')}`)
  }

  const fetchBriefing = async (d = date, l = lang, city = ctx?.city?.city_id) => {
    if (!city) return
    setBusy(true)
    try { setBrief(await api.briefing(city, l, d)); setOffline(false) }
    catch { setBrief(FIXTURE_BRIEFING); setOffline(true) }
    setBusy(false)
  }

  const changeDate = async (d) => {
    setDate(d)
    await fetchBriefing(d)
    if (tab === 'nearby' && ctx) api.nearby(ctx.city.city_id, pos.lat, pos.lng, d).then(setPlaces).catch(() => {})
    if (tab === 'now' && ctx) api.now(ctx.city.city_id, pos.lat, pos.lng, at, d, budget).then(setPicks).catch(() => {})
  }

  const refreshPicks = useCallback(async (time = at, b = budget, d = date) => {
    if (!ctx) return
    try { setPicks(await api.now(ctx.city.city_id, pos.lat, pos.lng, time, d, b)) } catch {}
  }, [ctx, pos, at, budget, date])

  const go = async (id) => {
    setTab(id)
    if (!ctx) return
    if (id === 'briefing' && !brief) fetchBriefing()
    if (id === 'nearby') api.nearby(ctx.city.city_id, pos.lat, pos.lng, date).then(setPlaces).catch(() => setOffline(true))
    if (id === 'now') refreshPicks()
  }

  const send = async (text) => {
    const question = (text ?? q).trim()
    if (!question || !ctx) return
    setQ(''); setChat(c => [...c, { me: true, text: question }]); setThinking(true)
    try {
      const a = await api.ask(question, ctx.city.city_id, lang, SID)
      setChat(c => [...c, { me: false, a }])
    } catch {
      setChat(c => [...c, { me: false, a: { type: 'error', message: t(lang, 'offline') } }])
    }
    setThinking(false)
  }
  useEffect(() => { chatEnd.current?.scrollIntoView({ behavior: 'smooth' }) }, [chat, thinking])

  const toggleGrounding = async () => {
    const next = !grounding
    try {
      await api.setGrounding(next)
      setGrounding(next); setBrief(null); setChat([])
      flash(next ? t(lang, 'grounding_on') : t(lang, 'grounding_off'))
      if (tab === 'briefing') fetchBriefing()
    } catch { flash('Could not reach the API') }
  }

  // Keyboard: 1-5 switch tabs, arrows shift the date on the briefing screen.
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === 'INPUT') return
      const i = Number(e.key)
      if (i >= 1 && i <= 5) return go(TABS[i - 1].id)
      if (tab === 'briefing' && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
        const step = e.key === 'ArrowRight' ? 1 : -1
        const d = new Date(date + 'T00:00:00'); d.setDate(d.getDate() + step)
        const iso = d.toISOString().slice(0, 10)
        const r = brief?.date_range || ctx?.date_range
        if (r && iso >= r.min && iso <= r.max) changeDate(iso)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const briefingText = brief ? SECTIONS.map(s => brief.sections?.[s])
    .filter(s => s?.type === 'answer').map(s => s.claims.map(c => c.text).join(' ')).join(' ') : ''

  return (
    <>
      <div className="field" aria-hidden="true"><span /><span /><span /><span /></div>

      <header className="topbar">
        <div className="inner">
          <span className="brand"><Icon name="compass" size={20} style={{ color: 'var(--moss)' }} /> GeoGuide</span>
          {ctx && <span className="pill">{ctx.city.name}</span>}
          {date && <span className="pill">{date}</span>}
          <button className={`btn ghost ${voice ? 'on' : ''}`} onClick={() => setVoice(v => !v)}
                  aria-label={t(lang, 'voice')}><Icon name="speaker" size={16} /></button>
        </div>
      </header>

      <main className="shell">
        {offline && <div className="banner warn">{t(lang, 'offline')}</div>}
        {!grounding && <div className="banner clay">{t(lang, 'grounding_off')} — {t(lang, 'proof')}</div>}

        {tab === 'arrive' && (
          <>
            <section className="panel reveal">
              <span className="eyebrow">{t(lang, 'welcome')}</span>
              <h1>{ctx?.city?.name || '…'}</h1>
              <p className="muted">
                {ctx ? `${date} · ${String(ctx.season).replace('_', ' ')}${ctx.peak_season ? ` · ${t(lang, 'peak')}` : ''}` : t(lang, 'loading')}
              </p>
              {ctx?.weather_today && (
                <p className="body" style={{ marginTop: 6 }}>
                  {String(ctx.weather_today.condition).replace('_', ' ')} · {ctx.weather_today.temp_min_c}–{ctx.weather_today.temp_max_c} °C
                  {ctx.weather_today.feels_like_c ? ` · feels ${ctx.weather_today.feels_like_c} °C` : ''}
                </p>
              )}
              <div className="row" style={{ marginTop: 14 }}>
                <button className="btn" onClick={locate}><Icon name="pin" size={16} /> {t(lang, 'use_location')}</button>
              </div>
            </section>

            <section className="panel reveal">
              <span className="eyebrow">{t(lang, 'cities')}</span>
              <div className="city-grid" style={{ marginTop: 10 }}>
                {PRESETS.map(p => (
                  <button key={p.name} className={`city-card ${ctx?.city?.name === p.name ? 'on' : ''}`}
                          onClick={() => pickCity(p)}>
                    <b>{p.name}</b><span className="muted">{p.note}</span>
                  </button>
                ))}
              </div>
            </section>

            <section className="panel reveal">
              <div className="row">
                <span className="eyebrow">{t(lang, 'language')}</span>
                {(ctx?.languages || [{ bcp47: 'en-IN', english_name: 'English (India)' }]).map(l => (
                  <button key={l.bcp47} className={`btn ${lang === l.bcp47 ? 'on' : ''}`}
                          onClick={() => { setLang(l.bcp47); setBrief(null) }}>{l.english_name}</button>
                ))}
              </div>
              <div className="row" style={{ marginTop: 12 }}>
                <span className="eyebrow">{t(lang, 'output')}</span>
                <button className={`btn ${!voice ? 'on' : ''}`} onClick={() => setVoice(false)}>{t(lang, 'text')}</button>
                <button className={`btn ${voice ? 'on' : ''}`} onClick={() => setVoice(true)}>
                  <Icon name="speaker" size={16} /> {t(lang, 'voice')}
                </button>
              </div>
              <p className="muted" style={{ marginTop: 14 }}>{t(lang, 'trust')}</p>
              <button className="btn cta" style={{ marginTop: 12 }}
                      onClick={() => { setTab('briefing'); fetchBriefing() }}>
                {t(lang, 'brief_me')} →
              </button>
            </section>

            <section className="panel tight reveal">
              <div className="spread">
                <div>
                  <b>{t(lang, 'grounding_toggle')}</b>
                  <div className="muted">{t(lang, 'proof')}</div>
                </div>
                <button className={`btn ${grounding ? 'on' : ''}`} onClick={toggleGrounding}>
                  {grounding ? 'ON' : 'OFF'}
                </button>
              </div>
            </section>
          </>
        )}

        {tab === 'briefing' && (
          <>
            <DateScrubber lang={lang} date={date} range={brief?.date_range || ctx?.date_range}
                          events={dateInfo?.events} onChange={changeDate} />
            <section className="panel reveal">
              <div className="spread">
                <div>
                  <h2 style={{ margin: 0 }}>{brief?.city || ctx?.city?.name}</h2>
                  <span className="muted">{brief?.date || date} · {String(brief?.season || ctx?.season || '').replace('_', ' ')}</span>
                </div>
                <div className="row">
                  <TimeBadge state={brief?.time_state || 'none'} lang={lang} />
                  <Caution level={brief?.advisory_state} />
                </div>
              </div>
              {brief?.events_today?.length > 0 && (
                <p className="body" style={{ marginTop: 8 }}>
                  {brief.events_today.map(e => `${e.name} (${e.start_date} → ${e.end_date})`).join(' · ')}
                </p>
              )}
              {brief?.next_event && brief.time_state !== 'on_now' && (
                <p className="muted" style={{ marginTop: 8 }}>Next: {brief.next_event.name}, {brief.next_event.start_date}</p>
              )}
              {voice && briefingText && <div style={{ marginTop: 10 }}><Speak text={briefingText} lang={lang} /></div>}
            </section>

            {busy && <><div className="banner warn">{t(lang, 'generating')}</div><Skeleton /><Skeleton /></>}
            {!busy && brief && SECTIONS.map(s => (
              <SectionCard key={s} name={s} data={brief.sections?.[s]} lang={lang} voice={voice} />
            ))}
          </>
        )}

        {tab === 'nearby' && (
          <>
            <section className="panel solid reveal">
              <h2>{t(lang, 'places')}</h2>
              {(places?.pois || []).map(p => (
                <div className="item" key={p.poi_id}>
                  <div className="spread">
                    <b>{p.name}</b>
                    <span className="muted">{p.distance_km} km</span>
                  </div>
                  <div className="muted">
                    {String(p.poi_category).replace('_', ' ')} · {p.opens_at}–{p.closes_at || '—'} ·{' '}
                    {p.entry_cost === '0.00' ? t(lang, 'free') : `${p.currency} ${p.entry_cost}`} ·{' '}
                    {p.typical_duration_minutes} min
                  </div>
                  <span className={`badge ${p.closed_today ? 'warn' : 'soon'}`} style={{ marginTop: 6, display: 'inline-block' }}>
                    {p.closed_today ? t(lang, 'closed') : t(lang, 'open_now')}
                  </span>
                  <div><SourceChip label="activities_poi" /></div>
                </div>
              ))}
              {!places && <Skeleton />}
            </section>
            <section className="panel solid reveal">
              <h2>{t(lang, 'stay')}</h2>
              {(places?.hotels || []).map(h => (
                <div className="item" key={h.hotel_id}>
                  <div className="spread"><b>{h.name}</b><span className="muted">{h.guest_score ?? '—'}</span></div>
                  <div className="muted">{h.star_rating}★ · {h.property_type} · {h.distance_to_centre_km} km to centre</div>
                  <div><SourceChip label="hotels" /></div>
                </div>
              ))}
            </section>
          </>
        )}

        {tab === 'now' && (
          <>
            <section className="panel reveal">
              <div className="spread">
                <span className="eyebrow">{t(lang, 'at_time')}</span>
                <b>{at}</b>
              </div>
              <input type="range" min="0" max="1380" step="30"
                     value={Number(at.slice(0, 2)) * 60 + Number(at.slice(3, 5))}
                     onChange={e => {
                       const v = Number(e.target.value)
                       const s = `${String(Math.floor(v / 60)).padStart(2, '0')}:${String(v % 60).padStart(2, '0')}`
                       setAt(s); refreshPicks(s, budget)
                     }} />
              <div className="spread" style={{ marginTop: 10 }}>
                <span className="eyebrow">{t(lang, 'budget')}</span>
                <b>INR {budget}</b>
              </div>
              <input type="range" min="0" max="2500" step="50" value={budget}
                     onChange={e => { setBudget(Number(e.target.value)); refreshPicks(at, Number(e.target.value)) }} />
              <p className="muted" style={{ marginTop: 8 }}>
                Ranking is computed from the data — no model — so it re-ranks instantly and reproducibly.
              </p>
            </section>
            <section className="panel solid reveal">
              {(picks?.picks || []).map((p, i) => (
                <div className="item" key={p.poi_id}>
                  <div className="spread">
                    <span className="row"><span className="rank">{i + 1}</span><b>{p.name}</b></span>
                    <span className="muted">{p.distance_km} km</span>
                  </div>
                  <div>{p.reasons.map(r => <span className="reason" key={r}>{r}</span>)}</div>
                  <div><SourceChip label={p.source_label} /></div>
                </div>
              ))}
              {picks && picks.picks.length === 0 && <p className="muted">{t(lang, 'nothing_fits')}</p>}
              {!picks && <Skeleton />}
            </section>
          </>
        )}

        {tab === 'ask' && (
          <>
            <section className="panel reveal">
              <div className="row">
                <input type="text" value={q} placeholder={t(lang, 'placeholder')}
                       onChange={e => setQ(e.target.value)}
                       onKeyDown={e => e.key === 'Enter' && send()} aria-label={t(lang, 'placeholder')} />
                <button className="btn cta" onClick={() => send()}>{t(lang, 'send')}</button>
              </div>
              <div className="row" style={{ marginTop: 10 }}>
                <span className="eyebrow">{t(lang, 'suggested')}</span>
                {SUGGESTED.map(s => (
                  <button key={s} className="btn ghost" onClick={() => send(s)}>{s.length > 34 ? s.slice(0, 32) + '…' : s}</button>
                ))}
              </div>
            </section>

            {chat.map((m, i) => m.me ? (
              <div className="bubble me reveal" key={i}>{m.text}</div>
            ) : (
              <div className="bubble reveal" key={i}>
                {m.a.type === 'answer' ? (
                  <>
                    <p className="body">{m.a.claims.map(c => c.text).join(' ')}</p>
                    {[...new Set(m.a.claims.flatMap(c => c.source_labels))].map(s => <SourceChip key={s} label={s} />)}
                    {m.a.flagged && <div className="flag">{t(lang, 'verify')}</div>}
                    {m.a.resolved && <div className="muted" style={{ marginTop: 8 }}>({m.a.resolved})</div>}
                    {voice && <div style={{ marginTop: 8 }}><Speak text={m.a.claims.map(c => c.text).join(' ')} lang={lang} compact /></div>}
                  </>
                ) : (
                  <div className="refusal">
                    {m.a.message}
                    {m.a.layer && <div className="muted" style={{ marginTop: 6 }}>refused at layer {m.a.layer} · {m.a.reason}</div>}
                  </div>
                )}
              </div>
            ))}
            {thinking && <div className="bubble"><div className="skel w60" /><div className="skel w80" /></div>}
            <div ref={chatEnd} />
          </>
        )}
      </main>

      {toast && <div className="toast" role="status">{toast}</div>}

      <nav className="tabs" aria-label="sections">
        {TABS.map(x => (
          <button key={x.id} className={`tab ${tab === x.id ? 'on' : ''}`} onClick={() => go(x.id)}>
            <Icon name={x.icon} size={19} /><span className="lbl">{t(lang, x.label)}</span>
          </button>
        ))}
      </nav>
    </>
  )
}
