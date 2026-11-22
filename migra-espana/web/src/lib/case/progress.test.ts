import { describe, expect, it } from 'vitest';
import { canTransition, progressPercent, CASE_STATUSES, nextStatuses } from './progress';

describe('progressPercent', () => {
  it('is weighted by completed tasks', () => {
    expect(progressPercent([{ status: 'done', weight: 1 }, { status: 'todo', weight: 3 }])).toBe(25);
    expect(progressPercent([])).toBe(0);
    expect(progressPercent([{ status: 'done', weight: 2 }, { status: 'done', weight: 2 }])).toBe(100);
    expect(progressPercent([{ status: 'blocked', weight: 1 }])).toBe(0);
  });
});
describe('transitions', () => {
  it('cannot jump straight to approved or skip submission', () => {
    expect(canTransition('new_case', 'approved')).toBe(false);
    expect(canTransition('ready_for_submission', 'approved')).toBe(false);
    expect(canTransition('decision_issued', 'approved')).toBe(true);
  });
  it('refusal can lead to appeal', () => expect(canTransition('refused', 'appeal_in_progress')).toBe(true));
  it('every status is reachable-or-terminal and defined', () => {
    for (const s of CASE_STATUSES) expect(Array.isArray(nextStatuses(s))).toBe(true);
    expect(nextStatuses('completed')).toEqual([]);
  });
});
