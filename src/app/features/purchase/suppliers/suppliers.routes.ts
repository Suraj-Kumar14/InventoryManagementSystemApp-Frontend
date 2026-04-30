import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Routes } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { SupplierRequest, SupplierResponse } from '../../../core/http/backend.models';
import { AuthService } from '../../../core/auth/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { PurchaseService } from '../../../core/services/purchase.service';
import { UserRole } from '../../../shared/config/app-config';
import { roleGuard } from '../../../core/guards/role.guard';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './suppliers-page.component.html',
  styleUrls: ['./suppliers-page.component.css'],
})
class SuppliersPageComponent {
  private readonly service = inject(PurchaseService);
  private readonly fb = inject(FormBuilder);
  private readonly notifications = inject(NotificationService);
  private readonly auth = inject(AuthService);

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
    this.service
      .getSuppliers({ keyword: this.searchControl.value, page: 0, size: 50 })
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
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
    const request = this.editingId
      ? this.service.updateSupplier(this.editingId, payload)
      : this.service.createSupplier(payload);

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
    this.service
      .deactivateSupplier(supplier.supplierId)
      .pipe(finalize(() => (this.actionId = null)))
      .subscribe({
        next: (message) => {
          this.notifications.success(message || 'Supplier deactivated successfully.');
          this.loadSuppliers();
        },
      });
  }

  remove(supplier: SupplierResponse): void {
    this.actionId = supplier.supplierId;
    this.service
      .deleteSupplier(supplier.supplierId)
      .pipe(finalize(() => (this.actionId = null)))
      .subscribe({
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
  {
    path: '',
    component: SuppliersPageComponent,
    canActivate: [roleGuard],
    data: { roles: [UserRole.ADMIN, UserRole.OFFICER] },
  },
];
