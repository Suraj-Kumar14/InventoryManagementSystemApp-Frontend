import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guards/role.guard';
import { UserRole } from '../../shared/config/app-config';
import { PaymentCreateComponent } from './pages/payment-create/payment-create.component';
import { PaymentDetailComponent } from './pages/payment-detail/payment-detail.component';
import { PaymentListComponent } from './pages/payment-list/payment-list.component';

export const paymentRoutes: Routes = [
  {
    path: '',
    component: PaymentListComponent,
    canActivate: [roleGuard],
    data: { roles: [UserRole.ADMIN, UserRole.OFFICER, UserRole.MANAGER] },
  },
  {
    path: 'pay',
    component: PaymentCreateComponent,
    canActivate: [roleGuard],
    data: { roles: [UserRole.ADMIN, UserRole.OFFICER, UserRole.MANAGER] },
  },
  {
    path: 'create',
    component: PaymentCreateComponent,
    canActivate: [roleGuard],
    data: { roles: [UserRole.ADMIN, UserRole.OFFICER, UserRole.MANAGER] },
  },
  {
    path: ':paymentId',
    component: PaymentDetailComponent,
    canActivate: [roleGuard],
    data: { roles: [UserRole.ADMIN, UserRole.OFFICER, UserRole.MANAGER, UserRole.STAFF] },
  },
];
