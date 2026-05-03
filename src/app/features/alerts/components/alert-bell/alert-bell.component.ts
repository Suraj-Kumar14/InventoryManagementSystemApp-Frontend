import { CommonModule, DatePipe } from '@angular/common';
import { Component, HostListener, OnDestroy, OnInit, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Subscription, forkJoin, timer } from 'rxjs';
import { AlertResponse } from '../../../../core/http/backend.models';
import { NotificationService } from '../../../../core/services/notification.service';
import { AlertApiService } from '../../services/alert-api.service';
import { AlertSeverityBadgeComponent } from '../alert-severity-badge/alert-severity-badge.component';

@Component({
  selector: 'app-alert-bell',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe, AlertSeverityBadgeComponent],
  template: `
    <div class="alert-bell" (click)="$event.stopPropagation()">
      <button class="alert-bell__button" type="button" (click)="toggleDropdown()">
        <i class="bi bi-bell"></i>
        <span *ngIf="unreadCount > 0" class="alert-bell__count">{{ unreadCount > 99 ? '99+' : unreadCount }}</span>
      </button>

      <section *ngIf="dropdownOpen" class="alert-bell__dropdown">
        <header class="alert-bell__header">
          <strong>Alerts</strong>
          <button type="button" class="alert-bell__link" (click)="markAllRead()" [disabled]="markingAll">
            {{ markingAll ? 'Marking...' : 'Mark all read' }}
          </button>
        </header>

        <div *ngIf="loading" class="alert-bell__empty">Loading alerts...</div>
        <div *ngIf="!loading && recentAlerts.length === 0" class="alert-bell__empty">No unread alerts.</div>

        <button *ngFor="let alert of recentAlerts" type="button" class="alert-bell__item" (click)="openAlert(alert)">
          <div class="alert-bell__item-top">
            <app-alert-severity-badge [severity]="alert.severity"></app-alert-severity-badge>
            <span class="alert-bell__date">{{ alert.createdAt | date:'MMM d, h:mm a' }}</span>
          </div>
          <strong>{{ alert.title }}</strong>
          <p>{{ alert.message }}</p>
        </button>

        <a routerLink="/alerts" class="alert-bell__footer-link" (click)="dropdownOpen = false">View all alerts</a>
      </section>
    </div>
  `,
  styles: [`
    .alert-bell { position:relative; }
    .alert-bell__button { position:relative; width:42px; height:42px; border-radius:50%; border:1px solid #dbe4f0; background:#fff; color:#0f172a; cursor:pointer; }
    .alert-bell__count { position:absolute; right:-4px; top:-2px; background:#dc2626; color:#fff; border-radius:999px; min-width:20px; height:20px; display:flex; align-items:center; justify-content:center; font-size:0.7rem; font-weight:700; padding:0 0.3rem; }
    .alert-bell__dropdown { position:absolute; right:0; top:calc(100% + 10px); width:360px; max-width:calc(100vw - 2rem); background:#fff; border:1px solid #dbe4f0; border-radius:18px; box-shadow:0 25px 50px rgba(15,23,42,0.16); overflow:hidden; z-index:70; }
    .alert-bell__header, .alert-bell__footer-link { padding:0.95rem 1rem; display:flex; justify-content:space-between; align-items:center; }
    .alert-bell__link, .alert-bell__footer-link { color:#2563eb; font-size:0.85rem; background:none; border:none; text-decoration:none; cursor:pointer; }
    .alert-bell__item { width:100%; text-align:left; border:none; border-top:1px solid #edf2f7; background:#fff; padding:0.9rem 1rem; cursor:pointer; }
    .alert-bell__item:hover { background:#f8fbff; }
    .alert-bell__item-top { display:flex; justify-content:space-between; align-items:center; margin-bottom:0.55rem; gap:0.75rem; }
    .alert-bell__item strong { display:block; font-size:0.95rem; color:#0f172a; margin-bottom:0.3rem; }
    .alert-bell__item p { margin:0; color:#64748b; font-size:0.82rem; line-height:1.4; }
    .alert-bell__date { color:#94a3b8; font-size:0.72rem; }
    .alert-bell__empty { padding:1.2rem 1rem; color:#64748b; }
  `],
})
export class AlertBellComponent implements OnInit, OnDestroy {
  private readonly alertApi = inject(AlertApiService);
  private readonly router = inject(Router);
  private readonly notification = inject(NotificationService);
  private pollSubscription?: Subscription;

  unreadCount = 0;
  recentAlerts: AlertResponse[] = [];
  dropdownOpen = false;
  loading = false;
  markingAll = false;

  ngOnInit(): void {
    this.pollSubscription = timer(0, 60000).subscribe(() => this.refresh());
  }

  ngOnDestroy(): void {
    this.pollSubscription?.unsubscribe();
  }

  @HostListener('document:click')
  close(): void {
    this.dropdownOpen = false;
  }

  toggleDropdown(): void {
    this.dropdownOpen = !this.dropdownOpen;
    if (this.dropdownOpen) {
      this.refresh();
    }
  }

  openAlert(alert: AlertResponse): void {
    this.alertApi.markAsRead(alert.alertId).subscribe({
      next: () => {
        this.dropdownOpen = false;
        this.refresh();
        this.router.navigate([alert.actionUrl || `/alerts/${alert.alertId}`]);
      },
      error: () => this.notification.error('Unable to open this alert right now. Please try again.'),
    });
  }

  markAllRead(): void {
    this.markingAll = true;
    this.alertApi.markAllAsRead().subscribe({
      next: () => {
        this.markingAll = false;
        this.notification.success('All alerts marked as read');
        this.refresh();
      },
      error: () => (this.markingAll = false),
    });
  }

  private refresh(): void {
    this.loading = true;
    forkJoin({
      count: this.alertApi.getUnreadCount(),
      page: this.alertApi.getMyAlerts({ page: 0, size: 5, isRead: false, sortBy: 'createdAt', sortDir: 'desc' }),
    }).subscribe({
      next: ({ count, page }) => {
        this.unreadCount = count;
        this.recentAlerts = page.content;
        this.loading = false;
      },
      error: () => {
        this.unreadCount = 0;
        this.recentAlerts = [];
        this.loading = false;
      },
    });
  }
}
