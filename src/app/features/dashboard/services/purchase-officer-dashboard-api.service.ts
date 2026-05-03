import { Injectable, inject } from '@angular/core';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { PurchaseOrderResponse, SupplierResponse } from '../../../core/http/backend.models';
import { PaymentService } from '../../../core/services/payment.service';
import { PurchaseService } from '../../../core/services/purchase.service';
import { ReportService } from '../../../core/services/report.service';
import { AlertApiService } from '../../alerts/services/alert-api.service';
import { SupplierApiService } from '../../suppliers/services/supplier-api.service';
import {
  PaymentSummaryItem,
  ProcurementAttentionItem,
  PurchaseOfficerDashboardResponse,
  PurchaseOfficerDashboardView,
  PurchaseOfficerRecentAlert,
  PurchaseOrderSummaryItem,
  SupplierSummaryItem,
} from '../models/purchase-officer-dashboard.model';

@Injectable({ providedIn: 'root' })
export class PurchaseOfficerDashboardApiService {
  private readonly reportService = inject(ReportService);
  private readonly purchaseService = inject(PurchaseService);
  private readonly supplierApiService = inject(SupplierApiService);
  private readonly paymentService = inject(PaymentService);
  private readonly alertApiService = inject(AlertApiService);

  getPurchaseOfficerDashboard() {
    return this.reportService.getMyDashboard();
  }

  getPurchaseSummary() {
    return forkJoin({
      orders: this.purchaseService.getPurchaseOrders(),
      overdue: this.purchaseService.getOverduePurchaseOrders(),
      summary: this.reportService.getPurchaseSummaryReport(),
    }).pipe(
      map(({ orders, overdue, summary }) => {
        const sortedOrders = [...orders].sort((left, right) =>
          (right.createdAt ?? right.orderDate ?? '').localeCompare(left.createdAt ?? left.orderDate ?? '')
        );

        return {
          orders,
          overdue,
          summary,
          recentPurchaseOrders: sortedOrders.slice(0, 5).map((order) => this.mapPurchaseOrder(order)),
        };
      })
    );
  }

  getSupplierSummary() {
    return forkJoin({
      summary: this.supplierApiService.getSupplierSummary(),
      suppliersPage: this.supplierApiService.getSuppliers({ page: 0, size: 50, sortBy: 'name', sortDir: 'asc' }),
      topRatedSuppliers: this.supplierApiService.getTopRatedSuppliers(),
      supplierPerformance: this.reportService.getSupplierPerformanceReport({ page: 0, size: 4 }),
    }).pipe(
      map(({ summary, suppliersPage, topRatedSuppliers, supplierPerformance }) => {
        const suppliers = suppliersPage.content ?? [];
        const topRated = (topRatedSuppliers.length ? topRatedSuppliers : suppliers)
          .filter((supplier) => supplier.isActive)
          .sort((left, right) => (right.rating ?? 0) - (left.rating ?? 0))
          .slice(0, 4)
          .map((supplier) => this.mapSupplier(supplier));

        const lowRated = suppliers
          .filter((supplier) => supplier.isActive)
          .sort((left, right) => (left.rating ?? 0) - (right.rating ?? 0))
          .slice(0, 4)
          .map((supplier) => this.mapSupplier(supplier));

        return {
          summary,
          topRatedSuppliers: topRated,
          lowRatedSuppliers: lowRated,
          supplierPerformance: supplierPerformance.content ?? [],
        };
      })
    );
  }

  getProcurementAttentionItems() {
    return this.reportService.getLowStockItems({ page: 0, size: 6 }).pipe(
      map((page) =>
        (page.content ?? []).map(
          (item): ProcurementAttentionItem => ({
            productId: item.productId,
            sku: item.sku ?? 'N/A',
            productName: item.productName,
            warehouseId: item.warehouseId,
            warehouseName: item.warehouseName ?? 'Unknown warehouse',
            availableQuantity: item.availableQuantity,
            reorderLevel: item.reorderLevel,
            shortageQuantity: item.shortageQuantity,
            preferredSupplierId: null,
            preferredSupplierName: null,
            route: `/products/${item.productId}`,
          })
        )
      )
    );
  }

