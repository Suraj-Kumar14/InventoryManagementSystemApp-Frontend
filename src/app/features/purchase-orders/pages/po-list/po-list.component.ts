import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { finalize } from 'rxjs/operators';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { PageResponse, PurchaseOrderResponse, PurchaseOrderSummaryResponse, SupplierResponse, WarehouseResponse } from '../../../../core/http/backend.models';
import { NotificationService } from '../../../../core/services/notification.service';
import { UserRole } from '../../../../shared/config/app-config';
import { PoStatusBadgeComponent } from '../../components/po-status-badge/po-status-badge.component';
import { PoSummaryCardsComponent } from '../../components/po-summary-cards/po-summary-cards.component';
import { PurchaseOrderListQuery, PurchaseOrderStatus } from '../../models/purchase-order.model';
import { PurchaseOrderApiService } from '../../services/purchase-order-api.service';

@Component({
  selector: 'app-po-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, PoStatusBadgeComponent, PoSummaryCardsComponent],
  templateUrl: './po-list.component.html',
  styleUrls: ['./po-list.component.css'],
})
export class PoListComponent implements OnInit {
  private static readonly DEFAULT_SUMMARY: PurchaseOrderSummaryResponse = {
    totalPurchaseOrders: 0,
    draftCount: 0,
    pendingApprovalCount: 0,
    approvedCount: 0,
    partiallyReceivedCount: 0,
    receivedCount: 0,
    cancelledCount: 0,
    rejectedCount: 0,
    overdueCount: 0,
    totalPurchaseValue: 0,
    pendingPurchaseValue: 0,
    receivedPurchaseValue: 0,
  };

  private readonly purchaseApi = inject(PurchaseOrderApiService);
  private readonly authService = inject(AuthService);
  private readonly notifications = inject(NotificationService);
  private readonly fb = inject(FormBuilder);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly roles = UserRole;
  readonly statuses: PurchaseOrderStatus[] = [
    'DRAFT',
    'PENDING_PAYMENT',
    'PAYMENT_INITIATED',
    'PENDING_APPROVAL',
    'APPROVED',
    'PAID',
    'PARTIALLY_RECEIVED',
    'RECEIVED',
    'CANCELLED',
    'REJECTED',
  ];

  readonly canCreate = this.authService.hasRole([UserRole.ADMIN, UserRole.OFFICER]);
  readonly canApprove = this.authService.hasRole([UserRole.ADMIN, UserRole.MANAGER]);
  readonly canReceive = this.authService.hasRole([UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF]);
  readonly canViewAnalytics = this.authService.hasRole([UserRole.ADMIN, UserRole.MANAGER, UserRole.OFFICER]);
  readonly canLoadSupplierLookups = this.authService.hasRole([UserRole.ADMIN, UserRole.MANAGER, UserRole.OFFICER]);

  filtersForm = this.fb.group({
    keyword: this.fb.control<string>(''),
    supplierId: this.fb.control<number | null>(null),
    warehouseId: this.fb.control<number | null>(null),
    status: this.fb.control<PurchaseOrderStatus | null>(null),
    fromDate: this.fb.control<string>(''),
    toDate: this.fb.control<string>(''),
    overdueOnly: this.fb.control<boolean>(false),
  });

  purchaseOrders: PurchaseOrderResponse[] = [];
  pageData: PageResponse<PurchaseOrderResponse> | null = null;
  summary: PurchaseOrderSummaryResponse = PoListComponent.DEFAULT_SUMMARY;
  suppliers: SupplierResponse[] = [];
  warehouses: WarehouseResponse[] = [];
  loading = false;
  loadError: string | null = null;
  summaryError: string | null = null;
  lookupError: string | null = null;
  actionLoadingIds = new Set<number>();
  actionLabel = '';
  query: PurchaseOrderListQuery = { page: 0, size: 10, sortBy: 'createdAt', sortDir: 'desc' };

  ngOnInit(): void {
    this.applyDashboardQueryParams();
    this.loadLookups();
    this.loadSummary();
    this.loadPurchaseOrders();
  }

  onSearch(): void {
    const raw = this.filtersForm.getRawValue();
    this.query = {
      ...this.query,
      keyword: raw.keyword || undefined,
      supplierId: raw.supplierId ?? undefined,
      warehouseId: raw.warehouseId ?? undefined,
      status: raw.status ?? undefined,
      fromDate: raw.fromDate || undefined,
      toDate: raw.toDate || undefined,
      overdueOnly: raw.overdueOnly || undefined,
      page: 0,
    };
    this.syncQueryParams();
    this.loadPurchaseOrders();
  }

