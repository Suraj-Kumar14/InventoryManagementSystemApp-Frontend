import { Injectable, inject } from '@angular/core';
import { Observable, catchError, forkJoin, map, of, switchMap } from 'rxjs';
import { AuthService } from '../../../core/auth/services/auth.service';
import { ApiService } from '../../../core/http/api.service';
import {
  AlertResponse,
  AlertSummaryResponse,
  InventoryReportSummaryResponse,
  LowStockReportItem,
  MovementResponse,
  PageResponse,
  PurchaseOrderResponse,
  StockLevelResponse,
  WarehouseResponse,
} from '../../../core/http/backend.models';
import { API_ENDPOINTS } from '../../../shared/config/app-config';
import { AlertApiService } from '../../alerts/services/alert-api.service';
import {
  AssignedStockItem,
  KpiCard,
  PendingReceiptItem,
  RecentAlert,
  RecentMovement,
  TransferTaskItem,
  WarehouseStaffDashboardResponse,
  WarehouseStaffDashboardView,
} from '../models/warehouse-staff-dashboard.model';

interface AssignedWarehouseContext {
  warehouseId: number;
  warehouseName: string | null;
  warehouseCode: string | null;
}

interface AssignedWarehouseStockSection {
  summary: InventoryReportSummaryResponse;
  stockItems: AssignedStockItem[];
}

interface PendingReceiptSection {
  items: PendingReceiptItem[];
  goodsReceiptsPending: number;
  partiallyReceivedOrders: number;
  overdueReceipts: number;
}

interface TransferSection {
  items: TransferTaskItem[];
  notice: string | null;
}

interface MovementSection {
  items: RecentMovement[];
  stockMovementsToday: number;
  stockInToday: number;
  stockOutToday: number;
  adjustmentsToday: number;
  writeOffsToday: number;
}

interface AlertSection {
  summary: AlertSummaryResponse;
  items: RecentAlert[];
}

@Injectable({ providedIn: 'root' })
export class WarehouseStaffDashboardApiService {
  private readonly api = inject(ApiService);
  private readonly authService = inject(AuthService);
  private readonly alertApiService = inject(AlertApiService);

  getWarehouseStaffDashboard(): Observable<WarehouseStaffDashboardView> {
    return this.refreshDashboard();
  }

  getAssignedWarehouse(): Observable<AssignedWarehouseContext | null> {
    const userId = this.authService.getUserId();
    if (!userId) {
      return of(null);
    }

    return forkJoin({
      userMovements: this.api
        .get<PageResponse<MovementResponse>>(API_ENDPOINTS.MOVEMENTS.BY_USER(userId), {
          params: { page: 0, size: 25, sortBy: 'movementDate', sortDir: 'desc' },
        })
        .pipe(
          map((page) => page.content ?? []),
          catchError(() => of([] as MovementResponse[]))
        ),
      purchaseOrders: this.api
        .get<PageResponse<PurchaseOrderResponse>>(API_ENDPOINTS.PURCHASE_ORDERS.ROOT, {
          params: { page: 0, size: 25, sortBy: 'createdAt', sortDir: 'desc' },
        })
        .pipe(
          map((page) => page.content ?? []),
          catchError(() => of([] as PurchaseOrderResponse[]))
        ),
      alerts: this.api
        .get<PageResponse<AlertResponse>>(API_ENDPOINTS.ALERTS.MY, {
          params: { page: 0, size: 25, sortBy: 'createdAt', sortDir: 'desc' },
        })
        .pipe(
          map((page) => page.content ?? []),
          catchError(() => of([] as AlertResponse[]))
        ),
    }).pipe(
      switchMap(({ userMovements, purchaseOrders, alerts }) => {
        const warehouseContexts = new Map<number, AssignedWarehouseContext>();

        userMovements.forEach((movement) => {
          warehouseContexts.set(movement.warehouseId, {
            warehouseId: movement.warehouseId,
            warehouseName: movement.warehouseName ?? null,
            warehouseCode: movement.warehouseCode ?? null,
          });
        });

        purchaseOrders.forEach((order) => {
          warehouseContexts.set(order.warehouseId, {
            warehouseId: order.warehouseId,
            warehouseName: order.warehouseName ?? null,
            warehouseCode: null,
          });
        });

        alerts
          .filter((alert) => alert.relatedWarehouseId != null)
          .forEach((alert) => {
            const warehouseId = Number(alert.relatedWarehouseId);
            warehouseContexts.set(warehouseId, {
              warehouseId,
              warehouseName: null,
              warehouseCode: null,
            });
          });

        if (warehouseContexts.size !== 1) {
          return of(null);
        }

        const inferred = [...warehouseContexts.values()][0];
        return this.api.get<WarehouseResponse>(`${API_ENDPOINTS.WAREHOUSES.ROOT}/${inferred.warehouseId}`).pipe(
          map((warehouse) => ({
            warehouseId: warehouse.warehouseId,
            warehouseName: warehouse.name ?? inferred.warehouseName,
            warehouseCode: warehouse.code ?? inferred.warehouseCode,
          })),
          catchError(() => of(inferred))
        );
      })
    );
  }

