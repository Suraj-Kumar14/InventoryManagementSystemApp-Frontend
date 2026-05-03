import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { SupplierApiService } from '../../../suppliers/services/supplier-api.service';
import { PaymentService } from '../../../../core/services/payment.service';
import { PaymentStatusBadgeComponent } from '../../components/payment-status-badge/payment-status-badge.component';
import { PaymentResponse } from '../../models/payment.model';

@Component({
  selector: 'app-supplier-payment-history',
  standalone: true,
  imports: [CommonModule, RouterLink, CurrencyPipe, DatePipe, PaymentStatusBadgeComponent],
  template: `
    <section class="page-shell">
      <header class="hero" *ngIf="supplier">
        <div>
          <h1>{{ supplier.name }}</h1>
          <p>{{ supplier.email || 'No supplier email' }} · {{ supplier.paymentTerms || 'Standard payment terms' }}</p>
        </div>
        <a [routerLink]="['/suppliers', supplier.supplierId]">Open Supplier</a>
      </header>
      <section class="stats">
        <article><span>Total Paid</span><strong>{{ totalPaid | currency:'INR':'symbol':'1.0-2' }}</strong></article>
        <article><span>Pending / Approved</span><strong>{{ pendingCount }}</strong></article>
        <article><span>Cancelled / Reversed</span><strong>{{ cancelledCount }}</strong></article>
      </section>
      <div class="card" *ngFor="let payment of payments">
        <div class="row">
          <div>
            <h3>{{ payment.paymentNumber }}</h3>
            <p>{{ payment.poNumber || ('PO #' + payment.purchaseOrderId) }} · {{ payment.paymentDate | date:'mediumDate' }}</p>
          </div>
          <app-payment-status-badge [status]="payment.status"></app-payment-status-badge>
        </div>
        <strong>{{ payment.paymentAmount | currency:'INR':'symbol':'1.0-2' }}</strong>
      </div>
    </section>
  `,
  styles: [`.page-shell{padding:1.5rem;display:grid;gap:1rem}.hero,.stats article,.card{padding:1.1rem;border-radius:1rem;background:#fff;border:1px solid #e2e8f0}.hero{display:flex;justify-content:space-between;gap:1rem;flex-wrap:wrap;background:linear-gradient(150deg,#f0fdf4,#dcfce7)}.hero h1,.hero p,.card h3,.card p{margin:0}.hero a{text-decoration:none;color:#0f172a;font-weight:700}.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:1rem}.stats span{display:block;color:#64748b;font-size:.8rem}.stats strong{display:block;margin-top:.3rem;font-size:1.2rem}.row{display:flex;justify-content:space-between;gap:1rem;align-items:start}.card p{color:#64748b}`],
})
export class SupplierPaymentHistoryComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly supplierApi = inject(SupplierApiService);
  private readonly paymentService = inject(PaymentService);

  supplier: any;
  payments: PaymentResponse[] = [];
  totalPaid = 0;
  pendingCount = 0;
  cancelledCount = 0;

  constructor() {
    const supplierId = Number(this.route.snapshot.paramMap.get('supplierId'));
    this.supplierApi.getSupplierById(supplierId).subscribe({ next: (supplier) => (this.supplier = supplier) });
    this.paymentService.getPaymentsBySupplier(supplierId, 0, 50).subscribe({
      next: (page) => {
        this.payments = page.content;
        this.totalPaid = this.payments
          .filter((payment) => ['PAID', 'PARTIALLY_PAID'].includes(payment.status))
          .reduce((sum, payment) => sum + payment.paymentAmount, 0);
        this.pendingCount = this.payments.filter((payment) => ['PENDING_APPROVAL', 'APPROVED'].includes(payment.status)).length;
        this.cancelledCount = this.payments.filter((payment) => ['CANCELLED', 'REVERSED'].includes(payment.status)).length;
      },
    });
  }
}
