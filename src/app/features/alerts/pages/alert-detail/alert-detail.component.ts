import { CommonModule, DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize, of, switchMap } from 'rxjs';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { AlertResponse } from '../../../../core/http/backend.models';
import { NotificationService } from '../../../../core/services/notification.service';
import { AlertSeverityBadgeComponent } from '../../components/alert-severity-badge/alert-severity-badge.component';
import { AlertTypeBadgeComponent } from '../../components/alert-type-badge/alert-type-badge.component';
import { AlertApiService } from '../../services/alert-api.service';

@Component({
  selector: 'app-alert-detail',
  standalone: true,
  imports: [CommonModule, DatePipe, RouterLink, AlertSeverityBadgeComponent, AlertTypeBadgeComponent],
  template: `
    <section class="detail-shell" *ngIf="alert as item">
      <a routerLink="/alerts" class="back-link">Back to alerts</a>
      <article class="detail-card">
        <div class="detail-card__meta">
          <app-alert-severity-badge [severity]="item.severity"></app-alert-severity-badge>
          <app-alert-type-badge [type]="item.type"></app-alert-type-badge>
          <span>{{ item.status }}</span>
        </div>
        <h1>{{ item.title }}</h1>
        <p class="detail-card__message">{{ item.message }}</p>
        <dl class="detail-grid">
          <div><dt>Alert Number</dt><dd>{{ item.alertNumber }}</dd></div>
          <div><dt>Created</dt><dd>{{ item.createdAt | date:'medium' }}</dd></div>
          <div><dt>Reference</dt><dd>{{ item.referenceNumber || item.referenceId || '-' }}</dd></div>
          <div><dt>Source Service</dt><dd>{{ item.sourceService || '-' }}</dd></div>
          <div><dt>Recipient Role</dt><dd>{{ item.recipientRole || '-' }}</dd></div>
          <div><dt>Recipient ID</dt><dd>{{ item.recipientId || '-' }}</dd></div>
          <div><dt>Read At</dt><dd>{{ item.readAt ? (item.readAt | date:'medium') : 'Not yet' }}</dd></div>
          <div><dt>Acknowledged At</dt><dd>{{ item.acknowledgedAt ? (item.acknowledgedAt | date:'medium') : 'Not yet' }}</dd></div>
          <div><dt>Dismissed At</dt><dd>{{ item.dismissedAt ? (item.dismissedAt | date:'medium') : 'Not dismissed' }}</dd></div>
          <div><dt>Expires At</dt><dd>{{ item.expiresAt ? (item.expiresAt | date:'medium') : 'No expiry' }}</dd></div>
        </dl>

        <div class="detail-actions">
          <a *ngIf="item.actionUrl" [routerLink]="item.actionUrl" class="action-link">Open Related Workflow</a>
          <button type="button" class="btn-secondary" (click)="acknowledge()" [disabled]="item.isAcknowledged || actionLoading === 'ack'">
            {{ actionLoading === 'ack' ? 'Acknowledging...' : 'Acknowledge' }}
          </button>
          <button type="button" class="btn-secondary" (click)="dismiss()" [disabled]="item.isDismissed || actionLoading === 'dismiss'">
            {{ actionLoading === 'dismiss' ? 'Dismissing...' : 'Dismiss' }}
          </button>
          <button *ngIf="isAdmin" type="button" class="btn-primary" (click)="resolve()" [disabled]="item.status === 'RESOLVED' || actionLoading === 'resolve'">
            {{ actionLoading === 'resolve' ? 'Resolving...' : 'Resolve' }}
          </button>
        </div>
      </article>
    </section>
  `,
  styles: [`
    .detail-shell { display:grid; gap:1rem; }
    .back-link,.action-link { color:#2563eb; font-weight:600; text-decoration:none; }
    .detail-card { padding:1.5rem; border:1px solid #dbe4f0; border-radius:24px; background:#fff; box-shadow:0 16px 40px rgba(15,23,42,0.05); }
    .detail-card__meta { display:flex; gap:0.6rem; align-items:center; flex-wrap:wrap; color:#64748b; }
    .detail-card h1 { margin:0.9rem 0 0.55rem; color:#0f172a; }
    .detail-card__message { color:#475569; font-size:1rem; line-height:1.6; }
    .detail-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); gap:1rem; margin:1.25rem 0; }
    .detail-grid dt { color:#64748b; font-size:0.82rem; margin-bottom:0.25rem; }
    .detail-grid dd { margin:0; color:#0f172a; font-weight:600; }
    .detail-actions { display:flex; gap:0.85rem; flex-wrap:wrap; align-items:center; }
    .btn-primary,.btn-secondary { border:none; border-radius:14px; padding:0.8rem 1rem; cursor:pointer; font-weight:600; }
    .btn-primary { background:#2563eb; color:#fff; }
    .btn-secondary { background:#eff6ff; color:#1d4ed8; }
  `],
})
export class AlertDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly alertApi = inject(AlertApiService);
  private readonly authService = inject(AuthService);
  private readonly notification = inject(NotificationService);

  alert: AlertResponse | null = null;
  actionLoading: 'ack' | 'dismiss' | 'resolve' | null = null;

  constructor() {
    this.route.paramMap.pipe(
      switchMap((params) => this.alertApi.getAlertById(Number(params.get('id')))),
      switchMap((alert) => {
        this.alert = alert;
        return alert.isRead ? of(alert) : this.alertApi.markAsRead(alert.alertId);
      }),
    ).subscribe({
      next: (alert) => (this.alert = alert),
    });
  }

  get isAdmin(): boolean {
    return this.authService.getUserRole() === 'ADMIN';
  }

  acknowledge(): void {
    if (!this.alert) {
      return;
    }
    this.actionLoading = 'ack';
    this.alertApi.acknowledgeAlert(this.alert.alertId).pipe(finalize(() => (this.actionLoading = null))).subscribe({
      next: (alert) => {
        this.alert = alert;
        this.notification.success('Alert acknowledged successfully');
      },
    });
  }

  dismiss(): void {
    if (!this.alert) {
      return;
    }
    this.actionLoading = 'dismiss';
    this.alertApi.dismissAlert(this.alert.alertId).pipe(finalize(() => (this.actionLoading = null))).subscribe({
      next: (alert) => {
        this.alert = alert;
        this.notification.success('Alert dismissed successfully');
      },
    });
  }

  resolve(): void {
    if (!this.alert) {
      return;
    }
    this.actionLoading = 'resolve';
    this.alertApi.resolveAlert(this.alert.alertId).pipe(finalize(() => (this.actionLoading = null))).subscribe({
      next: (alert) => {
        this.alert = alert;
        this.notification.success('Alert resolved successfully');
      },
    });
  }
}
