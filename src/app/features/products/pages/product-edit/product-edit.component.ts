import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { Product } from '../../../../core/http/backend.models';
import { NotificationService } from '../../../../core/services/notification.service';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { ProductFormComponent, ProductFormPayload } from '../../components/product-form/product-form.component';
import { ProductApiService } from '../../services/product-api.service';

@Component({
  selector: 'app-product-edit',
  standalone: true,
  imports: [CommonModule, ProductFormComponent, LoadingSpinnerComponent],
  templateUrl: './product-edit.component.html',
  styleUrls: ['./product-edit.component.css'],
})
export class ProductEditComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly productApi = inject(ProductApiService);
  private readonly notifications = inject(NotificationService);

  product: Product | null = null;
  loading = false;
  saving = false;
  backendFieldErrors: Record<string, string> | null = null;

  ngOnInit(): void {
    const productId = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isFinite(productId) || productId <= 0) {
      this.notifications.error('Product ID is missing');
      void this.router.navigate(['/products']);
      return;
    }

    this.loading = true;
    this.productApi
      .getProductById(productId)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (product) => {
          this.product = product;
        },
        error: (error) => {
          this.notifications.error(this.getErrorMessage(error) || 'Failed to load product');
          void this.router.navigate(['/products']);
        },
      });
  }

  updateProduct(payload: ProductFormPayload): void {
    if (this.saving || 'sku' in payload) {
      return;
    }

    const productId = this.product?.productId;
    if (!Number.isFinite(productId) || !productId || productId <= 0) {
      this.notifications.error('Product ID is missing');
      return;
    }

    this.saving = true;
    this.backendFieldErrors = null;
    this.productApi
      .updateProduct(productId, payload)
      .pipe(finalize(() => (this.saving = false)))
      .subscribe({
        next: () => {
          this.notifications.success('Product updated successfully');
          void this.router.navigate(['/products']);
        },
        error: (error) => {
          this.backendFieldErrors = error instanceof HttpErrorResponse ? error.error?.fieldErrors ?? null : null;
          this.notifications.error(this.getErrorMessage(error) || 'Failed to update product');
        },
      });
  }

  goBack(): void {
    void this.router.navigate([this.product ? '/products/' + this.product.productId : '/products']);
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const backendError = error.error;
      if (backendError?.errorCode === 'DUPLICATE_SKU') {
        return 'Duplicate SKU number';
      }
      if (backendError?.errorCode === 'DUPLICATE_BARCODE') {
        return 'Duplicate barcode';
      }
      return backendError?.message ?? backendError?.error ?? '';
    }

    return '';
  }
}
