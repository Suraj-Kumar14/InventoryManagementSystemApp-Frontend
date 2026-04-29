import { CommonModule } from '@angular/common';
import { HttpClient, HttpParams } from '@angular/common/http';
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
    if (status?.trim()) {
      return this.http.get<PurchaseOrderResponse[]>(`${this.baseUrl}${API_ENDPOINTS.PURCHASE_ORDERS.BY_STATUS(status.trim())}`);
    }

    return this.http.get<PurchaseOrderResponse[]>(`${this.baseUrl}${API_ENDPOINTS.PURCHASE_ORDERS.ROOT}`);
  }

  getSuppliers() {
    return this.http.get<SupplierResponse[]>(`${this.baseUrl}${API_ENDPOINTS.SUPPLIERS.ROOT}`);
  }

  getWarehouses() {
    return this.http.get<WarehouseResponse[]>(`${this.baseUrl}${API_ENDPOINTS.WAREHOUSES.ROOT}`);
  }

  create(payload: PurchaseOrderRequest) {
    return this.http.post<PurchaseOrderResponse>(`${this.baseUrl}${API_ENDPOINTS.PURCHASE_ORDERS.ROOT}`, payload);
  }

  approve(id: number) {
    return this.http.put<PurchaseOrderResponse>(`${this.baseUrl}${API_ENDPOINTS.PURCHASE_ORDERS.APPROVE(id)}`, {});
  }

  submit(id: number) {
    return this.http.put<PurchaseOrderResponse>(`${this.baseUrl}${API_ENDPOINTS.PURCHASE_ORDERS.SUBMIT(id)}`, {});
  }

  cancel(id: number, reason: string) {
    return this.http.put<PurchaseOrderResponse>(`${this.baseUrl}${API_ENDPOINTS.PURCHASE_ORDERS.CANCEL(id)}`, { reason });
  }

  reject(id: number, reason: string) {
    return this.http.put<PurchaseOrderResponse>(`${this.baseUrl}${API_ENDPOINTS.PURCHASE_ORDERS.REJECT(id)}`, { reason });
  }

  receiveGoods(id: number, payload: GoodsReceiptRequest[]) {
    return this.http.post<PurchaseOrderResponse>(`${this.baseUrl}${API_ENDPOINTS.PURCHASE_ORDERS.RECEIVE_GOODS(id)}`, payload);
  }
}

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section class="space-y-6">
      <div><h1 class="text-3xl font-bold text-neutral-900">Purchase Orders</h1><p class="mt-2 text-neutral-600">Create and process purchase orders from backend APIs.</p></div>
      <div class="flex gap-3">
        <input [formControl]="statusControl" placeholder="Filter by status" class="w-full rounded-lg border border-neutral-300 px-4 py-2" />
        <button type="button" (click)="loadOrders()" [disabled]="loading" class="rounded-lg bg-primary-600 px-4 py-2 text-white disabled:opacity-50">{{ loading ? 'Loading...' : 'Filter' }}</button>
      </div>

      <form [formGroup]="form" (ngSubmit)="create()" class="grid gap-4 rounded-xl border border-neutral-200 bg-white p-6 md:grid-cols-2">
        <select formControlName="supplierId" class="rounded-lg border border-neutral-300 px-4 py-2">
          <option [ngValue]="0">Select supplier</option>
          <option *ngFor="let supplier of suppliers" [ngValue]="supplier.supplierId">{{ supplier.name }}</option>
        </select>
        <select formControlName="warehouseId" class="rounded-lg border border-neutral-300 px-4 py-2">
          <option [ngValue]="0">Select warehouse</option>
          <option *ngFor="let warehouse of warehouses" [ngValue]="warehouse.warehouseId">{{ warehouse.name }}</option>
        </select>
        <input formControlName="productId" type="number" placeholder="Product ID" class="rounded-lg border border-neutral-300 px-4 py-2" />
        <input formControlName="quantity" type="number" placeholder="Quantity" class="rounded-lg border border-neutral-300 px-4 py-2" />
        <input formControlName="unitCost" type="number" step="0.01" placeholder="Unit cost" class="rounded-lg border border-neutral-300 px-4 py-2" />
        <input formControlName="expectedDate" type="date" class="rounded-lg border border-neutral-300 px-4 py-2" />
        <input formControlName="referenceNumber" placeholder="Reference number" class="rounded-lg border border-neutral-300 px-4 py-2" />
        <textarea formControlName="notes" placeholder="Notes" class="rounded-lg border border-neutral-300 px-4 py-2 md:col-span-2"></textarea>
        <button type="submit" [disabled]="form.invalid || saving" class="rounded-lg bg-primary-600 px-4 py-2 text-white disabled:opacity-50 md:col-span-2">
          {{ saving ? 'Creating...' : 'Create Purchase Order' }}
        </button>
      </form>

      <div *ngIf="loading" class="rounded-xl border border-neutral-200 bg-white p-6 text-neutral-600">Loading purchase orders...</div>
      <div *ngIf="!loading && orders.length === 0" class="rounded-xl border border-dashed border-neutral-300 bg-white p-8 text-center text-neutral-600">No purchase orders returned by the backend.</div>
      <div *ngIf="!loading && orders.length > 0" class="space-y-4">
        <article *ngFor="let order of orders" class="rounded-xl border border-neutral-200 bg-white p-5">
          <div class="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 class="text-lg font-semibold text-neutral-900">PO #{{ order.poId }} • {{ order.status }}</h2>
              <p class="text-sm text-neutral-500">Supplier {{ order.supplierId }} • Warehouse {{ order.warehouseId }} • Amount {{ order.totalAmount }}</p>
              <p class="mt-3 text-neutral-700">{{ order.notes || 'No notes' }}</p>
            </div>
            <div class="flex flex-wrap gap-2">
              <button type="button" (click)="submit(order.poId)" class="rounded-md border border-neutral-300 px-3 py-1">Submit</button>
              <button type="button" (click)="approve(order.poId)" class="rounded-md border border-neutral-300 px-3 py-1">Approve</button>
              <button type="button" (click)="reject(order.poId)" class="rounded-md border border-danger-300 px-3 py-1 text-danger-700">Reject</button>
              <button type="button" (click)="cancel(order.poId)" class="rounded-md border border-danger-300 px-3 py-1 text-danger-700">Cancel</button>
              <button type="button" (click)="receive(order)" class="rounded-md border border-neutral-300 px-3 py-1">Receive</button>
            </div>
          </div>
        </article>
      </div>
    </section>
  `,
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
    this.service.getSuppliers().subscribe({ next: (suppliers) => (this.suppliers = suppliers), error: () => (this.suppliers = []) });
    this.service.getWarehouses().subscribe({ next: (warehouses) => (this.warehouses = warehouses), error: () => (this.warehouses = []) });
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
    if (this.form.invalid || !userId) {
      return;
    }

    const raw = this.form.getRawValue();
    const payload: PurchaseOrderRequest = {
      supplierId: raw.supplierId,
      warehouseId: raw.warehouseId,
      createdById: userId,
      expectedDate: raw.expectedDate || null,
      notes: raw.notes || null,
      referenceNumber: raw.referenceNumber || null,
      lineItems: [{ productId: raw.productId, quantity: raw.quantity, unitCost: raw.unitCost }],
    };

    this.saving = true;
    this.service.create(payload).pipe(finalize(() => (this.saving = false))).subscribe({
      next: () => {
        this.notifications.success('Purchase order created successfully.');
        this.loadOrders();
      },
    });
  }

  submit(id: number): void { this.service.submit(id).subscribe({ next: () => { this.notifications.success('Purchase order submitted.'); this.loadOrders(); } }); }
  approve(id: number): void { this.service.approve(id).subscribe({ next: () => { this.notifications.success('Purchase order approved.'); this.loadOrders(); } }); }
  reject(id: number): void { this.service.reject(id, 'Rejected from frontend').subscribe({ next: () => { this.notifications.success('Purchase order rejected.'); this.loadOrders(); } }); }
  cancel(id: number): void { this.service.cancel(id, 'Cancelled from frontend').subscribe({ next: () => { this.notifications.success('Purchase order cancelled.'); this.loadOrders(); } }); }
  receive(order: PurchaseOrderResponse): void {
    const firstLine = order.lineItems[0];
    if (!firstLine) { return; }
    this.service.receiveGoods(order.poId, [{ lineItemId: firstLine.lineItemId, receivedQty: firstLine.quantity }]).subscribe({
      next: () => { this.notifications.success('Goods receipt recorded.'); this.loadOrders(); },
    });
  }
}

export const ordersRoutes: Routes = [
  { path: '', component: OrdersPageComponent, canActivate: [roleGuard], data: { roles: [UserRole.ADMIN, UserRole.OFFICER] } },
];
