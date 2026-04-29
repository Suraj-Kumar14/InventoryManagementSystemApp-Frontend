import { CommonModule } from '@angular/common';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Component, Injectable, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Routes } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { AlertRequest, AlertResponse } from '../../../core/http/backend.models';
import { AuthService } from '../../../core/auth/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { API_ENDPOINTS, UserRole } from '../../../shared/config/app-config';
import { environment } from '../../../../environments/environment';
import { roleGuard } from '../../../core/guards/role.guard';

@Injectable({ providedIn: 'root' })
class AlertsService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;
  getRecent(days: number) {
    const params = new HttpParams().set('days', days);
    return this.http.get<AlertResponse[]>(`${this.baseUrl}${API_ENDPOINTS.ALERTS.RECENT}`, { params });
  }
  getUnread(recipientId: number) {
    return this.http.get<AlertResponse[]>(`${this.baseUrl}${API_ENDPOINTS.ALERTS.UNREAD(recipientId)}`);
  }
  create(payload: AlertRequest) {
    return this.http.post<AlertResponse>(`${this.baseUrl}${API_ENDPOINTS.ALERTS.ROOT}`, payload);
  }
  markRead(id: number) {
    return this.http.put(`${this.baseUrl}${API_ENDPOINTS.ALERTS.MARK_READ(id)}`, {}, { responseType: 'text' });
  }
}

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './alerts-page.component.html',
  styleUrls: ['./alerts-page.component.css'],
})
class AlertsPageComponent {
  private service = inject(AlertsService);
  private auth = inject(AuthService);
  private fb = inject(FormBuilder);
  private notifications = inject(NotificationService);

  alerts: AlertResponse[] = [];
  loading = false;
  saving = false;
  actionId: number | null = null;
  readonly canManage = this.auth.hasRole([UserRole.ADMIN, UserRole.MANAGER]);

  form = this.fb.nonNullable.group({
    recipientId: [0, [Validators.required, Validators.min(1)]],
    type: ['', Validators.required],
    severity: ['', Validators.required],
    title: ['', Validators.required],
    message: ['', Validators.required],
  });

  constructor() { this.loadUnread(); }

  loadUnread(): void {
    const userId = this.auth.getUserId();
    if (!userId) { this.alerts = []; return; }
    this.loading = true;
    this.service.getUnread(userId).pipe(finalize(() => (this.loading = false))).subscribe({
      next: (alerts) => (this.alerts = alerts),
      error: () => (this.alerts = []),
    });
  }

  loadRecent(): void {
    this.loading = true;
    this.service.getRecent(7).pipe(finalize(() => (this.loading = false))).subscribe({
      next: (alerts: AlertResponse[]) => (this.alerts = alerts),
      error: () => (this.alerts = []),
    });
  }

  create(): void {
    if (this.form.invalid || !this.canManage) return;
    this.saving = true;
    const payload: AlertRequest = { ...this.form.getRawValue(), channel: 'IN_APP' };
    this.service.create(payload).pipe(finalize(() => (this.saving = false))).subscribe({
      next: () => {
        this.notifications.success('Alert created successfully.');
        this.form.reset({ recipientId: 0, type: '', severity: '', title: '', message: '' });
        this.loadRecent();
      },
    });
  }

  markRead(alert: AlertResponse): void {
    this.actionId = alert.alertId;
    this.service.markRead(alert.alertId).pipe(finalize(() => (this.actionId = null))).subscribe({
      next: () => { this.notifications.success('Alert marked as read.'); this.loadUnread(); },
    });
  }
}

export const alertsRoutes: Routes = [
  { path: '', component: AlertsPageComponent, canActivate: [roleGuard], data: { roles: [UserRole.ADMIN, UserRole.MANAGER] } },
];