import { CommonModule } from '@angular/common';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Routes } from '@angular/router';
import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { DeadStockItem, InventoryTurnover, POSummary, StockValuation, TopMovingProduct } from '../../core/http/backend.models';
import { NotificationService } from '../../core/services/notification.service';
import { API_ENDPOINTS, UI_CONSTANTS, UserRole } from '../../shared/config/app-config';
import { environment } from '../../../environments/environment';
import { roleGuard } from '../../core/guards/role.guard';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section class="space-y-6">
      <div><h1 class="text-3xl font-bold text-neutral-900">Reports</h1><p class="mt-2 text-neutral-600">Inventory and purchasing analytics sourced directly from report-service.</p></div>
      <div class="flex gap-3">
        <input [formControl]="startDateControl" type="date" class="rounded-lg border border-neutral-300 px-4 py-2" />
        <input [formControl]="endDateControl" type="date" class="rounded-lg border border-neutral-300 px-4 py-2" />
        <button type="button" (click)="loadReports()" [disabled]="loading" class="rounded-lg bg-primary-600 px-4 py-2 text-white disabled:opacity-50">{{ loading ? 'Loading...' : 'Refresh Reports' }}</button>
        <button type="button" (click)="exportReport('valuation')" [disabled]="exporting === 'valuation'" class="rounded-lg border border-neutral-300 px-4 py-2 disabled:opacity-50">{{ exporting === 'valuation' ? 'Exporting...' : 'Export Valuation' }}</button>
        <button type="button" (click)="exportReport('movement')" [disabled]="exporting === 'movement'" class="rounded-lg border border-neutral-300 px-4 py-2 disabled:opacity-50">{{ exporting === 'movement' ? 'Exporting...' : 'Export Movement' }}</button>
      </div>

      <div class="grid gap-4 md:grid-cols-3">
        <div class="rounded-xl border border-neutral-200 bg-white p-5"><p class="text-sm text-neutral-600">Total Valuation</p><p class="mt-2 text-3xl font-bold text-neutral-900">{{ valuation?.totalValue ?? 0 }}</p></div>
        <div class="rounded-xl border border-neutral-200 bg-white p-5"><p class="text-sm text-neutral-600">Dead Stock Items</p><p class="mt-2 text-3xl font-bold text-neutral-900">{{ deadStock.length }}</p></div>
        <div class="rounded-xl border border-neutral-200 bg-white p-5"><p class="text-sm text-neutral-600">Total Purchase Orders</p><p class="mt-2 text-3xl font-bold text-neutral-900">{{ poSummary?.totalPOs ?? 0 }}</p></div>
      </div>

      <div *ngIf="turnover" class="rounded-xl border border-neutral-200 bg-white p-5">
        <h2 class="text-xl font-semibold text-neutral-900">Inventory Turnover</h2>
        <p class="mt-2 text-neutral-700">Average inventory value: {{ turnover.averageInventoryValue }}</p>
        <p class="text-sm text-neutral-500">{{ turnover.note }}</p>
      </div>

      <div *ngIf="topMoving.length === 0 && deadStock.length === 0 && !loading" class="rounded-xl border border-dashed border-neutral-300 bg-white p-8 text-center text-neutral-600">
        No report data returned by the backend.
      </div>

      <div *ngIf="topMoving.length > 0" class="rounded-xl border border-neutral-200 bg-white p-5">
        <h2 class="text-xl font-semibold text-neutral-900">Top Moving Products</h2>
        <div class="mt-4 space-y-3">
          <div *ngFor="let item of topMoving" class="flex items-center justify-between rounded-lg bg-neutral-50 px-4 py-3">
            <span>Product {{ item.productId }} - {{ item.productName }}</span>
            <span class="font-semibold">{{ item.totalMovement }}</span>
          </div>
        </div>
      </div>

      <div *ngIf="deadStock.length > 0" class="rounded-xl border border-neutral-200 bg-white p-5">
        <h2 class="text-xl font-semibold text-neutral-900">Dead Stock</h2>
        <div class="mt-4 space-y-3">
          <div *ngFor="let item of deadStock" class="flex items-center justify-between rounded-lg bg-neutral-50 px-4 py-3">
            <span>Product {{ item.productId }} in warehouse {{ item.warehouseId }}</span>
            <span class="font-semibold">{{ item.daysWithoutMovement }} days</span>
          </div>
        </div>
      </div>

      <div *ngIf="slowMoving.length > 0" class="rounded-xl border border-neutral-200 bg-white p-5">
        <h2 class="text-xl font-semibold text-neutral-900">Slow Moving Products</h2>
        <div class="mt-4 space-y-3">
          <div *ngFor="let item of slowMoving" class="flex items-center justify-between rounded-lg bg-neutral-50 px-4 py-3">
            <span>Product {{ item.productId }} in warehouse {{ item.warehouseId }}</span>
            <span class="font-semibold">{{ item.totalMovement }}</span>
          </div>
        </div>
      </div>
    </section>
  `,
})
class ReportsPageComponent {
  private http = inject(HttpClient);
  private fb = inject(FormBuilder);
  private notifications = inject(NotificationService);
  private baseUrl = environment.apiUrl;

  valuation: StockValuation | null = null;
  poSummary: POSummary | null = null;
  turnover: InventoryTurnover | null = null;
  topMoving: TopMovingProduct[] = [];
  slowMoving: TopMovingProduct[] = [];
  deadStock: DeadStockItem[] = [];
  loading = false;
  exporting: 'valuation' | 'movement' | null = null;

  startDateControl = this.fb.nonNullable.control(this.formatDate(-UI_CONSTANTS.DEFAULT_REPORT_DAYS));
  endDateControl = this.fb.nonNullable.control(this.formatDate(0));

  constructor() { this.loadReports(); }

  loadReports(): void {
    const params = new HttpParams().set('startDate', this.startDateControl.value).set('endDate', this.endDateControl.value);
    this.loading = true;
    forkJoin({
      valuation: this.http.get<StockValuation>(`${this.baseUrl}${API_ENDPOINTS.REPORTS.TOTAL_VALUATION}`),
      turnover: this.http.get<InventoryTurnover>(`${this.baseUrl}${API_ENDPOINTS.REPORTS.TURNOVER}`, { params }),
      poSummary: this.http.get<POSummary>(`${this.baseUrl}${API_ENDPOINTS.REPORTS.PO_SUMMARY}`, { params }),
      topMoving: this.http.get<TopMovingProduct[]>(`${this.baseUrl}${API_ENDPOINTS.REPORTS.TOP_MOVING}`),
      slowMoving: this.http.get<TopMovingProduct[]>(`${this.baseUrl}${API_ENDPOINTS.REPORTS.SLOW_MOVING}`),
      deadStock: this.http.get<DeadStockItem[]>(`${this.baseUrl}${API_ENDPOINTS.REPORTS.DEAD_STOCK}`),
    }).pipe(finalize(() => (this.loading = false))).subscribe({
      next: (result) => {
        this.valuation = result.valuation;
        this.turnover = result.turnover;
        this.poSummary = result.poSummary;
        this.topMoving = result.topMoving;
        this.slowMoving = result.slowMoving;
        this.deadStock = result.deadStock;
      },
      error: () => {
        this.valuation = null;
        this.turnover = null;
        this.poSummary = null;
        this.topMoving = [];
        this.slowMoving = [];
        this.deadStock = [];
      },
    });
  }

  exportReport(type: 'valuation' | 'movement'): void {
    this.exporting = type;
    const params = new HttpParams().set('type', type);
    this.http
      .get(`${this.baseUrl}${API_ENDPOINTS.REPORTS.EXPORT}`, { params, responseType: 'text' })
      .pipe(finalize(() => (this.exporting = null)))
      .subscribe({
        next: (content) => {
          const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
          const downloadUrl = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = downloadUrl;
          link.download = `${type}-report.csv`;
          link.click();
          URL.revokeObjectURL(downloadUrl);
          this.notifications.success(`${type === 'valuation' ? 'Valuation' : 'Movement'} report exported successfully.`);
        },
      });
  }

  private formatDate(offsetDays: number): string {
    const date = new Date();
    date.setDate(date.getDate() + offsetDays);
    return date.toISOString().slice(0, 10);
  }
}

export const reportsRoutes: Routes = [
  { path: '', component: ReportsPageComponent, canActivate: [roleGuard], data: { roles: [UserRole.ADMIN, UserRole.MANAGER] } },
];
