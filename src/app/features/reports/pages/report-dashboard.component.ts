import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { AuthService } from '../../../core/auth/services/auth.service';
import { ExecutiveDashboardReportResponse } from '../../../core/http/backend.models';
import { ReportService } from '../../../core/services/report.service';
import { NotificationService } from '../../../core/services/notification.service';
import { UserRole } from '../../../shared/config/app-config';
import { ReportEmptyStateComponent } from '../components/report-empty-state.component';
import { ReportExportButtonsComponent } from '../components/report-export-buttons.component';
import { ReportKpiCardComponent } from '../components/report-kpi-card.component';

@Component({
  standalone: true,
  imports: [CommonModule, RouterLink, CurrencyPipe, DatePipe, ReportKpiCardComponent, ReportEmptyStateComponent, ReportExportButtonsComponent],
  template: `
    <section class="report-page">
      <header class="hero">
        <div>
          <p class="eyebrow">Analytics Workspace</p>
          <h1>{{ isExecutive ? 'Executive Dashboard' : 'Report Dashboard' }}</h1>
          <p class="subcopy">A fast operational view of inventory, purchasing, movement, and alert health.</p>
        </div>
        <div class="hero-actions">
          <button type="button" [disabled]="loading" (click)="load()">{{ loading ? 'Refreshing...' : 'Refresh' }}</button>
          <app-report-export-buttons
            *ngIf="isExecutive"
            [loading]="exportLoading"
            [formats]="['CSV', 'EXCEL', 'PDF']"
            (exportRequested)="exportDashboard($event)"
          />
        </div>
      </header>

      <div class="grid" *ngIf="dashboard as view; else loadingOrEmpty">
        <app-report-kpi-card label="Inventory Value" [value]="(view.totalInventoryValue | currency : 'INR' : 'symbol' : '1.0-0') ?? '-'" />
        <app-report-kpi-card label="Low Stock" [value]="view.lowStockCount" meta="Products below reorder threshold" />
        <app-report-kpi-card label="Overstock" [value]="view.overstockCount" meta="Products above max stock level" />
        <app-report-kpi-card label="Overdue POs" [value]="view.overduePurchaseOrders" meta="Purchase orders needing attention" />
        <app-report-kpi-card label="Paid Amount" [value]="(view.totalPaidAmount | currency : 'INR' : 'symbol' : '1.0-0') ?? '-'" />
        <app-report-kpi-card label="Critical Alerts" [value]="view.criticalAlerts" meta="Operationally urgent issues" />
      </div>

      <div class="panel-grid" *ngIf="dashboard as view">
        <section class="panel">
          <div class="panel-head">
            <h2>Top Moving Products</h2>
            <a routerLink="/reports/movements/top-moving">Open report</a>
          </div>
          <div class="list" *ngIf="view.topMovingProducts.length; else noMoves">
            <article *ngFor="let item of view.topMovingProducts" class="list-item">
              <strong>{{ item.productName || 'Unnamed product' }}</strong>
              <span>{{ item.totalMovementQuantity | number : '1.0-0' }} units</span>
            </article>
          </div>
        </section>

        <section class="panel">
          <div class="panel-head">
            <h2>Recent Alerts</h2>
            <a routerLink="/alerts">Open alerts</a>
          </div>
          <div class="list" *ngIf="view.recentAlerts.length; else noAlerts">
            <article *ngFor="let alert of view.recentAlerts" class="list-item">
              <strong>{{ alert.title }}</strong>
              <span>{{ alert.severity }} • {{ alert.createdAt | date : 'medium' }}</span>
            </article>
          </div>
        </section>
      </div>

      <section class="panel" *ngIf="dashboard?.unavailableSections?.length">
        <h2>Unavailable Sections</h2>
        <p>{{ dashboard?.unavailableSections?.join(', ') }} service data is temporarily unavailable.</p>
      </section>

      <ng-template #loadingOrEmpty>
        <app-report-empty-state
          [title]="loading ? 'Loading dashboard…' : 'Dashboard unavailable'"
          [message]="loading ? 'Fetching the latest reporting metrics.' : 'Unable to load report. Please try again.'"
        />
      </ng-template>

      <ng-template #noMoves>
        <app-report-empty-state title="No movement highlights" message="Movement report temporarily unavailable or no movement data found." />
      </ng-template>

      <ng-template #noAlerts>
        <app-report-empty-state title="No recent alerts" message="There are no recent alerts for this dashboard view." />
      </ng-template>
    </section>
  `,
  styles: [
    `
      .report-page {
        padding: 1.5rem;
        background: radial-gradient(circle at top left, rgba(14, 165, 233, 0.12), transparent 35%), #f8fafc;
        min-height: 100%;
      }
      .hero,
      .panel {
        background: rgba(255, 255, 255, 0.88);
        border: 1px solid rgba(148, 163, 184, 0.16);
        border-radius: 28px;
        box-shadow: 0 22px 60px rgba(15, 23, 42, 0.08);
      }
      .hero {
        position: relative;
        padding: 1.5rem 1.5rem 1.5rem 1.8rem;
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        align-items: flex-start;
        overflow: hidden;
      }
      .hero::before {
        content: '';
        position: absolute;
        inset: 0 auto 0 0;
        width: 6px;
        background: linear-gradient(180deg, #2563eb 0%, #1d4ed8 55%, #0f4aa8 100%);
      }
      .eyebrow {
        margin: 0 0 0.4rem;
        color: #2563eb;
        font-size: 0.78rem;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        font-weight: 700;
      }
      h1 {
        margin: 0;
        color: #0f172a;
      }
      .subcopy {
        color: #475569;
        max-width: 42rem;
      }
      .hero-actions {
        display: flex;
        gap: 0.75rem;
        flex-wrap: wrap;
      }
      .hero-actions > button {
        border: none;
        border-radius: 999px;
        background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
        color: #fff;
        padding: 0.8rem 1rem;
        cursor: pointer;
        box-shadow: 0 10px 24px rgba(37, 99, 235, 0.18);
      }
      .grid {
        margin-top: 1.1rem;
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
        gap: 1rem;
      }
      .panel-grid {
        margin-top: 1.1rem;
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 1rem;
      }
      .panel {
        padding: 1.25rem;
      }
      .panel-head {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        align-items: center;
      }
      .panel-head h2 {
        margin: 0;
      }
      .panel-head a {
        color: #0f766e;
        text-decoration: none;
        font-weight: 700;
      }
      .list {
        display: grid;
        gap: 0.8rem;
        margin-top: 1rem;
      }
      .list-item {
        display: flex;
        justify-content: space-between;
        gap: 1rem;
        padding: 0.9rem 1rem;
        border-radius: 18px;
        background: #f8fafc;
      }
      .list-item span {
        color: #64748b;
      }
      @media (max-width: 700px) {
        .hero {
          flex-direction: column;
          padding: 1.2rem 1.2rem 1.2rem 1.4rem;
        }
        .list-item {
          flex-direction: column;
        }
      }
    `,
  ],
})
export class ReportDashboardComponent implements OnInit {
  private readonly reportService = inject(ReportService);
  private readonly notifications = inject(NotificationService);
  private readonly authService = inject(AuthService);

  dashboard: ExecutiveDashboardReportResponse | null = null;
  loading = false;
  exportLoading: 'CSV' | 'EXCEL' | 'PDF' | null = null;

  get isExecutive(): boolean {
    return this.authService.getUserRole() === UserRole.ADMIN;
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    const stream = this.isExecutive ? this.reportService.getExecutiveDashboard() : this.reportService.getMyDashboard();
    stream.pipe(finalize(() => (this.loading = false))).subscribe({
      next: (dashboard) => {
        this.dashboard = dashboard;
      },
      error: () => {
        this.dashboard = null;
        this.notifications.error('Unable to load report. Please try again.');
      },
    });
  }

  exportDashboard(format: 'CSV' | 'EXCEL' | 'PDF'): void {
    this.exportLoading = format;
    this.reportService
      .exportExecutiveDashboard(format)
      .pipe(finalize(() => (this.exportLoading = null)))
      .subscribe({
        next: (blob) => this.download(blob, `executive-dashboard.${format.toLowerCase()}`),
        error: () => this.notifications.error('Unable to export report'),
      });
  }

  private download(blob: Blob, fileName: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
    this.notifications.success('Report exported successfully');
  }
}
