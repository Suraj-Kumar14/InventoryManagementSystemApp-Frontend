import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PaymentService } from '../../../../core/services/payment.service';
import { PaymentMethodBadgeComponent } from '../../components/payment-method-badge/payment-method-badge.component';
import { PaymentStatusBadgeComponent } from '../../components/payment-status-badge/payment-status-badge.component';
import { PaymentResponse } from '../../models/payment.model';

@Component({
  selector: 'app-payment-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, CurrencyPipe, DatePipe, PaymentStatusBadgeComponent, PaymentMethodBadgeComponent],
  template: `
    <section class="page-shell" *ngIf="payment">
      <header class="hero">
        <div>
          <p class="eyebrow">Payment Detail</p>
          <h1>{{ payment.paymentNumber }}</h1>
          <p>{{ payment.poNumber || ('PO #' + payment.purchaseOrderId) }} · {{ payment.supplierName || ('Supplier #' + payment.supplierId) }}</p>
        </div>
        <div class="hero-badges">
          <app-payment-status-badge [status]="payment.status ?? 'PENDING_APPROVAL'"></app-payment-status-badge>
          <app-payment-method-badge [method]="payment.paymentMethod ?? 'RAZORPAY'"></app-payment-method-badge>
        </div>
      </header>

      <section class="stats">
        <article><span>Payment Amount</span><strong>{{ (payment.paymentAmount ?? 0) | currency:'INR':'symbol':'1.0-2' }}</strong></article>
        <article><span>PO Total</span><strong>{{ (payment.poTotalAmount ?? 0) | currency:'INR':'symbol':'1.0-2' }}</strong></article>
        <article><span>Previously Paid</span><strong>{{ (payment.previouslyPaidAmount ?? 0) | currency:'INR':'symbol':'1.0-2' }}</strong></article>
        <article><span>Remaining</span><strong>{{ (payment.remainingAmount ?? 0) | currency:'INR':'symbol':'1.0-2' }}</strong></article>
      </section>

      <section class="detail-grid">
        <div class="card">
          <h2>Razorpay References</h2>
          <p *ngIf="payment.razorpayOrderId"><strong>Razorpay Order ID:</strong> <span class="mono">{{ payment.razorpayOrderId }}</span></p>
          <p *ngIf="payment.razorpayPaymentId"><strong>Razorpay Payment ID:</strong> <span class="mono">{{ payment.razorpayPaymentId }}</span></p>
          <p><strong>Transaction Ref:</strong> {{ payment.transactionReference || '—' }}</p>
          <p><strong>Payment Date:</strong> {{ payment.paymentDate | date:'mediumDate' }}</p>
          <p><strong>Paid At:</strong> {{ payment.paidAt | date:'medium' }}</p>
        </div>
        <div class="card">
          <h2>Links</h2>
          <div class="action-list">
            <a [routerLink]="['/purchase-orders', payment.purchaseOrderId]">Open Purchase Order</a>
            <a [routerLink]="['/payments']">All Payments</a>
          </div>
        </div>
      </section>

      <div *ngIf="loading" class="state">Loading...</div>
    </section>

    <div *ngIf="loading && !payment" class="loading-state">Loading payment details...</div>
  `,
  styles: [`
    .page-shell{display:grid;gap:1rem;padding:1.5rem}
    .hero{display:flex;justify-content:space-between;gap:1rem;flex-wrap:wrap;padding:1.4rem;border-radius:1.3rem;background:linear-gradient(150deg,#0f172a,#1d4ed8);color:#fff}
    .eyebrow{margin:0;font-size:.75rem;letter-spacing:.08em;text-transform:uppercase;color:#bfdbfe}
    .hero h1{margin:.35rem 0}.hero p{margin:0;color:#dbeafe}
    .hero-badges{display:flex;gap:.5rem;align-items:start;flex-wrap:wrap}
    .stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:1rem}
    .stats article,.card{background:#fff;border:1px solid #e2e8f0;border-radius:1.1rem;padding:1rem 1.1rem;box-shadow:0 10px 24px rgba(15,23,42,.06)}
    .stats span{display:block;font-size:.78rem;color:#64748b;text-transform:uppercase}
    .stats strong{display:block;margin-top:.4rem;font-size:1.2rem}
    .detail-grid{display:grid;grid-template-columns:1.2fr .8fr;gap:1rem}
    .action-list{display:flex;flex-direction:column;gap:.65rem}
    .action-list a{text-decoration:none;background:#f1f5f9;border-radius:.9rem;padding:.75rem .9rem;color:#0f172a}
    .mono{font-family:monospace;font-size:.85rem;background:#f1f5f9;padding:.1rem .4rem;border-radius:4px}
    .state,.loading-state{padding:2rem;color:#64748b;text-align:center}
    @media(max-width:900px){.detail-grid{grid-template-columns:1fr}}
  `],
})
export class PaymentDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly paymentService = inject(PaymentService);

  payment: PaymentResponse | null = null;
  loading = false;

  constructor() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.loading = true;
    this.paymentService.getPaymentById(id).subscribe({
      next: (p) => { this.payment = p; this.loading = false; },
      error: () => { this.loading = false; },
    });
  }
}
