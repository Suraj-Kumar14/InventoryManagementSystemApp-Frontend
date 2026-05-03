import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { PaymentService } from '../../../../core/services/payment.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { PaymentStatusBadgeComponent } from '../../components/payment-status-badge/payment-status-badge.component';
import { PaymentResponse } from '../../models/payment.model';

@Component({
  selector: 'app-payment-approvals',
  standalone: true,
  imports: [CommonModule, RouterLink, CurrencyPipe, PaymentStatusBadgeComponent],
  template: `
    <section class="page-shell">
      <header class="hero"><h1>Payment Approvals</h1><p>Review submitted supplier payments and keep approval turnaround visible.</p></header>
      <div class="card" *ngIf="loading">Loading pending approvals...</div>
      <div class="card" *ngIf="!loading && payments.length === 0">No pending approval payments right now.</div>
      <div class="approval-list" *ngIf="!loading && payments.length">
        <article class="card" *ngFor="let payment of payments">
          <div class="row">
            <div>
              <h3>{{ payment.paymentNumber }}</h3>
              <p>{{ payment.supplierName }} · {{ payment.poNumber || ('PO #' + payment.purchaseOrderId) }}</p>
            </div>
            <app-payment-status-badge [status]="payment.status"></app-payment-status-badge>
          </div>
          <p class="amount">{{ payment.paymentAmount | currency:'INR':'symbol':'1.0-2' }}</p>
          <div class="actions">
            <a [routerLink]="['/payments', payment.paymentId]">Open Detail</a>
            <button (click)="approve(payment)">Approve</button>
            <button (click)="reject(payment)">Reject</button>
          </div>
        </article>
      </div>
    </section>
  `,
  styles: [`.page-shell{padding:1.5rem;display:grid;gap:1rem}.hero,.card{padding:1.2rem;border-radius:1.1rem;background:#fff;border:1px solid #e2e8f0}.hero{background:linear-gradient(150deg,#fff7ed,#ffedd5)}.approval-list{display:grid;gap:1rem}.row{display:flex;justify-content:space-between;gap:1rem;flex-wrap:wrap}.row h3,.row p,.amount{margin:0}.row p{color:#64748b}.amount{font-size:1.2rem;font-weight:700;margin:.9rem 0}.actions{display:flex;gap:.6rem;flex-wrap:wrap}.actions a,.actions button{border:none;background:#e2e8f0;border-radius:999px;padding:.65rem .9rem;text-decoration:none;color:#0f172a;cursor:pointer}`],
})
export class PaymentApprovalsComponent {
  private readonly paymentService = inject(PaymentService);
  private readonly notifications = inject(NotificationService);
  payments: PaymentResponse[] = [];
  loading = false;

  constructor() {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.paymentService.searchPayments({ status: 'PENDING_APPROVAL', page: 0, size: 20 }).pipe(finalize(() => (this.loading = false))).subscribe({
      next: (page) => (this.payments = page.content),
      error: () => (this.payments = []),
    });
  }

  approve(payment: PaymentResponse): void {
    this.paymentService.approvePayment(payment.paymentId, { approvalRemarks: 'Approved from approvals workspace' }).subscribe({
      next: () => { this.notifications.success('Payment approved successfully'); this.load(); },
    });
  }

  reject(payment: PaymentResponse): void {
    const rejectionReason = window.prompt('Enter rejection reason');
    if (!rejectionReason?.trim()) return;
    this.paymentService.rejectPayment(payment.paymentId, { rejectionReason }).subscribe({
      next: () => { this.notifications.success('Payment rejected successfully'); this.load(); },
    });
  }
}
