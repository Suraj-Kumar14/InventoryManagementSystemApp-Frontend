import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guards/role.guard';
import { UserRole } from '../../shared/config/app-config';
import { PoAnalyticsComponent } from './pages/po-analytics/po-analytics.component';
import { PoApprovalsComponent } from './pages/po-approvals/po-approvals.component';
import { PoCreateComponent } from './pages/po-create/po-create.component';
import { PoDetailComponent } from './pages/po-detail/po-detail.component';
import { PoEditComponent } from './pages/po-edit/po-edit.component';
import { PoListComponent } from './pages/po-list/po-list.component';
import { PoOverdueComponent } from './pages/po-overdue/po-overdue.component';
import { PoReceiveComponent } from './pages/po-receive/po-receive.component';

export const purchaseOrderRoutes: Routes = [
  {
    path: '',
    component: PoListComponent,
    canActivate: [roleGuard],
    data: { roles: [UserRole.ADMIN, UserRole.PURCHASE_OFFICER, UserRole.INVENTORY_MANAGER, UserRole.WAREHOUSE_STAFF] },
  },
  {
    path: 'create',
    component: PoCreateComponent,
    canActivate: [roleGuard],
    data: { roles: [UserRole.ADMIN, UserRole.PURCHASE_OFFICER] },
  },
  {
    path: 'approvals',
    component: PoApprovalsComponent,
    canActivate: [roleGuard],
    data: { roles: [UserRole.ADMIN, UserRole.INVENTORY_MANAGER] },
  },
  {
    path: 'overdue',
    component: PoOverdueComponent,
    canActivate: [roleGuard],
    data: { roles: [UserRole.ADMIN, UserRole.INVENTORY_MANAGER, UserRole.PURCHASE_OFFICER] },
  },
  {
    path: 'analytics',
    component: PoAnalyticsComponent,
    canActivate: [roleGuard],
    data: { roles: [UserRole.ADMIN, UserRole.INVENTORY_MANAGER, UserRole.PURCHASE_OFFICER] },
  },
  {
    path: ':id/edit',
    component: PoEditComponent,
    canActivate: [roleGuard],
    data: { roles: [UserRole.ADMIN, UserRole.PURCHASE_OFFICER] },
  },
  {
    path: ':id/receive',
    component: PoReceiveComponent,
    canActivate: [roleGuard],
    data: { roles: [UserRole.ADMIN, UserRole.INVENTORY_MANAGER, UserRole.WAREHOUSE_STAFF] },
  },
  {
    path: ':id',
    component: PoDetailComponent,
    canActivate: [roleGuard],
    data: { roles: [UserRole.ADMIN, UserRole.PURCHASE_OFFICER, UserRole.INVENTORY_MANAGER, UserRole.WAREHOUSE_STAFF] },
  },
];
