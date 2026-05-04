import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { UserRole } from '../../../../shared/config/app-config';
import { PageResponse, Product, ProductSummary } from '../../../../core/http/backend.models';
import { ProductApiService } from '../../services/product-api.service';
import { ProductListComponent } from './product-list.component';

describe('ProductListComponent', () => {
  const productPage: PageResponse<Product> = {
    content: [
      {
        productId: 1,
        sku: 'SKU-001',
        name: 'Laptop',
        category: 'Electronics',
        brand: 'Dell',
        unitOfMeasure: 'Piece',
        costPrice: 750,
        sellingPrice: 999,
        reorderLevel: 5,
        maxStockLevel: 25,
        leadTimeDays: 7,
        barcode: 'BAR-001',
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

  const summary: ProductSummary = {
    totalProducts: 1,
    activeProducts: 1,
    inactiveProducts: 0,
    categoriesCount: 1,
    brandsCount: 1,
  };

  let fixture: ComponentFixture<ProductListComponent>;
  let component: ProductListComponent;
  let productApiStub: {
    getProducts: ReturnType<typeof vi.fn>;
    searchProducts: ReturnType<typeof vi.fn>;
    getCategories: ReturnType<typeof vi.fn>;
    getBrands: ReturnType<typeof vi.fn>;
    getProductSummary: ReturnType<typeof vi.fn>;
    deactivateProduct: ReturnType<typeof vi.fn>;
    activateProduct: ReturnType<typeof vi.fn>;
    deleteProduct: ReturnType<typeof vi.fn>;
  };
  let authServiceStub: {
    hasRole: ReturnType<typeof vi.fn>;
  };

  function createComponent(role: UserRole) {
    authServiceStub.hasRole.mockImplementation((required: UserRole | UserRole[]) => {
      const roles = Array.isArray(required) ? required : [required];
      return role === UserRole.ADMIN ? true : roles.includes(role);
    });

    fixture = TestBed.createComponent(ProductListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  beforeEach(async () => {
    productApiStub = {
      getProducts: vi.fn().mockReturnValue(of(productPage)),
      searchProducts: vi.fn().mockReturnValue(of(productPage)),
      getCategories: vi.fn().mockReturnValue(of(['Electronics'])),
      getBrands: vi.fn().mockReturnValue(of(['Dell'])),
      getProductSummary: vi.fn().mockReturnValue(of(summary)),
      deactivateProduct: vi.fn().mockReturnValue(of({ ...productPage.content[0], isActive: false })),
      activateProduct: vi.fn().mockReturnValue(of({ ...productPage.content[0], isActive: true })),
      deleteProduct: vi.fn().mockReturnValue(of(void 0)),
    };

    authServiceStub = {
      hasRole: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [ProductListComponent],
      providers: [
        provideRouter([]),
        { provide: ProductApiService, useValue: productApiStub },
        { provide: AuthService, useValue: authServiceStub },
        {
          provide: NotificationService,
          useValue: {
            success: vi.fn(),
            error: vi.fn(),
          },
        },
      ],
    }).compileComponents();
  });

  it('should load products', () => {
    createComponent(UserRole.INVENTORY_MANAGER);

    expect(productApiStub.getProducts).toHaveBeenCalled();
    expect(component.products.length).toBe(1);
    expect(component.products[0].sku).toBe('SKU-001');
  });

  it('should search products', () => {
    createComponent(UserRole.INVENTORY_MANAGER);

    component.onSearch({ keyword: 'lap' });

    expect(productApiStub.searchProducts).toHaveBeenCalled();
  });

  it('should show or hide buttons based on role', () => {
    createComponent(UserRole.WAREHOUSE_STAFF);

    expect(component.canManage).toBe(false);
    expect(component.canDelete).toBe(false);
  });

  it('should show empty state', () => {
    productApiStub.getProducts.mockReturnValue(
      of({
        ...productPage,
        content: [],
        totalElements: 0,
        numberOfElements: 0,
        empty: true,
      })
    );

    createComponent(UserRole.WAREHOUSE_STAFF);

    expect(component.products).toEqual([]);
    expect(fixture.nativeElement.textContent).toContain('No products matched the current search and filter combination.');
  });

  it('should handle API error', () => {
    productApiStub.getProducts.mockReturnValue(throwError(() => new Error('boom')));

    createComponent(UserRole.WAREHOUSE_STAFF);

    expect(component.products).toEqual([]);
    expect(component.pageData).toBeNull();
    expect(component.loading).toBe(false);
  });
});
