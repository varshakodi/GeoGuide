import React, { useEffect, useRef, useState } from 'react'
import { t } from '../i18n.js'

// Text-to-speech button shared by the Briefing page and the Accessibility Briefing
// popup. Bright red when idle, white while speaking, so it is obvious that audio is
// playing. Only one reader speaks at a time: starting one stops the other.

export const splitSentences = text => String(text || '').replace(/\s+/g, ' ').match(/[^.!?।]+[.!?।]*/g)?.map(v => v.trim()).filter(Boolean) || []

// The playback currently speaking, across all readers. Cancelling speech fires a late
// 'error' on the old utterance; checking the id stops that event from ending the new one.
let active = null           // { id, finish }

function pickVoice(lang) {
  const requested = String(lang || 'en-IN').toLowerCase()
  const base = requested.split('-')[0]
  const voices = window.speechSynthesis?.getVoices?.() || []
  const score = v => Number(v.lang.toLowerCase() === requested) * 5 + Number(v.localService) * 2
    + Number(/enhanced|premium|natural|neural|google|microsoft/i.test(v.name)) * 3
  return voices.filter(v => v.lang.toLowerCase().startsWith(base)).sort((a, b) => score(b) - score(a))[0] || null
}

export default function ReadAloud({ text, lang, onSentence, className = '' }) {
  const [speaking, setSpeaking] = useState(false)
  const [voice, setVoice] = useState(null)
  const mine = useRef(null)                 // id of this reader's playback, if any

  const finish = id => {
    if (active?.id === id) active = null
    if (mine.current === id) { mine.current = null; setSpeaking(false); onSentence?.(-1) }
  }
  const stop = () => {
    const id = mine.current
    if (id && active?.id === id) window.speechSynthesis?.cancel()
    finish(id)
  }

  useEffect(() => {
    const load = () => setVoice(pickVoice(lang))
    load()
    window.speechSynthesis?.addEventListener('voiceschanged', load)
    return () => window.speechSynthesis?.removeEventListener('voiceschanged', load)
  }, [lang])
  useEffect(() => stop, [lang, text])       // new text or language: stop reading the old one

  const play = () => {
    if (speaking) { stop(); return }
    if (!voice) return
    active?.finish()                        // another reader was speaking: it stops
    window.speechSynthesis.cancel()
    const id = Symbol('read-aloud')
    mine.current = id
    active = { id, finish: () => finish(id) }
    const sentences = splitSentences(text)
    let i = 0
    const next = () => {
      if (active?.id !== id) return
      if (i >= sentences.length) { finish(id); return }
      const n = i++
      onSentence?.(n)
      const u = new SpeechSynthesisUtterance(sentences[n])
      Object.assign(u, { voice, lang: voice.lang, rate: .92, pitch: 1.02, volume: .95, onend: next, onerror: () => finish(id) })
      window.speechSynthesis.speak(u)
    }
    setSpeaking(true)
    next()
  }

  const label = !voice ? t(lang, 'no_voice') : speaking ? t(lang, 'stop') : t(lang, 'read')
  return <button type="button" onClick={play} disabled={!voice || !text} aria-pressed={speaking} title={label}
    className={`on-color inline-flex items-center gap-2 rounded-full border-2 px-4 py-2.5 text-sm font-extrabold shadow-lg transition focus:outline-none focus:ring-4 focus:ring-red-300 disabled:cursor-not-allowed disabled:opacity-60 ${speaking ? 'border-red-600 bg-white text-red-700 shadow-red-900/20' : 'border-red-600 bg-red-600 text-white shadow-red-900/30 hover:bg-red-700'} ${className}`}>
    {speaking
      ? <span className="relative flex h-2.5 w-2.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75"/><span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-600"/></span>
      : <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 9.5h3l4-3.5v12l-4-3.5H5v-5Z"/><path d="M16 9.2a4 4 0 0 1 0 5.6M18.6 6.6a7.6 7.6 0 0 1 0 10.8"/></svg>}
    <span className="max-w-[16rem] truncate">{label}</span>
  </button>
}
