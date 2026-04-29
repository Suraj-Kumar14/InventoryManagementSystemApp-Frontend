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
  templateUrl: './products-page.component.html',
  styleUrls: ['./products-page.component.css'],
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
        const mapped = Array.isArray(products) ? products : [products];
        if (mapped.length === 0 && searchTerm && !category && !brand) {
          return this.service.getProductByBarcode(searchTerm).pipe(catchError(() => of([] as ProductResponse[])));
        }
        return of(mapped);
      }),
      finalize(() => (this.loading = false))
    ).subscribe({
      next: (products) => {
        const mapped = Array.isArray(products) ? products : [products];
        this.allProducts = mapped;
        this.products = this.filterProducts(mapped, searchTerm, category, brand);
        this.syncFilterOptions(mapped);
      },
      error: () => { this.allProducts = []; this.products = []; },
    });
  }

  save(): void {
    if (!this.canManage || this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving = true;
    const payload = this.form.getRawValue() as ProductRequest;
    const request = this.editingId ? this.service.updateProduct(this.editingId, payload) : this.service.createProduct(payload);
    request.pipe(finalize(() => (this.saving = false))).subscribe({
      next: () => { this.notifications.success(this.editingId ? 'Product updated successfully.' : 'Product created successfully.'); this.resetForm(); this.loadProducts(); },
    });
  }

  edit(product: ProductResponse): void {
    this.editingId = product.productId;
    this.form.patchValue({
      sku: product.sku, name: product.name, description: product.description || '',
      category: product.category, brand: product.brand || '', unitOfMeasure: product.unitOfMeasure,
      costPrice: product.costPrice, sellingPrice: product.sellingPrice, reorderLevel: product.reorderLevel,
      maxStockLevel: product.maxStockLevel, leadTimeDays: product.leadTimeDays,
      imageUrl: product.imageUrl || '', barcode: product.barcode || '',
    });
  }

  deactivate(product: ProductResponse): void {
    this.actionId = product.productId;
    this.service.deactivateProduct(product.productId).pipe(finalize(() => (this.actionId = null))).subscribe({
      next: (message) => { this.notifications.success(message || 'Product deactivated successfully.'); this.loadProducts(); },
    });
  }

  remove(product: ProductResponse): void {
    this.actionId = product.productId;
    this.service.deleteProduct(product.productId).pipe(finalize(() => (this.actionId = null))).subscribe({
      next: (message) => { this.notifications.success(message || 'Product deleted successfully.'); this.loadProducts(); },
    });
  }

  resetForm(): void {
    this.editingId = null;
    this.form.reset({ sku: '', name: '', description: '', category: '', brand: '', unitOfMeasure: '', costPrice: 0, sellingPrice: 0, reorderLevel: 0, maxStockLevel: 1, leadTimeDays: 1, imageUrl: '', barcode: '' });
  }

  resetFilters(): void {
    this.searchControl.setValue('');
    this.categoryControl.setValue('');
    this.brandControl.setValue('');
    this.loadProducts();
  }

  private filterProducts(products: ProductResponse[], searchTerm: string, category: string, brand: string): ProductResponse[] {
    const norm = searchTerm.toLowerCase();
    return products.filter((p) => {
      const matchesSearch = !norm || [p.name, p.sku, p.barcode ?? '', p.category, p.brand ?? ''].some((v) => v.toLowerCase().includes(norm));
      return matchesSearch && (!category || p.category === category) && (!brand || p.brand === brand);
    });
  }

  private syncFilterOptions(products: ProductResponse[]): void {
    this.categories = [...new Set(products.map((p) => p.category).filter(Boolean))].sort();
    this.brands = [...new Set(products.map((p) => p.brand).filter((b): b is string => !!b))].sort();
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
