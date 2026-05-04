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
  { path: 'oauth-success', component: OauthSuccessComponent },
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
    path: 'alerts',
    component: LayoutComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: [UserRole.ADMIN, UserRole.INVENTORY_MANAGER, UserRole.WAREHOUSE_STAFF, UserRole.PURCHASE_OFFICER] },
    loadChildren: () => import('./features/alerts/alert.routes').then((m) => m.alertRoutes),
  },
  {
    path: 'payments',
    component: LayoutComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: [UserRole.ADMIN, UserRole.PURCHASE_OFFICER, UserRole.INVENTORY_MANAGER, UserRole.WAREHOUSE_STAFF] },
    loadChildren: () => import('./features/payments/payment.routes').then((m) => m.paymentRoutes),
  },
  {
    path: 'movements',
    component: LayoutComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: [UserRole.ADMIN, UserRole.INVENTORY_MANAGER, UserRole.WAREHOUSE_STAFF, UserRole.PURCHASE_OFFICER] },
    loadChildren: () => import('./features/movements/movement.routes').then((m) => m.movementRoutes),
  },
  {
    path: 'suppliers',
    component: LayoutComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: [UserRole.ADMIN, UserRole.PURCHASE_OFFICER, UserRole.INVENTORY_MANAGER, UserRole.WAREHOUSE_STAFF] },
    loadChildren: () => import('./features/suppliers/supplier.routes').then((m) => m.supplierRoutes),
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
    data: { roles: [UserRole.ADMIN, UserRole.INVENTORY_MANAGER, UserRole.WAREHOUSE_STAFF] },
    children: [
      { path: 'products', redirectTo: '/products', pathMatch: 'full' },
      { path: 'stock', loadChildren: () => import('./features/inventory/stock/stock.routes').then((m) => m.stockRoutes) },
      { path: 'alerts', redirectTo: '/alerts', pathMatch: 'full' },
    ],
  },
  {
    path: 'purchase',
    component: LayoutComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: [UserRole.ADMIN, UserRole.PURCHASE_OFFICER, UserRole.INVENTORY_MANAGER, UserRole.WAREHOUSE_STAFF] },
    children: [
      { path: 'orders', redirectTo: '/purchase-orders', pathMatch: 'full' },
      { path: 'suppliers', redirectTo: '/suppliers', pathMatch: 'full' },
    ],
  },
  {
    path: 'warehouse',
    component: LayoutComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: [UserRole.ADMIN, UserRole.WAREHOUSE_STAFF, UserRole.INVENTORY_MANAGER] },
    children: [
      { path: 'movements', loadChildren: () => import('./features/warehouse/movements/movements.routes').then((m) => m.movementsRoutes) },
      { path: 'bins', loadChildren: () => import('./features/warehouse/bins/bins.routes').then((m) => m.binsRoutes) },
    ],
  },
  {
    path: 'reports',
    component: LayoutComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: [UserRole.ADMIN, UserRole.INVENTORY_MANAGER, UserRole.PURCHASE_OFFICER, UserRole.WAREHOUSE_STAFF] },
    loadChildren: () => import('./features/reports/reports.routes').then((m) => m.reportsRoutes),
  },
  {
    path: 'purchase-orders',
    component: LayoutComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: [UserRole.ADMIN, UserRole.PURCHASE_OFFICER, UserRole.INVENTORY_MANAGER, UserRole.WAREHOUSE_STAFF] },
    loadChildren: () => import('./features/purchase-orders/purchase-order.routes').then((m) => m.purchaseOrderRoutes),
  },
  {
    path: 'products',
    component: LayoutComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: [UserRole.ADMIN, UserRole.INVENTORY_MANAGER, UserRole.PURCHASE_OFFICER, UserRole.WAREHOUSE_STAFF] },
    loadChildren: () => import('./features/products/products.routes').then((m) => m.productsRoutes),
  },
  {
    path: 'warehouses',
    component: LayoutComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: [UserRole.ADMIN, UserRole.INVENTORY_MANAGER, UserRole.PURCHASE_OFFICER, UserRole.WAREHOUSE_STAFF] },
    loadChildren: () => import('./features/admin/warehouses/warehouses.routes').then((m) => m.warehousesRoutes),
  },
  {
    path: 'stocks',
    component: LayoutComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: [UserRole.ADMIN, UserRole.INVENTORY_MANAGER, UserRole.PURCHASE_OFFICER, UserRole.WAREHOUSE_STAFF] },
    loadChildren: () => import('./features/inventory/stock/stock.routes').then((m) => m.stockRoutes),
  },
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: '**', redirectTo: '/403' },
];
