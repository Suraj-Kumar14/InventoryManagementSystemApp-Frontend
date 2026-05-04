import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { UserRole } from '../../../../shared/config/app-config';
import { PageResponse, SupplierSummaryResponse } from '../../../../core/http/backend.models';
import { SupplierApiService } from '../../services/supplier-api.service';
import { SupplierListComponent } from './supplier-list.component';

describe('SupplierListComponent', () => {
  const supplierPage: PageResponse<any> = {
    content: [
      {
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

  const summary: SupplierSummaryResponse = {
    totalSuppliers: 1,
    activeSuppliers: 1,
    inactiveSuppliers: 0,
    blacklistedSuppliers: 0,
    pendingReviewSuppliers: 0,
    averageRating: 4.5,
    averageLeadTimeDays: 5,
  };

  let fixture: ComponentFixture<SupplierListComponent>;
  let component: SupplierListComponent;
  let supplierApiStub: {
    getSuppliers: ReturnType<typeof vi.fn>;
    searchSuppliers: ReturnType<typeof vi.fn>;
    getSupplierSummary: ReturnType<typeof vi.fn>;
    activateSupplier: ReturnType<typeof vi.fn>;
    deactivateSupplier: ReturnType<typeof vi.fn>;
    blacklistSupplier: ReturnType<typeof vi.fn>;
    updateSupplierRating: ReturnType<typeof vi.fn>;
    deleteSupplier: ReturnType<typeof vi.fn>;
  };
  let authServiceStub: { hasRole: ReturnType<typeof vi.fn> };

  function createComponent(role: UserRole) {
    authServiceStub.hasRole.mockImplementation((required: UserRole | UserRole[]) => {
      const roles = Array.isArray(required) ? required : [required];
      return role === UserRole.ADMIN ? true : roles.includes(role);
    });

    fixture = TestBed.createComponent(SupplierListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  beforeEach(async () => {
    supplierApiStub = {
      getSuppliers: vi.fn().mockReturnValue(of(supplierPage)),
      searchSuppliers: vi.fn().mockReturnValue(of(supplierPage)),
      getSupplierSummary: vi.fn().mockReturnValue(of(summary)),
      activateSupplier: vi.fn().mockReturnValue(of(supplierPage.content[0])),
      deactivateSupplier: vi.fn().mockReturnValue(of({ ...supplierPage.content[0], isActive: false, status: 'INACTIVE' })),
      blacklistSupplier: vi.fn().mockReturnValue(of({ ...supplierPage.content[0], isActive: false, status: 'BLACKLISTED' })),
      updateSupplierRating: vi.fn().mockReturnValue(of({ ...supplierPage.content[0], rating: 4.8 })),
      deleteSupplier: vi.fn().mockReturnValue(of(void 0)),
    };

    authServiceStub = {
      hasRole: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [SupplierListComponent],
      providers: [
        provideRouter([]),
        { provide: SupplierApiService, useValue: supplierApiStub },
        { provide: AuthService, useValue: authServiceStub },
        { provide: NotificationService, useValue: { success: vi.fn(), error: vi.fn(), warning: vi.fn() } },
      ],
    }).compileComponents();
  });

  it('should load suppliers', () => {
    createComponent(UserRole.PURCHASE_OFFICER);

    expect(supplierApiStub.getSuppliers).toHaveBeenCalled();
    expect(component.suppliers.length).toBe(1);
  });

  it('should filter suppliers', () => {
    createComponent(UserRole.PURCHASE_OFFICER);

    component.filtersForm.patchValue({ keyword: 'Acme', city: 'Pune' });
    component.onSearch();

    expect(supplierApiStub.searchSuppliers).toHaveBeenCalled();
  });

  it('should show status badges and hide actions by role', () => {
    createComponent(UserRole.WAREHOUSE_STAFF);

    expect(component.canCreate).toBe(false);
    expect(component.canEdit).toBe(false);
    expect(component.canDeactivate).toBe(false);
  });

  it('should handle empty state', () => {
    supplierApiStub.getSuppliers.mockReturnValue(of({ ...supplierPage, content: [], totalElements: 0, empty: true }));

    createComponent(UserRole.PURCHASE_OFFICER);

    expect(component.suppliers).toEqual([]);
    expect(fixture.nativeElement.textContent).toContain('No suppliers matched the current filters.');
  });

  it('should handle API error', () => {
    supplierApiStub.getSuppliers.mockReturnValue(throwError(() => new Error('boom')));

    createComponent(UserRole.PURCHASE_OFFICER);

    expect(component.suppliers).toEqual([]);
    expect(component.pageData).toBeNull();
    expect(component.loading).toBe(false);
  });
});
