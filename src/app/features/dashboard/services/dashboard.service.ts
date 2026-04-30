import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, shareReplay } from 'rxjs';
import {
  AlertResponse,
  DeadStockItem,
  InventorySnapshot,
  POSummary,
  PurchaseOrderResponse,
  StockMovementResponse,
  StockValuation,
  SupplierResponse,
  TopMovingProduct,
  UserProfile,
  WarehouseResponse,
} from '../../../core/http/backend.models';
import { AuthService } from '../../../core/auth/services/auth.service';
import { AlertService } from '../../../core/services/alert.service';
import { MovementService } from '../../../core/services/movement.service';
import { PurchaseService } from '../../../core/services/purchase.service';
import { ReportService } from '../../../core/services/report.service';
import { WarehouseService } from '../../../core/services/warehouse.service';
import { API_ENDPOINTS, UI_CONSTANTS } from '../../../shared/config/app-config';

interface CacheEntry<T> {
  expiresAt: number;
  stream$: Observable<T>;
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly authService = inject(AuthService);
  private readonly warehouseService = inject(WarehouseService);
  private readonly purchaseService = inject(PurchaseService);
  private readonly reportService = inject(ReportService);
  private readonly alertService = inject(AlertService);
  private readonly movementService = inject(MovementService);
  private readonly cache = new Map<string, CacheEntry<unknown>>();
  private readonly cacheTtlMs = 30_000;

  getAdminSummary(forceRefresh = false): Observable<{
    users: UserProfile[];
    warehouses: WarehouseResponse[];
    valuation: StockValuation;
    alerts: AlertResponse[];
  }> {
    return this.getCached('adminSummary', () =>
      forkJoin({
        users: this.authService.getUsers(),
        warehouses: this.warehouseService.getWarehouses(),
        valuation: this.reportService.getTotalValuation(),
        alerts: this.alertService.getRecentAlerts(7),
      }),
      forceRefresh
    );
  }

  getInventorySummary(forceRefresh = false): Observable<{
    valuation: StockValuation;
    lowStock: InventorySnapshot[];
    topMoving: TopMovingProduct[];
    deadStock: DeadStockItem[];
    movements: StockMovementResponse[];
  }> {
    return this.getCached('inventorySummary', () =>
      forkJoin({
        valuation: this.reportService.getTotalValuation(),
        lowStock: this.reportService.getLowStockReport(),
        topMoving: this.reportService.getTopMovingProducts(),
        deadStock: this.reportService.getDeadStock(),
        movements: this.movementService.getMovements(),
      }),
      forceRefresh
    );
  }

  getPurchaseSummary(forceRefresh = false): Observable<{
    orders: PurchaseOrderResponse[];
    overdue: PurchaseOrderResponse[];
    summary: POSummary;
    suppliers: SupplierResponse[];
  }> {
    const range = this.buildDateRangeQuery();
    return this.getCached('purchaseSummary', () =>
      forkJoin({
        orders: this.purchaseService.getPurchaseOrders(),
        overdue: this.purchaseService.getOverduePurchaseOrders(),
        summary: this.reportService.getPurchaseOrderSummary(range),
        suppliers: this.purchaseService.getTopRatedSuppliers(0),
      }),
      forceRefresh
    );
  }

  getWarehouseSummary(forceRefresh = false): Observable<{
    warehouses: WarehouseResponse[];
    movements: StockMovementResponse[];
    alerts: AlertResponse[];
    lowStock: InventorySnapshot[];
  }> {
    return this.getCached('warehouseSummary', () =>
      forkJoin({
        warehouses: this.warehouseService.getWarehouses(),
        movements: this.movementService.getMovements(),
        alerts: this.alertService.getRecentAlerts(7),
        lowStock: this.reportService.getLowStockReport(),
      }),
      forceRefresh
    );
  }

  invalidateCache(): void {
    this.cache.clear();
  }

  private getCached<T>(key: string, factory: () => Observable<T>, forceRefresh: boolean): Observable<T> {
    const now = Date.now();
    const cached = this.cache.get(key) as CacheEntry<T> | undefined;

    if (!forceRefresh && cached && cached.expiresAt > now) {
      return cached.stream$;
    }

    const stream$ = factory().pipe(shareReplay(1));
    this.cache.set(key, {
      expiresAt: now + this.cacheTtlMs,
      stream$,
    });

    return stream$;
  }

  private buildDateRangeQuery() {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - UI_CONSTANTS.DEFAULT_REPORT_DAYS);

    return {
      startDate: startDate.toISOString().slice(0, 10),
      endDate: endDate.toISOString().slice(0, 10),
    };
  }
}
