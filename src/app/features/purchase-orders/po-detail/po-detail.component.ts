import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';
import { Roles, normalizeRole } from '../../../core/constants/roles';
import { Product, PurchaseOrder, Supplier, Warehouse } from '../../../core/models';
import { AuthService } from '../../../core/services/auth.service';
import { ProductService } from '../../../core/services/product.service';
import { PurchaseOrderService } from '../../../core/services/purchase-order.service';
import { SupplierService } from '../../../core/services/supplier.service';
import { ToastService } from '../../../core/services/toast.service';
import { WarehouseService } from '../../../core/services/warehouse.service';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import {
  canApprovePurchaseOrder,
  canCancelPurchaseOrder,
  canReceivePurchaseOrder,
  enrichPurchaseOrder,
  getPurchaseStatusBadgeClass,
  getPurchaseStatusLabel
} from '../purchase-order.utils';

type ActionType = 'approve' | 'cancel';

@Component({
  selector: 'app-po-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, ConfirmDialogComponent],
  templateUrl: './po-detail.component.html',
  styleUrls: ['./po-detail.component.css']
})
export class PoDetailComponent implements OnInit {
  private readonly purchaseOrderService = inject(PurchaseOrderService);
  private readonly supplierService = inject(SupplierService);
  private readonly warehouseService = inject(WarehouseService);
  private readonly productService = inject(ProductService);
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly po = signal<PurchaseOrder | null>(null);
  readonly loading = signal(true);
  readonly actionTarget = signal<PurchaseOrder | null>(null);
  readonly actionType = signal<ActionType | null>(null);
  readonly actionLoading = signal(false);

  ngOnInit(): void {
    this.loadOrder();
  }

  private loadOrder(): void {
    this.loading.set(true);
    const id = Number(this.route.snapshot.paramMap.get('id'));

    if (!id) {
      this.toast.error('Purchase order not found');
      this.router.navigate(['/purchase-orders']);
      return;
    }

    forkJoin({
      order: this.purchaseOrderService.getPOById(id),
      suppliers: this.supplierService.getActive().pipe(catchError(() => of([] as Supplier[]))),
      warehouses: this.warehouseService.getActive().pipe(catchError(() => of([] as Warehouse[]))),
      products: this.productService.getAllProducts().pipe(catchError(() => of([] as Product[])))
    }).subscribe({
      next: ({ order, suppliers, warehouses, products }) => {
        this.po.set(
          enrichPurchaseOrder(order, {
            suppliers,
            warehouses,
            products
          })
        );
        this.loading.set(false);
      },
      error: (error) => {
        this.toast.error('Unable to load purchase order', error.error?.message ?? error.message);
        this.router.navigate(['/purchase-orders']);
      }
    });
  }

  get currentRole(): string {
    return normalizeRole(this.authService.currentUser()?.role);
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

  openAction(type: ActionType): void {
    const order = this.po();
    if (!order) {
      return;
    }

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
      next: (updatedOrder) => {
        this.po.set({
          ...order,
          ...updatedOrder
        });
        this.actionLoading.set(false);
        this.actionTarget.set(null);
        this.actionType.set(null);
        this.toast.success(type === 'approve' ? 'Purchase order approved' : 'Purchase order cancelled');
        this.loadOrder();
      },
      error: (error) => {
        this.actionLoading.set(false);
        this.toast.error('Action failed', error.error?.message ?? error.message);
      }
    });
  }

  getStatusLabel(status: PurchaseOrder['status']): string {
    return getPurchaseStatusLabel(status);
  }

  getStatusBadgeClass(status: PurchaseOrder['status']): string {
    return getPurchaseStatusBadgeClass(status);
  }

  formatDate(value?: string | null): string {
    if (!value) {
      return '-';
    }

    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString();
  }
}
