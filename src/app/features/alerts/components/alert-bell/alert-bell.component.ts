import { CommonModule, DatePipe } from '@angular/common';
import { Component, HostListener, OnDestroy, OnInit, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { AlertResponse } from '../../../../core/http/backend.models';
import { NotificationService } from '../../../../core/services/notification.service';
import { AlertApiService } from '../../services/alert-api.service';
import { AlertStateService } from '../../services/alert-state.service';
import { getAlertDisplayMessage, truncateAlertMessage } from '../../utils/alert-display.util';
import { filterVisibleAlerts, resolveAlertWorkflowRoute } from '../../utils/alert-visibility.util';
import { AlertSeverityBadgeComponent } from '../alert-severity-badge/alert-severity-badge.component';

@Component({
  selector: 'app-alert-bell',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe, AlertSeverityBadgeComponent],
  template: `
    <div class="alert-bell" (click)="$event.stopPropagation()">
      <button class="alert-bell__button" type="button" aria-label="View alerts" (click)="toggleDropdown()">
        <svg class="alert-bell__icon" viewBox="0 0 128 128" role="img" aria-hidden="true" focusable="false">
          <path class="alert-bell__ring-line" d="M28 36c-9 7-14 18-14 30" />
          <path class="alert-bell__ring-line" d="M41 44c-5 5-8 12-8 20" />
          <path class="alert-bell__ring-line" d="M100 36c9 7 14 18 14 30" />
          <path class="alert-bell__ring-line" d="M87 44c5 5 8 12 8 20" />
          <path class="alert-bell__body" d="M64 22c-17 0-30 14-30 33v18c0 7-4 13-10 16-3 2-2 7 2 7h76c4 0 5-5 2-7-6-3-10-9-10-16V55c0-19-13-33-30-33Z" />
          <path class="alert-bell__body" d="M55 18c0-5 4-9 9-9s9 4 9 9v4H55v-4Z" />
          <path class="alert-bell__shadow" d="M39 78h50" />
          <circle class="alert-bell__clapper" cx="64" cy="103" r="10" />
        </svg>
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
          <p>{{ previewMessage(alert) }}</p>
        </button>

        <a routerLink="/alerts" class="alert-bell__footer-link" (click)="dropdownOpen = false">View all alerts</a>
      </section>
    </div>
  `,
  styles: [`
    .alert-bell { position:relative; }
    .alert-bell__button { position:relative; display:inline-flex; align-items:center; justify-content:center; width:46px; height:46px; border-radius:50%; border:1px solid #dbe4f0; background:#fff; color:#f4b400; cursor:pointer; transition:transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease; }
    .alert-bell__button:hover { transform:translateY(-1px); border-color:#f3cf72; box-shadow:0 10px 22px rgba(15,23,42,0.1); }
    .alert-bell__button:focus-visible { outline:3px solid rgba(244,180,0,0.32); outline-offset:3px; }
    .alert-bell__icon { width:32px; height:32px; display:block; transform-origin:50% 18%; }
    .alert-bell__button:hover .alert-bell__icon { animation:alertBellRing 0.55s ease-in-out; }
    .alert-bell__body, .alert-bell__clapper { fill:#f4b400; }
    .alert-bell__ring-line { fill:none; stroke:#f4b400; stroke-width:7; stroke-linecap:round; stroke-linejoin:round; }
    .alert-bell__shadow { fill:none; stroke:#e0a300; stroke-width:5; stroke-linecap:round; opacity:0.45; }
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
    @keyframes alertBellRing {
      0%, 100% { transform:rotate(0deg); }
      20% { transform:rotate(-8deg); }
      40% { transform:rotate(8deg); }
      60% { transform:rotate(-5deg); }
      80% { transform:rotate(5deg); }
    }
  `],
})
export class AlertBellComponent implements OnInit, OnDestroy {
  private readonly alertApi = inject(AlertApiService);
  private readonly alertState = inject(AlertStateService);
  private readonly router = inject(Router);
  private readonly notification = inject(NotificationService);
  private readonly subscriptions = new Subscription();

  unreadCount = 0;
  recentAlerts: AlertResponse[] = [];
  dropdownOpen = false;
  loading = false;
  markingAll = false;

  ngOnInit(): void {
    this.alertState.startPolling();
    this.subscriptions.add(this.alertState.unreadCount$.subscribe((count) => (this.unreadCount = count)));
    this.subscriptions.add(this.alertState.recentUnreadAlerts$.subscribe((alerts) => {
      this.recentAlerts = filterVisibleAlerts(alerts);
      this.loading = false;
    }));
    this.alertState.refresh();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  @HostListener('document:click')
  close(): void {
    this.dropdownOpen = false;
  }

  toggleDropdown(): void {
    this.dropdownOpen = !this.dropdownOpen;
    if (this.dropdownOpen) {
      this.loading = true;
      this.alertState.refresh();
    }
  }

  openAlert(alert: AlertResponse): void {
    this.alertApi.markAsRead(alert.alertId).subscribe({
      next: () => {
        this.dropdownOpen = false;
        this.alertState.refresh();
        void this.router.navigateByUrl(resolveAlertWorkflowRoute(alert) || `/alerts/${alert.alertId}`);
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
        this.alertState.refresh();
      },
      error: () => (this.markingAll = false),
    });
  }

  previewMessage(alert: AlertResponse): string {
    return truncateAlertMessage(getAlertDisplayMessage(alert), 110);
  }
}
