import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ApiService } from '../http/api.service';
import { PaymentService } from './payment.service';

describe('PaymentService', () => {
  let service: PaymentService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PaymentService, ApiService, provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(PaymentService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should call payment list API', () => {
    service.getPayments({ page: 0, size: 10 }).subscribe();

    const request = httpMock.expectOne((req) => req.method === 'GET' && req.url === 'http://localhost:8080/api/v1/payments');
    expect(request.request.params.get('page')).toBe('0');
    request.flush({ content: [], totalElements: 0, totalPages: 0, number: 0, size: 10, numberOfElements: 0, first: true, last: true, empty: true });
  });

  it('should call Razorpay initiate API', () => {
    service.initiateRazorpayPayment({ purchaseOrderId: 11 }).subscribe();

    const request = httpMock.expectOne('http://localhost:8080/api/v1/payments/razorpay/initiate');
    expect(request.request.method).toBe('POST');
    request.flush({ razorpayOrderId: 'order_123', amount: 1000, currency: 'INR', keyId: 'rzp_test_123' });
  });

  it('should call split plan API', () => {
    service.getSplitPaymentPlan({ purchaseOrderId: 11, requestedAmount: 600000 }).subscribe();

    const request = httpMock.expectOne('http://localhost:8080/api/v1/payments/split-plan');
    expect(request.request.method).toBe('POST');
    request.flush({
      purchaseOrderId: 11,
      totalAmount: 600000,
      requestedAmount: 600000,
      remainingAmount: 600000,
      maxAllowedAmount: 500000,
      suggestedSplits: [500000, 100000],
    });
  });

  it('should call Razorpay verify API', () => {
    service.verifyRazorpayPayment({ razorpayOrderId: 'order_123', razorpayPaymentId: 'pay_123', razorpaySignature: 'sig' }).subscribe();

    const request = httpMock.expectOne('http://localhost:8080/api/v1/payments/razorpay/verify');
    expect(request.request.method).toBe('POST');
    request.flush({ paymentId: 1, status: 'PAID' });
  });

  it('should call Razorpay failure API', () => {
    service.recordRazorpayFailure({ razorpayOrderId: 'order_123', razorpayPaymentId: 'pay_123', failureReason: 'failed' }).subscribe();

    const request = httpMock.expectOne('http://localhost:8080/api/v1/payments/razorpay/failure');
    expect(request.request.method).toBe('POST');
    request.flush({ paymentId: 1, status: 'FAILED' });
  });

  it('should call Razorpay cancellation API', () => {
    service.recordRazorpayCancellation({ razorpayOrderId: 'order_123', failureReason: 'cancelled' }).subscribe();

    const request = httpMock.expectOne('http://localhost:8080/api/v1/payments/razorpay/cancel');
    expect(request.request.method).toBe('POST');
    request.flush({ paymentId: 1, status: 'CANCELLED' });
  });
});
