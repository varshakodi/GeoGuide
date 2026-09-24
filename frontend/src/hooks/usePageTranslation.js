import { useEffect } from 'react'
import { translateTexts } from '../api.js'
import { glossary } from '../i18n.js'

// Translates the English text on screen into the chosen language through the backend's
// Sarvam endpoint. The screens keep their English JSX; this swaps text node values in
// place (never adds or removes nodes, so React's reconciliation is unaffected) and
// re-runs whenever React re-renders. Anything inside translate="no" is left alone, and
// text already in an Indic script (translated answers) is skipped.

const cache = {}                       // lang -> Map(english -> translation)
const failed = {}                      // lang -> Set of texts Sarvam could not translate
const LATIN = /[A-Za-z]/g
const INDIC = /[ऀ-෿]/g
const SKIP = new Set(['SCRIPT', 'STYLE', 'TEXTAREA', 'INPUT', 'CODE'])

const isEnglish = lang => !lang || lang.startsWith('en')
const TAIL = /[\s↗→.]*$/

// Hand-written labels from i18n.js, matched case-insensitively and ignoring a trailing arrow.
function seed(lang, known) {
  const labels = glossary(lang)
  return text => {
    const tail = text.match(TAIL)[0]
    const hit = labels.get(text.slice(0, text.length - tail.length).toLowerCase()) || labels.get(text.toLowerCase())
    if (hit) known.set(text, hit + (labels.has(text.toLowerCase()) ? '' : tail))
    return !!hit
  }
}
const needsTranslation = text => {
  const latin = (text.match(LATIN) || []).length
  return latin > 1 && latin > (text.match(INDIC) || []).length
}

function skipped(node) {
  for (let el = node.parentElement; el; el = el.parentElement) {
    if (SKIP.has(el.tagName) || el.getAttribute('translate') === 'no') return true
  }
  return false
}

// A text node's English source: what React last wrote, unless we wrote over it.
function english(node) {
  if (node.__tr !== undefined && node.nodeValue === node.__tr) return node.__en
  node.__en = node.nodeValue
  node.__tr = undefined
  return node.__en
}

function textNodes(root) {
  const out = []
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  for (let n = walker.nextNode(); n; n = walker.nextNode()) if (n.nodeValue.trim() && !skipped(n)) out.push(n)
  return out
}

function placeholders(root) {
  return [...root.querySelectorAll('input[placeholder], textarea[placeholder]')].filter(el => !skipped(el))
}

function apply(lang, root) {
  const known = cache[lang]
  for (const node of textNodes(root)) {
    const en = english(node)
    const hit = known.get(en.trim())
    if (hit) {
      const value = en.replace(en.trim(), hit)
      if (node.nodeValue !== value) { node.nodeValue = value; node.__tr = value }
    }
  }
  for (const el of placeholders(root)) {
    if (el.__en === undefined || el.placeholder !== el.__tr) el.__en = el.placeholder
    const hit = known.get(el.__en.trim())
    if (hit && el.placeholder !== hit) { el.placeholder = hit; el.__tr = hit }
  }
}

function restore(root) {
  for (const node of textNodes(root)) if (node.__tr !== undefined && node.nodeValue === node.__tr) { node.nodeValue = node.__en; node.__tr = undefined }
  for (const el of placeholders(root)) if (el.__tr !== undefined && el.placeholder === el.__tr) { el.placeholder = el.__en; el.__tr = undefined }
}

export default function usePageTranslation(lang) {
  useEffect(() => {
    const root = document.getElementById('root')
    if (!root) return undefined
    if (isEnglish(lang)) { restore(root); return undefined }
    cache[lang] = cache[lang] || new Map()
    const fromGlossary = seed(lang, cache[lang])
    failed[lang] = failed[lang] || new Set()
    const pending = new Set()
    let timer = null
    let alive = true

    const run = async () => {
      timer = null
      const known = cache[lang]
      const wanted = new Set()
      const want = t => { if (needsTranslation(t) && !known.has(t) && !failed[lang].has(t) && !fromGlossary(t)) wanted.add(t) }
      for (const node of textNodes(root)) want(english(node).trim())
      for (const el of placeholders(root)) want((el.__tr !== undefined && el.placeholder === el.__tr ? el.__en : el.placeholder).trim())
      const batch = [...wanted].filter(t => !pending.has(t)).slice(0, 200)
      observer.disconnect()
      apply(lang, root)
      observer.observe(root, OPTIONS)
      if (!batch.length) return
      batch.forEach(t => pending.add(t))
      try {
        const { translations } = await translateTexts(batch, lang)
        Object.entries(translations || {}).forEach(([en, tr]) => known.set(en, tr))
      } catch { /* backend or Sarvam unavailable: leave the English in place */ }
      // Anything not returned stays English for this session instead of being re-requested.
      batch.forEach(t => { pending.delete(t); if (!known.has(t)) failed[lang].add(t) })
      if (alive) schedule()
    }
    const schedule = () => { if (!timer) timer = setTimeout(run, 120) }
    const OPTIONS = { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['placeholder'] }
    const observer = new MutationObserver(schedule)
    observer.observe(root, OPTIONS)
    schedule()
    return () => { alive = false; observer.disconnect(); clearTimeout(timer) }
  }, [lang])
}
