import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ToastService } from '../../../../core/services/toast.service';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { ProductFormComponent } from '../../components/product-form/product-form.component';
import { Product, UpdateProductRequest } from '../../models';
import { ProductApiService } from '../../services/product-api.service';

@Component({
  selector: 'app-product-edit-page',
  standalone: true,
  imports: [CommonModule, RouterLink, ProductFormComponent, EmptyStateComponent],
  templateUrl: './product-edit-page.component.html',
  styleUrls: ['./product-edit-page.component.css']
})
export class ProductEditPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly productApi = inject(ProductApiService);

  readonly product = signal<Product | null>(null);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly errorMessage = signal('');

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    if (!id) {
      this.loading.set(false);
      this.errorMessage.set('A valid product ID is required to edit this item.');
      return;
    }

    this.loadProduct(id);
  }

  updateProduct(payload: UpdateProductRequest): void {
    const currentProduct = this.product();

    if (!currentProduct) {
      return;
    }

    this.saving.set(true);

    this.productApi.updateProduct(currentProduct.productId, payload).subscribe({
      next: (product) => {
        this.toast.success('Product updated', `${product.name} has been updated successfully.`);
        this.router.navigate(['/products', product.productId]);
      },
      error: (error) => {
        this.saving.set(false);
        this.toast.error('Update failed', error.error?.message ?? 'Unable to update the product.');
      }
    });
  }

  cancel(): void {
    const currentProduct = this.product();
    this.router.navigate(currentProduct ? ['/products', currentProduct.productId] : ['/products']);
  }

  retry(): void {
    const currentId = Number(this.route.snapshot.paramMap.get('id'));

    if (currentId) {
      this.loadProduct(currentId);
    }
  }

  private loadProduct(id: number): void {
    this.loading.set(true);
    this.errorMessage.set('');

    this.productApi.getProductById(id).subscribe({
      next: (product) => {
        this.product.set(product);
        this.loading.set(false);
      },
      error: (error) => {
        this.loading.set(false);
        this.errorMessage.set(error.error?.message ?? 'Unable to load this product for editing.');
      }
    });
  }
}
