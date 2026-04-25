import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CreateSupplierRequest,
  PagedResponse,
  Supplier,
  SupplierFilter,
  UpdateSupplierRatingRequest,
  UpdateSupplierRequest
} from '../models';

type NormalizedSupplierFilter = {
  page: number;
  size: number;
  search: string;
  city: string;
  country: string;
  isActive: boolean | null;
  sortBy: NonNullable<SupplierFilter['sortBy']>;
  sortDir: 'asc' | 'desc';
};

@Injectable({ providedIn: 'root' })
export class SupplierService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/v1/suppliers`;

  getAllSuppliers(filter: SupplierFilter = {}): Observable<PagedResponse<Supplier>> {
    const normalizedFilter = this.normalizeFilter(filter);
    const source$ =
      normalizedFilter.city && !normalizedFilter.country && !normalizedFilter.search
        ? this.getSuppliersByCity(normalizedFilter.city)
        : normalizedFilter.country && !normalizedFilter.city && !normalizedFilter.search
          ? this.getSuppliersByCountry(normalizedFilter.country)
          : normalizedFilter.search && !normalizedFilter.city && !normalizedFilter.country
            ? this.searchSuppliers(normalizedFilter.search)
            : this.getAllList();

    return source$.pipe(
      map((suppliers) => this.filterAndPaginateSuppliers(suppliers, normalizedFilter))
    );
  }

  getAll(page = 0, size = 20, search = ''): Observable<PagedResponse<Supplier>> {
    return this.getAllSuppliers({ page, size, search });
  }

  getSupplierById(id: number | string): Observable<Supplier> {
    return this.http
      .get<unknown>(`${this.base}/${id}`)
      .pipe(map((response) => this.normalizeSupplier(this.unwrapApiResponse(response))));
  }

  getById(id: number | string): Observable<Supplier> {
    return this.getSupplierById(id);
  }

  createSupplier(payload: CreateSupplierRequest): Observable<Supplier> {
    return this.http
      .post<unknown>(this.base, this.sanitizePayload(payload))
      .pipe(map((response) => this.normalizeSupplier(this.unwrapApiResponse(response))));
  }

  create(payload: CreateSupplierRequest): Observable<Supplier> {
    return this.createSupplier(payload);
  }

  updateSupplier(id: number | string, payload: UpdateSupplierRequest): Observable<Supplier> {
    return this.http
      .put<unknown>(`${this.base}/${id}`, this.sanitizePayload(payload))
      .pipe(map((response) => this.normalizeSupplier(this.unwrapApiResponse(response))));
  }

  update(id: number | string, payload: UpdateSupplierRequest): Observable<Supplier> {
    return this.updateSupplier(id, payload);
  }

  deactivateSupplier(id: number | string): Observable<Supplier> {
    return this.http
      .put<unknown>(`${this.base}/${id}/deactivate`, {})
      .pipe(map((response) => this.normalizeSupplier(this.unwrapApiResponse(response))));
  }

  deactivate(id: number | string): Observable<Supplier> {
    return this.deactivateSupplier(id);
  }

  deleteSupplier(_id: number | string): Observable<never> {
    return throwError(() => new Error('Delete is not exposed by the current supplier-service backend.'));
  }

  searchSuppliers(name: string): Observable<Supplier[]> {
    const params = new HttpParams().set('name', name.trim());

    return this.http
      .get<unknown>(`${this.base}/search`, { params })
      .pipe(map((response) => this.normalizeSupplierCollection(response)));
  }

  getSuppliersByCity(city: string): Observable<Supplier[]> {
    return this.http
      .get<unknown>(`${this.base}/city/${encodeURIComponent(city.trim())}`)
      .pipe(map((response) => this.normalizeSupplierCollection(response)));
  }

  getSuppliersByCountry(country: string): Observable<Supplier[]> {
    return this.http
      .get<unknown>(`${this.base}/country/${encodeURIComponent(country.trim())}`)
      .pipe(map((response) => this.normalizeSupplierCollection(response)));
  }

  updateSupplierRating(
    id: number | string,
    payload: UpdateSupplierRatingRequest | number
  ): Observable<Supplier> {
    const requestBody =
      typeof payload === 'number'
        ? { newRating: this.normalizeRating(payload) }
        : { newRating: this.normalizeRating(payload.newRating) };

    return this.http
      .put<unknown>(`${this.base}/${id}/rating`, requestBody)
      .pipe(map((response) => this.normalizeSupplier(this.unwrapApiResponse(response))));
  }

  updateRating(id: number | string, rating: number): Observable<Supplier> {
    return this.updateSupplierRating(id, rating);
  }

  getAllList(): Observable<Supplier[]> {
    return this.http
      .get<unknown>(`${this.base}/all`)
      .pipe(map((response) => this.normalizeSupplierCollection(response)));
  }

  getActive(): Observable<Supplier[]> {
    return this.getAllList().pipe(
      map((suppliers) => suppliers.filter((supplier) => supplier.isActive))
    );
  }

  getSelectableForPurchaseOrders(): Observable<Supplier[]> {
    return this.getActive();
  }

  private filterAndPaginateSuppliers(
    suppliers: Supplier[],
    filter: NormalizedSupplierFilter
  ): PagedResponse<Supplier> {
    const filtered = suppliers.filter((supplier) => {
      const matchesSearch =
        !filter.search ||
        [
          supplier.name,
          supplier.contactPerson,
          supplier.email,
          supplier.taxId,
          supplier.city,
          supplier.country
        ]
          .filter((value) => !!value)
          .some((value) => value.toLowerCase().includes(filter.search));

      const matchesCity =
        !filter.city || supplier.city.toLowerCase() === filter.city;
      const matchesCountry =
        !filter.country || supplier.country.toLowerCase() === filter.country;
      const matchesActive =
        filter.isActive == null || supplier.isActive === filter.isActive;

      return matchesSearch && matchesCity && matchesCountry && matchesActive;
    });

    const sorted = this.sortSuppliers(filtered, filter.sortBy, filter.sortDir);
    const startIndex = filter.page * filter.size;
    const content = sorted.slice(startIndex, startIndex + filter.size);
    const totalPages = Math.max(Math.ceil(sorted.length / filter.size), 1);

    return {
      content,
      page: filter.page,
      size: filter.size,
      totalElements: sorted.length,
      totalPages,
      first: filter.page === 0,
      last: filter.page >= totalPages - 1
    };
  }

  private sortSuppliers(
    suppliers: Supplier[],
    sortBy: NonNullable<SupplierFilter['sortBy']>,
    sortDir: 'asc' | 'desc'
  ): Supplier[] {
    const direction = sortDir === 'asc' ? 1 : -1;

    return [...suppliers].sort((left, right) => {
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

  private resolveSortValue(
    supplier: Supplier,
    sortBy: NonNullable<SupplierFilter['sortBy']>
  ): string | number {
    switch (sortBy) {
      case 'city':
        return supplier.city;
      case 'country':
        return supplier.country;
      case 'rating':
        return supplier.rating;
      case 'leadTimeDays':
        return supplier.leadTimeDays;
      case 'createdAt':
        return supplier.createdAt ?? '';
      case 'name':
      default:
        return supplier.name;
    }
  }

  private sanitizePayload(
    payload: CreateSupplierRequest | UpdateSupplierRequest
  ): Record<string, unknown> {
    const basePayload: Record<string, unknown> = {
      name: payload.name.trim(),
      contactPerson: payload.contactPerson.trim(),
      email: payload.email.trim().toLowerCase(),
      phone: payload.phone?.trim() || null,
      address: payload.address.trim(),
      city: payload.city.trim(),
      country: payload.country.trim(),
      taxId: payload.taxId.trim().toUpperCase(),
      paymentTerms: payload.paymentTerms.trim().toUpperCase(),
      leadTimeDays: Math.max(Number(payload.leadTimeDays ?? 0), 0)
    };

    if ('isActive' in payload) {
      if (payload.isActive != null) {
        basePayload['isActive'] = payload.isActive;
      }

      if (payload.rating != null) {
        basePayload['rating'] = this.normalizeRating(payload.rating);
      }
    }

    return basePayload;
  }

  private normalizeSupplierCollection(response: unknown): Supplier[] {
    const payload = this.unwrapApiResponse(response);

    if (Array.isArray(payload)) {
      return payload.map((supplier) => this.normalizeSupplier(supplier));
    }

    const record = this.asRecord(payload);
    const source =
      this.readArray(record['content']) ??
      this.readArray(record['items']) ??
      this.readArray(record['suppliers']) ??
      [];

    return source.map((supplier) => this.normalizeSupplier(supplier));
  }

  private normalizeSupplier(value: unknown): Supplier {
    const supplier = this.asRecord(value);
    const supplierId = this.asNumber(supplier['supplierId'] ?? supplier['id']);
    const isActive = this.asBoolean(supplier['isActive'] ?? supplier['active'], true);
    const rating = this.normalizeRating(supplier['rating']);

    return {
      supplierId,
      id: supplierId,
      name: this.asString(supplier['name']),
      contactPerson: this.asString(supplier['contactPerson']),
      email: this.asString(supplier['email']),
      phone: this.asNullableString(supplier['phone']),
      address: this.asNullableString(supplier['address']),
      city: this.asString(supplier['city']),
      country: this.asString(supplier['country']),
      taxId: this.asString(supplier['taxId']),
      paymentTerms: this.asString(supplier['paymentTerms']),
      leadTimeDays: this.asNumber(supplier['leadTimeDays']),
      rating,
      isActive,
      active: isActive,
      createdAt: this.asNullableString(supplier['createdAt']) ?? undefined,
      code: supplierId ? `SUP-${supplierId}` : undefined,
      status: isActive ? 'ACTIVE' : 'INACTIVE',
      totalOrders: this.asNumber(supplier['totalOrders']),
      totalOrderValue: this.asNumber(supplier['totalOrderValue'])
    };
  }

  private normalizeFilter(filter: SupplierFilter): NormalizedSupplierFilter {
    return {
      page: Math.max(Number(filter.page ?? 0), 0),
      size: Math.max(Number(filter.size ?? 10), 1),
      search: filter.search?.trim().toLowerCase() || '',
      city: filter.city?.trim().toLowerCase() || '',
      country: filter.country?.trim().toLowerCase() || '',
      isActive:
        typeof filter.isActive === 'boolean'
          ? filter.isActive
          : filter.isActive === '' || filter.isActive == null
            ? null
            : String(filter.isActive).trim().toLowerCase() === 'true',
      sortBy: filter.sortBy ?? 'name',
      sortDir: filter.sortDir === 'desc' ? 'desc' : 'asc'
    };
  }

  private normalizeRating(value: unknown): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      return 0;
    }

    return Math.min(Math.max(parsed, 0), 5);
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
