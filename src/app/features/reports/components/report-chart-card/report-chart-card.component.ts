import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { ChartCardItem } from '../../models';
import { formatCurrency, formatNumber } from '../../report.utils';

@Component({
  selector: 'app-report-chart-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="chart-card">
      <div class="chart-card__header">
        <div>
          <div class="chart-card__title">{{ title }}</div>
          @if (subtitle) {
            <div class="chart-card__subtitle">{{ subtitle }}</div>
          }
        </div>
      </div>

      @if (!items.length) {
        <div class="chart-card__empty">No chart data is available yet.</div>
      } @else {
        <div class="chart-card__list">
          @for (item of items; track item.label) {
            <div class="chart-card__row">
              <div class="chart-card__meta">
                <div class="chart-card__label">{{ item.label }}</div>
                @if (item.secondary) {
                  <div class="chart-card__secondary">{{ item.secondary }}</div>
                }
              </div>

              <div class="chart-card__value">{{ formatItemValue(item.value) }}</div>
              <div class="chart-card__bar">
                <div
                  class="chart-card__fill"
                  [class]="'chart-card__fill tone-' + (item.tone || 'primary')"
                  [style.width.%]="getFillWidth(item.value)"
                ></div>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [
    `
      .chart-card {
        padding: 1.25rem;
        border-radius: var(--radius-lg);
        border: 1px solid var(--border-color);
        background: var(--surface-card);
        box-shadow: var(--shadow-card);
      }

      .chart-card__header {
        margin-bottom: 1rem;
      }

      .chart-card__title {
        font-size: 1rem;
        font-weight: 600;
        color: var(--text-primary);
      }

      .chart-card__subtitle {
        margin-top: 0.25rem;
        font-size: 0.8125rem;
        color: var(--text-secondary);
      }

      .chart-card__list {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }

      .chart-card__row {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        gap: 0.75rem 1rem;
      }

      .chart-card__meta {
        min-width: 0;
      }

      .chart-card__label {
        font-weight: 600;
        color: var(--text-primary);
      }

      .chart-card__secondary {
        margin-top: 0.1875rem;
        font-size: 0.75rem;
        color: var(--text-secondary);
      }

      .chart-card__value {
        font-weight: 600;
        color: var(--text-primary);
        white-space: nowrap;
      }

      .chart-card__bar {
        grid-column: 1 / -1;
        height: 0.5rem;
        border-radius: var(--radius-full);
        background: var(--gray-100);
        overflow: hidden;
      }

      .chart-card__fill {
        height: 100%;
        border-radius: inherit;
      }

      .chart-card__fill.tone-primary {
        background: linear-gradient(90deg, var(--color-primary), var(--color-primary-dark));
      }

      .chart-card__fill.tone-success {
        background: linear-gradient(90deg, var(--color-success), var(--color-success-dark));
      }

      .chart-card__fill.tone-warning {
        background: linear-gradient(90deg, var(--color-warning), var(--color-warning-dark));
      }

      .chart-card__fill.tone-danger {
        background: linear-gradient(90deg, var(--color-danger), var(--color-danger-dark));
      }

      .chart-card__fill.tone-info {
        background: linear-gradient(90deg, var(--color-info), #1d4ed8);
      }

      .chart-card__empty {
        padding: 1rem;
        border-radius: var(--radius-md);
        background: var(--gray-50);
        color: var(--text-secondary);
      }
    `
  ]
})
export class ReportChartCardComponent {
  @Input() title = '';
  @Input() subtitle = '';
  @Input() items: ChartCardItem[] = [];
  @Input() format: 'currency' | 'number' = 'number';

  get maxValue(): number {
    return Math.max(...this.items.map((item) => item.value), 0);
  }

  getFillWidth(value: number): number {
    if (!this.maxValue) {
      return 0;
    }

    return (value / this.maxValue) * 100;
  }

  formatItemValue(value: number): string {
    return this.format === 'currency' ? formatCurrency(value) : formatNumber(value);
  }
}
