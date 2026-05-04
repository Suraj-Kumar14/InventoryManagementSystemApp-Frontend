import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, Routes } from '@angular/router';
import { catchError, finalize, map, of, switchMap } from 'rxjs';
import {
  GoodsReceiptRequest,
  PurchaseOrderRequest,
  PurchaseOrderResponse,
  SupplierResponse,
  WarehouseResponse,
} from '../../../core/http/backend.models';
import { AuthService } from '../../../core/auth/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { PaymentService } from '../../../core/services/payment.service';
import { PurchaseService } from '../../../core/services/purchase.service';
import { WarehouseService } from '../../../core/services/warehouse.service';
import { UserRole } from '../../../shared/config/app-config';
import { roleGuard } from '../../../core/guards/role.guard';
import { PaymentResponse } from '../../payments/models/payment.model';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './orders-page.component.html',
  styleUrls: ['./orders-page.component.css'],
})
class OrdersPageComponent {
  private readonly purchaseService = inject(PurchaseService);
  private readonly paymentService = inject(PaymentService);
  private readonly warehouseService = inject(WarehouseService);
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly notifications = inject(NotificationService);
  private readonly router = inject(Router);

  suppliers: SupplierResponse[] = [];
  warehouses: WarehouseResponse[] = [];
  orders: PurchaseOrderResponse[] = [];
  paymentStatuses: Record<number, PaymentResponse | null> = {};
  loading = false;
  saving = false;
  actionOrderId: number | null = null;
  payingOrderId: number | null = null;
  statusControl = this.fb.nonNullable.control('');

  form = this.fb.nonNullable.group({
    supplierId: [0, [Validators.required, Validators.min(1)]],
    warehouseId: [0, [Validators.required, Validators.min(1)]],
    productId: [0, [Validators.required, Validators.min(1)]],
    quantity: [1, [Validators.required, Validators.min(1)]],
    unitCost: [1, [Validators.required, Validators.min(0.01)]],
    expectedDate: [''],
    notes: [''],
    referenceNumber: [''],
  });

  constructor() {
    this.loadOrders();
    this.loadLookups();
  }

  loadOrders(): void {
    this.loading = true;
    const status = this.statusControl.value.trim();
    const request = status
      ? this.purchaseService.getPurchaseOrdersByStatus(status)
      : this.purchaseService.getPurchaseOrders();

    request
      .pipe(
        switchMap((orders) => {
          this.orders = orders;
          return this.paymentService.getLatestPaymentsForPurchaseOrders(orders.map((order) => order.poId)).pipe(
            map((paymentStatuses) => ({ orders, paymentStatuses })),
            catchError(() => of({ orders, paymentStatuses: {} as Record<number, PaymentResponse | null> }))
          );
        }),
        finalize(() => (this.loading = false))
      )
      .subscribe({
        next: ({ orders, paymentStatuses }) => {
          this.orders = orders;
          this.paymentStatuses = paymentStatuses;
        },
        error: () => {
          this.orders = [];
          this.paymentStatuses = {};
        },
      });
  }

  create(): void {
    const userId = this.auth.getUserId();
    if (this.form.invalid || !userId) {
      return;
    }

    const raw = this.form.getRawValue();
    const payload: PurchaseOrderRequest = {
      supplierId: raw.supplierId,
      warehouseId: raw.warehouseId,
      createdById: userId,
      expectedDate: raw.expectedDate || null,
      notes: raw.notes || null,
      referenceNumber: raw.referenceNumber || null,
      lineItems: [{ productId: raw.productId, quantity: raw.quantity, unitCost: raw.unitCost }],
    };

    this.saving = true;
    this.purchaseService
      .createPurchaseOrder(payload)
      .pipe(finalize(() => (this.saving = false)))
      .subscribe({
        next: () => {
          this.notifications.success('Purchase order created successfully.');
          this.loadOrders();
        },
      });
  }

  submit(id: number): void {
    this.runOrderAction(id, () => this.purchaseService.submitPurchaseOrder(id), 'Purchase order submitted.');
  }

  approve(id: number): void {
    this.runOrderAction(id, () => this.purchaseService.approvePurchaseOrder(id), 'Purchase order approved.');
  }

  reject(id: number): void {
    this.runOrderAction(id, () => this.purchaseService.rejectPurchaseOrder(id, 'Rejected from frontend'), 'Purchase order rejected.');
  }

  cancel(id: number): void {
    this.runOrderAction(id, () => this.purchaseService.cancelPurchaseOrder(id, 'Cancelled from frontend'), 'Purchase order cancelled.');
  }

  receive(order: PurchaseOrderResponse): void {
    const firstLine = order.lineItems[0];
    if (!firstLine) {
      return;
    }

    const payload: GoodsReceiptRequest[] = [{ lineItemId: firstLine.lineItemId, receivedQty: firstLine.quantity }];
    this.runOrderAction(
      order.poId,
      () => this.purchaseService.receiveGoods(order.poId, payload),
      'Goods receipt recorded.'
    );
  }

  pay(order: PurchaseOrderResponse): void {
    this.router.navigate(['/payments/create'], { queryParams: { purchaseOrderId: order.poId } });
  }

  getPaymentStatus(order: PurchaseOrderResponse): string {
    return this.paymentStatuses[order.poId]?.status || 'UNPAID';
  }

  canPay(order: PurchaseOrderResponse): boolean {
    const paymentStatus = this.getPaymentStatus(order);
    return ['RECEIVED', 'PARTIALLY_RECEIVED'].includes(order.status) && !['PAID', 'PARTIALLY_PAID'].includes(paymentStatus);
  }

  private loadLookups(): void {
    this.purchaseService.getSuppliers({ page: 0, size: 50 }).subscribe({
      next: (suppliers) => (this.suppliers = suppliers),
      error: () => (this.suppliers = []),
    });

    this.warehouseService.getWarehouses().subscribe({
      next: (warehouses) => (this.warehouses = warehouses),
      error: () => (this.warehouses = []),
    });
  }

  private runOrderAction(
    orderId: number,
    requestFactory: () => ReturnType<PurchaseService['createPurchaseOrder']>,
    successMessage: string
  ): void {
    this.actionOrderId = orderId;
    requestFactory()
      .pipe(finalize(() => (this.actionOrderId = null)))
      .subscribe({
        next: () => {
          this.notifications.success(successMessage);
          this.loadOrders();
        },
      });
  }
}

export const ordersRoutes: Routes = [
  {
    path: '',
    component: OrdersPageComponent,
    canActivate: [roleGuard],
    data: { roles: [UserRole.ADMIN, UserRole.PURCHASE_OFFICER] },
  },
];
