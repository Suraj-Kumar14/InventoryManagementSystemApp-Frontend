import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-report-kpi-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <article class="kpi-card" [class.kpi-card--warning]="severity === 'warning'" [class.kpi-card--critical]="severity === 'critical'" [class.kpi-card--success]="severity === 'success'">
      <div class="kpi-head">
        <span class="kpi-icon" *ngIf="icon">
          <i [class]="icon" aria-hidden="true"></i>
        </span>
        <span class="kpi-label">{{ label }}</span>
      </div>
      <strong class="kpi-value">{{ value }}</strong>
      <p class="kpi-meta" *ngIf="meta">{{ meta }}</p>
    </article>
  `,
  styles: [
    `
      .kpi-card {
        border-radius: 20px;
        padding: 1.1rem 1.2rem;
        background: linear-gradient(135deg, #ffffff 0%, #f4f7fb 100%);
        border: 1px solid rgba(15, 23, 42, 0.08);
        box-shadow: 0 16px 40px rgba(15, 23, 42, 0.08);
      }
      .kpi-card--warning {
        border-color: rgba(245, 158, 11, 0.35);
        background: linear-gradient(135deg, #fffdf7 0%, #fff7ed 100%);
      }
      .kpi-card--critical {
        border-color: rgba(239, 68, 68, 0.25);
        background: linear-gradient(135deg, #fffdfd 0%, #fef2f2 100%);
      }
      .kpi-card--success {
        border-color: rgba(34, 197, 94, 0.25);
        background: linear-gradient(135deg, #f8fffb 0%, #ecfdf5 100%);
      }
      .kpi-head {
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }
      .kpi-icon {
        width: 2rem;
        height: 2rem;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 12px;
        background: #eff6ff;
        color: #1d4ed8;
        font-size: 1rem;
      }
      .kpi-label {
        display: block;
        font-size: 0.78rem;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: #64748b;
      }
      .kpi-value {
        display: block;
        margin-top: 0.45rem;
        font-size: 1.65rem;
        line-height: 1.1;
        color: #0f172a;
      }
      .kpi-meta {
        margin: 0.45rem 0 0;
        color: #475569;
        font-size: 0.9rem;
      }
    `,
  ],
})
export class ReportKpiCardComponent {
  @Input({ required: true }) label = '';
  @Input({ required: true }) value: string | number = '';
  @Input() meta?: string;
  @Input() icon?: string;
  @Input() severity: 'default' | 'warning' | 'critical' | 'success' = 'default';
}
