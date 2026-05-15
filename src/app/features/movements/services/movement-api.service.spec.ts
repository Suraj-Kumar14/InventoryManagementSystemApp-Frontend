import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ApiService } from '../../../core/http/api.service';
import { MovementApiService } from './movement-api.service';

describe('MovementApiService', () => {
  let service: MovementApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MovementApiService, ApiService, provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(MovementApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should call movement list API', () => {
    service.getMovements({ page: 1, size: 20, sortBy: 'movementNumber', sortDir: 'asc' }).subscribe();

    const request = httpMock.expectOne(
      (req) =>
        req.method === 'GET' &&
        req.url === 'http://localhost:8080/api/v1/movements' &&
        req.params.get('page') === '1' &&
        req.params.get('size') === '20'
    );
    request.flush({ content: [], totalElements: 0, totalPages: 0, number: 1, size: 20, numberOfElements: 0, first: false, last: true, empty: true });
  });

  it('should call movement search API', () => {
    service.searchMovements({ keyword: 'MOV-', movementType: 'STOCK_IN' }).subscribe();

    const request = httpMock.expectOne(
      (req) => req.method === 'GET' && req.url === 'http://localhost:8080/api/v1/movements/search' && req.params.get('keyword') === 'MOV-'
    );
    request.flush({ content: [], totalElements: 0, totalPages: 0, number: 0, size: 10, numberOfElements: 0, first: true, last: true, empty: true });
  });

  it('should call movement detail API', () => {
    service.getMovementById(10).subscribe();

    const request = httpMock.expectOne('http://localhost:8080/api/v1/movements/10');
    expect(request.request.method).toBe('GET');
    request.flush({ movementId: 10, movementNumber: 'MOV-20260501-000010', productId: 1, warehouseId: 2, movementType: 'STOCK_IN', direction: 'IN', quantity: 10, unitCost: 1, totalValue: 10, balanceAfter: 100, isReversal: false });
  });

  it('should call reverse movement API', () => {
    service.reverseMovement(10, { reasonCode: 'MANUAL_CORRECTION', notes: 'Incorrect receipt' }).subscribe();

    const request = httpMock.expectOne('http://localhost:8080/api/v1/movements/10/reverse');
    expect(request.request.method).toBe('POST');
    request.flush({ movementId: 11, movementNumber: 'MOV-20260501-000011', productId: 1, warehouseId: 2, movementType: 'REVERSAL', direction: 'OUT', quantity: 10, unitCost: 1, totalValue: 10, balanceAfter: 90, isReversal: true });
  });

  it('should call summary API', () => {
    service.getMovementSummary('2026-05-01', '2026-05-02').subscribe();

    const request = httpMock.expectOne((req) => req.method === 'GET' && req.url === 'http://localhost:8080/api/v1/movements/summary');
    expect(request.request.params.get('fromDate')).toBe('2026-05-01');
    request.flush({ totalMovements: 1 });
  });

  it('should call analytics API', () => {
    service.getMovementAnalytics('2026-05-01', '2026-05-02').subscribe();

    const request = httpMock.expectOne((req) => req.method === 'GET' && req.url === 'http://localhost:8080/api/v1/movements/analytics');
    request.flush({ movementCountByType: {}, movementCountByWarehouse: {}, movementCountByProduct: {}, dailyMovementTrend: {}, topMovedProducts: [], highestValueMovements: [], adjustmentTrend: [], writeOffTrend: [] });
  });

  it('should call export API', () => {
    service.exportCsv({ keyword: 'MOV' }).subscribe();

    const request = httpMock.expectOne((req) => req.method === 'GET' && req.url === 'http://localhost:8080/api/v1/movements/export/csv');
    expect(request.request.responseType).toBe('blob');
    request.flush(new Blob(['csv']));
  });
});
