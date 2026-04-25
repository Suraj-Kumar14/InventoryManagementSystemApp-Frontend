import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { catchError, forkJoin, map, Observable, of, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { PagedResponse } from '../../../core/models';
import {
  DeadStockResponse,
  GeneratedReportResponse,
  GenerateReportRequest,
  InventorySnapshotResponse,
  InventoryTurnoverResponse,
  LowStockReportResponse,
  PurchaseOrderSummaryResponse,
  ReportDashboardSummary,
  ReportFilterRequest,
  SlowMovingProductResponse,
  StockMovementSummaryResponse,
  TopMovingProductResponse,
  TotalStockValueResponse,
  WarehouseStockValueResponse
} from '../models';

type NormalizedReportFilter = Required<
  Pick<ReportFilterRequest, 'page' | 'size' | 'sortBy' | 'sortDir'>
> &
  Omit<ReportFilterRequest, 'page' | 'size' | 'sortBy' | 'sortDir'>;

@Injectable({ providedIn: 'root' })
export class ReportApiService {
  private readonly http = inject(HttpClient);
  private readonly baseEndpoint = `${environment.apiBaseUrl || environment.apiUrl}/api/v1/reports`;

  takeSnapshot(payload: Record<string, unknown> = {}): Observable<InventorySnapshotResponse> {
    return this.postWithFallback(
      ['/snapshot', '/snapshots', '/inventory-snapshot'],
      payload,
      (response) => this.normalizeInventorySnapshot(this.unwrapApiResponse(response))
    );
  }

  getDashboardSummary(snapshotDate?: string): Observable<ReportDashboardSummary> {
    const params = this.buildSnapshotParams(snapshotDate);

    return this.getWithFallback(
      ['/dashboard-kpis', '/dashboard-summary'],
      params,
      (response) => this.normalizeDashboardSummary(this.unwrapApiResponse(response))
    ).pipe(
      catchError((error) =>
        this.shouldTryFallback(error)
          ? this.buildDashboardSummaryFallback(snapshotDate)
          : throwError(() => error)
      )
    );
  }

  getTotalStockValue(snapshotDate?: string): Observable<TotalStockValueResponse> {
    return this.getWithFallback(
      ['/total-stock-value', '/stock-valuation/total', '/total-value'],
      this.buildSnapshotParams(snapshotDate),
      (response) => this.normalizeTotalStockValue(this.unwrapApiResponse(response))
    );
  }

  getStockValueByWarehouse(snapshotDate?: string): Observable<WarehouseStockValueResponse[]> {
    return this.getWithFallback(
      ['/stock-value-by-warehouse', '/warehouse-stock-value', '/warehouse-value'],
      this.buildSnapshotParams(snapshotDate),
      (response) =>
        this.normalizeCollectionResponse(
          response,
          ['content', 'items', 'warehouses', 'results'],
          (item) => this.normalizeWarehouseStockValue(item)
        )
    );
  }

  getInventoryTurnover(
    filter: ReportFilterRequest = {}
  ): Observable<PagedResponse<InventoryTurnoverResponse>> {
    return this.getWithFallback(
      ['/inventory-turnover', '/turnover'],
      this.buildQueryParams(filter),
      (response) =>
        this.normalizePagedResponse(
          response,
          this.normalizeFilterRequest(filter),
          ['content', 'items', 'turnover', 'results'],
          (item) => this.normalizeInventoryTurnover(item)
        )
    );
  }

  getLowStockReport(
    filter: ReportFilterRequest = {}
  ): Observable<PagedResponse<LowStockReportResponse>> {
    return this.getWithFallback(
      ['/low-stock', '/low-stock-report'],
      this.buildQueryParams(filter),
      (response) =>
        this.normalizePagedResponse(
          response,
          this.normalizeFilterRequest(filter),
          ['content', 'items', 'products', 'results'],
          (item) => this.normalizeLowStockReport(item)
        )
    );
  }

  getStockMovementSummary(
    filter: ReportFilterRequest = {}
  ): Observable<PagedResponse<StockMovementSummaryResponse>> {
    return this.getWithFallback(
      ['/movement-summary', '/stock-movement-summary'],
      this.buildQueryParams(filter),
      (response) =>
        this.normalizePagedResponse(
          response,
          this.normalizeFilterRequest(filter),
          ['content', 'items', 'summaries', 'results'],
          (item) => this.normalizeMovementSummary(item)
        )
    );
  }

  getTopMovingProducts(
    filter: ReportFilterRequest = {}
  ): Observable<PagedResponse<TopMovingProductResponse>> {
    return this.getWithFallback(
      ['/top-moving', '/top-moving-products'],
      this.buildQueryParams(filter),
      (response) =>
        this.normalizePagedResponse(
          response,
          this.normalizeFilterRequest(filter),
          ['content', 'items', 'products', 'results'],
          (item) => this.normalizeTopMovingProduct(item)
        )
    );
  }

  getSlowMovingProducts(
    filter: ReportFilterRequest = {}
  ): Observable<PagedResponse<SlowMovingProductResponse>> {
    return this.getWithFallback(
      ['/slow-moving', '/slow-moving-products'],
      this.buildQueryParams(filter),
      (response) =>
        this.normalizePagedResponse(
          response,
          this.normalizeFilterRequest(filter),
          ['content', 'items', 'products', 'results'],
          (item) => this.normalizeSlowMovingProduct(item)
        )
    );
  }

  getDeadStock(filter: ReportFilterRequest = {}): Observable<PagedResponse<DeadStockResponse>> {
    return this.getWithFallback(
      ['/dead-stock', '/dead-stock-report'],
      this.buildQueryParams(filter),
      (response) =>
        this.normalizePagedResponse(
          response,
          this.normalizeFilterRequest(filter),
          ['content', 'items', 'products', 'results'],
          (item) => this.normalizeDeadStock(item)
        )
    );
  }

  getPOSummary(
    filter: ReportFilterRequest = {}
  ): Observable<PagedResponse<PurchaseOrderSummaryResponse>> {
    return this.getWithFallback(
      ['/purchase-order-summary', '/po-summary', '/supplier-spend-summary'],
      this.buildQueryParams(filter),
      (response) =>
        this.normalizePagedResponse(
          response,
          this.normalizeFilterRequest(filter),
          ['content', 'items', 'summaries', 'results'],
          (item) => this.normalizePurchaseOrderSummary(item)
        )
    );
  }

  generateInventoryReport(payload: GenerateReportRequest): Observable<GeneratedReportResponse> {
    return this.postWithFallback(
      ['/generate', '/export', '/inventory-report'],
      this.sanitizeGenerateRequest(payload),
      (response) => this.normalizeGeneratedReport(this.unwrapApiResponse(response))
    );
  }

  private buildDashboardSummaryFallback(snapshotDate?: string): Observable<ReportDashboardSummary> {
    return forkJoin({
      totalStockValue: this.getTotalStockValue(snapshotDate).pipe(
        catchError(() =>
          of({
            totalStockValue: 0,
            snapshotDate: snapshotDate ?? null
          } as TotalStockValueResponse)
        )
      ),
      warehouseValues: this.getStockValueByWarehouse(snapshotDate).pipe(catchError(() => of([]))),
      lowStock: this.getLowStockReport({ page: 0, size: 5 }).pipe(
        catchError(() => of(this.emptyPaged<LowStockReportResponse>()))
      ),
      deadStock: this.getDeadStock({ page: 0, size: 5 }).pipe(
        catchError(() => of(this.emptyPaged<DeadStockResponse>()))
      ),
      poSummary: this.getPOSummary({ page: 0, size: 10 }).pipe(
        catchError(() => of(this.emptyPaged<PurchaseOrderSummaryResponse>()))
      )
    }).pipe(
      map(({ totalStockValue, warehouseValues, lowStock, deadStock, poSummary }) => {
        const topWarehouse =
          [...warehouseValues].sort(
            (left, right) => right.totalStockValue - left.totalStockValue
          )[0] ?? null;

        return {
          snapshotDate: totalStockValue.snapshotDate ?? snapshotDate ?? null,
          totalStockValue: totalStockValue.totalStockValue,
          lowStockCount: lowStock.totalElements,
          deadStockCount: deadStock.totalElements,
          totalPurchaseOrders: poSummary.content.reduce((total, item) => total + item.totalPOs, 0),
          totalPurchaseSpend: poSummary.content.reduce((total, item) => total + item.totalSpend, 0),
          warehouseCount: warehouseValues.length,
          topWarehouse
        };
      })
    );
  }

  private sanitizeGenerateRequest(payload: GenerateReportRequest): Record<string, unknown> {
    const request: Record<string, unknown> = {
      reportType: payload.reportType,
      type: payload.reportType,
      format: String(payload.format).toUpperCase(),
      requestedBy: payload.requestedBy?.trim() || 'system'
    };

    if (payload.warehouseId != null) {
      request['warehouseId'] = payload.warehouseId;
    }

    if (payload.productId != null) {
      request['productId'] = payload.productId;
    }

    if (payload.supplierId != null) {
      request['supplierId'] = payload.supplierId;
    }

    if (payload.fromDate) {
      request['fromDate'] = payload.fromDate;
      request['startDate'] = payload.fromDate;
    }

    if (payload.toDate) {
      request['toDate'] = payload.toDate;
      request['endDate'] = payload.toDate;
    }

    if (payload.thresholdDays != null) {
      request['thresholdDays'] = payload.thresholdDays;
    }

    return request;
  }

  private buildSnapshotParams(snapshotDate?: string): HttpParams {
    let params = new HttpParams();

    if (snapshotDate) {
      params = params
        .set('snapshotDate', snapshotDate)
        .set('asOfDate', snapshotDate)
        .set('date', snapshotDate);
    }

    return params;
  }

  private normalizeFilterRequest(filter: ReportFilterRequest): NormalizedReportFilter {
    return {
      warehouseId: this.toNullableNumber(filter.warehouseId),
      productId: this.toNullableNumber(filter.productId),
      supplierId: this.toNullableNumber(filter.supplierId),
      fromDate: filter.fromDate?.trim() || '',
      toDate: filter.toDate?.trim() || '',
      thresholdDays: this.toNullableNumber(filter.thresholdDays),
      page: Math.max(Number(filter.page ?? 0), 0),
      size: Math.max(Number(filter.size ?? 20), 1),
      sortBy: filter.sortBy?.trim() || 'createdAt',
      sortDir: filter.sortDir === 'asc' ? 'asc' : 'desc'
    };
  }

  private buildQueryParams(filter: ReportFilterRequest): HttpParams {
    const request = this.normalizeFilterRequest(filter);
    let params = new HttpParams()
      .set('page', request.page)
      .set('size', request.size)
      .set('sortBy', request.sortBy)
      .set('sortDir', request.sortDir)
      .set('sortDirection', request.sortDir);

    if (request.warehouseId != null) {
      params = params.set('warehouseId', request.warehouseId);
    }

    if (request.productId != null) {
      params = params.set('productId', request.productId);
    }

    if (request.supplierId != null) {
      params = params.set('supplierId', request.supplierId);
    }

    if (request.fromDate) {
      params = params.set('fromDate', request.fromDate).set('startDate', request.fromDate);
    }

    if (request.toDate) {
      params = params.set('toDate', request.toDate).set('endDate', request.toDate);
    }

    if (request.thresholdDays != null) {
      params = params.set('thresholdDays', request.thresholdDays);
    }

    return params;
  }

  private getWithFallback<T>(
    paths: string[],
    params: HttpParams,
    normalize: (response: unknown) => T
  ): Observable<T> {
    const [path, ...rest] = paths;

    return this.http.get<unknown>(`${this.baseEndpoint}${path}`, { params }).pipe(
      map((response) => normalize(response)),
      catchError((error) =>
        rest.length && this.shouldTryFallback(error)
          ? this.getWithFallback(rest, params, normalize)
          : throwError(() => error)
      )
    );
  }

  private postWithFallback<T>(
    paths: string[],
    body: unknown,
    normalize: (response: unknown) => T
  ): Observable<T> {
    const [path, ...rest] = paths;

    return this.http.post<unknown>(`${this.baseEndpoint}${path}`, body).pipe(
      map((response) => normalize(response)),
      catchError((error) =>
        rest.length && this.shouldTryFallback(error)
          ? this.postWithFallback(rest, body, normalize)
          : throwError(() => error)
      )
    );
  }

  private normalizePagedResponse<T>(
    response: unknown,
    request: NormalizedReportFilter,
    collectionKeys: string[],
    normalizeItem: (value: unknown) => T
  ): PagedResponse<T> {
    const payload = this.unwrapApiResponse(response);

    if (Array.isArray(payload)) {
      return this.paginateCollection(payload.map((item) => normalizeItem(item)), request);
    }

    const record = this.asRecord(payload);
    const source = this.readArrayFromKeys(record, collectionKeys) ?? [];
    const content = source.map((item) => normalizeItem(item));
    const totalElements = this.asNumber(
      record['totalElements'] ?? record['totalItems'] ?? record['count'] ?? content.length
    );
    const size = Math.max(this.asNumber(record['size'] ?? request.size), 1);
    const page = Math.max(this.asNumber(record['page'] ?? record['number'] ?? request.page), 0);
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

  private normalizeCollectionResponse<T>(
    response: unknown,
    collectionKeys: string[],
    normalizeItem: (value: unknown) => T
  ): T[] {
    const payload = this.unwrapApiResponse(response);

    if (Array.isArray(payload)) {
      return payload.map((item) => normalizeItem(item));
    }

    const record = this.asRecord(payload);
    const source = this.readArrayFromKeys(record, collectionKeys) ?? [];
    return source.map((item) => normalizeItem(item));
  }

  private paginateCollection<T>(
    items: T[],
    request: NormalizedReportFilter
  ): PagedResponse<T> {
    const startIndex = request.page * request.size;
    const content = items.slice(startIndex, startIndex + request.size);
    const totalPages = Math.max(Math.ceil(items.length / request.size), 1);

    return {
      content,
      page: request.page,
      size: request.size,
      totalElements: items.length,
      totalPages,
      first: request.page === 0,
      last: request.page >= totalPages - 1
    };
  }

  private emptyPaged<T>(): PagedResponse<T> {
    return {
      content: [],
      page: 0,
      size: 20,
      totalElements: 0,
      totalPages: 1,
      first: true,
      last: true
    };
  }

  private normalizeInventorySnapshot(value: unknown): InventorySnapshotResponse {
    const snapshot = this.asRecord(value);

    return {
      snapshotId: this.asNumber(snapshot['snapshotId'] ?? snapshot['id']),
      warehouseId: this.asNumber(snapshot['warehouseId']),
      productId: this.asNumber(snapshot['productId']),
      quantity: this.asNumber(snapshot['quantity']),
      stockValue: this.asNumber(snapshot['stockValue']),
      snapshotDate: this.asNullableString(
        snapshot['snapshotDate'] ?? snapshot['date'] ?? snapshot['createdAt']
      ),
      createdAt: this.asNullableString(snapshot['createdAt'] ?? snapshot['timestamp'])
    };
  }

  private normalizeDashboardSummary(value: unknown): ReportDashboardSummary {
    const summary = this.asRecord(value);

    return {
      snapshotDate: this.asNullableString(
        summary['snapshotDate'] ?? summary['asOfDate'] ?? summary['reportDate']
      ),
      totalStockValue: this.asNumber(summary['totalStockValue']),
      lowStockCount: this.asNumber(summary['lowStockCount'] ?? summary['lowStockItems']),
      deadStockCount: this.asNumber(summary['deadStockCount'] ?? summary['deadStockItems']),
      totalPurchaseOrders: this.asNumber(
        summary['totalPurchaseOrders'] ?? summary['openPurchaseOrders'] ?? summary['totalPOs']
      ),
      totalPurchaseSpend: this.asNumber(
        summary['totalPurchaseSpend'] ?? summary['purchaseSpend'] ?? summary['totalSpend']
      ),
      warehouseCount: this.asNumber(summary['warehouseCount'] ?? summary['totalWarehouses']),
      topWarehouse: null
    };
  }

  private normalizeTotalStockValue(value: unknown): TotalStockValueResponse {
    if (typeof value === 'number') {
      return {
        totalStockValue: value,
        snapshotDate: null
      };
    }

    const report = this.asRecord(value);

    return {
      totalStockValue: this.asNumber(report['totalStockValue'] ?? report['stockValue']),
      snapshotDate: this.asNullableString(
        report['snapshotDate'] ?? report['asOfDate'] ?? report['reportDate']
      ),
      totalProducts: this.asNumber(report['totalProducts'] ?? report['productCount']),
      totalQuantity: this.asNumber(report['totalQuantity'] ?? report['quantity']),
      currency: this.asNullableString(report['currency'])
    };
  }

  private normalizeWarehouseStockValue(value: unknown): WarehouseStockValueResponse {
    const report = this.asRecord(value);

    return {
      warehouseId: this.asNumber(report['warehouseId'] ?? report['id']),
      warehouseName: this.asString(report['warehouseName'] ?? report['name']),
      totalStockValue: this.asNumber(report['totalStockValue'] ?? report['stockValue']),
      snapshotDate: this.asNullableString(
        report['snapshotDate'] ?? report['asOfDate'] ?? report['reportDate']
      ),
      totalProducts: this.asNumber(report['totalProducts'] ?? report['productCount']),
      totalQuantity: this.asNumber(report['totalQuantity'] ?? report['quantity']),
      percentageOfTotal: this.asNumber(
        report['percentageOfTotal'] ?? report['shareOfTotal'] ?? report['percentage']
      ),
      utilizationPercent: this.asNumber(
        report['utilizationPercent'] ?? report['utilizationPercentage']
      )
    };
  }

  private normalizeInventoryTurnover(value: unknown): InventoryTurnoverResponse {
    const report = this.asRecord(value);

    return {
      productId: this.asNumber(report['productId'] ?? report['id']),
      productName: this.asString(report['productName'] ?? report['name']),
      turnoverRate: this.asNumber(
        report['turnoverRate'] ?? report['inventoryTurnover'] ?? report['rate']
      ),
      fromDate: this.asNullableString(report['fromDate'] ?? report['startDate']),
      toDate: this.asNullableString(report['toDate'] ?? report['endDate']),
      warehouseId: this.toNullableNumber(report['warehouseId']),
      warehouseName: this.asNullableString(report['warehouseName'])
    };
  }

  private normalizeLowStockReport(value: unknown): LowStockReportResponse {
    const report = this.asRecord(value);

    return {
      productId: this.asNumber(report['productId'] ?? report['id']),
      productName: this.asString(report['productName'] ?? report['name']),
      warehouseId: this.asNumber(report['warehouseId']),
      availableQuantity: this.asNumber(
        report['availableQuantity'] ?? report['currentQuantity'] ?? report['quantity']
      ),
      reorderLevel: this.asNumber(report['reorderLevel'] ?? report['reorderPoint']),
      warehouseName: this.asNullableString(report['warehouseName']),
      sku: this.asNullableString(report['sku'])
    };
  }

  private normalizeMovementSummary(value: unknown): StockMovementSummaryResponse {
    const report = this.asRecord(value);

    return {
      productId: this.asNumber(report['productId'] ?? report['id']),
      warehouseId: this.asNumber(report['warehouseId']),
      stockIn: this.asNumber(report['stockIn']),
      stockOut: this.asNumber(report['stockOut']),
      adjustment: this.asNumber(report['adjustment'] ?? report['adjustments']),
      transferIn: this.asNumber(report['transferIn']),
      transferOut: this.asNumber(report['transferOut']),
      fromDate: this.asNullableString(report['fromDate'] ?? report['startDate']),
      toDate: this.asNullableString(report['toDate'] ?? report['endDate']),
      productName: this.asNullableString(report['productName']),
      warehouseName: this.asNullableString(report['warehouseName'])
    };
  }

  private normalizeTopMovingProduct(value: unknown): TopMovingProductResponse {
    const report = this.asRecord(value);

    return {
      productId: this.asNumber(report['productId'] ?? report['id']),
      productName: this.asString(report['productName'] ?? report['name']),
      totalMovementQuantity: this.asNumber(
        report['totalMovementQuantity'] ??
          report['totalQuantity'] ??
          report['movementQuantity'] ??
          report['totalOutboundQty']
      ),
      rank: this.asNumber(report['rank'] ?? report['position']),
      sku: this.asNullableString(report['sku'])
    };
  }

  private normalizeSlowMovingProduct(value: unknown): SlowMovingProductResponse {
    const report = this.asRecord(value);

    return {
      productId: this.asNumber(report['productId'] ?? report['id']),
      productName: this.asString(report['productName'] ?? report['name']),
      totalMovementQuantity: this.asNumber(
        report['totalMovementQuantity'] ?? report['totalQuantity'] ?? report['movementQuantity']
      ),
      lastMovementDate: this.asNullableString(
        report['lastMovementDate'] ?? report['movementDate']
      ),
      sku: this.asNullableString(report['sku'])
    };
  }

  private normalizeDeadStock(value: unknown): DeadStockResponse {
    const report = this.asRecord(value);

    return {
      productId: this.asNumber(report['productId'] ?? report['id']),
      productName: this.asString(report['productName'] ?? report['name']),
      warehouseId: this.asNumber(report['warehouseId']),
      lastMovementDate: this.asNullableString(
        report['lastMovementDate'] ?? report['movementDate']
      ),
      daysWithoutMovement: this.asNumber(
        report['daysWithoutMovement'] ?? report['daysSinceLastMovement']
      ),
      warehouseName: this.asNullableString(report['warehouseName']),
      sku: this.asNullableString(report['sku']),
      quantity: this.asNumber(report['quantity'] ?? report['currentQuantity']),
      stockValue: this.asNumber(report['stockValue'])
    };
  }

  private normalizePurchaseOrderSummary(value: unknown): PurchaseOrderSummaryResponse {
    const report = this.asRecord(value);

    return {
      supplierId: this.asNumber(report['supplierId']),
      warehouseId: this.asNumber(report['warehouseId']),
      totalPOs: this.asNumber(
        report['totalPOs'] ?? report['poCount'] ?? report['totalPurchaseOrders']
      ),
      totalSpend: this.asNumber(
        report['totalSpend'] ?? report['purchaseSpend'] ?? report['totalAmount']
      ),
      fromDate: this.asNullableString(report['fromDate'] ?? report['startDate']),
      toDate: this.asNullableString(report['toDate'] ?? report['endDate']),
      supplierName: this.asNullableString(report['supplierName']),
      warehouseName: this.asNullableString(report['warehouseName'])
    };
  }

  private normalizeGeneratedReport(value: unknown): GeneratedReportResponse {
    const report = this.asRecord(value);

    return {
      reportType: this.asString(report['reportType'] ?? report['type']),
      format: this.asString(report['format'] ?? report['fileFormat']),
      fileName: this.asString(report['fileName'] ?? report['name']),
      fileUrl: this.asString(report['fileUrl'] ?? report['downloadUrl'] ?? report['url']),
      generatedAt: this.asNullableString(report['generatedAt'] ?? report['createdAt'])
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

  private readArrayFromKeys(record: Record<string, unknown>, keys: string[]): unknown[] | null {
    for (const key of keys) {
      if (Array.isArray(record[key])) {
        return record[key] as unknown[];
      }
    }

    return null;
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

  private toNullableNumber(value: unknown): number | null {
    if (value == null || value === '') {
      return null;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  private shouldTryFallback(error: unknown): boolean {
    const status =
      error && typeof error === 'object' && 'status' in error
        ? Number((error as { status?: number }).status)
        : NaN;

    return status === 0 || status === 404 || status === 405 || status === 501;
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
