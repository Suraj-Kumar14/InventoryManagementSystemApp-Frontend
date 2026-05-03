import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, Input } from '@angular/core';
import { PaymentSummaryResponse } from '../../models/payment.model';

@Component({
  selector: 'app-payment-summary-cards',
  standalone: true,
  imports: [CommonModule, CurrencyPipe],
  template: `
    <div class="cards" *ngIf="summary">
      <article class="card">
        <p>Total Payments</p>
        <h3>{{ summary.totalPayments }}</h3>
      </article>
      <article class="card accent">
        <p>Pending Approval</p>
        <h3>{{ summary.pendingApprovalCount }}</h3>
      </article>
      <article class="card success">
        <p>Total Paid</p>
        <h3>{{ summary.totalPaidAmount | currency:'INR':'symbol':'1.0-2' }}</h3>
      </article>
      <article class="card warning">
        <p>Pending Amount</p>
        <h3>{{ summary.pendingPaymentAmount | currency:'INR':'symbol':'1.0-2' }}</h3>
      </article>
    </div>
  `,
  styles: [`
    .cards { display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:1rem; margin:1rem 0 1.5rem; }
    .card { padding:1.1rem 1.2rem; border-radius:1rem; background:linear-gradient(160deg, #ffffff, #f8fafc); border:1px solid #e2e8f0; box-shadow:0 14px 30px rgba(15,23,42,0.08); }
    .card p { margin:0; color:#64748b; font-size:0.8rem; text-transform:uppercase; letter-spacing:0.08em; }
    .card h3 { margin:0.5rem 0 0; color:#0f172a; font-size:1.35rem; }
    .accent { background:linear-gradient(160deg, #fff7ed, #ffedd5); }
    .success { background:linear-gradient(160deg, #ecfdf5, #dcfce7); }
    .warning { background:linear-gradient(160deg, #fefce8, #fef3c7); }
  `],
})
export class PaymentSummaryCardsComponent {
  @Input() summary: PaymentSummaryResponse | null = null;
}