  getAssignedWarehouseStockSummary(warehouseId: number): Observable<AssignedWarehouseStockSection> {
    return forkJoin({
      summary: this.api.get<InventoryReportSummaryResponse>(API_ENDPOINTS.REPORTS.STOCK_SUMMARY, {
        params: { warehouseId },
      }),
      lowStock: this.api.get<PageResponse<LowStockReportItem>>(API_ENDPOINTS.REPORTS.LOW_STOCK, {
        params: { warehouseId, page: 0, size: 5, sortBy: 'shortageQuantity', sortDir: 'desc' },
      }),
      stockPage: this.api.get<PageResponse<StockLevelResponse>>(API_ENDPOINTS.STOCK.BY_WAREHOUSE(warehouseId), {
        params: { page: 0, size: 12 },
      }),
    }).pipe(
      map(({ summary, lowStock, stockPage }) => {
        const stockByProduct = new Map<number, StockLevelResponse>();
        (stockPage.content ?? []).forEach((item) => stockByProduct.set(item.productId, item));

        const preview = (lowStock.content ?? []).map((item) => {
          const stockItem = stockByProduct.get(item.productId);
          return {
            productId: item.productId,
            sku: item.sku ?? stockItem?.sku ?? 'N/A',
            productName: item.productName,
            availableQuantity: item.availableQuantity,
            reservedQuantity: stockItem?.reservedQuantity ?? 0,
            reorderLevel: item.reorderLevel,
            stockStatus: item.severity,
            route: `/products/${item.productId}`,
          } satisfies AssignedStockItem;
        });

        return {
          summary,
          stockItems: preview,
        };
      })
    );
  }

  getPendingReceipts(warehouseId: number): Observable<PendingReceiptSection> {
    return this.api
      .get<PageResponse<PurchaseOrderResponse>>(API_ENDPOINTS.PURCHASE_ORDERS.SEARCH, {
        params: {
          warehouseId,
          page: 0,
          size: 50,
          sortBy: 'expectedDeliveryDate',
          sortDir: 'asc',
        },
      })
      .pipe(
        map((page) => {
          const orders = page.content ?? [];
          const awaitingReceipt = orders.filter((order) => ['APPROVED', 'PARTIALLY_RECEIVED'].includes(order.status));

          return {
            items: awaitingReceipt.slice(0, 5).map((order) => ({
              purchaseOrderId: order.purchaseOrderId ?? order.poId,
              poNumber: order.poNumber ?? `PO-${order.poId}`,
              supplierName: order.supplierName ?? 'Unknown supplier',
              expectedDeliveryDate: order.expectedDeliveryDate ?? order.expectedDate ?? null,
              status: this.formatLabel(order.status),
              totalItems: order.lineItems?.length ?? 0,
              route: `/purchase-orders/${order.purchaseOrderId ?? order.poId}/receive`,
            })),
            goodsReceiptsPending: awaitingReceipt.filter((order) => order.status === 'APPROVED').length,
            partiallyReceivedOrders: awaitingReceipt.filter((order) => order.status === 'PARTIALLY_RECEIVED').length,
            overdueReceipts: awaitingReceipt.filter((order) => order.isOverdue).length,
          };
        })
      );
  }

