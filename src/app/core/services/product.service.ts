import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ProductRequest, ProductResponse } from '../http/backend.models';
import { ApiService } from '../http/api.service';
import { handleServiceError } from '../http/http.utils';
import { API_ENDPOINTS } from '../../shared/config/app-config';

export interface ProductQuery {
  keyword?: string;
  name?: string;
  category?: string;
  brand?: string;
  page?: number;
  size?: number;
  activeOnly?: boolean;
}

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly api = inject(ApiService);
  private readonly serviceName = 'ProductService';

  getProducts(query: ProductQuery = {}): Observable<ProductResponse[]> {
    if (query.activeOnly) {
      return this.api
        .get<ProductResponse[]>(API_ENDPOINTS.PRODUCTS.ACTIVE, { service: 'product' })
        .pipe(handleServiceError(this.serviceName, 'getProducts(activeOnly)'));
    }

    if (query.keyword || query.name || query.category || query.brand || query.page !== undefined || query.size !== undefined) {
      return this.api
        .get<ProductResponse[]>(API_ENDPOINTS.PRODUCTS.SEARCH, {
          service: 'product',
          params: {
            keyword: query.keyword,
            name: query.name,
            category: query.category,
            brand: query.brand,
            page: query.page ?? 0,
            size: query.size ?? 50,
          },
        })
        .pipe(handleServiceError(this.serviceName, 'getProducts(search)'));
    }

    return this.api
      .get<ProductResponse[]>(API_ENDPOINTS.PRODUCTS.ROOT, { service: 'product' })
      .pipe(handleServiceError(this.serviceName, 'getProducts'));
  }

  getProductById(id: number): Observable<ProductResponse> {
    return this.api
      .get<ProductResponse>(`${API_ENDPOINTS.PRODUCTS.ROOT}/${id}`, { service: 'product' })
      .pipe(handleServiceError(this.serviceName, 'getProductById'));
  }

  getProductsByCategory(category: string): Observable<ProductResponse[]> {
    return this.api
      .get<ProductResponse[]>(API_ENDPOINTS.PRODUCTS.CATEGORY(category), { service: 'product' })
      .pipe(handleServiceError(this.serviceName, 'getProductsByCategory'));
  }

  getProductsByBrand(brand: string): Observable<ProductResponse[]> {
    return this.api
      .get<ProductResponse[]>(API_ENDPOINTS.PRODUCTS.BRAND(brand), { service: 'product' })
      .pipe(handleServiceError(this.serviceName, 'getProductsByBrand'));
  }

  getProductByBarcode(barcode: string): Observable<ProductResponse> {
    return this.api
      .get<ProductResponse>(API_ENDPOINTS.PRODUCTS.BARCODE(barcode), { service: 'product' })
      .pipe(handleServiceError(this.serviceName, 'getProductByBarcode'));
  }

  createProduct(payload: ProductRequest): Observable<ProductResponse> {
    return this.api
      .post<ProductResponse>(API_ENDPOINTS.PRODUCTS.ROOT, payload, { service: 'product' })
      .pipe(handleServiceError(this.serviceName, 'createProduct'));
  }

  updateProduct(id: number, payload: ProductRequest): Observable<ProductResponse> {
    return this.api
      .put<ProductResponse>(`${API_ENDPOINTS.PRODUCTS.ROOT}/${id}`, payload, { service: 'product' })
      .pipe(handleServiceError(this.serviceName, 'updateProduct'));
  }

  deactivateProduct(id: number): Observable<string> {
    return this.api
      .put<string>(API_ENDPOINTS.PRODUCTS.DEACTIVATE(id), {}, {
        service: 'product',
        responseType: 'text',
      })
      .pipe(handleServiceError(this.serviceName, 'deactivateProduct'));
  }

  deleteProduct(id: number): Observable<string> {
    return this.api
      .delete<string>(`${API_ENDPOINTS.PRODUCTS.ROOT}/${id}`, {
        service: 'product',
        responseType: 'text',
      })
      .pipe(handleServiceError(this.serviceName, 'deleteProduct'));
  }
}
