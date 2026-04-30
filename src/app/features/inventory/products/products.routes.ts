import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Routes } from '@angular/router';
import { of } from 'rxjs';
import { catchError, debounceTime, distinctUntilChanged, finalize, switchMap } from 'rxjs/operators';
import { ProductRequest, ProductResponse } from '../../../core/http/backend.models';
import { AuthService } from '../../../core/auth/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ProductService } from '../../../core/services/product.service';
import { UI_CONSTANTS, UserRole } from '../../../shared/config/app-config';
import { roleGuard } from '../../../core/guards/role.guard';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './products-page.component.html',
  styleUrls: ['./products-page.component.css'],
})
class ProductsPageComponent {
  private readonly service = inject(ProductService);
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly notifications = inject(NotificationService);

  products: ProductResponse[] = [];
  allProducts: ProductResponse[] = [];
  categories: string[] = [];
  brands: string[] = [];
  loading = false;
  saving = false;
  editingId: number | null = null;
  actionId: number | null = null;
  submitAttempted = false;

  readonly canManage = this.auth.hasRole([UserRole.MANAGER, UserRole.ADMIN]);

  searchControl = this.fb.nonNullable.control('');
  categoryControl = this.fb.nonNullable.control('');
  brandControl = this.fb.nonNullable.control('');

  form = this.fb.group({
    sku: ['', [Validators.required, Validators.maxLength(50)]],
    name: ['', [Validators.required, Validators.maxLength(200)]],
    category: ['', Validators.required],
    unitOfMeasure: ['', Validators.required],
    costPrice: [null as number | null, [Validators.required, Validators.min(0.01)]],
    sellingPrice: [null as number | null, [Validators.required, Validators.min(0.01)]],
    reorderLevel: [null as number | null, [Validators.required, Validators.min(0)]],
    maxStockLevel: [null as number | null, [Validators.required, Validators.min(1)]],
    leadTimeDays: [null as number | null, [Validators.required, Validators.min(1)]],
    brand: [null as string | null],
    barcode: [null as string | null],
    imageUrl: [null as string | null],
    description: [null as string | null, Validators.maxLength(1000)],
  });

  constructor() {
    this.searchControl.valueChanges
      .pipe(debounceTime(UI_CONSTANTS.DEBOUNCE_DELAY), distinctUntilChanged())
      .subscribe(() => this.loadProducts());
    this.categoryControl.valueChanges.subscribe(() => this.loadProducts());
    this.brandControl.valueChanges.subscribe(() => this.loadProducts());
    this.loadProducts();
  }

  isInvalid(field: string): boolean {
    const ctrl = this.form.get(field);
    return !!ctrl && ctrl.invalid && (ctrl.touched || ctrl.dirty || this.submitAttempted);
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
        : this.service.getProducts({ keyword: searchTerm, page: 0, size: 50 });

    request
      .pipe(
        switchMap((products) => {
          const mapped = Array.isArray(products) ? products : [products];
          if (mapped.length === 0 && searchTerm && !category && !brand) {
            return this.service.getProductByBarcode(searchTerm).pipe(catchError(() => of([] as ProductResponse[])));
          }
          return of(mapped);
        }),
        finalize(() => (this.loading = false))
      )
      .subscribe({
        next: (products) => {
          const mapped = Array.isArray(products) ? products : [products];
          this.allProducts = mapped;
          this.products = this.filterProducts(mapped, searchTerm, category, brand);
          this.syncFilterOptions(mapped);
        },
        error: () => {
          this.allProducts = [];
          this.products = [];
        },
      });
  }

  save(): void {
    this.submitAttempted = true;

    if (!this.canManage) {
      this.notifications.error('You do not have permission to manage products.');
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.notifications.error('Please fill in all required fields correctly before saving.', 'Validation Error');
      return;
    }

    this.saving = true;
    const payload = this.buildPayload();
    const request = this.editingId
      ? this.service.updateProduct(this.editingId, payload)
      : this.service.createProduct(payload);

    request.pipe(finalize(() => (this.saving = false))).subscribe({
      next: () => {
        this.notifications.success(this.editingId ? 'Product updated successfully.' : 'Product created successfully.');
        this.resetForm();
        this.loadProducts();
      },
      error: (err) => {
        this.notifications.error(
          err?.error?.message || err?.error?.error || err?.message || 'Unable to save the product.',
          'Save Failed'
        );
      },
    });
  }

  edit(product: ProductResponse): void {
    this.editingId = product.productId;
    this.submitAttempted = false;
    this.form.patchValue({
      sku: product.sku,
      name: product.name,
      description: product.description ?? null,
      category: product.category,
      brand: product.brand ?? null,
      unitOfMeasure: product.unitOfMeasure,
      costPrice: product.costPrice,
      sellingPrice: product.sellingPrice,
      reorderLevel: product.reorderLevel,
      maxStockLevel: product.maxStockLevel,
      leadTimeDays: product.leadTimeDays,
      imageUrl: product.imageUrl ?? null,
      barcode: product.barcode ?? null,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
    this.submitAttempted = false;
    this.form.reset({
      sku: '',
      name: '',
      description: null,
      category: '',
      brand: null,
      unitOfMeasure: '',
      costPrice: null,
      sellingPrice: null,
      reorderLevel: null,
      maxStockLevel: null,
      leadTimeDays: null,
      imageUrl: null,
      barcode: null,
    });
  }

  resetFilters(): void {
    this.searchControl.setValue('');
    this.categoryControl.setValue('');
    this.brandControl.setValue('');
    this.loadProducts();
  }

  private buildPayload(): ProductRequest {
    const raw = this.form.getRawValue();
    return {
      sku: raw.sku!.trim(),
      name: raw.name!.trim(),
      category: raw.category!.trim(),
      unitOfMeasure: raw.unitOfMeasure!.trim(),
      costPrice: raw.costPrice!,
      sellingPrice: raw.sellingPrice!,
      reorderLevel: raw.reorderLevel!,
      maxStockLevel: raw.maxStockLevel!,
      leadTimeDays: raw.leadTimeDays!,
      description: raw.description?.trim() || null,
      brand: raw.brand?.trim() || null,
      barcode: raw.barcode?.trim() || null,
      imageUrl: raw.imageUrl?.trim() || null,
    };
  }

  private filterProducts(
    products: ProductResponse[],
    searchTerm: string,
    category: string,
    brand: string
  ): ProductResponse[] {
    const normalizedSearch = searchTerm.toLowerCase();
    return products.filter((product) => {
      const matchesSearch =
        !normalizedSearch ||
        [product.name, product.sku, product.barcode ?? '', product.category, product.brand ?? ''].some((value) =>
          value.toLowerCase().includes(normalizedSearch)
        );

      return matchesSearch && (!category || product.category === category) && (!brand || product.brand === brand);
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
