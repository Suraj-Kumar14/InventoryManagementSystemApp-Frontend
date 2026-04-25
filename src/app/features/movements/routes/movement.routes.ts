import { Routes } from '@angular/router';
import { roleGuard } from '../../../core/guards/role.guard';

export const MOVEMENT_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('../pages/movement-list/movement-list-page.component').then(
        (m) => m.MovementListPageComponent
      )
  },
  {
    path: 'search',
    canActivate: [roleGuard],
    data: { roles: ['ADMIN', 'INVENTORY_MANAGER', 'WAREHOUSE_STAFF'] },
    loadComponent: () =>
      import('../pages/movement-search/movement-search-page.component').then(
        (m) => m.MovementSearchPageComponent
      )
  },
  {
    path: 'history',
    canActivate: [roleGuard],
    data: { roles: ['ADMIN', 'INVENTORY_MANAGER', 'WAREHOUSE_STAFF'] },
    loadComponent: () =>
      import('../pages/movement-history/movement-history-page.component').then(
        (m) => m.MovementHistoryPageComponent
      )
  },
  {
    path: 'summary',
    canActivate: [roleGuard],
    data: { roles: ['ADMIN', 'INVENTORY_MANAGER', 'WAREHOUSE_STAFF'] },
    loadComponent: () =>
      import('../pages/stock-in-out-summary/stock-in-out-summary-page.component').then(
        (m) => m.StockInOutSummaryPageComponent
      )
  },
  {
    path: ':id',
    loadComponent: () =>
      import('../pages/movement-detail/movement-detail-page.component').then(
        (m) => m.MovementDetailPageComponent
      )
  }
];