  getPaymentSummary() {
    return forkJoin({
      paymentSummary: this.paymentService.getPaymentSummary(),
      paymentReportSummary: this.reportService.getPaymentSummaryReport(),
      recentPaymentsPage: this.paymentService.getPayments({ page: 0, size: 5, sortBy: 'createdAt', sortDir: 'desc' }),
    }).pipe(
      map(({ paymentSummary, paymentReportSummary, recentPaymentsPage }) => ({
        paymentSummary,
        paymentReportSummary,
        recentPayments: (recentPaymentsPage.content ?? []).map((payment) => this.mapPayment(payment)),
      }))
    );
  }

  getPurchaseAlerts() {
    return forkJoin({
      alertSummary: this.alertApiService.getMyAlertSummary(),
      recentAlerts: this.alertApiService.getMyAlerts({ page: 0, size: 5, sortBy: 'createdAt', sortDir: 'desc' }).pipe(
        map((page) => page.content ?? [])
      ),
    }).pipe(
      map(({ alertSummary, recentAlerts }) => ({
        alertSummary,
        recentAlerts: recentAlerts.map((alert) => this.mapAlert(alert)),
      }))
    );
  }

  refreshDashboard(): Observable<PurchaseOfficerDashboardView> {
    return forkJoin({
      dashboardResult: this.getPurchaseOfficerDashboard().pipe(
        map((roleDashboard) => ({ roleDashboard, error: null as string | null })),
        catchError(() => of({ roleDashboard: null, error: 'Unable to load dashboard summary' }))
      ),
      purchaseResult: this.getPurchaseSummary().pipe(
        map((purchaseData) => ({ ...purchaseData, error: null as string | null })),
        catchError(() =>
          of({
            orders: [] as PurchaseOrderResponse[],
            overdue: [] as PurchaseOrderResponse[],
            summary: null,
            recentPurchaseOrders: [] as PurchaseOrderSummaryItem[],
            error: 'Unable to load purchase summary',
          })
        )
      ),
      supplierResult: this.getSupplierSummary().pipe(
        map((supplierData) => ({ ...supplierData, error: null as string | null })),
        catchError(() =>
          of({
            summary: null,
            topRatedSuppliers: [] as SupplierSummaryItem[],
            lowRatedSuppliers: [] as SupplierSummaryItem[],
            supplierPerformance: [],
            error: 'Unable to load supplier summary',
          })
        )
      ),
      procurementResult: this.getProcurementAttentionItems().pipe(
        map((procurementAttentionItems) => ({ procurementAttentionItems, error: null as string | null })),
        catchError(() =>
          of({
            procurementAttentionItems: [] as ProcurementAttentionItem[],
            error: 'Unable to load procurement items',
          })
        )
      ),
      paymentResult: this.getPaymentSummary().pipe(
        map((paymentData) => ({ ...paymentData, error: null as string | null })),
        catchError(() =>
          of({
            paymentSummary: null,
            paymentReportSummary: null,
            recentPayments: [] as PaymentSummaryItem[],
            error: 'Unable to load payment summary',
          })
        )
      ),
      alertResult: this.getPurchaseAlerts().pipe(
        map((alertData) => ({ ...alertData, error: null as string | null })),
        catchError(() =>
          of({
            alertSummary: null,
            recentAlerts: [] as PurchaseOfficerRecentAlert[],
            error: 'Unable to load purchase alerts',
          })
        )
      ),
    }).pipe(
      map((result) => {
        const sectionErrors: PurchaseOfficerDashboardView['sectionErrors'] = {};
        if (result.dashboardResult.error) sectionErrors.dashboard = result.dashboardResult.error;
        if (result.purchaseResult.error) sectionErrors.purchase = result.purchaseResult.error;
        if (result.supplierResult.error) sectionErrors.suppliers = result.supplierResult.error;
        if (result.procurementResult.error) sectionErrors.procurement = result.procurementResult.error;
        if (result.paymentResult.error) sectionErrors.payments = result.paymentResult.error;
        if (result.alertResult.error) sectionErrors.alerts = result.alertResult.error;

        const paymentSectionEnabled = !!(
          result.paymentResult.paymentSummary ||
          result.paymentResult.paymentReportSummary ||
          result.paymentResult.recentPayments.length
        );

        return {
          roleDashboard: result.dashboardResult.roleDashboard,
          overview: this.buildOverview(
            result.dashboardResult.roleDashboard,
            result.purchaseResult.orders,
            result.purchaseResult.overdue,
            result.purchaseResult.summary,
            result.supplierResult.summary,
            result.paymentResult.paymentSummary,
            result.paymentResult.paymentReportSummary,
            result.alertResult.alertSummary
          ),
          purchaseSummary: result.purchaseResult.summary,
          recentPurchaseOrders: result.purchaseResult.recentPurchaseOrders,
          supplierSummary: result.supplierResult.summary,
          topRatedSuppliers: result.supplierResult.topRatedSuppliers,
          lowRatedSuppliers: result.supplierResult.lowRatedSuppliers,
          supplierPerformance: result.supplierResult.supplierPerformance,
          procurementAttentionItems: result.procurementResult.procurementAttentionItems,
          paymentSummary: result.paymentResult.paymentSummary,
          paymentReportSummary: result.paymentResult.paymentReportSummary,
          recentPayments: result.paymentResult.recentPayments,
          recentAlerts: result.alertResult.recentAlerts,
          alertSummary: result.alertResult.alertSummary,
          paymentSectionEnabled,
          sectionErrors,
          generatedAt: new Date().toISOString(),
        };
      })
    );
  }

