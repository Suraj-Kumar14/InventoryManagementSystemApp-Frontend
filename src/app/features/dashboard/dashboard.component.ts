import { CommonModule } from "@angular/common";
import { Component, OnInit, computed, inject, signal } from "@angular/core";
import { RouterLink } from "@angular/router";
import { isManagerRole } from "../../core/constants/roles";
import { LowStockProduct, Product } from "../../core/models";
import { AuthService } from "../../core/services/auth.service";
import { ProductService } from "../../core/services/product.service";

@Component({
  selector: "app-dashboard",
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: "./dashboard.component.html",
  styleUrls: ["./dashboard.component.css"],
})
export class DashboardComponent implements OnInit {
  auth = inject(AuthService);
  productSvc = inject(ProductService);

  products = signal<Product[]>([]);
  productsLoading = signal(false);
  productsError = signal(false);

  lowStockItems = signal<LowStockProduct[]>([]);
  lowStockLoading = signal(false);
  lowStockError = signal(false);

  readonly canManageProducts = computed(() =>
    isManagerRole(this.auth.currentUser()?.role),
  );

  readonly displayName = computed(() => {
    const user = this.auth.currentUser();
    return (
      user?.fullName?.trim() ||
      user?.firstName?.trim() ||
      user?.email?.split("@")[0] ||
      "User"
    );
  });

  readonly roleLabel = computed(() => {
    const role = this.auth.currentUser()?.role ?? "USER";
    return role.replace(/_/g, " ");
  });

  readonly totalProducts = computed(() => this.products().length);

  readonly activeProducts = computed(
    () => this.products().filter((item) => item.isActive).length,
  );

  readonly inactiveProducts = computed(
    () => this.products().filter((item) => !item.isActive).length,
  );

  readonly barcodeReadyProducts = computed(
    () => this.products().filter((item) => !!item.barcode).length,
  );

  readonly lowStockCount = computed(() => this.lowStockItems().length);

  readonly categoriesCount = computed(
    () =>
      new Set(
        this.products()
          .map((item) => item.category)
          .filter(Boolean),
      ).size,
  );

  trackByProductId = (_index: number, item: LowStockProduct): number =>
    item.productId;

  readonly lowStockPreview = computed(() => this.lowStockItems().slice(0, 5));

  ngOnInit(): void {
    this.refreshDashboard();
  }

  refreshDashboard(): void {
    this.loadProducts();
    this.loadLowStock();
  }

  loadProducts(): void {
    this.productsLoading.set(true);
    this.productsError.set(false);

    this.productSvc.getAllProducts().subscribe({
      next: (items) => {
        this.products.set(items);
        this.productsLoading.set(false);
      },
      error: () => {
        this.products.set([]);
        this.productsError.set(true);
        this.productsLoading.set(false);
      },
    });
  }

  loadLowStock(): void {
    this.lowStockLoading.set(true);
    this.lowStockError.set(false);

    this.productSvc.getLowStock().subscribe({
      next: (items) => {
        this.lowStockItems.set(items);
        this.lowStockLoading.set(false);
      },
      error: () => {
        this.lowStockItems.set([]);
        this.lowStockError.set(true);
        this.lowStockLoading.set(false);
      },
    });
  }

  formatNumber(value: number | undefined): string {
    if (value == null) return "--";
    return new Intl.NumberFormat("en-IN").format(value);
  }
}
