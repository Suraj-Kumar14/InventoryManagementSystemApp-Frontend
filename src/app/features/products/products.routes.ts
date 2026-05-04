import { Routes } from '@angular/router';
import { roleGuard } from '../../core/guards/role.guard';
import { UserRole } from '../../shared/config/app-config';
import { ProductBarcodeLookupComponent } from './pages/product-barcode-lookup/product-barcode-lookup.component';
import { ProductCreateComponent } from './pages/product-create/product-create.component';
import { ProductDetailComponent } from './pages/product-detail/product-detail.component';
import { ProductEditComponent } from './pages/product-edit/product-edit.component';
import { ProductListComponent } from './pages/product-list/product-list.component';

export const productsRoutes: Routes = [
  {
    path: '',
    component: ProductListComponent,
    canActivate: [roleGuard],
    data: { roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.OFFICER, UserRole.STAFF] },
  },
  {
    path: 'create',
    component: ProductCreateComponent,
    canActivate: [roleGuard],
    data: { roles: [UserRole.ADMIN, UserRole.MANAGER] },
  },
  {
    path: 'barcode-lookup',
    component: ProductBarcodeLookupComponent,
    canActivate: [roleGuard],
    data: { roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF] },
  },
  {
    path: ':id/edit',
    component: ProductEditComponent,
    canActivate: [roleGuard],
    data: { roles: [UserRole.ADMIN, UserRole.MANAGER] },
  },
  {
    path: ':id',
    component: ProductDetailComponent,
    canActivate: [roleGuard],
    data: { roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.OFFICER, UserRole.STAFF] },
  },
];
