import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map, of, switchMap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  LowStockItem,
  PagedResponse,
  ReleaseReservationRequest,
  ReserveStockRequest,
  StockAdjustRequest,
  StockLevel,
  StockTransferRequest,
  TransferStockResponse,
  UpdateStockRequest
} from '../models';
import { WarehouseService } from './warehouse.service';

@Injectable({ providedIn: 'root' })
export class StockService {
  private readonly http = inject(HttpClient);
  private readonly warehouseService = inject(WarehouseService);
  private readonly base = `${environment.apiUrl}/api/v1/stock`;

  getAll(
    page = 0,
    size = 20,
    warehouseId?: number,
    productId?: number,
    sortBy = 'lastUpdated',
    sortDir: 'asc' | 'desc' = 'desc'
  ): Observable<PagedResponse<StockLevel>> {
    if (warehouseId && productId) {
      return this.getStockLevel(warehouseId, productId).pipe(
        map((stock) => this.paginateStocks([stock], page, size, sortBy, sortDir))
      );
    }

    if (warehouseId) {
      return this.getByWarehouse(warehouseId, page, size, sortBy, sortDir);
    }

    if (productId) {
      return this.getByProduct(productId, page, size, sortBy, sortDir);
    }

    return this.getAggregatedStock(page, size, sortBy, sortDir);
  }

  getStockLevel(warehouseId: number, productId: number): Observable<StockLevel> {
    const params = new HttpParams()
      .set('warehouseId', warehouseId)
      .set('productId', productId);

    return this.http
      .get<unknown>(`${this.base}/level`, { params })
      .pipe(map((response) => this.normalizeStockLevel(this.unwrapApiResponse(response))));
  }

  updateStock(payload: UpdateStockRequest): Observable<StockLevel> {
    return this.http
      .put<unknown>(`${this.base}/update`, this.sanitizeStockPayload(payload))
      .pipe(map((response) => this.normalizeStockLevel(this.unwrapApiResponse(response))));
  }

  reserveStock(payload: ReserveStockRequest): Observable<StockLevel> {
    return this.http
      .post<unknown>(`${this.base}/reserve`, this.sanitizeQuantityPayload(payload))
      .pipe(map((response) => this.normalizeStockLevel(this.unwrapApiResponse(response))));
  }

  releaseReservation(payload: ReleaseReservationRequest): Observable<StockLevel> {
    return this.http
      .post<unknown>(`${this.base}/release`, this.sanitizeQuantityPayload(payload))
      .pipe(map((response) => this.normalizeStockLevel(this.unwrapApiResponse(response))));
  }

  transfer(payload: StockTransferRequest): Observable<TransferStockResponse> {
    return this.http
      .post<unknown>(`${this.base}/transfer`, this.sanitizeTransferPayload(payload))
      .pipe(map((response) => this.normalizeTransferResponse(this.unwrapApiResponse(response))));
  }

  adjust(payload: StockAdjustRequest): Observable<StockLevel> {
    return this.getStockLevel(payload.warehouseId, payload.productId).pipe(
      switchMap((currentStock) => {
        const currentQuantity = Number(currentStock.quantity ?? 0);
        const requestedQuantity = Number(payload.newQuantity ?? 0);
        let nextQuantity = requestedQuantity;

        if (payload.adjustmentType === 'INCREASE') {
          nextQuantity = currentQuantity + requestedQuantity;
        }

        if (payload.adjustmentType === 'DECREASE') {
          nextQuantity = currentQuantity - requestedQuantity;
        }

        if (nextQuantity < 0) {
          return throwError(() => new Error('Adjustment would result in negative stock.'));
        }

        return this.updateStock({
          warehouseId: payload.warehouseId,
          productId: payload.productId,
          quantity: nextQuantity,
          unitCost: payload.unitCost ?? null,
          referenceId: payload.referenceId ?? null,
          referenceType: 'ADJUSTMENT',
          notes: payload.reason
        });
      })
    );
  }

  getByWarehouse(
    warehouseId: number,
    page = 0,
    size = 20,
    sortBy = 'lastUpdated',
    sortDir: 'asc' | 'desc' = 'desc'
  ): Observable<PagedResponse<StockLevel>> {
    return this.http
      .get<unknown>(
        `${this.base}/warehouse/${warehouseId}`,
        { params: this.buildPagingParams(page, size, sortBy, sortDir) }
      )
      .pipe(map((response) => this.normalizePagedStocks(response, page, size)));
  }

