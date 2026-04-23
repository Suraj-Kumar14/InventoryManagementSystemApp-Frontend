import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { ProductSummaryCardComponent } from '../../components/product-summary-card/product-summary-card.component';
import { LowStockProduct, ProductSummary } from '../../models';
import { ProductApiService } from '../../services/product-api.service';

@Component({
  selector: 'app-low-stock-products-page',
  standalone: true,
  imports: [CommonModule, RouterLink, EmptyStateComponent, ProductSummaryCardComponent],
  templateUrl: './low-stock-products-page.component.html',
  styleUrls: ['./low-stock-products-page.component.css']
})
export class LowStockProductsPageComponent implements OnInit {
  private readonly productApi = inject(ProductApiService);

  readonly products = signal<LowStockProduct[]>([]);
  readonly loading = signal(true);
  readonly errorMessage = signal('');
  readonly summaries = computed<ProductSummary[]>(() =>
    this.products().map((product) => ({
      productId: product.productId,
      sku: product.sku,
      name: product.name,
      category: product.category,
      brand: product.brand,
      unitOfMeasure: product.unitOfMeasure,
      sellingPrice: null,
      reorderLevel: product.reorderLevel,
      maxStockLevel: product.maxStockLevel,
      barcode: product.barcode,
      imageUrl: null,
      isActive: product.isActive,
      currentQuantity: product.currentQuantity
    }))
  );
  readonly inactiveCount = computed(() =>
    this.products().filter((product) => !product.isActive).length
  );
  readonly barcodeCoverage = computed(() =>
    this.products().filter((product) => !!product.barcode).length
  );

  ngOnInit(): void {
    this.loadProducts();
  }

  retry(): void {
    this.loadProducts();
  }

  private loadProducts(): void {
    this.loading.set(true);
    this.errorMessage.set('');

    this.productApi.getLowStockProducts().subscribe({
      next: (products) => {
        const sortedProducts = [...products].sort(
          (left, right) => left.currentQuantity - right.currentQuantity
        );
        this.products.set(sortedProducts);
        this.loading.set(false);
      },
      error: (error) => {
        this.loading.set(false);
        this.errorMessage.set(
          error.error?.message ?? 'Unable to load low stock products right now.'
        );
      }
    });
  }
}
