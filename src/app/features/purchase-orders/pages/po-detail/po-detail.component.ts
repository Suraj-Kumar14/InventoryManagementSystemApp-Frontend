import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PurchaseOrderResponse } from '../../../../core/http/backend.models';
import { NotificationService } from '../../../../core/services/notification.service';
import { PaymentService } from '../../../../core/services/payment.service';
import { PaymentResponse } from '../../../payments/models/payment.model';
import { PoStatusBadgeComponent } from '../../components/po-status-badge/po-status-badge.component';
import { PoTimelineComponent } from '../../components/po-timeline/po-timeline.component';
import { PurchaseOrderApiService } from '../../services/purchase-order-api.service';

// Razorpay global declaration (loaded via index.html script tag)
declare var Razorpay: any;

@Component({
  selector: 'app-po-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, PoStatusBadgeComponent, PoTimelineComponent],
  templateUrl: './po-detail.component.html',
  styleUrls: ['./po-detail.component.css'],
})
export class PoDetailComponent implements OnInit {
  private readonly purchaseApi = inject(PurchaseOrderApiService);
  private readonly paymentService = inject(PaymentService);
  private readonly route = inject(ActivatedRoute);
  private readonly notifications = inject(NotificationService);

  purchaseOrder: PurchaseOrderResponse | null = null;
  // Initialize as true to avoid NG0100: loading state must not change
  // synchronously during Angular's first change detection cycle.
  loading = true;

