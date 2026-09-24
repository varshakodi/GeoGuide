import React, { useEffect, useState } from 'react'
import Icon from './Icon.jsx'
import { t } from '../i18n.js'

export const SourceChip = ({ label }) => (
  <span className="chip" title={`Grounded in ${label}`}><Icon name="check" size={13} /> {label}</span>
)

export const TimeBadge = ({ state, lang }) => (
  <span className={`badge ${state === 'on_now' ? 'now' : 'soon'}`}>{t(lang, state)}</span>
)

export const Caution = ({ level }) =>
  level && level !== 'none' ? <span className="badge warn">{String(level).toUpperCase()}</span> : null

export const Skeleton = () => (
  <div className="panel solid" aria-hidden="true">
    <div className="skel w40" /><div className="skel w80" /><div className="skel" /><div className="skel w60" />
  </div>
)

<<<<<<< HEAD
export function Tooltip({ label }) {
  return (
    <span className="tooltip-wrap">
      <button className="info-button" type="button" aria-label="Why this answer is trustworthy"
              aria-describedby="trust-tooltip">i</button>
      <span id="trust-tooltip" className="tooltip" role="tooltip">{label}</span>
    </span>
  )
}
=======
export const EmptyState = ({ icon = 'compass', title, message, action }) => (
  <div className="empty-state">
    <span className="empty-icon"><Icon name={icon} size={22} /></span>
    <div><h3>{title}</h3>{message && <p className="muted">{message}</p>}</div>
    {action}
  </div>
)
>>>>>>> origin/master

/** Read-aloud. Hides itself when the device has no voice for the chosen language,
    rather than producing silence and looking broken. */
export function Speak({ text, lang, compact }) {
  const [voices, setVoices] = useState([])
  const [speaking, setSpeaking] = useState(false)
  useEffect(() => {
    const load = () => setVoices(window.speechSynthesis?.getVoices() || [])
    load()
    window.speechSynthesis?.addEventListener('voiceschanged', load)
    return () => { window.speechSynthesis?.removeEventListener('voiceschanged', load); window.speechSynthesis?.cancel() }
  }, [])
  const base = String(lang).split('-')[0]
  const voice = voices.find(v => v.lang.replace('_', '-').toLowerCase().startsWith(base))
  if (!voice) return <span className="muted">{t(lang, 'no_voice')}</span>
  const go = () => {
    window.speechSynthesis.cancel()
    if (speaking) return setSpeaking(false)
    const u = new SpeechSynthesisUtterance(text)
    u.voice = voice; u.lang = voice.lang; u.rate = 0.98
    u.onend = () => setSpeaking(false)
    window.speechSynthesis.speak(u); setSpeaking(true)
  }
  return (
    <button className={`btn ${speaking ? 'on' : ''} ${compact ? 'ghost' : ''}`} onClick={go}
            aria-label={speaking ? t(lang, 'stop') : t(lang, 'read')}>
      <Icon name={speaking ? 'stop' : 'speaker'} size={16} />
      {compact ? '' : (speaking ? t(lang, 'stop') : t(lang, 'read'))}
    </button>
  )
}

const ICONS = { history: 'book', attractions: 'star', events: 'calendar',
                weather: 'cloud', culture_etiquette: 'people', safety: 'shield' }

/** One briefing section: claims, their sources, or an honest refusal. */
export function SectionCard({ name, data, lang, voice }) {
  const [showSources, setShowSources] = useState(true)
  if (!data) return null
  const title = <h3><Icon name={ICONS[name]} size={19} style={{ color: 'var(--moss)' }} />{t(lang, name)}</h3>

  if (data.type !== 'answer') {
    return (
      <section className="panel solid reveal section-card">
        {title}
        <div className="refusal" style={{ marginTop: 10 }}>{data.message || t(lang, 'no_answer')}</div>
      </section>
    )
  }
  const text = data.claims.map(c => c.text).join(' ')
  const sources = [...new Set(data.claims.flatMap(c => c.source_labels))]
  return (
    <section className="panel solid reveal section-card">
      <div className="spread">{title}{voice && <Speak text={text} lang={lang} compact />}</div>
      <p className="body" style={{ marginTop: 10 }}>{text}</p>
      <button className="btn ghost" style={{ padding: '2px 0', border: 'none' }}
              onClick={() => setShowSources(s => !s)}>
        <span className="muted">{showSources ? t(lang, 'hide_sources') : t(lang, 'show_sources')} ({sources.length})</span>
      </button>
      {showSources && <div>{sources.map(s => <SourceChip key={s} label={s} />)}</div>}
      {data.flagged && <div className="flag"><Icon name="shield" size={15} /> {t(lang, 'verify')}</div>}
    </section>
  )
}
