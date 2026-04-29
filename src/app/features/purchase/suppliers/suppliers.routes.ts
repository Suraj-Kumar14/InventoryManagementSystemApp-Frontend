import { CommonModule } from '@angular/common';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Component, Injectable, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Routes } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { SupplierRequest, SupplierResponse } from '../../../core/http/backend.models';
import { AuthService } from '../../../core/auth/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { API_ENDPOINTS, UserRole } from '../../../shared/config/app-config';
import { environment } from '../../../../environments/environment';
import { roleGuard } from '../../../core/guards/role.guard';

@Injectable({ providedIn: 'root' })
class SuppliersService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;

  getSuppliers(keyword?: string) {
    if (keyword?.trim()) {
      const params = new HttpParams().set('keyword', keyword.trim());
      return this.http.get<SupplierResponse[]>(`${this.baseUrl}${API_ENDPOINTS.SUPPLIERS.SEARCH}`, { params });
    }

    return this.http.get<SupplierResponse[]>(`${this.baseUrl}${API_ENDPOINTS.SUPPLIERS.ROOT}`);
  }

  create(payload: SupplierRequest) {
    return this.http.post<SupplierResponse>(`${this.baseUrl}${API_ENDPOINTS.SUPPLIERS.ROOT}`, payload);
  }

  update(id: number, payload: SupplierRequest) {
    return this.http.put<SupplierResponse>(`${this.baseUrl}${API_ENDPOINTS.SUPPLIERS.ROOT}/${id}`, payload);
  }

  deactivate(id: number) {
    return this.http.put(`${this.baseUrl}${API_ENDPOINTS.SUPPLIERS.DEACTIVATE(id)}`, {}, { responseType: 'text' });
  }

  delete(id: number) {
    return this.http.delete(`${this.baseUrl}${API_ENDPOINTS.SUPPLIERS.ROOT}/${id}`, { responseType: 'text' });
  }
}

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <section class="space-y-6">
      <div>
        <h1 class="text-3xl font-bold text-neutral-900">Suppliers</h1>
        <p class="mt-2 text-neutral-600">Manage suppliers using purchase-service APIs only.</p>
      </div>

      <div class="flex gap-3">
        <input [formControl]="searchControl" placeholder="Search suppliers" class="w-full rounded-lg border border-neutral-300 px-4 py-2" />
        <button type="button" (click)="loadSuppliers()" [disabled]="loading" class="rounded-lg bg-primary-600 px-4 py-2 text-white disabled:opacity-50">
          {{ loading ? 'Loading...' : 'Search' }}
        </button>
      </div>

      <form *ngIf="canManage" [formGroup]="form" (ngSubmit)="save()" class="grid gap-4 rounded-xl border border-neutral-200 bg-white p-6 md:grid-cols-2">
        <input formControlName="name" placeholder="Supplier name" class="rounded-lg border border-neutral-300 px-4 py-2" />
        <input formControlName="contactPerson" placeholder="Contact person" class="rounded-lg border border-neutral-300 px-4 py-2" />
        <input formControlName="email" placeholder="Email" class="rounded-lg border border-neutral-300 px-4 py-2" />
        <input formControlName="phone" placeholder="Phone" class="rounded-lg border border-neutral-300 px-4 py-2" />
        <input formControlName="city" placeholder="City" class="rounded-lg border border-neutral-300 px-4 py-2" />
        <input formControlName="country" placeholder="Country" class="rounded-lg border border-neutral-300 px-4 py-2" />
        <input formControlName="taxId" placeholder="Tax ID" class="rounded-lg border border-neutral-300 px-4 py-2" />
        <input formControlName="paymentTerms" placeholder="Payment terms" class="rounded-lg border border-neutral-300 px-4 py-2" />
        <input formControlName="leadTimeDays" type="number" placeholder="Lead time days" class="rounded-lg border border-neutral-300 px-4 py-2" />
        <textarea formControlName="address" placeholder="Address" class="rounded-lg border border-neutral-300 px-4 py-2 md:col-span-2"></textarea>
        <div class="md:col-span-2 flex gap-3">
          <button type="submit" [disabled]="form.invalid || saving" class="rounded-lg bg-primary-600 px-4 py-2 text-white disabled:opacity-50">
            {{ saving ? 'Saving...' : editingId ? 'Update Supplier' : 'Create Supplier' }}
          </button>
          <button type="button" (click)="resetForm()" class="rounded-lg border border-neutral-300 px-4 py-2">Clear</button>
        </div>
      </form>

      <div *ngIf="loading" class="rounded-xl border border-neutral-200 bg-white p-6 text-neutral-600">Loading suppliers...</div>
      <div *ngIf="!loading && suppliers.length === 0" class="rounded-xl border border-dashed border-neutral-300 bg-white p-8 text-center text-neutral-600">No suppliers returned by the backend.</div>
      <div *ngIf="!loading && suppliers.length > 0" class="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        <table class="min-w-full divide-y divide-neutral-200 text-sm">
          <thead class="bg-neutral-50 text-left text-neutral-600"><tr><th class="px-4 py-3">Name</th><th class="px-4 py-3">City</th><th class="px-4 py-3">Email</th><th class="px-4 py-3">Rating</th><th class="px-4 py-3">Actions</th></tr></thead>
          <tbody class="divide-y divide-neutral-200">
            <tr *ngFor="let supplier of suppliers">
              <td class="px-4 py-3 font-medium text-neutral-900">{{ supplier.name }}</td>
              <td class="px-4 py-3">{{ supplier.city }}, {{ supplier.country }}</td>
              <td class="px-4 py-3">{{ supplier.email }}</td>
              <td class="px-4 py-3">{{ supplier.rating ?? 0 }}</td>
              <td class="px-4 py-3 flex gap-2">
                <button *ngIf="canManage" type="button" (click)="edit(supplier)" class="rounded-md border border-neutral-300 px-3 py-1">Edit</button>
                <button *ngIf="canManage" type="button" (click)="deactivate(supplier)" [disabled]="actionId === supplier.supplierId || !supplier.isActive" class="rounded-md border border-danger-300 px-3 py-1 text-danger-700 disabled:opacity-50">Deactivate</button>
                <button *ngIf="canManage" type="button" (click)="remove(supplier)" [disabled]="actionId === supplier.supplierId" class="rounded-md border border-danger-300 px-3 py-1 text-danger-700 disabled:opacity-50">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  `,
})
class SuppliersPageComponent {
  private service = inject(SuppliersService);
  private fb = inject(FormBuilder);
  private notifications = inject(NotificationService);
  private auth = inject(AuthService);

  readonly canManage = this.auth.hasRole([UserRole.ADMIN, UserRole.OFFICER]);
  suppliers: SupplierResponse[] = [];
  loading = false;
  saving = false;
  editingId: number | null = null;
  actionId: number | null = null;
  searchControl = this.fb.nonNullable.control('');

  form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    contactPerson: [''],
    email: ['', [Validators.required, Validators.email]],
    phone: [''],
    address: [''],
    city: ['', Validators.required],
    country: ['', Validators.required],
    taxId: [''],
    paymentTerms: ['NET-30'],
    leadTimeDays: [1, [Validators.required, Validators.min(1)]],
  });

  constructor() {
    this.loadSuppliers();
  }

  loadSuppliers(): void {
    this.loading = true;
    this.service.getSuppliers(this.searchControl.value).pipe(finalize(() => (this.loading = false))).subscribe({
      next: (suppliers) => (this.suppliers = suppliers),
      error: () => (this.suppliers = []),
    });
  }

  save(): void {
    if (!this.canManage || this.form.invalid) {
      return;
    }
    this.saving = true;
    const payload = this.form.getRawValue() as SupplierRequest;
    const request = this.editingId ? this.service.update(this.editingId, payload) : this.service.create(payload);
    request.pipe(finalize(() => (this.saving = false))).subscribe({
      next: () => {
        this.notifications.success(this.editingId ? 'Supplier updated successfully.' : 'Supplier created successfully.');
        this.resetForm();
        this.loadSuppliers();
      },
    });
  }

  edit(supplier: SupplierResponse): void {
    this.editingId = supplier.supplierId;
    this.form.patchValue({
      name: supplier.name,
      contactPerson: supplier.contactPerson || '',
      email: supplier.email,
      phone: supplier.phone || '',
      address: supplier.address || '',
      city: supplier.city,
      country: supplier.country,
      taxId: supplier.taxId || '',
      paymentTerms: supplier.paymentTerms || 'NET-30',
      leadTimeDays: supplier.leadTimeDays,
    });
  }

  deactivate(supplier: SupplierResponse): void {
    this.actionId = supplier.supplierId;
    this.service.deactivate(supplier.supplierId).pipe(finalize(() => (this.actionId = null))).subscribe({
      next: (message) => {
        this.notifications.success(message || 'Supplier deactivated successfully.');
        this.loadSuppliers();
      },
    });
  }

  remove(supplier: SupplierResponse): void {
    this.actionId = supplier.supplierId;
    this.service.delete(supplier.supplierId).pipe(finalize(() => (this.actionId = null))).subscribe({
      next: (message) => {
        this.notifications.success(message || 'Supplier deleted successfully.');
        this.loadSuppliers();
      },
    });
  }

  resetForm(): void {
    this.editingId = null;
    this.form.reset({
      name: '',
      contactPerson: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      country: '',
      taxId: '',
      paymentTerms: 'NET-30',
      leadTimeDays: 1,
    });
  }
}

export const suppliersRoutes: Routes = [
  { path: '', component: SuppliersPageComponent, canActivate: [roleGuard], data: { roles: [UserRole.ADMIN, UserRole.OFFICER] } },
];
