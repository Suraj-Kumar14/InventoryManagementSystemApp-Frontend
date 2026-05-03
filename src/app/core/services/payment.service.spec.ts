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

  it('should call create payment API', () => {
    service.createPayment({ purchaseOrderId: 11, paymentAmount: 1000, paymentMethod: 'NEFT', paymentDate: '2026-05-01' }).subscribe();

    const request = httpMock.expectOne('http://localhost:8080/api/v1/payments');
    expect(request.request.method).toBe('POST');
    request.flush({ paymentId: 1, paymentNumber: 'PAY-20260501-000001', purchaseOrderId: 11, supplierId: 2, status: 'DRAFT', paymentMethod: 'NEFT', paymentAmount: 1000, poTotalAmount: 2000, previouslyPaidAmount: 0, remainingAmount: 1000, currency: 'INR' });
  });

  it('should call submit payment API', () => {
    service.submitPayment(1, { remarks: 'submit' }).subscribe();

    const request = httpMock.expectOne('http://localhost:8080/api/v1/payments/1/submit');
    expect(request.request.method).toBe('POST');
    request.flush({ paymentId: 1, paymentNumber: 'PAY-20260501-000001', purchaseOrderId: 11, supplierId: 2, status: 'PENDING_APPROVAL', paymentMethod: 'NEFT', paymentAmount: 1000, poTotalAmount: 2000, previouslyPaidAmount: 0, remainingAmount: 1000, currency: 'INR' });
  });

  it('should call approve payment API', () => {
    service.approvePayment(1, { approvalRemarks: 'ok' }).subscribe();

    const request = httpMock.expectOne('http://localhost:8080/api/v1/payments/1/approve');
    expect(request.request.method).toBe('POST');
    request.flush({ paymentId: 1, paymentNumber: 'PAY-20260501-000001', purchaseOrderId: 11, supplierId: 2, status: 'APPROVED', paymentMethod: 'NEFT', paymentAmount: 1000, poTotalAmount: 2000, previouslyPaidAmount: 0, remainingAmount: 1000, currency: 'INR' });
  });

  it('should call reject payment API', () => {
    service.rejectPayment(1, { rejectionReason: 'bad docs' }).subscribe();

    const request = httpMock.expectOne('http://localhost:8080/api/v1/payments/1/reject');
    expect(request.request.method).toBe('POST');
    request.flush({ paymentId: 1, paymentNumber: 'PAY-20260501-000001', purchaseOrderId: 11, supplierId: 2, status: 'REJECTED', paymentMethod: 'NEFT', paymentAmount: 1000, poTotalAmount: 2000, previouslyPaidAmount: 0, remainingAmount: 1000, currency: 'INR' });
  });

  it('should call cancel payment API', () => {
    service.cancelPayment(1, { cancellationReason: 'duplicate' }).subscribe();

    const request = httpMock.expectOne('http://localhost:8080/api/v1/payments/1/cancel');
    expect(request.request.method).toBe('POST');
    request.flush({ paymentId: 1, paymentNumber: 'PAY-20260501-000001', purchaseOrderId: 11, supplierId: 2, status: 'CANCELLED', paymentMethod: 'NEFT', paymentAmount: 1000, poTotalAmount: 2000, previouslyPaidAmount: 0, remainingAmount: 1000, currency: 'INR' });
  });

  it('should call mark paid API', () => {
    service.markPaymentPaid(1, { paymentMethod: 'RTGS', paymentDate: '2026-05-01' }).subscribe();

    const request = httpMock.expectOne('http://localhost:8080/api/v1/payments/1/mark-paid');
    expect(request.request.method).toBe('POST');
    request.flush({ paymentId: 1, paymentNumber: 'PAY-20260501-000001', purchaseOrderId: 11, supplierId: 2, status: 'PAID', paymentMethod: 'RTGS', paymentAmount: 1000, poTotalAmount: 2000, previouslyPaidAmount: 1000, remainingAmount: 0, currency: 'INR' });
  });

  it('should call reverse payment API', () => {
    service.reversePayment(1, { reversalReason: 'bank rollback' }).subscribe();

    const request = httpMock.expectOne('http://localhost:8080/api/v1/payments/1/reverse');
    expect(request.request.method).toBe('POST');
    request.flush({ paymentId: 1, paymentNumber: 'PAY-20260501-000001', purchaseOrderId: 11, supplierId: 2, status: 'REVERSED', paymentMethod: 'RTGS', paymentAmount: 1000, poTotalAmount: 2000, previouslyPaidAmount: 1000, remainingAmount: 1000, currency: 'INR' });
  });

  it('should call summary API', () => {
    service.getPaymentSummary().subscribe();

    const request = httpMock.expectOne('http://localhost:8080/api/v1/payments/summary');
    expect(request.request.method).toBe('GET');
    request.flush({ totalPayments: 4, draftCount: 1, pendingApprovalCount: 1, approvedCount: 1, partiallyPaidCount: 0, paidCount: 1, cancelledCount: 0, rejectedCount: 0, reversedCount: 0, totalPaidAmount: 1000, pendingPaymentAmount: 500, remainingPaymentAmount: 500 });
  });

  it('should call analytics API', () => {
    service.getPaymentAnalytics('2026-05-01', '2026-05-31').subscribe();

    const request = httpMock.expectOne((req) => req.method === 'GET' && req.url === 'http://localhost:8080/api/v1/payments/analytics');
    expect(request.request.params.get('fromDate')).toBe('2026-05-01');
    request.flush({ totalPaid: 1000, totalPending: 500, monthlyPaidTrend: {}, paymentsByMethod: {}, paymentsBySupplier: {}, pendingApprovals: 1, topPaidSuppliers: [] });
  });
});