  resetFilters(): void {
    this.filtersForm.reset({
      keyword: '',
      supplierId: null,
      warehouseId: null,
      status: null,
      fromDate: '',
      toDate: '',
      overdueOnly: false,
    });
    this.query = { page: 0, size: 10, sortBy: 'createdAt', sortDir: 'desc' };
    this.syncQueryParams();
    this.loadPurchaseOrders();
  }

  changePage(page: number): void {
    if (!this.pageData || page < 0 || page >= this.pageData.totalPages) {
      return;
    }
    this.query = { ...this.query, page };
    this.syncQueryParams();
    this.loadPurchaseOrders();
  }

  sortBy(column: string): void {
    const sortDir = this.query.sortBy === column && this.query.sortDir === 'asc' ? 'desc' : 'asc';
    this.query = { ...this.query, sortBy: column, sortDir, page: 0 };
    this.syncQueryParams();
    this.loadPurchaseOrders();
  }

  submitPurchaseOrder(order: PurchaseOrderResponse): void {
    const orderId = this.getOrderId(order);
    if (this.isActionLoading(orderId)) {
      return;
    }
    const remarks = window.prompt('Remarks for submission (optional):') ?? '';
    this.runAction(order, 'Submitting...', () => this.purchaseApi.submitPurchaseOrder(orderId, { remarks }), 'Purchase order submitted for approval.');
  }

  approvePurchaseOrder(order: PurchaseOrderResponse): void {
    const approvalRemarks = window.prompt('Approval remarks (optional):') ?? '';
    this.runAction(order, 'Approving...', () => this.purchaseApi.approvePurchaseOrder(this.getOrderId(order), { approvalRemarks }), 'Purchase order approved successfully');
  }

  rejectPurchaseOrder(order: PurchaseOrderResponse): void {
    const rejectionReason = window.prompt('Rejection reason is required:');
    if (!rejectionReason) {
      return;
    }
    this.runAction(order, 'Rejecting...', () => this.purchaseApi.rejectPurchaseOrder(this.getOrderId(order), { rejectionReason }), 'Purchase order rejected successfully');
  }

  cancelPurchaseOrder(order: PurchaseOrderResponse): void {
    const cancellationReason = window.prompt('Cancellation reason is required:');
    if (!cancellationReason) {
      return;
    }
    this.runAction(order, 'Cancelling...', () => this.purchaseApi.cancelPurchaseOrder(this.getOrderId(order), { cancellationReason }), 'Purchase order cancelled successfully');
  }

  canEdit(order: PurchaseOrderResponse): boolean {
    const status = order.status;
    const currentUserId = this.authService.getUserId();
    const isOwner = currentUserId !== null && (order.createdById === currentUserId || order.createdBy === currentUserId);
    return (
      status !== 'RECEIVED' &&
      status !== 'CANCELLED' &&
      status !== 'REJECTED' &&
      (this.authService.hasRole(UserRole.ADMIN) || (this.authService.hasRole(UserRole.OFFICER) && isOwner))
    );
  }

  canSubmit(order: PurchaseOrderResponse): boolean {
    return order.status === 'DRAFT' && (this.authService.hasRole(UserRole.ADMIN) || this.authService.hasRole(UserRole.OFFICER));
  }

  canCancel(order: PurchaseOrderResponse): boolean {
    return ['DRAFT', 'PENDING_PAYMENT', 'PAYMENT_INITIATED', 'PENDING_APPROVAL', 'APPROVED'].includes(order.status);
  }

  canShowApprove(order: PurchaseOrderResponse): boolean {
    return this.canApprove && order.status === 'PENDING_APPROVAL';
  }

  canShowReceive(order: PurchaseOrderResponse): boolean {
    return this.canReceive && ['PAID', 'PARTIALLY_RECEIVED'].includes(order.status);
  }

  isActionLoading(orderId: number): boolean {
    return this.actionLoadingIds.has(orderId);
  }

  getSortMarker(column: string): string {
    if (this.query.sortBy !== column) {
      return '';
    }
    return this.query.sortDir === 'asc' ? '^' : 'v';
  }

  retryLoad(): void {
    this.loadPurchaseOrders();
    this.loadSummary();
  }

