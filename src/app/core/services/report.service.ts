import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DashboardKpi, LowStockReport, TopMovingProduct, DeadStockItem, TotalStockValue, WarehouseStockValue } from '../models';

@Injectable({ providedIn: 'root' })
export class ReportService {
  private readonly base = `${environment.apiUrl}/api/v1/reports`;

  constructor(private http: HttpClient) {}

  getDashboardKpis(): Observable<DashboardKpi> {
    return this.http.get<DashboardKpi>(`${this.base}/dashboard-kpis`);
  }

  getTotalStockValue(asOfDate?: string, warehouseId?: number): Observable<TotalStockValue> {
    let params = new HttpParams();
    if (asOfDate)    params = params.set('asOfDate', asOfDate);
    if (warehouseId) params = params.set('warehouseId', warehouseId);
    return this.http.get<TotalStockValue>(`${this.base}/total-stock-value`, { params });
  }

  getStockValueByWarehouse(asOfDate?: string): Observable<WarehouseStockValue[]> {
    let params = new HttpParams();
    if (asOfDate) params = params.set('asOfDate', asOfDate);
    return this.http.get<WarehouseStockValue[]>(`${this.base}/stock-value-by-warehouse`, { params });
  }

  getLowStockReport(warehouseId?: number): Observable<LowStockReport[]> {
    let params = new HttpParams();
    if (warehouseId) params = params.set('warehouseId', warehouseId);
    return this.http.get<LowStockReport[]>(`${this.base}/low-stock`, { params });
  }

  getTopMovingProducts(limit = 10, warehouseId?: number): Observable<TopMovingProduct[]> {
    let params = new HttpParams().set('limit', limit);
    if (warehouseId) params = params.set('warehouseId', warehouseId);
    return this.http.get<TopMovingProduct[]>(`${this.base}/top-moving`, { params });
  }

  getDeadStock(thresholdDays = 90, warehouseId?: number): Observable<DeadStockItem[]> {
    let params = new HttpParams().set('thresholdDays', thresholdDays);
    if (warehouseId) params = params.set('warehouseId', warehouseId);
    return this.http.get<DeadStockItem[]>(`${this.base}/dead-stock`, { params });
  }

  exportReport(reportType: string, format = 'CSV', filters?: object): Observable<{ fileUrl: string; status: string }> {
    return this.http.post<{ fileUrl: string; status: string }>(`${this.base}/export`, { reportType, format, filters });
  }
}
