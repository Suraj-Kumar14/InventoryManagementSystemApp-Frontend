import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, Injectable, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Routes } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { WarehouseRequest, WarehouseResponse } from '../../../core/http/backend.models';
import { NotificationService } from '../../../core/services/notification.service';
import { API_ENDPOINTS, UserRole } from '../../../shared/config/app-config';
import { environment } from '../../../../environments/environment';
import { roleGuard } from '../../../core/guards/role.guard';

@Injectable({ providedIn: 'root' })
class WarehousesAdminService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;

  getWarehouses() {
    return this.http.get<WarehouseResponse[]>(`${this.baseUrl}${API_ENDPOINTS.WAREHOUSES.ROOT}`);
  }

  createWarehouse(payload: WarehouseRequest) {
    return this.http.post<WarehouseResponse>(`${this.baseUrl}${API_ENDPOINTS.WAREHOUSES.ROOT}`, payload);
  }

  updateWarehouse(id: number, payload: WarehouseRequest) {
    return this.http.put<WarehouseResponse>(`${this.baseUrl}${API_ENDPOINTS.WAREHOUSES.ROOT}/${id}`, payload);
  }

  deactivateWarehouse(id: number) {
    return this.http.put(`${this.baseUrl}${API_ENDPOINTS.WAREHOUSES.DEACTIVATE(id)}`, {}, { responseType: 'text' });
  }
}

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section class="space-y-6">
      <div class="flex flex-col gap-2">
        <h1 class="text-3xl font-bold text-neutral-900">Warehouses</h1>
        <p class="text-neutral-600">Create, update, and deactivate warehouses using the backend service.</p>
      </div>

      <form [formGroup]="form" (ngSubmit)="save()" class="grid gap-4 rounded-xl border border-neutral-200 bg-white p-6 md:grid-cols-2">
        <input formControlName="name" placeholder="Warehouse name" class="rounded-lg border border-neutral-300 px-4 py-2" />
        <input formControlName="location" placeholder="Location" class="rounded-lg border border-neutral-300 px-4 py-2" />
        <input formControlName="address" placeholder="Address" class="rounded-lg border border-neutral-300 px-4 py-2" />
        <input formControlName="managerId" type="number" placeholder="Manager ID" class="rounded-lg border border-neutral-300 px-4 py-2" />
        <input formControlName="capacity" type="number" placeholder="Capacity" class="rounded-lg border border-neutral-300 px-4 py-2" />
        <input formControlName="phone" placeholder="Phone" class="rounded-lg border border-neutral-300 px-4 py-2" />
        <div class="md:col-span-2 flex gap-3">
          <button type="submit" [disabled]="form.invalid || saving" class="rounded-lg bg-primary-600 px-4 py-2 text-white disabled:opacity-50">
            {{ saving ? 'Saving...' : editingId ? 'Update Warehouse' : 'Create Warehouse' }}
          </button>
          <button type="button" (click)="resetForm()" class="rounded-lg border border-neutral-300 px-4 py-2">
            Clear
          </button>
        </div>
      </form>

      <div *ngIf="loading" class="rounded-xl border border-neutral-200 bg-white p-6 text-neutral-600">Loading warehouses...</div>
      <div *ngIf="!loading && warehouses.length === 0" class="rounded-xl border border-dashed border-neutral-300 bg-white p-8 text-center text-neutral-600">
        No warehouses returned by the backend.
      </div>

      <div *ngIf="!loading && warehouses.length > 0" class="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        <table class="min-w-full divide-y divide-neutral-200 text-sm">
          <thead class="bg-neutral-50 text-left text-neutral-600">
            <tr>
              <th class="px-4 py-3">Name</th>
              <th class="px-4 py-3">Location</th>
              <th class="px-4 py-3">Capacity</th>
              <th class="px-4 py-3">Used</th>
              <th class="px-4 py-3">Status</th>
              <th class="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-neutral-200">
            <tr *ngFor="let warehouse of warehouses">
              <td class="px-4 py-3 font-medium text-neutral-900">{{ warehouse.name }}</td>
              <td class="px-4 py-3">{{ warehouse.location }}</td>
              <td class="px-4 py-3">{{ warehouse.capacity }}</td>
              <td class="px-4 py-3">{{ warehouse.usedCapacity ?? 0 }}</td>
              <td class="px-4 py-3">{{ warehouse.isActive ? 'Active' : 'Inactive' }}</td>
              <td class="px-4 py-3 flex gap-2">
                <button type="button" (click)="edit(warehouse)" class="rounded-md border border-neutral-300 px-3 py-1">Edit</button>
                <button
                  type="button"
                  (click)="deactivate(warehouse)"
                  [disabled]="!warehouse.isActive || actionWarehouseId === warehouse.warehouseId"
                  class="rounded-md border border-danger-300 px-3 py-1 text-danger-700 disabled:opacity-50"
                >
                  {{ actionWarehouseId === warehouse.warehouseId ? 'Working...' : 'Deactivate' }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  `,
})
class WarehousesAdminPageComponent {
  private service = inject(WarehousesAdminService);
  private fb = inject(FormBuilder);
  private notifications = inject(NotificationService);

  warehouses: WarehouseResponse[] = [];
  loading = false;
  saving = false;
  editingId: number | null = null;
  actionWarehouseId: number | null = null;

  form = this.fb.nonNullable.group({
    name: ['', [Validators.required]],
    location: ['', [Validators.required]],
    address: [''],
    managerId: [0],
    capacity: [1, [Validators.required, Validators.min(1)]],
    phone: [''],
  });

  constructor() {
    this.loadWarehouses();
  }

  loadWarehouses(): void {
    this.loading = true;
    this.service
      .getWarehouses()
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (warehouses) => (this.warehouses = warehouses),
        error: () => (this.warehouses = []),
      });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const payload: WarehouseRequest = {
      name: raw.name,
      location: raw.location,
      address: raw.address || null,
      managerId: raw.managerId || null,
      capacity: raw.capacity,
      phone: raw.phone || null,
    };

    this.saving = true;
    const request = this.editingId
      ? this.service.updateWarehouse(this.editingId, payload)
      : this.service.createWarehouse(payload);

    request.pipe(finalize(() => (this.saving = false))).subscribe({
      next: () => {
        this.notifications.success(this.editingId ? 'Warehouse updated successfully.' : 'Warehouse created successfully.');
        this.resetForm();
        this.loadWarehouses();
      },
    });
  }

  edit(warehouse: WarehouseResponse): void {
    this.editingId = warehouse.warehouseId;
    this.form.patchValue({
      name: warehouse.name,
      location: warehouse.location,
      address: warehouse.address || '',
      managerId: warehouse.managerId || 0,
      capacity: warehouse.capacity,
      phone: warehouse.phone || '',
    });
  }

  resetForm(): void {
    this.editingId = null;
    this.form.reset({
      name: '',
      location: '',
      address: '',
      managerId: 0,
      capacity: 1,
      phone: '',
    });
  }

  deactivate(warehouse: WarehouseResponse): void {
    this.actionWarehouseId = warehouse.warehouseId;
    this.service
      .deactivateWarehouse(warehouse.warehouseId)
      .pipe(finalize(() => (this.actionWarehouseId = null)))
      .subscribe({
        next: (message) => {
          this.notifications.success(message || 'Warehouse deactivated successfully.');
          this.loadWarehouses();
        },
      });
  }
}

export const warehousesRoutes: Routes = [
  {
    path: '',
    component: WarehousesAdminPageComponent,
    canActivate: [roleGuard],
    data: { roles: [UserRole.ADMIN] },
  },
];
