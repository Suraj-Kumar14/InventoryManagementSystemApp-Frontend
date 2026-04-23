import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { isManagerRole } from '../../../../core/constants/roles';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../core/services/toast.service';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { ProductSummaryCardComponent } from '../../components/product-summary-card/product-summary-card.component';
import { Product, ProductSummary } from '../../models';
import { ProductApiService } from '../../services/product-api.service';

@Component({
  selector: 'app-product-detail-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ConfirmDialogComponent,
    EmptyStateComponent,
    ProductSummaryCardComponent
  ],
  templateUrl: './product-detail-page.component.html',
  styleUrls: ['./product-detail-page.component.css']
})
export class ProductDetailPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly productApi = inject(ProductApiService);

  readonly product = signal<Product | null>(null);
  readonly loading = signal(true);
  readonly errorMessage = signal('');
  readonly submittingAction = signal(false);
  readonly showDeactivateDialog = signal(false);
  readonly canManageProducts = computed(() =>
    isManagerRole(this.auth.currentUser()?.role)
  );
  readonly summary = computed<ProductSummary | null>(() => {
    const product = this.product();

    if (!product) {
      return null;
    }

    return {
      productId: product.productId,
      sku: product.sku,
      name: product.name,
      category: product.category,
      brand: product.brand,
      unitOfMeasure: product.unitOfMeasure,
      sellingPrice: product.sellingPrice,
      reorderLevel: product.reorderLevel,
      maxStockLevel: product.maxStockLevel,
      barcode: product.barcode,
      imageUrl: product.imageUrl,
      isActive: product.isActive
    };
  });

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    if (!id) {
      this.loading.set(false);
      this.errorMessage.set('A valid product ID is required to view product details.');
      return;
    }

    this.loadProduct(id);
  }

  deactivateProduct(): void {
    const product = this.product();

    if (!product) {
      return;
    }

    this.submittingAction.set(true);

    this.productApi.deactivateProduct(product.productId).subscribe({
      next: (updatedProduct) => {
        this.product.set(updatedProduct);
        this.submittingAction.set(false);
        this.showDeactivateDialog.set(false);
        this.toast.success('Product deactivated', `${updatedProduct.name} is now inactive.`);
      },
      error: (error) => {
        this.submittingAction.set(false);
        this.toast.error('Deactivate failed', error.error?.message ?? 'Unable to deactivate the product.');
      }
    });
  }

  retry(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));

    if (id) {
      this.loadProduct(id);
    }
  }

  goBack(): void {
    this.router.navigate(['/products']);
  }

  openDeactivateDialog(): void {
    this.showDeactivateDialog.set(true);
  }

  closeDeactivateDialog(): void {
    this.showDeactivateDialog.set(false);
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
        this.errorMessage.set(error.error?.message ?? 'Unable to load product details.');
      }
    });
  }
}
