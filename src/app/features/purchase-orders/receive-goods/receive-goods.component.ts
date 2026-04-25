import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AbstractControl, FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { catchError, forkJoin, of } from 'rxjs';
import { Product, PurchaseOrder, Supplier, Warehouse } from '../../../core/models';
import { PurchaseOrderService } from '../../../core/services/purchase-order.service';
import { ProductService } from '../../../core/services/product.service';
import { SupplierService } from '../../../core/services/supplier.service';
import { ToastService } from '../../../core/services/toast.service';
import { WarehouseService } from '../../../core/services/warehouse.service';
import { canReceivePurchaseOrder, enrichPurchaseOrder } from '../purchase-order.utils';

@Component({
  selector: 'app-receive-goods',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './receive-goods.component.html',
  styleUrls: ['./receive-goods.component.css']
})
export class ReceiveGoodsComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly purchaseOrderService = inject(PurchaseOrderService);
  private readonly supplierService = inject(SupplierService);
  private readonly warehouseService = inject(WarehouseService);
  private readonly productService = inject(ProductService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly po = signal<PurchaseOrder | null>(null);
  readonly loading = signal(true);
  readonly saving = signal(false);

  readonly form = this.fb.group({
    receipts: this.fb.array([])
  });

  get receipts(): FormArray {
    return this.form.get('receipts') as FormArray;
  }

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    if (!id) {
      this.toast.error('Purchase order not found');
      this.router.navigate(['/purchase-orders']);
      return;
    }

    forkJoin({
      order: this.purchaseOrderService.getPOById(id),
      suppliers: this.supplierService.getAllList().pipe(catchError(() => of([] as Supplier[]))),
      warehouses: this.warehouseService.getActive().pipe(catchError(() => of([] as Warehouse[]))),
      products: this.productService.getAllProducts().pipe(catchError(() => of([] as Product[])))
    }).subscribe({
      next: ({ order, suppliers, warehouses, products }) => {
        const enrichedOrder = enrichPurchaseOrder(order, { suppliers, warehouses, products });

        if (!canReceivePurchaseOrder(enrichedOrder)) {
          this.toast.warning('Goods can only be received for approved or partially received purchase orders.');
          this.router.navigate(['/purchase-orders', enrichedOrder.id]);
          return;
        }

        this.po.set(enrichedOrder);
        this.receipts.clear();

        enrichedOrder.lineItems.forEach((lineItem) => {
          this.receipts.push(
            this.fb.group({
              lineItemId: [lineItem.lineItemId ?? null],
              productId: [lineItem.productId],
              productName: [lineItem.productName],
              sku: [lineItem.sku],
              orderedQty: [lineItem.quantity],
              alreadyReceivedQty: [lineItem.receivedQty],
              remainingQty: [lineItem.remainingQty],
              receiveNowQty: [
                0,
                [
                  Validators.required,
                  Validators.min(0),
                  Validators.max(lineItem.remainingQty)
                ]
              ]
            })
          );
        });

        this.loading.set(false);
      },
      error: (error) => {
        this.toast.error('Unable to load purchase order', error.error?.message ?? error.message);
        this.router.navigate(['/purchase-orders']);
      }
    });
  }

  getRowStatus(control: AbstractControl): 'Not Received' | 'Partial' | 'Complete' {
    const remainingQty = Number(control.get('remainingQty')?.value ?? 0);
    const alreadyReceivedQty = Number(control.get('alreadyReceivedQty')?.value ?? 0);

    if (remainingQty === 0) {
      return 'Complete';
    }

    if (alreadyReceivedQty > 0) {
      return 'Partial';
    }

    return 'Not Received';
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const items = this.receipts.controls
      .map((control) => ({
        lineItemId: Number(control.get('lineItemId')?.value ?? 0),
        receivedQty: Number(control.get('receiveNowQty')?.value ?? 0)
      }))
      .filter((item) => item.receivedQty > 0);

    if (items.length === 0) {
      this.toast.error('Enter a received quantity for at least one line item.');
      return;
    }

    this.saving.set(true);
    this.purchaseOrderService.receiveGoods(this.po()!.id, { items }).subscribe({
      next: (updatedOrder) => {
        this.toast.success('Goods received successfully. Stock and movement history have been updated.');
        this.router.navigate(['/purchase-orders', updatedOrder.id]);
      },
      error: (error) => {
        this.saving.set(false);
        this.toast.error('Receive failed', error.error?.message ?? error.message);
      }
    });
  }
}
