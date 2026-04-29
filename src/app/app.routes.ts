import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { LayoutComponent } from './shared/components/layout/layout.component';
import { LoginComponent } from './features/auth/pages/login/login.component';
import { RegisterComponent } from './features/auth/pages/register/register.component';
import { VerifyOtpComponent } from './features/auth/pages/verify-otp/verify-otp.component';
import { ForgotPasswordComponent } from './features/auth/pages/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './features/auth/pages/reset-password/reset-password.component';
import { VerifyResetOtpComponent } from './features/auth/pages/verify-reset-otp/verify-reset-otp.component';
import { OauthSuccessComponent } from './features/auth/pages/oauth-success/oauth-success.component';
import { UnauthorizedComponent } from './features/auth/pages/unauthorized/unauthorized.component';
import { dashboardRoutes } from './features/dashboard/dashboard.routes';
import { settingsRoutes } from './features/settings/settings.routes';
import { UserRole } from './shared/config/app-config';
import { guestGuard } from './core/guards/guest.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent, canActivate: [guestGuard] },
  { path: 'register', component: RegisterComponent, canActivate: [guestGuard] },
  { path: 'verify-otp', component: VerifyOtpComponent, canActivate: [guestGuard] },
  { path: 'forgot-password', component: ForgotPasswordComponent, canActivate: [guestGuard] },
  { path: 'verify-reset-otp', component: VerifyResetOtpComponent, canActivate: [guestGuard] },
  { path: 'reset-password', component: ResetPasswordComponent, canActivate: [guestGuard] },
  { path: 'oauth-success', component: OauthSuccessComponent, canActivate: [guestGuard] },
  { path: '403', component: UnauthorizedComponent },
  { path: 'unauthorized', redirectTo: '/403', pathMatch: 'full' },
  {
    path: 'dashboard',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: dashboardRoutes,
  },
  {
    path: 'settings',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: settingsRoutes,
  },
  {
    path: 'admin',
    component: LayoutComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: [UserRole.ADMIN] },
    children: [
      { path: 'users', loadChildren: () => import('./features/admin/users/users.routes').then((m) => m.usersRoutes) },
      { path: 'warehouses', loadChildren: () => import('./features/admin/warehouses/warehouses.routes').then((m) => m.warehousesRoutes) },
      { path: 'logs', loadChildren: () => import('./features/admin/logs/logs.routes').then((m) => m.logsRoutes) },
    ],
  },
  {
    path: 'inventory',
    component: LayoutComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF] },
    children: [
      { path: 'products', loadChildren: () => import('./features/inventory/products/products.routes').then((m) => m.productsRoutes) },
      { path: 'stock', loadChildren: () => import('./features/inventory/stock/stock.routes').then((m) => m.stockRoutes) },
      { path: 'alerts', loadChildren: () => import('./features/inventory/alerts/alerts.routes').then((m) => m.alertsRoutes) },
    ],
  },
  {
    path: 'purchase',
    component: LayoutComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: [UserRole.ADMIN, UserRole.OFFICER] },
    children: [
      { path: 'orders', loadChildren: () => import('./features/purchase/orders/orders.routes').then((m) => m.ordersRoutes) },
      { path: 'suppliers', loadChildren: () => import('./features/purchase/suppliers/suppliers.routes').then((m) => m.suppliersRoutes) },
    ],
  },
  {
    path: 'warehouse',
    component: LayoutComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: [UserRole.ADMIN, UserRole.STAFF, UserRole.MANAGER] },
    children: [
      { path: 'movements', loadChildren: () => import('./features/warehouse/movements/movements.routes').then((m) => m.movementsRoutes) },
      { path: 'bins', loadChildren: () => import('./features/warehouse/bins/bins.routes').then((m) => m.binsRoutes) },
    ],
  },
  {
    path: 'reports',
    component: LayoutComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: [UserRole.ADMIN, UserRole.MANAGER] },
    loadChildren: () => import('./features/reports/reports.routes').then((m) => m.reportsRoutes),
  },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: '**', redirectTo: '/403' },
];
