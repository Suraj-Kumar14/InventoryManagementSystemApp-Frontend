import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { DashboardService } from '../../services/dashboard.service';

@Component({
  selector: 'app-warehouse-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6">
      <div><h1 class="text-3xl font-bold text-neutral-900">Warehouse Dashboard</h1><p class="text-neutral-600 mt-2">Warehouse activity and stock health from backend services.</p></div>
      <div *ngIf="loading" class="rounded-xl border border-neutral-200 bg-white p-6 text-neutral-600">Loading dashboard...</div>
      <div *ngIf="!loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div class="bg-white rounded-lg shadow border border-neutral-200 p-6"><p class="text-neutral-600 text-sm">Warehouses</p><p class="text-3xl font-bold text-neutral-900 mt-2">{{ warehouses }}</p></div>
        <div class="bg-white rounded-lg shadow border border-neutral-200 p-6"><p class="text-neutral-600 text-sm">Movements</p><p class="text-3xl font-bold text-neutral-900 mt-2">{{ movements }}</p></div>
        <div class="bg-white rounded-lg shadow border border-neutral-200 p-6"><p class="text-neutral-600 text-sm">Recent Alerts</p><p class="text-3xl font-bold text-neutral-900 mt-2">{{ alerts }}</p></div>
        <div class="bg-white rounded-lg shadow border border-neutral-200 p-6"><p class="text-neutral-600 text-sm">Low Stock Records</p><p class="text-3xl font-bold text-neutral-900 mt-2">{{ lowStock }}</p></div>
      </div>
    </div>
  `,
})
export class WarehouseDashboardComponent {
  private dashboardService = inject(DashboardService);
  loading = false;
  warehouses = 0;
  movements = 0;
  alerts = 0;
  lowStock = 0;

  constructor() {
    this.loading = true;
    this.dashboardService.getWarehouseSummary().pipe(finalize(() => (this.loading = false))).subscribe({
      next: ({ warehouses, movements, alerts, lowStock }) => {
        this.warehouses = warehouses.length;
        this.movements = movements.length;
        this.alerts = alerts.length;
        this.lowStock = lowStock.length;
      },
    });
  }
}
