import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TestBed, getTestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { AuthService } from '../../../core/auth/services/auth.service';
import { ApiService } from '../../../core/http/api.service';
import { AlertApiService } from '../../alerts/services/alert-api.service';
import { WarehouseStaffDashboardApiService } from './warehouse-staff-dashboard-api.service';

getTestBed().initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());

describe('WarehouseStaffDashboardApiService', () => {
  let service: WarehouseStaffDashboardApiService;
  let httpMock: HttpTestingController;

  const authServiceStub = {
    getUserId: vi.fn(() => 7),
  };

  const alertApiStub = {
    acknowledgeAlert: vi.fn(),
    dismissAlert: vi.fn(),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        WarehouseStaffDashboardApiService,
        ApiService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authServiceStub },
        { provide: AlertApiService, useValue: alertApiStub },
      ],
    });

    service = TestBed.inject(WarehouseStaffDashboardApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should call stock summary APIs through API Gateway only', () => {
    service.getAssignedWarehouseStockSummary(7).subscribe();

    const summaryRequest = httpMock.expectOne(
      (req) => req.method === 'GET' && req.url === 'http://localhost:8080/api/v1/reports/inventory/stock-summary'
    );
    expect(summaryRequest.request.params.get('warehouseId')).toBe('7');
    summaryRequest.flush({
      totalProducts: 12,
      totalWarehouses: 1,
      totalStockQuantity: 250,
      totalReservedQuantity: 40,
      totalAvailableQuantity: 210,
      lowStockCount: 2,
      overstockCount: 0,
      outOfStockCount: 1,
    });

    const lowStockRequest = httpMock.expectOne(
      (req) => req.method === 'GET' && req.url === 'http://localhost:8080/api/v1/reports/inventory/low-stock'
    );
    expect(lowStockRequest.request.params.get('warehouseId')).toBe('7');
    lowStockRequest.flush({
      content: [
        {
          productId: 11,
          sku: 'SKU-11',
          productName: 'Cables',
          warehouseId: 7,
          warehouseName: 'Main',
          availableQuantity: 3,
          reorderLevel: 10,
          shortageQuantity: 7,
          severity: 'CRITICAL',
        },
      ],
      totalElements: 1,
      totalPages: 1,
      number: 0,
      size: 5,
      numberOfElements: 1,
      first: true,
      last: true,
      empty: false,
    });

    const stockPageRequest = httpMock.expectOne(
      (req) => req.method === 'GET' && req.url === 'http://localhost:8080/api/v1/stocks/warehouse/7'
    );
    stockPageRequest.flush({
      content: [
        {
          stockId: 1,
          warehouseId: 7,
          warehouseName: 'Main',
          productId: 11,
          productName: 'Cables',
          sku: 'SKU-11',
          quantity: 6,
          reservedQuantity: 1,
          availableQuantity: 5,
        },
      ],
      totalElements: 1,
      totalPages: 1,
      number: 0,
      size: 12,
      numberOfElements: 1,
      first: true,
      last: true,
      empty: false,
    });
  });

  it('should call pending receipt API through API Gateway only', () => {
    service.getPendingReceipts(3).subscribe();

    const request = httpMock.expectOne(
      (req) => req.method === 'GET' && req.url === 'http://localhost:8080/api/v1/purchase-orders/search'
    );

    expect(request.request.params.get('warehouseId')).toBe('3');
    request.flush({
      content: [
        {
          poId: 21,
          purchaseOrderId: 21,
          poNumber: 'PO-21',
          supplierId: 9,
          supplierName: 'Alpha',
          warehouseId: 3,
          warehouseName: 'South',
          createdById: 5,
          status: 'APPROVED',
          totalAmount: 1500,
          expectedDeliveryDate: '2026-05-03',
          isOverdue: false,
          lineItems: [{ lineItemId: 1, productId: 11, quantity: 5, unitCost: 10, totalCost: 50, receivedQty: 0 }],
        },
      ],
      totalElements: 1,
      totalPages: 1,
      number: 0,
      size: 50,
      numberOfElements: 1,
      first: true,
      last: true,
      empty: false,
    });
  });

  it('should call movement and alert APIs through API Gateway only', () => {
    service.getRecentMovements(4).subscribe();
    service.getWarehouseAlerts(4).subscribe();

    const recentMovements = httpMock.expectOne(
      (req) => req.method === 'GET' && req.url === 'http://localhost:8080/api/v1/movements/warehouse/4'
    );
    recentMovements.flush({
      content: [],
      totalElements: 0,
      totalPages: 0,
      number: 0,
      size: 6,
      numberOfElements: 0,
      first: true,
      last: true,
      empty: true,
    });

    const todayMovements = httpMock.expectOne(
      (req) => req.method === 'GET' && req.url === 'http://localhost:8080/api/v1/movements/search'
    );
    expect(todayMovements.request.params.get('warehouseId')).toBe('4');
    todayMovements.flush({
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

    const summaryRequest = httpMock.expectOne('http://localhost:8080/api/v1/alerts/summary/my');
    expect(summaryRequest.request.method).toBe('GET');
    summaryRequest.flush({
      totalAlerts: 3,
      unreadCount: 1,
      acknowledgedCount: 1,
      dismissedCount: 0,
      criticalCount: 1,
      warningCount: 1,
      infoCount: 1,
      lowStockCount: 1,
      overstockCount: 0,
      pendingPoApprovalCount: 0,
      overduePoCount: 0,
    });

    const alertsRequest = httpMock.expectOne(
      (req) => req.method === 'GET' && req.url === 'http://localhost:8080/api/v1/alerts/my'
    );
    alertsRequest.flush({
      content: [],
      totalElements: 0,
      totalPages: 0,
      number: 0,
      size: 10,
      numberOfElements: 0,
      first: true,
      last: true,
      empty: true,
    });
  });

  it('should call barcode lookup through API Gateway only', () => {
    service.getBarcodeLookup('BAR-101').subscribe();

    const request = httpMock.expectOne('http://localhost:8080/api/v1/products/barcode/BAR-101');
    expect(request.request.method).toBe('GET');
    request.flush({ productId: 4, barcode: 'BAR-101' });
  });
});
