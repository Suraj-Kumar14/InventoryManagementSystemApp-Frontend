import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  CreateProductRequest,
  PageResponse,
  Product,
  ProductSummary,
  UpdateProductRequest,
} from '../../../core/http/backend.models';
import { ApiService } from '../../../core/http/api.service';
import { handleServiceError } from '../../../core/http/http.utils';
import { API_ENDPOINTS } from '../../../shared/config/app-config';
import { ProductListQuery } from '../models/product.model';

@Injectable({ providedIn: 'root' })
export class ProductApiService {
  private readonly api = inject(ApiService);
  private readonly serviceName = 'ProductApiService';

  createProduct(request: CreateProductRequest): Observable<Product> {
    return this.api
      .post<Product>(API_ENDPOINTS.PRODUCTS.ROOT, request)
      .pipe(handleServiceError(this.serviceName, 'createProduct'));
  }

  getProducts(query: ProductListQuery): Observable<PageResponse<Product>> {
    return this.api
      .get<PageResponse<Product>>(API_ENDPOINTS.PRODUCTS.ROOT, {
        params: {
          page: query.page ?? 0,
          size: query.size ?? 10,
          sortBy: query.sortBy ?? 'name',
          sortDir: query.sortDir ?? 'asc',
        },
      })
      .pipe(handleServiceError(this.serviceName, 'getProducts'));
  }

  searchProducts(query: ProductListQuery): Observable<PageResponse<Product>> {
    return this.api
      .get<PageResponse<Product>>(API_ENDPOINTS.PRODUCTS.SEARCH, {
        params: {
          keyword: query.keyword,
          category: query.category,
          brand: query.brand,
          isActive: query.isActive,
          page: query.page ?? 0,
          size: query.size ?? 10,
          sortBy: query.sortBy ?? 'name',
          sortDir: query.sortDir ?? 'asc',
        },
      })
      .pipe(handleServiceError(this.serviceName, 'searchProducts'));
  }

  getProductById(id: number): Observable<Product> {
    return this.api
      .get<Product>(API_ENDPOINTS.PRODUCTS.DETAIL(id))
      .pipe(handleServiceError(this.serviceName, 'getProductById'));
  }

  getProductBySku(sku: string): Observable<Product> {
    return this.api
      .get<Product>(API_ENDPOINTS.PRODUCTS.SKU(sku))
      .pipe(handleServiceError(this.serviceName, 'getProductBySku'));
  }

  getProductByBarcode(barcode: string): Observable<Product> {
    return this.api
      .get<Product>(API_ENDPOINTS.PRODUCTS.BARCODE(barcode))
      .pipe(handleServiceError(this.serviceName, 'getProductByBarcode'));
  }

  updateProduct(id: number, request: UpdateProductRequest): Observable<Product> {
    return this.api
      .put<Product>(API_ENDPOINTS.PRODUCTS.DETAIL(id), request)
      .pipe(handleServiceError(this.serviceName, 'updateProduct'));
  }

  deactivateProduct(id: number): Observable<Product> {
    return this.api
      .patch<Product>(API_ENDPOINTS.PRODUCTS.DEACTIVATE(id), {})
      .pipe(handleServiceError(this.serviceName, 'deactivateProduct'));
  }

  activateProduct(id: number): Observable<Product> {
    return this.api
      .patch<Product>(API_ENDPOINTS.PRODUCTS.ACTIVATE(id), {})
      .pipe(handleServiceError(this.serviceName, 'activateProduct'));
  }

  deleteProduct(id: number): Observable<void> {
    return this.api
      .delete<void>(API_ENDPOINTS.PRODUCTS.DETAIL(id))
      .pipe(handleServiceError(this.serviceName, 'deleteProduct'));
  }

  getCategories(): Observable<string[]> {
    return this.api
      .get<string[]>(API_ENDPOINTS.PRODUCTS.CATEGORIES)
      .pipe(handleServiceError(this.serviceName, 'getCategories'));
  }

  getBrands(): Observable<string[]> {
    return this.api
      .get<string[]>(API_ENDPOINTS.PRODUCTS.BRANDS)
      .pipe(handleServiceError(this.serviceName, 'getBrands'));
  }

  getProductSummary(): Observable<ProductSummary> {
    return this.api
      .get<ProductSummary>(API_ENDPOINTS.PRODUCTS.SUMMARY)
      .pipe(handleServiceError(this.serviceName, 'getProductSummary'));
  }
}
