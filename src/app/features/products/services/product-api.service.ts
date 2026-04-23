import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  ApiResponse,
  CreateProductRequest,
  LowStockProduct,
  PagedResponse,
  Product,
  ProductResponse,
  ProductSearchRequest,
  UpdateProductRequest
} from '../models';

@Injectable({ providedIn: 'root' })
export class ProductApiService {
  private readonly http = inject(HttpClient);
  private readonly baseEndpoint = `${environment.apiBaseUrl}/api/v1/products`;

  createProduct(payload: CreateProductRequest): Observable<Product> {
    return this.http
      .post<unknown>(this.baseEndpoint, this.sanitizeProductPayload(payload))
      .pipe(map((response) => this.normalizeProduct(this.unwrapApiResponse(response))));
  }

  getProductById(id: number | string): Observable<Product> {
    return this.http
      .get<unknown>(`${this.baseEndpoint}/${id}`)
      .pipe(map((response) => this.normalizeProduct(this.unwrapApiResponse(response))));
  }

  getProductBySku(sku: string): Observable<Product> {
    return this.http
      .get<unknown>(`${this.baseEndpoint}/sku/${encodeURIComponent(sku.trim())}`)
      .pipe(map((response) => this.normalizeProduct(this.unwrapApiResponse(response))));
  }

  getProductsByCategory(category: string): Observable<Product[]> {
    return this.http
      .get<unknown>(`${this.baseEndpoint}/category/${encodeURIComponent(category.trim())}`)
      .pipe(map((response) => this.normalizeProductCollection(response)));
  }

  getProductsByBrand(brand: string): Observable<Product[]> {
    return this.http
      .get<unknown>(`${this.baseEndpoint}/brand/${encodeURIComponent(brand.trim())}`)
      .pipe(map((response) => this.normalizeProductCollection(response)));
  }

  getProductByBarcode(barcode: string): Observable<Product> {
    return this.http
      .get<unknown>(`${this.baseEndpoint}/barcode/${encodeURIComponent(barcode.trim())}`)
      .pipe(map((response) => this.normalizeProduct(this.unwrapApiResponse(response))));
  }

  getAllProducts(params: ProductSearchRequest = {}): Observable<PagedResponse<Product>> {
    const normalizedRequest = this.normalizeSearchRequest(params);

    return this.http
      .get<unknown>(this.baseEndpoint, { params: this.buildQueryParams(normalizedRequest) })
      .pipe(map((response) => this.normalizePagedProductResponse(response, normalizedRequest)));
  }

  searchProducts(payload: ProductSearchRequest): Observable<PagedResponse<Product>> {
    const normalizedRequest = this.normalizeSearchRequest(payload);

    return this.http
      .post<unknown>(`${this.baseEndpoint}/search`, this.toSearchPayload(normalizedRequest))
      .pipe(map((response) => this.normalizePagedProductResponse(response, normalizedRequest)));
  }

  updateProduct(id: number | string, payload: UpdateProductRequest): Observable<Product> {
    return this.http
      .put<unknown>(`${this.baseEndpoint}/${id}`, this.sanitizeProductPayload(payload))
      .pipe(map((response) => this.normalizeProduct(this.unwrapApiResponse(response))));
  }

  deactivateProduct(id: number | string): Observable<Product> {
    return this.http
      .put<unknown>(`${this.baseEndpoint}/${id}/deactivate`, {})
      .pipe(map((response) => this.normalizeProduct(this.unwrapApiResponse(response))));
  }

  deleteProduct(id: number | string): Observable<void> {
    return this.http.delete<unknown>(`${this.baseEndpoint}/${id}`).pipe(map(() => void 0));
  }

  getLowStockProducts(): Observable<LowStockProduct[]> {
    return this.http
      .get<unknown>(`${this.baseEndpoint}/low-stock`)
      .pipe(map((response) => this.normalizeLowStockCollection(response)));
  }

