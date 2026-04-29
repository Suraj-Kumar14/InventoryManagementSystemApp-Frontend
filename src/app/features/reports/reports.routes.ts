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
  templateUrl: './reports-page.component.html',
  styleUrls: ['./reports-page.component.css'],
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
      next: (result) => { this.valuation = result.valuation; this.turnover = result.turnover; this.poSummary = result.poSummary; this.topMoving = result.topMoving; this.slowMoving = result.slowMoving; this.deadStock = result.deadStock; },
      error: () => { this.valuation = null; this.turnover = null; this.poSummary = null; this.topMoving = []; this.slowMoving = []; this.deadStock = []; },
    });
  }

  exportReport(type: 'valuation' | 'movement'): void {
    this.exporting = type;
    const params = new HttpParams().set('type', type);
    this.http.get(`${this.baseUrl}${API_ENDPOINTS.REPORTS.EXPORT}`, { params, responseType: 'text' })
      .pipe(finalize(() => (this.exporting = null)))
      .subscribe({
        next: (content) => {
          const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url; link.download = `${type}-report.csv`; link.click();
          URL.revokeObjectURL(url);
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
