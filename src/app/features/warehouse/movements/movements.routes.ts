import { CommonModule } from '@angular/common';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Component, Injectable, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Routes } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { StockMovementRequest, StockMovementResponse } from '../../../core/http/backend.models';
import { AuthService } from '../../../core/auth/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { API_ENDPOINTS, UserRole } from '../../../shared/config/app-config';
import { environment } from '../../../../environments/environment';
import { roleGuard } from '../../../core/guards/role.guard';

@Injectable({ providedIn: 'root' })
class MovementsService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;
  getMovements() { return this.http.get<StockMovementResponse[]>(`${this.baseUrl}${API_ENDPOINTS.MOVEMENTS.ROOT}`); }
  create(payload: StockMovementRequest) { return this.http.post<StockMovementResponse>(`${this.baseUrl}${API_ENDPOINTS.MOVEMENTS.ROOT}`, payload); }
  getByProduct(productId: number) { return this.http.get<StockMovementResponse[]>(`${this.baseUrl}${API_ENDPOINTS.MOVEMENTS.BY_PRODUCT(productId)}`); }
  getByWarehouse(warehouseId: number) { return this.http.get<StockMovementResponse[]>(`${this.baseUrl}${API_ENDPOINTS.MOVEMENTS.BY_WAREHOUSE(warehouseId)}`); }
  getByDateRange(start: string, end: string) {
    const params = new HttpParams().set('start', `${start}T00:00:00`).set('end', `${end}T23:59:59`);
    return this.http.get<StockMovementResponse[]>(`${this.baseUrl}${API_ENDPOINTS.MOVEMENTS.DATE_RANGE}`, { params });
  }
}

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section class="space-y-6">
      <div><h1 class="text-3xl font-bold text-neutral-900">Stock Movements</h1><p class="mt-2 text-neutral-600">Record and review immutable stock movement events.</p></div>
      <div class="grid gap-4 rounded-xl border border-neutral-200 bg-white p-6 md:grid-cols-4">
        <input [formControl]="filterProductIdControl" type="number" placeholder="Filter by product ID" class="rounded-lg border border-neutral-300 px-4 py-2" />
        <input [formControl]="filterWarehouseIdControl" type="number" placeholder="Filter by warehouse ID" class="rounded-lg border border-neutral-300 px-4 py-2" />
        <input [formControl]="startDateControl" type="date" class="rounded-lg border border-neutral-300 px-4 py-2" />
        <input [formControl]="endDateControl" type="date" class="rounded-lg border border-neutral-300 px-4 py-2" />
        <div class="flex gap-3 md:col-span-4">
          <button type="button" (click)="loadMovements()" [disabled]="loading" class="rounded-lg bg-primary-600 px-4 py-2 text-white disabled:opacity-50">
            {{ loading ? 'Loading...' : 'Apply Filters' }}
          </button>
          <button type="button" (click)="resetFilters()" [disabled]="loading" class="rounded-lg border border-neutral-300 px-4 py-2">
            Reset
          </button>
        </div>
      </div>
      <form [formGroup]="form" (ngSubmit)="create()" class="grid gap-4 rounded-xl border border-neutral-200 bg-white p-6 md:grid-cols-2">
        <input formControlName="productId" type="number" placeholder="Product ID" class="rounded-lg border border-neutral-300 px-4 py-2" />
        <input formControlName="warehouseId" type="number" placeholder="Warehouse ID" class="rounded-lg border border-neutral-300 px-4 py-2" />
        <input formControlName="movementType" placeholder="Movement type" class="rounded-lg border border-neutral-300 px-4 py-2" />
        <input formControlName="quantity" type="number" placeholder="Quantity" class="rounded-lg border border-neutral-300 px-4 py-2" />
        <input formControlName="balanceAfter" type="number" placeholder="Balance after" class="rounded-lg border border-neutral-300 px-4 py-2" />
        <input formControlName="referenceId" type="number" placeholder="Reference ID" class="rounded-lg border border-neutral-300 px-4 py-2" />
        <input formControlName="referenceType" placeholder="Reference type" class="rounded-lg border border-neutral-300 px-4 py-2" />
        <textarea formControlName="notes" placeholder="Notes" class="rounded-lg border border-neutral-300 px-4 py-2 md:col-span-2"></textarea>
        <button type="submit" [disabled]="form.invalid || saving" class="rounded-lg bg-primary-600 px-4 py-2 text-white disabled:opacity-50 md:col-span-2">{{ saving ? 'Recording...' : 'Record Movement' }}</button>
      </form>
      <div *ngIf="loading" class="rounded-xl border border-neutral-200 bg-white p-6 text-neutral-600">Loading movements...</div>
      <div *ngIf="!loading && movements.length === 0" class="rounded-xl border border-dashed border-neutral-300 bg-white p-8 text-center text-neutral-600">No movements returned by the backend.</div>
      <div *ngIf="!loading && movements.length > 0" class="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        <table class="min-w-full divide-y divide-neutral-200 text-sm">
          <thead class="bg-neutral-50 text-left text-neutral-600"><tr><th class="px-4 py-3">Date</th><th class="px-4 py-3">Type</th><th class="px-4 py-3">Product</th><th class="px-4 py-3">Warehouse</th><th class="px-4 py-3">Qty</th><th class="px-4 py-3">Balance</th></tr></thead>
          <tbody class="divide-y divide-neutral-200"><tr *ngFor="let movement of movements"><td class="px-4 py-3">{{ movement.movementDate || 'N/A' }}</td><td class="px-4 py-3">{{ movement.movementType }}</td><td class="px-4 py-3">{{ movement.productId }}</td><td class="px-4 py-3">{{ movement.warehouseId }}</td><td class="px-4 py-3">{{ movement.quantity }}</td><td class="px-4 py-3">{{ movement.balanceAfter }}</td></tr></tbody>
        </table>
      </div>
    </section>
  `,
})
class MovementsPageComponent {
  private service = inject(MovementsService);
  private auth = inject(AuthService);
  private fb = inject(FormBuilder);
  private notifications = inject(NotificationService);

  movements: StockMovementResponse[] = [];
  loading = false;
  saving = false;
  filterProductIdControl = this.fb.nonNullable.control(0);
  filterWarehouseIdControl = this.fb.nonNullable.control(0);
  startDateControl = this.fb.nonNullable.control('');
  endDateControl = this.fb.nonNullable.control('');

  form = this.fb.nonNullable.group({
    productId: [0, [Validators.required, Validators.min(1)]],
    warehouseId: [0, [Validators.required, Validators.min(1)]],
    movementType: ['', Validators.required],
    quantity: [1, [Validators.required, Validators.min(1)]],
    balanceAfter: [0, [Validators.required]],
    referenceId: [0],
    referenceType: [''],
    notes: [''],
  });

  constructor() { this.loadMovements(); }

  loadMovements(): void {
    this.loading = true;
    const productId = this.filterProductIdControl.value;
    const warehouseId = this.filterWarehouseIdControl.value;
    const startDate = this.startDateControl.value;
    const endDate = this.endDateControl.value;

    const request = startDate && endDate
      ? this.service.getByDateRange(startDate, endDate)
      : productId
        ? this.service.getByProduct(productId)
        : warehouseId
          ? this.service.getByWarehouse(warehouseId)
          : this.service.getMovements();

    request.pipe(finalize(() => (this.loading = false))).subscribe({
      next: (movements) => (this.movements = warehouseId && productId
        ? movements.filter((movement) => movement.productId === productId && movement.warehouseId === warehouseId)
        : movements),
      error: () => (this.movements = []),
    });
  }

  create(): void {
    const userId = this.auth.getUserId();
    if (this.form.invalid || !userId) { return; }
    this.saving = true;
    const raw = this.form.getRawValue();
    const payload: StockMovementRequest = { ...raw, performedBy: userId, referenceId: raw.referenceId || null, referenceType: raw.referenceType || null, notes: raw.notes || null };
    this.service.create(payload).pipe(finalize(() => (this.saving = false))).subscribe({ next: () => { this.notifications.success('Movement recorded successfully.'); this.loadMovements(); } });
  }

  resetFilters(): void {
    this.filterProductIdControl.setValue(0);
    this.filterWarehouseIdControl.setValue(0);
    this.startDateControl.setValue('');
    this.endDateControl.setValue('');
    this.loadMovements();
  }
}

export const movementsRoutes: Routes = [
  { path: '', component: MovementsPageComponent, canActivate: [roleGuard], data: { roles: [UserRole.ADMIN, UserRole.STAFF, UserRole.MANAGER] } },
];