  private loadLookups(): void {
    forkJoin({
      suppliers: this.canLoadSupplierLookups
        ? this.purchaseApi.getSuppliers().pipe(
            catchError((error) => {
              if (error?.status === 403) {
                this.lookupError = 'Supplier lookup is not available for your role.';
              } else {
                this.lookupError = 'Some purchase order filters are currently unavailable.';
              }
              return of([] as SupplierResponse[]);
            })
          )
        : of([] as SupplierResponse[]),
      warehouses: this.purchaseApi.getWarehouses().pipe(
        catchError(() => {
          this.lookupError = this.lookupError || 'Some purchase order filters are currently unavailable.';
          return of({
            content: [],
            totalElements: 0,
            totalPages: 0,
            number: 0,
            size: 0,
            numberOfElements: 0,
            first: true,
            last: true,
            empty: true,
          } as PageResponse<WarehouseResponse>);
        })
      ),
    }).subscribe({
      next: ({ suppliers, warehouses }) => {
        if (!this.canLoadSupplierLookups) {
          this.lookupError = 'Supplier lookup is only available to purchasing and management roles.';
        }
        this.suppliers = suppliers;
        this.warehouses = warehouses.content ?? [];
        this.cdr.markForCheck();
      },
      error: () => {
        this.suppliers = [];
        this.warehouses = [];
        this.lookupError = 'Some purchase order filters are currently unavailable.';
        this.cdr.markForCheck();
      },
    });
  }

  private loadSummary(): void {
    if (!this.canViewAnalytics) {
      this.summary = PoListComponent.DEFAULT_SUMMARY;
      this.summaryError = null;
      this.cdr.markForCheck();
      return;
    }
    this.purchaseApi.getPurchaseOrderSummary().subscribe({
      next: (summary) => {
        this.summary = summary;
        this.summaryError = null;
        this.cdr.markForCheck();
      },
      error: () => {
        this.summary = PoListComponent.DEFAULT_SUMMARY;
        this.summaryError = 'Purchase order summary is currently unavailable.';
        this.cdr.markForCheck();
      },
    });
  }

  private loadPurchaseOrders(): void {
    if (this.loading) {
      return;
    }

    this.loading = true;
    this.loadError = null;
    this.cdr.markForCheck();
    const request = this.hasFilters(this.query)
      ? this.purchaseApi.searchPurchaseOrders(this.query)
      : this.purchaseApi.getPurchaseOrders(this.query);

    request.pipe(finalize(() => {
      this.loading = false;
      this.cdr.markForCheck();
    })).subscribe({
      next: (pageData) => {
        this.pageData = pageData;
        this.purchaseOrders = pageData.content ?? [];
        this.cdr.markForCheck();
      },
      error: () => {
        this.pageData = null;
        this.purchaseOrders = [];
        this.loadError = 'Unable to load purchase orders right now. Please try again.';
        this.cdr.markForCheck();
      },
    });
  }

  private hasFilters(query: PurchaseOrderListQuery): boolean {
    return Boolean(
      query.keyword ||
        query.supplierId ||
        query.warehouseId ||
        query.status ||
        query.fromDate ||
        query.toDate ||
        query.overdueOnly
    );
  }

  private runAction(
    order: PurchaseOrderResponse,
    loadingLabel: string,
    requestFactory: () => ReturnType<PurchaseOrderApiService['submitPurchaseOrder']>,
    successMessage: string
  ): void {
    const orderId = this.getOrderId(order);
    if (this.actionLoadingIds.has(orderId)) {
      return;
    }

    this.actionLoadingIds.add(orderId);
    this.actionLabel = loadingLabel;
    this.cdr.markForCheck();
    requestFactory()
      .pipe(finalize(() => {
        this.actionLoadingIds.delete(orderId);
        this.actionLabel = '';
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: () => {
          this.notifications.success(successMessage);
          this.loadPurchaseOrders();
          this.loadSummary();
        },
      });
  }

  getOrderId(order: PurchaseOrderResponse): number {
    const orderId = order.poId ?? order.purchaseOrderId;
    if (!Number.isInteger(orderId) || orderId <= 0) {
      throw new Error('Invalid purchase order ID');
    }
    return orderId;
  }

  private applyDashboardQueryParams(): void {
    const queryParams = this.route.snapshot.queryParamMap;
    const status = queryParams.get('status');
    const overdueOnly = queryParams.get('overdueOnly') === 'true';
    const warehouseId = queryParams.get('warehouseId');
    const supplierId = queryParams.get('supplierId');

    this.filtersForm.patchValue({
      status: (status as PurchaseOrderStatus | null) ?? null,
      overdueOnly,
      warehouseId: warehouseId ? Number(warehouseId) : null,
      supplierId: supplierId ? Number(supplierId) : null,
    });

    this.query = {
      ...this.query,
      status: (status as PurchaseOrderStatus | null) ?? undefined,
      overdueOnly: overdueOnly || undefined,
      warehouseId: warehouseId ? Number(warehouseId) : undefined,
      supplierId: supplierId ? Number(supplierId) : undefined,
    };
  }

  private syncQueryParams(): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        status: this.query.status ?? null,
        overdueOnly: this.query.overdueOnly ? true : null,
        warehouseId: this.query.warehouseId ?? null,
        supplierId: this.query.supplierId ?? null,
      },
      queryParamsHandling: '',
      replaceUrl: true,
    });
  }
}
