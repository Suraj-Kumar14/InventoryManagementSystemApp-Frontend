import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Routes } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { WarehouseRequest, WarehouseResponse } from '../../../core/http/backend.models';
import { AuthService } from '../../../core/auth/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { WarehouseService } from '../../../core/services/warehouse.service';
import { UserRole } from '../../../shared/config/app-config';
import { roleGuard } from '../../../core/guards/role.guard';

const INDIAN_PHONE_REGEX = /^[6-9][0-9]{9}$/;

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './warehouses-page.component.html',
  styleUrls: ['./warehouses-page.component.css'],
})
class WarehousesAdminPageComponent implements OnInit {
  private readonly service = inject(WarehouseService);
  private readonly fb = inject(FormBuilder);
  private readonly notifications = inject(NotificationService);
  private readonly authService = inject(AuthService);

  warehouses: WarehouseResponse[] = [];
  loading = false;
  saving = false;
  editingId: number | null = null;
  actionWarehouseId: number | null = null;
  readonly canManage = this.authService.hasRole([UserRole.ADMIN, UserRole.MANAGER]);

  form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    code: ['', [Validators.required]],
    location: ['', [Validators.required]],
    address: ['', [Validators.required]],
    city: ['Bhopal', [Validators.required]],
    state: ['Madhya Pradesh', [Validators.required]],
    country: ['India', [Validators.required]],
    managerId: [null as number | null],
    capacity: [1, [Validators.required, Validators.min(1)]],
    phone: ['', [Validators.pattern(INDIAN_PHONE_REGEX)]],
  });

  ngOnInit(): void {
    this.loadWarehouses();
  }

  loadWarehouses(): void {
    this.loading = true;
    this.service
      .getWarehouses()
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (warehouses) => (this.warehouses = warehouses),
        error: (error) => {
          this.warehouses = [];
          this.notifications.error(this.errorMessage(error, 'Failed to load warehouses'), 'Error');
        },
      });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const payload: WarehouseRequest = {
      name: raw.name.trim(),
      code: raw.code.trim().toUpperCase(),
      location: raw.location.trim(),
      address: raw.address.trim(),
      city: raw.city.trim(),
      state: raw.state.trim(),
      country: raw.country.trim(),
      managerId: raw.managerId || null,
      capacity: Number(raw.capacity),
      phone: raw.phone?.trim() || null,
      isActive: this.editingId ? this.findWarehouse(this.editingId)?.isActive ?? true : true,
    };

    this.saving = true;
    const currentEditingId = this.editingId;
    const request = currentEditingId
      ? this.service.updateWarehouse(currentEditingId, payload)
      : this.service.createWarehouse(payload);

    request.pipe(finalize(() => (this.saving = false))).subscribe({
      next: (savedWarehouse) => {
        this.notifications.success(currentEditingId ? 'Warehouse updated successfully' : 'Warehouse created successfully');
        this.warehouses = currentEditingId
          ? this.warehouses.map((warehouse) =>
              this.warehouseId(warehouse) === savedWarehouse.warehouseId ? savedWarehouse : warehouse)
          : [savedWarehouse, ...this.warehouses];
        this.resetForm();
        this.loadWarehouses();
      },
      error: (error) => {
        this.notifications.error(
          this.errorMessage(error, currentEditingId ? 'Failed to update warehouse' : 'Failed to create warehouse'),
          'Error'
        );
      },
    });
  }

  edit(warehouse: WarehouseResponse): void {
    this.editingId = this.warehouseId(warehouse);
    this.form.patchValue({
      name: warehouse.name,
      code: warehouse.code,
      location: warehouse.location,
      address: warehouse.address || '',
      city: warehouse.city || '',
      state: warehouse.state || '',
      country: warehouse.country || 'India',
      managerId: warehouse.managerId || 0,
      capacity: warehouse.capacity,
      phone: warehouse.phone || '',
    });
  }

  resetForm(): void {
    this.editingId = null;
    this.form.reset({
      name: '',
      code: '',
      location: '',
      address: '',
      city: 'Bhopal',
      state: 'Madhya Pradesh',
      country: 'India',
      managerId: null,
      capacity: 1,
      phone: '',
    });
  }

  toggleWarehouse(warehouse: WarehouseResponse): void {
    const warehouseId = this.warehouseId(warehouse);
    const active = this.isWarehouseActive(warehouse);
    const action = active ? 'deactivate' : 'activate';

    if (!window.confirm(`Are you sure you want to ${action} this warehouse?`)) {
      return;
    }

    this.actionWarehouseId = warehouseId;
    const request = active
      ? this.service.deactivateWarehouse(warehouseId)
      : this.service.activateWarehouse(warehouseId);

    request.pipe(finalize(() => (this.actionWarehouseId = null))).subscribe({
      next: (updatedWarehouse) => {
        this.notifications.success(active ? 'Warehouse deactivated successfully' : 'Warehouse activated successfully');
        this.warehouses = this.warehouses.map((item) =>
          this.warehouseId(item) === updatedWarehouse.warehouseId ? updatedWarehouse : item);
        this.loadWarehouses();
      },
      error: (error) => {
        this.notifications.error(
          this.errorMessage(error, active ? 'Failed to deactivate warehouse' : 'Failed to activate warehouse'),
          'Error'
        );
      },
    });
  }

  warehouseId(warehouse: WarehouseResponse): number {
    return Number(warehouse.warehouseId ?? warehouse.id);
  }

  isWarehouseActive(warehouse: WarehouseResponse): boolean {
    return warehouse.isActive ?? warehouse.active ?? true;
  }

  isToggling(warehouse: WarehouseResponse): boolean {
    return this.actionWarehouseId === this.warehouseId(warehouse);
  }

  private findWarehouse(id: number): WarehouseResponse | undefined {
    return this.warehouses.find((warehouse) => this.warehouseId(warehouse) === id);
  }

  private errorMessage(error: unknown, fallback: string): string {
    const err = error as { error?: { message?: string; error?: string } | string; message?: string };
    if (typeof err?.error === 'string') {
      return err.error;
    }
    return err?.error?.message || err?.error?.error || err?.message || fallback;
  }
}

export const warehousesRoutes: Routes = [
  {
    path: '',
    component: WarehousesAdminPageComponent,
    canActivate: [roleGuard],
    data: { roles: [UserRole.ADMIN, UserRole.MANAGER] },
  },
];
