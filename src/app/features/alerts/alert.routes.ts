import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guards/role.guard';
import { UserRole } from '../../shared/config/app-config';
import { AlertAnalyticsComponent } from './pages/alert-analytics/alert-analytics.component';
import { AlertCenterComponent } from './pages/alert-center/alert-center.component';
import { AlertDetailComponent } from './pages/alert-detail/alert-detail.component';
import { BroadcastAlertComponent } from './pages/broadcast-alert/broadcast-alert.component';

export const alertRoutes: Routes = [
  {
    path: '',
    component: AlertCenterComponent,
    canActivate: [roleGuard],
    data: { roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF, UserRole.OFFICER] },
  },
  {
    path: 'analytics',
    component: AlertAnalyticsComponent,
    canActivate: [roleGuard],
    data: { roles: [UserRole.ADMIN, UserRole.MANAGER] },
  },
  {
    path: 'broadcast',
    component: BroadcastAlertComponent,
    canActivate: [roleGuard],
    data: { roles: [UserRole.ADMIN] },
  },
  {
    path: ':id',
    component: AlertDetailComponent,
    canActivate: [roleGuard],
    data: { roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF, UserRole.OFFICER] },
  },
];
