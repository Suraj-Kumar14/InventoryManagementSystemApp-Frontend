import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { NotificationService } from '../../../../core/services/notification.service';
import { MovementApiService } from '../../services/movement-api.service';

@Component({
  selector: 'app-movement-export',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section class="page">
      <header>
        <p class="eyebrow">Movement Export</p>
        <h1>Export filtered movement history</h1>
      </header>
      <form class="filters" [formGroup]="form" (ngSubmit)="exportCsv()">
        <input formControlName="keyword" placeholder="Keyword" />
        <input formControlName="productId" type="number" min="1" placeholder="Product ID" />
        <input formControlName="warehouseId" type="number" min="1" placeholder="Warehouse ID" />
        <input formControlName="fromDate" type="date" />
        <input formControlName="toDate" type="date" />
        <button type="submit" [disabled]="loading">{{ loading ? 'Exporting...' : 'Export CSV' }}</button>
      </form>
    </section>
  `,
  styles: [`
    .page { display:grid; gap:1rem; }
    .filters { background:#fff; border:1px solid #e5eaf3; border-radius:24px; padding:1rem; display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:0.85rem; }
    .eyebrow { text-transform:uppercase; letter-spacing:0.12em; color:#c2410c; font-size:0.75rem; font-weight:700; margin:0; }
    input, button { border-radius:14px; padding:0.85rem 0.9rem; border:1px solid #d9e1ee; font:inherit; }
    button { background:#0f172a; color:#fff; border:0; font-weight:700; }
  `],
})
export class MovementExportComponent {
  private readonly fb = inject(FormBuilder);
  private readonly movementApi = inject(MovementApiService);
  private readonly notification = inject(NotificationService);

  readonly form = this.fb.group({
    keyword: this.fb.control(''),
    productId: this.fb.control<number | null>(null),
    warehouseId: this.fb.control<number | null>(null),
    fromDate: this.fb.control(''),
    toDate: this.fb.control(''),
  });

  loading = false;

  exportCsv(): void {
    const raw = this.form.getRawValue();
    this.loading = true;
    this.movementApi.exportCsv({
      keyword: raw.keyword || undefined,
      productId: raw.productId ?? undefined,
      warehouseId: raw.warehouseId ?? undefined,
      fromDate: raw.fromDate ? `${raw.fromDate}T00:00:00` : undefined,
      toDate: raw.toDate ? `${raw.toDate}T23:59:59` : undefined,
      sortBy: 'movementDate',
      sortDir: 'desc',
    }).pipe(finalize(() => (this.loading = false))).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = 'movements-export.csv';
        anchor.click();
        window.URL.revokeObjectURL(url);
        this.notification.success('Movement history exported successfully');
      },
      error: () => this.notification.error('Unable to export movements'),
    });
  }
}
