import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import {
  DeadStockReportResponse,
  InventoryTurnoverReportResponse,
  InventoryValuationReportResponse,
  LowStockReportItem,
  PageResponse,
  ProductMovementSummaryResponse,
  PurchaseSummaryReportResponse,
  ReportFilter,
  SlowMovingProductResponse,
  TopMovingProductReportResponse,
  WarehouseValuationItem,
} from '../../../core/http/backend.models';
import { NotificationService } from '../../../core/services/notification.service';
import { ReportService } from '../../../core/services/report.service';
import { ReportEmptyStateComponent } from '../components/report-empty-state.component';
import { ReportFilterComponent } from '../components/report-filter.component';
import { ReportKpiCardComponent } from '../components/report-kpi-card.component';

interface ReportColumn {
  key: string;
  label: string;
  type?: 'currency' | 'date' | 'number';
}

@Component({
  standalone: true,
  imports: [CommonModule, ReportFilterComponent, ReportKpiCardComponent, ReportEmptyStateComponent],
  template: `
    <section class="report-page">
      <header class="header">
        <div>
          <p class="eyebrow">StockPro Reports</p>
          <h1>{{ title }}</h1>
          <p>{{ subtitle }}</p>
        </div>
        <button type="button" [disabled]="loading" (click)="load()">{{ loading ? 'Refreshing...' : 'Refresh' }}</button>
      </header>

      <app-report-filter
        [loading]="loading"
        [showSupplier]="kind === 'po-summary'"
        [showProduct]="false"
        [showThreshold]="kind === 'slow-moving'"
        [showDeadStockDays]="kind === 'dead-stock'"
        [threshold]="slowMovingThreshold"
        [deadStockDays]="deadStockDays"
        [initialFilters]="filters"
        (filtersChange)="applyFilters($event)"
        (thresholdChange)="slowMovingThreshold = $event"
        (deadStockDaysChange)="deadStockDays = $event"
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
      </section>

      <ng-template #emptyState>
        <app-report-empty-state
          [title]="loading ? 'Loading report...' : permissionMessage ? 'Access restricted' : 'No report data available'"
          [message]="loading ? 'Fetching the latest report data.' : permissionMessage || 'No report data available for selected filters.'"
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
        position: relative;
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        align-items: flex-start;
        padding: 1.4rem 1.4rem 1.4rem 1.7rem;
        margin-bottom: 1rem;
        overflow: hidden;
      }
      .header::before {
        content: '';
        position: absolute;
        inset: 0 auto 0 0;
        width: 6px;
        background: linear-gradient(180deg, #2563eb 0%, #1d4ed8 55%, #0f4aa8 100%);
      }
      .header h1 {
        margin: 0;
        color: #102748;
      }
      .header p {
        margin: 0.4rem 0 0;
        color: #64748b;
      }
      .eyebrow {
        margin: 0 0 0.3rem;
        color: #2563eb;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        font-size: 0.78rem;
        font-weight: 700;
      }
      button {
        border: none;
        border-radius: 999px;
        background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
        color: #fff;
        padding: 0.8rem 1rem;
        cursor: pointer;
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
    `,
  ],
})
export class ReportDataPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly reportService = inject(ReportService);
  private readonly notifications = inject(NotificationService);

  readonly kind = this.route.snapshot.data['kind'] as string;
  readonly title = this.route.snapshot.data['title'] as string;
  readonly subtitle = this.route.snapshot.data['subtitle'] as string;

  filters: ReportFilter = { period: 'LAST_30_DAYS', page: 0, size: 20 };
  slowMovingThreshold = 5;
  deadStockDays = 90;
  loading = false;
  cards: Array<{ label: string; value: string | number; meta?: string }> = [];
  columns: ReportColumn[] = [];
  rows: Record<string, unknown>[] = [];
  permissionMessage: string | null = null;

  ngOnInit(): void {
    this.load();
  }

  applyFilters(filters: ReportFilter): void {
    this.filters = { ...this.filters, ...filters, page: 0 };
    if (filters.period === 'CUSTOM' && filters.fromDate && filters.toDate && filters.fromDate > filters.toDate) {
      this.notifications.error('Invalid date range');
      return;
    }
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        period: this.filters.period ?? null,
        warehouseId: this.filters.warehouseId ?? null,
        supplierId: this.filters.supplierId ?? null,
        fromDate: this.filters.fromDate ?? null,
        toDate: this.filters.toDate ?? null,
      },
      replaceUrl: true,
    });
    this.load();
  }

  load(): void {
    this.loading = true;
    this.cards = [];
    this.columns = [];
    this.rows = [];
    this.permissionMessage = null;
    this.resolveStream()
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (data) => this.hydrate(data),
        error: (error) => {
          if (error?.status === 403) {
            this.permissionMessage = 'You do not have permission to view this report.';
            return;
          }
          if (error?.status === 503) {
            this.notifications.error('Report service unavailable');
            return;
          }
          this.notifications.error('Unable to load report. Please try again.');
        },
      });
  }

  formatCell(value: unknown, type?: ReportColumn['type']): string {
    if (value == null) {
      return '-';
    }
    if (type === 'currency') {
      return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(value));
    }
    if (type === 'date') {
      return new Date(String(value)).toLocaleDateString();
    }
    if (type === 'number') {
      return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(Number(value));
    }
    return String(value);
  }

  private resolveStream(): Observable<unknown> {
    switch (this.kind) {
      case 'inventory-valuation':
        return this.reportService.getTotalValue(this.filters);
      case 'by-warehouse':
        return this.reportService.getStockValueByWarehouse(this.filters);
      case 'turnover':
        return this.reportService.getInventoryTurnoverReport(this.filters);
      case 'low-stock':
        return this.reportService.getLowStockItems(this.filters);
      case 'top-moving':
        return this.reportService.getTopMovingProductsReport(this.filters);
      case 'slow-moving':
        return this.reportService.getSlowMovingProductsReport(this.filters, this.slowMovingThreshold);
      case 'dead-stock':
        return this.reportService.getDeadStockReport(this.filters, this.deadStockDays);
      default:
        return this.reportService.getPurchaseSummaryReport(this.filters);
    }
  }

  private hydrate(data: unknown): void {
    switch (this.kind) {
      case 'inventory-valuation':
        this.applyInventoryValuation(data as InventoryValuationReportResponse);
        break;
      case 'by-warehouse':
        this.applyWarehouseValuation(data as WarehouseValuationItem[]);
        break;
      case 'turnover':
        this.applyInventoryTurnover(data as InventoryTurnoverReportResponse);
        break;
      case 'low-stock':
        this.applyPage(data as PageResponse<LowStockReportItem>, [
          { key: 'productName', label: 'Product' },
          { key: 'warehouseName', label: 'Warehouse' },
          { key: 'availableQuantity', label: 'Available', type: 'number' },
          { key: 'reorderLevel', label: 'Reorder Level', type: 'number' },
          { key: 'severity', label: 'Severity' },
          { key: 'recommendedAction', label: 'Recommended Action' },
        ]);
        break;
      case 'top-moving':
        this.applyRows(data as TopMovingProductReportResponse[], [
          { key: 'productName', label: 'Product' },
          { key: 'unitsIn', label: 'Units In', type: 'number' },
          { key: 'unitsOut', label: 'Units Out', type: 'number' },
          { key: 'totalMoved', label: 'Total Moved', type: 'number' },
          { key: 'movementCount', label: 'Movement Count', type: 'number' },
        ]);
        break;
      case 'slow-moving':
        this.applyRows(data as SlowMovingProductResponse[], [
          { key: 'productName', label: 'Product' },
          { key: 'totalMoved', label: 'Total Moved', type: 'number' },
          { key: 'lastMovementDate', label: 'Last Movement', type: 'date' },
          { key: 'daysSinceLastMovement', label: 'Days Since Movement', type: 'number' },
          { key: 'currentQuantity', label: 'Current Quantity', type: 'number' },
        ]);
        break;
      case 'dead-stock':
        this.applyRows(data as DeadStockReportResponse[], [
          { key: 'productName', label: 'Product' },
          { key: 'warehouseName', label: 'Warehouse' },
          { key: 'quantity', label: 'Quantity', type: 'number' },
          { key: 'stockValue', label: 'Stock Value', type: 'currency' },
          { key: 'daysWithoutMovement', label: 'Days Without Movement', type: 'number' },
        ]);
        break;
      default:
        this.applyPurchaseSummary(data as PurchaseSummaryReportResponse);
        break;
    }
  }

  private applyInventoryValuation(valuation: InventoryValuationReportResponse): void {
    this.cards = [
      { label: 'Inventory Value', value: this.formatCell(valuation.totalInventoryValue, 'currency') },
      { label: 'Total Quantity', value: this.formatCell(valuation.totalQuantity, 'number') },
      { label: 'Products', value: valuation.totalProducts },
      { label: 'Warehouses', value: valuation.totalWarehouses },
    ];
    this.rows = valuation.productBreakdown as unknown as Record<string, unknown>[];
    this.columns = [
      { key: 'productName', label: 'Product' },
      { key: 'warehouseName', label: 'Warehouse' },
      { key: 'quantity', label: 'Quantity', type: 'number' },
      { key: 'costPrice', label: 'Cost Price', type: 'currency' },
      { key: 'stockValue', label: 'Stock Value', type: 'currency' },
    ];
  }

  private applyWarehouseValuation(rows: WarehouseValuationItem[]): void {
    this.cards = [
      { label: 'Warehouses', value: rows.length },
      {
        label: 'Total Warehouse Value',
        value: this.formatCell(rows.reduce((sum, item) => sum + Number(item.stockValue ?? 0), 0), 'currency'),
      },
    ];
    this.applyRows(rows, [
      { key: 'warehouseName', label: 'Warehouse' },
      { key: 'totalQuantity', label: 'Quantity', type: 'number' },
      { key: 'stockValue', label: 'Stock Value', type: 'currency' },
    ]);
  }

  private applyInventoryTurnover(summary: InventoryTurnoverReportResponse): void {
    this.cards = [
      { label: 'COGS', value: this.formatCell(summary.cogs, 'currency') },
      { label: 'Average Inventory', value: this.formatCell(summary.averageInventoryValue, 'currency') },
      { label: 'Turnover Rate', value: this.formatCell(summary.turnoverRate, 'number') },
      { label: 'Period', value: `${summary.from} to ${summary.to}` },
    ];
    this.applyRows(summary.productTurnover, [
      { key: 'productName', label: 'Product' },
      { key: 'sku', label: 'SKU' },
      { key: 'cogs', label: 'COGS', type: 'currency' },
      { key: 'averageInventoryValue', label: 'Average Inventory', type: 'currency' },
      { key: 'turnoverRate', label: 'Turnover Rate', type: 'number' },
    ]);
  }

  private applyPurchaseSummary(summary: PurchaseSummaryReportResponse): void {
    this.cards = [
      { label: 'Total Purchase Orders', value: summary.totalPurchaseOrders },
      { label: 'Total Spend', value: this.formatCell(summary.totalSpend, 'currency') },
      { label: 'Pending Approval', value: summary.pendingApprovalCount },
      { label: 'Approved', value: summary.approvedCount },
      { label: 'Partially Received', value: summary.partiallyReceivedCount },
      { label: 'Fully Received', value: summary.fullyReceivedCount },
    ];
    const supplierRows = summary.supplierBreakdown.map((item) => ({
      supplierOrWarehouse: item.name,
      poCount: item.poCount,
      totalSpend: item.totalSpend,
    }));
    this.applyRows(supplierRows, [
      { key: 'supplierOrWarehouse', label: 'Supplier' },
      { key: 'poCount', label: 'PO Count', type: 'number' },
      { key: 'totalSpend', label: 'Total Spend', type: 'currency' },
    ]);
  }

  private applyPage<T>(page: PageResponse<T>, columns: ReportColumn[]): void {
    this.columns = columns;
    this.rows = page.content as unknown as Record<string, unknown>[];
  }

  private applyRows<T>(rows: T[], columns: ReportColumn[]): void {
    this.columns = columns;
    this.rows = rows as unknown as Record<string, unknown>[];
  }
}
