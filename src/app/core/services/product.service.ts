import { Injectable, inject } from '@angular/core';
import { forkJoin, map, Observable, of, switchMap } from 'rxjs';
import {
  CreateProductRequest,
  LowStockProduct as FeatureLowStockProduct,
  PagedResponse as FeaturePagedResponse,
  Product as FeatureProduct,
  ProductSearchRequest as FeatureProductSearchRequest
} from '../../features/products/models';
import { ProductApiService } from '../../features/products/services/product-api.service';
import { LowStockProduct, PagedResponse, Product, ProductRequest } from '../models';

type ActiveFilter = 'ALL' | 'ACTIVE' | 'INACTIVE';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly productApi = inject(ProductApiService);

  getAll(
    page = 0,
    size = 20,
    search = '',
    category = '',
    brand = '',
    activeFilter: ActiveFilter = 'ALL'
  ): Observable<PagedResponse<Product>> {
    const request: FeatureProductSearchRequest = {
      page,
      size,
      searchText: search,
      category,
      brand,
      isActive:
        activeFilter === 'ALL' ? null : activeFilter === 'ACTIVE',
      sortBy: 'updatedAt',
      sortDirection: 'desc'
    };

    const source = this.hasFilters(request)
      ? this.productApi.searchProducts(request)
      : this.productApi.getAllProducts(request);

    return source.pipe(
      map((response) => this.toPagedResponse(response))
    );
  }

  getAllProducts(): Observable<Product[]> {
    const request: FeatureProductSearchRequest = {
      page: 0,
      size: 200,
      sortBy: 'name',
      sortDirection: 'asc'
    };

    return this.collectAllPages(request, (params) => this.productApi.getAllProducts(params));
  }

  getById(productId: number): Observable<Product> {
    return this.productApi
      .getProductById(productId)
      .pipe(map((product) => this.toProduct(product)));
  }

  create(req: ProductRequest): Observable<Product> {
    return this.productApi
      .createProduct(this.toRequest(req))
      .pipe(map((product) => this.toProduct(product)));
  }

  update(productId: number, req: Partial<ProductRequest>): Observable<Product> {
    return this.productApi
      .updateProduct(productId, this.toRequest(req))
      .pipe(map((product) => this.toProduct(product)));
  }

  deactivate(productId: number): Observable<Product> {
    return this.productApi
      .deactivateProduct(productId)
      .pipe(map((product) => this.toProduct(product)));
  }

  delete(productId: number): Observable<void> {
    return this.productApi.deleteProduct(productId);
  }

  getBySku(sku: string): Observable<Product> {
    return this.productApi
      .getProductBySku(sku)
      .pipe(map((product) => this.toProduct(product)));
  }

  getByCategory(category: string): Observable<Product[]> {
    return this.productApi.getProductsByCategory(category).pipe(
      map((products) => products.map((product) => this.toProduct(product)))
    );
  }

  getByBrand(brand: string): Observable<Product[]> {
    return this.productApi.getProductsByBrand(brand).pipe(
      map((products) => products.map((product) => this.toProduct(product)))
    );
  }

  getByBarcode(barcode: string): Observable<Product> {
    return this.productApi
      .getProductByBarcode(barcode)
      .pipe(map((product) => this.toProduct(product)));
  }

  search(keyword: string): Observable<Product[]> {
    const request: FeatureProductSearchRequest = {
      page: 0,
      size: 200,
      searchText: keyword,
      sortBy: 'name',
      sortDirection: 'asc'
    };

    return this.collectAllPages(request, (params) => this.productApi.searchProducts(params));
  }

  getLowStock(): Observable<LowStockProduct[]> {
    return this.productApi.getLowStockProducts().pipe(
      map((products) => products.map((product) => this.toLowStockProduct(product)))
    );
  }

  private collectAllPages(
    initialRequest: FeatureProductSearchRequest,
    fetchPage: (
      request: FeatureProductSearchRequest
    ) => Observable<FeaturePagedResponse<FeatureProduct>>
  ): Observable<Product[]> {
    return fetchPage(initialRequest).pipe(
      switchMap((firstPage) => {
        if (firstPage.totalPages <= 1) {
          return of(firstPage.content.map((product) => this.toProduct(product)));
        }

        const requests = Array.from({ length: firstPage.totalPages - 1 }, (_, index) =>
          fetchPage({ ...initialRequest, page: index + 1 })
        );

        return forkJoin(requests).pipe(
          map((remainingPages) =>
            [firstPage, ...remainingPages]
              .flatMap((page) => page.content)
              .map((product) => this.toProduct(product))
          )
        );
      })
    );
  }

  private hasFilters(request: FeatureProductSearchRequest): boolean {
    return Boolean(
      request.searchText?.trim() ||
        request.category?.trim() ||
        request.brand?.trim() ||
        request.isActive !== null
    );
  }

  private toRequest(product: Partial<ProductRequest>): CreateProductRequest {
    return {
      sku: product.sku?.trim() ?? '',
      name: product.name?.trim() ?? '',
      description: product.description?.trim() || null,
      category: product.category?.trim() ?? '',
      brand: product.brand?.trim() ?? '',
      unitOfMeasure: product.unitOfMeasure?.trim() ?? 'Piece',
      costPrice: Number(product.costPrice ?? 0),
      sellingPrice: Number(product.sellingPrice ?? 0),
      reorderLevel: Number(product.reorderLevel ?? 0),
      maxStockLevel: Number(product.maxStockLevel ?? 0),
      leadTimeDays: Number(product.leadTimeDays ?? 0),
      imageUrl: product.imageUrl?.trim() || null,
      isActive: product.isActive ?? true,
      barcode: product.barcode?.trim() || null
    };
  }

  private toPagedResponse(response: FeaturePagedResponse<FeatureProduct>): PagedResponse<Product> {
    return {
      content: response.content.map((product) => this.toProduct(product)),
      page: response.page,
      size: response.size,
      totalElements: response.totalElements,
      totalPages: response.totalPages,
      first: response.first,
      last: response.last
    };
  }

  private toProduct(product: FeatureProduct): Product {
    return {
      productId: product.productId,
      id: product.id,
      sku: product.sku,
      name: product.name,
      description: product.description ?? undefined,
      category: product.category,
      brand: product.brand || undefined,
      unitOfMeasure: product.unitOfMeasure,
      costPrice: product.costPrice,
      sellingPrice: product.sellingPrice,
      reorderLevel: product.reorderLevel,
      reorderPoint: product.reorderPoint,
      maxStockLevel: product.maxStockLevel,
      leadTimeDays: product.leadTimeDays,
      imageUrl: product.imageUrl,
      isActive: product.isActive,
      active: product.active,
      barcode: product.barcode,
      createdAt: product.createdAt ?? undefined,
      updatedAt: product.updatedAt ?? undefined
    };
  }

  private toLowStockProduct(product: FeatureLowStockProduct): LowStockProduct {
    return {
      productId: product.productId,
      id: product.id,
      sku: product.sku,
      name: product.name,
      category: product.category,
      brand: product.brand || undefined,
      unitOfMeasure: product.unitOfMeasure,
      reorderLevel: product.reorderLevel,
      reorderPoint: product.reorderPoint,
      currentQuantity: product.currentQuantity,
      isActive: product.isActive,
      active: product.active,
      barcode: product.barcode
    };
  }
}
