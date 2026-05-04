import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { UserRole } from '../../../../shared/config/app-config';
import { MovementApiService } from '../../services/movement-api.service';
import { MovementDetailComponent } from './movement-detail.component';

describe('MovementDetailComponent', () => {
  let fixture: ComponentFixture<MovementDetailComponent>;
  let component: MovementDetailComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MovementDetailComponent],
      providers: [
        provideRouter([]),
        {
          provide: MovementApiService,
          useValue: {
            getMovementById: vi.fn().mockReturnValue(of({
              movementId: 1,
              movementNumber: 'MOV-20260501-000001',
              productId: 101,
              productName: 'Widget',
              warehouseId: 10,
              warehouseName: 'Main Warehouse',
              movementType: 'STOCK_IN',
              direction: 'IN',
              quantity: 15,
              unitCost: 6,
              totalValue: 90,
              balanceAfter: 75,
              isReversal: false,
              reasonCode: 'PURCHASE_RECEIPT',
              notes: 'Received via GRN',
            })),
            reverseMovement: vi.fn().mockReturnValue(of({ movementId: 2 })),
          },
        },
        {
          provide: AuthService,
          useValue: {
            hasRole: vi.fn().mockImplementation((role: UserRole | UserRole[]) => {
              const roles = Array.isArray(role) ? role : [role];
              return roles.includes(UserRole.INVENTORY_MANAGER);
            }),
          },
        },
        {
          provide: NotificationService,
          useValue: { success: vi.fn(), error: vi.fn() },
        },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({ id: '1' }),
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MovementDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should display movement details', () => {
    expect(component.movement?.movementNumber).toBe('MOV-20260501-000001');
    expect(fixture.nativeElement.textContent).toContain('Widget');
  });

  it('should show reversal link if present', () => {
    component.movement = {
      ...(component.movement as NonNullable<typeof component.movement>),
      relatedMovementId: 99,
    };
    fixture.detectChanges();

    expect(component.movement?.relatedMovementId).toBe(99);
  });

  it('should hide reverse button for unauthorized roles', async () => {
    const authService = TestBed.inject(AuthService) as unknown as { hasRole: ReturnType<typeof vi.fn> };
    authService.hasRole.mockImplementation((role: UserRole | UserRole[]) => {
      const roles = Array.isArray(role) ? role : [role];
      return roles.includes(UserRole.WAREHOUSE_STAFF) && !roles.includes(UserRole.INVENTORY_MANAGER);
    });

    fixture = TestBed.createComponent(MovementDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.canReverse).toBe(false);
  });
});
