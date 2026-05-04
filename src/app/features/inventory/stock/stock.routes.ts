import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Routes } from '@angular/router';
import { finalize } from 'rxjs/operators';
import {
  StockLevelResponse,
  StockTransferRequest,
  StockUpdateRequest,
  WarehouseResponse,
} from '../../../core/http/backend.models';
import { NotificationService } from '../../../core/services/notification.service';
import { WarehouseService } from '../../../core/services/warehouse.service';
import { AuthService } from '../../../core/auth/services/auth.service';
import { UserRole } from '../../../shared/config/app-config';
import { roleGuard } from '../../../core/guards/role.guard';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './stock-page.component.html',
  styleUrls: ['./stock-page.component.css'],
})
class StockPageComponent {
  private readonly service = inject(WarehouseService);
  private readonly fb = inject(FormBuilder);
  private readonly notifications = inject(NotificationService);
  private readonly authService = inject(AuthService);

  warehouses: WarehouseResponse[] = [];
  stock: StockLevelResponse[] = [];
  loading = false;
  saving = false;
  transferring = false;
  readonly canMutate = this.authService.hasRole([UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF]);
  warehouseIdControl = this.fb.nonNullable.control(0);
  thresholdControl = this.fb.nonNullable.control(10);

  updateForm = this.fb.nonNullable.group({
    productId: [0, [Validators.required, Validators.min(1)]],
    quantity: [0, [Validators.required, Validators.min(0)]],
    reason: ['Manual update'],
  });

  transferForm = this.fb.nonNullable.group({
    sourceWarehouseId: [0, [Validators.required, Validators.min(1)]],
    destinationWarehouseId: [0, [Validators.required, Validators.min(1)]],
    productId: [0, [Validators.required, Validators.min(1)]],
    quantity: [0, [Validators.required, Validators.min(1)]],
    reasonCode: ['', [Validators.required]],
    notes: [''],
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
    this.service
      .getStockByWarehouse(warehouseId)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (stock) => (this.stock = stock),
        error: () => (this.stock = []),
      });
  }

  loadLowStock(): void {
    this.loading = true;
    this.service
      .getLowStock()
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (stock) => (this.stock = stock),
        error: () => (this.stock = []),
      });
  }

  updateStock(): void {
    if (this.updateForm.invalid || !this.warehouseIdControl.value) {
      return;
    }

    this.saving = true;
    const payload: StockUpdateRequest = {
      warehouseId: this.warehouseIdControl.value,
      ...this.updateForm.getRawValue(),
      reason: this.updateForm.getRawValue().reason || 'Manual update',
      notes: null,
    };

    this.service
      .updateStock(payload)
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
    const payload: StockTransferRequest = this.transferForm.getRawValue();
    this.service
      .transferStock(payload)
      .pipe(finalize(() => (this.transferring = false)))
      .subscribe({
        next: () => {
          this.notifications.success('Stock transferred successfully.');
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
    data: { roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF, UserRole.OFFICER] },
  },
];
