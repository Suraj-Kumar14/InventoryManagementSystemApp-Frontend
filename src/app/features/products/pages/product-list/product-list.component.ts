import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { PageResponse, Product, ProductSummary } from '../../../../core/http/backend.models';
import { NotificationService } from '../../../../core/services/notification.service';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { UserRole } from '../../../../shared/config/app-config';
import { ProductFilterComponent } from '../../components/product-filter/product-filter.component';
import { ProductListQuery } from '../../models/product.model';
import { ProductApiService } from '../../services/product-api.service';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, RouterLink, ProductFilterComponent, LoadingSpinnerComponent],
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.css'],
})
export class ProductListComponent implements OnInit {
  private readonly productApi = inject(ProductApiService);
  private readonly authService = inject(AuthService);
  private readonly notifications = inject(NotificationService);

  readonly canManage = this.authService.hasRole([UserRole.ADMIN, UserRole.INVENTORY_MANAGER]);
  readonly canDelete = this.authService.hasRole(UserRole.ADMIN);
  readonly canViewSummary = this.authService.hasRole([UserRole.ADMIN, UserRole.INVENTORY_MANAGER]);

  products: Product[] = [];
  categories: string[] = [];
  brands: string[] = [];
  summary: ProductSummary | null = null;
  pageData: PageResponse<Product> | null = null;
  loading = false;
  lookupsLoading = false;
  actionLoadingId: number | null = null;
  actionType: 'activate' | 'deactivate' | 'delete' | null = null;

  filters: ProductListQuery = {
    page: 0,
    size: 10,
    sortBy: 'name',
    sortDir: 'asc',
  };

  ngOnInit(): void {
    this.loadLookups();
    this.loadSummary();
    this.loadProducts();
  }

  onSearch(filters: ProductListQuery): void {
    this.filters = {
      ...this.filters,
      ...filters,
      page: 0,
    };
    this.loadProducts();
  }

  onResetFilters(): void {
    this.filters = {
      page: 0,
      size: 10,
      sortBy: 'name',
      sortDir: 'asc',
    };
    this.loadProducts();
  }

  changePage(nextPage: number): void {
    if (!this.pageData || nextPage < 0 || nextPage >= this.pageData.totalPages) {
      return;
    }
    this.filters = { ...this.filters, page: nextPage };
    this.loadProducts();
  }

  sortBy(column: string): void {
    const nextDirection =
      this.filters.sortBy === column && this.filters.sortDir === 'asc' ? 'desc' : 'asc';
    this.filters = {
      ...this.filters,
      sortBy: column,
      sortDir: nextDirection,
      page: 0,
    };
    this.loadProducts();
  }

  toggleStatus(product: Product): void {
    if (!this.canManage) {
      return;
    }

    this.actionLoadingId = product.productId;
    this.actionType = product.isActive ? 'deactivate' : 'activate';
    const request = product.isActive
      ? this.productApi.deactivateProduct(product.productId)
      : this.productApi.activateProduct(product.productId);

    request.pipe(finalize(() => this.clearActionState())).subscribe({
      next: (updatedProduct) => {
        this.notifications.success(
          updatedProduct.isActive ? 'Product activated successfully' : 'Product deactivated successfully'
        );
        this.loadProducts();
        this.loadSummary();
      },
    });
  }

  deleteProduct(product: Product): void {
    if (!this.canDelete) {
      return;
    }

    this.actionLoadingId = product.productId;
    this.actionType = 'delete';
    this.productApi
      .deleteProduct(product.productId)
      .pipe(finalize(() => this.clearActionState()))
      .subscribe({
        next: () => {
          this.notifications.success('Product deleted successfully');
          this.loadProducts();
          this.loadSummary();
        },
      });
  }

  getSortLabel(column: string): string {
    if (this.filters.sortBy !== column) {
      return '';
    }
    return this.filters.sortDir === 'asc' ? '^' : 'v';
  }

  getActionLabel(product: Product): string {
    if (this.actionLoadingId === product.productId) {
      if (this.actionType === 'delete') {
        return 'Deleting...';
      }
      return this.actionType === 'deactivate' ? 'Deactivating...' : 'Activating...';
    }
    return product.isActive ? 'Deactivate' : 'Activate';
  }

  private loadLookups(): void {
    this.lookupsLoading = true;
    forkJoin({
      categories: this.productApi.getCategories(),
      brands: this.productApi.getBrands(),
    })
      .pipe(finalize(() => (this.lookupsLoading = false)))
      .subscribe({
        next: ({ categories, brands }) => {
          this.categories = categories;
          this.brands = brands;
        },
        error: () => {
          this.categories = [];
          this.brands = [];
        },
      });
  }

  private loadSummary(): void {
    if (!this.canViewSummary) {
      return;
    }

    this.productApi.getProductSummary().subscribe({
      next: (summary) => {
        this.summary = summary;
      },
      error: () => {
        this.summary = null;
      },
    });
  }

  private loadProducts(): void {
    this.loading = true;
    const request = this.hasSearchCriteria(this.filters)
      ? this.productApi.searchProducts(this.filters)
      : this.productApi.getProducts(this.filters);

    request.pipe(finalize(() => (this.loading = false))).subscribe({
      next: (pageData) => {
        this.pageData = pageData;
        this.products = pageData.content;
      },
      error: () => {
        this.products = [];
        this.pageData = null;
      },
    });
  }

  private hasSearchCriteria(filters: ProductListQuery): boolean {
    return Boolean(filters.keyword || filters.category || filters.brand || filters.isActive !== undefined);
  }

  private clearActionState(): void {
    this.actionLoadingId = null;
    this.actionType = null;
  }
}
