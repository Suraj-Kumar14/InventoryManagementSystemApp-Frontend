import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Routes } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { StockMovementRequest, StockMovementResponse } from '../../../core/http/backend.models';
import { AuthService } from '../../../core/auth/services/auth.service';
import { MovementService } from '../../../core/services/movement.service';
import { NotificationService } from '../../../core/services/notification.service';
import { UserRole } from '../../../shared/config/app-config';
import { roleGuard } from '../../../core/guards/role.guard';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './movements-page.component.html',
  styleUrls: ['./movements-page.component.css'],
})
class MovementsPageComponent {
  private readonly service = inject(MovementService);
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly notifications = inject(NotificationService);

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

  constructor() {
    this.loadMovements();
  }

  loadMovements(): void {
    this.loading = true;

    const productId = this.filterProductIdControl.value || undefined;
    const warehouseId = this.filterWarehouseIdControl.value || undefined;
    const startDate = this.startDateControl.value;
    const endDate = this.endDateControl.value;

    const request = startDate && endDate
      ? this.service.getMovementsByDateRange(startDate, endDate)
      : this.service.getMovements({
          productId,
          warehouseId,
        });

    request.pipe(finalize(() => (this.loading = false))).subscribe({
      next: (movements) => (this.movements = movements),
      error: () => (this.movements = []),
    });
  }

  create(): void {
    const userId = this.auth.getUserId();
    if (this.form.invalid || !userId) {
      return;
    }

    this.saving = true;
    const raw = this.form.getRawValue();
    const payload: StockMovementRequest = {
      ...raw,
      performedBy: userId,
      referenceId: raw.referenceId || null,
      referenceType: raw.referenceType || null,
      notes: raw.notes || null,
    };

    this.service
      .createMovement(payload)
      .pipe(finalize(() => (this.saving = false)))
      .subscribe({
        next: () => {
          this.notifications.success('Movement recorded successfully.');
          this.loadMovements();
        },
      });
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
  {
    path: '',
    component: MovementsPageComponent,
    canActivate: [roleGuard],
    data: { roles: [UserRole.ADMIN, UserRole.STAFF, UserRole.MANAGER] },
  },
];
