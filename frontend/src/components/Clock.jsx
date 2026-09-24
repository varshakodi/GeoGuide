import React, { useRef } from 'react'
import { t } from '../i18n.js'

const PRESETS = [['morning', '09:00'], ['noon', '12:00'], ['evening', '17:00'], ['night', '20:00']]
const R = 88, C = 110      // radius, centre of the 220x220 dial

const toMin = s => Number(s.slice(0, 2)) * 60 + Number(s.slice(3, 5))
const toStr = m => {
  const v = ((Math.round(m / 15) * 15) % 1440 + 1440) % 1440
  return `${String(Math.floor(v / 60)).padStart(2, '0')}:${String(v % 60).padStart(2, '0')}`
}
const pretty = s => {
  const h = Number(s.slice(0, 2)), m = s.slice(3, 5)
  const ampm = h < 12 ? 'AM' : 'PM'
  return `${((h + 11) % 12) + 1}:${m} ${ampm}`
}

/** A 24-hour dial: midnight at the top, noon at the bottom. Click or drag the ring
    to set the time; the shaded arc shows the 90-minute window being ranked. */
export default function Clock({ lang, value, window: win = 90, onChange }) {
  const svg = useRef(null)
  const mins = toMin(value)
  const ang = (m) => (m / 1440) * 2 * Math.PI - Math.PI          // 0:00 at top
  const pt = (m, r = R) => [C + r * Math.sin(ang(m) + Math.PI), C - r * Math.cos(ang(m) + Math.PI)]

  const set = (e) => {
    const box = svg.current.getBoundingClientRect()
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - box.left - box.width / 2
    const y = (e.touches ? e.touches[0].clientY : e.clientY) - box.top - box.height / 2
    let a = Math.atan2(x, -y)
    if (a < 0) a += 2 * Math.PI
    onChange(toStr((a / (2 * Math.PI)) * 1440))
  }
  const drag = (e) => { if (e.buttons === 1 || e.touches) set(e) }

  const [hx, hy] = pt(mins, R - 16)
  const [ex, ey] = pt(mins + win, R)
  const [sx, sy] = pt(mins, R)
  const big = win > 720 ? 1 : 0

  return (
    <div>
      <div className="row" style={{ justifyContent: 'center', gap: 18 }}>
        <svg ref={svg} width="220" height="220" viewBox="0 0 220 220" className="clock"
             onMouseDown={set} onMouseMove={drag} onTouchStart={set} onTouchMove={set}
             role="slider" aria-label={t(lang, 'at_time')} aria-valuetext={pretty(value)} tabIndex={0}
             onKeyDown={e => {
               if (e.key === 'ArrowRight' || e.key === 'ArrowUp') onChange(toStr(mins + 15))
               if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') onChange(toStr(mins - 15))
             }}>
          <circle cx={C} cy={C} r={R} fill="rgba(255,255,255,.72)" stroke="rgba(74,69,60,.18)" />
          <path d={`M ${sx} ${sy} A ${R} ${R} 0 ${big} 1 ${ex} ${ey} L ${C} ${C} Z`}
                fill="rgba(92,138,99,.20)" />
          {Array.from({ length: 24 }, (_, h) => {
            const [x1, y1] = pt(h * 60, R - 7), [x2, y2] = pt(h * 60, R - (h % 6 === 0 ? 16 : 11))
            return <line key={h} x1={x1} y1={y1} x2={x2} y2={y2}
                         stroke={h % 6 === 0 ? 'rgba(60,90,67,.75)' : 'rgba(74,69,60,.28)'} strokeWidth={h % 6 === 0 ? 2 : 1} />
          })}
          {[[0, '00'], [6, '06'], [12, '12'], [18, '18']].map(([h, lbl]) => {
            const [x, y] = pt(h * 60, R - 30)
            return <text key={h} x={x} y={y + 4} textAnchor="middle" fontSize="12" fill="var(--ink-3)">{lbl}</text>
          })}
          <line x1={C} y1={C} x2={hx} y2={hy} stroke="var(--moss)" strokeWidth="3.5" strokeLinecap="round" />
          <circle cx={C} cy={C} r="5" fill="var(--moss)" />
          <circle cx={hx} cy={hy} r="8" fill="var(--moss)" stroke="#fff" strokeWidth="2.5" />
          <text x={C} y={C + 34} textAnchor="middle" fontSize="21" fontWeight="650" fill="var(--ink)">{pretty(value)}</text>
          <text x={C} y={C + 52} textAnchor="middle" fontSize="11" fill="var(--ink-3)">{t(lang, 'window')}</text>
        </svg>
      </div>
      <div className="row" style={{ justifyContent: 'center', marginTop: 8 }}>
        <button className="btn ghost" onClick={() => onChange(toStr(mins - 30))} aria-label="30 minutes earlier">−30</button>
        {PRESETS.map(([k, v]) => (
          <button key={k} className={`btn ${value === v ? 'on' : ''}`} onClick={() => onChange(v)}>{t(lang, k)}</button>
        ))}
        <button className="btn ghost" onClick={() => onChange(toStr(mins + 30))} aria-label="30 minutes later">+30</button>
      </div>
    </div>
  )
}
