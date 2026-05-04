import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, map, shareReplay } from 'rxjs';
import {
  AlertResponse,
  AlertSummaryResponse,
  DeadStockItem,
  InventorySnapshot,
  POSummary,
  ProductSummary,
  PurchaseOrderResponse,
  MovementResponse,
  StockValuation,
  SupplierResponse,
  SupplierSummaryResponse,
  TopMovingProduct,
  UserProfile,
  WarehouseResponse,
} from '../../../core/http/backend.models';
import { AdminUserService } from '../../../core/services/admin-user.service';
import { PurchaseService } from '../../../core/services/purchase.service';
import { ReportService } from '../../../core/services/report.service';
import { WarehouseService } from '../../../core/services/warehouse.service';
import { PaymentService } from '../../../core/services/payment.service';
import { UI_CONSTANTS } from '../../../shared/config/app-config';
import { AlertApiService } from '../../alerts/services/alert-api.service';
import { MovementApiService } from '../../movements/services/movement-api.service';
import { PaymentSummaryResponse } from '../../payments/models/payment.model';
import { ProductApiService } from '../../products/services/product-api.service';
import { SupplierApiService } from '../../suppliers/services/supplier-api.service';

interface CacheEntry<T> {
  expiresAt: number;
  stream$: Observable<T>;
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly adminUserService = inject(AdminUserService);
  private readonly warehouseService = inject(WarehouseService);
  private readonly purchaseService = inject(PurchaseService);
  private readonly paymentService = inject(PaymentService);
  private readonly reportService = inject(ReportService);
  private readonly alertApiService = inject(AlertApiService);
  private readonly movementApiService = inject(MovementApiService);
  private readonly productApiService = inject(ProductApiService);
  private readonly supplierApiService = inject(SupplierApiService);
  private readonly cache = new Map<string, CacheEntry<unknown>>();
  private readonly cacheTtlMs = 30_000;

  getAdminSummary(forceRefresh = false): Observable<{
    users: UserProfile[];
    warehouses: WarehouseResponse[];
    valuation: StockValuation;
    alerts: AlertResponse[];
    alertSummary: AlertSummaryResponse;
    productSummary: ProductSummary;
    supplierSummary: SupplierSummaryResponse;
    paymentSummary: PaymentSummaryResponse;
  }> {
    return this.getCached('adminSummary', () =>
      forkJoin({
        users: this.adminUserService.getUsers({ page: 0, size: 200 }).pipe(map((page) => page.content)),
        warehouses: this.warehouseService.getWarehouses(),
        valuation: this.reportService.getTotalValuation(),
        alerts: this.alertApiService.getMyAlerts({ page: 0, size: 7, sortBy: 'createdAt', sortDir: 'desc' }).pipe(map((page) => page.content)),
        alertSummary: this.alertApiService.getMyAlertSummary(),
        productSummary: this.productApiService.getProductSummary(),
        supplierSummary: this.supplierApiService.getSupplierSummary(),
        paymentSummary: this.paymentService.getPaymentSummary(),
      }),
      forceRefresh
    );
  }

  getInventorySummary(forceRefresh = false): Observable<{
    valuation: StockValuation;
    lowStock: InventorySnapshot[];
    topMoving: TopMovingProduct[];
    deadStock: DeadStockItem[];
    movements: MovementResponse[];
    alertSummary: AlertSummaryResponse;
    productSummary: ProductSummary;
    supplierSummary: SupplierSummaryResponse;
    paymentSummary: PaymentSummaryResponse;
  }> {
    return this.getCached('inventorySummary', () =>
      forkJoin({
        valuation: this.reportService.getTotalValuation(),
        lowStock: this.reportService.getLowStockReport(),
        topMoving: this.reportService.getTopMovingProducts(),
        deadStock: this.reportService.getDeadStock(),
        movements: this.movementApiService.getMovements({ page: 0, size: 8, sortBy: 'movementDate', sortDir: 'desc' }).pipe(map((page) => page.content)),
        alertSummary: this.alertApiService.getMyAlertSummary(),
        productSummary: this.productApiService.getProductSummary(),
        supplierSummary: this.supplierApiService.getSupplierSummary(),
        paymentSummary: this.paymentService.getPaymentSummary(),
      }),
      forceRefresh
    );
  }

  getPurchaseSummary(forceRefresh = false): Observable<{
    orders: PurchaseOrderResponse[];
    overdue: PurchaseOrderResponse[];
    summary: POSummary;
    suppliers: SupplierResponse[];
    alertSummary: AlertSummaryResponse;
    supplierSummary: SupplierSummaryResponse;
    paymentSummary: PaymentSummaryResponse;
  }> {
    const range = this.buildDateRangeQuery();
    return this.getCached('purchaseSummary', () =>
      forkJoin({
        orders: this.purchaseService.getPurchaseOrders(),
        overdue: this.purchaseService.getOverduePurchaseOrders(),
        summary: this.reportService.getPurchaseOrderSummary(range),
        suppliers: this.purchaseService.getTopRatedSuppliers(0),
        alertSummary: this.alertApiService.getMyAlertSummary(),
        supplierSummary: this.supplierApiService.getSupplierSummary(),
        paymentSummary: this.paymentService.getPaymentSummary(),
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
