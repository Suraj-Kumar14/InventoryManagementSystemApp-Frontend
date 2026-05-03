import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
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

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.loading = true;
    this.purchaseApi.getPurchaseOrderById(id).subscribe({
      next: (order) => {
        this.purchaseOrder = order;
        this.buildLineItems();
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  submit(): void {
    if (!this.purchaseOrder) {
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
      purchaseOrderId: this.purchaseOrder.purchaseOrderId ?? this.purchaseOrder.poId,
      receiptReference: this.form.controls.receiptReference.value || null,
      receivedDate: this.form.controls.receivedDate.value || null,
      notes: this.form.controls.notes.value || null,
      lineItems,
    };

    this.submitting = true;
    this.purchaseApi.receivePurchaseOrder(this.purchaseOrder.purchaseOrderId ?? this.purchaseOrder.poId, request)
      .subscribe({
        next: (order) => {
          this.submitting = false;
          this.notifications.success(
            order.status === 'RECEIVED' ? 'Purchase order fully received' : 'Purchase order partially received'
          );
          this.router.navigate(['/purchase-orders', order.purchaseOrderId ?? order.poId]);
        },
        error: () => {
          this.submitting = false;
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
}