  getPendingTransfers(warehouseId: number): Observable<TransferSection> {
    return this.api
      .get<PageResponse<MovementResponse>>(API_ENDPOINTS.MOVEMENTS.BY_WAREHOUSE(warehouseId), {
        params: { page: 0, size: 25, sortBy: 'movementDate', sortDir: 'desc' },
      })
      .pipe(
        map((page) => {
          const transferItems = (page.content ?? [])
            .filter((movement) => movement.movementType.includes('TRANSFER'))
            .slice(0, 5)
            .map((movement) => ({
              transferId: movement.movementId,
              transferNumber: movement.referenceNumber ?? movement.movementNumber,
              sourceWarehouseName:
                movement.movementType === 'TRANSFER_OUT'
                  ? movement.warehouseName ?? 'Assigned warehouse'
                  : movement.referenceNumber ?? 'Transfer source',
              destinationWarehouseName:
                movement.movementType === 'TRANSFER_IN'
                  ? movement.warehouseName ?? 'Assigned warehouse'
                  : movement.referenceNumber ?? 'Transfer destination',
              status: 'Recent activity',
              productName: movement.productName ?? 'Unknown product',
              quantity: movement.quantity,
              route: `/movements/${movement.movementId}`,
            }));

          return {
            items: transferItems,
            notice: 'Dedicated pending transfer task API is not available yet. Showing recent transfer activity instead.',
          };
        })
      );
  }

  getRecentMovements(warehouseId: number): Observable<MovementSection> {
    const { fromDate, toDate } = this.getTodayRange();

    return forkJoin({
      recent: this.api.get<PageResponse<MovementResponse>>(API_ENDPOINTS.MOVEMENTS.BY_WAREHOUSE(warehouseId), {
        params: { page: 0, size: 6, sortBy: 'movementDate', sortDir: 'desc' },
      }),
      today: this.api.get<PageResponse<MovementResponse>>(API_ENDPOINTS.MOVEMENTS.SEARCH, {
        params: {
          warehouseId,
          fromDate,
          toDate,
          page: 0,
          size: 100,
          sortBy: 'movementDate',
          sortDir: 'desc',
        },
      }),
    }).pipe(
      map(({ recent, today }) => {
        const todayItems = today.content ?? [];

        return {
          items: (recent.content ?? []).map((movement) => ({
            movementId: movement.movementId,
            movementNumber: movement.movementNumber,
            productName: movement.productName ?? `Product #${movement.productId}`,
            warehouseName: movement.warehouseName ?? `Warehouse #${movement.warehouseId}`,
            movementType: this.formatLabel(movement.movementType),
            quantity: movement.quantity,
            movementDate: movement.movementDate ?? null,
            route: `/movements/${movement.movementId}`,
          })),
          stockMovementsToday: todayItems.length,
          stockInToday: todayItems
            .filter((item) => item.direction === 'IN')
            .reduce((sum, item) => sum + item.quantity, 0),
          stockOutToday: todayItems
            .filter((item) => item.direction === 'OUT')
            .reduce((sum, item) => sum + item.quantity, 0),
          adjustmentsToday: todayItems
            .filter((item) => ['ADJUSTMENT', 'CYCLE_COUNT_CORRECTION'].includes(item.movementType))
            .reduce((sum, item) => sum + item.quantity, 0),
          writeOffsToday: todayItems
            .filter((item) => item.movementType === 'WRITE_OFF')
            .reduce((sum, item) => sum + item.quantity, 0),
        };
      })
    );
  }

