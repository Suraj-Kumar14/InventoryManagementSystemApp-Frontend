import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { PaymentService } from '../../../../core/services/payment.service';
import { AlertStateService } from '../../../alerts/services/alert-state.service';
import { PurchaseOrderApiService } from '../../../purchase-orders/services/purchase-order-api.service';
import { PaymentCreateComponent } from './payment-create.component';

describe('PaymentCreateComponent', () => {
  const purchaseApiStub = {
    getPurchaseOrders: vi.fn(),
  };

  const paymentServiceStub = {
    getPaymentsByPurchaseOrder: vi.fn(),
    getRemainingAmountDetails: vi.fn(),
    getSplitPaymentPlan: vi.fn(),
    initiateRazorpayPayment: vi.fn(),
    verifyRazorpayPayment: vi.fn(),
    recordRazorpayFailure: vi.fn(),
    recordRazorpayCancellation: vi.fn(),
    isPaymentLimitExceeded: vi.fn((error: any) => error?.error?.errorCode === 'PAYMENT_LIMIT_EXCEEDED'),
  };

  const notificationStub = {
    success: vi.fn(),
    warning: vi.fn(),
    error: vi.fn(),
  };

  const alertStateStub = {
    refresh: vi.fn(),
  };

  const authServiceStub = {
    hasRole: vi.fn(),
  };

  const pendingOrder = {
    poId: 11,
    purchaseOrderId: 11,
    poNumber: 'PO-11',
    supplierId: 7,
    supplierName: 'Acme Supplies',
    warehouseId: 5,
    warehouseName: 'Main Warehouse',
    status: 'PENDING_PAYMENT',
    totalAmount: 1500,
    createdAt: '2026-05-10T10:00:00Z',
    expectedDeliveryDate: '2026-05-16',
  };

  let capturedOptions: any;
  let paymentFailedHandler: ((response: any) => void) | undefined;

  beforeEach(async () => {
    vi.clearAllMocks();
    capturedOptions = undefined;
    paymentFailedHandler = undefined;

    purchaseApiStub.getPurchaseOrders.mockReturnValue(of({
      content: [pendingOrder],
      totalElements: 1,
      totalPages: 1,
      number: 0,
      size: 200,
      numberOfElements: 1,
      first: true,
      last: true,
      empty: false,
    }));
    paymentServiceStub.getPaymentsByPurchaseOrder.mockReturnValue(of({
      content: [],
      totalElements: 0,
      totalPages: 0,
      number: 0,
      size: 1,
      numberOfElements: 0,
      first: true,
      last: true,
      empty: true,
    }));
    paymentServiceStub.getRemainingAmountDetails.mockReturnValue(of({
      purchaseOrderId: 11,
      totalAmount: 1500,
      paidAmount: 0,
      remainingAmount: 1500,
      status: 'INITIATED',
      maxAllowedAmount: 500000,
      currency: 'INR',
    }));
    paymentServiceStub.getSplitPaymentPlan.mockReturnValue(of({
      purchaseOrderId: 11,
      totalAmount: 600000,
      requestedAmount: 600000,
      remainingAmount: 600000,
      maxAllowedAmount: 500000,
      suggestedSplits: [500000, 100000],
    }));
    paymentServiceStub.initiateRazorpayPayment.mockReturnValue(of({
      razorpayOrderId: 'order_123',
      paymentNumber: 'PAY-123',
      purchaseOrderId: 11,
      amount: 1500,
      currency: 'INR',
      keyId: 'rzp_test_key',
      description: 'Razorpay payment',
    }));
    paymentServiceStub.verifyRazorpayPayment.mockReturnValue(of({
      paymentId: 99,
      paymentNumber: 'PAY-123',
      purchaseOrderId: 11,
      status: 'PAID',
      paymentAmount: 1500,
      razorpayOrderId: 'order_123',
      razorpayPaymentId: 'pay_123',
    }));
    paymentServiceStub.recordRazorpayFailure.mockReturnValue(of({
      paymentId: 99,
      paymentNumber: 'PAY-123',
      purchaseOrderId: 11,
      status: 'FAILED',
      paymentAmount: 1500,
      razorpayOrderId: 'order_123',
    }));
    paymentServiceStub.recordRazorpayCancellation.mockReturnValue(of({
      paymentId: 99,
      paymentNumber: 'PAY-123',
      purchaseOrderId: 11,
      status: 'CANCELLED',
      paymentAmount: 1500,
      razorpayOrderId: 'order_123',
    }));
    authServiceStub.hasRole.mockImplementation((role: string) => role === 'ADMIN');

    const razorpayConstructor = vi.fn(function (this: unknown, options: any) {
      capturedOptions = options;
      return {
        on: vi.fn((event: string, handler: (response: any) => void) => {
          if (event === 'payment.failed') {
            paymentFailedHandler = handler;
          }
        }),
        open: vi.fn(),
      };
    });
    (globalThis as any).Razorpay = razorpayConstructor;
    if (typeof window !== 'undefined') {
      (window as any).Razorpay = razorpayConstructor;
    }

    await TestBed.configureTestingModule({
      imports: [PaymentCreateComponent],
      providers: [
        provideRouter([]),
        { provide: PurchaseOrderApiService, useValue: purchaseApiStub },
        { provide: PaymentService, useValue: paymentServiceStub },
        { provide: NotificationService, useValue: notificationStub },
        { provide: AlertStateService, useValue: alertStateStub },
        { provide: AuthService, useValue: authServiceStub },
      ],
    }).compileComponents();
  });

  it('shows Pay with Razorpay for eligible purchase orders', async () => {
    const fixture = TestBed.createComponent(PaymentCreateComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Pay with Razorpay');
  });

  it('hides the pay button when the payment is already successful', async () => {
    paymentServiceStub.getPaymentsByPurchaseOrder.mockReturnValueOnce(of({
      content: [{ paymentId: 99, purchaseOrderId: 11, status: 'PAID', paymentAmount: 1500 }],
      totalElements: 1,
      totalPages: 1,
      number: 0,
      size: 1,
      numberOfElements: 1,
      first: true,
      last: true,
      empty: false,
    }));

    const fixture = TestBed.createComponent(PaymentCreateComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Razorpay Payment Complete');
    expect(fixture.nativeElement.textContent).not.toContain('Pay with Razorpay');
  });

  it('shows split payment guidance only for transaction limit errors', async () => {
    paymentServiceStub.initiateRazorpayPayment.mockReturnValueOnce(
      throwError(() => ({
        error: {
          status: 400,
          errorCode: 'PAYMENT_LIMIT_EXCEEDED',
          message: 'Payment amount exceeds Razorpay transaction limit. Please split the payment or contact admin.',
          requestedAmount: 600000,
          maxAllowedAmount: 500000,
          remainingAmount: 600000,
          splitAllowed: true,
        },
      }))
    );

    const fixture = TestBed.createComponent(PaymentCreateComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();

    component.initiatePay(component.orders[0]);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Payment limit reached');
    expect(fixture.nativeElement.textContent).toContain('Pay Split 1');
    expect(notificationStub.warning).toHaveBeenCalled();
  });

  it('hides split actions for non-admin users even when the backend allows splitting', async () => {
    authServiceStub.hasRole.mockReturnValue(false);
    paymentServiceStub.initiateRazorpayPayment.mockReturnValueOnce(
      throwError(() => ({
        error: {
          status: 400,
          errorCode: 'PAYMENT_LIMIT_EXCEEDED',
          message: 'Payment amount exceeds Razorpay transaction limit. Please split the payment or contact admin.',
          requestedAmount: 600000,
          maxAllowedAmount: 500000,
          remainingAmount: 600000,
          splitAllowed: true,
        },
      }))
    );

    const fixture = TestBed.createComponent(PaymentCreateComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();

    component.initiatePay(component.orders[0]);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Please contact admin to complete this payment.');
    expect(fixture.nativeElement.textContent).not.toContain('Pay Split 1');
  });

  it('verifies successful Razorpay callback and refreshes alerts', async () => {
    const fixture = TestBed.createComponent(PaymentCreateComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();

    component.initiatePay(component.orders[0]);
    await fixture.whenStable();
    capturedOptions.handler({
      razorpay_order_id: 'order_123',
      razorpay_payment_id: 'pay_123',
      razorpay_signature: 'sig_123',
    });
    fixture.detectChanges();

    expect(paymentServiceStub.verifyRazorpayPayment).toHaveBeenCalled();
    expect(notificationStub.success).toHaveBeenCalledWith('Payment completed successfully');
    expect(alertStateStub.refresh).toHaveBeenCalled();
  });

  it('records failed checkout outcomes through the backend', async () => {
    const fixture = TestBed.createComponent(PaymentCreateComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();

    component.initiatePay(component.orders[0]);
    await fixture.whenStable();
    paymentFailedHandler?.({ error: { metadata: { payment_id: 'pay_failed' }, description: 'Payment failed.' } });

    expect(paymentServiceStub.recordRazorpayFailure).toHaveBeenCalled();
    expect(paymentServiceStub.recordRazorpayCancellation).not.toHaveBeenCalled();
  });

  it('records cancelled checkout outcomes through the backend', async () => {
    const fixture = TestBed.createComponent(PaymentCreateComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();

    component.initiatePay(component.orders[0]);
    await fixture.whenStable();
    capturedOptions.modal.ondismiss();

    expect(paymentServiceStub.recordRazorpayCancellation).toHaveBeenCalled();
  });
});
