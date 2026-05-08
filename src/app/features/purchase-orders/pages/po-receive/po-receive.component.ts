import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PurchaseOrderResponse, ReceivePurchaseOrderRequest } from '../../../../core/http/backend.models';
import { NotificationService } from '../../../../core/services/notification.service';
import { PurchaseOrderApiService } from '../../services/purchase-order-api.service';

@Component({
  selector: 'app-po-receive',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './po-receive.component.html',
  styleUrls: ['./po-receive.component.css'],
})
export class PoReceiveComponent implements OnInit {
  private static readonly RECEIVABLE_STATUSES = new Set(['PAID', 'PARTIALLY_RECEIVED']);

  private readonly purchaseApi = inject(PurchaseOrderApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly notifications = inject(NotificationService);
  private readonly router = inject(Router);

  purchaseOrder: PurchaseOrderResponse | null = null;
  loading = false;
  submitting = false;

  readonly form = this.fb.group({
    receiptReference: this.fb.control<string>(''),
    receivedDate: this.fb.control<string>(''),
    notes: this.fb.control<string>(''),
    lineItems: this.fb.array([]),
  });

  get lineItems(): FormArray {
    return this.form.get('lineItems') as FormArray;
  }

  get resolvedPoId(): number | null {
    const poId = this.purchaseOrder?.poId ?? this.purchaseOrder?.purchaseOrderId ?? null;
    return typeof poId === 'number' && Number.isInteger(poId) && poId > 0 ? poId : null;
  }

  get canSubmitReceipt(): boolean {
    return !this.submitting && !!this.purchaseOrder && !!this.resolvedPoId && this.hasReceivableStatus(this.purchaseOrder.status);
  }

  ngOnInit(): void {
    const rawId = this.route.snapshot.paramMap.get('id');
    const id = Number(rawId);
    if (!rawId || !Number.isInteger(id) || id <= 0) {
      this.notifications.error('A valid purchase order ID is required to receive goods.');
      return;
    }

    this.loading = true;
    this.purchaseApi.getPurchaseOrderById(id).subscribe({
      next: (order) => {
        this.purchaseOrder = order;
        if (!this.hasReceivableStatus(order.status)) {
          this.notifications.warning(
            order.status === 'APPROVED' || order.status === 'PENDING_PAYMENT' || order.status === 'PAYMENT_INITIATED'
              ? 'Goods can be received only after payment is completed.'
              : `Purchase order ${order.poNumber || `#${order.poId}`} cannot be received while in status ${order.status}.`
          );
        }
        this.buildLineItems();
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        this.notifications.error(this.getErrorMessage(error, 'Unable to load purchase order receipt details.'));
      },
    });
  }

  submit(): void {
    if (!this.purchaseOrder || !this.resolvedPoId) {
      this.notifications.error('A valid purchase order must be loaded before receiving goods.');
      return;
    }

    if (!this.hasReceivableStatus(this.purchaseOrder.status)) {
      this.notifications.warning('Receive goods is available only after payment is completed.');
      return;
    }

    const lineItems = this.lineItems.getRawValue()
      .map((line, index) => ({
        lineItemId: this.purchaseOrder!.lineItems[index].lineItemId,
        productId: this.purchaseOrder!.lineItems[index].productId,
        receivedQuantity: Number(line.receivedQuantity ?? 0),
        unitCost: this.purchaseOrder!.lineItems[index].unitCost,
        notes: line.notes || null,
      }))
      .filter((line) => line.receivedQuantity > 0);

    if (lineItems.length === 0) {
      this.notifications.warning('Enter at least one received quantity before submitting.');
      return;
    }

    const invalidLine = lineItems.find((line) => {
      const current = this.purchaseOrder!.lineItems.find((item) => item.lineItemId === line.lineItemId);
      return !current || line.receivedQuantity > (current.pendingQuantity ?? 0);
    });

    if (invalidLine) {
      this.notifications.error('Received quantity cannot exceed pending quantity.');
      return;
    }

    const request: ReceivePurchaseOrderRequest = {
      purchaseOrderId: this.resolvedPoId,
      receiptReference: this.form.controls.receiptReference.value || null,
      receivedDate: this.form.controls.receivedDate.value || null,
      notes: this.form.controls.notes.value || null,
      lineItems,
    };

    this.submitting = true;
    this.purchaseApi.receivePurchaseOrder(this.resolvedPoId, request)
      .subscribe({
        next: (order) => {
          this.submitting = false;
          this.notifications.success(
            ['RECEIVED', 'FULLY_RECEIVED'].includes(order.status) ? 'Purchase order fully received' : 'Purchase order partially received'
          );
          void this.router.navigate(['/purchase-orders', order.poId ?? order.purchaseOrderId]);
        },
        error: (error) => {
          this.submitting = false;
          this.notifications.error(this.getErrorMessage(error, 'Goods receipt could not be completed.'));
        },
      });
  }

  lineItemGroup(index: number): FormGroup {
    return this.lineItems.at(index) as FormGroup;
  }

  private buildLineItems(): void {
    while (this.lineItems.length > 0) {
      this.lineItems.removeAt(0);
    }
    this.purchaseOrder?.lineItems.forEach(() => {
      this.lineItems.push(
        this.fb.group({
          receivedQuantity: this.fb.nonNullable.control(0, [Validators.min(0)]),
          notes: this.fb.control<string>(''),
        })
      );
    });
  }

  private hasReceivableStatus(status: string | null | undefined): boolean {
    return typeof status === 'string' && PoReceiveComponent.RECEIVABLE_STATUSES.has(status);
  }

  private getErrorMessage(error: unknown, fallback: string): string {
    if (error instanceof HttpErrorResponse) {
      const payload = error.error;
      if (typeof payload?.message === 'string' && payload.message.trim()) {
        return payload.message;
      }
      if (payload && typeof payload === 'object') {
        const fieldErrors = Object.values(payload)
          .filter((value): value is string => typeof value === 'string' && value.trim().length > 0);
        if (fieldErrors.length > 0) {
          return fieldErrors[0];
        }
      }
      if (typeof error.message === 'string' && error.message.trim()) {
        return error.message;
      }
    }

    return fallback;
  }
}
