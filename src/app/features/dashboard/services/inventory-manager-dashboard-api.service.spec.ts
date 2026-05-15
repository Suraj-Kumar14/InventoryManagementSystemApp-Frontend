import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of, throwError } from 'rxjs';
import { ApiService } from '../../../core/http/api.service';
import { PurchaseService } from '../../../core/services/purchase.service';
import { ReportService } from '../../../core/services/report.service';
import { WarehouseService } from '../../../core/services/warehouse.service';
import { AlertApiService } from '../../alerts/services/alert-api.service';
import { MovementApiService } from '../../movements/services/movement-api.service';
import { ProductApiService } from '../../products/services/product-api.service';
import { InventoryManagerDashboardApiService } from './inventory-manager-dashboard-api.service';

describe('InventoryManagerDashboardApiService', () => {
  let service: InventoryManagerDashboardApiService;

  const reportServiceStub = {
    getMyDashboard: vi.fn(),
    getStockSummary: vi.fn(),
  };

  const apiServiceStub = {
    get: vi.fn(),
  };

  const productApiServiceStub = {
    getProductSummary: vi.fn(),
    getProducts: vi.fn(),
  };

  const warehouseServiceStub = {
    getWarehouseSummary: vi.fn(),
    getWarehouseCount: vi.fn(),
    getStockSummary: vi.fn(),
    getWarehouses: vi.fn(),
  };

  const purchaseServiceStub = {
    getPurchaseOrdersByStatus: vi.fn(),
    getOverduePurchaseOrders: vi.fn(),
  };

  const movementApiServiceStub = {
    getMovementSummary: vi.fn(),
    getMovementAnalytics: vi.fn(),
    getMovements: vi.fn(),
  };

  const alertApiServiceStub = {
    getMyAlertSummary: vi.fn(),
    getMyAlerts: vi.fn(),
    acknowledgeAlert: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [
        InventoryManagerDashboardApiService,
        { provide: ApiService, useValue: apiServiceStub },
        { provide: ReportService, useValue: reportServiceStub },
        { provide: ProductApiService, useValue: productApiServiceStub },
        { provide: WarehouseService, useValue: warehouseServiceStub },
        { provide: PurchaseService, useValue: purchaseServiceStub },
        { provide: MovementApiService, useValue: movementApiServiceStub },
        { provide: AlertApiService, useValue: alertApiServiceStub },
      ],
    });

    service = TestBed.inject(InventoryManagerDashboardApiService);
  });

  function seedHappyPath() {
    reportServiceStub.getMyDashboard.mockReturnValue(of({
      totalProducts: 0,
      totalWarehouses: 3,
      totalInventoryValue: 250000,
      lowStockCount: 4,
      overstockCount: 2,
      pendingPurchaseApprovals: 3,
      overduePurchaseOrders: 1,
      totalPurchaseValue: 100000,
      totalPaidAmount: 0,
      criticalAlerts: 2,
      stockMovementToday: 9,
      topMovingProducts: [],
      recentAlerts: [],
      valuationTrend: [],
      purchaseTrend: [],
      unavailableSections: [],
    }));
    apiServiceStub.get.mockReturnValue(of({
      totalInventoryValue: 250000,
      totalQuantity: 1200,
      totalProducts: 50,
      totalWarehouses: 3,
      valuationByWarehouse: [],
      valuationByCategory: { Electronics: 120000, Grocery: 80000 },
      valuationByProduct: [],
    }));
    reportServiceStub.getStockSummary.mockReturnValue(of({
      totalProducts: 50,
      totalWarehouses: 3,
      totalStockQuantity: 1200,
      totalReservedQuantity: 120,
      totalAvailableQuantity: 1080,
      lowStockCount: 4,
      overstockCount: 2,
      outOfStockCount: 1,
    }));
    productApiServiceStub.getProductSummary.mockReturnValue(of({
      totalProducts: 50,
      activeProducts: 45,
      inactiveProducts: 5,
      categoriesCount: 6,
      brandsCount: 7,
    }));
    productApiServiceStub.getProducts.mockReturnValue(of({
      content: [
        { productId: 1, sku: 'SKU1', name: 'Item 1', category: 'Electronics', unitOfMeasure: 'EA', costPrice: 1, sellingPrice: 2, reorderLevel: 1, maxStockLevel: 10, leadTimeDays: 2, isActive: true, updatedAt: '2026-05-01T10:00:00Z' },
      ],
      totalElements: 1,
      totalPages: 1,
      number: 0,
      size: 5,
      numberOfElements: 1,
      first: true,
      last: true,
      empty: false,
    }));
    warehouseServiceStub.getWarehouseSummary.mockReturnValue(of({
      totalWarehouses: 3,
      activeWarehouses: 3,
      inactiveWarehouses: 0,
      totalCapacity: 1000,
      usedCapacity: 700,
      availableCapacity: 300,
      averageUtilizationPercentage: 70,
    }));
    warehouseServiceStub.getWarehouseCount.mockReturnValue(of(3));
    warehouseServiceStub.getStockSummary.mockReturnValue(of({
      totalStockItems: 30,
      totalQuantity: 1200,
      totalReservedQuantity: 120,
      totalAvailableQuantity: 1080,
      lowStockItemsCount: 4,
      overstockItemsCount: 2,
    }));
    warehouseServiceStub.getWarehouses.mockReturnValue(of([
      { warehouseId: 1, name: 'Main', code: 'M1', location: 'A', capacity: 500, usedCapacity: 350, availableCapacity: 150, utilizationPercentage: 70, isActive: true },
      { warehouseId: 2, name: 'Secondary', code: 'S1', location: 'B', capacity: 500, usedCapacity: 300, availableCapacity: 200, utilizationPercentage: 60, isActive: true },
    ]));
    purchaseServiceStub.getPurchaseOrdersByStatus.mockImplementation((status: string) => {
      if (status === 'PENDING_APPROVAL') {
        return of([{ poId: 1, supplierId: 1, warehouseId: 1, createdById: 1, status: 'PENDING_APPROVAL', totalAmount: 1000, lineItems: [] }]);
      }
      return of([{ poId: 2, supplierId: 1, warehouseId: 1, createdById: 1, status: 'APPROVED', totalAmount: 1000, lineItems: [] }]);
    });
    purchaseServiceStub.getOverduePurchaseOrders.mockReturnValue(of([
      { poId: 3, supplierId: 1, warehouseId: 1, createdById: 1, status: 'APPROVED', totalAmount: 1000, lineItems: [] },
    ]));
    movementApiServiceStub.getMovementSummary.mockReturnValue(of({
      totalMovements: 9,
      totalStockInQuantity: 4,
      totalStockOutQuantity: 2,
      totalTransferQuantity: 1,
      totalAdjustmentQuantity: 1,
      totalWriteOffQuantity: 1,
      totalReturnQuantity: 0,
      totalMovementValue: 5000,
      movementsToday: 9,
      movementsThisMonth: 90,
    }));
    movementApiServiceStub.getMovementAnalytics.mockReturnValue(of({
      movementCountByType: { ADJUSTMENT: 2, WRITE_OFF: 1 },
      movementCountByWarehouse: {},
      movementCountByProduct: {},
      dailyMovementTrend: {},
      topMovedProducts: [],
      highestValueMovements: [],
      adjustmentTrend: [],
      writeOffTrend: [],
    }));
    movementApiServiceStub.getMovements.mockReturnValue(of({
      content: [
        { movementId: 11, movementNumber: 'MV-11', productId: 1, productName: 'Item 1', warehouseId: 1, warehouseName: 'Main', movementType: 'TRANSFER_OUT', direction: 'OUT', quantity: 3, totalValue: 100, isReversal: false, balanceAfter: 12, movementDate: '2026-05-01T09:00:00Z' },
      ],
      totalElements: 1,
      totalPages: 1,
      number: 0,
      size: 6,
      numberOfElements: 1,
      first: true,
      last: true,
      empty: false,
    }));
    alertApiServiceStub.getMyAlertSummary.mockReturnValue(of({
      totalAlerts: 10,
      unreadCount: 4,
      acknowledgedCount: 2,
      dismissedCount: 0,
      criticalCount: 2,
      warningCount: 2,
      infoCount: 6,
      lowStockCount: 3,
      overstockCount: 1,
      pendingPoApprovalCount: 1,
      overduePoCount: 1,
    }));
    alertApiServiceStub.getMyAlerts.mockReturnValue(of({
      content: [
        { alertId: 91, alertNumber: 'ALT-91', type: 'LOW_STOCK', severity: 'CRITICAL', status: 'OPEN', channel: 'IN_APP', title: 'Low stock', message: 'Item low', isRead: false, isAcknowledged: false, isDismissed: false, createdAt: '2026-05-01T08:00:00Z' },
      ],
      totalElements: 1,
      totalPages: 1,
      number: 0,
      size: 5,
      numberOfElements: 1,
      first: true,
      last: true,
      empty: false,
    }));
  }

  it('should aggregate inventory manager dashboard data', async () => {
    seedHappyPath();

    const view = await firstValueFrom(service.refreshDashboard());

    expect(view.overview?.totalProducts).toBe(50);
    expect(view.overview?.activeProducts).toBe(45);
    expect(view.overview?.totalWarehouses).toBe(3);
    expect(view.overview?.pendingPurchaseApprovals).toBe(3);
    expect(view.recentMovements[0]?.movementNumber).toBe('MV-11');
    expect(view.sectionErrors).toEqual({});
  });

  it('should return partial dashboard state when one API fails', async () => {
    seedHappyPath();
    reportServiceStub.getStockSummary.mockReturnValueOnce(throwError(() => new Error('boom')));

    const view = await firstValueFrom(service.refreshDashboard());

    expect(view.sectionErrors.stock).toBe('Unable to load stock health');
    expect(view.productSummary?.totalProducts).toBe(50);
  });
});
