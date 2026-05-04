import { ComponentFixture, TestBed } from '@angular/core/testing';
import { convertToParamMap, provideRouter, ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { SupplierApiService } from '../../services/supplier-api.service';
import { SupplierDetailComponent } from './supplier-detail.component';
import { UserRole } from '../../../../shared/config/app-config';

describe('SupplierDetailComponent', () => {
  let fixture: ComponentFixture<SupplierDetailComponent>;
  let component: SupplierDetailComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SupplierDetailComponent],
      providers: [
        provideRouter([]),
        {
          provide: SupplierApiService,
          useValue: {
            getSupplierById: vi.fn().mockReturnValue(
              of({
                supplierId: 1,
                supplierCode: 'SUP-20260501-0001',
                name: 'Acme Supply',
                email: 'acme@example.com',
                city: 'Pune',
                country: 'India',
                leadTimeDays: 5,
                rating: 4.5,
                status: 'ACTIVE',
                isActive: true,
              })
            ),
            getSupplierPerformance: vi.fn().mockReturnValue(
              of({
                supplierId: 1,
                supplierName: 'Acme Supply',
                totalOrders: 10,
                completedOrders: 9,
                delayedOrders: 1,
                totalSpend: 100000,
                averageDeliveryDelayDays: 1.2,
                qualityRating: 4.7,
                deliveryRating: 4.5,
                overallRating: 4.6,
              })
            ),
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
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({ id: '1' }),
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SupplierDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should display supplier details', () => {
    expect(component.supplier?.name).toBe('Acme Supply');
    expect(fixture.nativeElement.textContent).toContain('Acme Supply');
  });

  it('should display performance section', () => {
    expect(component.performance?.totalOrders).toBe(10);
    expect(fixture.nativeElement.textContent).toContain('Operational snapshot');
  });

  it('should hide management actions for warehouse staff', async () => {
    const authService = TestBed.inject(AuthService) as unknown as { hasRole: ReturnType<typeof vi.fn> };
    authService.hasRole.mockImplementation((role: UserRole | UserRole[]) => {
      const roles = Array.isArray(role) ? role : [role];
      return roles.includes(UserRole.WAREHOUSE_STAFF) && !roles.includes(UserRole.INVENTORY_MANAGER);
    });

    fixture = TestBed.createComponent(SupplierDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.canEdit).toBe(false);
  });
});
