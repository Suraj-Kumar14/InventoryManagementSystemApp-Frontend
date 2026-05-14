import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject, isDevMode } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable, forkJoin, map, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { BackendErrorResponse, PurchaseOrderResponse } from '../../../../core/http/backend.models';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { PaymentService } from '../../../../core/services/payment.service';
import { UserRole } from '../../../../shared/config/app-config';
import { AlertStateService } from '../../../alerts/services/alert-state.service';
import { PurchaseOrderApiService } from '../../../purchase-orders/services/purchase-order-api.service';
import {
  PaymentLimitExceededResponse,
  PaymentStatus,
  PaymentResponse,
  RemainingAmountResponse,
  SplitPaymentPlanResponse,
} from '../../models/payment.model';

declare var Razorpay: any;

interface SplitPaymentUiState {
  message: string;
  requestedAmount: number;
  maxAllowedAmount: number;
  remainingAmount: number;
  splitAllowed: boolean;
  suggestedSplits: number[];
  loading: boolean;
}

interface PaymentDataState {
  poId: number;
  payments: PaymentResponse[];
  latestPayment: PaymentResponse | null;
  remaining: RemainingAmountResponse | null;
}

@Component({
  selector: 'app-payment-create',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DatePipe],
  template: `
    <section class="page-shell">
      <header class="hero">
        <div>
          <p class="eyebrow">Payments</p>
          <h1>Razorpay Payment</h1>
          <p class="subtitle">
            Complete Razorpay payment for purchase orders that are in the payment queue, and handle split payments only when the backend requires them.
          </p>
        </div>
      </header>

      <div *ngIf="loading" class="state-card">
        <div class="spinner"></div>
        <p>Loading purchase orders in the payment queue...</p>
      </div>

      <div *ngIf="!loading && orders.length === 0" class="state-card empty">
        <p>No purchase orders are currently waiting for payment or marked as paid.</p>
      </div>

      <div class="po-grid" *ngIf="!loading && orders.length > 0">
        <article *ngFor="let po of orders" class="po-card">
          <div class="po-card__header">
            <div>
              <strong class="po-number">{{ po.poNumber || ('PO #' + po.poId) }}</strong>
              <span class="po-status" [class.po-status--payment-started]="isPaymentInitiated(po.poId)">
                {{ getDisplayPaymentStatus(po.poId) }}
              </span>
            </div>
            <span class="po-supplier">{{ po.supplierName || ('Supplier #' + po.supplierId) }}</span>
          </div>

          <dl class="po-card__meta">
            <div>
              <dt>Warehouse</dt>
              <dd>{{ po.warehouseName || ('Warehouse #' + po.warehouseId) }}</dd>
            </div>
            <div>
              <dt>Total Amount</dt>
              <dd class="amount">{{ po.totalAmount | currency:'INR':'symbol':'1.0-2' }}</dd>
            </div>
            <div>
              <dt>Remaining Amount</dt>
              <dd>{{ getRemainingAmount(po.poId) | currency:'INR':'symbol':'1.0-2' }}</dd>
            </div>
            <div>
              <dt>Payment Status</dt>
              <dd>
                <span class="pay-badge" [class.pay-badge--paid]="isFullyPaid(po.poId)" [class.pay-badge--partial]="hasPartialPayment(po.poId)" [class.pay-badge--pending]="isPendingPayment(po.poId)" [class.pay-badge--failed]="isRetryable(po.poId)">
                  {{ getDisplayPaymentStatus(po.poId) }}
                </span>
              </dd>
            </div>
            <div>
              <dt>Approval Gate</dt>
              <dd>{{ canPay(po) ? 'Razorpay payment allowed' : (isFullyPaid(po.poId) ? 'Paid' : 'Waiting for payment gate') }}</dd>
            </div>
            <div>
              <dt>Order Date</dt>
              <dd>{{ po.orderDate || po.createdAt | date:'mediumDate' }}</dd>
            </div>
            <div>
              <dt>Expected Date</dt>
              <dd>{{ po.expectedDeliveryDate || po.expectedDate | date:'mediumDate' }}</dd>
            </div>
          </dl>

          <div class="po-card__footer">
            <section *ngIf="splitPaymentState[po.poId] as splitState" class="limit-warning">
              <strong>Payment limit reached</strong>
              <p>{{ splitState.message }}</p>

              <div class="split-grid">
                <div>
                  <span>Total Amount</span>
                  <strong>{{ po.totalAmount | currency:'INR':'symbol':'1.0-2' }}</strong>
                </div>
                <div>
                  <span>Remaining Amount</span>
                  <strong>{{ splitState.remainingAmount | currency:'INR':'symbol':'1.0-2' }}</strong>
                </div>
                <div>
                  <span>Max Allowed</span>
                  <strong>{{ splitState.maxAllowedAmount | currency:'INR':'symbol':'1.0-2' }}</strong>
                </div>
                <div>
                  <span>Requested Amount</span>
                  <strong>{{ splitState.requestedAmount | currency:'INR':'symbol':'1.0-2' }}</strong>
                </div>
              </div>

              <p *ngIf="!canManageSplitPayments" class="limit-warning__note">
                Split payment is restricted to Admin. Please contact admin to complete this payment.
              </p>

              <div *ngIf="canManageSplitPayments && splitState.splitAllowed" class="split-actions">
                <p *ngIf="splitState.loading" class="split-loading">Preparing split plan...</p>
                <div class="split-buttons" *ngIf="!splitState.loading && splitState.suggestedSplits.length > 0">
                  <button
                    type="button"
                    class="btn-split"
                    *ngFor="let splitAmount of splitState.suggestedSplits; index as splitIndex"
                    [disabled]="processingPoId === po.poId"
                    (click)="initiatePay(po, splitAmount)">
                    {{ splitState.suggestedSplits.length === 1 ? 'Pay Remaining' : ('Pay Split ' + (splitIndex + 1)) }}: {{ splitAmount | currency:'INR':'symbol':'1.0-2' }}
                  </button>
                </div>
              </div>

              <div *ngIf="paymentHistoryMap[po.poId]?.length" class="history-list">
                <h3>Recent Payment History</h3>
                <div class="history-row" *ngFor="let payment of paymentHistoryMap[po.poId]">
                  <span>{{ payment.paymentNumber || payment.razorpayOrderId || 'Pending payment' }}</span>
                  <span>{{ payment.status?.replaceAll('_', ' ') }}</span>
                  <span>{{ (payment.paymentAmount || 0) | currency:'INR':'symbol':'1.0-2' }}</span>
                </div>
              </div>
            </section>

            <button
              class="btn-razorpay"
              [disabled]="processingPoId === po.poId"
              *ngIf="canPay(po) && !splitPaymentState[po.poId]"
              (click)="initiatePay(po)">
              <span *ngIf="processingPoId !== po.poId">{{ getPrimaryPayLabel(po.poId) }}</span>
              <span *ngIf="processingPoId === po.poId">Processing...</span>
            </button>

            <span *ngIf="isFullyPaid(po.poId)" class="paid-label">Razorpay Payment Complete</span>
          </div>
        </article>
      </div>
    </section>
  `,
  styles: [`
    .page-shell { display:grid; gap:1.5rem; padding:clamp(.9rem,2vw,1.5rem); }
    .hero {
      position:relative;
      padding:1.5rem 1.5rem 1.5rem 1.75rem;
      border-radius:1.4rem;
      background:linear-gradient(180deg,#ffffff 0%,#f8fbff 100%);
      color:#102748;
      border:1px solid #dbe4f0;
      box-shadow:0 18px 42px rgba(15,23,42,.08);
      overflow:hidden;
    }
    .hero::before {
      content:'';
      position:absolute;
      inset:0 auto 0 0;
      width:6px;
      background:linear-gradient(180deg,#2563eb 0%,#1d4ed8 55%,#0f4aa8 100%);
    }
    .eyebrow { margin:0; text-transform:uppercase; letter-spacing:.1em; font-size:.75rem; color:#2563eb; font-weight:700; }
    .hero h1 { margin:.35rem 0; font-size:clamp(1.5rem,4vw,2rem); color:#102748; }
    .subtitle { margin:0; color:#64748b; max-width:48rem; }
    .state-card { display:flex; flex-direction:column; align-items:center; gap:1rem; padding:3rem; background:#fff; border-radius:1.2rem; border:1px solid #e2e8f0; box-shadow:0 10px 24px rgba(15,23,42,.06); color:#64748b; }
    .state-card.empty p { font-size:1.1rem; }
    .spinner { width:2rem; height:2rem; border:3px solid #e2e8f0; border-top-color:#2563eb; border-radius:50%; animation:spin .8s linear infinite; }
    @keyframes spin { to { transform:rotate(360deg); } }
    .po-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(320px,1fr)); gap:1.25rem; }
    .po-card { background:#fff; border:1px solid #e2e8f0; border-radius:1.2rem; padding:1.25rem; box-shadow:0 8px 20px rgba(15,23,42,.07); display:flex; flex-direction:column; gap:1rem; transition:box-shadow .2s; }
    .po-card:hover { box-shadow:0 14px 30px rgba(15,23,42,.12); }
    .po-card__header { display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:.5rem; }
    .po-number { font-size:1rem; font-weight:700; color:#0f172a; overflow-wrap:anywhere; }
    .po-status { margin-left:.5rem; background:#dbeafe; color:#1e40af; border-radius:999px; padding:.2rem .65rem; font-size:.72rem; font-weight:700; text-transform:uppercase; display:inline-flex; max-width:100%; }
    .po-status--payment-started { background:#fff7ed; color:#c2410c; }
    .po-supplier { color:#64748b; font-size:.85rem; overflow-wrap:anywhere; }
    .po-card__meta { display:grid; grid-template-columns:1fr 1fr; gap:.5rem .75rem; margin:0; }
    .po-card__meta dt { font-size:.72rem; text-transform:uppercase; color:#94a3b8; margin-bottom:.15rem; }
    .po-card__meta dd { margin:0; font-weight:600; color:#0f172a; }
    .amount { color:#059669; }
    .pay-badge { display:inline-block; border-radius:999px; padding:.2rem .65rem; font-size:.72rem; font-weight:700; background:#f1f5f9; color:#475569; }
    .pay-badge--paid { background:#dcfce7; color:#166534; }
    .pay-badge--partial { background:#dbeafe; color:#1d4ed8; }
    .pay-badge--pending { background:#fff7ed; color:#c2410c; }
    .pay-badge--failed { background:#fee2e2; color:#b91c1c; }
    .po-card__footer { margin-top:.5rem; display:flex; flex-direction:column; gap:.75rem; }
    .limit-warning { display:grid; gap:.75rem; padding:.9rem 1rem; border-radius:1rem; background:linear-gradient(180deg,#fff7ed 0%,#fffbeb 100%); border:1px solid #fdba74; color:#9a3412; }
    .limit-warning strong { font-size:.92rem; }
    .limit-warning p { margin:0; font-size:.85rem; line-height:1.45; }
    .limit-warning__note { font-weight:600; }
    .split-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:.75rem; }
    .split-grid div { display:grid; gap:.2rem; padding:.75rem; border-radius:.8rem; background:rgba(255,255,255,.65); }
    .split-grid span { font-size:.72rem; text-transform:uppercase; color:#9a3412; }
    .split-actions { display:grid; gap:.6rem; }
    .split-loading { font-weight:600; }
    .split-buttons { display:grid; gap:.6rem; }
    .btn-split { width:100%; padding:.8rem; border:1px solid #c2410c; border-radius:.85rem; background:#fff; color:#9a3412; font-weight:700; cursor:pointer; }
    .btn-split:disabled { opacity:.55; cursor:not-allowed; }
    .history-list { display:grid; gap:.45rem; padding-top:.2rem; }
    .history-list h3 { margin:0; font-size:.86rem; }
    .history-row { display:grid; grid-template-columns:1.4fr 1fr 1fr; gap:.5rem; font-size:.82rem; }
    .btn-razorpay { width:100%; padding:.9rem; border:none; border-radius:1rem; background:linear-gradient(135deg,#2563eb,#1d4ed8); color:#fff; font-weight:700; font-size:1rem; cursor:pointer; transition:opacity .2s,transform .1s; }
    .btn-razorpay:hover:not(:disabled) { opacity:.94; transform:translateY(-1px); }
    .btn-razorpay:disabled { opacity:.55; cursor:not-allowed; }
    .paid-label { display:block; text-align:center; padding:.9rem; background:#dcfce7; border-radius:1rem; color:#166534; font-weight:700; }
    @media (max-width: 768px) {
      .hero { padding:1.15rem 1.15rem 1.15rem 1.35rem; }
      .state-card { padding:2rem 1.15rem; }
      .po-card { padding:1rem; }
      .po-card__meta,
      .split-grid,
      .history-row { grid-template-columns:1fr; }
    }
    @media (max-width: 480px) {
      .page-shell { gap:1rem; }
      .po-grid { grid-template-columns:1fr; }
      .po-status { margin-left:0; margin-top:.45rem; }
    }
  `],
})
export class PaymentCreateComponent implements OnInit {
  private readonly purchaseApi = inject(PurchaseOrderApiService);
  private readonly paymentService = inject(PaymentService);
  private readonly notifications = inject(NotificationService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly alertState = inject(AlertStateService);
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);

