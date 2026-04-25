import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { TableColumn } from '../../../../shared/components/data-table/data-table.component';
import { ReportExportActionsComponent } from '../../components/report-export-actions/report-export-actions.component';
import { ReportFilterComponent } from '../../components/report-filter/report-filter.component';
import { ReportKpiCardComponent } from '../../components/report-kpi-card/report-kpi-card.component';
import { ReportTableComponent } from '../../components/report-table/report-table.component';
import {
  LowStockReportResponse,
  PagedResponse,
  ReportFilterRequest,
  ReportFormat
} from '../../models';
import { ReportPageBase } from '../report-page.base';

@Component({
  selector: 'app-low-stock-report-page',
  standalone: true,
  imports: [
    CommonModule,
    ReportExportActionsComponent,
    ReportFilterComponent,
    ReportKpiCardComponent,
    ReportTableComponent
  ],
  templateUrl: './low-stock-report-page.component.html',
  styleUrls: ['./low-stock-report-page.component.css']
})
export class LowStockReportPageComponent extends ReportPageBase implements OnInit {
  readonly filters = signal<ReportFilterRequest>({
    page: 0,
    size: 10,
    sortBy: 'availableQuantity',
    sortDir: 'asc'
  });
  readonly loading = signal(true);
  readonly errorMessage = signal('');
  readonly response = signal<PagedResponse<LowStockReportResponse>>({
    content: [],
    page: 0,
    size: 10,
    totalElements: 0,
    totalPages: 1,
    first: true,
    last: true
  });

  readonly mostCriticalItem = computed(() => this.response().content[0] ?? null);

  readonly columns: TableColumn<LowStockReportResponse>[] = [
    { key: 'productName', label: 'Product', sortable: true },
    {
      key: 'warehouseName',
      label: 'Warehouse',
      sortable: true,
      render: (row) => row.warehouseName || `Warehouse #${row.warehouseId}`
    },
    {
      key: 'availableQuantity',
      label: 'Available Qty',
      sortable: true,
      render: (row) => `<span class="table-value--danger">${this.formatNumber(row.availableQuantity)}</span>`
    },
    {
      key: 'reorderLevel',
      label: 'Reorder Level',
      sortable: true,
      render: (row) => this.formatNumber(row.reorderLevel)
    },
    {
      key: 'shortfall',
      label: 'Gap',
      render: (row) =>
        `<span class="badge badge-warning">${this.formatNumber(
          Math.max(row.reorderLevel - row.availableQuantity, 0)
        )}</span>`
    }
  ];

  ngOnInit(): void {
    this.loadReport();
  }

  loadReport(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    this.reportApi.getLowStockReport(this.filters()).subscribe({
      next: (response) => {
        this.response.set(response);
        this.loading.set(false);
      },
      error: (error) => {
        this.errorMessage.set(this.getErrorMessage(error, 'Unable to load the low-stock report.'));
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
    this.exportReport('LOW_STOCK', format, this.filters());
  }
}
