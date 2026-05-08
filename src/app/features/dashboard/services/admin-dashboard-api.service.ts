import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AlertResponse, ProductSummary, PaymentSummaryReportResponse } from '../../../core/http/backend.models';
import { AdminUserService } from '../../../core/services/admin-user.service';
import { PurchaseService } from '../../../core/services/purchase.service';
import { ReportService } from '../../../core/services/report.service';
import { WarehouseService } from '../../../core/services/warehouse.service';
import { UI_CONSTANTS, UserRole } from '../../../shared/config/app-config';
import { AlertApiService } from '../../alerts/services/alert-api.service';
import { MovementApiService } from '../../movements/services/movement-api.service';
import { ProductApiService } from '../../products/services/product-api.service';
import { AdminDashboardUserSummary, AdminDashboardView, RecentActivity, ServiceHealth } from '../models/admin-dashboard.model';

@Injectable({ providedIn: 'root' })
export class AdminDashboardApiService {
  private readonly reportService = inject(ReportService);
  private readonly alertApiService = inject(AlertApiService);
  private readonly adminUserService = inject(AdminUserService);
  private readonly movementApiService = inject(MovementApiService);
  private readonly purchaseService = inject(PurchaseService);
  private readonly warehouseService = inject(WarehouseService);
  private readonly productApiService = inject(ProductApiService);

  getExecutiveDashboard() {
    return this.reportService.getExecutiveDashboard();
  }

  getSystemAlertSummary() {
    return this.alertApiService.getSystemAlertSummary();
  }

  getUnreadAlertCount() {
    return this.alertApiService.getUnreadCount();
  }

  getUserSummary(): Observable<AdminDashboardUserSummary> {
    return this.adminUserService.getUsers({ page: 0, size: 200 }).pipe(
      map((page) => {
        const users = page.content ?? [];
        const usersByRole: Record<UserRole, number> = {
          [UserRole.ADMIN]: users.filter((user) => user.role === UserRole.ADMIN).length,
          [UserRole.MANAGER]: users.filter((user) => user.role === UserRole.MANAGER).length,
          [UserRole.OFFICER]: users.filter((user) => user.role === UserRole.OFFICER).length,
          [UserRole.STAFF]: users.filter((user) => user.role === UserRole.STAFF).length,
        };
        const activeUsers = users.filter((user) => user.isActive !== false).length;
        return { totalUsers: users.length, activeUsers, inactiveUsers: users.length - activeUsers, usersByRole };
      })
    );
  }

  /** Payment summary fallback — payment data is now exclusively from Razorpay. */
  getPaymentSummary(): Observable<PaymentSummaryReportResponse> {
    return of<PaymentSummaryReportResponse>({
      totalPayments: 0,
      pendingCount: 0,
      paidCount: 0,
      cancelledCount: 0,
      pendingAmount: 0,
      totalPaidAmount: 0,
      supplierPayments: [],
    });
  }

  getMovementSummary() {
    const today = new Date().toISOString().slice(0, 10);
    return this.movementApiService.getMovementSummary(today, today);
  }

  getServiceHealth(): Observable<ServiceHealth[]> {
    return of([]);
  }


  getRecentActivities(): Observable<RecentActivity[]> {
    return forkJoin({
      alerts: this.alertApiService
        .searchAlerts({ page: 0, size: 4, sortBy: 'createdAt', sortDir: 'desc' })
        .pipe(
          map((page) => page.content ?? []),
          catchError(() => of([] as AlertResponse[]))
        ),
      movements: this.movementApiService
        .getMovements({ page: 0, size: 4, sortBy: 'movementDate', sortDir: 'desc' })
        .pipe(
          map((page) => page.content ?? []),
          catchError(() => of([]))
        ),
      approvals: this.purchaseService.getPurchaseOrdersByStatus('PENDING_APPROVAL').pipe(catchError(() => of([]))),
    }).pipe(
      map(({ alerts, movements, approvals }) => {
        const alertActivities: RecentActivity[] = alerts.map((alert) => ({
          id: `alert-${alert.alertId}`,
          type: 'ALERT',
          title: alert.title,
          description: alert.message,
          createdAt: alert.createdAt,
          route: '/alerts',
        }));

        const movementActivities: RecentActivity[] = movements.map((movement) => ({
          id: `movement-${movement.movementId}`,
          type: 'MOVEMENT',
          title: movement.movementType.replaceAll('_', ' '),
          description: `${movement.productName ?? 'Product'} | ${movement.quantity} units in ${movement.warehouseName ?? 'warehouse'}`,
          actor: movement.performedByName ?? undefined,
          createdAt: movement.movementDate,
          route: '/movements',
        }));

        const approvalActivities: RecentActivity[] = approvals.slice(0, 3).map((order) => ({
          id: `po-${order.poId}`,
          type: 'PURCHASE',
          title: order.poNumber ? `PO ${order.poNumber}` : 'Purchase order pending approval',
          description: `${order.supplierName ?? 'Supplier'} | ${order.totalAmount ?? 0} pending approval`,
          createdAt: order.createdAt ?? order.orderDate,
          route: '/purchase-orders',
        }));

        return [...alertActivities, ...movementActivities, ...approvalActivities]
          .sort((left, right) => {
            const leftValue = left.createdAt ? new Date(left.createdAt).getTime() : 0;
            const rightValue = right.createdAt ? new Date(right.createdAt).getTime() : 0;
            return rightValue - leftValue;
          })
          .slice(0, 8);
      })
    );
  }

