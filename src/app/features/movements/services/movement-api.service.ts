import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  MovementResponse,
  MovementSearchRequest,
  MovementType,
  PagedResponse,
  StockMovement
} from '../models';
import { sortMovementsByDate } from '../movement.utils';

@Injectable({ providedIn: 'root' })
export class MovementApiService {
  private readonly http = inject(HttpClient);
  private readonly baseEndpoint = `${environment.apiBaseUrl}/api/v1/movements`;

  getAllMovements(params: MovementSearchRequest = {}): Observable<PagedResponse<StockMovement>> {
    const request = this.normalizeSearchRequest(params);

    return this.http
      .get<unknown>(this.baseEndpoint, { params: this.buildQueryParams(request) })
      .pipe(map((response) => this.normalizePagedMovements(response, request)));
  }

  getByProduct(productId: number | string): Observable<StockMovement[]> {
    return this.getAllMovements({
      page: 0,
      size: 500,
      productId: Number(productId),
      sortBy: 'movementDate',
      sortDirection: 'desc'
    }).pipe(map((response) => response.content));
  }

  getByWarehouse(warehouseId: number | string): Observable<StockMovement[]> {
    return this.getAllMovements({
      page: 0,
      size: 500,
      warehouseId: Number(warehouseId),
      sortBy: 'movementDate',
      sortDirection: 'desc'
    }).pipe(map((response) => response.content));
  }

  getByType(movementType: MovementType): Observable<StockMovement[]> {
    return this.getAllMovements({
      page: 0,
      size: 500,
      movementType,
      sortBy: 'movementDate',
      sortDirection: 'desc'
    }).pipe(map((response) => response.content));
  }

  getByReference(referenceId: string): Observable<StockMovement[]> {
    return this.getAllMovements({
      page: 0,
      size: 500,
      referenceId,
      sortBy: 'movementDate',
      sortDirection: 'desc'
    }).pipe(map((response) => response.content));
  }

  getByDateRange(startDate: string, endDate: string): Observable<StockMovement[]> {
    return this.getAllMovements({
      page: 0,
      size: 500,
      startDate,
      endDate,
      sortBy: 'movementDate',
      sortDirection: 'desc'
    }).pipe(map((response) => response.content));
  }

  getMovementHistory(
    productId?: number | null,
    warehouseId?: number | null
  ): Observable<StockMovement[]> {
    let params = new HttpParams();

    if (productId != null) {
      params = params.set('productId', productId);
    }

    if (warehouseId != null) {
      params = params.set('warehouseId', warehouseId);
    }

    return this.http.get<unknown>(`${this.baseEndpoint}/history`, { params }).pipe(
      map((response) => sortMovementsByDate(this.normalizeMovementCollection(response), 'asc')),
      catchError(() =>
        this.getAllMovements({
          page: 0,
          size: 500,
          productId: productId ?? null,
          warehouseId: warehouseId ?? null,
          sortBy: 'movementDate',
          sortDirection: 'asc'
        }).pipe(map((response) => sortMovementsByDate(response.content, 'asc')))
      )
    );
  }

  getStockIn(productId: number | string): Observable<number> {
    const numericProductId = Number(productId);

    return this.http.get<unknown>(`${this.baseEndpoint}/stock-in/${numericProductId}`).pipe(
      map((response) => this.normalizeSummaryValue(response, ['totalStockIn', 'stockInTotal', 'total'])),
      catchError(() =>
        this.getByProduct(numericProductId).pipe(
          map((movements) =>
            movements
              .filter((movement) => movement.movementType === 'STOCK_IN')
              .reduce((total, movement) => total + Math.abs(movement.quantity), 0)
          )
        )
      )
    );
  }

  getStockOut(productId: number | string): Observable<number> {
    const numericProductId = Number(productId);

    return this.http.get<unknown>(`${this.baseEndpoint}/stock-out/${numericProductId}`).pipe(
      map((response) =>
        this.normalizeSummaryValue(response, ['totalStockOut', 'stockOutTotal', 'total'])
      ),
      catchError(() =>
        this.getByProduct(numericProductId).pipe(
          map((movements) =>
            movements
              .filter((movement) => movement.movementType === 'STOCK_OUT')
              .reduce((total, movement) => total + Math.abs(movement.quantity), 0)
          )
        )
      )
    );
  }

  searchMovements(payload: MovementSearchRequest): Observable<PagedResponse<StockMovement>> {
    const request = this.normalizeSearchRequest(payload);

    return this.http
      .post<unknown>(`${this.baseEndpoint}/search`, this.toSearchPayload(request))
      .pipe(
        map((response) => this.normalizePagedMovements(response, request)),
        catchError(() => this.getAllMovements(request))
      );
  }

  getMovementById(id: number | string): Observable<StockMovement> {
    return this.http
      .get<unknown>(`${this.baseEndpoint}/${id}`)
      .pipe(map((response) => this.normalizeMovement(this.unwrapApiResponse(response))));
  }

