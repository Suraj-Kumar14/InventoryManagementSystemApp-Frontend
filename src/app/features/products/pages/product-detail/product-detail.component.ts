import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { Product } from '../../../../core/http/backend.models';
import { NotificationService } from '../../../../core/services/notification.service';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { UserRole } from '../../../../shared/config/app-config';
import { ProductCardComponent } from '../../components/product-card/product-card.component';
import { ProductApiService } from '../../services/product-api.service';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, LoadingSpinnerComponent, ProductCardComponent],
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.css'],
})
export class ProductDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly productApi = inject(ProductApiService);
  private readonly notifications = inject(NotificationService);
  private readonly authService = inject(AuthService);

  readonly canManage = this.authService.hasRole([UserRole.ADMIN, UserRole.MANAGER]);
  readonly canDelete = this.authService.hasRole(UserRole.ADMIN);

  product: Product | null = null;
  loading = false;
  actionLoading = false;

  ngOnInit(): void {
    this.fetchProduct();
  }

  toggleStatus(): void {
    if (!this.product || !this.canManage) {
      return;
    }

    this.actionLoading = true;
    const request = this.product.isActive
      ? this.productApi.deactivateProduct(this.product.productId)
      : this.productApi.activateProduct(this.product.productId);

    request.pipe(finalize(() => (this.actionLoading = false))).subscribe({
      next: (product) => {
        this.product = product;
        this.notifications.success(product.isActive ? 'Product activated successfully' : 'Product deactivated successfully');
      },
    });
  }

  deleteProduct(): void {
    if (!this.product || !this.canDelete) {
      return;
    }

    this.actionLoading = true;
    this.productApi
      .deleteProduct(this.product.productId)
      .pipe(finalize(() => (this.actionLoading = false)))
      .subscribe({
        next: () => {
          this.notifications.success('Product deleted successfully');
          this.router.navigate(['/products']);
        },
      });
  }

  private fetchProduct(): void {
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
}
