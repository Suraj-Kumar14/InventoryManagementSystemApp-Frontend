import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { PurchaseOrderService } from '../../../core/services/purchase-order.service';
import { SupplierService } from '../../../core/services/supplier.service';
import { WarehouseService } from '../../../core/services/warehouse.service';
import { ProductService } from '../../../core/services/product.service';
import { Supplier, Warehouse, Product } from '../../../core/models';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-po-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './po-form.component.html',
  styleUrls: ['./po-form.component.css']
})
export class PoFormComponent implements OnInit {
  fb        = inject(FormBuilder);
  poSvc     = inject(PurchaseOrderService);
  suppSvc   = inject(SupplierService);
  whSvc     = inject(WarehouseService);
  prodSvc   = inject(ProductService);
  router    = inject(Router);
  route     = inject(ActivatedRoute);
  toast     = inject(ToastService);

  suppliers  = signal<Supplier[]>([]);
  warehouses = signal<Warehouse[]>([]);
  products   = signal<Product[]>([]);
  saving     = signal(false);
  poId       = signal<number | null>(null);

  form = this.fb.group({
    supplierId:           [null as number | null, Validators.required],
    warehouseId:          [null as number | null, Validators.required],
    expectedDeliveryDate: [''],
    notes:                [''],
    items: this.fb.array([])
  });

  get items(): FormArray { return this.form.get('items') as FormArray; }
  get isEdit(): boolean  { return this.poId() != null; }

  get totalAmount(): number {
    return this.items.controls.reduce((sum, c) => {
      const qty = +(c.get('orderedQuantity')?.value ?? 0);
      const price = +(c.get('unitPrice')?.value ?? 0);
      return sum + qty * price;
    }, 0);
  }

  ngOnInit(): void {
    this.suppSvc.getActive().subscribe({ next: s => this.suppliers.set(s) });
    this.whSvc.getActive().subscribe({ next: w => this.warehouses.set(w) });
    this.prodSvc.getAll(0, 200).subscribe({ next: r => this.products.set(r.content) });
    this.addItem();

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.poId.set(+id);
      this.poSvc.getById(+id).subscribe({
        next: po => {
          this.form.patchValue({ supplierId: po.supplierId, warehouseId: po.warehouseId, notes: po.notes ?? '', expectedDeliveryDate: po.expectedDeliveryDate ?? '' });
          this.items.clear();
          po.items.forEach(item => this.items.push(this.newItem(item.productId, item.orderedQuantity, item.unitPrice)));
        }
      });
    }
  }

  newItem(productId: number | null = null, qty = 1, price = 0) {
    return this.fb.group({
      productId:       [productId, Validators.required],
      orderedQuantity: [qty,        [Validators.required, Validators.min(1)]],
      unitPrice:       [price,      [Validators.required, Validators.min(0)]]
    });
  }

  addItem(): void    { this.items.push(this.newItem()); }
  removeItem(i: number): void { this.items.removeAt(i); }

  onProductChange(i: number, productId: string): void {
    const p = this.products().find(x => x.id === +productId);
    if (p) this.items.at(i).patchValue({ unitPrice: p.costPrice });
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    const v = this.form.getRawValue();
    const payload = {
      supplierId:           v.supplierId!,
      warehouseId:          v.warehouseId!,
      expectedDeliveryDate: v.expectedDeliveryDate || undefined,
      notes:                v.notes || undefined,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      items: (v.items as any[]).map((i: any) => ({
        productId: i.productId, orderedQuantity: i.orderedQuantity, unitPrice: i.unitPrice
      }))
    };

    const op = this.isEdit ? this.poSvc.update(this.poId()!, payload) : this.poSvc.create(payload);
    op.subscribe({
      next: po => { this.toast.success(this.isEdit ? 'PO updated!' : 'PO created!'); this.router.navigate(['/purchase-orders', po.id]); },
      error: err => { this.saving.set(false); this.toast.error('Save failed', err.error?.message); }
    });
  }

  cancel(): void { this.router.navigate(['/purchase-orders']); }
}
