import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Product, Warehouse } from '../../../core/models';
import { ProductService } from '../../../core/services/product.service';
import { StockService } from '../../../core/services/stock.service';
import { ToastService } from '../../../core/services/toast.service';
import { WarehouseService } from '../../../core/services/warehouse.service';

@Component({
  selector: 'app-stock-adjust',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="page-header">
      <div>
        <h1 class="page-title">Update Stock</h1>
        <p class="page-subtitle">Apply manual quantity corrections and keep the warehouse balance in sync.</p>
      </div>
    </div>

    <div class="card" style="max-width: 620px">
      <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
        <div class="form-group">
          <label class="form-label">Product *</label>
          <select
            class="form-control"
            formControlName="productId"
            [class.is-invalid]="f['productId'].invalid && f['productId'].touched"
          >
            <option [ngValue]="null">Select a product</option>
            @for (product of products(); track product.id) {
              <option [ngValue]="product.id">{{ product.name }} ({{ product.sku }})</option>
            }
          </select>
          @if (f['productId'].invalid && f['productId'].touched) {
            <div class="form-error">Product is required.</div>
          }
        </div>

        <div class="form-group">
          <label class="form-label">Warehouse *</label>
          <select
            class="form-control"
            formControlName="warehouseId"
            [class.is-invalid]="f['warehouseId'].invalid && f['warehouseId'].touched"
          >
            <option [ngValue]="null">Select warehouse</option>
            @for (warehouse of warehouses(); track warehouse.id) {
              <option [ngValue]="warehouse.id">{{ warehouse.name }}</option>
            }
          </select>
          @if (f['warehouseId'].invalid && f['warehouseId'].touched) {
            <div class="form-error">Warehouse is required.</div>
          }
        </div>

        <div class="form-group">
          <label class="form-label">Adjustment Mode *</label>
          <div class="adj-types">
            @for (type of adjustTypes; track type.value) {
              <label class="adj-type" [class.selected]="form.get('adjustmentType')?.value === type.value">
                <input type="radio" formControlName="adjustmentType" [value]="type.value" style="display: none" />
                <span class="adj-label">{{ type.label }}</span>
                <span class="adj-desc text-xs text-muted">{{ type.desc }}</span>
              </label>
            }
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">
            {{ form.value.adjustmentType === 'SET' ? 'Final Quantity *' : 'Adjustment Quantity *' }}
          </label>
          <input
            type="number"
            class="form-control"
            formControlName="newQuantity"
            min="0"
            [class.is-invalid]="f['newQuantity'].invalid && f['newQuantity'].touched"
          />
          <div class="text-xs text-muted helper-text">
            @if (form.value.adjustmentType === 'SET') {
              Sets the warehouse balance to the exact quantity entered.
            } @else if (form.value.adjustmentType === 'INCREASE') {
              Adds the entered quantity on top of the current balance.
            } @else {
              Subtracts the entered quantity from the current balance.
            }
          </div>
          @if (f['newQuantity'].invalid && f['newQuantity'].touched) {
            <div class="form-error">Quantity must be zero or greater.</div>
          }
        </div>

        <div class="form-group">
          <label class="form-label">Reference ID</label>
          <input
            type="text"
            class="form-control"
            formControlName="referenceId"
            placeholder="Optional reference for this adjustment"
          />
        </div>

        <div class="form-group">
          <label class="form-label">Reason *</label>
          <textarea
            class="form-control"
            formControlName="reason"
            rows="3"
            placeholder="Explain the adjustment for the audit trail"
            [class.is-invalid]="f['reason'].invalid && f['reason'].touched"
          ></textarea>
          @if (f['reason'].invalid && f['reason'].touched) {
            <div class="form-error">Reason is required.</div>
          }
        </div>

        <div class="form-actions">
          <button type="button" class="btn btn-secondary" routerLink="/stock">Cancel</button>
          <button type="submit" class="btn btn-primary" [disabled]="saving()">
            @if (saving()) {
              <span class="spinner"></span> Saving...
            } @else {
              Apply Update
            }
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .adj-types {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 0.75rem;
    }

    .adj-type {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      padding: 0.875rem 1rem;
      border: 1.5px solid var(--border-color);
      border-radius: var(--radius-md);
      cursor: pointer;
      transition: all var(--transition-fast);
    }

    .adj-type.selected {
      border-color: var(--color-primary);
      background: var(--color-primary-light);
    }

    .adj-label {
      font-size: 0.875rem;
      font-weight: 600;
    }

    .helper-text {
      margin-top: 0.375rem;
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
export class StockAdjustComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly stockService = inject(StockService);
  private readonly warehouseService = inject(WarehouseService);
  private readonly productService = inject(ProductService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly warehouses = signal<Warehouse[]>([]);
  readonly products = signal<Product[]>([]);
  readonly saving = signal(false);

  readonly adjustTypes = [
    { value: 'SET', label: 'Set Balance', desc: 'Replace with an exact quantity.' },
    { value: 'INCREASE', label: 'Increase', desc: 'Add stock after a count correction.' },
    { value: 'DECREASE', label: 'Decrease', desc: 'Reduce stock after a count correction.' }
  ] as const;

  readonly form = this.fb.group({
    productId: [null as number | null, Validators.required],
    warehouseId: [null as number | null, Validators.required],
    adjustmentType: ['SET' as 'SET' | 'INCREASE' | 'DECREASE', Validators.required],
    newQuantity: [0, [Validators.required, Validators.min(0)]],
    referenceId: [''],
    reason: ['', Validators.required]
  });

  get f() {
    return this.form.controls;
  }

  ngOnInit(): void {
    this.warehouseService.getActive().subscribe({
      next: (warehouses) => this.warehouses.set(warehouses),
      error: () => undefined
    });

    this.productService.getAllProducts().subscribe({
      next: (products) => this.products.set(products),
      error: () => undefined
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const selectedProduct = this.products().find((product) => product.id === value.productId);

    this.saving.set(true);
    this.stockService.adjust({
      productId: value.productId!,
      warehouseId: value.warehouseId!,
      newQuantity: Number(value.newQuantity ?? 0),
      reason: value.reason?.trim() ?? '',
      adjustmentType: value.adjustmentType ?? 'SET',
      referenceId: value.referenceId?.trim() || null,
      unitCost: selectedProduct?.costPrice ?? null
    }).subscribe({
      next: () => {
        this.toast.success('Stock updated');
        this.router.navigate(['/stock']);
      },
      error: (error) => {
        this.saving.set(false);
        this.toast.error('Update failed', error.error?.message ?? error.message);
      }
    });
  }
}
