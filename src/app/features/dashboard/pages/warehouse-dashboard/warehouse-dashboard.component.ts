import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { SkeletonLoaderComponent } from '../../../../shared/components/skeleton-loader/skeleton-loader.component';
import { AlertSeverityBadgeComponent } from '../../../alerts/components/alert-severity-badge/alert-severity-badge.component';
import { AlertTypeBadgeComponent } from '../../../alerts/components/alert-type-badge/alert-type-badge.component';
import { AlertStateService } from '../../../alerts/services/alert-state.service';
import { ReportEmptyStateComponent } from '../../../reports/components/report-empty-state.component';
import { ReportKpiCardComponent } from '../../../reports/components/report-kpi-card.component';
import {
  KpiCard,
  RecentAlert,
  WarehouseStaffDashboardSectionKey,
  WarehouseStaffDashboardView,
} from '../../models/warehouse-staff-dashboard.model';
import { WarehouseStaffDashboardApiService } from '../../services/warehouse-staff-dashboard-api.service';

type HeaderActionKey =
  | 'refresh'
  | 'barcode'
  | 'receive'
  | 'stock'
  | 'issue'
  | 'transfer'
  | 'adjustment'
  | 'cycle'
  | 'reports';

@Component({
  selector: 'app-warehouse-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    ButtonComponent,
    SkeletonLoaderComponent,
    ReportEmptyStateComponent,
    ReportKpiCardComponent,
    AlertSeverityBadgeComponent,
    AlertTypeBadgeComponent,
  ],
  templateUrl: './warehouse-dashboard.component.html',
  styleUrls: ['./warehouse-dashboard.component.css'],
})
export class WarehouseDashboardComponent implements OnInit {
  private readonly dashboardApi = inject(WarehouseStaffDashboardApiService);
  private readonly notifications = inject(NotificationService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly alertState = inject(AlertStateService);

  loading = true;
  refreshing = false;
  headerActionLoading: HeaderActionKey | null = null;
  alertActionLoading: { id: number; action: 'ack' | 'dismiss' } | null = null;
  view: WarehouseStaffDashboardView | null = null;
  readonly currentDate = new Date();

  ngOnInit(): void {
    this.load(true);
  }

  get greetingName(): string {
    const user = this.authService.getCurrentUser();
    return this.authService.getFirstName(user?.name, user?.email);
  }

  get assignedWarehouseLabel(): string {
    const overview = this.view?.overview;
    if (!overview?.assignedWarehouseId) {
      return 'Assigned warehouse not configured';
    }

    return overview.assignedWarehouseCode
      ? `${overview.assignedWarehouseName} (${overview.assignedWarehouseCode})`
      : overview.assignedWarehouseName ?? 'Assigned warehouse';
  }

  get kpis(): KpiCard[] {
    return this.view?.kpis ?? [];
  }

  load(initial = false): void {
    if (initial) {
      this.loading = true;
    } else {
      this.refreshing = true;
      this.headerActionLoading = 'refresh';
    }

    this.dashboardApi
      .refreshDashboard()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.loading = false;
          this.refreshing = false;
          if (this.headerActionLoading === 'refresh') {
            this.headerActionLoading = null;
          }
          this.syncView();
        })
      )
      .subscribe({
        next: (view) => {
          this.view = view;
          if (!initial && Object.keys(view.sectionErrors).length === 0) {
            this.notifications.success('Dashboard refreshed successfully');
          } else if (!initial) {
            this.notifications.warning('Some dashboard sections could not be loaded');
          }
          this.syncView();
        },
        error: () => {
          this.view = null;
          this.notifications.error('Unable to load dashboard summary');
          this.syncView();
        },
      });
  }

  openBarcodeLookup(): void {
    this.navigateWithLoading('barcode', '/products/barcode-lookup');
  }

  openReceiveGoods(): void {
    this.navigateWithLoading('receive', '/purchase-orders');
  }

  openStockWorkspace(route = '/inventory/stock'): void {
    this.navigateWithLoading('stock', route);
  }

  openIssueStock(): void {
    this.navigateWithLoading('issue', '/inventory/stock');
  }

  openTransferStock(): void {
    this.navigateWithLoading('transfer', '/inventory/stock');
  }

  openAdjustmentStock(): void {
    this.navigateWithLoading('adjustment', '/inventory/stock');
  }

  openCycleCount(): void {
    this.navigateWithLoading('cycle', '/inventory/stock');
  }

  openReports(): void {
    this.navigateWithLoading('reports', '/reports/inventory/warehouse-stock');
  }

  openRoute(route: string | undefined): void {
    if (!route) {
      return;
    }

    void this.router.navigateByUrl(route);
  }

  acknowledgeAlert(alert: RecentAlert): void {
    this.alertActionLoading = { id: alert.alertId, action: 'ack' };
    this.dashboardApi
      .acknowledgeAlert(alert.alertId)
      .pipe(finalize(() => (this.alertActionLoading = null)))
      .subscribe({
        next: () => {
          this.notifications.success('Alert acknowledged successfully');
          this.alertState.refresh();
          this.load();
        },
        error: () => this.notifications.error('Unable to load alerts'),
      });
  }

  dismissAlert(alert: RecentAlert): void {
    this.alertActionLoading = { id: alert.alertId, action: 'dismiss' };
    this.dashboardApi
      .dismissAlert(alert.alertId)
      .pipe(finalize(() => (this.alertActionLoading = null)))
      .subscribe({
        next: () => {
          this.notifications.success('Alert dismissed successfully');
          this.alertState.refresh();
          this.load();
        },
        error: () => this.notifications.error('Unable to load alerts'),
      });
  }

  sectionError(key: WarehouseStaffDashboardSectionKey): string | null {
    return this.view?.sectionErrors[key] ?? null;
  }

  sectionNotice(key: WarehouseStaffDashboardSectionKey): string | null {
    return this.view?.sectionNotices[key] ?? null;
  }

  isAlertActionLoading(alertId: number, action: 'ack' | 'dismiss'): boolean {
    return this.alertActionLoading?.id === alertId && this.alertActionLoading.action === action;
  }

  trackByTitle(_: number, item: KpiCard): string {
    return item.title;
  }

  private navigateWithLoading(key: HeaderActionKey, route: string): void {
    this.headerActionLoading = key;
    void this.router.navigate([route]).finally(() => {
      this.headerActionLoading = null;
    });
  }

  private syncView(): void {
    if (!this.destroyRef.destroyed) {
      this.cdr.detectChanges();
    }
  }
}
