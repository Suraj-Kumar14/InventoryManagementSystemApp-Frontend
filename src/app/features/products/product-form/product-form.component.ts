import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductRequest } from '../../../core/models';
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
  fb = inject(FormBuilder);
  productSvc = inject(ProductService);
  router = inject(Router);
  route = inject(ActivatedRoute);
  toast = inject(ToastService);

  productId = signal<number | null>(null);
  loading = signal(false);
  saving = signal(false);

  form = this.fb.group({
    sku: ['', Validators.required],
    name: ['', [Validators.required, Validators.minLength(2)]],
    description: [''],
    category: ['', Validators.required],
    brand: [''],
    unitOfMeasure: ['Piece', Validators.required],
    costPrice: [0, [Validators.required, Validators.min(0)]],
    sellingPrice: [0, [Validators.required, Validators.min(0)]],
    reorderLevel: [10, [Validators.required, Validators.min(0)]],
    maxStockLevel: [100, [Validators.required, Validators.min(0)]],
    leadTimeDays: [5, [Validators.required, Validators.min(0)]],
    imageUrl: [''],
    barcode: [''],
    isActive: [true, Validators.required]
  });

  get isEdit(): boolean {
    return this.productId() != null;
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (!id) {
      return;
    }

    this.productId.set(Number(id));
    this.loading.set(true);
    this.productSvc.getById(Number(id)).subscribe({
      next: (product) => {
        this.form.patchValue({
          sku: product.sku,
          name: product.name,
          description: product.description ?? '',
          category: product.category,
          brand: product.brand ?? '',
          unitOfMeasure: product.unitOfMeasure,
          costPrice: product.costPrice,
          sellingPrice: product.sellingPrice,
          reorderLevel: product.reorderLevel,
          maxStockLevel: product.maxStockLevel ?? null,
          leadTimeDays: product.leadTimeDays ?? null,
          imageUrl: product.imageUrl ?? '',
          barcode: product.barcode ?? '',
          isActive: product.isActive
        });
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.toast.error('Product not found');
        this.router.navigate(['/products']);
      }
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);

    const value = this.form.getRawValue();
    const payload: ProductRequest = {
      sku: value.sku!.trim(),
      name: value.name!.trim(),
      description: value.description?.trim() || undefined,
      category: value.category!.trim(),
      brand: value.brand?.trim() || undefined,
      unitOfMeasure: value.unitOfMeasure!.trim(),
      costPrice: Number(value.costPrice),
      sellingPrice: Number(value.sellingPrice),
      reorderLevel: Number(value.reorderLevel),
      maxStockLevel: value.maxStockLevel != null ? Number(value.maxStockLevel) : null,
      leadTimeDays: value.leadTimeDays != null ? Number(value.leadTimeDays) : null,
      imageUrl: value.imageUrl?.trim() || null,
      isActive: !!value.isActive,
      barcode: value.barcode?.trim() || null
    };

    const request = this.isEdit
      ? this.productSvc.update(this.productId()!, payload)
      : this.productSvc.create(payload);

    request.subscribe({
      next: (product) => {
        this.toast.success(this.isEdit ? 'Product updated!' : 'Product created!');
        this.router.navigate(['/products', product.productId]);
      },
      error: (error) => {
        this.saving.set(false);
        this.toast.error('Save failed', error.error?.message);
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/products']);
  }
}
