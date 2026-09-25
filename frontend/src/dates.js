// Dates as people read them: "Fri 25 Sep" for a day and "17–22 Oct" for a range, the same
// format the backend's date comparison uses. The data's ISO dates are calendar days, so they
// are read as UTC; a local timezone can never move one to the day before. The spaces are
// non-breaking, so a date never splits across two lines.
const SP = '\u00a0'
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function parse(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || '').slice(0, 10))
  return m ? new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]))) : null
}

export function dayLabel(iso) {
  const d = parse(iso)
  return d ? `${DAYS[d.getUTCDay()]}${SP}${d.getUTCDate()}${SP}${MONTHS[d.getUTCMonth()]}` : String(iso || '')
}

export function spanLabel(start, end) {
  const a = parse(start)
  const b = parse(end || start)
  if (!a || !b) return [start, end].filter(Boolean).join(' – ')
  if (+a === +b) return dayLabel(start)
  if (a.getUTCMonth() === b.getUTCMonth()) return `${a.getUTCDate()}–${b.getUTCDate()}${SP}${MONTHS[b.getUTCMonth()]}`
  return `${a.getUTCDate()}${SP}${MONTHS[a.getUTCMonth()]} – ${b.getUTCDate()}${SP}${MONTHS[b.getUTCMonth()]}`
}

// Rewrites ISO dates inside a sentence ("On 2026-09-25, …" -> "On Fri 25 Sep, …"). Only the
// date's format changes; the claim and its citation stay the same.
export const prettyDates = text => String(text ?? '').replace(/\b20\d{2}-\d{2}-\d{2}\b/g, dayLabel)

// A briefing with every claim's dates made readable, so the page, the read-aloud text and
// the evidence drawer's quote all agree.
export function withPrettyDates(brief) {
  if (!brief?.sections) return brief
  const sections = Object.fromEntries(Object.entries(brief.sections).map(([key, section]) =>
    [key, section?.claims ? { ...section, claims: section.claims.map(claim => ({ ...claim, text: prettyDates(claim.text) })) } : section]))
  return { ...brief, sections }
}
