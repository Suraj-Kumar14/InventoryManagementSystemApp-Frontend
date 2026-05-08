import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject, isDevMode } from '@angular/core';
import { forkJoin, map, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { PurchaseOrderResponse } from '../../../../core/http/backend.models';
import { NotificationService } from '../../../../core/services/notification.service';
import { PaymentService } from '../../../../core/services/payment.service';
import { PurchaseOrderApiService } from '../../../purchase-orders/services/purchase-order-api.service';
import { PaymentResponse } from '../../models/payment.model';

declare var Razorpay: any;

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
            Complete Razorpay payment for purchase orders that are in the payment queue, and track paid orders before receiving starts.
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
              <span class="po-status" [class.po-status--payment-started]="po.status === 'PAYMENT_INITIATED'">
                {{ po.status === 'PENDING_PAYMENT' ? 'PAYMENT PENDING' : po.status === 'PAYMENT_INITIATED' ? 'PAYMENT STARTED' : po.status }}
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
              <dt>Payment Status</dt>
              <dd>
                <span
                  *ngIf="paymentMap[po.poId]"
                  class="pay-badge"
                  [class.pay-badge--paid]="paymentMap[po.poId]?.status === 'PAID'"
                  [class.pay-badge--pending]="paymentMap[po.poId]?.status !== 'PAID'">
                  {{ paymentMap[po.poId]?.status || '-' }}
                </span>
                <span *ngIf="!paymentMap[po.poId]" class="pay-badge pay-badge--none">Unpaid</span>
              </dd>
            </div>
            <div>
              <dt>Approval Gate</dt>
              <dd>{{ isAlreadyPaid(po.poId) || po.status === 'PAID' ? 'Paid' : 'Payment Required' }}</dd>
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
            <button
              class="btn-razorpay"
              [disabled]="processingPoId === po.poId || isAlreadyPaid(po.poId)"
              *ngIf="!isAlreadyPaid(po.poId)"
              (click)="initiatePay(po)">
              <span *ngIf="processingPoId !== po.poId">Pay with Razorpay</span>
              <span *ngIf="processingPoId === po.poId">Processing...</span>
            </button>
            <span *ngIf="isAlreadyPaid(po.poId)" class="paid-label">Payment Complete</span>
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
    .po-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(280px,1fr)); gap:1.25rem; }
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
    .pay-badge--pending { background:#fff7ed; color:#c2410c; }
    .pay-badge--none { background:#f8fafc; color:#94a3b8; }
    .po-card__footer { margin-top:.5rem; display:flex; flex-direction:column; gap:.75rem; }
    .btn-razorpay { width:100%; padding:.9rem; border:none; border-radius:1rem; background:linear-gradient(135deg,#2563eb,#1d4ed8); color:#fff; font-weight:700; font-size:1rem; cursor:pointer; transition:opacity .2s,transform .1s; }
    .btn-razorpay:hover:not(:disabled) { opacity:.94; transform:translateY(-1px); }
    .btn-razorpay:disabled { opacity:.55; cursor:not-allowed; }
    .paid-label { display:block; text-align:center; padding:.9rem; background:#dcfce7; border-radius:1rem; color:#166534; font-weight:700; }
    @media (max-width: 768px) {
      .hero { padding:1.15rem 1.15rem 1.15rem 1.35rem; }
      .state-card { padding:2rem 1.15rem; }
      .po-card { padding:1rem; }
      .po-card__meta { grid-template-columns:1fr; }
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

  orders: PurchaseOrderResponse[] = [];
  paymentMap: Record<number, PaymentResponse | null> = {};
  loading = false;
  processingPoId: number | null = null;

  ngOnInit(): void {
    queueMicrotask(() => this.loadPendingPaymentOrders());
  }

  isAlreadyPaid(poId: number): boolean {
    const payment = this.paymentMap[poId];
    return payment?.status === 'PAID' || payment?.status === 'PARTIALLY_PAID';
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
          this.orders = (page.content ?? []).filter((po) =>
            ['PENDING_PAYMENT', 'PAYMENT_INITIATED', 'PAID'].includes(po.status)
          );
          this.debugLog('loadPendingPaymentOrders.success', {
            totalOrders: page.content?.length ?? 0,
            paymentQueueCount: this.orders.length,
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
      this.cdr.markForCheck();
      return;
    }

    forkJoin(
      this.orders.map((po) =>
        this.paymentService.getPaymentsByPurchaseOrder(po.poId, 0, 1).pipe(
          map((page) => {
            const payments = page.content ?? [];
            const paid = payments.find((payment) => payment.status === 'PAID' || payment.status === 'PARTIALLY_PAID');
            return { poId: po.poId, payment: paid ?? payments[0] ?? null };
          }),
          catchError(() => of({ poId: po.poId, payment: null }))
        )
      )
    ).subscribe({
      next: (results) => {
        this.paymentMap = results.reduce<Record<number, PaymentResponse | null>>((acc, result) => {
          acc[result.poId] = result.payment;
          return acc;
        }, {});
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.paymentMap = {};
        this.debugLog('loadPaymentStatuses.error', error);
        this.cdr.markForCheck();
      },
    });
  }

  initiatePay(po: PurchaseOrderResponse): void {
    const purchaseOrderId = po.purchaseOrderId ?? po.poId;
    this.debugLog('initiatePay.attempt', { poId: po.poId, purchaseOrderId, status: po.status });

    if (!purchaseOrderId || purchaseOrderId <= 0) {
      this.notifications.error('Invalid purchase order ID. Please refresh the page and try again.');
      return;
    }

    if (!['PENDING_PAYMENT', 'PAYMENT_INITIATED'].includes(po.status)) {
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
    this.paymentService.initiateRazorpayPayment({ purchaseOrderId }).subscribe({
      next: (orderData) => {
        this.debugLog('initiatePay.success', { poId: po.poId, razorpayOrderId: orderData.razorpayOrderId });
        this.openCheckout(orderData, po.poId);
      },
      error: (err) => {
        this.processingPoId = null;
        const message = err?.error?.message || err?.message || 'Failed to initiate payment. Please try again.';
        this.notifications.error(message);
        this.debugLog('initiatePay.error', err);
        this.cdr.markForCheck();
      },
    });
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
    const options = {
      key: orderData.keyId,
      amount: Math.round(orderData.amount * 100),
      currency: orderData.currency || 'INR',
      name: 'StockPro',
      description: orderData.description || `Payment for PO #${poId}`,
      order_id: orderData.razorpayOrderId,
      modal: {
        ondismiss: () => {
          this.processingPoId = null;
          this.notifications.error('Payment cancelled. Try again when ready.');
          this.cdr.markForCheck();
        },
      },
      handler: (response: {
        razorpay_payment_id: string;
        razorpay_order_id: string;
        razorpay_signature: string;
      }) => {
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
        this.processingPoId = null;
        this.notifications.error(response?.error?.description || 'Payment failed. Please try again.');
        this.debugLog('razorpay.failed', response);
        this.cdr.markForCheck();
      });
      razorpay.open();
    } catch {
      this.processingPoId = null;
      this.notifications.error('Razorpay checkout could not open. Check your internet connection.');
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
          this.notifications.success(`Payment successful! ID: ${razorpayPaymentId}`);
          this.orders = this.orders.map((order) =>
            order.poId === poId ? { ...order, status: 'PAID' } : order
          );
          this.debugLog('verifyPayment.success', { poId, razorpayPaymentId, status: payment.status });
          this.cdr.markForCheck();
        },
        error: (err) => {
          this.processingPoId = null;
          const message =
            err?.error?.message ||
            `Payment verification failed. Contact support with Payment ID: ${razorpayPaymentId}`;
          this.notifications.error(message);
          this.debugLog('verifyPayment.error', err);
          this.cdr.markForCheck();
        },
      });
  }

  private debugLog(action: string, payload: unknown): void {
    if (!isDevMode()) {
      return;
    }

    console.debug(`[PaymentCreate] ${action}`, payload);
  }
}
