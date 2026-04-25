import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';
import { Roles, normalizeRole } from '../../../core/constants/roles';
import {
  PurchaseOrder,
  PurchaseOrderFilter,
  Supplier,
  Warehouse
} from '../../../core/models';
import { AuthService } from '../../../core/services/auth.service';
import { PurchaseOrderService } from '../../../core/services/purchase-order.service';
import { SupplierService } from '../../../core/services/supplier.service';
import { ToastService } from '../../../core/services/toast.service';
import { WarehouseService } from '../../../core/services/warehouse.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import {
  PURCHASE_ORDER_STATUSES,
  canApprovePurchaseOrder,
  canCancelPurchaseOrder,
  canReceivePurchaseOrder,
  enrichPurchaseOrders,
  getPurchaseStatusBadgeClass,
  getPurchaseStatusLabel
} from '../purchase-order.utils';

type ActionType = 'approve' | 'cancel';

@Component({
  selector: 'app-po-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, ConfirmDialogComponent, EmptyStateComponent],
  templateUrl: './po-list.component.html',
  styleUrls: ['./po-list.component.css']
})
export class PoListComponent implements OnInit {
  private readonly purchaseOrderService = inject(PurchaseOrderService);
  private readonly supplierService = inject(SupplierService);
  private readonly warehouseService = inject(WarehouseService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly orders = signal<PurchaseOrder[]>([]);
  readonly suppliers = signal<Supplier[]>([]);
  readonly warehouses = signal<Warehouse[]>([]);
  readonly totalElements = signal(0);
  readonly page = signal(0);
  readonly size = signal(10);
  readonly loading = signal(true);
  readonly statusFilter = signal<'ALL' | PurchaseOrder['status']>('ALL');
  readonly supplierFilter = signal<number | null>(null);
  readonly warehouseFilter = signal<number | null>(null);
  readonly referenceFilter = signal('');
  readonly startDate = signal('');
  readonly endDate = signal('');
  readonly actionTarget = signal<PurchaseOrder | null>(null);
  readonly actionType = signal<ActionType | null>(null);
  readonly actionLoading = signal(false);

  readonly statuses = PURCHASE_ORDER_STATUSES;

  ngOnInit(): void {
    this.loadLookupsAndOrders();
  }

  get totalPages(): number {
    return Math.max(Math.ceil(this.totalElements() / this.size()), 1);
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, index) => index);
  }

  get rangeEnd(): number {
    return Math.min((this.page() + 1) * this.size(), this.totalElements());
  }

  get currentRole(): string {
    return normalizeRole(this.authService.currentUser()?.role);
  }

  canCreate(): boolean {
    return this.currentRole === Roles.ADMIN || this.currentRole === Roles.PURCHASE_OFFICER;
  }

  canApprove(order: PurchaseOrder): boolean {
    const role = this.currentRole;
    return (
      canApprovePurchaseOrder(order) &&
      (role === Roles.ADMIN || role === Roles.INVENTORY_MANAGER || role === Roles.MANAGER)
    );
  }

  canCancel(order: PurchaseOrder): boolean {
    const role = this.currentRole;
    return canCancelPurchaseOrder(order) && (role === Roles.ADMIN || role === Roles.PURCHASE_OFFICER);
  }

  canReceive(order: PurchaseOrder): boolean {
    const role = this.currentRole;
    return (
      canReceivePurchaseOrder(order) &&
      (role === Roles.ADMIN || role === Roles.PURCHASE_OFFICER || role === Roles.WAREHOUSE_STAFF)
    );
  }

  onPageChange(nextPage: number): void {
    if (nextPage < 0 || nextPage >= this.totalPages) {
      return;
    }

    this.page.set(nextPage);
    this.loadOrders();
  }

  onFiltersChange(): void {
    this.page.set(0);
    this.loadOrders();
  }

  resetFilters(): void {
    this.statusFilter.set('ALL');
    this.supplierFilter.set(null);
    this.warehouseFilter.set(null);
    this.referenceFilter.set('');
    this.startDate.set('');
    this.endDate.set('');
    this.page.set(0);
    this.loadOrders();
  }

  viewOrder(order: PurchaseOrder): void {
    this.router.navigate(['/purchase-orders', order.id]);
  }

  openAction(type: ActionType, order: PurchaseOrder): void {
    this.actionType.set(type);
    this.actionTarget.set(order);
  }

  confirmAction(): void {
    const order = this.actionTarget();
    const type = this.actionType();

    if (!order || !type) {
      return;
    }

    this.actionLoading.set(true);
    const request =
      type === 'approve'
        ? this.purchaseOrderService.approvePO(order.id)
        : this.purchaseOrderService.cancelPO(order.id);

    request.subscribe({
      next: () => {
        this.toast.success(type === 'approve' ? 'Purchase order approved' : 'Purchase order cancelled');
        this.actionLoading.set(false);
        this.actionTarget.set(null);
        this.actionType.set(null);
        this.loadOrders();
      },
      error: (error) => {
        this.toast.error('Action failed', error.error?.message ?? error.message);
        this.actionLoading.set(false);
      }
    });
  }

  getStatusBadgeClass(status: PurchaseOrder['status']): string {
    return getPurchaseStatusBadgeClass(status);
  }

  getStatusLabel(status: PurchaseOrder['status']): string {
    return getPurchaseStatusLabel(status);
  }

  formatDate(value?: string | null): string {
    if (!value) {
      return '-';
    }

    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString();
  }

  private loadLookupsAndOrders(): void {
    this.loading.set(true);

    forkJoin({
      suppliers: this.supplierService.getAllList().pipe(catchError(() => of([] as Supplier[]))),
      warehouses: this.warehouseService.getActive().pipe(catchError(() => of([] as Warehouse[])))
    }).subscribe({
      next: ({ suppliers, warehouses }) => {
        this.suppliers.set(suppliers);
        this.warehouses.set(warehouses);
        this.loadOrders();
      },
      error: () => {
        this.loadOrders();
      }
    });
  }

  private loadOrders(): void {
    this.loading.set(true);

    const filter: PurchaseOrderFilter = {
      page: this.page(),
      size: this.size(),
      status: this.statusFilter(),
      supplierId: this.supplierFilter(),
      warehouseId: this.warehouseFilter(),
      referenceNumber: this.referenceFilter(),
      startDate: this.startDate(),
      endDate: this.endDate()
    };

    this.purchaseOrderService.getPOs(filter).subscribe({
      next: (response) => {
        this.orders.set(
          enrichPurchaseOrders(response.content, {
            suppliers: this.suppliers(),
            warehouses: this.warehouses()
          })
        );
        this.totalElements.set(response.totalElements);
        this.loading.set(false);
      },
      error: (error) => {
        this.toast.error('Unable to load purchase orders', error.error?.message);
        this.loading.set(false);
      }
    });
  }
}
