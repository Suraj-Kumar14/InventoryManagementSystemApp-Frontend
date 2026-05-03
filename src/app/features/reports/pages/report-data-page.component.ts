import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import {
  AlertSummaryReportResponse,
  DeadStockReportResponse,
  InventoryReportSummaryResponse,
  InventorySnapshotResponse,
  InventoryTurnoverReportResponse,
  InventoryValuationReportResponse,
  LowStockReportItem,
  OverstockReportItem,
  PageResponse,
  PaymentSummaryReportResponse,
  ProductValuationItem,
  PurchaseSummaryReportResponse,
  ReportExportFormat,
  ReportFilter,
  SlowMovingProductResponse,
  StockMovementReportItem,
  SupplierPerformanceReportResponse,
  TopMovingProductReportResponse,
  WarehouseValuationItem,
} from '../../../core/http/backend.models';
import { NotificationService } from '../../../core/services/notification.service';
import { ReportService } from '../../../core/services/report.service';
import { ReportEmptyStateComponent } from '../components/report-empty-state.component';
import { ReportExportButtonsComponent } from '../components/report-export-buttons.component';
import { ReportFilterComponent } from '../components/report-filter.component';
import { ReportKpiCardComponent } from '../components/report-kpi-card.component';

interface ReportColumn {
  key: string;
  label: string;
  type?: 'currency' | 'date' | 'number';
}

