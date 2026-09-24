import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Lenis from 'lenis'
import * as api from './api.js'
import { t } from './i18n.js'
<<<<<<< HEAD
import useGeoLocation, { LOCATION_SOURCE, SYNC_STATE } from './hooks/useGeoLocation.js'
import PlaceMap from './components/PlaceMap.jsx'
import DateScrubber from './components/DateScrubber.jsx'
=======
import Icon from './components/Icon.jsx'
import { Caution, EmptyState, SectionCard, Skeleton, Speak, SourceChip, TimeBadge } from './components/Bits.jsx'
import DateScrubber from './components/DateScrubber.jsx'
import Clock from './components/Clock.jsx'
import PlaceMap from './components/PlaceMap.jsx'
import HereNow from './components/HereNow.jsx'
import JourneyMap from './components/JourneyMap.jsx'
import JourneyTimeline from './components/JourneyTimeline.jsx'
import { JOURNEY_WAYPOINTS } from './journeyData.js'
import { FIXTURE_BRIEFING } from './fixtures.js'
>>>>>>> origin/master

const PRESETS = [
<<<<<<< HEAD
  { label: 'Bengaluru', state: 'Karnataka', lat: 12.9716, lng: 77.5946 },
  { label: 'Mumbai', state: 'Maharashtra', lat: 19.076, lng: 72.8777 },
  { label: 'Hyderabad', state: 'Telangana', lat: 17.385, lng: 78.4867 },
  { label: 'Pune', state: 'Maharashtra', lat: 18.5204, lng: 73.8567 }
=======
  { name: 'Bengaluru', lat: 12.971599, lng: 77.594566, note: 'quiet week', status: 'SCHEDULE CLEAR', tone: 'clear' },
  { name: 'Hyderabad', lat: 17.385044, lng: 78.486671, note: 'festival on now', status: 'LIVE EVENT', tone: 'live' },
  { name: 'Pune', lat: 18.520430, lng: 73.856744, note: 'live advisory', status: 'ACTIVE ADVISORY', tone: 'advisory' },
  { name: 'Mumbai', lat: 19.075984, lng: 72.877656, note: 'rain today', status: 'RAIN FORECAST', tone: 'rain' }
>>>>>>> origin/master
]
const TABS = [['arrive', 'Arrive'], ['briefing', 'Briefing'], ['nearby', 'Nearby'], ['now', 'Right now'], ['ask', 'Ask']]
const SECTIONS = ['history', 'culture_etiquette', 'events', 'weather', 'safety', 'attractions']
const NATIVE_NAMES = { 'en-IN': 'English', hi: 'हिन्दी', kn: 'ಕನ್ನಡ', mr: 'मराठी', te: 'తెలుగు' }
const slugify = value => String(value || 'default').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')
const splitSentences = text => String(text || '').replace(/\s+/g, ' ').match(/[^.!?।]+[.!?।]*/g)?.map(v => v.trim()).filter(Boolean) || []