  getByProduct(
    productId: number,
    page = 0,
    size = 20,
    sortBy = 'lastUpdated',
    sortDir: 'asc' | 'desc' = 'desc'
  ): Observable<PagedResponse<StockLevel>> {
    return this.http
      .get<unknown>(
        `${this.base}/product/${productId}`,
        { params: this.buildPagingParams(page, size, sortBy, sortDir) }
      )
      .pipe(map((response) => this.normalizePagedStocks(response, page, size)));
  }

  getLowStock(page = 0, size = 20): Observable<PagedResponse<LowStockItem>> {
    const params = new HttpParams().set('page', page).set('size', size);

    return this.http
      .get<unknown>(`${this.base}/low-stock`, { params })
      .pipe(map((response) => this.normalizePagedLowStock(response, page, size)));
  }

  getLowStockItems(page = 0, size = 20): Observable<PagedResponse<LowStockItem>> {
    return this.getLowStock(page, size);
  }

  private getAggregatedStock(
    page: number,
    size: number,
    sortBy: string,
    sortDir: 'asc' | 'desc'
  ): Observable<PagedResponse<StockLevel>> {
    return this.warehouseService.getAll(0, 200, 'name', 'asc').pipe(
      switchMap((warehousePage) => {
        const warehouses = warehousePage.content;

        if (!warehouses.length) {
          return of(this.paginateStocks([], page, size, sortBy, sortDir));
        }

        const requests = warehouses.map((warehouse) =>
          this.collectWarehouseStocks(warehouse.id).pipe(
            map((stocks) =>
              stocks.map((stock) => ({
                ...stock,
                warehouseName: stock.warehouseName ?? warehouse.name
              }))
            )
          )
        );

        return forkJoin(requests).pipe(
          map((stockPages) =>
            this.paginateStocks(stockPages.flat(), page, size, sortBy, sortDir)
          )
        );
      })
    );
  }

  private collectWarehouseStocks(warehouseId: number): Observable<StockLevel[]> {
    return this.getByWarehouse(warehouseId, 0, 200, 'lastUpdated', 'desc').pipe(
      switchMap((firstPage) => {
        if (firstPage.totalPages <= 1) {
          return of(firstPage.content);
        }

        const requests = Array.from(
          { length: firstPage.totalPages - 1 },
          (_, index) => this.getByWarehouse(warehouseId, index + 1, 200, 'lastUpdated', 'desc')
        );

        return forkJoin(requests).pipe(
          map((pages) => [firstPage, ...pages].flatMap((stockPage) => stockPage.content))
        );
      })
    );
  }

  private buildPagingParams(
    page: number,
    size: number,
    sortBy: string,
    sortDir: 'asc' | 'desc'
  ): HttpParams {
    return new HttpParams()
      .set('page', page)
      .set('size', size)
      .set('sortBy', sortBy)
      .set('sortDir', sortDir);
  }

  private sanitizeStockPayload(payload: UpdateStockRequest): UpdateStockRequest {
    return {
      warehouseId: Number(payload.warehouseId),
      productId: Number(payload.productId),
      quantity: Math.max(Number(payload.quantity ?? 0), 0),
      unitCost: this.asNullableNumber(payload.unitCost),
      referenceId: this.asNullableString(payload.referenceId),
      referenceType: this.asNullableString(payload.referenceType),
      notes: this.asNullableString(payload.notes)
    };
  }

  private sanitizeQuantityPayload<T extends ReserveStockRequest | ReleaseReservationRequest>(
    payload: T
  ): T {
    return {
      ...payload,
      warehouseId: Number(payload.warehouseId),
      productId: Number(payload.productId),
      quantity: Math.max(Number(payload.quantity ?? 0), 0),
      referenceId: this.asNullableString(payload.referenceId),
      referenceType: this.asNullableString(payload.referenceType),
      notes: this.asNullableString(payload.notes)
    };
  }

  private sanitizeTransferPayload(payload: StockTransferRequest): StockTransferRequest {
    return {
      sourceWarehouseId: Number(payload.sourceWarehouseId),
      destinationWarehouseId: Number(payload.destinationWarehouseId),
      productId: Number(payload.productId),
      quantity: Math.max(Number(payload.quantity ?? 0), 0),
      referenceId: this.asNullableString(payload.referenceId),
      referenceType: this.asNullableString(payload.referenceType),
      unitCost: this.asNullableNumber(payload.unitCost),
      notes: this.asNullableString(payload.notes)
    };
  }

