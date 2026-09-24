import React from 'react'
import Icon from './Icon.jsx'

const TYPE_ICONS = { stay: 'pin', pitstop: 'compass', flight: 'target' }

export default function JourneyTimeline({ waypoints, selectedId, onSelect }) {
  return (
    <aside className="journey-timeline" aria-label="Journey timeline">
      <div className="timeline-heading">
        <span className="eyebrow">Field notes</span>
        <h2>A route worth remembering</h2>
        <p className="muted">Four signals, one living itinerary.</p>
      </div>
      <div className="timeline-feed">
        {waypoints.map((waypoint, index) => (
          <button className={`timeline-card ${selectedId === waypoint.id ? 'active' : ''}`} key={waypoint.id}
                  onClick={() => onSelect(waypoint.id)} onMouseEnter={() => onSelect(waypoint.id)}>
            <span className="timeline-step">STEP {String(index + 1).padStart(2, '0')}</span>
            <div className="timeline-title"><span className="timeline-icon"><Icon name={TYPE_ICONS[waypoint.type]} size={16} /></span><strong>{waypoint.name}</strong><span className="timeline-type">{waypoint.type}</span></div>
            <div className="timeline-meta"><span>{waypoint.date}</span><span>{waypoint.weather} · {waypoint.temp}</span></div>
            <div className={`timeline-photo ${waypoint.coverImage}`} aria-hidden="true" />
            <div className="timeline-gallery">
              {waypoint.gallery.map((image, imageIndex) => <span key={`${image}-${imageIndex}`} className={`gallery-photo ${image}`} aria-hidden="true" />)}
            </div>
            <p>{waypoint.note}</p>
          </button>
        ))}
      </div>
    </aside>
  )
}
