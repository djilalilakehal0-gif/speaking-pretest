import { site } from '../config/site'

const toMin = (t: string) => {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

/** Current day/minute in the restaurant's time zone. */
function nowInRestaurant(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: site.timeZone, weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(date)
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? ''
  const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'))
  return { day, minute: Number(get('hour')) * 60 + Number(get('minute')) }
}

export interface OpenStatus { open: boolean; label: string; today: number }

export function openStatus(date = new Date()): OpenStatus {
  const { day, minute } = nowInRestaurant(date)
  const today = site.hours.find((h) => h.day === day)
  const yesterday = site.hours.find((h) => h.day === (day + 6) % 7)

  // Late-night service that started yesterday and runs past midnight
  if (yesterday?.open && yesterday.close) {
    const o = toMin(yesterday.open), c = toMin(yesterday.close)
    if (c < o && minute < c) return { open: true, label: `Open until ${yesterday.close}`, today: day }
  }
  if (today?.open && today.close) {
    const o = toMin(today.open), c = toMin(today.close)
    const closesAfterMidnight = c < o
    if (minute >= o && (closesAfterMidnight || minute < c)) return { open: true, label: `Open until ${today.close}`, today: day }
    if (minute < o) return { open: false, label: `Opens today at ${today.open}`, today: day }
  }
  for (let i = 1; i <= 7; i++) {
    const next = site.hours.find((h) => h.day === (day + i) % 7)
    if (next?.open) return { open: false, label: `Opens ${i === 1 ? 'tomorrow' : next.label} at ${next.open}`, today: day }
  }
  return { open: false, label: 'Closed', today: day }
}
