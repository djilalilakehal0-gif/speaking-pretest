import { describe, expect, it } from 'vitest';
import { can, requiresMfa } from './rbac';

describe('RBAC', () => {
  it('only legal editors (and super_admin) can publish legal content', () => {
    expect(can(['legal_editor'], 'legal.publish')).toBe(true);
    expect(can(['admin'], 'legal.publish')).toBe(false);
    expect(can(['support'], 'legal.publish')).toBe(false);
    expect(can(['lawyer'], 'legal.publish')).toBe(false);
    expect(can(['user'], 'legal.edit')).toBe(false);
  });
  it('only admins verify lawyers; support cannot', () => {
    expect(can(['admin'], 'lawyers.verify')).toBe(true);
    expect(can(['support'], 'lawyers.verify')).toBe(false);
  });
  it('plain users have no privileges; roles combine', () => {
    expect(can(['user'], 'audit.read')).toBe(false);
    expect(can(['support', 'legal_editor'], 'legal.publish')).toBe(true);
  });
  it('MFA is required for every non-user role', () => {
    expect(requiresMfa(['user'])).toBe(false);
    expect(requiresMfa(['lawyer'])).toBe(true);
    expect(requiresMfa(['admin'])).toBe(true);
  });
});