  private buildOverview(
    roleDashboard: PurchaseOfficerDashboardView['roleDashboard'],
    orders: PurchaseOrderResponse[],
    overdue: PurchaseOrderResponse[],
    purchaseSummary: PurchaseOfficerDashboardView['purchaseSummary'],
    supplierSummary: PurchaseOfficerDashboardView['supplierSummary'],
    paymentSummary: PurchaseOfficerDashboardView['paymentSummary'],
    paymentReportSummary: PurchaseOfficerDashboardView['paymentReportSummary'],
    alertSummary: PurchaseOfficerDashboardView['alertSummary']
  ): PurchaseOfficerDashboardResponse | null {
    if (!roleDashboard && !orders.length && !purchaseSummary && !supplierSummary && !paymentSummary && !paymentReportSummary && !alertSummary) {
      return null;
    }

    return {
      totalPurchaseOrders: purchaseSummary?.totalPurchaseOrders ?? orders.length,
      draftPurchaseOrders: this.countOrdersByStatus(orders, ['DRAFT']),
      pendingApprovalPurchaseOrders: purchaseSummary?.pendingApprovalCount ?? this.countOrdersByStatus(orders, ['PENDING_APPROVAL']),
      approvedPurchaseOrders: purchaseSummary?.approvedCount ?? this.countOrdersByStatus(orders, ['APPROVED', 'PARTIALLY_RECEIVED']),
      approvedAwaitingReceiptPurchaseOrders: this.countOrdersByStatus(orders, ['APPROVED', 'PARTIALLY_RECEIVED']),
      receivedPurchaseOrders: purchaseSummary?.receivedCount ?? this.countOrdersByStatus(orders, ['RECEIVED']),
      cancelledPurchaseOrders: purchaseSummary?.cancelledCount ?? this.countOrdersByStatus(orders, ['CANCELLED']),
      overduePurchaseOrders: purchaseSummary?.overdueCount ?? overdue.length,
      totalPurchaseValue: purchaseSummary?.totalPurchaseValue ?? roleDashboard?.totalPurchaseValue ?? 0,
      pendingPurchaseValue: purchaseSummary?.pendingPurchaseValue ?? 0,
      activeSuppliers: supplierSummary?.activeSuppliers ?? 0,
      inactiveSuppliers: supplierSummary?.inactiveSuppliers ?? 0,
      averageSupplierRating: supplierSummary?.averageRating ?? 0,
      averageSupplierLeadTime: supplierSummary?.averageLeadTimeDays ?? 0,
      pendingPayments: paymentSummary?.pendingApprovalCount ?? paymentReportSummary?.pendingCount ?? 0,
      approvedPayments: paymentSummary?.approvedCount ?? 0,
      paidAmount: paymentSummary?.totalPaidAmount ?? paymentReportSummary?.totalPaidAmount ?? roleDashboard?.totalPaidAmount ?? 0,
      pendingPaymentAmount: paymentSummary?.pendingPaymentAmount ?? paymentReportSummary?.pendingAmount ?? 0,
      unreadAlerts: alertSummary?.unreadCount ?? 0,
      criticalAlerts: alertSummary?.criticalCount ?? roleDashboard?.criticalAlerts ?? 0,
    };
  }

