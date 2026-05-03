import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { NotificationService } from '../../../../core/services/notification.service';
import { PurchaseOrderApiService } from '../../services/purchase-order-api.service';
import { PoReceiveComponent } from './po-receive.component';
import { Router } from '@angular/router';

describe('PoReceiveComponent', () => {
  let fixture: ComponentFixture<PoReceiveComponent>;
  let component: PoReceiveComponent;
  let purchaseApiStub: {
    getPurchaseOrderById: ReturnType<typeof vi.fn>;
    receivePurchaseOrder: ReturnType<typeof vi.fn>;
  };
  const routerStub = {
    navigate: vi.fn(),
  };
  const notificationStub = {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
  };

  const order = {
    poId: 12,
    purchaseOrderId: 12,
    supplierId: 1,
    warehouseId: 2,
    createdById: 3,
    status: 'APPROVED',
    totalAmount: 1000,
    lineItems: [
      {
        lineItemId: 77,
        productId: 5,
        quantity: 10,
        orderedQuantity: 10,
        receivedQty: 2,
        receivedQuantity: 2,
        pendingQuantity: 8,
        unitCost: 100,
        totalCost: 1000,
      },
    ],
  };

  beforeEach(async () => {
    purchaseApiStub = {
      getPurchaseOrderById: vi.fn().mockReturnValue(of(order)),
      receivePurchaseOrder: vi.fn().mockReturnValue(of({ ...order, status: 'PARTIALLY_RECEIVED' })),
    };

    await TestBed.configureTestingModule({
      imports: [PoReceiveComponent],
      providers: [
        provideRouter([]),
        { provide: Router, useValue: routerStub },
        { provide: PurchaseOrderApiService, useValue: purchaseApiStub },
        { provide: NotificationService, useValue: notificationStub },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: () => '12',
              },
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(PoReceiveComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should show pending quantities', () => {
    expect(component.purchaseOrder?.lineItems[0].pendingQuantity).toBe(8);
  });

  it('should reject received quantity greater than pending', () => {
    component.lineItems.at(0).patchValue({ receivedQuantity: 9 });

    component.submit();

    expect(notificationStub.error).toHaveBeenCalled();
    expect(purchaseApiStub.receivePurchaseOrder).not.toHaveBeenCalled();
  });

  it('should submit valid receive request', () => {
    component.lineItems.at(0).patchValue({ receivedQuantity: 3 });

    component.submit();

    expect(purchaseApiStub.receivePurchaseOrder).toHaveBeenCalled();
  });

  it('should show loading state while submitting', async () => {
    const loadingFixture = TestBed.createComponent(PoReceiveComponent);
    const loadingComponent = loadingFixture.componentInstance;
    loadingComponent.submitting = true;
    loadingFixture.detectChanges();
    await loadingFixture.whenStable();
    loadingFixture.detectChanges();

    expect(loadingFixture.nativeElement.textContent).toContain('Receiving...');
  });
});
