import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  AcknowledgeWarehouseStockAlertRequest,
  BarcodeStockLookupResponse,
  StockAuditRequest,
  StockAuditResponse,
  StockLevelResponse,
  StockTransferRequest,
  StockUpdateRequest,
  WarehouseRequest,
  WarehouseResponse,
  WarehouseStockAlertResponse,
  WarehouseStockMovementResponse,
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
      .get<WarehouseResponse[]>(
        activeOnly ? API_ENDPOINTS.WAREHOUSES.ACTIVE : API_ENDPOINTS.WAREHOUSES.ROOT,
        { service: 'warehouse' }
      )
      .pipe(handleServiceError(this.serviceName, 'getWarehouses'));
  }

  getWarehouseById(id: number): Observable<WarehouseResponse> {
    return this.api
      .get<WarehouseResponse>(`${API_ENDPOINTS.WAREHOUSES.ROOT}/${id}`, { service: 'warehouse' })
      .pipe(handleServiceError(this.serviceName, 'getWarehouseById'));
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

  deactivateWarehouse(id: number): Observable<string> {
    return this.api
      .put<string>(API_ENDPOINTS.WAREHOUSES.DEACTIVATE(id), {}, {
        service: 'warehouse',
        responseType: 'text',
      })
      .pipe(handleServiceError(this.serviceName, 'deactivateWarehouse'));
  }

  assignWarehouseManager(warehouseId: number, managerId: number): Observable<string> {
    return this.api
      .put<string>(API_ENDPOINTS.WAREHOUSES.ASSIGN_MANAGER(warehouseId, managerId), {}, {
        service: 'warehouse',
        responseType: 'text',
      })
      .pipe(handleServiceError(this.serviceName, 'assignWarehouseManager'));
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
      .get<StockLevelResponse[]>(API_ENDPOINTS.STOCK.BY_WAREHOUSE(warehouseId), { service: 'warehouse' })
      .pipe(handleServiceError(this.serviceName, 'getStockByWarehouse'));
  }

  getStockByProduct(productId: number): Observable<StockLevelResponse[]> {
    return this.api
      .get<StockLevelResponse[]>(API_ENDPOINTS.STOCK.BY_PRODUCT(productId), { service: 'warehouse' })
      .pipe(handleServiceError(this.serviceName, 'getStockByProduct'));
  }

  updateStock(warehouseId: number, payload: StockUpdateRequest): Observable<StockLevelResponse> {
    return this.api
      .put<StockLevelResponse>(API_ENDPOINTS.STOCK.UPDATE(warehouseId), payload, { service: 'warehouse' })
      .pipe(handleServiceError(this.serviceName, 'updateStock'));
  }

  reserveStock(warehouseId: number, productId: number, quantity: number): Observable<string> {
    return this.api
      .post<string>(API_ENDPOINTS.STOCK.RESERVE, null, {
        service: 'warehouse',
        params: { warehouseId, productId, quantity },
        responseType: 'text',
      })
      .pipe(handleServiceError(this.serviceName, 'reserveStock'));
  }

  releaseStock(warehouseId: number, productId: number, quantity: number): Observable<string> {
    return this.api
      .post<string>(API_ENDPOINTS.STOCK.RELEASE, null, {
        service: 'warehouse',
        params: { warehouseId, productId, quantity },
        responseType: 'text',
      })
      .pipe(handleServiceError(this.serviceName, 'releaseStock'));
  }

  transferStock(payload: StockTransferRequest): Observable<string> {
    return this.api
      .post<string>(API_ENDPOINTS.STOCK.TRANSFER, payload, {
        service: 'warehouse',
        responseType: 'text',
      })
      .pipe(handleServiceError(this.serviceName, 'transferStock'));
  }

  getLowStock(threshold = 10): Observable<StockLevelResponse[]> {
    return this.api
      .get<StockLevelResponse[]>(API_ENDPOINTS.STOCK.LOW_STOCK, {
        service: 'warehouse',
        params: { threshold },
      })
      .pipe(handleServiceError(this.serviceName, 'getLowStock'));
  }

  getMovementHistory(warehouseId?: number, productId?: number): Observable<WarehouseStockMovementResponse[]> {
    return this.api
      .get<WarehouseStockMovementResponse[]>(API_ENDPOINTS.STOCK.MOVEMENTS, {
        service: 'warehouse',
        params: { warehouseId, productId },
      })
      .pipe(handleServiceError(this.serviceName, 'getMovementHistory'));
  }

  performStockAudit(payload: StockAuditRequest): Observable<StockAuditResponse> {
    return this.api
      .post<StockAuditResponse>(API_ENDPOINTS.STOCK.AUDIT, payload, { service: 'warehouse' })
      .pipe(handleServiceError(this.serviceName, 'performStockAudit'));
  }

  lookupStockByBarcode(barcode: string): Observable<BarcodeStockLookupResponse> {
    return this.api
      .get<BarcodeStockLookupResponse>(API_ENDPOINTS.STOCK.BARCODE(barcode), { service: 'warehouse' })
      .pipe(handleServiceError(this.serviceName, 'lookupStockByBarcode'));
  }

  getStockAlerts(): Observable<WarehouseStockAlertResponse[]> {
    return this.api
      .get<WarehouseStockAlertResponse[]>(API_ENDPOINTS.STOCK.ALERTS, { service: 'warehouse' })
      .pipe(handleServiceError(this.serviceName, 'getStockAlerts'));
  }

  acknowledgeStockAlert(
    alertId: number,
    payload: AcknowledgeWarehouseStockAlertRequest
  ): Observable<WarehouseStockAlertResponse> {
    return this.api
      .post<WarehouseStockAlertResponse>(API_ENDPOINTS.STOCK.ACKNOWLEDGE_ALERT(alertId), payload, {
        service: 'warehouse',
      })
      .pipe(handleServiceError(this.serviceName, 'acknowledgeStockAlert'));
  }
}
