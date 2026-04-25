import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { StockMovement } from '../../models';
import {
  formatMovementType,
  formatSignedMovementQuantity,
  getMovementBadgeClass,
  getSignedMovementQuantityClass,
  sortMovementsByDate
} from '../../movement.utils';

@Component({
  selector: 'app-movement-timeline',
  standalone: true,
  imports: [CommonModule, EmptyStateComponent],
  templateUrl: './movement-timeline.component.html',
  styleUrls: ['./movement-timeline.component.css']
})
export class MovementTimelineComponent {
  @Input() movements: StockMovement[] = [];
  @Input() loading = false;
  @Input() emptyTitle = 'No movement history found';
  @Input() emptyDescription = 'Adjust the product or warehouse filters to load a timeline.';
  readonly formatMovementType = formatMovementType;
  readonly formatSignedMovementQuantity = formatSignedMovementQuantity;
  readonly getMovementBadgeClass = getMovementBadgeClass;
  readonly getSignedMovementQuantityClass = getSignedMovementQuantityClass;

  get orderedMovements(): StockMovement[] {
    return sortMovementsByDate(this.movements, 'asc');
  }
}
