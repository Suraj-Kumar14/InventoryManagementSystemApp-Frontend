import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  ViewChild,
  computed,
  inject,
  signal
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { isManagerRole } from '../../../../core/constants/roles';
import { AuthService } from '../../../../core/services/auth.service';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { ProductSummaryCardComponent } from '../../components/product-summary-card/product-summary-card.component';
import { Product, ProductSummary } from '../../models';
import { ProductApiService } from '../../services/product-api.service';

@Component({
  selector: 'app-barcode-lookup-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, EmptyStateComponent, ProductSummaryCardComponent],
  templateUrl: './barcode-lookup-page.component.html',
  styleUrls: ['./barcode-lookup-page.component.css']
})
export class BarcodeLookupPageComponent implements AfterViewInit {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly productApi = inject(ProductApiService);

  @Input() sectionLabel = 'Products';
  @Input() backRoute = '/products';
  @Input() backLabel = 'Back to Products';

  @ViewChild('barcodeInput') barcodeInput?: ElementRef<HTMLInputElement>;

  readonly form = this.fb.group({
    barcode: ['', [Validators.required]]
  });

  readonly result = signal<Product | null>(null);
  readonly loading = signal(false);
  readonly searched = signal(false);
  readonly errorMessage = signal('');
  readonly canManageProducts = computed(() =>
    isManagerRole(this.auth.currentUser()?.role)
  );
  readonly summary = computed<ProductSummary | null>(() => {
    const product = this.result();

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

  ngAfterViewInit(): void {
    queueMicrotask(() => this.barcodeInput?.nativeElement.focus());
  }

  lookup(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const barcode = this.form.get('barcode')?.value?.trim();

    if (!barcode) {
      return;
    }

    this.loading.set(true);
    this.searched.set(false);
    this.errorMessage.set('');
    this.result.set(null);

    this.productApi.getProductByBarcode(barcode).subscribe({
      next: (product) => {
        this.result.set(product);
        this.searched.set(true);
        this.loading.set(false);
      },
      error: (error) => {
        this.loading.set(false);
        this.searched.set(true);
        this.errorMessage.set(
          error.error?.message ?? 'No product matched the barcode you entered.'
        );
      }
    });
  }

  hasBarcodeError(): boolean {
    const control = this.form.get('barcode');
    return !!control && control.invalid && (control.touched || control.dirty);
  }
}
