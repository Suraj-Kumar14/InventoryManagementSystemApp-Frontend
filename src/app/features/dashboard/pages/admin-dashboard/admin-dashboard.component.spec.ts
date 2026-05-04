import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { UserRole } from '../../../../shared/config/app-config';
import { AdminDashboardApiService } from '../../services/admin-dashboard-api.service';
import { AdminDashboardComponent } from './admin-dashboard.component';

describe('AdminDashboardComponent', () => {
  const dashboardApiStub = {
    refreshDashboard: vi.fn(),
    getDefaultActivityMessage: vi.fn(() => 'Recent activity helper'),
  };

  const notificationStub = {
    success: vi.fn(),
    warning: vi.fn(),
    error: vi.fn(),
  };

  const authServiceStub = {
    getCurrentUser: vi.fn(() => ({ name: 'Admin User', email: 'admin@test.com' })),
    getFirstName: vi.fn(() => 'Admin'),
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
      executive: {
        totalProducts: 40,
        totalWarehouses: 3,
        totalInventoryValue: 120000,
        lowStockCount: 5,
        overstockCount: 1,
        pendingPurchaseApprovals: 2,
        overduePurchaseOrders: 1,
        totalPurchaseValue: 45000,
        totalPaidAmount: 25000,
        criticalAlerts: 2,
        stockMovementToday: 8,
        topMovingProducts: [],
        recentAlerts: [],
        valuationTrend: [],
        purchaseTrend: [],
        unavailableSections: [],
      },
      alertSummary: null,
      unreadAlertCount: 3,
      userSummary: {
        totalUsers: 4,
        activeUsers: 3,
        inactiveUsers: 1,
        usersByRole: {
          [UserRole.ADMIN]: 1,
          [UserRole.INVENTORY_MANAGER]: 1,
          [UserRole.PURCHASE_OFFICER]: 1,
          [UserRole.WAREHOUSE_STAFF]: 1,
        },
      },
      paymentSummary: {
        totalPayments: 5,
        paidCount: 4,
        pendingCount: 1,
        cancelledCount: 0,
        totalPaidAmount: 25000,
        pendingAmount: 8000,
        supplierPayments: [],
      },
      movementSummary: {
        totalMovements: 8,
        totalStockInQuantity: 10,
        totalStockOutQuantity: 5,
        totalTransferQuantity: 2,
        totalAdjustmentQuantity: 0,
        totalWriteOffQuantity: 0,
        totalReturnQuantity: 0,
        totalMovementValue: 0,
        movementsToday: 8,
        movementsThisMonth: 50,
      },
      recentAlerts: [],
      recentActivities: [],
      serviceHealth: [],
      serviceHealthConfigured: false,
      sectionErrors: {},
      generatedAt: new Date().toISOString(),
    }));

    await TestBed.configureTestingModule({
      imports: [AdminDashboardComponent],
      providers: [
        { provide: AdminDashboardApiService, useValue: dashboardApiStub },
        { provide: NotificationService, useValue: notificationStub },
        { provide: AuthService, useValue: authServiceStub },
        { provide: Router, useValue: routerStub },
        { provide: ActivatedRoute, useValue: activatedRouteStub },
      ],
    }).compileComponents();
  });

  it('should load dashboard for ADMIN and render KPI cards without duplicates', () => {
    const fixture = TestBed.createComponent(AdminDashboardComponent);
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent;

    expect(text).toContain('Welcome back, Admin');
    expect(text).toContain('Executive KPIs');
    expect(text).toContain('Total Products');
    expect(text.match(/Total Products/g)?.length).toBe(1);
  });

  it('should show partial error state when one API fails', () => {
    dashboardApiStub.refreshDashboard.mockReturnValueOnce(of({
      executive: null,
      alertSummary: null,
      unreadAlertCount: null,
      userSummary: null,
      paymentSummary: null,
      movementSummary: null,
      recentAlerts: [],
      recentActivities: [],
      serviceHealth: [],
      serviceHealthConfigured: false,
      sectionErrors: { executive: 'Unable to load dashboard summary' },
      generatedAt: new Date().toISOString(),
    }));

    const fixture = TestBed.createComponent(AdminDashboardComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Unable to load dashboard summary');
  });

  it('should handle refresh failure gracefully', () => {
    dashboardApiStub.refreshDashboard.mockReturnValueOnce(throwError(() => new Error('failed')));
    const fixture = TestBed.createComponent(AdminDashboardComponent);
    fixture.detectChanges();

    expect(notificationStub.error).toHaveBeenCalledWith('Unable to load dashboard summary');
  });
});
