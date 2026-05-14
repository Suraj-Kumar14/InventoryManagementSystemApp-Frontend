import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Routes } from '@angular/router';
import { debounceTime, distinctUntilChanged, finalize, Subject, switchMap } from 'rxjs';
import { WarehouseRequest, WarehouseResponse, UserProfile } from '../../../core/http/backend.models';
import { AuthService } from '../../../core/auth/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { WarehouseService } from '../../../core/services/warehouse.service';
import { AdminUserService } from '../../../core/services/admin-user.service';
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
  private readonly adminUserService = inject(AdminUserService);
  private readonly fb = inject(FormBuilder);
  private readonly notifications = inject(NotificationService);
  private readonly authService = inject(AuthService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly searchInput$ = new Subject<string>();

  warehouses: WarehouseResponse[] = [];
  managerOptions: UserProfile[] = [];
  loading = false;
  loadingManagers = false;
  saving = false;
  editingId: number | null = null;
  actionWarehouseId: number | null = null;
  searchQuery = '';
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
    this.setupSearch();
    this.loadManagers();
    this.loadWarehouses();
  }

  onSearchInput(value: string): void {
    this.searchQuery = value;
    this.searchInput$.next(value);
  }

  clearSearch(): void {
    this.onSearchInput('');
  }

  loadWarehouses(query = this.searchQuery): void {
    const trimmedQuery = query.trim();
    this.loading = true;
    this.cdr.markForCheck();
    const request = trimmedQuery ? this.service.searchWarehouses(trimmedQuery) : this.service.getWarehouses();

    request
      .pipe(finalize(() => {
        this.loading = false;
        this.refreshView();
      }))
      .subscribe({
        next: (warehouses) => {
          this.warehouses = [...warehouses];
          this.refreshView();
        },
        error: (error) => {
          this.warehouses = [];
          this.notifications.error(this.errorMessage(error, 'Failed to load warehouses'), 'Error');
          this.refreshView();
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
    this.cdr.markForCheck();
    const currentEditingId = this.editingId;
    const request = currentEditingId
      ? this.service.updateWarehouse(currentEditingId, payload)
      : this.service.createWarehouse(payload);

    request.pipe(finalize(() => {
      this.saving = false;
      this.refreshView();
    })).subscribe({
      next: (savedWarehouse) => {
        this.notifications.success(currentEditingId ? 'Warehouse updated successfully' : 'Warehouse created successfully');
        this.warehouses = currentEditingId
          ? this.warehouses.map((warehouse) =>
              this.warehouseId(warehouse) === savedWarehouse.warehouseId ? savedWarehouse : warehouse)
          : [savedWarehouse, ...this.warehouses];
        this.resetForm();
        this.refreshView();
        this.loadWarehouses();
      },
      error: (error) => {
        this.notifications.error(
          this.errorMessage(error, currentEditingId ? 'Failed to update warehouse' : 'Failed to create warehouse'),
          'Error'
        );
        this.refreshView();
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
      managerId: warehouse.managerId ?? null,
      capacity: warehouse.capacity,
      phone: warehouse.phone || '',
    });
    this.cdr.markForCheck();
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
    this.cdr.markForCheck();
  }

  toggleWarehouse(warehouse: WarehouseResponse): void {
    const warehouseId = this.warehouseId(warehouse);
    const active = this.isWarehouseActive(warehouse);
    const action = active ? 'deactivate' : 'activate';

    if (!window.confirm(`Are you sure you want to ${action} this warehouse?`)) {
      return;
    }

    this.actionWarehouseId = warehouseId;
    this.cdr.markForCheck();
    const request = active
      ? this.service.deactivateWarehouse(warehouseId)
      : this.service.activateWarehouse(warehouseId);

    request.pipe(finalize(() => {
      this.actionWarehouseId = null;
      this.refreshView();
    })).subscribe({
      next: (updatedWarehouse) => {
        this.notifications.success(active ? 'Warehouse deactivated successfully' : 'Warehouse activated successfully');
        this.warehouses = this.warehouses.map((item) =>
          this.warehouseId(item) === updatedWarehouse.warehouseId ? updatedWarehouse : item);
        this.refreshView();
        this.loadWarehouses();
      },
      error: (error) => {
        this.notifications.error(
          this.errorMessage(error, active ? 'Failed to deactivate warehouse' : 'Failed to activate warehouse'),
          'Error'
        );
        this.refreshView();
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

  managerLabel(warehouse: WarehouseResponse): string {
    if (!warehouse.managerId) {
      return '-';
    }

    const manager = this.managerOptions.find((item) => item.userId === warehouse.managerId);
    if (!manager) {
      return `Manager #${warehouse.managerId}`;
    }

    return `${manager.name} (#${manager.userId})`;
  }

  private setupSearch(): void {
    this.searchInput$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((query) => {
          this.loading = true;
          this.refreshView();
          const trimmedQuery = query.trim();
          return (trimmedQuery ? this.service.searchWarehouses(trimmedQuery) : this.service.getWarehouses()).pipe(
            finalize(() => {
              this.loading = false;
              this.refreshView();
            })
          );
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: (warehouses) => {
          this.warehouses = [...warehouses];
          this.refreshView();
        },
        error: (error) => {
          this.warehouses = [];
          this.notifications.error(this.errorMessage(error, 'Failed to search warehouses'), 'Error');
          this.refreshView();
        },
      });
  }

  private loadManagers(): void {
    this.loadingManagers = true;
    this.refreshView();
    this.adminUserService
      .getUsers({ page: 0, size: 100, role: UserRole.MANAGER, status: 'ACTIVE' })
      .pipe(finalize(() => {
        this.loadingManagers = false;
        this.refreshView();
      }))
      .subscribe({
        next: (page) => {
          this.managerOptions = page.content.filter((user) => user.isActive !== false);
          this.refreshView();
        },
        error: () => {
          this.managerOptions = [];
          this.notifications.error('Unable to load active managers right now.', 'Error');
          this.refreshView();
        },
      });
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

  private refreshView(): void {
    this.cdr.markForCheck();
    this.cdr.detectChanges();
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



