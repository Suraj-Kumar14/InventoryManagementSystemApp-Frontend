import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import {
  AdjustStockRequest,
  PageResponse,
  ReleaseReservationRequest,
  ReserveStockRequest,
  StockIssueRequest,
  StockLevelResponse,
  StockReceiptRequest,
  StockSummaryResponse,
  StockTransferRequest,
  StockUpdateRequest,
  TransferStockResponse,
  WarehouseRequest,
  WarehouseResponse,
  WarehouseSummaryResponse,
} from '../http/backend.models';
import { ApiService } from '../http/api.service';
import { handleServiceError } from '../http/http.utils';
import { API_ENDPOINTS } from '../../shared/config/app-config';

@Injectable({ providedIn: 'root' })
export class WarehouseService {
  private readonly api = inject(ApiService);
  private readonly serviceName = 'WarehouseService';

  getWarehouses(activeOnly = false): Observable<WarehouseResponse[]> {
    return this.api
      .get<PageResponse<WarehouseResponse>>(API_ENDPOINTS.WAREHOUSES.ROOT, {
        service: 'warehouse',
        params: activeOnly ? { isActive: true, page: 0, size: 100 } : { page: 0, size: 100 },
      })
      .pipe(
        map((response) => response.content ?? []),
        handleServiceError(this.serviceName, 'getWarehouses')
      );
  }

  getWarehouseById(id: number): Observable<WarehouseResponse> {
    return this.api
      .get<WarehouseResponse>(`${API_ENDPOINTS.WAREHOUSES.ROOT}/${id}`, { service: 'warehouse' })
      .pipe(handleServiceError(this.serviceName, 'getWarehouseById'));
  }

  getWarehouseByCode(code: string): Observable<WarehouseResponse> {
    return this.api
      .get<WarehouseResponse>(API_ENDPOINTS.WAREHOUSES.CODE(code), { service: 'warehouse' })
      .pipe(handleServiceError(this.serviceName, 'getWarehouseByCode'));
  }

  createWarehouse(payload: WarehouseRequest): Observable<WarehouseResponse> {
    return this.api
      .post<WarehouseResponse>(API_ENDPOINTS.WAREHOUSES.ROOT, payload, { service: 'warehouse' })
      .pipe(handleServiceError(this.serviceName, 'createWarehouse'));
  }

  updateWarehouse(id: number, payload: WarehouseRequest): Observable<WarehouseResponse> {
    return this.api
      .put<WarehouseResponse>(`${API_ENDPOINTS.WAREHOUSES.ROOT}/${id}`, payload, { service: 'warehouse' })
      .pipe(handleServiceError(this.serviceName, 'updateWarehouse'));
  }

  deactivateWarehouse(id: number): Observable<WarehouseResponse> {
    return this.api
      .patch<WarehouseResponse>(API_ENDPOINTS.WAREHOUSES.DEACTIVATE(id), {}, { service: 'warehouse' })
      .pipe(handleServiceError(this.serviceName, 'deactivateWarehouse'));
  }

  activateWarehouse(id: number): Observable<WarehouseResponse> {
    return this.api
      .patch<WarehouseResponse>(API_ENDPOINTS.WAREHOUSES.ACTIVATE(id), {}, { service: 'warehouse' })
      .pipe(handleServiceError(this.serviceName, 'activateWarehouse'));
  }

  getWarehouseSummary(): Observable<WarehouseSummaryResponse> {
    return this.api
      .get<WarehouseSummaryResponse>(API_ENDPOINTS.WAREHOUSES.SUMMARY, { service: 'warehouse' })
      .pipe(handleServiceError(this.serviceName, 'getWarehouseSummary'));
  }

  getStockLevel(warehouseId: number, productId: number): Observable<StockLevelResponse> {
    return this.api
      .get<StockLevelResponse>(API_ENDPOINTS.STOCK.BY_WAREHOUSE_AND_PRODUCT(warehouseId, productId), {
        service: 'warehouse',
      })
      .pipe(handleServiceError(this.serviceName, 'getStockLevel'));
  }

  getStockByWarehouse(warehouseId: number): Observable<StockLevelResponse[]> {
    return this.api
      .get<PageResponse<StockLevelResponse>>(API_ENDPOINTS.STOCK.BY_WAREHOUSE(warehouseId), {
        service: 'warehouse',
        params: { page: 0, size: 100 },
      })
      .pipe(
        map((response) => response.content ?? []),
        handleServiceError(this.serviceName, 'getStockByWarehouse')
      );
  }

