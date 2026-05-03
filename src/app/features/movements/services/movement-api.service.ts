import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  CreateMovementRequest,
  MovementAnalyticsResponse,
  MovementResponse,
  MovementSearchRequest,
  MovementSummaryResponse,
  PageResponse,
  ReverseMovementRequest,
} from '../../../core/http/backend.models';
import { ApiService } from '../../../core/http/api.service';
import { handleServiceError } from '../../../core/http/http.utils';
import { API_ENDPOINTS } from '../../../shared/config/app-config';

@Injectable({ providedIn: 'root' })
export class MovementApiService {
  private readonly api = inject(ApiService);
  private readonly serviceName = 'MovementApiService';

  createMovement(request: CreateMovementRequest): Observable<MovementResponse> {
    return this.api
      .post<MovementResponse>(API_ENDPOINTS.MOVEMENTS.ROOT, request)
      .pipe(handleServiceError(this.serviceName, 'createMovement'));
  }

  getMovements(query: MovementSearchRequest = {}): Observable<PageResponse<MovementResponse>> {
    return this.api
      .get<PageResponse<MovementResponse>>(API_ENDPOINTS.MOVEMENTS.ROOT, {
        params: {
          page: query.page ?? 0,
          size: query.size ?? 10,
          sortBy: query.sortBy ?? 'movementDate',
          sortDir: query.sortDir ?? 'desc',
        },
      })
      .pipe(handleServiceError(this.serviceName, 'getMovements'));
  }

  searchMovements(query: MovementSearchRequest): Observable<PageResponse<MovementResponse>> {
    return this.api
      .get<PageResponse<MovementResponse>>(API_ENDPOINTS.MOVEMENTS.SEARCH, {
        params: {
          keyword: query.keyword,
          productId: query.productId,
          warehouseId: query.warehouseId,
          movementType: query.movementType,
          direction: query.direction,
          referenceType: query.referenceType,
          referenceId: query.referenceId,
          performedBy: query.performedBy,
          fromDate: query.fromDate,
          toDate: query.toDate,
          minQuantity: query.minQuantity,
          maxQuantity: query.maxQuantity,
          isReversal: query.isReversal,
          page: query.page ?? 0,
          size: query.size ?? 10,
          sortBy: query.sortBy ?? 'movementDate',
          sortDir: query.sortDir ?? 'desc',
        },
      })
      .pipe(handleServiceError(this.serviceName, 'searchMovements'));
  }

  getMovementById(id: number): Observable<MovementResponse> {
    return this.api
      .get<MovementResponse>(API_ENDPOINTS.MOVEMENTS.DETAIL(id))
      .pipe(handleServiceError(this.serviceName, 'getMovementById'));
  }

  getMovementByNumber(movementNumber: string): Observable<MovementResponse> {
    return this.api
      .get<MovementResponse>(API_ENDPOINTS.MOVEMENTS.NUMBER(movementNumber))
      .pipe(handleServiceError(this.serviceName, 'getMovementByNumber'));
  }

  getMovementsByProduct(productId: number, page = 0, size = 10): Observable<PageResponse<MovementResponse>> {
    return this.api
      .get<PageResponse<MovementResponse>>(API_ENDPOINTS.MOVEMENTS.BY_PRODUCT(productId), { params: { page, size } })
      .pipe(handleServiceError(this.serviceName, 'getMovementsByProduct'));
  }

  getMovementsByWarehouse(warehouseId: number, page = 0, size = 10): Observable<PageResponse<MovementResponse>> {
    return this.api
      .get<PageResponse<MovementResponse>>(API_ENDPOINTS.MOVEMENTS.BY_WAREHOUSE(warehouseId), { params: { page, size } })
      .pipe(handleServiceError(this.serviceName, 'getMovementsByWarehouse'));
  }

  getMovementsByReference(referenceType: string, referenceId: string, page = 0, size = 10): Observable<PageResponse<MovementResponse>> {
    return this.api
      .get<PageResponse<MovementResponse>>(API_ENDPOINTS.MOVEMENTS.BY_REFERENCE(referenceType, referenceId), { params: { page, size } })
      .pipe(handleServiceError(this.serviceName, 'getMovementsByReference'));
  }

  getMovementsByUser(userId: number, page = 0, size = 10): Observable<PageResponse<MovementResponse>> {
    return this.api
      .get<PageResponse<MovementResponse>>(API_ENDPOINTS.MOVEMENTS.BY_USER(userId), { params: { page, size } })
      .pipe(handleServiceError(this.serviceName, 'getMovementsByUser'));
  }

  reverseMovement(id: number, request: ReverseMovementRequest): Observable<MovementResponse> {
    return this.api
      .post<MovementResponse>(API_ENDPOINTS.MOVEMENTS.REVERSE(id), request)
      .pipe(handleServiceError(this.serviceName, 'reverseMovement'));
  }

  getMovementSummary(fromDate?: string, toDate?: string): Observable<MovementSummaryResponse> {
    return this.api
      .get<MovementSummaryResponse>(API_ENDPOINTS.MOVEMENTS.SUMMARY, { params: { fromDate, toDate } })
      .pipe(handleServiceError(this.serviceName, 'getMovementSummary'));
  }

  getMovementAnalytics(fromDate?: string, toDate?: string): Observable<MovementAnalyticsResponse> {
    return this.api
      .get<MovementAnalyticsResponse>(API_ENDPOINTS.MOVEMENTS.ANALYTICS, { params: { fromDate, toDate } })
      .pipe(handleServiceError(this.serviceName, 'getMovementAnalytics'));
  }

  exportCsv(query: MovementSearchRequest): Observable<Blob> {
    return this.api
      .get<Blob>(API_ENDPOINTS.MOVEMENTS.EXPORT_CSV, {
        params: query,
        responseType: 'blob',
      })
      .pipe(handleServiceError(this.serviceName, 'exportCsv'));
  }
}
