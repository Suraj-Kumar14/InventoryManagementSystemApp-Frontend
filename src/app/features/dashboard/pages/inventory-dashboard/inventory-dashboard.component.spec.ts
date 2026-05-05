import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { InventoryManagerDashboardApiService } from '../../services/inventory-manager-dashboard-api.service';
import { InventoryDashboardComponent } from './inventory-dashboard.component';

describe('InventoryDashboardComponent', () => {
  const dashboardApiStub = {
    refreshDashboard: vi.fn(),
    acknowledgeAlert: vi.fn(),
  };

  const notificationStub = {
    success: vi.fn(),
    warning: vi.fn(),
    error: vi.fn(),
  };

  const authServiceStub = {
    getCurrentUser: vi.fn(() => ({ name: 'Manager User', email: 'manager@test.com' })),
    getFirstName: vi.fn(() => 'Manager'),
  };

  const routerStub = {
    navigate: vi.fn(() => Promise.resolve(true)),
  };

  const activatedRouteStub = {
    root: {} as ActivatedRoute,
    snapshot: {},
    params: of({}),
    queryParams: of({}),
    fragment: of(null),
    data: of({}),
    outlet: 'primary',
    component: null,
    routeConfig: null,
  };

  activatedRouteStub.root = activatedRouteStub as unknown as ActivatedRoute;

  beforeEach(async () => {
    vi.clearAllMocks();
    dashboardApiStub.refreshDashboard.mockReturnValue(of({
      roleDashboard: {
        totalProducts: 50,
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
      },
      overview: {
        totalProducts: 50,
        activeProducts: 45,
        inactiveProducts: 5,
        totalWarehouses: 3,
        totalInventoryValue: 250000,
        totalStockQuantity: 1200,
        reservedQuantity: 120,
        availableQuantity: 1080,
        lowStockCount: 4,
        overstockCount: 2,
        outOfStockCount: 1,
        pendingPurchaseApprovals: 3,
        overduePurchaseOrders: 1,
        approvedAwaitingReceipt: 1,
        stockMovementToday: 9,
        adjustmentCountToday: 2,
        writeOffCountToday: 1,
        unreadAlerts: 4,
        criticalAlerts: 2,
      },
      productSummary: { totalProducts: 50, activeProducts: 45, inactiveProducts: 5, categoriesCount: 6, brandsCount: 7 },
      inventorySummary: { totalInventoryValue: 250000, totalStockQuantity: 1200, reservedQuantity: 120, availableQuantity: 1080, lowStockCount: 4, overstockCount: 2, outOfStockCount: 1 },
      warehouseSummary: { totalWarehouses: 3, activeWarehouses: 3, inactiveWarehouses: 0, totalCapacity: 1000, usedCapacity: 700, availableCapacity: 300, averageUtilizationPercentage: 70 },
      stockSummary: { totalStockItems: 30, totalQuantity: 1200, totalReservedQuantity: 120, totalAvailableQuantity: 1080, lowStockItemsCount: 4, overstockItemsCount: 2 },
      purchaseSummary: { pendingPurchaseApprovals: 3, overduePurchaseOrders: 1, approvedAwaitingReceipt: 1 },
      movementSummary: { totalMovements: 9, totalStockInQuantity: 4, totalStockOutQuantity: 2, totalTransferQuantity: 1, totalAdjustmentQuantity: 2, totalWriteOffQuantity: 1, totalReturnQuantity: 0, totalMovementValue: 5000, movementsToday: 9, movementsThisMonth: 90 },
      alertSummary: { totalAlerts: 10, unreadCount: 4, acknowledgedCount: 2, dismissedCount: 0, criticalCount: 2, warningCount: 2, infoCount: 6, lowStockCount: 3, overstockCount: 1, pendingPoApprovalCount: 3, overduePoCount: 1 },
      recentAlerts: [
        { alertId: 91, alertNumber: 'ALT-91', type: 'LOW_STOCK', severity: 'CRITICAL', status: 'OPEN', channel: 'IN_APP', title: 'Low stock', message: 'Item low', isRead: false, isAcknowledged: false, isDismissed: false, createdAt: '2026-05-01T08:00:00Z' },
      ],
      recentMovements: [
        { movementId: 11, movementNumber: 'MV-11', productName: 'Item 1', warehouseName: 'Main', movementType: 'TRANSFER OUT', quantity: 3, movementDate: '2026-05-01T09:00:00Z', route: '/movements/11' },
      ],
      recentProducts: [],
      warehouseUtilization: [
        { warehouseId: 1, warehouseName: 'Main', capacity: 500, usedCapacity: 350, utilizationPercent: 70, route: '/movements/warehouse/1' },
      ],
      productCategorySummary: [
        { category: 'Electronics', productCount: 12, stockValue: 120000 },
      ],
      sectionErrors: {},
      generatedAt: new Date().toISOString(),
    }));

    await TestBed.configureTestingModule({
      imports: [InventoryDashboardComponent],
      providers: [
        { provide: InventoryManagerDashboardApiService, useValue: dashboardApiStub },
        { provide: NotificationService, useValue: notificationStub },
        { provide: AuthService, useValue: authServiceStub },
        { provide: Router, useValue: routerStub },
        { provide: ActivatedRoute, useValue: activatedRouteStub },
      ],
    }).compileComponents();
  });

  it('should load dashboard for INVENTORY_MANAGER and show KPI cards without duplicates', () => {
    const fixture = TestBed.createComponent(InventoryDashboardComponent);
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent;

    expect(text).toContain('Welcome back, Manager');
    expect(text).toContain('Operational snapshot');
    expect(text.match(/Total Products/g)?.length).toBe(1);
    expect(text).toContain('Manage Products');
    expect(text).toContain('Barcode Lookup');
    expect(text).not.toContain('Item 1');
  });

  it('should not show admin-only widgets or purchase-officer-only create PO form', () => {
    const fixture = TestBed.createComponent(InventoryDashboardComponent);
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent;

    expect(text).not.toContain('Manage Users');
    expect(text).not.toContain('Broadcast Alert');
    expect(text).not.toContain('Create PO');
  });

  it('should show partial error state when one API fails', () => {
    dashboardApiStub.refreshDashboard.mockReturnValueOnce(of({
      roleDashboard: null,
      overview: null,
      productSummary: null,
      inventorySummary: null,
      warehouseSummary: null,
      stockSummary: null,
      purchaseSummary: null,
      movementSummary: null,
      alertSummary: null,
      recentAlerts: [],
      recentMovements: [],
      recentProducts: [],
      warehouseUtilization: [],
      productCategorySummary: [],
      sectionErrors: { stock: 'Unable to load stock health' },
      generatedAt: new Date().toISOString(),
    }));

    const fixture = TestBed.createComponent(InventoryDashboardComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Unable to load stock health');
  });

  it('should handle refresh failure gracefully', () => {
    dashboardApiStub.refreshDashboard.mockReturnValueOnce(throwError(() => new Error('failed')));

    const fixture = TestBed.createComponent(InventoryDashboardComponent);
    fixture.detectChanges();

    expect(notificationStub.error).toHaveBeenCalledWith('Unable to load dashboard summary');
  });
});
