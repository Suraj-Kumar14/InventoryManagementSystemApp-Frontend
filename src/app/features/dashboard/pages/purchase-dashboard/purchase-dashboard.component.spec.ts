import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { PurchaseOfficerDashboardApiService } from '../../services/purchase-officer-dashboard-api.service';
import { PurchaseDashboardComponent } from './purchase-dashboard.component';

describe('PurchaseDashboardComponent', () => {
  const dashboardApiStub = {
    refreshDashboard: vi.fn(),
  };

  const notificationStub = {
    success: vi.fn(),
    warning: vi.fn(),
    error: vi.fn(),
  };

  const authServiceStub = {
    getCurrentUser: vi.fn(() => ({ name: 'Officer User', email: 'officer@test.com' })),
    getFirstName: vi.fn(() => 'Officer'),
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
        lowStockCount: 6,
        overstockCount: 2,
        pendingPurchaseApprovals: 4,
        overduePurchaseOrders: 2,
        totalPurchaseValue: 850000,
        totalPaidAmount: 300000,
        criticalAlerts: 3,
        stockMovementToday: 12,
        topMovingProducts: [],
        recentAlerts: [],
        valuationTrend: [],
        purchaseTrend: [],
        unavailableSections: [],
      },
      overview: {
        totalPurchaseOrders: 14,
        draftPurchaseOrders: 2,
        pendingApprovalPurchaseOrders: 4,
        approvedPurchaseOrders: 3,
        approvedAwaitingReceiptPurchaseOrders: 3,
        receivedPurchaseOrders: 4,
        cancelledPurchaseOrders: 1,
        overduePurchaseOrders: 2,
        totalPurchaseValue: 850000,
        pendingPurchaseValue: 250000,
        activeSuppliers: 8,
        inactiveSuppliers: 2,
        averageSupplierRating: 4.2,
        averageSupplierLeadTime: 5,
        pendingPayments: 2,
        approvedPayments: 1,
        paidAmount: 300000,
        pendingPaymentAmount: 120000,
        unreadAlerts: 3,
        criticalAlerts: 2,
      },
      purchaseSummary: {
        totalPurchaseOrders: 14,
        pendingApprovalCount: 4,
        approvedCount: 3,
        receivedCount: 4,
        cancelledCount: 1,
        overdueCount: 2,
        totalPurchaseValue: 850000,
        receivedPurchaseValue: 400000,
        pendingPurchaseValue: 250000,
      },
      recentPurchaseOrders: [
        { purchaseOrderId: 11, poNumber: 'PO-11', supplierName: 'Alpha', warehouseName: 'Main', status: 'PENDING APPROVAL', totalAmount: 1000, expectedDeliveryDate: '2026-05-06', createdAt: '2026-05-01T09:00:00Z', route: '/purchase-orders/11' },
      ],
      supplierSummary: {
        totalSuppliers: 10,
        activeSuppliers: 8,
        inactiveSuppliers: 2,
        blacklistedSuppliers: 0,
        pendingReviewSuppliers: 0,
        averageRating: 4.2,
        averageLeadTimeDays: 5,
      },
      topRatedSuppliers: [
        { supplierId: 1, supplierName: 'Alpha', rating: 4.8, leadTimeDays: 4, status: 'Active', totalOrders: 12, totalSpend: 0, route: '/suppliers/1' },
      ],
      lowRatedSuppliers: [],
      supplierPerformance: [],
      procurementAttentionItems: [
        { productId: 55, sku: 'SKU-55', productName: 'Cable', warehouseId: 1, warehouseName: 'Main', availableQuantity: 3, reorderLevel: 10, shortageQuantity: 7, preferredSupplierId: null, preferredSupplierName: null, route: '/products/55' },
      ],
      paymentSummary: {
        totalPayments: 5,
        draftCount: 0,
        pendingApprovalCount: 2,
        approvedCount: 1,
        partiallyPaidCount: 1,
        paidCount: 1,
        cancelledCount: 0,
        rejectedCount: 0,
        reversedCount: 0,
        totalPaidAmount: 300000,
        pendingPaymentAmount: 120000,
        remainingPaymentAmount: 50000,
      },
      paymentReportSummary: {
        totalPayments: 5,
        paidCount: 1,
        pendingCount: 2,
        cancelledCount: 0,
        totalPaidAmount: 300000,
        pendingAmount: 120000,
        supplierPayments: [],
      },
      recentPayments: [
        { paymentId: 21, paymentNumber: 'PAY-21', poNumber: 'PO-13', supplierName: 'Gamma', status: 'PENDING APPROVAL', amount: 5000, paymentDate: '2026-05-01T13:00:00Z', route: '/payments/21' },
      ],
      recentAlerts: [
        { alertId: 71, title: 'Supplier delay', severity: 'CRITICAL', type: 'OVERDUE PO', createdAt: '2026-05-01T08:00:00Z', route: '/alerts/71' },
      ],
      alertSummary: {
        totalAlerts: 8,
        unreadCount: 3,
        acknowledgedCount: 1,
        dismissedCount: 0,
        criticalCount: 2,
        warningCount: 3,
        infoCount: 3,
        lowStockCount: 2,
        overstockCount: 0,
        pendingPoApprovalCount: 1,
        overduePoCount: 1,
      },
      paymentSectionEnabled: true,
      sectionErrors: {},
      generatedAt: new Date().toISOString(),
    }));

    await TestBed.configureTestingModule({
      imports: [PurchaseDashboardComponent],
      providers: [
        { provide: PurchaseOfficerDashboardApiService, useValue: dashboardApiStub },
        { provide: NotificationService, useValue: notificationStub },
        { provide: AuthService, useValue: authServiceStub },
        { provide: Router, useValue: routerStub },
        { provide: ActivatedRoute, useValue: activatedRouteStub },
      ],
    }).compileComponents();
  });

  it('should load dashboard for PURCHASE_OFFICER and show KPI cards without duplicates', () => {
    const fixture = TestBed.createComponent(PurchaseDashboardComponent);
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent;

    expect(text).toContain('Welcome back, Officer');
    expect(text).toContain('Procurement snapshot');
    expect(text.match(/Total Purchase Orders/g)?.length).toBe(1);
  });

  it('should not show admin-only widgets or warehouse-staff stock operation forms', () => {
    const fixture = TestBed.createComponent(PurchaseDashboardComponent);
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent;

    expect(text).not.toContain('Manage Users');
    expect(text).not.toContain('Broadcast Alert');
    expect(text).not.toContain('Receive Stock');
    expect(text).not.toContain('Issue Stock');
    expect(text).not.toContain('Movement Reversal');
  });

  it('should show partial error state when one API section fails', () => {
    dashboardApiStub.refreshDashboard.mockReturnValueOnce(of({
      roleDashboard: null,
      overview: null,
      purchaseSummary: null,
      recentPurchaseOrders: [],
      supplierSummary: null,
      topRatedSuppliers: [],
      lowRatedSuppliers: [],
      supplierPerformance: [],
      procurementAttentionItems: [],
      paymentSummary: null,
      paymentReportSummary: null,
      recentPayments: [],
      recentAlerts: [],
      alertSummary: null,
      paymentSectionEnabled: false,
      sectionErrors: { purchase: 'Unable to load purchase summary' },
      generatedAt: new Date().toISOString(),
    }));

    const fixture = TestBed.createComponent(PurchaseDashboardComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Unable to load purchase summary');
  });

  it('should handle refresh failure gracefully', () => {
    dashboardApiStub.refreshDashboard.mockReturnValueOnce(throwError(() => new Error('failed')));

    const fixture = TestBed.createComponent(PurchaseDashboardComponent);
    fixture.detectChanges();

    expect(notificationStub.error).toHaveBeenCalledWith('Unable to load dashboard summary');
  });
});
