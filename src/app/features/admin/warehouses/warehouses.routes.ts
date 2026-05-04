import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Routes } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { WarehouseRequest, WarehouseResponse } from '../../../core/http/backend.models';
import { AuthService } from '../../../core/auth/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { WarehouseService } from '../../../core/services/warehouse.service';
import { UserRole } from '../../../shared/config/app-config';
import { roleGuard } from '../../../core/guards/role.guard';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './warehouses-page.component.html',
  styleUrls: ['./warehouses-page.component.css'],
})
class WarehousesAdminPageComponent {
  private readonly service = inject(WarehouseService);
  private readonly fb = inject(FormBuilder);
  private readonly notifications = inject(NotificationService);
  private readonly authService = inject(AuthService);

  warehouses: WarehouseResponse[] = [];
  loading = false;
  saving = false;
  editingId: number | null = null;
  actionWarehouseId: number | null = null;
  readonly canManage = this.authService.hasRole([UserRole.ADMIN]);

  form = this.fb.nonNullable.group({
    name: ['', [Validators.required]],
    code: ['', [Validators.required]],
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
      code: raw.code,
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
      code: warehouse.code,
      location: warehouse.location,
      address: warehouse.address || '',
      managerId: warehouse.managerId || 0,
      capacity: warehouse.capacity,
      phone: warehouse.phone || '',
    });
  }

  resetForm(): void {
    this.editingId = null;
    this.form.reset({ name: '', code: '', location: '', address: '', managerId: 0, capacity: 1, phone: '' });
  }

  deactivate(warehouse: WarehouseResponse): void {
    this.actionWarehouseId = warehouse.warehouseId;
    this.service
      .deactivateWarehouse(warehouse.warehouseId)
      .pipe(finalize(() => (this.actionWarehouseId = null)))
      .subscribe({
        next: () => {
          this.notifications.success('Warehouse deactivated successfully.');
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
    data: { roles: [UserRole.ADMIN, UserRole.INVENTORY_MANAGER, UserRole.PURCHASE_OFFICER, UserRole.WAREHOUSE_STAFF] },
  },
];
