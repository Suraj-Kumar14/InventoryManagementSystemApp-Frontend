import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, Injectable, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Routes } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { GoodsReceiptRequest, PurchaseOrderRequest, PurchaseOrderResponse, SupplierResponse, WarehouseResponse } from '../../../core/http/backend.models';
import { AuthService } from '../../../core/auth/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { API_ENDPOINTS, UserRole } from '../../../shared/config/app-config';
import { environment } from '../../../../environments/environment';
import { roleGuard } from '../../../core/guards/role.guard';

@Injectable({ providedIn: 'root' })
class OrdersService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;

  getOrders(status?: string) {
    if (status?.trim()) return this.http.get<PurchaseOrderResponse[]>(`${this.baseUrl}${API_ENDPOINTS.PURCHASE_ORDERS.BY_STATUS(status.trim())}`);
    return this.http.get<PurchaseOrderResponse[]>(`${this.baseUrl}${API_ENDPOINTS.PURCHASE_ORDERS.ROOT}`);
  }
  getSuppliers() { return this.http.get<SupplierResponse[]>(`${this.baseUrl}${API_ENDPOINTS.SUPPLIERS.ROOT}`); }
  getWarehouses() { return this.http.get<WarehouseResponse[]>(`${this.baseUrl}${API_ENDPOINTS.WAREHOUSES.ROOT}`); }
  create(payload: PurchaseOrderRequest) { return this.http.post<PurchaseOrderResponse>(`${this.baseUrl}${API_ENDPOINTS.PURCHASE_ORDERS.ROOT}`, payload); }
  approve(id: number) { return this.http.put<PurchaseOrderResponse>(`${this.baseUrl}${API_ENDPOINTS.PURCHASE_ORDERS.APPROVE(id)}`, {}); }
  submit(id: number) { return this.http.put<PurchaseOrderResponse>(`${this.baseUrl}${API_ENDPOINTS.PURCHASE_ORDERS.SUBMIT(id)}`, {}); }
  cancel(id: number, reason: string) { return this.http.put<PurchaseOrderResponse>(`${this.baseUrl}${API_ENDPOINTS.PURCHASE_ORDERS.CANCEL(id)}`, { reason }); }
  reject(id: number, reason: string) { return this.http.put<PurchaseOrderResponse>(`${this.baseUrl}${API_ENDPOINTS.PURCHASE_ORDERS.REJECT(id)}`, { reason }); }
  receiveGoods(id: number, payload: GoodsReceiptRequest[]) { return this.http.post<PurchaseOrderResponse>(`${this.baseUrl}${API_ENDPOINTS.PURCHASE_ORDERS.RECEIVE_GOODS(id)}`, payload); }
}

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './orders-page.component.html',
  styleUrls: ['./orders-page.component.css'],
})
class OrdersPageComponent {
  private service = inject(OrdersService);
  private auth = inject(AuthService);
  private fb = inject(FormBuilder);
  private notifications = inject(NotificationService);

  suppliers: SupplierResponse[] = [];
  warehouses: WarehouseResponse[] = [];
  orders: PurchaseOrderResponse[] = [];
  loading = false;
  saving = false;
  statusControl = this.fb.nonNullable.control('');

  form = this.fb.nonNullable.group({
    supplierId: [0, [Validators.required, Validators.min(1)]],
    warehouseId: [0, [Validators.required, Validators.min(1)]],
    productId: [0, [Validators.required, Validators.min(1)]],
    quantity: [1, [Validators.required, Validators.min(1)]],
    unitCost: [1, [Validators.required, Validators.min(0.01)]],
    expectedDate: [''],
    notes: [''],
    referenceNumber: [''],
  });

  constructor() {
    this.loadOrders();
    this.service.getSuppliers().subscribe({ next: (s) => (this.suppliers = s), error: () => (this.suppliers = []) });
    this.service.getWarehouses().subscribe({ next: (w) => (this.warehouses = w), error: () => (this.warehouses = []) });
  }

  loadOrders(): void {
    this.loading = true;
    this.service.getOrders(this.statusControl.value).pipe(finalize(() => (this.loading = false))).subscribe({
      next: (orders) => (this.orders = orders),
      error: () => (this.orders = []),
    });
  }

  create(): void {
    const userId = this.auth.getUserId();
    if (this.form.invalid || !userId) return;
    const raw = this.form.getRawValue();
    const payload: PurchaseOrderRequest = {
      supplierId: raw.supplierId, warehouseId: raw.warehouseId, createdById: userId,
      expectedDate: raw.expectedDate || null, notes: raw.notes || null, referenceNumber: raw.referenceNumber || null,
      lineItems: [{ productId: raw.productId, quantity: raw.quantity, unitCost: raw.unitCost }],
    };
    this.saving = true;
    this.service.create(payload).pipe(finalize(() => (this.saving = false))).subscribe({
      next: () => { this.notifications.success('Purchase order created successfully.'); this.loadOrders(); },
    });
  }

  submit(id: number): void { this.service.submit(id).subscribe({ next: () => { this.notifications.success('Purchase order submitted.'); this.loadOrders(); } }); }
  approve(id: number): void { this.service.approve(id).subscribe({ next: () => { this.notifications.success('Purchase order approved.'); this.loadOrders(); } }); }
  reject(id: number): void { this.service.reject(id, 'Rejected from frontend').subscribe({ next: () => { this.notifications.success('Purchase order rejected.'); this.loadOrders(); } }); }
  cancel(id: number): void { this.service.cancel(id, 'Cancelled from frontend').subscribe({ next: () => { this.notifications.success('Purchase order cancelled.'); this.loadOrders(); } }); }
  receive(order: PurchaseOrderResponse): void {
    const firstLine = order.lineItems[0];
    if (!firstLine) return;
    this.service.receiveGoods(order.poId, [{ lineItemId: firstLine.lineItemId, receivedQty: firstLine.quantity }]).subscribe({
      next: () => { this.notifications.success('Goods receipt recorded.'); this.loadOrders(); },
    });
  }
}

export const ordersRoutes: Routes = [
  { path: '', component: OrdersPageComponent, canActivate: [roleGuard], data: { roles: [UserRole.ADMIN, UserRole.OFFICER] } },
];
