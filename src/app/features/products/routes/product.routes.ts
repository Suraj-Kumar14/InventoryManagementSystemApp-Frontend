import { Routes } from '@angular/router';
import { roleGuard } from '../../../core/guards/role.guard';

export const PRODUCT_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('../pages/product-list/product-list-page.component').then(
        (m) => m.ProductListPageComponent
      )
  },
  {
    path: 'create',
    canActivate: [roleGuard],
    data: { roles: ['MANAGER', 'INVENTORY_MANAGER'] },
    loadComponent: () =>
      import('../pages/product-create/product-create-page.component').then(
        (m) => m.ProductCreatePageComponent
      )
  },
  {
    path: 'new',
    pathMatch: 'full',
    redirectTo: 'create'
  },
  {
    path: 'barcode-lookup',
    loadComponent: () =>
      import('../pages/barcode-lookup/barcode-lookup-page.component').then(
        (m) => m.BarcodeLookupPageComponent
      )
  },
  {
    path: 'scan',
    pathMatch: 'full',
    redirectTo: 'barcode-lookup'
  },
  {
    path: 'low-stock',
    loadComponent: () =>
      import('../pages/low-stock-products/low-stock-products-page.component').then(
        (m) => m.LowStockProductsPageComponent
      )
  },
  {
    path: ':id/edit',
    canActivate: [roleGuard],
    data: { roles: ['MANAGER', 'INVENTORY_MANAGER'] },
    loadComponent: () =>
      import('../pages/product-edit/product-edit-page.component').then(
        (m) => m.ProductEditPageComponent
      )
  },
  {
    path: ':id',
    loadComponent: () =>
      import('../pages/product-detail/product-detail-page.component').then(
        (m) => m.ProductDetailPageComponent
      )
  }
];