  readonly canManageSplitPayments = this.authService.hasRole(UserRole.ADMIN);

  orders: PurchaseOrderResponse[] = [];
  paymentMap: Record<number, PaymentResponse | null> = {};
  paymentHistoryMap: Record<number, PaymentResponse[]> = {};
  remainingAmountMap: Record<number, RemainingAmountResponse | null> = {};
  splitPaymentState: Record<number, SplitPaymentUiState | null> = {};
  loading = false;
  processingPoId: number | null = null;
  selectedPurchaseOrderId: number | null = null;

  ngOnInit(): void {
    const queryPurchaseOrderId = Number(this.route.snapshot.queryParamMap.get('purchaseOrderId'));
    this.selectedPurchaseOrderId = Number.isInteger(queryPurchaseOrderId) && queryPurchaseOrderId > 0
      ? queryPurchaseOrderId
      : null;
    queueMicrotask(() => this.loadPendingPaymentOrders());
  }

  isFullyPaid(poId: number): boolean {
    return this.getOverallPaymentStatus(poId) === 'PAID' || this.getRemainingAmount(poId) <= 0;
  }

  hasPartialPayment(poId: number): boolean {
    return this.getOverallPaymentStatus(poId) === 'PARTIALLY_PAID';
  }

  isPendingPayment(poId: number): boolean {
    const status = this.getOverallPaymentStatus(poId);
    return !status || status === 'PENDING_APPROVAL' || status === 'INITIATED';
  }

