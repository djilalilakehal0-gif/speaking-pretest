export type Role = 'user' | 'lawyer' | 'legal_editor' | 'support' | 'admin' | 'super_admin';

export type Permission =
  | 'legal.read_drafts' | 'legal.edit' | 'legal.publish'
  | 'users.read' | 'users.manage'
  | 'lawyers.verify' | 'cases.read_all' | 'cases.manage_assigned'
  | 'payments.read' | 'audit.read' | 'tickets.manage' | 'documents.read_granted' | 'roles.grant';

/** Deliberate: admins can NOT publish legal content — only legal editors (and super_admin as break-glass). */
const MATRIX: Record<Role, Permission[]> = {
  user: [],
  lawyer: ['cases.manage_assigned', 'documents.read_granted'],
  legal_editor: ['legal.read_drafts', 'legal.edit', 'legal.publish'],
  support: ['users.read', 'tickets.manage'],
  admin: ['users.read', 'users.manage', 'lawyers.verify', 'cases.read_all', 'payments.read', 'audit.read', 'tickets.manage', 'legal.read_drafts'],
  super_admin: ['legal.read_drafts', 'legal.edit', 'legal.publish', 'users.read', 'users.manage', 'lawyers.verify', 'cases.read_all',
    'payments.read', 'audit.read', 'tickets.manage', 'roles.grant'],
};

export const can = (roles: Role[], p: Permission) => roles.some((r) => MATRIX[r]?.includes(p));
export const isStaff = (roles: Role[]) => roles.some((r) => r !== 'user' && r !== 'lawyer');
/** Lawyers and staff must have MFA enrolled before any privileged action. */
export const requiresMfa = (roles: Role[]) => roles.some((r) => r !== 'user');
