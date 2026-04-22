import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyRecord = Record<string, any>;

export interface TableColumn<T = AnyRecord> {
  key: string;
  label: string;
  width?: string;
  sortable?: boolean;
  render?: (row: T) => string;
}

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './data-table.component.html',
  styleUrls: ['./data-table.component.css']
})
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class DataTableComponent<T = any> {
  @Input() columns: TableColumn<T>[] = [];
  @Input() data: T[] = [];
  @Input() loading = false;
  @Input() totalElements = 0;
  @Input() page = 0;
  @Input() size = 20;
  @Input() rowKey = 'id';
  @Input() selectable = false;
  @Output() pageChange  = new EventEmitter<number>();
  @Output() rowClick    = new EventEmitter<T>();
  @Output() sortChange  = new EventEmitter<{ key: string; dir: 'asc' | 'desc' }>();

  sortKey = '';
  sortDir: 'asc' | 'desc' = 'asc';

  get totalPages(): number { return Math.ceil(this.totalElements / this.size); }
  get startIndex(): number { return this.page * this.size + 1; }
  get endIndex():   number { return Math.min((this.page + 1) * this.size, this.totalElements); }

  sort(col: TableColumn<T>): void {
    if (!col.sortable) return;
    if (this.sortKey === col.key) {
      this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortKey = col.key;
      this.sortDir = 'asc';
    }
    this.sortChange.emit({ key: this.sortKey, dir: this.sortDir });
  }

  getCellValue(row: T, col: TableColumn<T>): string {
    if (col.render) return col.render(row);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const val = (row as any)[col.key];
    return val != null ? String(val) : '—';
  }

  goToPage(p: number): void {
    if (p < 0 || p >= this.totalPages) return;
    this.pageChange.emit(p);
  }

  getPageNumbers(): number[] {
    const total = this.totalPages;
    const cur   = this.page;
    const range: number[] = [];
    for (let i = Math.max(0, cur - 2); i <= Math.min(total - 1, cur + 2); i++) {
      range.push(i);
    }
    return range;
  }
}
