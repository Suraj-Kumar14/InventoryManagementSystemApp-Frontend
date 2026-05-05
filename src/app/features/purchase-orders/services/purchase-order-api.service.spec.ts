import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ApiService } from '../../../core/http/api.service';
import { PurchaseOrderApiService } from './purchase-order-api.service';

describe('PurchaseOrderApiService', () => {
  let service: PurchaseOrderApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [PurchaseOrderApiService, ApiService, provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(PurchaseOrderApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should call PO list API', () => {
    service.getPurchaseOrders({ page: 1, size: 20, sortBy: 'poNumber', sortDir: 'asc' }).subscribe();

    const request = httpMock.expectOne(
      (req) =>
        req.method === 'GET' &&
        req.url === 'http://localhost:8080/api/v1/purchase-orders' &&
        req.params.get('page') === '1' &&
        req.params.get('size') === '20' &&
        req.params.get('sortBy') === 'poNumber'
    );
    request.flush({
      content: [],
      totalElements: 0,
      totalPages: 0,
      number: 1,
      size: 20,
      numberOfElements: 0,
      first: false,
      last: true,
      empty: true,
    });
  });

  it('should call create PO API', () => {
    service
      .createPurchaseOrder({
        supplierId: 1,
        warehouseId: 2,
        expectedDeliveryDate: '2026-05-10',
        paymentTerms: 'Net 30',
        lineItems: [{ productId: 5, orderedQuantity: 4, unitCost: 250 }],
      })
      .subscribe();

    const request = httpMock.expectOne('http://localhost:8080/api/v1/purchase-orders');
    expect(request.request.method).toBe('POST');
    request.flush({ purchaseOrderId: 11 });
  });

  it('should call submit PO API', () => {
    service.submitPurchaseOrder(10, { remarks: 'ready' }).subscribe();

    const request = httpMock.expectOne('http://localhost:8080/api/v1/purchase-orders/10/submit');
    expect(request.request.method).toBe('POST');
    request.flush({ purchaseOrderId: 10, status: 'PENDING_APPROVAL' });
  });

  it('should call approve PO API', () => {
    service.approvePurchaseOrder(10, { approvalRemarks: 'approved' }).subscribe();

    const request = httpMock.expectOne('http://localhost:8080/api/v1/purchase-orders/10/approve');
    expect(request.request.method).toBe('POST');
    request.flush({ purchaseOrderId: 10, status: 'APPROVED' });
  });

  it('should call reject PO API', () => {
    service.rejectPurchaseOrder(10, { rejectionReason: 'budget' }).subscribe();

    const request = httpMock.expectOne('http://localhost:8080/api/v1/purchase-orders/10/reject');
    expect(request.request.method).toBe('POST');
    request.flush({ purchaseOrderId: 10, status: 'REJECTED' });
  });

  it('should call cancel PO API', () => {
    service.cancelPurchaseOrder(10, { cancellationReason: 'supplier delay' }).subscribe();

    const request = httpMock.expectOne('http://localhost:8080/api/v1/purchase-orders/10/cancel');
    expect(request.request.method).toBe('POST');
    request.flush({ purchaseOrderId: 10, status: 'CANCELLED' });
  });

  it('should call receive PO API', () => {
    service
      .receivePurchaseOrder(10, {
        purchaseOrderId: 10,
        lineItems: [{ lineItemId: 1, productId: 5, receivedQuantity: 2 }],
      })
      .subscribe();

    const request = httpMock.expectOne('http://localhost:8080/api/v1/purchase-orders/10/receive');
    expect(request.request.method).toBe('POST');
    request.flush({ purchaseOrderId: 10, status: 'PARTIALLY_RECEIVED' });
  });

  it('should call summary API', () => {
    service.getPurchaseOrderSummary().subscribe();

    const request = httpMock.expectOne('http://localhost:8080/api/v1/purchase-orders/summary');
    expect(request.request.method).toBe('GET');
    request.flush({ totalPurchaseOrders: 0 });
  });

  it('should load active warehouses with the normalized sort field', () => {
    service.getWarehouses().subscribe();

    const request = httpMock.expectOne(
      (req) =>
        req.method === 'GET' &&
        req.url === 'http://localhost:8080/api/v1/warehouses' &&
        req.params.get('isActive') === 'true' &&
        req.params.get('sortBy') === 'name'
    );

    request.flush({
      content: [],
      totalElements: 0,
      totalPages: 0,
      number: 0,
      size: 100,
      numberOfElements: 0,
      first: true,
      last: true,
      empty: true,
    });
  });
});
