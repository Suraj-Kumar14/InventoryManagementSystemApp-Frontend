import { CommonModule } from '@angular/common';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Component, Injectable, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Routes } from '@angular/router';
import { of } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, finalize, switchMap } from 'rxjs/operators';
import { ProductRequest, ProductResponse } from '../../../core/http/backend.models';
import { AuthService } from '../../../core/auth/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { API_ENDPOINTS, UI_CONSTANTS, UserRole } from '../../../shared/config/app-config';
import { environment } from '../../../../environments/environment';
import { roleGuard } from '../../../core/guards/role.guard';

@Injectable({ providedIn: 'root' })
class ProductsService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;

  getProducts(keyword?: string) {
    if (keyword?.trim()) {
      const params = new HttpParams().set('keyword', keyword.trim());
      return this.http.get<ProductResponse[]>(`${this.baseUrl}${API_ENDPOINTS.PRODUCTS.SEARCH}`, { params });
    }

    return this.http.get<ProductResponse[]>(`${this.baseUrl}${API_ENDPOINTS.PRODUCTS.ROOT}`);
  }

  getProductsByCategory(category: string) {
    return this.http.get<ProductResponse[]>(`${this.baseUrl}${API_ENDPOINTS.PRODUCTS.CATEGORY(category)}`);
  }

  getProductsByBrand(brand: string) {
    return this.http.get<ProductResponse[]>(`${this.baseUrl}${API_ENDPOINTS.PRODUCTS.BRAND(brand)}`);
  }

  getProductByBarcode(barcode: string) {
    return this.http.get<ProductResponse>(`${this.baseUrl}${API_ENDPOINTS.PRODUCTS.BARCODE(barcode)}`);
  }

  createProduct(payload: ProductRequest) {
    return this.http.post<ProductResponse>(`${this.baseUrl}${API_ENDPOINTS.PRODUCTS.ROOT}`, payload);
  }

  updateProduct(id: number, payload: ProductRequest) {
    return this.http.put<ProductResponse>(`${this.baseUrl}${API_ENDPOINTS.PRODUCTS.ROOT}/${id}`, payload);
  }

  deactivateProduct(id: number) {
    return this.http.put(`${this.baseUrl}${API_ENDPOINTS.PRODUCTS.DEACTIVATE(id)}`, {}, { responseType: 'text' });
  }

  deleteProduct(id: number) {
    return this.http.delete(`${this.baseUrl}${API_ENDPOINTS.PRODUCTS.ROOT}/${id}`, { responseType: 'text' });
  }
}

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section class="space-y-6">
      <div class="flex flex-col gap-2">
        <h1 class="text-3xl font-bold text-neutral-900">Products</h1>
        <p class="text-neutral-600">Search and manage products strictly through product-service APIs.</p>
      </div>

      <div class="grid gap-3 md:grid-cols-4">
        <input [formControl]="searchControl" placeholder="Search name, SKU, barcode, category, or brand" class="rounded-lg border border-neutral-300 px-4 py-2 md:col-span-2" />
        <select [formControl]="categoryControl" class="rounded-lg border border-neutral-300 px-4 py-2">
          <option value="">All categories</option>
          <option *ngFor="let category of categories" [value]="category">{{ category }}</option>
        </select>
        <select [formControl]="brandControl" class="rounded-lg border border-neutral-300 px-4 py-2">
          <option value="">All brands</option>
          <option *ngFor="let brand of brands" [value]="brand">{{ brand }}</option>
        </select>
      </div>

      <div class="flex gap-3">
        <button type="button" (click)="loadProducts()" [disabled]="loading" class="rounded-lg bg-primary-600 px-4 py-2 text-white disabled:opacity-50">
          {{ loading ? 'Loading...' : 'Search' }}
        </button>
        <button type="button" (click)="resetFilters()" [disabled]="loading" class="rounded-lg border border-neutral-300 px-4 py-2">
          Reset Filters
        </button>
      </div>

      <form
        *ngIf="canManage"
        [formGroup]="form"
        (ngSubmit)="save()"
        class="grid gap-4 rounded-xl border border-neutral-200 bg-white p-6 md:grid-cols-2"
      >
        <input formControlName="sku" placeholder="SKU" class="rounded-lg border border-neutral-300 px-4 py-2" />
        <input formControlName="name" placeholder="Name" class="rounded-lg border border-neutral-300 px-4 py-2" />
        <input formControlName="category" placeholder="Category" class="rounded-lg border border-neutral-300 px-4 py-2" />
        <input formControlName="brand" placeholder="Brand" class="rounded-lg border border-neutral-300 px-4 py-2" />
        <input formControlName="unitOfMeasure" placeholder="Unit of measure" class="rounded-lg border border-neutral-300 px-4 py-2" />
        <input formControlName="barcode" placeholder="Barcode" class="rounded-lg border border-neutral-300 px-4 py-2" />
        <input formControlName="costPrice" type="number" step="0.01" placeholder="Cost price" class="rounded-lg border border-neutral-300 px-4 py-2" />
        <input formControlName="sellingPrice" type="number" step="0.01" placeholder="Selling price" class="rounded-lg border border-neutral-300 px-4 py-2" />
        <input formControlName="reorderLevel" type="number" placeholder="Reorder level" class="rounded-lg border border-neutral-300 px-4 py-2" />
        <input formControlName="maxStockLevel" type="number" placeholder="Max stock level" class="rounded-lg border border-neutral-300 px-4 py-2" />
        <input formControlName="leadTimeDays" type="number" placeholder="Lead time days" class="rounded-lg border border-neutral-300 px-4 py-2" />
        <input formControlName="imageUrl" placeholder="Image URL" class="rounded-lg border border-neutral-300 px-4 py-2" />
        <textarea formControlName="description" placeholder="Description" class="rounded-lg border border-neutral-300 px-4 py-2 md:col-span-2"></textarea>
        <div class="md:col-span-2 flex gap-3">
          <button type="submit" [disabled]="form.invalid || saving" class="rounded-lg bg-primary-600 px-4 py-2 text-white disabled:opacity-50">
            {{ saving ? 'Saving...' : editingId ? 'Update Product' : 'Create Product' }}
          </button>
          <button type="button" (click)="resetForm()" class="rounded-lg border border-neutral-300 px-4 py-2">Clear</button>
        </div>
      </form>

      <div *ngIf="!canManage" class="rounded-xl border border-neutral-200 bg-warning-50 p-4 text-warning-800">
        Product create, update, deactivate, and delete actions are available only for Inventory Managers and Admins.
      </div>

      <div *ngIf="loading" class="rounded-xl border border-neutral-200 bg-white p-6 text-neutral-600">Loading products...</div>
      <div *ngIf="!loading && products.length === 0" class="rounded-xl border border-dashed border-neutral-300 bg-white p-8 text-center text-neutral-600">
        No products returned by the backend.
      </div>

      <div *ngIf="!loading && products.length > 0" class="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        <table class="min-w-full divide-y divide-neutral-200 text-sm">
          <thead class="bg-neutral-50 text-left text-neutral-600">
            <tr>
              <th class="px-4 py-3">SKU</th>
              <th class="px-4 py-3">Name</th>
              <th class="px-4 py-3">Category</th>
              <th class="px-4 py-3">Prices</th>
              <th class="px-4 py-3">Status</th>
              <th class="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-neutral-200">
            <tr *ngFor="let product of products">
              <td class="px-4 py-3 font-medium text-neutral-900">{{ product.sku }}</td>
              <td class="px-4 py-3">{{ product.name }}</td>
              <td class="px-4 py-3">{{ product.category }}</td>
              <td class="px-4 py-3">Cost {{ product.costPrice }} / Sell {{ product.sellingPrice }}</td>
              <td class="px-4 py-3">{{ product.isActive ? 'Active' : 'Inactive' }}</td>
              <td class="px-4 py-3 flex gap-2">
                <button *ngIf="canManage" type="button" (click)="edit(product)" class="rounded-md border border-neutral-300 px-3 py-1">Edit</button>
                <button *ngIf="canManage" type="button" (click)="deactivate(product)" [disabled]="actionId === product.productId || !product.isActive" class="rounded-md border border-danger-300 px-3 py-1 text-danger-700 disabled:opacity-50">Deactivate</button>
                <button *ngIf="canManage" type="button" (click)="remove(product)" [disabled]="actionId === product.productId" class="rounded-md border border-danger-300 px-3 py-1 text-danger-700 disabled:opacity-50">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  `,
})
class ProductsPageComponent {
  private service = inject(ProductsService);
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private notifications = inject(NotificationService);

  products: ProductResponse[] = [];
  allProducts: ProductResponse[] = [];
  categories: string[] = [];
  brands: string[] = [];
  loading = false;
  saving = false;
  editingId: number | null = null;
  actionId: number | null = null;

  readonly canManage = this.auth.hasRole([UserRole.MANAGER, UserRole.ADMIN]);

  searchControl = this.fb.nonNullable.control('');
  categoryControl = this.fb.nonNullable.control('');
  brandControl = this.fb.nonNullable.control('');
  form = this.fb.nonNullable.group({
    sku: ['', Validators.required],
    name: ['', Validators.required],
    description: [''],
    category: ['', Validators.required],
    brand: [''],
    unitOfMeasure: ['', Validators.required],
    costPrice: [0, [Validators.required, Validators.min(0.01)]],
    sellingPrice: [0, [Validators.required, Validators.min(0.01)]],
    reorderLevel: [0, [Validators.required, Validators.min(0)]],
    maxStockLevel: [1, [Validators.required, Validators.min(1)]],
    leadTimeDays: [1, [Validators.required, Validators.min(1)]],
    imageUrl: [''],
    barcode: [''],
  });

  constructor() {
    this.searchControl.valueChanges
      .pipe(debounceTime(UI_CONSTANTS.DEBOUNCE_DELAY), distinctUntilChanged())
      .subscribe(() => this.loadProducts());

    this.categoryControl.valueChanges.subscribe(() => this.loadProducts());
    this.brandControl.valueChanges.subscribe(() => this.loadProducts());
    this.loadProducts();
  }

  loadProducts(): void {
    this.loading = true;
    const searchTerm = this.searchControl.value.trim();
    const category = this.categoryControl.value.trim();
    const brand = this.brandControl.value.trim();
    const request = category
      ? this.service.getProductsByCategory(category)
      : brand
        ? this.service.getProductsByBrand(brand)
        : this.service.getProducts(searchTerm);

    request.pipe(
      switchMap((products) => {
        const mappedProducts = Array.isArray(products) ? products : [products];
        if (mappedProducts.length === 0 && searchTerm && !category && !brand) {
          return this.service.getProductByBarcode(searchTerm).pipe(
            catchError(() => of([] as ProductResponse[]))
          );
        }
        return of(mappedProducts);
      }),
      finalize(() => (this.loading = false))
    ).subscribe({
      next: (products) => {
        const mappedProducts = Array.isArray(products) ? products : [products];
        this.allProducts = mappedProducts;
        this.products = this.filterProducts(mappedProducts, searchTerm, category, brand);
        this.syncFilterOptions(mappedProducts);
      },
      error: () => {
        this.allProducts = [];
        this.products = [];
      },
    });
  }

  save(): void {
    if (!this.canManage || this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving = true;
    const payload = this.form.getRawValue() as ProductRequest;
    const request = this.editingId ? this.service.updateProduct(this.editingId, payload) : this.service.createProduct(payload);

    request.pipe(finalize(() => (this.saving = false))).subscribe({
      next: () => {
        this.notifications.success(this.editingId ? 'Product updated successfully.' : 'Product created successfully.');
        this.resetForm();
        this.loadProducts();
      },
    });
  }

  edit(product: ProductResponse): void {
    this.editingId = product.productId;
    this.form.patchValue({
      sku: product.sku,
      name: product.name,
      description: product.description || '',
      category: product.category,
      brand: product.brand || '',
      unitOfMeasure: product.unitOfMeasure,
      costPrice: product.costPrice,
      sellingPrice: product.sellingPrice,
      reorderLevel: product.reorderLevel,
      maxStockLevel: product.maxStockLevel,
      leadTimeDays: product.leadTimeDays,
      imageUrl: product.imageUrl || '',
      barcode: product.barcode || '',
    });
  }

  deactivate(product: ProductResponse): void {
    this.actionId = product.productId;
    this.service
      .deactivateProduct(product.productId)
      .pipe(finalize(() => (this.actionId = null)))
      .subscribe({
        next: (message) => {
          this.notifications.success(message || 'Product deactivated successfully.');
          this.loadProducts();
        },
      });
  }

  remove(product: ProductResponse): void {
    this.actionId = product.productId;
    this.service
      .deleteProduct(product.productId)
      .pipe(finalize(() => (this.actionId = null)))
      .subscribe({
        next: (message) => {
          this.notifications.success(message || 'Product deleted successfully.');
          this.loadProducts();
        },
      });
  }

  resetForm(): void {
    this.editingId = null;
    this.form.reset({
      sku: '',
      name: '',
      description: '',
      category: '',
      brand: '',
      unitOfMeasure: '',
      costPrice: 0,
      sellingPrice: 0,
      reorderLevel: 0,
      maxStockLevel: 1,
      leadTimeDays: 1,
      imageUrl: '',
      barcode: '',
    });
  }

  resetFilters(): void {
    this.searchControl.setValue('');
    this.categoryControl.setValue('');
    this.brandControl.setValue('');
    this.loadProducts();
  }

  private filterProducts(products: ProductResponse[], searchTerm: string, category: string, brand: string): ProductResponse[] {
    const normalizedSearch = searchTerm.toLowerCase();

    return products.filter((product) => {
      const matchesSearch =
        !normalizedSearch ||
        [
          product.name,
          product.sku,
          product.barcode ?? '',
          product.category,
          product.brand ?? '',
        ].some((value) => value.toLowerCase().includes(normalizedSearch));

      const matchesCategory = !category || product.category === category;
      const matchesBrand = !brand || product.brand === brand;

      return matchesSearch && matchesCategory && matchesBrand;
    });
  }

  private syncFilterOptions(products: ProductResponse[]): void {
    this.categories = [...new Set(products.map((product) => product.category).filter(Boolean))].sort();
    this.brands = [...new Set(products.map((product) => product.brand).filter((brand): brand is string => !!brand))].sort();
  }
}

export const productsRoutes: Routes = [
  {
    path: '',
    component: ProductsPageComponent,
    canActivate: [roleGuard],
    data: { roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF] },
  },
];
