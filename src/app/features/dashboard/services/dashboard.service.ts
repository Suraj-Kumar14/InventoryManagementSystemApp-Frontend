import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { forkJoin, map } from 'rxjs';
import {
  AlertResponse,
  DeadStockItem,
  POSummary,
  PurchaseOrderResponse,
  StockLevelResponse,
  StockMovementResponse,
  StockValuation,
  SupplierResponse,
  TopMovingProduct,
  UserProfile,
  WarehouseResponse,
} from '../../../core/http/backend.models';
import { API_ENDPOINTS, UI_CONSTANTS } from '../../../shared/config/app-config';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;

  getAdminSummary() {
    return forkJoin({
      users: this.http.get<UserProfile[]>(`${this.baseUrl}${API_ENDPOINTS.AUTH.USERS}`),
      warehouses: this.http.get<WarehouseResponse[]>(`${this.baseUrl}${API_ENDPOINTS.WAREHOUSES.ROOT}`),
      valuation: this.http.get<StockValuation>(`${this.baseUrl}${API_ENDPOINTS.REPORTS.TOTAL_VALUATION}`),
      alerts: this.http.get<AlertResponse[]>(`${this.baseUrl}${API_ENDPOINTS.ALERTS.RECENT}`, {
        params: new HttpParams().set('days', 7),
      }),
    });
  }

  getInventorySummary() {
    return forkJoin({
      valuation: this.http.get<StockValuation>(`${this.baseUrl}${API_ENDPOINTS.REPORTS.TOTAL_VALUATION}`),
      lowStock: this.http.get<StockLevelResponse[]>(`${this.baseUrl}${API_ENDPOINTS.REPORTS.LOW_STOCK}`),
      topMoving: this.http.get<TopMovingProduct[]>(`${this.baseUrl}${API_ENDPOINTS.REPORTS.TOP_MOVING}`),
      deadStock: this.http.get<DeadStockItem[]>(`${this.baseUrl}${API_ENDPOINTS.REPORTS.DEAD_STOCK}`),
      movements: this.http.get<StockMovementResponse[]>(`${this.baseUrl}${API_ENDPOINTS.MOVEMENTS.ROOT}`),
    });
  }

  getPurchaseSummary() {
    const params = this.buildDateRangeParams();
    return forkJoin({
      orders: this.http.get<PurchaseOrderResponse[]>(`${this.baseUrl}${API_ENDPOINTS.PURCHASE_ORDERS.ROOT}`),
      overdue: this.http.get<PurchaseOrderResponse[]>(`${this.baseUrl}${API_ENDPOINTS.PURCHASE_ORDERS.OVERDUE}`),
      summary: this.http.get<POSummary>(`${this.baseUrl}${API_ENDPOINTS.REPORTS.PO_SUMMARY}`, { params }),
      suppliers: this.http.get<SupplierResponse[]>(`${this.baseUrl}${API_ENDPOINTS.SUPPLIERS.TOP_RATED}`, {
        params: new HttpParams().set('minRating', 0),
      }),
    });
  }

  getWarehouseSummary() {
    return forkJoin({
      warehouses: this.http.get<WarehouseResponse[]>(`${this.baseUrl}${API_ENDPOINTS.WAREHOUSES.ROOT}`),
      movements: this.http.get<StockMovementResponse[]>(`${this.baseUrl}${API_ENDPOINTS.MOVEMENTS.ROOT}`),
      alerts: this.http.get<AlertResponse[]>(`${this.baseUrl}${API_ENDPOINTS.ALERTS.RECENT}`, {
        params: new HttpParams().set('days', 7),
      }),
      lowStock: this.http.get<StockLevelResponse[]>(`${this.baseUrl}${API_ENDPOINTS.STOCK.LOW_STOCK}`),
    });
  }

  getTurnover() {
    return this.http.get<Record<string, unknown>>(`${this.baseUrl}${API_ENDPOINTS.REPORTS.TURNOVER}`, {
      params: this.buildDateRangeParams(),
    });
  }

  private buildDateRangeParams() {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - UI_CONSTANTS.DEFAULT_REPORT_DAYS);

    return new HttpParams()
      .set('startDate', startDate.toISOString().slice(0, 10))
      .set('endDate', endDate.toISOString().slice(0, 10));
  }
}
