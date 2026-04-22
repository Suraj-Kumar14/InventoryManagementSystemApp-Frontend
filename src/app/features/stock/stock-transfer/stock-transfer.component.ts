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
  selector: 'app-stock-transfer',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './stock-transfer.component.html',
  styleUrls: ['./stock-transfer.component.css']
})
export class StockTransferComponent implements OnInit {
  fb         = inject(FormBuilder);
  stockSvc   = inject(StockService);
  whSvc      = inject(WarehouseService);
  productSvc = inject(ProductService);
  router     = inject(Router);
  toast      = inject(ToastService);

  warehouses = signal<Warehouse[]>([]);
  products   = signal<Product[]>([]);
  saving     = signal(false);

  form = this.fb.group({
    productId:       [null as number | null, Validators.required],
    fromWarehouseId: [null as number | null, Validators.required],
    toWarehouseId:   [null as number | null, Validators.required],
    quantity:        [1, [Validators.required, Validators.min(1)]],
    reason:          ['']
  });

  ngOnInit(): void {
    this.whSvc.getActive().subscribe({ next: w => this.warehouses.set(w), error: () => {} });
    this.productSvc.getAll(0, 200).subscribe({ next: r => this.products.set(r.content), error: () => {} });
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    const v = this.form.getRawValue();
    this.stockSvc.transfer({
      productId:       v.productId!,
      fromWarehouseId: v.fromWarehouseId!,
      toWarehouseId:   v.toWarehouseId!,
      quantity:        v.quantity!,
      reason:          v.reason ?? ''
    }).subscribe({
      next: () => { this.toast.success('Stock transferred successfully!'); this.router.navigate(['/stock']); },
      error: err => { this.saving.set(false); this.toast.error('Transfer failed', err.error?.message); }
    });
  }
}
