import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ApiService } from '../http/api.service';
import { ReportService } from './report.service';

describe('ReportService', () => {
  let service: ReportService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ReportService, ApiService, provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(ReportService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should call inventory valuation API', () => {
    service.getInventoryValuation({ period: 'LAST_30_DAYS' }).subscribe();

    const request = httpMock.expectOne('http://localhost:8080/api/v1/reports/inventory/valuation?period=LAST_30_DAYS');
    expect(request.request.method).toBe('GET');
    request.flush({
      totalInventoryValue: 1000,
      totalQuantity: 10,
      totalProducts: 2,
      totalWarehouses: 1,
      valuationByWarehouse: [],
      valuationByCategory: {},
      valuationByProduct: [],
    });
  });

  it('should call snapshot run API', () => {
    service.runInventorySnapshot().subscribe();

    const request = httpMock.expectOne('http://localhost:8080/api/v1/reports/snapshots/run');
    expect(request.request.method).toBe('POST');
    request.flush({});
  });
});
