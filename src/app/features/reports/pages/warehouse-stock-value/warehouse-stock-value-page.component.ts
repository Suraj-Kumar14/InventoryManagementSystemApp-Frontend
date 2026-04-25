import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { TableColumn } from '../../../../shared/components/data-table/data-table.component';
import { ReportChartCardComponent } from '../../components/report-chart-card/report-chart-card.component';
import { ReportExportActionsComponent } from '../../components/report-export-actions/report-export-actions.component';
import { ReportKpiCardComponent } from '../../components/report-kpi-card/report-kpi-card.component';
import { ReportTableComponent } from '../../components/report-table/report-table.component';
import { ReportFormat, WarehouseStockValueResponse } from '../../models';
import { sumBy } from '../../report.utils';
import { ReportPageBase } from '../report-page.base';

@Component({
  selector: 'app-warehouse-stock-value-page',
  standalone: true,
  imports: [
    CommonModule,
    ReportChartCardComponent,
    ReportExportActionsComponent,
    ReportKpiCardComponent,
    ReportTableComponent
  ],
  templateUrl: './warehouse-stock-value-page.component.html',
  styleUrls: ['./warehouse-stock-value-page.component.css']
})
export class WarehouseStockValuePageComponent extends ReportPageBase implements OnInit {
  readonly loading = signal(true);
  readonly errorMessage = signal('');
  readonly snapshotDate = signal(new Date().toISOString().slice(0, 10));
  readonly rows = signal<WarehouseStockValueResponse[]>([]);

  readonly totalValue = computed(() => sumBy(this.rows(), (row) => row.totalStockValue));
  readonly topWarehouse = computed(
    () =>
      [...this.rows()].sort((left, right) => right.totalStockValue - left.totalStockValue)[0] ?? null
  );
  readonly chartItems = computed(() =>
    this.rows().map((row) => ({
      label: row.warehouseName,
      value: row.totalStockValue,
      secondary:
        row.percentageOfTotal != null
          ? `${this.formatPercent(row.percentageOfTotal)} of total stock value`
          : 'Warehouse stock value',
      tone: 'info' as const
    }))
  );

  readonly columns: TableColumn<WarehouseStockValueResponse>[] = [
    { key: 'warehouseName', label: 'Warehouse', sortable: true },
    {
      key: 'totalStockValue',
      label: 'Stock Value',
      sortable: true,
      render: (row) => this.formatCurrency(row.totalStockValue)
    },
    {
      key: 'percentageOfTotal',
      label: 'Share',
      sortable: true,
      render: (row) => this.formatPercent(row.percentageOfTotal)
    },
    {
      key: 'totalProducts',
      label: 'Products',
      sortable: true,
      render: (row) => this.formatNumber(row.totalProducts)
    },
    {
      key: 'totalQuantity',
      label: 'Units',
      sortable: true,
      render: (row) => this.formatNumber(row.totalQuantity)
    },
    {
      key: 'utilizationPercent',
      label: 'Utilization',
      sortable: true,
      render: (row) => this.formatPercent(row.utilizationPercent)
    }
  ];

  ngOnInit(): void {
    this.loadReport();
  }

  loadReport(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    this.reportApi.getStockValueByWarehouse(this.snapshotDate() || undefined).subscribe({
      next: (response) => {
        this.rows.set(response);
        this.loading.set(false);
      },
      error: (error) => {
        this.errorMessage.set(
          this.getErrorMessage(error, 'Unable to load warehouse valuation summary.')
        );
        this.loading.set(false);
      }
    });
  }

  onDateChange(value: string): void {
    this.snapshotDate.set(value);
  }

  onExport(format: ReportFormat): void {
    this.exportReport('WAREHOUSE_STOCK_VALUE', format, {
      fromDate: this.snapshotDate(),
      toDate: this.snapshotDate()
    });
  }
}
