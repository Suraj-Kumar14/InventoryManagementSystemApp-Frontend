import { Roles, roleMatches } from '../../core/constants/roles';
import { ReportFormat, ReportNavigationItem } from './models';

export const REPORT_ROOT_ROLES: string[] = [
  Roles.ADMIN,
  Roles.INVENTORY_MANAGER,
  Roles.PURCHASE_OFFICER,
  Roles.WAREHOUSE_STAFF
];

export const REPORT_FORMAT_OPTIONS: Array<{ value: ReportFormat; label: string }> = [
  { value: 'CSV', label: 'CSV' },
  { value: 'PDF', label: 'PDF' },
  { value: 'EXCEL', label: 'Excel' }
];

export const REPORT_NAV_ITEMS: ReportNavigationItem[] = [
  {
    route: '/reports/total-stock-value',
    title: 'Total Stock Value',
    description: 'Monitor current inventory valuation across the business.',
    roles: [Roles.ADMIN, Roles.INVENTORY_MANAGER, Roles.WAREHOUSE_STAFF],
    reportType: 'TOTAL_STOCK_VALUE'
  },
  {
    route: '/reports/warehouse-stock-value',
    title: 'Warehouse Stock Value',
    description: 'Compare valuation and utilization warehouse by warehouse.',
    roles: [Roles.ADMIN, Roles.INVENTORY_MANAGER, Roles.WAREHOUSE_STAFF],
    reportType: 'WAREHOUSE_STOCK_VALUE'
  },
  {
    route: '/reports/turnover',
    title: 'Inventory Turnover',
    description: 'Review how efficiently products are moving through stock.',
    roles: [Roles.ADMIN, Roles.INVENTORY_MANAGER],
    reportType: 'INVENTORY_TURNOVER'
  },
  {
    route: '/reports/low-stock',
    title: 'Low Stock Report',
    description: 'Identify products that have dropped below reorder level.',
    roles: [Roles.ADMIN, Roles.INVENTORY_MANAGER, Roles.WAREHOUSE_STAFF],
    reportType: 'LOW_STOCK'
  },
  {
    route: '/reports/movement-summary',
    title: 'Movement Summary',
    description: 'Track inbound, outbound, adjustments, and transfers.',
    roles: [Roles.ADMIN, Roles.INVENTORY_MANAGER, Roles.WAREHOUSE_STAFF],
    reportType: 'MOVEMENT_SUMMARY'
  },
  {
    route: '/reports/top-moving',
    title: 'Top Moving Products',
    description: 'Highlight the products driving the most stock movement.',
    roles: [Roles.ADMIN, Roles.INVENTORY_MANAGER],
    reportType: 'TOP_MOVING_PRODUCTS'
  },
  {
    route: '/reports/slow-moving',
    title: 'Slow Moving Products',
    description: 'Find products with low recent activity before they stall.',
    roles: [Roles.ADMIN, Roles.INVENTORY_MANAGER],
    reportType: 'SLOW_MOVING_PRODUCTS'
  },
  {
    route: '/reports/dead-stock',
    title: 'Dead Stock Report',
    description: 'Flag inventory sitting idle beyond the business threshold.',
    roles: [Roles.ADMIN, Roles.INVENTORY_MANAGER],
    reportType: 'DEAD_STOCK'
  },
  {
    route: '/reports/po-summary',
    title: 'PO Summary',
    description: 'Understand supplier spend and purchase order activity.',
    roles: [Roles.ADMIN, Roles.PURCHASE_OFFICER],
    reportType: 'PURCHASE_ORDER_SUMMARY'
  },
  {
    route: '/reports/generate',
    title: 'Generate Report',
    description: 'Create downloadable exports for audit and decision support.',
    roles: [Roles.ADMIN]
  }
];

export const REPORT_TYPE_OPTIONS = REPORT_NAV_ITEMS.filter((item) => !!item.reportType).map((item) => ({
  value: item.reportType as string,
  label: item.title,
  description: item.description,
  roles: item.roles
}));

export function canAccessReport(role: string | null | undefined, item: ReportNavigationItem): boolean {
  return item.roles.some((allowedRole) => roleMatches(role, allowedRole));
}

export function getAccessibleReportItems(role: string | null | undefined): ReportNavigationItem[] {
  return REPORT_NAV_ITEMS.filter((item) => canAccessReport(role, item));
}

export function getAccessibleReportTypes(role: string | null | undefined) {
  return REPORT_TYPE_OPTIONS.filter((item) =>
    item.roles.some((allowedRole) => roleMatches(role, allowedRole))
  );
}
