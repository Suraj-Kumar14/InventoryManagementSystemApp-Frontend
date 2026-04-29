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
  templateUrl: './bins-page.component.html',
  styleUrls: ['./bins-page.component.css'],
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
    this.http.get<WarehouseResponse[]>(`${this.baseUrl}${API_ENDPOINTS.WAREHOUSES.ROOT}`).subscribe({
      next: (warehouses) => (this.warehouses = warehouses),
      error: () => (this.warehouses = []),
    });
  }

  loadBins(): void {
    this.loading = true;
    this.http.get<StockLevelResponse[]>(`${this.baseUrl}${API_ENDPOINTS.STOCK.BY_WAREHOUSE(this.warehouseControl.value)}`)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (stock) => (this.bins = stock.filter((item) => !!item.binLocation)),
        error: () => (this.bins = []),
      });
  }
}

export const binsRoutes: Routes = [
  { path: '', component: BinsPageComponent, canActivate: [roleGuard], data: { roles: [UserRole.ADMIN, UserRole.STAFF] } },
];
