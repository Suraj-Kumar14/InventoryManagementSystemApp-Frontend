import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of, throwError } from 'rxjs';
import { ApiService } from '../../../core/http/api.service';
import { PaymentService } from '../../../core/services/payment.service';
import { PurchaseService } from '../../../core/services/purchase.service';
import { ReportService } from '../../../core/services/report.service';
import { AlertApiService } from '../../alerts/services/alert-api.service';
import { PurchaseOrderApiService } from '../../purchase-orders/services/purchase-order-api.service';
import { SupplierApiService } from '../../suppliers/services/supplier-api.service';
import { PurchaseOfficerDashboardApiService } from './purchase-officer-dashboard-api.service';

describe('PurchaseOfficerDashboardApiService', () => {
  let service: PurchaseOfficerDashboardApiService;

  const reportServiceStub = {
    getMyDashboard: vi.fn(),
    getPurchaseSummaryReport: vi.fn(),
    getSupplierPerformanceReport: vi.fn(),
    getLowStockItems: vi.fn(),
    getPaymentSummaryReport: vi.fn(),
  };

  const purchaseServiceStub = {
    getPurchaseOrders: vi.fn(),
    getOverduePurchaseOrders: vi.fn(),
  };

  const supplierApiServiceStub = {
    getSupplierSummary: vi.fn(),
    getSuppliers: vi.fn(),
    getTopRatedSuppliers: vi.fn(),
  };

  const paymentServiceStub = {
    getPayments: vi.fn(),
  };

  const apiServiceStub = {
    get: vi.fn(),
  };

  const purchaseOrderApiStub = {
    getPurchaseOfficerSummary: vi.fn(),
  };

  const alertApiServiceStub = {
    getMyAlertSummary: vi.fn(),
    getMyAlerts: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [
        PurchaseOfficerDashboardApiService,
        { provide: ReportService, useValue: reportServiceStub },
        { provide: PurchaseService, useValue: purchaseServiceStub },
        { provide: SupplierApiService, useValue: supplierApiServiceStub },
        { provide: PaymentService, useValue: paymentServiceStub },
        { provide: AlertApiService, useValue: alertApiServiceStub },
        { provide: ApiService, useValue: apiServiceStub },
        { provide: PurchaseOrderApiService, useValue: purchaseOrderApiStub },
      ],
    });

    service = TestBed.inject(PurchaseOfficerDashboardApiService);
  });

  function seedHappyPath() {
    reportServiceStub.getMyDashboard.mockReturnValue(of({
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
    }));
    purchaseServiceStub.getPurchaseOrders.mockReturnValue(of([
      { poId: 11, purchaseOrderId: 11, poNumber: 'PO-11', supplierId: 1, supplierName: 'Alpha', warehouseId: 1, warehouseName: 'Main', createdById: 1, status: 'DRAFT', totalAmount: 1000, createdAt: '2026-05-01T09:00:00Z', expectedDeliveryDate: '2026-05-06', lineItems: [] },
      { poId: 12, purchaseOrderId: 12, poNumber: 'PO-12', supplierId: 2, supplierName: 'Beta', warehouseId: 1, warehouseName: 'Main', createdById: 1, status: 'PENDING_APPROVAL', totalAmount: 2000, createdAt: '2026-05-01T10:00:00Z', expectedDeliveryDate: '2026-05-07', lineItems: [] },
      { poId: 13, purchaseOrderId: 13, poNumber: 'PO-13', supplierId: 3, supplierName: 'Gamma', warehouseId: 2, warehouseName: 'Overflow', createdById: 1, status: 'APPROVED', totalAmount: 3000, createdAt: '2026-05-01T11:00:00Z', expectedDeliveryDate: '2026-05-08', lineItems: [] },
      { poId: 14, purchaseOrderId: 14, poNumber: 'PO-14', supplierId: 4, supplierName: 'Delta', warehouseId: 2, warehouseName: 'Overflow', createdById: 1, status: 'RECEIVED', totalAmount: 4000, createdAt: '2026-05-01T12:00:00Z', expectedDeliveryDate: '2026-05-09', lineItems: [] },
    ]));
    purchaseServiceStub.getOverduePurchaseOrders.mockReturnValue(of([
      { poId: 99, purchaseOrderId: 99, poNumber: 'PO-99', supplierId: 3, supplierName: 'Gamma', warehouseId: 2, warehouseName: 'Overflow', createdById: 1, status: 'APPROVED', totalAmount: 9000, createdAt: '2026-04-20T11:00:00Z', expectedDeliveryDate: '2026-04-28', lineItems: [] },
    ]));
    reportServiceStub.getPurchaseSummaryReport.mockReturnValue(of({
      totalPurchaseOrders: 4,
      pendingApprovalCount: 1,
      approvedCount: 1,
      receivedCount: 1,
      cancelledCount: 0,
      overdueCount: 1,
      totalPurchaseValue: 10000,
      receivedPurchaseValue: 4000,
      pendingPurchaseValue: 6000,
    }));
    purchaseOrderApiStub.getPurchaseOfficerSummary.mockReturnValue(of({
      totalPurchaseOrders: 4,
      pendingApprovalCount: 1,
      approvedCount: 1,
      receivedCount: 1,
      cancelledCount: 0,
      overdueCount: 1,
      totalPurchaseValue: 10000,
      receivedPurchaseValue: 4000,
      pendingPurchaseValue: 6000,
    }));
    supplierApiServiceStub.getSupplierSummary.mockReturnValue(of({
      totalSuppliers: 4,
      activeSuppliers: 3,
      inactiveSuppliers: 1,
      blacklistedSuppliers: 0,
      pendingReviewSuppliers: 0,
      averageRating: 4.2,
      averageLeadTimeDays: 5,
    }));
    supplierApiServiceStub.getSuppliers.mockReturnValue(of({
      content: [
        { supplierId: 1, name: 'Alpha', leadTimeDays: 4, rating: 4.8, isActive: true, totalOrders: 12 },
        { supplierId: 2, name: 'Beta', leadTimeDays: 6, rating: 3.2, isActive: true, totalOrders: 5 },
        { supplierId: 3, name: 'Gamma', leadTimeDays: 7, rating: 2.9, isActive: true, totalOrders: 4 },
        { supplierId: 4, name: 'Dormant', leadTimeDays: 9, rating: 3.6, isActive: false, totalOrders: 2 },
      ],
      totalElements: 4,
      totalPages: 1,
      number: 0,
      size: 50,
      numberOfElements: 4,
      first: true,
      last: true,
      empty: false,
    }));
    supplierApiServiceStub.getTopRatedSuppliers.mockReturnValue(of([
      { supplierId: 1, name: 'Alpha', leadTimeDays: 4, rating: 4.8, isActive: true, totalOrders: 12 },
    ]));
    reportServiceStub.getSupplierPerformanceReport.mockReturnValue(of({
      content: [
        { supplierId: 1, supplierName: 'Alpha', totalOrders: 12, receivedOrders: 11, delayedOrders: 1, totalSpend: 40000, averageLeadTimeDays: 4, rating: 4.8 },
      ],
      totalElements: 1,
      totalPages: 1,
      number: 0,
      size: 4,
      numberOfElements: 1,
      first: true,
      last: true,
      empty: false,
    }));
    apiServiceStub.get.mockReturnValue(of({
      content: [
        { productId: 55, sku: 'SKU-55', productName: 'Cable', warehouseId: 1, warehouseName: 'Main', availableQuantity: 3, reorderLevel: 10, shortageQuantity: 7, severity: 'HIGH' },
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
    reportServiceStub.getPaymentSummaryReport.mockReturnValue(of({
      totalPayments: 5,
      paidCount: 1,
      pendingCount: 2,
      cancelledCount: 0,
      totalPaidAmount: 300000,
      pendingAmount: 120000,
      supplierPayments: [],
    }));
    paymentServiceStub.getPayments.mockReturnValue(of({
      content: [
        { paymentId: 21, paymentNumber: 'PAY-21', purchaseOrderId: 13, poNumber: 'PO-13', supplierId: 3, supplierName: 'Gamma', status: 'PENDING_APPROVAL', paymentMethod: 'UPI', paymentAmount: 5000, poTotalAmount: 9000, previouslyPaidAmount: 0, remainingAmount: 9000, currency: 'INR', paymentDate: '2026-05-01T13:00:00Z' },
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
    alertApiServiceStub.getMyAlertSummary.mockReturnValue(of({
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
    }));
    alertApiServiceStub.getMyAlerts.mockReturnValue(of({
      content: [
        { alertId: 71, title: 'Supplier delay', severity: 'CRITICAL', type: 'OVERDUE_PO', createdAt: '2026-05-01T08:00:00Z' },
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

  it('should aggregate purchase officer dashboard data through gateway-backed services', async () => {
    seedHappyPath();

    const view = await firstValueFrom(service.refreshDashboard());

    expect(view.overview?.totalPurchaseOrders).toBe(4);
    expect(view.overview?.pendingPayments).toBe(2);
    expect(view.procurementAttentionItems[0]?.productName).toBe('Cable');
    expect(view.paymentSectionEnabled).toBe(true);
    expect(view.sectionErrors).toEqual({});
  });

  it('should return partial dashboard state when payment summary fails', async () => {
    seedHappyPath();
    reportServiceStub.getPaymentSummaryReport.mockReturnValueOnce(throwError(() => new Error('payment down')));

    const view = await firstValueFrom(service.refreshDashboard());

    expect(view.sectionErrors.payments).toBe('Unable to load payment summary');
    expect(view.paymentSectionEnabled).toBe(false);
    expect(view.recentPurchaseOrders.length).toBeGreaterThan(0);
  });
});
