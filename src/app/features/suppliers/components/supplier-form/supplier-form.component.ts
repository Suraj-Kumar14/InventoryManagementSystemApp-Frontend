import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CreateSupplierRequest, SupplierResponse, UpdateSupplierRequest } from '../../../../core/http/backend.models';

@Component({
  selector: 'app-supplier-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './supplier-form.component.html',
  styleUrls: ['./supplier-form.component.css'],
})
export class SupplierFormComponent implements OnChanges {
  private readonly fb = inject(FormBuilder);

  @Input() supplier: SupplierResponse | null = null;
  @Input() loading = false;
  @Input() mode: 'create' | 'edit' = 'create';
  @Input() readOnly = false;
  @Output() submitted = new EventEmitter<CreateSupplierRequest | UpdateSupplierRequest>();
  @Output() cancelled = new EventEmitter<void>();

  readonly form = this.fb.nonNullable.group({
    supplierCode: [''],
    name: ['', [Validators.required, Validators.maxLength(200)]],
    contactPerson: ['', Validators.maxLength(200)],
    email: ['', Validators.email],
    phone: ['', Validators.pattern(/^[+]?[0-9]{10,15}$/)],
    alternatePhone: ['', Validators.pattern(/^[+]?[0-9]{10,15}$/)],
    address: ['', Validators.maxLength(500)],
    city: ['', Validators.maxLength(100)],
    state: ['', Validators.maxLength(100)],
    country: ['', Validators.maxLength(100)],
    postalCode: ['', Validators.maxLength(20)],
    taxNumber: ['', Validators.maxLength(50)],
    gstNumber: ['', Validators.maxLength(50)],
    paymentTerms: ['NET-30', [Validators.required, Validators.maxLength(50)]],
    leadTimeDays: [0, [Validators.required, Validators.min(0)]],
    rating: [0, [Validators.min(0), Validators.max(5)]],
    notes: ['', Validators.maxLength(1000)],
    status: ['ACTIVE'],
    isActive: [true],
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['supplier']) {
      this.patchForm();
    }

    if (changes['readOnly']) {
      if (this.readOnly) {
        this.form.disable({ emitEvent: false });
      } else {
        this.form.enable({ emitEvent: false });
      }
    }
  }

  submit(): void {
    if (this.readOnly) {
      return;
    }

    this.form.markAllAsTouched();
    if (this.form.invalid) {
      return;
    }

    const raw = this.form.getRawValue();
    const payload: UpdateSupplierRequest = {
      supplierCode: raw.supplierCode || null,
      name: raw.name.trim(),
      contactPerson: raw.contactPerson || null,
      email: raw.email || null,
      phone: raw.phone || null,
      alternatePhone: raw.alternatePhone || null,
      address: raw.address || null,
      city: raw.city || null,
      state: raw.state || null,
      country: raw.country || null,
      postalCode: raw.postalCode || null,
      taxNumber: raw.taxNumber || null,
      gstNumber: raw.gstNumber || null,
      paymentTerms: raw.paymentTerms.trim(),
      leadTimeDays: Number(raw.leadTimeDays),
      rating: Number(raw.rating),
      notes: raw.notes || null,
      status: raw.status as UpdateSupplierRequest['status'],
      isActive: raw.isActive,
    };

    if (this.mode === 'create') {
      delete payload.status;
      delete payload.isActive;
    }

    this.submitted.emit(payload);
  }

  private patchForm(): void {
    if (!this.supplier) {
      this.form.reset({
        supplierCode: '',
        name: '',
        contactPerson: '',
        email: '',
        phone: '',
        alternatePhone: '',
        address: '',
        city: '',
        state: '',
        country: '',
        postalCode: '',
        taxNumber: '',
        gstNumber: '',
        paymentTerms: 'NET-30',
        leadTimeDays: 0,
        rating: 0,
        notes: '',
        status: 'ACTIVE',
        isActive: true,
      });
      return;
    }

    this.form.patchValue({
      supplierCode: this.supplier.supplierCode ?? '',
      name: this.supplier.name,
      contactPerson: this.supplier.contactPerson ?? '',
      email: this.supplier.email ?? '',
      phone: this.supplier.phone ?? '',
      alternatePhone: this.supplier.alternatePhone ?? '',
      address: this.supplier.address ?? '',
      city: this.supplier.city ?? '',
      state: this.supplier.state ?? '',
      country: this.supplier.country ?? '',
      postalCode: this.supplier.postalCode ?? '',
      taxNumber: this.supplier.taxNumber ?? this.supplier.taxId ?? '',
      gstNumber: this.supplier.gstNumber ?? '',
      paymentTerms: this.supplier.paymentTerms ?? 'NET-30',
      leadTimeDays: this.supplier.leadTimeDays ?? 0,
      rating: this.supplier.rating ?? 0,
      notes: this.supplier.notes ?? '',
      status: this.supplier.status ?? 'ACTIVE',
      isActive: this.supplier.isActive,
    });
  }
}
