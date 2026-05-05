import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { PageResponse, SupplierResponse, SupplierSummaryResponse } from '../../../../core/http/backend.models';
import { NotificationService } from '../../../../core/services/notification.service';
import { UserRole } from '../../../../shared/config/app-config';
import { SupplierRatingComponent } from '../../components/supplier-rating/supplier-rating.component';
import { SupplierStatusBadgeComponent } from '../../components/supplier-status-badge/supplier-status-badge.component';
import { SupplierSummaryCardsComponent } from '../../components/supplier-summary-cards/supplier-summary-cards.component';
import { SupplierListQuery, SupplierSortField } from '../../models/supplier.model';
import { SupplierApiService } from '../../services/supplier-api.service';

@Component({
  selector: 'app-supplier-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    SupplierStatusBadgeComponent,
    SupplierRatingComponent,
    SupplierSummaryCardsComponent,
  ],
  templateUrl: './supplier-list.component.html',
  styleUrls: ['./supplier-list.component.css'],
})
export class SupplierListComponent implements OnInit {
  private static readonly DEFAULT_SUMMARY: SupplierSummaryResponse = {
    totalSuppliers: 0,
    activeSuppliers: 0,
    inactiveSuppliers: 0,
    blacklistedSuppliers: 0,
    pendingReviewSuppliers: 0,
    averageRating: 0,
    averageLeadTimeDays: 0,
  };

  private readonly supplierApi = inject(SupplierApiService);
  private readonly authService = inject(AuthService);
  private readonly notifications = inject(NotificationService);
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly canCreate = this.authService.hasRole([UserRole.ADMIN, UserRole.OFFICER]);
  readonly canEdit = this.authService.hasRole([UserRole.ADMIN, UserRole.OFFICER, UserRole.MANAGER]);
  readonly canDeactivate = this.authService.hasRole([UserRole.ADMIN, UserRole.MANAGER]);
  readonly canBlacklist = this.authService.hasRole(UserRole.ADMIN);
  readonly canRate = this.authService.hasRole([UserRole.ADMIN, UserRole.OFFICER, UserRole.MANAGER]);
  readonly canViewAnalytics = this.authService.hasRole([UserRole.ADMIN, UserRole.OFFICER, UserRole.MANAGER]);

  readonly filtersForm = this.fb.group({
    keyword: this.fb.control(''),
    status: this.fb.control<string | null>(null),
    isActive: this.fb.control<string>('all'),
    city: this.fb.control(''),
    country: this.fb.control(''),
    minRating: this.fb.control<number | null>(null),
    maxLeadTimeDays: this.fb.control<number | null>(null),
  });

  suppliers: SupplierResponse[] = [];
  pageData: PageResponse<SupplierResponse> | null = null;
  summary: SupplierSummaryResponse = SupplierListComponent.DEFAULT_SUMMARY;
  loading = false;
  summaryError: string | null = null;
  actionLoadingId: number | null = null;
  actionLabel = '';
  query: SupplierListQuery = { page: 0, size: 10, sortBy: 'name', sortDir: 'asc' };

  ngOnInit(): void {
    this.applyDashboardQueryParams();
    this.applyCreateNavigationState();
    this.loadSummary();
    this.loadSuppliers();
  }

  onSearch(): void {
    const raw = this.filtersForm.getRawValue();
    this.query = {
      ...this.query,
      keyword: raw.keyword || undefined,
      status: raw.status || undefined,
      isActive: raw.isActive === 'all' ? undefined : raw.isActive === 'true',
      city: raw.city || undefined,
      country: raw.country || undefined,
      minRating: raw.minRating ?? undefined,
      maxLeadTimeDays: raw.maxLeadTimeDays ?? undefined,
      page: 0,
    };
    this.syncQueryParams();
    this.loadSuppliers();
  }

  resetFilters(): void {
    this.filtersForm.reset({
      keyword: '',
      status: null,
      isActive: 'all',
      city: '',
      country: '',
      minRating: null,
      maxLeadTimeDays: null,
    });
    this.query = { page: 0, size: 10, sortBy: 'name', sortDir: 'asc' };
    this.syncQueryParams();
    this.loadSuppliers();
  }

  sortBy(field: SupplierSortField): void {
    const sortDir = this.query.sortBy === field && this.query.sortDir === 'asc' ? 'desc' : 'asc';
    this.query = { ...this.query, sortBy: field, sortDir, page: 0 };
    this.syncQueryParams();
    this.loadSuppliers();
  }

  changePage(page: number): void {
    if (!this.pageData || page < 0 || page >= this.pageData.totalPages) {
      return;
    }
    this.query = { ...this.query, page };
    this.syncQueryParams();
    this.loadSuppliers();
  }

  activateSupplier(supplier: SupplierResponse): void {
    this.runAction(supplier.supplierId, 'Activating...', () => this.supplierApi.activateSupplier(supplier.supplierId), 'Supplier activated successfully');
  }

