import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { StockService } from '../../../core/services/stock.service';
import { WarehouseService } from '../../../core/services/warehouse.service';
import { ProductService } from '../../../core/services/product.service';
import { Warehouse, Product } from '../../../core/models';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-stock-adjust',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="page-header">
      <div><h1 class="page-title">Adjust Stock</h1><p class="page-subtitle">Correct inventory discrepancies</p></div>
    </div>
    <div class="card" style="max-width:580px">
      <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
        <div class="form-group">
          <label class="form-label">Product *</label>
          <select class="form-control" formControlName="productId" [class.is-invalid]="f['productId'].invalid && f['productId'].touched">
            <option [value]="null">Select a product</option>
            @for (p of products(); track p.id) { <option [value]="p.id">{{ p.name }} ({{ p.sku }})</option> }
          </select>
          @if (f['productId'].invalid && f['productId'].touched) { <div class="form-error">Required</div> }
        </div>
        <div class="form-group">
          <label class="form-label">Warehouse *</label>
          <select class="form-control" formControlName="warehouseId" [class.is-invalid]="f['warehouseId'].invalid && f['warehouseId'].touched">
            <option [value]="null">Select warehouse</option>
            @for (w of warehouses(); track w.id) { <option [value]="w.id">{{ w.name }}</option> }
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Adjustment Type *</label>
          <div class="adj-types">
            @for (t of adjustTypes; track t.value) {
              <label class="adj-type" [class.selected]="form.get('adjustmentType')!.value === t.value">
                <input type="radio" formControlName="adjustmentType" [value]="t.value" style="display:none" />
                <span class="adj-icon">{{ t.icon }}</span>
                <span class="adj-label">{{ t.label }}</span>
                <span class="adj-desc text-xs text-muted">{{ t.desc }}</span>
              </label>
            }
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">New Quantity *</label>
          <input type="number" class="form-control" formControlName="newQuantity" min="0"
                 [class.is-invalid]="f['newQuantity'].invalid && f['newQuantity'].touched" />
        </div>
        <div class="form-group">
          <label class="form-label">Reason *</label>
          <textarea class="form-control" formControlName="reason" rows="2" placeholder="Explain the adjustment reason (required for audit)" [class.is-invalid]="f['reason'].invalid && f['reason'].touched"></textarea>
          @if (f['reason'].invalid && f['reason'].touched) { <div class="form-error">Reason is required for audit trail</div> }
        </div>
        <div style="display:flex;justify-content:flex-end;gap:.75rem;margin-top:1.5rem;padding-top:1.25rem;border-top:1px solid var(--border-color)">
          <button type="button" class="btn btn-secondary" routerLink="/stock">Cancel</button>
          <button type="submit" class="btn btn-primary" [disabled]="saving()">
            @if (saving()) { <span class="spinner"></span> Saving... } @else { ✏️ Apply Adjustment }
          </button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .adj-types { display:flex; gap:.75rem; flex-wrap:wrap; }
    .adj-type { display:flex;flex-direction:column;align-items:center;gap:.25rem;padding:.75rem 1rem;border:1.5px solid var(--border-color);border-radius:var(--radius-md);cursor:pointer;min-width:100px;text-align:center;transition:all var(--transition-fast); }
    .adj-type.selected { border-color:var(--color-primary);background:var(--color-primary-light); }
    .adj-icon { font-size:1.5rem; }
    .adj-label { font-size:.875rem;font-weight:600; }
  `]
})
export class StockAdjustComponent implements OnInit {
  fb         = inject(FormBuilder);
  stockSvc   = inject(StockService);
  whSvc      = inject(WarehouseService);
  productSvc = inject(ProductService);
  router     = inject(Router);
  toast      = inject(ToastService);

  warehouses = signal<Warehouse[]>([]);
  products   = signal<Product[]>([]);
  saving     = signal(false);

  adjustTypes = [
    { value: 'SET',      icon: '=',  label: 'Set Quantity', desc: 'Absolute count' },
    { value: 'INCREASE', icon: '+',  label: 'Increase',     desc: 'Add units' },
    { value: 'DECREASE', icon: '−',  label: 'Decrease',     desc: 'Remove units' }
  ];

  form = this.fb.group({
    productId:      [null as number | null, Validators.required],
    warehouseId:    [null as number | null, Validators.required],
    adjustmentType: ['SET', Validators.required],
    newQuantity:    [0, [Validators.required, Validators.min(0)]],
    reason:         ['', Validators.required]
  });

  get f() { return this.form.controls; }

  ngOnInit(): void {
    this.whSvc.getActive().subscribe({ next: w => this.warehouses.set(w) });
    this.productSvc.getAll(0, 200).subscribe({ next: r => this.products.set(r.content) });
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    const v = this.form.getRawValue();
    this.stockSvc.adjust({
      productId:      v.productId!,
      warehouseId:    v.warehouseId!,
      newQuantity:    v.newQuantity!,
      reason:         v.reason!,
      adjustmentType: v.adjustmentType as 'INCREASE' | 'DECREASE' | 'SET'
    }).subscribe({
      next: () => { this.toast.success('Stock adjusted!'); this.router.navigate(['/stock']); },
      error: err => { this.saving.set(false); this.toast.error('Adjustment failed', err.error?.message); }
    });
  }
}
