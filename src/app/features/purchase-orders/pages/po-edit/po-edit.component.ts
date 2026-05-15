import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { Product, PurchaseOrderResponse, SupplierResponse, UpdatePurchaseOrderRequest, WarehouseResponse } from '../../../../core/http/backend.models';
import { NotificationService } from '../../../../core/services/notification.service';
import { PoFormComponent } from '../../components/po-form/po-form.component';
import { PurchaseOrderFormValue } from '../../models/purchase-order.model';
import { PurchaseOrderApiService } from '../../services/purchase-order-api.service';

@Component({
  selector: 'app-po-edit',
  standalone: true,
  imports: [CommonModule, RouterLink, PoFormComponent],
  templateUrl: './po-edit.component.html',
  styleUrls: ['./po-edit.component.css'],
})
export class PoEditComponent implements OnInit {
  private readonly purchaseApi = inject(PurchaseOrderApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly notifications = inject(NotificationService);

  purchaseOrder: PurchaseOrderResponse | null = null;
  suppliers: SupplierResponse[] = [];
  warehouses: WarehouseResponse[] = [];
  products: Product[] = [];
  initialValue: PurchaseOrderFormValue | null = null;
  loading = false;
  pageLoading = false;
  editable = true;

  ngOnInit(): void {
    this.loadPage();
  }

  update(value: PurchaseOrderFormValue): void {
    if (!this.purchaseOrder) {
      return;
    }
    this.loading = true;
    this.purchaseApi
      .updatePurchaseOrder(this.purchaseOrder.purchaseOrderId ?? this.purchaseOrder.poId, this.toUpdateRequest(value))
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (order) => {
          this.notifications.success('Purchase order updated successfully');
          this.router.navigate(['/purchase-orders', order.purchaseOrderId ?? order.poId]);
        },
      });
  }

  private loadPage(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.pageLoading = true;
    forkJoin({
      order: this.purchaseApi.getPurchaseOrderById(id),
      suppliers: this.purchaseApi.getSuppliers(),
      warehouses: this.purchaseApi.getWarehouses(),
      products: this.purchaseApi.getProducts(),
    })
      .pipe(finalize(() => (this.pageLoading = false)))
      .subscribe({
        next: ({ order, suppliers, warehouses, products }) => {
          this.purchaseOrder = order;
          this.suppliers = suppliers;
          this.warehouses = warehouses.content ?? [];
          this.products = products.content ?? [];
          this.editable = ['DRAFT', 'PENDING_APPROVAL'].includes(order.status);
          this.initialValue = {
            supplierId: order.supplierId,
            warehouseId: order.warehouseId,
            expectedDeliveryDate: order.expectedDeliveryDate || order.expectedDate || '',
            paymentTerms: order.paymentTerms || null,
            notes: order.notes || null,
            taxAmount: order.taxAmount ?? 0,
            discountAmount: order.discountAmount ?? 0,
            shippingAmount: order.shippingAmount ?? 0,
            lineItems: order.lineItems.map((item) => ({
              productId: item.productId,
              orderedQuantity: item.orderedQuantity ?? item.quantity,
              unitCost: item.unitCost,
              notes: item.notes || null,
            })),
          };
        },
      });
  }

  private toUpdateRequest(value: PurchaseOrderFormValue): UpdatePurchaseOrderRequest {
    return {
      supplierId: value.supplierId,
      warehouseId: value.warehouseId,
      expectedDeliveryDate: value.expectedDeliveryDate,
      paymentTerms: value.paymentTerms,
      notes: value.notes,
      taxAmount: value.taxAmount,
      discountAmount: value.discountAmount,
      shippingAmount: value.shippingAmount,
      lineItems: value.lineItems,
    };
  }
}
