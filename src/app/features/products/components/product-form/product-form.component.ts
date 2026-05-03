import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { CreateProductRequest, Product, UpdateProductRequest } from '../../../../core/http/backend.models';

export type ProductFormPayload = CreateProductRequest | UpdateProductRequest;

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './product-form.component.html',
  styleUrls: ['./product-form.component.css'],
})
export class ProductFormComponent implements OnChanges {
  private readonly fb = inject(FormBuilder);

  @Input() mode: 'create' | 'edit' = 'create';
  @Input() initialProduct: Product | null = null;
  @Input() loading = false;
  @Output() submitted = new EventEmitter<ProductFormPayload>();
  @Output() cancelled = new EventEmitter<void>();

  readonly form = this.fb.group(
    {
      sku: ['', [Validators.required, Validators.maxLength(50)]],
      name: ['', [Validators.required, Validators.maxLength(200)]],
      description: ['', [Validators.maxLength(1000)]],
      category: ['', [Validators.required, Validators.maxLength(100)]],
      brand: ['', [Validators.maxLength(100)]],
      unitOfMeasure: ['', [Validators.required, Validators.maxLength(50)]],
      costPrice: [null as number | null, [Validators.required, Validators.min(0)]],
      sellingPrice: [null as number | null, [Validators.required, Validators.min(0)]],
      reorderLevel: [null as number | null, [Validators.required, Validators.min(0)]],
      maxStockLevel: [null as number | null, [Validators.required, Validators.min(0)]],
      leadTimeDays: [null as number | null, [Validators.required, Validators.min(0)]],
      imageUrl: [''],
      barcode: [''],
      isActive: [true],
    },
    { validators: [stockLevelValidator()] }
  );

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['initialProduct'] || changes['mode']) {
      this.syncFormState();
    }
  }

  get saveLabel(): string {
    if (this.loading) {
      return this.mode === 'create' ? 'Saving...' : 'Updating...';
    }
    return this.mode === 'create' ? 'Save Product' : 'Update Product';
  }

  isInvalid(controlName: string): boolean {
    const control = this.form.get(controlName);
    return !!control && control.invalid && (control.touched || control.dirty);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    if (this.mode === 'create') {
      this.submitted.emit({
        sku: requiredText(raw.sku),
        name: requiredText(raw.name),
        description: normalizeOptional(raw.description),
        category: requiredText(raw.category),
        brand: normalizeOptional(raw.brand),
        unitOfMeasure: requiredText(raw.unitOfMeasure),
        costPrice: Number(raw.costPrice),
        sellingPrice: Number(raw.sellingPrice),
        reorderLevel: Number(raw.reorderLevel),
        maxStockLevel: Number(raw.maxStockLevel),
        leadTimeDays: Number(raw.leadTimeDays),
        imageUrl: normalizeOptional(raw.imageUrl),
        barcode: normalizeOptional(raw.barcode),
      } satisfies CreateProductRequest);
      return;
    }

    this.submitted.emit({
      name: requiredText(raw.name),
      description: normalizeOptional(raw.description),
      category: requiredText(raw.category),
      brand: normalizeOptional(raw.brand),
      unitOfMeasure: requiredText(raw.unitOfMeasure),
      costPrice: Number(raw.costPrice),
      sellingPrice: Number(raw.sellingPrice),
      reorderLevel: Number(raw.reorderLevel),
      maxStockLevel: Number(raw.maxStockLevel),
      leadTimeDays: Number(raw.leadTimeDays),
      imageUrl: normalizeOptional(raw.imageUrl),
      barcode: normalizeOptional(raw.barcode),
      isActive: raw.isActive ?? true,
    } satisfies UpdateProductRequest);
  }

  private syncFormState(): void {
    const product = this.initialProduct;
    if (!product) {
      this.form.reset({
        sku: '',
        name: '',
        description: '',
        category: '',
        brand: '',
        unitOfMeasure: '',
        costPrice: null,
        sellingPrice: null,
        reorderLevel: null,
        maxStockLevel: null,
        leadTimeDays: null,
        imageUrl: '',
        barcode: '',
        isActive: true,
      });
    } else {
      this.form.reset({
        sku: product.sku,
        name: product.name,
        description: product.description ?? '',
        category: product.category,
        brand: product.brand ?? '',
        unitOfMeasure: product.unitOfMeasure,
        costPrice: product.costPrice,
        sellingPrice: product.sellingPrice,
        reorderLevel: product.reorderLevel,
        maxStockLevel: product.maxStockLevel,
        leadTimeDays: product.leadTimeDays,
        imageUrl: product.imageUrl ?? '',
        barcode: product.barcode ?? '',
        isActive: product.isActive,
      });
    }

    if (this.mode === 'edit') {
      this.form.controls.sku.disable({ emitEvent: false });
    } else {
      this.form.controls.sku.enable({ emitEvent: false });
    }
  }
}

function normalizeOptional(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function requiredText(value: string | null | undefined): string {
  return value?.trim() ?? '';
}

function stockLevelValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const reorderLevelValue = control.get('reorderLevel')?.value;
    const maxStockLevelValue = control.get('maxStockLevel')?.value;
    if (
      reorderLevelValue === null ||
      reorderLevelValue === '' ||
      maxStockLevelValue === null ||
      maxStockLevelValue === ''
    ) {
      return null;
    }

    const reorderLevel = Number(reorderLevelValue);
    const maxStockLevel = Number(maxStockLevelValue);
    if (Number.isNaN(reorderLevel) || Number.isNaN(maxStockLevel)) {
      return null;
    }
    return maxStockLevel > reorderLevel ? null : { stockLevels: true };
  };
}
