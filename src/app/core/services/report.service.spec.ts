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

  it('should call total value API', () => {
    service.getTotalValue({ warehouseId: 11, toDate: '2026-05-13' }).subscribe();

    const request = httpMock.expectOne(
      'http://localhost:8080/api/v1/reports/totalValue?warehouseId=11&asOfDate=2026-05-13'
    );
    expect(request.request.method).toBe('GET');
    request.flush({
      asOfDate: '2026-05-13',
      totalInventoryValue: 1000,
      totalQuantity: 10,
      totalProducts: 2,
      totalWarehouses: 1,
      warehouseBreakdown: [],
      productBreakdown: [],
      warnings: [],
    });
  });

  it('should call consolidated generate report API', () => {
    service.generateInventoryReport({ period: 'LAST_30_DAYS', page: 0, size: 10 }, 5, 90).subscribe();

    const request = httpMock.expectOne(
      'http://localhost:8080/api/v1/reports/generateReport?page=0&size=10&period=LAST_30_DAYS&threshold=5&deadStockDays=90'
    );
    expect(request.request.method).toBe('GET');
    request.flush({
      valuation: {
        asOfDate: '2026-05-13',
        totalInventoryValue: 1000,
        totalQuantity: 10,
        totalProducts: 2,
        totalWarehouses: 1,
        warehouseBreakdown: [],
        productBreakdown: [],
        warnings: [],
      },
      stockValueByWarehouse: [],
      turnover: {
        from: '2026-05-01',
        to: '2026-05-13',
        cogs: 100,
        averageInventoryValue: 500,
        turnoverRate: 0.2,
        note: 'COGS is estimated from STOCK_OUT movements.',
        productTurnover: [],
      },
      lowStock: [],
      movementVelocity: [],
      topMovingProducts: [],
      slowMovingProducts: [],
      deadStock: [],
      poSummary: {
        from: '2026-05-01',
        to: '2026-05-13',
        totalPurchaseOrders: 1,
        totalSpend: 1000,
        statusBreakdown: {},
        supplierBreakdown: [],
        warehouseBreakdown: [],
        pendingApprovalCount: 0,
        approvedCount: 0,
        partiallyReceivedCount: 0,
        fullyReceivedCount: 0,
        overdueCount: 0,
        cancelledCount: 0,
        rejectedCount: 0,
      },
      warnings: [],
    });
  });
});