  private normalizePagedStocks(
    response: unknown,
    fallbackPage: number,
    fallbackSize: number
  ): PagedResponse<StockLevel> {
    const payload = this.unwrapApiResponse(response);

    if (Array.isArray(payload)) {
      return this.paginateStocks(
        payload.map((item) => this.normalizeStockLevel(item)),
        fallbackPage,
        fallbackSize,
        'lastUpdated',
        'desc'
      );
    }

    const record = this.asRecord(payload);
    const source =
      this.readArray(record['content']) ??
      this.readArray(record['items']) ??
      this.readArray(record['stockLevels']) ??
      [];

    const content = source.map((item) => this.normalizeStockLevel(item));
    const totalElements = this.asNumber(record['totalElements'] ?? record['totalItems'] ?? content.length);
    const size = Math.max(this.asNumber(record['size'] ?? fallbackSize), 1);
    const page = Math.max(this.asNumber(record['page'] ?? record['number'] ?? fallbackPage), 0);
    const totalPages = Math.max(
      this.asNumber(record['totalPages'] ?? Math.ceil((totalElements || content.length) / size)),
      1
    );

    return {
      content,
      page,
      size,
      totalElements,
      totalPages,
      first: this.asBoolean(record['first'], page === 0),
      last: this.asBoolean(record['last'], page >= totalPages - 1)
    };
  }

  private normalizePagedLowStock(
    response: unknown,
    fallbackPage: number,
    fallbackSize: number
  ): PagedResponse<LowStockItem> {
    const payload = this.unwrapApiResponse(response);

    if (Array.isArray(payload)) {
      return this.paginateLowStock(
        payload.map((item) => this.normalizeLowStockItem(item)),
        fallbackPage,
        fallbackSize
      );
    }

    const record = this.asRecord(payload);
    const source =
      this.readArray(record['content']) ??
      this.readArray(record['items']) ??
      this.readArray(record['stockLevels']) ??
      this.readArray(record['products']) ??
      [];

    const content = source.map((item) => this.normalizeLowStockItem(item));
    const totalElements = this.asNumber(record['totalElements'] ?? record['totalItems'] ?? content.length);
    const size = Math.max(this.asNumber(record['size'] ?? fallbackSize), 1);
    const page = Math.max(this.asNumber(record['page'] ?? record['number'] ?? fallbackPage), 0);
    const totalPages = Math.max(
      this.asNumber(record['totalPages'] ?? Math.ceil((totalElements || content.length) / size)),
      1
    );

    return {
      content,
      page,
      size,
      totalElements,
      totalPages,
      first: this.asBoolean(record['first'], page === 0),
      last: this.asBoolean(record['last'], page >= totalPages - 1)
    };
  }

  private paginateStocks(
    stocks: StockLevel[],
    page: number,
    size: number,
    sortBy = 'lastUpdated',
    sortDir: 'asc' | 'desc' = 'desc'
  ): PagedResponse<StockLevel> {
    const safePage = Math.max(page, 0);
    const safeSize = Math.max(size, 1);
    const sorted = this.sortStocks(stocks, sortBy, sortDir);
    const startIndex = safePage * safeSize;
    const content = sorted.slice(startIndex, startIndex + safeSize);
    const totalPages = Math.max(Math.ceil(sorted.length / safeSize), 1);

    return {
      content,
      page: safePage,
      size: safeSize,
      totalElements: sorted.length,
      totalPages,
      first: safePage === 0,
      last: safePage >= totalPages - 1
    };
  }

  private paginateLowStock(
    items: LowStockItem[],
    page: number,
    size: number
  ): PagedResponse<LowStockItem> {
    const safePage = Math.max(page, 0);
    const safeSize = Math.max(size, 1);
    const startIndex = safePage * safeSize;
    const content = items.slice(startIndex, startIndex + safeSize);
    const totalPages = Math.max(Math.ceil(items.length / safeSize), 1);

    return {
      content,
      page: safePage,
      size: safeSize,
      totalElements: items.length,
      totalPages,
      first: safePage === 0,
      last: safePage >= totalPages - 1
    };
  }