  getWarehouseAlerts(warehouseId: number | null): Observable<AlertSection> {
    return forkJoin({
      summary: this.api.get<AlertSummaryResponse>(API_ENDPOINTS.ALERTS.MY_SUMMARY),
      alerts: this.api.get<PageResponse<AlertResponse>>(API_ENDPOINTS.ALERTS.MY, {
        params: { page: 0, size: 10, sortBy: 'createdAt', sortDir: 'desc' },
      }),
    }).pipe(
      map(({ summary, alerts }) => {
        const filteredAlerts =
          warehouseId == null
            ? alerts.content ?? []
            : (alerts.content ?? []).filter(
                (alert) => alert.relatedWarehouseId == null || Number(alert.relatedWarehouseId) === warehouseId
              );

        return {
          summary,
          items: filteredAlerts.slice(0, 5).map((alert) => ({
            alertId: alert.alertId,
            title: alert.title,
            severity: alert.severity,
            type: alert.type,
            createdAt: alert.createdAt ?? null,
            route: `/alerts/${alert.alertId}`,
            isAcknowledged: alert.isAcknowledged,
            isDismissed: alert.isDismissed,
          })),
        };
      })
    );
  }

  getBarcodeLookup(barcode: string) {
    return this.api.get(API_ENDPOINTS.PRODUCTS.BARCODE(barcode));
  }

  acknowledgeAlert(alertId: number) {
    return this.alertApiService.acknowledgeAlert(alertId);
  }

  dismissAlert(alertId: number) {
    return this.alertApiService.dismissAlert(alertId);
  }

  refreshDashboard(): Observable<WarehouseStaffDashboardView> {
    return this.getAssignedWarehouse().pipe(
      switchMap((assignedWarehouse) => {
        const sectionErrors: WarehouseStaffDashboardView['sectionErrors'] = {};
        const sectionNotices: WarehouseStaffDashboardView['sectionNotices'] = {};

        if (!assignedWarehouse) {
          sectionErrors.assignedWarehouse = 'Assigned warehouse not configured. Please contact administrator.';
        }

        const stock$ = assignedWarehouse
          ? this.getAssignedWarehouseStockSummary(assignedWarehouse.warehouseId).pipe(
              catchError(() => {
                sectionErrors.stock = 'Unable to load assigned warehouse stock';
                return of(null);
              })
            )
          : of(null);

        const receipts$ = assignedWarehouse
          ? this.getPendingReceipts(assignedWarehouse.warehouseId).pipe(
              catchError(() => {
                sectionErrors.receipts = 'Unable to load pending receipts';
                return of(null);
              })
            )
          : of(null);

        const transfers$ = assignedWarehouse
          ? this.getPendingTransfers(assignedWarehouse.warehouseId).pipe(
              catchError(() => {
                sectionErrors.transfers = 'Unable to load transfer tasks';
                return of(null);
              })
            )
          : of(null);

        const movements$ = assignedWarehouse
          ? this.getRecentMovements(assignedWarehouse.warehouseId).pipe(
              catchError(() => {
                sectionErrors.movements = 'Unable to load recent movements';
                return of(null);
              })
            )
          : of(null);

        const alerts$ = this.getWarehouseAlerts(assignedWarehouse?.warehouseId ?? null).pipe(
          catchError(() => {
            sectionErrors.alerts = 'Unable to load alerts';
            return of(null);
          })
        );

        return forkJoin({
          stock: stock$,
          receipts: receipts$,
          transfers: transfers$,
          movements: movements$,
          alerts: alerts$,
        }).pipe(
          map(({ stock, receipts, transfers, movements, alerts }) => {
            if (transfers?.notice) {
              sectionNotices.transfers = transfers.notice;
            }
            if (!assignedWarehouse) {
              sectionNotices.stock = 'Warehouse-specific stock, receiving, and transfer panels need a configured warehouse assignment.';
            }

            const overview: WarehouseStaffDashboardResponse | null =
              stock || receipts || movements || alerts
                ? {
                    assignedWarehouseId: assignedWarehouse?.warehouseId ?? null,
                    assignedWarehouseName: assignedWarehouse?.warehouseName ?? null,
                    assignedWarehouseCode: assignedWarehouse?.warehouseCode ?? null,
                    stockItemCount: stock?.summary.totalProducts ?? 0,
                    totalQuantity: stock?.summary.totalStockQuantity ?? 0,
                    availableQuantity: stock?.summary.totalAvailableQuantity ?? 0,
                    reservedQuantity: stock?.summary.totalReservedQuantity ?? 0,
                    lowStockCount: stock?.summary.lowStockCount ?? 0,
                    outOfStockCount: stock?.summary.outOfStockCount ?? 0,
                    goodsReceiptsPending: receipts?.goodsReceiptsPending ?? 0,
                    partiallyReceivedOrders: receipts?.partiallyReceivedOrders ?? 0,
                    overdueReceipts: receipts?.overdueReceipts ?? 0,
                    stockMovementsToday: movements?.stockMovementsToday ?? 0,
                    stockInToday: movements?.stockInToday ?? 0,
                    stockOutToday: movements?.stockOutToday ?? 0,
                    transfersPending: null,
                    incomingTransfersPending: null,
                    outgoingTransfersPending: null,
                    cycleCountsPending: null,
                    adjustmentsToday: movements?.adjustmentsToday ?? 0,
                    writeOffsToday: movements?.writeOffsToday ?? 0,
                    unreadAlerts: alerts?.summary.unreadCount ?? 0,
                    criticalAlerts: alerts?.summary.criticalCount ?? 0,
                  }
                : null;

            if (!overview) {
              sectionErrors.dashboard = 'Unable to load dashboard summary';
            }

            return {
              overview,
              kpis: this.buildKpis(overview),
              assignedStockItems: stock?.stockItems ?? [],
              pendingReceipts: receipts?.items ?? [],
              pendingTransfers: transfers?.items ?? [],
              recentMovements: movements?.items ?? [],
              recentAlerts: alerts?.items ?? [],
              sectionErrors,
              sectionNotices,
              loadedAt: new Date().toISOString(),
            } satisfies WarehouseStaffDashboardView;
          })
        );
      })
    );
  }

