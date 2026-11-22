import { describe, expect, it } from 'vitest';
import { freeSlots, overlaps, remindersFor } from './slots';

const d = (s: string) => new Date(s);
describe('slots', () => {
  const win = [{ start: d('2027-01-10T09:00:00Z'), end: d('2027-01-10T11:00:00Z') }];
  it('splits a window and removes booked slots', () => {
    const slots = freeSlots(win, [{ start: d('2027-01-10T09:30:00Z'), end: d('2027-01-10T10:00:00Z') }], 30, d('2027-01-01T00:00:00Z'));
    expect(slots.map((s) => s.start.toISOString())).toEqual(['2027-01-10T09:00:00.000Z', '2027-01-10T10:00:00.000Z', '2027-01-10T10:30:00.000Z']);
  });
  it('never offers past slots', () => {
    expect(freeSlots(win, [], 60, d('2027-01-10T09:00:00Z')).map((s) => s.start.toISOString())).toEqual(['2027-01-10T10:00:00.000Z']);
  });
  it('touching intervals do not overlap', () => expect(overlaps({ start: d('2027-01-01T10:00:00Z'), end: d('2027-01-01T11:00:00Z') }, { start: d('2027-01-01T11:00:00Z'), end: d('2027-01-01T12:00:00Z') })).toBe(false));
  it('creates 24h and 1h reminders', () => expect(remindersFor(d('2027-01-10T10:00:00Z')).map((r) => r.toISOString())).toEqual(['2027-01-09T10:00:00.000Z', '2027-01-10T09:00:00.000Z']));
});
