import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { Product } from '../../../../core/http/backend.models';
import { LoadingSpinnerComponent } from '../../../../shared/components/loading-spinner/loading-spinner.component';
import { ProductCardComponent } from '../../components/product-card/product-card.component';
import { ProductApiService } from '../../services/product-api.service';

@Component({
  selector: 'app-product-barcode-lookup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LoadingSpinnerComponent, ProductCardComponent],
  templateUrl: './product-barcode-lookup.component.html',
  styleUrls: ['./product-barcode-lookup.component.css'],
})
export class ProductBarcodeLookupComponent {
  private readonly fb = inject(FormBuilder);
  private readonly productApi = inject(ProductApiService);

  readonly form = this.fb.nonNullable.group({
    barcode: ['', Validators.required],
  });

  loading = false;
  searched = false;
  product: Product | null = null;

  lookup(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.searched = true;
    this.productApi
      .getProductByBarcode(this.form.controls.barcode.value.trim())
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (product) => {
          this.product = product;
        },
        error: () => {
          this.product = null;
        },
      });
  }
}
