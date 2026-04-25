import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { MovementSummaryCardComponent } from '../../components/movement-summary-card/movement-summary-card.component';
import { StockInOutSummary } from '../../models';
import { MovementApiService } from '../../services/movement-api.service';
import { buildStockInOutSummary } from '../../movement.utils';

@Component({
  selector: 'app-stock-in-out-summary-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, EmptyStateComponent, MovementSummaryCardComponent],
  templateUrl: './stock-in-out-summary-page.component.html',
  styleUrls: ['./stock-in-out-summary-page.component.css']
})
export class StockInOutSummaryPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly movementApi = inject(MovementApiService);

  readonly summary = signal<StockInOutSummary | null>(null);
  readonly loading = signal(false);
  readonly errorMessage = signal('');
  readonly hasLoaded = signal(false);
  readonly form = this.fb.nonNullable.group({
    productId: ['', Validators.required]
  });

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const productId = Number(this.form.getRawValue().productId);

    this.loading.set(true);
    this.errorMessage.set('');
    this.hasLoaded.set(true);

    forkJoin({
      stockIn: this.movementApi.getStockIn(productId),
      stockOut: this.movementApi.getStockOut(productId),
      movements: this.movementApi.getByProduct(productId)
    }).subscribe({
      next: ({ stockIn, stockOut, movements }) => {
        this.summary.set(buildStockInOutSummary(productId, movements, stockIn, stockOut));
        this.loading.set(false);
      },
      error: (error) => {
        this.loading.set(false);
        this.summary.set(null);
        this.errorMessage.set(error.error?.message ?? 'Unable to load stock in / stock out totals.');
      }
    });
  }

  reset(): void {
    this.form.reset(
      {
        productId: ''
      },
      { emitEvent: false }
    );
    this.summary.set(null);
    this.errorMessage.set('');
    this.hasLoaded.set(false);
  }

  retry(): void {
    this.submit();
  }
}