  canPay(po: PurchaseOrderResponse): boolean {
    return this.isPaymentActionAllowed(po);
  }

  getDisplayPaymentStatus(poId: number): string {
    const status = this.getOverallPaymentStatus(poId);
    switch (status) {
      case 'PAID':
        return 'PAID';
      case 'PARTIALLY_PAID':
        return 'PARTIALLY PAID';
      case 'INITIATED':
        return 'INITIATED';
      case 'PENDING':
        return 'PENDING';
      case 'APPROVED':
        return 'APPROVED';
      case 'FAILED':
        return 'FAILED';
      case 'CANCELLED':
        return 'CANCELLED';
      case 'REJECTED':
        return 'REJECTED';
      case 'REVERSED':
        return 'REVERSED';
      case 'PENDING_APPROVAL':
        return 'PENDING APPROVAL';
      default:
        return 'PENDING';
    }
  }

  getPrimaryPayLabel(poId: number): string {
    return this.hasPartialPayment(poId)
      ? `Pay Remaining: ${new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(this.getRemainingAmount(poId))}`
      : 'Pay with Razorpay';
  }

  getRemainingAmount(poId: number): number {
    return this.remainingAmountMap[poId]?.remainingAmount ?? this.paymentMap[poId]?.remainingAmount ?? 0;
  }

