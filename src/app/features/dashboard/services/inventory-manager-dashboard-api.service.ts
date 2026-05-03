import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AlertResponse, Product, ProductSummary } from '../../../core/http/backend.models';
import { PurchaseService } from '../../../core/services/purchase.service';
import { ReportService } from '../../../core/services/report.service';
import { WarehouseService } from '../../../core/services/warehouse.service';
import { AlertApiService } from '../../alerts/services/alert-api.service';
import { MovementApiService } from '../../movements/services/movement-api.service';
import { ProductApiService } from '../../products/services/product-api.service';
import {
  InventoryManagerDashboardResponse,
  InventoryManagerDashboardView,
  InventoryManagerInventorySummary,
  InventoryManagerPurchaseSummary,
  ProductCategorySummary,
  RecentMovement,
  WarehouseUtilization,
} from '../models/inventory-manager-dashboard.model';

@Injectable({ providedIn: 'root' })
export class InventoryManagerDashboardApiService {
  private readonly reportService = inject(ReportService);
  private readonly productApiService = inject(ProductApiService);
  private readonly warehouseService = inject(WarehouseService);
  private readonly purchaseService = inject(PurchaseService);
  private readonly movementApiService = inject(MovementApiService);
  private readonly alertApiService = inject(AlertApiService);

  getInventoryManagerDashboard() {
    return this.reportService.getMyDashboard();
  }

  getProductSummary() {
    return this.productApiService.getProductSummary();
  }

  getRecentProducts() {
    return this.productApiService.getProducts({ page: 0, size: 5, sortBy: 'updatedAt', sortDir: 'desc' }).pipe(
      map((page) => page.content ?? [])
    );
  }

  getInventorySummary(): Observable<{
    inventorySummary: InventoryManagerInventorySummary;
    productCategorySummary: ProductCategorySummary[];
  }> {
    return forkJoin({
      valuation: this.reportService.getInventoryValuation(),
      stockSummary: this.reportService.getStockSummary(),
      products: this.productApiService.getProducts({ page: 0, size: 200, sortBy: 'updatedAt', sortDir: 'desc' }),
    }).pipe(
      map(({ valuation, stockSummary, products }) => ({
        inventorySummary: {
          totalInventoryValue: valuation.totalInventoryValue,
          totalStockQuantity: stockSummary.totalStockQuantity,
          reservedQuantity: stockSummary.totalReservedQuantity,
          availableQuantity: stockSummary.totalAvailableQuantity,
          lowStockCount: stockSummary.lowStockCount,
          overstockCount: stockSummary.overstockCount,
          outOfStockCount: stockSummary.outOfStockCount,
        },
        productCategorySummary: this.buildCategorySummary(products.content ?? [], valuation.valuationByCategory),
      }))
    );
  }

  getWarehouseStockSummary() {
    return forkJoin({
      warehouseSummary: this.warehouseService.getWarehouseSummary(),
      stockSummary: this.warehouseService.getStockSummary(),
      warehouses: this.warehouseService.getWarehouses(),
    }).pipe(
      map(({ warehouseSummary, stockSummary, warehouses }) => ({
        warehouseSummary,
        stockSummary,
        warehouseUtilization: warehouses
          .map((warehouse) => ({
            warehouseId: warehouse.warehouseId,
            warehouseName: warehouse.name,
            capacity: warehouse.capacity,
            usedCapacity: warehouse.usedCapacity ?? 0,
            utilizationPercent: warehouse.utilizationPercentage ?? 0,
            route: `/movements/warehouse/${warehouse.warehouseId}`,
          }))
          .sort((left, right) => right.utilizationPercent - left.utilizationPercent)
          .slice(0, 4) as WarehouseUtilization[],
      }))
    );
  }

  getPurchaseApprovalSummary(): Observable<InventoryManagerPurchaseSummary> {
    return forkJoin({
      pending: this.purchaseService.getPurchaseOrdersByStatus('PENDING_APPROVAL'),
      approved: this.purchaseService.getPurchaseOrdersByStatus('APPROVED'),
      overdue: this.purchaseService.getOverduePurchaseOrders(),
    }).pipe(
      map(({ pending, approved, overdue }) => ({
        pendingPurchaseApprovals: pending.length,
        overduePurchaseOrders: overdue.length,
        approvedAwaitingReceipt: approved.filter((order) => !['RECEIVED', 'PARTIALLY_RECEIVED'].includes(order.status)).length,
      }))
    );
  }