  private buildKpis(overview: WarehouseStaffDashboardResponse | null): KpiCard[] {
    if (!overview) {
      return [];
    }

    return [
      {
        title: 'Stock Items',
        value: overview.stockItemCount,
        subtitle: 'Tracked in assigned warehouse',
        icon: 'bi bi-box-seam',
        route: '/inventory/stock',
      },
      {
        title: 'Available Quantity',
        value: overview.availableQuantity,
        subtitle: 'Ready to pick or issue',
        icon: 'bi bi-check2-square',
        route: '/inventory/stock',
      },
      {
        title: 'Reserved Quantity',
        value: overview.reservedQuantity,
        subtitle: 'Allocated to downstream work',
        icon: 'bi bi-lock',
        route: '/inventory/stock',
      },
      {
        title: 'Receipts Pending',
        value: overview.goodsReceiptsPending,
        subtitle: 'Approved POs awaiting receipt',
        icon: 'bi bi-box-arrow-in-down',
        route: '/purchase-orders',
        severity: overview.goodsReceiptsPending > 0 ? 'warning' : 'default',
      },
      {
        title: 'Movements Today',
        value: overview.stockMovementsToday,
        subtitle: `In ${overview.stockInToday} / Out ${overview.stockOutToday}`,
        icon: 'bi bi-arrow-left-right',
        route: '/movements',
      },
      {
        title: 'Low Stock Alerts',
        value: overview.lowStockCount,
        subtitle: 'Needs operational attention',
        icon: 'bi bi-exclamation-triangle',
        route: '/reports/inventory/low-stock',
        severity: overview.lowStockCount > 0 ? 'critical' : 'default',
      },
      {
        title: 'Unread Alerts',
        value: overview.unreadAlerts,
        subtitle: 'Assigned warehouse notifications',
        icon: 'bi bi-bell',
        route: '/alerts',
        severity: overview.unreadAlerts > 0 ? 'warning' : 'default',
      },
      {
        title: 'Write-offs Today',
        value: overview.writeOffsToday,
        subtitle: 'Recorded stock loss activity',
        icon: 'bi bi-trash3',
        route: '/movements',
      },
    ];
  }

  private getTodayRange(): { fromDate: string; toDate: string } {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = `${now.getMonth() + 1}`.padStart(2, '0');
    const dd = `${now.getDate()}`.padStart(2, '0');
    return {
      fromDate: `${yyyy}-${mm}-${dd}T00:00:00`,
      toDate: `${yyyy}-${mm}-${dd}T23:59:59`,
    };
  }

  private formatLabel(value: string): string {
    return value.replaceAll('_', ' ');
  }
}
