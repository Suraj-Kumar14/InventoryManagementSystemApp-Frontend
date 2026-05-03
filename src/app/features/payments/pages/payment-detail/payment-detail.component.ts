import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { PaymentService } from '../../../../core/services/payment.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { UserRole } from '../../../../shared/config/app-config';
import { PaymentMethodBadgeComponent } from '../../components/payment-method-badge/payment-method-badge.component';
import { PaymentStatusBadgeComponent } from '../../components/payment-status-badge/payment-status-badge.component';
import { PaymentTimelineComponent } from '../../components/payment-timeline/payment-timeline.component';
import { PaymentResponse } from '../../models/payment.model';

@Component({
  selector: 'app-payment-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, CurrencyPipe, DatePipe, PaymentStatusBadgeComponent, PaymentMethodBadgeComponent, PaymentTimelineComponent],
  template: `
    <section class="page-shell" *ngIf="payment">
      <header class="hero">
        <div>
          <p class="eyebrow">Payment Detail</p>
          <h1>{{ payment.paymentNumber }}</h1>
          <p>{{ payment.poNumber || ('PO #' + payment.purchaseOrderId) }} · {{ payment.supplierName || ('Supplier #' + payment.supplierId) }}</p>
        </div>
        <div class="hero-badges">
          <app-payment-status-badge [status]="payment.status"></app-payment-status-badge>
          <app-payment-method-badge [method]="payment.paymentMethod"></app-payment-method-badge>
        </div>
      </header>

      <section class="stats">
        <article><span>Payment Amount</span><strong>{{ payment.paymentAmount | currency:'INR':'symbol':'1.0-2' }}</strong></article>
        <article><span>PO Total</span><strong>{{ payment.poTotalAmount | currency:'INR':'symbol':'1.0-2' }}</strong></article>
        <article><span>Previously Paid</span><strong>{{ payment.previouslyPaidAmount | currency:'INR':'symbol':'1.0-2' }}</strong></article>
        <article><span>Remaining</span><strong>{{ payment.remainingAmount | currency:'INR':'symbol':'1.0-2' }}</strong></article>
      </section>

      <section class="detail-grid">
        <div class="card">
          <h2>References</h2>
          <p><strong>Transaction:</strong> {{ payment.transactionReference || 'Not provided' }}</p>
          <p><strong>Bank:</strong> {{ payment.bankReference || 'Not provided' }}</p>
          <p><strong>Payment Date:</strong> {{ payment.paymentDate | date:'mediumDate' }}</p>
          <p><strong>Remarks:</strong> {{ payment.remarks || 'No remarks provided' }}</p>
          <p *ngIf="payment.rejectionReason"><strong>Rejection Reason:</strong> {{ payment.rejectionReason }}</p>
          <p *ngIf="payment.cancellationReason"><strong>Cancellation Reason:</strong> {{ payment.cancellationReason }}</p>
          <p *ngIf="payment.reversalReason"><strong>Reversal Reason:</strong> {{ payment.reversalReason }}</p>
        </div>
        <div class="card">
          <h2>Actions</h2>
          <div class="action-list">
            <a *ngIf="canEdit" [routerLink]="['/payments', payment.paymentId, 'edit']">Edit payment</a>
            <button *ngIf="canSubmit" (click)="submit()">Submit for approval</button>
            <button *ngIf="canApprove" (click)="approve()">Approve payment</button>
            <button *ngIf="canApprove" (click)="reject()">Reject payment</button>
            <button *ngIf="canMarkPaid" (click)="markPaid()">Mark as paid</button>
            <button *ngIf="canCancel" (click)="cancel()">Cancel payment</button>
            <button *ngIf="canReverse" (click)="reverse()">Reverse payment</button>
            <a [routerLink]="['/purchase-orders', payment.purchaseOrderId]">Open purchase order</a>
            <a [routerLink]="['/payments/supplier', payment.supplierId]">Supplier payment history</a>
          </div>
        </div>
      </section>

      <section class="card">
        <h2>Lifecycle Timeline</h2>
        <app-payment-timeline [history]="payment.history || []"></app-payment-timeline>
      </section>
    </section>
  `,
  styles: [`
    .page-shell{display:grid;gap:1rem;padding:1.5rem}.hero{display:flex;justify-content:space-between;gap:1rem;flex-wrap:wrap;padding:1.4rem;border-radius:1.3rem;background:linear-gradient(150deg,#0f172a,#1d4ed8);color:#fff}.eyebrow{margin:0;font-size:.75rem;letter-spacing:.08em;text-transform:uppercase;color:#bfdbfe}.hero h1{margin:.35rem 0}.hero p{margin:0;color:#dbeafe}.hero-badges{display:flex;gap:.5rem;align-items:start;flex-wrap:wrap}.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:1rem}.stats article,.card{background:#fff;border:1px solid #e2e8f0;border-radius:1.1rem;padding:1rem 1.1rem;box-shadow:0 10px 24px rgba(15,23,42,.06)}.stats span{display:block;font-size:.78rem;color:#64748b;text-transform:uppercase}.stats strong{display:block;margin-top:.4rem;font-size:1.2rem}.detail-grid{display:grid;grid-template-columns:1.2fr .8fr;gap:1rem}.action-list{display:flex;flex-direction:column;gap:.65rem}.action-list a,.action-list button{border:none;background:#f8fafc;border-radius:.9rem;padding:.75rem .9rem;text-align:left;text-decoration:none;color:#0f172a;cursor:pointer}@media(max-width:900px){.detail-grid{grid-template-columns:1fr}}
  `],
})
export class PaymentDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly paymentService = inject(PaymentService);
  private readonly auth = inject(AuthService);
  private readonly notifications = inject(NotificationService);

  payment: PaymentResponse | null = null;

  constructor() {
    this.load();
  }

  get canEdit(): boolean { return !!this.payment && this.auth.hasRole([UserRole.ADMIN, UserRole.OFFICER]) && ['DRAFT', 'PENDING_APPROVAL'].includes(this.payment.status); }
  get canSubmit(): boolean { return !!this.payment && this.auth.hasRole([UserRole.ADMIN, UserRole.OFFICER]) && this.payment.status === 'DRAFT'; }
  get canApprove(): boolean { return !!this.payment && this.auth.hasRole([UserRole.ADMIN, UserRole.MANAGER]) && this.payment.status === 'PENDING_APPROVAL'; }
  get canMarkPaid(): boolean { return !!this.payment && this.auth.hasRole([UserRole.ADMIN, UserRole.OFFICER]) && this.payment.status === 'APPROVED'; }
  get canCancel(): boolean { return !!this.payment && this.auth.hasRole([UserRole.ADMIN, UserRole.OFFICER]) && ['DRAFT', 'PENDING_APPROVAL', 'APPROVED'].includes(this.payment.status); }
  get canReverse(): boolean { return !!this.payment && this.auth.hasRole(UserRole.ADMIN) && ['PAID', 'PARTIALLY_PAID'].includes(this.payment.status); }

  submit(): void {
    if (!this.payment) return;
    this.paymentService.submitPayment(this.payment.paymentId).subscribe({ next: () => this.refresh('Payment submitted for approval') });
  }
  approve(): void {
    if (!this.payment) return;
    this.paymentService.approvePayment(this.payment.paymentId).subscribe({ next: () => this.refresh('Payment approved successfully') });
  }
  reject(): void {
    if (!this.payment) return;
    const rejectionReason = window.prompt('Enter rejection reason');
    if (!rejectionReason?.trim()) return;
    this.paymentService.rejectPayment(this.payment.paymentId, { rejectionReason }).subscribe({ next: () => this.refresh('Payment rejected successfully') });
  }
  cancel(): void {
    if (!this.payment) return;
    const cancellationReason = window.prompt('Enter cancellation reason');
    if (!cancellationReason?.trim()) return;
    this.paymentService.cancelPayment(this.payment.paymentId, { cancellationReason }).subscribe({ next: () => this.refresh('Payment cancelled successfully') });
  }
  markPaid(): void {
    if (!this.payment) return;
    this.paymentService.markPaymentPaid(this.payment.paymentId, {
      paymentMethod: this.payment.paymentMethod,
      paymentDate: new Date().toISOString().slice(0, 10),
      transactionReference: this.payment.transactionReference,
      bankReference: this.payment.bankReference,
      remarks: this.payment.remarks,
    }).subscribe({ next: () => this.refresh('Payment marked as paid') });
  }
  reverse(): void {
    if (!this.payment) return;
    const reversalReason = window.prompt('Enter reversal reason');
    if (!reversalReason?.trim()) return;
    this.paymentService.reversePayment(this.payment.paymentId, { reversalReason }).subscribe({ next: () => this.refresh('Payment reversed successfully') });
  }

  private load(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.paymentService.getPaymentById(id).subscribe({ next: (payment) => (this.payment = payment) });
  }

  private refresh(message: string): void {
    this.notifications.success(message);
    this.load();
  }
}
