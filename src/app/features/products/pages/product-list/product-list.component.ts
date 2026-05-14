import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
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
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly canManage = this.authService.hasRole([UserRole.ADMIN, UserRole.MANAGER]);
  readonly canDelete = this.authService.hasRole([UserRole.ADMIN, UserRole.MANAGER]);
  readonly canViewSummary = this.authService.hasRole([UserRole.ADMIN, UserRole.MANAGER]);

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

  dashboardContext: 'default' | 'category-overview' = 'default';

  ngOnInit(): void {
    this.applyDashboardQueryParams();
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
    this.dashboardContext = this.filters.category ? 'default' : this.dashboardContext;
    this.syncQueryParams();
    this.loadProducts();
  }

  onResetFilters(): void {
    this.filters = {
      page: 0,
      size: 10,
      sortBy: 'name',
      sortDir: 'asc',
    };
    this.dashboardContext = 'default';
    this.syncQueryParams();
    this.loadProducts();
  }

  changePage(nextPage: number): void {
    if (!this.pageData || nextPage < 0 || nextPage >= this.pageData.totalPages) {
      return;
    }
    this.filters = { ...this.filters, page: nextPage };
    this.syncQueryParams();
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
    this.syncQueryParams();
    this.loadProducts();
  }

  toggleStatus(product: Product): void {
    if (!this.canManage) {
      return;
    }

    this.actionLoadingId = product.productId;
    this.actionType = product.isActive ? 'deactivate' : 'activate';
    this.cdr.markForCheck();
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

    if (!window.confirm('Delete product? This will mark it inactive.')) {
      return;
    }

    this.actionLoadingId = product.productId;
    this.actionType = 'delete';
    this.cdr.markForCheck();
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
    this.cdr.markForCheck();
    forkJoin({
      categories: this.productApi.getCategories(),
      brands: this.productApi.getBrands(),
    })
      .pipe(finalize(() => {
        this.lookupsLoading = false;
        this.refreshView();
      }))
      .subscribe({
        next: ({ categories, brands }) => {
          this.categories = [...categories];
          this.brands = [...brands];
          this.refreshView();
        },
        error: () => {
          this.categories = [];
          this.brands = [];
          this.refreshView();
        },
      });
  }

  private loadSummary(): void {
    if (!this.canViewSummary) {
      return;
    }

    this.productApi.getProductSummary().subscribe({
      next: (summary) => {
        this.summary = { ...summary };
        this.refreshView();
      },
      error: () => {
        this.summary = null;
        this.refreshView();
      },
    });
  }

  private loadProducts(): void {
    this.loading = true;
    this.cdr.markForCheck();
    const request = this.hasSearchCriteria(this.filters)
      ? this.productApi.searchProducts(this.filters)
      : this.productApi.getProducts(this.filters);

    request.pipe(finalize(() => {
      this.loading = false;
      this.refreshView();
    })).subscribe({
      next: (pageData) => {
        const products = pageData.content ?? [];
        this.pageData = { ...pageData, content: [...products] };
        this.products = [...products];
        this.refreshView();
      },
      error: () => {
        this.products = [];
        this.pageData = null;
        this.refreshView();
      },
    });
  }

  private hasSearchCriteria(filters: ProductListQuery): boolean {
    return Boolean(filters.keyword || filters.category || filters.brand || filters.isActive !== undefined);
  }

  private applyDashboardQueryParams(): void {
    const queryParams = this.route.snapshot.queryParamMap;
    const status = queryParams.get('status');
    const category = queryParams.get('category');
    const sortBy = queryParams.get('sortBy');
    const sortDir = queryParams.get('sortDir');
    const categoryView = queryParams.get('view');

    this.filters = {
      ...this.filters,
      category: category || undefined,
      sortBy: sortBy || this.filters.sortBy,
      sortDir: sortDir === 'desc' ? 'desc' : 'asc',
      isActive:
        status === 'active' ? true :
        status === 'inactive' ? false :
        undefined,
    };

    this.dashboardContext = categoryView === 'categories' ? 'category-overview' : 'default';

    if (this.dashboardContext === 'category-overview' && !category && !sortBy) {
      this.filters = {
        ...this.filters,
        sortBy: 'category',
        sortDir: 'asc',
      };
    }
  }

  private syncQueryParams(): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        status:
          this.filters.isActive === true ? 'active' :
          this.filters.isActive === false ? 'inactive' :
          null,
        category: this.filters.category || null,
        sortBy: this.filters.sortBy !== 'name' ? this.filters.sortBy : null,
        sortDir: this.filters.sortDir !== 'asc' ? this.filters.sortDir : null,
        view: this.dashboardContext === 'category-overview' ? 'categories' : null,
      },
      queryParamsHandling: '',
      replaceUrl: true,
    });
  }

  private clearActionState(): void {
    this.actionLoadingId = null;
    this.actionType = null;
    this.refreshView();
  }

  private refreshView(): void {
    this.cdr.markForCheck();
    this.cdr.detectChanges();
  }
}


