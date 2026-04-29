import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { DashboardService } from '../../services/dashboard.service';

@Component({
  selector: 'app-purchase-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6">
      <div><h1 class="text-3xl font-bold text-neutral-900">Purchase Dashboard</h1><p class="text-neutral-600 mt-2">Purchase metrics from purchase-service and report-service.</p></div>
      <div *ngIf="loading" class="rounded-xl border border-neutral-200 bg-white p-6 text-neutral-600">Loading dashboard...</div>
      <div *ngIf="!loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div class="bg-white rounded-lg shadow border border-neutral-200 p-6"><p class="text-neutral-600 text-sm">Total Orders</p><p class="text-3xl font-bold text-neutral-900 mt-2">{{ totalOrders }}</p></div>
        <div class="bg-white rounded-lg shadow border border-neutral-200 p-6"><p class="text-neutral-600 text-sm">Overdue Orders</p><p class="text-3xl font-bold text-neutral-900 mt-2">{{ overdueOrders }}</p></div>
        <div class="bg-white rounded-lg shadow border border-neutral-200 p-6"><p class="text-neutral-600 text-sm">Total Spend</p><p class="text-3xl font-bold text-neutral-900 mt-2">{{ totalSpend }}</p></div>
        <div class="bg-white rounded-lg shadow border border-neutral-200 p-6"><p class="text-neutral-600 text-sm">Top Suppliers</p><p class="text-3xl font-bold text-neutral-900 mt-2">{{ topSuppliers }}</p></div>
      </div>
    </div>
  `,
})
export class PurchaseDashboardComponent {
  private dashboardService = inject(DashboardService);
  loading = false;
  totalOrders = 0;
  overdueOrders = 0;
  totalSpend = 0;
  topSuppliers = 0;

  constructor() {
    this.loading = true;
    this.dashboardService.getPurchaseSummary().pipe(finalize(() => (this.loading = false))).subscribe({
      next: ({ orders, overdue, summary, suppliers }) => {
        this.totalOrders = orders.length;
        this.overdueOrders = overdue.length;
        this.totalSpend = summary.totalSpend ?? 0;
        this.topSuppliers = suppliers.length;
      },
    });
  }
}
