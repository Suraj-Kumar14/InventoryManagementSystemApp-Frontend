import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LowStockProduct } from '../../../core/models';
import { ProductService } from '../../../core/services/product.service';
import { ToastService } from '../../../core/services/toast.service';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-product-low-stock',
  standalone: true,
  imports: [CommonModule, RouterLink, EmptyStateComponent],
  templateUrl: './product-low-stock.component.html',
  styleUrls: ['./product-low-stock.component.css']
})
export class ProductLowStockComponent implements OnInit {
  productSvc = inject(ProductService);
  toast = inject(ToastService);

  products = signal<LowStockProduct[]>([]);
  loading = signal(true);

  ngOnInit(): void {
    this.productSvc.getLowStock().subscribe({
      next: (products) => {
        this.products.set(products);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.toast.error('Low stock unavailable', 'Unable to load low-stock products.');
      }
    });
  }
}
