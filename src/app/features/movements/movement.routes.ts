import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guards/role.guard';
import { UserRole } from '../../shared/config/app-config';
import { MovementAnalyticsComponent } from './pages/movement-analytics/movement-analytics.component';
import { MovementByProductComponent } from './pages/movement-by-product/movement-by-product.component';
import { MovementByWarehouseComponent } from './pages/movement-by-warehouse/movement-by-warehouse.component';
import { MovementDetailComponent } from './pages/movement-detail/movement-detail.component';
import { MovementExportComponent } from './pages/movement-export/movement-export.component';
import { MovementListComponent } from './pages/movement-list/movement-list.component';
import { MovementReferenceComponent } from './pages/movement-reference/movement-reference.component';

export const movementRoutes: Routes = [
  {
    path: '',
    component: MovementListComponent,
    canActivate: [roleGuard],
    data: { roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF, UserRole.OFFICER] },
  },
  {
    path: 'analytics',
    component: MovementAnalyticsComponent,
    canActivate: [roleGuard],
    data: { roles: [UserRole.ADMIN, UserRole.MANAGER] },
  },
  {
    path: 'product/:productId',
    component: MovementByProductComponent,
    canActivate: [roleGuard],
    data: { roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF, UserRole.OFFICER] },
  },
  {
    path: 'warehouse/:warehouseId',
    component: MovementByWarehouseComponent,
    canActivate: [roleGuard],
    data: { roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF] },
  },
  {
    path: 'reference/:referenceType/:referenceId',
    component: MovementReferenceComponent,
    canActivate: [roleGuard],
    data: { roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF, UserRole.OFFICER] },
  },
  {
    path: 'export',
    component: MovementExportComponent,
    canActivate: [roleGuard],
    data: { roles: [UserRole.ADMIN, UserRole.MANAGER] },
  },
  {
    path: ':id',
    component: MovementDetailComponent,
    canActivate: [roleGuard],
    data: { roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF, UserRole.OFFICER] },
  },
];
