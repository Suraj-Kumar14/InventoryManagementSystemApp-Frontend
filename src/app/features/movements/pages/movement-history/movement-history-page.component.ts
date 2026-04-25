import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { MovementSummaryCardComponent } from '../../components/movement-summary-card/movement-summary-card.component';
import { MovementTimelineComponent } from '../../components/movement-timeline/movement-timeline.component';
import { StockMovement } from '../../models';
import { MovementApiService } from '../../services/movement-api.service';
import { buildMovementSummary, sortMovementsByDate } from '../../movement.utils';

@Component({
  selector: 'app-movement-history-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    EmptyStateComponent,
    MovementSummaryCardComponent,
    MovementTimelineComponent
  ],
  templateUrl: './movement-history-page.component.html',
  styleUrls: ['./movement-history-page.component.css']
})
export class MovementHistoryPageComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly movementApi = inject(MovementApiService);

  readonly movements = signal<StockMovement[]>([]);
  readonly loading = signal(false);
  readonly errorMessage = signal('');
  readonly hasLoaded = signal(false);
  readonly scopeLabel = signal('No history scope selected');
  readonly summary = computed(() => buildMovementSummary(this.movements()));
  readonly latestBalance = computed(() => {
    const ordered = sortMovementsByDate(this.movements(), 'asc');
    const latest = ordered.length > 0 ? ordered[ordered.length - 1] : null;

    return latest?.balanceAfter ?? 0;
  });

  readonly form = this.fb.nonNullable.group(
    {
      productId: [''],
      warehouseId: ['']
    },
    { validators: this.atLeastOneFilterValidator() }
  );

  ngOnInit(): void {
    const productId = this.route.snapshot.queryParamMap.get('productId') ?? '';
    const warehouseId = this.route.snapshot.queryParamMap.get('warehouseId') ?? '';

    if (productId || warehouseId) {
      this.form.patchValue({
        productId,
        warehouseId
      });
      this.submit();
    }
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const productId = this.toNullableNumber(value.productId);
    const warehouseId = this.toNullableNumber(value.warehouseId);
    const parts: string[] = [];

    if (productId != null) {
      parts.push(`Product ${productId}`);
    }

    if (warehouseId != null) {
      parts.push(`Warehouse ${warehouseId}`);
    }

    this.loading.set(true);
    this.errorMessage.set('');
    this.hasLoaded.set(true);
    this.scopeLabel.set(parts.length > 0 ? parts.join(' / ') : 'No history scope selected');

    this.movementApi.getMovementHistory(productId, warehouseId).subscribe({
      next: (movements) => {
        this.movements.set(movements);
        this.loading.set(false);
      },
      error: (error) => {
        this.loading.set(false);
        this.movements.set([]);
        this.errorMessage.set(error.error?.message ?? 'Unable to load movement history.');
      }
    });
  }

  reset(): void {
    this.form.reset(
      {
        productId: '',
        warehouseId: ''
      },
      { emitEvent: false }
    );
    this.movements.set([]);
    this.errorMessage.set('');
    this.hasLoaded.set(false);
    this.scopeLabel.set('No history scope selected');
  }

  viewAllMovements(): void {
    const value = this.form.getRawValue();

    this.router.navigate(['/movements/search'], {
      queryParams: {
        productId: value.productId.trim() || null,
        warehouseId: value.warehouseId.trim() || null
      }
    });
  }

  retry(): void {
    this.submit();
  }

  private atLeastOneFilterValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const productId = String(control.get('productId')?.value ?? '').trim();
      const warehouseId = String(control.get('warehouseId')?.value ?? '').trim();

      return productId || warehouseId ? null : { missingCriteria: true };
    };
  }

  private toNullableNumber(value: string): number | null {
    const trimmed = value.trim();

    if (!trimmed) {
      return null;
    }

    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  }
}
