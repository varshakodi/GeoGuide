import React from 'react'

// Small stroked icon set, inline so nothing loads from a network.
const P = {
  pin: 'M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11Z M12 10.5a1.8 1.8 0 1 0 0-3.6 1.8 1.8 0 0 0 0 3.6Z',
  book: 'M4 5.5A2 2 0 0 1 6 3.5h13v15H6a2 2 0 0 0-2 2v-15Z M19 18.5H6',
  star: 'M12 4.5l2.3 4.7 5.2.8-3.8 3.6.9 5.1-4.6-2.4-4.6 2.4.9-5.1L2.5 10l5.2-.8L12 4.5Z',
  calendar: 'M4.5 6.5h15v13h-15z M4.5 10.5h15 M8.5 4v4 M15.5 4v4',
  cloud: 'M7 17.5h9.5a3.5 3.5 0 0 0 .3-7 5 5 0 0 0-9.6-1A3.5 3.5 0 0 0 7 17.5Z',
  people: 'M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z M3.5 19.5c.6-3 2.8-4.5 5.5-4.5s4.9 1.5 5.5 4.5 M16.5 7.5a2.6 2.6 0 1 1 0 5.2 M17 15c2.2.3 3.6 1.7 4 4.5',
  shield: 'M12 3.5l7 2.6v5.3c0 4.2-2.9 7.6-7 9.1-4.1-1.5-7-4.9-7-9.1V6.1l7-2.6Z',
  compass: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z M15 9l-1.8 4.2L9 15l1.8-4.2L15 9Z',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z M12 7v5.2l3.2 2',
  chat: 'M20 12c0 4-3.6 7-8 7a9.6 9.6 0 0 1-2.6-.35L5 20l1-3.3A6.6 6.6 0 0 1 4 12c0-4 3.6-7 8-7s8 3 8 7Z',
  speaker: 'M5 9.5h3l4-3.5v12l-4-3.5H5v-5Z M16 9.2a4 4 0 0 1 0 5.6',
  stop: 'M7 7h10v10H7z',
  check: 'M5 12.5l4.5 4.5L19 7.5'
}

export default function Icon({ name, size = 18, style }) {
  const d = P[name]
  if (!d) return null
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" style={style}
         stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      {d.split(' M').map((seg, i) => <path key={i} d={i === 0 ? seg : 'M' + seg} />)}
    </svg>
  )
}
