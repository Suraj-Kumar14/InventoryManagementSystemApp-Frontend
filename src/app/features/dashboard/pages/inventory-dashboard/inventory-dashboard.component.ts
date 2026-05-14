import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { SkeletonLoaderComponent } from '../../../../shared/components/skeleton-loader/skeleton-loader.component';
import { AlertStateService } from '../../../alerts/services/alert-state.service';
import { ReportEmptyStateComponent } from '../../../reports/components/report-empty-state.component';
import { ReportKpiCardComponent } from '../../../reports/components/report-kpi-card.component';
import { InventoryManagerDashboardApiService } from '../../services/inventory-manager-dashboard-api.service';
import { InventoryManagerDashboardView, InventoryManagerKpiCard } from '../../models/inventory-manager-dashboard.model';

@Component({
  selector: 'app-inventory-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, DatePipe, ButtonComponent, SkeletonLoaderComponent, ReportKpiCardComponent, ReportEmptyStateComponent],
  templateUrl: './inventory-dashboard.component.html',
  styleUrls: ['./inventory-dashboard.component.css'],
})
export class InventoryDashboardComponent implements OnInit {
  private readonly dashboardApi = inject(InventoryManagerDashboardApiService);
  private readonly notifications = inject(NotificationService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly alertState = inject(AlertStateService);

  loading = true;
  refreshing = false;
  actionLoading: 'alerts' | 'reports' | 'acknowledge' | null = null;
  view: InventoryManagerDashboardView | null = null;

  ngOnInit(): void {
    this.load(true);
  }

  get greetingName(): string {
    const user = this.authService.getCurrentUser();
    return this.authService.getFirstName(user?.name, user?.email);
  }

  get kpis(): InventoryManagerKpiCard[] {
    if (!this.view?.overview) {
      return [];
    }

    const overview = this.view.overview;

    return [
      { title: 'Total Products', value: overview.totalProducts, subtitle: 'Catalog footprint', icon: 'bi bi-box-seam', route: '/products' },
      { title: 'Active Products', value: overview.activeProducts, subtitle: 'Ready for operations', icon: 'bi bi-check-circle', route: '/products?status=active' },
      { title: 'Total Warehouses', value: overview.totalWarehouses, subtitle: 'Visible storage nodes', icon: 'bi bi-building', route: '/warehouses' },
      { title: 'Inventory Value', value: this.formatCurrency(overview.totalInventoryValue), subtitle: 'Current stock valuation', icon: 'bi bi-cash-stack', route: '/reports/inventory/valuation' },
      { title: 'Low Stock Items', value: overview.lowStockCount, subtitle: 'Needs replenishment', icon: 'bi bi-exclamation-triangle', route: '/reports/inventory/low-stock', severity: 'warning' },
      { title: 'Overstock Items', value: overview.overstockCount, subtitle: 'Above max threshold', icon: 'bi bi-boxes', route: '/reports/inventory/overstock' },
      { title: 'Out of Stock Items', value: overview.outOfStockCount, subtitle: 'Unavailable now', icon: 'bi bi-slash-circle', route: '/reports/inventory/product-stock?filter=out-of-stock', severity: 'critical' },
      { title: 'Pending PO Approvals', value: overview.pendingPurchaseApprovals, subtitle: 'Waiting for manager action', icon: 'bi bi-hourglass-split', route: '/purchase-orders/approvals' },
    ];
  }

  get primaryAlertActionable() {
    return this.view?.recentAlerts.find((alert) => !alert.isAcknowledged) ?? null;
  }

  get criticalAlerts() {
    return (this.view?.recentAlerts ?? []).filter((alert) => alert.severity === 'CRITICAL').slice(0, 3);
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

  openInventoryReports(): void {
    this.actionLoading = 'reports';
    void this.router.navigate(['/reports/inventory/valuation']).finally(() => {
      this.actionLoading = null;
    });
  }

  openAlerts(): void {
    this.actionLoading = 'alerts';
    void this.router.navigate(['/alerts']).finally(() => {
      this.actionLoading = null;
    });
  }

  acknowledgePrimaryAlert(): void {
    const alert = this.primaryAlertActionable;
    if (!alert) {
      return;
    }

    this.actionLoading = 'acknowledge';
    this.dashboardApi
      .acknowledgeAlert(alert.alertId)
      .pipe(finalize(() => (this.actionLoading = null)))
      .subscribe({
        next: () => {
          this.notifications.success('Alert acknowledged successfully');
          this.alertState.refresh();
          this.load();
        },
        error: () => this.notifications.error('Unable to acknowledge alert'),
      });
  }

  openRoute(route: string | undefined): void {
    if (!route) {
      return;
    }

    void this.router.navigateByUrl(route);
  }

  readonly productShortcuts = [
    {
      title: 'Manage Products',
      description: 'Open the complete product catalog and maintenance page.',
      route: '/products',
    },
    {
      title: 'Add Product',
      description: 'Create a new product without leaving the manager workflow.',
      route: '/products/create',
    },
    {
      title: 'Barcode Lookup',
      description: 'Find products quickly using existing barcode lookup tools.',
      route: '/products/barcode-lookup',
    },
    {
      title: 'Product Reports',
      description: 'Open the product stock report for category and stock analysis.',
      route: '/reports/inventory/product-stock',
    },
  ];

  sectionError(key: keyof NonNullable<InventoryManagerDashboardView['sectionErrors']>): string | null {
    return this.view?.sectionErrors[key] ?? null;
  }

  trackByTitle(_: number, item: InventoryManagerKpiCard): string {
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
