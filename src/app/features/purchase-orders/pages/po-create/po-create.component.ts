import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { CreatePurchaseOrderRequest, Product, SupplierResponse, WarehouseResponse } from '../../../../core/http/backend.models';
import { NotificationService } from '../../../../core/services/notification.service';
import { PoFormComponent } from '../../components/po-form/po-form.component';
import { PurchaseOrderFormValue } from '../../models/purchase-order.model';
import { PurchaseOrderApiService } from '../../services/purchase-order-api.service';

@Component({
  selector: 'app-po-create',
  standalone: true,
  imports: [CommonModule, RouterLink, PoFormComponent],
  templateUrl: './po-create.component.html',
  styleUrls: ['./po-create.component.css'],
})
export class PoCreateComponent implements OnInit {
  private readonly purchaseApi = inject(PurchaseOrderApiService);
  private readonly notifications = inject(NotificationService);
  private readonly router = inject(Router);

  suppliers: SupplierResponse[] = [];
  warehouses: WarehouseResponse[] = [];
  products: Product[] = [];
  loading = false;
  lookupsLoading = false;

  ngOnInit(): void {
    this.loadLookups();
  }

  saveDraft(value: PurchaseOrderFormValue): void {
    this.loading = true;
    this.purchaseApi
      .createPurchaseOrder(this.toCreateRequest(value))
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (order) => {
          this.notifications.success('Purchase order created successfully');
          this.router.navigate(['/purchase-orders', order.purchaseOrderId ?? order.poId]);
        },
      });
  }

  saveAndSubmit(value: PurchaseOrderFormValue): void {
    this.loading = true;
    this.purchaseApi
      .createPurchaseOrder(this.toCreateRequest(value))
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (order) => {
          this.purchaseApi.submitPurchaseOrder(order.purchaseOrderId ?? order.poId, {}).subscribe({
            next: (submitted) => {
              this.notifications.success('Purchase order submitted for approval');
              this.router.navigate(['/purchase-orders', submitted.purchaseOrderId ?? submitted.poId]);
            },
          });
        },
      });
  }

  private loadLookups(): void {
    this.lookupsLoading = true;
    forkJoin({
      suppliers: this.purchaseApi.getSuppliers(),
      warehouses: this.purchaseApi.getWarehouses(),
      products: this.purchaseApi.getProducts(),
    })
      .pipe(finalize(() => (this.lookupsLoading = false)))
      .subscribe({
        next: ({ suppliers, warehouses, products }) => {
          this.suppliers = suppliers;
          this.warehouses = warehouses.content ?? [];
          this.products = products.content ?? [];
        },
        error: () => {
          this.suppliers = [];
          this.warehouses = [];
          this.products = [];
        },
      });
  }

  private toCreateRequest(value: PurchaseOrderFormValue): CreatePurchaseOrderRequest {
    return {
      supplierId: value.supplierId,
      warehouseId: value.warehouseId,
      expectedDeliveryDate: value.expectedDeliveryDate,
      paymentTerms: value.paymentTerms,
      notes: value.notes,
      lineItems: value.lineItems,
    };
  }
}
