import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { PaymentService } from '../../../../core/services/payment.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { UserRole } from '../../../../shared/config/app-config';
import { PaymentMethodBadgeComponent } from '../../components/payment-method-badge/payment-method-badge.component';
import { PaymentStatusBadgeComponent } from '../../components/payment-status-badge/payment-status-badge.component';
import { PaymentSummaryCardsComponent } from '../../components/payment-summary-cards/payment-summary-cards.component';
import { PaymentResponse, PaymentStatus, PaymentSummaryResponse } from '../../models/payment.model';

@Component({
  selector: 'app-payment-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, CurrencyPipe, DatePipe, PaymentStatusBadgeComponent, PaymentMethodBadgeComponent, PaymentSummaryCardsComponent],
  template: `
    <section class="page-shell">
      <header class="hero">
        <div>
          <p class="eyebrow">Procurement Finance</p>
          <h1>Payments</h1>
          <p class="subtitle">Track supplier settlements, approvals, partial payments, and reversals through one workflow.</p>
        </div>
        <div class="hero-actions">
          <a routerLink="/payments/create" *ngIf="canCreate" class="primary-link">Create Payment</a>
          <a routerLink="/payments/approvals" *ngIf="canApprove" class="secondary-link">Open Approvals</a>
          <a routerLink="/payments/analytics" class="secondary-link">Analytics</a>
        </div>
      </header>

      <app-payment-summary-cards [summary]="summary"></app-payment-summary-cards>

      <form class="filter-card" [formGroup]="filters" (ngSubmit)="loadPayments()">
        <input type="text" placeholder="Search payment number or supplier" formControlName="keyword" />
        <input type="number" placeholder="PO ID" formControlName="purchaseOrderId" />
        <input type="number" placeholder="Supplier ID" formControlName="supplierId" />
        <select formControlName="status">
          <option value="">All Statuses</option>
          <option *ngFor="let status of statuses" [value]="status">{{ status.replaceAll('_', ' ') }}</option>
        </select>
        <input type="date" formControlName="fromDate" />
        <input type="date" formControlName="toDate" />
        <button type="submit" [disabled]="loading">{{ loading ? 'Searching...' : 'Search' }}</button>
      </form>

      <div class="table-card">
        <div *ngIf="loading" class="state">Loading payments...</div>
        <div *ngIf="!loading && payments.length === 0" class="state">No payments found for the selected filters.</div>
        <table *ngIf="!loading && payments.length">
          <thead>
            <tr>
              <th>Payment</th>
              <th>PO</th>
              <th>Supplier</th>
              <th>Status</th>
              <th>Method</th>
              <th>Amount</th>
              <th>Remaining</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let payment of payments">
              <td>
                <strong>{{ payment.paymentNumber }}</strong>
                <div class="muted">{{ payment.createdAt | date:'medium' }}</div>
              </td>
              <td>{{ payment.poNumber || ('PO #' + payment.purchaseOrderId) }}</td>
              <td>{{ payment.supplierName || ('Supplier #' + payment.supplierId) }}</td>
              <td><app-payment-status-badge [status]="payment.status"></app-payment-status-badge></td>
              <td><app-payment-method-badge [method]="payment.paymentMethod"></app-payment-method-badge></td>
              <td>{{ payment.paymentAmount | currency:'INR':'symbol':'1.0-2' }}</td>
              <td>{{ payment.remainingAmount | currency:'INR':'symbol':'1.0-2' }}</td>
              <td>{{ payment.paymentDate || payment.createdAt | date:'mediumDate' }}</td>
              <td class="actions">
                <a [routerLink]="['/payments', payment.paymentId]" class="table-link">View</a>
                <a *ngIf="canEdit(payment)" [routerLink]="['/payments', payment.paymentId, 'edit']" class="table-link">Edit</a>
                <button *ngIf="canSubmit(payment)" type="button" (click)="submit(payment)">Submit</button>
                <button *ngIf="canApproveAction(payment)" type="button" (click)="approve(payment)">Approve</button>
                <button *ngIf="canApproveAction(payment)" type="button" (click)="reject(payment)">Reject</button>
                <button *ngIf="canMarkPaid(payment)" type="button" (click)="markPaid(payment)">Mark Paid</button>
                <button *ngIf="canCancel(payment)" type="button" (click)="cancel(payment)">Cancel</button>
                <button *ngIf="canReverse(payment)" type="button" (click)="reverse(payment)">Reverse</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  `,
  styles: [`
    .page-shell { display:grid; gap:1.4rem; padding:1.5rem; }
    .hero { display:flex; justify-content:space-between; gap:1rem; flex-wrap:wrap; padding:1.5rem; border-radius:1.4rem; background:linear-gradient(145deg, #0f172a, #164e63 58%, #ecfeff); color:#fff; }
    .eyebrow { margin:0; text-transform:uppercase; letter-spacing:0.1em; font-size:0.75rem; color:#bae6fd; }
    .hero h1 { margin:0.35rem 0; font-size:2rem; }
    .subtitle { margin:0; max-width:50rem; color:#dbeafe; }
    .hero-actions { display:flex; gap:0.75rem; flex-wrap:wrap; align-items:start; }
    .primary-link, .secondary-link { text-decoration:none; border-radius:999px; padding:0.8rem 1rem; font-weight:700; }
    .primary-link { background:#f97316; color:#fff; }
    .secondary-link { background:rgba(255,255,255,0.15); color:#fff; }
    .filter-card, .table-card { background:#fff; border-radius:1.2rem; border:1px solid #e2e8f0; box-shadow:0 14px 32px rgba(15,23,42,0.08); }
    .filter-card { display:grid; grid-template-columns:repeat(auto-fit, minmax(160px, 1fr)); gap:0.85rem; padding:1rem; }
    .filter-card input, .filter-card select, .filter-card button { padding:0.82rem 0.9rem; border-radius:0.9rem; border:1px solid #cbd5e1; }
    .filter-card button { background:#0f766e; color:#fff; border:none; font-weight:700; }
    .table-card { overflow:auto; }
    table { width:100%; border-collapse:collapse; }
    th, td { padding:1rem; border-bottom:1px solid #e2e8f0; text-align:left; vertical-align:top; }
    th { color:#64748b; font-size:0.78rem; text-transform:uppercase; letter-spacing:0.08em; }
    .muted { color:#64748b; font-size:0.8rem; margin-top:0.3rem; }
    .actions { display:flex; flex-wrap:wrap; gap:0.4rem; }
    .actions button, .table-link {
      border:none; background:#e2e8f0; color:#0f172a; border-radius:999px; padding:0.45rem 0.8rem; font-size:0.78rem; text-decoration:none; cursor:pointer;
    }
    .state { padding:2rem; color:#64748b; text-align:center; }
  `],
})
export class PaymentListComponent implements OnInit {
  private readonly paymentService = inject(PaymentService);
  private readonly notifications = inject(NotificationService);
  private readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly statuses: PaymentStatus[] = ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'PARTIALLY_PAID', 'PAID', 'CANCELLED', 'REJECTED', 'REVERSED'];
  readonly filters = this.fb.group({
    keyword: [''],
    purchaseOrderId: [''],
    supplierId: [''],
    status: [''],
    fromDate: [''],
    toDate: [''],
  });

  summary: PaymentSummaryResponse | null = null;
  payments: PaymentResponse[] = [];
  loading = false;

  ngOnInit(): void {
    this.applyDashboardQueryParams();
    this.loadSummary();
    this.loadPayments();
  }

  get canCreate(): boolean {
    return this.authService.hasRole([UserRole.ADMIN, UserRole.OFFICER]);
  }

  get canApprove(): boolean {
    return this.authService.hasRole([UserRole.ADMIN, UserRole.MANAGER]);
  }

  loadSummary(): void {
    this.paymentService.getPaymentSummary().subscribe({ next: (summary) => (this.summary = summary) });
  }

  loadPayments(): void {
    this.loading = true;
    const raw = this.filters.getRawValue();
    this.syncQueryParams();
    this.paymentService.searchPayments({
      keyword: raw.keyword || null,
      purchaseOrderId: raw.purchaseOrderId ? Number(raw.purchaseOrderId) : null,
      supplierId: raw.supplierId ? Number(raw.supplierId) : null,
      status: (raw.status as PaymentStatus) || null,
      fromDate: raw.fromDate || null,
      toDate: raw.toDate || null,
      page: 0,
      size: 20,
      sortBy: 'createdAt',
      sortDir: 'desc',
    }).pipe(finalize(() => (this.loading = false))).subscribe({
      next: (page) => (this.payments = page.content),
      error: () => {
        this.payments = [];
        this.notifications.error('Unable to load payments. Please try again.');
      },
    });
  }

  canEdit(payment: PaymentResponse): boolean {
    return this.canCreate && ['DRAFT', 'PENDING_APPROVAL'].includes(payment.status);
  }

  canSubmit(payment: PaymentResponse): boolean {
    return this.canCreate && payment.status === 'DRAFT';
  }

  canApproveAction(payment: PaymentResponse): boolean {
    return this.canApprove && payment.status === 'PENDING_APPROVAL';
  }

  canMarkPaid(payment: PaymentResponse): boolean {
    return this.canCreate && payment.status === 'APPROVED';
  }

  canCancel(payment: PaymentResponse): boolean {
    return this.canCreate && ['DRAFT', 'PENDING_APPROVAL', 'APPROVED'].includes(payment.status);
  }

  canReverse(payment: PaymentResponse): boolean {
    return this.authService.hasRole(UserRole.ADMIN) && ['PAID', 'PARTIALLY_PAID'].includes(payment.status);
  }

  submit(payment: PaymentResponse): void {
    this.paymentService.submitPayment(payment.paymentId, { remarks: 'Submitted from payment center' }).subscribe({
      next: () => this.refreshWithToast('Payment submitted for approval'),
    });
  }

  approve(payment: PaymentResponse): void {
    this.paymentService.approvePayment(payment.paymentId, { approvalRemarks: 'Approved from payment center' }).subscribe({
      next: () => this.refreshWithToast('Payment approved successfully'),
    });
  }

  reject(payment: PaymentResponse): void {
    const rejectionReason = window.prompt('Enter rejection reason');
    if (!rejectionReason?.trim()) return;
    this.paymentService.rejectPayment(payment.paymentId, { rejectionReason }).subscribe({
      next: () => this.refreshWithToast('Payment rejected successfully'),
    });
  }

  cancel(payment: PaymentResponse): void {
    const cancellationReason = window.prompt('Enter cancellation reason');
    if (!cancellationReason?.trim()) return;
    this.paymentService.cancelPayment(payment.paymentId, { cancellationReason }).subscribe({
      next: () => this.refreshWithToast('Payment cancelled successfully'),
    });
  }

  markPaid(payment: PaymentResponse): void {
    this.paymentService.markPaymentPaid(payment.paymentId, {
      paymentMethod: payment.paymentMethod,
      paymentDate: new Date().toISOString().slice(0, 10),
      transactionReference: payment.transactionReference,
      bankReference: payment.bankReference,
      remarks: payment.remarks,
    }).subscribe({
      next: () => this.refreshWithToast('Payment marked as paid'),
    });
  }

  reverse(payment: PaymentResponse): void {
    const reversalReason = window.prompt('Enter reversal reason');
    if (!reversalReason?.trim()) return;
    this.paymentService.reversePayment(payment.paymentId, { reversalReason }).subscribe({
      next: () => this.refreshWithToast('Payment reversed successfully'),
    });
  }

  private refreshWithToast(message: string): void {
    this.notifications.success(message);
    this.loadSummary();
    this.loadPayments();
  }

  private applyDashboardQueryParams(): void {
    const queryParams = this.route.snapshot.queryParamMap;
    this.filters.patchValue({
      keyword: queryParams.get('keyword') ?? '',
      purchaseOrderId: queryParams.get('purchaseOrderId') ?? '',
      supplierId: queryParams.get('supplierId') ?? '',
      status: queryParams.get('status') ?? '',
      fromDate: queryParams.get('fromDate') ?? '',
      toDate: queryParams.get('toDate') ?? '',
    });
  }

  private syncQueryParams(): void {
    const raw = this.filters.getRawValue();
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        keyword: raw.keyword || null,
        purchaseOrderId: raw.purchaseOrderId || null,
        supplierId: raw.supplierId || null,
        status: raw.status || null,
        fromDate: raw.fromDate || null,
        toDate: raw.toDate || null,
      },
      queryParamsHandling: '',
      replaceUrl: true,
    });
  }
}
