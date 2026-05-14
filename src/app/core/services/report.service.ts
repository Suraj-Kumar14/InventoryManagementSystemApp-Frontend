import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import {
  ExecutiveDashboardReportResponse,
  GeneratedInventoryReportResponse,
  InventoryReportSummaryResponse,
  InventoryTurnoverReportResponse,
  InventoryValuationReportResponse,
  LowStockReportItem,
  PageResponse,
  PaymentSummaryReportResponse,
  ProductMovementSummaryResponse,
  PurchaseSummaryReportResponse,
  ReportFilter,
  SlowMovingProductResponse,
  SupplierPerformanceReportResponse,
  TopMovingProductReportResponse,
  WarehouseValuationItem,
} from '../http/backend.models';
import { ApiService } from '../http/api.service';
import { handleServiceError } from '../http/http.utils';
import { API_ENDPOINTS } from '../../shared/config/app-config';

@Injectable({ providedIn: 'root' })
export class ReportService {
  private readonly api = inject(ApiService);
  private readonly serviceName = 'ReportService';

  getTotalValue(filters: ReportFilter = {}): Observable<InventoryValuationReportResponse> {
    return this.api
      .get<InventoryValuationReportResponse>(API_ENDPOINTS.REPORTS.TOTAL_VALUE, {
        params: {
          warehouseId: filters.warehouseId,
          asOfDate: filters.toDate,
        },
        headers: { 'X-Skip-Global-Error': 'true' },
      })
      .pipe(handleServiceError<InventoryValuationReportResponse>(this.serviceName, 'getTotalValue'));
  }

  getStockValueByWarehouse(filters: ReportFilter = {}): Observable<WarehouseValuationItem[]> {
    return this.api
      .get<WarehouseValuationItem[]>(API_ENDPOINTS.REPORTS.BY_WAREHOUSE, {
        params: { asOfDate: filters.toDate },
        headers: { 'X-Skip-Global-Error': 'true' },
      })
      .pipe(handleServiceError<WarehouseValuationItem[]>(this.serviceName, 'getStockValueByWarehouse'));
  }

  getInventoryTurnoverReport(filters: ReportFilter = {}): Observable<InventoryTurnoverReportResponse> {
    return this.api
      .get<InventoryTurnoverReportResponse>(API_ENDPOINTS.REPORTS.TURNOVER, {
        params: {
          from: filters.fromDate,
          to: filters.toDate,
          warehouseId: filters.warehouseId,
        },
        headers: { 'X-Skip-Global-Error': 'true' },
      })
      .pipe(handleServiceError<InventoryTurnoverReportResponse>(this.serviceName, 'getInventoryTurnoverReport'));
  }

  getLowStockItems(filters: ReportFilter = {}): Observable<PageResponse<LowStockReportItem>> {
    return this.api
      .get<PageResponse<LowStockReportItem>>(API_ENDPOINTS.REPORTS.LOW_STOCK, {
        params: {
          warehouseId: filters.warehouseId,
          productId: filters.productId,
          page: filters.page ?? 0,
          size: filters.size ?? 20,
        },
        headers: { 'X-Skip-Global-Error': 'true' },
      })
      .pipe(handleServiceError<PageResponse<LowStockReportItem>>(this.serviceName, 'getLowStockItems'));
  }

  getTopMovingProductsReport(filters: ReportFilter = {}): Observable<TopMovingProductReportResponse[]> {
    return this.api
      .get<TopMovingProductReportResponse[]>(API_ENDPOINTS.REPORTS.TOP_MOVING, {
        params: {
          from: filters.fromDate,
          to: filters.toDate,
          warehouseId: filters.warehouseId,
          size: filters.size ?? 10,
        },
        headers: { 'X-Skip-Global-Error': 'true' },
      })
      .pipe(handleServiceError<TopMovingProductReportResponse[]>(this.serviceName, 'getTopMovingProductsReport'));
  }

  getSlowMovingProductsReport(filters: ReportFilter = {}, threshold = 5): Observable<SlowMovingProductResponse[]> {
    return this.api
      .get<SlowMovingProductResponse[]>(API_ENDPOINTS.REPORTS.SLOW_MOVING, {
        params: {
          from: filters.fromDate,
          to: filters.toDate,
          warehouseId: filters.warehouseId,
          threshold,
        },
        headers: { 'X-Skip-Global-Error': 'true' },
      })
      .pipe(handleServiceError<SlowMovingProductResponse[]>(this.serviceName, 'getSlowMovingProductsReport'));
  }

  getDeadStockReport(filters: ReportFilter = {}, days = 90): Observable<import('../http/backend.models').DeadStockReportResponse[]> {
    return this.api
      .get<import('../http/backend.models').DeadStockReportResponse[]>(API_ENDPOINTS.REPORTS.DEAD_STOCK, {
        params: {
          warehouseId: filters.warehouseId,
          days,
        },
        headers: { 'X-Skip-Global-Error': 'true' },
      })
      .pipe(handleServiceError<import('../http/backend.models').DeadStockReportResponse[]>(this.serviceName, 'getDeadStockReport'));
  }

  getPurchaseSummaryReport(filters: ReportFilter = {}): Observable<PurchaseSummaryReportResponse> {
    return this.api
      .get<PurchaseSummaryReportResponse>(API_ENDPOINTS.REPORTS.PO_SUMMARY, {
        params: {
          from: filters.fromDate,
          to: filters.toDate,
          fromDate: filters.fromDate,
          toDate: filters.toDate,
          period: filters.period,
          warehouseId: filters.warehouseId,
          supplierId: filters.supplierId,
        },
        headers: { 'X-Skip-Global-Error': 'true' },
      })
      .pipe(handleServiceError<PurchaseSummaryReportResponse>(this.serviceName, 'getPurchaseSummaryReport'));
  }