  private normalizeSearchRequest(request: MovementSearchRequest): Required<MovementSearchRequest> {
    return {
      page: Math.max(Number(request.page ?? 0), 0),
      size: Math.max(Number(request.size ?? 20), 1),
      productId: this.normalizeNullableNumber(request.productId),
      warehouseId: this.normalizeNullableNumber(request.warehouseId),
      movementType: this.normalizeMovementTypeFilter(request.movementType),
      referenceId: request.referenceId?.trim() ?? '',
      startDate: request.startDate?.trim() ?? '',
      endDate: request.endDate?.trim() ?? '',
      sortBy: request.sortBy?.trim() ?? 'movementDate',
      sortDirection: request.sortDirection === 'asc' ? 'asc' : 'desc'
    };
  }

  private buildQueryParams(request: Required<MovementSearchRequest>): HttpParams {
    let params = new HttpParams()
      .set('page', request.page)
      .set('size', request.size)
      .set('sortBy', request.sortBy)
      .set('sortDirection', request.sortDirection)
      .set('sortDir', request.sortDirection);

    if (request.productId != null) {
      params = params.set('productId', request.productId);
    }

    if (request.warehouseId != null) {
      params = params.set('warehouseId', request.warehouseId);
    }

    if (request.movementType) {
      params = params.set('movementType', request.movementType);
    }

    if (request.referenceId) {
      params = params.set('referenceId', request.referenceId);
    }

    if (request.startDate) {
      params = params.set('startDate', request.startDate).set('fromDate', request.startDate);
    }

    if (request.endDate) {
      params = params.set('endDate', request.endDate).set('toDate', request.endDate);
    }

    return params;
  }

  private toSearchPayload(request: Required<MovementSearchRequest>): Record<string, unknown> {
    const payload: Record<string, unknown> = {
      page: request.page,
      size: request.size,
      sortBy: request.sortBy,
      sortDirection: request.sortDirection,
      sortDir: request.sortDirection
    };

    if (request.productId != null) {
      payload['productId'] = request.productId;
    }

    if (request.warehouseId != null) {
      payload['warehouseId'] = request.warehouseId;
    }

    if (request.movementType) {
      payload['movementType'] = request.movementType;
    }

    if (request.referenceId) {
      payload['referenceId'] = request.referenceId;
    }

    if (request.startDate) {
      payload['startDate'] = request.startDate;
      payload['fromDate'] = request.startDate;
    }

    if (request.endDate) {
      payload['endDate'] = request.endDate;
      payload['toDate'] = request.endDate;
    }

    return payload;
  }

