import React from 'react'
import { t } from '../i18n.js'

/** Mandatory enhancement: move the briefing to any date the dataset covers.
    Event weeks are offered as shortcuts so a judge can land on one immediately. */
export default function DateShift({ lang, date, range, events, onChange }) {
  if (!range) return null
  const shortcuts = (events || []).slice(0, 4)
  return (
    <div className="card">
      <div className="spread">
        <h3 style={{ margin: 0 }}>{t(lang, 'date')}</h3>
        <span className="muted">{range.min} → {range.max}</span>
      </div>
      <div className="row" style={{ marginTop: 10 }}>
        <input type="date" value={date} min={range.min} max={range.max}
               onChange={e => onChange(e.target.value)} />
        {shortcuts.map(e => (
          <button key={e.name + e.start_date} onClick={() => onChange(e.start_date)}
                  title={`${e.start_date} → ${e.end_date}`}>
            {e.name}
          </button>
        ))}
      </div>
      <p className="muted" style={{ margin: '9px 0 0' }}>
        Events, season and weather tips are recomputed from the data for this date.
      </p>
    </div>
  )
}
