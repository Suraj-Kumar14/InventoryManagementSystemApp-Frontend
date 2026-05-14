import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { PaymentService } from '../../../../core/services/payment.service';
import { UserRole } from '../../../../shared/config/app-config';
import { PaymentMethodBadgeComponent } from '../../components/payment-method-badge/payment-method-badge.component';
import { PaymentStatusBadgeComponent } from '../../components/payment-status-badge/payment-status-badge.component';
import { PaymentResponse, PaymentStatus, RemainingAmountResponse } from '../../models/payment.model';

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
          <a routerLink="/payments/pay" class="btn-pay">Make a Payment</a>
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
              <th>Remaining</th>
              <th>Razorpay ID</th>
              <th>Paid At</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let payment of payments">
              <td>
                <strong>{{ payment.paymentNumber }}</strong>
                <div class="muted">{{ payment.createdAt | date:'mediumDate' }}</div>
              </td>
              <td>{{ payment.poNumber || ('PO #' + payment.purchaseOrderId) }}</td>
              <td>{{ payment.supplierName || ('Supplier #' + payment.supplierId) }}</td>
              <td><app-payment-status-badge [status]="getDisplayStatus(payment)"></app-payment-status-badge></td>
              <td><app-payment-method-badge [method]="payment.paymentMethod ?? 'RAZORPAY'"></app-payment-method-badge></td>
              <td>{{ (payment.paymentAmount ?? 0) | currency:'INR':'symbol':'1.0-2' }}</td>
              <td>{{ getRemainingAmount(payment) | currency:'INR':'symbol':'1.0-2' }}</td>
              <td class="mono-text">{{ payment.razorpayPaymentId || '-' }}</td>
              <td>{{ payment.paidAt | date:'mediumDate' }}</td>
              <td class="actions">
                <button *ngIf="canShowPaymentAction(payment)" type="button" class="table-link table-link--primary" (click)="openPaymentAction(payment)">
                  {{ getPaymentActionLabel(payment) }}
                </button>
                <button type="button" class="table-link" (click)="openPaymentDetail(payment)">View</button>
                <button type="button" class="table-link" (click)="openPurchaseOrder(payment)">PO</button>
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
    .page-shell { display:grid; gap:1.4rem; padding:clamp(1rem,2vw,1.5rem); }
    .hero {
      position:relative;
      display:flex;
      justify-content:space-between;
      align-items:center;
      gap:1rem;
      flex-wrap:wrap;
      padding:1.5rem 1.5rem 1.5rem 1.8rem;
      border-radius:24px;
      background:linear-gradient(180deg,#ffffff 0%,#f8fbff 100%);
      color:#102748;
      border:1px solid #dbe4f0;
      box-shadow:0 18px 40px rgba(15,23,42,.08);
      overflow:hidden;
    }
    .hero::before {
      content:'';
      position:absolute;
      inset:0 auto 0 0;
      width:6px;
      background:linear-gradient(180deg,#2563eb 0%,#1d4ed8 55%,#0f4aa8 100%);
    }
    .eyebrow { margin:0; text-transform:uppercase; letter-spacing:0.12em; font-size:0.75rem; color:#2563eb; font-weight:700; }
    .hero h1 { margin:0.35rem 0; font-size:clamp(1.55rem,4vw,2rem); color:#102748; }
    .subtitle { margin:0; color:#64748b; max-width:42rem; }
    .hero-actions { display:flex; gap:0.75rem; }
    .btn-pay {
      text-decoration:none;
      background:linear-gradient(135deg,#2563eb 0%,#1d4ed8 100%);
      color:#fff;
      border-radius:999px;
      padding:0.85rem 1.4rem;
      font-weight:700;
      font-size:0.92rem;
      white-space:nowrap;
      box-shadow:0 10px 24px rgba(37,99,235,.18);
    }
    .btn-pay:hover { opacity:0.94; transform:translateY(-1px); }
    .table-card { background:#fff; border-radius:1.2rem; border:1px solid #e2e8f0; box-shadow:0 14px 32px rgba(15,23,42,0.08); overflow:auto; }
    table { width:100%; border-collapse:collapse; }
    th, td { padding:1rem; border-bottom:1px solid #e2e8f0; text-align:left; vertical-align:top; }
    th { color:#64748b; font-size:0.78rem; text-transform:uppercase; letter-spacing:0.08em; }
    .muted { color:#64748b; font-size:0.8rem; margin-top:0.3rem; }
    .mono-text { font-family:monospace; font-size:0.82rem; color:#475569; }
    .actions { display:flex; gap:0.4rem; flex-wrap:wrap; }
    .table-link { border:none; background:#e2e8f0; color:#0f172a; border-radius:999px; padding:0.4rem 0.8rem; font-size:0.78rem; text-decoration:none; cursor:pointer; }
    .table-link--primary { background:#dbeafe; color:#1d4ed8; }
    .state { padding:2rem; color:#64748b; text-align:center; }
    .pagination { display:flex; justify-content:center; align-items:center; gap:1rem; padding:1rem; }
    .pagination button { border:none; background:#e2e8f0; border-radius:999px; padding:0.5rem 1rem; cursor:pointer; }
    .pagination button:disabled { opacity:0.4; cursor:not-allowed; }
    @media (max-width: 900px) {
      .hero { align-items:flex-start; }
    }
    @media (max-width: 700px) {
      .hero {
        flex-direction:column;
        align-items:stretch;
        padding:1.2rem 1.2rem 1.2rem 1.4rem;
      }
      .hero-actions,
      .btn-pay {
        width:100%;
      }
      .btn-pay {
        text-align:center;
      }
    }
  `],
})
export class PaymentListComponent implements OnInit {
  private readonly paymentService = inject(PaymentService);
  private readonly router = inject(Router);
  private readonly notifications = inject(NotificationService);
  private readonly authService = inject(AuthService);

  readonly canExecutePayments = this.authService.hasRole([
    UserRole.ADMIN,
    UserRole.PURCHASE_OFFICER,
    UserRole.INVENTORY_MANAGER,
  ]);

  payments: PaymentResponse[] = [];
  remainingAmountMap: Record<number, RemainingAmountResponse | null> = {};
  loading = true;
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
        next: (response) => {
          this.payments = response.content ?? [];
          this.totalPages = response.totalPages ?? 1;
          this.loadRemainingAmounts();
        },
        error: () => {
          this.payments = [];
          this.remainingAmountMap = {};
        },
      });
  }

  changePage(newPage: number): void {
    this.page = newPage;
    this.load();
  }

  openPaymentDetail(payment: PaymentResponse): void {
    if (!this.isValidId(payment.paymentId)) {
      this.notifications.error('Payment record is missing. Please refresh the payment queue.');
      return;
    }
    void this.router.navigate(['/payments', payment.paymentId]);
  }

  openPurchaseOrder(payment: PaymentResponse): void {
    if (!this.isValidId(payment.purchaseOrderId)) {
      this.notifications.error('Payment record is missing. Please refresh the payment queue.');
      return;
    }
    void this.router.navigate(['/purchase-orders', payment.purchaseOrderId]);
  }

  openPaymentAction(payment: PaymentResponse): void {
    if (!this.isValidId(payment.purchaseOrderId)) {
      this.notifications.error('Purchase order is missing. Please refresh payment queue.');
      return;
    }
    void this.router.navigate(['/payments/pay'], { queryParams: { purchaseOrderId: payment.purchaseOrderId } });
  }

  canShowPaymentAction(payment: PaymentResponse): boolean {
    if (!this.canExecutePayments || !this.isLatestPaymentForPurchaseOrder(payment) || !this.isValidId(payment.purchaseOrderId)) {
      return false;
    }

    if (this.getRemainingAmount(payment) <= 0) {
      return false;
    }

    return ['INITIATED', 'PENDING', 'PENDING_APPROVAL', 'APPROVED', 'PARTIALLY_PAID'].includes(this.getDisplayStatus(payment));
  }

  getPaymentActionLabel(payment: PaymentResponse): string {
    const remainingSummary = this.getRemainingSummary(payment);
    const status = this.getDisplayStatus(payment);
    const remainingAmount = remainingSummary?.remainingAmount ?? payment.remainingAmount ?? 0;
    const maxAllowedAmount = remainingSummary?.maxAllowedAmount ?? Number.MAX_SAFE_INTEGER;

    if (status === 'PARTIALLY_PAID') {
      return remainingAmount > maxAllowedAmount ? 'Split Payment' : 'Pay Remaining';
    }

    return remainingAmount > maxAllowedAmount ? 'Split Payment' : 'Pay with Razorpay';
  }

  getDisplayStatus(payment: PaymentResponse): PaymentStatus {
    return this.getRemainingSummary(payment)?.status ?? payment.status ?? 'PENDING_APPROVAL';
  }

  getRemainingAmount(payment: PaymentResponse): number {
    return this.getRemainingSummary(payment)?.remainingAmount ?? payment.remainingAmount ?? 0;
  }

  private loadRemainingAmounts(): void {
    const purchaseOrderIds = [...new Set(
      this.payments
        .map((payment) => payment.purchaseOrderId)
        .filter((purchaseOrderId): purchaseOrderId is number => this.isValidId(purchaseOrderId))
    )];

    if (purchaseOrderIds.length === 0) {
      this.remainingAmountMap = {};
      return;
    }

    forkJoin(
      purchaseOrderIds.map((purchaseOrderId) =>
        this.paymentService.getRemainingAmountDetails(purchaseOrderId).pipe(catchError(() => of(null)))
      )
    ).subscribe((summaries) => {
      this.remainingAmountMap = purchaseOrderIds.reduce<Record<number, RemainingAmountResponse | null>>((acc, purchaseOrderId, index) => {
        acc[purchaseOrderId] = summaries[index];
        return acc;
      }, {});
    });
  }

  private isLatestPaymentForPurchaseOrder(payment: PaymentResponse): boolean {
    if (!this.isValidId(payment.purchaseOrderId)) {
      return false;
    }

    const latestPayment = this.payments.find((candidate) => candidate.purchaseOrderId === payment.purchaseOrderId);
    return latestPayment?.paymentId === payment.paymentId;
  }

  private getRemainingSummary(payment: PaymentResponse): RemainingAmountResponse | null {
    return this.isValidId(payment.purchaseOrderId) ? this.remainingAmountMap[payment.purchaseOrderId] ?? null : null;
  }

  private isValidId(value: number | null | undefined): value is number {
    return typeof value === 'number' && Number.isFinite(value) && value > 0;
  }
}
