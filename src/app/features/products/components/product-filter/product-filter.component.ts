import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ProductSearchRequest } from '../../models';

export interface ProductFilterValue {
  searchText: string;
  category: string;
  brand: string;
  isActive: boolean | null;
}

@Component({
  selector: 'app-product-filter',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './product-filter.component.html',
  styleUrls: ['./product-filter.component.css']
})
export class ProductFilterComponent implements OnChanges {
  private readonly fb = inject(FormBuilder);

  @Input() categories: string[] = [];
  @Input() brands: string[] = [];
  @Input() disabled = false;
  @Input() filters: ProductSearchRequest | null = null;

  @Output() filtersChange = new EventEmitter<ProductFilterValue>();

  readonly form = this.fb.group({
    searchText: [''],
    category: [''],
    brand: [''],
    status: ['ALL']
  });

  ngOnChanges(changes: SimpleChanges): void {
    if ('filters' in changes && this.filters) {
      this.form.patchValue(
        {
          searchText: this.filters.searchText ?? '',
          category: this.filters.category ?? '',
          brand: this.filters.brand ?? '',
          status:
            this.filters.isActive === true
              ? 'ACTIVE'
              : this.filters.isActive === false
                ? 'INACTIVE'
                : 'ALL'
        },
        { emitEvent: false }
      );
    }
  }

  apply(): void {
    const value = this.form.getRawValue();

    this.filtersChange.emit({
      searchText: value.searchText?.trim() ?? '',
      category: value.category?.trim() ?? '',
      brand: value.brand?.trim() ?? '',
      isActive:
        value.status === 'ACTIVE' ? true : value.status === 'INACTIVE' ? false : null
    });
  }

  reset(): void {
    this.form.reset(
      {
        searchText: '',
        category: '',
        brand: '',
        status: 'ALL'
      },
      { emitEvent: false }
    );

    this.apply();
  }
}
