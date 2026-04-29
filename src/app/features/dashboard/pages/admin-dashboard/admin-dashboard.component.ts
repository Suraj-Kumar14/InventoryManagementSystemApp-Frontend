import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { DashboardService } from '../../services/dashboard.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6">
      <div><h1 class="text-3xl font-bold text-neutral-900">Admin Dashboard</h1><p class="text-neutral-600 mt-2">Live admin metrics sourced from backend APIs.</p></div>
      <div *ngIf="loading" class="rounded-xl border border-neutral-200 bg-white p-6 text-neutral-600">Loading dashboard...</div>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" *ngIf="!loading">
        <div class="bg-white rounded-lg shadow border border-neutral-200 p-6"><p class="text-neutral-600 text-sm">Total Users</p><p class="text-3xl font-bold text-neutral-900 mt-2">{{ usersCount }}</p></div>
        <div class="bg-white rounded-lg shadow border border-neutral-200 p-6"><p class="text-neutral-600 text-sm">Warehouses</p><p class="text-3xl font-bold text-neutral-900 mt-2">{{ warehousesCount }}</p></div>
        <div class="bg-white rounded-lg shadow border border-neutral-200 p-6"><p class="text-neutral-600 text-sm">Stock Value</p><p class="text-3xl font-bold text-neutral-900 mt-2">{{ stockValue }}</p></div>
        <div class="bg-white rounded-lg shadow border border-neutral-200 p-6"><p class="text-neutral-600 text-sm">Recent Alerts</p><p class="text-3xl font-bold text-neutral-900 mt-2">{{ recentAlerts }}</p></div>
      </div>
    </div>
  `,
})
export class AdminDashboardComponent {
  private dashboardService = inject(DashboardService);
  loading = false;
  usersCount = 0;
  warehousesCount = 0;
  stockValue = 0;
  recentAlerts = 0;

  constructor() {
    this.loading = true;
    this.dashboardService.getAdminSummary().pipe(finalize(() => (this.loading = false))).subscribe({
      next: ({ users, warehouses, valuation, alerts }) => {
        this.usersCount = users.length;
        this.warehousesCount = warehouses.length;
        this.stockValue = valuation.totalValue ?? 0;
        this.recentAlerts = alerts.length;
      },
    });
  }
}