  private normalizeSearchRequest(request: ProductSearchRequest): Required<ProductSearchRequest> {
    return {
      page: Math.max(Number(request.page ?? 0), 0),
      size: Math.max(Number(request.size ?? 10), 1),
      searchText: request.searchText?.trim() ?? '',
      sku: request.sku?.trim() ?? '',
      barcode: request.barcode?.trim() ?? '',
      category: request.category?.trim() ?? '',
      brand: request.brand?.trim() ?? '',
      isActive: request.isActive ?? null,
      sortBy: request.sortBy?.trim() ?? 'updatedAt',
      sortDirection: request.sortDirection === 'asc' ? 'asc' : 'desc'
    };
  }

  private buildQueryParams(request: Required<ProductSearchRequest>): HttpParams {
    let params = new HttpParams()
      .set('page', request.page)
      .set('size', request.size)
      .set('sortBy', request.sortBy)
      .set('sortDirection', request.sortDirection);

    if (request.searchText) {
      params = params.set('keyword', request.searchText);
    }

    if (request.sku) {
      params = params.set('sku', request.sku);
    }

    if (request.barcode) {
      params = params.set('barcode', request.barcode);
    }

    if (request.category) {
      params = params.set('category', request.category);
    }

    if (request.brand) {
      params = params.set('brand', request.brand);
    }

    if (request.isActive !== null) {
      params = params.set('isActive', String(request.isActive));
    }

    return params;
  }

  private toSearchPayload(request: Required<ProductSearchRequest>): Record<string, unknown> {
    const payload: Record<string, unknown> = {
      page: request.page,
      size: request.size,
      sortBy: request.sortBy,
      sortDirection: request.sortDirection
    };

    if (request.searchText) {
      payload['keyword'] = request.searchText;
      payload['searchText'] = request.searchText;
    }

    if (request.sku) {
      payload['sku'] = request.sku;
    }

    if (request.barcode) {
      payload['barcode'] = request.barcode;
    }

    if (request.category) {
      payload['category'] = request.category;
    }

    if (request.brand) {
      payload['brand'] = request.brand;
    }

    if (request.isActive !== null) {
      payload['isActive'] = request.isActive;
    }

    return payload;
  }

  private sanitizeProductPayload(
    payload: CreateProductRequest | UpdateProductRequest
  ): CreateProductRequest | UpdateProductRequest {
    return {
      sku: payload.sku.trim(),
      name: payload.name.trim(),
      description: payload.description?.trim() || null,
      category: payload.category.trim(),
      brand: payload.brand.trim(),
      unitOfMeasure: payload.unitOfMeasure.trim(),
      costPrice: Number(payload.costPrice),
      sellingPrice: Number(payload.sellingPrice),
      reorderLevel: Number(payload.reorderLevel),
      maxStockLevel: Number(payload.maxStockLevel),
      leadTimeDays: Number(payload.leadTimeDays),
      imageUrl: payload.imageUrl?.trim() || null,
      isActive: payload.isActive ?? true,
      barcode: payload.barcode?.trim() || null
    };
  }

  private normalizePagedProductResponse(
    response: unknown,
    request: Required<ProductSearchRequest>
  ): PagedResponse<Product> {
    const payload = this.unwrapApiResponse(response);

    if (Array.isArray(payload)) {
      return this.paginateProducts(payload.map((item) => this.normalizeProduct(item)), request);
    }

    const record = this.asRecord(payload);
    const source =
      this.readArray(record['content']) ??
      this.readArray(record['items']) ??
      this.readArray(record['products']) ??
      [];

    const content = source.map((item) => this.normalizeProduct(item));
    const totalElements = Number(record['totalElements'] ?? record['totalItems'] ?? content.length);
    const size = Math.max(Number(record['size'] ?? request.size), 1);
    const page = Math.max(Number(record['page'] ?? request.page), 0);
    const totalPages = Math.max(
      Number(record['totalPages'] ?? (Math.ceil(totalElements / size) || 1)),
      1
    );

    return {
      content,
      page,
      size,
      totalElements,
      totalPages,
      first: Boolean(record['first'] ?? page === 0),
      last: Boolean(record['last'] ?? page >= totalPages - 1)
    };
  }

