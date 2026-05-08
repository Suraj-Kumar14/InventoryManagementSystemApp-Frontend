import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { finalize } from 'rxjs';
import { PurchaseOrderResponse } from '../../../../core/http/backend.models';
import { NotificationService } from '../../../../core/services/notification.service';
import { PaymentService } from '../../../../core/services/payment.service';
import { PurchaseOrderApiService } from '../../../purchase-orders/services/purchase-order-api.service';
import { PaymentResponse } from '../../models/payment.model';

// Razorpay global declaration (loaded via index.html)
declare var Razorpay: any;

@Component({
  selector: 'app-payment-create',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DatePipe],
  template: `
    <section class="page-shell">

      <!-- Header -->
      <header class="hero">
        <div>
          <p class="eyebrow">Payments</p>
          <h1>Razorpay Payment</h1>
          <p class="subtitle">Approved purchase orders ready for payment via Razorpay.</p>
        </div>
      </header>

      <!-- Loading -->
      <div *ngIf="loading" class="state-card">
        <div class="spinner"></div>
        <p>Loading approved purchase orders…</p>
      </div>

      <!-- Empty -->
      <div *ngIf="!loading && orders.length === 0" class="state-card empty">
        <p>✅ No approved purchase orders pending payment.</p>
      </div>

      <!-- PO Cards -->
      <div class="po-grid" *ngIf="!loading && orders.length > 0">
        <article *ngFor="let po of orders" class="po-card">

          <div class="po-card__header">
            <div>
              <strong class="po-number">{{ po.poNumber || ('PO #' + po.poId) }}</strong>
              <span class="po-status">{{ po.status }}</span>
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
                <span *ngIf="paymentMap[po.poId]" class="pay-badge"
                  [class.pay-badge--paid]="paymentMap[po.poId]?.status === 'PAID'"
                  [class.pay-badge--pending]="paymentMap[po.poId]?.status === 'PENDING_APPROVAL'">
                  {{ paymentMap[po.poId]?.status || '—' }}
                </span>
                <span *ngIf="!paymentMap[po.poId]" class="pay-badge pay-badge--none">Unpaid</span>
              </dd>
            </div>
          </dl>

          <div class="po-card__footer">
            <button
              class="btn-razorpay"
              [disabled]="processingPoId === po.poId || isAlreadyPaid(po.poId)"
              *ngIf="!isAlreadyPaid(po.poId)"
              (click)="initiatePay(po)">
              <span *ngIf="processingPoId !== po.poId">⚡ Pay with Razorpay</span>
              <span *ngIf="processingPoId === po.poId">Processing…</span>
            </button>
            <span *ngIf="isAlreadyPaid(po.poId)" class="paid-label">✅ Payment Complete</span>
          </div>

        </article>
      </div>

    </section>
  `,
  styles: [`
    .page-shell { display:grid; gap:1.5rem; padding:1.5rem; }
    .hero { padding:1.5rem; border-radius:1.4rem; background:linear-gradient(145deg,#0f172a,#1d4ed8); color:#fff; }
    .eyebrow { margin:0; text-transform:uppercase; letter-spacing:.1em; font-size:.75rem; color:#bae6fd; }
    .hero h1 { margin:.35rem 0; font-size:2rem; }
    .subtitle { margin:0; color:#dbeafe; }
    .state-card { display:flex; flex-direction:column; align-items:center; gap:1rem; padding:3rem; background:#fff; border-radius:1.2rem; border:1px solid #e2e8f0; box-shadow:0 10px 24px rgba(15,23,42,.06); color:#64748b; }
    .state-card.empty p { font-size:1.1rem; }
    .spinner { width:2rem; height:2rem; border:3px solid #e2e8f0; border-top-color:#6366f1; border-radius:50%; animation:spin .8s linear infinite; }
    @keyframes spin { to { transform:rotate(360deg); } }
    .po-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(340px,1fr)); gap:1.25rem; }
    .po-card { background:#fff; border:1px solid #e2e8f0; border-radius:1.2rem; padding:1.25rem; box-shadow:0 8px 20px rgba(15,23,42,.07); display:flex; flex-direction:column; gap:1rem; transition:box-shadow .2s; }
    .po-card:hover { box-shadow:0 14px 30px rgba(15,23,42,.12); }
    .po-card__header { display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:.5rem; }
    .po-number { font-size:1rem; font-weight:700; color:#0f172a; }
    .po-status { margin-left:.5rem; background:#dbeafe; color:#1e40af; border-radius:999px; padding:.2rem .65rem; font-size:.72rem; font-weight:700; text-transform:uppercase; }
    .po-supplier { color:#64748b; font-size:.85rem; }
    .po-card__meta { display:grid; grid-template-columns:1fr 1fr; gap:.5rem .75rem; margin:0; }
    .po-card__meta dt { font-size:.72rem; text-transform:uppercase; color:#94a3b8; margin-bottom:.15rem; }
    .po-card__meta dd { margin:0; font-weight:600; color:#0f172a; }
    .amount { color:#059669; }
    .pay-badge { display:inline-block; border-radius:999px; padding:.2rem .65rem; font-size:.72rem; font-weight:700; background:#f1f5f9; color:#475569; }
    .pay-badge--paid { background:#dcfce7; color:#166534; }
    .pay-badge--pending { background:#fff7ed; color:#c2410c; }
    .pay-badge--none { background:#f8fafc; color:#94a3b8; }
    .po-card__footer { margin-top:.5rem; }
    .btn-razorpay { width:100%; padding:.9rem; border:none; border-radius:1rem; background:linear-gradient(135deg,#6366f1,#4f46e5); color:#fff; font-weight:700; font-size:1rem; cursor:pointer; transition:opacity .2s,transform .1s; }
    .btn-razorpay:hover:not(:disabled) { opacity:.9; transform:translateY(-1px); }
    .btn-razorpay:disabled { opacity:.55; cursor:not-allowed; }
    .paid-label { display:block; text-align:center; padding:.9rem; background:#dcfce7; border-radius:1rem; color:#166534; font-weight:700; }
  `],
})
export class PaymentCreateComponent implements OnInit {
  private readonly purchaseApi = inject(PurchaseOrderApiService);
  private readonly paymentService = inject(PaymentService);
  private readonly notifications = inject(NotificationService);