  generateInventoryReport(filters: ReportFilter = {}, threshold = 5, deadStockDays = 90): Observable<GeneratedInventoryReportResponse> {
    return this.api
      .get<GeneratedInventoryReportResponse>(API_ENDPOINTS.REPORTS.GENERATE_REPORT, {
        params: {
          fromDate: filters.fromDate,
          toDate: filters.toDate,
          warehouseId: filters.warehouseId,
          supplierId: filters.supplierId,
          page: filters.page ?? 0,
          size: filters.size ?? 10,
          period: filters.period,
          threshold,
          deadStockDays,
        },
        headers: { 'X-Skip-Global-Error': 'true' },
      })
      .pipe(handleServiceError<GeneratedInventoryReportResponse>(this.serviceName, 'generateInventoryReport'));
  }

  getInventoryValuation(filters: ReportFilter = {}): Observable<InventoryValuationReportResponse> {
    return this.getTotalValue(filters);
  }

  getWarehouseStockReport(filters: ReportFilter = {}): Observable<PageResponse<WarehouseValuationItem>> {
    return this.getStockValueByWarehouse(filters).pipe(
      map((content) => ({
        content,
        totalElements: content.length,
        totalPages: 1,
        number: 0,
        size: content.length || 1,
        numberOfElements: content.length,
        first: true,
        last: true,
        empty: content.length === 0,
      }))
    );
  }

  getStockSummary(filters: ReportFilter = {}): Observable<InventoryReportSummaryResponse> {
    return this.generateInventoryReport(filters).pipe(
      map((report) => ({
        totalProducts: report.valuation.totalProducts,
        totalWarehouses: report.valuation.totalWarehouses,
        totalStockQuantity: report.valuation.totalQuantity,
        totalReservedQuantity: 0,
        totalAvailableQuantity: report.valuation.totalQuantity,
        lowStockCount: report.lowStock.length,
        overstockCount: 0,
        outOfStockCount: report.lowStock.filter((item) => Number(item.availableQuantity ?? 0) <= 0).length,
      }))
    );
  }

  getStockMovementSummary(filters: ReportFilter = {}): Observable<PageResponse<ProductMovementSummaryResponse>> {
    return this.generateInventoryReport(filters).pipe(
      map((report) => ({
        content: report.movementVelocity,
        totalElements: report.movementVelocity.length,
        totalPages: 1,
        number: 0,
        size: report.movementVelocity.length || 1,
        numberOfElements: report.movementVelocity.length,
        first: true,
        last: true,
        empty: report.movementVelocity.length === 0,
      }))
    );
  }

  getExecutiveDashboard(): Observable<ExecutiveDashboardReportResponse> {
    return this.generateInventoryReport({ period: 'LAST_30_DAYS', page: 0, size: 5 }, 5, 90).pipe(
      map((report) => this.toExecutiveDashboard(report))
    );
  }

  getMyDashboard(): Observable<ExecutiveDashboardReportResponse> {
    return this.getExecutiveDashboard();
  }

  getSupplierPerformanceReport(filters: ReportFilter = {}): Observable<PageResponse<SupplierPerformanceReportResponse>> {
    return this.api
      .get<PageResponse<SupplierPerformanceReportResponse>>(API_ENDPOINTS.REPORTS.SUPPLIER_PERFORMANCE, {
        params: filters,
        headers: { 'X-Skip-Global-Error': 'true' },
      })
      .pipe(handleServiceError<PageResponse<SupplierPerformanceReportResponse>>(this.serviceName, 'getSupplierPerformanceReport'));
  }

  getPaymentSummaryReport(filters: ReportFilter = {}): Observable<PaymentSummaryReportResponse> {
    return this.api
      .get<PaymentSummaryReportResponse>(API_ENDPOINTS.REPORTS.PAYMENT_SUMMARY, {
        params: filters,
        headers: { 'X-Skip-Global-Error': 'true' },
      })
      .pipe(handleServiceError<PaymentSummaryReportResponse>(this.serviceName, 'getPaymentSummaryReport'));
  }

  private toExecutiveDashboard(report: GeneratedInventoryReportResponse): ExecutiveDashboardReportResponse {
    return {
      totalProducts: report.valuation.totalProducts,
      activeProducts: report.valuation.totalProducts,
      totalWarehouses: report.valuation.totalWarehouses,
      inventoryValue: report.valuation.totalInventoryValue,
      lowStockItems: report.lowStock.length,
      overstockItems: 0,
      pendingPoApprovals: report.poSummary.pendingApprovalCount,
      overduePurchaseOrders: report.poSummary.overdueCount,
      totalPurchaseValue: report.poSummary.totalSpend,
      totalPaidAmount: 0,
      payablePurchaseOrders: Math.max(0, report.poSummary.totalPurchaseOrders - report.poSummary.fullyReceivedCount),
      cancelledPurchaseOrders: report.poSummary.cancelledCount,
      activeUsers: null,
      criticalAlerts: 0,
      stockMovementToday: 0,
      topMovingProducts: report.topMovingProducts,
      recentAlerts: [],
      valuationTrend: [],
      purchaseTrend: [],
      warnings: report.warnings,
      unavailableSections: [],
    };
  }
}
