import { CommonModule, DatePipe, NgClass } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AlertResponse, AlertSearchRequest, AlertStatus, AlertSummaryResponse, AlertType } from '../../../../core/http/backend.models';
import { NotificationService } from '../../../../core/services/notification.service';
import { AlertSummaryCardsComponent } from '../../components/alert-summary-cards/alert-summary-cards.component';
import { AlertSeverityBadgeComponent } from '../../components/alert-severity-badge/alert-severity-badge.component';
import { AlertTypeBadgeComponent } from '../../components/alert-type-badge/alert-type-badge.component';
import { AlertApiService } from '../../services/alert-api.service';

@Component({
  selector: 'app-alert-center',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, DatePipe, NgClass, AlertSeverityBadgeComponent, AlertTypeBadgeComponent, AlertSummaryCardsComponent],
  template: `
    <section class="page-shell">
      <header class="page-header">
        <div>
          <p class="eyebrow">Alert Center</p>
          <h1>Operational alerts, triage, and follow-up</h1>
          <p>Review unread and critical signals, acknowledge work you have handled, and jump straight into the related workflow.</p>
        </div>
        <button type="button" class="btn-secondary" (click)="markAllRead()" [disabled]="markAllLoading">
          {{ markAllLoading ? 'Marking...' : 'Mark All Read' }}
        </button>
      </header>

      <app-alert-summary-cards [summary]="summary"></app-alert-summary-cards>

      <div class="quick-filters">
        <button
          *ngFor="let filter of quickFilters"
          type="button"
          class="quick-filters__chip"
          [ngClass]="{ 'quick-filters__chip--active': activeQuickFilter === filter.key }"
          (click)="applyQuickFilter(filter.key)">
          {{ filter.label }}
        </button>
      </div>

      <form class="filter-panel" [formGroup]="filters" (ngSubmit)="applyFormFilters()">
        <input formControlName="keyword" placeholder="Search title, number, message" />
        <select formControlName="severity">
          <option value="">All severities</option>
          <option value="INFO">Info</option>
          <option value="WARNING">Warning</option>
          <option value="CRITICAL">Critical</option>
        </select>
        <select formControlName="status">
          <option value="">All statuses</option>
          <option *ngFor="let status of statuses" [value]="status">{{ status }}</option>
        </select>
        <select formControlName="type">
          <option value="">All types</option>
          <option *ngFor="let type of types" [value]="type">{{ type }}</option>
        </select>
        <button type="submit" class="btn-primary" [disabled]="loading">{{ loading ? 'Searching...' : 'Apply Filters' }}</button>
      </form>

      <div *ngIf="loading" class="state-card">Loading alerts...</div>
      <div *ngIf="!loading && alerts.length === 0" class="state-card">No alerts found for the selected filters.</div>

      <div *ngIf="!loading && alerts.length > 0" class="alert-table">
        <article *ngFor="let alert of alerts" class="alert-row" [ngClass]="{ 'alert-row--unread': !alert.isRead }">
          <div class="alert-row__main">
            <div class="alert-row__meta">
              <app-alert-severity-badge [severity]="alert.severity"></app-alert-severity-badge>
              <app-alert-type-badge [type]="alert.type"></app-alert-type-badge>
              <span class="alert-row__number">{{ alert.alertNumber }}</span>
            </div>
            <h3>{{ alert.title }}</h3>
            <p>{{ alert.message }}</p>
            <div class="alert-row__submeta">
              <span>{{ alert.createdAt | date:'medium' }}</span>
              <span>{{ alert.status }}</span>
              <span *ngIf="alert.referenceNumber">Ref {{ alert.referenceNumber }}</span>
            </div>
          </div>
          <div class="alert-row__actions">
            <a [routerLink]="['/alerts', alert.alertId]" class="btn-secondary btn-compact">View</a>
            <a *ngIf="alert.actionUrl" [routerLink]="alert.actionUrl" class="btn-secondary btn-compact">Open Workflow</a>
            <button type="button" class="btn-secondary btn-compact" (click)="markRead(alert)" [disabled]="actionId === alert.alertId || alert.isRead">
              {{ actionId === alert.alertId && pendingAction === 'read' ? 'Marking...' : 'Mark Read' }}
            </button>
            <button type="button" class="btn-secondary btn-compact" (click)="acknowledge(alert)" [disabled]="actionId === alert.alertId || alert.isAcknowledged">
              {{ actionId === alert.alertId && pendingAction === 'ack' ? 'Acknowledging...' : 'Acknowledge' }}
            </button>
            <button type="button" class="btn-secondary btn-compact" (click)="dismiss(alert)" [disabled]="actionId === alert.alertId || alert.isDismissed">
              {{ actionId === alert.alertId && pendingAction === 'dismiss' ? 'Dismissing...' : 'Dismiss' }}
            </button>
          </div>
        </article>
      </div>

      <div *ngIf="!loading && totalPages > 1" class="pagination-bar">
        <button type="button" class="btn-secondary btn-compact" (click)="changePage(-1)" [disabled]="pageIndex === 0">Previous</button>
        <span>Page {{ pageIndex + 1 }} of {{ totalPages }}</span>
        <button type="button" class="btn-secondary btn-compact" (click)="changePage(1)" [disabled]="pageIndex + 1 >= totalPages">Next</button>
      </div>
    </section>
  `,
  styles: [`
    .page-shell { display:grid; gap:1.25rem; }
    .page-header { display:flex; justify-content:space-between; gap:1rem; align-items:flex-start; padding:1.5rem; border-radius:24px; background:linear-gradient(135deg,#0f172a,#1d4ed8); color:#fff; }
    .page-header h1 { margin:0.2rem 0 0.45rem; font-size:1.85rem; }
    .page-header p { margin:0; color:#dbeafe; max-width:60ch; }
    .eyebrow { text-transform:uppercase; letter-spacing:0.16em; font-size:0.72rem !important; color:#bfdbfe !important; }
    .quick-filters { display:flex; gap:0.75rem; flex-wrap:wrap; }
    .quick-filters__chip { border:none; border-radius:999px; padding:0.7rem 1rem; background:#e2e8f0; color:#334155; cursor:pointer; font-weight:600; }
    .quick-filters__chip--active { background:#0f172a; color:#fff; }
    .filter-panel { display:grid; grid-template-columns:repeat(auto-fit,minmax(160px,1fr)); gap:0.9rem; padding:1rem; border-radius:20px; border:1px solid #dbe4f0; background:#fff; }
    .filter-panel input,.filter-panel select { border:1px solid #cbd5e1; border-radius:14px; padding:0.8rem 0.95rem; }
    .state-card { padding:2rem; border:1px dashed #cbd5e1; border-radius:20px; background:#fff; color:#64748b; text-align:center; }
    .alert-table { display:grid; gap:0.9rem; }
    .alert-row { display:flex; justify-content:space-between; gap:1rem; padding:1.15rem; border-radius:22px; border:1px solid #dbe4f0; background:#fff; box-shadow:0 10px 30px rgba(15,23,42,0.04); }
    .alert-row--unread { border-color:#93c5fd; box-shadow:0 16px 30px rgba(37,99,235,0.1); }
    .alert-row__meta,.alert-row__submeta,.alert-row__actions { display:flex; flex-wrap:wrap; gap:0.55rem; align-items:center; }
    .alert-row__number { color:#64748b; font-size:0.85rem; font-weight:600; }
    .alert-row h3 { margin:0.7rem 0 0.35rem; color:#0f172a; }
    .alert-row p { margin:0; color:#475569; line-height:1.5; }
    .alert-row__submeta { margin-top:0.75rem; color:#64748b; font-size:0.82rem; }
    .alert-row__actions { align-content:flex-start; min-width:220px; justify-content:flex-end; }
    .btn-primary,.btn-secondary { border:none; border-radius:14px; padding:0.8rem 1rem; cursor:pointer; font-weight:600; text-decoration:none; }
    .btn-primary { background:#2563eb; color:#fff; }
    .btn-secondary { background:#eff6ff; color:#1d4ed8; }
    .btn-compact { padding:0.65rem 0.85rem; }
    .pagination-bar { display:flex; justify-content:flex-end; align-items:center; gap:0.85rem; color:#475569; }
    @media (max-width: 900px) { .alert-row { flex-direction:column; } .alert-row__actions { min-width:auto; justify-content:flex-start; } .page-header { flex-direction:column; } }
  `],
})
export class AlertCenterComponent implements OnInit {
  private readonly alertApi = inject(AlertApiService);
  private readonly notification = inject(NotificationService);
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly types: AlertType[] = ['LOW_STOCK', 'OVERSTOCK', 'PO_APPROVAL_PENDING', 'PO_OVERDUE_RECEIPT', 'SUPPLIER_BLACKLISTED', 'MOVEMENT_ANOMALY', 'SYSTEM_BROADCAST', 'GENERAL'];
  readonly statuses: AlertStatus[] = ['NEW', 'READ', 'ACKNOWLEDGED', 'DISMISSED', 'RESOLVED', 'EXPIRED'];
  readonly quickFilters = [
    { key: 'all', label: 'All' },
    { key: 'unread', label: 'Unread' },
    { key: 'critical', label: 'Critical' },
    { key: 'warning', label: 'Warnings' },
    { key: 'ack', label: 'Acknowledged' },
    { key: 'dismissed', label: 'Dismissed' },
  ] as const;

