import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Observable, forkJoin, of, switchMap, map } from 'rxjs';
import { isManagerRole } from '../../../../core/constants/roles';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../core/services/toast.service';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { ProductFilterComponent, ProductFilterValue } from '../../components/product-filter/product-filter.component';
import { ProductTableComponent, ProductTableSortChange } from '../../components/product-table/product-table.component';
import { Product, ProductSearchRequest } from '../../models';
import { ProductApiService } from '../../services/product-api.service';

type ProductAction = 'deactivate' | 'delete';

@Component({
  selector: 'app-product-list-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ProductFilterComponent,
    ProductTableComponent,
    ConfirmDialogComponent,
    EmptyStateComponent
  ],
  templateUrl: './product-list-page.component.html',
  styleUrls: ['./product-list-page.component.css']
})
export class ProductListPageComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly productApi = inject(ProductApiService);
  private readonly toast = inject(ToastService);

  readonly products = signal<Product[]>([]);
  readonly categories = signal<string[]>([]);
  readonly brands = signal<string[]>([]);
  readonly totalElements = signal(0);
  readonly page = signal(0);
  readonly loading = signal(true);
  readonly errorMessage = signal('');
  readonly sortBy = signal('updatedAt');
  readonly sortDirection = signal<'asc' | 'desc'>('desc');
  readonly filters = signal<ProductSearchRequest>({
    searchText: '',
    category: '',
    brand: '',
    isActive: null
  });
  readonly actionTarget = signal<Product | null>(null);
  readonly actionType = signal<ProductAction | null>(null);
  readonly actionSubmitting = signal(false);

  readonly pageSize = 10;
  readonly canManageProducts = computed(() =>
    isManagerRole(this.auth.currentUser()?.role)
  );

  ngOnInit(): void {
    this.loadProducts();
    this.loadFilterOptions();
  }

  applyFilters(filters: ProductFilterValue): void {
    this.filters.set(filters);
    this.page.set(0);
    this.loadProducts();
  }

  changePage(page: number): void {
    this.page.set(page);
    this.loadProducts();
  }

  changeSort(change: ProductTableSortChange): void {
    this.sortBy.set(change.sortBy);
    this.sortDirection.set(change.sortDirection);
    this.page.set(0);
    this.loadProducts();
  }

  viewProduct(product: Product): void {
    this.router.navigate(['/products', product.productId]);
  }

  editProduct(product: Product): void {
    this.router.navigate(['/products', product.productId, 'edit']);
  }

  openActionDialog(product: Product, action: ProductAction): void {
    this.actionTarget.set(product);
    this.actionType.set(action);
  }

  closeActionDialog(): void {
    this.actionTarget.set(null);
    this.actionType.set(null);
    this.actionSubmitting.set(false);
  }

  confirmAction(): void {
    const target = this.actionTarget();
    const action = this.actionType();

    if (!target || !action) {
      return;
    }

    this.actionSubmitting.set(true);

    const request: Observable<unknown> =
      action === 'delete'
        ? this.productApi.deleteProduct(target.productId)
        : this.productApi.deactivateProduct(target.productId);

    request.subscribe({
      next: () => {
        if (action === 'delete' && this.products().length === 1 && this.page() > 0) {
          this.page.update((currentPage) => currentPage - 1);
        }

        this.toast.success(
          action === 'delete' ? 'Product deleted' : 'Product deactivated',
          `${target.name} was updated successfully.`
        );
        this.closeActionDialog();
        this.loadProducts();
      },
      error: (error: HttpErrorResponse) => {
        this.actionSubmitting.set(false);
        this.toast.error('Action failed', error.error?.message ?? 'Please try again.');
      }
    });
  }

  retry(): void {
    this.loadProducts();
    this.loadFilterOptions();
  }

  private loadProducts(): void {
    const request = this.buildRequest();
    const source = this.hasFilters(request)
      ? this.productApi.searchProducts(request)
      : this.productApi.getAllProducts(request);

    this.loading.set(true);
    this.errorMessage.set('');

    source.subscribe({
      next: (response) => {
        this.products.set(response.content);
        this.totalElements.set(response.totalElements);
        this.loading.set(false);
      },
      error: (error) => {
        this.loading.set(false);
        this.products.set([]);
        this.totalElements.set(0);
        this.errorMessage.set(
          error.error?.message ?? 'Unable to load the product catalogue right now.'
        );
      }
    });
  }

  private loadFilterOptions(): void {
    const request: ProductSearchRequest = {
      page: 0,
      size: 200,
      sortBy: 'name',
      sortDirection: 'asc'
    };

    this.productApi
      .getAllProducts(request)
      .pipe(
        switchMap((firstPage) => {
          if (firstPage.totalPages <= 1) {
            return of(firstPage.content);
          }

          const requests = Array.from({ length: firstPage.totalPages - 1 }, (_, index) =>
            this.productApi.getAllProducts({ ...request, page: index + 1 })
          );

          return forkJoin(requests).pipe(
            map((remainingPages) => [firstPage, ...remainingPages].flatMap((page) => page.content))
          );
        })
      )
      .subscribe({
        next: (products) => {
          const categories = new Set<string>();
          const brands = new Set<string>();

          products.forEach((product) => {
            if (product.category) {
              categories.add(product.category);
            }

            if (product.brand) {
              brands.add(product.brand);
            }
          });

          this.categories.set([...categories].sort((left, right) => left.localeCompare(right)));
          this.brands.set([...brands].sort((left, right) => left.localeCompare(right)));
        },
        error: () => {
          this.categories.set([]);
          this.brands.set([]);
        }
      });
  }

  private buildRequest(): ProductSearchRequest {
    return {
      ...this.filters(),
      page: this.page(),
      size: this.pageSize,
      sortBy: this.sortBy(),
      sortDirection: this.sortDirection()
    };
  }

  private hasFilters(request: ProductSearchRequest): boolean {
    return Boolean(
      request.searchText?.trim() ||
        request.category?.trim() ||
        request.brand?.trim() ||
        request.isActive !== null
    );
  }
}
