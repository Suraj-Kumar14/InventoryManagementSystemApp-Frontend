import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { MovementFilterComponent } from '../../components/movement-filter/movement-filter.component';
import {
  MovementTableComponent,
  MovementTableSortChange
} from '../../components/movement-table/movement-table.component';
import { MovementSummaryCardComponent } from '../../components/movement-summary-card/movement-summary-card.component';
import { MovementSearchRequest, MovementType, StockMovement } from '../../models';
import { MovementApiService } from '../../services/movement-api.service';
import { buildMovementSummary } from '../../movement.utils';

@Component({
  selector: 'app-movement-search-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    EmptyStateComponent,
    MovementFilterComponent,
    MovementTableComponent,
    MovementSummaryCardComponent
  ],
  templateUrl: './movement-search-page.component.html',
  styleUrls: ['./movement-search-page.component.css']
})
export class MovementSearchPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly movementApi = inject(MovementApiService);

  readonly results = signal<StockMovement[]>([]);
  readonly totalElements = signal(0);
  readonly page = signal(0);
  readonly loading = signal(false);
  readonly errorMessage = signal('');
  readonly hasSearched = signal(false);
  readonly sortBy = signal('movementDate');
  readonly sortDirection = signal<'asc' | 'desc'>('desc');
  readonly filters = signal<MovementSearchRequest>({
    productId: null,
    warehouseId: null,
    movementType: '',
    referenceId: '',
    startDate: '',
    endDate: ''
  });
  readonly summary = computed(() => buildMovementSummary(this.results()));

  readonly pageSize = 20;

  ngOnInit(): void {
    const queryParams = this.route.snapshot.queryParamMap;
    const productId = queryParams.get('productId');
    const warehouseId = queryParams.get('warehouseId');
    const referenceId = queryParams.get('referenceId');
    const movementType = queryParams.get('movementType');
    const startDate = queryParams.get('startDate');
    const endDate = queryParams.get('endDate');

    if (productId || warehouseId || referenceId || movementType || startDate || endDate) {
      const initialFilters: MovementSearchRequest = {
        productId: productId ? Number(productId) : null,
        warehouseId: warehouseId ? Number(warehouseId) : null,
        movementType: this.toMovementTypeFilter(movementType),
        referenceId: referenceId ?? '',
        startDate: startDate ?? '',
        endDate: endDate ?? ''
      };

      this.filters.set(initialFilters);
      this.applyFilters(initialFilters);
    }
  }

  applyFilters(filters: MovementSearchRequest): void {
    this.filters.set(filters);
    this.page.set(0);
    this.runSearch();
  }

  changePage(page: number): void {
    this.page.set(page);
    this.runSearch();
  }

  changeSort(change: MovementTableSortChange): void {
    this.sortBy.set(change.sortBy);
    this.sortDirection.set(change.sortDirection);
    this.page.set(0);
    this.runSearch();
  }

  viewMovement(movement: StockMovement): void {
    this.router.navigate(['/movements', movement.movementId], {
      state: { movement }
    });
  }

  retry(): void {
    this.runSearch();
  }

  private runSearch(): void {
    this.loading.set(true);
    this.errorMessage.set('');
    this.hasSearched.set(true);

    this.movementApi
      .searchMovements({
        ...this.filters(),
        page: this.page(),
        size: this.pageSize,
        sortBy: this.sortBy(),
        sortDirection: this.sortDirection()
      })
      .subscribe({
        next: (response) => {
          this.results.set(response.content);
          this.totalElements.set(response.totalElements);
          this.loading.set(false);
        },
        error: (error) => {
          this.loading.set(false);
          this.results.set([]);
          this.totalElements.set(0);
          this.errorMessage.set(error.error?.message ?? 'Advanced movement search failed.');
        }
      });
  }

  private toMovementTypeFilter(value: string | null): MovementType | '' {
    if (!value) {
      return '';
    }

    const normalized = value.trim().toUpperCase().replace(/[\s-]+/g, '_');

    switch (normalized) {
      case 'STOCK_IN':
      case 'STOCK_OUT':
      case 'TRANSFER_IN':
      case 'TRANSFER_OUT':
      case 'ADJUSTMENT':
      case 'WRITE_OFF':
      case 'RETURN':
        return normalized;
      default:
        return '';
    }
  }
}
