import { Injectable, inject } from '@angular/core';
import { Observable, catchError, forkJoin, map, of } from 'rxjs';
import { PageResponse } from '../http/backend.models';
import { ApiService } from '../http/api.service';
import { handleServiceError } from '../http/http.utils';
import { API_ENDPOINTS } from '../../shared/config/app-config';
import {
  ApprovePaymentRequest,
  CancelPaymentRequest,
  CreatePaymentRequest,
  MarkPaymentPaidRequest,
  PaymentAnalyticsResponse,
  PaymentListQuery,
  PaymentResponse,
  PaymentSummaryResponse,
  RejectPaymentRequest,
  ReversePaymentRequest,
  SubmitPaymentRequest,
  UpdatePaymentRequest,
} from '../../features/payments/models/payment.model';

export type PaymentStatusLookup = Record<number, PaymentResponse | null>;

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private readonly api = inject(ApiService);
  private readonly serviceName = 'PaymentService';

  createPayment(request: CreatePaymentRequest): Observable<PaymentResponse> {
    return this.api
      .post<PaymentResponse>(API_ENDPOINTS.PAYMENTS.ROOT, request, { service: 'payment' })
      .pipe(handleServiceError(this.serviceName, 'createPayment'));
  }

  updatePayment(id: number, request: UpdatePaymentRequest): Observable<PaymentResponse> {
    return this.api
      .put<PaymentResponse>(API_ENDPOINTS.PAYMENTS.DETAIL(id), request, { service: 'payment' })
      .pipe(handleServiceError(this.serviceName, 'updatePayment'));
  }

  getPayments(query: PaymentListQuery = {}): Observable<PageResponse<PaymentResponse>> {
    return this.api
      .get<PageResponse<PaymentResponse>>(API_ENDPOINTS.PAYMENTS.ROOT, {
        params: {
          page: query.page ?? 0,
          size: query.size ?? 10,
          sortBy: query.sortBy ?? 'createdAt',
          sortDir: query.sortDir ?? 'desc',
        },
        service: 'payment',
      })
      .pipe(handleServiceError(this.serviceName, 'getPayments'));
  }

  searchPayments(query: PaymentListQuery = {}): Observable<PageResponse<PaymentResponse>> {
    return this.api
      .get<PageResponse<PaymentResponse>>(API_ENDPOINTS.PAYMENTS.SEARCH, {
        params: {
          keyword: query.keyword,
          purchaseOrderId: query.purchaseOrderId,
          supplierId: query.supplierId,
          status: query.status,
          paymentMethod: query.paymentMethod,
          createdBy: query.createdBy,
          fromDate: query.fromDate,
          toDate: query.toDate,
          minAmount: query.minAmount,
          maxAmount: query.maxAmount,
          page: query.page ?? 0,
          size: query.size ?? 10,
          sortBy: query.sortBy ?? 'createdAt',
          sortDir: query.sortDir ?? 'desc',
        },
        service: 'payment',
      })
      .pipe(handleServiceError(this.serviceName, 'searchPayments'));
  }

  getPaymentById(id: number): Observable<PaymentResponse> {
    return this.api
      .get<PaymentResponse>(API_ENDPOINTS.PAYMENTS.DETAIL(id), { service: 'payment' })
      .pipe(handleServiceError(this.serviceName, 'getPaymentById'));
  }

  getPaymentByNumber(paymentNumber: string): Observable<PaymentResponse> {
    return this.api
      .get<PaymentResponse>(API_ENDPOINTS.PAYMENTS.NUMBER(paymentNumber), { service: 'payment' })
      .pipe(handleServiceError(this.serviceName, 'getPaymentByNumber'));
  }

  getPaymentsByPurchaseOrder(purchaseOrderId: number, page = 0, size = 10): Observable<PageResponse<PaymentResponse>> {
    return this.api
      .get<PageResponse<PaymentResponse>>(API_ENDPOINTS.PAYMENTS.BY_PURCHASE_ORDER(purchaseOrderId), {
        params: { page, size },
        service: 'payment',
      })
      .pipe(handleServiceError(this.serviceName, 'getPaymentsByPurchaseOrder'));
  }

  getPaymentsBySupplier(supplierId: number, page = 0, size = 10): Observable<PageResponse<PaymentResponse>> {
    return this.api
      .get<PageResponse<PaymentResponse>>(API_ENDPOINTS.PAYMENTS.BY_SUPPLIER(supplierId), {
        params: { page, size },
        service: 'payment',
      })
      .pipe(handleServiceError(this.serviceName, 'getPaymentsBySupplier'));
  }

  submitPayment(id: number, request: SubmitPaymentRequest = {}): Observable<PaymentResponse> {
    return this.api
      .post<PaymentResponse>(API_ENDPOINTS.PAYMENTS.SUBMIT(id), request, { service: 'payment' })
      .pipe(handleServiceError(this.serviceName, 'submitPayment'));
  }

  approvePayment(id: number, request: ApprovePaymentRequest = {}): Observable<PaymentResponse> {
    return this.api
      .post<PaymentResponse>(API_ENDPOINTS.PAYMENTS.APPROVE(id), request, { service: 'payment' })
      .pipe(handleServiceError(this.serviceName, 'approvePayment'));
  }

  rejectPayment(id: number, request: RejectPaymentRequest): Observable<PaymentResponse> {
    return this.api
      .post<PaymentResponse>(API_ENDPOINTS.PAYMENTS.REJECT(id), request, { service: 'payment' })
      .pipe(handleServiceError(this.serviceName, 'rejectPayment'));
  }

  cancelPayment(id: number, request: CancelPaymentRequest): Observable<PaymentResponse> {
    return this.api
      .post<PaymentResponse>(API_ENDPOINTS.PAYMENTS.CANCEL(id), request, { service: 'payment' })
      .pipe(handleServiceError(this.serviceName, 'cancelPayment'));
  }

  markPaymentPaid(id: number, request: MarkPaymentPaidRequest): Observable<PaymentResponse> {
    return this.api
      .post<PaymentResponse>(API_ENDPOINTS.PAYMENTS.MARK_PAID(id), request, { service: 'payment' })
      .pipe(handleServiceError(this.serviceName, 'markPaymentPaid'));
  }

  reversePayment(id: number, request: ReversePaymentRequest): Observable<PaymentResponse> {
    return this.api
      .post<PaymentResponse>(API_ENDPOINTS.PAYMENTS.REVERSE(id), request, { service: 'payment' })
      .pipe(handleServiceError(this.serviceName, 'reversePayment'));
  }

  getPaymentHistory(id: number) {
    return this.api
      .get(API_ENDPOINTS.PAYMENTS.HISTORY(id), { service: 'payment' })
      .pipe(handleServiceError(this.serviceName, 'getPaymentHistory'));
  }

  getPaymentSummary(): Observable<PaymentSummaryResponse> {
    return this.api
      .get<PaymentSummaryResponse>(API_ENDPOINTS.PAYMENTS.SUMMARY, { service: 'payment' })
      .pipe(handleServiceError(this.serviceName, 'getPaymentSummary'));
  }

  getPaymentAnalytics(fromDate?: string | null, toDate?: string | null): Observable<PaymentAnalyticsResponse> {
    return this.api
      .get<PaymentAnalyticsResponse>(API_ENDPOINTS.PAYMENTS.ANALYTICS, {
        params: { fromDate, toDate },
        service: 'payment',
      })
      .pipe(handleServiceError(this.serviceName, 'getPaymentAnalytics'));
  }

  getPaidAmountForPurchaseOrder(purchaseOrderId: number): Observable<number> {
    return this.api
      .get<number>(API_ENDPOINTS.PAYMENTS.PAID_AMOUNT(purchaseOrderId), { service: 'payment' })
      .pipe(handleServiceError(this.serviceName, 'getPaidAmountForPurchaseOrder'));
  }

  getRemainingAmountForPurchaseOrder(purchaseOrderId: number): Observable<number> {
    return this.api
      .get<number>(API_ENDPOINTS.PAYMENTS.REMAINING_AMOUNT(purchaseOrderId), { service: 'payment' })
      .pipe(handleServiceError(this.serviceName, 'getRemainingAmountForPurchaseOrder'));
  }

  getLatestPaymentsForPurchaseOrders(poIds: number[]): Observable<PaymentStatusLookup> {
    if (poIds.length === 0) {
      return of({});
    }

    return forkJoin(
      poIds.map((poId) =>
        this.getPaymentsByPurchaseOrder(poId, 0, 20).pipe(
          map((page) => [poId, this.pickLatestPayment(page.content)] as const),
          catchError(() => of([poId, null] as const))
        )
      )
    ).pipe(
      map((entries) => Object.fromEntries(entries)),
      handleServiceError(this.serviceName, 'getLatestPaymentsForPurchaseOrders')
    );
  }

  private pickLatestPayment(payments: PaymentResponse[]): PaymentResponse | null {
    if (payments.length === 0) {
      return null;
    }

    return [...payments].sort((left, right) => {
      const leftDate = left.updatedAt || left.createdAt || '';
      const rightDate = right.updatedAt || right.createdAt || '';
      return rightDate.localeCompare(leftDate);
    })[0];
  }
}
