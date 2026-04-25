import { Routes } from '@angular/router';
import { roleGuard } from '../../../core/guards/role.guard';
import { Roles } from '../../../core/constants/roles';

export const REPORT_ROUTES: Routes = [
  {
    path: '',
    canActivate: [roleGuard],
    data: {
      roles: [Roles.ADMIN, Roles.INVENTORY_MANAGER, Roles.PURCHASE_OFFICER, Roles.WAREHOUSE_STAFF]
    },
    loadComponent: () =>
      import('../pages/report-dashboard/report-dashboard-page.component').then(
        (m) => m.ReportDashboardPageComponent
      )
  },
  {
    path: 'total-stock-value',
    canActivate: [roleGuard],
    data: { roles: [Roles.ADMIN, Roles.INVENTORY_MANAGER, Roles.WAREHOUSE_STAFF] },
    loadComponent: () =>
      import('../pages/total-stock-value/total-stock-value-page.component').then(
        (m) => m.TotalStockValuePageComponent
      )
  },
  {
    path: 'warehouse-stock-value',
    canActivate: [roleGuard],
    data: { roles: [Roles.ADMIN, Roles.INVENTORY_MANAGER, Roles.WAREHOUSE_STAFF] },
    loadComponent: () =>
      import('../pages/warehouse-stock-value/warehouse-stock-value-page.component').then(
        (m) => m.WarehouseStockValuePageComponent
      )
  },
  {
    path: 'turnover',
    canActivate: [roleGuard],
    data: { roles: [Roles.ADMIN, Roles.INVENTORY_MANAGER] },
    loadComponent: () =>
      import('../pages/inventory-turnover/inventory-turnover-page.component').then(
        (m) => m.InventoryTurnoverPageComponent
      )
  },
  {
    path: 'low-stock',
    canActivate: [roleGuard],
    data: { roles: [Roles.ADMIN, Roles.INVENTORY_MANAGER, Roles.WAREHOUSE_STAFF] },
    loadComponent: () =>
      import('../pages/low-stock-report/low-stock-report-page.component').then(
        (m) => m.LowStockReportPageComponent
      )
  },
  {
    path: 'movement-summary',
    canActivate: [roleGuard],
    data: { roles: [Roles.ADMIN, Roles.INVENTORY_MANAGER, Roles.WAREHOUSE_STAFF] },
    loadComponent: () =>
      import('../pages/movement-summary/movement-summary-page.component').then(
        (m) => m.MovementSummaryPageComponent
      )
  },
  {
    path: 'top-moving',
    canActivate: [roleGuard],
    data: { roles: [Roles.ADMIN, Roles.INVENTORY_MANAGER] },
    loadComponent: () =>
      import('../pages/top-moving-products/top-moving-products-page.component').then(
        (m) => m.TopMovingProductsPageComponent
      )
  },
  {
    path: 'slow-moving',
    canActivate: [roleGuard],
    data: { roles: [Roles.ADMIN, Roles.INVENTORY_MANAGER] },
    loadComponent: () =>
      import('../pages/slow-moving-products/slow-moving-products-page.component').then(
        (m) => m.SlowMovingProductsPageComponent
      )
  },
  {
    path: 'dead-stock',
    canActivate: [roleGuard],
    data: { roles: [Roles.ADMIN, Roles.INVENTORY_MANAGER] },
    loadComponent: () =>
      import('../pages/dead-stock-report/dead-stock-report-page.component').then(
        (m) => m.DeadStockReportPageComponent
      )
  },
  {
    path: 'po-summary',
    canActivate: [roleGuard],
    data: { roles: [Roles.ADMIN, Roles.PURCHASE_OFFICER] },
    loadComponent: () =>
      import('../pages/po-summary/po-summary-page.component').then(
        (m) => m.PoSummaryPageComponent
      )
  },
  {
    path: 'generate',
    canActivate: [roleGuard],
    data: { roles: [Roles.ADMIN] },
    loadComponent: () =>
      import('../pages/generate-report/generate-report-page.component').then(
        (m) => m.GenerateReportPageComponent
      )
  }
];
