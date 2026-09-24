// Shown only when the API is unreachable, so the UI can always be demonstrated.
// Marked offline in the banner so nothing here is ever mistaken for a live answer.
export const FIXTURE_BRIEFING = {
  city: 'Bengaluru', date: '2026-09-24', season: 'post_monsoon', time_state: 'upcoming',
  advisory_state: 'none', language: 'en-IN', date_range: { min: '2026-09-01', max: '2026-10-30' },
  next_event: { name: 'Monsoon Music Nights', start_date: '2026-10-17' },
  sections: {
    history: { type: 'answer', flagged: false, claims: [{ text: 'Sample offline text.', source_labels: ['KV Place Guide / Bengaluru / history'] }] }
  }
}
