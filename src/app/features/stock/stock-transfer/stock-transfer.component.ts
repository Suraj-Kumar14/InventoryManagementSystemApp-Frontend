import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Product, Warehouse } from '../../../core/models';
import { ProductService } from '../../../core/services/product.service';
import { StockService } from '../../../core/services/stock.service';
import { ToastService } from '../../../core/services/toast.service';
import { WarehouseService } from '../../../core/services/warehouse.service';

@Component({
  selector: 'app-stock-transfer',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './stock-transfer.component.html',
  styleUrls: ['./stock-transfer.component.css']
})
export class StockTransferComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly stockService = inject(StockService);
  private readonly warehouseService = inject(WarehouseService);
  private readonly productService = inject(ProductService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly warehouses = signal<Warehouse[]>([]);
  readonly products = signal<Product[]>([]);
  readonly saving = signal(false);

  readonly form = this.fb.group(
    {
      productId: [null as number | null, Validators.required],
      sourceWarehouseId: [null as number | null, Validators.required],
      destinationWarehouseId: [null as number | null, Validators.required],
      quantity: [1, [Validators.required, Validators.min(1)]],
      referenceId: [''],
      notes: ['']
    },
    { validators: this.differentWarehousesValidator() }
  );

  ngOnInit(): void {
    this.warehouseService.getActive().subscribe({
      next: (warehouses) => this.warehouses.set(warehouses),
      error: () => undefined
    });

    this.productService.getAllProducts().subscribe({
      next: (products) => this.products.set(products),
      error: () => undefined
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const selectedProduct = this.products().find((product) => product.id === value.productId);

    this.saving.set(true);
    this.stockService.transfer({
      productId: value.productId!,
      sourceWarehouseId: value.sourceWarehouseId!,
      destinationWarehouseId: value.destinationWarehouseId!,
      quantity: Number(value.quantity ?? 0),
      referenceId: value.referenceId?.trim() || null,
      referenceType: 'TRANSFER',
      unitCost: selectedProduct?.costPrice ?? null,
      notes: value.notes?.trim() || null
    }).subscribe({
      next: () => {
        this.toast.success('Stock transferred');
        this.router.navigate(['/stock']);
      },
      error: (error) => {
        this.saving.set(false);
        this.toast.error('Transfer failed', error.error?.message ?? error.message);
      }
    });
  }

  private differentWarehousesValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const sourceWarehouseId = control.get('sourceWarehouseId')?.value;
      const destinationWarehouseId = control.get('destinationWarehouseId')?.value;

      if (
        sourceWarehouseId != null &&
        destinationWarehouseId != null &&
        sourceWarehouseId === destinationWarehouseId
      ) {
        return { sameWarehouse: true };
      }

      return null;
    };
  }
}
