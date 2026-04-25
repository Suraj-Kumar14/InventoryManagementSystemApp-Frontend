import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-report-kpi-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="report-kpi-card" [class]="'report-kpi-card tone-' + tone">
      <div class="report-kpi-card__header">
        <div>
          <div class="report-kpi-card__title">{{ title }}</div>
          @if (subtitle) {
            <div class="report-kpi-card__subtitle">{{ subtitle }}</div>
          }
        </div>

        @if (icon) {
          <div class="report-kpi-card__icon">{{ icon }}</div>
        }
      </div>

      <div class="report-kpi-card__value">{{ value }}</div>
    </div>
  `,
  styles: [
    `
      .report-kpi-card {
        padding: 1.25rem;
        border-radius: var(--radius-lg);
        border: 1px solid var(--border-color);
        background: linear-gradient(180deg, #fff, var(--gray-50));
        box-shadow: var(--shadow-card);
      }

      .report-kpi-card__header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 1rem;
      }

      .report-kpi-card__title {
        font-size: 0.8125rem;
        font-weight: 600;
        color: var(--text-secondary);
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }

      .report-kpi-card__subtitle {
        margin-top: 0.25rem;
        font-size: 0.8125rem;
        color: var(--text-muted);
      }

      .report-kpi-card__icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-width: 2.5rem;
        height: 2.5rem;
        padding: 0 0.625rem;
        border-radius: var(--radius-md);
        font-size: 0.75rem;
        font-weight: 700;
        letter-spacing: 0.04em;
      }

      .report-kpi-card__value {
        margin-top: 1rem;
        font-size: 1.75rem;
        font-weight: 700;
        color: var(--text-primary);
        line-height: 1.1;
      }

      .tone-primary .report-kpi-card__icon {
        background: var(--color-primary-light);
        color: var(--color-primary-dark);
      }

      .tone-success .report-kpi-card__icon {
        background: var(--color-success-light);
        color: var(--color-success-dark);
      }

      .tone-warning .report-kpi-card__icon {
        background: var(--color-warning-light);
        color: var(--color-warning-dark);
      }

      .tone-danger .report-kpi-card__icon {
        background: var(--color-danger-light);
        color: var(--color-danger-dark);
      }

      .tone-info .report-kpi-card__icon {
        background: var(--color-info-light);
        color: var(--color-info);
      }
    `
  ]
})
export class ReportKpiCardComponent {
  @Input() title = '';
  @Input() value: string | number = '--';
  @Input() subtitle = '';
  @Input() icon = '';
  @Input() tone: 'primary' | 'success' | 'warning' | 'danger' | 'info' = 'primary';
}
