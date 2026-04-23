import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Product } from '../../models';

export interface ProductTableSortChange {
  sortBy: string;
  sortDirection: 'asc' | 'desc';
}

@Component({
  selector: 'app-product-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-table.component.html',
  styleUrls: ['./product-table.component.css']
})
export class ProductTableComponent {
  @Input() products: Product[] = [];
  @Input() loading = false;
  @Input() page = 0;
  @Input() pageSize = 10;
  @Input() totalElements = 0;
  @Input() sortBy = 'updatedAt';
  @Input() sortDirection: 'asc' | 'desc' = 'desc';
  @Input() canManage = false;

  @Output() pageChange = new EventEmitter<number>();
  @Output() sortChange = new EventEmitter<ProductTableSortChange>();
  @Output() view = new EventEmitter<Product>();
  @Output() edit = new EventEmitter<Product>();
  @Output() deactivate = new EventEmitter<Product>();
  @Output() delete = new EventEmitter<Product>();

  readonly sortableColumns = [
    'sku',
    'name',
    'category',
    'brand',
    'unitOfMeasure',
    'costPrice',
    'sellingPrice',
    'isActive',
    'barcode'
  ];

  get totalPages(): number {
    return Math.max(Math.ceil(this.totalElements / Math.max(this.pageSize, 1)), 1);
  }

  get startIndex(): number {
    return this.totalElements === 0 ? 0 : this.page * this.pageSize + 1;
  }

  get endIndex(): number {
    return Math.min((this.page + 1) * this.pageSize, this.totalElements);
  }

  get pageNumbers(): number[] {
    const numbers: number[] = [];
    const start = Math.max(0, this.page - 1);
    const end = Math.min(this.totalPages - 1, this.page + 1);

    for (let index = start; index <= end; index += 1) {
      numbers.push(index);
    }

    return numbers;
  }

  isSortable(column: string): boolean {
    return this.sortableColumns.includes(column);
  }

  toggleSort(column: string): void {
    if (!this.isSortable(column)) {
      return;
    }

    const nextDirection =
      this.sortBy === column && this.sortDirection === 'asc' ? 'desc' : 'asc';

    this.sortChange.emit({ sortBy: column, sortDirection: nextDirection });
  }

  sortLabel(column: string): string {
    if (this.sortBy !== column) {
      return 'Sort';
    }

    return this.sortDirection === 'asc' ? 'Ascending' : 'Descending';
  }

  goToPage(page: number): void {
    if (page < 0 || page >= this.totalPages || page === this.page) {
      return;
    }

    this.pageChange.emit(page);
  }
}