  isPaymentInitiated(poId: number): boolean {
    return this.paymentMap[poId]?.status === 'INITIATED';
  }

  isRetryable(poId: number): boolean {
    const status = this.paymentMap[poId]?.status;
    return status === 'FAILED' || status === 'CANCELLED';
  }

  private loadPendingPaymentOrders(): void {
    this.loading = true;
    this.cdr.markForCheck();
    this.purchaseApi
      .getPurchaseOrders({ page: 0, size: 200 })
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe({
        next: (page) => {
          this.orders = (page.content ?? [])
            .map((po) => this.normalizeOrder(po))
            .filter((po): po is PurchaseOrderResponse => !!po)
            .filter((po) => ['APPROVED', 'PENDING_PAYMENT', 'PAYMENT_INITIATED', 'PAID'].includes(po.status))
            .filter((po) => this.selectedPurchaseOrderId === null || po.poId === this.selectedPurchaseOrderId);

          if (this.selectedPurchaseOrderId !== null && this.orders.length === 0) {
            this.notifications.warning('Purchase order is missing. Please reopen payment from approved purchase order.');
          }
          this.debugLog('loadPendingPaymentOrders.success', {
            totalOrders: page.content?.length ?? 0,
            paymentQueueCount: this.orders.length,
            selectedPurchaseOrderId: this.selectedPurchaseOrderId,
          });
          this.loadPaymentStatuses();
          this.cdr.markForCheck();
        },
        error: (error) => {
          this.orders = [];
          this.notifications.error('Could not load purchase orders awaiting payment.');
          this.debugLog('loadPendingPaymentOrders.error', error);
          this.cdr.markForCheck();
        },
      });
  }

