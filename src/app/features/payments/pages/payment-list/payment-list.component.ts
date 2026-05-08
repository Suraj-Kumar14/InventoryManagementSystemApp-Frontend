import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { PaymentService } from '../../../../core/services/payment.service';
import { PaymentMethodBadgeComponent } from '../../components/payment-method-badge/payment-method-badge.component';
import { PaymentStatusBadgeComponent } from '../../components/payment-status-badge/payment-status-badge.component';
import { PaymentResponse } from '../../models/payment.model';

@Component({
  selector: 'app-payment-list',
  standalone: true,
  imports: [CommonModule, RouterLink, CurrencyPipe, DatePipe, PaymentStatusBadgeComponent, PaymentMethodBadgeComponent],
  template: `
    <section class="page-shell">
      <header class="hero">
        <div>
          <p class="eyebrow">Procurement Finance</p>
          <h1>Payments</h1>
          <p class="subtitle">All Razorpay payments for approved purchase orders.</p>
        </div>
        <div class="hero-actions">
          <a routerLink="/payments/pay" class="btn-pay">⚡ Make a Payment</a>
        </div>
      </header>

      <div class="table-card">
        <div *ngIf="loading" class="state">Loading payments...</div>
        <div *ngIf="!loading && payments.length === 0" class="state">No payments found.</div>
        <table *ngIf="!loading && payments.length">
          <thead>
            <tr>
              <th>Payment #</th>
              <th>Purchase Order</th>
              <th>Supplier</th>
              <th>Status</th>
              <th>Method</th>
              <th>Amount</th>
              <th>Razorpay ID</th>
              <th>Paid At</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let p of payments">
              <td>
                <strong>{{ p.paymentNumber }}</strong>
                <div class="muted">{{ p.createdAt | date:'mediumDate' }}</div>
              </td>
              <td>{{ p.poNumber || ('PO #' + p.purchaseOrderId) }}</td>
              <td>{{ p.supplierName || ('Supplier #' + p.supplierId) }}</td>
              <td><app-payment-status-badge [status]="p.status ?? 'PENDING_APPROVAL'"></app-payment-status-badge></td>
              <td><app-payment-method-badge [method]="p.paymentMethod ?? 'RAZORPAY'"></app-payment-method-badge></td>
              <td>{{ (p.paymentAmount ?? 0) | currency:'INR':'symbol':'1.0-2' }}</td>
              <td class="mono-text">{{ p.razorpayPaymentId || '—' }}</td>
              <td>{{ p.paidAt | date:'mediumDate' }}</td>
              <td class="actions">
                <a [routerLink]="['/payments', p.paymentId]" class="table-link">View</a>
                <a [routerLink]="['/purchase-orders', p.purchaseOrderId]" class="table-link">PO</a>
              </td>
            </tr>
          </tbody>
        </table>

        <div class="pagination" *ngIf="totalPages > 1">
          <button [disabled]="page === 0" (click)="changePage(page - 1)">Prev</button>
          <span>Page {{ page + 1 }} / {{ totalPages }}</span>
          <button [disabled]="page >= totalPages - 1" (click)="changePage(page + 1)">Next</button>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .page-shell { display:grid; gap:1.4rem; padding:1.5rem; }
    .hero { display:flex; justify-content:space-between; align-items:center; gap:1rem; flex-wrap:wrap; padding:1.5rem; border-radius:1.4rem; background:linear-gradient(145deg, #0f172a, #1d4ed8); color:#fff; }
    .eyebrow { margin:0; text-transform:uppercase; letter-spacing:0.1em; font-size:0.75rem; color:#bae6fd; }
    .hero h1 { margin:0.35rem 0; font-size:2rem; }
    .subtitle { margin:0; color:#dbeafe; }
    .hero-actions { display:flex; gap:0.75rem; }
    .btn-pay { text-decoration:none; background:#f97316; color:#fff; border-radius:999px; padding:0.8rem 1.4rem; font-weight:700; font-size:0.9rem; white-space:nowrap; }
    .btn-pay:hover { opacity:0.9; }
    .table-card { background:#fff; border-radius:1.2rem; border:1px solid #e2e8f0; box-shadow:0 14px 32px rgba(15,23,42,0.08); overflow:auto; }
    table { width:100%; border-collapse:collapse; }
    th, td { padding:1rem; border-bottom:1px solid #e2e8f0; text-align:left; vertical-align:top; }
    th { color:#64748b; font-size:0.78rem; text-transform:uppercase; letter-spacing:0.08em; }
    .muted { color:#64748b; font-size:0.8rem; margin-top:0.3rem; }
    .mono-text { font-family:monospace; font-size:0.82rem; color:#475569; }
    .actions { display:flex; gap:0.4rem; }
    .table-link { border:none; background:#e2e8f0; color:#0f172a; border-radius:999px; padding:0.4rem 0.8rem; font-size:0.78rem; text-decoration:none; cursor:pointer; }
    .state { padding:2rem; color:#64748b; text-align:center; }
    .pagination { display:flex; justify-content:center; align-items:center; gap:1rem; padding:1rem; }
    .pagination button { border:none; background:#e2e8f0; border-radius:999px; padding:0.5rem 1rem; cursor:pointer; }
    .pagination button:disabled { opacity:0.4; cursor:not-allowed; }
  `],
})
export class PaymentListComponent implements OnInit {
  private readonly paymentService = inject(PaymentService);

  payments: PaymentResponse[] = [];
  loading = false;
  page = 0;
  totalPages = 1;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.paymentService.getPayments({ page: this.page, size: 20, sortBy: 'createdAt', sortDir: 'desc' })
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (res) => {
          this.payments = res.content ?? [];
          this.totalPages = res.totalPages ?? 1;
        },
        error: () => (this.payments = []),
      });
  }

  changePage(newPage: number): void {
    this.page = newPage;
    this.load();
  }
}
