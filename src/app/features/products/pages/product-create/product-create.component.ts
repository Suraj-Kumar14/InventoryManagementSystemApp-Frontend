import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { NotificationService } from '../../../../core/services/notification.service';
import { ProductFormComponent, ProductFormPayload } from '../../components/product-form/product-form.component';
import { ProductApiService } from '../../services/product-api.service';

@Component({
  selector: 'app-product-create',
  standalone: true,
  imports: [CommonModule, ProductFormComponent],
  templateUrl: './product-create.component.html',
  styleUrls: ['./product-create.component.css'],
})
export class ProductCreateComponent {
  private readonly productApi = inject(ProductApiService);
  private readonly notifications = inject(NotificationService);
  private readonly router = inject(Router);

  saving = false;
  backendFieldErrors: Record<string, string> | null = null;

  createProduct(payload: ProductFormPayload): void {
    if (!('sku' in payload)) {
      return;
    }

    this.saving = true;
    this.backendFieldErrors = null;
    this.productApi
      .createProduct(payload)
      .pipe(finalize(() => (this.saving = false)))
      .subscribe({
        next: (product) => {
          this.notifications.success('Product created successfully');
          void this.router.navigate(['/products', product.productId]);
        },
        error: (error) => {
          this.backendFieldErrors = error instanceof HttpErrorResponse ? error.error?.fieldErrors ?? null : null;
          this.notifications.error(error instanceof HttpErrorResponse ? (error.error?.message ?? 'Failed to create product') : 'Failed to create product');
        },
      });
  }

  goBack(): void {
    void this.router.navigate(['/products']);
  }
}
