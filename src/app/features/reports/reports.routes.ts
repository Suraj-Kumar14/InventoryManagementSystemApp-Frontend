import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guards/role.guard';
import { UserRole } from '../../shared/config/app-config';
import { ReportDashboardComponent } from './pages/report-dashboard.component';
import { ReportDataPageComponent } from './pages/report-data-page.component';

export const reportsRoutes: Routes = [
  {
    path: '',
    component: ReportDashboardComponent,
    canActivate: [roleGuard],
    data: { roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.OFFICER, UserRole.STAFF] },
  },
  {
    path: 'executive',
    component: ReportDashboardComponent,
    canActivate: [roleGuard],
    data: { roles: [UserRole.ADMIN] },
  },
  {
    path: 'inventory/valuation',
    component: ReportDataPageComponent,
    canActivate: [roleGuard],
    data: { roles: [UserRole.ADMIN, UserRole.MANAGER], kind: 'inventory-valuation', title: 'Inventory Valuation', subtitle: 'Track inventory value across products, categories, and warehouses.', exportable: true },
  },
  {
    path: 'inventory/stock-summary',
    component: ReportDataPageComponent,
    canActivate: [roleGuard],
    data: { roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF, UserRole.OFFICER], kind: 'stock-summary', title: 'Stock Summary', subtitle: 'A concise operational picture of stock, reservations, and availability.' },
  },
  {
    path: 'inventory/product-stock',
    component: ReportDataPageComponent,
    canActivate: [roleGuard],
    data: { roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF, UserRole.OFFICER], kind: 'product-stock', title: 'Product Stock Report', subtitle: 'View product-level valuation and stock positions across warehouses.' },
  },
  {
    path: 'inventory/warehouse-stock',
    component: ReportDataPageComponent,
    canActivate: [roleGuard],
    data: { roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF], kind: 'warehouse-stock', title: 'Warehouse Stock Report', subtitle: 'Compare stock value and quantity warehouse by warehouse.' },
  },
  {
    path: 'inventory/low-stock',
    component: ReportDataPageComponent,
    canActivate: [roleGuard],
    data: { roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF, UserRole.OFFICER], kind: 'low-stock', title: 'Low Stock Report', subtitle: 'Spot operational shortages before they turn into service disruptions.' },
  },
  {
    path: 'inventory/overstock',
    component: ReportDataPageComponent,
    canActivate: [roleGuard],
    data: { roles: [UserRole.ADMIN, UserRole.MANAGER], kind: 'overstock', title: 'Overstock Report', subtitle: 'Identify excess inventory tying up working capital.' },
  },
  {
    path: 'movements',
    component: ReportDataPageComponent,
    canActivate: [roleGuard],
    data: { roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF, UserRole.OFFICER], kind: 'movements', title: 'Stock Movement Report', subtitle: 'Audit movement flow with filters for warehouse, product, and dates.', exportable: true },
  },
  {
    path: 'movements/turnover',
    component: ReportDataPageComponent,
    canActivate: [roleGuard],
    data: { roles: [UserRole.ADMIN, UserRole.MANAGER], kind: 'turnover', title: 'Inventory Turnover Report', subtitle: 'Measure how quickly inventory is moving relative to average holdings.' },
  },
  {
    path: 'movements/top-moving',
    component: ReportDataPageComponent,
    canActivate: [roleGuard],
    data: { roles: [UserRole.ADMIN, UserRole.MANAGER], kind: 'top-moving', title: 'Top Moving Products', subtitle: 'Surface the products with the highest movement volume and value.' },
  },
  {
    path: 'movements/slow-moving',
    component: ReportDataPageComponent,
    canActivate: [roleGuard],
    data: { roles: [UserRole.ADMIN, UserRole.MANAGER], kind: 'slow-moving', title: 'Slow Moving Products', subtitle: 'Find inventory that is still moving but not quickly enough.' },
  },
  {
    path: 'movements/dead-stock',
    component: ReportDataPageComponent,
    canActivate: [roleGuard],
    data: { roles: [UserRole.ADMIN, UserRole.MANAGER], kind: 'dead-stock', title: 'Dead Stock Report', subtitle: 'Reveal products sitting idle for too long.' },
  },
  {
    path: 'purchase/summary',
    component: ReportDataPageComponent,
    canActivate: [roleGuard],
    data: { roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.OFFICER], kind: 'purchase-summary', title: 'Purchase Summary', subtitle: 'Review approval status, received value, and procurement backlog.', exportable: true },
  },
  {
    path: 'purchase/orders',
    component: ReportDataPageComponent,
    canActivate: [roleGuard],
    data: { roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.OFFICER], kind: 'purchase-orders', title: 'Purchase Order Reports', subtitle: 'Inspect order, payment, supplier, and product-level procurement details through the gateway-backed purchase API.' },
  },
  {
    path: 'suppliers/performance',
    component: ReportDataPageComponent,
    canActivate: [roleGuard],
    data: { roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.OFFICER], kind: 'supplier-performance', title: 'Supplier Performance', subtitle: 'Compare supplier throughput, delays, spend, and quality signals.', exportable: true },
  },
  {
    path: 'payments/summary',
    component: ReportDataPageComponent,
    canActivate: [roleGuard],
    data: { roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.OFFICER], kind: 'payment-summary', title: 'Payment Summary', subtitle: 'Track payment execution, supplier disbursements, and pending exposure.' },
  },
  {
    path: 'alerts/summary',
    component: ReportDataPageComponent,
    canActivate: [roleGuard],
    data: { roles: [UserRole.ADMIN, UserRole.MANAGER], kind: 'alert-summary', title: 'Alert Summary', subtitle: 'Understand operational warning volume and system-wide risk signals.' },
  },
  {
    path: 'snapshots',
    component: ReportDataPageComponent,
    canActivate: [roleGuard],
    data: { roles: [UserRole.ADMIN, UserRole.MANAGER], kind: 'snapshots', title: 'Inventory Snapshots', subtitle: 'Review saved daily inventory positions and manually trigger fresh snapshots.', canRunSnapshot: true },
  },
];
