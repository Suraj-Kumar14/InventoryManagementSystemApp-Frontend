import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AlertService } from '../../../core/services/alert.service';
import { Alert, AlertSeverity } from '../../../core/models';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-alert-center',
  standalone: true,
  imports: [CommonModule, RouterLink, EmptyStateComponent],
  templateUrl: './alert-center.component.html',
  styleUrls: ['./alert-center.component.css']
})
export class AlertCenterComponent implements OnInit {
  alertSvc = inject(AlertService);
  toast    = inject(ToastService);

  alerts        = signal<Alert[]>([]);
  totalElements = signal(0);
  page          = signal(0);
  loading       = signal(true);
  unreadOnly    = signal(false);
  markingAll    = signal(false);

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.alertSvc.getMyAlerts(this.page(), 30, this.unreadOnly()).subscribe({
      next: r => { this.alerts.set(r.content); this.totalElements.set(r.totalElements); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  markRead(a: Alert): void {
    if (a.isRead) return;
    this.alertSvc.markAsRead(a.id).subscribe({
      next: () => { a.isRead = true; this.alerts.update(list => [...list]); },
      error: () => {}
    });
  }

  acknowledge(a: Alert): void {
    this.alertSvc.acknowledge(a.id).subscribe({
      next: () => {
        a.isAcknowledged = true;
        this.alerts.update(list => [...list]);
        this.toast.success('Alert acknowledged');
      },
      error: () => {}
    });
  }

  markAllRead(): void {
    this.markingAll.set(true);
    this.alertSvc.markAllRead().subscribe({
      next: () => {
        this.toast.success('All alerts marked as read');
        this.markingAll.set(false);
        this.load();
      },
      error: () => this.markingAll.set(false)
    });
  }

  toggleUnread(): void { this.unreadOnly.update(v => !v); this.page.set(0); this.load(); }

  getSeverityClass(sev: AlertSeverity): string {
    const map: Record<AlertSeverity, string> = { LOW: 'badge-gray', MEDIUM: 'badge-primary', HIGH: 'badge-warning', CRITICAL: 'badge-danger' };
    return map[sev];
  }

  getSeverityIcon(sev: AlertSeverity): string {
    const icons: Record<AlertSeverity, string> = { LOW: 'ℹ️', MEDIUM: '📌', HIGH: '⚠️', CRITICAL: '🚨' };
    return icons[sev];
  }

  loadMore(): void { this.page.update(p => p + 1); this.load(); }
}
