import type { AdminRole } from './types';

export const ADMIN_ROLES: AdminRole[] = ['super_admin', 'content_admin', 'support_admin', 'finance_admin'];

export const ADMIN_ROLE_LABELS: Record<AdminRole, string> = {
  super_admin:   'Super Admin',
  content_admin: 'Content Admin',
  support_admin: 'Support Admin',
  finance_admin: 'Finance Admin',
};
