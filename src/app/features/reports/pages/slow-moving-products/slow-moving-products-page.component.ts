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
  SlowMovingProductResponse
} from '../../models';
import { buildDefaultDateRange } from '../../report.utils';
import { ReportPageBase } from '../report-page.base';

@Component({
  selector: 'app-slow-moving-products-page',
  standalone: true,
  imports: [
    CommonModule,
    ReportExportActionsComponent,
    ReportFilterComponent,
    ReportKpiCardComponent,
    ReportTableComponent
  ],
  templateUrl: './slow-moving-products-page.component.html',
  styleUrls: ['./slow-moving-products-page.component.css']
})
export class SlowMovingProductsPageComponent extends ReportPageBase implements OnInit {
  readonly filters = signal<ReportFilterRequest>({
    ...buildDefaultDateRange(90),
    page: 0,
    size: 10,
    sortBy: 'totalMovementQuantity',
    sortDir: 'asc'
  });
  readonly loading = signal(true);
  readonly errorMessage = signal('');
  readonly response = signal<PagedResponse<SlowMovingProductResponse>>({
    content: [],
    page: 0,
    size: 10,
    totalElements: 0,
    totalPages: 1,
    first: true,
    last: true
  });

  readonly slowestProduct = computed(() => this.response().content[0] ?? null);

  readonly columns: TableColumn<SlowMovingProductResponse>[] = [
    { key: 'productName', label: 'Product', sortable: true },
    {
      key: 'totalMovementQuantity',
      label: 'Movement Quantity',
      sortable: true,
      render: (row) => this.formatNumber(row.totalMovementQuantity)
    },
    {
      key: 'lastMovementDate',
      label: 'Last Movement',
      sortable: true,
      render: (row) => this.formatDate(row.lastMovementDate)
    }
  ];

  ngOnInit(): void {
    this.loadReport();
  }

  loadReport(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    this.reportApi.getSlowMovingProducts(this.filters()).subscribe({
      next: (response) => {
        this.response.set(response);
        this.loading.set(false);
      },
      error: (error) => {
        this.errorMessage.set(
          this.getErrorMessage(error, 'Unable to load the slow moving products report.')
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
    this.exportReport('SLOW_MOVING_PRODUCTS', format, this.filters());
  }
}
