import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PurchaseOrderResponse } from '../../../../core/http/backend.models';
import { PaymentService } from '../../../../core/services/payment.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { PurchaseOrderApiService } from '../../../purchase-orders/services/purchase-order-api.service';
import { PaymentFormComponent } from '../../components/payment-form/payment-form.component';
import { PaymentResponse, UpdatePaymentRequest } from '../../models/payment.model';

@Component({
  selector: 'app-payment-edit',
  standalone: true,
  imports: [CommonModule, PaymentFormComponent],
  template: `
    <section class="page-shell">
      <header class="hero"><h1>Edit Payment</h1><p *ngIf="payment">Updating {{ payment.paymentNumber }} while it is still editable.</p></header>
      <app-payment-form
        *ngIf="payment"
        mode="edit"
        [purchaseOrders]="purchaseOrders"
        [payment]="payment"
        [busy]="busy"
        (saveDraft)="update($event)">
      </app-payment-form>
    </section>
  `,
  styles: [`.page-shell{padding:1.5rem;display:grid;gap:1rem}.hero{padding:1.4rem;border-radius:1.2rem;background:#fff;border:1px solid #e2e8f0}`],
})
export class PaymentEditComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly paymentService = inject(PaymentService);
  private readonly purchaseOrderApi = inject(PurchaseOrderApiService);
  private readonly notifications = inject(NotificationService);

  payment: PaymentResponse | null = null;
  purchaseOrders: PurchaseOrderResponse[] = [];
  busy = false;

  constructor() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.paymentService.getPaymentById(id).subscribe({
      next: (payment) => {
        this.payment = payment;
        this.purchaseOrderApi.getPurchaseOrderById(payment.purchaseOrderId).subscribe({
          next: (po) => (this.purchaseOrders = [po]),
        });
      },
    });
  }

  update(payload: UpdatePaymentRequest): void {
    if (!this.payment) return;
    this.busy = true;
    this.paymentService.updatePayment(this.payment.paymentId, payload).subscribe({
      next: (payment) => {
        this.busy = false;
        this.notifications.success('Payment updated successfully');
        this.router.navigate(['/payments', payment.paymentId]);
      },
      error: () => (this.busy = false),
    });
  }
}
