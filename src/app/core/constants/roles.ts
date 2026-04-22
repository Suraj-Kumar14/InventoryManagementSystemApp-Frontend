export const Roles = {
  ADMIN: 'ADMIN',
  INVENTORY_MANAGER: 'INVENTORY_MANAGER',
  WAREHOUSE_STAFF: 'WAREHOUSE_STAFF',
  PURCHASE_OFFICER: 'PURCHASE_OFFICER'
} as const;

export type AppRole = (typeof Roles)[keyof typeof Roles];

export function normalizeRole(role?: string | null): AppRole | '' {
  const normalized = (role ?? '').replace(/^ROLE_/, '').trim().toUpperCase();

  switch (normalized) {
    case Roles.ADMIN:
    case Roles.INVENTORY_MANAGER:
    case Roles.WAREHOUSE_STAFF:
    case Roles.PURCHASE_OFFICER:
      return normalized;
    default:
      return '';
  }
}

export function formatRoleLabel(role?: string | null): string {
  const normalized = normalizeRole(role);
  if (!normalized) return 'User';

  return normalized
    .split('_')
    .map(part => part.charAt(0) + part.slice(1).toLowerCase())
    .join(' ');
}
