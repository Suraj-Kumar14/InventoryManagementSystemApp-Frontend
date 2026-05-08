import { Injectable, inject } from '@angular/core';
import { Observable, map, of } from 'rxjs';
import {
  AlertSummaryReportResponse,
  DeadStockItem,
  DeadStockReportResponse,
  ExecutiveDashboardReportResponse,
  InventoryReportSummaryResponse,
  InventorySnapshot,
  InventorySnapshotResponse,
  InventoryTurnover,
  InventoryTurnoverReportResponse,
  InventoryValuationReportResponse,
  LowStockReportItem,
  OverstockReportItem,
  PageResponse,
  PaymentSummaryReportResponse,
  POSummary,
  ProductValuationItem,
  PurchaseSummaryReportResponse,
  ReportExportFormat,
  ReportFilter,
  SlowMovingProductResponse,
  StockMovementReportItem,
  StockMovementSummary,
  StockValuation,
  SupplierPerformanceReportResponse,
  TopMovingProduct,
  TopMovingProductReportResponse,
  WarehouseValuationItem,
} from '../http/backend.models';
import { ApiService } from '../http/api.service';
import { handleServiceError } from '../http/http.utils';
import { API_ENDPOINTS } from '../../shared/config/app-config';

export interface DateRangeQuery {
  startDate: string;
  endDate: string;
}

@Injectable({ providedIn: 'root' })
export class ReportService {
  private readonly api = inject(ApiService);
  private readonly serviceName = 'ReportService';

  getInventoryValuation(filters: ReportFilter = {}): Observable<InventoryValuationReportResponse> {
    return this.api
      .get<InventoryValuationReportResponse>(API_ENDPOINTS.REPORTS.INVENTORY_VALUATION, {
        params: filters,
      })
      .pipe(handleServiceError(this.serviceName, 'getInventoryValuation'));
  }

  getStockSummary(filters: ReportFilter = {}): Observable<InventoryReportSummaryResponse> {
    return this.api
      .get<InventoryReportSummaryResponse>(API_ENDPOINTS.REPORTS.STOCK_SUMMARY, { params: filters })
      .pipe(handleServiceError(this.serviceName, 'getStockSummary'));
  }

  getProductStockReport(filters: ReportFilter = {}): Observable<PageResponse<ProductValuationItem>> {
    return this.api
      .get<PageResponse<ProductValuationItem>>(API_ENDPOINTS.REPORTS.PRODUCT_STOCK, { params: filters })
      .pipe(handleServiceError(this.serviceName, 'getProductStockReport'));
  }

  getWarehouseStockReport(filters: ReportFilter = {}): Observable<PageResponse<WarehouseValuationItem>> {
    return this.api
      .get<PageResponse<WarehouseValuationItem>>(API_ENDPOINTS.REPORTS.WAREHOUSE_STOCK, { params: filters })
      .pipe(handleServiceError(this.serviceName, 'getWarehouseStockReport'));
  }

  getLowStockItems(filters: ReportFilter = {}): Observable<PageResponse<LowStockReportItem>> {
    return this.api
      .get<PageResponse<LowStockReportItem>>(API_ENDPOINTS.REPORTS.LOW_STOCK, { params: filters })
      .pipe(handleServiceError(this.serviceName, 'getLowStockItems'));
  }

  getOverstockReport(filters: ReportFilter = {}): Observable<PageResponse<OverstockReportItem>> {
    return this.api
      .get<PageResponse<OverstockReportItem>>(API_ENDPOINTS.REPORTS.OVERSTOCK, { params: filters })
      .pipe(handleServiceError(this.serviceName, 'getOverstockReport'));
  }

  getStockMovementReport(filters: ReportFilter = {}): Observable<PageResponse<StockMovementReportItem>> {
    return this.api
      .get<PageResponse<StockMovementReportItem>>(API_ENDPOINTS.REPORTS.MOVEMENTS, { params: filters })
      .pipe(handleServiceError(this.serviceName, 'getStockMovementReport'));
  }

  getInventoryTurnoverReport(filters: ReportFilter = {}): Observable<InventoryTurnoverReportResponse[]> {
    return this.api
      .get<InventoryTurnoverReportResponse[]>(API_ENDPOINTS.REPORTS.TURNOVER, { params: filters })
      .pipe(handleServiceError(this.serviceName, 'getInventoryTurnoverReport'));
  }