  getStockByProduct(productId: number): Observable<StockLevelResponse[]> {
    return this.api
      .get<PageResponse<StockLevelResponse>>(API_ENDPOINTS.STOCK.BY_PRODUCT(productId), {
        service: 'warehouse',
        params: { page: 0, size: 100 },
      })
      .pipe(
        map((response) => response.content ?? []),
        handleServiceError(this.serviceName, 'getStockByProduct')
      );
  }

  searchStock(filters: Record<string, unknown>): Observable<StockLevelResponse[]> {
    return this.api
      .get<PageResponse<StockLevelResponse>>(API_ENDPOINTS.STOCK.ROOT, {
        service: 'warehouse',
        params: { page: 0, size: 100, ...filters },
      })
      .pipe(
        map((response) => response.content ?? []),
        handleServiceError(this.serviceName, 'searchStock')
      );
  }

  createStockLevel(payload: {
    warehouseId: number;
    productId: number;
    quantity: number;
    reservedQuantity?: number | null;
    locationCode?: string | null;
  }): Observable<StockLevelResponse> {
    return this.api
      .post<StockLevelResponse>(API_ENDPOINTS.STOCK.ROOT, payload, { service: 'warehouse' })
      .pipe(handleServiceError(this.serviceName, 'createStockLevel'));
  }

  updateStock(payload: StockUpdateRequest): Observable<StockLevelResponse> {
    return this.api
      .post<StockLevelResponse>(API_ENDPOINTS.STOCK.UPDATE, payload, { service: 'warehouse' })
      .pipe(handleServiceError(this.serviceName, 'updateStock'));
  }

  receiveStock(payload: StockReceiptRequest): Observable<StockLevelResponse> {
    return this.api
      .post<StockLevelResponse>(API_ENDPOINTS.STOCK.RECEIVE, payload, { service: 'warehouse' })
      .pipe(handleServiceError(this.serviceName, 'receiveStock'));
  }

  issueStock(payload: StockIssueRequest): Observable<StockLevelResponse> {
    return this.api
      .post<StockLevelResponse>(API_ENDPOINTS.STOCK.ISSUE, payload, { service: 'warehouse' })
      .pipe(handleServiceError(this.serviceName, 'issueStock'));
  }

  reserveStock(payload: ReserveStockRequest): Observable<StockLevelResponse> {
    return this.api
      .post<StockLevelResponse>(API_ENDPOINTS.STOCK.RESERVE, payload, { service: 'warehouse' })
      .pipe(handleServiceError(this.serviceName, 'reserveStock'));
  }

  releaseStock(payload: ReleaseReservationRequest): Observable<StockLevelResponse> {
    return this.api
      .post<StockLevelResponse>(API_ENDPOINTS.STOCK.RELEASE, payload, { service: 'warehouse' })
      .pipe(handleServiceError(this.serviceName, 'releaseStock'));
  }

  transferStock(payload: StockTransferRequest): Observable<TransferStockResponse> {
    return this.api
      .post<TransferStockResponse>(API_ENDPOINTS.STOCK.TRANSFER, payload, { service: 'warehouse' })
      .pipe(handleServiceError(this.serviceName, 'transferStock'));
  }

  adjustStock(payload: AdjustStockRequest): Observable<StockLevelResponse> {
    return this.api
      .post<StockLevelResponse>(API_ENDPOINTS.STOCK.ADJUST, payload, { service: 'warehouse' })
      .pipe(handleServiceError(this.serviceName, 'adjustStock'));
  }

  getLowStock(): Observable<StockLevelResponse[]> {
    return this.api
      .get<StockLevelResponse[]>(API_ENDPOINTS.STOCK.LOW_STOCK, { service: 'warehouse' })
      .pipe(handleServiceError(this.serviceName, 'getLowStock'));
  }

  getOverstock(): Observable<StockLevelResponse[]> {
    return this.api
      .get<StockLevelResponse[]>(API_ENDPOINTS.STOCK.OVERSTOCK, { service: 'warehouse' })
      .pipe(handleServiceError(this.serviceName, 'getOverstock'));
  }

  getStockSummary(): Observable<StockSummaryResponse> {
    return this.api
      .get<StockSummaryResponse>(API_ENDPOINTS.STOCK.SUMMARY, { service: 'warehouse' })
      .pipe(handleServiceError(this.serviceName, 'getStockSummary'));
  }
}
