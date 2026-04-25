import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { catchError, forkJoin, of } from 'rxjs';
import { Product, Supplier, Warehouse } from '../../../../core/models';
import { ProductService } from '../../../../core/services/product.service';
import { SupplierService } from '../../../../core/services/supplier.service';
import { WarehouseService } from '../../../../core/services/warehouse.service';
import { DateRangeFilterComponent } from '../../components/date-range-filter/date-range-filter.component';
import { ReportFormat } from '../../models';
import { REPORT_FORMAT_OPTIONS, getAccessibleReportTypes } from '../../report.constants';
import { ReportPageBase } from '../report-page.base';

@Component({
  selector: 'app-generate-report-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DateRangeFilterComponent],
  templateUrl: './generate-report-page.component.html',
  styleUrls: ['./generate-report-page.component.css']
})
export class GenerateReportPageComponent extends ReportPageBase implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly warehouseService = inject(WarehouseService);
  private readonly productService = inject(ProductService);
  private readonly supplierService = inject(SupplierService);

  readonly warehouses = signal<Warehouse[]>([]);
  readonly products = signal<Product[]>([]);
  readonly suppliers = signal<Supplier[]>([]);
  readonly loadingLookups = signal(true);
  readonly submitting = signal(false);
  readonly errorMessage = signal('');

  readonly formatOptions = REPORT_FORMAT_OPTIONS;
  readonly reportTypes = computed(() => getAccessibleReportTypes(this.currentRole()));

  readonly form = this.fb.nonNullable.group({
    reportType: ['', Validators.required],
    format: ['CSV' as ReportFormat, Validators.required],
    warehouseId: [''],
    productId: [''],
    supplierId: [''],
    thresholdDays: [90]
  });

  fromDate = '';
  toDate = '';
  isDateRangeValid = true;

  readonly isDeadStockType = computed(
    () => this.form.controls.reportType.value === 'DEAD_STOCK'
  );

  ngOnInit(): void {
    this.loadLookups();
  }

  loadLookups(): void {
    this.loadingLookups.set(true);

    forkJoin({
      warehouses: this.warehouseService.getActive().pipe(catchError(() => of([] as Warehouse[]))),
      products: this.productService.getAllProducts().pipe(catchError(() => of([] as Product[]))),
      suppliers: this.supplierService.getActive().pipe(catchError(() => of([] as Supplier[])))
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

  onDateRangeChange(range: { fromDate: string; toDate: string }): void {
    this.fromDate = range.fromDate;
    this.toDate = range.toDate;
  }

  onDateRangeValidityChange(isValid: boolean): void {
    this.isDateRangeValid = isValid;
  }

  submit(): void {
    if (this.form.invalid || !this.isDateRangeValid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    this.errorMessage.set('');
    this.submitting.set(true);

    this.exportReport(
      value.reportType,
      value.format,
      {
        warehouseId: value.warehouseId ? Number(value.warehouseId) : null,
        productId: value.productId ? Number(value.productId) : null,
        supplierId: value.supplierId ? Number(value.supplierId) : null,
        fromDate: this.fromDate || null,
        toDate: this.toDate || null,
        thresholdDays: this.isDeadStockType() ? Number(value.thresholdDays || 90) : null
      },
      {
        successTitle: 'Report generated successfully',
        onSuccess: () => this.submitting.set(false),
        onError: (error) => {
          this.errorMessage.set(
            this.getErrorMessage(error, 'Unable to generate the requested report export.')
          );
          this.submitting.set(false);
        }
      }
    );
  }
}
