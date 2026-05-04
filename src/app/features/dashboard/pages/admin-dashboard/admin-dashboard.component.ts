import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { SkeletonLoaderComponent } from '../../../../shared/components/skeleton-loader/skeleton-loader.component';
import { UserRole } from '../../../../shared/config/app-config';
import { ReportEmptyStateComponent } from '../../../reports/components/report-empty-state.component';
import { ReportKpiCardComponent } from '../../../reports/components/report-kpi-card.component';
import { AdminDashboardKpiCard, AdminDashboardView, DashboardQuickAction } from '../../models/admin-dashboard.model';
import { AdminDashboardApiService } from '../../services/admin-dashboard-api.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, CurrencyPipe, DatePipe, ButtonComponent, SkeletonLoaderComponent, ReportKpiCardComponent, ReportEmptyStateComponent],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css'],
})
export class AdminDashboardComponent implements OnInit {
  readonly dashboardApi = inject(AdminDashboardApiService);
  private readonly notifications = inject(NotificationService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  loading = true;
  refreshing = false;
  actionLoading: 'broadcast' | 'reports' | null = null;
  view: AdminDashboardView | null = null;

  readonly quickActions: DashboardQuickAction[] = [
    { label: 'User Management', route: '/admin/users', icon: 'bi bi-people', allowedRoles: [UserRole.ADMIN] },
    { label: 'Manage Warehouses', route: '/admin/warehouses', icon: 'bi bi-building', allowedRoles: [UserRole.ADMIN] },
    { label: 'Broadcast Alert', route: '/alerts/broadcast', icon: 'bi bi-megaphone', allowedRoles: [UserRole.ADMIN] },
    { label: 'Executive Reports', route: '/reports/executive', icon: 'bi bi-graph-up-arrow', allowedRoles: [UserRole.ADMIN] },
  ];

  ngOnInit(): void {
    this.load(true);
  }

  get greetingName(): string {
    const user = this.authService.getCurrentUser();
    return this.authService.getFirstName(user?.name, user?.email);
  }

  get kpis(): AdminDashboardKpiCard[] {
    if (!this.view?.executive) {
      return [];
    }

    const executive = this.view.executive;
    const activeUsers = this.view.userSummary?.activeUsers ?? '-';

    return [
      { title: 'Total Products', value: executive.totalProducts, subtitle: 'Catalog breadth', icon: 'bi bi-box-seam', route: '/products' },
      { title: 'Total Warehouses', value: executive.totalWarehouses, subtitle: 'Configured storage nodes', icon: 'bi bi-building', route: '/warehouses' },
      { title: 'Inventory Value', value: this.formatCurrency(executive.totalInventoryValue), subtitle: 'Current stock valuation', icon: 'bi bi-cash-stack', route: '/reports/inventory/valuation' },
      { title: 'Low Stock Items', value: executive.lowStockCount, subtitle: 'Needs replenishment', icon: 'bi bi-exclamation-triangle', route: '/reports/inventory/low-stock', severity: 'warning' },
      { title: 'Overstock Items', value: executive.overstockCount, subtitle: 'Above max level', icon: 'bi bi-boxes', route: '/reports/inventory/overstock' },
      { title: 'Pending PO Approvals', value: executive.pendingPurchaseApprovals, subtitle: 'Waiting for action', icon: 'bi bi-hourglass-split', route: '/purchase-orders' },
      { title: 'Overdue Purchase Orders', value: executive.overduePurchaseOrders, subtitle: 'Delayed inbound supply', icon: 'bi bi-calendar-x', route: '/reports/purchase/summary', severity: 'warning' },
      { title: 'Total Purchase Value', value: this.formatCurrency(executive.totalPurchaseValue), subtitle: 'Procurement spend window', icon: 'bi bi-receipt', route: '/reports/purchase/summary' },
      { title: 'Total Paid Amount', value: this.formatCurrency(executive.totalPaidAmount), subtitle: 'Released payments', icon: 'bi bi-credit-card-2-front', route: '/payments' },
      { title: 'Active Users', value: activeUsers, subtitle: 'Currently enabled accounts', icon: 'bi bi-people-fill', route: '/admin/users' },
    ];
  }

  get userRoleBreakdown() {
    return this.view?.userSummary?.usersByRole ? Object.entries(this.view.userSummary.usersByRole) : [];
  }

  get hasPaymentSection(): boolean {
    return !!this.view?.paymentSummary && !this.view.sectionErrors.payments;
  }

  load(initial = false): void {
    if (initial) {
      this.loading = true;
    } else {
      this.refreshing = true;
    }

    this.dashboardApi
      .refreshDashboard()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.loading = false;
          this.refreshing = false;
          this.syncView();
        })
      )
      .subscribe({
        next: (view) => {
          this.view = view;
          if (!initial && Object.keys(view.sectionErrors).length === 0) {
            this.notifications.success('Dashboard refreshed successfully');
          } else if (!initial && Object.keys(view.sectionErrors).length > 0) {
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

  openBroadcastAlert(): void {
    this.actionLoading = 'broadcast';
    void this.router.navigate(['/alerts/broadcast']).finally(() => {
      this.actionLoading = null;
    });
  }

  openExecutiveReports(): void {
    this.actionLoading = 'reports';
    void this.router.navigate(['/reports/executive']).finally(() => {
      this.actionLoading = null;
    });
  }

  openRoute(route: string | undefined): void {
    if (!route) {
      return;
    }
    void this.router.navigate([route]);
  }

  sectionError(key: keyof NonNullable<AdminDashboardView['sectionErrors']>): string | null {
    return this.view?.sectionErrors[key] ?? null;
  }

  trackByTitle(_: number, item: AdminDashboardKpiCard): string {
    return item.title;
  }

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value ?? 0);
  }

  private syncView(): void {
    if (!this.destroyRef.destroyed) {
      this.cdr.detectChanges();
    }
  }
}
