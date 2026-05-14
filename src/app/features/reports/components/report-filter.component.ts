import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ReportFilter, ReportPeriod } from '../../../core/http/backend.models';

@Component({
  selector: 'app-report-filter',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <form class="filters" [formGroup]="form" (ngSubmit)="apply()">
      <label>
        <span>Period</span>
        <select formControlName="period">
          <option *ngFor="let period of periods" [value]="period">{{ period.replaceAll('_', ' ') }}</option>
        </select>
      </label>
      <label>
        <span>From</span>
        <input type="date" formControlName="fromDate" />
      </label>
      <label>
        <span>To</span>
        <input type="date" formControlName="toDate" />
      </label>
      <label *ngIf="showWarehouse">
        <span>Warehouse ID</span>
        <input type="number" formControlName="warehouseId" />
      </label>
      <label *ngIf="showProduct">
        <span>Product ID</span>
        <input type="number" formControlName="productId" />
      </label>
      <label *ngIf="showSupplier">
        <span>Supplier ID</span>
        <input type="number" formControlName="supplierId" />
      </label>
      <label *ngIf="showThreshold">
        <span>Slow Mover Threshold</span>
        <input type="number" formControlName="threshold" min="1" />
      </label>
      <label *ngIf="showDeadStockDays">
        <span>Dead Stock Days</span>
        <input type="number" formControlName="deadStockDays" min="1" />
      </label>
      <div class="actions">
        <button type="submit" [disabled]="loading">{{ loading ? 'Applying...' : 'Apply Filters' }}</button>
        <button type="button" class="secondary" [disabled]="loading" (click)="reset()">Reset</button>
      </div>
    </form>
  `,
  styles: [
    `
      .filters {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 0.9rem;
        padding: 1rem;
        border-radius: 24px;
        background: rgba(255, 255, 255, 0.82);
        backdrop-filter: blur(12px);
        border: 1px solid rgba(148, 163, 184, 0.16);
      }
      label {
        display: flex;
        flex-direction: column;
        gap: 0.4rem;
      }
      span {
        font-size: 0.76rem;
        font-weight: 700;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: #64748b;
      }
      input,
      select,
      button {
        border-radius: 14px;
        border: 1px solid #cbd5e1;
        padding: 0.75rem 0.9rem;
        font: inherit;
      }
      .actions {
        display: flex;
        align-items: end;
        gap: 0.65rem;
      }
      button {
        border: none;
        background: #0f172a;
        color: #fff;
        font-weight: 600;
        cursor: pointer;
      }
      .secondary {
        background: #e2e8f0;
        color: #0f172a;
      }
    `,
  ],
})
export class ReportFilterComponent implements OnChanges {
  private readonly fb = inject(FormBuilder);

  @Input() loading = false;
  @Input() showWarehouse = true;
  @Input() showProduct = true;
  @Input() showSupplier = false;
  @Input() showThreshold = false;
  @Input() showDeadStockDays = false;
  @Input() threshold = 5;
  @Input() deadStockDays = 90;
  @Input() initialFilters: ReportFilter | null = null;
  @Output() filtersChange = new EventEmitter<ReportFilter>();
  @Output() thresholdChange = new EventEmitter<number>();
  @Output() deadStockDaysChange = new EventEmitter<number>();

  readonly periods: ReportPeriod[] = ['LAST_7_DAYS', 'LAST_30_DAYS', 'THIS_MONTH', 'LAST_MONTH', 'CUSTOM', 'TODAY'];
  readonly form = this.fb.group({
    period: this.fb.control<ReportPeriod>('LAST_30_DAYS'),
    fromDate: this.fb.control<string | null>(null),
    toDate: this.fb.control<string | null>(null),
    warehouseId: this.fb.control<number | null>(null),
    productId: this.fb.control<number | null>(null),
    supplierId: this.fb.control<number | null>(null),
    threshold: this.fb.control<number>(5),
    deadStockDays: this.fb.control<number>(90),
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['initialFilters'] && this.initialFilters) {
      this.form.patchValue(
        {
          period: this.initialFilters.period ?? 'LAST_30_DAYS',
          fromDate: this.initialFilters.fromDate ?? null,
          toDate: this.initialFilters.toDate ?? null,
          warehouseId: this.initialFilters.warehouseId ?? null,
          productId: this.initialFilters.productId ?? null,
          supplierId: this.initialFilters.supplierId ?? null,
          threshold: this.threshold,
          deadStockDays: this.deadStockDays,
        },
        { emitEvent: false }
      );
    }
  }

  apply(): void {
    const value = this.form.getRawValue();
    this.filtersChange.emit({
      period: value.period ?? 'LAST_30_DAYS',
      fromDate: value.fromDate ?? undefined,
      toDate: value.toDate ?? undefined,
      warehouseId: value.warehouseId ?? undefined,
      productId: value.productId ?? undefined,
      supplierId: value.supplierId ?? undefined,
      page: 0,
      size: 20,
    });
    this.thresholdChange.emit(Math.max(1, value.threshold ?? 5));
    this.deadStockDaysChange.emit(Math.max(1, value.deadStockDays ?? 90));
  }

  reset(): void {
    this.form.reset({
      period: 'LAST_30_DAYS',
      fromDate: null,
      toDate: null,
      warehouseId: null,
      productId: null,
      supplierId: null,
      threshold: this.threshold,
      deadStockDays: this.deadStockDays,
    });
    this.apply();
  }
}