  private sortStocks(
    stocks: StockLevel[],
    sortBy: string,
    sortDir: 'asc' | 'desc'
  ): StockLevel[] {
    const direction = sortDir === 'asc' ? 1 : -1;

    return [...stocks].sort((left, right) => {
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

  private resolveSortValue(stock: StockLevel, sortBy: string): string | number | null {
    switch (sortBy) {
      case 'productId':
        return stock.productId;
      case 'warehouseId':
        return stock.warehouseId;
      case 'quantity':
        return stock.quantity;
      case 'reservedQuantity':
        return stock.reservedQuantity;
      case 'availableQuantity':
        return stock.availableQuantity;
      case 'location':
        return stock.location ?? '';
      case 'lastUpdated':
        return stock.lastUpdated;
      default:
        return stock.lastUpdated;
    }
  }

  private normalizeStockLevel(value: unknown): StockLevel {
    const stock = this.asRecord(value);
    const stockId = this.asNumber(stock['stockId'] ?? stock['id']);
    const quantity = this.asNumber(stock['quantity']);
    const reservedQuantity = this.asNumber(stock['reservedQuantity']);
    const reorderLevel = this.asNullableNumber(stock['reorderLevel'] ?? stock['reorderPoint']);

    return {
      stockId,
      id: stockId,
      warehouseId: this.asNumber(stock['warehouseId']),
      productId: this.asNumber(stock['productId']),
      quantity,
      reservedQuantity,
      availableQuantity: this.asNumber(
        stock['availableQuantity'] ?? quantity - reservedQuantity
      ),
      location: this.asNullableString(stock['location']),
      lastUpdated: this.asString(stock['lastUpdated'] ?? stock['updatedAt']),
      createdAt: this.asNullableString(stock['createdAt']) ?? undefined,
      updatedAt: this.asNullableString(stock['updatedAt']) ?? undefined,
      productName: this.asNullableString(stock['productName']) ?? undefined,
      sku: this.asNullableString(stock['sku']) ?? undefined,
      warehouseName: this.asNullableString(stock['warehouseName']) ?? undefined,
      reorderLevel: reorderLevel ?? undefined,
      reorderPoint: reorderLevel ?? undefined,
      stockValue: this.asNullableNumber(stock['stockValue']) ?? undefined
    };
  }

  private normalizeLowStockItem(value: unknown): LowStockItem {
    const item = this.asRecord(value);
    const quantity = this.asNumber(item['quantity'] ?? item['currentQuantity']);
    const reservedQuantity = this.asNumber(item['reservedQuantity']);
    const reorderLevel = this.asNullableNumber(item['reorderLevel'] ?? item['reorderPoint']);

    return {
      warehouseId: this.asNumber(item['warehouseId']),
      productId: this.asNumber(item['productId']),
      quantity,
      reservedQuantity,
      availableQuantity: this.asNumber(
        item['availableQuantity'] ?? quantity - reservedQuantity
      ),
      location: this.asNullableString(item['location']),
      productName: this.asNullableString(item['productName'] ?? item['name']) ?? undefined,
      sku: this.asNullableString(item['sku']) ?? undefined,
      warehouseName: this.asNullableString(item['warehouseName']) ?? undefined,
      reorderLevel: reorderLevel ?? undefined,
      reorderPoint: reorderLevel ?? undefined
    };
  }

  private normalizeTransferResponse(value: unknown): TransferStockResponse {
    const response = this.asRecord(value);

    return {
      productId: this.asNumber(response['productId']),
      sourceWarehouseId: this.asNumber(response['sourceWarehouseId']),
      destinationWarehouseId: this.asNumber(response['destinationWarehouseId']),
      transferredQuantity: this.asNumber(
        response['transferredQuantity'] ?? response['quantity']
      ),
      sourceBalance: this.asNumber(response['sourceBalance']),
      destinationBalance: this.asNumber(response['destinationBalance']),
      message: this.asString(response['message'] ?? 'Stock transferred successfully.')
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

  private asBoolean(value: unknown, fallback = false): boolean {
    if (typeof value === 'boolean') {
      return value;
    }

    if (typeof value === 'number') {
      return value > 0;
    }

    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      return normalized === 'true' || normalized === 'yes' || normalized === 'active';
    }

    return fallback;
  }
}
