import { CommonModule } from '@angular/common';
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

  ngOnInit(): void {
    this.loading = true;
    const productId = Number(this.route.snapshot.paramMap.get('id'));
    this.productApi
      .getProductById(productId)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (product) => {
          this.product = product;
        },
      });
  }

  updateProduct(payload: ProductFormPayload): void {
    if (!this.product) {
      return;
    }
    if ('sku' in payload) {
      return;
    }

    this.saving = true;
    this.productApi
      .updateProduct(this.product.productId, payload)
      .pipe(finalize(() => (this.saving = false)))
      .subscribe({
        next: (product) => {
          this.notifications.success('Product updated successfully');
          this.router.navigate(['/products', product.productId]);
        },
      });
  }

  goBack(): void {
    if (this.product) {
      this.router.navigate(['/products', this.product.productId]);
      return;
    }
    this.router.navigate(['/products']);
  }
}
