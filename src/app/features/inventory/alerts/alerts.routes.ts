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
  template: `
    <section class="space-y-6">
      <div>
        <h1 class="text-3xl font-bold text-neutral-900">Alerts</h1>
        <p class="mt-2 text-neutral-600">View unread alerts for the signed-in user and create new alerts when your role allows it.</p>
      </div>

      <div class="flex gap-3">
        <button type="button" (click)="loadUnread()" [disabled]="loading" class="rounded-lg bg-primary-600 px-4 py-2 text-white disabled:opacity-50">Unread Alerts</button>
        <button type="button" (click)="loadRecent()" [disabled]="loading" class="rounded-lg border border-neutral-300 px-4 py-2">Recent Alerts</button>
      </div>

      <form *ngIf="canManage" [formGroup]="form" (ngSubmit)="create()" class="grid gap-4 rounded-xl border border-neutral-200 bg-white p-6 md:grid-cols-2">
        <input formControlName="recipientId" type="number" placeholder="Recipient ID" class="rounded-lg border border-neutral-300 px-4 py-2" />
        <input formControlName="type" placeholder="Alert type" class="rounded-lg border border-neutral-300 px-4 py-2" />
        <input formControlName="severity" placeholder="Severity" class="rounded-lg border border-neutral-300 px-4 py-2" />
        <input formControlName="title" placeholder="Title" class="rounded-lg border border-neutral-300 px-4 py-2" />
        <textarea formControlName="message" placeholder="Message" class="rounded-lg border border-neutral-300 px-4 py-2 md:col-span-2"></textarea>
        <button type="submit" [disabled]="form.invalid || saving" class="rounded-lg bg-primary-600 px-4 py-2 text-white disabled:opacity-50 md:col-span-2">
          {{ saving ? 'Creating...' : 'Create Alert' }}
        </button>
      </form>

      <div *ngIf="!canManage" class="rounded-xl border border-neutral-200 bg-warning-50 p-4 text-warning-800">
        Alert creation is available only for Inventory Managers and Admins.
      </div>

      <div *ngIf="loading" class="rounded-xl border border-neutral-200 bg-white p-6 text-neutral-600">Loading alerts...</div>
      <div *ngIf="!loading && alerts.length === 0" class="rounded-xl border border-dashed border-neutral-300 bg-white p-8 text-center text-neutral-600">No alerts returned by the backend.</div>
      <div *ngIf="!loading && alerts.length > 0" class="space-y-3">
        <article *ngFor="let alert of alerts" class="rounded-xl border border-neutral-200 bg-white p-5">
          <div class="flex items-start justify-between gap-4">
            <div>
              <h2 class="text-lg font-semibold text-neutral-900">{{ alert.title }}</h2>
              <p class="text-sm text-neutral-500">{{ alert.type }} • {{ alert.severity }} • Recipient {{ alert.recipientId }}</p>
              <p class="mt-3 text-neutral-700">{{ alert.message }}</p>
            </div>
            <button type="button" (click)="markRead(alert)" [disabled]="alert.isRead || actionId === alert.alertId" class="rounded-lg border border-neutral-300 px-3 py-2 disabled:opacity-50">
              {{ actionId === alert.alertId ? 'Working...' : alert.isRead ? 'Read' : 'Mark Read' }}
            </button>
          </div>
        </article>
      </div>
    </section>
  `,
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

  constructor() {
    this.loadUnread();
  }

  loadUnread(): void {
    const userId = this.auth.getUserId();
    if (!userId) {
      this.alerts = [];
      return;
    }

    this.loading = true;
    this.service.getUnread(userId).pipe(finalize(() => (this.loading = false))).subscribe({
      next: (alerts) => (this.alerts = alerts),
      error: () => (this.alerts = []),
    });
  }

  loadRecent(): void {
    this.loading = true;
    this.service.getRecent(7).pipe(finalize(() => (this.loading = false))).subscribe({
      next: (alerts) => (this.alerts = alerts),
      error: () => (this.alerts = []),
    });
  }

  create(): void {
    if (this.form.invalid || !this.canManage) {
      return;
    }

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
      next: () => {
        this.notifications.success('Alert marked as read.');
        this.loadUnread();
      },
    });
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
