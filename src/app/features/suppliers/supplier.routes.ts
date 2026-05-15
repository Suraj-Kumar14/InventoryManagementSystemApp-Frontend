import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guards/role.guard';
import { UserRole } from '../../shared/config/app-config';
import { SupplierAnalyticsComponent } from './pages/supplier-analytics/supplier-analytics.component';
import { SupplierCreateComponent } from './pages/supplier-create/supplier-create.component';
import { SupplierDetailComponent } from './pages/supplier-detail/supplier-detail.component';
import { SupplierEditComponent } from './pages/supplier-edit/supplier-edit.component';
import { SupplierListComponent } from './pages/supplier-list/supplier-list.component';
import { SupplierPerformanceComponent } from './pages/supplier-performance/supplier-performance.component';

export const supplierRoutes: Routes = [
  {
    path: '',
    component: SupplierListComponent,
    canActivate: [roleGuard],
    data: { roles: [UserRole.ADMIN, UserRole.OFFICER, UserRole.MANAGER, UserRole.STAFF] },
  },
  {
    path: 'create',
    component: SupplierCreateComponent,
    canActivate: [roleGuard],
    data: { roles: [UserRole.ADMIN, UserRole.OFFICER] },
  },
  {
    path: 'analytics',
    component: SupplierAnalyticsComponent,
    canActivate: [roleGuard],
    data: { roles: [UserRole.ADMIN, UserRole.OFFICER, UserRole.MANAGER] },
  },
  {
    path: ':id/edit',
    component: SupplierEditComponent,
    canActivate: [roleGuard],
    data: { roles: [UserRole.ADMIN, UserRole.OFFICER, UserRole.MANAGER] },
  },
  {
    path: ':id/performance',
    component: SupplierPerformanceComponent,
    canActivate: [roleGuard],
    data: { roles: [UserRole.ADMIN, UserRole.OFFICER, UserRole.MANAGER] },
  },
  {
    path: ':id',
    component: SupplierDetailComponent,
    canActivate: [roleGuard],
    data: { roles: [UserRole.ADMIN, UserRole.OFFICER, UserRole.MANAGER, UserRole.STAFF] },
  },
];