function Icon({ name }) {
  const paths = { globe: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 0c2.2 2.4 3.2 5.4 3.2 9S14.2 18.6 12 21M12 3c-2.2 2.4-3.2 5.4-3.2 9S9.8 18.6 12 21M4 12h16', chevron: 'm7 10 5 5 5-5', check: 'm5 12.5 4.5 4.5L19 7.5', speaker: 'M5 9.5h3l4-3.5v12l-4-3.5H5v-5ZM16 9.2a4 4 0 0 1 0 5.6', stop: 'M7 7h10v10H7z' }
  return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{paths[name]?.split(' M').map((part, i) => <path key={i} d={i ? `M${part}` : part}/>)}</svg>
}

function SourceReceipt({ sources }) {
  const [open, setOpen] = useState(false)
  if (!sources?.length) return null
  return <div className="mt-4"><button type="button" onClick={() => setOpen(v => !v)} className="text-xs font-black text-emerald-200 underline decoration-emerald-300/30 underline-offset-4">{open ? 'Hide receipt' : 'Why this?'} · {sources.length} source{sources.length > 1 ? 's' : ''}</button>{open && <div className="mt-3 rounded-2xl border border-emerald-300/20 bg-emerald-300/10 p-3 font-mono text-[11px] text-emerald-100">{sources.map(source => <div key={source} className="flex gap-2"><span aria-hidden="true">✓</span>{source}</div>)}</div>}</div>
}

function MvpPill({ children }) { return <span className="ml-2 inline-flex rounded-full border border-white/20 px-2 py-0.5 text-[9px] font-black uppercase tracking-wide text-white/55">{children}</span> }

function ClaimDrawer({ claim, onClose }) {
  if (!claim) return null
  return <aside className="fixed inset-y-0 right-0 z-[70] w-full max-w-md border-l border-white/15 bg-[#101713] p-6 shadow-2xl" aria-label="Claim receipt">
    <div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-black uppercase tracking-[.25em] text-emerald-300">Claim receipt</p><h2 className="mt-2 text-2xl font-black">Why this is here</h2></div><button type="button" onClick={onClose} aria-label="Close claim receipt" className="rounded-full border border-white/15 px-3 py-2 text-xs font-black">Close</button></div>
    <blockquote className="mt-8 rounded-2xl border border-white/10 bg-white/[.05] p-4 text-sm font-bold leading-6 text-white/85">“{claim.text}”</blockquote>
    <div className="mt-6 space-y-4 text-sm"><div><p className="text-[10px] font-black uppercase tracking-[.2em] text-white/45">Sources</p><div className="mt-2 space-y-2 font-mono text-xs text-emerald-100">{(claim.source_labels || []).map(source => <p key={source}>✓ {source}</p>)}</div></div><div><p className="text-[10px] font-black uppercase tracking-[.2em] text-white/45">Confidence</p><p className="mt-2 font-black">{claim.confidence || 'recorded'}</p>{claim.confidence === 'low' && <span className="mt-2 inline-block rounded-full bg-amber-300 px-3 py-1 text-[10px] font-black text-black">Verify locally</span>}</div><label className="block"><span className="text-[10px] font-black uppercase tracking-[.2em] text-white/45">Copyable label</span><input readOnly value={(claim.source_labels || []).join(' · ')} onFocus={event => event.currentTarget.select()} className="mt-2 w-full rounded-xl border border-white/15 bg-white/[.06] px-3 py-2 font-mono text-xs text-white/75 outline-none"/></label></div>
  </aside>
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
  return <div className="relative"><button type="button" aria-expanded={open} onClick={() => setOpen(v => !v)} className="flex items-center gap-2 rounded-full border border-white/15 bg-white/[.06] px-3 py-2 text-left text-xs font-black text-white hover:border-lime-300 focus:outline-none focus:ring-2 focus:ring-lime-300"><Icon name="globe"/><span>{NATIVE_NAMES[lang] || current?.english_name || lang}</span><Icon name="chevron"/></button>{open && <div className="absolute right-0 top-12 z-50 w-56 rounded-2xl border border-white/15 bg-[#121815] p-2 shadow-2xl"><div className="sr-only">Language options</div>{(languages || []).map(item => <button key={item.bcp47} type="button" onClick={() => { onChange(item.bcp47); setOpen(false) }} className="flex w-full items-center justify-between rounded-xl px-3 py-3 text-left hover:bg-white/10"><span><span className="block text-sm font-black">{NATIVE_NAMES[item.bcp47] || item.english_name}</span><span className="block text-[10px] font-bold text-white/50">{item.english_name}</span></span>{item.bcp47 === lang && <Icon name="check"/>}</button>)}</div>}</div>
}

function TopNav({ tab, go, ctx, date, lang, languages, onLanguage, onDate, onCity }) {
  const [dateOpen, setDateOpen] = useState(false)
  return <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0a120d]/80 px-4 py-3 backdrop-blur-xl sm:px-8"><div className="mx-auto flex max-w-[1600px] items-center justify-between gap-3"><button type="button" onClick={() => go('arrive')} className="flex shrink-0 items-center gap-2 font-black tracking-[-.06em] focus:outline-none focus:ring-2 focus:ring-lime-300"><span className="grid h-8 w-8 rotate-45 place-items-center rounded-xl bg-lime-300 text-black"><span className="-rotate-45">✦</span></span><span className="hidden sm:inline">GEOGUIDE<span className="text-lime-300">.</span></span></button><nav className="hidden items-center gap-1 rounded-full border border-white/10 bg-white/[.04] p-1 md:flex" aria-label="Primary navigation">{TABS.map(([id, label]) => <button key={id} type="button" onClick={() => go(id)} aria-current={tab === id ? 'page' : undefined} className={`rounded-full px-3 py-2 text-xs font-black transition ${tab === id ? 'bg-lime-300 text-black' : 'text-white/65 hover:text-white'}`}>{label}</button>)}</nav><div className="flex min-w-0 items-center justify-end gap-2"><div className="relative hidden sm:block"><button type="button" onClick={() => setDateOpen(v => !v)} className="max-w-[220px] truncate rounded-full border border-white/15 bg-white/[.06] px-3 py-2 text-xs font-black text-white hover:border-lime-300">{ctx?.city?.name || 'Choose a city'} · {date || '—'}</button>{dateOpen && <div className="absolute right-0 top-12 z-50 w-[min(420px,calc(100vw-2rem))] rounded-3xl border border-white/15 bg-[#121815] p-4 shadow-2xl"><p className="mb-3 text-[10px] font-black uppercase tracking-[.2em] text-lime-300">Travel through time</p><DateScrubber lang={lang} date={date} range={ctx?.date_range} events={[]} onChange={value => { onDate(value); setDateOpen(false) }}/><div className="mt-3 grid grid-cols-2 gap-2">{PRESETS.map(city => <button key={city.label} type="button" className="rounded-xl border border-white/10 p-2 text-left text-xs font-black hover:border-lime-300" onClick={() => { onCity(city); setDateOpen(false) }}>{city.label}<span className="block text-[10px] text-white/50">{city.state}</span></button>)}</div></div>}</div><LanguageMenu lang={lang} languages={languages} onChange={onLanguage}/><span className="hidden rounded-full border border-white/10 bg-white/[.06] px-3 py-2 text-[10px] font-black uppercase tracking-wide text-white/70 sm:inline">{ctx?.weather_today ? `${ctx.weather_today.temp_max_c}° · ${String(ctx.weather_today.condition).replaceAll('_', ' ')}` : '—'}</span></div></div><nav className="mx-auto mt-3 flex max-w-[1600px] gap-1 overflow-x-auto md:hidden" aria-label="Mobile navigation">{TABS.map(([id, label]) => <button key={id} type="button" onClick={() => go(id)} aria-current={tab === id ? 'page' : undefined} className={`shrink-0 rounded-full px-3 py-2 text-[10px] font-black uppercase ${tab === id ? 'bg-lime-300 text-black' : 'bg-white/[.05] text-white/65'}`}>{label}</button>)}</nav></header>
}

function Reader({ text, lang, onSentence }) {
  const [speaking, setSpeaking] = useState(false); const [voice, setVoice] = useState(null)
  useEffect(() => { const load = () => { const requested = String(lang || 'en-IN').toLowerCase(); const base = requested.split('-')[0]; const voices = window.speechSynthesis?.getVoices?.() || []; const score = v => Number(v.lang.toLowerCase() === requested) * 5 + Number(v.localService) * 2 + Number(/enhanced|premium|natural|neural|google|microsoft/i.test(v.name)) * 3; setVoice(voices.filter(v => v.lang.toLowerCase().startsWith(base)).sort((a, b) => score(b) - score(a))[0] || null) }; load(); window.speechSynthesis?.addEventListener('voiceschanged', load); return () => { window.speechSynthesis?.removeEventListener('voiceschanged', load); window.speechSynthesis?.cancel() } }, [lang])
  const play = () => { window.speechSynthesis?.cancel(); if (speaking) { setSpeaking(false); onSentence?.(-1); return }; if (!voice) return; const sentences = splitSentences(text); let i = 0; const next = () => { if (i >= sentences.length) { setSpeaking(false); onSentence?.(-1); return }; const n = i++; onSentence?.(n); const utterance = new SpeechSynthesisUtterance(sentences[n]); utterance.voice = voice; utterance.lang = voice.lang; utterance.rate = .92; utterance.pitch = 1.02; utterance.volume = .95; utterance.onend = next; utterance.onerror = () => { setSpeaking(false); onSentence?.(-1) }; window.speechSynthesis.speak(utterance) }; setSpeaking(true); next() }
  return voice ? <button type="button" onClick={play} aria-pressed={speaking} className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[.06] px-4 py-2 text-xs font-black hover:border-lime-300"><Icon name={speaking ? 'stop' : 'speaker'}/>{speaking ? t(lang, 'stop') : t(lang, 'read')}</button> : <span className="text-xs font-bold text-white/50">{t(lang, 'no_voice')}</span>
}

function LocationDetailDrawer({ location, onClose }) {
  if (!location) return null
  const isHotel = Boolean(location.hotel_id)
  const tags = String(location.tags || '').split(',').map(tag => tag.trim()).filter(Boolean)
  const money = location.entry_cost === '0.00' ? 'Free' : [location.currency, location.entry_cost].filter(Boolean).join(' ')
  return <aside className="fixed inset-y-0 right-0 z-[70] w-full max-w-md overflow-y-auto border-l border-white/15 bg-[#101713] p-6 shadow-2xl" aria-label="Location details">
    <div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-black uppercase tracking-[.25em] text-lime-300">{isHotel ? 'Stay details' : 'Place details'}</p><h2 className="mt-2 text-3xl font-black">{location.name}</h2></div><button type="button" onClick={onClose} aria-label="Back to locations" className="rounded-full border border-white/15 px-3 py-2 text-xs font-black">Back</button></div>
    {location.description && <p className="mt-6 text-sm leading-6 text-white/75">{location.description}</p>}
    <dl className="mt-6 grid grid-cols-2 gap-3 text-sm">
      {isHotel ? <><div className="rounded-2xl bg-white/[.05] p-3"><dt className="text-[10px] font-black uppercase text-white/45">Rating</dt><dd className="mt-1 font-black">{location.star_rating ?? '—'} stars</dd></div><div className="rounded-2xl bg-white/[.05] p-3"><dt className="text-[10px] font-black uppercase text-white/45">Guest score</dt><dd className="mt-1 font-black">{location.guest_score ?? '—'} · {location.review_count ?? 0} reviews</dd></div><div className="rounded-2xl bg-white/[.05] p-3"><dt className="text-[10px] font-black uppercase text-white/45">Check-in</dt><dd className="mt-1 font-black">{location.checkin_time || '—'}</dd></div><div className="rounded-2xl bg-white/[.05] p-3"><dt className="text-[10px] font-black uppercase text-white/45">Check-out</dt><dd className="mt-1 font-black">{location.checkout_time || '—'}</dd></div></> : <><div className="rounded-2xl bg-white/[.05] p-3"><dt className="text-[10px] font-black uppercase text-white/45">Today</dt><dd className="mt-1 font-black">{location.closed_today ? 'Closed today' : 'Open today'}</dd></div><div className="rounded-2xl bg-white/[.05] p-3"><dt className="text-[10px] font-black uppercase text-white/45">Hours</dt><dd className="mt-1 font-black">{location.opens_at || '—'} – {location.closes_at || '—'}</dd></div><div className="rounded-2xl bg-white/[.05] p-3"><dt className="text-[10px] font-black uppercase text-white/45">Entry fee</dt><dd className="mt-1 font-black">{money || '—'}</dd></div><div className="rounded-2xl bg-white/[.05] p-3"><dt className="text-[10px] font-black uppercase text-white/45">Visit length</dt><dd className="mt-1 font-black">{location.typical_duration_minutes ?? '—'} min</dd></div></>}
      <div className="rounded-2xl bg-white/[.05] p-3"><dt className="text-[10px] font-black uppercase text-white/45">Distance</dt><dd className="mt-1 font-black">{location.distance_km ?? location.distance_to_centre_km ?? '—'} km</dd></div><div className="rounded-2xl bg-white/[.05] p-3"><dt className="text-[10px] font-black uppercase text-white/45">Accessibility</dt><dd className="mt-1 font-black">{location.accessibility || '—'}</dd></div>
    </dl>
    {location.address_line && <p className="mt-4 rounded-2xl bg-white/[.05] p-3 text-sm font-bold text-white/75">{location.address_line}</p>}
    {tags.length > 0 && <div className="mt-4 flex flex-wrap gap-2">{tags.map(tag => <span key={tag} className="rounded-full border border-white/15 px-3 py-1 text-[10px] font-black uppercase text-white/65">{tag}</span>)}</div>}
    {(location.lat || location.lng) && <p className="mt-6 font-mono text-[11px] text-white/40">{location.lat}, {location.lng}</p>}
  </aside>
}

function LegacyArriveScreen2({ ctx, places, brief, geo, go, onCity }) {
  const [photo, setPhoto] = useState('/cities/' + slugify(ctx?.city?.name) + '.jpg')
  const [selectedLocation, setSelectedLocation] = useState(null)
  useEffect(() => setPhoto('/cities/' + slugify(ctx?.city?.name) + '.jpg'), [ctx?.city?.name])
  const event = brief?.events_today?.[0]
  const active = PRESETS.find(p => Math.abs(p.lat - geo.coords.lat) < .0001 && Math.abs(p.lng - geo.coords.lng) < .0001)
  const locations = places?.pois || []
  const acquired = geo.locationSource === LOCATION_SOURCE.GEOLOCATION && geo.syncState === SYNC_STATE.SUCCESS
  const locationLabel = geo.syncState === SYNC_STATE.REQUESTING ? 'Acquiring GPS coordinates…' : acquired ? '✓ Location acquired' : 'Use my exact location'
  return <div className="relative min-h-[calc(100vh-74px)] overflow-hidden rounded-b-[2rem]"><img src={photo} onError={() => setPhoto('/cities/default.jpg')} alt="" className="absolute inset-0 h-full w-full object-cover opacity-60 transition-opacity duration-700"/><div className="absolute inset-0 bg-gradient-to-b from-[#080b0a]/15 via-[#080b0a]/65 to-[#080b0a]"/><div className="relative mx-auto grid min-h-[calc(100vh-74px)] max-w-[1600px] gap-8 px-5 py-10 lg:grid-cols-[1fr_400px] lg:items-center lg:px-10"><section className="flex min-h-[430px] max-w-3xl flex-col justify-center"><p className="text-[11px] font-black uppercase tracking-[.22em] text-lime-300">You are in</p><h1 className="mt-4 text-5xl font-extrabold uppercase leading-[.92] tracking-[-.06em] text-white sm:text-7xl lg:text-[6.5rem]">{ctx?.city?.name || geo.selectedCity}</h1><p className="mt-6 text-base font-bold text-white/90">{String(ctx?.season || '').replaceAll('_', ' ')} · {String(ctx?.weather_today?.condition || '').replaceAll('_', ' ')} · {ctx?.date}</p><div className="mt-6 flex flex-wrap items-center gap-3">{event && <span className="rounded-full bg-[#ff6b57] px-4 py-2 text-xs font-black text-white">Happening now: {event.name}</span>}{brief?.advisory_state && brief.advisory_state !== 'none' && <span className="rounded-full bg-amber-300 px-4 py-2 text-xs font-black text-black">Advisory: {brief.advisory_state}</span>}</div><button type="button" onClick={() => go('briefing')} disabled={!ctx} className="mt-8 w-fit rounded-full bg-lime-300 px-6 py-4 text-xs font-black uppercase tracking-widest text-black transition hover:bg-white disabled:opacity-40">Open briefing ↗</button><button type="button" onClick={geo.requestLocation} disabled={geo.syncState === SYNC_STATE.REQUESTING || acquired} aria-live="polite" className={`mt-4 w-fit rounded-full border px-5 py-3 text-sm font-black transition ${acquired ? 'border-emerald-300/50 bg-emerald-300/15 text-emerald-100' : 'border-white/20 bg-black/20 text-white/85 hover:border-lime-300 hover:text-white'}`}>{locationLabel}</button>{acquired && <p className="mt-2 text-xs font-bold text-emerald-100/75" aria-live="polite">{geo.coords.lat.toFixed(4)}, {geo.coords.lng.toFixed(4)}</p>}{geo.error && <p role="alert" className="mt-2 text-xs font-bold text-rose-200">{geo.error}</p>}</section><section className="glass min-h-[430px] rounded-[2rem] p-4"><div className="mb-3 flex items-center justify-between"><p className="text-[10px] font-black uppercase tracking-[.2em] text-white/60">Nearby on the map</p><span className="text-xs font-bold text-white/50">{locations.slice(0, 6).length} pins</span></div>{places ? <PlaceMap lang="en-IN" pois={locations.slice(0, 6)} centre={ctx?.city} at={ctx?.at || '15:00'} onSelect={id => setSelectedLocation(locations.find(location => location.poi_id === id) || null)}/> : <div className="grid h-64 place-items-center rounded-2xl border border-white/10 bg-black/20 text-sm font-bold text-white/50">Loading places…</div>}</section><section className="lg:col-span-2"><div className="flex snap-x gap-3 overflow-x-auto pb-2">{PRESETS.map(city => <button key={city.label} type="button" onClick={() => onCity(city)} aria-pressed={active?.label === city.label} className={`relative h-28 min-w-[190px] snap-start overflow-hidden rounded-2xl border-2 text-left ${active?.label === city.label ? 'border-lime-300' : 'border-white/15'}`}><img src={'/cities/' + slugify(city.label) + '.jpg'} onError={e => { e.currentTarget.src = '/cities/default.jpg' }} alt="" className="absolute inset-0 h-full w-full object-cover opacity-55"/><span className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent"/><span className="absolute bottom-3 left-3"><span className="block font-black text-white">{city.label}</span><span className="text-xs font-bold text-white/65">{city.state}</span></span></button>)}</div><p className="mt-3 text-xs font-bold text-white/55">Select a pin to view the exact hours, entry fee, accessibility and other fields returned by the backend.</p></section></div><LocationDetailDrawer location={selectedLocation} onClose={() => setSelectedLocation(null)}/></div>
}

function ArriveScreen(props) {
  const locations = props.places?.pois || []
  return <div><LegacyArriveScreen2 {...props}/>{locations.length > 0 && <section className="mx-auto max-w-[1600px] px-5 pb-8 sm:px-10"><div className="rounded-[2rem] border border-white/10 bg-white/[.04] p-5 backdrop-blur-xl"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[.2em] text-lime-300">From the city record</p><h2 className="mt-2 text-2xl font-black tracking-[-.04em]">Start with what is actually nearby.</h2></div><span className="text-xs font-bold text-white/45">{locations.length} indexed places</span></div><div className="mt-4 grid gap-3 sm:grid-cols-3">{locations.slice(0, 3).map(location => <div key={location.poi_id} className="rounded-2xl border border-white/10 bg-black/20 p-4"><p className="font-black">{location.name}</p><p className="mt-2 text-xs font-bold uppercase tracking-widest text-white/50">{String(location.poi_category || '').replaceAll('_', ' ')} · {location.opens_at || '—'}–{location.closes_at || '—'}</p></div>)}</div></div></section>}</div>
}

function LegacyArriveScreen({ ctx, places, brief, geo, go, onCity, judges }) {
  const [photo, setPhoto] = useState(`/cities/${slugify(ctx?.city?.name)}.jpg`); useEffect(() => setPhoto(`/cities/${slugify(ctx?.city?.name)}.jpg`), [ctx?.city?.name]); const event = brief?.events_today?.[0]; const active = PRESETS.find(p => Math.abs(p.lat - geo.coords.lat) < .0001 && Math.abs(p.lng - geo.coords.lng) < .0001)
  return <div className="relative min-h-[calc(100vh-74px)] overflow-hidden rounded-b-[2rem]"><img src={photo} onError={() => setPhoto('/cities/default.jpg')} alt="" className="absolute inset-0 h-full w-full object-cover opacity-60 transition-opacity duration-700"/><div className="absolute inset-0 bg-gradient-to-b from-[#080b0a]/15 via-[#080b0a]/65 to-[#080b0a]"/><div className="relative mx-auto grid min-h-[calc(100vh-74px)] max-w-[1600px] gap-8 px-5 py-10 lg:grid-cols-[1fr_400px] lg:items-center lg:px-10"><section className="max-w-3xl"><p className="text-[11px] font-black uppercase tracking-[.3em] text-lime-300">You are in</p><h1 className="mt-4 text-6xl font-black uppercase leading-[.88] tracking-[-.08em] text-white sm:text-8xl">{ctx?.city?.name || geo.selectedCity}</h1><p className="mt-6 text-base font-bold text-white/75">{String(ctx?.season || '').replaceAll('_', ' ')} · {String(ctx?.weather_today?.condition || '').replaceAll('_', ' ')} · {ctx?.date}</p><div className="mt-6 flex flex-wrap items-center gap-3">{event && <span className="rounded-full bg-[#ff6b57] px-4 py-2 text-xs font-black text-white">Happening now: {event.name}</span>}{brief?.advisory_state && brief.advisory_state !== 'none' && <span className="rounded-full bg-amber-300 px-4 py-2 text-xs font-black text-black">Advisory: {brief.advisory_state}</span>}</div><button type="button" onClick={() => go('briefing')} disabled={!ctx} className="mt-8 rounded-full bg-lime-300 px-6 py-4 text-xs font-black uppercase tracking-widest text-black transition hover:bg-white disabled:opacity-40">Open briefing ↗</button><button type="button" onClick={geo.requestLocation} disabled={geo.syncState === SYNC_STATE.REQUESTING} className="mt-4 block text-sm font-black text-white/70 underline decoration-white/25 underline-offset-4 hover:text-white">{geo.syncState === SYNC_STATE.REQUESTING ? 'Acquiring location…' : 'Use my exact location'}</button>{geo.error && <p role="alert" className="mt-2 text-xs font-bold text-rose-200">{geo.error}</p>}</section><section className="glass rounded-[2rem] p-4"><div className="mb-3 flex items-center justify-between"><p className="text-[10px] font-black uppercase tracking-[.2em] text-white/60">Nearby on the map</p><span className="text-xs font-bold text-white/50">{places?.pois?.slice(0, 6).length || 0} pins</span></div>{places ? <PlaceMap lang="en-IN" pois={(places.pois || []).slice(0, 6)} centre={ctx?.city} at={ctx?.at || '15:00'}/> : <div className="grid h-64 place-items-center rounded-2xl border border-white/10 bg-black/20 text-sm font-bold text-white/50">Loading places…</div>}</section><section className="lg:col-span-2"><div className="flex snap-x gap-3 overflow-x-auto pb-2">{PRESETS.map(city => <button key={city.label} type="button" onClick={() => onCity(city)} aria-pressed={active?.label === city.label} className={`relative h-28 min-w-[190px] snap-start overflow-hidden rounded-2xl border-2 text-left ${active?.label === city.label ? 'border-lime-300' : 'border-white/15'}`}><img src={`/cities/${slugify(city.label)}.jpg`} onError={e => { e.currentTarget.src = '/cities/default.jpg' }} alt="" className="absolute inset-0 h-full w-full object-cover opacity-55"/><span className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent"/><span className="absolute bottom-3 left-3"><span className="block font-black text-white">{city.label}</span><span className="text-xs font-bold text-white/65">{city.state}</span></span></button>)}</div><p className="mt-3 text-xs font-bold text-white/55">Drag the date in the top bar to travel through time.</p></section></div></div>
}

function LegacyBriefingScreen({ brief, ctx, date, lang, setDate, loadBriefing, loading, grounding, toggleGrounding, briefingText }) {
  const [activeSentence, setActiveSentence] = useState(-1)
  return <div className="space-y-6"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-[10px] font-black uppercase tracking-[.3em] text-lime-300">Briefing / {date}</p><h1 className="mt-3 text-5xl font-black tracking-[-.07em]">{brief?.city || ctx?.city?.name}</h1></div><div className="flex flex-wrap items-center gap-2"><Reader text={briefingText} lang={lang} onSentence={setActiveSentence}/><button type="button" onClick={toggleGrounding} aria-pressed={grounding} className={`rounded-full border px-4 py-2 text-xs font-black ${grounding ? 'border-emerald-300/40 text-emerald-300' : 'border-amber-300/40 text-amber-200'}`}>{grounding ? 'Grounding on' : 'Grounding off'}</button></div></div>{activeSentence >= 0 && <div className="rounded-2xl border border-orange-200/25 bg-orange-300/10 p-4"><p className="text-[10px] font-black uppercase tracking-[.2em] text-orange-200">Now reading</p><p className="mt-2 text-sm font-bold leading-6 text-orange-50">{splitSentences(briefingText)[activeSentence]}</p></div>}<div className="glass rounded-3xl p-4"><DateScrubber lang={lang} date={date} range={ctx?.date_range} events={brief?.events_today || []} onChange={value => { setDate(value); loadBriefing(value) }}/></div>{loading && !brief ? <Loading/> : brief ? <>{brief.events_today?.length ? <div className="rounded-2xl border border-[#ff6b57]/40 bg-[#ff6b57]/10 p-4 text-sm font-bold text-orange-50">{brief.events_today.map(e => `${e.name} · ${e.start_date}–${e.end_date}`).join(' · ')}</div> : <div className="rounded-2xl border border-white/10 bg-white/[.04] p-4 text-sm font-bold text-white/65">No events on your dates.</div>}{SECTIONS.map(key => { const section = brief.sections?.[key]; if (!section) return null; if (section.type !== 'answer') return <article key={key} className="rounded-3xl border-l-2 border-rose-300 bg-rose-400/10 p-5"><h2 className="text-lg font-black">{t(lang, key)}</h2><p className="mt-3 text-sm text-white/75">{section.message}</p></article>; const text = section.claims.map(c => c.text).join(' '); const sources = [...new Set(section.claims.flatMap(c => c.source_labels || []))]; return <article key={key} className="glass rounded-3xl p-5"><h2 className="text-lg font-black">{t(lang, key)}</h2><p className="mt-3 max-w-3xl text-sm leading-7 text-white/80">{text}</p><SourceReceipt sources={sources}/></article> })}</> : <div className="rounded-3xl border border-white/10 p-6 text-white/60">No briefing loaded yet.</div>}</div>
}

function NearbyScreen({ places, loading, lang }) {
  const [selectedLocation, setSelectedLocation] = useState(null)
  return <div className="space-y-7"><div><p className="text-[10px] font-black uppercase tracking-[.3em] text-lime-300">Nearby</p><h1 className="mt-3 text-5xl font-black tracking-[-.07em]">Places to visit.</h1></div>{loading && !places ? <Loading/> : <><section><div className="mb-3 flex items-center justify-between"><h2 className="text-2xl font-black">Places to visit</h2><span className="text-xs font-bold text-white/50">{places?.pois?.length || 0} results</span></div><div className="overflow-hidden rounded-3xl border border-white/10 bg-white/[.03]">{(places?.pois || []).map((p, i) => <button type="button" key={p.poi_id} onClick={() => setSelectedLocation(p)} className="grid w-full gap-4 border-b border-white/10 p-4 text-left last:border-b-0 hover:bg-white/[.06] sm:grid-cols-[auto_1fr_auto] sm:items-center"><span className="grid h-8 w-8 place-items-center rounded-full bg-white/[.07] font-mono text-[10px] font-black text-white/45">0{i + 1}</span><div className="min-w-0"><h3 className="truncate font-black">{p.name}</h3><p className="mt-1 text-xs font-bold uppercase tracking-widest text-white/55">{String(p.poi_category).replaceAll('_', ' ')} · {p.distance_km} km · {p.typical_duration_minutes} min</p></div><div className="flex flex-wrap gap-2 sm:justify-end"><span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${p.closed_today ? 'bg-white/10 text-white/60' : 'bg-emerald-300/15 text-emerald-200'}`}>{p.closed_today ? t(lang, 'closed') : t(lang, 'open_now')}</span><span className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-black uppercase text-white/70">{p.entry_cost === '0.00' ? t(lang, 'free') : `${p.currency} ${p.entry_cost}`}</span></div></button>)}</div></section><section><h2 className="mb-3 text-2xl font-black">Stay nearby</h2><div className="grid gap-3 md:grid-cols-2">{(places?.hotels || []).map(h => <button type="button" key={h.hotel_id} onClick={() => setSelectedLocation(h)} className="grid grid-cols-[auto_1fr] gap-4 rounded-3xl border border-white/10 bg-white/[.04] p-4 text-left hover:bg-white/[.08]"><div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-orange-300/40 to-slate-950 text-2xl">🏨</div><div><h3 className="font-black">{h.name}</h3><p className="mt-2 text-xs font-bold text-white/65">★ {h.star_rating ?? h.guest_score ?? '—'} · ⌖ {h.distance_to_centre_km} km from centre</p></div></button>)}</div></section></>}<LocationDetailDrawer location={selectedLocation} onClose={() => setSelectedLocation(null)}/></div>
}

function LegacyNearbyScreen({ places, loading, lang }) { return <div /> }

function BriefingScreen({ brief, ctx, date, lang, setDate, loadBriefing, loading, grounding, toggleGrounding, briefingText, judges, animate, onAnimated }) {
  const [activeSentence, setActiveSentence] = useState(-1)
  const [drawerClaim, setDrawerClaim] = useState(null)
  const answerSections = SECTIONS.map(key => brief?.sections?.[key]).filter(section => section?.type === 'answer')
  const typewriter = useTypewriterClaims(answerSections, Boolean(animate && brief), onAnimated)
  let claimIndex = 0
  const photo = '/cities/' + String(ctx?.city?.name || 'default').toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.jpg'
  return <div className="mx-auto max-w-[900px] space-y-6">
    <section className="relative h-[220px] overflow-hidden rounded-3xl border border-white/10"><img src={photo} onError={event => { event.currentTarget.src = '/cities/default.jpg' }} alt="" className="absolute inset-0 h-full w-full object-cover opacity-60"/><div className="absolute inset-0 bg-gradient-to-t from-[#080b0a] via-[#080b0a]/45 to-transparent"/><div className="relative flex h-full flex-col justify-end p-6"><p className="text-[10px] font-black uppercase tracking-[.3em] text-lime-300">Briefing · {date}</p><h1 className="mt-2 text-5xl font-black tracking-[-.07em]">{brief?.city || ctx?.city?.name}</h1><div className="mt-3 flex flex-wrap gap-2">{brief?.events_today?.[0] && <span className="rounded-full bg-[#ff6b57] px-3 py-1 text-[10px] font-black text-white">ON NOW · {brief.events_today[0].name}</span>}{brief?.advisory_state && brief.advisory_state !== 'none' && <span className="rounded-full bg-amber-300 px-3 py-1 text-[10px] font-black text-black">ADVISORY · {brief.advisory_state}</span>}</div></div></section>
    <div className="sticky top-[72px] z-30 flex items-center justify-between rounded-2xl border border-white/15 bg-[#121815]/90 px-4 py-3 shadow-xl backdrop-blur-xl"><span className="text-xs font-black text-white/65">Listen to this briefing</span><div className="flex items-center gap-3"><Reader text={briefingText} lang={lang} onSentence={setActiveSentence}/><button type="button" onClick={toggleGrounding} aria-pressed={grounding} className={"rounded-full border px-3 py-2 text-[10px] font-black " + (grounding ? 'border-emerald-300/40 text-emerald-300' : 'border-amber-300/40 text-amber-200')}>{grounding ? 'Grounding on' : 'Grounding off'}</button></div></div>
    {activeSentence >= 0 && <div className="rounded-2xl border border-orange-200/25 bg-orange-300/10 p-4"><p className="text-[10px] font-black uppercase tracking-[.2em] text-orange-200">Now reading</p><p className="mt-2 text-sm font-bold leading-6 text-orange-50">{splitSentences(briefingText)[activeSentence]}</p></div>}
    <div className="glass rounded-3xl p-4"><DateScrubber date={date} range={ctx?.date_range} events={brief?.events_today || []} onChange={value => { setDate(value); loadBriefing(value) }}/></div>
    {loading && !brief ? <Loading/> : brief ? <div className="space-y-4">{brief.events_today?.length ? <div className="rounded-2xl border border-[#ff6b57]/40 bg-[#ff6b57]/10 p-4 text-sm font-bold text-orange-50">{brief.events_today.map(event => event.name + ' · ' + event.start_date + '–' + event.end_date).join(' · ')}</div> : null}{SECTIONS.map(key => { const section = brief.sections?.[key]; if (!section) return null; if (section.type !== 'answer') return <article key={key} className="rounded-3xl border-l-2 border-rose-300 bg-rose-400/10 p-5"><h2 className="text-lg font-black">{t(lang, key)}</h2><p className="mt-3 text-sm leading-6 text-white/75">{section.message || 'This section could not be grounded from the available sources.'}</p></article>; const claims = section.claims || []; const sources = []; return <article key={key} className="glass rounded-3xl p-5"><h2 className="text-lg font-black">{t(lang, key)}{judges && <MvpPill>MVP · Grounded briefing with sources</MvpPill>}</h2><div className="mt-4 space-y-3 text-sm leading-7 text-white/85">{claims.map(claim => { const index = claimIndex++; const visible = typewriter.visible[index] || ''; const done = !animate || typewriter.complete || visible.length >= String(claim.text || '').length; (claim.source_labels || []).forEach(source => sources.push(source)); return <button key={index} type="button" onClick={() => { typewriter.skip(); setDrawerClaim(claim) }} className="block w-full text-left hover:text-white">{visible}{done && <sup className="ml-1 inline-flex h-5 min-w-5 cursor-pointer items-center justify-center rounded-full bg-emerald-300/20 px-1 text-[10px] font-black text-emerald-200" onClick={event => { event.stopPropagation(); setDrawerClaim(claim) }}>[{index + 1}]</sup>}</button> })}</div>{section.dropped?.length > 0 && <p className="mt-4 text-xs font-bold text-white/45">{section.dropped.length} unsupported sentence{section.dropped.length > 1 ? 's were' : ' was'} removed</p>}<SourceReceipt sources={[...new Set(sources)]}/></article> })}</div> : <div className="rounded-3xl border border-white/10 p-6 text-white/60">No briefing loaded yet.</div>}<ClaimDrawer claim={drawerClaim} onClose={() => setDrawerClaim(null)}/>
  </div>
}

function parseReason(reason) { const match = String(reason).match(/^(.*?)\s*\(([^)]+)\)\s*$/); return { text: match?.[1] || reason, source: match?.[2] || null } }
function NowScreen({ picks, places, loading, time, setTime, budget, setBudget, windowMinutes, setWindowMinutes, lang, selected, setSelected, centre }) { const visible = picks?.picks || []; return <div className="space-y-6"><div><p className="text-[10px] font-black uppercase tracking-[.3em] text-[#ff6b57]">Right now</p><h1 className="mt-3 text-5xl font-black tracking-[-.07em]">What fits the next {windowMinutes} minutes?</h1></div><div className="glass grid gap-3 rounded-3xl p-4 sm:grid-cols-[auto_1fr_auto]"><label className="text-xs font-black text-white/70">Time<input type="time" value={time} onChange={e => setTime(e.target.value)} className="mt-2 block rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-sm font-bold text-white"/></label><label className="text-xs font-black text-white/70">Up to INR {budget}<input type="range" min="0" max="2500" step="50" value={budget} onChange={e => setBudget(Number(e.target.value))} className="mt-4 block w-full accent-[#ff6b57]"/></label><div className="flex items-end gap-1">{[30, 60, 90].map(value => <button key={value} type="button" onClick={() => setWindowMinutes(value)} className={`rounded-xl px-3 py-2 text-xs font-black ${windowMinutes === value ? 'bg-[#ff6b57] text-white' : 'bg-white/10 text-white/65'}`}>{value} min</button>)}</div></div><div className="grid gap-5 lg:grid-cols-[.85fr_1.15fr]"><section className="space-y-3">{loading && !picks ? <Loading/> : visible.length ? visible.map((pick, i) => { const parsed = pick.reasons?.map(parseReason) || []; const chips = parsed.filter(item => !/km away|to reach/i.test(item.text)); const sources = parsed.map(item => item.source).filter(Boolean); return <article key={pick.poi_id || pick.name} onMouseEnter={() => setSelected(pick.poi_id)} onFocus={() => setSelected(pick.poi_id)} className={`rounded-3xl border p-4 transition ${selected === pick.poi_id ? 'border-[#ff6b57] bg-[#ff6b57]/10' : 'border-white/10 bg-white/[.04]'}`}><div className="flex items-start gap-3"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#ff6b57] text-xs font-black text-white">{i + 1}</span><div className="min-w-0 flex-1"><h2 className="font-black">{pick.name}</h2><p className="mt-1 text-xs font-bold text-white/60">{pick.distance_km} km away{pick.travel_minutes ? ` · about ${pick.travel_minutes} min to reach` : ''}</p><div className="mt-3 flex flex-wrap gap-2">{chips.slice(0, 3).map(item => <span key={item.text} className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white/80">{item.text}</span>)}</div><SourceReceipt sources={sources}/></div></div></article> }) : <div className="space-y-3"><div className="rounded-2xl border border-[#ff6b57]/40 bg-[#ff6b57]/10 p-4 text-sm font-bold text-orange-50">Opens earliest: {picks?.opens_earliest || 'No later opening time in the data.'}</div>{(picks?.excluded || []).map(item => <div key={item.name} className="rounded-2xl border border-white/10 bg-white/[.04] p-4 text-sm"><strong>{item.name}</strong> is out: {item.reason}</div>)}</div>}</section><section className="glass min-h-[420px] rounded-3xl p-3 lg:sticky lg:top-24 lg:h-[calc(100vh-130px)]"><PlaceMap lang={lang} pois={(places?.pois || []).slice(0, 10)} centre={centre} at={time} selected={selected} onSelect={setSelected} numberedIds={visible.map(p => p.poi_id)} routeTo={visible.find(p => p.poi_id === selected)}/></section></div></div> }

function LegacyAskScreen({ cityName, question, setQuestion, ask, chat, lang }) { return <div className="space-y-7"><div><p className="text-[10px] font-black uppercase tracking-[.3em] text-lime-300">Ask GeoGuide</p><h1 className="mt-3 text-5xl font-black tracking-[-.07em]">Ask about {cityName}.</h1><p className="mt-2 text-sm font-bold text-white/65">Answers are grounded or refused. No guessing.</p></div><div className="flex gap-2"><input value={question} onChange={e => setQuestion(e.target.value)} onKeyDown={e => e.key === 'Enter' && ask()} placeholder={t(lang, 'placeholder')} className="min-w-0 flex-1 rounded-full border border-white/15 bg-white/[.06] px-6 py-4 text-sm font-bold text-white placeholder:text-white/40 outline-none focus:border-lime-300"/><button type="button" onClick={() => ask()} className="rounded-full bg-lime-300 px-6 py-4 text-xs font-black uppercase tracking-widest text-black">{t(lang, 'send')}</button></div><div className="space-y-3">{chat.map((m, i) => <article key={i} className={`max-w-3xl rounded-3xl p-5 text-sm leading-7 ${m.me ? 'ml-auto bg-lime-300 font-black text-black' : 'border border-white/10 bg-white/[.04] text-white/80'}`}>{m.me ? m.text : m.answer?.type === 'answer' ? <><p>{m.answer.claims.map(c => c.text).join(' ')}</p><SourceReceipt sources={[...new Set(m.answer.claims.flatMap(c => c.source_labels || []))]}/></> : <p>{m.answer?.message || 'No grounded answer.'}</p>}</article>)}</div></div> }
function LegacyAskScreen2({ cityName, question, setQuestion, ask, chat, lang, judges, suggestions }) {
  const [drawerClaim, setDrawerClaim] = useState(null)
  const promptList = (suggestions || []).map(item => typeof item === 'string' ? { question: item } : item)
  return <div className="space-y-7"><div><p className="text-[10px] font-black uppercase tracking-[.3em] text-lime-300">Ask GeoGuide</p><h1 className="mt-3 text-5xl font-black tracking-[-.07em]">Ask about {cityName}.{judges && <MvpPill>MVP · Grounded Q&A</MvpPill>}</h1><p className="mt-2 text-sm font-bold text-white/65">Answers are grounded or refused. No guessing.</p></div><div className="flex gap-2"><input value={question} onChange={e => setQuestion(e.target.value)} onKeyDown={e => e.key === 'Enter' && ask()} placeholder={t(lang, 'placeholder')} className="min-w-0 flex-1 rounded-full border border-white/15 bg-white/[.06] px-6 py-4 text-sm font-bold text-white placeholder:text-white/40 outline-none focus:border-lime-300"/><button type="button" onClick={() => ask()} className="rounded-full bg-lime-300 px-6 py-4 text-xs font-black uppercase tracking-widest text-black">{t(lang, 'send')}</button></div><div className="space-y-3">{chat.map((message, i) => { const answer = message.answer; if (message.me) return <div key={i} className="ml-auto max-w-xl rounded-3xl bg-lime-300 p-4 text-sm font-black text-black">{message.text}</div>; if (answer?.type === 'refusal' || answer?.type === 'error') return <article key={i} className="rounded-3xl border border-white/15 bg-white/[.04] p-6"><div className="flex gap-4"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-amber-300/40 text-amber-200">⌾</div><div><h2 className="text-xl font-black">I can&apos;t answer that from my sources</h2><p className="mt-2 text-sm leading-6 text-white/70">{answer.message || 'This request is outside the grounded data available to GeoGuide.'}</p><p className="mt-4 text-[10px] font-black uppercase tracking-[.2em] text-white/40">Try one of these</p><div className="mt-2 flex flex-wrap gap-2">{suggestions.map(suggestion => <button key={suggestion} type="button" onClick={() => ask(suggestion)} className="rounded-full border border-white/15 px-3 py-2 text-xs font-black text-white/75 hover:border-lime-300">{suggestion}</button>)}</div></div></div></article>; const claims = answer?.claims || []; return <article key={i} className="max-w-3xl rounded-3xl border border-white/10 bg-white/[.04] p-5 text-sm leading-7 text-white/80"><p>{claims.map((claim, index) => <React.Fragment key={index}>{claim.text}<sup className="ml-1 inline-flex h-5 min-w-5 cursor-pointer items-center justify-center rounded-full bg-emerald-300/20 px-1 text-[10px] font-black text-emerald-200" onClick={() => setDrawerClaim(claim)}>[{index + 1}]</sup>{' '}</React.Fragment>)}</p><SourceReceipt sources={[...new Set(claims.flatMap(claim => claim.source_labels || []))]}/></article> })}</div><ClaimDrawer claim={drawerClaim} onClose={() => setDrawerClaim(null)}/></div>
}

function AskScreen(props) {
  const promptList = (props.suggestions || []).map(item => typeof item === 'string' ? { question: item } : item)
  return <div className="space-y-5"><LegacyAskScreen2 {...props} suggestions={promptList.map(item => item.question)}/>{promptList.length > 0 && <section className="mx-auto max-w-3xl rounded-3xl border border-white/10 bg-white/[.04] p-5"><p className="text-[10px] font-black uppercase tracking-[.2em] text-lime-300">Grounded FAQs for this city</p><p className="mt-2 text-sm font-bold text-white/60">Questions and answers retrieved from the backend RAG corpus.</p><div className="mt-4 space-y-3">{promptList.map(faq => <article key={faq.question} className="rounded-2xl border border-white/10 bg-black/20 p-4"><button type="button" onClick={() => props.ask(faq.question)} className="text-left text-sm font-black text-white hover:text-lime-200">{faq.question}</button>{faq.answer?.type === 'answer' ? <p className="mt-3 text-sm leading-6 text-white/80">{(faq.answer.claims || []).map(claim => claim.text).join(' ')}</p> : <p className="mt-3 text-sm leading-6 text-amber-100/75">{faq.answer?.message || 'This question was refused because the available sources did not support it.'}</p>}{faq.answer?.claims?.length > 0 && <p className="mt-3 font-mono text-[10px] text-emerald-200/75">{[...new Set(faq.answer.claims.flatMap(claim => claim.source_labels || []))].join(' · ')}</p>}</article>)}</div></section>}</div>
}

function Loading() { return <div className="space-y-3 rounded-3xl border border-white/10 bg-white/[.04] p-6"><div className="h-3 w-1/3 animate-pulse rounded bg-white/15"/><div className="h-3 w-full animate-pulse rounded bg-white/10"/><div className="h-3 w-2/3 animate-pulse rounded bg-white/10"/></div> }

function ProofDrawer({ health, grounding, onGrounding, onClose }) {
  return <aside className="fixed inset-y-0 right-0 z-[70] w-full max-w-md border-l border-white/15 bg-[#101713] p-6 shadow-2xl"><div className="flex items-start justify-between"><div><p className="text-[10px] font-black uppercase tracking-[.25em] text-lime-300">Judges view</p><h2 className="mt-2 text-3xl font-black">Proof, live.</h2></div><button type="button" onClick={onClose} className="rounded-full border border-white/15 px-3 py-2 text-xs font-black">Close</button></div><div className="mt-8 space-y-4 text-sm"><div className="rounded-2xl border border-white/10 bg-white/[.04] p-4"><p className="font-black">GET /health</p><p className="mt-2 text-white/65">Database: <strong className="text-white">{health?.db ? 'connected' : 'offline'}</strong></p><p className="text-white/65">Index: <strong className="text-white">{health?.index ? Object.values(health.index).reduce((sum, value) => sum + Number(value || 0), 0) : '—'}</strong> records</p><p className="text-white/65">LLM: <strong className="text-white">{health?.llm?.provider || '—'}</strong></p></div><div className="rounded-2xl border border-white/10 bg-white/[.04] p-4"><p className="font-black">Grounding switch</p><p className="mt-2 text-white/65">GET/POST /grounding?enabled=</p><button type="button" onClick={onGrounding} className="mt-3 rounded-full border border-emerald-300/40 px-4 py-2 text-xs font-black text-emerald-200">{grounding ? 'Grounding on · click to turn off' : 'Grounding off · click to turn on'}</button></div></div></aside>
}

function JudgesControl({ judges, setJudges, onProof }) {
  const [open, setOpen] = useState(false)
  return <div className="fixed right-4 top-[84px] z-50"><button type="button" onClick={() => setOpen(value => !value)} aria-expanded={open} className="grid h-9 w-9 place-items-center rounded-full border border-white/15 bg-[#121815]/90 text-xs font-black text-white/70 shadow-xl backdrop-blur-xl">•••</button>{open && <div className="mt-2 w-60 rounded-2xl border border-white/15 bg-[#121815] p-3 shadow-2xl"><label className="flex items-center justify-between gap-3 p-2 text-xs font-black"><span>Judges view</span><input type="checkbox" checked={judges} onChange={event => setJudges(event.target.checked)} className="h-4 w-4 accent-lime-300"/></label><button type="button" onClick={onProof} className="mt-2 w-full rounded-xl border border-white/15 px-3 py-2 text-left text-xs font-black text-white/75 hover:border-lime-300">Open Proof drawer</button></div>}</div>
}

export default function App() {
<<<<<<< HEAD
  const [tab, setTab] = useState('arrive'); const [ctx, setCtx] = useState(null); const [brief, setBrief] = useState(null); const [places, setPlaces] = useState(null); const [picks, setPicks] = useState(null); const [askSuggestions, setAskSuggestions] = useState([]); const [askFaqs, setAskFaqs] = useState([]); const [lang, setLang] = useState(() => localStorage.getItem('geoguide-language') || 'en-IN'); const [date, setDate] = useState(''); const [time, setTime] = useState('15:00'); const [budget, setBudget] = useState(1500); const [windowMinutes, setWindowMinutes] = useState(90); const [question, setQuestion] = useState(''); const [chat, setChat] = useState([]); const [loading, setLoading] = useState(false); const [error, setError] = useState(''); const [grounding, setGrounding] = useState(true); const [selected, setSelected] = useState(null); const [judges, setJudges] = useState(false); const [proofOpen, setProofOpen] = useState(false); const [health, setHealth] = useState(null); const animatedBriefings = useRef(new Set())
  const geo = useGeoLocation(PRESETS[0], () => {}); const pos = geo.coords
  const loadContext = useCallback(async (nextPos, requestedDate) => { setLoading(true); setError(''); try { const next = await api.context(nextPos.lat, nextPos.lng, requestedDate); setCtx(next); setDate(next.date); setGrounding(next.grounding_enabled); const saved = localStorage.getItem('geoguide-language'); setLang(next.languages?.some(item => item.bcp47 === saved) ? saved : (next.languages?.[0]?.bcp47 || 'en-IN')); setBrief(null); setPlaces(null); setPicks(null); setSelected(null) } catch { setError('The backend is unavailable. Start the API and retry.') } finally { setLoading(false) } }, [])
  const loadNearby = useCallback(async () => { if (!ctx) return; try { setPlaces(await api.nearby(ctx.city.city_id, pos.lat, pos.lng, date)) } catch { setError('Nearby places could not be loaded from the backend.') } }, [ctx, pos.lat, pos.lng, date])
  const loadAskSuggestions = useCallback(async (cityId, nextLang = lang) => { if (!cityId) return; try { const result = await api.askFaqs(cityId, nextLang); setAskFaqs(result.faqs || []); setAskSuggestions(result.faqs || []) } catch { setAskFaqs([]); setAskSuggestions([]) } }, [lang])
  const loadBriefing = useCallback(async (nextDate = date, nextLang = lang) => { if (!ctx) return; setLoading(true); try { setBrief(await api.briefing(ctx.city.city_id, nextLang, nextDate)) } catch { setError('Briefing could not be loaded from the backend.') } finally { setLoading(false) } }, [ctx, date, lang])
  const loadNow = useCallback(async () => { if (!ctx) return; setLoading(true); try { setPicks(await api.now(ctx.city.city_id, pos.lat, pos.lng, time, date, budget)) } catch { setError('The action engine could not be loaded from the backend.') } finally { setLoading(false) } }, [ctx, pos.lat, pos.lng, time, date, budget])
  const loadHealth = useCallback(async () => { try { setHealth(await api.health()) } catch { setHealth({ status: 'offline', db: false }) } }, [])
  useEffect(() => { loadContext(pos) }, [pos.lat, pos.lng]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (ctx && tab === 'arrive' && !places) loadNearby() }, [ctx, tab, places, loadNearby])
  useEffect(() => { if (ctx?.city?.city_id) loadAskSuggestions(ctx.city.city_id, lang) }, [ctx?.city?.city_id, lang, loadAskSuggestions])
  useEffect(() => { if (tab !== 'now' || !ctx) return; const timer = setTimeout(loadNow, 300); return () => clearTimeout(timer) }, [tab, ctx, time, budget, windowMinutes, loadNow])
  useEffect(() => { if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return; const lenis = new Lenis({ duration: 1.05, smoothWheel: true }); let id; const raf = value => { lenis.raf(value); id = requestAnimationFrame(raf) }; id = requestAnimationFrame(raf); return () => { cancelAnimationFrame(id); lenis.destroy() } }, [])
  const go = async id => { setTab(id); window.scrollTo({ top: 0, behavior: 'smooth' }); if (id === 'briefing' && !brief) await loadBriefing(); if (id === 'nearby' && !places) await loadNearby(); if (id === 'now') await loadNow() }
  const changeDate = value => { setDate(value); loadContext(pos, value) }
  const changeLanguage = value => { setLang(value); localStorage.setItem('geoguide-language', value); if (ctx) { animatedBriefings.current.add(ctx.city.city_id + '-' + date + '-' + value); loadBriefing(date, value) } }
  const briefingKey = ctx ? ctx.city.city_id + '-' + date + '-' + lang : ''
  const onAnimated = useCallback(() => { if (briefingKey) animatedBriefings.current.add(briefingKey) }, [briefingKey])
  const toggleProofGrounding = async () => { const next = !grounding; await api.setGrounding(next); setGrounding(next); await loadHealth() }
  const ask = async text => { const value = (text ?? question).trim(); if (!value || !ctx) return; setQuestion(''); setChat(c => [...c, { me: true, text: value }]); setLoading(true); try { const answer = await api.ask(value, ctx.city.city_id, lang, 'geoguide-session'); setChat(c => [...c, { me: false, answer }]) } catch { setError('Ask could not be answered by the backend.') } finally { setLoading(false) } }
  const briefingText = useMemo(() => brief ? SECTIONS.map(key => brief.sections?.[key]).filter(s => s?.type === 'answer').flatMap(s => s.claims.map(c => c.text)).join(' ') : '', [brief])
  const judgeLabel = { arrive: 'MVP · Location and context', briefing: 'MVP · Grounded briefing with sources', nearby: 'MVP · Nearby, attributed', now: 'MVP · Contextual action engine', ask: 'MVP · Grounded Q&A' }[tab]
  return <div className="min-h-screen bg-[#080b0a] text-white selection:bg-lime-300 selection:text-black"><TopNav tab={tab} go={go} ctx={ctx} date={date} lang={lang} languages={ctx?.languages} onLanguage={changeLanguage} onDate={changeDate} onCity={city => geo.selectPreset(city)}/><JudgesControl judges={judges} setJudges={setJudges} onProof={() => { setProofOpen(true); loadHealth() }}/>{judges && <div className="mx-auto flex max-w-[1600px] flex-wrap gap-2 px-5 pt-3 sm:px-10"><MvpPill>{judgeLabel}</MvpPill><MvpPill>Enhancement · Date-shift</MvpPill><MvpPill>MVP · Multilingual</MvpPill></div>}{error && <div role="alert" className="mx-auto max-w-[1600px] px-5 pt-5 sm:px-10"><div className="rounded-2xl border border-rose-300/40 bg-rose-400/10 p-4 text-sm font-bold text-rose-100">{error}</div></div>}<main className="mx-auto max-w-[1600px] px-5 py-6 sm:px-10">{tab === 'arrive' && <ArriveScreen ctx={ctx} places={places} brief={brief} geo={geo} go={go} onCity={city => geo.selectPreset(city)} judges={judges}/>} {tab === 'briefing' && <BriefingScreen brief={brief} ctx={ctx} date={date} lang={lang} setDate={changeDate} loadBriefing={loadBriefing} loading={loading} grounding={grounding} toggleGrounding={toggleProofGrounding} briefingText={briefingText} judges={judges} animate={!animatedBriefings.current.has(briefingKey)} onAnimated={onAnimated}/>} {tab === 'nearby' && <NearbyScreen places={places} loading={loading} lang={lang}/>} {tab === 'now' && <NowScreen picks={picks} places={places} loading={loading} time={time} setTime={setTime} budget={budget} setBudget={setBudget} windowMinutes={windowMinutes} setWindowMinutes={setWindowMinutes} lang={lang} selected={selected} setSelected={setSelected} centre={{ ...pos, name: ctx?.city?.name || 'Your location' }}/>} {tab === 'ask' && <AskScreen cityName={ctx?.city?.name || geo.selectedCity} question={question} setQuestion={setQuestion} ask={ask} chat={chat} lang={lang} judges={judges} suggestions={askSuggestions}/>}</main>{proofOpen && <ProofDrawer health={health} grounding={grounding} onGrounding={toggleProofGrounding} onClose={() => setProofOpen(false)}/>}</div>
=======
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
  const [theme, setTheme] = useState(() => {
    const saved = globalThis.localStorage?.getItem('geoguide-theme')
    if (saved === 'light' || saved === 'dark') return saved
    return globalThis.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })
  const [accessibilityMode, setAccessibilityMode] = useState(() =>
    globalThis.localStorage?.getItem('geoguide-accessibility') === 'true'
  )
  const [toast, setToast] = useState(null)
  const [dateChanged, setDateChanged] = useState(false)
  const [placesError, setPlacesError] = useState(false)
  const [picksError, setPicksError] = useState(false)
  const [fix, setFix] = useState(null)      // real device fix, when permission is granted
  const [sel, setSel] = useState(null)      // place selected on the map or in a list
  const [journeySelected, setJourneySelected] = useState(JOURNEY_WAYPOINTS[0].id)
  const chatEnd = useRef(null)

  const flash = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2600) }

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    globalThis.localStorage?.setItem('geoguide-theme', theme)
  }, [theme])
  useEffect(() => {
    globalThis.localStorage?.setItem('geoguide-accessibility', String(accessibilityMode))
    document.documentElement.dataset.accessibility = accessibilityMode ? 'true' : 'false'
  }, [accessibilityMode])

  const toggleTheme = () => setTheme(current => current === 'dark' ? 'light' : 'dark')

  const loadContext = useCallback(async (p, d) => {
    try {
      const c = await api.context(p.lat, p.lng, d, new Date().toTimeString().slice(0, 5))
      setCtx(c); setDate(c.date); setOffline(false); setGrounding(c.grounding_enabled)
      api.dates(c.city.city_id).then(setDateInfo).catch(() => {})
      return c
    } catch { setOffline(true); return null }
  }, [])

  useEffect(() => { loadContext(pos) }, [])                     // eslint-disable-line

  const locate = () => {
    if (!navigator.geolocation) return flash('This browser has no geolocation')
    navigator.geolocation.getCurrentPosition(
      p => {
        const n = { name: null, lat: p.coords.latitude, lng: p.coords.longitude }
        setFix({ lat: p.coords.latitude, lng: p.coords.longitude, accuracy: Math.round(p.coords.accuracy) })
        setPos(n); loadContext(n, date); flash('Location captured')
      },
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
    setDateChanged(true)
    window.setTimeout(() => setDateChanged(false), 1800)
    await fetchBriefing(d)
    if (tab === 'nearby' && ctx) api.nearby(ctx.city.city_id, pos.lat, pos.lng, d).then(setPlaces).catch(() => setPlacesError(true))
    if (tab === 'now' && ctx) api.now(ctx.city.city_id, pos.lat, pos.lng, at, d, budget).then(setPicks).catch(() => setPicksError(true))
  }

  const refreshPicks = useCallback(async (time = at, b = budget, d = date) => {
    if (!ctx) return
    try { setPicksError(false); setPicks(await api.now(ctx.city.city_id, pos.lat, pos.lng, time, d, b)) } catch { setPicksError(true) }
  }, [ctx, pos, at, budget, date])

  const go = async (id) => {
    setTab(id)
    if (!ctx) return
    if (id === 'briefing' && !brief) fetchBriefing()
    if (id === 'nearby') {
      setPlacesError(false)
      api.nearby(ctx.city.city_id, pos.lat, pos.lng, date).then(setPlaces).catch(() => { setPlacesError(true); setOffline(true) })
    }
    if (id === 'now') {
      setPicksError(false)
      refreshPicks()
      if (!places) api.nearby(ctx.city.city_id, pos.lat, pos.lng, date).then(setPlaces).catch(() => setPlacesError(true))
    }
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
    <div className={`app-root ${accessibilityMode ? 'accessibility-mode' : ''}`}>
      <div className="field" aria-hidden="true"><span /><span /><span /><span /></div>

      <header className="topbar">
        <div className="inner">
          <span className="brand"><Icon name="compass" size={20} style={{ color: 'var(--moss)' }} /> GeoGuide</span>
          {ctx && <span className="pill">{ctx.city.name}</span>}
          {date && <span className="pill">{date}</span>}
          <button className="btn ghost theme-toggle" onClick={toggleTheme}
                  aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
                  title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}>
            <span className={`theme-glyph ${theme}`} aria-hidden="true" />
            <span className="theme-label">{theme === 'dark' ? t(lang, 'light_theme') : t(lang, 'dark_theme')}</span>
          </button>
          <button className={`btn ghost accessibility-toggle ${accessibilityMode ? 'on' : ''}`}
                  onClick={() => setAccessibilityMode(current => !current)}
                  aria-label={accessibilityMode ? 'Disable accessibility mode' : 'Enable accessibility mode'}
                  aria-pressed={accessibilityMode}
                  title={accessibilityMode ? 'Disable accessibility mode' : 'Enable accessibility mode'}>
            <Icon name="eye" size={17} />
          </button>
          <button className={`btn ghost ${voice ? 'on' : ''}`} onClick={() => setVoice(v => !v)}
                  aria-label={t(lang, 'voice')}><Icon name="speaker" size={16} /></button>
        </div>
      </header>

      <aside className="desktop-rail" aria-label="Primary navigation">
        <div className="rail-brand"><Icon name="compass" size={21} /></div>
        <span className="rail-label">Explore</span>
        {TABS.map(x => (
          <button key={x.id} className={`rail-item ${tab === x.id ? 'on' : ''}`} onClick={() => go(x.id)}
                  aria-label={t(lang, x.label)} aria-current={tab === x.id ? 'page' : undefined}>
            <Icon name={x.icon} size={18} /><span>{t(lang, x.label)}</span>
          </button>
        ))}
        <div className="rail-spacer" />
        <span className="rail-caption">GEOGUIDE<br />FIELD NOTES</span>
      </aside>

      <main className={`shell ${tab === 'arrive' ? 'dashboard-shell' : ''}`}>
        {offline && <div className="banner warn">{t(lang, 'offline')}</div>}
        {!grounding && <div className="banner clay">{t(lang, 'grounding_off')} — {t(lang, 'proof')}</div>}

        {tab === 'arrive' && (
          <div className="dashboard-arrive">
            {ctx && (
              <div className="arrive-context reveal" aria-label="Current context">
                <div className="context-cell"><Icon name="calendar" size={17} /><span><b>{ctx.date}</b><small>today</small></span></div>
                <div className="context-cell"><Icon name="compass" size={17} /><span><b>{String(ctx.season).replace('_', ' ')}</b><small>season framing</small></span></div>
                <div className="context-cell"><Icon name="cloud" size={17} /><span><b>{ctx.weather_today ? String(ctx.weather_today.condition).replace('_', ' ') : '—'}</b><small>{ctx.weather_today?.temp_max_c != null ? `${ctx.weather_today.temp_min_c}–${ctx.weather_today.temp_max_c}°C` : 'ambient weather'}</small></span></div>
              </div>
            )}
            {ctx ? (
              <HereNow ctx={ctx} lang={lang}
                       onOpenBriefing={() => { setTab('briefing'); fetchBriefing() }}
                       onOpenNow={() => go('now')} />
            ) : <Skeleton />}

            <section className="journey-panel reveal">
              <JourneyTimeline waypoints={JOURNEY_WAYPOINTS} selectedId={journeySelected} onSelect={setJourneySelected} />
              <JourneyMap waypoints={JOURNEY_WAYPOINTS} selectedId={journeySelected} onSelect={setJourneySelected} />
            </section>

            <section className="panel solid reveal location-hero">
              <div className="location-copy">
                <span className="eyebrow">Start with your signal</span>
                <h2>Find your place in the city</h2>
                <p className="muted">{t(lang, 'permission_why')}</p>
              </div>
              <button className="location-target" onClick={locate}>
                <span className="target-mark"><span className="target-pulse" /><Icon name="target" size={27} /></span>
                <span><b>{fix ? 'Re-detect location' : t(lang, 'use_location')}</b><small>Private, one-tap city matching</small></span>
                <span className="target-arrow" aria-hidden="true">→</span>
              </button>
              <div className="location-meta">
                <span><Icon name="shield" size={14} /> Device-only permission</span>
                {fix && <span className="fix-badge">Signal locked · ±{fix.accuracy} m</span>}
              </div>
              {fix && (
                <dl className="kv">
                  <dt>{t(lang, 'coords')}</dt>
                  <dd>{fix.lat.toFixed(5)}, {fix.lng.toFixed(5)} <span className="muted">±{fix.accuracy} m</span></dd>
                  <dt>{t(lang, 'resolved')}</dt>
                  <dd>{ctx?.city?.name} <span className="muted">· {ctx?.city?.distance_km} km {t(lang, 'from_centre')}</span></dd>
                </dl>
              )}
            </section>

            <section className="panel reveal trust-panel">
              <span className="eyebrow">{t(lang, 'cities')}</span>
              <div className="city-grid editorial-city-grid" style={{ marginTop: 14 }}>
                {PRESETS.map(p => (
                  <button key={p.name} className={`city-card ${ctx?.city?.name === p.name ? 'on' : ''}`}
                          onClick={() => pickCity(p)}>
                    <span className="city-card-top"><span className={`status-dot ${p.tone}`} /><span className={`city-status ${p.tone}`}>{p.status}</span></span>
                    <b>{p.name}</b><span className="muted">{p.note}</span><span className="city-card-arrow" aria-hidden="true">↗</span>
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
            </section>

            <section className="panel tight reveal advanced-panel">
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
          </div>
        )}

        {tab === 'briefing' && (
          <>
            <DateScrubber lang={lang} date={date} range={brief?.date_range || ctx?.date_range}
                          events={dateInfo?.events} onChange={changeDate} changed={dateChanged} />
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
              <div className="at-glance">
                <div><span className="eyebrow">{t(lang, 'at_glance')}</span><span className="muted">{t(lang, 'signals_for')} {brief?.date || date}</span></div>
              </div>
              <div className="strip signal-strip">
                <div className="stat"><div className="k">{t(lang, 'events')}</div>
                  <div className="v">{brief?.events_today?.length || 0}</div></div>
                <div className="stat"><div className="k">season</div>
                  <div className="v">{String(brief?.season || ctx?.season || '—').replace('_', ' ')}</div></div>
                <div className="stat"><div className="k">{t(lang, 'safety')}</div>
                  <div className="v">{brief?.advisory_state && brief.advisory_state !== 'none'
                    ? brief.advisory_state : t(lang, 'no_advisory')}</div></div>
                <div className="stat"><div className="k">{t(lang, 'grounding_toggle')}</div>
                  <div className="v">
                    <button className={`btn ghost ${grounding ? 'on' : ''}`} style={{ padding: '2px 10px' }}
                            onClick={toggleGrounding}>{grounding ? 'ON' : 'OFF'}</button>
                  </div></div>
              </div>
              {voice && briefingText && <div style={{ marginTop: 12 }}><Speak text={briefingText} lang={lang} /></div>}
            </section>

            {busy && <><div className="banner warn">{t(lang, 'generating')}</div><Skeleton /><Skeleton /></>}
            {!busy && brief && SECTIONS.map(s => (
              <SectionCard key={s} name={s} data={brief.sections?.[s]} lang={lang} voice={voice} />
            ))}
          </>
        )}

        {tab === 'nearby' && (
          <>
            <section className="panel reveal">
              <PlaceMap lang={lang} pois={places?.pois || []} hotels={places?.hotels || []}
                        centre={{ lat: pos.lat, lng: pos.lng, name: ctx?.city?.name }}
                        at={at} selected={sel} onSelect={setSel} />
            </section>
            <section className="panel solid reveal">
              <h2>{t(lang, 'places')}</h2>
              {placesError && <div className="banner clay">{t(lang, 'offline')}</div>}
              {!placesError && places && !(places.pois || []).length && (
                <EmptyState icon="compass" title={t(lang, 'places')} message={t(lang, 'nothing_fits')} />
              )}
              {(places?.pois || []).map(p => (
                <div className={`item ${sel === p.poi_id ? 'sel' : ''}`} key={p.poi_id}
                     onClick={() => setSel(p.poi_id)}>
                  <div className="spread">
                    <b>{p.name}</b>
                    <span className="muted">{p.distance_km} km</span>
                  </div>
                  <dl className="kv">
                    <dt>hours</dt><dd>{p.opens_at}–{p.closes_at || '—'}</dd>
                    <dt>entry</dt><dd>{p.entry_cost === '0.00' ? t(lang, 'free') : `${p.currency} ${p.entry_cost}`}</dd>
                    <dt>typical visit</dt><dd>{p.typical_duration_minutes} min</dd>
                    <dt>type</dt><dd>{String(p.poi_category).replace('_', ' ')}</dd>
                  </dl>
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
              <Clock lang={lang} value={at} window={90}
                     onChange={v => { setAt(v); refreshPicks(v, budget) }} />
              <div className="spread" style={{ marginTop: 16 }}>
                <span className="eyebrow">{t(lang, 'budget')}</span>
                <b>INR {budget}</b>
              </div>
              <input type="range" min="0" max="2500" step="50" value={budget}
                     onChange={e => { setBudget(Number(e.target.value)); refreshPicks(at, Number(e.target.value)) }} />
              <p className="muted" style={{ marginTop: 8 }}>
                Ranking is computed from the data — no model — so it re-ranks instantly and reproducibly.
              </p>
              <PlaceMap lang={lang} pois={places?.pois || []} hotels={[]}
                        centre={{ lat: pos.lat, lng: pos.lng, name: ctx?.city?.name }}
                        at={at} selected={sel} onSelect={setSel} />
            </section>
            <section className="panel solid reveal now-feature">
              <div className="now-header">
                <div><span className="eyebrow">{t(lang, 'signature_signal')}</span><h2>{t(lang, 'now')}</h2><p className="muted">{t(lang, 'ranked_shortlist')}</p></div>
                <span className="now-orbit"><Icon name="clock" size={20} /></span>
              </div>
              {picksError && <div className="banner clay">{t(lang, 'offline')}</div>}
              {(picks?.picks || []).map((p, i) => (
                <div className="item recommendation-card" key={p.poi_id}>
                  <div className="spread">
                    <span className="row" onClick={() => setSel(p.poi_id)} style={{ cursor: 'pointer' }}>
                      <span className="rank">{i + 1}</span><b>{p.name}</b></span>
                    <span className="muted">{p.distance_km} km</span>
                  </div>
                  <div>{p.reasons.map(r => <span className="reason" key={r}>{r}</span>)}</div>
                  <div><SourceChip label={p.source_label} /></div>
                </div>
              ))}
              {!picks && !picksError && <Skeleton />}
              {picks && picks.picks.length === 0 && (
                <div>
                  <h3><Icon name="clock" size={18} style={{ color: 'var(--clay)' }} /> {t(lang, 'nothing_open')} — {picks.at}</h3>
                  <p className="muted" style={{ marginTop: 6 }}>{t(lang, 'nothing_fits')}</p>
                  <p className="eyebrow" style={{ marginTop: 14 }}>{t(lang, 'why_excluded')}</p>
                  {(picks.excluded || []).map(e => (
                    <div className="item" key={e.name}>
                      <div className="spread"><b>{e.name}</b><span className="muted">{e.distance_km} km</span></div>
                      <span className="reason">{e.reason}</span>
                    </div>
                  ))}
                  <p className="eyebrow" style={{ marginTop: 14 }}>{t(lang, 'opens_earliest')}</p>
                  {(picks.opens_earliest || []).map(e => (
                    <div className="item" key={e.poi_id}>
                      <div className="spread"><b>{e.name}</b><span className="muted">{e.distance_km} km</span></div>
                      <span className="reason">opens {e.opens_at} · closes {e.closes_at || '—'}</span>
                    </div>
                  ))}
                  <button className="btn cta" style={{ marginTop: 14 }}
                          onClick={() => { setAt('15:00'); refreshPicks('15:00', budget) }}>
                    {t(lang, 'jump_afternoon')}
                  </button>
                  <div><SourceChip label="activities_poi" /></div>
                </div>
              )}
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
    </div>
  )
>>>>>>> origin/master
}