  private normalizeProductCollection(response: unknown): Product[] {
    const payload = this.unwrapApiResponse(response);

    if (Array.isArray(payload)) {
      return payload.map((item) => this.normalizeProduct(item));
    }

    const record = this.asRecord(payload);
    const source =
      this.readArray(record['content']) ??
      this.readArray(record['items']) ??
      this.readArray(record['products']) ??
      [];

    return source.map((item) => this.normalizeProduct(item));
  }

  private normalizeLowStockCollection(response: unknown): LowStockProduct[] {
    const payload = this.unwrapApiResponse(response);

    if (Array.isArray(payload)) {
      return payload.map((item) => this.normalizeLowStockProduct(item));
    }

    const record = this.asRecord(payload);
    const source =
      this.readArray(record['content']) ??
      this.readArray(record['items']) ??
      this.readArray(record['products']) ??
      [];

    return source.map((item) => this.normalizeLowStockProduct(item));
  }

  private paginateProducts(
    products: Product[],
    request: Required<ProductSearchRequest>
  ): PagedResponse<Product> {
    const filtered = this.filterProducts(products, request);
    const sorted = this.sortProducts(filtered, request.sortBy, request.sortDirection);
    const startIndex = request.page * request.size;
    const content = sorted.slice(startIndex, startIndex + request.size);
    const totalPages = Math.max(Math.ceil(sorted.length / request.size), 1);

    return {
      content,
      page: request.page,
      size: request.size,
      totalElements: sorted.length,
      totalPages,
      first: request.page === 0,
      last: request.page >= totalPages - 1
    };
  }

  private filterProducts(products: Product[], request: Required<ProductSearchRequest>): Product[] {
    const keyword = request.searchText.toLowerCase();
    const category = request.category.toLowerCase();
    const brand = request.brand.toLowerCase();
    const sku = request.sku.toLowerCase();
    const barcode = request.barcode.toLowerCase();

    return products.filter((product) => {
      const matchesKeyword =
        !keyword ||
        product.name.toLowerCase().includes(keyword) ||
        product.sku.toLowerCase().includes(keyword) ||
        product.barcode?.toLowerCase().includes(keyword) ||
        product.category.toLowerCase().includes(keyword) ||
        product.brand.toLowerCase().includes(keyword);

      const matchesCategory = !category || product.category.toLowerCase() === category;
      const matchesBrand = !brand || product.brand.toLowerCase() === brand;
      const matchesSku = !sku || product.sku.toLowerCase() === sku;
      const matchesBarcode = !barcode || (product.barcode ?? '').toLowerCase() === barcode;
      const matchesStatus = request.isActive === null || product.isActive === request.isActive;

      return (
        matchesKeyword &&
        matchesCategory &&
        matchesBrand &&
        matchesSku &&
        matchesBarcode &&
        matchesStatus
      );
    });
  }

  private sortProducts(
    products: Product[],
    sortBy: string,
    sortDirection: 'asc' | 'desc'
  ): Product[] {
    const direction = sortDirection === 'asc' ? 1 : -1;

    return [...products].sort((left, right) => {
      const leftValue = this.resolveSortValue(left, sortBy);
      const rightValue = this.resolveSortValue(right, sortBy);

      if (leftValue == null && rightValue == null) {
        return 0;
      }

      if (leftValue == null) {
        return 1;
      }

      if (rightValue == null) {
        return -1;
      }

      if (typeof leftValue === 'number' && typeof rightValue === 'number') {
        return (leftValue - rightValue) * direction;
      }

      return String(leftValue).localeCompare(String(rightValue), undefined, {
        numeric: true,
        sensitivity: 'base'
      }) * direction;
    });
  }

