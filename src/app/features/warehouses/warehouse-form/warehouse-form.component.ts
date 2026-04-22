import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { WarehouseService } from '../../../core/services/warehouse.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-warehouse-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="page-header">
      <div>
        <h1 class="page-title">{{ isEdit ? 'Edit Warehouse' : 'Add Warehouse' }}</h1>
        <p class="page-subtitle">{{ isEdit ? 'Update warehouse details' : 'Register a new storage location' }}</p>
      </div>
    </div>
    <div class="card" style="max-width:720px">
      <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">Warehouse Name *</label>
            <input type="text" class="form-control" formControlName="name"
                   [class.is-invalid]="f['name'].invalid && f['name'].touched" placeholder="e.g. Mumbai Central Hub" />
            @if (f['name'].invalid && f['name'].touched) { <div class="form-error">Name is required</div> }
          </div>
          <div class="form-group">
            <label class="form-label">Code *</label>
            <input type="text" class="form-control" formControlName="code"
                   [class.is-invalid]="f['code'].invalid && f['code'].touched" placeholder="e.g. MH-CENT" />
          </div>
          <div class="form-group">
            <label class="form-label">City *</label>
            <input type="text" class="form-control" formControlName="city" placeholder="Mumbai" />
          </div>
          <div class="form-group">
            <label class="form-label">Country *</label>
            <input type="text" class="form-control" formControlName="country" placeholder="India" />
          </div>
          <div class="form-group" style="grid-column:1/-1">
            <label class="form-label">Address</label>
            <textarea class="form-control" formControlName="address" rows="2" placeholder="Full street address"></textarea>
          </div>
          <div class="form-group">
            <label class="form-label">Capacity (units) *</label>
            <input type="number" class="form-control" formControlName="capacity" min="1" />
          </div>
        </div>
        <div class="form-actions">
          <button type="button" class="btn btn-secondary" (click)="cancel()">Cancel</button>
          <button type="submit" class="btn btn-primary" [disabled]="saving()">
            @if (saving()) { <span class="spinner"></span> Saving... }
            @else { {{ isEdit ? 'Update' : 'Create Warehouse' }} }
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`.form-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:0 1.25rem}.form-actions{display:flex;justify-content:flex-end;gap:.75rem;margin-top:1.5rem;padding-top:1.25rem;border-top:1px solid var(--border-color)}`]
})
export class WarehouseFormComponent implements OnInit {
  fb     = inject(FormBuilder);
  whSvc  = inject(WarehouseService);
  router = inject(Router);
  route  = inject(ActivatedRoute);
  toast  = inject(ToastService);

  warehouseId = signal<number | null>(null);
  saving      = signal(false);

  form = this.fb.group({
    name:     ['', Validators.required],
    code:     ['', Validators.required],
    city:     ['', Validators.required],
    country:  ['India', Validators.required],
    address:  [''],
    capacity: [1000, [Validators.required, Validators.min(1)]]
  });

  get f() { return this.form.controls; }
  get isEdit() { return this.warehouseId() != null; }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.warehouseId.set(+id);
      this.whSvc.getById(+id).subscribe({ next: w => this.form.patchValue(w as never), error: () => this.router.navigate(['/warehouses']) });
    }
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    const val = this.form.getRawValue() as never;
    const op = this.isEdit ? this.whSvc.update(this.warehouseId()!, val) : this.whSvc.create(val);
    op.subscribe({
      next: () => { this.toast.success(this.isEdit ? 'Warehouse updated!' : 'Warehouse created!'); this.router.navigate(['/warehouses']); },
      error: err => { this.saving.set(false); this.toast.error('Save failed', err.error?.message); }
    });
  }

  cancel(): void { this.router.navigate(['/warehouses']); }
}
