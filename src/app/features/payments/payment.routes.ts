import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guards/role.guard';
import { UserRole } from '../../shared/config/app-config';
import { PaymentAnalyticsComponent } from './pages/payment-analytics/payment-analytics.component';
import { PaymentApprovalsComponent } from './pages/payment-approvals/payment-approvals.component';
import { PaymentCreateComponent } from './pages/payment-create/payment-create.component';
import { PaymentDetailComponent } from './pages/payment-detail/payment-detail.component';
import { PaymentEditComponent } from './pages/payment-edit/payment-edit.component';
import { PaymentListComponent } from './pages/payment-list/payment-list.component';
import { SupplierPaymentHistoryComponent } from './pages/supplier-payment-history/supplier-payment-history.component';

export const paymentRoutes: Routes = [
  {
    path: '',
    component: PaymentListComponent,
    canActivate: [roleGuard],
    data: { roles: [UserRole.ADMIN, UserRole.OFFICER, UserRole.MANAGER] },
  },
  {
    path: 'create',
    component: PaymentCreateComponent,
    canActivate: [roleGuard],
    data: { roles: [UserRole.ADMIN, UserRole.OFFICER] },
  },
  {
    path: 'approvals',
    component: PaymentApprovalsComponent,
    canActivate: [roleGuard],
    data: { roles: [UserRole.ADMIN, UserRole.MANAGER] },
  },
  {
    path: 'analytics',
    component: PaymentAnalyticsComponent,
    canActivate: [roleGuard],
    data: { roles: [UserRole.ADMIN, UserRole.OFFICER, UserRole.MANAGER] },
  },
  {
    path: 'supplier/:supplierId',
    component: SupplierPaymentHistoryComponent,
    canActivate: [roleGuard],
    data: { roles: [UserRole.ADMIN, UserRole.OFFICER, UserRole.MANAGER] },
  },
  {
    path: ':id/edit',
    component: PaymentEditComponent,
    canActivate: [roleGuard],
    data: { roles: [UserRole.ADMIN, UserRole.OFFICER] },
  },
  {
    path: ':id',
    component: PaymentDetailComponent,
    canActivate: [roleGuard],
    data: { roles: [UserRole.ADMIN, UserRole.OFFICER, UserRole.MANAGER, UserRole.STAFF] },
  },
];
