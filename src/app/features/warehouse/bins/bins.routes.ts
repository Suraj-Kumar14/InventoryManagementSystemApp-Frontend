import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Routes } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { StockLevelResponse, WarehouseResponse } from '../../../core/http/backend.models';
import { WarehouseService } from '../../../core/services/warehouse.service';
import { UserRole } from '../../../shared/config/app-config';
import { roleGuard } from '../../../core/guards/role.guard';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './bins-page.component.html',
  styleUrls: ['./bins-page.component.css'],
})
class BinsPageComponent {
  private readonly service = inject(WarehouseService);
  private readonly fb = inject(FormBuilder);

  warehouses: WarehouseResponse[] = [];
  bins: StockLevelResponse[] = [];
  loading = false;
  warehouseControl = this.fb.nonNullable.control(0);

  constructor() {
    this.service.getWarehouses().subscribe({
      next: (warehouses) => (this.warehouses = warehouses),
      error: () => (this.warehouses = []),
    });
  }

  loadBins(): void {
    if (!this.warehouseControl.value) {
      this.bins = [];
      return;
    }

    this.loading = true;
    this.service
      .getStockByWarehouse(this.warehouseControl.value)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (stock) => (this.bins = stock.filter((item) => !!item.binLocation)),
        error: () => (this.bins = []),
      });
  }
}

export const binsRoutes: Routes = [
  {
    path: '',
    component: BinsPageComponent,
    canActivate: [roleGuard],
    data: { roles: [UserRole.ADMIN, UserRole.STAFF] },
  },
];