  // Payment state
  latestPayment: PaymentResponse | null = null;
  paymentLoading = false;
  paymentProcessing = false;

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.purchaseApi.getPurchaseOrderById(id).subscribe({
      next: (order) => {
        // Defer to next microtask to prevent NG0100
        // (ExpressionChangedAfterItHasBeenCheckedError)
        Promise.resolve().then(() => {
          this.purchaseOrder = order;
          this.loading = false;
          this.loadPaymentStatus(id);
        });
      },
      error: () => {
        Promise.resolve().then(() => { this.loading = false; });
      },
    });
  }

  get poId(): number {
    // poId is always the non-null primary key returned by the backend.
    // purchaseOrderId is optional and may be undefined — do NOT use it as the sole source.
    return this.purchaseOrder?.poId ?? 0;
  }

  get isApproved(): boolean {
    return this.purchaseOrder?.status === 'APPROVED';
  }

  get isAlreadyPaid(): boolean {
    return this.latestPayment?.status === 'PAID' || this.latestPayment?.status === 'PARTIALLY_PAID';
  }

  get canPayWithRazorpay(): boolean {
    return this.isApproved && !this.isAlreadyPaid && !this.paymentProcessing;
  }

  // ─── Payment Status ──────────────────────────────────────────────────────

  loadPaymentStatus(purchaseOrderId: number): void {
    this.paymentLoading = true;
    this.paymentService.getPaymentsByPurchaseOrder(purchaseOrderId, 0, 10).subscribe({
      next: (page) => {
        const payments = page.content ?? [];
        const paid = payments.find((p) => p.status === 'PAID' || p.status === 'PARTIALLY_PAID');
        this.latestPayment = paid ?? payments[0] ?? null;
        this.paymentLoading = false;
      },
      error: () => {
        this.paymentLoading = false;
      },
    });
  }

  // ─── Razorpay Flow ───────────────────────────────────────────────────────

  payWithRazorpay(): void {
    if (!this.purchaseOrder) {
      this.notifications.error('Purchase order not loaded. Please refresh the page.');
      return;
    }
    if (!this.canPayWithRazorpay) {
      return;
    }

    // Always derive the ID from the guaranteed non-null poId field.
    const purchaseOrderId: number = this.purchaseOrder.poId;

    if (!purchaseOrderId || purchaseOrderId <= 0) {
      this.notifications.error('Invalid purchase order ID. Please refresh the page and try again.');
      return;
    }

    const payload = { purchaseOrderId };
    console.log('[Razorpay Initiate Payload]', payload);

    this.paymentProcessing = true;
    this.paymentService.initiateRazorpayPayment(payload).subscribe({
      next: (orderData) => {
        this.openRazorpayCheckout(orderData);
      },
      error: (err) => {
        this.paymentProcessing = false;
        const msg =
          err?.error?.message || err?.message || 'Failed to initiate payment. Please try again.';
        this.notifications.error(msg);
      },
    });
  }


  private openRazorpayCheckout(orderData: {
    razorpayOrderId: string;
    amount: number;
    currency: string;
    keyId: string;
    description?: string | null;
    purchaseOrderId: number;
  }): void {
    const options = {
      key: orderData.keyId,
      amount: Math.round(orderData.amount * 100), // Convert to paise
      currency: orderData.currency || 'INR',
      name: 'StockPro',
      description: orderData.description || `Payment for PO #${orderData.purchaseOrderId}`,
      order_id: orderData.razorpayOrderId,
      modal: {
        ondismiss: () => {
          this.paymentProcessing = false;
          this.notifications.error('Payment was cancelled. Please try again if needed.');
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
          response.razorpay_signature
        );
      },
      prefill: {
        name: 'StockPro User',
      },
      theme: {
        color: '#6366f1',
      },
    };

    try {
      const rzp = new Razorpay(options);
      rzp.on('payment.failed', (response: any) => {
        this.paymentProcessing = false;
        const reason = response?.error?.description || 'Payment failed. Please try again.';
        this.notifications.error(reason);
      });
      rzp.open();
    } catch (e) {
      this.paymentProcessing = false;
      this.notifications.error(
        'Razorpay checkout could not be opened. Please check your internet connection.'
      );
    }
  }

  private verifyPayment(
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string
  ): void {
    this.paymentService
      .verifyRazorpayPayment({ razorpayOrderId, razorpayPaymentId, razorpaySignature })
      .subscribe({
        next: (payment) => {
          this.latestPayment = payment;
          this.paymentProcessing = false;
          this.notifications.success(
            `Payment successful! Payment ID: ${razorpayPaymentId}`
          );
          // Reload PO to reflect any status changes
          this.purchaseApi.getPurchaseOrderById(this.poId).subscribe({
            next: (order) => (this.purchaseOrder = order),
          });
        },
        error: (err) => {
          this.paymentProcessing = false;
          const msg =
            err?.error?.message || 'Payment verification failed. Please contact support with Payment ID: ' + razorpayPaymentId;
          this.notifications.error(msg);
        },
      });
  }

  // ─── PO Actions ──────────────────────────────────────────────────────────

  submitPurchaseOrder(): void {
    if (!this.purchaseOrder) {
      return;
    }
    this.purchaseApi.submitPurchaseOrder(this.poId, {}).subscribe({
      next: (order) => {
        this.purchaseOrder = order;
        this.notifications.success('Purchase order submitted for approval');
      },
    });
  }

  approvePurchaseOrder(): void {
    if (!this.purchaseOrder) {
      return;
    }
    const approvalRemarks = window.prompt('Approval remarks (optional):') ?? '';
    this.purchaseApi.approvePurchaseOrder(this.poId, { approvalRemarks }).subscribe({
      next: (order) => {
        this.purchaseOrder = order;
        this.notifications.success('Purchase order approved successfully');
      },
    });
  }

  rejectPurchaseOrder(): void {
    if (!this.purchaseOrder) {
      return;
    }
    const rejectionReason = window.prompt('Rejection reason is required:');
    if (!rejectionReason) {
      return;
    }
    this.purchaseApi.rejectPurchaseOrder(this.poId, { rejectionReason }).subscribe({
      next: (order) => {
        this.purchaseOrder = order;
        this.notifications.success('Purchase order rejected successfully');
      },
    });
  }

  cancelPurchaseOrder(): void {
    if (!this.purchaseOrder) {
      return;
    }
    const cancellationReason = window.prompt('Cancellation reason is required:');
    if (!cancellationReason) {
      return;
    }
    this.purchaseApi.cancelPurchaseOrder(this.poId, { cancellationReason }).subscribe({
      next: (order) => {
        this.purchaseOrder = order;
        this.notifications.success('Purchase order cancelled successfully');
      },
    });
  }
}
