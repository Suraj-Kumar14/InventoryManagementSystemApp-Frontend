import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';
import { ReportChartCardComponent } from '../../components/report-chart-card/report-chart-card.component';
import { ReportKpiCardComponent } from '../../components/report-kpi-card/report-kpi-card.component';
import {
  LowStockReportResponse,
  ReportDashboardSummary,
  WarehouseStockValueResponse
} from '../../models';
import { getAccessibleReportItems } from '../../report.constants';
import { ReportPageBase } from '../report-page.base';

@Component({
  selector: 'app-report-dashboard-page',
  standalone: true,
  imports: [CommonModule, RouterLink, ReportKpiCardComponent, ReportChartCardComponent],
  templateUrl: './report-dashboard-page.component.html',
  styleUrls: ['./report-dashboard-page.component.css']
})
export class ReportDashboardPageComponent extends ReportPageBase implements OnInit {
  readonly loading = signal(true);
  readonly errorMessage = signal('');
  readonly summary = signal<ReportDashboardSummary | null>(null);
  readonly warehouseValues = signal<WarehouseStockValueResponse[]>([]);
  readonly lowStockPreview = signal<LowStockReportResponse[]>([]);

  readonly navigationItems = computed(() => getAccessibleReportItems(this.currentRole()));

  readonly warehouseChartItems = computed(() =>
    [...this.warehouseValues()]
      .sort((left, right) => right.totalStockValue - left.totalStockValue)
      .slice(0, 6)
      .map((warehouse) => ({
        label: warehouse.warehouseName,
        value: warehouse.totalStockValue,
        secondary:
          warehouse.percentageOfTotal != null
            ? `${this.formatPercent(warehouse.percentageOfTotal)} of valuation`
            : 'Warehouse valuation',
        tone: 'primary' as const
      }))
  );

  readonly topWarehouseLabel = computed(() => {
    const topWarehouse = this.summary()?.topWarehouse;
    if (!topWarehouse) {
      return '--';
    }

    return `${topWarehouse.warehouseName} · ${this.formatCurrency(topWarehouse.totalStockValue)}`;
  });

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    forkJoin({
      summary: this.reportApi.getDashboardSummary().pipe(catchError(() => of(null))),
      warehouseValues: this.reportApi.getStockValueByWarehouse().pipe(catchError(() => of([]))),
      lowStockPreview: this.reportApi
        .getLowStockReport({ page: 0, size: 5, sortBy: 'availableQuantity', sortDir: 'asc' })
        .pipe(catchError(() => of({ content: [] })))
    }).subscribe({
      next: ({ summary, warehouseValues, lowStockPreview }) => {
        const topWarehouse =
          [...warehouseValues].sort(
            (left, right) => right.totalStockValue - left.totalStockValue
          )[0] ?? null;

        this.summary.set(
          summary ?? {
            snapshotDate: warehouseValues[0]?.snapshotDate ?? null,
            totalStockValue: 0,
            lowStockCount: 0,
            deadStockCount: 0,
            totalPurchaseOrders: 0,
            totalPurchaseSpend: 0,
            warehouseCount: warehouseValues.length,
            topWarehouse
          }
        );
        this.warehouseValues.set(warehouseValues);
        this.lowStockPreview.set(lowStockPreview.content ?? []);
        this.loading.set(false);
      },
      error: (error) => {
        this.errorMessage.set(
          this.getErrorMessage(error, 'The analytics dashboard is currently unavailable.')
        );
        this.loading.set(false);
      }
    });
  }

  takeSnapshot(): void {
    if (!this.canTakeSnapshot()) {
      return;
    }

    this.reportApi.takeSnapshot({ snapshotDate: new Date().toISOString().slice(0, 10) }).subscribe({
      next: () => {
        this.toastService.success('Inventory snapshot created');
        this.loadDashboard();
      },
      error: (error) => {
        this.toastService.error(
          'Snapshot failed',
          this.getErrorMessage(error, 'Unable to take the daily inventory snapshot.')
        );
      }
    });
  }
}
