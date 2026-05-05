import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { EMPTY, forkJoin } from 'rxjs';
import { catchError, finalize, switchMap, tap } from 'rxjs/operators';
import { CreatePurchaseOrderRequest, Product, SupplierResponse, WarehouseResponse } from '../../../../core/http/backend.models';
import { NotificationService } from '../../../../core/services/notification.service';
import { WarehouseService } from '../../../../core/services/warehouse.service';
import { PoFormComponent } from '../../components/po-form/po-form.component';
import { PurchaseOrderFormValue } from '../../models/purchase-order.model';
import { PurchaseOrderApiService } from '../../services/purchase-order-api.service';
import { ProductApiService } from '../../../products/services/product-api.service';
import { SupplierApiService } from '../../../suppliers/services/supplier-api.service';

@Component({
  selector: 'app-po-create',
  standalone: true,
  imports: [CommonModule, RouterLink, PoFormComponent],
  templateUrl: './po-create.component.html',
  styleUrls: ['./po-create.component.css'],
})
export class PoCreateComponent implements OnInit {
  private readonly purchaseApi = inject(PurchaseOrderApiService);
  private readonly supplierApi = inject(SupplierApiService);
  private readonly warehouseService = inject(WarehouseService);
  private readonly productApi = inject(ProductApiService);
  private readonly notifications = inject(NotificationService);
  private readonly router = inject(Router);

  suppliers: SupplierResponse[] = [];
  warehouses: WarehouseResponse[] = [];
  products: Product[] = [];
  loading = false;
  submitting = false;
  lookupsLoading = true;
  lookupError: string | null = null;

  ngOnInit(): void {
    this.loadLookups();
  }

  saveDraft(value: PurchaseOrderFormValue): void {
    if (this.loading || this.submitting || !this.canSubmit(value)) {
      return;
    }

    const request = this.toCreateRequest(value);

    this.loading = true;
    this.purchaseApi
      .createPurchaseOrder(request)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (order) => {
          this.notifications.success('Purchase order saved as draft successfully');
          void this.router.navigate(['/purchase-orders', order.purchaseOrderId ?? order.poId]);
        },
        error: (error) => this.notifications.error(this.getErrorMessage(error, 'Failed to save purchase order. Please try again.')),
      });
  }

  saveAndSubmit(value: PurchaseOrderFormValue): void {
    if (this.loading || this.submitting || !this.canSubmit(value)) {
      return;
    }

    const request = this.toCreateRequest(value);

    this.submitting = true;
    this.purchaseApi
      .createPurchaseOrder(request)
      .pipe(
        switchMap((order) =>
          this.purchaseApi.submitPurchaseOrder(order.purchaseOrderId ?? order.poId, {}).pipe(
            tap((submitted) => {
              this.notifications.success('Purchase order submitted for approval successfully');
              void this.router.navigate(['/purchase-orders', submitted.purchaseOrderId ?? submitted.poId]);
            }),
            catchError((error) => {
              this.notifications.error(
                this.getErrorMessage(
                  error,
                  'Purchase order was saved as draft, but submission failed. Please try again.'
                )
              );
              return EMPTY;
            })
          )
        ),
        finalize(() => (this.submitting = false))
      )
      .subscribe({
        error: (error) => this.notifications.error(this.getErrorMessage(error, 'Failed to save purchase order. Please try again.')),
      });
  }

  private loadLookups(): void {
    this.lookupsLoading = true;
    this.lookupError = null;
    forkJoin({
      suppliers: this.supplierApi.getActiveSuppliers(),
      warehouses: this.warehouseService.getWarehouses(true),
      products: this.productApi.searchProducts({ isActive: true, page: 0, size: 100, sortBy: 'name', sortDir: 'asc' }),
    })
      .pipe(finalize(() => (this.lookupsLoading = false)))
      .subscribe({
        next: ({ suppliers, warehouses, products }) => {
          this.suppliers = suppliers;
          this.warehouses = warehouses.filter((warehouse) => warehouse.isActive !== false);
          this.products = products.content ?? [];
          this.lookupError = this.warehouses.length === 0 ? 'No active warehouses found. Please create a warehouse first.' : null;
        },
        error: () => {
          this.suppliers = [];
          this.warehouses = [];
          this.products = [];
          this.lookupError = 'Unable to load purchase order lookups right now. Please try again.';
        },
      });
  }

  private toCreateRequest(value: PurchaseOrderFormValue): CreatePurchaseOrderRequest {
    return {
      supplierId: Number(value.supplierId),
      warehouseId: Number(value.warehouseId),
      expectedDeliveryDate: value.expectedDeliveryDate,
      paymentTerms: value.paymentTerms?.trim() || null,
      notes: value.notes?.trim() || null,
      lineItems: value.lineItems.map((lineItem) => ({
        productId: Number(lineItem.productId),
        orderedQuantity: Number(lineItem.orderedQuantity),
        unitCost: Number(lineItem.unitCost),
        notes: lineItem.notes?.trim() || null,
      })),
    };
  }

  private canSubmit(value: PurchaseOrderFormValue): boolean {
    return (
      Number(value.supplierId) > 0 &&
      Number(value.warehouseId) > 0 &&
      this.warehouses.some((warehouse) => Number(warehouse.warehouseId ?? warehouse.id) === Number(value.warehouseId)) &&
      value.lineItems.length > 0 &&
      value.lineItems.every(
        (lineItem) =>
          Number(lineItem.productId) > 0 &&
          Number(lineItem.orderedQuantity) > 0 &&
          Number(lineItem.unitCost) >= 0
      )
    );
  }

  private getErrorMessage(error: unknown, fallback: string): string {
    if (error instanceof HttpErrorResponse) {
      if (typeof error.error === 'string' && error.error.trim()) {
        return error.error;
      }

      if (error.error?.message && typeof error.error.message === 'string') {
        return error.error.message;
      }

      if (error.error && typeof error.error === 'object') {
        const messages = Object.values(error.error as Record<string, unknown>).filter(
          (value): value is string => typeof value === 'string' && value.trim().length > 0
        );
        if (messages.length > 0) {
          return messages.join('\n');
        }
      }
    }

    return fallback;
  }
}
