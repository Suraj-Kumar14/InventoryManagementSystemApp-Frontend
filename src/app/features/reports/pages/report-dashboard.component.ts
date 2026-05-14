import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { AuthService } from '../../../core/auth/services/auth.service';
import {
  DeadStockReportResponse,
  InventoryTurnoverReportResponse,
  InventoryValuationReportResponse,
  LowStockReportItem,
  PurchaseSummaryReportResponse,
  ReportFilter,
  TopMovingProductReportResponse,
  WarehouseValuationItem,
} from '../../../core/http/backend.models';
import { NotificationService } from '../../../core/services/notification.service';
import { ReportService } from '../../../core/services/report.service';
import { UserRole } from '../../../shared/config/app-config';
import { ReportEmptyStateComponent } from '../components/report-empty-state.component';
import { ReportKpiCardComponent } from '../components/report-kpi-card.component';

type ReportCardId =
  | 'inventory-valuation'
  | 'warehouse-valuation'
  | 'inventory-turnover'
  | 'low-stock'
  | 'top-moving'
  | 'dead-stock'
  | 'po-summary'
  | 'po-spend';

type ReportRequestState = 'idle' | 'loading' | 'ready' | 'error';

interface ReportCard {
  id: ReportCardId;
  title: string;
  subtitle: string;
  route: string;
  reportType: string;
  value: string | number;
  allowedRoles: UserRole[];
  requestState: ReportRequestState;
  warning: string | null;
}

type ReportCardDefinition = Omit<ReportCard, 'requestState' | 'warning' | 'value'> & { value?: string | number };

