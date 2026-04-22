import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../../core/services/product.service';
import { Product, PagedResponse } from '../../../core/models';
import { DataTableComponent, TableColumn } from '../../../shared/components/data-table/data-table.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, DataTableComponent, EmptyStateComponent, ConfirmDialogComponent],
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.css']
})
export class ProductListComponent implements OnInit {
  productSvc = inject(ProductService);
  toast      = inject(ToastService);

  products      = signal<Product[]>([]);
  totalElements = signal(0);
  page          = signal(0);
  loading       = signal(true);
  search        = signal('');
  category      = signal('');

  deleteTarget  = signal<Product | null>(null);
  deleting      = signal(false);

  columns: TableColumn<Product>[] = [
    { key: 'sku',          label: 'SKU',          width: '120px', sortable: true },
    { key: 'name',         label: 'Product Name',                 sortable: true },
    { key: 'category',     label: 'Category',     width: '140px' },
    { key: 'brand',        label: 'Brand',        width: '120px' },
    { key: 'unitOfMeasure',label: 'UOM',          width: '80px'  },
    { key: 'costPrice',    label: 'Cost Price',   width: '110px',
      render: (r) => `₹${r['costPrice']?.toLocaleString('en-IN') ?? '—'}` },
    { key: 'reorderPoint', label: 'Reorder Pt',  width: '100px' },
    { key: 'active',       label: 'Status',       width: '90px',
      render: (r) => r['active']
        ? '<span class="badge badge-success">Active</span>'
        : '<span class="badge badge-gray">Inactive</span>' }
  ];

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.productSvc.getAll(this.page(), 20, this.search(), this.category()).subscribe({
      next: (res: PagedResponse<Product>) => {
        this.products.set(res.content);
        this.totalElements.set(res.totalElements);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  onSearch(val: string): void  { this.search.set(val); this.page.set(0); this.load(); }
  onPageChange(p: number): void { this.page.set(p); this.load(); }

  confirmDelete(p: Product): void { this.deleteTarget.set(p); }

  doDelete(): void {
    const p = this.deleteTarget();
    if (!p) return;
    this.deleting.set(true);
    this.productSvc.delete(p.id).subscribe({
      next: () => {
        this.toast.success('Product deleted');
        this.deleteTarget.set(null);
        this.deleting.set(false);
        this.load();
      },
      error: () => { this.toast.error('Delete failed'); this.deleting.set(false); }
    });
  }
}
