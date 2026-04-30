import { Injectable, inject } from '@angular/core';
import { Observable, catchError, forkJoin, map, of, shareReplay, switchMap } from 'rxjs';
import {
  PaymentOrderRequest,
  PaymentOrderResponse,
  PaymentResponse,
  PaymentVerificationRequest,
} from '../http/backend.models';
import { ApiService } from '../http/api.service';
import { handleServiceError } from '../http/http.utils';
import { API_ENDPOINTS } from '../../shared/config/app-config';
import { environment } from '../../../environments/environment';

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

export interface RazorpayCheckoutContext {
  name: string;
  email?: string | null;
  contact?: string | null;
  description?: string | null;
  notes?: Record<string, string>;
}

export type PaymentStatusLookup = Record<number, PaymentResponse | null>;

interface RazorpaySuccessPayload {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface RazorpayFailurePayload {
  error?: {
    description?: string;
    reason?: string;
    metadata?: {
      order_id?: string;
      payment_id?: string;
    };
  };
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description?: string;
  order_id: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
  theme?: {
    color: string;
  };
  retry?: {
    enabled: boolean;
    max_count: number;
  };
  handler: (payload: RazorpaySuccessPayload) => void;
  modal?: {
    ondismiss?: () => void;
  };
}

interface RazorpayInstance {
  open(): void;
  close?(): void;
  on?(eventName: 'payment.failed', handler: (payload: RazorpayFailurePayload) => void): void;
}

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private readonly api = inject(ApiService);
  private readonly serviceName = 'PaymentService';
  private sdkLoader$?: Observable<void>;

  createOrder(payload: PaymentOrderRequest): Observable<PaymentOrderResponse> {
    return this.api
      .post<PaymentOrderResponse>(API_ENDPOINTS.PAYMENTS.CREATE_ORDER, payload, { service: 'payment' })
      .pipe(handleServiceError(this.serviceName, 'createOrder'));
  }

  verifyPayment(payload: PaymentVerificationRequest): Observable<PaymentResponse> {
    return this.api
      .post<PaymentResponse>(API_ENDPOINTS.PAYMENTS.VERIFY, payload, { service: 'payment' })
      .pipe(handleServiceError(this.serviceName, 'verifyPayment'));
  }

  getPaymentsByPurchaseOrder(poId: number): Observable<PaymentResponse[]> {
    return this.api
      .get<PaymentResponse[]>(API_ENDPOINTS.PAYMENTS.BY_PURCHASE_ORDER(poId), { service: 'payment' })
      .pipe(handleServiceError(this.serviceName, 'getPaymentsByPurchaseOrder'));
  }

  getPaymentsByUser(userId: number): Observable<PaymentResponse[]> {
    return this.api
      .get<PaymentResponse[]>(API_ENDPOINTS.PAYMENTS.BY_USER(userId), { service: 'payment' })
      .pipe(handleServiceError(this.serviceName, 'getPaymentsByUser'));
  }

  getPaymentsByStatus(status: string): Observable<PaymentResponse[]> {
    return this.api
      .get<PaymentResponse[]>(API_ENDPOINTS.PAYMENTS.BY_STATUS(status), { service: 'payment' })
      .pipe(handleServiceError(this.serviceName, 'getPaymentsByStatus'));
  }

  getLatestPaymentsForPurchaseOrders(poIds: number[]): Observable<PaymentStatusLookup> {
    if (poIds.length === 0) {
      return of({});
    }

    return forkJoin(
      poIds.map((poId) =>
        this.getPaymentsByPurchaseOrder(poId).pipe(
          map((payments) => [poId, this.pickLatestPayment(payments)] as const),
          catchError(() => of([poId, null] as const))
        )
      )
    ).pipe(
      map((entries) => Object.fromEntries(entries)),
      handleServiceError(this.serviceName, 'getLatestPaymentsForPurchaseOrders')
    );
  }

  processPayment(
    payload: PaymentOrderRequest,
    checkoutContext: RazorpayCheckoutContext
  ): Observable<PaymentResponse> {
    return this.createOrder(payload).pipe(
      switchMap((order) => this.loadRazorpaySdk().pipe(map(() => order))),
      switchMap((order) => this.openCheckout(order, checkoutContext)),
      switchMap((verificationPayload) => this.verifyPayment(verificationPayload)),
      handleServiceError(this.serviceName, 'processPayment')
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

  private loadRazorpaySdk(): Observable<void> {
    if (window.Razorpay) {
      return of(void 0);
    }

    if (!this.sdkLoader$) {
      this.sdkLoader$ = new Observable<void>((observer) => {
        const existingScript = document.querySelector<HTMLScriptElement>('script[data-razorpay-sdk="true"]');

        if (existingScript && window.Razorpay) {
          observer.next();
          observer.complete();
          return;
        }

        const script = existingScript ?? document.createElement('script');
        script.src = environment.razorpay.checkoutUrl;
        script.async = true;
        script.defer = true;
        script.dataset['razorpaySdk'] = 'true';

        const onLoad = () => {
          observer.next();
          observer.complete();
        };
        const onError = () => {
          this.sdkLoader$ = undefined;
          observer.error(new Error('Unable to load Razorpay checkout. Please try again.'));
        };

        script.addEventListener('load', onLoad);
        script.addEventListener('error', onError);

        if (!existingScript) {
          document.body.appendChild(script);
        }

        return () => {
          script.removeEventListener('load', onLoad);
          script.removeEventListener('error', onError);
        };
      }).pipe(shareReplay(1));
    }

    return this.sdkLoader$;
  }

  private openCheckout(
    order: PaymentOrderResponse,
    checkoutContext: RazorpayCheckoutContext
  ): Observable<PaymentVerificationRequest> {
    return new Observable<PaymentVerificationRequest>((observer) => {
      if (!window.Razorpay) {
        observer.error(new Error('Razorpay checkout is not available.'));
        return;
      }

      const instance = new window.Razorpay({
        key: order.razorpayKeyId,
        amount: Math.round(order.amount * 100),
        currency: order.currency || environment.razorpay.defaultCurrency,
        name: environment.razorpay.companyName,
        description: checkoutContext.description || order.description || 'StockPro purchase order payment',
        order_id: order.razorpayOrderId,
        prefill: {
          name: checkoutContext.name,
          email: checkoutContext.email ?? undefined,
          contact: checkoutContext.contact ?? undefined,
        },
        notes: {
          paymentId: String(order.paymentId),
          ...checkoutContext.notes,
        },
        retry: {
          enabled: true,
          max_count: environment.razorpay.retryMaxCount,
        },
        theme: {
          color: environment.razorpay.themeColor,
        },
        handler: (payload) => {
          observer.next({
            razorpayOrderId: payload.razorpay_order_id,
            razorpayPaymentId: payload.razorpay_payment_id,
            razorpaySignature: payload.razorpay_signature,
          });
          observer.complete();
        },
        modal: {
          ondismiss: () => observer.error(new Error('Payment checkout was closed before completion.')),
        },
      });

      instance.on?.('payment.failed', (payload) => {
        observer.error(
          new Error(
            payload.error?.description || payload.error?.reason || 'Payment failed. Please retry the transaction.'
          )
        );
      });

      instance.open();

      return () => {
        instance.close?.();
      };
    });
  }
}