  private normalizePagedMovements(
    response: unknown,
    request: Required<MovementSearchRequest>
  ): PagedResponse<StockMovement> {
    const payload = this.unwrapApiResponse(response);

    if (Array.isArray(payload)) {
      return this.paginateMovements(
        this.filterMovements(payload.map((item) => this.normalizeMovement(item)), request),
        request
      );
    }

    const record = this.asRecord(payload);
    const source =
      this.readArray(record['content']) ??
      this.readArray(record['items']) ??
      this.readArray(record['movements']) ??
      this.readArray(record['results']) ??
      [];

    const content = source.map((item) => this.normalizeMovement(item));
    const totalElements = this.asNumber(record['totalElements'] ?? record['totalItems'] ?? content.length);
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

  private normalizeMovementCollection(response: unknown): StockMovement[] {
    const payload = this.unwrapApiResponse(response);

    if (Array.isArray(payload)) {
      return payload.map((item) => this.normalizeMovement(item));
    }

    const record = this.asRecord(payload);
    const source =
      this.readArray(record['content']) ??
      this.readArray(record['items']) ??
      this.readArray(record['movements']) ??
      this.readArray(record['results']);

    if (source) {
      return source.map((item) => this.normalizeMovement(item));
    }

    if ('movementId' in record || 'id' in record) {
      return [this.normalizeMovement(record)];
    }

    return [];
  }

  private paginateMovements(
    movements: StockMovement[],
    request: Required<MovementSearchRequest>
  ): PagedResponse<StockMovement> {
    const sorted = this.sortMovements(movements, request.sortBy, request.sortDirection);
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

  private filterMovements(
    movements: StockMovement[],
    request: Required<MovementSearchRequest>
  ): StockMovement[] {
    const normalizedReferenceId = request.referenceId.toLowerCase();
    const startTime = request.startDate ? new Date(`${request.startDate}T00:00:00`).getTime() : null;
    const endTime = request.endDate ? new Date(`${request.endDate}T23:59:59`).getTime() : null;

    return movements.filter((movement) => {
      const movementTime = movement.movementDate ? new Date(movement.movementDate).getTime() : 0;

      const matchesProduct = request.productId == null || movement.productId === request.productId;
      const matchesWarehouse =
        request.warehouseId == null || movement.warehouseId === request.warehouseId;
      const matchesType = !request.movementType || movement.movementType === request.movementType;
      const matchesReference =
        !normalizedReferenceId ||
        (movement.referenceId ?? '').toLowerCase().includes(normalizedReferenceId);
      const matchesStart = startTime == null || movementTime >= startTime;
      const matchesEnd = endTime == null || movementTime <= endTime;

      return (
        matchesProduct &&
        matchesWarehouse &&
        matchesType &&
        matchesReference &&
        matchesStart &&
        matchesEnd
      );
    });
  }

  private sortMovements(
    movements: StockMovement[],
    sortBy: string,
    sortDirection: 'asc' | 'desc'
  ): StockMovement[] {
    const direction = sortDirection === 'asc' ? 1 : -1;

    return [...movements].sort((left, right) => {
      const leftValue = this.resolveSortValue(left, sortBy);
      const rightValue = this.resolveSortValue(right, sortBy);

      if (typeof leftValue === 'number' && typeof rightValue === 'number') {
        return (leftValue - rightValue) * direction;
      }

      return String(leftValue).localeCompare(String(rightValue), undefined, {
        numeric: true,
        sensitivity: 'base'
      }) * direction;
    });
  }

  private resolveSortValue(movement: StockMovement, sortBy: string): string | number {
    switch (sortBy) {
      case 'movementId':
        return movement.movementId;
      case 'productId':
        return movement.productId;
      case 'warehouseId':
        return movement.warehouseId;
      case 'movementType':
        return movement.movementType;
      case 'quantity':
        return movement.quantity;
      case 'referenceId':
        return movement.referenceId ?? '';
      case 'performedBy':
        return movement.performedBy;
      case 'balanceAfter':
        return movement.balanceAfter;
      case 'movementDate':
      default:
        return movement.movementDate ? new Date(movement.movementDate).getTime() : 0;
    }
  }

  private normalizeMovement(value: unknown): StockMovement {
    const movement = this.asRecord(value as MovementResponse);
    const quantity = this.asNumber(movement['quantity']);
    const referenceType = this.asNullableString(movement['referenceType']);
    const movementType = this.normalizeMovementType(
      movement['movementType'],
      quantity,
      referenceType
    );
    const movementId = this.asNumber(movement['movementId'] ?? movement['id']);

    return {
      movementId,
      id: movementId,
      productId: this.asNumber(movement['productId']),
      productName: this.asNullableString(movement['productName']),
      sku: this.asNullableString(movement['sku']),
      warehouseId: this.asNumber(movement['warehouseId']),
      warehouseName: this.asNullableString(movement['warehouseName']),
      movementType,
      quantity,
      referenceId: this.normalizeReferenceId(movement['referenceId']),
      referenceType,
      unitCost: this.asNullableNumber(movement['unitCost']),
      performedBy:
        this.asNullableString(
          movement['performedBy'] ??
            movement['performedByName'] ??
            movement['createdBy'] ??
            movement['createdByName']
        ) ?? 'System',
      notes: this.asNullableString(movement['notes']),
      movementDate: this.asString(
        movement['movementDate'] ?? movement['createdAt'] ?? movement['updatedAt']
      ),
      balanceAfter: this.asNumber(movement['balanceAfter'])
    };
  }

  private normalizeSummaryValue(response: unknown, keys: string[]): number {
    const payload = this.unwrapApiResponse(response);

    if (typeof payload === 'number') {
      return payload;
    }

    const record = this.asRecord(payload);

    for (const key of keys) {
      if (key in record) {
        return this.asNumber(record[key]);
      }
    }

    return 0;
  }

  private normalizeMovementTypeFilter(
    value: MovementSearchRequest['movementType']
  ): MovementType | '' {
    return value && typeof value === 'string'
      ? this.normalizeMovementType(value, 0, null)
      : '';
  }

  private normalizeMovementType(
    value: unknown,
    quantity: number,
    referenceType: string | null
  ): MovementType {
    const normalizedValue =
      typeof value === 'string' ? value.trim().toUpperCase().replace(/[\s-]+/g, '_') : '';

    switch (normalizedValue) {
      case 'STOCK_IN':
      case 'STOCK_OUT':
      case 'TRANSFER_IN':
      case 'TRANSFER_OUT':
      case 'ADJUSTMENT':
      case 'WRITE_OFF':
      case 'RETURN':
        return normalizedValue;
      case 'WRITEOFF':
        return 'WRITE_OFF';
      case 'TRANSFER':
        return quantity < 0 ? 'TRANSFER_OUT' : 'TRANSFER_IN';
      default:
        if (referenceType?.toUpperCase().includes('TRANSFER')) {
          return quantity < 0 ? 'TRANSFER_OUT' : 'TRANSFER_IN';
        }

        return 'ADJUSTMENT';
    }
  }

  private normalizeReferenceId(value: unknown): string | null {
    if (typeof value === 'number') {
      return String(value);
    }

    return this.asNullableString(value);
  }

  private normalizeNullableNumber(value: unknown): number | null {
    if (value == null || value === '') {
      return null;
    }

    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
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
