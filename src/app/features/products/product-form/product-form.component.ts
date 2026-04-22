import { Component, OnInit, inject, signal, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ProductService } from '../../../core/services/product.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './product-form.component.html',
  styleUrls: ['./product-form.component.css']
})
export class ProductFormComponent implements OnInit {
  fb         = inject(FormBuilder);
  productSvc = inject(ProductService);
  router     = inject(Router);
  route      = inject(ActivatedRoute);
  toast      = inject(ToastService);

  productId = signal<number | null>(null);
  loading   = signal(false);
  saving    = signal(false);

  form = this.fb.group({
    name:          ['', [Validators.required, Validators.minLength(2)]],
    description:   [''],
    sku:           ['', Validators.required],
    barcode:       [''],
    category:      ['', Validators.required],
    brand:         [''],
    unitOfMeasure: ['PCS', Validators.required],
    costPrice:     [0, [Validators.required, Validators.min(0)]],
    sellingPrice:  [0, [Validators.required, Validators.min(0)]],
    reorderPoint:  [10, [Validators.required, Validators.min(0)]],
    maxStockLevel: [null as number | null]
  });

  get isEdit(): boolean { return this.productId() != null; }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.productId.set(+id);
      this.loading.set(true);
      this.productSvc.getById(+id).subscribe({
        next: p => { this.form.patchValue(p as never); this.loading.set(false); },
        error: () => { this.toast.error('Product not found'); this.router.navigate(['/products']); }
      });
    }
  }

  submit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving.set(true);
    const val = this.form.getRawValue() as never;
    const op = this.isEdit
      ? this.productSvc.update(this.productId()!, val)
      : this.productSvc.create(val);

    op.subscribe({
      next: () => {
        this.toast.success(this.isEdit ? 'Product updated!' : 'Product created!');
        this.router.navigate(['/products']);
      },
      error: err => {
        this.saving.set(false);
        this.toast.error('Save failed', err.error?.message);
      }
    });
  }

  cancel(): void { this.router.navigate(['/products']); }
}
