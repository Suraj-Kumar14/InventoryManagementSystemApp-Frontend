import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { DashboardService } from '../../services/dashboard.service';

@Component({
  selector: 'app-inventory-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6">
      <div><h1 class="text-3xl font-bold text-neutral-900">Inventory Dashboard</h1><p class="text-neutral-600 mt-2">Inventory analytics from report-service and movement-service.</p></div>
      <div *ngIf="loading" class="rounded-xl border border-neutral-200 bg-white p-6 text-neutral-600">Loading dashboard...</div>
      <div *ngIf="!loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div class="bg-white rounded-lg shadow border border-neutral-200 p-6"><p class="text-neutral-600 text-sm">Total Inventory Value</p><p class="text-3xl font-bold text-neutral-900 mt-2">{{ totalValue }}</p></div>
        <div class="bg-white rounded-lg shadow border border-neutral-200 p-6"><p class="text-neutral-600 text-sm">Low Stock Alerts</p><p class="text-3xl font-bold text-neutral-900 mt-2">{{ lowStockCount }}</p></div>
        <div class="bg-white rounded-lg shadow border border-neutral-200 p-6"><p class="text-neutral-600 text-sm">Top Moving Products</p><p class="text-3xl font-bold text-neutral-900 mt-2">{{ topMovingCount }}</p></div>
        <div class="bg-white rounded-lg shadow border border-neutral-200 p-6"><p class="text-neutral-600 text-sm">Dead Stock Items</p><p class="text-3xl font-bold text-neutral-900 mt-2">{{ deadStockCount }}</p></div>
      </div>
      <div *ngIf="!loading && recentMovements.length > 0" class="rounded-xl border border-neutral-200 bg-white p-5">
        <h2 class="text-xl font-semibold text-neutral-900">Recent Stock Movements</h2>
        <div class="mt-4 space-y-3">
          <div *ngFor="let movement of recentMovements" class="flex items-center justify-between rounded-lg bg-neutral-50 px-4 py-3">
            <span>{{ movement.movementType }} for product {{ movement.productId }} in warehouse {{ movement.warehouseId }}</span>
            <span class="font-semibold">{{ movement.quantity }}</span>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class InventoryDashboardComponent {
  private dashboardService = inject(DashboardService);
  loading = false;
  totalValue = 0;
  lowStockCount = 0;
  topMovingCount = 0;
  deadStockCount = 0;
  recentMovements: Array<{ movementType: string; productId: number; warehouseId: number; quantity: number }> = [];

  constructor() {
    this.loading = true;
    this.dashboardService.getInventorySummary().pipe(finalize(() => (this.loading = false))).subscribe({
      next: ({ valuation, lowStock, topMoving, deadStock, movements }) => {
        this.totalValue = valuation.totalValue ?? 0;
        this.lowStockCount = lowStock.length;
        this.topMovingCount = topMoving.length;
        this.deadStockCount = deadStock.length;
        this.recentMovements = movements.slice(0, 5);
      },
    });
  }
}