  getMovementSummary() {
    const today = new Date().toISOString().slice(0, 10);

    return forkJoin({
      summary: this.movementApiService.getMovementSummary(today, today),
      analytics: this.movementApiService.getMovementAnalytics(today, today),
      recentMovements: this.movementApiService.getMovements({ page: 0, size: 6, sortBy: 'movementDate', sortDir: 'desc' }).pipe(
        map((page) => page.content ?? [])
      ),
    }).pipe(
      map(({ summary, analytics, recentMovements }) => ({
        movementSummary: {
          ...summary,
          totalAdjustmentQuantity: analytics.movementCountByType['ADJUSTMENT'] ?? summary.totalAdjustmentQuantity,
          totalWriteOffQuantity: analytics.movementCountByType['WRITE_OFF'] ?? summary.totalWriteOffQuantity,
        },
        recentMovements: recentMovements.map((movement) => this.mapRecentMovement(movement)),
      }))
    );
  }

  getAlertSummary() {
    return forkJoin({
      alertSummary: this.alertApiService.getMyAlertSummary(),
      recentAlerts: this.alertApiService.getMyAlerts({ page: 0, size: 5, sortBy: 'createdAt', sortDir: 'desc' }).pipe(
        map((page) => page.content ?? [])
      ),
    });
  }

  acknowledgeAlert(alertId: number) {
    return this.alertApiService.acknowledgeAlert(alertId);
  }

  refreshDashboard(): Observable<InventoryManagerDashboardView> {
    return forkJoin({
      dashboardResult: this.getInventoryManagerDashboard().pipe(
        map((roleDashboard) => ({ roleDashboard, error: null as string | null })),
        catchError(() => of({ roleDashboard: null, error: 'Unable to load dashboard summary' }))
      ),
      productResult: forkJoin({
        productSummary: this.getProductSummary(),
        recentProducts: this.getRecentProducts(),
      }).pipe(
        map(({ productSummary, recentProducts }) => ({ productSummary, recentProducts, error: null as string | null })),
        catchError(() => of({ productSummary: null as ProductSummary | null, recentProducts: [] as Product[], error: 'Unable to load product summary' }))
      ),
      stockResult: this.getInventorySummary().pipe(
        map(({ inventorySummary, productCategorySummary }) => ({ inventorySummary, productCategorySummary, error: null as string | null })),
        catchError(() =>
          of({
            inventorySummary: null as InventoryManagerInventorySummary | null,
            productCategorySummary: [] as ProductCategorySummary[],
            error: 'Unable to load stock health',
          })
        )
      ),
      warehouseResult: this.getWarehouseStockSummary().pipe(
        map(({ warehouseSummary, stockSummary, warehouseUtilization }) => ({
          warehouseSummary,
          stockSummary,
          warehouseUtilization,
          error: null as string | null,
        })),
        catchError(() =>
          of({
            warehouseSummary: null,
            stockSummary: null,
            warehouseUtilization: [] as WarehouseUtilization[],
            error: 'Unable to load warehouse stock summary',
          })
        )
      ),
      purchaseResult: this.getPurchaseApprovalSummary().pipe(
        map((purchaseSummary) => ({ purchaseSummary, error: null as string | null })),
        catchError(() => of({ purchaseSummary: null as InventoryManagerPurchaseSummary | null, error: 'Unable to load purchase approvals' }))
      ),
      movementResult: this.getMovementSummary().pipe(
        map(({ movementSummary, recentMovements }) => ({ movementSummary, recentMovements, error: null as string | null })),
        catchError(() =>
          of({
            movementSummary: null,
            recentMovements: [] as RecentMovement[],
            error: 'Unable to load movement summary',
          })
        )
      ),
      alertResult: this.getAlertSummary().pipe(
        map(({ alertSummary, recentAlerts }) => ({ alertSummary, recentAlerts, error: null as string | null })),
        catchError(() => of({ alertSummary: null, recentAlerts: [] as AlertResponse[], error: 'Unable to load alerts' }))
      ),
    }).pipe(
      map((result) => {
        const sectionErrors: InventoryManagerDashboardView['sectionErrors'] = {};
        if (result.dashboardResult.error) sectionErrors.dashboard = result.dashboardResult.error;
        if (result.productResult.error) sectionErrors.products = result.productResult.error;
        if (result.stockResult.error) sectionErrors.stock = result.stockResult.error;
        if (result.warehouseResult.error) sectionErrors.warehouse = result.warehouseResult.error;
        if (result.purchaseResult.error) sectionErrors.purchase = result.purchaseResult.error;
        if (result.movementResult.error) sectionErrors.movement = result.movementResult.error;
        if (result.alertResult.error) sectionErrors.alerts = result.alertResult.error;

        const overview = this.buildOverview(
          result.dashboardResult.roleDashboard,
          result.productResult.productSummary,
          result.stockResult.inventorySummary,
          result.warehouseResult.warehouseSummary,
          result.purchaseResult.purchaseSummary,
          result.movementResult.movementSummary,
          result.alertResult.alertSummary
        );

        return {
          roleDashboard: result.dashboardResult.roleDashboard,
          overview,
          productSummary: result.productResult.productSummary,
          inventorySummary: result.stockResult.inventorySummary,
          warehouseSummary: result.warehouseResult.warehouseSummary,
          stockSummary: result.warehouseResult.stockSummary,
          purchaseSummary: result.purchaseResult.purchaseSummary,
          movementSummary: result.movementResult.movementSummary,
          alertSummary: result.alertResult.alertSummary,
          recentAlerts: result.alertResult.recentAlerts,
          recentMovements: result.movementResult.recentMovements,
          recentProducts: result.productResult.recentProducts,
          warehouseUtilization: result.warehouseResult.warehouseUtilization,
          productCategorySummary: result.stockResult.productCategorySummary,
          sectionErrors,
          generatedAt: new Date().toISOString(),
        };
      })
    );
  }

