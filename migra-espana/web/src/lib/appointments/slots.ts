export interface Interval { start: Date; end: Date }
export interface WeeklyRule { weekday: number; from: string; to: string }   // weekday 0=Sun, "HH:MM" Europe/Madrid-local template

export const overlaps = (a: Interval, b: Interval) => a.start < b.end && b.start < a.end;

/** Free slots of `minutes` length inside availability windows minus existing bookings (mirrors the DB exclusion constraint). */
export function freeSlots(windows: Interval[], booked: Interval[], minutes: number, now: Date = new Date()): Interval[] {
  const out: Interval[] = [];
  const ms = minutes * 60_000;
  for (const w of windows) {
    for (let t = w.start.getTime(); t + ms <= w.end.getTime(); t += ms) {
      const slot = { start: new Date(t), end: new Date(t + ms) };
      if (slot.start <= now) continue;
      if (booked.some((b) => overlaps(slot, b))) continue;
      out.push(slot);
    }
  }
  return out;
}

/** Reminder offsets before an appointment. */
export const REMINDER_OFFSETS_MIN = [24 * 60, 60];
export const remindersFor = (start: Date) => REMINDER_OFFSETS_MIN.map((m) => new Date(start.getTime() - m * 60_000));