  getTopMovingProductsReport(filters: ReportFilter = {}): Observable<TopMovingProductReportResponse[]> {
    return this.api
      .get<TopMovingProductReportResponse[]>(API_ENDPOINTS.REPORTS.TOP_MOVING, { params: filters })
      .pipe(handleServiceError(this.serviceName, 'getTopMovingProductsReport'));
  }

  getSlowMovingProductsReport(filters: ReportFilter = {}): Observable<SlowMovingProductResponse[]> {
    return this.api
      .get<SlowMovingProductResponse[]>(API_ENDPOINTS.REPORTS.SLOW_MOVING, { params: filters })
      .pipe(handleServiceError(this.serviceName, 'getSlowMovingProductsReport'));
  }

  getDeadStockReport(filters: ReportFilter = {}): Observable<DeadStockReportResponse[]> {
    return this.api
      .get<DeadStockReportResponse[]>(API_ENDPOINTS.REPORTS.DEAD_STOCK, { params: filters })
      .pipe(handleServiceError(this.serviceName, 'getDeadStockReport'));
  }

  getPurchaseSummaryReport(filters: ReportFilter = {}): Observable<PurchaseSummaryReportResponse> {
    return this.api
      .get<PurchaseSummaryReportResponse>(API_ENDPOINTS.REPORTS.PURCHASE_SUMMARY, { params: filters })
      .pipe(handleServiceError(this.serviceName, 'getPurchaseSummaryReport'));
  }

  getSupplierPerformanceReport(filters: ReportFilter = {}): Observable<PageResponse<SupplierPerformanceReportResponse>> {
    return this.api
      .get<PageResponse<SupplierPerformanceReportResponse>>(API_ENDPOINTS.REPORTS.SUPPLIER_PERFORMANCE, {
        params: filters,
      })
      .pipe(handleServiceError(this.serviceName, 'getSupplierPerformanceReport'));
  }

  getSupplierPerformance(supplierId: number, filters: ReportFilter = {}): Observable<SupplierPerformanceReportResponse> {
    return this.api
      .get<SupplierPerformanceReportResponse>(API_ENDPOINTS.REPORTS.SUPPLIER_PERFORMANCE_BY_ID(supplierId), {
        params: filters,
      })
      .pipe(handleServiceError(this.serviceName, 'getSupplierPerformance'));
  }

  getPaymentSummaryReport(filters: ReportFilter = {}): Observable<PaymentSummaryReportResponse> {
    return of({
      totalPayments: 0,
      pendingCount: 0,
      paidCount: 0,
      cancelledCount: 0,
      pendingAmount: 0,
      totalPaidAmount: 0,
      supplierPayments: []
    });
  }

  getAlertSummaryReport(filters: ReportFilter = {}): Observable<AlertSummaryReportResponse> {
    return this.api
      .get<AlertSummaryReportResponse>(API_ENDPOINTS.REPORTS.ALERT_SUMMARY, { params: filters })
      .pipe(handleServiceError(this.serviceName, 'getAlertSummaryReport'));
  }

  getExecutiveDashboard(): Observable<ExecutiveDashboardReportResponse> {
    return this.api
      .get<ExecutiveDashboardReportResponse>(API_ENDPOINTS.REPORTS.EXECUTIVE_DASHBOARD)
      .pipe(handleServiceError(this.serviceName, 'getExecutiveDashboard'));
  }

  getMyDashboard(): Observable<ExecutiveDashboardReportResponse> {
    return this.api
      .get<ExecutiveDashboardReportResponse>(API_ENDPOINTS.REPORTS.MY_DASHBOARD)
      .pipe(handleServiceError(this.serviceName, 'getMyDashboard'));
  }

  runInventorySnapshot(date?: string): Observable<void> {
    return this.api
      .post<void>(API_ENDPOINTS.REPORTS.SNAPSHOT_RUN, {}, { params: date ? { date } : {} })
      .pipe(handleServiceError(this.serviceName, 'runInventorySnapshot'));
  }

  getInventorySnapshots(date: string, page = 0, size = 10): Observable<PageResponse<InventorySnapshotResponse>> {
    return this.api
      .get<PageResponse<InventorySnapshotResponse>>(API_ENDPOINTS.REPORTS.SNAPSHOTS, {
        params: { date, page, size },
      })
      .pipe(handleServiceError(this.serviceName, 'getInventorySnapshots'));
  }