  private resolveSortValue(product: Product, sortBy: string): string | number | boolean | null {
    switch (sortBy) {
      case 'sku':
        return product.sku;
      case 'name':
        return product.name;
      case 'category':
        return product.category;
      case 'brand':
        return product.brand;
      case 'unitOfMeasure':
        return product.unitOfMeasure;
      case 'costPrice':
        return product.costPrice;
      case 'sellingPrice':
        return product.sellingPrice;
      case 'reorderLevel':
        return product.reorderLevel;
      case 'maxStockLevel':
        return product.maxStockLevel;
      case 'leadTimeDays':
        return product.leadTimeDays;
      case 'barcode':
        return product.barcode;
      case 'isActive':
        return product.isActive ? 1 : 0;
      case 'updatedAt':
        return product.updatedAt ?? '';
      default:
        return product.name;
    }
  }

  private normalizeProduct(value: unknown): Product {
    const product = this.asRecord(value as ProductResponse);
    const productId = Number(product['productId'] ?? product['id'] ?? 0);
    const reorderLevel = this.asNumber(product['reorderLevel'] ?? product['reorderPoint']);
    const isActive = this.asBoolean(product['isActive'] ?? product['active']);

    return {
      productId,
      id: productId,
      sku: this.asString(product['sku']),
      name: this.asString(product['name']),
      description: this.asNullableString(product['description']),
      category: this.asString(product['category']),
      brand: this.asString(product['brand']),
      unitOfMeasure: this.asString(product['unitOfMeasure'] ?? 'Piece'),
      costPrice: this.asNumber(product['costPrice']),
      sellingPrice: this.asNumber(product['sellingPrice']),
      reorderLevel,
      reorderPoint: reorderLevel,
      maxStockLevel: this.asNullableNumber(product['maxStockLevel']),
      leadTimeDays: this.asNullableNumber(product['leadTimeDays']),
      imageUrl: this.asNullableString(product['imageUrl']),
      isActive,
      active: isActive,
      barcode: this.asNullableString(product['barcode']),
      createdAt: this.asNullableString(product['createdAt']),
      updatedAt: this.asNullableString(product['updatedAt'])
    };
  }

  private normalizeLowStockProduct(value: unknown): LowStockProduct {
    const product = this.asRecord(value);
    const productId = Number(product['productId'] ?? product['id'] ?? 0);
    const reorderLevel = this.asNumber(product['reorderLevel'] ?? product['reorderPoint']);
    const isActive = this.asBoolean(product['isActive'] ?? product['active']);

    return {
      productId,
      id: productId,
      sku: this.asString(product['sku']),
      name: this.asString(product['name']),
      category: this.asString(product['category']),
      brand: this.asString(product['brand']),
      unitOfMeasure: this.asString(product['unitOfMeasure'] ?? 'Piece'),
      reorderLevel,
      reorderPoint: reorderLevel,
      currentQuantity: this.asNumber(product['currentQuantity']),
      maxStockLevel: this.asNullableNumber(product['maxStockLevel']),
      isActive,
      active: isActive,
      barcode: this.asNullableString(product['barcode'])
    };
  }

  private unwrapApiResponse<T>(response: unknown): T {
    const record = this.asRecord(response);

    if ('data' in record) {
      return record['data'] as T;
    }

    return response as T;
  }

  private asRecord(value: unknown): Record<string, unknown> {
    return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
  }

  private readArray(value: unknown): unknown[] | null {
    return Array.isArray(value) ? value : null;
  }

  private asString(value: unknown): string {
    return typeof value === 'string' ? value.trim() : '';
  }

  private asNullableString(value: unknown): string | null {
    if (typeof value !== 'string') {
      return null;
    }

    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  }

  private asNumber(value: unknown): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  private asNullableNumber(value: unknown): number | null {
    if (value == null || value === '') {
      return null;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  private asBoolean(value: unknown): boolean {
    if (typeof value === 'boolean') {
      return value;
    }

    if (typeof value === 'number') {
      return value > 0;
    }

    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      return normalized === 'true' || normalized === 'active' || normalized === 'yes';
    }

    return false;
  }
}
