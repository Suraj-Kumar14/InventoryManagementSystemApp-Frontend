import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { StockMovement } from '../../models';
import {
  formatMovementType,
  formatSignedMovementQuantity,
  getMovementBadgeClass,
  getSignedMovementQuantityClass
} from '../../movement.utils';

export interface MovementTableSortChange {
  sortBy: string;
  sortDirection: 'asc' | 'desc';
}

@Component({
  selector: 'app-movement-table',
  standalone: true,
  imports: [CommonModule, EmptyStateComponent],
  templateUrl: './movement-table.component.html',
  styleUrls: ['./movement-table.component.css']
})
export class MovementTableComponent {
  @Input() movements: StockMovement[] = [];
  @Input() loading = false;
  @Input() page = 0;
  @Input() pageSize = 20;
  @Input() totalElements = 0;
  @Input() sortBy = 'movementDate';
  @Input() sortDirection: 'asc' | 'desc' = 'desc';
  @Input() title = 'Movement History';
  @Input() subtitle = 'Immutable inventory audit entries ready for review and export.';
  @Input() emptyTitle = 'No movements found';
  @Input() emptyDescription = 'Try changing the filters or broaden the date range.';
  @Input() showPagination = true;
  @Input() showActions = true;

  @Output() pageChange = new EventEmitter<number>();
  @Output() sortChange = new EventEmitter<MovementTableSortChange>();
  @Output() view = new EventEmitter<StockMovement>();

  readonly sortableColumns = ['movementId', 'movementDate', 'quantity', 'balanceAfter'];
  readonly formatMovementType = formatMovementType;
  readonly formatSignedMovementQuantity = formatSignedMovementQuantity;
  readonly getMovementBadgeClass = getMovementBadgeClass;
  readonly getSignedMovementQuantityClass = getSignedMovementQuantityClass;

  get totalPages(): number {
    return Math.max(Math.ceil(this.totalElements / Math.max(this.pageSize, 1)), 1);
  }

  get startIndex(): number {
    return this.totalElements === 0 ? 0 : this.page * this.pageSize + 1;
  }

  get endIndex(): number {
    return Math.min((this.page + 1) * this.pageSize, this.totalElements);
  }

  get pageNumbers(): number[] {
    const pages: number[] = [];
    const start = Math.max(0, this.page - 1);
    const end = Math.min(this.totalPages - 1, this.page + 1);

    for (let index = start; index <= end; index += 1) {
      pages.push(index);
    }

    return pages;
  }

  isSortable(column: string): boolean {
    return this.sortableColumns.includes(column);
  }

  toggleSort(column: string): void {
    if (!this.isSortable(column)) {
      return;
    }

    const nextDirection =
      this.sortBy === column && this.sortDirection === 'asc' ? 'desc' : 'asc';

    this.sortChange.emit({ sortBy: column, sortDirection: nextDirection });
  }

  sortState(column: string): string {
    if (this.sortBy !== column) {
      return 'SORT';
    }

    return this.sortDirection === 'asc' ? 'ASC' : 'DESC';
  }

  goToPage(page: number): void {
    if (page < 0 || page >= this.totalPages || page === this.page) {
      return;
    }

    this.pageChange.emit(page);
  }
}
