import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { SkeletonLoaderComponent } from '../../../../shared/components/skeleton-loader/skeleton-loader.component';
import { ReportEmptyStateComponent } from '../../../reports/components/report-empty-state.component';
import { ReportKpiCardComponent } from '../../../reports/components/report-kpi-card.component';
import { PurchaseOfficerDashboardView, PurchaseOfficerKpiCard } from '../../models/purchase-officer-dashboard.model';
import { PurchaseOfficerDashboardApiService } from '../../services/purchase-officer-dashboard-api.service';

@Component({
  selector: 'app-purchase-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, CurrencyPipe, DatePipe, ButtonComponent, SkeletonLoaderComponent, ReportKpiCardComponent, ReportEmptyStateComponent],
  templateUrl: './purchase-dashboard.component.html',
  styleUrls: ['./purchase-dashboard.component.css'],
})
export class PurchaseDashboardComponent implements OnInit {
  private readonly dashboardApi = inject(PurchaseOfficerDashboardApiService);
  private readonly notifications = inject(NotificationService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);

  loading = true;
  refreshing = false;
  actionLoading: 'create' | 'suppliers' | null = null;
  view: PurchaseOfficerDashboardView | null = null;

  ngOnInit(): void {
    this.load(true);
  }

  get greetingName(): string {
    const user = this.authService.getCurrentUser();
    return this.authService.getFirstName(user?.name, user?.email);
  }

  get kpis(): PurchaseOfficerKpiCard[] {
    if (!this.view?.overview) {
      return [];
    }

    const overview = this.view.overview;
    const cards: PurchaseOfficerKpiCard[] = [
      { title: 'Total Purchase Orders', value: overview.totalPurchaseOrders, subtitle: 'Current procurement pipeline', icon: 'bi bi-cart3', route: '/purchase-orders' },
      { title: 'Draft POs', value: overview.draftPurchaseOrders, subtitle: 'Still being prepared', icon: 'bi bi-file-earmark-text', route: '/purchase-orders' },
      { title: 'Pending Approval POs', value: overview.pendingApprovalPurchaseOrders, subtitle: 'Waiting for manager review', icon: 'bi bi-hourglass-split', route: '/purchase-orders', severity: 'warning' },
      { title: 'Approved POs', value: overview.approvedPurchaseOrders, subtitle: 'Ready or partially received', icon: 'bi bi-patch-check', route: '/purchase-orders' },
      { title: 'Received POs', value: overview.receivedPurchaseOrders, subtitle: 'Fully received orders', icon: 'bi bi-box-arrow-in-down', route: '/purchase-orders' },
      { title: 'Overdue Receipts', value: overview.overduePurchaseOrders, subtitle: 'Needs supplier follow-up', icon: 'bi bi-calendar-x', route: '/purchase-orders/overdue', severity: 'critical' },
      { title: 'Total Purchase Value', value: this.formatCurrency(overview.totalPurchaseValue), subtitle: 'Approved and pending spend', icon: 'bi bi-cash-stack', route: '/reports/purchase/summary' },
      { title: 'Active Suppliers', value: overview.activeSuppliers, subtitle: 'Available sourcing partners', icon: 'bi bi-truck', route: '/suppliers' },
    ];

    if (this.view.paymentSectionEnabled) {
      cards.push({
        title: 'Pending Payments',
        value: overview.pendingPayments,
        subtitle: 'Awaiting payment progression',
        icon: 'bi bi-credit-card-2-front',
        route: '/payments',
      });
    }

    return cards;
  }

  get recentAlerts() {
    return this.view?.recentAlerts ?? [];
  }

  get paymentSectionVisible(): boolean {
    return !!this.view?.paymentSectionEnabled;
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

  openCreatePurchaseOrder(): void {
    this.actionLoading = 'create';
    void this.router.navigate(['/purchase-orders/create']).finally(() => {
      this.actionLoading = null;
    });
  }

  openSuppliers(): void {
    this.actionLoading = 'suppliers';
    void this.router.navigate(['/suppliers']).finally(() => {
      this.actionLoading = null;
    });
  }

  openRoute(route: string | undefined): void {
    if (!route) {
      return;
    }

    void this.router.navigate([route]);
  }

  sectionError(key: keyof NonNullable<PurchaseOfficerDashboardView['sectionErrors']>): string | null {
    return this.view?.sectionErrors[key] ?? null;
  }

  trackByTitle(_: number, item: PurchaseOfficerKpiCard): string {
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
