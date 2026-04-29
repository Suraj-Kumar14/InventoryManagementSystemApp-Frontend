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
  templateUrl: './movements-page.component.html',
  styleUrls: ['./movements-page.component.css'],
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
      : productId ? this.service.getByProduct(productId)
      : warehouseId ? this.service.getByWarehouse(warehouseId)
      : this.service.getMovements();

    request.pipe(finalize(() => (this.loading = false))).subscribe({
      next: (movements) => (this.movements = warehouseId && productId
        ? movements.filter((m) => m.productId === productId && m.warehouseId === warehouseId)
        : movements),
      error: () => (this.movements = []),
    });
  }

  create(): void {
    const userId = this.auth.getUserId();
    if (this.form.invalid || !userId) return;
    this.saving = true;
    const raw = this.form.getRawValue();
    const payload: StockMovementRequest = { ...raw, performedBy: userId, referenceId: raw.referenceId || null, referenceType: raw.referenceType || null, notes: raw.notes || null };
    this.service.create(payload).pipe(finalize(() => (this.saving = false))).subscribe({
      next: () => { this.notifications.success('Movement recorded successfully.'); this.loadMovements(); },
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
  { path: '', component: MovementsPageComponent, canActivate: [roleGuard], data: { roles: [UserRole.ADMIN, UserRole.STAFF, UserRole.MANAGER] } },
];
