import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { StockService } from '../../../core/services/stock.service';
import { WarehouseService } from '../../../core/services/warehouse.service';
import { StockLevel, Warehouse, PagedResponse } from '../../../core/models';
import { DataTableComponent, TableColumn } from '../../../shared/components/data-table/data-table.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-stock-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, DataTableComponent, EmptyStateComponent],
  templateUrl: './stock-list.component.html',
  styleUrls: ['./stock-list.component.css']
})
export class StockListComponent implements OnInit {
  stockSvc = inject(StockService);
  whSvc    = inject(WarehouseService);

  stocks        = signal<StockLevel[]>([]);
  warehouses    = signal<Warehouse[]>([]);
  totalElements = signal(0);
  page          = signal(0);
  loading       = signal(true);
  warehouseFilter = signal<number | undefined>(undefined);

  columns: TableColumn<StockLevel>[] = [
    { key: 'sku',               label: 'SKU',          width: '110px' },
    { key: 'productName',       label: 'Product',                     sortable: true },
    { key: 'warehouseName',     label: 'Warehouse',    width: '150px' },
    { key: 'quantity',          label: 'Qty On Hand',  width: '110px', sortable: true },
    { key: 'reservedQuantity',  label: 'Reserved',     width: '90px'  },
    { key: 'availableQuantity', label: 'Available',    width: '90px',
      render: r => {
        const avail = r['availableQuantity'] as number;
        const reorder = r['reorderPoint'] as number;
        const cls = avail <= reorder ? 'badge-danger' : 'badge-success';
        return `<span class="badge ${cls}">${avail}</span>`;
      }
    },
    { key: 'stockValue', label: 'Stock Value', width: '120px',
      render: r => `₹${(r['stockValue'] as number)?.toLocaleString('en-IN') ?? '—'}` }
  ];

  ngOnInit(): void {
    this.loadWarehouses();
    this.loadStock();
  }

  loadWarehouses(): void {
    this.whSvc.getActive().subscribe({ next: list => this.warehouses.set(list), error: () => {} });
  }

  loadStock(): void {
    this.loading.set(true);
    this.stockSvc.getAll(this.page(), 20, this.warehouseFilter()).subscribe({
      next: (res: PagedResponse<StockLevel>) => {
        this.stocks.set(res.content);
        this.totalElements.set(res.totalElements);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  onWarehouseChange(id: string): void {
    this.warehouseFilter.set(id ? +id : undefined);
    this.page.set(0);
    this.loadStock();
  }

  onPageChange(p: number): void { this.page.set(p); this.loadStock(); }
}
