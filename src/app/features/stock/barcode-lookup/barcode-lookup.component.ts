import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../../core/services/product.service';
import { Product } from '../../../core/models';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-barcode-lookup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-header">
      <div><h1 class="page-title">Barcode Lookup</h1><p class="page-subtitle">Find a product by scanning or entering its barcode</p></div>
    </div>
    <div class="card" style="max-width:560px">
      <div class="barcode-input-row">
        <div style="position:relative;flex:1">
          <span style="position:absolute;left:.875rem;top:50%;transform:translateY(-50%);font-size:1.25rem">🔍</span>
          <input type="text" class="form-control" style="padding-left:2.75rem;font-size:1.125rem"
                 [(ngModel)]="query" (keyup.enter)="lookup()"
                 placeholder="Scan or enter barcode / SKU..." autofocus />
        </div>
        <button class="btn btn-primary" (click)="lookup()" [disabled]="loading()">
          @if (loading()) { <span class="spinner"></span> } @else { Search }
        </button>
      </div>

      @if (searched() && !result() && !loading()) {
        <div class="empty-state" style="padding:2rem">
          <div class="empty-state-icon">📭</div>
          <div class="empty-state-title">No product found</div>
          <div class="empty-state-desc">No product matched "{{ lastQuery() }}"</div>
        </div>
      }

      @if (result()) {
        <div class="result-card">
          <div class="result-header">
            <div class="result-icon">📦</div>
            <div>
              <div class="result-name">{{ result()!.name }}</div>
              <div class="text-xs text-muted">SKU: {{ result()!.sku }}</div>
            </div>
            <span class="badge" [class]="result()!.active ? 'badge-success' : 'badge-gray'">
              {{ result()!.active ? 'Active' : 'Inactive' }}
            </span>
          </div>
          <div class="result-details">
            <div class="detail-item"><span class="detail-key">Category</span><span>{{ result()!.category }}</span></div>
            <div class="detail-item"><span class="detail-key">Brand</span><span>{{ result()!.brand || '—' }}</span></div>
            <div class="detail-item"><span class="detail-key">UOM</span><span>{{ result()!.unitOfMeasure }}</span></div>
            <div class="detail-item"><span class="detail-key">Cost Price</span><span>₹{{ result()!.costPrice | number }}</span></div>
            <div class="detail-item"><span class="detail-key">Selling Price</span><span>₹{{ result()!.sellingPrice | number }}</span></div>
            <div class="detail-item"><span class="detail-key">Reorder Point</span><span>{{ result()!.reorderPoint }}</span></div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .barcode-input-row { display:flex; gap:.75rem; margin-bottom:1.25rem; }
    .result-card { border:1.5px solid var(--color-primary);border-radius:var(--radius-lg);padding:1.25rem;background:var(--color-primary-light);margin-top:.5rem; }
    .result-header { display:flex;align-items:center;gap:.875rem;margin-bottom:1rem; }
    .result-icon { font-size:2rem; }
    .result-name { font-size:1.125rem;font-weight:700; }
    .result-details { display:flex;flex-direction:column;gap:.5rem; }
    .detail-item { display:flex;justify-content:space-between;padding:.375rem .625rem;background:#fff;border-radius:var(--radius-sm);font-size:.875rem; }
    .detail-key { color:var(--text-muted);font-weight:500; }
  `]
})
export class BarcodeLookupComponent {
  productSvc = inject(ProductService);
  toast      = inject(ToastService);

  query     = '';
  loading   = signal(false);
  searched  = signal(false);
  lastQuery = signal('');
  result    = signal<Product | null>(null);

  lookup(): void {
    const q = this.query.trim();
    if (!q) return;
    this.loading.set(true);
    this.searched.set(false);
    this.result.set(null);
    this.lastQuery.set(q);

    // Try barcode first, then SKU
    this.productSvc.getByBarcode(q).subscribe({
      next: p => { this.result.set(p); this.loading.set(false); this.searched.set(true); },
      error: () => {
        this.productSvc.getBySku(q).subscribe({
          next: p => { this.result.set(p); this.loading.set(false); this.searched.set(true); },
          error: () => { this.loading.set(false); this.searched.set(true); }
        });
      }
    });
  }
}
