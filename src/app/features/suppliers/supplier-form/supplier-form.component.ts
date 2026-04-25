import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  CreateSupplierRequest,
  Supplier,
  UpdateSupplierRequest
} from '../../../core/models';
import { SupplierService } from '../../../core/services/supplier.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-supplier-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './supplier-form.component.html',
  styleUrls: ['./supplier-form.component.css']
})
export class SupplierFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly supplierService = inject(SupplierService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);

  readonly supplierId = signal<number | null>(null);
  readonly supplierMeta = signal<Supplier | null>(null);
  readonly loading = signal(false);
  readonly saving = signal(false);

  readonly paymentTermsOptions = ['IMMEDIATE', 'NET15', 'NET30', 'NET45', 'NET60', 'NET90'];

  readonly form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(150)]],
    contactPerson: ['', [Validators.required, Validators.maxLength(120)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(150)]],
    phone: ['', [Validators.maxLength(30), Validators.pattern(/^[0-9+\-()\s]{7,30}$/)]],
    address: ['', [Validators.required, Validators.maxLength(255)]],
    city: ['', [Validators.required, Validators.maxLength(100)]],
    country: ['India', [Validators.required, Validators.maxLength(100)]],
    taxId: ['', [Validators.required, Validators.maxLength(80)]],
    paymentTerms: ['NET30', Validators.required],
    leadTimeDays: [7, [Validators.required, Validators.min(0)]]
  });

  readonly isEdit = computed(() => this.supplierId() != null);

  get controls() {
    return this.form.controls;
  }

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) {
      return;
    }

    this.supplierId.set(id);
    this.loading.set(true);
    this.supplierService.getSupplierById(id).subscribe({
      next: (supplier) => {
        this.supplierMeta.set(supplier);
        this.form.patchValue({
          name: supplier.name,
          contactPerson: supplier.contactPerson,
          email: supplier.email,
          phone: supplier.phone ?? '',
          address: supplier.address ?? '',
          city: supplier.city,
          country: supplier.country,
          taxId: supplier.taxId,
          paymentTerms: supplier.paymentTerms,
          leadTimeDays: supplier.leadTimeDays
        });
        this.loading.set(false);
      },
      error: (error) => {
        this.toast.error('Unable to load supplier', error.error?.message ?? error.message);
        this.router.navigate(['/suppliers']);
      }
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const rawValue = this.form.getRawValue();
    const basePayload: CreateSupplierRequest = {
      name: rawValue.name?.trim() ?? '',
      contactPerson: rawValue.contactPerson?.trim() ?? '',
      email: rawValue.email?.trim() ?? '',
      phone: rawValue.phone?.trim() || null,
      address: rawValue.address?.trim() ?? '',
      city: rawValue.city?.trim() ?? '',
      country: rawValue.country?.trim() ?? '',
      taxId: rawValue.taxId?.trim() ?? '',
      paymentTerms: rawValue.paymentTerms?.trim() ?? '',
      leadTimeDays: Number(rawValue.leadTimeDays ?? 0)
    };

    const updatePayload: UpdateSupplierRequest = {
      ...basePayload,
      isActive: this.supplierMeta()?.isActive ?? true,
      rating: this.supplierMeta()?.rating ?? 0
    };

    const request$ = this.isEdit()
      ? this.supplierService.updateSupplier(this.supplierId()!, updatePayload)
      : this.supplierService.createSupplier(basePayload);

    request$.subscribe({
      next: (supplier) => {
        this.toast.success(this.isEdit() ? 'Supplier updated' : 'Supplier created');
        this.router.navigate(['/suppliers', supplier.id]);
      },
      error: (error) => {
        this.saving.set(false);
        this.toast.error('Save failed', error.error?.message ?? error.message);
      }
    });
  }

  cancel(): void {
    const supplierId = this.supplierId();
    this.router.navigate(supplierId ? ['/suppliers', supplierId] : ['/suppliers']);
  }

  getErrorMessage(controlName: keyof typeof this.controls): string {
    const control = this.controls[controlName];

    if (!control.touched || !control.errors) {
      return '';
    }

    if (control.errors['required']) {
      switch (controlName) {
        case 'contactPerson':
          return 'Contact person is required.';
        case 'leadTimeDays':
          return 'Lead time is required.';
        case 'paymentTerms':
          return 'Payment terms are required.';
        case 'taxId':
          return 'Tax id is required.';
        default:
          return `${this.toLabel(controlName)} is required.`;
      }
    }

    if (control.errors['email']) {
      return 'Enter a valid email address.';
    }

    if (control.errors['min']) {
      return 'Value cannot be negative.';
    }

    if (control.errors['pattern']) {
      return 'Enter a valid phone number.';
    }

    if (control.errors['maxlength']) {
      return `${this.toLabel(controlName)} is too long.`;
    }

    return 'Please review this field.';
  }

  private toLabel(controlName: string): string {
    return controlName
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (value) => value.toUpperCase());
  }
}
