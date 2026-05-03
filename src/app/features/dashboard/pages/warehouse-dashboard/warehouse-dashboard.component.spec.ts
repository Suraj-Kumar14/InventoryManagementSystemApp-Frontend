import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TestBed, getTestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { of, throwError } from 'rxjs';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { WarehouseStaffDashboardApiService } from '../../services/warehouse-staff-dashboard-api.service';
import { WarehouseDashboardComponent } from './warehouse-dashboard.component';

getTestBed().initTestEnvironment(BrowserDynamicTestingModule, platformBrowserDynamicTesting());

describe('WarehouseDashboardComponent', () => {
  const dashboardApiStub = {
    refreshDashboard: vi.fn(),
    acknowledgeAlert: vi.fn(() => of({})),
    dismissAlert: vi.fn(() => of({})),
  };

  const notificationStub = {
    success: vi.fn(),
    warning: vi.fn(),
    error: vi.fn(),
  };

  const authServiceStub = {
    getCurrentUser: vi.fn(() => ({ name: 'Warehouse User', email: 'staff@test.com' })),
    getFirstName: vi.fn(() => 'Warehouse'),
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
    dashboardApiStub.refreshDashboard.mockReturnValue(
      of({
        overview: {
          assignedWarehouseId: 3,
          assignedWarehouseName: 'Central Warehouse',
          assignedWarehouseCode: 'CW-01',
          stockItemCount: 24,
          totalQuantity: 950,
          availableQuantity: 820,
          reservedQuantity: 130,
          lowStockCount: 3,
          outOfStockCount: 1,
          goodsReceiptsPending: 2,
          partiallyReceivedOrders: 1,
          overdueReceipts: 0,
          stockMovementsToday: 8,
          stockInToday: 5,
          stockOutToday: 3,
          transfersPending: null,
          incomingTransfersPending: null,
          outgoingTransfersPending: null,
          cycleCountsPending: null,
          adjustmentsToday: 1,
          writeOffsToday: 0,
          unreadAlerts: 2,
          criticalAlerts: 1,
        },
        kpis: [
          { title: 'Stock Items', value: 24, subtitle: 'Tracked in assigned warehouse', icon: 'bi bi-box-seam', route: '/inventory/stock' },
          { title: 'Available Quantity', value: 820, subtitle: 'Ready to pick or issue', icon: 'bi bi-check2-square', route: '/inventory/stock' },
        ],
        assignedStockItems: [
          { productId: 11, sku: 'SKU-11', productName: 'Cables', availableQuantity: 3, reservedQuantity: 1, reorderLevel: 10, stockStatus: 'CRITICAL', route: '/products/11' },
        ],
        pendingReceipts: [
          { purchaseOrderId: 21, poNumber: 'PO-21', supplierName: 'Alpha', expectedDeliveryDate: '2026-05-03', status: 'APPROVED', totalItems: 1, route: '/purchase-orders/21/receive' },
        ],
        pendingTransfers: [
          { transferId: 31, transferNumber: 'TR-31', sourceWarehouseName: 'Overflow', destinationWarehouseName: 'Central Warehouse', status: 'Recent activity', productName: 'Cables', quantity: 5, route: '/movements/31' },
        ],
        recentMovements: [
          { movementId: 41, movementNumber: 'MOV-41', productName: 'Cables', warehouseName: 'Central Warehouse', movementType: 'TRANSFER IN', quantity: 5, movementDate: '2026-05-02T09:00:00Z', route: '/movements/41' },
        ],
        recentAlerts: [
          { alertId: 51, title: 'Low stock on cables', severity: 'CRITICAL', type: 'LOW_STOCK', createdAt: '2026-05-02T08:00:00Z', route: '/alerts/51', isAcknowledged: false, isDismissed: false },
        ],
        sectionErrors: {},
        sectionNotices: { transfers: 'Dedicated pending transfer task API is not available yet. Showing recent transfer activity instead.' },
        loadedAt: new Date().toISOString(),
      })
    );

    await TestBed.configureTestingModule({
      imports: [WarehouseDashboardComponent],
      providers: [
        { provide: WarehouseStaffDashboardApiService, useValue: dashboardApiStub },
        { provide: NotificationService, useValue: notificationStub },
        { provide: AuthService, useValue: authServiceStub },
        { provide: Router, useValue: routerStub },
        { provide: ActivatedRoute, useValue: activatedRouteStub },
      ],
    }).compileComponents();
  });

  it('should load dashboard for WAREHOUSE_STAFF and show assigned warehouse with KPI cards', () => {
    const fixture = TestBed.createComponent(WarehouseDashboardComponent);
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent;

    expect(text).toContain('Welcome back, Warehouse');
    expect(text).toContain('Central Warehouse');
    expect(text.match(/Stock Items/g)?.length).toBe(1);
    expect(text).toContain('Receive Goods');
  });

  it('should not show admin-only widgets, PO creation, financial cards, or movement reversal actions', () => {
    const fixture = TestBed.createComponent(WarehouseDashboardComponent);
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent;

    expect(text).not.toContain('Manage Users');
    expect(text).not.toContain('Broadcast Alert');
    expect(text).not.toContain('Create Purchase Order');
    expect(text).not.toContain('Inventory Value');
    expect(text).not.toContain('Reverse');
  });

  it('should show partial error content when one section fails', () => {
    dashboardApiStub.refreshDashboard.mockReturnValueOnce(
      of({
        overview: null,
        kpis: [],
        assignedStockItems: [],
        pendingReceipts: [],
        pendingTransfers: [],
        recentMovements: [],
        recentAlerts: [],
        sectionErrors: { receipts: 'Unable to load pending receipts' },
        sectionNotices: {},
        loadedAt: new Date().toISOString(),
      })
    );

    const fixture = TestBed.createComponent(WarehouseDashboardComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Unable to load pending receipts');
  });

  it('should handle refresh failure gracefully', () => {
    dashboardApiStub.refreshDashboard.mockReturnValueOnce(throwError(() => new Error('failed')));

    const fixture = TestBed.createComponent(WarehouseDashboardComponent);
    fixture.detectChanges();

    expect(notificationStub.error).toHaveBeenCalledWith('Unable to load dashboard summary');
  });
});
