import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map, of, throwError } from 'rxjs';
import { PageResponse } from '../http/backend.models';
import { ApiService } from '../http/api.service';
import { handleServiceError } from '../http/http.utils';
import { API_ENDPOINTS } from '../../shared/config/app-config';
import {
  PaymentLimitExceededResponse,
  PaymentListQuery,
  PaymentResponse,
  RazorpayInitiateRequest,
  RazorpayOrderResponse,
  RazorpayPaymentStatusUpdateRequest,
  RazorpayVerifyRequest,
  RemainingAmountResponse,
  SplitPaymentPlanRequest,
  SplitPaymentPlanResponse,
} from '../../features/payments/models/payment.model';

export type PaymentStatusLookup = Record<number, PaymentResponse>;

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private readonly api = inject(ApiService);
  private readonly serviceName = 'PaymentService';

  // ─── Read Methods ──────────────────────────────────────────────────────────

  getPaymentById(paymentId: number): Observable<PaymentResponse> {
    if (!this.isValidId(paymentId)) {
      return throwError(() => new Error('Payment record is missing. Please refresh the payment queue.'));
    }
    return this.api
      .get<PaymentResponse>(API_ENDPOINTS.PAYMENTS.DETAIL(paymentId), { service: 'payment' })
      .pipe(handleServiceError(this.serviceName, 'getPaymentById'));
  }

  getPayments(query?: PaymentListQuery): Observable<PageResponse<PaymentResponse>> {
    const params: Record<string, any> = {
      page: query?.page ?? 0,
      size: query?.size ?? 10,
      sortBy: query?.sortBy ?? 'createdAt',
      sortDir: query?.sortDir ?? 'desc',
    };
    return this.api
      .get<PageResponse<PaymentResponse>>(API_ENDPOINTS.PAYMENTS.ROOT, { service: 'payment', params })
      .pipe(handleServiceError(this.serviceName, 'getPayments'));
  }

  getPaymentsByPurchaseOrder(
    purchaseOrderId: number,
    page = 0,
    size = 10
  ): Observable<PageResponse<PaymentResponse>> {
    if (!this.isValidId(purchaseOrderId)) {
      return throwError(() => new Error('Payment record is missing. Please refresh the payment queue.'));
    }
    return this.api
      .get<PageResponse<PaymentResponse>>(
        API_ENDPOINTS.PAYMENTS.BY_PURCHASE_ORDER(purchaseOrderId),
        { service: 'payment', params: { page, size } }
      )
      .pipe(handleServiceError(this.serviceName, 'getPaymentsByPurchaseOrder'));
  }

  getPaidAmountForPurchaseOrder(purchaseOrderId: number): Observable<number> {
    if (!this.isValidId(purchaseOrderId)) {
      return throwError(() => new Error('Payment record is missing. Please refresh the payment queue.'));
    }
    return this.api
      .get<number>(API_ENDPOINTS.PAYMENTS.PAID_AMOUNT(purchaseOrderId), { service: 'payment' })
      .pipe(handleServiceError(this.serviceName, 'getPaidAmountForPurchaseOrder'));
  }

  getRemainingAmountDetails(purchaseOrderId: number): Observable<RemainingAmountResponse> {
    if (!this.isValidId(purchaseOrderId)) {
      return throwError(() => new Error('Payment record is missing. Please refresh the payment queue.'));
    }
    return this.api
      .get<RemainingAmountResponse>(
        API_ENDPOINTS.PAYMENTS.REMAINING_AMOUNT(purchaseOrderId),
        { service: 'payment' }
      )
      .pipe(handleServiceError(this.serviceName, 'getRemainingAmountDetails'));
  }

  /** Backward-compatible wrapper: extracts the remainingAmount number */
  getRemainingAmountForPurchaseOrder(purchaseOrderId: number): Observable<number> {
    return this.getRemainingAmountDetails(purchaseOrderId).pipe(map((r) => r.remainingAmount));
  }

  getSplitPaymentPlan(request: SplitPaymentPlanRequest): Observable<SplitPaymentPlanResponse> {
    return this.api
      .post<SplitPaymentPlanResponse>(API_ENDPOINTS.PAYMENTS.SPLIT_PLAN, request, {
        service: 'payment',
        headers: { 'X-Skip-Global-Error': 'true' },
      })
      .pipe(handleServiceError(this.serviceName, 'getSplitPaymentPlan'));
  }

  // ─── Razorpay Methods ──────────────────────────────────────────────────────

  initiateRazorpayPayment(request: RazorpayInitiateRequest): Observable<RazorpayOrderResponse> {
    return this.api
      .post<RazorpayOrderResponse>(API_ENDPOINTS.PAYMENTS.RAZORPAY_INITIATE, request, {
        service: 'payment',
        headers: { 'X-Skip-Global-Error': 'true' },
      })
      .pipe(handleServiceError(this.serviceName, 'initiateRazorpayPayment'));
  }

  verifyRazorpayPayment(request: RazorpayVerifyRequest): Observable<PaymentResponse> {
    return this.api
      .post<PaymentResponse>(API_ENDPOINTS.PAYMENTS.RAZORPAY_VERIFY, request, {
        service: 'payment',
        headers: { 'X-Skip-Global-Error': 'true' },
      })
      .pipe(handleServiceError(this.serviceName, 'verifyRazorpayPayment'));
  }

  recordRazorpayFailure(request: RazorpayPaymentStatusUpdateRequest): Observable<PaymentResponse> {
    return this.api
      .post<PaymentResponse>(API_ENDPOINTS.PAYMENTS.RAZORPAY_FAILURE, request, {
        service: 'payment',
        headers: { 'X-Skip-Global-Error': 'true' },
      })
      .pipe(handleServiceError(this.serviceName, 'recordRazorpayFailure'));
  }

  recordRazorpayCancellation(request: RazorpayPaymentStatusUpdateRequest): Observable<PaymentResponse> {
    return this.api
      .post<PaymentResponse>(API_ENDPOINTS.PAYMENTS.RAZORPAY_CANCEL, request, {
        service: 'payment',
        headers: { 'X-Skip-Global-Error': 'true' },
      })
      .pipe(handleServiceError(this.serviceName, 'recordRazorpayCancellation'));
  }

  // ─── Utility ──────────────────────────────────────────────────────────────

  /** Fetches the latest paid payment for each PO ID in the array. */
  getLatestPaymentsForPurchaseOrders(poIds: number[]): Observable<PaymentStatusLookup> {
    const uniquePoIds = [...new Set(poIds.filter((poId) => Number.isFinite(poId)))];
    if (uniquePoIds.length === 0) {
      return of({});
    }

    return forkJoin(
      uniquePoIds.map((poId) =>
        this.getPaymentsByPurchaseOrder(poId, 0, 5).pipe(
          map((page) => ({ poId, payments: page.content ?? [] }))
        )
      )
    ).pipe(
      map((results) =>
        results.reduce<PaymentStatusLookup>((lookup, { poId, payments }) => {
          const paid = payments.find((payment) => payment.status === 'PAID' || payment.status === 'PARTIALLY_PAID');
          if (paid) {
            lookup[poId] = paid;
          } else if (payments[0]) {
            lookup[poId] = payments[0];
          }
          return lookup;
        }, {})
      )
    );
  }

  isPaymentLimitExceeded(error: unknown): error is { error: PaymentLimitExceededResponse } {
    const backendError = (error as { error?: PaymentLimitExceededResponse } | null | undefined)?.error;
    return backendError?.errorCode === 'PAYMENT_LIMIT_EXCEEDED';
  }

  private isValidId(value: number | null | undefined): value is number {
    return typeof value === 'number' && Number.isFinite(value) && value > 0;
  }
}
