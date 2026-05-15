import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { AlertAnalyticsResponse, AlertSummaryResponse } from '../../../../core/http/backend.models';
import { AlertSummaryCardsComponent } from '../../components/alert-summary-cards/alert-summary-cards.component';
import { AlertApiService } from '../../services/alert-api.service';

@Component({
  selector: 'app-alert-analytics',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AlertSummaryCardsComponent],
  template: `
    <section class="analytics-shell">
      <header class="analytics-header">
        <div>
          <p class="eyebrow">Alert Analytics</p>
          <h1>Operational signal overview</h1>
          <p>Track severity mix, alert categories, and trending inventory or purchase issues over time.</p>
        </div>
      </header>

      <form class="analytics-filter" [formGroup]="filters" (ngSubmit)="reload()">
        <input type="date" formControlName="fromDate" />
        <input type="date" formControlName="toDate" />
        <button type="submit" class="btn-primary" [disabled]="loading">{{ loading ? 'Loading...' : 'Refresh Analytics' }}</button>
      </form>

      <app-alert-summary-cards [summary]="summary"></app-alert-summary-cards>

      <div *ngIf="analytics" class="analytics-grid">
        <article class="analytics-card">
          <h2>By Severity</h2>
          <div *ngFor="let item of objectEntries(analytics.alertsBySeverity)">{{ item[0] }}: <strong>{{ item[1] }}</strong></div>
        </article>
        <article class="analytics-card">
          <h2>By Type</h2>
          <div *ngFor="let item of objectEntries(analytics.alertsByType)">{{ item[0] }}: <strong>{{ item[1] }}</strong></div>
        </article>
        <article class="analytics-card">
          <h2>By Role</h2>
          <div *ngFor="let item of objectEntries(analytics.alertsByRole)">{{ item[0] }}: <strong>{{ item[1] }}</strong></div>
        </article>
        <article class="analytics-card">
          <h2>Daily Trend</h2>
          <div *ngFor="let item of objectEntries(analytics.dailyAlertTrend)">{{ item[0] }}: <strong>{{ item[1] }}</strong></div>
        </article>
      </div>
    </section>
  `,
  styles: [`
    .analytics-shell { display:grid; gap:1.25rem; }
    .analytics-header { padding:1.5rem; border-radius:24px; background:linear-gradient(135deg,#052e16,#16a34a); color:#fff; }
    .analytics-header h1 { margin:0.3rem 0 0.4rem; }
    .analytics-header p { margin:0; color:#dcfce7; }
    .eyebrow { text-transform:uppercase; letter-spacing:0.16em; font-size:0.72rem !important; color:#bbf7d0 !important; }
    .analytics-filter { display:flex; gap:0.85rem; flex-wrap:wrap; padding:1rem; border:1px solid #dbe4f0; border-radius:20px; background:#fff; }
    .analytics-filter input { border:1px solid #cbd5e1; border-radius:14px; padding:0.8rem 0.95rem; }
    .btn-primary { border:none; border-radius:14px; padding:0.8rem 1rem; cursor:pointer; font-weight:600; background:#2563eb; color:#fff; }
    .analytics-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:1rem; }
    .analytics-card { padding:1.1rem; border-radius:20px; border:1px solid #dbe4f0; background:#fff; }
    .analytics-card h2 { margin-top:0; font-size:1rem; color:#0f172a; }
    .analytics-card div { color:#475569; padding:0.24rem 0; }
  `],
})
export class AlertAnalyticsComponent {
  private readonly alertApi = inject(AlertApiService);
  private readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  readonly filters = this.fb.nonNullable.group({
    fromDate: [''],
    toDate: [''],
  });

  summary: AlertSummaryResponse | null = null;
  analytics: AlertAnalyticsResponse | null = null;
  loading = false;

  constructor() {
    this.reload();
  }

  reload(): void {
    this.loading = true;
    const role = this.authService.getUserRole();
    const summaryRequest = role === 'ADMIN' ? this.alertApi.getSystemAlertSummary() : this.alertApi.getMyAlertSummary();
    const { fromDate, toDate } = this.filters.getRawValue();

    summaryRequest.pipe(finalize(() => (this.loading = false))).subscribe({
      next: (summary) => (this.summary = summary),
    });

    this.alertApi.getAlertAnalytics(fromDate || undefined, toDate || undefined).subscribe({
      next: (analytics) => (this.analytics = analytics),
    });
  }

  objectEntries(value?: Record<string, number> | null): Array<[string, number]> {
    return value ? Object.entries(value) : [];
  }
}
