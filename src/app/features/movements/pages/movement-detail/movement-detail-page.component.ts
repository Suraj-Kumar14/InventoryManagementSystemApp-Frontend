import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { MovementSummaryCardComponent } from '../../components/movement-summary-card/movement-summary-card.component';
import { StockMovement } from '../../models';
import { MovementApiService } from '../../services/movement-api.service';
import {
  formatMovementType,
  formatSignedMovementQuantity,
  getMovementBadgeClass,
} from '../../movement.utils';

@Component({
  selector: 'app-movement-detail-page',
  standalone: true,
  imports: [CommonModule, RouterLink, EmptyStateComponent, MovementSummaryCardComponent],
  templateUrl: './movement-detail-page.component.html',
  styleUrls: ['./movement-detail-page.component.css']
})
export class MovementDetailPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly movementApi = inject(MovementApiService);

  readonly movement = signal<StockMovement | null>(null);
  readonly loading = signal(true);
  readonly errorMessage = signal('');
  readonly getMovementBadgeClass = getMovementBadgeClass;
  readonly movementTypeLabel = computed(() =>
    this.movement() ? formatMovementType(this.movement()!.movementType) : '--'
  );
  readonly quantityLabel = computed(() => {
    const movement = this.movement();

    if (!movement) {
      return '--';
    }

    return formatSignedMovementQuantity(movement);
  });

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    if (!id) {
      this.loading.set(false);
      this.errorMessage.set('A valid movement ID is required to view details.');
      return;
    }

    const movementFromState = this.readMovementFromNavigationState(id);

    if (movementFromState) {
      this.movement.set(movementFromState);
    }

    this.loadMovement(id);
  }

  goBack(): void {
    this.router.navigate(['/movements']);
  }

  retry(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    if (id) {
      this.loadMovement(id);
    }
  }

  private loadMovement(id: number): void {
    this.loading.set(true);
    this.errorMessage.set('');

    this.movementApi.getMovementById(id).subscribe({
      next: (movement) => {
        this.movement.set(movement);
        this.loading.set(false);
      },
      error: (error) => {
        this.loading.set(false);

        if (this.movement()) {
          return;
        }

        this.errorMessage.set(error.error?.message ?? 'Unable to load movement details.');
      }
    });
  }

  private readMovementFromNavigationState(id: number): StockMovement | null {
    const historyState = window.history.state as { movement?: StockMovement } | null;
    const movement = historyState?.movement ?? null;

    return movement?.movementId === id ? movement : null;
  }
}