  private buildOverview(
    roleDashboard: InventoryManagerDashboardView['roleDashboard'],
    productSummary: InventoryManagerDashboardView['productSummary'],
    inventorySummary: InventoryManagerDashboardView['inventorySummary'],
    warehouseSummary: InventoryManagerDashboardView['warehouseSummary'],
    purchaseSummary: InventoryManagerDashboardView['purchaseSummary'],
    movementSummary: InventoryManagerDashboardView['movementSummary'],
    alertSummary: InventoryManagerDashboardView['alertSummary']
  ): InventoryManagerDashboardResponse | null {
    if (!roleDashboard && !productSummary && !inventorySummary && !warehouseSummary && !purchaseSummary && !movementSummary && !alertSummary) {
      return null;
    }

    return {
      totalProducts: roleDashboard?.totalProducts ?? productSummary?.totalProducts ?? 0,
      activeProducts: productSummary?.activeProducts ?? 0,
      inactiveProducts: productSummary?.inactiveProducts ?? 0,
      totalWarehouses: roleDashboard?.totalWarehouses ?? warehouseSummary?.totalWarehouses ?? 0,
      totalInventoryValue: roleDashboard?.totalInventoryValue ?? inventorySummary?.totalInventoryValue ?? 0,
      totalStockQuantity: inventorySummary?.totalStockQuantity ?? 0,
      reservedQuantity: inventorySummary?.reservedQuantity ?? 0,
      availableQuantity: inventorySummary?.availableQuantity ?? 0,
      lowStockCount: roleDashboard?.lowStockCount ?? inventorySummary?.lowStockCount ?? 0,
      overstockCount: roleDashboard?.overstockCount ?? inventorySummary?.overstockCount ?? 0,
      outOfStockCount: inventorySummary?.outOfStockCount ?? 0,
      pendingPurchaseApprovals: roleDashboard?.pendingPurchaseApprovals ?? purchaseSummary?.pendingPurchaseApprovals ?? 0,
      overduePurchaseOrders: roleDashboard?.overduePurchaseOrders ?? purchaseSummary?.overduePurchaseOrders ?? 0,
      approvedAwaitingReceipt: purchaseSummary?.approvedAwaitingReceipt ?? 0,
      stockMovementToday: roleDashboard?.stockMovementToday ?? movementSummary?.movementsToday ?? 0,
      adjustmentCountToday: movementSummary?.totalAdjustmentQuantity ?? 0,
      writeOffCountToday: movementSummary?.totalWriteOffQuantity ?? 0,
      unreadAlerts: alertSummary?.unreadCount ?? 0,
      criticalAlerts: roleDashboard?.criticalAlerts ?? alertSummary?.criticalCount ?? 0,
    };
  }

  private mapRecentMovement(movement: {
    movementId: number;
    movementNumber: string;
    productName?: string | null;
    warehouseName?: string | null;
    movementType: string;
    quantity: number;
    movementDate?: string;
  }): RecentMovement {
    return {
      movementId: movement.movementId,
      movementNumber: movement.movementNumber,
      productName: movement.productName ?? 'Unknown product',
      warehouseName: movement.warehouseName ?? 'Unknown warehouse',
      movementType: movement.movementType.replaceAll('_', ' '),
      quantity: movement.quantity,
      movementDate: movement.movementDate,
      route: `/movements/${movement.movementId}`,
    };
  }

  private buildCategorySummary(products: Product[], valuationByCategory: Record<string, number>): ProductCategorySummary[] {
    const productCountByCategory = products.reduce<Record<string, number>>((acc, product) => {
      acc[product.category] = (acc[product.category] ?? 0) + 1;
      return acc;
    }, {});

    return Object.entries(valuationByCategory)
      .map(([category, stockValue]) => ({
        category,
        productCount: productCountByCategory[category] ?? 0,
        stockValue,
      }))
      .sort((left, right) => right.stockValue - left.stockValue)
      .slice(0, 4);
  }
}
