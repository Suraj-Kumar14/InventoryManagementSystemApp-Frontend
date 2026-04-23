import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { isManagerRole } from '../../../core/constants/roles';
import { AuthService } from '../../../core/services/auth.service';
import { ProductService } from '../../../core/services/product.service';
import { ToastService } from '../../../core/services/toast.service';
import { Product } from '../../../core/models';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

type ProductAction = 'delete' | 'deactivate';
type ActiveFilter = 'ALL' | 'ACTIVE' | 'INACTIVE';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    ConfirmDialogComponent,
    EmptyStateComponent
  ],
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.css']
})
export class ProductListComponent implements OnInit {
  private readonly fb = inject(FormBuilder);

  auth = inject(AuthService);
  productSvc = inject(ProductService);
  toast = inject(ToastService);

  products = signal<Product[]>([]);
  totalElements = signal(0);
  page = signal(0);
  loading = signal(true);
  categories = signal<string[]>([]);
  brands = signal<string[]>([]);

  actionTarget = signal<Product | null>(null);
  actionType = signal<ProductAction | null>(null);
  submittingAction = signal(false);

  readonly pageSize = 10;
  readonly isManager = computed(() => isManagerRole(this.auth.currentUser()?.role));

  readonly filtersForm = this.fb.group({
    keyword: [''],
    category: [''],
    brand: [''],
    activeFilter: ['ALL' as ActiveFilter]
  });

  ngOnInit(): void {
    this.loadFilterOptions();
    this.loadProducts();
  }

  applyFilters(): void {
    this.page.set(0);
    this.loadProducts();
  }

  resetFilters(): void {
    this.filtersForm.reset({
      keyword: '',
      category: '',
      brand: '',
      activeFilter: 'ALL'
    });
    this.applyFilters();
  }

  onPageChange(nextPage: number): void {
    this.page.set(nextPage);
    this.loadProducts();
  }

  openActionDialog(product: Product, action: ProductAction): void {
    this.actionTarget.set(product);
    this.actionType.set(action);
  }

  closeActionDialog(): void {
    this.actionTarget.set(null);
    this.actionType.set(null);
    this.submittingAction.set(false);
  }

  confirmAction(): void {
    const target = this.actionTarget();
    const action = this.actionType();

    if (!target || !action) {
      return;
    }

    this.submittingAction.set(true);

    const request: Observable<unknown> =
      action === 'delete'
        ? this.productSvc.delete(target.productId)
        : this.productSvc.deactivate(target.productId);

    request.subscribe({
      next: () => {
        this.toast.success(
          action === 'delete' ? 'Product deleted' : 'Product deactivated',
          `${target.name} updated successfully.`
        );
        this.closeActionDialog();
        this.loadProducts();
      },
      error: (error: HttpErrorResponse) => {
        this.submittingAction.set(false);
        this.toast.error('Action failed', error.error?.message ?? 'Please try again.');
      }
    });
  }

  trackByProduct(_index: number, product: Product): number {
    return product.productId;
  }

  private loadProducts(): void {
    const filters = this.filtersForm.getRawValue();

    this.loading.set(true);
    this.productSvc
      .getAll(
        this.page(),
        this.pageSize,
        filters.keyword ?? '',
        filters.category ?? '',
        filters.brand ?? '',
        (filters.activeFilter ?? 'ALL') as ActiveFilter
      )
      .subscribe({
        next: (response) => {
          this.products.set(response.content);
          this.totalElements.set(response.totalElements);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.toast.error('Products unavailable', 'Unable to load product data.');
        }
      });
  }

  private loadFilterOptions(): void {
    this.productSvc.getAllProducts().subscribe({
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

        this.categories.set([...categories].sort());
        this.brands.set([...brands].sort());
      },
      error: () => {}
    });
  }
}
