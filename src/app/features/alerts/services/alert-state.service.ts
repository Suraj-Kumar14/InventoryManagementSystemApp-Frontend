import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, EMPTY, Subscription, forkJoin, timer } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AlertResponse } from '../../../core/http/backend.models';
import { NotificationService } from '../../../core/services/notification.service';
import { AlertApiService } from './alert-api.service';
import { getAlertDisplayMessage, truncateAlertMessage } from '../utils/alert-display.util';
import { filterVisibleAlerts } from '../utils/alert-visibility.util';

@Injectable({ providedIn: 'root' })
export class AlertStateService {
  private readonly alertApi = inject(AlertApiService);
  private readonly notifications = inject(NotificationService);

  private readonly unreadCountSubject = new BehaviorSubject<number>(0);
  private readonly recentUnreadSubject = new BehaviorSubject<AlertResponse[]>([]);

  readonly unreadCount$ = this.unreadCountSubject.asObservable();
  readonly recentUnreadAlerts$ = this.recentUnreadSubject.asObservable();

  private pollSubscription?: Subscription;
  private initialized = false;

  startPolling(): void {
    if (this.pollSubscription) {
      return;
    }

    this.pollSubscription = timer(0, 60000)
      .pipe(catchError(() => EMPTY))
      .subscribe(() => this.refresh());
  }

  refresh(): void {
    forkJoin({
      count: this.alertApi.getUnreadCount(),
      page: this.alertApi.getMyAlerts({
        page: 0,
        size: 5,
        isRead: false,
        sortBy: 'createdAt',
        sortDir: 'desc',
      }),
    })
      .pipe(
        catchError(() => {
          this.unreadCountSubject.next(0);
          this.recentUnreadSubject.next([]);
          return EMPTY;
        })
      )
      .subscribe(({ count, page }) => {
        const nextAlerts = dedupeAlerts(filterVisibleAlerts(page.content ?? []));
        this.publishToastNotifications(nextAlerts);
        this.unreadCountSubject.next(count);
        this.recentUnreadSubject.next(nextAlerts);
        this.initialized = true;
      });
  }

  get unreadCountSnapshot(): number {
    return this.unreadCountSubject.value;
  }

  get recentUnreadSnapshot(): AlertResponse[] {
    return this.recentUnreadSubject.value;
  }

  private publishToastNotifications(nextAlerts: AlertResponse[]): void {
    if (!this.initialized) {
      return;
    }

    const existingIds = new Set(this.recentUnreadSubject.value.map((alert) => alert.alertId));
    const freshAlerts = nextAlerts
      .filter((alert) => !existingIds.has(alert.alertId))
      .sort((left, right) => (left.createdAt ?? '').localeCompare(right.createdAt ?? ''));

    for (const alert of freshAlerts) {
      const message = truncateAlertMessage(getAlertDisplayMessage(alert), 140);
      if (alert.severity === 'CRITICAL') {
        this.notifications.error(message, alert.title);
        continue;
      }

      if (alert.severity === 'WARNING') {
        this.notifications.warning(message, alert.title);
        continue;
      }

      this.notifications.info(message, alert.title);
    }
  }
}

function dedupeAlerts(alerts: AlertResponse[]): AlertResponse[] {
  const byId = new Map<number, AlertResponse>();
  for (const alert of alerts) {
    byId.set(alert.alertId, alert);
  }
  return [...byId.values()];
}
