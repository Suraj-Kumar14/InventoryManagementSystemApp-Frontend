import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { PaymentService } from '../../../../core/services/payment.service';
import { PaymentSummaryCardsComponent } from '../../components/payment-summary-cards/payment-summary-cards.component';
import { PaymentAnalyticsResponse, PaymentSummaryResponse } from '../../models/payment.model';

@Component({
  selector: 'app-payment-analytics',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, CurrencyPipe, PaymentSummaryCardsComponent],
  template: `
    <section class="page-shell">
      <header class="hero"><h1>Payment Analytics</h1><p>Monitor paid volume, pending exposure, payment methods, and top suppliers.</p></header>
      <form class="filter-card" [formGroup]="filters" (ngSubmit)="load()">
        <input type="date" formControlName="fromDate" />
        <input type="date" formControlName="toDate" />
        <button type="submit">Refresh Analytics</button>
      </form>
      <app-payment-summary-cards [summary]="summary"></app-payment-summary-cards>
      <div class="grid" *ngIf="analytics">
        <article class="card">
          <h3>Total Paid</h3>
          <p>{{ analytics.totalPaid | currency:'INR':'symbol':'1.0-2' }}</p>
          <small>Pending approvals: {{ analytics.pendingApprovals }}</small>
        </article>
        <article class="card">
          <h3>Total Pending</h3>
          <p>{{ analytics.totalPending | currency:'INR':'symbol':'1.0-2' }}</p>
        </article>
        <article class="card">
          <h3>Payment Methods</h3>
          <div class="list" *ngFor="let entry of methodEntries">{{ entry[0].replaceAll('_', ' ') }} · {{ entry[1] }}</div>
        </article>
        <article class="card">
          <h3>Top Paid Suppliers</h3>
          <div class="list" *ngFor="let supplier of analytics.topPaidSuppliers">{{ supplier }}</div>
        </article>
        <article class="card card--wide">
          <h3>Monthly Paid Trend</h3>
          <div class="list" *ngFor="let entry of trendEntries">{{ entry[0] }} · {{ entry[1] | currency:'INR':'symbol':'1.0-2' }}</div>
        </article>
      </div>
    </section>
  `,
  styles: [`.page-shell{padding:1.5rem;display:grid;gap:1rem}.hero,.filter-card,.card{padding:1.2rem;border-radius:1.1rem;background:#fff;border:1px solid #e2e8f0}.hero{background:linear-gradient(145deg,#eff6ff,#f8fafc)}.filter-card{display:flex;gap:.75rem;flex-wrap:wrap}.filter-card input,.filter-card button{padding:.75rem .9rem;border-radius:.8rem;border:1px solid #cbd5e1}.filter-card button{background:#0f766e;color:#fff;border:none}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:1rem}.card h3,.card p{margin:0}.card p{font-size:1.35rem;font-weight:700;margin:.5rem 0}.card--wide{grid-column:1/-1}.list{padding:.4rem 0;color:#334155}`],
})
export class PaymentAnalyticsComponent {
  private readonly fb = inject(FormBuilder);
  private readonly paymentService = inject(PaymentService);

  readonly filters = this.fb.group({ fromDate: [''], toDate: [''] });
  summary: PaymentSummaryResponse | null = null;
  analytics: PaymentAnalyticsResponse | null = null;

  constructor() {
    this.load();
  }

  get methodEntries() { return Object.entries(this.analytics?.paymentsByMethod || {}); }
  get trendEntries() { return Object.entries(this.analytics?.monthlyPaidTrend || {}); }

  load(): void {
    const { fromDate, toDate } = this.filters.getRawValue();
    this.paymentService.getPaymentSummary().subscribe({ next: (summary) => (this.summary = summary) });
    this.paymentService.getPaymentAnalytics(fromDate || null, toDate || null).subscribe({ next: (analytics) => (this.analytics = analytics) });
  }
}
