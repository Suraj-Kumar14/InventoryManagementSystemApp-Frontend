import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators
} from '@angular/forms';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { CreateProductRequest, Product, UpdateProductRequest } from '../../models';

type ProductFormMode = 'create' | 'edit';

const optionalUrlValidator: ValidatorFn = (
  control: AbstractControl
): ValidationErrors | null => {
  const rawValue = String(control.value ?? '').trim();

  if (!rawValue) {
    return null;
  }

  try {
    const parsedUrl = new URL(rawValue);
    return /^https?:$/.test(parsedUrl.protocol) ? null : { invalidUrl: true };
  } catch {
    return { invalidUrl: true };
  }
};

const maxStockLevelValidator: ValidatorFn = (
  control: AbstractControl
): ValidationErrors | null => {
  const reorderLevel = Number(control.get('reorderLevel')?.value ?? 0);
  const maxStockLevel = Number(control.get('maxStockLevel')?.value ?? 0);

  if (Number.isNaN(reorderLevel) || Number.isNaN(maxStockLevel)) {
    return null;
  }

  return maxStockLevel >= reorderLevel ? null : { maxStockTooLow: true };
};

@Component({
  selector: 'app-product-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './product-form.component.html',
  styleUrls: ['./product-form.component.css']
})
export class ProductFormComponent implements OnChanges {
  private readonly fb = inject(FormBuilder);

  @Input() mode: ProductFormMode = 'create';
  @Input() product: Product | null = null;
  @Input() loading = false;
  @Input() saving = false;

  @Output() formSubmit = new EventEmitter<CreateProductRequest | UpdateProductRequest>();
  @Output() cancel = new EventEmitter<void>();

  readonly form = this.fb.group(
    {
      sku: ['', [Validators.required]],
      name: ['', [Validators.required]],
      description: [''],
      category: ['', [Validators.required]],
      brand: ['', [Validators.required]],
      unitOfMeasure: ['Piece', [Validators.required]],
      costPrice: [0, [Validators.required, Validators.min(0)]],
      sellingPrice: [0, [Validators.required, Validators.min(0)]],
      reorderLevel: [0, [Validators.required, Validators.min(0)]],
      maxStockLevel: [0, [Validators.required, Validators.min(0)]],
      leadTimeDays: [0, [Validators.required, Validators.min(0)]],
      imageUrl: ['', [optionalUrlValidator]],
      barcode: [''],
      isActive: [true]
    },
    { validators: [maxStockLevelValidator] }
  );

  readonly unitOptions = ['Piece', 'Box', 'Kg', 'Litre', 'Pack', 'Unit', 'Carton'];

  ngOnChanges(changes: SimpleChanges): void {
    if ('product' in changes) {
      this.applyProduct(this.product);
    }
  }

  get currentStatusLabel(): string {
    return this.form.get('isActive')?.value ? 'Active' : 'Inactive';
  }

  get currentImagePreview(): string | null {
    const value = this.form.get('imageUrl')?.value?.trim();
    return value ? value : null;
  }

  hasError(controlName: string): boolean {
    const control = this.form.get(controlName);
    return !!control && control.invalid && (control.touched || control.dirty);
  }

  errorMessage(controlName: string): string {
    const control = this.form.get(controlName);

    if (!control?.errors) {
      return '';
    }

    if (control.errors['required']) {
      switch (controlName) {
        case 'sku':
          return 'SKU is required.';
        case 'name':
          return 'Product name is required.';
        case 'category':
          return 'Category is required.';
        case 'brand':
          return 'Brand is required.';
        case 'unitOfMeasure':
          return 'Unit of measure is required.';
        default:
          return 'This field is required.';
      }
    }

    if (control.errors['min']) {
      if (controlName === 'leadTimeDays') {
        return 'Lead time must be 0 or more.';
      }

      return 'Value must be 0 or more.';
    }

    if (control.errors['invalidUrl']) {
      return 'Enter a valid image URL starting with http:// or https://.';
    }

    return 'Please review this field.';
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.formSubmit.emit(this.buildPayload());
  }

  onCancel(): void {
    this.cancel.emit();
  }

  private applyProduct(product: Product | null): void {
    if (!product) {
      this.form.reset(this.createDefaultValue());
      return;
    }

    this.form.reset({
      sku: product.sku,
      name: product.name,
      description: product.description ?? '',
      category: product.category,
      brand: product.brand,
      unitOfMeasure: product.unitOfMeasure,
      costPrice: product.costPrice,
      sellingPrice: product.sellingPrice,
      reorderLevel: product.reorderLevel,
      maxStockLevel: product.maxStockLevel ?? 0,
      leadTimeDays: product.leadTimeDays ?? 0,
      imageUrl: product.imageUrl ?? '',
      barcode: product.barcode ?? '',
      isActive: product.isActive
    });
  }

  private buildPayload(): CreateProductRequest | UpdateProductRequest {
    const rawValue = this.form.getRawValue();

    return {
      sku: rawValue.sku?.trim() ?? '',
      name: rawValue.name?.trim() ?? '',
      description: rawValue.description?.trim() || null,
      category: rawValue.category?.trim() ?? '',
      brand: rawValue.brand?.trim() ?? '',
      unitOfMeasure: rawValue.unitOfMeasure?.trim() ?? 'Piece',
      costPrice: Number(rawValue.costPrice ?? 0),
      sellingPrice: Number(rawValue.sellingPrice ?? 0),
      reorderLevel: Number(rawValue.reorderLevel ?? 0),
      maxStockLevel: Number(rawValue.maxStockLevel ?? 0),
      leadTimeDays: Number(rawValue.leadTimeDays ?? 0),
      imageUrl: rawValue.imageUrl?.trim() || null,
      isActive: rawValue.isActive ?? true,
      barcode: rawValue.barcode?.trim() || null
    };
  }

  private createDefaultValue() {
    return {
      sku: '',
      name: '',
      description: '',
      category: '',
      brand: '',
      unitOfMeasure: 'Piece',
      costPrice: 0,
      sellingPrice: 0,
      reorderLevel: 0,
      maxStockLevel: 0,
      leadTimeDays: 0,
      imageUrl: '',
      barcode: '',
      isActive: true
    };
  }
}
