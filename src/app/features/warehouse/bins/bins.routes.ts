import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Routes } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { StockLevelResponse, WarehouseResponse } from '../../../core/http/backend.models';
import { API_ENDPOINTS, UserRole } from '../../../shared/config/app-config';
import { environment } from '../../../../environments/environment';
import { roleGuard } from '../../../core/guards/role.guard';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section class="space-y-6">
      <div><h1 class="text-3xl font-bold text-neutral-900">Bin Locations</h1><p class="mt-2 text-neutral-600">Bin data is sourced from stock-service binLocation fields.</p></div>
      <div class="flex gap-3">
        <select [formControl]="warehouseControl" class="rounded-lg border border-neutral-300 px-4 py-2">
          <option [ngValue]="0">Select warehouse</option>
          <option *ngFor="let warehouse of warehouses" [ngValue]="warehouse.warehouseId">{{ warehouse.name }}</option>
        </select>
        <button type="button" (click)="loadBins()" [disabled]="loading || !warehouseControl.value" class="rounded-lg bg-primary-600 px-4 py-2 text-white disabled:opacity-50">Load Bins</button>
      </div>
      <div *ngIf="loading" class="rounded-xl border border-neutral-200 bg-white p-6 text-neutral-600">Loading bin data...</div>
      <div *ngIf="!loading && bins.length === 0" class="rounded-xl border border-dashed border-neutral-300 bg-white p-8 text-center text-neutral-600">No bin locations returned by the backend.</div>
      <div *ngIf="!loading && bins.length > 0" class="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        <table class="min-w-full divide-y divide-neutral-200 text-sm">
          <thead class="bg-neutral-50 text-left text-neutral-600"><tr><th class="px-4 py-3">Bin</th><th class="px-4 py-3">Product</th><th class="px-4 py-3">Quantity</th><th class="px-4 py-3">Available</th></tr></thead>
          <tbody class="divide-y divide-neutral-200"><tr *ngFor="let item of bins"><td class="px-4 py-3">{{ item.binLocation || 'Unassigned' }}</td><td class="px-4 py-3">{{ item.productId }}</td><td class="px-4 py-3">{{ item.quantity }}</td><td class="px-4 py-3">{{ item.availableQuantity }}</td></tr></tbody>
        </table>
      </div>
    </section>
  `,
})
class BinsPageComponent {
  private http = inject(HttpClient);
  private fb = inject(FormBuilder);
  private baseUrl = environment.apiUrl;

  warehouses: WarehouseResponse[] = [];
  bins: StockLevelResponse[] = [];
  loading = false;
  warehouseControl = this.fb.nonNullable.control(0);

  constructor() {
    this.http.get<WarehouseResponse[]>(`${this.baseUrl}${API_ENDPOINTS.WAREHOUSES.ROOT}`).subscribe({ next: (warehouses) => (this.warehouses = warehouses), error: () => (this.warehouses = []) });
  }

  loadBins(): void {
    this.loading = true;
    this.http.get<StockLevelResponse[]>(`${this.baseUrl}${API_ENDPOINTS.STOCK.BY_WAREHOUSE(this.warehouseControl.value)}`).pipe(finalize(() => (this.loading = false))).subscribe({
      next: (stock) => (this.bins = stock.filter((item) => !!item.binLocation)),
      error: () => (this.bins = []),
    });
  }
}

export const binsRoutes: Routes = [
  { path: '', component: BinsPageComponent, canActivate: [roleGuard], data: { roles: [UserRole.ADMIN, UserRole.STAFF] } },
];
