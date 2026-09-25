import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Lenis from 'lenis'
import { createPortal } from 'react-dom'
import * as api from './api.js'
import { t } from './i18n.js'
import useGeoLocation, { LOCATION_SOURCE, SYNC_STATE } from './hooks/useGeoLocation.js'
import usePageTranslation from './hooks/usePageTranslation.js'
import PlaceMap, { isOpenAt } from './components/PlaceMap.jsx'
import PlaceDeck from './components/PlaceDeck.jsx'
import PlaceCards from './components/PlaceCards.jsx'
import { fallBack, photoFor } from './components/placePhotos.js'
import WeatherIcon, { weatherLabel } from './components/WeatherIcon.jsx'
import BriefingPopup from './components/BriefingPopup.jsx'
import ReadAloud from './components/ReadAloud.jsx'
import DateScrubber from './components/DateScrubber.jsx'
import { dayLabel, prettyDates, spanLabel, withPrettyDates } from './dates.js'

const PRESETS = [
  { label: 'Bengaluru', state: 'Karnataka', lat: 12.9716, lng: 77.5946 },
  { label: 'Mumbai', state: 'Maharashtra', lat: 19.076, lng: 72.8777 },
  { label: 'Hyderabad', state: 'Telangana', lat: 17.385, lng: 78.4867 },
  { label: 'Pune', state: 'Maharashtra', lat: 18.5204, lng: 73.8567 }
]
const TABS = [['arrive', 'Arrive'], ['briefing', 'Briefing'], ['nearby', 'Nearby'], ['now', 'Right now'], ['ask', 'Ask']]
// Briefing cards, three per row: the date-specific sections first.
const BRIEFING_GRID = ['weather', 'events', 'safety', 'history', 'culture_etiquette', 'attractions']
const SECTIONS = ['history', 'culture_etiquette', 'events', 'weather', 'safety', 'attractions']
const NATIVE_NAMES = { 'en-IN': 'English', hi: 'हिन्दी', kn: 'ಕನ್ನಡ', mr: 'मराठी', te: 'తెలుగు' }
const slugify = value => String(value || 'default').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')
// Day and night photos for the preset cities (sources in the README's asset disclosure).
const CITY_PHOTOS = {
  bengaluru: { day: 'bengaluru-day.jpg', night: 'bengaluru.jpg' },
  mumbai: { day: 'mumbai.jpg', night: 'mumbai-night.jpg' },
  hyderabad: { day: 'hyderabad.jpg', night: 'hyderabad-night.jpg' },
  pune: { day: 'pune.jpg', night: 'pune-night.jpg' }
}
const newSessionId = () => 'gg-' + (globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2))
const splitSentences = text => String(text || '').replace(/\s+/g, ' ').match(/[^.!?।]+[.!?।]*/g)?.map(v => v.trim()).filter(Boolean) || []

// Drawers and dialogs render into <body>, so the layout they are opened from (a parent's
// space-y spacing, for one) can never shift them off the edges of the window.
const Overlay = ({ children }) => createPortal(children, document.body)