  private loadPaymentStatuses(): void {
    if (this.orders.length === 0) {
      this.paymentMap = {};
      this.paymentHistoryMap = {};
      this.remainingAmountMap = {};
      this.cdr.markForCheck();
      return;
    }

    forkJoin(this.orders.map((po) => this.loadPaymentDataForPo(po.poId))).subscribe({
      next: (results) => {
        this.paymentMap = results.reduce<Record<number, PaymentResponse | null>>((acc, result) => {
          acc[result.poId] = result.latestPayment;
          return acc;
        }, {});
        this.paymentHistoryMap = results.reduce<Record<number, PaymentResponse[]>>((acc, result) => {
          acc[result.poId] = result.payments;
          return acc;
        }, {});
        this.remainingAmountMap = results.reduce<Record<number, RemainingAmountResponse | null>>((acc, result) => {
          acc[result.poId] = result.remaining;
          return acc;
        }, {});
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.paymentMap = {};
        this.paymentHistoryMap = {};
        this.remainingAmountMap = {};
        this.debugLog('loadPaymentStatuses.error', error);
        this.cdr.markForCheck();
      },
    });
  }

  initiatePay(po: PurchaseOrderResponse, paymentAmount?: number): void {
    const purchaseOrderId = this.resolvePurchaseOrderId(po);
    this.debugLog('initiatePay.attempt', { poId: po.poId, purchaseOrderId, status: po.status, paymentAmount });

    if (!purchaseOrderId || purchaseOrderId <= 0) {
      this.notifications.error('Purchase order is missing. Please reopen payment from approved purchase order.');
      return;
    }

    if (!this.isPaymentActionAllowed(po)) {
      this.notifications.warning(
        po.status === 'PAID' ? 'Payment already completed.' : 'Payment is available only for purchase orders pending payment.'
      );
      return;
    }

    if (!po.totalAmount || po.totalAmount <= 0) {
      this.notifications.error('Purchase order has no payable amount.');
      return;
    }

    this.processingPoId = po.poId;
    this.cdr.markForCheck();
    this.paymentService.initiateRazorpayPayment({
      purchaseOrderId,
      paymentAmount: paymentAmount ?? null,
    }).subscribe({
      next: (orderData) => {
        this.paymentMap = {
          ...this.paymentMap,
          [po.poId]: {
            purchaseOrderId,
            poNumber: po.poNumber,
            supplierId: po.supplierId,
            supplierName: po.supplierName,
            paymentNumber: orderData.paymentNumber,
            razorpayOrderId: orderData.razorpayOrderId,
            paymentAmount: orderData.amount,
            currency: orderData.currency,
            status: 'INITIATED',
          },
        };
        this.debugLog('initiatePay.success', { poId: po.poId, razorpayOrderId: orderData.razorpayOrderId });
        this.openCheckout(orderData, po.poId);
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.processingPoId = null;
        const backendError = this.extractBackendError(err);
        if (this.paymentService.isPaymentLimitExceeded(err)) {
          this.handlePaymentLimitExceeded(po, backendError as PaymentLimitExceededResponse);
        } else {
          const message = backendError?.message || err?.message || 'Failed to initiate payment. Please try again.';
          this.notifications.error(message);
        }
        this.alertState.refresh();
        this.debugLog('initiatePay.error', err);
        this.cdr.markForCheck();
      },
    });
  }

