import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { UserRole } from '../../../../shared/config/app-config';
import { PageResponse, PurchaseOrderResponse, PurchaseOrderSummaryResponse } from '../../../../core/http/backend.models';
import { PurchaseOrderApiService } from '../../services/purchase-order-api.service';
import { PoListComponent } from './po-list.component';

describe('PoListComponent', () => {
  const purchaseOrderPage: PageResponse<PurchaseOrderResponse> = {
    content: [
      {
        poId: 1,
        purchaseOrderId: 1,
        poNumber: 'PO-20260501-0001',
        supplierId: 10,
        supplierName: 'Acme',
        warehouseId: 20,
        warehouseName: 'Main',
        createdById: 99,
        status: 'DRAFT',
        totalAmount: 1000,
        lineItems: [],
      },
    ],
    totalElements: 1,
    totalPages: 1,
    number: 0,
    size: 10,
    numberOfElements: 1,
    first: true,
    last: true,
    empty: false,
  };

  const summary: PurchaseOrderSummaryResponse = {
    totalPurchaseOrders: 1,
    draftCount: 1,
    pendingApprovalCount: 0,
    approvedCount: 0,
    partiallyReceivedCount: 0,
    receivedCount: 0,
    cancelledCount: 0,
    rejectedCount: 0,
    overdueCount: 0,
    totalPurchaseValue: 1000,
    pendingPurchaseValue: 0,
    receivedPurchaseValue: 0,
  };

  let fixture: ComponentFixture<PoListComponent>;
  let component: PoListComponent;
  let purchaseApiStub: {
    getPurchaseOrders: ReturnType<typeof vi.fn>;
    searchPurchaseOrders: ReturnType<typeof vi.fn>;
    getPurchaseOrderSummary: ReturnType<typeof vi.fn>;
    getSuppliers: ReturnType<typeof vi.fn>;
    getWarehouses: ReturnType<typeof vi.fn>;
    submitPurchaseOrder: ReturnType<typeof vi.fn>;
    approvePurchaseOrder: ReturnType<typeof vi.fn>;
    rejectPurchaseOrder: ReturnType<typeof vi.fn>;
    cancelPurchaseOrder: ReturnType<typeof vi.fn>;
  };
  let authServiceStub: {
    hasRole: ReturnType<typeof vi.fn>;
    getUserId: ReturnType<typeof vi.fn>;
  };

  function createComponent(role: UserRole) {
    authServiceStub.hasRole.mockImplementation((required: UserRole | UserRole[]) => {
      const roles = Array.isArray(required) ? required : [required];
      return role === UserRole.ADMIN ? true : roles.includes(role);
    });
    authServiceStub.getUserId.mockReturnValue(99);

    fixture = TestBed.createComponent(PoListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  beforeEach(async () => {
    purchaseApiStub = {
      getPurchaseOrders: vi.fn().mockReturnValue(of(purchaseOrderPage)),
      searchPurchaseOrders: vi.fn().mockReturnValue(of(purchaseOrderPage)),
      getPurchaseOrderSummary: vi.fn().mockReturnValue(of(summary)),
      getSuppliers: vi.fn().mockReturnValue(of([])),
      getWarehouses: vi.fn().mockReturnValue(of({ content: [] })),
      submitPurchaseOrder: vi.fn().mockReturnValue(of({ ...purchaseOrderPage.content[0], status: 'PENDING_APPROVAL' })),
      approvePurchaseOrder: vi.fn().mockReturnValue(of({ ...purchaseOrderPage.content[0], status: 'APPROVED' })),
      rejectPurchaseOrder: vi.fn().mockReturnValue(of({ ...purchaseOrderPage.content[0], status: 'REJECTED' })),
      cancelPurchaseOrder: vi.fn().mockReturnValue(of({ ...purchaseOrderPage.content[0], status: 'CANCELLED' })),
    };

    authServiceStub = {
      hasRole: vi.fn(),
      getUserId: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [PoListComponent],
      providers: [
        provideRouter([]),
        { provide: PurchaseOrderApiService, useValue: purchaseApiStub },
        { provide: AuthService, useValue: authServiceStub },
        { provide: NotificationService, useValue: { success: vi.fn(), error: vi.fn(), warning: vi.fn() } },
      ],
    }).compileComponents();
  });

  it('should load POs', () => {
    createComponent(UserRole.OFFICER);

    expect(purchaseApiStub.getPurchaseOrders).toHaveBeenCalled();
    expect(component.purchaseOrders.length).toBe(1);
  });

  it('should filter by status', () => {
    createComponent(UserRole.OFFICER);

    component.filtersForm.patchValue({ status: 'DRAFT' });
    component.onSearch();

    expect(purchaseApiStub.searchPurchaseOrders).toHaveBeenCalled();
  });

  it('should show status badges and hide manager actions for staff', () => {
    createComponent(UserRole.STAFF);

    expect(component.canCreate).toBe(false);
    expect(component.canApprove).toBe(false);
    expect(component.canShowReceive(component.purchaseOrders[0])).toBe(false);
  });

  it('should handle empty state', () => {
    purchaseApiStub.getPurchaseOrders.mockReturnValue(of({ ...purchaseOrderPage, content: [], totalElements: 0, empty: true }));

    createComponent(UserRole.OFFICER);

    expect(component.purchaseOrders).toEqual([]);
    expect(fixture.nativeElement.textContent).toContain('No purchase orders matched the current filters.');
  });

  it('should handle API error', () => {
    purchaseApiStub.getPurchaseOrders.mockReturnValue(throwError(() => new Error('boom')));

    createComponent(UserRole.OFFICER);

    expect(component.purchaseOrders).toEqual([]);
    expect(component.pageData).toBeNull();
    expect(component.loading).toBe(false);
  });
});