  readonly filters = this.fb.nonNullable.group({
    keyword: '',
    severity: '',
    status: '',
    type: '',
  });

  alerts: AlertResponse[] = [];
  summary: AlertSummaryResponse | null = null;
  loading = false;
  markAllLoading = false;
  actionId: number | null = null;
  pendingAction: 'read' | 'ack' | 'dismiss' | null = null;
  activeQuickFilter: typeof this.quickFilters[number]['key'] = 'all';
  pageIndex = 0;
  pageSize = 10;
  totalPages = 0;

  ngOnInit(): void {
    this.applyDashboardQueryParams();
    this.loadSummary();
    this.loadAlerts();
  }

  applyFormFilters(): void {
    this.activeQuickFilter = 'all';
    this.pageIndex = 0;
    this.syncQueryParams();
    this.loadAlerts();
  }

  loadAlerts(): void {
    this.runSearch(this.buildParams());
  }

  markAllRead(): void {
    this.markAllLoading = true;
    this.alertApi.markAllAsRead().pipe(finalize(() => (this.markAllLoading = false))).subscribe({
      next: () => {
        this.notification.success('All alerts marked as read');
        this.loadSummary();
        this.loadAlerts();
      },
    });
  }

  markRead(alert: AlertResponse): void {
    this.handleAction(alert, 'read', () => this.alertApi.markAsRead(alert.alertId), 'Alert marked as read');
  }

