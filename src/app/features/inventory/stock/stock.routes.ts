import { CommonModule } from '@angular/common';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Component, Injectable, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Routes } from '@angular/router';
import { finalize } from 'rxjs/operators';
import {
  AcknowledgeWarehouseStockAlertRequest,
  BarcodeStockLookupResponse,
  StockAuditRequest,
  StockAuditResponse,
  StockLevelResponse,
  StockTransferRequest,
  StockUpdateRequest,
  WarehouseResponse,
  WarehouseStockAlertResponse,
  WarehouseStockMovementResponse,
} from '../../../core/http/backend.models';
import { NotificationService } from '../../../core/services/notification.service';
import { API_ENDPOINTS, UserRole } from '../../../shared/config/app-config';
import { environment } from '../../../../environments/environment';
import { roleGuard } from '../../../core/guards/role.guard';

@Injectable({ providedIn: 'root' })
class StockService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;

  getWarehouses() {
    return this.http.get<WarehouseResponse[]>(`${this.baseUrl}${API_ENDPOINTS.WAREHOUSES.ROOT}`);
  }

  getStockByWarehouse(warehouseId: number) {
    return this.http.get<StockLevelResponse[]>(`${this.baseUrl}${API_ENDPOINTS.STOCK.BY_WAREHOUSE(warehouseId)}`);
  }

  getLowStock(threshold: number) {
    const params = new HttpParams().set('threshold', threshold);
    return this.http.get<StockLevelResponse[]>(`${this.baseUrl}${API_ENDPOINTS.STOCK.LOW_STOCK}`, { params });
  }

  getMovementHistory(warehouseId?: number, productId?: number) {
    let params = new HttpParams();
    if (warehouseId) params = params.set('warehouseId', warehouseId);
    if (productId) params = params.set('productId', productId);
    return this.http.get<WarehouseStockMovementResponse[]>(`${this.baseUrl}${API_ENDPOINTS.STOCK.MOVEMENTS}`, { params });
  }

  updateStock(warehouseId: number, payload: StockUpdateRequest) {
    return this.http.put<StockLevelResponse>(`${this.baseUrl}${API_ENDPOINTS.STOCK.UPDATE(warehouseId)}`, payload);
  }

  transferStock(payload: StockTransferRequest) {
    return this.http.post(`${this.baseUrl}${API_ENDPOINTS.STOCK.TRANSFER}`, payload, { responseType: 'text' });
  }

  performAudit(payload: StockAuditRequest) {
    return this.http.post<StockAuditResponse>(`${this.baseUrl}${API_ENDPOINTS.STOCK.AUDIT}`, payload);
  }

  lookupByBarcode(barcode: string) {
    return this.http.get<BarcodeStockLookupResponse>(`${this.baseUrl}${API_ENDPOINTS.STOCK.BARCODE(barcode)}`);
  }

  getStockAlerts() {
    return this.http.get<WarehouseStockAlertResponse[]>(`${this.baseUrl}${API_ENDPOINTS.STOCK.ALERTS}`);
  }

  acknowledgeStockAlert(alertId: number, payload: AcknowledgeWarehouseStockAlertRequest) {
    return this.http.post<WarehouseStockAlertResponse>(
      `${this.baseUrl}${API_ENDPOINTS.STOCK.ACKNOWLEDGE_ALERT(alertId)}`,
      payload
    );
  }
}

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './stock-page.component.html',
  styleUrls: ['./stock-page.component.css'],
})
class StockPageComponent {
  private service = inject(StockService);
  private fb = inject(FormBuilder);
  private notifications = inject(NotificationService);

  warehouses: WarehouseResponse[] = [];
  stock: StockLevelResponse[] = [];
  loading = false;
  saving = false;
  transferring = false;
  warehouseIdControl = this.fb.nonNullable.control(0);
  thresholdControl = this.fb.nonNullable.control(10);

  updateForm = this.fb.nonNullable.group({
    productId: [0, [Validators.required, Validators.min(1)]],
    quantity: [0, [Validators.required, Validators.min(0)]],
    binLocation: [''],
  });

  transferForm = this.fb.nonNullable.group({
    fromWarehouseId: [0, [Validators.required, Validators.min(1)]],
    toWarehouseId: [0, [Validators.required, Validators.min(1)]],
    productId: [0, [Validators.required, Validators.min(1)]],
    quantity: [0, [Validators.required, Validators.min(1)]],
    reason: ['', [Validators.required]],
  });

  constructor() {
    this.service.getWarehouses().subscribe({
      next: (warehouses) => (this.warehouses = warehouses),
      error: () => (this.warehouses = []),
    });
  }

  loadWarehouseStock(): void {
    const warehouseId = this.warehouseIdControl.value;
    if (!warehouseId) return;
    this.loading = true;
    this.service.getStockByWarehouse(warehouseId).pipe(finalize(() => (this.loading = false))).subscribe({
      next: (stock) => (this.stock = stock),
      error: () => (this.stock = []),
    });
  }

  loadLowStock(): void {
    this.loading = true;
    this.service.getLowStock(this.thresholdControl.value).pipe(finalize(() => (this.loading = false))).subscribe({
      next: (stock) => (this.stock = stock),
      error: () => (this.stock = []),
    });
  }

  updateStock(): void {
    if (this.updateForm.invalid || !this.warehouseIdControl.value) return;
    this.saving = true;
    this.service
      .updateStock(this.warehouseIdControl.value, this.updateForm.getRawValue())
      .pipe(finalize(() => (this.saving = false)))
      .subscribe({ next: () => { this.notifications.success('Stock updated successfully.'); this.loadWarehouseStock(); } });
  }

  transferStock(): void {
    if (this.transferForm.invalid) return;
    this.transferring = true;
    this.service
      .transferStock(this.transferForm.getRawValue())
      .pipe(finalize(() => (this.transferring = false)))
      .subscribe({ next: (message) => { this.notifications.success(message || 'Stock transferred successfully.'); this.loadWarehouseStock(); } });
  }
}

export const stockRoutes: Routes = [
  {
    path: '',
    component: StockPageComponent,
    canActivate: [roleGuard],
    data: { roles: [UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF] },
  },
];
