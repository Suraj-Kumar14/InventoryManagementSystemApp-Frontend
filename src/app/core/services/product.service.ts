import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LowStockProduct, PagedResponse, Product, ProductRequest } from '../models';

type ActiveFilter = 'ALL' | 'ACTIVE' | 'INACTIVE';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly base = `${environment.apiBaseUrl}${environment.productBasePath}`;

  constructor(private http: HttpClient) {}

  getAll(
    page = 0,
    size = 20,
    search = '',
    category = '',
    brand = '',
    activeFilter: ActiveFilter = 'ALL'
  ): Observable<PagedResponse<Product>> {
    return this.fetchProducts(search, category, brand).pipe(
      map((products) => this.applyClientFilters(products, search, category, brand, activeFilter)),
      map((products) => this.paginate(products, page, size))
    );
  }

  getAllProducts(): Observable<Product[]> {
    return this.http.get<unknown[]>(`${this.base}/all`).pipe(
      map((products) => products.map((product) => this.normalizeProduct(product)))
    );
  }

  getById(productId: number): Observable<Product> {
    return this.http.get<unknown>(`${this.base}/${productId}`).pipe(
      map((product) => this.normalizeProduct(product))
    );
  }

  create(req: ProductRequest): Observable<Product> {
    return this.http.post<unknown>(this.base, this.toProductRequest(req)).pipe(
      map((product) => this.normalizeProduct(product))
    );
  }

  update(productId: number, req: Partial<ProductRequest>): Observable<Product> {
    return this.http.put<unknown>(`${this.base}/${productId}`, this.toProductRequest(req)).pipe(
      map((product) => this.normalizeProduct(product))
    );
  }

  deactivate(productId: number): Observable<Product> {
    return this.http.put<unknown>(`${this.base}/${productId}/deactivate`, {}).pipe(
      map((product) => this.normalizeProduct(product))
    );
  }

  delete(productId: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${productId}`);
  }

  getBySku(sku: string): Observable<Product> {
    return this.http.get<unknown>(`${this.base}/sku/${encodeURIComponent(sku)}`).pipe(
      map((product) => this.normalizeProduct(product))
    );
  }

  getByCategory(category: string): Observable<Product[]> {
    return this.http.get<unknown[]>(`${this.base}/category/${encodeURIComponent(category)}`).pipe(
      map((products) => products.map((product) => this.normalizeProduct(product)))
    );
  }

  getByBrand(brand: string): Observable<Product[]> {
    return this.http.get<unknown[]>(`${this.base}/brand/${encodeURIComponent(brand)}`).pipe(
      map((products) => products.map((product) => this.normalizeProduct(product)))
    );
  }

  getByBarcode(barcode: string): Observable<Product> {
    return this.http.get<unknown>(`${this.base}/barcode/${encodeURIComponent(barcode)}`).pipe(
      map((product) => this.normalizeProduct(product))
    );
  }

  search(keyword: string): Observable<Product[]> {
    const params = new HttpParams().set('keyword', keyword);
    return this.http.get<unknown[]>(`${this.base}/search`, { params }).pipe(
      map((products) => products.map((product) => this.normalizeProduct(product)))
    );
  }

  getLowStock(): Observable<LowStockProduct[]> {
    return this.http.get<unknown[]>(`${this.base}/low-stock`).pipe(
      map((products) => products.map((product) => this.normalizeLowStockProduct(product)))
    );
  }

  private fetchProducts(search: string, category: string, brand: string): Observable<Product[]> {
    const trimmedSearch = search.trim();
    const trimmedCategory = category.trim();
    const trimmedBrand = brand.trim();

    if (trimmedSearch) {
      return this.search(trimmedSearch);
    }

    if (trimmedCategory) {
      return this.getByCategory(trimmedCategory);
    }

    if (trimmedBrand) {
      return this.getByBrand(trimmedBrand);
    }

    return this.getAllProducts();
  }

  private applyClientFilters(
    products: Product[],
    search: string,
    category: string,
    brand: string,
    activeFilter: ActiveFilter
  ): Product[] {
    const normalizedSearch = search.trim().toLowerCase();
    const normalizedCategory = category.trim().toLowerCase();
    const normalizedBrand = brand.trim().toLowerCase();

    return products.filter((product) => {
      const matchesSearch =
        !normalizedSearch ||
        product.name.toLowerCase().includes(normalizedSearch) ||
        product.sku.toLowerCase().includes(normalizedSearch);

      const matchesCategory =
        !normalizedCategory || product.category.toLowerCase() === normalizedCategory;

      const matchesBrand =
        !normalizedBrand || (product.brand ?? '').toLowerCase() === normalizedBrand;

      const matchesActive =
        activeFilter === 'ALL' ||
        (activeFilter === 'ACTIVE' && product.isActive) ||
        (activeFilter === 'INACTIVE' && !product.isActive);

      return matchesSearch && matchesCategory && matchesBrand && matchesActive;
    });
  }

  private paginate(products: Product[], page: number, size: number): PagedResponse<Product> {
    const safeSize = Math.max(size, 1);
    const safePage = Math.max(page, 0);
    const startIndex = safePage * safeSize;
    const content = products.slice(startIndex, startIndex + safeSize);
    const totalPages = Math.max(Math.ceil(products.length / safeSize), 1);

    return {
      content,
      page: safePage,
      size: safeSize,
      totalElements: products.length,
      totalPages,
      first: safePage === 0,
      last: safePage >= totalPages - 1
    };
  }

  private toProductRequest(product: Partial<ProductRequest>): ProductRequest {
    return {
      sku: product.sku?.trim() ?? '',
      name: product.name?.trim() ?? '',
      description: product.description?.trim() || undefined,
      category: product.category?.trim() ?? '',
      brand: product.brand?.trim() || undefined,
      unitOfMeasure: product.unitOfMeasure?.trim() ?? 'Piece',
      costPrice: Number(product.costPrice ?? 0),
      sellingPrice: Number(product.sellingPrice ?? 0),
      reorderLevel: Number(product.reorderLevel ?? 0),
      maxStockLevel: product.maxStockLevel ?? null,
      leadTimeDays: product.leadTimeDays ?? null,
      imageUrl: product.imageUrl?.trim() || null,
      isActive: product.isActive ?? true,
      barcode: product.barcode?.trim() || null
    };
  }

  private normalizeProduct(value: unknown): Product {
    const record = this.asRecord(value);
    const productId = Number(record['productId'] ?? record['id'] ?? 0);
    const reorderLevel = Number(record['reorderLevel'] ?? record['reorderPoint'] ?? 0);
    const isActive = this.asBoolean(record['isActive'] ?? record['active']);

    return {
      productId,
      id: productId,
      sku: this.asString(record['sku']),
      name: this.asString(record['name']),
      description: this.optionalString(record['description']),
      category: this.asString(record['category']),
      brand: this.optionalString(record['brand']),
      unitOfMeasure: this.asString(record['unitOfMeasure'] ?? 'Piece'),
      costPrice: Number(record['costPrice'] ?? 0),
      sellingPrice: Number(record['sellingPrice'] ?? 0),
      reorderLevel,
      reorderPoint: reorderLevel,
      maxStockLevel: this.asNullableNumber(record['maxStockLevel']),
      leadTimeDays: this.asNullableNumber(record['leadTimeDays']),
      imageUrl: this.optionalString(record['imageUrl']) ?? null,
      isActive,
      active: isActive,
      barcode: this.optionalString(record['barcode']) ?? null,
      createdAt: this.optionalString(record['createdAt']),
      updatedAt: this.optionalString(record['updatedAt'])
    };
  }

  private normalizeLowStockProduct(value: unknown): LowStockProduct {
    const record = this.asRecord(value);
    const productId = Number(record['productId'] ?? record['id'] ?? 0);
    const reorderLevel = Number(record['reorderLevel'] ?? record['reorderPoint'] ?? 0);
    const isActive = this.asBoolean(record['isActive'] ?? record['active']);

    return {
      productId,
      id: productId,
      sku: this.asString(record['sku']),
      name: this.asString(record['name']),
      category: this.asString(record['category']),
      brand: this.optionalString(record['brand']),
      unitOfMeasure: this.asString(record['unitOfMeasure'] ?? 'Piece'),
      reorderLevel,
      reorderPoint: reorderLevel,
      currentQuantity: Number(record['currentQuantity'] ?? 0),
      isActive,
      active: isActive,
      barcode: this.optionalString(record['barcode']) ?? null
    };
  }

  private asRecord(value: unknown): Record<string, unknown> {
    return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
  }

  private asString(value: unknown): string {
    return typeof value === 'string' ? value : '';
  }

  private optionalString(value: unknown): string | undefined {
    return typeof value === 'string' && value.trim() ? value : undefined;
  }

  private asBoolean(value: unknown): boolean {
    return value === true || value === 'true';
  }

  private asNullableNumber(value: unknown): number | null {
    return typeof value === 'number' ? value : null;
  }
}
