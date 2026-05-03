import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { UserRole } from '../../../../shared/config/app-config';
import { MovementApiService } from '../../services/movement-api.service';
import { MovementListComponent } from './movement-list.component';

describe('MovementListComponent', () => {
  let fixture: ComponentFixture<MovementListComponent>;
  let component: MovementListComponent;
  const movementApi = {
    getMovements: vi.fn(),
    searchMovements: vi.fn(),
    getMovementSummary: vi.fn(),
    exportCsv: vi.fn(),
    reverseMovement: vi.fn(),
  };

  beforeEach(async () => {
    movementApi.getMovements.mockReturnValue(of({
      content: [{
        movementId: 1,
        movementNumber: 'MOV-20260501-000001',
        productId: 100,
        productName: 'Widget',
        warehouseId: 5,
        warehouseName: 'Main Warehouse',
        movementType: 'STOCK_IN',
        direction: 'IN',
        quantity: 20,
        unitCost: 5,
        totalValue: 100,
        balanceAfter: 80,
        isReversal: false,
      }],
      totalElements: 1,
      totalPages: 1,
      number: 0,
      size: 10,
      numberOfElements: 1,
      first: true,
      last: true,
      empty: false,
    }));
    movementApi.searchMovements.mockReturnValue(movementApi.getMovements());
    movementApi.getMovementSummary.mockReturnValue(of({
      totalMovements: 1,
      totalStockInQuantity: 20,
      totalStockOutQuantity: 0,
      totalTransferQuantity: 0,
      totalAdjustmentQuantity: 0,
      totalWriteOffQuantity: 0,
      totalReturnQuantity: 0,
      totalMovementValue: 100,
      movementsToday: 1,
      movementsThisMonth: 1,
    }));
    movementApi.exportCsv.mockReturnValue(of(new Blob(['csv'])));
    movementApi.reverseMovement.mockReturnValue(of({ movementId: 2 }));

    await TestBed.configureTestingModule({
      imports: [MovementListComponent],
      providers: [
        provideRouter([]),
        { provide: MovementApiService, useValue: movementApi },
        {
          provide: AuthService,
          useValue: {
            hasRole: vi.fn().mockImplementation((role: UserRole | UserRole[]) => {
              const roles = Array.isArray(role) ? role : [role];
              return roles.includes(UserRole.ADMIN);
            }),
          },
        },
        {
          provide: NotificationService,
          useValue: { success: vi.fn(), error: vi.fn() },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MovementListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should load movements', () => {
    expect(component.movements.length).toBe(1);
    expect(fixture.nativeElement.textContent).toContain('MOV-20260501-000001');
  });

  it('should filter movements', () => {
    component.filtersForm.patchValue({ keyword: 'Widget' });
    component.applyFilters();

    expect(movementApi.searchMovements).toHaveBeenCalled();
  });

  it('should show movement type and direction badges', () => {
    expect(fixture.nativeElement.textContent).toContain('STOCK IN');
    expect(fixture.nativeElement.textContent).toContain('IN');
  });

  it('should show reverse action for admin role', () => {
    expect(component.canReverse).toBe(true);
  });

  it('should handle empty state', async () => {
    movementApi.getMovements.mockReturnValue(of({
      content: [],
      totalElements: 0,
      totalPages: 0,
      number: 0,
      size: 10,
      numberOfElements: 0,
      first: true,
      last: true,
      empty: true,
    }));

    fixture = TestBed.createComponent(MovementListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('No stock movements found for the selected filters.');
  });

  it('should handle API error', async () => {
    movementApi.getMovements.mockReturnValue(throwError(() => new Error('boom')));

    fixture = TestBed.createComponent(MovementListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.movements).toEqual([]);
  });
});