  refreshDashboard(): Observable<AdminDashboardView> {
    return forkJoin({
      executiveResult: this.getExecutiveDashboard().pipe(
        map((executive) => ({ executive, error: null as string | null })),
        catchError(() => of({ executive: null, error: 'Unable to load dashboard summary' }))
      ),
      alertSummaryResult: this.getSystemAlertSummary().pipe(
        map((alertSummary) => ({ alertSummary, error: null as string | null })),
        catchError(() => of({ alertSummary: null, error: 'Unable to load alert summary' }))
      ),
      unreadResult: this.getUnreadAlertCount().pipe(
        map((unreadAlertCount) => ({ unreadAlertCount, error: null as string | null })),
        catchError(() => of({ unreadAlertCount: null, error: 'Unable to load alert summary' }))
      ),
      userSummaryResult: this.getUserSummary().pipe(
        map((userSummary) => ({ userSummary, error: null as string | null })),
        catchError(() => of({ userSummary: null, error: 'Unable to load user summary' }))
      ),
      warehouseCountResult: this.warehouseService.getWarehouseCount().pipe(
        map((totalWarehouses) => ({ totalWarehouses, error: null as string | null })),
        catchError(() => of({ totalWarehouses: null, error: 'Unable to load warehouse count' }))
      ),
      productSummaryResult: this.productApiService.getProductSummary().pipe(
        map((productSummary) => ({ productSummary, error: null as string | null })),
        catchError(() => of({ productSummary: null as ProductSummary | null, error: 'Unable to load product summary' }))
      ),
      paymentSummaryResult: this.getPaymentSummary().pipe(
        map((paymentSummary) => ({ paymentSummary, error: null as string | null })),
        catchError(() => of({ paymentSummary: null, error: 'Unable to load payment summary' }))
      ),
      movementSummaryResult: this.getMovementSummary().pipe(
        map((movementSummary) => ({ movementSummary, error: null as string | null })),
        catchError(() => of({ movementSummary: null, error: 'Unable to load movement summary' }))
      ),
      recentActivitiesResult: this.getRecentActivities().pipe(
        map((recentActivities) => ({ recentActivities, error: null as string | null })),
        catchError(() => of({ recentActivities: [] as RecentActivity[], error: 'Unable to load recent activity' }))
      ),
      recentAlertsResult: this.alertApiService.searchAlerts({ page: 0, size: 5, sortBy: 'createdAt', sortDir: 'desc' }).pipe(
        map((page) => ({ recentAlerts: page.content ?? [] })),
        catchError(() => of({ recentAlerts: [] as AlertResponse[] }))
      ),
      serviceHealthResult: this.getServiceHealth().pipe(
        map((serviceHealth) => ({ serviceHealth, error: null as string | null })),
        catchError(() => of({ serviceHealth: [] as ServiceHealth[], error: 'Unable to load service health' }))
      ),
    }).pipe(
      map((result) => {
        const sectionErrors: AdminDashboardView['sectionErrors'] = {};
        if (result.executiveResult.error) sectionErrors.executive = result.executiveResult.error;
        if (result.alertSummaryResult.error || result.unreadResult.error) {
          sectionErrors.alerts = result.alertSummaryResult.error ?? result.unreadResult.error ?? undefined;
        }
        if (result.userSummaryResult.error) sectionErrors.users = result.userSummaryResult.error;
        if (result.warehouseCountResult.error) sectionErrors.executive = sectionErrors.executive ?? result.warehouseCountResult.error;
        if (result.productSummaryResult.error) sectionErrors.executive = sectionErrors.executive ?? result.productSummaryResult.error;
        if (result.paymentSummaryResult.error) sectionErrors.payments = result.paymentSummaryResult.error;
        if (result.recentActivitiesResult.error) sectionErrors.activity = result.recentActivitiesResult.error;
        if (result.serviceHealthResult.error) sectionErrors.health = result.serviceHealthResult.error;

        return {
          executive: result.executiveResult.executive
            ? {
                ...result.executiveResult.executive,
                totalProducts:
                  result.productSummaryResult.productSummary?.totalProducts ?? result.executiveResult.executive.totalProducts ?? 0,
                totalWarehouses:
                  result.warehouseCountResult.totalWarehouses ?? result.executiveResult.executive.totalWarehouses ?? 0,
              }
            : result.executiveResult.executive,
          alertSummary: result.alertSummaryResult.alertSummary,
          unreadAlertCount: result.unreadResult.unreadAlertCount,
          userSummary: result.userSummaryResult.userSummary,
          paymentSummary: result.paymentSummaryResult.paymentSummary,
          movementSummary: result.movementSummaryResult.movementSummary,
          recentAlerts: result.recentAlertsResult.recentAlerts,
          recentActivities: result.recentActivitiesResult.recentActivities,
          serviceHealth: result.serviceHealthResult.serviceHealth,
          serviceHealthConfigured: false,
          sectionErrors,
          generatedAt: new Date().toISOString(),
        };
      })
    );
  }

  getDefaultActivityMessage(): string {
    return `Recent activity is assembled from alerts, movements, and pending approvals over the last ${UI_CONSTANTS.DEFAULT_REPORT_DAYS} days where available.`;
  }
}
