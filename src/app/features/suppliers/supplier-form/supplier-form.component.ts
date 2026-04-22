import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { SupplierService } from '../../../core/services/supplier.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-supplier-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="page-header">
      <div><h1 class="page-title">{{ isEdit ? 'Edit Supplier' : 'Add Supplier' }}</h1></div>
    </div>
    <div class="card" style="max-width:780px">
      <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">Supplier Name *</label>
            <input type="text" class="form-control" formControlName="name"
                   [class.is-invalid]="f['name'].invalid && f['name'].touched" placeholder="Company name" />
            @if (f['name'].invalid && f['name'].touched) { <div class="form-error">Name is required</div> }
          </div>
          <div class="form-group">
            <label class="form-label">Contact Person</label>
            <input type="text" class="form-control" formControlName="contactPerson" placeholder="Full name" />
          </div>
          <div class="form-group">
            <label class="form-label">Email *</label>
            <input type="email" class="form-control" formControlName="email"
                   [class.is-invalid]="f['email'].invalid && f['email'].touched" placeholder="supplier@example.com" />
          </div>
          <div class="form-group">
            <label class="form-label">Phone</label>
            <input type="tel" class="form-control" formControlName="phone" placeholder="+91 9876543210" />
          </div>
          <div class="form-group">
            <label class="form-label">City</label>
            <input type="text" class="form-control" formControlName="city" placeholder="Mumbai" />
          </div>
          <div class="form-group">
            <label class="form-label">Country</label>
            <input type="text" class="form-control" formControlName="country" placeholder="India" />
          </div>
          <div class="form-group">
            <label class="form-label">Payment Terms</label>
            <select class="form-control" formControlName="paymentTerms">
              <option value="NET30">NET 30</option><option value="NET60">NET 60</option>
              <option value="NET90">NET 90</option><option value="IMMEDIATE">Immediate</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Lead Time (days)</label>
            <input type="number" class="form-control" formControlName="leadTimeDays" min="0" />
          </div>
          <div class="form-group" style="grid-column:1/-1">
            <label class="form-label">Address</label>
            <textarea class="form-control" formControlName="address" rows="2" placeholder="Full address"></textarea>
          </div>
          <div class="form-group" style="grid-column:1/-1">
            <label class="form-label">Notes</label>
            <textarea class="form-control" formControlName="notes" rows="2" placeholder="Any special terms or notes"></textarea>
          </div>
        </div>
        <div class="form-actions">
          <button type="button" class="btn btn-secondary" routerLink="/suppliers">Cancel</button>
          <button type="submit" class="btn btn-primary" [disabled]="saving()">
            @if (saving()) { <span class="spinner"></span> Saving... } @else { {{ isEdit ? 'Update' : 'Add Supplier' }} }
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`.form-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:0 1.25rem}.form-actions{display:flex;justify-content:flex-end;gap:.75rem;margin-top:1.5rem;padding-top:1.25rem;border-top:1px solid var(--border-color)}`]
})
export class SupplierFormComponent implements OnInit {
  fb       = inject(FormBuilder);
  suppSvc  = inject(SupplierService);
  router   = inject(Router);
  route    = inject(ActivatedRoute);
  toast    = inject(ToastService);
  suppId   = signal<number | null>(null);
  saving   = signal(false);

  form = this.fb.group({
    name:          ['', Validators.required],
    contactPerson: [''],
    email:         ['', [Validators.required, Validators.email]],
    phone:         [''],
    city:          [''],
    country:       ['India'],
    address:       [''],
    paymentTerms:  ['NET30'],
    leadTimeDays:  [7],
    notes:         ['']
  });

  get f() { return this.form.controls; }
  get isEdit() { return this.suppId() != null; }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.suppId.set(+id);
      this.suppSvc.getById(+id).subscribe({ next: s => this.form.patchValue(s as never) });
    }
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    const val = this.form.getRawValue() as never;
    const op = this.isEdit ? this.suppSvc.update(this.suppId()!, val) : this.suppSvc.create(val);
    op.subscribe({
      next: () => { this.toast.success(this.isEdit ? 'Supplier updated!' : 'Supplier added!'); this.router.navigate(['/suppliers']); },
      error: err => { this.saving.set(false); this.toast.error('Save failed', err.error?.message); }
    });
  }
}