function Icon({ name }) {
  const paths = { globe: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 0c2.2 2.4 3.2 5.4 3.2 9S14.2 18.6 12 21M12 3c-2.2 2.4-3.2 5.4-3.2 9S9.8 18.6 12 21M4 12h16', chevron: 'm7 10 5 5 5-5', check: 'm5 12.5 4.5 4.5L19 7.5', speaker: 'M5 9.5h3l4-3.5v12l-4-3.5H5v-5ZM16 9.2a4 4 0 0 1 0 5.6', stop: 'M7 7h10v10H7z', refresh: 'M3 12a9 9 0 1 0 2.64-6.36L3 8 M3 3v5h5', sun: 'M12 8.2a3.8 3.8 0 1 0 0 7.6 3.8 3.8 0 0 0 0-7.6Z M12 2.5v2 M12 19.5v2 M5.3 5.3l1.4 1.4 M17.3 17.3l1.4 1.4 M2.5 12h2 M19.5 12h2 M5.3 18.7l1.4-1.4 M17.3 6.7l1.4-1.4', moon: 'M19.5 14.6A7.8 7.8 0 1 1 9.4 4.5a6.2 6.2 0 0 0 10.1 10.1Z' }
  return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{paths[name]?.split(' M').map((part, i) => <path key={i} d={i ? `M${part}` : part}/>)}</svg>
}

// A city photo for the time of day. If that photo is missing, the other one is shown
// dimmed or brightened so the switch still reads.
function CityPhoto({ name, scene, className }) {
  const set = CITY_PHOTOS[slugify(name)]
  const [failed, setFailed] = useState(false)
  useEffect(() => setFailed(false), [name, scene])
  const src = !set ? '/cities/default.jpg' : '/cities/' + set[failed ? (scene === 'day' ? 'night' : 'day') : scene]
  const tint = failed ? (scene === 'night' ? 'brightness-[.45] saturate-150' : 'brightness-125') : ''
  return <img src={src} onError={() => setFailed(true)} alt="" className={`${className} ${tint}`}/>
}

function SourceReceipt({ sources, onOpen }) {
  const [open, setOpen] = useState(false)
  if (!sources?.length) return null
  return <div className="mt-4">
    <button type="button" onClick={() => setOpen(v => !v)} className="text-xs font-black text-emerald-200 underline decoration-emerald-300/30 underline-offset-4">{open ? 'Hide receipt' : 'Why this?'} · {sources.length} source{sources.length > 1 ? 's' : ''}</button>
    {open && <div className="mt-3 flex flex-wrap gap-1.5">{sources.map(source => <Cite key={source} label={source} onOpen={onOpen}/>)}</div>}
  </div>
}

function MvpPill({ children }) { return <span className="ml-2 inline-flex rounded-full border border-white/20 px-2 py-0.5 text-[9px] font-black uppercase tracking-wide text-white/55">{children}</span> }

// One resolved record: the table, the query that found it, and the rows as a field list
// with the cited field highlighted. An empty result is shown as such: the absence is the fact.
function RecordCard({ record }) {
  const long = value => typeof value === 'string' && value.length > 60
  return <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/[.03]">
    <header className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-white/10 px-4 py-3">
      <span className="rounded-md bg-emerald-500/15 px-2 py-0.5 font-mono text-[11px] font-semibold text-emerald-200">{record.table}</span>
      {record.query && <code className="min-w-0 break-words font-mono text-[11px] text-white/55">WHERE {record.query}</code>}
      <span className="ml-auto font-mono text-[11px] text-white/45">{record.error ? 'no lookup' : `${record.rows.length} row${record.rows.length === 1 ? '' : 's'}`}</span>
    </header>
    {record.error && <p className="px-4 py-3 text-sm text-white/70">{record.error}</p>}
    {!record.error && record.rows.length === 0 && <p className="px-4 py-3 text-sm text-white/75">The query returned no rows. That absence is what the briefing reports.</p>}
    {!record.error && record.rows.slice(0, 3).map((row, index) => <dl key={index} className={`grid grid-cols-[minmax(0,9rem)_1fr] gap-x-3 gap-y-1 px-4 py-3 font-mono text-[11px] leading-5 ${index > 0 ? 'border-t border-white/10' : ''}`}>
      {Object.entries(row).map(([key, value]) => { const cited = record.field?.split('/').includes(key); return <React.Fragment key={key}>
        <dt className={`truncate ${cited ? 'text-emerald-200' : 'text-white/45'}`}>{key}</dt>
        <dd className={`min-w-0 whitespace-pre-wrap break-words ${cited ? '-mx-1 rounded bg-emerald-500/15 px-1 text-emerald-100' : long(value) ? 'text-white/75' : 'text-white/85'}`}>{value === null ? 'null' : String(value)}</dd>
      </React.Fragment> })}
    </dl>)}
    {!record.error && record.rows.length > 3 && <p className="border-t border-white/10 px-4 py-2 font-mono text-[11px] text-white/45">+{record.rows.length - 3} more rows</p>}
  </section>
}

// Slides in from the right with the database rows behind one or more citation labels.
function EvidenceDrawer({ open, onClose, cityId, forDate }) {
  const [records, setRecords] = useState(null)
  useEffect(() => {
    if (!open) return undefined
    let live = true
    setRecords(null)
    Promise.all(open.labels.map(label => api.source(label, cityId, forDate)
      .then(record => ({ ...record, label }))
      .catch(() => ({ label, table: parseLabel(label).table, rows: [], error: 'This label names a column or a reason, not a row, so there is no record to fetch.' }))))
      .then(result => { if (live) setRecords(result) })
    return () => { live = false }
  }, [open, cityId, forDate])
  useEffect(() => {
    if (!open) return undefined
    const onKey = event => { if (event.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])
  if (!open) return null
  const claim = open.claim
  return <Overlay>
    <button type="button" aria-label="Close evidence" onClick={onClose} className="fixed inset-0 z-[69] bg-black/50 backdrop-blur-[2px]"/>
    <aside data-lenis-prevent className="fixed inset-y-0 right-0 z-[70] flex w-full max-w-lg flex-col border-l border-white/15 bg-[#101713] shadow-2xl" aria-label="Evidence">
      <div className="flex items-start justify-between gap-4 border-b border-white/10 p-5">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[.25em] text-emerald-300">Evidence</p>
          <h2 className="mt-1 text-xl font-black">The record{open.labels.length > 1 ? 's' : ''} behind this</h2>
        </div>
        <button type="button" onClick={onClose} aria-label="Close evidence" className="rounded-full border border-white/15 px-3 py-2 text-xs font-black hover:border-white/40">Close</button>
      </div>
      <div className="flex-1 space-y-4 overflow-y-auto overscroll-contain p-5">
        {claim && <blockquote className="rounded-2xl border border-white/10 bg-white/[.05] p-4 text-sm font-bold leading-6 text-white/85">“{prettyDates(claim.text)}”{claim.confidence === 'low' && <span className="ml-2 inline-block rounded-full bg-amber-300 px-2 py-0.5 text-[10px] font-black text-black align-middle">low confidence · verify locally</span>}</blockquote>}
        <div className="flex flex-wrap gap-1.5">{open.labels.map(label => <Cite key={label} label={label}/>)}</div>
        {records === null
          ? <div role="status" className="flex items-center gap-3 text-sm text-white/60"><span className="h-2 w-2 animate-pulse rounded-full bg-emerald-300"/>Fetching the rows…</div>
          : records.map(record => <RecordCard key={record.label} record={record}/>)}
        <p className="text-[11px] leading-5 text-white/40">Rows are read by key from the provided PS-13 database. The chip label is the same string the model cited.</p>
      </div>
    </aside>
  </Overlay>
}

function useTypewriterClaims(sections, animate, onComplete) {
  const claims = useMemo(() => sections.flatMap(section => (section?.claims || []).map(claim => ({ ...claim, text: String(claim.text || '') }))), [sections])
  const graphemes = useMemo(() => { const Segmenter = Intl.Segmenter; const segmenter = Segmenter ? new Segmenter(undefined, { granularity: 'grapheme' }) : null; return claims.map(claim => segmenter ? [...segmenter.segment(claim.text)].map(item => item.segment) : [...claim.text]) }, [claims])
  const total = graphemes.reduce((sum, text) => sum + text.length, 0)
  const [count, setCount] = useState(animate ? 0 : total)
  useEffect(() => { setCount(animate ? 0 : total); if (!animate || !total) { onComplete?.(); return undefined }; let current = 0; const timer = window.setInterval(() => { current += 1; setCount(current); if (current >= total) { window.clearInterval(timer); onComplete?.() } }, 8); return () => window.clearInterval(timer) }, [animate, total, onComplete])
  let remaining = count
  return { claims, graphemes, visible: graphemes.map(text => { const shown = text.slice(0, Math.max(0, Math.min(text.length, remaining))); remaining -= Math.min(text.length, Math.max(0, remaining)); return shown.join('') }), complete: count >= total, skip: () => setCount(total) }
}

function LanguageMenu({ lang, languages, onChange }) {
  const [open, setOpen] = useState(false)
  const current = languages?.find(item => item.bcp47 === lang)
  return <div translate="no" className="relative"><button type="button" aria-expanded={open} onClick={() => setOpen(v => !v)} className="flex items-center gap-2 rounded-full border border-white/15 bg-white/[.06] px-3 py-2 text-left text-xs font-black text-white hover:border-lime-300 focus:outline-none focus:ring-2 focus:ring-lime-300"><Icon name="globe"/><span>{NATIVE_NAMES[lang] || current?.english_name || lang}</span><Icon name="chevron"/></button>{open && <div className="absolute right-0 top-12 z-50 w-56 rounded-2xl border border-white/15 bg-[#121815] p-2 shadow-2xl"><div className="sr-only">Language options</div>{(languages || []).map(item => <button key={item.bcp47} type="button" onClick={() => { onChange(item.bcp47); setOpen(false) }} className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-left hover:bg-white/10"><span><span className="block text-sm font-black">{NATIVE_NAMES[item.bcp47] || item.english_name}</span><span className="block text-[10px] font-bold text-white/50">{item.english_name}</span></span>{item.bcp47 === lang && <Icon name="check"/>}</button>)}</div>}</div>
}

function TopNav({ tab, go, ctx, date, lang, languages, onLanguage, onDate, onCity, events, scene, onScene }) {
  const [dateOpen, setDateOpen] = useState(false)
  return <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0a120d]/80 px-4 py-3 backdrop-blur-xl sm:px-8"><div className="mx-auto flex max-w-[1600px] items-center justify-between gap-3"><div className="flex min-w-0 items-center gap-3 justify-self-start"><button type="button" onClick={() => go('arrive')} className="flex shrink-0 items-center gap-2 font-black tracking-[-.06em] focus:outline-none focus:ring-2 focus:ring-lime-300"><svg aria-hidden="true" viewBox="0 0 24 24" className="h-7 w-7 text-lime-300"><path d="M12 2.5 20.2 21 12 16.1 3.8 21Z" fill="currentColor" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/></svg><span translate="no" className="hidden sm:inline">GEOGUIDE<span className="text-lime-300">.</span></span></button><span className="hidden shrink-0 items-center gap-2 rounded-full border border-white/15 bg-white/[.04] px-4 py-2 text-xs font-extrabold uppercase tracking-wider text-white/80 shadow-sm lg:inline-flex"><span className="text-lime-300"><WeatherIcon condition={ctx?.weather_today?.condition}/></span>{ctx?.weather_today ? `${ctx.weather_today.temp_max_c}° · ${weatherLabel(ctx.weather_today.condition)}` : '—'}</span></div><nav className="hidden items-center gap-1 justify-self-center rounded-full border border-white/15 bg-white/[.04] p-1.5 shadow-lg shadow-black/10 xl:flex" aria-label="Primary navigation">{TABS.map(([id, label]) => <button key={id} type="button" onClick={() => go(id)} aria-current={tab === id ? 'page' : undefined} className={`rounded-full px-5 py-2.5 text-sm font-extrabold tracking-[-.01em] transition ${tab === id ? 'bg-lime-300 text-black shadow-sm' : 'text-white/75 hover:text-white'}`}>{label}</button>)}</nav><div className="flex min-w-0 items-center justify-end gap-2 justify-self-end"><div className="relative hidden sm:block"><button type="button" onClick={() => setDateOpen(v => !v)} className="max-w-[220px] truncate rounded-full border border-white/15 bg-white/[.06] px-3 py-2 text-xs font-black text-white hover:border-lime-300">{ctx?.city?.name || 'Choose a city'} · {date ? dayLabel(date) : '—'}</button>{dateOpen && <div className="absolute right-0 top-12 z-50 w-[min(420px,calc(100vw-2rem))] rounded-3xl border border-white/15 bg-[#121815] p-4 shadow-2xl"><p className="mb-3 text-[10px] font-black uppercase tracking-[.2em] text-lime-300">Travel through time</p><DateScrubber lang={lang} date={date} range={ctx?.date_range} events={events || []} onChange={value => { onDate(value); setDateOpen(false) }}/><div className="mt-3 grid grid-cols-2 gap-2">{PRESETS.map(city => <button key={city.label} type="button" className="rounded-xl border border-white/10 p-2 text-left text-xs font-black hover:border-lime-300" onClick={() => { onCity(city); setDateOpen(false) }}>{city.label}<span className="block text-[10px] text-white/50">{city.state}</span></button>)}</div></div>}</div><button type="button" onClick={onScene} aria-label={scene === 'day' ? 'Day view, switch to night' : 'Night view, switch to day'} title={scene === 'day' ? 'Day view' : 'Night view'} className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/15 bg-white/[.06] text-white hover:border-lime-300 focus:outline-none focus:ring-2 focus:ring-lime-300"><Icon name={scene === 'day' ? 'sun' : 'moon'}/></button><LanguageMenu lang={lang} languages={languages} onChange={onLanguage}/></div></div><nav className="mx-auto mt-3 grid max-w-[1600px] grid-cols-5 gap-1 sm:flex sm:justify-center xl:hidden" aria-label="Mobile navigation">{TABS.map(([id, label]) => <button key={id} type="button" onClick={() => go(id)} aria-current={tab === id ? 'page' : undefined} className={`min-w-0 whitespace-nowrap rounded-full px-0.5 py-2 text-center text-[10px] font-black uppercase leading-tight tracking-[-.02em] sm:shrink-0 sm:px-3 sm:tracking-normal ${tab === id ? 'bg-lime-300 text-black' : 'bg-white/[.05] text-white/65'}`}>{label}</button>)}</nav></header>
}

function Reader({ text, lang, onSentence }) {
  const [speaking, setSpeaking] = useState(false); const [voice, setVoice] = useState(null)
  useEffect(() => { const load = () => { const requested = String(lang || 'en-IN').toLowerCase(); const base = requested.split('-')[0]; const voices = window.speechSynthesis?.getVoices?.() || []; const score = v => Number(v.lang.toLowerCase() === requested) * 5 + Number(v.localService) * 2 + Number(/enhanced|premium|natural|neural|google|microsoft/i.test(v.name)) * 3; setVoice(voices.filter(v => v.lang.toLowerCase().startsWith(base)).sort((a, b) => score(b) - score(a))[0] || null) }; load(); window.speechSynthesis?.addEventListener('voiceschanged', load); return () => { window.speechSynthesis?.removeEventListener('voiceschanged', load); window.speechSynthesis?.cancel() } }, [lang])
  const play = () => { window.speechSynthesis?.cancel(); if (speaking) { setSpeaking(false); onSentence?.(-1); return }; if (!voice) return; const sentences = splitSentences(text); let i = 0; const next = () => { if (i >= sentences.length) { setSpeaking(false); onSentence?.(-1); return }; const n = i++; onSentence?.(n); const utterance = new SpeechSynthesisUtterance(sentences[n]); utterance.voice = voice; utterance.lang = voice.lang; utterance.rate = .92; utterance.pitch = 1.02; utterance.volume = .95; utterance.onend = next; utterance.onerror = () => { setSpeaking(false); onSentence?.(-1) }; window.speechSynthesis.speak(utterance) }; setSpeaking(true); next() }
  return voice ? <button type="button" onClick={play} aria-pressed={speaking} className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[.06] px-4 py-2 text-xs font-black hover:border-lime-300"><Icon name={speaking ? 'stop' : 'speaker'}/>{speaking ? t(lang, 'stop') : t(lang, 'read')}</button> : <span className="text-xs font-bold text-white/50">{t(lang, 'no_voice')}</span>
}

// Details for a stay or a place, as a side sheet. Every fact is a column of the row it
// came from, and the source chip at the bottom opens that row.
const SCORE_WORDS = [[9, 'Exceptional'], [8, 'Very good'], [7, 'Good'], [6, 'Pleasant'], [0, 'Mixed reviews']]
const scoreWord = score => SCORE_WORDS.find(([min]) => Number(score) >= min)?.[1]
function DetailFact({ label, value }) {
  return <div className="min-w-0 rounded-2xl bg-white/[.05] px-3 py-2.5"><dt className="text-[10px] font-black uppercase tracking-wider text-white/45">{label}</dt><dd className="mt-0.5 truncate text-sm font-black">{value}</dd></div>
}
function LocationDetailDrawer({ location, onClose }) {
  const [evidence, setEvidence] = useState(null)
  useEffect(() => {
    if (!location) return undefined
    // The evidence drawer handles its own Escape; this one closes only when it is not open.
    const onKey = e => { if (e.key === 'Escape' && !evidence) onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [location, onClose, evidence])
  useEffect(() => { setEvidence(null) }, [location])
  if (!location) return null
  const isHotel = Boolean(location.hotel_id)
  const tags = String(location.tags || '').split(',').map(tag => tag.trim()).filter(Boolean)
  const money = location.entry_cost === '0.00' ? 'Free' : [location.currency, location.entry_cost].filter(Boolean).join(' ')
  const stars = Math.max(0, Math.min(5, Number(location.star_rating) || 0))
  const label = isHotel ? `hotels / ${location.hotel_id}` : `activities_poi / ${location.poi_id}`
  const maps = location.lat != null && location.lng != null ? `https://www.google.com/maps/search/?api=1&query=${location.lat},${location.lng}` : null
  return <Overlay>
    <button type="button" aria-label="Close details" onClick={onClose} className="fixed inset-0 z-[69] bg-black/60 backdrop-blur-sm"/>
    <aside data-lenis-prevent role="dialog" aria-modal="true" aria-label={location.name} className="fixed inset-y-0 right-0 z-[70] w-full max-w-md overflow-y-auto overscroll-contain border-l border-white/15 bg-[#101713] shadow-2xl">
      <div className={`relative ${isHotel ? 'h-32 bg-gradient-to-br from-orange-300/25 via-lime-300/10 to-transparent' : 'on-photo h-52'}`}>
        {!isHotel && <><img src={photoFor(location)} onError={e => fallBack(e, location)} alt="" className="absolute inset-0 h-full w-full object-cover"/><span className="absolute inset-0 bg-gradient-to-t from-[#101713] via-black/20 to-black/10"/></>}
        {isHotel && <span aria-hidden="true" className="absolute bottom-3 right-6 text-6xl opacity-80">🏨</span>}
        <button type="button" onClick={onClose} aria-label="Close details" className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full border border-white/20 bg-black/40 text-lg text-white backdrop-blur hover:border-lime-300">×</button>
      </div>
      <div className="space-y-6 px-6 pb-8 pt-2">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[.25em] text-lime-300">{isHotel ? `Stay · ${String(location.property_type || 'hotel').replaceAll('_', ' ')}` : String(location.poi_category || 'Place').replaceAll('_', ' ')}</p>
          <h2 className="mt-2 text-3xl font-black leading-tight tracking-[-.03em]">{location.name}</h2>
          {isHotel && stars > 0 && <p className="mt-2 flex items-center gap-2 text-sm font-bold text-white/70"><span aria-hidden="true" className="tracking-[.15em] text-lime-300">{'★'.repeat(stars)}</span>{stars}-star {String(location.property_type || 'hotel').replaceAll('_', ' ')}</p>}
          {location.address_line && <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-bold text-white/70"><span>⌖ {location.address_line}</span>{maps && <a href={maps} target="_blank" rel="noopener noreferrer" className="text-lime-300 underline decoration-lime-300/40 underline-offset-4 hover:decoration-lime-300">Open in Maps ↗</a>}</p>}
        </div>
        {isHotel && location.guest_score != null && <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[.04] p-4">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-lime-300 text-xl font-black text-black">{location.guest_score}</span>
          <div><p className="font-black">{scoreWord(location.guest_score)}</p><p className="text-xs font-bold text-white/55">Guest score out of 10 · {location.review_count ?? 0} reviews</p></div>
        </div>}
        <dl className={`grid gap-2 ${isHotel ? 'grid-cols-3' : 'grid-cols-2'}`}>
          {isHotel
            ? <><DetailFact label="Check-in" value={location.checkin_time || '—'}/><DetailFact label="Check-out" value={location.checkout_time || '—'}/><DetailFact label="To centre" value={`${location.distance_to_centre_km ?? '—'} km`}/></>
            : <><DetailFact label="Today" value={location.closed_today ? 'Closed' : `${location.opens_at || '—'}–${location.closes_at || '—'}`}/><DetailFact label="Entry" value={money || '—'}/><DetailFact label="Visit" value={`${location.typical_duration_minutes ?? '—'} min`}/><DetailFact label="Distance" value={`${location.distance_km ?? '—'} km`}/>{location.accessibility && <DetailFact label="Access" value={location.accessibility}/>}</>}
        </dl>
        {location.description && <section><h3 className="text-[10px] font-black uppercase tracking-[.2em] text-white/45">{isHotel ? 'About this stay' : 'About this place'}</h3><p className="mt-2 text-sm leading-7 text-white/80">{location.description}</p></section>}
        {tags.length > 0 && <div className="flex flex-wrap gap-2">{tags.map(tag => <span key={tag} className="rounded-full border border-white/15 px-3 py-1 text-[10px] font-black uppercase text-white/65">{tag}</span>)}</div>}
        <p className="flex flex-wrap items-center gap-2 border-t border-white/10 pt-4 text-xs font-bold text-white/45">From the PS-13 database<Cite label={label} onOpen={value => setEvidence({ labels: [value] })}/></p>
      </div>
    </aside>
    <EvidenceDrawer open={evidence} onClose={() => setEvidence(null)}/>
  </Overlay>
}

function LegacyArriveScreen2({ ctx, places, brief, geo, go, onCity, scene }) {
  const [selectedLocation, setSelectedLocation] = useState(null)
  const event = brief?.events_today?.[0]
  const active = PRESETS.find(p => Math.abs(p.lat - geo.coords.lat) < .0001 && Math.abs(p.lng - geo.coords.lng) < .0001)
  const locations = places?.pois || []
  const acquired = geo.locationSource === LOCATION_SOURCE.GEOLOCATION && geo.syncState === SYNC_STATE.SUCCESS
  const locationLabel = geo.syncState === SYNC_STATE.REQUESTING ? 'Acquiring GPS coordinates…' : acquired ? '✓ Location acquired' : 'Use my exact location'
  return <div className="relative min-h-[calc(100vh-74px)] overflow-hidden rounded-b-[2rem]"><CityPhoto name={ctx?.city?.name || geo.selectedCity} scene={scene} className={`hero-photo absolute inset-0 h-full w-full object-cover transition duration-700 ${scene === 'day' ? 'opacity-95' : 'opacity-60'}`}/>{scene === 'day' ? <><div className="hero-scrim absolute inset-0 bg-gradient-to-r from-black/65 via-black/30 to-black/10"/><div aria-hidden="true" className="hero-wash absolute inset-0 hidden"/><div className="hero-fade absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#080b0a]"/></> : <div className="absolute inset-0 bg-gradient-to-b from-[#080b0a]/15 via-[#080b0a]/65 to-[#080b0a]"/>}<div className="relative mx-auto grid min-h-[calc(100vh-74px)] max-w-[1600px] grid-cols-1 gap-8 px-5 py-10 lg:grid-cols-[1fr_400px] lg:items-center lg:px-10"><section className="on-photo hero-copy flex min-h-[430px] max-w-3xl flex-col justify-center"><p className="text-[11px] font-black uppercase tracking-[.22em] text-lime-300">You are in</p><h1 className="mt-4 text-5xl font-extrabold uppercase leading-[.92] tracking-[-.06em] text-white sm:text-7xl lg:text-[6.5rem]">{ctx?.city?.name || geo.selectedCity}</h1><p className="mt-6 text-base font-bold text-white/90">{String(ctx?.season || '').replaceAll('_', ' ')} · {String(ctx?.weather_today?.condition || '').replaceAll('_', ' ')} · {dayLabel(ctx?.date)}</p><div className="mt-6 flex flex-wrap items-center gap-3">{event && <span className="rounded-full bg-[#ff6b57] px-4 py-2 text-xs font-black text-black">Happening now: {event.name}</span>}{brief?.advisory_state && brief.advisory_state !== 'none' && <span className="rounded-full bg-amber-300 px-4 py-2 text-xs font-black text-black">Advisory: {brief.advisory_state}</span>}</div><button type="button" onClick={() => go('briefing')} disabled={!ctx} className="mt-8 w-fit rounded-full bg-lime-300 px-6 py-4 text-xs font-black uppercase tracking-widest text-black transition hover:bg-white disabled:opacity-40">Open briefing ↗</button><button type="button" onClick={geo.requestLocation} disabled={geo.syncState === SYNC_STATE.REQUESTING || acquired} aria-live="polite" className={`mt-4 w-fit rounded-full border px-5 py-3 text-sm font-black transition ${acquired ? 'border-emerald-300/50 bg-emerald-300/15 text-emerald-100' : 'border-white/20 bg-black/20 text-white/85 hover:border-lime-300 hover:text-white'}`}>{locationLabel}</button>{acquired && <p className="mt-2 text-xs font-bold text-emerald-100/75" aria-live="polite">{geo.coords.lat.toFixed(4)}, {geo.coords.lng.toFixed(4)}</p>}{geo.error && <p role="alert" className="mt-2 text-xs font-bold text-rose-200">{geo.error}</p>}</section><section className="glass rounded-[2rem] p-5"><div className="mb-4 flex items-center justify-between"><p className="text-[10px] font-black uppercase tracking-[.2em] text-white/60">Nearby places</p><span className="text-xs font-bold text-white/50">{locations.slice(0, 6).length} places</span></div>{places ? <PlaceDeck places={locations.slice(0, 6)} isOpen={location => isOpenAt(location, ctx?.at || '15:00')} onOpen={setSelectedLocation}/> : <div className="grid h-64 place-items-center rounded-2xl border border-white/10 bg-black/20 text-sm font-bold text-white/50">Loading places…</div>}</section><section className="lg:col-span-2"><div className="flex snap-x gap-3 overflow-x-auto pb-2">{PRESETS.map(city => <button key={city.label} type="button" onClick={() => onCity(city)} aria-pressed={active?.label === city.label} className={`on-photo relative h-28 min-w-[190px] snap-start overflow-hidden rounded-2xl border-2 text-left ${active?.label === city.label ? 'border-lime-300' : 'border-white/15'}`}><CityPhoto name={city.label} scene={scene} className="absolute inset-0 h-full w-full object-cover opacity-55"/><span className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent"/><span className="absolute bottom-3 left-3"><span className="block font-black text-white">{city.label}</span><span className="text-xs font-bold text-white/65">{city.state}</span></span></button>)}</div><p className="mt-3 text-xs font-bold text-white/55">Tap a card for its hours, entry fee and accessibility.</p></section></div><LocationDetailDrawer location={selectedLocation} onClose={() => setSelectedLocation(null)}/></div>
}

function ArriveScreen(props) {
  return <LegacyArriveScreen2 {...props}/>
}

function LegacyArriveScreen({ ctx, places, brief, geo, go, onCity, judges }) {
  const [photo, setPhoto] = useState(`/cities/${slugify(ctx?.city?.name)}.jpg`); useEffect(() => setPhoto(`/cities/${slugify(ctx?.city?.name)}.jpg`), [ctx?.city?.name]); const event = brief?.events_today?.[0]; const active = PRESETS.find(p => Math.abs(p.lat - geo.coords.lat) < .0001 && Math.abs(p.lng - geo.coords.lng) < .0001)
  return <div className="relative min-h-[calc(100vh-74px)] overflow-hidden rounded-b-[2rem]"><img src={photo} onError={() => setPhoto('/cities/default.jpg')} alt="" className="absolute inset-0 h-full w-full object-cover opacity-60 transition-opacity duration-700"/><div className="absolute inset-0 bg-gradient-to-b from-[#080b0a]/15 via-[#080b0a]/65 to-[#080b0a]"/><div className="relative mx-auto grid min-h-[calc(100vh-74px)] max-w-[1600px] gap-8 px-5 py-10 lg:grid-cols-[1fr_400px] lg:items-center lg:px-10"><section className="max-w-3xl"><p className="text-[11px] font-black uppercase tracking-[.3em] text-lime-300">You are in</p><h1 className="mt-4 text-6xl font-black uppercase leading-[.88] tracking-[-.08em] text-white sm:text-8xl">{ctx?.city?.name || geo.selectedCity}</h1><p className="mt-6 text-base font-bold text-white/75">{String(ctx?.season || '').replaceAll('_', ' ')} · {String(ctx?.weather_today?.condition || '').replaceAll('_', ' ')} · {dayLabel(ctx?.date)}</p><div className="mt-6 flex flex-wrap items-center gap-3">{event && <span className="rounded-full bg-[#ff6b57] px-4 py-2 text-xs font-black text-black">Happening now: {event.name}</span>}{brief?.advisory_state && brief.advisory_state !== 'none' && <span className="rounded-full bg-amber-300 px-4 py-2 text-xs font-black text-black">Advisory: {brief.advisory_state}</span>}</div><button type="button" onClick={() => go('briefing')} disabled={!ctx} className="mt-8 rounded-full bg-lime-300 px-6 py-4 text-xs font-black uppercase tracking-widest text-black transition hover:bg-white disabled:opacity-40">Open briefing ↗</button><button type="button" onClick={geo.requestLocation} disabled={geo.syncState === SYNC_STATE.REQUESTING} className="mt-4 block text-sm font-black text-white/70 underline decoration-white/25 underline-offset-4 hover:text-white">{geo.syncState === SYNC_STATE.REQUESTING ? 'Acquiring location…' : 'Use my exact location'}</button>{geo.error && <p role="alert" className="mt-2 text-xs font-bold text-rose-200">{geo.error}</p>}</section><section className="glass rounded-[2rem] p-4"><div className="mb-3 flex items-center justify-between"><p className="text-[10px] font-black uppercase tracking-[.2em] text-white/60">Nearby on the map</p><span className="text-xs font-bold text-white/50">{places?.pois?.slice(0, 6).length || 0} pins</span></div>{places ? <PlaceMap lang="en-IN" pois={(places.pois || []).slice(0, 6)} centre={ctx?.city} at={ctx?.at || '15:00'}/> : <div className="grid h-64 place-items-center rounded-2xl border border-white/10 bg-black/20 text-sm font-bold text-white/50">Loading places…</div>}</section><section className="lg:col-span-2"><div className="flex snap-x gap-3 overflow-x-auto pb-2">{PRESETS.map(city => <button key={city.label} type="button" onClick={() => onCity(city)} aria-pressed={active?.label === city.label} className={`relative h-28 min-w-[190px] snap-start overflow-hidden rounded-2xl border-2 text-left ${active?.label === city.label ? 'border-lime-300' : 'border-white/15'}`}><img src={`/cities/${slugify(city.label)}.jpg`} onError={e => { e.currentTarget.src = '/cities/default.jpg' }} alt="" className="absolute inset-0 h-full w-full object-cover opacity-55"/><span className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent"/><span className="absolute bottom-3 left-3"><span className="block font-black text-white">{city.label}</span><span className="text-xs font-bold text-white/65">{city.state}</span></span></button>)}</div><p className="mt-3 text-xs font-bold text-white/55">Drag the date in the top bar to travel through time.</p></section></div></div>
}

function LegacyBriefingScreen({ brief, ctx, date, lang, setDate, loadBriefing, loading, grounding, toggleGrounding, briefingText }) {
  const [activeSentence, setActiveSentence] = useState(-1)
  return <div className="space-y-6"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-[10px] font-black uppercase tracking-[.3em] text-lime-300">Briefing / {date}</p><h1 className="mt-3 text-5xl font-black tracking-[-.07em]">{brief?.city || ctx?.city?.name}</h1></div><div className="flex flex-wrap items-center gap-2"><Reader text={briefingText} lang={lang} onSentence={setActiveSentence}/><button translate="no" type="button" onClick={toggleGrounding} aria-pressed={grounding} className={`rounded-full border px-4 py-2 text-xs font-black ${grounding ? 'border-emerald-300/40 text-emerald-300' : 'border-amber-300/40 text-amber-200'}`}>{grounding ? 'Grounding on' : 'Grounding off'}</button></div></div>{activeSentence >= 0 && <div className="rounded-2xl border border-orange-200/25 bg-orange-300/10 p-4"><p className="text-[10px] font-black uppercase tracking-[.2em] text-orange-200">Now reading</p><p className="mt-2 text-sm font-bold leading-6 text-orange-50">{splitSentences(briefingText)[activeSentence]}</p></div>}<div className="glass rounded-3xl p-4"><DateScrubber lang={lang} date={date} range={ctx?.date_range} events={brief?.events_today || []} onChange={value => { setDate(value); loadBriefing(value) }}/></div>{loading && !brief ? <Loading/> : brief ? <>{brief.events_today?.length ? <div className="rounded-2xl border border-[#ff6b57]/40 bg-[#ff6b57]/10 p-4 text-sm font-bold text-orange-50">{brief.events_today.map(e => `${e.name} · ${e.start_date}–${e.end_date}`).join(' · ')}</div> : <div className="rounded-2xl border border-white/10 bg-white/[.04] p-4 text-sm font-bold text-white/65">No events on your dates.</div>}{SECTIONS.map(key => { const section = brief.sections?.[key]; if (!section) return null; if (section.type !== 'answer') return <article key={key} className="rounded-3xl border-l-2 border-rose-300 bg-rose-400/10 p-5"><h2 className="text-lg font-black">{t(lang, key)}</h2><p className="mt-3 text-sm text-white/75">{section.message}</p></article>; const text = section.claims.map(c => c.text).join(' '); const sources = [...new Set(section.claims.flatMap(c => c.source_labels || []))]; return <article key={key} className="glass rounded-3xl p-5"><h2 className="text-lg font-black">{t(lang, key)}</h2><p className="mt-3 max-w-3xl text-sm leading-7 text-white/80">{text}</p><SourceReceipt sources={sources}/></article> })}</> : <div className="rounded-3xl border border-white/10 p-6 text-white/60">No briefing loaded yet.</div>}</div>
}

// Smooth scrolling owns the page, so jumps to a section go through it; without it (reduced
// motion) the browser scrolls. The offset clears the sticky header.
const smoothScroll = { lenis: null }
function scrollToElement(el) {
  if (!el) return
  if (smoothScroll.lenis) smoothScroll.lenis.scrollTo(el, { offset: -110 })
  else el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

// Places to visit come first, since they are what the MVP asks for. Places to stay sit
// beside them on wide screens, staying in view while the grid scrolls, and are one tap
// away on a phone.
function NearbyScreen({ places, loading, lang }) {
  const [selectedLocation, setSelectedLocation] = useState(null)
  const pois = places?.pois || []
  const hotels = places?.hotels || []
  const toStays = () => scrollToElement(document.getElementById('stays'))
  return <div className="space-y-7">
    <div>
      <p className="text-[10px] font-black uppercase tracking-[.3em] text-lime-300">Nearby</p>
      <h1 className="mt-3 text-5xl font-black tracking-[-.07em]">Places to visit.</h1>
      {places && <div className="mt-3 flex flex-wrap items-center gap-2">
        <p className="text-sm font-bold text-white/60">{pois.length} places nearby, nearest first</p>
        {hotels.length > 0 && <button type="button" onClick={toStays} className="rounded-full border border-white/15 bg-white/[.05] px-3 py-1.5 text-xs font-black text-white hover:border-lime-300 lg:hidden">{hotels.length} places to stay ↓</button>}
      </div>}
    </div>
    {!places ? <Loading/> : <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
      <section aria-label="Places to visit"><PlaceCards places={pois}/></section>
      <aside id="stays" aria-labelledby="stays-heading" data-lenis-prevent className="scroll-mt-32 rounded-3xl border border-white/10 bg-white/[.04] p-4 lg:sticky lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto" style={{ top: 'calc(var(--header-h, 74px) + 16px)' }}>
        <h2 id="stays-heading" className="pr-10 text-xl font-black">Stay nearby</h2><p className="mt-0.5 text-xs font-bold text-white/50">{hotels.length} stays · best rated first</p>
        {hotels.length === 0
          ? <p className="mt-3 text-sm text-white/60">No stays listed for this city.</p>
          : <div className="mt-3 space-y-2">{hotels.map(h => <button key={h.hotel_id} type="button" onClick={() => setSelectedLocation(h)} className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/[.05] p-3 text-left transition hover:border-lime-300/60 hover:bg-white/[.08] focus:outline-none focus-visible:ring-2 focus-visible:ring-lime-300">
              <span aria-hidden="true" className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-orange-300/40 to-slate-950 text-lg">🏨</span>
              <span className="min-w-0 flex-1"><span className="block font-black leading-snug">{h.name}</span><span className="mt-0.5 block text-xs font-bold text-white/60">★ {h.star_rating ?? '—'}{h.guest_score != null ? ` · ${h.guest_score}/10` : ''} · {h.distance_to_centre_km} km from centre</span></span>
              <span aria-hidden="true" className="text-lg text-white/40">›</span>
            </button>)}</div>}
      </aside>
    </div>}
    <LocationDetailDrawer location={selectedLocation} onClose={() => setSelectedLocation(null)}/>
  </div>
}
function LegacyNearbyScreen({ places, loading, lang }) { return <div /> }

// A citation label as a record reference: the table dimmed, the row id or chunk bright,
// the field in brackets. Labels that name a query (row ids, city passages, KB chunks, POI
// facts) open the evidence drawer; field-style reasons such as activities_poi.closes_at
// are shown but not clickable, since they name a column rather than a row.
const RECORD_TABLES = /^(events_festivals|weather_daily|safety_advisories|activities_poi|hotels|cities)$/
function parseLabel(label) {
  const text = String(label || '')
  const m = text.match(/^(.*?)\s*\(([a-z_/]+)\)$/)
  const base = m ? m[1].trim() : text
  const field = m ? m[2] : null
  if (/^events_festivals · 0 rows/.test(base)) return { table: 'events_festivals', key: base.slice('events_festivals · '.length), field, clickable: true }
  const parts = base.split(' / ').map(part => part.trim())
  if (parts.length >= 2 && RECORD_TABLES.test(parts[0])) return { table: parts[0], key: parts.slice(1).join(' / '), field, clickable: true }
  if (parts[0] === 'KV Place Guide') return { table: 'place_kb', key: parts.slice(1).join(' / '), field, clickable: true }
  if (parts[0] === 'KV POI Facts') return { table: 'poi_facts_kb', key: parts.slice(1).join(' / '), field, clickable: true }
  return { table: base, key: '', field, clickable: false }
}
function Cite({ label, onOpen, n, extra = 0, inline = false }) {
  const { table, key, field, clickable } = parseLabel(label)
  const base = `inline-flex max-w-full flex-wrap items-center gap-x-1 rounded-md border border-emerald-500/25 bg-emerald-500/10 px-1.5 py-0.5 font-mono text-[10px] leading-4 text-emerald-200 ${inline ? 'ml-1.5 align-middle' : ''}`
  const body = <>
    {n != null && <span className="rounded bg-emerald-400/20 px-1 font-semibold text-emerald-100">{n}</span>}
    <span className="opacity-60">{table}</span>{key && <span className="font-semibold">{key}</span>}{field && <span className="opacity-60">({field})</span>}
    {extra > 0 && <span className="opacity-60">+{extra}</span>}
  </>
  return clickable && onOpen
    ? <button type="button" translate="no" title="Show the record behind this" onClick={event => { event.stopPropagation(); onOpen(label) }} className={base + ' cursor-pointer transition hover:border-emerald-400/50 hover:bg-emerald-500/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/60'}>{body}</button>
    : <span translate="no" className={base}>{body}</span>
}

// What moves when the trip date moves. Both dates are recomputed from the data and only
// the differences are listed; each line opens the rows it compared, both dates side by side.
const DIFF_MARK = {
  added: ['+', 'bg-lime-300 text-black'],
  removed: ['−', 'bg-[#ff6b57] text-black'],
  up: ['↑', 'bg-white/15 text-white'],
  down: ['↓', 'bg-white/15 text-white'],
  changed: ['→', 'bg-white/15 text-white'],
}
const DIFF_KIND = { event: 'Event', season: 'Season', weather: 'Weather', advisory: 'Advisory', closure: 'Places' }
function DateDiff({ shift, cityId, onOpen, onClose }) {
  const [diff, setDiff] = useState(null)
  useEffect(() => {
    if (!shift || !cityId) return undefined
    let live = true
    setDiff(null)
    api.dateDiff(cityId, shift.from, shift.to)
      .then(out => { if (live) setDiff(out) })
      .catch(() => { if (live) setDiff({ error: true }) })
    return () => { live = false }
  }, [shift?.from, shift?.to, cityId])
  if (!shift) return null
  const changes = diff?.changes || []
  return <section aria-label="What changed with the new date" aria-live="polite" className="rounded-3xl border border-lime-300/20 bg-lime-300/[.04] p-5">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[.25em] text-lime-300">What changed · recomputed for both dates</p>
        <h2 className="mt-2 text-xl font-black tracking-[-.02em]">{diff?.from_label || dayLabel(shift.from)} <span className="text-lime-300">→</span> {diff?.to_label || dayLabel(shift.to)}</h2>
      </div>
      <div className="flex items-center gap-2">
        {diff && !diff.error && <span className="rounded-full border border-lime-300/20 px-3 py-1 font-mono text-[11px] text-lime-300">{changes.length} change{changes.length === 1 ? '' : 's'}</span>}
        <button type="button" onClick={onClose} aria-label="Hide what changed" className="grid h-8 w-8 place-items-center rounded-full border border-white/15 text-white/70 hover:border-white/40">×</button>
      </div>
    </div>
    {!diff
      ? <div role="status" className="mt-4 flex items-center gap-3 text-sm text-white/60"><span className="h-2 w-2 animate-pulse rounded-full bg-lime-300"/>Comparing the two dates…</div>
      : diff.error
        ? <p className="mt-4 text-sm text-white/70">The comparison needs the server, which isn't reachable right now.</p>
        : changes.length === 0
          ? <p className="mt-4 text-sm leading-6 text-white/80">Nothing a traveller would notice: the same events, season, advisories and closures, and the weather is within 1 °C and 2 mm of rain.</p>
          : <ul className="mt-4 divide-y divide-white/10">{changes.map(change => {
              const [mark, tone] = DIFF_MARK[change.change] || DIFF_MARK.changed
              const labels = change.source_labels || []
              return <li key={change.kind + change.text} className="flex items-start gap-3 py-2.5">
                <span aria-hidden="true" className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full text-xs font-black ${tone}`}>{mark}</span>
                <span className="w-16 shrink-0 pt-0.5 text-[10px] font-black uppercase tracking-wider text-white/50">{DIFF_KIND[change.kind] || change.kind}</span>
                <p className="min-w-0 flex-1 text-sm leading-6 text-white/90">{change.text}{labels[0] && <Cite inline label={labels[0]} extra={labels.length - 1} onOpen={() => onOpen({ labels, claim: { text: change.text } })}/>}</p>
              </li>
            })}</ul>}
  </section>
}

function DateFacts({ facts, onOpen }) {
  if (!facts) return null
  const w = facts.weather
  return <section aria-label="What this date looks like" className="rounded-3xl border border-lime-300/20 bg-lime-300/[.04] p-5">
    <p className="text-[10px] font-black uppercase tracking-[.25em] text-lime-300">On {dayLabel(facts.date)} · recomputed from the data</p>
    <div className="mt-4 grid gap-5 md:grid-cols-2">
      <div>
        <h3 className="text-sm font-black">What's on</h3>
        {facts.events.length
          ? facts.events.map(e => <p key={e.event_id} className="mt-2 text-sm leading-6 text-white/85"><strong>{e.name}</strong> · {spanLabel(e.start_date, e.end_date)}<Cite inline onOpen={onOpen} label={e.source_label}/></p>)
          : <p className="mt-2 text-sm font-bold leading-6 text-white/85">{prettyDates(facts.no_events_message)}<Cite inline onOpen={onOpen} label={`events_festivals · 0 rows on ${facts.date}`}/></p>}
        {!facts.events.length && facts.next_event && <p className="mt-2 text-xs leading-5 text-white/60">Next in the data: {facts.next_event.name}, from {dayLabel(facts.next_event.start_date)}<Cite inline onOpen={onOpen} label={facts.next_event.source_label}/></p>}
      </div>
      <div>
        <h3 className="text-sm font-black">Season &amp; weather</h3>
        <p className="mt-2 text-sm leading-6 text-white/85">{String(facts.season || '').replaceAll('_', ' ')}{facts.peak_season ? ' · peak travel season' : ''}<Cite inline onOpen={onOpen} label={facts.season_source}/></p>
        {w && <p className="mt-1 flex flex-wrap items-center gap-x-1.5 text-sm leading-6 text-white/85"><span className="text-lime-300"><WeatherIcon condition={w.condition} className="h-4 w-4"/></span>{String(w.condition).replaceAll('_', ' ')}, {w.temp_min_c}–{w.temp_max_c} °C, {w.precipitation_mm} mm rain, {w.humidity_pct}% humidity<Cite inline onOpen={onOpen} label={w.source_label}/></p>}
      </div>
    </div>
    {facts.tips?.length > 0 && <div className="mt-5"><h3 className="text-sm font-black">Weather tips for this date</h3><ul className="mt-2 space-y-1.5">{facts.tips.map(tip => <li key={tip.text} className="text-sm leading-6 text-white/85">{tip.text}<Cite inline onOpen={onOpen} label={tip.source_label}/></li>)}</ul></div>}
    {facts.advisories?.length > 0 && <div className="mt-5"><h3 className="text-sm font-black">Advisories in effect</h3>{facts.advisories.map(a => <p key={a.advisory_id} className="mt-2 text-sm leading-6 text-amber-100">{a.level}: {a.title}<Cite inline onOpen={onOpen} label={a.source_label}/></p>)}</div>}
  </section>
}

function BriefingScreen({ brief, ctx, date, lang, setDate, shift, onCloseShift, loadBriefing, loading, grounding, toggleGrounding, briefingText, judges, animate, onAnimated, eventDays, error, scene }) {
  const [activeSentence, setActiveSentence] = useState(-1)
  const [evidence, setEvidence] = useState(null)
  const openEvidence = useCallback(label => setEvidence({ labels: [label] }), [])
  const closeEvidence = useCallback(() => setEvidence(null), [])
  const stats = useMemo(() => { const secs = SECTIONS.map(key => brief?.sections?.[key]).filter(Boolean); return { cited: secs.reduce((n, sec) => n + (sec.claims?.length || 0), 0), dropped: secs.reduce((n, sec) => n + (sec.dropped?.length || 0), 0), refused: secs.filter(sec => sec.type !== 'answer').length } }, [brief])
  const answerSections = BRIEFING_GRID.map(key => brief?.sections?.[key]).filter(section => section?.type === 'answer')
  const typewriter = useTypewriterClaims(answerSections, Boolean(animate && brief), onAnimated)
  let claimIndex = 0
  return <div className="mx-auto max-w-[1400px] space-y-6">
    <section className="relative flex min-h-[220px] flex-col justify-end overflow-hidden rounded-3xl border border-white/10"><CityPhoto name={ctx?.city?.name} scene={scene} className={`absolute inset-0 h-full w-full object-cover ${scene === 'day' ? 'opacity-80' : 'opacity-60'}`}/><div className="absolute inset-0 bg-gradient-to-t from-[#080b0a] via-[#080b0a]/45 to-transparent"/><div className="relative flex flex-col justify-end p-6"><p className="text-[10px] font-black uppercase tracking-[.3em] text-lime-300">Briefing · {dayLabel(date)}</p><h1 className="mt-2 text-5xl font-black tracking-[-.07em]">{brief?.city || ctx?.city?.name}</h1><div className="mt-3 flex flex-wrap items-center gap-2">{brief && <span translate="no" title="Every shown sentence carries a source; uncited sentences are removed before display" className="inline-flex flex-wrap items-center gap-x-1.5 rounded-full border border-emerald-300/25 bg-emerald-300/10 px-3 py-1 font-mono text-[11px] text-emerald-100 [&>span]:whitespace-nowrap"><span>{stats.cited} claims</span><span className="opacity-50">·</span><span>{stats.cited} cited</span><span className="opacity-50">·</span><span>{stats.dropped} <span className="hidden sm:inline">uncited </span>dropped</span>{stats.refused > 0 && <><span className="opacity-50">·</span><span>{stats.refused} refused</span></>}</span>}{brief?.events_today?.[0] && <span className="rounded-full bg-[#ff6b57] px-3 py-1 text-[10px] font-black text-black">ON NOW · {brief.events_today[0].name}</span>}{brief?.advisory_state && brief.advisory_state !== 'none' && <span className="rounded-full bg-amber-300 px-3 py-1 text-[10px] font-black text-black">ADVISORY · {brief.advisory_state}</span>}<div className="w-full sm:ml-auto sm:w-auto"><ReadAloud text={briefingText} lang={lang} onSentence={setActiveSentence}/></div></div></div></section>
    {activeSentence >= 0 && <div className="rounded-2xl border border-orange-200/25 bg-orange-300/10 p-4"><p className="text-[10px] font-black uppercase tracking-[.2em] text-orange-200">Now reading</p><p className="mt-2 text-sm font-bold leading-6 text-orange-50">{splitSentences(briefingText)[activeSentence]}</p></div>}
    <div className="glass rounded-3xl p-4"><DateScrubber lang={lang} date={date} range={ctx?.date_range} events={eventDays || []} onChange={value => setDate(value)}/></div>
    <DateDiff shift={shift} cityId={ctx?.city?.city_id} onOpen={setEvidence} onClose={onCloseShift}/>
    <DateFacts facts={ctx?.date_facts} onOpen={openEvidence}/>
    {brief && SECTIONS.some(key => brief.sections?.[key]?.extractive) && <div className="rounded-2xl border border-amber-300/30 bg-amber-300/10 p-4 text-xs font-bold text-amber-100">The AI model is unreachable right now, so each section quotes its source passage verbatim. Still grounded: every line is cited.</div>}
    {!brief ? (error ? <div className="rounded-3xl border border-white/10 p-6 text-white/60">No briefing loaded yet.</div> : <Loading/>) : brief ? <div className="space-y-4">{brief.events_today?.length ? <div className="rounded-2xl border border-[#ff6b57]/40 bg-[#ff6b57]/10 p-4 text-sm font-bold text-orange-50">{brief.events_today.map(event => `${event.name} · ${spanLabel(event.start_date, event.end_date)}`).join(' · ')}</div> : null}<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{BRIEFING_GRID.map(key => { const section = brief.sections?.[key]; if (!section) return null; if (section.type !== 'answer') return <article key={key} className="rounded-3xl border-l-2 border-rose-300 bg-rose-400/10 p-5"><h2 className="text-lg font-black">{t(lang, key)}</h2><p className="mt-3 text-sm leading-6 text-white/75">{section.message || 'This section could not be grounded from the available sources.'}</p></article>; const claims = section.claims || []; const sources = []; return <article key={key} className="glass rounded-3xl p-5"><h2 className="flex items-center gap-2 text-lg font-black">{key === 'weather' && <span className="text-lime-300"><WeatherIcon condition={ctx?.weather_today?.condition}/></span>}{t(lang, key)}{judges && <MvpPill>MVP · Grounded briefing with sources</MvpPill>}</h2><div className="mt-4 space-y-3 text-sm leading-7 text-white/85">{claims.map(claim => { const index = claimIndex++; const visible = typewriter.visible[index] || ''; const done = !animate || typewriter.complete || visible.length >= String(claim.text || '').length; (claim.source_labels || []).forEach(source => sources.push(source)); const labels = claim.source_labels || []; return <p key={index}>{visible}{done && labels[0] && <Cite inline n={index + 1} label={labels[0]} extra={labels.length - 1} onOpen={() => { typewriter.skip(); setEvidence({ labels, claim }) }}/>}</p> })}</div>{section.dropped?.length > 0 && <p className="mt-4 text-xs font-bold text-white/55">{section.dropped.length} unsupported sentence{section.dropped.length > 1 ? 's were' : ' was'} removed</p>}<SourceReceipt sources={[...new Set(sources)]} onOpen={openEvidence}/></article> })}</div></div> : <div className="rounded-3xl border border-white/10 p-6 text-white/60">No briefing loaded yet.</div>}<EvidenceDrawer open={evidence} onClose={closeEvidence} cityId={ctx?.city?.city_id} forDate={date}/>
  </div>
}

// A pick's reason cites a column (activities_poi.closes_at). Pointed at the pick's own row it
// becomes a record label, so the chip opens that row with the field highlighted.
const pickLabel = (source, poiId) => { const m = String(source).match(/^activities_poi\.([a-z_/]+)$/); return m && poiId ? `activities_poi / ${poiId} (${m[1]})` : source }
function parseReason(reason) { const match = String(reason).match(/^(.*?)\s*\(([^)]+)\)\s*$/); return { text: match?.[1] || reason, source: match?.[2] || null } }
function NowScreen({ picks, places, loading, time, setTime, budget, setBudget, windowMinutes, setWindowMinutes, lang, selected, setSelected, centre }) { const visible = picks?.picks || []; const [evidence, setEvidence] = useState(null); return <div className="space-y-6"><div><p className="text-[10px] font-black uppercase tracking-[.3em] text-[#ff6b57]">Right now</p><h1 className="mt-3 text-5xl font-black tracking-[-.07em]">{`What fits the next ${windowMinutes} minutes?`}</h1></div><div className="glass grid gap-3 rounded-3xl p-4 sm:grid-cols-[auto_1fr_auto]"><label className="text-xs font-black text-white/70">Time<input type="time" value={time} onChange={e => setTime(e.target.value)} className="mt-2 block rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm font-bold text-white"/></label><label className="text-xs font-black text-white/70">{`Up to INR ${budget}`}<input type="range" min="0" max="2500" step="50" value={budget} onChange={e => setBudget(Number(e.target.value))} className="mt-4 block w-full accent-[#ff6b57]"/></label><div className="flex items-end gap-1">{[30, 60, 90].map(value => <button key={value} type="button" onClick={() => setWindowMinutes(value)} className={`rounded-xl px-3 py-2 text-xs font-black ${windowMinutes === value ? 'bg-[#ff6b57] text-black' : 'bg-white/10 text-white/65'}`}>{value} min</button>)}</div></div><div className="grid gap-5 lg:grid-cols-[.85fr_1.15fr]"><section className="space-y-3">{loading && !picks ? <Loading/> : visible.length ? visible.map((pick, i) => { const parsed = pick.reasons?.map(parseReason) || []; const chips = parsed.filter(item => !/km away|to reach/i.test(item.text)); const sources = parsed.map(item => item.source).filter(Boolean).map(source => pickLabel(source, pick.poi_id)); return <article key={pick.poi_id || pick.name} onMouseEnter={() => setSelected(pick.poi_id)} onFocus={() => setSelected(pick.poi_id)} className={`rounded-3xl border p-4 transition ${selected === pick.poi_id ? 'border-[#ff6b57] bg-[#ff6b57]/10' : 'border-white/10 bg-white/[.04]'}`}><div className="flex items-start gap-3"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#ff6b57] text-xs font-black text-black">{i + 1}</span><div className="min-w-0 flex-1"><h2 className="font-black">{pick.name}</h2><p className="mt-1 text-xs font-bold text-white/60">{pick.distance_km} km away{pick.travel_minutes ? ` · about ${pick.travel_minutes} min to reach` : ''}</p><div className="mt-3 flex flex-wrap gap-2">{chips.slice(0, 3).map(item => <span key={item.text} className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white/80">{item.text}</span>)}</div><SourceReceipt sources={sources} onOpen={label => setEvidence({ labels: [label] })}/></div></div></article> }) : <div className="space-y-3"><div className="rounded-2xl border border-[#ff6b57]/40 bg-[#ff6b57]/10 p-4 text-sm font-bold text-orange-50">Opens earliest: {picks?.opens_earliest?.length ? picks.opens_earliest.map(p => `${p.name} at ${p.opens_at} (${p.distance_km} km)`).join(' · ') : 'No later opening time in the data.'}</div>{(picks?.excluded || []).map(item => <div key={item.name} className="rounded-2xl border border-white/10 bg-white/[.04] p-4 text-sm"><strong>{item.name}</strong> is out: {item.reason}</div>)}</div>}</section><section className="glass min-h-[420px] rounded-3xl p-3 lg:sticky lg:top-24 lg:h-[calc(100vh-130px)]"><PlaceMap lang={lang} pois={(places?.pois || []).slice(0, 10)} centre={centre} at={time} selected={selected} onSelect={setSelected} numberedIds={visible.map(p => p.poi_id)} routeTo={visible.find(p => p.poi_id === selected)}/></section></div><EvidenceDrawer open={evidence} onClose={() => setEvidence(null)}/></div> }

function LegacyAskScreen({ cityName, question, setQuestion, ask, chat, lang }) { return <div className="space-y-7"><div><p className="text-[10px] font-black uppercase tracking-[.3em] text-lime-300">Ask GeoGuide</p><h1 className="mt-3 text-5xl font-black tracking-[-.07em]">Ask about {cityName}.</h1><p className="mt-2 text-sm font-bold text-white/65">Answers are grounded or refused. No guessing.</p></div><div className="flex gap-2"><input value={question} onChange={e => setQuestion(e.target.value)} onKeyDown={e => e.key === 'Enter' && ask()} placeholder={t(lang, 'placeholder')} className="min-w-0 flex-1 rounded-full border border-white/15 bg-white/[.06] px-6 py-4 text-sm font-bold text-white placeholder:text-white/40 outline-none focus:border-lime-300"/><button type="button" onClick={() => ask()} className="rounded-full bg-lime-300 px-6 py-4 text-xs font-black uppercase tracking-widest text-black">{t(lang, 'send')}</button></div><div className="space-y-3">{chat.map((m, i) => <article key={i} className={`max-w-3xl rounded-3xl p-5 text-sm leading-7 ${m.me ? 'ml-auto bg-lime-300 font-black text-black' : 'border border-white/10 bg-white/[.04] text-white/80'}`}>{m.me ? m.text : m.answer?.type === 'answer' ? <><p>{m.answer.claims.map(c => c.text).join(' ')}</p><SourceReceipt sources={[...new Set(m.answer.claims.flatMap(c => c.source_labels || []))]}/></> : <p>{m.answer?.message || 'No grounded answer.'}</p>}</article>)}</div></div> }
// Confirms before clearing the conversation. Escape or a click on the backdrop cancels.
function NewChatModal({ open, onConfirm, onCancel }) {
  const noRef = useRef(null)
  useEffect(() => {
    if (!open) return undefined
    noRef.current?.focus()
    const onKey = event => { if (event.key === 'Escape') onCancel() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onCancel])
  if (!open) return null
  return <Overlay><div className="fixed inset-0 z-[80] grid place-items-center bg-black/60 p-4" onClick={onCancel}>
    <div role="dialog" aria-modal="true" aria-labelledby="new-chat-title" onClick={event => event.stopPropagation()} className="w-full max-w-sm rounded-2xl border border-slate-700 bg-slate-900/90 p-6 shadow-2xl backdrop-blur-md">
      <h2 id="new-chat-title" className="text-lg font-semibold text-white">Start a new chat</h2>
      <p className="mt-3 text-sm leading-relaxed text-white/80">Old chats are going to be cleared. Do you wish to proceed?</p>
      <div className="mt-6 flex justify-end gap-2">
        <button ref={noRef} type="button" onClick={onCancel} className="rounded-full border border-slate-600 px-5 py-2 text-sm font-semibold text-white/85 hover:border-white/60 focus:outline-none focus:ring-2 focus:ring-lime-300">No</button>
        <button type="button" onClick={onConfirm} className="rounded-full bg-lime-300 px-5 py-2 text-sm font-semibold text-black hover:bg-white focus:outline-none focus:ring-2 focus:ring-lime-300">Yes</button>
      </div>
    </div>
  </div></Overlay>
}

// Chat indices grouped into question-and-answer turns, newest turn first; while an answer
// is pending, a 'pending' marker sits under the question it belongs to.
function newestFirst(chat, asking) {
  const turns = []
  chat.forEach((message, i) => { if (message.me || !turns.length) turns.push([i]); else turns[turns.length - 1].push(i) })
  if (asking && turns.length) turns[turns.length - 1].push('pending')
  return turns.reverse().flat()
}

function LegacyAskScreen2({ cityName, cityId, date, question, setQuestion, ask, chat, lang, judges, suggestions, onNewChat, asking }) {
  const [evidence, setEvidence] = useState(null)
  const openEvidence = useCallback(label => setEvidence({ labels: [label] }), [])
  const closeEvidence = useCallback(() => setEvidence(null), [])
  const [confirmOpen, setConfirmOpen] = useState(false)
  const closeConfirm = useCallback(() => setConfirmOpen(false), [])
  const promptList = (suggestions || []).map(item => typeof item === 'string' ? { question: item } : item)
  const listRef = useRef(null)
  // Newest exchange first, right under the input, so a new question never needs a scroll.
  useEffect(() => { if (listRef.current) listRef.current.scrollTop = 0 }, [chat.length, asking])
  return <div className="space-y-7"><div><p className="text-[10px] font-black uppercase tracking-[.3em] text-lime-300">Ask GeoGuide</p><h1 className="mt-3 text-5xl font-black tracking-[-.07em]">{`Ask about ${cityName}.`}{judges && <MvpPill>MVP · Grounded Q&A</MvpPill>}</h1><p className="mt-2 text-sm font-bold text-white/65">Answers are grounded or refused. No guessing.</p></div><NewChatModal open={confirmOpen} onCancel={closeConfirm} onConfirm={() => { onNewChat(); setConfirmOpen(false) }}/><div className="flex gap-2"><input value={question} onChange={e => setQuestion(e.target.value)} onKeyDown={e => e.key === 'Enter' && ask()} placeholder={t(lang, 'placeholder')} className="min-w-0 flex-1 rounded-full border border-white/15 bg-white/[.06] px-6 py-4 text-sm font-bold text-white placeholder:text-white/40 outline-none focus:border-lime-300"/><button type="button" onClick={() => ask()} disabled={asking} className="rounded-full bg-lime-300 px-6 py-4 text-xs font-black uppercase tracking-widest text-black disabled:opacity-50">{t(lang, 'send')}</button></div><div className="flex flex-col gap-3"><div className="flex justify-end"><button type="button" onClick={() => setConfirmOpen(true)} disabled={!chat.length} className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[.06] px-4 py-2 text-xs font-semibold text-white/80 transition hover:border-lime-300 hover:text-white disabled:opacity-40 disabled:hover:border-white/15"><Icon name="refresh"/>Start a new chat</button></div><div ref={listRef} data-lenis-prevent className="flex max-h-[62vh] flex-col gap-3 overflow-y-auto overscroll-contain pr-1">{newestFirst(chat, asking).map(i => { if (i === 'pending') return <div key="pending" role="status" className="flex items-center gap-3 rounded-3xl border border-white/10 bg-white/[.04] p-5 text-sm font-bold text-white/70"><span className="h-2.5 w-2.5 animate-pulse rounded-full bg-lime-300"/>Searching the city record and checking every source…</div>; const message = chat[i]; const answer = message.answer; if (message.me) return <div key={i} className="ml-auto max-w-xl rounded-3xl bg-lime-300 p-4 text-sm font-black text-black">{message.text}</div>; if (answer?.type === 'greeting') return <article key={i} className="max-w-3xl rounded-3xl border border-white/10 bg-white/[.04] p-5 text-sm leading-7 text-white/80"><p>{prettyDates(answer.message)}</p>{suggestions.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{suggestions.map(suggestion => <button key={suggestion} type="button" onClick={() => ask(suggestion)} className="rounded-full border border-white/15 px-3 py-2 text-xs font-black text-white/75 hover:border-lime-300">{suggestion}</button>)}</div>}</article>
          if (answer?.type === 'refusal' || answer?.type === 'error') return <article key={i} className="rounded-3xl border border-white/15 bg-white/[.04] p-6"><div className="flex gap-4"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-amber-300/40 text-amber-200">⌾</div><div><h2 className="text-xl font-black">I can&apos;t answer that from my sources</h2><p className="mt-2 text-sm leading-6 text-white/70">{prettyDates(answer.message) || 'This request is outside the grounded data available to GeoGuide.'}</p><p className="mt-4 text-[10px] font-black uppercase tracking-[.2em] text-white/40">Try one of these</p><div className="mt-2 flex flex-wrap gap-2">{suggestions.map(suggestion => <button key={suggestion} type="button" onClick={() => ask(suggestion)} className="rounded-full border border-white/15 px-3 py-2 text-xs font-black text-white/75 hover:border-lime-300">{suggestion}</button>)}</div></div></div></article>; const claims = answer?.claims || []; return <article key={i} className="max-w-3xl rounded-3xl border border-white/10 bg-white/[.04] p-5 text-sm leading-7 text-white/80"><p>{claims.map((claim, index) => { const labels = claim.source_labels || []; return <React.Fragment key={index}>{prettyDates(claim.text)}{labels[0] && <Cite inline n={index + 1} label={labels[0]} extra={labels.length - 1} onOpen={() => setEvidence({ labels, claim })}/>}{' '}</React.Fragment> })}</p><SourceReceipt sources={[...new Set(claims.flatMap(claim => claim.source_labels || []))]} onOpen={openEvidence}/>{answer?.flagged && <span className="mt-3 mr-2 inline-block rounded-full bg-amber-300 px-3 py-1 text-[10px] font-black text-black">Lower confidence · verify locally</span>}{answer?.extractive && <span className="mt-3 inline-block rounded-full border border-amber-300/30 px-3 py-1 text-[10px] font-black text-amber-100">Quoted verbatim from the source · AI model offline</span>}</article> })}</div></div><EvidenceDrawer open={evidence} onClose={closeEvidence} cityId={cityId} forDate={date}/></div>
}

// One FAQ row: the question opens a one-sentence answer quoted from the guide, with the
// rest behind "Show more" and the source underneath.
function FaqItem({ faq, onAsk, onOpen, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen)
  const [expanded, setExpanded] = useState(false)
  const answer = faq.answer
  const claims = answer?.claims || []
  const more = answer?.more_claims || []
  const sources = [...new Set([...claims, ...more].flatMap(claim => claim.source_labels || []))]
  return <div className="border-b border-white/10 last:border-b-0">
    <button type="button" onClick={() => setOpen(value => !value)} aria-expanded={open} className="flex w-full items-center justify-between gap-4 py-4 text-left text-base font-semibold text-white hover:text-lime-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-lime-300"><span>{faq.question}</span><span className={`shrink-0 text-white/60 transition-transform ${open ? 'rotate-180' : ''}`}><Icon name="chevron"/></span></button>
    {open && <div className="pb-4">
      {answer?.type === 'answer'
        ? <p className="text-sm leading-relaxed text-white/90 sm:text-base">{prettyDates((expanded ? [...claims, ...more] : claims).map(claim => claim.text).join(' '))}</p>
        : <p className="text-sm leading-relaxed text-amber-100/90 sm:text-base">{prettyDates(answer?.message) || 'This question was refused because the available sources did not support it.'}</p>}
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
        {sources.map(source => <Cite key={source} label={source} onOpen={onOpen}/>)}
        {more.length > 0 && <button type="button" onClick={() => setExpanded(value => !value)} aria-expanded={expanded} className="text-xs font-semibold text-lime-300 hover:text-lime-200">{expanded ? 'Show less' : 'Show more'}</button>}
        <button type="button" onClick={() => onAsk(faq.question)} className="text-xs font-semibold text-white/65 hover:text-white">Ask a follow-up</button>
      </div>
    </div>}
  </div>
}

function AskScreen(props) {
  const promptList = (props.suggestions || []).map(item => typeof item === 'string' ? { question: item } : item)
  const [evidence, setEvidence] = useState(null)
  const openEvidence = useCallback(label => setEvidence({ labels: [label] }), [])
  const closeEvidence = useCallback(() => setEvidence(null), [])
  return <div className="space-y-5"><LegacyAskScreen2 {...props} suggestions={promptList.slice(0, 4).map(item => item.question)}/>{promptList.length > 0 && <section className="mx-auto max-w-3xl rounded-3xl border border-white/10 bg-white/[.04] p-4 sm:p-5"><p className="text-[10px] font-black uppercase tracking-[.2em] text-lime-300">Quick answers for {props.cityName}</p><p className="mt-2 text-sm font-bold text-white/60">Quoted from the city guide, with the source under each answer.</p><div className="mt-2">{promptList.map((faq, i) => <FaqItem key={faq.question} faq={faq} onAsk={props.ask} onOpen={openEvidence} defaultOpen={i === 0}/>)}</div></section>}<EvidenceDrawer open={evidence} onClose={closeEvidence} cityId={props.cityId} forDate={props.date}/></div>
}
function Loading() { return <div className="space-y-3 rounded-3xl border border-white/10 bg-white/[.04] p-6"><div className="h-3 w-1/3 animate-pulse rounded bg-white/15"/><div className="h-3 w-full animate-pulse rounded bg-white/10"/><div className="h-3 w-2/3 animate-pulse rounded bg-white/10"/></div> }

function ProofDrawer({ health, grounding, onGrounding, onClose }) {
  return <aside className="fixed inset-y-0 right-0 z-[70] w-full max-w-md border-l border-white/15 bg-[#101713] p-6 shadow-2xl"><div className="flex items-start justify-between"><div><p className="text-[10px] font-black uppercase tracking-[.25em] text-lime-300">Judges view</p><h2 className="mt-2 text-3xl font-black">Proof, live.</h2></div><button type="button" onClick={onClose} className="rounded-full border border-white/15 px-3 py-2 text-xs font-black">Close</button></div><div className="mt-8 space-y-4 text-sm"><div className="rounded-2xl border border-white/10 bg-white/[.04] p-4"><p className="font-black">GET /health</p><p className="mt-2 text-white/65">Database: <strong className="text-white">{health?.db ? 'connected' : 'offline'}</strong></p><p className="text-white/65">Index: <strong className="text-white">{health?.index ? Object.values(health.index).reduce((sum, value) => sum + Number(value || 0), 0) : '—'}</strong> records</p><p className="text-white/65">LLM: <strong className="text-white">{health?.llm?.provider || '—'}</strong></p></div><div className="rounded-2xl border border-white/10 bg-white/[.04] p-4"><p className="font-black">Grounding switch</p><p className="mt-2 text-white/65">GET/POST /grounding?enabled=</p><button translate="no" type="button" onClick={onGrounding} className="mt-3 rounded-full border border-emerald-300/40 px-4 py-2 text-xs font-black text-emerald-200">{grounding ? 'Grounding on · click to turn off' : 'Grounding off · click to turn on'}</button></div></div></aside>
}

function JudgesControl({ judges, setJudges, onProof }) {
  const [open, setOpen] = useState(false)
  return <div className="fixed right-4 z-50" style={{ top: 'calc(var(--header-h, 74px) + 12px)' }}><button type="button" onClick={() => setOpen(value => !value)} aria-expanded={open} className="grid h-9 w-9 place-items-center rounded-full border border-white/15 bg-[#121815]/90 text-xs font-black text-white/70 shadow-xl backdrop-blur-xl">•••</button>{open && <div className="mt-2 w-60 rounded-2xl border border-white/15 bg-[#121815] p-3 shadow-2xl"><label className="flex items-center justify-between gap-3 p-2 text-xs font-black"><span>Judges view</span><input type="checkbox" checked={judges} onChange={event => setJudges(event.target.checked)} className="h-4 w-4 accent-lime-300"/></label><button type="button" onClick={onProof} className="mt-2 w-full rounded-xl border border-white/15 px-3 py-2 text-left text-xs font-black text-white/75 hover:border-lime-300">Open Proof drawer</button></div>}</div>
}

export default function App() {
  const [tab, setTab] = useState('arrive'); const [ctx, setCtx] = useState(null); const [brief, setBrief] = useState(null); const [places, setPlaces] = useState(null); const [picks, setPicks] = useState(null); const [askSuggestions, setAskSuggestions] = useState([]); const [askFaqs, setAskFaqs] = useState([]); const [lang, setLang] = useState(() => localStorage.getItem('geoguide-language') || 'en-IN'); const [date, setDate] = useState(''); const [time, setTime] = useState('15:00'); const [budget, setBudget] = useState(1500); const [windowMinutes, setWindowMinutes] = useState(90); const [question, setQuestion] = useState(''); const [chat, setChat] = useState([]); const [loading, setLoading] = useState(false); const [error, setError] = useState(''); const [grounding, setGrounding] = useState(true); const [selected, setSelected] = useState(null); const [judges, setJudges] = useState(false); const [proofOpen, setProofOpen] = useState(false); const [health, setHealth] = useState(null); const animatedBriefings = useRef(new Set()); const [eventDays, setEventDays] = useState([]); const chatSession = useRef(newSessionId()); const chatCity = useRef(null); const [briefLoading, setBriefLoading] = useState(false); const briefReq = useRef(0)
  usePageTranslation(lang)
  const [offlineAt, setOfflineAt] = useState(api.offline.at)
  useEffect(() => api.offline.subscribe(setOfflineAt), [])
  // Once the first place has loaded, quietly save the demo cities for offline use.
  const seeded = useRef(false)
  useEffect(() => { if (!ctx || seeded.current) return; seeded.current = true; setTimeout(() => api.seedOffline(PRESETS), 4000) }, [ctx])
  // Buttons pinned "under the header" follow its real height, which grows when the tabs wrap.
  useEffect(() => {
    const header = document.querySelector('header.sticky')
    if (!header || !window.ResizeObserver) return undefined
    const set = () => document.documentElement.style.setProperty('--header-h', `${Math.round(header.getBoundingClientRect().height)}px`)
    const observer = new ResizeObserver(set); observer.observe(header); set()
    return () => observer.disconnect()
  }, [])
  const [scene, setScene] = useState(() => document.documentElement.dataset.theme === 'light' ? 'day' : 'night')
  const toggleScene = () => setScene(current => { const next = current === 'day' ? 'night' : 'day'; const theme = next === 'day' ? 'light' : 'dark'; const root = document.documentElement; root.classList.add('theme-switching'); root.dataset.theme = theme; requestAnimationFrame(() => requestAnimationFrame(() => root.classList.remove('theme-switching'))); try { localStorage.setItem('geoguide-theme', theme) } catch { /* storage blocked */ } return next })
  const [asking, setAsking] = useState(false)
  const geo = useGeoLocation(PRESETS[0], () => {}); const pos = geo.coords
  const loadContext = useCallback(async (nextPos, requestedDate) => { setLoading(true); setError(''); try { const next = await api.context(nextPos.lat, nextPos.lng, requestedDate); setCtx(next); setDate(next.date); setGrounding(next.grounding_enabled); const saved = localStorage.getItem('geoguide-language'); setLang(next.languages?.some(item => item.bcp47 === saved) ? saved : (next.languages?.[0]?.bcp47 || 'en-IN')); briefReq.current++; setBriefLoading(false); setBrief(null); setPlaces(null); setPicks(null); setSelected(null) } catch { setError('The backend is unavailable. Start the API and retry.') } finally { setLoading(false) } }, [])
  const loadNearby = useCallback(async () => { if (!ctx) return; try { setPlaces(await api.nearby(ctx.city.city_id, pos.lat, pos.lng, date)) } catch { setError('Nearby places could not be loaded from the backend.') } }, [ctx, pos.lat, pos.lng, date])
  const loadAskSuggestions = useCallback(async (cityId, nextLang = lang) => { if (!cityId) return; try { const result = await api.askFaqs(cityId, nextLang); setAskFaqs(result.faqs || []); setAskSuggestions(result.faqs || []) } catch { setAskFaqs([]); setAskSuggestions([]) } }, [lang])
  const loadBriefing = useCallback(async (nextDate = date, nextLang = lang) => { if (!ctx) return; const req = ++briefReq.current; setBriefLoading(true); try { const next = await api.briefing(ctx.city.city_id, nextLang, nextDate); if (req === briefReq.current) setBrief(withPrettyDates(next)) } catch { if (req === briefReq.current) setError('Briefing could not be loaded from the backend.') } finally { if (req === briefReq.current) setBriefLoading(false) } }, [ctx, date, lang])
  const loadNow = useCallback(async () => { if (!ctx) return; setLoading(true); try { setPicks(await api.now(ctx.city.city_id, pos.lat, pos.lng, time, date, budget, windowMinutes)) } catch { setError('The action engine could not be loaded from the backend.') } finally { setLoading(false) } }, [ctx, pos.lat, pos.lng, time, date, budget, windowMinutes])
  const loadHealth = useCallback(async () => { try { setHealth(await api.health()) } catch { setHealth({ status: 'offline', db: false }) } }, [])
  useEffect(() => { loadContext(pos) }, [pos.lat, pos.lng]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (ctx && ['arrive', 'nearby', 'now'].includes(tab) && !places) loadNearby() }, [ctx, tab, places, loadNearby])
  // A new chat drops the on-screen history and the server's follow-up context; a fresh
  // session id also makes any answer still in flight for the old chat land nowhere.
  const resetChat = useCallback(() => { const old = chatSession.current; chatSession.current = newSessionId(); setChat([]); api.resetSession(old).catch(() => {}) }, [])
  useEffect(() => { const id = ctx?.city?.city_id; if (!id) return; if (chatCity.current && chatCity.current !== id) resetChat(); chatCity.current = id }, [ctx?.city?.city_id, resetChat])
  // A new city or date clears the briefing; rebuild it whenever the briefing tab is showing.
  useEffect(() => { if (ctx && tab === 'briefing' && !brief && !briefLoading && !error) loadBriefing() }, [ctx, tab, brief, briefLoading, error, loadBriefing])
  useEffect(() => { if (!ctx?.city?.city_id) return; api.dates(ctx.city.city_id).then(r => setEventDays(r.events || [])).catch(() => setEventDays([])) }, [ctx?.city?.city_id])
  // On first launch, ask for the device location; later launches reuse a granted permission silently.
  useEffect(() => { let asked = true; try { asked = localStorage.getItem('geoguide-location-asked') === '1'; localStorage.setItem('geoguide-location-asked', '1') } catch { /* storage blocked */ } const request = () => geo.requestLocation(); if (!asked) { request(); return } navigator.permissions?.query({ name: 'geolocation' }).then(state => { if (state.state === 'granted') request() }).catch(() => {}) }, []) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (ctx?.city?.city_id) loadAskSuggestions(ctx.city.city_id, lang) }, [ctx?.city?.city_id, lang, loadAskSuggestions])
  useEffect(() => { if (tab !== 'now' || !ctx) return; const timer = setTimeout(loadNow, 300); return () => clearTimeout(timer) }, [tab, ctx, time, budget, windowMinutes, loadNow])
  useEffect(() => { if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return; const lenis = new Lenis({ duration: 1.05, smoothWheel: true, allowNestedScroll: true }); smoothScroll.lenis = lenis; let id; const raf = value => { lenis.raf(value); id = requestAnimationFrame(raf) }; id = requestAnimationFrame(raf); return () => { cancelAnimationFrame(id); smoothScroll.lenis = null; lenis.destroy() } }, [])
  const go = async id => { setTab(id); window.scrollTo({ top: 0, behavior: 'smooth' }); if (id === 'nearby' && !places) await loadNearby(); if (id === 'now') await loadNow() }
  // The date a shift came from, so the briefing can show what moved. Kept per city.
  const [shift, setShift] = useState(null)
  const changeDate = value => { if (date && value && value !== date) setShift({ from: date, to: value, cityId: ctx?.city?.city_id }); setDate(value); loadContext(pos, value) }
  const changeLanguage = value => { setLang(value); localStorage.setItem('geoguide-language', value); if (ctx) { animatedBriefings.current.add(ctx.city.city_id + '-' + date + '-' + value); loadBriefing(date, value) } }
  const briefingKey = ctx ? ctx.city.city_id + '-' + date + '-' + lang : ''
  const onAnimated = useCallback(() => { if (briefingKey) animatedBriefings.current.add(briefingKey) }, [briefingKey])
  const toggleProofGrounding = async () => { const next = !grounding; await api.setGrounding(next); setGrounding(next); briefReq.current++; setBriefLoading(false); setError(''); setBrief(null); await loadHealth() }
  const ask = async text => { const value = (text ?? question).trim(); if (!value || !ctx || asking) return; const session = chatSession.current; setQuestion(''); setChat(c => [...c, { me: true, text: value }]); setAsking(true); try { const answer = await api.ask(value, ctx.city.city_id, lang, session); if (session === chatSession.current) setChat(c => [...c, { me: false, answer }]) } catch { setError(offlineAt || !navigator.onLine ? 'You are offline. Saved briefings and places still work; questions need a connection.' : 'Ask could not be answered by the backend.') } finally { setAsking(false) } }
  const briefingText = useMemo(() => brief ? SECTIONS.map(key => brief.sections?.[key]).filter(s => s?.type === 'answer').flatMap(s => s.claims.map(c => c.text)).join(' ') : '', [brief])
  const judgeLabel = { arrive: 'MVP · Location and context', briefing: 'MVP · Grounded briefing with sources', nearby: 'MVP · Nearby, attributed', now: 'MVP · Contextual action engine', ask: 'MVP · Grounded Q&A' }[tab]
  return <div className="min-h-screen bg-[#080b0a] text-white selection:bg-lime-300 selection:text-black"><TopNav tab={tab} go={go} ctx={ctx} date={date} lang={lang} languages={ctx?.languages} onLanguage={changeLanguage} onDate={changeDate} onCity={city => geo.selectPreset(city)} events={eventDays} scene={scene} onScene={toggleScene}/><JudgesControl judges={judges} setJudges={setJudges} onProof={() => { setProofOpen(true); loadHealth() }}/>{judges && <div className="mx-auto flex max-w-[1600px] flex-wrap gap-2 px-5 pt-3 sm:px-10"><MvpPill>{judgeLabel}</MvpPill><MvpPill>Enhancement · Date-shift</MvpPill><MvpPill>MVP · Multilingual</MvpPill></div>}{offlineAt && <div role="status" className="mx-auto max-w-[1600px] px-5 pt-4 sm:px-10"><div className="flex flex-wrap items-center gap-3 rounded-2xl border border-amber-300/30 bg-amber-300/10 px-4 py-2.5 text-sm font-bold text-amber-100"><span className="h-2 w-2 shrink-0 rounded-full bg-amber-300"/><span>Offline · showing saved data from {new Date(offlineAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. Briefings, places and hotels you have opened still work; questions need a connection.</span><button type="button" onClick={() => loadContext(pos, date)} className="ml-auto rounded-full border border-amber-300/40 px-3 py-1 text-xs font-black hover:bg-amber-300/15">Retry</button></div></div>}{error && <div role="alert" className="mx-auto max-w-[1600px] px-5 pt-5 sm:px-10"><div className="rounded-2xl border border-rose-300/40 bg-rose-400/10 p-4 text-sm font-bold text-rose-100">{error}</div></div>}<main className="mx-auto max-w-[1600px] px-5 py-6 sm:px-10">{tab === 'arrive' && <ArriveScreen ctx={ctx} places={places} brief={brief} geo={geo} go={go} onCity={city => geo.selectPreset(city)} judges={judges} scene={scene}/>} {tab === 'briefing' && <BriefingScreen brief={brief} ctx={ctx} date={date} lang={lang} setDate={changeDate} shift={shift && shift.cityId === ctx?.city?.city_id && shift.to === date ? shift : null} onCloseShift={() => setShift(null)} loadBriefing={loadBriefing} loading={briefLoading} grounding={grounding} toggleGrounding={toggleProofGrounding} briefingText={briefingText} judges={judges} animate={!animatedBriefings.current.has(briefingKey)} onAnimated={onAnimated} eventDays={eventDays} error={error} scene={scene}/>} {tab === 'nearby' && <NearbyScreen places={places} loading={loading} lang={lang}/>} {tab === 'now' && <NowScreen picks={picks} places={places} loading={loading} time={time} setTime={setTime} budget={budget} setBudget={setBudget} windowMinutes={windowMinutes} setWindowMinutes={setWindowMinutes} lang={lang} selected={selected} setSelected={setSelected} centre={{ ...pos, name: ctx?.city?.name || 'Your location' }}/>} {tab === 'ask' && <AskScreen cityName={ctx?.city?.name || geo.selectedCity} cityId={ctx?.city?.city_id} date={date} question={question} setQuestion={setQuestion} ask={ask} chat={chat} lang={lang} judges={judges} suggestions={askSuggestions} onNewChat={resetChat} asking={asking}/>}</main><BriefingPopup ctx={ctx} date={date} lang={lang}/>{proofOpen && <ProofDrawer health={health} grounding={grounding} onGrounding={toggleProofGrounding} onClose={() => setProofOpen(false)}/>}</div>
}
