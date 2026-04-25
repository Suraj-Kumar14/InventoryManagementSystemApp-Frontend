import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { TableColumn } from '../../../../shared/components/data-table/data-table.component';
import { ReportExportActionsComponent } from '../../components/report-export-actions/report-export-actions.component';
import { ReportFilterComponent } from '../../components/report-filter/report-filter.component';
import { ReportKpiCardComponent } from '../../components/report-kpi-card/report-kpi-card.component';
import { ReportTableComponent } from '../../components/report-table/report-table.component';
import {
  InventoryTurnoverResponse,
  PagedResponse,
  ReportFilterRequest,
  ReportFormat
} from '../../models';
import { buildDefaultDateRange, sumBy } from '../../report.utils';
import { ReportPageBase } from '../report-page.base';

@Component({
  selector: 'app-inventory-turnover-page',
  standalone: true,
  imports: [
    CommonModule,
    ReportExportActionsComponent,
    ReportFilterComponent,
    ReportKpiCardComponent,
    ReportTableComponent
  ],
  templateUrl: './inventory-turnover-page.component.html',
  styleUrls: ['./inventory-turnover-page.component.css']
})
export class InventoryTurnoverPageComponent extends ReportPageBase implements OnInit {
  readonly filters = signal<ReportFilterRequest>({
    ...buildDefaultDateRange(30),
    page: 0,
    size: 10,
    sortBy: 'turnoverRate',
    sortDir: 'desc'
  });
  readonly loading = signal(true);
  readonly errorMessage = signal('');
  readonly response = signal<PagedResponse<InventoryTurnoverResponse>>({
    content: [],
    page: 0,
    size: 10,
    totalElements: 0,
    totalPages: 1,
    first: true,
    last: true
  });

  readonly averageTurnover = computed(() => {
    const rows = this.response().content;
    if (!rows.length) {
      return 0;
    }

    return sumBy(rows, (row) => row.turnoverRate) / rows.length;
  });

  readonly bestProduct = computed(() => this.response().content[0] ?? null);

  readonly columns: TableColumn<InventoryTurnoverResponse>[] = [
    { key: 'productName', label: 'Product', sortable: true },
    {
      key: 'warehouseName',
      label: 'Warehouse',
      sortable: true,
      render: (row) => row.warehouseName || 'All Warehouses'
    },
    {
      key: 'turnoverRate',
      label: 'Turnover Rate',
      sortable: true,
      render: (row) => `<span class="badge badge-info">${this.formatPercent(row.turnoverRate)}</span>`
    },
    {
      key: 'fromDate',
      label: 'From',
      render: (row) => this.formatDate(row.fromDate)
    },
    {
      key: 'toDate',
      label: 'To',
      render: (row) => this.formatDate(row.toDate)
    }
  ];

  ngOnInit(): void {
    this.loadReport();
  }

  loadReport(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    this.reportApi.getInventoryTurnover(this.filters()).subscribe({
      next: (response) => {
        this.response.set(response);
        this.loading.set(false);
      },
      error: (error) => {
        this.errorMessage.set(
          this.getErrorMessage(error, 'Unable to load inventory turnover analytics.')
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
    this.exportReport('INVENTORY_TURNOVER', format, this.filters());
  }
}
