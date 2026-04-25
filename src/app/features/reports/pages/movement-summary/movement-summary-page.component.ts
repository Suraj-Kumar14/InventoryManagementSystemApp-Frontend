import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { TableColumn } from '../../../../shared/components/data-table/data-table.component';
import { ReportExportActionsComponent } from '../../components/report-export-actions/report-export-actions.component';
import { ReportFilterComponent } from '../../components/report-filter/report-filter.component';
import { ReportKpiCardComponent } from '../../components/report-kpi-card/report-kpi-card.component';
import { ReportTableComponent } from '../../components/report-table/report-table.component';
import {
  PagedResponse,
  ReportFilterRequest,
  ReportFormat,
  StockMovementSummaryResponse
} from '../../models';
import { buildDefaultDateRange, sumBy } from '../../report.utils';
import { ReportPageBase } from '../report-page.base';

@Component({
  selector: 'app-movement-summary-page',
  standalone: true,
  imports: [
    CommonModule,
    ReportExportActionsComponent,
    ReportFilterComponent,
    ReportKpiCardComponent,
    ReportTableComponent
  ],
  templateUrl: './movement-summary-page.component.html',
  styleUrls: ['./movement-summary-page.component.css']
})
export class MovementSummaryPageComponent extends ReportPageBase implements OnInit {
  readonly filters = signal<ReportFilterRequest>({
    ...buildDefaultDateRange(30),
    page: 0,
    size: 10,
    sortBy: 'stockOut',
    sortDir: 'desc'
  });
  readonly loading = signal(true);
  readonly errorMessage = signal('');
  readonly response = signal<PagedResponse<StockMovementSummaryResponse>>({
    content: [],
    page: 0,
    size: 10,
    totalElements: 0,
    totalPages: 1,
    first: true,
    last: true
  });

  readonly totalStockIn = computed(() => sumBy(this.response().content, (row) => row.stockIn));
  readonly totalStockOut = computed(() => sumBy(this.response().content, (row) => row.stockOut));
  readonly netMovement = computed(
    () => this.totalStockIn() - this.totalStockOut() + sumBy(this.response().content, (row) => row.adjustment)
  );

  readonly columns: TableColumn<StockMovementSummaryResponse>[] = [
    {
      key: 'productName',
      label: 'Product',
      sortable: true,
      render: (row) => row.productName || `Product #${row.productId}`
    },
    {
      key: 'warehouseName',
      label: 'Warehouse',
      sortable: true,
      render: (row) => row.warehouseName || `Warehouse #${row.warehouseId}`
    },
    {
      key: 'stockIn',
      label: 'Stock In',
      sortable: true,
      render: (row) => this.formatNumber(row.stockIn)
    },
    {
      key: 'stockOut',
      label: 'Stock Out',
      sortable: true,
      render: (row) => this.formatNumber(row.stockOut)
    },
    {
      key: 'adjustment',
      label: 'Adjustment',
      sortable: true,
      render: (row) => this.formatNumber(row.adjustment)
    },
    {
      key: 'transferIn',
      label: 'Transfer In',
      sortable: true,
      render: (row) => this.formatNumber(row.transferIn)
    },
    {
      key: 'transferOut',
      label: 'Transfer Out',
      sortable: true,
      render: (row) => this.formatNumber(row.transferOut)
    }
  ];

  ngOnInit(): void {
    this.loadReport();
  }

  loadReport(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    this.reportApi.getStockMovementSummary(this.filters()).subscribe({
      next: (response) => {
        this.response.set(response);
        this.loading.set(false);
      },
      error: (error) => {
        this.errorMessage.set(
          this.getErrorMessage(error, 'Unable to load the movement summary report.')
        );
        this.loading.set(false);
      }
    });
  }

  onFiltersChange(filters: ReportFilterRequest): void {
    this.filters.set({
      ...this.filters(),
      ...filters,
      page: 0
    });
    this.loadReport();
  }

  onPageChange(page: number): void {
    this.filters.update((current) => ({ ...current, page }));
    this.loadReport();
  }

  onSortChange(sort: { key: string; dir: 'asc' | 'desc' }): void {
    this.filters.update((current) => ({
      ...current,
      page: 0,
      sortBy: sort.key,
      sortDir: sort.dir
    }));
    this.loadReport();
  }

  onExport(format: ReportFormat): void {
    this.exportReport('MOVEMENT_SUMMARY', format, this.filters());
  }
}
