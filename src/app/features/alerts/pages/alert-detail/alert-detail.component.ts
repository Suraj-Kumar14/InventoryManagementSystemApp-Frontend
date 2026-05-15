import { CommonModule, DatePipe } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { asapScheduler, BehaviorSubject, catchError, finalize, map, observeOn, of, switchMap } from 'rxjs';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { AlertResponse } from '../../../../core/http/backend.models';
import { NotificationService } from '../../../../core/services/notification.service';
import { AlertSeverityBadgeComponent } from '../../components/alert-severity-badge/alert-severity-badge.component';
import { AlertTypeBadgeComponent } from '../../components/alert-type-badge/alert-type-badge.component';
import { AlertApiService } from '../../services/alert-api.service';
import { canAcknowledgeAlert, canDismissAlert, canResolveAlert, getAlertDetailMessage } from '../../utils/alert-display.util';

interface AlertDetailViewState {
  alert: AlertResponse | null;
  errorMessage: string | null;
  isLoading: boolean;
}

@Component({
  selector: 'app-alert-detail',
  standalone: true,
  imports: [CommonModule, DatePipe, RouterLink, AlertSeverityBadgeComponent, AlertTypeBadgeComponent],
  template: `
    <ng-container *ngIf="viewState$ | async as vm">
      <section class="detail-shell">
        <a routerLink="/alerts" class="back-link">Back to alerts</a>

        <article *ngIf="vm.isLoading" class="detail-card detail-card--state">
          <p>Loading alert details...</p>
        </article>

        <article *ngIf="!vm.isLoading && vm.errorMessage" class="detail-card detail-card--state detail-card--error">
          <h1>Unable to load alert</h1>
          <p>{{ vm.errorMessage }}</p>
        </article>

        <article class="detail-card" *ngIf="!vm.isLoading && vm.alert as selectedAlert">
          <div class="detail-card__meta">
            <app-alert-severity-badge [severity]="selectedAlert.severity"></app-alert-severity-badge>
            <app-alert-type-badge [type]="selectedAlert.type"></app-alert-type-badge>
            <span class="status-badge" [class.status-badge--muted]="selectedAlert.status === 'READ' || selectedAlert.status === 'RESOLVED'">
              {{ selectedAlert.status }}
            </span>
          </div>
          <h1>{{ selectedAlert.title }}</h1>
          <p class="detail-card__message">{{ displayMessage(selectedAlert) }}</p>
          <p class="detail-card__created">Created {{ selectedAlert.createdAt | date:'medium' }}</p>

          <div class="detail-actions" *ngIf="showActions(selectedAlert)">
            <button *ngIf="canAcknowledge(selectedAlert)" type="button" class="btn-secondary" (click)="acknowledge()" [disabled]="actionLoading === 'ack'">
              {{ actionLoading === 'ack' ? 'Acknowledging...' : 'Acknowledge' }}
            </button>
            <button *ngIf="canDismiss(selectedAlert)" type="button" class="btn-secondary" (click)="dismiss()" [disabled]="actionLoading === 'dismiss'">
              {{ actionLoading === 'dismiss' ? 'Dismissing...' : 'Dismiss' }}
            </button>
            <button *ngIf="isAdmin && canResolve(selectedAlert)" type="button" class="btn-primary" (click)="resolve()" [disabled]="actionLoading === 'resolve'">
              {{ actionLoading === 'resolve' ? 'Resolving...' : 'Resolve' }}
            </button>
          </div>
        </article>
      </section>
    </ng-container>
  `,
  styles: [`
    .detail-shell { display:grid; gap:1rem; }
    .back-link { color:#2563eb; font-weight:600; text-decoration:none; }
    .detail-card { padding:1.5rem; border:1px solid #dbe4f0; border-radius:24px; background:#fff; box-shadow:0 16px 40px rgba(15,23,42,0.05); }
    .detail-card--state { min-height:180px; display:grid; align-content:center; justify-items:start; }
    .detail-card--error { border-color:#fecaca; background:#fff7f7; }
    .detail-card__meta { display:flex; gap:0.6rem; align-items:center; flex-wrap:wrap; color:#64748b; }
    .detail-card h1 { margin:0.9rem 0 0.55rem; color:#0f172a; }
    .detail-card__message { color:#475569; font-size:1rem; line-height:1.6; }
    .detail-card__created { margin:0 0 1.25rem; color:#64748b; font-size:0.92rem; }
    .status-badge { display:inline-flex; align-items:center; border-radius:999px; padding:0.3rem 0.75rem; background:#dbeafe; color:#1d4ed8; font-weight:600; font-size:0.85rem; }
    .status-badge--muted { background:#e2e8f0; color:#475569; }
    .detail-actions { display:flex; gap:0.85rem; flex-wrap:wrap; align-items:center; }
    .btn-primary,.btn-secondary { border:none; border-radius:14px; padding:0.8rem 1rem; cursor:pointer; font-weight:600; }
    .btn-primary { background:#2563eb; color:#fff; }
    .btn-secondary { background:#eff6ff; color:#1d4ed8; }
  `],
})
export class AlertDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly alertApi = inject(AlertApiService);
  private readonly authService = inject(AuthService);
  private readonly notification = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly viewStateSubject = new BehaviorSubject<AlertDetailViewState>({
    alert: null,
    errorMessage: null,
    isLoading: true,
  });

  readonly viewState$ = this.viewStateSubject.asObservable();
  alert: AlertResponse | null = null;
  actionLoading: 'ack' | 'dismiss' | 'resolve' | null = null;

  ngOnInit(): void {
    this.route.paramMap.pipe(
      takeUntilDestroyed(this.destroyRef),
      switchMap((params) => {
        this.updateViewState({
          alert: null,
          errorMessage: null,
          isLoading: true,
        });
        return this.alertApi.getAlertById(Number(params.get('id'))).pipe(
          observeOn(asapScheduler),
          switchMap((alert) =>
            (alert.isRead ? of(alert) : this.alertApi.markAsRead(alert.alertId).pipe(
              observeOn(asapScheduler),
              catchError(() => of(alert)),
            )).pipe(
              map((resolvedAlert) => ({
                alert: resolvedAlert,
                errorMessage: null,
                isLoading: false,
              })),
            )
          ),
          catchError(() =>
            of({
              alert: null,
              errorMessage: 'We could not load this alert right now. Please try again.',
              isLoading: false,
            }),
          ),
        );
      }),
    ).subscribe((state) => {
      this.alert = state.alert;
      this.updateViewState(state);
    });
  }

  get isAdmin(): boolean {
    return this.authService.getUserRole() === 'ADMIN';
  }

  acknowledge(): void {
    if (!this.alert || !this.canAcknowledge(this.alert)) {
      return;
    }
    this.actionLoading = 'ack';
    this.alertApi.acknowledgeAlert(this.alert.alertId).pipe(finalize(() => (this.actionLoading = null))).subscribe({
      next: (alert) => {
        this.alert = alert;
        this.updateViewState({ alert });
        this.notification.success('Alert acknowledged successfully');
      },
    });
  }

  dismiss(): void {
    if (!this.alert || !this.canDismiss(this.alert)) {
      return;
    }
    this.actionLoading = 'dismiss';
    this.alertApi.dismissAlert(this.alert.alertId).pipe(finalize(() => (this.actionLoading = null))).subscribe({
      next: (alert) => {
        this.alert = alert;
        this.updateViewState({ alert });
        this.notification.success('Alert dismissed successfully');
      },
    });
  }

  resolve(): void {
    if (!this.alert || !this.canResolve(this.alert)) {
      return;
    }
    this.actionLoading = 'resolve';
    this.alertApi.resolveAlert(this.alert.alertId).pipe(finalize(() => (this.actionLoading = null))).subscribe({
      next: (alert) => {
        this.alert = alert;
        this.updateViewState({ alert });
        this.notification.success('Alert resolved successfully');
      },
    });
  }

  displayMessage(alert: AlertResponse): string {
    return getAlertDetailMessage(alert);
  }

  canAcknowledge(alert: AlertResponse): boolean {
    return canAcknowledgeAlert(alert);
  }

  canDismiss(alert: AlertResponse): boolean {
    return canDismissAlert(alert);
  }

  canResolve(alert: AlertResponse): boolean {
    return canResolveAlert(alert.status);
  }

  showActions(alert: AlertResponse): boolean {
    return this.canAcknowledge(alert) || this.canDismiss(alert) || (this.isAdmin && this.canResolve(alert));
  }

  private updateViewState(patch: Partial<AlertDetailViewState>): void {
    this.viewStateSubject.next({
      ...this.viewStateSubject.value,
      ...patch,
    });
  }
}