  getSnapshotTrend(productId?: number, warehouseId?: number, fromDate?: string, toDate?: string): Observable<InventorySnapshotResponse[]> {
    return this.api
      .get<InventorySnapshotResponse[]>(API_ENDPOINTS.REPORTS.SNAPSHOT_TREND, {
        params: { productId, warehouseId, fromDate, toDate },
      })
      .pipe(handleServiceError(this.serviceName, 'getSnapshotTrend'));
  }

  exportInventoryValuation(filters: ReportFilter = {}, format: ReportExportFormat): Observable<Blob> {
    return this.api
      .get<Blob>(API_ENDPOINTS.REPORTS.EXPORT_INVENTORY_VALUATION, {
        params: { ...filters, format },
        responseType: 'blob',
      })
      .pipe(handleServiceError(this.serviceName, 'exportInventoryValuation'));
  }

  exportStockMovements(filters: ReportFilter = {}, format: ReportExportFormat): Observable<Blob> {
    return this.api
      .get<Blob>(API_ENDPOINTS.REPORTS.EXPORT_STOCK_MOVEMENTS, {
        params: { ...filters, format },
        responseType: 'blob',
      })
      .pipe(handleServiceError(this.serviceName, 'exportStockMovements'));
  }

  exportPurchaseSummary(filters: ReportFilter = {}, format: ReportExportFormat): Observable<Blob> {
    return this.api
      .get<Blob>(API_ENDPOINTS.REPORTS.EXPORT_PURCHASE_SUMMARY, {
        params: { ...filters, format },
        responseType: 'blob',
      })
      .pipe(handleServiceError(this.serviceName, 'exportPurchaseSummary'));
  }

  exportSupplierPerformance(filters: ReportFilter = {}, format: ReportExportFormat): Observable<Blob> {
    return this.api
      .get<Blob>(API_ENDPOINTS.REPORTS.EXPORT_SUPPLIER_PERFORMANCE, {
        params: { ...filters, format },
        responseType: 'blob',
      })
      .pipe(handleServiceError(this.serviceName, 'exportSupplierPerformance'));
  }

  exportExecutiveDashboard(format: ReportExportFormat): Observable<Blob> {
    return this.api
      .get<Blob>(API_ENDPOINTS.REPORTS.EXPORT_EXECUTIVE_DASHBOARD, {
        params: { format },
        responseType: 'blob',
      })
      .pipe(handleServiceError(this.serviceName, 'exportExecutiveDashboard'));
  }

  // Compatibility methods used by existing dashboards
  getLatestSnapshot(): Observable<InventorySnapshot[]> {
    const today = new Date().toISOString().slice(0, 10);
    return this.getInventorySnapshots(today, 0, 200).pipe(
      map((page) =>
        page.content.map((snapshot) => ({
          snapshotId: snapshot.snapshotId,
          warehouseId: snapshot.warehouseId,
          productId: snapshot.productId,
          quantity: snapshot.quantity,
          stockValue: snapshot.totalValue,
          snapshotDate: snapshot.snapshotDate,
          createdAt: snapshot.createdAt,
        }))
      )
    );
  }

  getTotalValuation(): Observable<StockValuation> {
    return this.getInventoryValuation().pipe(
      map((valuation) => ({
        totalValue: valuation.totalInventoryValue,
        totalProducts: valuation.totalProducts,
        asOfDate: new Date().toISOString().slice(0, 10),
      }))
    );
  }

  getWarehouseValuation(warehouseId: number): Observable<StockValuation> {
    return this.getWarehouseStockReport({ warehouseId, page: 0, size: 1 }).pipe(
      map((page) => {
        const item = page.content[0];
        return {
          warehouseId,
          totalValue: item?.totalValue ?? 0,
          totalProducts: 1,
          asOfDate: new Date().toISOString().slice(0, 10),
        };
      })
    );
  }

  getInventoryTurnover(range: DateRangeQuery): Observable<InventoryTurnover> {
    return this.getInventoryTurnoverReport({
      fromDate: range.startDate,
      toDate: range.endDate,
      period: 'CUSTOM',
    }).pipe(
      map((items) => {
        const totalStockOut = items.reduce((sum, item) => sum + item.stockOutQuantity, 0);
        const totalAverageInventory = items.reduce((sum, item) => sum + item.averageInventory, 0);
        return {
          startDate: range.startDate,
          endDate: range.endDate,
          cogs: totalStockOut,
          averageInventoryValue: totalAverageInventory,
          inventoryTurnover: totalAverageInventory > 0 ? totalStockOut / totalAverageInventory : 0,
        };
      })
    );
  }

