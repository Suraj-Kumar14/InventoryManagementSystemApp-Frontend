import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ApiService } from '../../../core/http/api.service';
import { ProductApiService } from './product-api.service';

describe('ProductApiService', () => {
  let service: ProductApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ProductApiService, ApiService, provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(ProductApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should call product list API', () => {
    service.getProducts({ page: 1, size: 20, sortBy: 'sku', sortDir: 'desc' }).subscribe();

    const request = httpMock.expectOne(
      (req) =>
        req.method === 'GET' &&
        req.url === 'http://localhost:8080/api/v1/products' &&
        req.params.get('page') === '1' &&
        req.params.get('size') === '20' &&
        req.params.get('sortBy') === 'sku' &&
        req.params.get('sortDir') === 'desc'
    );
    request.flush({
      content: [],
      totalElements: 0,
      totalPages: 0,
      number: 1,
      size: 20,
      numberOfElements: 0,
      first: false,
      last: true,
      empty: true,
    });
  });

  it('should call create product API', () => {
    service
      .createProduct({
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
      })
      .subscribe();

    const request = httpMock.expectOne('http://localhost:8080/api/v1/products');
    expect(request.request.method).toBe('POST');
    request.flush({ productId: 1 });
  });

  it('should call update product API', () => {
    service
      .updateProduct(1, {
        name: 'Laptop Pro',
        category: 'Electronics',
        brand: 'Dell',
        unitOfMeasure: 'Piece',
        costPrice: 800,
        sellingPrice: 1099,
        reorderLevel: 6,
        maxStockLevel: 30,
        leadTimeDays: 10,
      })
      .subscribe();

    const request = httpMock.expectOne('http://localhost:8080/api/v1/products/1');
    expect(request.request.method).toBe('PUT');
    request.flush({ productId: 1 });
  });

  it('should call deactivate product API', () => {
    service.deactivateProduct(1).subscribe();

    const request = httpMock.expectOne('http://localhost:8080/api/v1/products/1/deactivate');
    expect(request.request.method).toBe('PATCH');
    request.flush({ productId: 1, isActive: false });
  });

  it('should call barcode lookup API', () => {
    service.getProductByBarcode('BAR-001').subscribe();

    const request = httpMock.expectOne('http://localhost:8080/api/v1/products/barcode/BAR-001');
    expect(request.request.method).toBe('GET');
    request.flush({ productId: 1, barcode: 'BAR-001' });
  });
});
