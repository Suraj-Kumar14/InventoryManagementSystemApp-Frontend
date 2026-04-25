import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { TableColumn } from '../../../../shared/components/data-table/data-table.component';
import { ReportExportActionsComponent } from '../../components/report-export-actions/report-export-actions.component';
import { ReportFilterComponent } from '../../components/report-filter/report-filter.component';
import { ReportKpiCardComponent } from '../../components/report-kpi-card/report-kpi-card.component';
import { ReportTableComponent } from '../../components/report-table/report-table.component';
import { DeadStockResponse, PagedResponse, ReportFilterRequest, ReportFormat } from '../../models';
import { ReportPageBase } from '../report-page.base';

@Component({
  selector: 'app-dead-stock-report-page',
  standalone: true,
  imports: [
    CommonModule,
    ReportExportActionsComponent,
    ReportFilterComponent,
    ReportKpiCardComponent,
    ReportTableComponent
  ],
  templateUrl: './dead-stock-report-page.component.html',
  styleUrls: ['./dead-stock-report-page.component.css']
})
export class DeadStockReportPageComponent extends ReportPageBase implements OnInit {
  readonly filters = signal<ReportFilterRequest>({
    page: 0,
    size: 10,
    sortBy: 'daysWithoutMovement',
    sortDir: 'desc',
    thresholdDays: 90
  });
  readonly loading = signal(true);
  readonly errorMessage = signal('');
  readonly response = signal<PagedResponse<DeadStockResponse>>({
    content: [],
    page: 0,
    size: 10,
    totalElements: 0,
    totalPages: 1,
    first: true,
    last: true
  });

  readonly stalestItem = computed(() => this.response().content[0] ?? null);

  readonly columns: TableColumn<DeadStockResponse>[] = [
    { key: 'productName', label: 'Product', sortable: true },
    {
      key: 'warehouseName',
      label: 'Warehouse',
      sortable: true,
      render: (row) => row.warehouseName || `Warehouse #${row.warehouseId}`
    },
    {
      key: 'lastMovementDate',
      label: 'Last Movement',
      sortable: true,
      render: (row) => this.formatDate(row.lastMovementDate)
    },
    {
      key: 'daysWithoutMovement',
      label: 'Days Idle',
      sortable: true,
      render: (row) => `<span class="badge badge-danger">${this.formatNumber(row.daysWithoutMovement)}</span>`
    },
    {
      key: 'stockValue',
      label: 'Stock Value',
      sortable: true,
      render: (row) => this.formatCurrency(row.stockValue)
    }
  ];

  ngOnInit(): void {
    this.loadReport();
  }

  loadReport(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    this.reportApi.getDeadStock(this.filters()).subscribe({
      next: (response) => {
        this.response.set(response);
        this.loading.set(false);
      },
      error: (error) => {
        this.errorMessage.set(this.getErrorMessage(error, 'Unable to load the dead stock report.'));
        this.loading.set(false);
      }
    });
  }

  onFiltersChange(filters: ReportFilterRequest): void {
    this.filters.set({
      ...this.filters(),
      ...filters,
      thresholdDays: this.filters().thresholdDays,
      page: 0
    });
    this.loadReport();
  }

  onThresholdChange(value: string): void {
    const parsed = Number(value);
    this.filters.update((current) => ({
      ...current,
      thresholdDays: Number.isFinite(parsed) && parsed > 0 ? parsed : 90
    }));
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
    this.exportReport('DEAD_STOCK', format, this.filters());
  }
}