  getLowStockReport(threshold?: number): Observable<InventorySnapshot[]> {
    return this.getLowStockItems().pipe(
      map((page) =>
        page.content
          .filter((item) => threshold == null || item.availableQuantity <= threshold)
          .map((item) => ({
            snapshotId: item.productId,
            warehouseId: item.warehouseId,
            productId: item.productId,
            quantity: item.availableQuantity,
            stockValue: item.shortageQuantity,
            snapshotDate: new Date().toISOString().slice(0, 10),
          }))
      )
    );
  }

  getDeadStock(days?: number): Observable<DeadStockItem[]> {
    return this.getDeadStockReport().pipe(
      map((items) =>
        items
          .filter((item) => days == null || item.daysWithoutMovement >= days)
          .map((item) => ({
            productId: item.productId,
            warehouseId: item.warehouseId,
            currentQuantity: item.currentQuantity,
            lastMovementDate: item.lastMovementDate,
            daysWithoutMovement: item.daysWithoutMovement,
          }))
      )
    );
  }

  getTopMovingProducts(limit = 10): Observable<TopMovingProduct[]> {
    return this.getTopMovingProductsReport({ size: limit }).pipe(
      map((items) =>
        items.slice(0, limit).map((item) => ({
          productId: item.productId,
          productName: item.productName ?? 'Unknown product',
          warehouseId: 0,
          totalUnitsIn: 0,
          totalUnitsOut: item.totalMovementQuantity,
          totalMovement: item.totalMovementQuantity,
        }))
      )
    );
  }

  getSlowMovingProducts(days?: number): Observable<TopMovingProduct[]> {
    return this.getSlowMovingProductsReport().pipe(
      map((items) =>
        items
          .filter((item) => days == null || item.daysSinceLastMovement >= days)
          .map((item) => ({
            productId: item.productId,
            productName: item.productName ?? 'Unknown product',
            warehouseId: 0,
            totalUnitsIn: 0,
            totalUnitsOut: 0,
            totalMovement: item.currentQuantity,
          }))
      )
    );
  }

  getPurchaseOrderSummary(range: DateRangeQuery): Observable<POSummary> {
    return this.getPurchaseSummaryReport({
      fromDate: range.startDate,
      toDate: range.endDate,
      period: 'CUSTOM',
    }).pipe(
      map((summary) => ({
        fromDate: range.startDate,
        toDate: range.endDate,
        totalPOs: summary.totalPurchaseOrders,
        totalSpend: summary.totalPurchaseValue,
        approvedPOs: summary.approvedCount,
        pendingPOs: summary.pendingApprovalCount,
        cancelledPOs: summary.cancelledCount,
        fullyReceivedPOs: summary.receivedCount,
      }))
    );
  }

  getMovementSummary(range: DateRangeQuery, warehouseId?: number): Observable<StockMovementSummary> {
    return this.getStockMovementReport({
      warehouseId,
      fromDate: range.startDate,
      toDate: range.endDate,
      period: 'CUSTOM',
      page: 0,
      size: 200,
    }).pipe(
      map((page) => ({
        warehouseId: warehouseId ?? 'ALL',
        fromDate: range.startDate,
        toDate: range.endDate,
        totalStockIn: page.content.filter((item) => item.direction === 'IN').reduce((sum, item) => sum + item.quantity, 0),
        totalStockOut: page.content.filter((item) => item.direction === 'OUT').reduce((sum, item) => sum + item.quantity, 0),
        totalAdjustments: page.content.filter((item) => item.movementType === 'ADJUSTMENT').reduce((sum, item) => sum + item.quantity, 0),
        totalTransfers: page.content.filter((item) => item.movementType?.includes('TRANSFER')).reduce((sum, item) => sum + item.quantity, 0),
      }))
    );
  }

  exportReport(type: 'valuation' | 'movement'): Observable<Blob> {
    return type === 'valuation'
      ? this.exportInventoryValuation({}, 'CSV')
      : this.exportStockMovements({}, 'CSV');
  }
}
