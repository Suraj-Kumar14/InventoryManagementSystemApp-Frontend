import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { environment } from '../../../../../environments/environment';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { PurchaseOrderResponse } from '../../../../core/http/backend.models';
import { NotificationService } from '../../../../core/services/notification.service';
import { PaymentService } from '../../../../core/services/payment.service';
import { PaymentResponse } from '../../../payments/models/payment.model';
import { PoStatusBadgeComponent } from '../../components/po-status-badge/po-status-badge.component';
import { PoTimelineComponent } from '../../components/po-timeline/po-timeline.component';
import { PurchaseOrderApiService } from '../../services/purchase-order-api.service';
import { UserRole } from '../../../../shared/config/app-config';

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
  private readonly authService = inject(AuthService);
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

  readonly canManageDraft = this.authService.hasRole([UserRole.ADMIN, UserRole.OFFICER]);
  readonly canApprove = this.authService.hasRole([UserRole.ADMIN, UserRole.MANAGER]);
  readonly canRequestPayment = this.authService.hasRole([UserRole.OFFICER]);
  readonly canReceive = this.authService.hasRole([UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF]);

  ngOnInit(): void {
    const routePoId = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isInteger(routePoId) || routePoId <= 0) {
      this.notifications.error('Invalid purchase order route.');
      this.loading = false;
      return;
    }

    this.purchaseApi.getPurchaseOrderById(routePoId).subscribe({
      next: (order) => {
        // Defer to next microtask to prevent NG0100
        // (ExpressionChangedAfterItHasBeenCheckedError)
        Promise.resolve().then(() => {
          this.purchaseOrder = order;
          this.loading = false;
          const resolvedPoId = this.getPoId(order);
          if (resolvedPoId) {
            this.loadPaymentStatus(resolvedPoId);
          }
        });
      },
      error: () => {
        Promise.resolve().then(() => { this.loading = false; });
      },
    });
  }

  get poId(): number | null {
    return this.getPoId(this.purchaseOrder);
  }

  get isPaymentPending(): boolean {
    return ['PENDING_PAYMENT', 'PAYMENT_INITIATED'].includes(this.purchaseOrder?.status ?? '');
  }

  get isApprovalPending(): boolean {
    return this.purchaseOrder?.status === 'PENDING_APPROVAL';
  }

  get isApprovedAwaitingPaymentRequest(): boolean {
    return this.purchaseOrder?.status === 'APPROVED' && !this.isAlreadyPaid;
  }

  get isPaid(): boolean {
    return this.purchaseOrder?.status === 'PAID' || this.isAlreadyPaid;
  }

  get isAlreadyPaid(): boolean {
    return this.latestPayment?.status === 'PAID' || this.latestPayment?.status === 'PARTIALLY_PAID';
  }

  get canPayWithRazorpay(): boolean {
    return this.canRequestPayment && this.isPaymentPending && !this.isAlreadyPaid && !this.paymentProcessing;
  }

  get canApprovePurchaseOrder(): boolean {
    return this.canApprove && this.purchaseOrder?.status === 'PENDING_APPROVAL';
  }

  get showReceiveGoodsAction(): boolean {
    return this.canReceive && (this.purchaseOrder?.status === 'PAID' || this.purchaseOrder?.status === 'PARTIALLY_RECEIVED');
  }

  get showSubmitForApprovalAction(): boolean {
    return this.canManageDraft && this.purchaseOrder?.status === 'DRAFT' && !this.paymentProcessing;
  }

  get showSubmitForPaymentAction(): boolean {
    return this.canRequestPayment && this.purchaseOrder?.status === 'APPROVED' && !this.isAlreadyPaid && !this.paymentProcessing;
  }

  get showPaymentSection(): boolean {
    const status = this.purchaseOrder?.status ?? '';
    return ['PENDING_APPROVAL', 'APPROVED', 'PENDING_PAYMENT', 'PAYMENT_INITIATED', 'PAID', 'PARTIALLY_RECEIVED', 'RECEIVED', 'FULLY_RECEIVED'].includes(status) || this.isAlreadyPaid;
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
      return;
    }

    if (this.purchaseOrder.status !== 'PENDING_PAYMENT' && this.purchaseOrder.status !== 'PAYMENT_INITIATED') {
      this.debugLog('payment_blocked', { poId: this.poId, status: this.purchaseOrder.status, reason: 'status_not_payable' });
      this.notifications.warning(this.paymentBlockedMessage(this.purchaseOrder.status));
      return;
    }

    if (!this.canPayWithRazorpay) {
      this.debugLog('payment_blocked', { poId: this.poId, status: this.purchaseOrder.status, reason: 'role_or_processing' });
      return;
    }

    this.startRazorpayPayment(this.purchaseOrder);
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
          const poId = this.poId;
          if (!poId) {
            this.notifications.error('Invalid purchase order ID. Please refresh the page.');
            return;
          }
          this.purchaseApi.getPurchaseOrderById(poId).subscribe({
            next: (order) => {
              this.purchaseOrder = order;
              const refreshedPoId = this.getPoId(order);
              if (refreshedPoId) {
                this.loadPaymentStatus(refreshedPoId);
              }
            },
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

  submitForPayment(order: PurchaseOrderResponse | null): void {
    this.debugLog('submit_for_payment_clicked', { poId: order?.purchaseOrderId ?? order?.poId, status: order?.status, order });

    if (!order) {
      this.notifications.error('Purchase order not loaded. Please refresh the page.');
      return;
    }

    const poId = order.poId ?? order.purchaseOrderId;
    if (!poId || poId <= 0) {
      this.notifications.error('Invalid purchase order ID');
      return;
    }

    if (this.paymentProcessing) {
      return;
    }

    if (order.status !== 'APPROVED') {
      const message = this.paymentBlockedMessage(order.status);
      this.debugLog('submit_for_payment_blocked', { poId, status: order.status, reason: message });
      this.notifications.warning(message);
      return;
    }

    this.paymentProcessing = true;
    this.purchaseApi.submitPurchaseOrderForPayment(poId).subscribe({
      next: (updatedOrder) => {
        this.paymentProcessing = false;
        this.purchaseOrder = updatedOrder;
        this.notifications.success('Purchase order is ready for Razorpay payment.');
        this.loadPaymentStatus(poId);
      },
      error: (error) => {
        this.paymentProcessing = false;
        const message =
          error?.error?.message || 'Payment is available only after approval.';
        this.debugLog('submit_for_payment_failed', { poId, status: order.status, error });
        this.notifications.error(message);
      },
    });
  }

  submitForApproval(): void {
    const poId = this.getPoId(this.purchaseOrder);
    this.debugLog('submit_for_approval_clicked', { po: this.purchaseOrder, resolvedPoId: poId });

    if (!this.purchaseOrder) {
      return;
    }

    if (!poId) {
      this.notifications.error('Invalid purchase order ID. Please refresh the page.');
      return;
    }

    if (this.purchaseOrder.status !== 'DRAFT') {
      this.debugLog('submit_for_approval_blocked', { poId, status: this.purchaseOrder.status });
      this.notifications.warning('Only draft purchase orders can be submitted for approval.');
      return;
    }

    this.paymentProcessing = true;
    this.purchaseApi.submitPurchaseOrder(poId, {}).subscribe({
      next: (order) => {
        this.paymentProcessing = false;
        this.purchaseOrder = order;
        this.notifications.success('Purchase order submitted for approval.');
      },
      error: (error) => {
        this.paymentProcessing = false;
        this.debugLog('submit_for_approval_failed', { poId, error });
        this.notifications.error(error?.error?.message || 'Unable to submit purchase order for approval.');
      },
    });
  }

  private startRazorpayPayment(order: PurchaseOrderResponse): void {
    const purchaseOrderId = order.poId ?? order.purchaseOrderId;

    if (!purchaseOrderId || purchaseOrderId <= 0) {
      this.paymentProcessing = false;
      this.notifications.error('Invalid purchase order ID');
      return;
    }

    if (!['PENDING_PAYMENT', 'PAYMENT_INITIATED'].includes(order.status)) {
      this.debugLog('payment_initiation_blocked', { purchaseOrderId, status: order.status });
      this.notifications.warning(this.paymentBlockedMessage(order.status));
      return;
    }

    const payload = { purchaseOrderId };
    this.debugLog('payment_initiation_requested', { purchaseOrderId, status: order.status, payload });

    this.paymentProcessing = true;
    this.paymentService.initiateRazorpayPayment(payload).subscribe({
      next: (response) => {
        this.openRazorpayCheckout(response);
      },
      error: (error) => {
        this.paymentProcessing = false;
        const message =
          error?.status === 0 || error?.status === 502 || error?.status === 503
            ? 'Payment service is currently unavailable'
            : error?.error?.message || 'Unable to initiate Razorpay payment';
        console.error('[SubmitForPayment] failed', error);
        this.notifications.error(message);
      },
    });
  }

  approvePurchaseOrder(): void {
    if (!this.purchaseOrder) {
      return;
    }
    if (!this.canApprovePurchaseOrder) {
      this.notifications.warning('This purchase order is waiting for approval.');
      return;
    }
    const poId = this.poId;
    if (!poId) {
      this.notifications.error('Invalid purchase order ID. Please refresh the page.');
      return;
    }
    const approvalRemarks = window.prompt('Approval remarks (optional):') ?? '';
    this.purchaseApi.approvePurchaseOrder(poId, { approvalRemarks }).subscribe({
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
    const poId = this.poId;
    if (!poId) {
      this.notifications.error('Invalid purchase order ID. Please refresh the page.');
      return;
    }
    this.purchaseApi.rejectPurchaseOrder(poId, { rejectionReason }).subscribe({
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
    const poId = this.poId;
    if (!poId) {
      this.notifications.error('Invalid purchase order ID. Please refresh the page.');
      return;
    }
    this.purchaseApi.cancelPurchaseOrder(poId, { cancellationReason }).subscribe({
      next: (order) => {
        this.purchaseOrder = order;
        this.notifications.success('Purchase order cancelled successfully');
      },
    });
  }

  paymentBlockedMessage(status?: string | null): string {
    switch (status) {
      case 'DRAFT':
        return 'Draft purchase orders must be submitted for approval before payment.';
      case 'PENDING_APPROVAL':
        return 'This purchase order is waiting for approval.';
      case 'APPROVED':
        return 'Payment is available only after approval and payment request.';
      case 'PAID':
        return 'Payment already completed.';
      case 'CANCELLED':
      case 'REJECTED':
      case 'RECEIVED':
      case 'FULLY_RECEIVED':
        return 'Payment is not available for this purchase order.';
      default:
        return 'Payment is available only after approval.';
    }
  }

  private debugLog(action: string, details: Record<string, unknown>): void {
    if (!environment.production) {
      console.debug(`[PO Detail] ${action}`, details);
    }
  }

  private getPoId(po: PurchaseOrderResponse | null | undefined): number | null {
    const poId = po?.poId ?? po?.purchaseOrderId;
    return typeof poId === 'number' && Number.isInteger(poId) && poId > 0 ? poId : null;
  }
}