@Component({
  standalone: true,
  imports: [CommonModule, RouterLink, CurrencyPipe, ReportKpiCardComponent, ReportEmptyStateComponent],
  template: `
    <section class="report-page">
      <header class="hero">
        <div>
          <p class="eyebrow">Analytics Workspace</p>
          <h1>Report Dashboard</h1>
          <p class="subcopy">Role-aware operational reporting with only the reports available to the current user.</p>
        </div>
        <button type="button" [disabled]="loading" (click)="load()">{{ loading ? 'Refreshing...' : 'Refresh' }}</button>
      </header>

      <app-report-empty-state
        *ngIf="visibleCards.length === 0"
        title="No reports available for your role."
        message="This dashboard does not currently expose any report cards for your account."
      />

      <ng-container *ngIf="visibleCards.length > 0">
        <div class="grid">
          <div
            *ngFor="let card of visibleCards"
            class="kpi-link-card"
            [class.kpi-link-card--loading]="card.requestState === 'loading'"
            [class.kpi-link-card--error]="card.requestState === 'error'"
            [class.kpi-link-card--disabled]="card.requestState !== 'ready'"
            role="button"
            [tabindex]="card.requestState === 'ready' ? 0 : -1"
            [attr.aria-disabled]="card.requestState !== 'ready'"
            (click)="openReport(card)"
            (keydown)="onReportCardKeydown($event, card)"
          >
            <app-report-kpi-card [label]="card.title" [value]="card.value" [meta]="card.subtitle" />
            <span class="kpi-link-card__action" *ngIf="card.requestState === 'ready'">View report -></span>
            <span class="kpi-link-card__status" *ngIf="card.requestState === 'loading'">Loading report...</span>
            <span class="kpi-link-card__warning" *ngIf="card.warning">{{ card.warning }}</span>
          </div>
        </div>

        <div class="panel-grid" *ngIf="showWarehousePreview || showTopMovingPreview">
          <section class="panel" *ngIf="showWarehousePreview">
            <div class="panel-head">
              <h2>Warehouse Valuation</h2>
              <a routerLink="/reports/inventory/by-warehouse">Open report</a>
            </div>
            <div class="list" *ngIf="warehousePreview.length; else noWarehouseData">
              <article *ngFor="let item of warehousePreview" class="list-item">
                <strong>{{ item.warehouseName }}</strong>
                <span>{{ item.stockValue | currency : 'INR' : 'symbol' : '1.0-0' }}</span>
              </article>
            </div>
          </section>

          <section class="panel" *ngIf="showTopMovingPreview">
            <div class="panel-head">
              <h2>Top Moving Products</h2>
              <a routerLink="/reports/inventory/top-moving">Open report</a>
            </div>
            <div class="list" *ngIf="topMovingPreview.length; else noTopMoving">
              <article *ngFor="let item of topMovingPreview" class="list-item">
                <strong>{{ item.productName || 'Unnamed product' }}</strong>
                <span>{{ item.totalMoved }} units</span>
              </article>
            </div>
          </section>
        </div>
      </ng-container>

      <ng-template #noWarehouseData>
        <app-report-empty-state title="No warehouse valuation data" message="No report data available for selected filters." />
      </ng-template>

      <ng-template #noTopMoving>
        <app-report-empty-state title="No movement data" message="No report data available for selected filters." />
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
      h1,
      h2 {
        margin: 0;
        color: #0f172a;
      }
      .subcopy {
        color: #475569;
        max-width: 42rem;
      }
      button {
        border: none;
        border-radius: 999px;
        background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
        color: #fff;
        padding: 0.8rem 1rem;
        cursor: pointer;
      }
      .grid {
        margin-top: 1.1rem;
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
        gap: 1rem;
      }
      .kpi-link-card {
        display: grid;
        gap: 0.65rem;
        cursor: pointer;
        outline: none;
        transition:
          transform 160ms ease,
          filter 160ms ease;
      }
      .kpi-link-card:hover {
        transform: translateY(-3px);
        filter: drop-shadow(0 18px 30px rgba(37, 99, 235, 0.16));
      }
      .kpi-link-card:focus-visible {
        border-radius: 24px;
        box-shadow:
          0 0 0 3px rgba(37, 99, 235, 0.2),
          0 18px 30px rgba(37, 99, 235, 0.12);
      }
      .kpi-link-card--disabled {
        cursor: default;
      }
      .kpi-link-card--disabled:hover {
        transform: none;
        filter: none;
      }
      .kpi-link-card__action,
      .kpi-link-card__status,
      .kpi-link-card__warning {
        padding-left: 0.35rem;
        font-size: 0.9rem;
        font-weight: 700;
      }
      .kpi-link-card__action {
        color: #1d4ed8;
      }
      .kpi-link-card__status {
        color: #64748b;
      }
      .kpi-link-card__warning {
        color: #b45309;
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
    `,
  ],
})
export class ReportDashboardComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly reportService = inject(ReportService);
  private readonly notifications = inject(NotificationService);
  private readonly router = inject(Router);

  private readonly defaultFilters: ReportFilter = { period: 'LAST_30_DAYS', page: 0, size: 5 };
  private readonly currentRole: UserRole | null = this.authService.getUserRole();

  allCards: ReportCard[] = [];
  visibleCards: ReportCard[] = [];
  warehousePreview: WarehouseValuationItem[] = [];
  topMovingPreview: TopMovingProductReportResponse[] = [];
  loading = false;

  get showWarehousePreview(): boolean {
    return this.hasVisibleCard('warehouse-valuation') && this.warehousePreview.length > 0;
  }

  get showTopMovingPreview(): boolean {
    return this.hasVisibleCard('top-moving') && this.topMovingPreview.length > 0;
  }

  ngOnInit(): void {
    this.allCards = this.buildCards();
    this.visibleCards = this.filterVisibleCards(this.allCards);
    if (this.visibleCards.length > 0) {
      queueMicrotask(() => this.load());
    }
  }

  load(): void {
    if (this.visibleCards.length === 0) {
      return;
    }

    this.loading = true;
    this.warehousePreview = [];
    this.topMovingPreview = [];
    this.visibleCards = this.visibleCards.map((card) => ({
      ...card,
      requestState: 'loading',
      warning: null,
      value: '-',
    }));

    forkJoin({
      valuation: this.loadCardData('inventory-valuation', this.reportService.getTotalValue(this.defaultFilters)),
      byWarehouse: this.loadCardData('warehouse-valuation', this.reportService.getStockValueByWarehouse(this.defaultFilters)),
      turnover: this.loadCardData('inventory-turnover', this.reportService.getInventoryTurnoverReport(this.defaultFilters)),
      lowStock: this.loadCardData('low-stock', this.reportService.getLowStockItems(this.defaultFilters)),
      topMoving: this.loadCardData('top-moving', this.reportService.getTopMovingProductsReport(this.defaultFilters)),
      deadStock: this.loadCardData('dead-stock', this.reportService.getDeadStockReport(this.defaultFilters, 90)),
      poSummary: this.loadCardData('po-summary', this.reportService.getPurchaseSummaryReport(this.defaultFilters)),
    })
      .pipe(finalize(() => queueMicrotask(() => (this.loading = false))))
      .subscribe((result) => {
        this.applyValuation(result.valuation);
        this.applyWarehouse(result.byWarehouse);
        this.applyTurnover(result.turnover);
        this.applyLowStock(result.lowStock);
        this.applyTopMoving(result.topMoving);
        this.applyDeadStock(result.deadStock);
        this.applyPurchaseSummary(result.poSummary);

        if (this.visibleCards.every((card) => card.requestState === 'error')) {
          this.notifications.error('Unable to load available reports. Please try again.');
        }
      });
  }

  openReport(card: ReportCard): void {
    if (card.requestState !== 'ready') {
      return;
    }
    void this.router.navigateByUrl(card.route);
  }

  onReportCardKeydown(event: KeyboardEvent, card: ReportCard): void {
    if (event.key !== 'Enter' && event.key !== ' ') {
      return;
    }
    event.preventDefault();
    this.openReport(card);
  }

  private buildCards(): ReportCard[] {
    const cards: ReportCardDefinition[] = [
      {
        id: 'inventory-valuation',
        title: 'Total Inventory Valuation',
        subtitle: 'Current stock valuation',
        route: '/reports/inventory/valuation',
        reportType: 'inventory-valuation',
        allowedRoles: [UserRole.ADMIN, UserRole.INVENTORY_MANAGER],
      },
      {
        id: 'warehouse-valuation',
        title: 'Stock Value by Warehouse',
        subtitle: 'Warehouses in the valuation set',
        route: '/reports/inventory/by-warehouse',
        reportType: 'warehouse-valuation',
        allowedRoles: [UserRole.ADMIN, UserRole.INVENTORY_MANAGER],
      },
      {
        id: 'inventory-turnover',
        title: 'Inventory Turnover',
        subtitle: 'COGS / average inventory value',
        route: '/reports/inventory/turnover',
        reportType: 'inventory-turnover',
        allowedRoles: [UserRole.ADMIN, UserRole.INVENTORY_MANAGER],
      },
      {
        id: 'low-stock',
        title: 'Low Stock Report',
        subtitle: 'Products below reorder threshold',
        route: '/reports/inventory/low-stock',
        reportType: 'low-stock',
        allowedRoles: [UserRole.ADMIN, UserRole.INVENTORY_MANAGER, UserRole.WAREHOUSE_STAFF],
      },
      {
        id: 'top-moving',
        title: 'Top Moving Products',
        subtitle: 'Most active products in the selected period',
        route: '/reports/inventory/top-moving',
        reportType: 'top-moving',
        allowedRoles: [UserRole.ADMIN, UserRole.INVENTORY_MANAGER],
      },
      {
        id: 'dead-stock',
        title: 'Dead Stock',
        subtitle: 'Products with no movement past threshold',
        route: '/reports/inventory/dead-stock',
        reportType: 'dead-stock',
        allowedRoles: [UserRole.ADMIN, UserRole.INVENTORY_MANAGER],
      },
      {
        id: 'po-summary',
        title: 'PO Summary',
        subtitle: 'Purchase orders in the selected range',
        route: '/reports/purchase/summary',
        reportType: 'po-summary',
        allowedRoles: [UserRole.ADMIN, UserRole.PURCHASE_OFFICER],
      },
      {
        id: 'po-spend',
        title: 'Total PO Spend',
        subtitle: 'Total purchase spend in the selected range',
        route: '/reports/purchase/summary',
        reportType: 'po-spend',
        allowedRoles: [UserRole.ADMIN, UserRole.PURCHASE_OFFICER],
      },
    ];

    return cards.map((card) => ({
      ...card,
      value: card.value ?? '-',
      requestState: 'idle',
      warning: null,
    }));
  }

  private filterVisibleCards(cards: ReportCard[]): ReportCard[] {
    const role = this.currentRole;
    if (!role) {
      return [];
    }
    return cards.filter((card) => card.allowedRoles.includes(role));
  }

  private hasVisibleCard(cardId: ReportCardId): boolean {
    return this.visibleCards.some((card) => card.id === cardId);
  }

  private loadCardData<T>(cardId: ReportCardId, stream: Observable<T>): Observable<T | null> {
    if (!this.hasVisibleCard(cardId)) {
      return of(null);
    }

    return stream.pipe(
      catchError((error) => {
        this.setCardError(cardId, this.resolveErrorMessage(cardId, error));
        return of(null);
      }),
    );
  }

  private applyValuation(valuation: InventoryValuationReportResponse | null): void {
    if (!valuation) {
      return;
    }
    this.updateCard('inventory-valuation', this.formatCurrency(valuation.totalInventoryValue));
  }

  private applyWarehouse(items: WarehouseValuationItem[] | null): void {
    if (!items) {
      return;
    }
    this.warehousePreview = items.slice(0, 5);
    this.updateCard('warehouse-valuation', items.length);
  }

  private applyTurnover(turnover: InventoryTurnoverReportResponse | null): void {
    if (!turnover) {
      return;
    }
    this.updateCard('inventory-turnover', this.formatNumber(turnover.turnoverRate));
  }

  private applyLowStock(page: { content: LowStockReportItem[] } | null): void {
    if (!page) {
      return;
    }
    this.updateCard('low-stock', page.content.length);
  }

  private applyTopMoving(items: TopMovingProductReportResponse[] | null): void {
    if (!items) {
      return;
    }
    this.topMovingPreview = items.slice(0, 5);
    this.updateCard('top-moving', items.length);
  }

  private applyDeadStock(items: DeadStockReportResponse[] | null): void {
    if (!items) {
      return;
    }
    this.updateCard('dead-stock', items.length);
  }

  private applyPurchaseSummary(summary: PurchaseSummaryReportResponse | null): void {
    if (!summary) {
      return;
    }
    this.updateCard('po-summary', summary.totalPurchaseOrders);
    this.updateCard('po-spend', this.formatCurrency(summary.totalSpend));
  }

  private updateCard(cardId: ReportCardId, value: string | number): void {
    this.visibleCards = this.visibleCards.map((card) =>
      card.id === cardId
        ? {
            ...card,
            value,
            requestState: 'ready',
            warning: null,
          }
        : card,
    );
  }

  private setCardError(cardId: ReportCardId, warning: string): void {
    this.visibleCards = this.visibleCards.map((card) =>
      card.id === cardId
        ? {
            ...card,
            requestState: 'error',
            warning,
            value: '0',
          }
        : card,
    );
  }

  private resolveErrorMessage(cardId: ReportCardId, error: unknown): string {
    const message =
      typeof error === 'object' && error !== null && 'error' in error && typeof (error as { error?: { message?: string } }).error?.message === 'string'
        ? (error as { error: { message: string } }).error.message
        : null;

    if (message) {
      return message;
    }

    if (cardId === 'po-summary' || cardId === 'po-spend') {
      return 'Purchase summary data is temporarily unavailable.';
    }

    return 'This report is temporarily unavailable.';
  }

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(Number(value ?? 0));
  }

  private formatNumber(value: number): string {
    return new Intl.NumberFormat('en-IN', {
      maximumFractionDigits: 2,
    }).format(Number(value ?? 0));
  }
}
