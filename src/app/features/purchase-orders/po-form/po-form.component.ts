import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';
import {
  CreatePurchaseOrderRequest,
  Product,
  Supplier,
  Warehouse
} from '../../../core/models';
import { AuthService } from '../../../core/services/auth.service';
import { ProductService } from '../../../core/services/product.service';
import { PurchaseOrderService } from '../../../core/services/purchase-order.service';
import { SupplierService } from '../../../core/services/supplier.service';
import { ToastService } from '../../../core/services/toast.service';
import { WarehouseService } from '../../../core/services/warehouse.service';

@Component({
  selector: 'app-po-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './po-form.component.html',
  styleUrls: ['./po-form.component.css']
})
export class PoFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly purchaseOrderService = inject(PurchaseOrderService);
  private readonly supplierService = inject(SupplierService);
  private readonly warehouseService = inject(WarehouseService);
  private readonly productService = inject(ProductService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);

  readonly suppliers = signal<Supplier[]>([]);
  readonly warehouses = signal<Warehouse[]>([]);
  readonly products = signal<Product[]>([]);
  readonly saving = signal(false);
  readonly loading = signal(true);
  readonly editModeBlocked = signal(false);

  readonly form = this.fb.group({
    supplierId: [null as number | null, Validators.required],
    warehouseId: [null as number | null, Validators.required],
    status: ['DRAFT' as 'DRAFT' | 'PENDING_APPROVAL', Validators.required],
    expectedDate: ['', Validators.required],
    referenceNumber: [''],
    notes: [''],
    lineItems: this.fb.array([])
  });

  get lineItems(): FormArray {
    return this.form.get('lineItems') as FormArray;
  }

  get totalAmount(): number {
    return this.lineItems.controls.reduce((sum, control) => {
      const quantity = Number(control.get('quantity')?.value ?? 0);
      const unitCost = Number(control.get('unitCost')?.value ?? 0);
      return sum + quantity * unitCost;
    }, 0);
  }

  ngOnInit(): void {
    forkJoin({
      suppliers: this.supplierService.getActive().pipe(catchError(() => of([] as Supplier[]))),
      warehouses: this.warehouseService.getActive().pipe(catchError(() => of([] as Warehouse[]))),
      products: this.productService.getAllProducts().pipe(catchError(() => of([] as Product[])))
    }).subscribe({
      next: ({ suppliers, warehouses, products }) => {
        this.suppliers.set(suppliers);
        this.warehouses.set(warehouses);
        this.products.set(products);
        this.ensureAtLeastOneLineItem();
        this.loading.set(false);
        this.handleEditRoute();
      },
      error: () => {
        this.ensureAtLeastOneLineItem();
        this.loading.set(false);
        this.handleEditRoute();
      }
    });
  }

  addLineItem(): void {
    this.lineItems.push(this.createLineItemGroup());
  }

  removeLineItem(index: number): void {
    this.lineItems.removeAt(index);
    this.ensureAtLeastOneLineItem();
  }

  onProductChange(index: number, productId: string): void {
    const product = this.products().find((candidate) => candidate.id === Number(productId));
    if (!product) {
      return;
    }

    this.lineItems.at(index).patchValue({
      unitCost: product.costPrice
    });
  }

  getLineSubtotal(control: AbstractControl): number {
    return Number(control.get('quantity')?.value ?? 0) * Number(control.get('unitCost')?.value ?? 0);
  }

  submit(): void {
    if (this.editModeBlocked()) {
      this.toast.warning('Purchase order editing is not available with the current backend.');
      return;
    }

    if (this.form.invalid || this.lineItems.length === 0 || this.hasDuplicateProducts()) {
      this.form.markAllAsTouched();
      if (this.lineItems.length === 0) {
        this.toast.error('At least one line item is required.');
      } else if (this.hasDuplicateProducts()) {
        this.toast.error('Each product can only appear once in a purchase order.');
      }
      return;
    }

    this.saving.set(true);
    const rawValue = this.form.getRawValue();
    const rawLineItems = rawValue.lineItems as Array<{
      productId: number | null;
      quantity: number | null;
      unitCost: number | null;
    }>;
    const payload: CreatePurchaseOrderRequest = {
      supplierId: Number(rawValue.supplierId),
      warehouseId: Number(rawValue.warehouseId),
      createdById: this.authService.currentUser()?.id ?? null,
      status: rawValue.status ?? 'DRAFT',
      expectedDate: rawValue.expectedDate,
      referenceNumber: rawValue.referenceNumber?.trim() || null,
      notes: rawValue.notes?.trim() || null,
      lineItems: rawLineItems.map((lineItem) => {
        const quantity = Number(lineItem.quantity ?? 0);
        const unitCost = Number(lineItem.unitCost ?? 0);
        return {
          productId: Number(lineItem.productId),
          quantity,
          unitCost,
          totalCost: quantity * unitCost,
          receivedQty: 0
        };
      })
    };

    this.purchaseOrderService.createPO(payload).subscribe({
      next: (order) => {
        this.toast.success(
          payload.status === 'PENDING_APPROVAL'
            ? 'Purchase order submitted for approval'
            : 'Purchase order created'
        );
        this.router.navigate(['/purchase-orders', order.id]);
      },
      error: (error) => {
        this.saving.set(false);
        this.toast.error('Save failed', error.error?.message ?? error.message);
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/purchase-orders']);
  }

  private createLineItemGroup(productId: number | null = null, quantity = 1, unitCost = 0) {
    return this.fb.group({
      productId: [productId, Validators.required],
      quantity: [quantity, [Validators.required, Validators.min(1)]],
      unitCost: [unitCost, [Validators.required, Validators.min(0)]]
    });
  }

  private ensureAtLeastOneLineItem(): void {
    if (this.lineItems.length === 0) {
      this.addLineItem();
    }
  }

  private hasDuplicateProducts(): boolean {
    const productIds = this.lineItems.controls
      .map((control) => Number(control.get('productId')?.value))
      .filter((value) => Number.isFinite(value) && value > 0);

    return new Set(productIds).size !== productIds.length;
  }

  private handleEditRoute(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      return;
    }

    this.editModeBlocked.set(true);
    this.toast.warning('The current purchase-service backend does not expose PO update yet.');
    this.router.navigate(['/purchase-orders', Number(id)]);
  }
}
