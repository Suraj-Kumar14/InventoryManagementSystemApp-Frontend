import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CreateWarehouseRequest,
  PagedResponse,
  UpdateWarehouseRequest,
  Warehouse,
  WarehouseUtilizationResponse
} from '../models';

@Injectable({ providedIn: 'root' })
export class WarehouseService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/v1/warehouses`;

  getAll(
    page = 0,
    size = 20,
    sortBy = 'updatedAt',
    sortDir: 'asc' | 'desc' = 'desc'
  ): Observable<PagedResponse<Warehouse>> {
    const params = new HttpParams()
      .set('page', page)
      .set('size', size)
      .set('sortBy', sortBy)
      .set('sortDir', sortDir);

    return this.http
      .get<unknown>(this.base, { params })
      .pipe(map((response) => this.normalizePagedWarehouses(response, page, size)));
  }

  getById(id: number | string): Observable<Warehouse> {
    return this.http
      .get<unknown>(`${this.base}/${id}`)
      .pipe(map((response) => this.normalizeWarehouse(this.unwrapApiResponse(response))));
  }

  create(req: CreateWarehouseRequest): Observable<Warehouse> {
    return this.http
      .post<unknown>(this.base, this.sanitizePayload(req))
      .pipe(map((response) => this.normalizeWarehouse(this.unwrapApiResponse(response))));
  }

  update(id: number | string, req: UpdateWarehouseRequest): Observable<Warehouse> {
    return this.http
      .put<unknown>(`${this.base}/${id}`, this.sanitizePayload(req))
      .pipe(map((response) => this.normalizeWarehouse(this.unwrapApiResponse(response))));
  }

  deactivate(id: number | string): Observable<Warehouse> {
    return this.http
      .put<unknown>(`${this.base}/${id}/deactivate`, {})
      .pipe(map((response) => this.normalizeWarehouse(this.unwrapApiResponse(response))));
  }

  getUtilization(id: number | string): Observable<WarehouseUtilizationResponse> {
    return this.http
      .get<unknown>(`${this.base}/${id}/utilization`)
      .pipe(map((response) => this.normalizeUtilization(this.unwrapApiResponse(response), Number(id))));
  }

  getActive(limit = 200): Observable<Warehouse[]> {
    return this.getAll(0, limit, 'name', 'asc').pipe(
      map((response) => response.content.filter((warehouse) => warehouse.active))
    );
  }

  private sanitizePayload(
    payload: CreateWarehouseRequest | UpdateWarehouseRequest
  ): CreateWarehouseRequest | UpdateWarehouseRequest {
    const basePayload: CreateWarehouseRequest = {
      name: payload.name.trim(),
      location: payload.location.trim(),
      address: payload.address.trim(),
      managerId: this.toNullableNumber(payload.managerId),
      capacity: Math.max(Number(payload.capacity ?? 0), 0),
      phone: payload.phone?.trim() || null
    };

    if ('isActive' in payload) {
      return {
        ...basePayload,
        isActive: payload.isActive ?? true
      };
    }

    return basePayload;
  }

  private normalizePagedWarehouses(
    response: unknown,
    fallbackPage: number,
    fallbackSize: number
  ): PagedResponse<Warehouse> {
    const payload = this.unwrapApiResponse(response);

    if (Array.isArray(payload)) {
      return this.paginateWarehouses(
        payload.map((item) => this.normalizeWarehouse(item)),
        fallbackPage,
        fallbackSize
      );
    }

    const record = this.asRecord(payload);
    const source =
      this.readArray(record['content']) ??
      this.readArray(record['items']) ??
      this.readArray(record['warehouses']) ??
      [];

    const content = source.map((item) => this.normalizeWarehouse(item));
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

  private paginateWarehouses(
    warehouses: Warehouse[],
    page: number,
    size: number
  ): PagedResponse<Warehouse> {
    const safePage = Math.max(page, 0);
    const safeSize = Math.max(size, 1);
    const startIndex = safePage * safeSize;
    const content = warehouses.slice(startIndex, startIndex + safeSize);
    const totalPages = Math.max(Math.ceil(warehouses.length / safeSize), 1);

    return {
      content,
      page: safePage,
      size: safeSize,
      totalElements: warehouses.length,
      totalPages,
      first: safePage === 0,
      last: safePage >= totalPages - 1
    };
  }

  private normalizeWarehouse(value: unknown): Warehouse {
    const warehouse = this.asRecord(value);
    const warehouseId = this.asNumber(warehouse['warehouseId'] ?? warehouse['id']);
    const capacity = this.asNumber(warehouse['capacity']);
    const usedCapacity = this.asNumber(
      warehouse['usedCapacity'] ?? warehouse['currentUtilization'] ?? 0
    );
    const utilizationPercent = this.asNumber(
      warehouse['utilizationPercentage'] ??
        warehouse['utilizationPercent'] ??
        (capacity > 0 ? (usedCapacity / capacity) * 100 : 0)
    );
    const location = this.asString(warehouse['location'] ?? warehouse['city']);
    const isActive = this.asBoolean(warehouse['isActive'] ?? warehouse['active'], true);

    return {
      warehouseId,
      id: warehouseId,
      name: this.asString(warehouse['name']),
      location,
      address: this.asString(warehouse['address']),
      managerId: this.toNullableNumber(warehouse['managerId']),
      capacity,
      usedCapacity,
      currentUtilization: usedCapacity,
      utilizationPercent,
      isActive,
      active: isActive,
      phone: this.asNullableString(warehouse['phone']),
      createdAt: this.asNullableString(warehouse['createdAt']) ?? undefined,
      updatedAt: this.asNullableString(warehouse['updatedAt']) ?? undefined,
      code: this.asString(warehouse['code'] ?? (warehouseId ? `WH-${warehouseId}` : '')),
      managerName: this.asNullableString(warehouse['managerName']) ?? undefined,
      city: location || undefined,
      country: this.asNullableString(warehouse['country']) ?? undefined
    };
  }

  private normalizeUtilization(
    value: unknown,
    warehouseId: number
  ): WarehouseUtilizationResponse {
    const utilization = this.asRecord(value);
    const capacity = this.asNumber(utilization['capacity']);
    const usedCapacity = this.asNumber(utilization['usedCapacity']);
    const utilizationPercentage = this.asNumber(
      utilization['utilizationPercentage'] ??
        utilization['utilizationPercent'] ??
        (capacity > 0 ? (usedCapacity / capacity) * 100 : 0)
    );

    return {
      warehouseId: this.asNumber(utilization['warehouseId'] ?? warehouseId),
      capacity,
      usedCapacity,
      utilizationPercentage
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

  private toNullableNumber(value: unknown): number | null {
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
      return normalized === 'true' || normalized === 'active' || normalized === 'yes';
    }

    return fallback;
  }
}