  private countOrdersByStatus(orders: PurchaseOrderResponse[], statuses: string[]): number {
    return orders.filter((order) => statuses.includes(order.status)).length;
  }

  private mapPurchaseOrder(order: PurchaseOrderResponse): PurchaseOrderSummaryItem {
    return {
      purchaseOrderId: order.purchaseOrderId ?? order.poId,
      poNumber: order.poNumber ?? `PO-${order.poId}`,
      supplierName: order.supplierName ?? 'Unknown supplier',
      warehouseName: order.warehouseName ?? 'Unknown warehouse',
      status: this.formatLabel(order.status),
      totalAmount: order.totalAmount,
      expectedDeliveryDate: order.expectedDeliveryDate ?? order.expectedDate ?? null,
      createdAt: order.createdAt ?? order.orderDate,
      route: `/purchase-orders/${order.poId}`,
    };
  }

  private mapSupplier(supplier: SupplierResponse): SupplierSummaryItem {
    return {
      supplierId: supplier.supplierId,
      supplierName: supplier.name,
      rating: supplier.rating ?? 0,
      leadTimeDays: supplier.leadTimeDays,
      status: supplier.isActive ? 'Active' : 'Inactive',
      totalOrders: supplier.totalOrders ?? 0,
      totalSpend: 0,
      route: `/suppliers/${supplier.supplierId}`,
    };
  }

  private mapPayment(payment: {
    paymentId: number;
    paymentNumber: string;
    poNumber?: string | null;
    supplierName?: string | null;
    status: string;
    paymentAmount: number;
    paymentDate?: string | null;
  }): PaymentSummaryItem {
    return {
      paymentId: payment.paymentId,
      paymentNumber: payment.paymentNumber,
      poNumber: payment.poNumber ?? 'Unlinked PO',
      supplierName: payment.supplierName ?? 'Unknown supplier',
      status: this.formatLabel(payment.status),
      amount: payment.paymentAmount,
      paymentDate: payment.paymentDate ?? null,
      route: `/payments/${payment.paymentId}`,
    };
  }

  private mapAlert(alert: {
    alertId: number;
    title: string;
    severity: string;
    type: string;
    createdAt?: string;
  }): PurchaseOfficerRecentAlert {
    return {
      alertId: alert.alertId,
      title: alert.title,
      severity: alert.severity,
      type: this.formatLabel(alert.type),
      createdAt: alert.createdAt,
      route: `/alerts/${alert.alertId}`,
    };
  }

  private formatLabel(value: string): string {
    return value.replaceAll('_', ' ');
  }
}
