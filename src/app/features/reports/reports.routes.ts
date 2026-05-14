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
    data: { roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.OFFICER, UserRole.STAFF] },
  },
  {
    path: 'inventory/valuation',
    component: ReportDataPageComponent,
    canActivate: [roleGuard],
    data: {
      roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF],
      kind: 'inventory-valuation',
      title: 'Inventory Valuation',
      subtitle: 'Track total inventory value across all warehouses.',
    },
  },
  {
    path: 'inventory/by-warehouse',
    component: ReportDataPageComponent,
    canActivate: [roleGuard],
    data: {
      roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF],
      kind: 'by-warehouse',
      title: 'Stock Value by Warehouse',
      subtitle: 'Compare quantity and inventory value warehouse by warehouse.',
    },
  },
  {
    path: 'inventory/turnover',
    component: ReportDataPageComponent,
    canActivate: [roleGuard],
    data: {
      roles: [UserRole.ADMIN, UserRole.MANAGER],
      kind: 'turnover',
      title: 'Inventory Turnover',
      subtitle: 'Measure how quickly inventory converts over the selected period.',
    },
  },
  {
    path: 'inventory/low-stock',
    component: ReportDataPageComponent,
    canActivate: [roleGuard],
    data: {
      roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.OFFICER, UserRole.STAFF],
      kind: 'low-stock',
      title: 'Low Stock Report',
      subtitle: 'Identify products that have dropped below reorder level.',
    },
  },
  {
    path: 'inventory/overstock',
    component: ReportDataPageComponent,
    canActivate: [roleGuard],
    data: {
      roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF],
      kind: 'overstock',
      title: 'Overstock Report',
      subtitle: 'Identify products above the recommended max stock level.',
    },
  },
  {
    path: 'inventory/warehouse-stock',
    redirectTo: '/reports/warehouse/reports',
    pathMatch: 'full',
  },
  {
    path: 'warehouse/reports',
    component: ReportDataPageComponent,
    canActivate: [roleGuard],
    data: {
      roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF],
      kind: 'warehouse-stock',
      title: 'Warehouse Reports',
      subtitle: 'Readonly warehouse stock valuation and warehouse-level operational summary.',
    },
  },
  {
    path: 'inventory/top-moving',
    component: ReportDataPageComponent,
    canActivate: [roleGuard],
    data: {
      roles: [UserRole.ADMIN, UserRole.MANAGER],
      kind: 'top-moving',
      title: 'Top Moving Products',
      subtitle: 'Rank products by total units moved in and out.',
    },
  },
  {
    path: 'inventory/slow-moving',
    component: ReportDataPageComponent,
    canActivate: [roleGuard],
    data: {
      roles: [UserRole.ADMIN, UserRole.MANAGER],
      kind: 'slow-moving',
      title: 'Slow Moving Products',
      subtitle: 'Find products with minimal movement over the selected period.',
    },
  },
  {
    path: 'inventory/dead-stock',
    component: ReportDataPageComponent,
    canActivate: [roleGuard],
    data: {
      roles: [UserRole.ADMIN, UserRole.MANAGER],
      kind: 'dead-stock',
      title: 'Dead Stock',
      subtitle: 'Highlight products without movement for too long.',
    },
  },
  {
    path: 'movements',
    component: ReportDataPageComponent,
    canActivate: [roleGuard],
    data: {
      roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF],
      kind: 'movements',
      title: 'Stock Movement Report',
      subtitle: 'Review warehouse stock movement history and operational flow.',
    },
  },
  {
    path: 'purchase/summary',
    component: ReportDataPageComponent,
    canActivate: [roleGuard],
    data: {
      roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.OFFICER],
      kind: 'po-summary',
      title: 'Purchase Order Summary',
      subtitle: 'Review total spend and PO distribution by supplier and warehouse.',
    },
  },
  {
    path: 'suppliers/performance',
    component: ReportDataPageComponent,
    canActivate: [roleGuard],
    data: {
      roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.OFFICER],
      kind: 'supplier-performance',
      title: 'Supplier Performance',
      subtitle: 'Lead time, fulfillment, delayed orders, and rating by supplier.',
    },
  },
  {
    path: 'payments/summary',
    component: ReportDataPageComponent,
    canActivate: [roleGuard],
    data: {
      roles: [UserRole.ADMIN, UserRole.OFFICER],
      kind: 'payment-summary',
      title: 'Payment Summary',
      subtitle: 'Paid, pending, and supplier disbursement summary.',
    },
  },
];
