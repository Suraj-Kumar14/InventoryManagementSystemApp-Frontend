import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  DeadStockItem,
  InventorySnapshot,
  InventoryTurnover,
  POSummary,
  StockValuation,
  TopMovingProduct,
} from '../http/backend.models';
import { ApiService } from '../http/api.service';
import { handleServiceError } from '../http/http.utils';
import { API_ENDPOINTS } from '../../shared/config/app-config';

export interface DateRangeQuery {
  startDate: string;
  endDate: string;
}

export interface MovementSummary {
  warehouseId: number | 'ALL';
  fromDate: string;
  toDate: string;
  totalStockIn: number;
  totalStockOut: number;
  totalAdjustments: number;
  totalTransfers: number;
}

interface RawInventoryTurnover {
  startDate: string;
  endDate: string;
  cogs: number;
  averageInventoryValue: number;
  inventoryTurnover: number;
}

@Injectable({ providedIn: 'root' })
export class ReportService {
  private readonly api = inject(ApiService);
  private readonly serviceName = 'ReportService';

  getLatestSnapshot(): Observable<InventorySnapshot[]> {
    return this.api
      .get<InventorySnapshot[]>(API_ENDPOINTS.REPORTS.LATEST_SNAPSHOT, { service: 'report' })
      .pipe(handleServiceError(this.serviceName, 'getLatestSnapshot'));
  }

  getTotalValuation(): Observable<StockValuation> {
    return this.api
      .get<StockValuation>(API_ENDPOINTS.REPORTS.TOTAL_VALUATION, { service: 'report' })
      .pipe(handleServiceError(this.serviceName, 'getTotalValuation'));
  }

  getWarehouseValuation(warehouseId: number): Observable<StockValuation> {
    return this.api
      .get<StockValuation>(API_ENDPOINTS.REPORTS.WAREHOUSE_VALUATION(warehouseId), { service: 'report' })
      .pipe(handleServiceError(this.serviceName, 'getWarehouseValuation'));
  }

  getInventoryTurnover(range: DateRangeQuery): Observable<InventoryTurnover> {
    return this.api
      .get<RawInventoryTurnover>(API_ENDPOINTS.REPORTS.TURNOVER, {
        service: 'report',
        params: range,
      })
      .pipe(handleServiceError(this.serviceName, 'getInventoryTurnover'));
  }

  getLowStockReport(threshold = 10): Observable<InventorySnapshot[]> {
    return this.api
      .get<InventorySnapshot[]>(API_ENDPOINTS.REPORTS.LOW_STOCK, {
        service: 'report',
        params: { threshold },
      })
      .pipe(handleServiceError(this.serviceName, 'getLowStockReport'));
  }

  getDeadStock(days?: number): Observable<DeadStockItem[]> {
    return this.api
      .get<DeadStockItem[]>(API_ENDPOINTS.REPORTS.DEAD_STOCK, {
        service: 'report',
        params: { days },
      })
      .pipe(handleServiceError(this.serviceName, 'getDeadStock'));
  }

  getTopMovingProducts(limit = 10): Observable<TopMovingProduct[]> {
    return this.api
      .get<TopMovingProduct[]>(API_ENDPOINTS.REPORTS.TOP_MOVING, {
        service: 'report',
        params: { limit },
      })
      .pipe(handleServiceError(this.serviceName, 'getTopMovingProducts'));
  }

  getSlowMovingProducts(days?: number): Observable<TopMovingProduct[]> {
    return this.api
      .get<TopMovingProduct[]>(API_ENDPOINTS.REPORTS.SLOW_MOVING, {
        service: 'report',
        params: { days },
      })
      .pipe(handleServiceError(this.serviceName, 'getSlowMovingProducts'));
  }

  getPurchaseOrderSummary(range: DateRangeQuery): Observable<POSummary> {
    return this.api
      .get<POSummary>(API_ENDPOINTS.REPORTS.PO_SUMMARY, {
        service: 'report',
        params: range,
      })
      .pipe(handleServiceError(this.serviceName, 'getPurchaseOrderSummary'));
  }

  getMovementSummary(range: DateRangeQuery, warehouseId?: number): Observable<MovementSummary> {
    return this.api
      .get<MovementSummary>(API_ENDPOINTS.REPORTS.MOVEMENT_SUMMARY, {
        service: 'report',
        params: { warehouseId, ...range },
      })
      .pipe(handleServiceError(this.serviceName, 'getMovementSummary'));
  }

  exportReport(type: 'valuation' | 'movement'): Observable<string> {
    return this.api
      .get<string>(API_ENDPOINTS.REPORTS.EXPORT, {
        service: 'report',
        params: { type },
        responseType: 'text',
      })
      .pipe(handleServiceError(this.serviceName, 'exportReport'));
  }
}
