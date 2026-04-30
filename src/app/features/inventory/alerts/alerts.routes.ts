import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Routes } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { AlertRequest, AlertResponse } from '../../../core/http/backend.models';
import { AuthService } from '../../../core/auth/services/auth.service';
import { AlertService } from '../../../core/services/alert.service';
import { NotificationService } from '../../../core/services/notification.service';
import { UserRole } from '../../../shared/config/app-config';
import { roleGuard } from '../../../core/guards/role.guard';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './alerts-page.component.html',
  styleUrls: ['./alerts-page.component.css'],
})
class AlertsPageComponent {
  private readonly service = inject(AlertService);
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly notifications = inject(NotificationService);

  alerts: AlertResponse[] = [];
  loading = false;
  saving = false;
  actionId: number | null = null;
  private activeView: 'all' | 'unread' | 'recent' = 'all';
  readonly canManage = this.auth.hasRole([UserRole.ADMIN, UserRole.MANAGER]);

  form = this.fb.nonNullable.group({
    recipientId: [0, [Validators.required, Validators.min(1)]],
    type: ['', Validators.required],
    severity: ['', Validators.required],
    title: ['', Validators.required],
    message: ['', Validators.required],
  });

  constructor() {
    this.loadAlerts();
  }

  loadAlerts(): void {
    const userId = this.auth.getUserId();
    if (!userId) {
      this.alerts = [];
      return;
    }

    this.activeView = 'all';
    this.loading = true;
    this.service
      .getAlertsByRecipient(userId)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (alerts) => (this.alerts = alerts),
        error: () => (this.alerts = []),
      });
  }

  loadUnread(): void {
    const userId = this.auth.getUserId();
    if (!userId) {
      this.alerts = [];
      return;
    }

    this.activeView = 'unread';
    this.loading = true;
    this.service
      .getUnreadAlerts(userId)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (alerts) => (this.alerts = alerts),
        error: () => (this.alerts = []),
      });
  }

  loadRecent(): void {
    this.activeView = 'recent';
    this.loading = true;
    this.service
      .getRecentAlerts(7)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (alerts) => (this.alerts = alerts),
        error: () => (this.alerts = []),
      });
  }

  create(): void {
    if (this.form.invalid || !this.canManage) {
      return;
    }

    this.saving = true;
    const payload: AlertRequest = {
      ...this.form.getRawValue(),
      channel: 'IN_APP',
    };

    this.service
      .createAlert(payload)
      .pipe(finalize(() => (this.saving = false)))
      .subscribe({
        next: () => {
          this.notifications.success('Alert created successfully.');
          this.form.reset({ recipientId: 0, type: '', severity: '', title: '', message: '' });
          this.loadRecent();
        },
      });
  }

  markRead(alert: AlertResponse): void {
    this.actionId = alert.alertId;
    this.service
      .markRead(alert.alertId)
      .pipe(finalize(() => (this.actionId = null)))
      .subscribe({
        next: () => {
          this.notifications.success('Alert marked as read.');
          this.reloadActiveView();
        },
      });
  }

  acknowledge(alert: AlertResponse): void {
    this.actionId = alert.alertId;
    this.service
      .acknowledgeAlert(alert.alertId)
      .pipe(finalize(() => (this.actionId = null)))
      .subscribe({
        next: () => {
          this.notifications.success('Alert acknowledged.');
          this.reloadActiveView();
        },
      });
  }

  private reloadActiveView(): void {
    switch (this.activeView) {
      case 'unread':
        this.loadUnread();
        break;
      case 'recent':
        this.loadRecent();
        break;
      default:
        this.loadAlerts();
        break;
    }
  }
}

export const alertsRoutes: Routes = [
  {
    path: '',
    component: AlertsPageComponent,
    canActivate: [roleGuard],
    data: { roles: [UserRole.ADMIN, UserRole.MANAGER] },
  },
];
