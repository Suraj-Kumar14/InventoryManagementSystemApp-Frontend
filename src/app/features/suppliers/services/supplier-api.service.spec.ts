import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ApiService } from '../../../core/http/api.service';
import { SupplierApiService } from './supplier-api.service';

describe('SupplierApiService', () => {
  let service: SupplierApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SupplierApiService, ApiService, provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(SupplierApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should call supplier list API', () => {
    service.getSuppliers({ page: 1, size: 20, sortBy: 'supplierCode', sortDir: 'desc' }).subscribe();

    const request = httpMock.expectOne(
      (req) =>
        req.method === 'GET' &&
        req.url === 'http://localhost:8080/api/v1/suppliers' &&
        req.params.get('page') === '1' &&
        req.params.get('size') === '20' &&
        req.params.get('sortBy') === 'supplierCode'
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

  it('should call create supplier API', () => {
    service.createSupplier({ name: 'Acme', paymentTerms: 'NET-30', leadTimeDays: 7 }).subscribe();

    const request = httpMock.expectOne('http://localhost:8080/api/v1/suppliers');
    expect(request.request.method).toBe('POST');
    request.flush({ supplierId: 1, name: 'Acme', leadTimeDays: 7, isActive: true });
  });

  it('should call update supplier API', () => {
    service.updateSupplier(10, { name: 'Acme Updated', paymentTerms: 'NET-45', leadTimeDays: 8 }).subscribe();

    const request = httpMock.expectOne('http://localhost:8080/api/v1/suppliers/10');
    expect(request.request.method).toBe('PUT');
    request.flush({ supplierId: 10, name: 'Acme Updated', leadTimeDays: 8, isActive: true });
  });

  it('should call activate supplier API', () => {
    service.activateSupplier(10).subscribe();

    const request = httpMock.expectOne('http://localhost:8080/api/v1/suppliers/10/activate');
    expect(request.request.method).toBe('PATCH');
    request.flush({ supplierId: 10, isActive: true });
  });

  it('should call deactivate supplier API', () => {
    service.deactivateSupplier(10, { reason: 'No longer approved' }).subscribe();

    const request = httpMock.expectOne('http://localhost:8080/api/v1/suppliers/10/deactivate');
    expect(request.request.method).toBe('PATCH');
    request.flush({ supplierId: 10, isActive: false });
  });

  it('should call blacklist supplier API', () => {
    service.blacklistSupplier(10, { reason: 'Policy breach' }).subscribe();

    const request = httpMock.expectOne('http://localhost:8080/api/v1/suppliers/10/blacklist');
    expect(request.request.method).toBe('PATCH');
    request.flush({ supplierId: 10, isActive: false, status: 'BLACKLISTED' });
  });

  it('should call rating update API', () => {
    service.updateSupplierRating(10, { rating: 4.8, remarks: 'Strong SLA' }).subscribe();

    const request = httpMock.expectOne('http://localhost:8080/api/v1/suppliers/10/rating');
    expect(request.request.method).toBe('PATCH');
    request.flush({ supplierId: 10, rating: 4.8, isActive: true });
  });

  it('should call summary API', () => {
    service.getSupplierSummary().subscribe();

    const request = httpMock.expectOne('http://localhost:8080/api/v1/suppliers/summary');
    expect(request.request.method).toBe('GET');
    request.flush({ totalSuppliers: 1 });
  });
});
