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
  create(payload: SupplierRequest) { return this.http.post<SupplierResponse>(`${this.baseUrl}${API_ENDPOINTS.SUPPLIERS.ROOT}`, payload); }
  update(id: number, payload: SupplierRequest) { return this.http.put<SupplierResponse>(`${this.baseUrl}${API_ENDPOINTS.SUPPLIERS.ROOT}/${id}`, payload); }
  deactivate(id: number) { return this.http.put(`${this.baseUrl}${API_ENDPOINTS.SUPPLIERS.DEACTIVATE(id)}`, {}, { responseType: 'text' }); }
  delete(id: number) { return this.http.delete(`${this.baseUrl}${API_ENDPOINTS.SUPPLIERS.ROOT}/${id}`, { responseType: 'text' }); }
}

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './suppliers-page.component.html',
  styleUrls: ['./suppliers-page.component.css'],
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

  constructor() { this.loadSuppliers(); }

  loadSuppliers(): void {
    this.loading = true;
    this.service.getSuppliers(this.searchControl.value).pipe(finalize(() => (this.loading = false))).subscribe({
      next: (suppliers) => (this.suppliers = suppliers),
      error: () => (this.suppliers = []),
    });
  }

  save(): void {
    if (!this.canManage || this.form.invalid) return;
    this.saving = true;
    const payload = this.form.getRawValue() as SupplierRequest;
    const request = this.editingId ? this.service.update(this.editingId, payload) : this.service.create(payload);
    request.pipe(finalize(() => (this.saving = false))).subscribe({
      next: () => { this.notifications.success(this.editingId ? 'Supplier updated successfully.' : 'Supplier created successfully.'); this.resetForm(); this.loadSuppliers(); },
    });
  }

  edit(supplier: SupplierResponse): void {
    this.editingId = supplier.supplierId;
    this.form.patchValue({ name: supplier.name, contactPerson: supplier.contactPerson || '', email: supplier.email, phone: supplier.phone || '', address: supplier.address || '', city: supplier.city, country: supplier.country, taxId: supplier.taxId || '', paymentTerms: supplier.paymentTerms || 'NET-30', leadTimeDays: supplier.leadTimeDays });
  }

  deactivate(supplier: SupplierResponse): void {
    this.actionId = supplier.supplierId;
    this.service.deactivate(supplier.supplierId).pipe(finalize(() => (this.actionId = null))).subscribe({
      next: (message) => { this.notifications.success(message || 'Supplier deactivated successfully.'); this.loadSuppliers(); },
    });
  }

  remove(supplier: SupplierResponse): void {
    this.actionId = supplier.supplierId;
    this.service.delete(supplier.supplierId).pipe(finalize(() => (this.actionId = null))).subscribe({
      next: (message) => { this.notifications.success(message || 'Supplier deleted successfully.'); this.loadSuppliers(); },
    });
  }

  resetForm(): void {
    this.editingId = null;
    this.form.reset({ name: '', contactPerson: '', email: '', phone: '', address: '', city: '', country: '', taxId: '', paymentTerms: 'NET-30', leadTimeDays: 1 });
  }
}

export const suppliersRoutes: Routes = [
  { path: '', component: SuppliersPageComponent, canActivate: [roleGuard], data: { roles: [UserRole.ADMIN, UserRole.OFFICER] } },
];
