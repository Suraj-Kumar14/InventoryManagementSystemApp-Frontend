import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { catchError, forkJoin, of } from 'rxjs';
import { Product, Supplier, Warehouse } from '../../../../core/models';
import { ProductService } from '../../../../core/services/product.service';
import { SupplierService } from '../../../../core/services/supplier.service';
import { WarehouseService } from '../../../../core/services/warehouse.service';
import { ReportFilterRequest } from '../../models';
import { toNullableNumber } from '../../report.utils';
import { DateRangeFilterComponent } from '../date-range-filter/date-range-filter.component';

@Component({
  selector: 'app-report-filter',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DateRangeFilterComponent],
  templateUrl: './report-filter.component.html',
  styleUrls: ['./report-filter.component.css']
})
export class ReportFilterComponent implements OnInit, OnChanges {
  private readonly fb = inject(FormBuilder);
  private readonly warehouseService = inject(WarehouseService);
  private readonly productService = inject(ProductService);
  private readonly supplierService = inject(SupplierService);

  @Input() disabled = false;
  @Input() filters: ReportFilterRequest | null = null;
  @Input() showWarehouse = false;
  @Input() showProduct = false;
  @Input() showSupplier = false;
  @Input() showDateRange = false;
  @Input() showPageSize = true;
  @Input() submitLabel = 'Apply Filters';
  @Input() resetLabel = 'Reset';

  @Output() filtersChange = new EventEmitter<ReportFilterRequest>();

  readonly form = this.fb.nonNullable.group({
    warehouseId: [''],
    productId: [''],
    supplierId: [''],
    size: [20]
  });

  readonly warehouses = signal<Warehouse[]>([]);
  readonly products = signal<Product[]>([]);
  readonly suppliers = signal<Supplier[]>([]);
  readonly loadingLookups = signal(false);

  fromDate = '';
  toDate = '';
  isDateRangeValid = true;

  ngOnInit(): void {
    this.patchFromFilters();
    this.toggleFormState();
    this.loadLookups();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ('filters' in changes && !changes['filters'].firstChange) {
      this.patchFromFilters();
    }

    if ('disabled' in changes && !changes['disabled'].firstChange) {
      this.toggleFormState();
    }

    if (
      ('showWarehouse' in changes ||
        'showProduct' in changes ||
        'showSupplier' in changes) &&
      !changes['showWarehouse']?.firstChange
    ) {
      this.loadLookups();
    }
  }

  apply(): void {
    if (this.showDateRange && !this.isDateRangeValid) {
      return;
    }

    const value = this.form.getRawValue();

    this.filtersChange.emit({
      warehouseId: this.showWarehouse ? toNullableNumber(value.warehouseId) : null,
      productId: this.showProduct ? toNullableNumber(value.productId) : null,
      supplierId: this.showSupplier ? toNullableNumber(value.supplierId) : null,
      fromDate: this.showDateRange ? this.fromDate || null : this.filters?.fromDate ?? null,
      toDate: this.showDateRange ? this.toDate || null : this.filters?.toDate ?? null,
      page: 0,
      size: this.showPageSize ? Math.max(Number(value.size || 20), 1) : this.filters?.size ?? 20,
      sortBy: this.filters?.sortBy,
      sortDir: this.filters?.sortDir
    });
  }

  reset(): void {
    this.form.reset(
      {
        warehouseId: '',
        productId: '',
        supplierId: '',
        size: this.filters?.size ?? 20
      },
      { emitEvent: false }
    );

    this.fromDate = '';
    this.toDate = '';
    this.isDateRangeValid = true;
    this.apply();
  }

  onDateRangeChange(range: { fromDate: string; toDate: string }): void {
    this.fromDate = range.fromDate;
    this.toDate = range.toDate;
  }

  onDateRangeValidityChange(isValid: boolean): void {
    this.isDateRangeValid = isValid;
  }

  private patchFromFilters(): void {
    const filters = this.filters ?? {};

    this.form.patchValue(
      {
        warehouseId: filters.warehouseId != null ? String(filters.warehouseId) : '',
        productId: filters.productId != null ? String(filters.productId) : '',
        supplierId: filters.supplierId != null ? String(filters.supplierId) : '',
        size: filters.size ?? 20
      },
      { emitEvent: false }
    );

    this.fromDate = filters.fromDate ?? '';
    this.toDate = filters.toDate ?? '';
  }

  private toggleFormState(): void {
    if (this.disabled) {
      this.form.disable({ emitEvent: false });
      return;
    }

    this.form.enable({ emitEvent: false });
  }

  private loadLookups(): void {
    if (!this.showWarehouse && !this.showProduct && !this.showSupplier) {
      return;
    }

    this.loadingLookups.set(true);

    forkJoin({
      warehouses: this.showWarehouse
        ? this.warehouseService.getActive().pipe(catchError(() => of([] as Warehouse[])))
        : of([] as Warehouse[]),
      products: this.showProduct
        ? this.productService.getAllProducts().pipe(catchError(() => of([] as Product[])))
        : of([] as Product[]),
      suppliers: this.showSupplier
        ? this.supplierService.getActive().pipe(catchError(() => of([] as Supplier[])))
        : of([] as Supplier[])
    }).subscribe({
      next: ({ warehouses, products, suppliers }) => {
        this.warehouses.set(warehouses);
        this.products.set(products);
        this.suppliers.set(suppliers);
        this.loadingLookups.set(false);
      },
      error: () => {
        this.loadingLookups.set(false);
      }
    });
  }
}
