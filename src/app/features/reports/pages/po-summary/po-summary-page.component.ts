import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, signal } from '@angular/core';
import { TableColumn } from '../../../../shared/components/data-table/data-table.component';
import { ReportExportActionsComponent } from '../../components/report-export-actions/report-export-actions.component';
import { ReportFilterComponent } from '../../components/report-filter/report-filter.component';
import { ReportKpiCardComponent } from '../../components/report-kpi-card/report-kpi-card.component';
import { ReportTableComponent } from '../../components/report-table/report-table.component';
import {
  PagedResponse,
  PurchaseOrderSummaryResponse,
  ReportFilterRequest,
  ReportFormat
} from '../../models';
import { buildDefaultDateRange, sumBy } from '../../report.utils';
import { ReportPageBase } from '../report-page.base';

@Component({
  selector: 'app-po-summary-page',
  standalone: true,
  imports: [
    CommonModule,
    ReportExportActionsComponent,
    ReportFilterComponent,
    ReportKpiCardComponent,
    ReportTableComponent
  ],
  templateUrl: './po-summary-page.component.html',
  styleUrls: ['./po-summary-page.component.css']
})
export class PoSummaryPageComponent extends ReportPageBase implements OnInit {
  readonly filters = signal<ReportFilterRequest>({
    ...buildDefaultDateRange(30),
    page: 0,
    size: 10,
    sortBy: 'totalSpend',
    sortDir: 'desc'
  });
  readonly loading = signal(true);
  readonly errorMessage = signal('');
  readonly response = signal<PagedResponse<PurchaseOrderSummaryResponse>>({
    content: [],
    page: 0,
    size: 10,
    totalElements: 0,
    totalPages: 1,
    first: true,
    last: true
  });

  readonly totalPOs = computed(() => sumBy(this.response().content, (row) => row.totalPOs));
  readonly totalSpend = computed(() => sumBy(this.response().content, (row) => row.totalSpend));
  readonly topSupplier = computed(
    () =>
      [...this.response().content].sort((left, right) => right.totalSpend - left.totalSpend)[0] ??
      null
  );

  readonly columns: TableColumn<PurchaseOrderSummaryResponse>[] = [
    {
      key: 'supplierName',
      label: 'Supplier',
      sortable: true,
      render: (row) => row.supplierName || `Supplier #${row.supplierId}`
    },
    {
      key: 'warehouseName',
      label: 'Warehouse',
      sortable: true,
      render: (row) => row.warehouseName || `Warehouse #${row.warehouseId}`
    },
    {
      key: 'totalPOs',
      label: 'Total POs',
      sortable: true,
      render: (row) => this.formatNumber(row.totalPOs)
    },
    {
      key: 'totalSpend',
      label: 'Total Spend',
      sortable: true,
      render: (row) => this.formatCurrency(row.totalSpend)
    },
    {
      key: 'period',
      label: 'Period',
      render: (row) => `${this.formatDate(row.fromDate)} to ${this.formatDate(row.toDate)}`
    }
  ];

  ngOnInit(): void {
    this.loadReport();
  }

  loadReport(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    this.reportApi.getPOSummary(this.filters()).subscribe({
      next: (response) => {
        this.response.set(response);
        this.loading.set(false);
      },
      error: (error) => {
        this.errorMessage.set(
          this.getErrorMessage(error, 'Unable to load the purchase order summary report.')
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
    this.exportReport('PURCHASE_ORDER_SUMMARY', format, this.filters());
  }
}
