import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { isManagerRole } from '../../../core/constants/roles';
import { Product } from '../../../core/models';
import { AuthService } from '../../../core/services/auth.service';
import { ProductService } from '../../../core/services/product.service';
import { ToastService } from '../../../core/services/toast.service';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, EmptyStateComponent],
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.css']
})
export class ProductDetailComponent implements OnInit {
  auth = inject(AuthService);
  route = inject(ActivatedRoute);
  productSvc = inject(ProductService);
  toast = inject(ToastService);

  product = signal<Product | null>(null);
  loading = signal(true);

  readonly isManager = computed(() => isManagerRole(this.auth.currentUser()?.role));

  ngOnInit(): void {
    const productId = Number(this.route.snapshot.paramMap.get('id'));

    if (!productId) {
      this.loading.set(false);
      return;
    }

    this.productSvc.getById(productId).subscribe({
      next: (product) => {
        this.product.set(product);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.toast.error('Product not found', 'The selected product could not be loaded.');
      }
    });
  }
}
