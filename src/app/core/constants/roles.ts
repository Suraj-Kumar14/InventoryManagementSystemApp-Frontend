export const Roles = {
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  INVENTORY_MANAGER: 'INVENTORY_MANAGER',
  WAREHOUSE_STAFF: 'WAREHOUSE_STAFF',
  PURCHASE_OFFICER: 'PURCHASE_OFFICER'
} as const;

export type AppRole = (typeof Roles)[keyof typeof Roles];

export function normalizeRole(role?: string | null): AppRole | '' {
  const normalized = (role ?? '').replace(/^ROLE_/, '').trim().toUpperCase();

  switch (normalized) {
    case Roles.ADMIN:
    case Roles.MANAGER:
    case Roles.INVENTORY_MANAGER:
    case Roles.WAREHOUSE_STAFF:
    case Roles.PURCHASE_OFFICER:
      return normalized;
    default:
      return '';
  }
}

export function isManagerRole(role?: string | null): boolean {
  const normalized = normalizeRole(role);
  return normalized === Roles.MANAGER || normalized === Roles.INVENTORY_MANAGER;
}

export function roleMatches(role?: string | null, allowedRole?: string | null): boolean {
  const normalizedRole = normalizeRole(role);
  const normalizedAllowedRole = normalizeRole(allowedRole);

  if (!normalizedRole || !normalizedAllowedRole) {
    return false;
  }

  if (isManagerRole(normalizedRole) && isManagerRole(normalizedAllowedRole)) {
    return true;
  }

  return normalizedRole === normalizedAllowedRole;
}

export function formatRoleLabel(role?: string | null): string {
  const normalized = normalizeRole(role);
  if (!normalized) return 'User';

  return normalized
    .split('_')
    .map(part => part.charAt(0) + part.slice(1).toLowerCase())
    .join(' ');
}