  acknowledge(alert: AlertResponse): void {
    this.handleAction(alert, 'ack', () => this.alertApi.acknowledgeAlert(alert.alertId), 'Alert acknowledged successfully');
  }

  dismiss(alert: AlertResponse): void {
    this.handleAction(alert, 'dismiss', () => this.alertApi.dismissAlert(alert.alertId), 'Alert dismissed successfully');
  }

  applyQuickFilter(filter: typeof this.quickFilters[number]['key']): void {
    this.activeQuickFilter = filter;
    this.pageIndex = 0;

    switch (filter) {
      case 'unread':
        this.filters.patchValue({ severity: '', status: '', type: '' }, { emitEvent: false });
        this.runSearch(this.buildParams({ isRead: false }));
        return;
      case 'critical':
        this.filters.patchValue({ severity: 'CRITICAL', status: '', type: '' }, { emitEvent: false });
        break;
      case 'warning':
        this.filters.patchValue({ severity: 'WARNING', status: '', type: '' }, { emitEvent: false });
        break;
      case 'ack':
        this.filters.patchValue({ severity: '', status: 'ACKNOWLEDGED', type: '' }, { emitEvent: false });
        break;
      case 'dismissed':
        this.filters.patchValue({ severity: '', status: 'DISMISSED', type: '' }, { emitEvent: false });
        break;
      default:
        this.filters.patchValue({ severity: '', status: '', type: '' }, { emitEvent: false });
    }

    this.syncQueryParams();
    this.loadAlerts();
  }

  changePage(offset: number): void {
    const nextPage = this.pageIndex + offset;
    if (nextPage < 0 || nextPage >= this.totalPages) {
      return;
    }
    this.pageIndex = nextPage;
    this.syncQueryParams();
    this.loadAlerts();
  }

  private loadSummary(): void {
    this.alertApi.getMyAlertSummary().subscribe({ next: (summary) => (this.summary = summary) });
  }

  private buildParams(overrides: Partial<AlertSearchRequest> = {}): Partial<AlertSearchRequest> {
    const raw = this.filters.getRawValue();
    return {
      keyword: raw.keyword || undefined,
      severity: (raw.severity as AlertSearchRequest['severity']) || undefined,
      status: (raw.status as AlertSearchRequest['status']) || undefined,
      type: (raw.type as AlertSearchRequest['type']) || undefined,
      page: this.pageIndex,
      size: this.pageSize,
      sortBy: 'createdAt',
      sortDir: 'desc',
      ...overrides,
    };
  }

  private runSearch(params: Partial<AlertSearchRequest>): void {
    this.loading = true;
    this.alertApi.searchAlerts(params).pipe(finalize(() => (this.loading = false))).subscribe({
      next: (page) => {
        this.alerts = page.content;
        this.totalPages = page.totalPages;
      },
      error: () => {
        this.alerts = [];
        this.totalPages = 0;
      },
    });
  }

  private handleAction(alert: AlertResponse, action: 'read' | 'ack' | 'dismiss', request: () => any, successMessage: string): void {
    this.actionId = alert.alertId;
    this.pendingAction = action;
    request().pipe(finalize(() => {
      this.actionId = null;
      this.pendingAction = null;
    })).subscribe({
      next: () => {
        this.notification.success(successMessage);
        this.loadSummary();
        this.loadAlerts();
      },
    });
  }

  private applyDashboardQueryParams(): void {
    const queryParams = this.route.snapshot.queryParamMap;
    const severity = queryParams.get('severity') ?? '';
    const status = queryParams.get('status') ?? '';
    const type = queryParams.get('type') ?? '';
    const quick = queryParams.get('quick');

    this.filters.patchValue({ severity, status, type }, { emitEvent: false });

    if (quick && this.quickFilters.some((filter) => filter.key === quick)) {
      this.activeQuickFilter = quick as typeof this.quickFilters[number]['key'];
    }
  }

  private syncQueryParams(): void {
    const raw = this.filters.getRawValue();
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        severity: raw.severity || null,
        status: raw.status || null,
        type: raw.type || null,
        quick: this.activeQuickFilter !== 'all' ? this.activeQuickFilter : null,
        page: this.pageIndex > 0 ? this.pageIndex : null,
      },
      queryParamsHandling: '',
      replaceUrl: true,
    });
  }
}
