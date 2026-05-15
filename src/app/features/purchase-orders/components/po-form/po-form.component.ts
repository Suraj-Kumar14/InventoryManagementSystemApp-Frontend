import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, inject } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Product, SupplierResponse, WarehouseResponse } from '../../../../core/http/backend.models';
import { NotificationService } from '../../../../core/services/notification.service';
import { PurchaseOrderFormValue } from '../../models/purchase-order.model';

@Component({
  selector: 'app-po-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './po-form.component.html',
  styleUrls: ['./po-form.component.css'],
})
export class PoFormComponent implements OnChanges {
  private readonly fb = inject(FormBuilder);
  private readonly notifications = inject(NotificationService);

  @Input() suppliers: SupplierResponse[] = [];
  @Input() warehouses: WarehouseResponse[] = [];
  @Input() products: Product[] = [];
  @Input() loading = false;
  @Input() submitting = false;
  @Input() submitLabel = 'Save Draft';
  @Input() showSubmitAndApprove = true;
  @Input() chargeFieldsReadOnly = false;
  @Input() initialValue: PurchaseOrderFormValue | null = null;

  @Output() save = new EventEmitter<PurchaseOrderFormValue>();
  @Output() saveAndSubmit = new EventEmitter<PurchaseOrderFormValue>();

  readonly form = this.fb.group({
    supplierId: this.fb.nonNullable.control(0, [Validators.required, Validators.min(1)]),
    warehouseId: this.fb.nonNullable.control(0, [Validators.required, Validators.min(1)]),
    expectedDeliveryDate: this.fb.nonNullable.control('', Validators.required),
    paymentTerms: this.fb.control<string>(''),
    notes: this.fb.control<string>(''),
    taxAmount: this.fb.control<number | null>(0, [Validators.min(0)]),
    discountAmount: this.fb.control<number | null>(0, [Validators.min(0)]),
    shippingAmount: this.fb.control<number | null>(0, [Validators.min(0)]),
    lineItems: this.fb.array([]),
  });

  constructor() {
    this.addLineItem();
  }

  get lineItems(): FormArray {
    return this.form.get('lineItems') as FormArray;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['initialValue']) {
      this.patchInitialValue();
    }
  }

  addLineItem(): void {
    this.lineItems.push(
      this.fb.group({
        productId: this.fb.nonNullable.control(0, [Validators.required, Validators.min(1)]),
        orderedQuantity: this.fb.nonNullable.control(1, [Validators.required, Validators.min(1)]),
        unitCost: this.fb.nonNullable.control(0, [Validators.required, Validators.min(0)]),
        notes: this.fb.control<string>(''),
      })
    );
  }

  removeLineItem(index: number): void {
    if (this.lineItems.length <= 1) {
      return;
    }
    this.lineItems.removeAt(index);
  }

  getLineTotal(index: number): number {
    const group = this.lineItems.at(index);
    const quantity = Number(group.get('orderedQuantity')?.value ?? 0);
    const unitCost = Number(group.get('unitCost')?.value ?? 0);
    return quantity * unitCost;
  }

  get subtotal(): number {
    return this.lineItems.controls.reduce((total, _, index) => total + this.getLineTotal(index), 0);
  }

  get grandTotal(): number {
    return (
      this.subtotal +
      Number(this.form.controls.taxAmount.value ?? 0) +
      Number(this.form.controls.shippingAmount.value ?? 0) -
      Number(this.form.controls.discountAmount.value ?? 0)
    );
  }

  submit(saveAndSubmit = false): void {
    if (this.loading || this.submitting) {
      return;
    }

    if (this.form.invalid || this.lineItems.length === 0) {
      this.form.markAllAsTouched();
      return;
    }

    const warehouseId = Number(this.form.controls.warehouseId.value);

    if (!warehouseId || Number.isNaN(warehouseId)) {
      this.notifications.error('Please select a valid warehouse.');
      this.form.controls.warehouseId.markAsTouched();
      return;
    }

    const selectedWarehouseExists = this.warehouses.some(
      (warehouse) => this.resolveWarehouseId(warehouse) === warehouseId
    );

    if (!selectedWarehouseExists) {
      this.notifications.error('Selected warehouse is invalid. Please reselect warehouse.');
      this.form.controls.warehouseId.markAsTouched();
      return;
    }

    const value: PurchaseOrderFormValue = {
      supplierId: Number(this.form.controls.supplierId.value),
      warehouseId,
      expectedDeliveryDate: this.form.controls.expectedDeliveryDate.value || '',
      paymentTerms: this.form.controls.paymentTerms.value || null,
      notes: this.form.controls.notes.value || null,
      taxAmount: Number(this.form.controls.taxAmount.value ?? 0),
      discountAmount: Number(this.form.controls.discountAmount.value ?? 0),
      shippingAmount: Number(this.form.controls.shippingAmount.value ?? 0),
      lineItems: this.lineItems.getRawValue().map((item) => ({
        productId: Number(item.productId),
        orderedQuantity: Number(item.orderedQuantity),
        unitCost: Number(item.unitCost),
        notes: item.notes || null,
      })),
    };

    if (saveAndSubmit) {
      this.saveAndSubmit.emit(value);
      return;
    }
    this.save.emit(value);
  }

  get disableActions(): boolean {
    return this.form.invalid || this.loading || this.submitting || this.lineItems.length === 0;
  }

  getWarehouseId(warehouse: WarehouseResponse): number {
    return Number(warehouse.id ?? warehouse.warehouseId ?? 0);
  }

  getWarehouseLabel(warehouse: WarehouseResponse & { warehouseName?: string | null }): string {
    return warehouse.warehouseName ?? warehouse.name ?? `Warehouse #${this.getWarehouseId(warehouse)}`;
  }

  private patchInitialValue(): void {
    if (!this.initialValue) {
      return;
    }

    this.form.patchValue({
      supplierId: this.initialValue.supplierId,
      warehouseId: this.initialValue.warehouseId,
      expectedDeliveryDate: this.initialValue.expectedDeliveryDate,
      paymentTerms: this.initialValue.paymentTerms || '',
      notes: this.initialValue.notes || '',
      taxAmount: this.initialValue.taxAmount ?? 0,
      discountAmount: this.initialValue.discountAmount ?? 0,
      shippingAmount: this.initialValue.shippingAmount ?? 0,
    });

    while (this.lineItems.length > 0) {
      this.lineItems.removeAt(0);
    }

    this.initialValue.lineItems.forEach((lineItem) => {
      this.lineItems.push(
        this.fb.group({
          productId: this.fb.nonNullable.control(lineItem.productId, [Validators.required, Validators.min(1)]),
          orderedQuantity: this.fb.nonNullable.control(lineItem.orderedQuantity, [Validators.required, Validators.min(1)]),
          unitCost: this.fb.nonNullable.control(lineItem.unitCost, [Validators.required, Validators.min(0)]),
          notes: this.fb.control<string>(lineItem.notes ?? ''),
        })
      );
    });

    if (this.lineItems.length === 0) {
      this.addLineItem();
    }
  }

  private resolveWarehouseId(warehouse: WarehouseResponse): number {
    return this.getWarehouseId(warehouse);
  }
}
