import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { AlertSummaryResponse } from '../../../../core/http/backend.models';

@Component({
  selector: 'app-alert-summary-cards',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="summary-grid" *ngIf="summary">
      <article class="summary-card"><span>Total Alerts</span><strong>{{ summary.totalAlerts }}</strong></article>
      <article class="summary-card"><span>Unread</span><strong>{{ summary.unreadCount }}</strong></article>
      <article class="summary-card"><span>Critical</span><strong>{{ summary.criticalCount }}</strong></article>
      <article class="summary-card"><span>Warnings</span><strong>{{ summary.warningCount }}</strong></article>
    </section>
  `,
  styles: [`
    .summary-grid { display:grid; grid-template-columns:repeat(auto-fit, minmax(160px, 1fr)); gap:1rem; }
    .summary-card { border:1px solid #dbe4f0; border-radius:20px; padding:1rem 1.1rem; background:linear-gradient(180deg,#fff,#f8fbff); box-shadow:0 10px 24px rgba(15,23,42,0.05); }
    .summary-card span { display:block; color:#64748b; font-size:0.82rem; margin-bottom:0.45rem; }
    .summary-card strong { font-size:1.6rem; color:#0f172a; }
  `],
})
export class AlertSummaryCardsComponent {
  @Input() summary: AlertSummaryResponse | null = null;
}
