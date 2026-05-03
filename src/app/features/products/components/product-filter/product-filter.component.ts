import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ProductListQuery } from '../../models/product.model';

@Component({
  selector: 'app-product-filter',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './product-filter.component.html',
  styleUrls: ['./product-filter.component.css'],
})
export class ProductFilterComponent implements OnChanges {
  private readonly fb = inject(FormBuilder);

  @Input() categories: string[] = [];
  @Input() brands: string[] = [];
  @Input() loading = false;
  @Input() initialFilters: ProductListQuery = {};
  @Output() search = new EventEmitter<ProductListQuery>();
  @Output() reset = new EventEmitter<void>();

  readonly form = this.fb.nonNullable.group({
    keyword: '',
    category: '',
    brand: '',
    isActive: '',
    size: 10,
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['initialFilters']) {
      this.form.patchValue(
        {
          keyword: this.initialFilters.keyword ?? '',
          category: this.initialFilters.category ?? '',
          brand: this.initialFilters.brand ?? '',
          isActive:
            this.initialFilters.isActive === undefined ? '' : String(this.initialFilters.isActive),
          size: this.initialFilters.size ?? 10,
        },
        { emitEvent: false }
      );
    }
  }

  submit(): void {
    const value = this.form.getRawValue();
    this.search.emit({
      keyword: value.keyword.trim() || undefined,
      category: value.category || undefined,
      brand: value.brand || undefined,
      isActive: value.isActive === '' ? undefined : value.isActive === 'true',
      size: Number(value.size || 10),
    });
  }

  clear(): void {
    this.form.reset({ keyword: '', category: '', brand: '', isActive: '', size: 10 });
    this.reset.emit();
  }
}