@Component({
  standalone: true,
  imports: [CommonModule, ReportFilterComponent, ReportKpiCardComponent, ReportEmptyStateComponent, ReportExportButtonsComponent],
  template: `
    <section class="report-page">
      <header class="header">
        <div>
          <p class="eyebrow">StockPro Reports</p>
          <h1>{{ title }}</h1>
          <p>{{ subtitle }}</p>
        </div>
        <div class="header-actions">
          <button type="button" [disabled]="loading" (click)="load()">{{ loading ? 'Refreshing...' : 'Refresh' }}</button>
          <button *ngIf="kind === 'snapshots' && canRunSnapshot" type="button" [disabled]="actionLoading" (click)="runSnapshot()">
            {{ actionLoading ? 'Running...' : 'Run Snapshot' }}
          </button>
        </div>
      </header>

      <app-report-filter
        [loading]="loading"
        [showSupplier]="kind.includes('supplier') || kind.includes('purchase') || kind.includes('payment')"
        (filtersChange)="applyFilters($event)"
      />

      <app-report-export-buttons
        *ngIf="exportable"
        class="toolbar"
        [loading]="exportLoading"
        [formats]="['CSV', 'EXCEL', 'PDF']"
        (exportRequested)="export($event)"
      />

      <div class="kpi-grid" *ngIf="cards.length">
        <app-report-kpi-card *ngFor="let card of cards" [label]="card.label" [value]="card.value" [meta]="card.meta" />
      </div>

      <section class="table-panel" *ngIf="rows.length; else emptyState">
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th *ngFor="let column of columns">{{ column.label }}</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let row of rows">
                <td *ngFor="let column of columns">{{ formatCell(row[column.key], column.type) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="pager" *ngIf="pageMeta">
          <button type="button" [disabled]="loading || pageMeta.number === 0" (click)="goToPage(pageMeta.number - 1)">Previous</button>
          <span>Page {{ pageMeta.number + 1 }} of {{ pageMeta.totalPages || 1 }}</span>
          <button
            type="button"
            [disabled]="loading || pageMeta.last || pageMeta.number + 1 >= pageMeta.totalPages"
            (click)="goToPage(pageMeta.number + 1)"
          >
            Next
          </button>
        </div>
      </section>

      <ng-template #emptyState>
        <app-report-empty-state
          [title]="loading ? 'Loading report…' : 'No report data found'"
          [message]="loading ? 'Fetching the latest report data.' : 'No report data found for the selected filters.'"
        />
      </ng-template>
    </section>
  `,
  styles: [
    `
      .report-page {
        padding: 1.5rem;
        min-height: 100%;
        background:
          radial-gradient(circle at top right, rgba(251, 191, 36, 0.15), transparent 32%),
          radial-gradient(circle at top left, rgba(14, 165, 233, 0.15), transparent 36%),
          #f8fafc;
      }
      .header,
      .table-panel {
        background: rgba(255, 255, 255, 0.88);
        border: 1px solid rgba(148, 163, 184, 0.16);
        border-radius: 28px;
        box-shadow: 0 20px 60px rgba(15, 23, 42, 0.08);
      }
      .header {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        align-items: flex-start;
        padding: 1.4rem;
        margin-bottom: 1rem;
      }
      .header h1 {
        margin: 0;
      }
      .header p {
        margin: 0.4rem 0 0;
        color: #475569;
      }
      .eyebrow {
        margin: 0 0 0.3rem;
        color: #0f766e;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        font-size: 0.78rem;
        font-weight: 700;
      }
      .header-actions {
        display: flex;
        gap: 0.75rem;
        flex-wrap: wrap;
      }
      button {
        border: none;
        border-radius: 999px;
        background: #0f172a;
        color: #fff;
        padding: 0.8rem 1rem;
        cursor: pointer;
      }
      button:disabled {
        opacity: 0.65;
        cursor: wait;
      }
      .toolbar {
        display: block;
        margin: 1rem 0;
      }
      .kpi-grid {
        margin: 1rem 0;
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
        gap: 1rem;
      }
      .table-panel {
        padding: 1rem;
      }
      .table-wrap {
        overflow-x: auto;
      }
      table {
        width: 100%;
        border-collapse: collapse;
      }
      th,
      td {
        padding: 0.9rem 0.8rem;
        text-align: left;
        border-bottom: 1px solid #e2e8f0;
        white-space: nowrap;
      }
      th {
        color: #64748b;
        font-size: 0.78rem;
        text-transform: uppercase;
        letter-spacing: 0.06em;
      }
      .pager {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 1rem;
        padding-top: 1rem;
      }
      @media (max-width: 700px) {
        .header {
          flex-direction: column;
        }
        .pager {
          flex-direction: column;
        }
      }
    `,
  ],
})
export class ReportDataPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly reportService = inject(ReportService);
  private readonly notifications = inject(NotificationService);

  readonly kind = this.route.snapshot.data['kind'] as string;
  readonly title = this.route.snapshot.data['title'] as string;
  readonly subtitle = this.route.snapshot.data['subtitle'] as string;
  readonly exportable = !!this.route.snapshot.data['exportable'];
  readonly canRunSnapshot = !!this.route.snapshot.data['canRunSnapshot'];

  filters: ReportFilter = { period: 'LAST_30_DAYS', page: 0, size: 20 };
  loading = false;
  actionLoading = false;
  exportLoading: ReportExportFormat | null = null;
  cards: Array<{ label: string; value: string | number; meta?: string }> = [];
  columns: ReportColumn[] = [];
  rows: Record<string, unknown>[] = [];
  pageMeta: PageResponse<unknown> | null = null;

  ngOnInit(): void {
    this.load();
  }

  applyFilters(filters: ReportFilter): void {
    this.filters = { ...this.filters, ...filters, page: 0 };
    if (filters.period === 'CUSTOM' && filters.fromDate && filters.toDate && filters.fromDate > filters.toDate) {
      this.notifications.error('Invalid date range');
      return;
    }
    this.load();
  }

  goToPage(page: number): void {
    this.filters = { ...this.filters, page };
    this.load();
  }

  runSnapshot(): void {
    this.actionLoading = true;
    this.reportService
      .runInventorySnapshot()
      .pipe(finalize(() => (this.actionLoading = false)))
      .subscribe({
        next: () => {
          this.notifications.success('Inventory snapshot created successfully');
          this.load();
        },
        error: () => this.notifications.error('Unable to run inventory snapshot'),
      });
  }

  export(format: ReportExportFormat): void {
    this.exportLoading = format;
    const stream =
      this.kind === 'inventory-valuation'
        ? this.reportService.exportInventoryValuation(this.filters, format)
        : this.kind === 'movements'
          ? this.reportService.exportStockMovements(this.filters, format)
          : this.kind === 'purchase-summary'
            ? this.reportService.exportPurchaseSummary(this.filters, format)
            : this.reportService.exportSupplierPerformance(this.filters, format);

    stream.pipe(finalize(() => (this.exportLoading = null))).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${this.kind}.${format.toLowerCase()}`;
        link.click();
        URL.revokeObjectURL(url);
        this.notifications.success('Report exported successfully');
      },
      error: () => this.notifications.error('Unable to export report'),
    });
  }

  load(): void {
    this.loading = true;
    this.cards = [];
    this.columns = [];
    this.rows = [];
    this.pageMeta = null;
    this.resolveStream()
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (data) => this.hydrate(data),
        error: () => this.notifications.error('Unable to load report. Please try again.'),
      });
  }

  formatCell(value: unknown, type?: ReportColumn['type']): string {
    if (value == null) {
      return '-';
    }
    if (type === 'currency') {
      return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(
        Number(value)
      );
    }
    if (type === 'date') {
      return new Date(String(value)).toLocaleString();
    }
    if (type === 'number') {
      return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(Number(value));
    }
    return String(value);
  }

  private resolveStream(): Observable<unknown> {
    switch (this.kind) {
      case 'inventory-valuation':
        return this.reportService.getInventoryValuation(this.filters);
      case 'stock-summary':
        return this.reportService.getStockSummary(this.filters);
      case 'product-stock':
        return this.reportService.getProductStockReport(this.filters);
      case 'warehouse-stock':
        return this.reportService.getWarehouseStockReport(this.filters);
      case 'low-stock':
        return this.reportService.getLowStockItems(this.filters);
      case 'overstock':
        return this.reportService.getOverstockReport(this.filters);
      case 'movements':
        return this.reportService.getStockMovementReport(this.filters);
      case 'turnover':
        return this.reportService.getInventoryTurnoverReport(this.filters);
      case 'top-moving':
        return this.reportService.getTopMovingProductsReport(this.filters);
      case 'slow-moving':
        return this.reportService.getSlowMovingProductsReport(this.filters);
      case 'dead-stock':
        return this.reportService.getDeadStockReport(this.filters);
      case 'purchase-summary':
        return this.reportService.getPurchaseSummaryReport(this.filters);
      case 'supplier-performance':
        return this.reportService.getSupplierPerformanceReport(this.filters);
      case 'payment-summary':
        return this.reportService.getPaymentSummaryReport(this.filters);
      case 'alert-summary':
        return this.reportService.getAlertSummaryReport(this.filters);
      default:
        return this.reportService.getInventorySnapshots(new Date().toISOString().slice(0, 10), this.filters.page ?? 0, this.filters.size ?? 20);
    }
  }

  private hydrate(data: unknown): void {
    switch (this.kind) {
      case 'inventory-valuation':
        this.applyInventoryValuation(data as InventoryValuationReportResponse);
        break;
      case 'stock-summary':
        this.applyStockSummary(data as InventoryReportSummaryResponse);
        break;
      case 'product-stock':
        this.applyPage(data as PageResponse<ProductValuationItem>, [
          { key: 'productName', label: 'Product' },
          { key: 'warehouseName', label: 'Warehouse' },
          { key: 'category', label: 'Category' },
          { key: 'quantity', label: 'Quantity', type: 'number' },
          { key: 'unitCost', label: 'Unit Cost', type: 'currency' },
          { key: 'totalValue', label: 'Total Value', type: 'currency' },
        ]);
        break;
      case 'warehouse-stock':
        this.applyPage(data as PageResponse<WarehouseValuationItem>, [
          { key: 'warehouseName', label: 'Warehouse' },
          { key: 'totalQuantity', label: 'Quantity', type: 'number' },
          { key: 'totalValue', label: 'Value', type: 'currency' },
        ]);
        break;
      case 'low-stock':
        this.applyPage(data as PageResponse<LowStockReportItem>, [
          { key: 'productName', label: 'Product' },
          { key: 'warehouseName', label: 'Warehouse' },
          { key: 'availableQuantity', label: 'Available', type: 'number' },
          { key: 'reorderLevel', label: 'Reorder Level', type: 'number' },
          { key: 'shortageQuantity', label: 'Shortage', type: 'number' },
          { key: 'severity', label: 'Severity' },
        ]);
        break;
      case 'overstock':
        this.applyPage(data as PageResponse<OverstockReportItem>, [
          { key: 'productName', label: 'Product' },
          { key: 'warehouseName', label: 'Warehouse' },
          { key: 'quantity', label: 'Quantity', type: 'number' },
          { key: 'maxStockLevel', label: 'Max Stock', type: 'number' },
          { key: 'excessQuantity', label: 'Excess', type: 'number' },
        ]);
        break;
      case 'movements':
        this.applyPage(data as PageResponse<StockMovementReportItem>, [
          { key: 'movementNumber', label: 'Movement #' },
          { key: 'productName', label: 'Product' },
          { key: 'warehouseName', label: 'Warehouse' },
          { key: 'movementType', label: 'Type' },
          { key: 'direction', label: 'Direction' },
          { key: 'quantity', label: 'Quantity', type: 'number' },
          { key: 'totalValue', label: 'Value', type: 'currency' },
          { key: 'movementDate', label: 'Date', type: 'date' },
        ]);
        break;
      case 'turnover':
        this.applyRows(data as InventoryTurnoverReportResponse[], [
          { key: 'productName', label: 'Product' },
          { key: 'openingStock', label: 'Opening', type: 'number' },
          { key: 'closingStock', label: 'Closing', type: 'number' },
          { key: 'averageInventory', label: 'Average', type: 'number' },
          { key: 'stockOutQuantity', label: 'Stock Out', type: 'number' },
          { key: 'turnoverRatio', label: 'Turnover', type: 'number' },
        ]);
        break;
      case 'top-moving':
        this.applyRows(data as TopMovingProductReportResponse[], [
          { key: 'productName', label: 'Product' },
          { key: 'totalMovementQuantity', label: 'Movement Qty', type: 'number' },
          { key: 'movementCount', label: 'Movement Count', type: 'number' },
          { key: 'totalMovementValue', label: 'Movement Value', type: 'currency' },
        ]);
        break;
      case 'slow-moving':
        this.applyRows(data as SlowMovingProductResponse[], [
          { key: 'productName', label: 'Product' },
          { key: 'lastMovementDate', label: 'Last Movement', type: 'date' },
          { key: 'daysSinceLastMovement', label: 'Days Since Move', type: 'number' },
          { key: 'currentQuantity', label: 'Current Qty', type: 'number' },
          { key: 'stockValue', label: 'Stock Value', type: 'currency' },
        ]);
        break;
      case 'dead-stock':
        this.applyRows(data as DeadStockReportResponse[], [
          { key: 'productName', label: 'Product' },
          { key: 'warehouseName', label: 'Warehouse' },
          { key: 'currentQuantity', label: 'Current Qty', type: 'number' },
          { key: 'stockValue', label: 'Stock Value', type: 'currency' },
          { key: 'daysWithoutMovement', label: 'Days Without Movement', type: 'number' },
        ]);
        break;
      case 'purchase-summary':
        this.applyPurchaseSummary(data as PurchaseSummaryReportResponse);
        break;
      case 'supplier-performance':
        this.applyPage(data as PageResponse<SupplierPerformanceReportResponse>, [
          { key: 'supplierName', label: 'Supplier' },
          { key: 'totalOrders', label: 'Orders', type: 'number' },
          { key: 'receivedOrders', label: 'Received', type: 'number' },
          { key: 'delayedOrders', label: 'Delayed', type: 'number' },
          { key: 'totalSpend', label: 'Spend', type: 'currency' },
          { key: 'averageLeadTimeDays', label: 'Lead Time', type: 'number' },
          { key: 'rating', label: 'Rating', type: 'number' },
        ]);
        break;
      case 'payment-summary':
        this.applyPaymentSummary(data as PaymentSummaryReportResponse);
        break;
      case 'alert-summary':
        this.applyAlertSummary(data as AlertSummaryReportResponse);
        break;
      default:
        this.applyPage(data as PageResponse<InventorySnapshotResponse>, [
          { key: 'snapshotDate', label: 'Snapshot Date' },
          { key: 'productName', label: 'Product' },
          { key: 'warehouseName', label: 'Warehouse' },
          { key: 'quantity', label: 'Quantity', type: 'number' },
          { key: 'availableQuantity', label: 'Available', type: 'number' },
          { key: 'totalValue', label: 'Total Value', type: 'currency' },
        ]);
    }
  }

  private applyInventoryValuation(valuation: InventoryValuationReportResponse): void {
    this.cards = [
      { label: 'Inventory Value', value: this.formatCell(valuation.totalInventoryValue, 'currency') },
      { label: 'Total Quantity', value: this.formatCell(valuation.totalQuantity, 'number') },
      { label: 'Products', value: valuation.totalProducts },
      { label: 'Warehouses', value: valuation.totalWarehouses },
    ];
    this.rows = valuation.valuationByProduct as unknown as Record<string, unknown>[];
    this.columns = [
      { key: 'productName', label: 'Product' },
      { key: 'warehouseName', label: 'Warehouse' },
      { key: 'category', label: 'Category' },
      { key: 'quantity', label: 'Quantity', type: 'number' },
      { key: 'unitCost', label: 'Unit Cost', type: 'currency' },
      { key: 'totalValue', label: 'Total Value', type: 'currency' },
    ];
  }

  private applyStockSummary(summary: InventoryReportSummaryResponse): void {
    this.cards = [
      { label: 'Products', value: summary.totalProducts },
      { label: 'Warehouses', value: summary.totalWarehouses },
      { label: 'Available Stock', value: this.formatCell(summary.totalAvailableQuantity, 'number') },
      { label: 'Reserved Stock', value: this.formatCell(summary.totalReservedQuantity, 'number') },
      { label: 'Low Stock', value: summary.lowStockCount },
      { label: 'Overstock', value: summary.overstockCount },
    ];
  }

  private applyPurchaseSummary(summary: PurchaseSummaryReportResponse): void {
    this.cards = [
      { label: 'Total Purchase Orders', value: summary.totalPurchaseOrders },
      { label: 'Pending Approval', value: summary.pendingApprovalCount },
      { label: 'Approved', value: summary.approvedCount },
      { label: 'Received', value: summary.receivedCount },
      { label: 'Overdue', value: summary.overdueCount },
      { label: 'Total Purchase Value', value: this.formatCell(summary.totalPurchaseValue, 'currency') },
    ];
  }

  private applyPaymentSummary(summary: PaymentSummaryReportResponse): void {
    this.cards = [
      { label: 'Total Payments', value: summary.totalPayments },
      { label: 'Paid Count', value: summary.paidCount },
      { label: 'Pending Count', value: summary.pendingCount },
      { label: 'Cancelled Count', value: summary.cancelledCount },
      { label: 'Total Paid Amount', value: this.formatCell(summary.totalPaidAmount, 'currency') },
      { label: 'Pending Amount', value: this.formatCell(summary.pendingAmount, 'currency') },
    ];
    this.applyRows(summary.supplierPayments as unknown as Record<string, unknown>[], [
      { key: 'supplierName', label: 'Supplier' },
      { key: 'paidAmount', label: 'Paid', type: 'currency' },
      { key: 'pendingAmount', label: 'Pending', type: 'currency' },
    ]);
  }

  private applyAlertSummary(summary: AlertSummaryReportResponse): void {
    this.cards = [
      { label: 'Total Alerts', value: summary.totalAlerts },
      { label: 'Unread', value: summary.unreadAlerts },
      { label: 'Critical', value: summary.criticalAlerts },
      { label: 'Warning', value: summary.warningAlerts },
    ];
    this.rows = Object.entries(summary.alertsByType).map(([type, count]) => ({ type, count }));
    this.columns = [
      { key: 'type', label: 'Alert Type' },
      { key: 'count', label: 'Count', type: 'number' },
    ];
  }

  private applyPage<T>(page: PageResponse<T>, columns: ReportColumn[]): void {
    this.pageMeta = page;
    this.columns = columns;
    this.rows = page.content as unknown as Record<string, unknown>[];
  }

  private applyRows<T>(rows: T[], columns: ReportColumn[]): void {
    this.columns = columns;
    this.rows = rows as unknown as Record<string, unknown>[];
  }
}