  private handlePaymentLimitExceeded(po: PurchaseOrderResponse, limitError: PaymentLimitExceededResponse): void {
    this.notifications.warning(limitError.message);
    this.splitPaymentState = {
      ...this.splitPaymentState,
      [po.poId]: {
        message: limitError.message,
        requestedAmount: limitError.requestedAmount,
        maxAllowedAmount: limitError.maxAllowedAmount,
        remainingAmount: limitError.remainingAmount,
        splitAllowed: limitError.splitAllowed,
        suggestedSplits: [],
        loading: this.canManageSplitPayments,
      },
    };

    if (!this.canManageSplitPayments || !limitError.splitAllowed) {
      return;
    }

    this.paymentService.getSplitPaymentPlan({
      purchaseOrderId: this.resolvePurchaseOrderId(po) as number,
      requestedAmount: limitError.remainingAmount,
    }).subscribe({
      next: (plan) => {
        this.applySplitPlan(po.poId, plan, limitError.message);
      },
      error: () => {
        this.applySplitPlan(po.poId, null, limitError.message);
      },
    });
  }

  private applySplitPlan(poId: number, plan: SplitPaymentPlanResponse | null, message: string): void {
    const existing = this.splitPaymentState[poId];
    if (!existing) {
      return;
    }

    this.splitPaymentState = {
      ...this.splitPaymentState,
      [poId]: {
        ...existing,
        message,
        requestedAmount: plan?.requestedAmount ?? existing.requestedAmount,
        maxAllowedAmount: plan?.maxAllowedAmount ?? existing.maxAllowedAmount,
        remainingAmount: plan?.remainingAmount ?? existing.remainingAmount,
        suggestedSplits: plan?.suggestedSplits ?? [],
        loading: false,
      },
    };
    this.cdr.markForCheck();
  }

  private openCheckout(
    orderData: {
      razorpayOrderId: string;
      amount: number;
      currency: string;
      keyId: string;
      description?: string | null;
      purchaseOrderId: number;
    },
    poId: number
  ): void {
    let terminalOutcomeCaptured = false;
    const options = {
      key: orderData.keyId,
      amount: Math.round(orderData.amount * 100),
      currency: orderData.currency || 'INR',
      name: 'StockPro',
      description: orderData.description || `Payment for PO #${poId}`,
      order_id: orderData.razorpayOrderId,
      modal: {
        ondismiss: () => {
          if (terminalOutcomeCaptured) {
            return;
          }
          terminalOutcomeCaptured = true;
          this.processingPoId = null;
          this.recordCancellation(orderData.razorpayOrderId, poId);
        },
      },
      handler: (response: {
        razorpay_payment_id: string;
        razorpay_order_id: string;
        razorpay_signature: string;
      }) => {
        terminalOutcomeCaptured = true;
        this.verifyPayment(
          response.razorpay_order_id,
          response.razorpay_payment_id,
          response.razorpay_signature,
          poId
        );
      },
      theme: { color: '#2563eb' },
    };

    try {
      const razorpay = new Razorpay(options);
      razorpay.on('payment.failed', (response: any) => {
        if (terminalOutcomeCaptured) {
          return;
        }
        terminalOutcomeCaptured = true;
        this.processingPoId = null;
        this.recordFailure(
          orderData.razorpayOrderId,
          poId,
          response?.error?.metadata?.payment_id || null,
          response?.error?.description || 'Payment failed. Please try again.'
        );
        this.debugLog('razorpay.failed', response);
        this.cdr.markForCheck();
      });
      razorpay.open();
    } catch {
      this.processingPoId = null;
      this.notifications.error('Razorpay checkout could not open. Check your internet connection.');
      this.paymentMap = {
        ...this.paymentMap,
        [poId]: {
          ...this.paymentMap[poId],
          status: 'FAILED',
        },
      };
      this.cdr.markForCheck();
    }
  }

