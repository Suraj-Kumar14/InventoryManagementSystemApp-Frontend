import { Routes } from '@angular/router';
import { AdminDashboardComponent } from './pages/admin-dashboard/admin-dashboard.component';
import { InventoryDashboardComponent } from './pages/inventory-dashboard/inventory-dashboard.component';
import { PurchaseDashboardComponent } from './pages/purchase-dashboard/purchase-dashboard.component';
import { WarehouseDashboardComponent } from './pages/warehouse-dashboard/warehouse-dashboard.component';
import { roleGuard } from '../../core/guards/role.guard';
import { UserRole } from '../../shared/config/app-config';

export const dashboardRoutes: Routes = [
  {
    path: 'admin',
    component: AdminDashboardComponent,
    canActivate: [roleGuard],
    data: { roles: [UserRole.ADMIN] },
  },
  {
    path: 'manager',
    component: InventoryDashboardComponent,
    canActivate: [roleGuard],
    data: { roles: [UserRole.MANAGER] },
  },
  {
    path: 'officer',
    component: PurchaseDashboardComponent,
    canActivate: [roleGuard],
    data: { roles: [UserRole.OFFICER] },
  },
  {
    path: 'staff',
    component: WarehouseDashboardComponent,
    canActivate: [roleGuard],
    data: { roles: [UserRole.STAFF] },
  },
  // Fallback: redirect bare /dashboard to login
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full',
  },
];

