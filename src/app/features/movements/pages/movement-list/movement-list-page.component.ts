import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { roleMatches } from '../../../../core/constants/roles';
import { AuthService } from '../../../../core/services/auth.service';
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
  selector: 'app-movement-list-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    EmptyStateComponent,
    MovementFilterComponent,
    MovementTableComponent,
    MovementSummaryCardComponent
  ],
  templateUrl: './movement-list-page.component.html',
  styleUrls: ['./movement-list-page.component.css']
})
export class MovementListPageComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly movementApi = inject(MovementApiService);

  readonly movements = signal<StockMovement[]>([]);
  readonly totalElements = signal(0);
  readonly page = signal(0);
  readonly loading = signal(true);
  readonly errorMessage = signal('');
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

  readonly pageSize = 20;
  readonly isPurchaseOfficer = computed(() =>
    roleMatches(this.auth.currentUser()?.role, 'PURCHASE_OFFICER')
  );
  readonly canAccessAuditTools = computed(() => {
    const role = this.auth.currentUser()?.role;

    return (
      roleMatches(role, 'ADMIN') ||
      roleMatches(role, 'INVENTORY_MANAGER') ||
      roleMatches(role, 'WAREHOUSE_STAFF')
    );
  });
  readonly lockedMovementType = computed<MovementType | null>(() =>
    this.isPurchaseOfficer() ? 'STOCK_IN' : null
  );
  readonly summary = computed(() => buildMovementSummary(this.movements()));
  readonly latestMovementLabel = computed(() => {
    const latestMovementDate = this.summary().latestMovementDate;

    if (!latestMovementDate) {
      return '--';
    }

    const parsed = new Date(latestMovementDate);
    return Number.isNaN(parsed.getTime()) ? latestMovementDate : parsed.toLocaleString();
  });

  ngOnInit(): void {
    if (this.lockedMovementType()) {
      this.filters.update((filters) => ({
        ...filters,
        movementType: this.lockedMovementType() ?? ''
      }));
    }

    this.loadMovements();
  }

  applyFilters(filters: MovementSearchRequest): void {
    this.filters.set({
      ...filters,
      movementType: this.lockedMovementType() ?? filters.movementType ?? ''
    });
    this.page.set(0);
    this.loadMovements();
  }

  changePage(page: number): void {
    this.page.set(page);
    this.loadMovements();
  }

  changeSort(change: MovementTableSortChange): void {
    this.sortBy.set(change.sortBy);
    this.sortDirection.set(change.sortDirection);
    this.page.set(0);
    this.loadMovements();
  }

  viewMovement(movement: StockMovement): void {
    this.router.navigate(['/movements', movement.movementId], {
      state: { movement }
    });
  }

  retry(): void {
    this.loadMovements();
  }

  private loadMovements(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    this.movementApi
      .getAllMovements({
        ...this.filters(),
        movementType: this.lockedMovementType() ?? this.filters().movementType ?? '',
        page: this.page(),
        size: this.pageSize,
        sortBy: this.sortBy(),
        sortDirection: this.sortDirection()
      })
      .subscribe({
        next: (response) => {
          this.movements.set(response.content);
          this.totalElements.set(response.totalElements);
          this.loading.set(false);
        },
        error: (error) => {
          this.loading.set(false);
          this.movements.set([]);
          this.totalElements.set(0);
          this.errorMessage.set(
            error.error?.message ?? 'Unable to load movement records right now.'
          );
        }
      });
  }
}
