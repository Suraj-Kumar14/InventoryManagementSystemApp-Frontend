import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, ViewChild, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { isManagerRole } from '../../../core/constants/roles';
import { Product } from '../../../core/models';
import { AuthService } from '../../../core/services/auth.service';
import { ProductService } from '../../../core/services/product.service';
import { ToastService } from '../../../core/services/toast.service';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-product-scan',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, EmptyStateComponent],
  templateUrl: './product-scan.component.html',
  styleUrls: ['./product-scan.component.css']
})
export class ProductScanComponent implements AfterViewInit {
  private readonly fb = inject(FormBuilder);

  auth = inject(AuthService);
  productSvc = inject(ProductService);
  toast = inject(ToastService);

  @ViewChild('barcodeInput') barcodeInput?: ElementRef<HTMLInputElement>;

  result = signal<Product | null>(null);
  loading = signal(false);
  searched = signal(false);

  readonly isManager = computed(() => isManagerRole(this.auth.currentUser()?.role));

  readonly form = this.fb.group({
    barcode: ['', Validators.required]
  });

  ngAfterViewInit(): void {
    queueMicrotask(() => this.barcodeInput?.nativeElement.focus());
  }

  lookup(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const barcode = this.form.get('barcode')!.value?.trim();
    if (!barcode) {
      return;
    }

    this.loading.set(true);
    this.searched.set(false);
    this.result.set(null);

    this.productSvc.getByBarcode(barcode).subscribe({
      next: (product) => {
        this.result.set(product);
        this.loading.set(false);
        this.searched.set(true);
      },
      error: (error) => {
        this.loading.set(false);
        this.searched.set(true);
        this.toast.error('Lookup failed', error.error?.message ?? 'No product found for this barcode.');
      }
    });
  }
}