  private verifyPayment(
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string,
    poId: number
  ): void {
    this.paymentService
      .verifyRazorpayPayment({ razorpayOrderId, razorpayPaymentId, razorpaySignature })
      .subscribe({
        next: (payment) => {
          this.processingPoId = null;
          this.paymentMap = { ...this.paymentMap, [poId]: payment };
          this.refreshPaymentState(poId, ({ remaining }) => {
            if ((remaining?.remainingAmount ?? 0) <= 0) {
              this.notifications.success('Payment completed successfully');
            } else {
              this.notifications.success('Split payment completed successfully. Remaining amount updated.');
            }
          });
          this.alertState.refresh();
          this.debugLog('verifyPayment.success', { poId, razorpayPaymentId, status: payment.status });
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.processingPoId = null;
          const message =
            err?.error?.message ||
            `Payment verification failed. Contact support with Payment ID: ${razorpayPaymentId}`;
          this.notifications.error(message);
          this.alertState.refresh();
          this.debugLog('verifyPayment.error', err);
          this.cdr.markForCheck();
        },
      });
  }

  private refreshPaymentState(poId: number, onUpdated?: (state: PaymentDataState) => void): void {
    this.loadPaymentDataForPo(poId).subscribe({
      next: (state) => {
        const { latestPayment, payments, remaining } = state;
        this.paymentMap = { ...this.paymentMap, [poId]: latestPayment };
        this.paymentHistoryMap = { ...this.paymentHistoryMap, [poId]: payments };
        this.remainingAmountMap = { ...this.remainingAmountMap, [poId]: remaining };
        this.syncOrderPaymentStatus(poId, remaining);

        if ((remaining?.remainingAmount ?? 0) <= 0) {
          this.clearSplitPaymentState(poId);
        } else if (this.canManageSplitPayments && remaining && remaining.remainingAmount > 0 && remaining.status === 'PARTIALLY_PAID') {
          this.paymentService.getSplitPaymentPlan({
            purchaseOrderId: poId,
            requestedAmount: remaining.remainingAmount,
          }).subscribe({
            next: (plan) => {
              this.applySplitPlan(poId, plan, 'Payment amount exceeds Razorpay transaction limit. Please split the payment or contact admin.');
            },
            error: () => this.clearSplitPaymentState(poId),
          });
        } else if (!this.canManageSplitPayments && remaining && remaining.remainingAmount > 0 && remaining.status === 'PARTIALLY_PAID') {
          this.splitPaymentState = {
            ...this.splitPaymentState,
            [poId]: {
              message: 'Payment amount exceeds Razorpay transaction limit. Please split the payment or contact admin.',
              requestedAmount: remaining.remainingAmount,
              maxAllowedAmount: 0,
              remainingAmount: remaining.remainingAmount,
              splitAllowed: false,
              suggestedSplits: [],
              loading: false,
            },
          };
        } else if (!this.splitPaymentState[poId]) {
          this.clearSplitPaymentState(poId);
        }

        onUpdated?.(state);
        this.cdr.markForCheck();
      },
      error: (error: unknown) => {
        this.debugLog('refreshPaymentState.error', error);
      },
    });
  }

  private loadPaymentDataForPo(poId: number): Observable<PaymentDataState> {
    if (!poId || poId <= 0) {
      return of({
        poId,
        payments: [],
        latestPayment: null,
        remaining: null,
      });
    }

    return forkJoin({
      page: this.paymentService.getPaymentsByPurchaseOrder(poId, 0, 10).pipe(
        catchError(() => of({
          content: [],
          totalElements: 0,
          totalPages: 0,
          number: 0,
          size: 10,
          numberOfElements: 0,
          first: true,
          last: true,
          empty: true,
        }))
      ),
      remaining: this.paymentService.getRemainingAmountDetails(poId).pipe(catchError(() => of(null))),
    }).pipe(
      map(({ page, remaining }) => {
        const payments = page.content ?? [];
        const latestPayment = payments.find((payment) => payment.status === 'INITIATED')
          ?? payments.find((payment) => payment.status === 'PARTIALLY_PAID')
          ?? payments.find((payment) => payment.status === 'PAID')
          ?? payments[0]
          ?? null;

        return {
          poId,
          payments,
          latestPayment,
          remaining,
        };
      })
    );
  }

