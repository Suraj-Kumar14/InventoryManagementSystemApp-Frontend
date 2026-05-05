import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  BlacklistSupplierRequest,
  CreateSupplierRequest,
  DeactivateSupplierRequest,
  PageResponse,
  SupplierPerformanceResponse,
  SupplierPurchaseValidationResponse,
  SupplierResponse,
  SupplierSummaryResponse,
  UpdateSupplierRatingRequest,
  UpdateSupplierRequest,
} from '../../../core/http/backend.models';
import { ApiService } from '../../../core/http/api.service';
import { handleServiceError } from '../../../core/http/http.utils';
import { API_ENDPOINTS } from '../../../shared/config/app-config';
import { SupplierListQuery } from '../models/supplier.model';

@Injectable({ providedIn: 'root' })
export class SupplierApiService {
  private readonly api = inject(ApiService);
  private readonly serviceName = 'SupplierApiService';

  createSupplier(request: CreateSupplierRequest): Observable<SupplierResponse> {
    return this.api
      .post<SupplierResponse>(API_ENDPOINTS.SUPPLIERS.ROOT, request, {
        headers: { 'X-Skip-Global-Error': 'true' },
      })
      .pipe(handleServiceError(this.serviceName, 'createSupplier'));
  }

  updateSupplier(id: number, request: UpdateSupplierRequest): Observable<SupplierResponse> {
    return this.api
      .put<SupplierResponse>(API_ENDPOINTS.SUPPLIERS.DETAIL(id), request, {
        headers: { 'X-Skip-Global-Error': 'true' },
      })
      .pipe(handleServiceError(this.serviceName, 'updateSupplier'));
  }

  getSuppliers(query: SupplierListQuery = {}): Observable<PageResponse<SupplierResponse>> {
    return this.api
      .get<PageResponse<SupplierResponse>>(API_ENDPOINTS.SUPPLIERS.ROOT, {
        params: {
          isActive: query.isActive,
          status: query.status,
          page: query.page ?? 0,
          size: query.size ?? 10,
          sortBy: query.sortBy ?? 'name',
          sortDir: query.sortDir ?? 'asc',
        },
      })
      .pipe(handleServiceError(this.serviceName, 'getSuppliers'));
  }

  searchSuppliers(query: SupplierListQuery): Observable<PageResponse<SupplierResponse>> {
    return this.api
      .get<PageResponse<SupplierResponse>>(API_ENDPOINTS.SUPPLIERS.SEARCH, {
        params: {
          keyword: query.keyword,
          status: query.status,
          isActive: query.isActive,
          city: query.city,
          country: query.country,
          minRating: query.minRating,
          maxLeadTimeDays: query.maxLeadTimeDays,
          page: query.page ?? 0,
          size: query.size ?? 10,
          sortBy: query.sortBy ?? 'name',
          sortDir: query.sortDir ?? 'asc',
        },
      })
      .pipe(handleServiceError(this.serviceName, 'searchSuppliers'));
  }

  getSupplierById(id: number): Observable<SupplierResponse> {
    return this.api
      .get<SupplierResponse>(API_ENDPOINTS.SUPPLIERS.DETAIL(id))
      .pipe(handleServiceError(this.serviceName, 'getSupplierById'));
  }

  getSupplierByCode(code: string): Observable<SupplierResponse> {
    return this.api
      .get<SupplierResponse>(API_ENDPOINTS.SUPPLIERS.CODE(code))
      .pipe(handleServiceError(this.serviceName, 'getSupplierByCode'));
  }

  getSupplierByEmail(email: string): Observable<SupplierResponse> {
    return this.api
      .get<SupplierResponse>(API_ENDPOINTS.SUPPLIERS.EMAIL(email))
      .pipe(handleServiceError(this.serviceName, 'getSupplierByEmail'));
  }

  getActiveSuppliers(): Observable<SupplierResponse[]> {
    return this.api
      .get<SupplierResponse[]>(API_ENDPOINTS.SUPPLIERS.ACTIVE)
      .pipe(handleServiceError(this.serviceName, 'getActiveSuppliers'));
  }

  activateSupplier(id: number): Observable<SupplierResponse> {
    return this.api
      .patch<SupplierResponse>(API_ENDPOINTS.SUPPLIERS.ACTIVATE(id), {})
      .pipe(handleServiceError(this.serviceName, 'activateSupplier'));
  }

  deactivateSupplier(id: number, request: DeactivateSupplierRequest): Observable<SupplierResponse> {
    return this.api
      .patch<SupplierResponse>(API_ENDPOINTS.SUPPLIERS.DEACTIVATE(id), request)
      .pipe(handleServiceError(this.serviceName, 'deactivateSupplier'));
  }

  blacklistSupplier(id: number, request: BlacklistSupplierRequest): Observable<SupplierResponse> {
    return this.api
      .patch<SupplierResponse>(API_ENDPOINTS.SUPPLIERS.BLACKLIST(id), request)
      .pipe(handleServiceError(this.serviceName, 'blacklistSupplier'));
  }

  updateSupplierRating(id: number, request: UpdateSupplierRatingRequest): Observable<SupplierResponse> {
    return this.api
      .patch<SupplierResponse>(API_ENDPOINTS.SUPPLIERS.RATING(id), request)
      .pipe(handleServiceError(this.serviceName, 'updateSupplierRating'));
  }

  getSupplierPerformance(id: number): Observable<SupplierPerformanceResponse> {
    return this.api
      .get<SupplierPerformanceResponse>(API_ENDPOINTS.SUPPLIERS.PERFORMANCE(id))
      .pipe(handleServiceError(this.serviceName, 'getSupplierPerformance'));
  }

  getSupplierSummary(): Observable<SupplierSummaryResponse> {
    return this.api
      .get<SupplierSummaryResponse>(API_ENDPOINTS.SUPPLIERS.SUMMARY)
      .pipe(handleServiceError(this.serviceName, 'getSupplierSummary'));
  }

  getTopRatedSuppliers(): Observable<SupplierResponse[]> {
    return this.api
      .get<SupplierResponse[]>(API_ENDPOINTS.SUPPLIERS.TOP_RATED)
      .pipe(handleServiceError(this.serviceName, 'getTopRatedSuppliers'));
  }

  validateSupplierForPurchase(id: number): Observable<SupplierPurchaseValidationResponse> {
    return this.api
      .get<SupplierPurchaseValidationResponse>(API_ENDPOINTS.SUPPLIERS.VALIDATE_FOR_PURCHASE(id))
      .pipe(handleServiceError(this.serviceName, 'validateSupplierForPurchase'));
  }

  deleteSupplier(id: number): Observable<void> {
    return this.api
      .delete<void>(API_ENDPOINTS.SUPPLIERS.DETAIL(id))
      .pipe(handleServiceError(this.serviceName, 'deleteSupplier'));
  }
}
