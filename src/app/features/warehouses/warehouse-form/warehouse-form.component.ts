import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  CreateWarehouseRequest,
  UpdateWarehouseRequest,
  Warehouse
} from '../../../core/models';
import { ToastService } from '../../../core/services/toast.service';
import { WarehouseService } from '../../../core/services/warehouse.service';

@Component({
  selector: 'app-warehouse-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="page-header">
      <div>
        <h1 class="page-title">{{ isEdit ? 'Edit Warehouse' : 'Add Warehouse' }}</h1>
        <p class="page-subtitle">
          {{ isEdit ? 'Update warehouse metadata and operational status.' : 'Register a new warehouse location for stock operations.' }}
        </p>
      </div>
    </div>

    <div class="card" style="max-width: 820px">
      <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">Warehouse Name *</label>
            <input
              type="text"
              class="form-control"
              formControlName="name"
              [class.is-invalid]="f['name'].invalid && f['name'].touched"
              placeholder="e.g. Central Distribution Hub"
            />
            @if (f['name'].invalid && f['name'].touched) {
              <div class="form-error">Warehouse name is required.</div>
            }
          </div>

          <div class="form-group">
            <label class="form-label">Location *</label>
            <input
              type="text"
              class="form-control"
              formControlName="location"
              [class.is-invalid]="f['location'].invalid && f['location'].touched"
              placeholder="e.g. Mumbai - West Zone"
            />
            @if (f['location'].invalid && f['location'].touched) {
              <div class="form-error">Location is required.</div>
            }
          </div>

          <div class="form-group" style="grid-column: 1 / -1">
            <label class="form-label">Address *</label>
            <textarea
              class="form-control"
              formControlName="address"
              rows="3"
              [class.is-invalid]="f['address'].invalid && f['address'].touched"
              placeholder="Enter the full warehouse address"
            ></textarea>
            @if (f['address'].invalid && f['address'].touched) {
              <div class="form-error">Address is required.</div>
            }
          </div>

          <div class="form-group">
            <label class="form-label">Manager ID</label>
            <input
              type="number"
              class="form-control"
              formControlName="managerId"
              min="1"
              placeholder="Optional manager user id"
            />
          </div>

          <div class="form-group">
            <label class="form-label">Capacity *</label>
            <input
              type="number"
              class="form-control"
              formControlName="capacity"
              min="1"
              [class.is-invalid]="f['capacity'].invalid && f['capacity'].touched"
            />
            @if (f['capacity'].invalid && f['capacity'].touched) {
              <div class="form-error">Capacity must be greater than zero.</div>
            }
          </div>

          <div class="form-group">
            <label class="form-label">Phone</label>
            <input
              type="tel"
              class="form-control"
              formControlName="phone"
              [class.is-invalid]="f['phone'].invalid && f['phone'].touched"
              placeholder="Optional contact number"
            />
            @if (f['phone'].invalid && f['phone'].touched) {
              <div class="form-error">Enter a valid phone number.</div>
            }
          </div>

          @if (isEdit) {
            <div class="form-group">
              <label class="form-label">Status</label>
              <select class="form-control" formControlName="isActive">
                <option [ngValue]="true">Active</option>
                <option [ngValue]="false">Inactive</option>
              </select>
            </div>
          }
        </div>

        <div class="status-card" *ngIf="isEdit">
          <div class="status-label">Current status</div>
          <span class="badge" [class]="form.value.isActive ? 'badge-success' : 'badge-gray'">
            {{ form.value.isActive ? 'Active' : 'Inactive' }}
          </span>
        </div>

        <div class="form-actions">
          <button type="button" class="btn btn-secondary" (click)="cancel()">Cancel</button>
          <button type="submit" class="btn btn-primary" [disabled]="saving()">
            @if (saving()) {
              <span class="spinner"></span> Saving...
            } @else {
              {{ isEdit ? 'Update Warehouse' : 'Create Warehouse' }}
            }
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .form-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 0 1.25rem;
    }

    .status-card {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: 1rem;
      padding: 1rem 1.125rem;
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      background: var(--gray-50);
    }

    .status-label {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text-secondary);
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      margin-top: 1.5rem;
      padding-top: 1.25rem;
      border-top: 1px solid var(--border-color);
    }
  `]
})
export class WarehouseFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly warehouseService = inject(WarehouseService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);

  readonly warehouseId = signal<number | null>(null);
  readonly saving = signal(false);

  readonly form = this.fb.group({
    name: ['', Validators.required],
    location: ['', Validators.required],
    address: ['', Validators.required],
    managerId: [null as number | null, Validators.min(1)],
    capacity: [1000, [Validators.required, Validators.min(1)]],
    phone: ['', Validators.pattern(/^[0-9()+\-\s]{7,20}$/)],
    isActive: [true]
  });

  get f() {
    return this.form.controls;
  }

  get isEdit(): boolean {
    return this.warehouseId() !== null;
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (!id) {
      return;
    }

    this.warehouseId.set(Number(id));
    this.warehouseService.getById(Number(id)).subscribe({
      next: (warehouse) => this.patchForm(warehouse),
      error: () => this.router.navigate(['/warehouses'])
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);

    const rawValue = this.form.getRawValue();
    const basePayload: CreateWarehouseRequest = {
      name: rawValue.name ?? '',
      location: rawValue.location ?? '',
      address: rawValue.address ?? '',
      managerId: rawValue.managerId,
      capacity: Number(rawValue.capacity ?? 0),
      phone: rawValue.phone ?? null
    };

    const request = this.isEdit
      ? this.warehouseService.update(
          this.warehouseId()!,
          { ...basePayload, isActive: rawValue.isActive ?? true } satisfies UpdateWarehouseRequest
        )
      : this.warehouseService.create(basePayload);

    request.subscribe({
      next: () => {
        this.toast.success(this.isEdit ? 'Warehouse updated' : 'Warehouse created');
        this.router.navigate(['/warehouses']);
      },
      error: (error) => {
        this.saving.set(false);
        this.toast.error('Save failed', error.error?.message);
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/warehouses']);
  }

  private patchForm(warehouse: Warehouse): void {
    this.form.patchValue({
      name: warehouse.name,
      location: warehouse.location,
      address: warehouse.address,
      managerId: warehouse.managerId ?? null,
      capacity: warehouse.capacity,
      phone: warehouse.phone ?? '',
      isActive: warehouse.isActive
    });
  }
}
