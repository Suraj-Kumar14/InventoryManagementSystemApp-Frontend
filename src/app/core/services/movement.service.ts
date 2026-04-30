import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { StockMovementRequest, StockMovementResponse } from '../http/backend.models';
import { ApiService } from '../http/api.service';
import { handleServiceError } from '../http/http.utils';
import { API_ENDPOINTS } from '../../shared/config/app-config';

export interface MovementFilters {
  productId?: number;
  warehouseId?: number;
  type?: string;
  referenceId?: number;
  start?: string;
  end?: string;
}

@Injectable({ providedIn: 'root' })
export class MovementService {
  private readonly api = inject(ApiService);
  private readonly serviceName = 'MovementService';

  getMovements(filters: MovementFilters = {}): Observable<StockMovementResponse[]> {
    return this.api
      .get<StockMovementResponse[]>(API_ENDPOINTS.MOVEMENTS.ROOT, {
        service: 'movement',
        params: filters,
      })
      .pipe(handleServiceError(this.serviceName, 'getMovements'));
  }

  createMovement(payload: StockMovementRequest): Observable<StockMovementResponse> {
    return this.api
      .post<StockMovementResponse>(API_ENDPOINTS.MOVEMENTS.ROOT, payload, { service: 'movement' })
      .pipe(handleServiceError(this.serviceName, 'createMovement'));
  }

  getMovementsByProduct(productId: number): Observable<StockMovementResponse[]> {
    return this.api
      .get<StockMovementResponse[]>(API_ENDPOINTS.MOVEMENTS.BY_PRODUCT(productId), { service: 'movement' })
      .pipe(handleServiceError(this.serviceName, 'getMovementsByProduct'));
  }

  getMovementsByWarehouse(warehouseId: number): Observable<StockMovementResponse[]> {
    return this.api
      .get<StockMovementResponse[]>(API_ENDPOINTS.MOVEMENTS.BY_WAREHOUSE(warehouseId), { service: 'movement' })
      .pipe(handleServiceError(this.serviceName, 'getMovementsByWarehouse'));
  }

  getMovementsByDateRange(start: string, end: string): Observable<StockMovementResponse[]> {
    return this.api
      .get<StockMovementResponse[]>(API_ENDPOINTS.MOVEMENTS.DATE_RANGE, {
        service: 'movement',
        params: {
          start: `${start}T00:00:00`,
          end: `${end}T23:59:59`,
        },
      })
      .pipe(handleServiceError(this.serviceName, 'getMovementsByDateRange'));
  }
}
