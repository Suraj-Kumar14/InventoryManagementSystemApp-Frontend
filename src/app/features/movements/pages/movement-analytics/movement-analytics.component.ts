import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { MovementAnalyticsResponse, MovementSummaryResponse } from '../../../../core/http/backend.models';
import { MovementSummaryCardsComponent } from '../../components/movement-summary-cards/movement-summary-cards.component';
import { MovementApiService } from '../../services/movement-api.service';

@Component({
  selector: 'app-movement-analytics',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MovementSummaryCardsComponent],
  template: `
    <section class="page">
      <header>
        <p class="eyebrow">Movement Analytics</p>
        <h1>Audit volume and exception signals</h1>
      </header>

      <form class="filters" [formGroup]="filtersForm" (ngSubmit)="loadAnalytics()">
        <input type="date" formControlName="fromDate" />
        <input type="date" formControlName="toDate" />
        <button type="submit" [disabled]="loading">{{ loading ? 'Applying...' : 'Apply Range' }}</button>
      </form>

      <app-movement-summary-cards [summary]="summary"></app-movement-summary-cards>

      <div class="grid" *ngIf="analytics as data">
        <article class="card">
          <h2>Movement Count By Type</h2>
          <div class="stack">
            <div class="kv" *ngFor="let entry of entries(data.movementCountByType)"><span>{{ entry.key }}</span><strong>{{ entry.value }}</strong></div>
          </div>
        </article>
        <article class="card">
          <h2>Warehouse Activity</h2>
          <div class="stack">
            <div class="kv" *ngFor="let entry of entries(data.movementCountByWarehouse)"><span>{{ entry.key }}</span><strong>{{ entry.value }}</strong></div>
          </div>
        </article>
        <article class="card wide">
          <h2>Top Moved Products</h2>
          <div class="kv" *ngFor="let product of data.topMovedProducts">
            <span>{{ product.productName }}</span>
            <strong>{{ product.quantity | number:'1.0-2' }} units</strong>
          </div>
        </article>
        <article class="card wide">
          <h2>Highest Value Movements</h2>
          <div class="kv" *ngFor="let movement of data.highestValueMovements">
            <span>{{ movement.movementNumber }} · {{ movement.productName || ('Product #' + movement.productId) }}</span>
            <strong>{{ movement.totalValue | currency:'INR':'symbol':'1.0-0' }}</strong>
          </div>
        </article>
      </div>
    </section>
  `,
  styles: [`
    .page, .grid { display:grid; gap:1rem; }
    .filters, .card { background:#fff; border:1px solid #e5eaf3; border-radius:22px; padding:1rem; }
    .filters { display:flex; gap:0.75rem; align-items:center; flex-wrap:wrap; }
    .eyebrow { text-transform:uppercase; letter-spacing:0.12em; font-size:0.75rem; color:#c2410c; font-weight:700; margin:0; }
    h1, h2 { margin:0.35rem 0 0.75rem; color:#0f172a; }
    input, button { border-radius:14px; padding:0.8rem 0.9rem; border:1px solid #d9e1ee; font:inherit; }
    button { background:#0f172a; color:#fff; border:0; font-weight:700; }
    .grid { grid-template-columns:repeat(2, minmax(0, 1fr)); }
    .wide { grid-column:1 / -1; }
    .kv { display:flex; justify-content:space-between; gap:1rem; padding:0.6rem 0; border-bottom:1px solid #eef2f7; }
    .kv:last-child { border-bottom:0; }
    @media (max-width: 800px) { .grid { grid-template-columns:1fr; } }
  `],
})
export class MovementAnalyticsComponent implements OnInit {
  private readonly movementApi = inject(MovementApiService);
  private readonly fb = inject(FormBuilder);

  readonly filtersForm = this.fb.group({
    fromDate: this.fb.control(''),
    toDate: this.fb.control(''),
  });

  summary: MovementSummaryResponse | null = null;
  analytics: MovementAnalyticsResponse | null = null;
  loading = false;

  ngOnInit(): void {
    this.loadAnalytics();
  }

  loadAnalytics(): void {
    const { fromDate, toDate } = this.filtersForm.getRawValue();
    this.loading = true;
    this.movementApi.getMovementSummary(fromDate || undefined, toDate || undefined).pipe(finalize(() => (this.loading = false))).subscribe({
      next: (summary) => (this.summary = summary),
      error: () => (this.summary = null),
    });
    this.movementApi.getMovementAnalytics(fromDate || undefined, toDate || undefined).subscribe({
      next: (analytics) => (this.analytics = analytics),
      error: () => (this.analytics = null),
    });
  }

  entries(record: Record<string, number>): Array<{ key: string; value: number }> {
    return Object.entries(record || {}).map(([key, value]) => ({ key, value }));
  }
}
