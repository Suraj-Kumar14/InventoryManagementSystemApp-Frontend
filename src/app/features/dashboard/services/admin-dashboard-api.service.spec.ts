import { TestBed } from '@angular/core/testing';
import { of, throwError, firstValueFrom } from 'rxjs';
import { AdminUserService } from '../../../core/services/admin-user.service';
import { PaymentService } from '../../../core/services/payment.service';
import { PurchaseService } from '../../../core/services/purchase.service';
import { ReportService } from '../../../core/services/report.service';
import { WarehouseService } from '../../../core/services/warehouse.service';
import { UserRole } from '../../../shared/config/app-config';
import { AlertApiService } from '../../alerts/services/alert-api.service';
import { MovementApiService } from '../../movements/services/movement-api.service';
import { ProductApiService } from '../../products/services/product-api.service';
import { AdminDashboardApiService } from './admin-dashboard-api.service';

describe('AdminDashboardApiService', () => {
  let service: AdminDashboardApiService;

  const reportServiceStub = {
    getExecutiveDashboard: vi.fn(),
  };

  const alertApiServiceStub = {
    getSystemAlertSummary: vi.fn(),
    getUnreadCount: vi.fn(),
    searchAlerts: vi.fn(),
  };

  const authServiceStub = {
    getUsers: vi.fn(),
  };

  const movementApiServiceStub = {
    getMovementSummary: vi.fn(),
    getMovements: vi.fn(),
  };

  const purchaseServiceStub = {
    getPurchaseOrdersByStatus: vi.fn(),
  };

  const warehouseServiceStub = {
    getWarehouseCount: vi.fn(),
  };

  const productApiServiceStub = {
    getProductSummary: vi.fn(),
  };

  const paymentServiceStub = {
    getPaymentSummary: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [
        AdminDashboardApiService,
        { provide: ReportService, useValue: reportServiceStub },
        { provide: AlertApiService, useValue: alertApiServiceStub },
        { provide: AdminUserService, useValue: authServiceStub },
        { provide: MovementApiService, useValue: movementApiServiceStub },
        { provide: PurchaseService, useValue: purchaseServiceStub },
        { provide: WarehouseService, useValue: warehouseServiceStub },
        { provide: ProductApiService, useValue: productApiServiceStub },
        { provide: PaymentService, useValue: paymentServiceStub },
      ],
    });
    service = TestBed.inject(AdminDashboardApiService);
  });

  it('should aggregate executive dashboard data for ADMIN', async () => {
    reportServiceStub.getExecutiveDashboard.mockReturnValue(of({
      totalProducts: 100,
      totalWarehouses: 4,
      totalInventoryValue: 150000,
      lowStockCount: 8,
      overstockCount: 3,
      pendingPurchaseApprovals: 5,
      overduePurchaseOrders: 2,
      totalPurchaseValue: 78000,
      totalPaidAmount: 56000,
      criticalAlerts: 2,
      stockMovementToday: 12,
      topMovingProducts: [],
      recentAlerts: [],
      valuationTrend: [],
      purchaseTrend: [],
      unavailableSections: [],
    }));
    alertApiServiceStub.getSystemAlertSummary.mockReturnValue(of({
      totalAlerts: 20,
      unreadCount: 6,
      acknowledgedCount: 0,
      dismissedCount: 0,
      criticalCount: 2,
      warningCount: 4,
      infoCount: 14,
      lowStockCount: 8,
      overstockCount: 3,
      pendingPoApprovalCount: 5,
      overduePoCount: 2,
    }));
    alertApiServiceStub.getUnreadCount.mockReturnValue(of(6));
    alertApiServiceStub.searchAlerts.mockReturnValue(of({ content: [], totalElements: 0, totalPages: 0, number: 0, size: 5, numberOfElements: 0, first: true, last: true, empty: true }));
    authServiceStub.getUsers.mockReturnValue(of({
      content: [
        { userId: 1, name: 'Admin', email: 'admin@test.com', role: UserRole.ADMIN, isActive: true },
        { userId: 2, name: 'Manager', email: 'manager@test.com', role: UserRole.MANAGER, isActive: false },
      ],
      totalElements: 2,
      totalPages: 1,
      number: 0,
      size: 200,
      numberOfElements: 2,
      first: true,
      last: true,
      empty: false,
    }));
    warehouseServiceStub.getWarehouseCount.mockReturnValue(of(4));
    productApiServiceStub.getProductSummary.mockReturnValue(of({
      totalProducts: 101,
      activeProducts: 90,
      inactiveProducts: 11,
      categoriesCount: 4,
      brandsCount: 8,
    }));
    paymentServiceStub.getPaymentSummary.mockReturnValue(of({
      totalPayments: 5,
      paidCount: 4,
      pendingApprovalCount: 1,
      cancelledCount: 0,
      totalPaidAmount: 56000,
      pendingPaymentAmount: 12000,
    }));
    movementApiServiceStub.getMovementSummary.mockReturnValue(of({
      totalMovements: 12,
      totalStockInQuantity: 20,
      totalStockOutQuantity: 10,
      totalTransferQuantity: 2,
      totalAdjustmentQuantity: 0,
      totalWriteOffQuantity: 0,
      totalReturnQuantity: 0,
      totalMovementValue: 0,
      movementsToday: 12,
      movementsThisMonth: 100,
    }));
    movementApiServiceStub.getMovements.mockReturnValue(of({ content: [], totalElements: 0, totalPages: 0, number: 0, size: 4, numberOfElements: 0, first: true, last: true, empty: true }));
    purchaseServiceStub.getPurchaseOrdersByStatus.mockReturnValue(of([]));

    const view = await firstValueFrom(service.refreshDashboard());

    expect(view.executive?.totalProducts).toBe(101);
    expect(view.userSummary?.activeUsers).toBe(1);
    expect(view.userSummary?.inactiveUsers).toBe(1);
    expect(view.sectionErrors).toEqual({});
  });

  it('should return partial dashboard state when one API fails', async () => {
    reportServiceStub.getExecutiveDashboard.mockReturnValue(throwError(() => new Error('boom')));
    alertApiServiceStub.getSystemAlertSummary.mockReturnValue(of({
      totalAlerts: 1,
      unreadCount: 1,
      acknowledgedCount: 0,
      dismissedCount: 0,
      criticalCount: 1,
      warningCount: 0,
      infoCount: 0,
      lowStockCount: 0,
      overstockCount: 0,
      pendingPoApprovalCount: 0,
      overduePoCount: 0,
    }));
    alertApiServiceStub.getUnreadCount.mockReturnValue(of(1));
    alertApiServiceStub.searchAlerts.mockReturnValue(of({ content: [], totalElements: 0, totalPages: 0, number: 0, size: 5, numberOfElements: 0, first: true, last: true, empty: true }));
    authServiceStub.getUsers.mockReturnValue(of({ content: [], totalElements: 0, totalPages: 0, number: 0, size: 200, numberOfElements: 0, first: true, last: true, empty: true }));
    warehouseServiceStub.getWarehouseCount.mockReturnValue(of(0));
    productApiServiceStub.getProductSummary.mockReturnValue(of({ totalProducts: 0, activeProducts: 0, inactiveProducts: 0, categoriesCount: 0, brandsCount: 0 }));
    paymentServiceStub.getPaymentSummary.mockReturnValue(of({
      totalPayments: 0,
      paidCount: 0,
      pendingApprovalCount: 0,
      cancelledCount: 0,
      totalPaidAmount: 0,
      pendingPaymentAmount: 0,
    }));
    movementApiServiceStub.getMovementSummary.mockReturnValue(of({
      totalMovements: 0,
      totalStockInQuantity: 0,
      totalStockOutQuantity: 0,
      totalTransferQuantity: 0,
      totalAdjustmentQuantity: 0,
      totalWriteOffQuantity: 0,
      totalReturnQuantity: 0,
      totalMovementValue: 0,
      movementsToday: 0,
      movementsThisMonth: 0,
    }));
    movementApiServiceStub.getMovements.mockReturnValue(of({ content: [], totalElements: 0, totalPages: 0, number: 0, size: 4, numberOfElements: 0, first: true, last: true, empty: true }));
    purchaseServiceStub.getPurchaseOrdersByStatus.mockReturnValue(of([]));

    const view = await firstValueFrom(service.refreshDashboard());

    expect(view.executive).toBeNull();
    expect(view.sectionErrors.executive).toBe('Unable to load dashboard summary');
    expect(view.alertSummary?.criticalCount).toBe(1);
  });
});