  deactivateSupplier(supplier: SupplierResponse): void {
    const reason = window.prompt('Deactivation reason is required:');
    if (!reason?.trim()) {
      return;
    }
    this.runAction(
      supplier.supplierId,
      'Deactivating...',
      () => this.supplierApi.deactivateSupplier(supplier.supplierId, { reason: reason.trim() }),
      'Supplier deactivated successfully'
    );
  }

  blacklistSupplier(supplier: SupplierResponse): void {
    const reason = window.prompt('Blacklist reason is required:');
    if (!reason?.trim()) {
      return;
    }
    this.runAction(
      supplier.supplierId,
      'Blacklisting...',
      () => this.supplierApi.blacklistSupplier(supplier.supplierId, { reason: reason.trim() }),
      'Supplier blacklisted successfully'
    );
  }

  updateRating(supplier: SupplierResponse): void {
    const rating = Number(window.prompt('Enter supplier rating between 0 and 5:', String(supplier.rating ?? 0)));
    if (Number.isNaN(rating)) {
      return;
    }
    const remarks = window.prompt('Optional rating remarks:') ?? '';
    this.runAction(
      supplier.supplierId,
      'Updating...',
      () => this.supplierApi.updateSupplierRating(supplier.supplierId, { rating, remarks }),
      'Supplier rating updated successfully'
    );
  }

  deleteSupplier(supplier: SupplierResponse): void {
    if (!window.confirm(`Delete supplier ${supplier.name}? This is only safe when it has no purchase orders.`)) {
      return;
    }
    this.actionLoadingId = supplier.supplierId;
    this.actionLabel = 'Deleting...';
    this.supplierApi.deleteSupplier(supplier.supplierId).pipe(
      finalize(() => {
        this.actionLoadingId = null;
        this.actionLabel = '';
      })
    ).subscribe({
      next: () => {
        this.notifications.success('Supplier deleted successfully');
        this.loadSuppliers();
        this.loadSummary();
      },
    });
  }

  getSortMarker(field: SupplierSortField): string {
    if (this.query.sortBy !== field) {
      return '';
    }
    return this.query.sortDir === 'asc' ? '^' : 'v';
  }

  private loadSuppliers(): void {
    this.loading = true;
    const request = this.hasSearchFilters()
      ? this.supplierApi.searchSuppliers(this.query)
      : this.supplierApi.getSuppliers(this.query);

    request.pipe(finalize(() => (this.loading = false))).subscribe({
      next: (pageData) => {
        this.pageData = pageData;
        this.suppliers = pageData.content ?? [];
      },
      error: () => {
        this.pageData = null;
        this.suppliers = [];
      },
    });
  }

  private loadSummary(): void {
    if (!this.canViewAnalytics) {
      this.summary = SupplierListComponent.DEFAULT_SUMMARY;
      this.summaryError = null;
      return;
    }
    this.supplierApi.getSupplierSummary().subscribe({
      next: (summary) => {
        this.summary = summary;
        this.summaryError = null;
      },
      error: () => {
        this.summary = SupplierListComponent.DEFAULT_SUMMARY;
        this.summaryError = 'Supplier summary is currently unavailable.';
      },
    });
  }

  private hasSearchFilters(): boolean {
    return Boolean(
      this.query.keyword ||
        this.query.status ||
        this.query.isActive !== undefined ||
        this.query.city ||
        this.query.country ||
        this.query.minRating !== undefined ||
        this.query.maxLeadTimeDays !== undefined
    );
  }

  private runAction(
    supplierId: number,
    loadingLabel: string,
    requestFactory: () => ReturnType<SupplierApiService['activateSupplier']>,
    successMessage: string
  ): void {
    this.actionLoadingId = supplierId;
    this.actionLabel = loadingLabel;
    requestFactory()
      .pipe(finalize(() => {
        this.actionLoadingId = null;
        this.actionLabel = '';
      }))
      .subscribe({
        next: () => {
          this.notifications.success(successMessage);
          this.loadSuppliers();
          this.loadSummary();
        },
      });
  }

  private applyDashboardQueryParams(): void {
    const queryParams = this.route.snapshot.queryParamMap;
    const status = queryParams.get('status');
    const isActive = queryParams.get('isActive');

    this.filtersForm.patchValue({
      status,
      isActive: isActive === null ? 'all' : isActive,
    });

    this.query = {
      ...this.query,
      status: status || undefined,
      isActive:
        isActive === 'true' ? true :
        isActive === 'false' ? false :
        undefined,
    };
  }

  private applyCreateNavigationState(): void {
    const state = history.state as { createdSupplierName?: string } | null;
    const createdSupplierName = state?.createdSupplierName?.trim();

    if (!createdSupplierName) {
      return;
    }

    this.filtersForm.patchValue({ keyword: createdSupplierName });
    this.query = {
      ...this.query,
      keyword: createdSupplierName,
      page: 0,
    };
  }

  private syncQueryParams(): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        status: this.query.status ?? null,
        isActive:
          this.query.isActive === true ? 'true' :
          this.query.isActive === false ? 'false' :
          null,
      },
      queryParamsHandling: '',
      replaceUrl: true,
    });
  }
}
