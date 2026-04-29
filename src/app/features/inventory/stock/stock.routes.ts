import { CommonModule } from '@angular/common';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Component, Injectable, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Routes } from '@angular/router';
import { finalize } from 'rxjs/operators';
import {
  AcknowledgeWarehouseStockAlertRequest,
  BarcodeStockLookupResponse,
  StockAuditRequest,
  StockAuditResponse,
  StockLevelResponse,
  StockTransferRequest,
  StockUpdateRequest,
  WarehouseResponse,
  WarehouseStockAlertResponse,
  WarehouseStockMovementResponse,
} from '../../../core/http/backend.models';
import { NotificationService } from '../../../core/services/notification.service';
import { API_ENDPOINTS, UserRole } from '../../../shared/config/app-config';
import { environment } from '../../../../environments/environment';
import { roleGuard } from '../../../core/guards/role.guard';

@Injectable({ providedIn: 'root' })
class StockService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;

  getWarehouses() {
    return this.http.get<WarehouseResponse[]>(`${this.baseUrl}${API_ENDPOINTS.WAREHOUSES.ROOT}`);
  }

  getStockByWarehouse(warehouseId: number) {
    return this.http.get<StockLevelResponse[]>(`${this.baseUrl}${API_ENDPOINTS.STOCK.BY_WAREHOUSE(warehouseId)}`);
  }

  getLowStock(threshold: number) {
    const params = new HttpParams().set('threshold', threshold);
    return this.http.get<StockLevelResponse[]>(`${this.baseUrl}${API_ENDPOINTS.STOCK.LOW_STOCK}`, { params });
  }

  getMovementHistory(warehouseId?: number, productId?: number) {
    let params = new HttpParams();
    if (warehouseId) {
      params = params.set('warehouseId', warehouseId);
    }
    if (productId) {
      params = params.set('productId', productId);
    }

    return this.http.get<WarehouseStockMovementResponse[]>(`${this.baseUrl}${API_ENDPOINTS.STOCK.MOVEMENTS}`, {
      params,
    });
  }

  updateStock(warehouseId: number, payload: StockUpdateRequest) {
    return this.http.put<StockLevelResponse>(`${this.baseUrl}${API_ENDPOINTS.STOCK.UPDATE(warehouseId)}`, payload);
  }

  transferStock(payload: StockTransferRequest) {
    return this.http.post(`${this.baseUrl}${API_ENDPOINTS.STOCK.TRANSFER}`, payload, { responseType: 'text' });
  }

  performAudit(payload: StockAuditRequest) {
    return this.http.post<StockAuditResponse>(`${this.baseUrl}${API_ENDPOINTS.STOCK.AUDIT}`, payload);
  }

  lookupByBarcode(barcode: string) {
    return this.http.get<BarcodeStockLookupResponse>(`${this.baseUrl}${API_ENDPOINTS.STOCK.BARCODE(barcode)}`);
  }

  getStockAlerts() {
    return this.http.get<WarehouseStockAlertResponse[]>(`${this.baseUrl}${API_ENDPOINTS.STOCK.ALERTS}`);
  }

  acknowledgeStockAlert(alertId: number, payload: AcknowledgeWarehouseStockAlertRequest) {
    return this.http.post<WarehouseStockAlertResponse>(
      `${this.baseUrl}${API_ENDPOINTS.STOCK.ACKNOWLEDGE_ALERT(alertId)}`,
      payload
    );
  }
}

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section class="space-y-6">
      <div>
        <h1 class="text-3xl font-bold text-neutral-900">Stock Levels</h1>
        <p class="mt-2 text-neutral-600">View real stock, low-stock items, and warehouse transfers.</p>
      </div>

      <div class="grid gap-4 md:grid-cols-3">
        <select [formControl]="warehouseIdControl" class="rounded-lg border border-neutral-300 px-4 py-2">
          <option [ngValue]="0">Select warehouse</option>
          <option *ngFor="let warehouse of warehouses" [ngValue]="warehouse.warehouseId">{{ warehouse.name }}</option>
        </select>
        <input [formControl]="thresholdControl" type="number" class="rounded-lg border border-neutral-300 px-4 py-2" placeholder="Low stock threshold" />
        <div class="flex gap-3">
          <button type="button" (click)="loadWarehouseStock()" [disabled]="loading || !warehouseIdControl.value" class="rounded-lg bg-primary-600 px-4 py-2 text-white disabled:opacity-50">Warehouse Stock</button>
          <button type="button" (click)="loadLowStock()" [disabled]="loading" class="rounded-lg border border-neutral-300 px-4 py-2">Low Stock</button>
        </div>
      </div>

      <form [formGroup]="updateForm" (ngSubmit)="updateStock()" class="grid gap-4 rounded-xl border border-neutral-200 bg-white p-6 md:grid-cols-2">
        <input formControlName="productId" type="number" placeholder="Product ID" class="rounded-lg border border-neutral-300 px-4 py-2" />
        <input formControlName="quantity" type="number" placeholder="Quantity" class="rounded-lg border border-neutral-300 px-4 py-2" />
        <input formControlName="binLocation" placeholder="Bin location" class="rounded-lg border border-neutral-300 px-4 py-2" />
        <button type="submit" [disabled]="updateForm.invalid || !warehouseIdControl.value || saving" class="rounded-lg bg-primary-600 px-4 py-2 text-white disabled:opacity-50">
          {{ saving ? 'Updating...' : 'Update Stock' }}
        </button>
      </form>

      <form [formGroup]="transferForm" (ngSubmit)="transferStock()" class="grid gap-4 rounded-xl border border-neutral-200 bg-white p-6 md:grid-cols-2">
        <input formControlName="fromWarehouseId" type="number" placeholder="From warehouse ID" class="rounded-lg border border-neutral-300 px-4 py-2" />
        <input formControlName="toWarehouseId" type="number" placeholder="To warehouse ID" class="rounded-lg border border-neutral-300 px-4 py-2" />
        <input formControlName="productId" type="number" placeholder="Product ID" class="rounded-lg border border-neutral-300 px-4 py-2" />
        <input formControlName="quantity" type="number" placeholder="Quantity" class="rounded-lg border border-neutral-300 px-4 py-2" />
        <input formControlName="reason" placeholder="Reason" class="rounded-lg border border-neutral-300 px-4 py-2 md:col-span-2" />
        <button type="submit" [disabled]="transferForm.invalid || transferring" class="rounded-lg bg-primary-600 px-4 py-2 text-white disabled:opacity-50 md:col-span-2">
          {{ transferring ? 'Transferring...' : 'Transfer Stock' }}
        </button>
      </form>

      <div *ngIf="loading" class="rounded-xl border border-neutral-200 bg-white p-6 text-neutral-600">Loading stock data...</div>
      <div *ngIf="!loading && stock.length === 0" class="rounded-xl border border-dashed border-neutral-300 bg-white p-8 text-center text-neutral-600">No stock data returned by the backend.</div>
      <div *ngIf="!loading && stock.length > 0" class="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        <table class="min-w-full divide-y divide-neutral-200 text-sm">
          <thead class="bg-neutral-50 text-left text-neutral-600">
            <tr>
              <th class="px-4 py-3">Warehouse</th>
              <th class="px-4 py-3">Product</th>
              <th class="px-4 py-3">Quantity</th>
              <th class="px-4 py-3">Reserved</th>
              <th class="px-4 py-3">Available</th>
              <th class="px-4 py-3">Bin</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-neutral-200">
            <tr *ngFor="let item of stock">
              <td class="px-4 py-3">{{ item.warehouseId }}</td>
              <td class="px-4 py-3">{{ item.productId }}</td>
              <td class="px-4 py-3">{{ item.quantity }}</td>
              <td class="px-4 py-3">{{ item.reservedQuantity }}</td>
              <td class="px-4 py-3">{{ item.availableQuantity }}</td>
              <td class="px-4 py-3">{{ item.binLocation || 'Not set' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  `,
})
class StockPageComponent {
  private service = inject(StockService);
  private fb = inject(FormBuilder);
  private notifications = inject(NotificationService);

  warehouses: WarehouseResponse[] = [];
  stock: StockLevelResponse[] = [];
  loading = false;
  saving = false;
  transferring = false;
  warehouseIdControl = this.fb.nonNullable.control(0);
  thresholdControl = this.fb.nonNullable.control(10);

  updateForm = this.fb.nonNullable.group({
    productId: [0, [Validators.required, Validators.min(1)]],
    quantity: [0, [Validators.required, Validators.min(0)]],
    binLocation: [''],
  });

  transferForm = this.fb.nonNullable.group({
    fromWarehouseId: [0, [Validators.required, Validators.min(1)]],
    toWarehouseId: [0, [Validators.required, Validators.min(1)]],
    productId: [0, [Validators.required, Validators.min(1)]],
    quantity: [0, [Validators.required, Validators.min(1)]],
    reason: ['', [Validators.required]],
  });

  constructor() {
    this.service.getWarehouses().subscribe({
      next: (warehouses) => (this.warehouses = warehouses),
      error: () => (this.warehouses = []),
    });
  }

  loadWarehouseStock(): void {
    const warehouseId = this.warehouseIdControl.value;
    if (!warehouseId) {
      return;
    }

    this.loading = true;
    this.service.getStockByWarehouse(warehouseId).pipe(finalize(() => (this.loading = false))).subscribe({
      next: (stock) => (this.stock = stock),
      error: () => (this.stock = []),
    });
  }

  loadLowStock(): void {
    this.loading = true;
    this.service.getLowStock(this.thresholdControl.value).pipe(finalize(() => (this.loading = false))).subscribe({
      next: (stock) => (this.stock = stock),
      error: () => (this.stock = []),
    });
  }

  updateStock(): void {
    if (this.updateForm.invalid || !this.warehouseIdControl.value) {
      return;
    }

    this.saving = true;
    this.service
      .updateStock(this.warehouseIdControl.value, this.updateForm.getRawValue())
      .pipe(finalize(() => (this.saving = false)))
      .subscribe({
        next: () => {
          this.notifications.success('Stock updated successfully.');
          this.loadWarehouseStock();
        },
      });
  }

  transferStock(): void {
    if (this.transferForm.invalid) {
      return;
    }

    this.transferring = true;
    this.service
      .transferStock(this.transferForm.getRawValue())
      .pipe(finalize(() => (this.transferring = false)))
      .subscribe({
        next: (message) => {
          this.notifications.success(message || 'Stock transferred successfully.');
          this.loadWarehouseStock();
        },
      });
  }
}

export const stockRoutes: Routes = [
  {
    path: '',
    component: StockPageComponent,
    canActivate: [roleGuard],
    data: { roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF] },
  },
];
