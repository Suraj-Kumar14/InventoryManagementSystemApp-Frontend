import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PurchaseOrderResponse } from '../../../../core/http/backend.models';
import { PaymentService } from '../../../../core/services/payment.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { PurchaseOrderApiService } from '../../../purchase-orders/services/purchase-order-api.service';
import { PaymentFormComponent } from '../../components/payment-form/payment-form.component';
import { CreatePaymentRequest } from '../../models/payment.model';

@Component({
  selector: 'app-payment-create',
  standalone: true,
  imports: [CommonModule, PaymentFormComponent],
  template: `
    <section class="page-shell">
      <header class="hero"><h1>Create Payment</h1><p>Draft and submit supplier payments only for received purchase orders.</p></header>
      <app-payment-form
        [purchaseOrders]="purchaseOrders"
        [initialPurchaseOrderId]="preselectedPurchaseOrderId"
        [busy]="busy"
        (saveDraft)="create($event, false)"
        (saveAndSubmit)="create($event, true)">
      </app-payment-form>
    </section>
  `,
  styles: [`.page-shell{padding:1.5rem;display:grid;gap:1rem}.hero{padding:1.4rem;border-radius:1.2rem;background:linear-gradient(155deg,#ecfeff,#f8fafc);border:1px solid #bae6fd} .hero h1{margin:0 0 .35rem} .hero p{margin:0;color:#475569}`],
})
export class PaymentCreateComponent {
  private readonly purchaseOrderApi = inject(PurchaseOrderApiService);
  private readonly paymentService = inject(PaymentService);
  private readonly notifications = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  purchaseOrders: PurchaseOrderResponse[] = [];
  preselectedPurchaseOrderId: number | null = null;
  busy = false;

  constructor() {
    this.preselectedPurchaseOrderId = Number(this.route.snapshot.queryParamMap.get('purchaseOrderId')) || null;
    this.purchaseOrderApi.getPurchaseOrders({ page: 0, size: 100, sortBy: 'createdAt', sortDir: 'desc' }).subscribe({
      next: (page) => {
        this.purchaseOrders = page.content.filter((po) => ['RECEIVED', 'PARTIALLY_RECEIVED'].includes(po.status));
      },
      error: () => (this.purchaseOrders = []),
    });
  }

  create(payload: CreatePaymentRequest, submitAfterSave: boolean): void {
    this.busy = true;
    this.paymentService.createPayment(payload).subscribe({
      next: (payment) => {
        if (!submitAfterSave) {
          this.busy = false;
          this.notifications.success('Payment created successfully');
          this.router.navigate(['/payments', payment.paymentId]);
          return;
        }
        this.paymentService.submitPayment(payment.paymentId, { remarks: 'Submitted during payment creation' }).subscribe({
          next: () => {
            this.busy = false;
            this.notifications.success('Payment submitted for approval');
            this.router.navigate(['/payments', payment.paymentId]);
          },
          error: () => (this.busy = false),
        });
      },
      error: () => (this.busy = false),
    });
  }
}
