import { Routes } from '@angular/router';
import { UserRole } from '../../../shared/config/app-config';
import { roleGuard } from '../../../core/guards/role.guard';

export const movementsRoutes: Routes = [
  {
    path: '',
    redirectTo: '/movements',
    pathMatch: 'full',
    canActivate: [roleGuard],
    data: { roles: [UserRole.ADMIN, UserRole.STAFF, UserRole.MANAGER, UserRole.OFFICER] },
  },
];
