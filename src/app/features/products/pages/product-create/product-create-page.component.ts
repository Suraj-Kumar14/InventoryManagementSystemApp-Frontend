import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ToastService } from '../../../../core/services/toast.service';
import { ProductFormComponent } from '../../components/product-form/product-form.component';
import { CreateProductRequest, Product } from '../../models';
import { ProductApiService } from '../../services/product-api.service';

@Component({
  selector: 'app-product-create-page',
  standalone: true,
  imports: [CommonModule, RouterLink, ProductFormComponent],
  templateUrl: './product-create-page.component.html',
  styleUrls: ['./product-create-page.component.css']
})
export class ProductCreatePageComponent {
  private readonly productApi = inject(ProductApiService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly saving = signal(false);

  createProduct(payload: CreateProductRequest): void {
    this.saving.set(true);

    this.productApi.createProduct(payload).subscribe({
      next: (product: Product) => {
        this.toast.success('Product created', `${product.name} is now available in the catalogue.`);
        this.router.navigate(['/products', product.productId]);
      },
      error: (error) => {
        this.saving.set(false);
        this.toast.error('Create failed', error.error?.message ?? 'Unable to create the product.');
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/products']);
  }
}