  orders: PurchaseOrderResponse[] = [];
  paymentMap: Record<number, PaymentResponse | null> = {};
  loading = true;
  processingPoId: number | null = null;

  ngOnInit(): void {
    this.loadApprovedOrders();
  }

  isAlreadyPaid(poId: number): boolean {
    const p = this.paymentMap[poId];
    return p?.status === 'PAID' || p?.status === 'PARTIALLY_PAID';
  }

  private loadApprovedOrders(): void {
    this.loading = true;
    this.purchaseApi.getPurchaseOrders({ page: 0, size: 200 })
      .pipe(
        finalize(() => (this.loading = false))
      )
      .subscribe({
        next: (page) => {
          this.orders = (page.content ?? []).filter(po => po.status === 'APPROVED');
          this.loadPaymentStatuses();
        },
        error: () => {
          this.notifications.error('Could not load approved purchase orders.');
        },
      });
  }

  private loadPaymentStatuses(): void {
    this.orders.forEach((po) => {
      const poId = po.poId;
      this.paymentService.getPaymentsByPurchaseOrder(poId, 0, 1).subscribe({
        next: (page) => {
          const payments = page.content ?? [];
          const paid = payments.find((p) => p.status === 'PAID' || p.status === 'PARTIALLY_PAID');
          this.paymentMap = { ...this.paymentMap, [poId]: paid ?? payments[0] ?? null };
        },
        error: () => {
          this.paymentMap = { ...this.paymentMap, [poId]: null };
        },
      });
    });
  }

  // ─── Razorpay Flow ──────────────────────────────────────────────────────

  initiatePay(po: PurchaseOrderResponse): void {
    // Resolve purchaseOrderId: backend may return it as purchaseOrderId or poId
    const purchaseOrderId: number | undefined = po.purchaseOrderId ?? po.poId;

    console.log('[PaymentCreate] initiatePay called', {
      poId: po.poId,
      purchaseOrderId: po.purchaseOrderId,
      resolvedId: purchaseOrderId,
      status: po.status,
      totalAmount: po.totalAmount,
    });

    if (!purchaseOrderId || purchaseOrderId <= 0) {
      console.error('[PaymentCreate] Resolved purchaseOrderId is invalid:', purchaseOrderId, po);
      this.notifications.error('Invalid purchase order ID. Please refresh the page and try again.');
      return;
    }

    if (!po.totalAmount || po.totalAmount <= 0) {
      this.notifications.error('Purchase order has no payable amount.');
      return;
    }

    const payload: { purchaseOrderId: number } = { purchaseOrderId };
    console.log('[PaymentCreate] Razorpay initiate payload =>', payload);

    this.processingPoId = po.poId;
    this.paymentService.initiateRazorpayPayment(payload).subscribe({
      next: (orderData) => {
        console.log('[PaymentCreate] Razorpay order response =>', orderData);
        this.openCheckout(orderData, po.poId);
      },
      error: (err) => {
        this.processingPoId = null;
        const msg = err?.error?.message || err?.message || 'Failed to initiate payment. Please try again.';
        console.error('[PaymentCreate] initiateRazorpayPayment error =>', err);
        this.notifications.error(msg);
      },
    });
  }

  private openCheckout(orderData: {
    razorpayOrderId: string;
    amount: number;
    currency: string;
    keyId: string;
    description?: string | null;
    purchaseOrderId: number;
  }, poId: number): void {
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
      theme: { color: '#6366f1' },
    };

    try {
      const rzp = new Razorpay(options);
      rzp.on('payment.failed', (r: any) => {
        this.processingPoId = null;
        this.notifications.error(r?.error?.description || 'Payment failed. Please try again.');
      });
      rzp.open();
    } catch {
      this.processingPoId = null;
      this.notifications.error('Razorpay checkout could not open. Check your internet connection.');
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
          // Remove the paid PO from the list
          this.orders = this.orders.filter((o) => o.poId !== poId);
        },
        error: (err) => {
          this.processingPoId = null;
          const msg =
            err?.error?.message ||
            `Payment verification failed. Contact support with Payment ID: ${razorpayPaymentId}`;
          this.notifications.error(msg);
        },
      });
  }
}