  private syncOrderPaymentStatus(poId: number, remaining: RemainingAmountResponse | null): void {
    this.orders = this.orders.map((order) => {
      if (order.poId !== poId) {
        return order;
      }

      const hasRemainingAmount = (remaining?.remainingAmount ?? 0) > 0;
      const hasPaidAmount = (remaining?.paidAmount ?? 0) > 0;

      return {
        ...order,
        status: hasRemainingAmount
          ? (hasPaidAmount ? 'PAYMENT_INITIATED' : 'PENDING_PAYMENT')
          : 'PAID',
      };
    });
  }

  private debugLog(action: string, payload: unknown): void {
    if (!isDevMode()) {
      return;
    }

    console.debug(`[PaymentCreate] ${action}`, payload);
  }

  private extractBackendError(error: unknown): BackendErrorResponse | null {
    return (error as { error?: BackendErrorResponse } | null | undefined)?.error ?? null;
  }

  private normalizeOrder(order: PurchaseOrderResponse): PurchaseOrderResponse | null {
    const purchaseOrderId = this.resolvePurchaseOrderId(order);
    if (!purchaseOrderId) {
      this.debugLog('normalizeOrder.skipped', order);
      return null;
    }

    return {
      ...order,
      poId: purchaseOrderId,
      purchaseOrderId,
    };
  }

  private resolvePurchaseOrderId(order: PurchaseOrderResponse | null | undefined): number | null {
    const candidate = order?.purchaseOrderId ?? order?.poId;
    return typeof candidate === 'number' && Number.isInteger(candidate) && candidate > 0 ? candidate : null;
  }

  private clearSplitPaymentState(poId: number): void {
    if (!this.splitPaymentState[poId]) {
      return;
    }
    const nextState = { ...this.splitPaymentState };
    delete nextState[poId];
    this.splitPaymentState = nextState;
  }

  private getOverallPaymentStatus(poId: number): PaymentStatus | null {
    return this.remainingAmountMap[poId]?.status ?? this.paymentMap[poId]?.status ?? null;
  }

  private isPaymentActionAllowed(po: PurchaseOrderResponse): boolean {
    const paymentStatus = this.getOverallPaymentStatus(po.poId);
    const remainingAmount = this.getRemainingAmount(po.poId);

    if (!Number.isFinite(remainingAmount) || remainingAmount <= 0) {
      return false;
    }

    if (paymentStatus && ['PAID', 'CANCELLED', 'REJECTED', 'REVERSED'].includes(paymentStatus)) {
      return false;
    }

    if (['CANCELLED', 'REJECTED'].includes(po.status)) {
      return false;
    }

    return true;
  }

  private recordFailure(razorpayOrderId: string, poId: number, razorpayPaymentId: string | null, failureReason: string): void {
    this.paymentService.recordRazorpayFailure({ razorpayOrderId, razorpayPaymentId, failureReason }).subscribe({
      next: (payment) => {
        this.paymentMap = { ...this.paymentMap, [poId]: payment };
        this.notifications.error(failureReason);
        this.alertState.refresh();
        this.refreshPaymentState(poId);
        this.cdr.markForCheck();
      },
      error: () => {
        this.paymentMap = { ...this.paymentMap, [poId]: { ...this.paymentMap[poId], status: 'FAILED' } };
        this.notifications.error(failureReason);
        this.cdr.markForCheck();
      },
    });
  }

  private recordCancellation(razorpayOrderId: string, poId: number): void {
    this.paymentService.recordRazorpayCancellation({ razorpayOrderId, failureReason: 'Payment cancelled by user' }).subscribe({
      next: (payment) => {
        this.paymentMap = { ...this.paymentMap, [poId]: payment };
        this.notifications.warning('Payment cancelled. Try again when ready.');
        this.alertState.refresh();
        this.refreshPaymentState(poId);
        this.cdr.markForCheck();
      },
      error: () => {
        this.paymentMap = { ...this.paymentMap, [poId]: { ...this.paymentMap[poId], status: 'CANCELLED' } };
        this.notifications.warning('Payment cancelled. Try again when ready.');
        this.cdr.markForCheck();
      },
    });
  }
}
